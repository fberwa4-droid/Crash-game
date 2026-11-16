# Commons — Repositioning Notes (Phase 2, Task 1)

**Scope:** Architecture, Data Provenance, and Pure Migration Foundation  
**Active Schema Version:** `1` (`STORAGE_NAMESPACE = "commons:v1:"`)  
**Target Migration Schema Version (isolated):** `2` (`TARGET_MIGRATION_SCHEMA_VERSION = 2`)

---

## 1. Files Changed & Created

### Modified
- `src/config.ts` — Added centralized platform branding constants (`PLATFORM_TAGLINE`, `PLATFORM_DESCRIPTION`, `RESEARCH_DISCLAIMER`), `TARGET_MIGRATION_SCHEMA_VERSION = 2`, `CRASH_RESEARCH_TOPICS` (18 topics), `LIBRARY_DOC_TYPES` (preserving `Essay` and adding `Algorithm`, `Experiment`, `Findings`), and `REPORT_REASONS` (10 reasons). Preserved `PLATFORM_NAME = "Commons"`, `POST_CHAR_LIMIT = 500`, `SCHEMA_VERSION = 1`, and `STORAGE_NAMESPACE = "commons:v1:"`.
- `src/data/types.ts` — Added `RecordOrigin = 'seed' | 'user' | 'system'`, `ProvenanceMetadata` (`origin?: RecordOrigin`, `seedVersion?: number`), optional provenance fields on 13 entity/relationship interfaces (`User`, `Post`, `LikeRecord`, `RepostRecord`, `BookmarkRecord`, `FollowRecord`, `TopicFollowRecord`, `MuteRecord`, `Notification`, `LibraryDoc`, `Report`, `AuditEntry`, `Topic`), `LibraryDocType` additive extension (`'Algorithm' | 'Experiment' | 'Findings'`), optional research metadata on `LibraryDoc` (`evidenceStatus`, `methodSummary`, `dataProvenance`, `reproducibility`), and optional `tombstoneReason?: string` on `Post`.
- `src/data/seed.ts` — Added `withSeedProvenance()` inside `createSeedState()` to tag seed-created entities and relationships with `origin: 'seed'` and `seedVersion: SCHEMA_VERSION` without altering any existing seed text, IDs, handles, or credentials.
- `src/services/authService.ts` — Tagged newly registered `User` accounts with `origin: 'user'`.
- `src/services/postsService.ts` — Tagged user-created `Post`, `LikeRecord`, `RepostRecord`, and `repost` wrapper `Post` records with `origin: 'user'`.
- `src/services/followService.ts` — Tagged created `FollowRecord`, `TopicFollowRecord`, and `MuteRecord` entries with `origin: 'user'`.
- `src/services/bookmarksService.ts` — Tagged created `BookmarkRecord` entries with `origin: 'user'`.
- `src/services/libraryService.ts` — Tagged submitted `LibraryDoc` records with `origin: 'user'` and accepted optional research metadata (`evidenceStatus`, `methodSummary`, `dataProvenance`, `reproducibility`).
- `src/services/reportsService.ts` — Tagged created `Report` records with `origin: 'user'`.
- `src/services/topicsService.ts` — Tagged created `Topic` records with `origin: 'user'`.
- `src/services/adminService.ts` — Tagged created `AuditEntry` records with `origin: 'user'`.
- `src/services/notificationsService.ts` — Added optional `origin: RecordOrigin = 'user'` parameter to `pushNotificationInternal()`.
- `src/services/simulator.ts` — Tagged ambient simulator `Post`, `LikeRecord`, and `Notification` records with `origin: 'system'`.
- `package.json` — Added `"test": "tsx --test src/services/migrations/__tests__/v1ToV2.test.ts"`.

### Created
- `src/services/migrations/v1ToV2.ts` — Pure, side-effect-free v1-to-v2 state migration engine (`migrateV1toV2`) plus manifest builder (`buildSeedManifest`) and signature/key helpers.
- `src/services/migrations/__tests__/v1ToV2.test.ts` — 14 unit tests covering synthetic v1 states, provenance classification, tombstones, preservation, reference cleanup, idempotency, immutability, and report accuracy.
- `docs/REPOSITIONING_NOTES.md` — This architecture and provenance summary.
- `docs/REPOSITIONING_TESTLOG.md` — Verification and test execution record.

### Explicitly Untouched
- `src/components/landing/HeroAircraftStage.tsx` — Preserved byte-for-byte (blob SHA-1 `44cd0c5b973302ac7ecef4fde79e463146a9f4df`, `20872` bytes).
- `src/services/storage.ts`, `src/App.tsx`, and landing page components — Startup migration is **not** connected and visible landing-page/seed wording is unchanged.

---

## 2. New Types & Centralized Constants

### `src/config.ts`
- `PLATFORM_TAGLINE`: `"Crash-game research, in the open."`
- `PLATFORM_DESCRIPTION`: `"Commons is a social network for people who study crash-game mechanics: RNG and hashing, provably fair verification, probability models and the data behind them."`
- `RESEARCH_DISCLAIMER`: `"Commons is for research and education only. It does not offer, facilitate or promote betting, and nothing here is gambling advice."`
- `TARGET_MIGRATION_SCHEMA_VERSION = 2`
- `CRASH_RESEARCH_TOPICS`: 18 crash-game research topics (`crash-algorithms`, `provably-fair`, `rng-prng`, `hashing-hmac`, `seeds-nonces`, `crash-distribution`, `probability-theory`, `statistical-modelling`, `house-edge`, `hypothesis-testing`, `historical-data`, `dataset-methods`, `randomness-testing`, `verification`, `reproducibility`, `model-critique`, `commitments`, `open-questions`).
- `LIBRARY_DOC_TYPES`: `Paper`, `Preprint`, `Essay`, `Dataset`, `Notes`, `Review`, `Algorithm`, `Experiment`, `Findings`.
- `REPORT_REASONS`: 10 structured moderation/research-integrity reasons.

### `src/data/types.ts`
- `RecordOrigin = 'seed' | 'user' | 'system'`
- `ProvenanceMetadata = { origin?: RecordOrigin; seedVersion?: number }`
- `EvidenceStatus = 'preliminary' | 'peer-reviewed' | 'replicated' | 'disputed' | 'archived'`
- `ReproducibilityStatus = 'reproducible' | 'partial' | 'unverified' | 'not-applicable'`
- All provenance and new Library research fields are **optional**, ensuring full backward compatibility with existing v1 `localStorage` records.

---

## 3. Provenance Design

Records are classified by explicit origin rather than author ID or ID-prefix heuristics:
- **`origin: 'seed'`** (`seedVersion: 1` for v1 seed): Assigned in `createSeedState()` across seed users, posts, likes, reposts, bookmarks, follows, topicFollows, mutes, notifications, library docs, reports, auditLog, and topics.
- **`origin: 'user'`**: Assigned by interactive member/moderator/admin services (`authService`, `postsService`, `followService`, `bookmarksService`, `libraryService`, `reportsService`, `topicsService`, `adminService`, and default `notificationsService`).
- **`origin: 'system'`**: Assigned by `simulator.ts` for ambient simulated posts, likes, and notifications so synthetic runtime activity is distinguishable from both seed data and real member actions.

---

## 4. Migration Architecture & 4-Step Seed-Detection Rules

`migrateV1toV2(sourceState, context)` in `src/services/migrations/v1ToV2.ts` is strictly pure:
- Performs zero reads/writes to `localStorage`, `window`, or `document`.
- Performs no network calls, no service calls, no `Math.random()`, and no `Date.now()` / `new Date()`.
- Deep-clones inputs via `clonePlain()` so neither `sourceState` nor `context` is mutated.

### 4-Step Classification Order (`classifyWithId` / `classifyRelationship`)
1. **Explicit `origin` & `seedVersion`**:
   - `origin === 'user'` or `origin === 'system'` -> `user_or_system` (always preserved).
   - `origin === 'seed'` with `seedVersion >= targetVersion` -> `target_seed` (already migrated; kept as-is).
   - `origin === 'seed'` with `seedVersion < targetVersion` -> `legacy_seed` (if no manifest, or known to manifest/target seed), otherwise `ambiguous_preserve`.
2. **Frozen `legacyManifest`**:
   - Checks exact ID/key membership in `context.legacyManifest` (built via `buildSeedManifest()` from a v1 seed snapshot/fixture).
3. **Exact Known Legacy IDs / Keys**:
   - Deterministic ID/handle/composite-key matching against the legacy manifest rather than ID prefixes (never infers seed status from `p_`, `u_`, `doc_`, etc.).
4. **Content Signature Fallback**:
   - `postContentSignature()` (`authorId::kind::normalizedBody`) for posts and normalized title matching for library docs when an un-tagged v1 record matches legacy seed content verbatim.
5. **Conservative Ambiguity Handling**:
   - When `legacyManifest` is absent and `origin` is missing, or when metadata is conflicting (e.g., `seedVersion` present without `origin`), records are classified as `ambiguous_preserve` — kept intact and counted in `report.ambiguousRecordsPreserved` with a warning.

---

## 5. Data-Preservation Decisions

- **Accounts & Credentials**: Demo/seeded accounts matching by ID or handle preserve user-edited profile fields where non-default, keep `mockPassword`, `role`, `status`, `email`, and `handle`, while updating seed bio/location/link/interestTopics only if untouched from legacy defaults. User-registered accounts and active `session` are preserved.
- **User Posts & Replies/Quotes**: User-created and system posts (even if authored by a seeded demo account) are preserved. If a surviving post replies to (`replyToId`) or quotes (`quoteOfId`) a removed legacy seed post, a non-destructive tombstone `Post` (`status: 'removed'`, `body: '[Original post removed during migration]'`, `tombstoneReason: 'seed_post_removed'`) is synthesized if not already present.
- **Repost Wrappers**: If a user's `kind: 'repost'` wrapper points (`repostOfId`) to a removed legacy seed post, the wrapper is dropped cleanly instead of leaving an empty repost shell; if the target survives, the wrapper is preserved.
- **Library Documents**: User-created and ambiguous Library docs (including `Essay` and new types) are preserved.
- **Relationships & Topics**: User/system `likes`, `reposts`, `bookmarks`, `follows`, `mutes`, and `topicFollows` are preserved. `topicFollows` on removed legacy topics are remapped via `context.topicMap` when mapped to an active target topic (deduplicating against existing target topic follows), or preserved via archived topic retention when `archiveRemovedSeedTopics !== false`.
- **Workspace Preferences & Cleanup**: `settings`, `notificationPrefs`, `drafts`, `recentSearches`, `theme`, and `simulatorEnabled` are preserved. Dangling `likes`, `reposts`, `bookmarks`, `follows`, `notifications`, `pinnedPostId`, `libraryDocId`, or `session.currentUserId` pointing to non-existent entities are cleaned up and counted in `report.invalidReferencesHandled`.
- **Idempotency**: Running `migrateV1toV2` on an already-migrated v2 state yields `alreadyAtTargetVersion: true`, zero mutations/duplicates, and byte-equivalent state across repeated runs.

---

## 6. Ambiguities, Workspace Limitations & Pending Items

1. **Git Environment**: This AI Studio sandbox does not contain a `.git` directory or remote repository (`fberwa4-droid/Crash-game`), so branch `feature/crash-research-repositioning` could not be checked out or committed here.
2. **Missing Pre-Existing Docs & Browser Fixtures**: `docs/REPOSITIONING_BASELINE.md`, `docs/REPOSITIONING_AUDIT.md`, and `src/data/__fixtures__/v1-*.json` were not present in the workspace. All migration verification in Task 1 was therefore executed against **synthetic v1 test states** rather than captured browser `localStorage` fixtures.
3. **Why Startup Migration Remains Disabled**: `migrateV1toV2` is intentionally isolated behind `TARGET_MIGRATION_SCHEMA_VERSION = 2` while active runtime remains on `SCHEMA_VERSION = 1` (`commons:v1:`). Startup migration should only be wired once real browser v1 fixtures (`v1-pristine.json`, `v1-user-data.json`) and the final v2 crash-research seed dataset + manifest are authored and verified in later Phase 2 tasks.
