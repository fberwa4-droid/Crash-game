# Repositioning baseline

## Repository snapshot
- Repository: [fberwa4-droid/Crash-game](https://github.com/fberwa4-droid/Crash-game)
- Default branch: `main`
- Baseline commit: [`940b4b5ad288fd70fffa1e5837f53ff6daa633c8`](https://github.com/fberwa4-droid/Crash-game/commit/940b4b5ad288fd70fffa1e5837f53ff6daa633c8)
- Baseline tree SHA: `02db4ee22ff6a7e41cc7342174323cdec9a4dc7d`
- Feature branch: `feature/crash-research-repositioning`; it already existed at the baseline commit when Phase 1 began.
- Audit-created commits are documentation-only. No application source was edited.

## Build status
`BUILD_STATUS.md` records Stage 1 (Foundation + Landing Page) as complete. Routes for Stages 2–6 are stubs. Auth and persistence are browser-local mock services.

From `package.json`:
- `dev`: `vite --port=3000 --host=0.0.0.0`
- `build`: `vite build`
- `lint`: `tsc --noEmit` (TypeScript check, not ESLint)
- `preview`: `vite preview`
- No test script or test runner is configured.

The baseline commit has no reported combined status checks and no GitHub Actions runs. The root tree has no `.github/workflows`. Local lint/build/browser tests were not run: this GitHub connection provides repository access but not a local checkout or browser runtime. Stage 1 completion is the project's recorded status, not a fresh test result.

## localStorage schema v1
Namespace `commons:v1:`; schema version 1. Keys: `schemaVersion`, `session`, `users`, `posts`, `interactions` (likes/reposts/topicFollows/mutes), `follows`, `notifications`, `bookmarks`, `library`, `reports`, `auditLog`, `topics`, `settings`, `notificationPrefs`, `drafts`, `recentSearches`, `theme`, `simulatorEnabled`.

## Aircraft animation — DO NOT TOUCH
- File: `src/components/landing/HeroAircraftStage.tsx`
- Baseline Git blob SHA: `44cd0c5b973302ac7ecef4fde79e463146a9f4df`
- Size: 20,872 bytes
- Contains the SVG and animation logic in one component; imports shared reduced-motion hook. No separate aircraft SVG asset or aircraft-only stylesheet was found.
- Hero copy and aircraft are composed separately in `src/pages/LandingPage.tsx`; `<HeroAircraftStage />` follows the text block. Keep any explanatory text outside the component.
- The recorded Git blob SHA equals the Git SHA-1 content object hash used by `git hash-object`; recheck it after later phases.

## Browser fixtures and visual baseline
Not yet captured. The actual app browser/localStorage is not exposed through repository access. Do not synthesize runtime fixtures from TypeScript seed data.
- `src/data/__fixtures__/v1-pristine.json`: outstanding
- `src/data/__fixtures__/v1-user-data.json`: outstanding
- 390/768/1440 light/dark screenshots and rendered text: outstanding
- Fresh boot, UI smoke, responsive horizontal overflow, local lint/build: outstanding

No source changes, migration, or seed replacement occurred during Phase 1.
