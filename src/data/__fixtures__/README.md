# v1 browser-storage fixtures

These fixtures must be captured from the actual Stage 1 app. Do not synthesize them from `src/data/seed.ts`: the user-data fixture must reflect real UI/service operations, and the pristine fixture must represent a real first-load state.

## Important credential warning

The current mock auth stores `mockPassword` in the browser's `commons:v1:users` JSON. Use a disposable test account with a dummy password for the user-data fixture. Do not use a real/reused password. If a fixture accidentally contains a real credential, replace it with a clearly marked dummy value before uploading it; document that the redacted fixture cannot be used to test password validation.

## 1. Capture the pristine fixture

1. Open the existing Commons app in a clean browser profile or private window.
2. Confirm there is no pre-existing `commons:v1:` data for that app origin.
3. Load the app and wait for the first-load seed to complete.
4. Open DevTools → Console and run:

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

5. Paste the copied JSON into `v1-pristine.json`.

## 2. Capture the user-data fixture

1. Use a separate fresh browser profile or reset the demo data, then load the app.
2. Register a disposable test account with a unique dummy email and dummy password. Keep the new session logged in.
3. Through actual app UI controls, create a post, a reply to a seeded post, a quote of a seeded post, a repost of a seeded post, likes and bookmarks. Follow at least one seeded account. Change the theme. Add settings/draft/recent-search state where the current Stage 1 UI allows it.
4. Record which UI actions were available in a short accompanying note. Do not manually insert data into localStorage for the primary fixture.
5. Run the same export snippet and save the output as `v1-user-data.json`.

The current Stage 1 app does not yet expose every future feature. If a record type cannot be created through current UI, record that limitation rather than inventing a record. Some service methods may be called from the browser console only if the user is comfortable doing so; any console-generated activity must be labelled as service-generated, not UI-generated.

## 3. Upload

Upload both JSON files to this folder in the feature branch or attach them in the project conversation. Also note the app origin and the approximate capture date/time. The audit will then compare actual seed IDs and actual user-created IDs, and the migration tests can be based on these fixtures.
