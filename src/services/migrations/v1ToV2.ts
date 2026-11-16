import { TARGET_MIGRATION_SCHEMA_VERSION } from '../../config';
import type {
  AuditEntry,
  BookmarkRecord,
  CommonsStoreState,
  FollowRecord,
  LibraryDoc,
  LikeRecord,
  MuteRecord,
  Notification,
  Post,
  RecordOrigin,
  Report,
  RepostRecord,
  Topic,
  TopicFollowRecord,
  User,
} from '../../data/types';

export interface LegacySeedManifest {
  schemaVersion: number;
  userIds: string[];
  userHandles: string[];
  postIds: string[];
  postContentSignatures: string[];
  libraryDocIds: string[];
  libraryTitles: string[];
  topicSlugs: string[];
  notificationIds: string[];
  reportIds: string[];
  auditIds: string[];
  followKeys: string[];
  topicFollowKeys: string[];
  likeKeys: string[];
  repostKeys: string[];
  bookmarkKeys: string[];
  muteKeys: string[];
}

export interface MigrationContext {
  legacyManifest?: LegacySeedManifest;
  targetSeedState: CommonsStoreState;
  targetSchemaVersion?: number;
  topicMap?: Record<string, string>;
  archiveRemovedSeedTopics?: boolean;
  migrationTimestamp?: string;
}

export interface EntityCountBreakdown {
  users: number;
  posts: number;
  library: number;
  topics: number;
  notifications: number;
  reports: number;
  auditLog: number;
}

export interface MigrationReport {
  sourceSchemaVersion: number;
  targetSchemaVersion: number;
  alreadyAtTargetVersion: boolean;
  seedEntitiesRemoved: EntityCountBreakdown;
  seedEntitiesInserted: EntityCountBreakdown;
  seedAccountsUpdated: number;
  userRecordsPreserved: EntityCountBreakdown;
  relationshipsPreserved: {
    likes: number;
    reposts: number;
    bookmarks: number;
    follows: number;
    topicFollows: number;
    mutes: number;
  };
  invalidReferencesHandled: number;
  tombstonesCreated: number;
  ambiguousRecordsPreserved: number;
  warnings: string[];
  errors: string[];
}

export interface MigrationResult {
  state: CommonsStoreState;
  report: MigrationReport;
}

function emptyCounts(): EntityCountBreakdown {
  return {
    users: 0,
    posts: 0,
    library: 0,
    topics: 0,
    notifications: 0,
    reports: 0,
    auditLog: 0,
  };
}

function clonePlain<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => clonePlain(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = clonePlain(v);
      }
    }
    return out as T;
  }
  return value;
}

export function postContentSignature(post: Pick<Post, 'authorId' | 'body' | 'kind'>): string {
  const normalized = post.body.trim().replace(/\s+/g, ' ');
  return `${post.authorId}::${post.kind}::${normalized}`;
}

export function followKey(f: Pick<FollowRecord, 'followerId' | 'followingId'>): string {
  return `${f.followerId}->${f.followingId}`;
}

export function topicFollowKey(tf: Pick<TopicFollowRecord, 'userId' | 'topicSlug'>): string {
  return `${tf.userId}->${tf.topicSlug}`;
}

export function likeKey(l: Pick<LikeRecord, 'userId' | 'postId'>): string {
  return `${l.userId}->${l.postId}`;
}

export function repostKey(r: Pick<RepostRecord, 'userId' | 'postId'>): string {
  return `${r.userId}->${r.postId}`;
}

export function bookmarkKey(b: Pick<BookmarkRecord, 'userId' | 'targetType' | 'targetId'>): string {
  return `${b.userId}->${b.targetType}:${b.targetId}`;
}

export function muteKey(m: Pick<MuteRecord, 'userId' | 'targetType' | 'targetValue'>): string {
  return `${m.userId}->${m.targetType}:${m.targetValue}`;
}

/**
 * Pure helper to derive a frozen seed manifest from a pristine v1 seed state or fixture.
 */
export function buildSeedManifest(seedState: CommonsStoreState): LegacySeedManifest {
  return {
    schemaVersion: seedState.schemaVersion,
    userIds: seedState.users.map((u) => u.id),
    userHandles: seedState.users.map((u) => u.handle.toLowerCase()),
    postIds: seedState.posts.map((p) => p.id),
    postContentSignatures: seedState.posts
      .filter((p) => p.body.trim().length > 0)
      .map((p) => postContentSignature(p)),
    libraryDocIds: seedState.library.map((d) => d.id),
    libraryTitles: seedState.library.map((d) => d.title.trim()),
    topicSlugs: seedState.topics.map((t) => t.slug),
    notificationIds: seedState.notifications.map((n) => n.id),
    reportIds: seedState.reports.map((r) => r.id),
    auditIds: seedState.auditLog.map((a) => a.id),
    followKeys: seedState.follows.map(followKey),
    topicFollowKeys: seedState.topicFollows.map(topicFollowKey),
    likeKeys: seedState.likes.map(likeKey),
    repostKeys: seedState.reposts.map(repostKey),
    bookmarkKeys: seedState.bookmarks.map(bookmarkKey),
    muteKeys: seedState.mutes.map(muteKey),
  };
}

type ProvenanceClassification =
  | 'user_or_system'
  | 'target_seed'
  | 'legacy_seed'
  | 'ambiguous_preserve';

function classifyWithId(params: {
  origin?: RecordOrigin;
  seedVersion?: number;
  id: string;
  targetVersion: number;
  manifestIds: Set<string>;
  targetSeedIds: Set<string>;
  secondaryContentMatch?: boolean;
  hasManifest: boolean;
}): ProvenanceClassification {
  const {
    origin,
    seedVersion,
    id,
    targetVersion,
    manifestIds,
    targetSeedIds,
    secondaryContentMatch = false,
    hasManifest,
  } = params;

  // 1. Explicit origin markers
  if (origin === 'user' || origin === 'system') {
    return 'user_or_system';
  }
  if (origin === 'seed') {
    if ((seedVersion ?? 1) >= targetVersion) {
      return 'target_seed';
    }
    if (!hasManifest || manifestIds.has(id) || targetSeedIds.has(id)) {
      return 'legacy_seed';
    }
    // Marked seed, but unknown to both manifest and target seed -> preserve conservatively
    return 'ambiguous_preserve';
  }

  // 2 & 3. Frozen v1 seed manifest + exact known legacy IDs
  if (manifestIds.has(id)) {
    return 'legacy_seed';
  }

  // 4. Exact content signature as secondary evidence
  if (secondaryContentMatch) {
    return 'legacy_seed';
  }

  // If no manifest was supplied and origin is missing, provenance is genuinely ambiguous
  if (!hasManifest) {
    return 'ambiguous_preserve';
  }

  // Ambiguous if seedVersion was attached without origin
  if (seedVersion !== undefined) {
    return 'ambiguous_preserve';
  }

  // Not in frozen manifest and no conflicting seed metadata -> treat as v1 user record
  return 'user_or_system';
}

function classifyRelationship(params: {
  origin?: RecordOrigin;
  seedVersion?: number;
  key: string;
  targetVersion: number;
  manifestKeys: Set<string>;
  targetKeys: Set<string>;
  hasManifest: boolean;
}): ProvenanceClassification {
  const { origin, seedVersion, key, targetVersion, manifestKeys, targetKeys, hasManifest } = params;

  // 1. Explicit origin markers
  if (origin === 'user' || origin === 'system') {
    return 'user_or_system';
  }
  if (origin === 'seed') {
    if ((seedVersion ?? 1) >= targetVersion) {
      return 'target_seed';
    }
    if (!hasManifest || manifestKeys.has(key) || targetKeys.has(key)) {
      return 'legacy_seed';
    }
    return 'ambiguous_preserve';
  }

  // 2. Frozen v1 manifest composite key (NEVER classify relationships by ID prefix)
  if (manifestKeys.has(key)) {
    return 'legacy_seed';
  }

  // If no manifest supplied or seedVersion present without origin -> ambiguous
  if (!hasManifest || seedVersion !== undefined) {
    return 'ambiguous_preserve';
  }

  return 'user_or_system';
}

export function migrateV1toV2(
  inputState: CommonsStoreState,
  context: MigrationContext,
): MigrationResult {
  const state = clonePlain(inputState);
  const targetSeed = clonePlain(context.targetSeedState);
  const targetVersion = context.targetSchemaVersion ?? TARGET_MIGRATION_SCHEMA_VERSION;
  const topicMap = context.topicMap ?? {};
  const archiveRemovedSeedTopics = context.archiveRemovedSeedTopics ?? true;
  const fallbackTimestamp = context.migrationTimestamp ?? '2026-11-16T00:00:00.000Z';

  const manifest = context.legacyManifest;
  const hasManifest = Boolean(manifest);

  const report: MigrationReport = {
    sourceSchemaVersion: state.schemaVersion,
    targetSchemaVersion: targetVersion,
    alreadyAtTargetVersion: state.schemaVersion >= targetVersion,
    seedEntitiesRemoved: emptyCounts(),
    seedEntitiesInserted: emptyCounts(),
    seedAccountsUpdated: 0,
    userRecordsPreserved: emptyCounts(),
    relationshipsPreserved: {
      likes: 0,
      reposts: 0,
      bookmarks: 0,
      follows: 0,
      topicFollows: 0,
      mutes: 0,
    },
    invalidReferencesHandled: 0,
    tombstonesCreated: 0,
    ambiguousRecordsPreserved: 0,
    warnings: [],
    errors: [],
  };

  const manifestUserIds = new Set(manifest?.userIds ?? []);
  const manifestPostIds = new Set(manifest?.postIds ?? []);
  const manifestPostSigs = new Set(manifest?.postContentSignatures ?? []);
  const manifestLibIds = new Set(manifest?.libraryDocIds ?? []);
  const manifestLibTitles = new Set((manifest?.libraryTitles ?? []).map((t) => t.trim()));
  const manifestTopicSlugs = new Set(manifest?.topicSlugs ?? []);
  const manifestNotifIds = new Set(manifest?.notificationIds ?? []);
  const manifestReportIds = new Set(manifest?.reportIds ?? []);
  const manifestAuditIds = new Set(manifest?.auditIds ?? []);

  const manifestFollowKeys = new Set(manifest?.followKeys ?? []);
  const manifestTopicFollowKeys = new Set(manifest?.topicFollowKeys ?? []);
  const manifestLikeKeys = new Set(manifest?.likeKeys ?? []);
  const manifestRepostKeys = new Set(manifest?.repostKeys ?? []);
  const manifestBookmarkKeys = new Set(manifest?.bookmarkKeys ?? []);
  const manifestMuteKeys = new Set(manifest?.muteKeys ?? []);

  const targetUserMap = new Map(targetSeed.users.map((u) => [u.id, u]));
  const targetTopicMap = new Map(targetSeed.topics.map((t) => [t.slug, t]));
  const targetLibraryMap = new Map(targetSeed.library.map((d) => [d.id, d]));
  const targetPostMap = new Map(targetSeed.posts.map((p) => [p.id, p]));
  const targetNotifMap = new Map(targetSeed.notifications.map((n) => [n.id, n]));
  const targetReportMap = new Map(targetSeed.reports.map((r) => [r.id, r]));
  const targetAuditMap = new Map(targetSeed.auditLog.map((a) => [a.id, a]));

  const targetUserIds = new Set(targetSeed.users.map((u) => u.id));
  const targetTopicSlugs = new Set(targetSeed.topics.map((t) => t.slug));
  const targetLibraryIds = new Set(targetSeed.library.map((d) => d.id));
  const targetPostIds = new Set(targetSeed.posts.map((p) => p.id));
  const targetNotifIds = new Set(targetSeed.notifications.map((n) => n.id));
  const targetReportIds = new Set(targetSeed.reports.map((r) => r.id));
  const targetAuditIds = new Set(targetSeed.auditLog.map((a) => a.id));

  const targetFollowKeys = new Set(targetSeed.follows.map(followKey));
  const targetTopicFollowKeys = new Set(targetSeed.topicFollows.map(topicFollowKey));
  const targetLikeKeys = new Set(targetSeed.likes.map(likeKey));
  const targetRepostKeys = new Set(targetSeed.reposts.map(repostKey));
  const targetBookmarkKeys = new Set(targetSeed.bookmarks.map(bookmarkKey));
  const targetMuteKeys = new Set(targetSeed.mutes.map(muteKey));

  // -------------------------------------------------------------------------
  // 1. USERS
  // -------------------------------------------------------------------------
  const nextUsers: User[] = [];
  const seenUserIds = new Set<string>();
  const seenUserHandles = new Set<string>();

  for (const user of state.users) {
    const cls = classifyWithId({
      origin: user.origin,
      seedVersion: user.seedVersion,
      id: user.id,
      targetVersion,
      manifestIds: manifestUserIds,
      targetSeedIds: targetUserIds,
      hasManifest,
    });

    if (cls === 'legacy_seed' || cls === 'target_seed') {
      const targetUser = targetUserMap.get(user.id);
      if (targetUser) {
        // Preserve identity & credentials strictly; update seed-owned profile content in place
        const nextPinned = targetUser.pinnedPostId ?? user.pinnedPostId;
        const updated: User = {
          ...user,
          bio: targetUser.bio,
          location: targetUser.location,
          link: targetUser.link,
          interestTopics: [...targetUser.interestTopics],
          verified: targetUser.verified,
          ...(nextPinned ? { pinnedPostId: nextPinned } : {}),
          baseFollowersCount: targetUser.baseFollowersCount,
          baseFollowingCount: targetUser.baseFollowingCount,
          origin: 'seed',
          seedVersion: targetVersion,
        };
        const changed =
          user.bio !== updated.bio ||
          user.location !== updated.location ||
          user.link !== updated.link ||
          user.verified !== updated.verified ||
          user.seedVersion !== targetVersion ||
          JSON.stringify(user.interestTopics) !== JSON.stringify(updated.interestTopics);

        if (changed && cls === 'legacy_seed') {
          report.seedAccountsUpdated += 1;
        }
        nextUsers.push(updated);
      } else {
        // Recognized old seed account not in v2 seed: keep conservatively so nothing breaks
        nextUsers.push({
          ...user,
          origin: 'seed',
          seedVersion: targetVersion,
        });
        report.warnings.push(`Preserved legacy seed account @${user.handle} not present in target v2 seed.`);
      }
      seenUserIds.add(user.id);
      seenUserHandles.add(user.handle.toLowerCase());
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved account @${user.handle} with ambiguous provenance.`);
    }
    report.userRecordsPreserved.users += 1;
    nextUsers.push(user);
    seenUserIds.add(user.id);
    seenUserHandles.add(user.handle.toLowerCase());
  }

  for (const targetUser of targetSeed.users) {
    if (!seenUserIds.has(targetUser.id) && !seenUserHandles.has(targetUser.handle.toLowerCase())) {
      nextUsers.push({
        ...targetUser,
        origin: 'seed',
        seedVersion: targetVersion,
      });
      seenUserIds.add(targetUser.id);
      seenUserHandles.add(targetUser.handle.toLowerCase());
      report.seedEntitiesInserted.users += 1;
    }
  }

  const finalUserIds = new Set(nextUsers.map((u) => u.id));

  // -------------------------------------------------------------------------
  // 2. TOPICS
  // -------------------------------------------------------------------------
  const nextTopics: Topic[] = [];
  const seenTopicSlugs = new Set<string>();

  for (const topic of state.topics) {
    const cls = classifyWithId({
      origin: topic.origin,
      seedVersion: topic.seedVersion,
      id: topic.slug,
      targetVersion,
      manifestIds: manifestTopicSlugs,
      targetSeedIds: targetTopicSlugs,
      hasManifest,
    });

    if (cls === 'target_seed') {
      nextTopics.push(topic);
      seenTopicSlugs.add(topic.slug);
      continue;
    }

    if (cls === 'legacy_seed') {
      const targetTopic = targetTopicMap.get(topic.slug);
      if (targetTopic) {
        nextTopics.push({
          ...targetTopic,
          origin: 'seed',
          seedVersion: targetVersion,
        });
        seenTopicSlugs.add(topic.slug);
      } else if (archiveRemovedSeedTopics) {
        const nextMerged = topicMap[topic.slug] ?? topic.mergedInto;
        nextTopics.push({
          ...topic,
          featured: false,
          archived: true,
          ...(nextMerged ? { mergedInto: nextMerged } : {}),
          origin: 'seed',
          seedVersion: targetVersion,
        });
        seenTopicSlugs.add(topic.slug);
        report.seedEntitiesRemoved.topics += 1;
      } else {
        report.seedEntitiesRemoved.topics += 1;
      }
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved topic "${topic.slug}" with ambiguous provenance.`);
    }
    report.userRecordsPreserved.topics += 1;
    nextTopics.push(topic);
    seenTopicSlugs.add(topic.slug);
  }

  for (const targetTopic of targetSeed.topics) {
    if (!seenTopicSlugs.has(targetTopic.slug)) {
      nextTopics.push({
        ...targetTopic,
        origin: 'seed',
        seedVersion: targetVersion,
      });
      seenTopicSlugs.add(targetTopic.slug);
      report.seedEntitiesInserted.topics += 1;
    }
  }

  const finalTopicSlugs = new Set(nextTopics.map((t) => t.slug));

  // -------------------------------------------------------------------------
  // 3. LIBRARY DOCUMENTS
  // -------------------------------------------------------------------------
  const nextLibrary: LibraryDoc[] = [];
  const seenLibraryIds = new Set<string>();

  for (const doc of state.library) {
    const titleMatch =
      doc.origin !== 'user' &&
      doc.origin !== 'system' &&
      manifestLibTitles.has(doc.title.trim());

    const cls = classifyWithId({
      origin: doc.origin,
      seedVersion: doc.seedVersion,
      id: doc.id,
      targetVersion,
      manifestIds: manifestLibIds,
      targetSeedIds: targetLibraryIds,
      secondaryContentMatch: titleMatch,
      hasManifest,
    });

    if (cls === 'target_seed') {
      nextLibrary.push(doc);
      seenLibraryIds.add(doc.id);
      continue;
    }

    if (cls === 'legacy_seed') {
      const replacement = targetLibraryMap.get(doc.id);
      if (replacement) {
        nextLibrary.push({
          ...replacement,
          origin: 'seed',
          seedVersion: targetVersion,
        });
        seenLibraryIds.add(doc.id);
      } else {
        report.seedEntitiesRemoved.library += 1;
      }
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved Library document "${doc.title}" (${doc.id}) with ambiguous provenance.`);
    }
    report.userRecordsPreserved.library += 1;
    nextLibrary.push(doc);
    seenLibraryIds.add(doc.id);
  }

  for (const targetDoc of targetSeed.library) {
    if (!seenLibraryIds.has(targetDoc.id)) {
      nextLibrary.push({
        ...targetDoc,
        origin: 'seed',
        seedVersion: targetVersion,
      });
      seenLibraryIds.add(targetDoc.id);
      report.seedEntitiesInserted.library += 1;
    }
  }

  const finalLibraryIds = new Set(nextLibrary.map((d) => d.id));

  // -------------------------------------------------------------------------
  // 4. POSTS & REFERENCES / TOMBSTONES
  // -------------------------------------------------------------------------
  const preservedPosts: Post[] = [];
  const existingV2SeedPosts: Post[] = [];
  const removedLegacyPosts = new Map<string, Post>();

  for (const post of state.posts) {
    const nonEmptySigMatch =
      post.origin !== 'user' &&
      post.origin !== 'system' &&
      post.body.trim().length > 0 &&
      manifestPostSigs.has(postContentSignature(post));

    const cls = classifyWithId({
      origin: post.origin,
      seedVersion: post.seedVersion,
      id: post.id,
      targetVersion,
      manifestIds: manifestPostIds,
      targetSeedIds: targetPostIds,
      secondaryContentMatch: nonEmptySigMatch,
      hasManifest,
    });

    if (cls === 'target_seed') {
      existingV2SeedPosts.push(post);
      continue;
    }

    if (cls === 'legacy_seed') {
      const replacement = targetPostMap.get(post.id);
      if (replacement) {
        existingV2SeedPosts.push({
          ...replacement,
          origin: 'seed',
          seedVersion: targetVersion,
        });
      } else {
        removedLegacyPosts.set(post.id, post);
        report.seedEntitiesRemoved.posts += 1;
      }
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved post ${post.id} with ambiguous provenance.`);
    }
    preservedPosts.push(post);
  }

  // Validate preserved posts & handle repost wrappers / broken references
  const preliminaryIds = new Set<string>([
    ...preservedPosts.map((p) => p.id),
    ...existingV2SeedPosts.map((p) => p.id),
    ...targetSeed.posts.map((p) => p.id),
  ]);

  const finalPreservedPosts: Post[] = [];
  const tombstoneRequests = new Map<string, { fallbackAuthorId: string; fallbackDate: string }>();

  for (const post of preservedPosts) {
    if (!finalUserIds.has(post.authorId)) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(`Removed post ${post.id} because author ${post.authorId} does not exist.`);
      continue;
    }

    // Remove user repost wrapper only when its target is intentionally removed or invalid
    if (post.kind === 'repost' && post.repostOfId) {
      if (removedLegacyPosts.has(post.repostOfId) || !preliminaryIds.has(post.repostOfId)) {
        report.invalidReferencesHandled += 1;
        report.warnings.push(
          `Removed repost wrapper ${post.id} targeting removed/missing post ${post.repostOfId}.`,
        );
        continue;
      }
    }

    const nextPost: Post = { ...post };

    if (nextPost.libraryDocId && !finalLibraryIds.has(nextPost.libraryDocId)) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(
        `Cleared missing libraryDocId ${nextPost.libraryDocId} on preserved post ${nextPost.id}.`,
      );
      delete nextPost.libraryDocId;
    }

    if (nextPost.parentId && !preliminaryIds.has(nextPost.parentId)) {
      tombstoneRequests.set(nextPost.parentId, {
        fallbackAuthorId: nextPost.authorId,
        fallbackDate: nextPost.createdAt,
      });
    }

    if (nextPost.quotedPostId && !preliminaryIds.has(nextPost.quotedPostId)) {
      tombstoneRequests.set(nextPost.quotedPostId, {
        fallbackAuthorId: nextPost.authorId,
        fallbackDate: nextPost.createdAt,
      });
    }

    report.userRecordsPreserved.posts += 1;
    finalPreservedPosts.push(nextPost);
  }

  // Build tombstones for removed/missing referenced parent or quoted posts
  const tombstones: Post[] = [];
  for (const [refId, fallback] of tombstoneRequests.entries()) {
    const legacy = removedLegacyPosts.get(refId);
    if (!legacy) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(`Created placeholder tombstone for missing referenced post ${refId}.`);
    }
    const authorId =
      legacy && finalUserIds.has(legacy.authorId)
        ? legacy.authorId
        : finalUserIds.has(fallback.fallbackAuthorId)
          ? fallback.fallbackAuthorId
          : nextUsers[0]?.id ?? fallback.fallbackAuthorId;

    tombstones.push({
      id: refId,
      authorId,
      body: '',
      createdAt: legacy?.createdAt ?? fallback.fallbackDate ?? fallbackTimestamp,
      kind: 'original',
      topicTags: [],
      mentions: [],
      images: [],
      status: 'removed',
      tombstoneReason: legacy
        ? 'Original seed post removed during v2 migration'
        : 'Referenced post unavailable',
      views: 0,
      baseLikesCount: 0,
      baseRepostsCount: 0,
      baseRepliesCount: 0,
      baseBookmarksCount: 0,
      origin: legacy ? 'seed' : 'system',
      seedVersion: targetVersion,
    });
    report.tombstonesCreated += 1;
  }

  const nextPosts: Post[] = [...finalPreservedPosts, ...tombstones];
  const seenPostIds = new Set(nextPosts.map((p) => p.id));

  for (const p of existingV2SeedPosts) {
    if (!seenPostIds.has(p.id)) {
      nextPosts.push(p);
      seenPostIds.add(p.id);
    }
  }

  for (const targetPost of targetSeed.posts) {
    if (!seenPostIds.has(targetPost.id)) {
      nextPosts.push({
        ...targetPost,
        origin: 'seed',
        seedVersion: targetVersion,
      });
      seenPostIds.add(targetPost.id);
      report.seedEntitiesInserted.posts += 1;
    }
  }

  const visiblePostIds = new Set(
    nextPosts.filter((p) => p.status === 'visible').map((p) => p.id),
  );
  const allPostIds = new Set(nextPosts.map((p) => p.id));

  // Clear invalid pinnedPostId on users
  for (const user of nextUsers) {
    if (user.pinnedPostId && !visiblePostIds.has(user.pinnedPostId)) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(`Cleared invalid pinnedPostId ${user.pinnedPostId} on @${user.handle}.`);
      delete user.pinnedPostId;
    }
  }

  // -------------------------------------------------------------------------
  // 5. RELATIONSHIPS
  // -------------------------------------------------------------------------
  const nextFollows: FollowRecord[] = [];
  const seenFollows = new Set<string>();
  for (const f of state.follows) {
    const key = followKey(f);
    const cls = classifyRelationship({
      origin: f.origin,
      seedVersion: f.seedVersion,
      key,
      targetVersion,
      manifestKeys: manifestFollowKeys,
      targetKeys: targetFollowKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetFollowKeys.has(key)) continue;
    if (!finalUserIds.has(f.followerId) || !finalUserIds.has(f.followingId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    if (seenFollows.has(key)) continue;
    seenFollows.add(key);
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved follow ${key} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.follows += 1;
    }
    nextFollows.push(f);
  }
  for (const tf of targetSeed.follows) {
    const key = followKey(tf);
    if (!seenFollows.has(key) && finalUserIds.has(tf.followerId) && finalUserIds.has(tf.followingId)) {
      seenFollows.add(key);
      nextFollows.push({ ...tf, origin: 'seed', seedVersion: targetVersion });
    }
  }

  // Likes
  const nextLikes: LikeRecord[] = [];
  const seenLikes = new Set<string>();
  for (const l of state.likes) {
    const key = likeKey(l);
    const cls = classifyRelationship({
      origin: l.origin,
      seedVersion: l.seedVersion,
      key,
      targetVersion,
      manifestKeys: manifestLikeKeys,
      targetKeys: targetLikeKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetLikeKeys.has(key)) continue;
    if (!finalUserIds.has(l.userId) || !visiblePostIds.has(l.postId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    if (seenLikes.has(key)) continue;
    seenLikes.add(key);
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved like ${key} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.likes += 1;
    }
    nextLikes.push(l);
  }
  for (const tl of targetSeed.likes) {
    const key = likeKey(tl);
    if (!seenLikes.has(key) && finalUserIds.has(tl.userId) && visiblePostIds.has(tl.postId)) {
      seenLikes.add(key);
      nextLikes.push({ ...tl, origin: 'seed', seedVersion: targetVersion });
    }
  }

  // Reposts
  const nextReposts: RepostRecord[] = [];
  const seenReposts = new Set<string>();
  for (const r of state.reposts) {
    const key = repostKey(r);
    const cls = classifyRelationship({
      origin: r.origin,
      seedVersion: r.seedVersion,
      key,
      targetVersion,
      manifestKeys: manifestRepostKeys,
      targetKeys: targetRepostKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetRepostKeys.has(key)) continue;
    if (!finalUserIds.has(r.userId) || !visiblePostIds.has(r.postId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    if (seenReposts.has(key)) continue;
    seenReposts.add(key);
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved repost ${key} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.reposts += 1;
    }
    nextReposts.push(r);
  }
  for (const tr of targetSeed.reposts) {
    const key = repostKey(tr);
    if (!seenReposts.has(key) && finalUserIds.has(tr.userId) && visiblePostIds.has(tr.postId)) {
      seenReposts.add(key);
      nextReposts.push({ ...tr, origin: 'seed', seedVersion: targetVersion });
    }
  }

  // Bookmarks
  const nextBookmarks: BookmarkRecord[] = [];
  const seenBookmarks = new Set<string>();
  for (const b of state.bookmarks) {
    const key = bookmarkKey(b);
    const cls = classifyRelationship({
      origin: b.origin,
      seedVersion: b.seedVersion,
      key,
      targetVersion,
      manifestKeys: manifestBookmarkKeys,
      targetKeys: targetBookmarkKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetBookmarkKeys.has(key)) continue;
    const validTarget =
      b.targetType === 'post'
        ? visiblePostIds.has(b.targetId)
        : finalLibraryIds.has(b.targetId);
    if (!finalUserIds.has(b.userId) || !validTarget) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    if (seenBookmarks.has(key)) continue;
    seenBookmarks.add(key);
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved bookmark ${key} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.bookmarks += 1;
    }
    nextBookmarks.push(b);
  }
  for (const tb of targetSeed.bookmarks) {
    const key = bookmarkKey(tb);
    const validTarget =
      tb.targetType === 'post'
        ? visiblePostIds.has(tb.targetId)
        : finalLibraryIds.has(tb.targetId);
    if (!seenBookmarks.has(key) && finalUserIds.has(tb.userId) && validTarget) {
      seenBookmarks.add(key);
      nextBookmarks.push({ ...tb, origin: 'seed', seedVersion: targetVersion });
    }
  }

  // TopicFollows (support remapping; NEVER silently discard unmapped user topic follow)
  const nextTopicFollows: TopicFollowRecord[] = [];
  const seenTopicFollows = new Set<string>();
  for (const tf of state.topicFollows) {
    const rawKey = topicFollowKey(tf);
    const cls = classifyRelationship({
      origin: tf.origin,
      seedVersion: tf.seedVersion,
      key: rawKey,
      targetVersion,
      manifestKeys: manifestTopicFollowKeys,
      targetKeys: targetTopicFollowKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetTopicFollowKeys.has(rawKey)) continue;
    if (!finalUserIds.has(tf.userId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    const mappedSlug =
      topicMap[tf.topicSlug] && finalTopicSlugs.has(topicMap[tf.topicSlug])
        ? topicMap[tf.topicSlug]
        : tf.topicSlug;

    const mappedRecord: TopicFollowRecord =
      mappedSlug !== tf.topicSlug ? { ...tf, topicSlug: mappedSlug } : tf;
    const finalKey = topicFollowKey(mappedRecord);
    if (seenTopicFollows.has(finalKey)) continue;
    seenTopicFollows.add(finalKey);

    if (!finalTopicSlugs.has(mappedSlug)) {
      report.warnings.push(
        `Preserved unmapped topic follow "${mappedSlug}" for user ${tf.userId}.`,
      );
    }
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved topic follow ${rawKey} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.topicFollows += 1;
    }
    nextTopicFollows.push(mappedRecord);
  }
  for (const ttf of targetSeed.topicFollows) {
    const key = topicFollowKey(ttf);
    if (!seenTopicFollows.has(key) && finalUserIds.has(ttf.userId) && finalTopicSlugs.has(ttf.topicSlug)) {
      seenTopicFollows.add(key);
      nextTopicFollows.push({ ...ttf, origin: 'seed', seedVersion: targetVersion });
    }
  }

  // Mutes
  const nextMutes: MuteRecord[] = [];
  const seenMutes = new Set<string>();
  for (const m of state.mutes) {
    const rawKey = muteKey(m);
    const cls = classifyRelationship({
      origin: m.origin,
      seedVersion: m.seedVersion,
      key: rawKey,
      targetVersion,
      manifestKeys: manifestMuteKeys,
      targetKeys: targetMuteKeys,
      hasManifest,
    });
    if (cls === 'legacy_seed' && !targetMuteKeys.has(rawKey)) continue;
    if (!finalUserIds.has(m.userId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    if (m.targetType === 'user' && !finalUserIds.has(m.targetValue)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    const nextMute: MuteRecord =
      m.targetType === 'topic' && topicMap[m.targetValue] && finalTopicSlugs.has(topicMap[m.targetValue])
        ? { ...m, targetValue: topicMap[m.targetValue] }
        : m;
    const key = muteKey(nextMute);
    if (seenMutes.has(key)) continue;
    seenMutes.add(key);
    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved mute ${rawKey} with ambiguous provenance.`);
    }
    if (cls === 'user_or_system' || cls === 'ambiguous_preserve') {
      report.relationshipsPreserved.mutes += 1;
    }
    nextMutes.push(nextMute);
  }

  // -------------------------------------------------------------------------
  // 6. NOTIFICATIONS
  // -------------------------------------------------------------------------
  const nextNotifications: Notification[] = [];
  const seenNotifIds = new Set<string>();

  for (const n of state.notifications) {
    const cls = classifyWithId({
      origin: n.origin,
      seedVersion: n.seedVersion,
      id: n.id,
      targetVersion,
      manifestIds: manifestNotifIds,
      targetSeedIds: targetNotifIds,
      hasManifest,
    });

    if (cls === 'legacy_seed') {
      const replacement = targetNotifMap.get(n.id);
      if (!replacement) {
        report.seedEntitiesRemoved.notifications += 1;
        continue;
      }
      nextNotifications.push({ ...replacement, origin: 'seed', seedVersion: targetVersion });
      seenNotifIds.add(n.id);
      continue;
    }

    if (cls === 'target_seed') {
      nextNotifications.push(n);
      seenNotifIds.add(n.id);
      continue;
    }

    // Validate references on user/system/ambiguous notifications
    if (!finalUserIds.has(n.recipientId)) {
      report.invalidReferencesHandled += 1;
      continue;
    }
    const validTarget =
      n.targetType === 'post'
        ? allPostIds.has(n.targetId)
        : n.targetType === 'doc'
          ? finalLibraryIds.has(n.targetId)
          : n.targetType === 'user'
            ? finalUserIds.has(n.targetId)
            : true;

    if (!validTarget) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(
        `Removed notification ${n.id} referencing missing ${n.targetType} ${n.targetId}.`,
      );
      continue;
    }

    const filteredActors = n.actorIds.filter((aid) => finalUserIds.has(aid));
    if (filteredActors.length === 0 && n.type !== 'moderation') {
      report.invalidReferencesHandled += 1;
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved notification ${n.id} with ambiguous provenance.`);
    }
    report.userRecordsPreserved.notifications += 1;
    nextNotifications.push({ ...n, actorIds: filteredActors });
    seenNotifIds.add(n.id);
  }

  for (const tn of targetSeed.notifications) {
    if (!seenNotifIds.has(tn.id)) {
      nextNotifications.push({ ...tn, origin: 'seed', seedVersion: targetVersion });
      seenNotifIds.add(tn.id);
      report.seedEntitiesInserted.notifications += 1;
    }
  }

  // -------------------------------------------------------------------------
  // 7. REPORTS
  // -------------------------------------------------------------------------
  const nextReports: Report[] = [];
  const seenReportIds = new Set<string>();

  for (const r of state.reports) {
    const cls = classifyWithId({
      origin: r.origin,
      seedVersion: r.seedVersion,
      id: r.id,
      targetVersion,
      manifestIds: manifestReportIds,
      targetSeedIds: targetReportIds,
      hasManifest,
    });

    if (cls === 'legacy_seed') {
      const replacement = targetReportMap.get(r.id);
      if (!replacement) {
        report.seedEntitiesRemoved.reports += 1;
        continue;
      }
      nextReports.push({ ...replacement, origin: 'seed', seedVersion: targetVersion });
      seenReportIds.add(r.id);
      continue;
    }

    if (cls === 'target_seed') {
      nextReports.push(r);
      seenReportIds.add(r.id);
      continue;
    }

    const validTarget =
      r.targetType === 'post' ? allPostIds.has(r.targetId) : finalLibraryIds.has(r.targetId);
    if (!validTarget) {
      report.invalidReferencesHandled += 1;
      report.warnings.push(`Removed report ${r.id} targeting missing ${r.targetType} ${r.targetId}.`);
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved report ${r.id} with ambiguous provenance.`);
    }
    report.userRecordsPreserved.reports += 1;
    nextReports.push(r);
    seenReportIds.add(r.id);
  }

  for (const tr of targetSeed.reports) {
    if (!seenReportIds.has(tr.id)) {
      nextReports.push({ ...tr, origin: 'seed', seedVersion: targetVersion });
      seenReportIds.add(tr.id);
      report.seedEntitiesInserted.reports += 1;
    }
  }

  // -------------------------------------------------------------------------
  // 8. AUDIT LOG
  // -------------------------------------------------------------------------
  const nextAudit: AuditEntry[] = [];
  const seenAuditIds = new Set<string>();

  for (const a of state.auditLog) {
    const cls = classifyWithId({
      origin: a.origin,
      seedVersion: a.seedVersion,
      id: a.id,
      targetVersion,
      manifestIds: manifestAuditIds,
      targetSeedIds: targetAuditIds,
      hasManifest,
    });

    if (cls === 'legacy_seed') {
      const replacement = targetAuditMap.get(a.id);
      if (!replacement) {
        report.seedEntitiesRemoved.auditLog += 1;
        continue;
      }
      nextAudit.push({ ...replacement, origin: 'seed', seedVersion: targetVersion });
      seenAuditIds.add(a.id);
      continue;
    }

    if (cls === 'target_seed') {
      nextAudit.push(a);
      seenAuditIds.add(a.id);
      continue;
    }

    if (cls === 'ambiguous_preserve') {
      report.ambiguousRecordsPreserved += 1;
      report.warnings.push(`Preserved audit entry ${a.id} with ambiguous provenance.`);
    }
    report.userRecordsPreserved.auditLog += 1;
    nextAudit.push(a);
    seenAuditIds.add(a.id);
  }

  for (const ta of targetSeed.auditLog) {
    if (!seenAuditIds.has(ta.id)) {
      nextAudit.push({ ...ta, origin: 'seed', seedVersion: targetVersion });
      seenAuditIds.add(ta.id);
      report.seedEntitiesInserted.auditLog += 1;
    }
  }

  // -------------------------------------------------------------------------
  // 9. SESSION, SETTINGS, PREFS, DRAFTS, SEARCHES, THEME
  // -------------------------------------------------------------------------
  let nextSession = { ...state.session };
  if (nextSession.currentUserId && !finalUserIds.has(nextSession.currentUserId)) {
    report.invalidReferencesHandled += 1;
    report.warnings.push(
      `Reset dangling session for missing user ${nextSession.currentUserId}.`,
    );
    nextSession = { currentUserId: null, loggedInAt: null };
  }

  const nextState: CommonsStoreState = {
    schemaVersion: targetVersion,
    session: nextSession,
    users: nextUsers,
    posts: nextPosts,
    likes: nextLikes,
    reposts: nextReposts,
    bookmarks: nextBookmarks,
    follows: nextFollows,
    topicFollows: nextTopicFollows,
    mutes: nextMutes,
    notifications: nextNotifications,
    library: nextLibrary,
    reports: nextReports,
    auditLog: nextAudit,
    topics: nextTopics,
    settings: { ...state.settings },
    notificationPrefs: { ...state.notificationPrefs },
    drafts: [...state.drafts],
    recentSearches: [...state.recentSearches],
    theme: state.theme,
    simulatorEnabled: state.simulatorEnabled,
  };

  return { state: nextState, report };
}
