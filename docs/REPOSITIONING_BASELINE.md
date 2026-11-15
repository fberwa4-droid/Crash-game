# Repositioning baseline

## Repository snapshot

- Repository: [fberwa4-droid/Crash-game](https://github.com/fberwa4-droid/Crash-game)
- Default branch: `main`
- Baseline commit: [`940b4b5ad288fd70fffa1e5837f53ff6daa633c8`](https://github.com/fberwa4-droid/Crash-game/commit/940b4b5ad288fd70fffa1e5837f53ff6daa633c8)
- Baseline commit message: `feat: initialize project foundation`
- Baseline tree SHA: `02db4ee22ff6a7e41cc7342174323cdec9a4dc7d`
- Working branch: [`feature/crash-research-repositioning`](https://github.com/fberwa4-droid/Crash-game/tree/feature/crash-research-repositioning)
- Branch state at audit start: already existed and pointed to the same baseline commit; it was not recreated or force-moved.
- Repository working-tree edits before this audit: none made by this audit.

## Build status at baseline

`BUILD_STATUS.md` reports **Stage 1: Foundation + Landing Page — Complete**. Interior routes for Stages 2–6 remain stubs. Authentication and persistence are browser-local mock services.

Build tooling from `package.json`:

| Script | Command | Meaning |
|---|---|---|
| dev | `vite --port=3000 --host=0.0.0.0` | Vite development server |
| build | `vite build` | Production build |
| lint | `tsc --noEmit` | TypeScript check; not a separate ESLint run |
| test | Not defined | No test script is configured |
| preview | `vite preview` | Preview production build |

The repository tree has no `.github/workflows` directory. The baseline commit has no reported combined status checks and no associated GitHub Actions workflow runs. This means **no remote CI result is available**; it does not prove that the project has passed a local build.

This audit did not have a local checkout or a browser session connected to the GitHub repository. Therefore `npm run lint`, `npm run build`, UI smoke tests, and screenshot capture were **not run**. Do not interpret “Stage 1 complete” in `BUILD_STATUS.md` as a fresh test result.

## Stage 1 inventory recorded from BUILD_STATUS.md

- Landing page: `/`
- Static pages: `/about`, `/guidelines`, `/terms`, `/privacy`
- Stubs: `/home`, `/post/:id`, `/explore`, `/u/:handle` and follower/following routes, `/notifications`, `/bookmarks`, `/settings`, `/library/*`, `/admin/*`
- Landing components: `LandingNav`, `HeroAircraftStage`, `IdeasInMotion`, `TwoWaysToRead`, `HowItWorks`, `TopicsMarquee`, `PrinciplesSection`, `FinalCtaAndFooter`
- Shared UI kit: Avatar, Badge, BrandMark, Button, Chip, ConfirmDialog, EmptyState, IconButton, Menu, Modal, Sheet, Skeleton, Tabs, Toast
- Stage 1 feature components: AuthModal and PostCard
- Store/services: store, storage, latency, image utilities, auth, posts, users, follows, notifications, bookmarks, library, reports, admin, topics, search, settings, ambient simulator

## Persistence keys recorded at baseline

Namespace: `commons:v1:`

- `schemaVersion`
- `session`
- `users`
- `posts`
- `interactions` (contains likes, reposts, topic follows, mutes)
- `follows`
- `notifications`
- `bookmarks`
- `library`
- `reports`
- `auditLog`
- `topics`
- `settings`
- `notificationPrefs`
- `drafts`
- `recentSearches`
- `theme` (stored separately as a plain theme value, not through the JSON state writer)
- `simulatorEnabled`

The source currently declares schema version 1. No seed-content version key exists.

## Aircraft animation — DO NOT TOUCH

The aircraft is self-contained in:

| File | Git blob SHA (baseline) | Size |
|---|---|---:|
| `src/components/landing/HeroAircraftStage.tsx` | `44cd0c5b973302ac7ecef4fde79e463146a9f4df` | 20,872 bytes |

This SHA is the Git blob object hash for the file content (the same object hash reported by `git hash-object` for those bytes). The component includes the SVG aircraft, propeller, flight/trail/multiplier rendering, animation loop and responsive/lifecycle handling. It imports the shared reduced-motion hook. No separate aircraft SVG asset or aircraft-only stylesheet was found in the repository tree.

The hero text and animation stage are composed separately in `src/pages/LandingPage.tsx`; the page renders `<HeroAircraftStage />` after the text block. Future copy/section edits should be made outside the aircraft component. The file above is the byte-for-byte DO-NOT-TOUCH guard.

## Browser-generated baseline fixtures — outstanding

The required real browser snapshots have **not** been captured in this environment:

- `src/data/__fixtures__/v1-pristine.json`: outstanding
- `src/data/__fixtures__/v1-user-data.json`: outstanding

The GitHub connection exposes repository files and Git metadata, not the user's running browser, its localStorage, or the app preview. Reconstructing JSON from the TypeScript seed source would not be a real first-load browser snapshot and would omit the live user-activity scenario. No fabricated fixtures have been added.

See [`src/data/__fixtures__/README.md`](../src/data/__fixtures__/README.md) for the safe export procedure. The migration audit must not be finalized or seed detection approved until these fixtures are inspected.

## Screenshot baseline — outstanding

No browser automation/headless-browser runner is configured in the repository, and this environment had no attached app browser session. Landing screenshots at 390, 768 and 1440px in light and dark, plus rendered-text captures, remain outstanding. Manual browser review or screenshots supplied from the user's app preview are needed.

## Baseline guardrails

- Do not edit `src/components/landing/HeroAircraftStage.tsx`.
- Do not change any source files during Phase 1.
- Phase 1 repository changes are documentation/fixture instructions only.
- No migration or seed replacement has been run.
