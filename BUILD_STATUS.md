# Commons — Build Status

## Completed Stages
- **Stage 1: Foundation + Landing Page** — Complete

## Route List
- `/` — Landing page (Hero + Aircraft animation, Ideas in motion live strip, Two ways to read, How it works, Topics marquee, Principles, Final CTA & Footer)
- `/about` — Static page (About Commons)
- `/guidelines` — Static page (Community Guidelines)
- `/terms` — Static page (Terms of Use)
- `/privacy` — Static page (Privacy Notice)
- `/home` — Temporary stub (arrives in Stage 2)
- `/post/:id` — Temporary stub (arrives in Stage 2)
- `/explore` — Temporary stub (arrives in Stage 3; supports `?topic=` and `?q=`)
- `/u/:handle`, `/u/:handle/followers`, `/u/:handle/following` — Temporary stubs (arrives in Stage 3)
- `/notifications` — Temporary stub (arrives in Stage 4)
- `/bookmarks` — Temporary stub (arrives in Stage 4)
- `/settings` — Temporary stub (arrives in Stage 4)
- `/library`, `/library/new`, `/library/:id` — Temporary stubs (arrives in Stage 5)
- `/admin/*` — Temporary stub with role-access enforcement (`You don't have access` for guests/members; arrives in Stage 6)

## Components List
### Shared UI Kit (`src/components/ui`)
- `Avatar.tsx`, `Badge.tsx`, `BrandMark.tsx`, `Button.tsx`, `Chip.tsx`, `ConfirmDialog.tsx`, `EmptyState.tsx`, `IconButton.tsx`, `Menu.tsx`, `Modal.tsx`, `Sheet.tsx`, `Skeleton.tsx`, `Tabs.tsx`, `Toast.tsx`

### Landing (`src/components/landing`)
- `LandingNav.tsx`, `HeroAircraftStage.tsx`, `IdeasInMotion.tsx`, `TwoWaysToRead.tsx`, `HowItWorks.tsx`, `TopicsMarquee.tsx`, `PrinciplesSection.tsx`, `FinalCtaAndFooter.tsx`

### Layout & Features
- `src/components/layout/StageStubPage.tsx`
- `src/features/auth/AuthModal.tsx`
- `src/features/feed/PostCard.tsx`

### Hooks & Utilities
- `src/hooks/useAuth.tsx`, `src/hooks/useBrand.ts`, `src/hooks/useReducedMotion.ts`, `src/hooks/useStore.ts`, `src/hooks/useTheme.ts`, `src/hooks/useToast.tsx`
- `src/utils/format.ts`

## Services List (`src/services`)
- `store.ts` — Central reactive store with cross-tab `storage` sync and derived counts
- `storage.ts` — `commons:v1:*` localStorage persistence, schema versioning, quota error handling
- `latency.ts` — 60–250ms simulated async latency and `ServiceError`
- `imageUtils.ts` — Client-side image downscaling (max 1280px, JPEG 0.8)
- `authService.ts`, `postsService.ts`, `usersService.ts`, `followService.ts`, `notificationsService.ts`, `bookmarksService.ts`, `libraryService.ts`, `reportsService.ts`, `adminService.ts`, `topicsService.ts`, `searchService.ts`, `settingsService.ts`
- `simulator.ts` — Ambient community simulator (45-post pool, pauses when tab hidden)

## localStorage Keys & Schema Version
- **Schema Version**: `1` (`commons:v1:schemaVersion`)
- **Namespace Keys**: `commons:v1:session`, `commons:v1:users`, `commons:v1:posts`, `commons:v1:interactions`, `commons:v1:follows`, `commons:v1:notifications`, `commons:v1:bookmarks`, `commons:v1:library`, `commons:v1:reports`, `commons:v1:auditLog`, `commons:v1:topics`, `commons:v1:settings`, `commons:v1:notificationPrefs`, `commons:v1:drafts`, `commons:v1:recentSearches`, `commons:v1:theme`, `commons:v1:simulatorEnabled`

## Known Limitations (Stage 1)
- Stages 2–6 app shell and interior routes (`/home`, `/post/:id`, `/explore`, `/u/:handle`, `/notifications`, `/bookmarks`, `/settings`, `/library/*`, `/admin/*`) currently render clean temporary stage stubs and will be replaced in their respective stages.
- All persistence and authentication are browser-local mock services (`localStorage`) for demonstration purposes.
