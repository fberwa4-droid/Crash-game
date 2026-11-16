# Commons — Repositioning Test Log (Phase 2, Task 1)

## Environment Notes
- Node runtime: `v22.23.2`
- Test runner: `tsx --test` (`tsx` via `package.json` `"test"` script)
- Git repository status: No `.git` repository exists in `/app/applet` sandbox (`git status` exited 128: `not a git repository`). No branch checkout or commit was performed in this environment.
- Real browser fixtures (`src/data/__fixtures__/v1-pristine.json`, `v1-user-data.json`): **Not present in workspace — not executed.**

---

## Executed Checks & Observed Results

### 1. Pure Migration Unit Tests (`npm test`)
**Command:** `npm test` (`tsx --test src/services/migrations/__tests__/v1ToV2.test.ts`)  
**Result:** **PASS — 14 / 14 passed, 0 failed**

Covered synthetic test cases:
1. `1. Fresh synthetic state receives v2 seed entities cleanly` — PASS
2. `2. Pristine synthetic v1 state replaces legacy seed cleanly` — PASS
3. `3. User-created account and active session are preserved` — PASS
4. `4. User-created posts (with or without explicit origin, even by seeded account) are preserved` — PASS
5. `5. Reply and quote references to removed seed posts are preserved with usable tombstones` — PASS
6. `6. User repost wrapper is removed when target seed post is removed, kept when target survives` — PASS
7. `7. Demo account identities and credentials are strictly preserved while seed bio updates` — PASS
8. `8. User Library documents (including Essay and new types) are preserved` — PASS
9. `9. User settings, notificationPrefs, drafts, recentSearches, theme, and simulatorEnabled are preserved` — PASS
10. `10. Ambiguous relationships are preserved without ID-prefix heuristics and reported` — PASS
11. `11. Invalid references (dangling likes, bookmarks, notifications, pinnedPostId, libraryDocId, session) are handled cleanly` — PASS
12. `12. Idempotency: running migration twice produces identical state and zero duplicates` — PASS
13. `13. Input immutability: source state and context are never mutated` — PASS
14. `14. Migration report accuracy & topic follow remapping/preservation` — PASS

### 2. TypeScript Typecheck (`lint_applet`)
**Command:** `tsc --noEmit`  
**Result:** **PASS — 0 errors**

### 3. Production Build (`compile_applet`)
**Command:** `npm run build` (`vite build`)  
**Result:** **PASS — build succeeded**

### 4. Purity & Startup Isolation Verification
- Verified `src/services/migrations/v1ToV2.ts` only imports types from `../../data/types` and `TARGET_MIGRATION_SCHEMA_VERSION` from `../../config`.
- Grep for `localStorage|window|document|Date\.now|new Date|Math\.random|crypto\.|fetch|XMLHttpRequest` in `src/services/migrations/v1ToV2.ts` returned zero code usages (only a warning string containing the English word `"document"` on line 558).
- Verified `src/services/storage.ts` still reads `SCHEMA_VERSION` (`1`) and `STORAGE_NAMESPACE` (`commons:v1:`), and `loadStoreState()` does not call `migrateV1toV2`.

### 5. Protected Aircraft Asset Check
**Check:** Git-equivalent SHA-1 blob hash of `src/components/landing/HeroAircraftStage.tsx`  
**Result:** `44cd0c5b973302ac7ecef4fde79e463146a9f4df` (`20872` bytes) — **unchanged**.

---

## Pending / Not Executed
- Real v1 browser fixture migration tests (awaiting exported browser fixtures under `src/data/__fixtures__/`).
- Git branch creation / commit on `feature/crash-research-repositioning` (requires local git repo / remote).
