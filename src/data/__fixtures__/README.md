# v1 browser-storage fixtures

Capture these from the actual Stage 1 app; do not synthesize them from `src/data/seed.ts`.

## Credential safety
The current mock auth stores `mockPassword` in `commons:v1:users`. Use only a disposable test account and dummy password. Never export a real/reused password. Redact any accidental secret before sharing.

## Pristine fixture
1. Open the app in a clean browser profile/private window for its app origin.
2. Confirm no `commons:v1:` keys exist, then load the app and wait for seed initialization.
3. In DevTools Console run:

```js
const prefix = "commons:v1:";
const snapshot = Object.fromEntries(
  Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    .filter((key) => key && key.startsWith(prefix))
    .sort()
    .map((key) => [key, localStorage.getItem(key)])
);
copy(JSON.stringify(snapshot, null, 2));
```

4. Save the copied JSON as `v1-pristine.json`.

## User-data fixture
1. Use a separate clean profile or reset demo data.
2. Register a disposable user through the UI.
3. Through available UI controls, create a post, reply to a seeded post, quote a seeded post, repost a seeded post, like/bookmark posts, follow a seeded account, and change theme. Record unavailable features (interior routes are currently stubs).
4. Export using the same snippet and save as `v1-user-data.json`.
5. Do not manually invent missing interactions. If using a service from the console, label it as service-generated rather than UI-generated.

The ambient simulator auto-starts and may append `p_sim_` posts and likes/notifications; disable it for controlled capture if possible, or record its activity separately.

Upload both files to this directory in the feature branch or attach them to the project conversation. Include approximate capture time and app origin. At least three generated IDs per entity type should be compared where the current app can generate them.
