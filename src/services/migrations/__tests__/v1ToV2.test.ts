/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import type { CommonsStoreState, LibraryDoc, Post, User } from '../../../data/types';
import {
  buildSeedManifest,
  migrateV1toV2,
  type MigrationContext,
} from '../v1ToV2';

function makeBaseUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u_seed_1',
    handle: 'seed_researcher',
    displayName: 'Seed Researcher',
    email: 'seed1@commons.example',
    mockPassword: 'password123',
    role: 'member',
    status: 'active',
    bio: 'Old v1 bio',
    location: 'Old City',
    link: 'https://old.example',
    joinedAt: '2025-01-01T00:00:00.000Z',
    avatarSeed: 4,
    bannerSeed: 14,
    interestTopics: ['epistemology'],
    verified: false,
    baseFollowersCount: 100,
    baseFollowingCount: 12,
    ...overrides,
  };
}

function makeBasePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'p_001',
    authorId: 'u_seed_1',
    body: 'Legacy v1 seed post',
    createdAt: '2026-01-01T10:00:00.000Z',
    kind: 'original',
    topicTags: ['epistemology'],
    mentions: [],
    images: [],
    status: 'visible',
    views: 100,
    baseLikesCount: 10,
    baseRepostsCount: 2,
    baseRepliesCount: 0,
    baseBookmarksCount: 1,
    ...overrides,
  };
}

function makeBaseDoc(overrides: Partial<LibraryDoc> = {}): LibraryDoc {
  return {
    id: 'doc_01',
    title: 'Legacy v1 Essay',
    type: 'Essay',
    authorIds: ['u_seed_1'],
    abstract: 'A legacy v1 abstract for synthetic testing.',
    bodyMarkdown: '# Legacy\n\nBody text.',
    topics: ['epistemology'],
    version: 'v1.0',
    createdAt: '2026-01-01T09:00:00.000Z',
    status: 'published',
    citationData: { year: 2026, venue: 'Commons Library' },
    baseBookmarksCount: 5,
    ...overrides,
  };
}

function makeSyntheticV1Seed(): CommonsStoreState {
  return {
    schemaVersion: 1,
    session: { currentUserId: null, loggedInAt: null },
    users: [
      makeBaseUser({ id: 'u_demo_member', handle: 'elena_vance', displayName: 'Elena Vance', email: 'member@commons.example', mockPassword: 'demo-password', role: 'member' }),
      makeBaseUser({ id: 'u_demo_mod', handle: 'mira_chen_mod', displayName: 'Mira Chen', email: 'mod@commons.example', mockPassword: 'demo-password', role: 'moderator' }),
      makeBaseUser({ id: 'u_demo_admin', handle: 'julian_ross', displayName: 'Julian Ross', email: 'admin@commons.example', mockPassword: 'demo-password', role: 'admin' }),
    ],
    posts: [
      makeBasePost({ id: 'p_001', authorId: 'u_demo_member', body: 'Legacy v1 starter post one' }),
      makeBasePost({ id: 'p_002', authorId: 'u_demo_mod', body: 'Legacy v1 starter post two' }),
    ],
    likes: [{ userId: 'u_demo_member', postId: 'p_002', createdAt: '2026-01-01T11:00:00.000Z' }],
    reposts: [],
    bookmarks: [{ userId: 'u_demo_member', targetType: 'doc', targetId: 'doc_01', createdAt: '2026-01-01T11:05:00.000Z' }],
    follows: [{ followerId: 'u_demo_member', followingId: 'u_demo_mod', createdAt: '2026-01-01T08:00:00.000Z' }],
    topicFollows: [{ userId: 'u_demo_member', topicSlug: 'epistemology', createdAt: '2026-01-01T08:00:00.000Z' }],
    mutes: [],
    notifications: [
      {
        id: 'n_01',
        recipientId: 'u_demo_member',
        type: 'like',
        actorIds: ['u_demo_mod'],
        targetType: 'post',
        targetId: 'p_001',
        createdAt: '2026-01-01T12:00:00.000Z',
        read: false,
      },
    ],
    library: [makeBaseDoc({ id: 'doc_01', title: 'Legacy v1 Essay', authorIds: ['u_demo_member'] })],
    reports: [
      {
        id: 'r_01',
        targetType: 'post',
        targetId: 'p_002',
        reporterIds: ['u_demo_member'],
        reason: 'Legacy seed report',
        status: 'open',
        createdAt: '2026-01-01T13:00:00.000Z',
      },
    ],
    auditLog: [
      {
        id: 'a_01',
        actorId: 'u_demo_admin',
        action: 'settings_update',
        targetType: 'settings',
        targetId: 'platform',
        note: 'Legacy seed audit entry',
        createdAt: '2026-01-01T07:00:00.000Z',
      },
    ],
    topics: [
      { slug: 'epistemology', name: 'Epistemology', featured: true, archived: false, basePostCount: 100 },
      { slug: 'music-theory', name: 'Music Theory', featured: false, archived: false, basePostCount: 50 },
    ],
    settings: {
      brandName: 'Commons',
      registrationMode: 'open',
      inviteCode: 'COMMONS-DEMO',
      charLimit: 500,
    },
    notificationPrefs: {
      follow: true,
      like: true,
      repost: true,
      quote: true,
      reply: true,
      mention: true,
      library_comment: true,
      library_decision: true,
      moderation: true,
    },
    drafts: [],
    recentSearches: ['epistemology'],
    theme: 'system',
    simulatorEnabled: true,
  };
}

function makeSyntheticV2TargetSeed(): CommonsStoreState {
  return {
    schemaVersion: 2,
    session: { currentUserId: null, loggedInAt: null },
    users: [
      makeBaseUser({
        id: 'u_demo_member',
        handle: 'should_not_override_handle',
        displayName: 'Should Not Override Name',
        email: 'wrong@commons.example',
        mockPassword: 'wrong-password',
        role: 'admin',
        bio: 'Updated crash-game probability & provably fair researcher bio.',
        location: 'Zurich, CH',
        link: 'https://crash-research.example',
        interestTopics: ['crash-algorithms', 'provably-fair'],
        verified: true,
        baseFollowersCount: 250,
        baseFollowingCount: 18,
        origin: 'seed',
        seedVersion: 2,
      }),
      makeBaseUser({
        id: 'u_demo_mod',
        handle: 'mira_chen_mod',
        displayName: 'Mira Chen',
        email: 'mod@commons.example',
        mockPassword: 'demo-password',
        role: 'moderator',
        bio: 'Updated moderator bio for crash-game research integrity.',
        interestTopics: ['verification', 'reproducibility'],
        verified: true,
        origin: 'seed',
        seedVersion: 2,
      }),
      makeBaseUser({
        id: 'u_demo_admin',
        handle: 'julian_ross',
        displayName: 'Julian Ross',
        email: 'admin@commons.example',
        mockPassword: 'demo-password',
        role: 'admin',
        bio: 'Updated platform steward for crash-game empirical methods.',
        interestTopics: ['hashing-hmac', 'statistical-modelling'],
        verified: true,
        origin: 'seed',
        seedVersion: 2,
      }),
      makeBaseUser({
        id: 'u_v2_new_crypto',
        handle: 'hmac_nadia',
        displayName: 'Nadia Benali',
        email: 'nadia@commons.example',
        mockPassword: 'password123',
        role: 'member',
        bio: 'Studying reverse hash-chain commitments and server-seed audits.',
        interestTopics: ['hashing-hmac', 'commitments'],
        verified: true,
        origin: 'seed',
        seedVersion: 2,
      }),
    ],
    posts: [
      makeBasePost({
        id: 'p_v2_001',
        authorId: 'u_v2_new_crypto',
        body: 'Comparing SHA-256 reverse hash chains against seeded HMAC-SHA256 nonces. #HashingAndHMAC #ProvablyFair',
        topicTags: ['hashing-hmac', 'provably-fair'],
        origin: 'seed',
        seedVersion: 2,
      }),
    ],
    likes: [{ userId: 'u_demo_member', postId: 'p_v2_001', createdAt: '2026-02-01T10:00:00.000Z', origin: 'seed', seedVersion: 2 }],
    reposts: [],
    bookmarks: [{ userId: 'u_demo_member', targetType: 'doc', targetId: 'doc_v2_01', createdAt: '2026-02-01T10:00:00.000Z', origin: 'seed', seedVersion: 2 }],
    follows: [{ followerId: 'u_demo_member', followingId: 'u_v2_new_crypto', createdAt: '2026-02-01T10:00:00.000Z', origin: 'seed', seedVersion: 2 }],
    topicFollows: [{ userId: 'u_demo_member', topicSlug: 'provably-fair', createdAt: '2026-02-01T10:00:00.000Z', origin: 'seed', seedVersion: 2 }],
    mutes: [],
    notifications: [
      {
        id: 'n_v2_01',
        recipientId: 'u_demo_member',
        type: 'follow',
        actorIds: ['u_v2_new_crypto'],
        targetType: 'user',
        targetId: 'u_demo_member',
        createdAt: '2026-02-01T10:05:00.000Z',
        read: false,
        origin: 'seed',
        seedVersion: 2,
      },
    ],
    library: [
      makeBaseDoc({
        id: 'doc_v2_01',
        title: 'Verifying Reverse Hash-Chain Commitments in Crash Games',
        type: 'Algorithm',
        authorIds: ['u_v2_new_crypto'],
        topics: ['hashing-hmac', 'provably-fair'],
        evidenceStatus: 'verified',
        methodSummary: 'Independent SHA-256 chain replay over 100k public seeds.',
        dataProvenance: 'Publicly disclosed archival hash chain',
        reproducibility: 'reproducible',
        origin: 'seed',
        seedVersion: 2,
      }),
    ],
    reports: [],
    auditLog: [
      {
        id: 'a_v2_01',
        actorId: 'u_demo_admin',
        action: 'library_approve',
        targetType: 'doc',
        targetId: 'doc_v2_01',
        note: 'Approved algorithm verification benchmark.',
        createdAt: '2026-02-01T09:00:00.000Z',
        origin: 'seed',
        seedVersion: 2,
      },
    ],
    topics: [
      { slug: 'crash-algorithms', name: 'Crash Algorithms', featured: true, archived: false, basePostCount: 120, origin: 'seed', seedVersion: 2 },
      { slug: 'provably-fair', name: 'Provably Fair', featured: true, archived: false, basePostCount: 110, origin: 'seed', seedVersion: 2 },
      { slug: 'hashing-hmac', name: 'Hashing and HMAC', featured: true, archived: false, basePostCount: 95, origin: 'seed', seedVersion: 2 },
      { slug: 'probability-theory', name: 'Probability Theory', featured: true, archived: false, basePostCount: 90, origin: 'seed', seedVersion: 2 },
    ],
    settings: {
      brandName: 'Commons',
      registrationMode: 'open',
      inviteCode: 'COMMONS-DEMO',
      charLimit: 500,
    },
    notificationPrefs: {
      follow: true,
      like: true,
      repost: true,
      quote: true,
      reply: true,
      mention: true,
      library_comment: true,
      library_decision: true,
      moderation: true,
    },
    drafts: [],
    recentSearches: [],
    theme: 'system',
    simulatorEnabled: true,
  };
}

function makeEmptySyntheticV1(): CommonsStoreState {
  const base = makeSyntheticV1Seed();
  return {
    ...base,
    users: [],
    posts: [],
    likes: [],
    reposts: [],
    bookmarks: [],
    follows: [],
    topicFollows: [],
    mutes: [],
    notifications: [],
    library: [],
    reports: [],
    auditLog: [],
    topics: [],
  };
}

function makeDefaultContext(): MigrationContext {
  const v1Seed = makeSyntheticV1Seed();
  return {
    legacyManifest: buildSeedManifest(v1Seed),
    targetSeedState: makeSyntheticV2TargetSeed(),
    targetSchemaVersion: 2,
    topicMap: { epistemology: 'probability-theory' },
    migrationTimestamp: '2026-11-16T00:00:00.000Z',
  };
}

test('1. Fresh synthetic state receives v2 seed entities cleanly', () => {
  const fresh = makeEmptySyntheticV1();
  const ctx = makeDefaultContext();
  const { state, report } = migrateV1toV2(fresh, ctx);

  assert.equal(state.schemaVersion, 2);
  assert.equal(state.users.length, ctx.targetSeedState.users.length);
  assert.equal(state.posts.length, ctx.targetSeedState.posts.length);
  assert.equal(state.library.length, ctx.targetSeedState.library.length);
  assert.equal(state.topics.length, ctx.targetSeedState.topics.length);
  assert.equal(report.seedEntitiesInserted.users, 4);
  assert.equal(report.seedEntitiesInserted.posts, 1);
  assert.equal(report.errors.length, 0);
});

test('2. Pristine synthetic v1 state replaces legacy seed cleanly', () => {
  const v1 = makeSyntheticV1Seed();
  const ctx = makeDefaultContext();
  const { state, report } = migrateV1toV2(v1, ctx);

  assert.equal(state.schemaVersion, 2);
  assert.ok(!state.posts.some((p) => p.id === 'p_001' || p.id === 'p_002'));
  assert.ok(state.posts.some((p) => p.id === 'p_v2_001'));
  assert.ok(!state.library.some((d) => d.id === 'doc_01'));
  assert.ok(state.library.some((d) => d.id === 'doc_v2_01'));
  assert.equal(report.seedEntitiesRemoved.posts, 2);
  assert.equal(report.seedEntitiesRemoved.library, 1);
  assert.equal(report.seedEntitiesInserted.posts, 1);
  assert.equal(report.seedEntitiesInserted.library, 1);
  // Old topics archived cleanly
  const oldEpistemology = state.topics.find((t) => t.slug === 'epistemology');
  assert.equal(oldEpistemology?.archived, true);
  assert.equal(oldEpistemology?.mergedInto, 'probability-theory');
});

test('3. User-created account and active session are preserved', () => {
  const v1 = makeSyntheticV1Seed();
  v1.users.push(
    makeBaseUser({
      id: 'u_custom_99',
      handle: 'real_researcher',
      displayName: 'Real Researcher',
      email: 'real@example.org',
      mockPassword: 'secret-user-pw',
      origin: 'user',
    }),
  );
  v1.session = { currentUserId: 'u_custom_99', loggedInAt: '2026-05-01T00:00:00.000Z' };

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  const preserved = state.users.find((u) => u.id === 'u_custom_99');

  assert.ok(preserved);
  assert.equal(preserved.handle, 'real_researcher');
  assert.equal(preserved.mockPassword, 'secret-user-pw');
  assert.equal(state.session.currentUserId, 'u_custom_99');
  assert.equal(report.userRecordsPreserved.users, 1);
});

test('4. User-created posts (with or without explicit origin, even by seeded account) are preserved', () => {
  const v1 = makeSyntheticV1Seed();
  // User post by custom user with explicit origin
  v1.posts.push(
    makeBasePost({
      id: 'p_user_1',
      authorId: 'u_demo_member',
      body: 'My own post created while logged in as demo member.',
      origin: 'user',
    }),
  );
  // Pre-provenance v1 user post without origin, authored by a seeded account
  v1.posts.push(
    makeBasePost({
      id: 'p_user_legacy_no_origin',
      authorId: 'u_demo_mod',
      body: 'Pre-provenance note written by moderator in v1.',
    }),
  );

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.ok(state.posts.some((p) => p.id === 'p_user_1'));
  assert.ok(state.posts.some((p) => p.id === 'p_user_legacy_no_origin'));
  assert.equal(report.userRecordsPreserved.posts, 2);
});

test('5. Reply and quote references to removed seed posts are preserved with usable tombstones', () => {
  const v1 = makeSyntheticV1Seed();
  v1.posts.push(
    makeBasePost({
      id: 'p_user_reply',
      authorId: 'u_demo_member',
      kind: 'reply',
      parentId: 'p_001',
      threadId: 'p_001',
      body: 'Thoughtful user reply to legacy seed post p_001.',
      origin: 'user',
    }),
    makeBasePost({
      id: 'p_user_quote',
      authorId: 'u_demo_member',
      kind: 'quote',
      quotedPostId: 'p_002',
      body: 'User commentary quoting legacy seed post p_002.',
      origin: 'user',
    }),
  );

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.ok(state.posts.some((p) => p.id === 'p_user_reply'));
  assert.ok(state.posts.some((p) => p.id === 'p_user_quote'));

  const tombParent = state.posts.find((p) => p.id === 'p_001');
  const tombQuoted = state.posts.find((p) => p.id === 'p_002');
  assert.equal(tombParent?.status, 'removed');
  assert.equal(tombQuoted?.status, 'removed');
  assert.ok(tombParent?.tombstoneReason);
  assert.equal(report.tombstonesCreated, 2);
});

test('6. User repost wrapper is removed when target seed post is removed, kept when target survives', () => {
  const v1 = makeSyntheticV1Seed();
  // Kept user target post
  v1.posts.push(
    makeBasePost({
      id: 'p_user_target',
      authorId: 'u_demo_mod',
      body: 'User-authored post that survives migration.',
      origin: 'user',
    }),
    // Repost targeting removed seed p_001 -> must be removed
    makeBasePost({
      id: 'rp_user_removed_target',
      authorId: 'u_demo_member',
      kind: 'repost',
      repostOfId: 'p_001',
      body: '',
      origin: 'user',
    }),
    // Repost targeting surviving user post -> must be kept
    makeBasePost({
      id: 'rp_user_kept_target',
      authorId: 'u_demo_member',
      kind: 'repost',
      repostOfId: 'p_user_target',
      body: '',
      origin: 'user',
    }),
  );

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.ok(!state.posts.some((p) => p.id === 'rp_user_removed_target'));
  assert.ok(state.posts.some((p) => p.id === 'rp_user_kept_target'));
  assert.ok(report.invalidReferencesHandled >= 1);
});

test('7. Demo account identities and credentials are strictly preserved while seed bio updates', () => {
  const v1 = makeSyntheticV1Seed();
  const { state, report } = migrateV1toV2(v1, makeDefaultContext());

  const demoMember = state.users.find((u) => u.id === 'u_demo_member');
  assert.ok(demoMember);
  // Identity & credentials untouched despite targetSeedState having different values
  assert.equal(demoMember.handle, 'elena_vance');
  assert.equal(demoMember.displayName, 'Elena Vance');
  assert.equal(demoMember.email, 'member@commons.example');
  assert.equal(demoMember.mockPassword, 'demo-password');
  assert.equal(demoMember.role, 'member');
  // Seed-owned profile content updated in place
  assert.equal(demoMember.bio, 'Updated crash-game probability & provably fair researcher bio.');
  assert.equal(demoMember.location, 'Zurich, CH');
  assert.deepEqual(demoMember.interestTopics, ['crash-algorithms', 'provably-fair']);
  assert.equal(report.seedAccountsUpdated, 3);
});

test('8. User Library documents (including Essay and new types) are preserved', () => {
  const v1 = makeSyntheticV1Seed();
  v1.library.push(
    makeBaseDoc({
      id: 'doc_user_essay',
      title: 'User Essay on Multiplier Variance',
      type: 'Essay',
      authorIds: ['u_demo_member'],
      status: 'pending',
      origin: 'user',
    }),
    makeBaseDoc({
      id: 'doc_user_algo',
      title: 'HMAC-SHA256 Reference Verifier',
      type: 'Algorithm',
      authorIds: ['u_demo_member'],
      status: 'published',
      evidenceStatus: 'verified',
      reproducibility: 'reproducible',
      origin: 'user',
    }),
  );

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.ok(state.library.some((d) => d.id === 'doc_user_essay' && d.type === 'Essay'));
  assert.ok(state.library.some((d) => d.id === 'doc_user_algo' && d.type === 'Algorithm'));
  assert.ok(!state.library.some((d) => d.id === 'doc_01'));
  assert.equal(report.userRecordsPreserved.library, 2);
});

test('9. User settings, notificationPrefs, drafts, recentSearches, theme, and simulatorEnabled are preserved', () => {
  const v1 = makeSyntheticV1Seed();
  v1.settings = {
    brandName: 'Crash Research Square',
    registrationMode: 'invite-only',
    inviteCode: 'CUSTOM-99',
    charLimit: 500,
  };
  v1.notificationPrefs = { ...v1.notificationPrefs, like: false, follow: false };
  v1.drafts = [
    {
      id: 'draft_1',
      body: 'Drafting a Chi-square uniformity note...',
      topicTags: ['randomness-testing'],
      updatedAt: '2026-05-02T12:00:00.000Z',
    },
  ];
  v1.recentSearches = ['hmac-sha256', 'tail exponent'];
  v1.theme = 'light';
  v1.simulatorEnabled = false;

  const { state } = migrateV1toV2(v1, makeDefaultContext());
  assert.deepEqual(state.settings, v1.settings);
  assert.equal(state.notificationPrefs.like, false);
  assert.equal(state.notificationPrefs.follow, false);
  assert.deepEqual(state.drafts, v1.drafts);
  assert.deepEqual(state.recentSearches, ['hmac-sha256', 'tail exponent']);
  assert.equal(state.theme, 'light');
  assert.equal(state.simulatorEnabled, false);
});

test('10. Ambiguous relationships are preserved without ID-prefix heuristics and reported', () => {
  const v1 = makeSyntheticV1Seed();
  // Ambiguous follow: marked origin='seed' yet absent from manifest and target
  v1.follows.push({
    followerId: 'u_demo_mod',
    followingId: 'u_demo_admin',
    createdAt: '2026-03-01T00:00:00.000Z',
    origin: 'seed',
    seedVersion: 1,
  });
  // Ambiguous like: has seedVersion without origin
  v1.posts.push(
    makeBasePost({
      id: 'p_user_kept',
      authorId: 'u_demo_member',
      body: 'Kept user post.',
      origin: 'user',
    }),
  );
  v1.likes.push({
    userId: 'u_demo_mod',
    postId: 'p_user_kept',
    createdAt: '2026-03-02T00:00:00.000Z',
    seedVersion: 1,
  });
  // User follow between two seeded accounts (no origin, not in manifest) -> preserved
  v1.follows.push({
    followerId: 'u_demo_admin',
    followingId: 'u_demo_member',
    createdAt: '2026-03-03T00:00:00.000Z',
  });

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.ok(
    state.follows.some(
      (f) => f.followerId === 'u_demo_mod' && f.followingId === 'u_demo_admin',
    ),
  );
  assert.ok(
    state.follows.some(
      (f) => f.followerId === 'u_demo_admin' && f.followingId === 'u_demo_member',
    ),
  );
  assert.ok(
    state.likes.some((l) => l.userId === 'u_demo_mod' && l.postId === 'p_user_kept'),
  );
  assert.equal(report.ambiguousRecordsPreserved, 2);
  assert.ok(report.warnings.length >= 2);
});

test('11. Invalid references (dangling likes, bookmarks, notifications, pinnedPostId, libraryDocId, session) are handled cleanly', () => {
  const v1 = makeSyntheticV1Seed();
  v1.session = { currentUserId: 'u_nonexistent', loggedInAt: '2026-01-01T00:00:00.000Z' };
  v1.users[0].pinnedPostId = 'p_001'; // p_001 will be removed
  v1.posts.push(
    makeBasePost({
      id: 'p_user_with_dead_doc',
      authorId: 'u_demo_member',
      body: 'User post referencing legacy doc_01',
      libraryDocId: 'doc_01',
      origin: 'user',
    }),
  );
  v1.likes.push({
    userId: 'u_demo_member',
    postId: 'p_nonexistent',
    createdAt: '2026-03-01T00:00:00.000Z',
    origin: 'user',
  });
  v1.bookmarks.push({
    userId: 'u_demo_member',
    targetType: 'post',
    targetId: 'p_001',
    createdAt: '2026-03-01T00:00:00.000Z',
    origin: 'user',
  });
  v1.notifications.push({
    id: 'n_user_dead_target',
    recipientId: 'u_demo_member',
    type: 'reply',
    actorIds: ['u_demo_mod'],
    targetType: 'post',
    targetId: 'p_never_existed',
    createdAt: '2026-03-01T00:00:00.000Z',
    read: false,
    origin: 'user',
  });

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());
  assert.equal(state.session.currentUserId, null);
  assert.equal(state.users.find((u) => u.id === 'u_demo_member')?.pinnedPostId, undefined);
  const keptPost = state.posts.find((p) => p.id === 'p_user_with_dead_doc');
  assert.ok(keptPost);
  assert.equal(keptPost.libraryDocId, undefined);
  assert.ok(!state.likes.some((l) => l.postId === 'p_nonexistent'));
  assert.ok(!state.bookmarks.some((b) => b.targetId === 'p_001'));
  assert.ok(!state.notifications.some((n) => n.id === 'n_user_dead_target'));
  assert.ok(report.invalidReferencesHandled >= 6);
});

test('12. Idempotency: running migration twice produces identical state and zero duplicates', () => {
  const v1 = makeSyntheticV1Seed();
  v1.posts.push(
    makeBasePost({
      id: 'p_user_1',
      authorId: 'u_demo_member',
      body: 'User post',
      origin: 'user',
    }),
  );
  const ctx = makeDefaultContext();

  const first = migrateV1toV2(v1, ctx);
  const second = migrateV1toV2(first.state, ctx);

  assert.deepEqual(second.state, first.state);
  assert.equal(second.report.alreadyAtTargetVersion, true);
  assert.equal(second.report.seedEntitiesInserted.users, 0);
  assert.equal(second.report.seedEntitiesInserted.posts, 0);
  assert.equal(second.report.seedEntitiesInserted.library, 0);
  assert.equal(second.report.seedEntitiesRemoved.posts, 0);
  assert.equal(second.report.seedAccountsUpdated, 0);
  assert.equal(second.report.tombstonesCreated, 0);
});

test('13. Input immutability: source state and context are never mutated', () => {
  const v1 = makeSyntheticV1Seed();
  v1.posts.push(
    makeBasePost({
      id: 'p_user_1',
      authorId: 'u_demo_member',
      body: 'Immutability test post',
      libraryDocId: 'doc_01',
      origin: 'user',
    }),
  );
  const ctx = makeDefaultContext();

  const snapshotState = JSON.stringify(v1);
  const snapshotCtx = JSON.stringify(ctx);

  const result = migrateV1toV2(v1, ctx);
  // Mutate result to prove complete detachment too
  result.state.users[0].bio = 'mutated-output';

  assert.equal(JSON.stringify(v1), snapshotState);
  assert.equal(JSON.stringify(ctx), snapshotCtx);
});

test('14. Migration report accuracy & topic follow remapping/preservation', () => {
  const v1 = makeSyntheticV1Seed();
  // User topic follow that maps via topicMap ('epistemology' -> 'probability-theory')
  // Plus an unmapped user topic follow ('custom-unmapped-field') that must NEVER be discarded
  v1.topicFollows.push(
    {
      userId: 'u_demo_mod',
      topicSlug: 'epistemology',
      createdAt: '2026-04-01T00:00:00.000Z',
      origin: 'user',
    },
    {
      userId: 'u_demo_mod',
      topicSlug: 'custom-unmapped-field',
      createdAt: '2026-04-02T00:00:00.000Z',
      origin: 'user',
    },
  );

  const { state, report } = migrateV1toV2(v1, makeDefaultContext());

  assert.equal(report.sourceSchemaVersion, 1);
  assert.equal(report.targetSchemaVersion, 2);
  assert.equal(report.alreadyAtTargetVersion, false);
  assert.equal(report.relationshipsPreserved.topicFollows, 2);
  assert.ok(
    state.topicFollows.some(
      (tf) => tf.userId === 'u_demo_mod' && tf.topicSlug === 'probability-theory',
    ),
  );
  assert.ok(
    state.topicFollows.some(
      (tf) => tf.userId === 'u_demo_mod' && tf.topicSlug === 'custom-unmapped-field',
    ),
  );
  assert.ok(
    report.warnings.some((w) => w.includes('custom-unmapped-field')),
  );
});
