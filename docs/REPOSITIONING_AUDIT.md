# Repositioning audit — Phase 1

> Scope: source and Git-history audit only. No application source has been edited. Browser-runtime fixture capture and visual checks remain outstanding; see the explicit blockers at the end.

## 1. Storage namespace, keys, and schema

**Source:** `src/config.ts:1-9`, `src/services/storage.ts:18-20, 76-127, 128-170`, `src/services/store.ts:8-18, 41-45`.

- Namespace: `commons:v1:` (`config.ts:4`).
- Schema version: `1` (`config.ts:5`).
- Keys: `schemaVersion`, `session`, `users`, `posts`, `interactions`, `bookmarks`, `follows`, `notifications`, `library`, `reports`, `auditLog`, `topics`, `settings`, `notificationPrefs`, `drafts`, `recentSearches`, `theme`, `simulatorEnabled`.
- `interactions` stores likes, reposts, topic follows and mutes together (`storage.ts:83-95, 135-140)).
- `theme` is read/written separately; `readTheme` accepts raw or JSON-encoded `light`, `dark`, or `system` (`storage.ts:48-73)).
- Session contains `currentUserId` and `loggedInAt` (`types.ts:203-206)).
- User, post, follow, interaction, notification, bookmark, topic, library, report, audit, settings, draft, search and simulator state are represented in `CommonsStoreState` (`types.ts:208-230)).
- Store synchronizes tabs through the browser `storage` event (`store.ts:11-17`).

**Critical migration defect:** if schema key is absent, storage writes a fresh seed. If a lower schema is found, it merely changes `state.schemaVersion` and writes the same state (`storage.ts:76-81, 120-124`). There is no content migration, backup, transaction, lock, recovery, or seed-content version marker. Each key write is independent; `safeWrite` returns a boolean but `saveStoreState` does not aggregate failures (`storage.ts:30-45, 128-151`).

## 2. ID formats and provenance evidence

**Source:** `src/services/latency.ts:23-25`; `authService.ts:96`; `postsService.ts:154, 306`; `simulator.ts:62`; `libraryService.ts:57`; `reportsService.ts:37`; `notificationsService.ts:52`; `adminService.ts:26`; `topicsService.ts:20-42); `src/data/seed.ts).

Runtime `makeId(prefix)` returns `{prefix}_{Date.now().toString(36)}_{Math.random().toString(36).slice(2,7)}`. It is timestamp/random based, not cryptographically generated. Actual service prefixes:

| Entity | Seed IDs / pattern | Runtime-created pattern |
|---|---|---|
| Users | `u_mirela`, `u_tomas`, …; demo IDs `u_demo_member`, `u_demo_mod`, `u_demo_admin` | `u_<base36 timestamp>_<5 random chars>` |
| Seed posts | `p_001` … `p_060` | `p_<timestamp>_<random>` |
| Repost wrapper post | None in fixed seed post list as wrapper? Seed post kinds include a repost record; runtime wrapper | `rp_<timestamp>_<random>` |
| Ambient simulator posts | No fixed IDs; text pool entries have author/body/tags only | `p_sim_<timestamp>_<random>` |
| Library docs | `doc_01` … `doc_10`, `doc_pending_01` … `doc_pending_06` | `doc_<timestamp>_<random>` |
| Notifications | `n_01` … `n_25` | `notif_<timestamp>_<random>` |
| Reports | `r_01` … `r_08` | `r_<timestamp>_<random>` |
| Audit entries | `a_01` … `a_12` | `audit_<timestamp>_<random>` |
| Topics | Fixed slugs | Slug derived from normalized topic name |
| Follows, likes, repost records, bookmarks, topic follows, mutes | No record ID | Composite fields (e.g. userId + postId, followerId + followingId) |

The fixed seed ID patterns are distinct from the current `makeId` output patterns for users, posts, docs, notifications, reports and audit entries. However:
- This is only source-level evidence, not a proof from real browser-generated fixture samples.
- Seed relationship records have **no ID or origin field**. A user can create records involving seed entities; records cannot reliably be classified by an ID prefix.
- The ambient simulator creates posts with a separate `p_sim_` prefix and may add likes/notifications on a user's posts. These are generated background records, not authored by the signed-in user.
- No model has an `origin`, `isSeed`, or `seedVersion` field.
- The current seed timestamps use `Date.now()` relative helpers, so seed timestamps change on each fresh seed.

**Conclusion:** IDs can be used as a secondary seed signal for fixed-ID entity collections only after fixture verification. Never use ID patterns to classify relationship records. For uncertain records, preserve them.

## 3. Seeded accounts and demo accounts

**Source:** `src/data/seed.ts:51-340`; `src/services/authService.ts:128-149`; `src/features/auth/AuthModal.tsx:111-119, 320-350`.

There are 15 fixed seed accounts: 12 non-demo member accounts plus 3 explicit demo accounts. Roles are 13 members, 1 moderator, 1 admin.

| ID | Handle | Email | Role |
|---|---|---|---|
| `u_mirela` | `mirela_okafor` | `mirela@commons.example` | member |
| `u_tomas` | `tomas.verhagen` | `tomas@commons.example` | member |
| `u_lin` | `lin_ashworth` | `lin@commons.example` | member |
| `u_priya` | `priya_n` | `priya@commons.example` | member |
| `u_amani` | `dr_amani` | `amani@commons.example` | member |
| `u_sam` | `sam_ito` | `sam@commons.example` | member |
| `u_noor` | `noor_haddad` | `noor@commons.example` | member |
| `u_bellweather` | `c.bellweather` | `claire.b@commons.example` | member |
| `u_rafael` | `rafael_montes` | `rafael@commons.example` | member |
| `u_kenji` | `kenji_t` | `kenji@commons.example` | member |
| `u_claire_d` | `claire_dubois` | `dubois@commons.example` | member |
| `u_soren` | `soren_k` | `soren@commons.example` | member |
| `u_demo_member` | `elena_vance` | `member@commons.example` | member |
| `u_demo_mod` | `mira_chen_mod` | `mod@commons.example` | moderator |
| `u_demo_admin` | `julian_ross` | `admin@commons.example` | admin |

The three demo accounts use the mock password `demo-password`; the other seeded accounts use `password123`. These are client-side demo credentials, not secure authentication. Demo login selects accounts by fixed IDs. Registration creates a new user, persists the session immediately and generates an ID with `makeId('u')`.

User profile fields that can be changed by the owner through `usersService.updateOwnProfile`: displayName, bio, location, link, interestTopics, avatarSeed (`usersService.ts:7-13, 46-70`). Handle, email, password, role, status, joinedAt, bannerSeed, verified, base counts and pinnedPostId are not changed by that service. Admin service can change role/status.

## 4. Seed modules, entity counts, and simulator

**Source:** `src/data/seed.ts:30-48, 51-340, 342-645, 647-1657, 1659-1890, 1891-2027`.

| Collection | Count | Notes |
|---|---:|---|
| Topics | 18 | Fixed slug/name list; broad interdisciplinary fields |
| Users | 15 | Includes three demo roles |
| Library documents | 16 | 10 published-style fixed docs + 6 pending docs |
| Posts | 60 | 43 original, 14 replies, 2 quotes, 1 repost by the current source scan |
| Simulator text pool | 45 | Distinct authored text templates; no fixed post IDs |
| Follows | 11 | Includes demo member's seven curated follows and cross-follows |
| Topic follows | 3 | All seeded for demo member |
| Likes | 5 | Includes demo member and seed-to-seed likes |
| Reposts records | 1 | Demo member on a seed post |
| Bookmarks | 4 | Two post targets and two Library docs |
| Notifications | 25 | IDs n_01–n_25; mostly addressed to demo member |
| Reports | 8 | IDs r_01–r_08 |
| Audit entries | 12 | IDs a_01–a_12 |
| Mutes | 0 | Empty in `createSeedState` |
| Drafts | 0 | Empty in `createSeedState` |
| Recent searches | 3 | Seeded values: epistemology, naive averaging, complex systems |

All 60 fixed seed posts are currently `visible`; no fixed seed post with `status: 'removed'` was found. The simulator runs at app startup from `App.tsx`, schedules every 20–40 seconds, pauses while the tab is hidden, and inserts pool content with `p_sim_` IDs. If a current user is signed in, it may also like one of that user's posts and create a notification (35% chance per tick, subject to the post/like conditions). The pool has 45 entries.

**Major repositioning finding:** the current topic list, user bios, fixed posts, Library titles/abstracts, and simulator pool are broad interdisciplinary material (e.g. epistemology, neuroscience, climate, music theory, economics). The repositioning must replace all of this seed content, not merely change the hero copy.

## 5. Old positioning copy inventory

**Source:** `src/pages/LandingPage.tsx:24, 46-96, 141-160`; `src/components/landing/IdeasInMotion.tsx:70-77`; `TwoWaysToRead.tsx:27-34`; `HowItWorks.tsx:16-19, 140-180, 238-241, 300-307`; `TopicsMarquee.tsx:27-35`; `PrinciplesSection.tsx:4-24`; `FinalCtaAndFooter.tsx:91-95`; `StaticPages.tsx:51-110`; `AuthModal.tsx:132, 261`; `index.html:5-15`; `metadata.json`.

Locations that need copy review:
- Browser title and landing title: `Commons — Think out loud. Together.` (LandingPage effect and index.html).
- Metadata description/OpenGraph description: public square for ideas/research; post a thought/follow curious minds.
- Landing hero pill: “Open to everyone, thinking in public”.
- Hero H1: “Think out loud. Together.”
- Hero lead: “public square for ideas, research and the questions in between”; “follow curious minds”.
- Guest line: “Guests can read everything. Join to reply, like and post.”
- Ideas strip heading: “Ideas in motion”; caption “Preview of the For you feed.”
- Feed tabs: “Two ways to read”; For you caption describes a cross-disciplinary stream; Following caption refers to thinkers.
- How-it-works: “Fast public conversation paired with deliberate, reviewed research”; sample epistemology question; placeholder “Share an observation, question, or counterexample…”; “Publish real research”; sample preprint “Metaphors We Compute By”; “Follow minds, not metrics”; “intellectual neighborhood across disciplines.”
- Topics band: “Across disciplines”; browse topics and follow fields over time.
- Principles: “Public identities”, “Conversation in the open”, “Reviewed research”, “Short posts, long work”; multidisciplinary references.
- Footer: “A public square for ideas, research, and thinking together across disciplines.”
- About page: multidisciplinary thinking, scientists/philosophers/engineers/historians, thinkers, manuscripts and essays.
- Terms: “public intellectual forum”.
- Guidelines: general evidence/argumentation language (review for crash-research scope).
- Privacy: local-only mock persistence statement; must stay accurate to the actual implementation.
- Auth modal: “Public square for ideas and reviewed research”; “follow thinkers”.
- Navigation labels and generic action labels should be reviewed only where their semantics need to change; preserve useful social-network actions.

No separate OpenGraph image asset or social preview configuration was identified in the root metadata. `metadata.json` is a small app metadata file and should be checked in Phase 2 alongside `index.html`.

## 6. LibraryDoc schema and type usage

**Source:** `src/data/types.ts:111-136`; `src/services/libraryService.ts:5-12, 41-74`; `seed.ts:342-645`; `PostCard.tsx:97-101`.

Current `LibraryDocType` union: `Paper | Preprint | Essay | Dataset | Notes | Review`. Keep `Essay` valid for backwards compatibility. `LibraryDoc` includes id, title, type, authorIds, abstract, bodyMarkdown, topics, version, createdAt, status, optional reviewNote/fileMeta, citationData, and baseBookmarksCount.

Current seed type distribution: Essay 4, Preprint 3, Paper 3, Dataset 1, Notes 3, Review 2. All submissions are created as `pending` and store the current user's ID as author; published listing filters by status. PostCard only embeds a linked Library doc when the document is published. There is no provenance/evidence-status/method-summary/data-provenance/reproducibility field in the current interface.

New types requested for Phase 2 (Algorithm, Experiment, Findings) should be additive. Do not remove Essay or reinterpret existing user-submitted documents.

## 7. Post rendering, references, visibility and counts

**Source:** `src/features/feed/PostCard.tsx:59-105, 371-450`; `src/services/postsService.ts:50-94`; `src/services/store.ts:62-96`.

- PostCard resolves repost wrapper target, author, parent, quote and linked Library doc from current state.
- If repost target is missing, `displayPost` is null and the card returns null.
- If author is missing or display post is not visible, the card returns null.
- If reply parent is missing, parentAuthor is undefined and the “Replying to” header is omitted; no tombstone UI is currently rendered in this card excerpt.
- If quote target/author is missing or quote target is removed, the embedded quote block is omitted.
- If linked Library doc is missing or not published, its embedded card is omitted.
- Post list service filters out non-visible posts, muted users/topics, and repost wrappers whose target is missing, removed, or muted.
- `getPostCounts` derives likes/reposts/bookmarks from base counts plus records; replies use max(baseRepliesCount, count of visible replies); quotes count visible quote posts. Missing post yields all zero counts.
- `getUserFollowCounts` derives base follower/following counts plus follow records.
- A post authored by a seeded user is not automatically seed-only: the user can create real posts. The simulator also creates generated posts attributed to seed authors. Migration must distinguish by exact fixed post ID/origin evidence, not author alone.

## 8. Auth modal, fields, and report reasons

**Source:** `src/features/auth/AuthModal.tsx:13-35, 159-261, 270-354`; `src/services/authService.ts:5-15, 55-126`; `src/features/feed/PostCard.tsx` report dialog; `src/services/reportsService.ts:5-49`.

Registration fields: display name, handle, email, password, optional invite code when invite-only, plus acknowledgement checkbox that identity/posts/replies are public and there are no DMs. The service requires display name >=2 chars, handle 3–24 chars matching lowercase alphanumeric/dot/underscore after normalization, valid email, password >=6 chars, public acknowledgement, and invite code if invite-only. The modal offers demo member/moderator/admin quick access.

Report UI currently accepts a free-text reason with a minimum of four trimmed characters; it does not use a fixed reason list. The report service merges multiple reporters into an existing open report for the same target. Phase 2 report reason taxonomy is a new controlled list, but must preserve/report existing legacy free-text reasons rather than losing them.

## 9. Aircraft component boundary and hero composition

**Source:** `src/components/landing/HeroAircraftStage.tsx`; `src/pages/LandingPage.tsx:147-155`; `src/hooks/useReducedMotion.ts`.

- The aircraft animation is in one self-contained React component with internal SVG, SVG filters, motion state, multiplier and flight animation logic.
- The component imports the shared reduced-motion hook. The hook itself is shared behavior and is not an aircraft-only file.
- No separate aircraft image asset or aircraft-specific stylesheet is present in the repository tree.
- LandingPage renders hero copy first and then `<HeroAircraftStage />` in a separate wrapper. Subsequent content sections render after the hero.
- Baseline Git blob SHA: `44cd0c5b973302ac7ecef4fde79e463146a9f4df` (file path `src/components/landing/HeroAircraftStage.tsx`).
- DO NOT TOUCH this component. Do not move hero text into it or change animation internals. A separate explanatory line can be placed in LandingPage outside the component.

## 10. Test tooling, lint, CI

**Source:** `package.json`, root tree, baseline GitHub commit status and workflow query.

- Vite build script exists.
- “lint” is only `tsc --noEmit`.
- No `test` script, test framework, test directory, or GitHub Actions workflow exists in the baseline tree.
- Baseline combined status had no statuses; no GitHub Actions runs were returned.
- No local commands or browser tests were executed by this audit because the connected GitHub interface provided file/Git access only, not a local execution/browser runtime.

Phase 2 must add focused unit tests for migration (using the repository's chosen runner) and keep typecheck/build gates explicit. Do not report test pass until actually run.

## 11. Risks, unknowns and migration strategy

1. **No seed origin marker.** Seed and user-created records share the same interfaces. Add optional `origin`/seed version fields in Phase 2; do not infer origin solely from author IDs.
2. **Relationship provenance is fundamentally ambiguous.** Follows/likes/reposts/bookmarks/topic follows/mutes have no IDs or origin marker. Existing seeded relationship values can overlap with real user actions. Compare fixture records; preserve unknown records by default.
3. **Demo accounts are also normal user records.** Keep all three IDs, handles, display names, emails, roles, status, joinedAt and profile identity stable. Do not replace demo accounts with new IDs.
4. **Simulator-generated posts are not hand-authored user posts.** They use `p_sim_` IDs and seed authors; simulator-generated likes/notifications may involve user-authored posts. Preserve user-authored posts and their linked records; classify simulator posts separately only with evidence.
5. **Seed content changes on each reset.** Timestamps use relative `Date.now()` helpers. Exact JSON equality of seed data across resets is not expected.
6. **Schema migration currently just bumps the version.** It must be replaced by a pure migration plus backup, lock, staged writes, recovery, and markers written last.
7. **Partial writes possible.** `saveStoreState` writes many keys independently and does not abort if one write fails. Migration needs a backup and a clear failure policy.
8. **Malformed storage is silently defaulted.** `safeRead` returns fallback on parse errors; migration must preserve/report malformed raw values before writing replacement state.
9. **Simulator auto-starts globally.** It runs on all routes unless disabled and can change localStorage during fixture capture. Disable it in controlled fixture capture or account for generated posts.
10. **Current Stage 1 UI cannot exercise all planned records.** Interior routes are stubs. Library submission, full settings, drafts, profile, notifications, and admin review may not be available through the UI yet. Do not fake those records.
11. **No runtime screenshots or rendered-text baseline.** The responsive layout and light/dark behavior are not visually verified in this audit.
12. **Report reasons are free text today.** Controlled reasons need compatibility with old reports.
13. **Library Essay is used in seed and typed union.** Preserve it; add new categories additively.
14. **PostCard currently drops missing repost target cards and hides missing parent/quote blocks.** If Phase 2 introduces tombstones, test this explicitly and avoid breaking normal threads.
15. **Content accuracy matters.** Crash-game distribution and provably-fair material must include assumptions and verification method. Avoid presenting synthetic data as real observations or implying a prediction of future outcomes.

### Recommended seed-detection evidence order

1. Explicit `origin` marker after Phase 2 introduces it.
2. Frozen manifest of fixed v1 seed IDs captured from this exact baseline.
3. ID pattern only for entity collections where it is proven to discriminate from at least three real user-created examples per entity type in the user-data fixture.
4. Exact normalized content signatures only as a secondary check, with author and target context.
5. Anything ambiguous remains preserved (“when in doubt, keep the data”).

For relationship records, do not delete on ID-pattern rules. Remove only records whose seed provenance is explicitly proven, or records that become invalid because their referenced target is intentionally removed. When replacing seed posts, preserve user replies/quotes by retaining tombstones for removed parents/targets; remove user repost wrappers only when their sole target is removed, as defined by the approved migration policy.

## 12. Phase 1 blockers / next required inputs

- Capture and inspect `src/data/__fixtures__/v1-pristine.json` from a clean browser origin.
- Capture and inspect `src/data/__fixtures__/v1-user-data.json` using a disposable account and actual UI/service actions; redact dummy credentials only, never use real credentials.
- Verify at least three user-generated IDs for each entity type that can be generated by current services. For entity types not exposed by Stage 1 UI, record that they are unavailable.
- Run the app and capture 390/768/1440 screenshots in light and dark, or record manual review notes.
- Run `npm run lint` and `npm run build` in a local project runtime.
- Recheck the aircraft blob SHA after any later phase; it must remain unchanged.

**Phase 1 is not complete until the browser-dependent fixture and UI checks are either supplied or explicitly waived by the user. No Phase 2 work is authorized by this audit.**
