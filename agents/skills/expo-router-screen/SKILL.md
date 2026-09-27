---
name: expo-router-screen
description: Use when adding or changing a screen, route, tab, or detail page in the minimal-email-mobile Expo app. Covers the src/app file-based route layout, NativeTabs registration, typed routes with useLocalSearchParams, the Screen/Card/ui.tsx primitive stack, theme tokens, and the useServer base-URL data flow.
---

# Adding an Expo Router screen to `minimal-email-mobile`

A screen in this repo is a route file in `src/app/`, a body of `Card`s from
`src/components/ui.tsx`, and a data flow that starts at `useServer()`. Nothing else.

## Verify the SDK before writing

`app.json` and `package.json` are the source of truth, and Expo ships breaking changes
every SDK. This app is on **`expo` `~57.0.25`**, `expo-router` `~57.0.23`,
`react-native` `0.86.3`, `react` `19.2.3`. Before using any Expo, React Native, or
`expo-router` API:

1. Read the `expo` major version in `package.json`.
2. Fetch `https://docs.expo.dev/versions/v57.0.0/` and navigate to the package you need.
3. If anything is unclear, fetch `https://docs.expo.dev/llms.txt` — it indexes the docs
   and lists corrections to common LLM misconceptions.
4. Never answer from memory. This is the single highest-value habit in this repo.

The riskiest API here is `expo-router/unstable-native-tabs`, used by
`src/app/(tabs)/_layout.tsx`. It is explicitly unstable. Confirm the import path, the
`NativeTabs.Trigger` / `.Icon` / `.Label` composition, and the props
(`backgroundColor`, `tintColor`, `iconColor`, `labelStyle`, `tabBarRespectsIMEInsets`)
against the current docs rather than assuming.

## 1. Pick the file location

| You are adding | File |
| --- | --- |
| A tab screen | `src/app/(tabs)/<name>.tsx` |
| A detail screen with one param | `src/app/<group>/[id].tsx` (see `src/app/job/[id].tsx`) |
| A root screen | `src/app/<name>.tsx` |
| A navigator | `src/app/<group>/_layout.tsx` |

Rules that are not negotiable:

- Every file under `src/app/` is a screen or a layout. Components, hooks, and utilities
  go in `src/components/`, `src/hooks/`, `src/lib/`. Do not create `src/app/components/`.
- A folder in parentheses — `(tabs)` — is a route group: it does not appear in the URL and
  its `index.tsx` is that group's index route.
- File names are `kebab-case`; the component is `PascalCase` and the default export.
- `ios/` and `android/` are gitignored (Continuous Native Generation). Never create or
  edit them. Native config goes in `app.json` or a config plugin.

## 2. Screen skeleton

Copy `src/app/(tabs)/settings.tsx` — it is the cleanest example. The required shape:

```tsx
import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Input, KeyValue, Label, Muted, Notice, Screen } from '@/components/ui';
import { space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useServer } from '@/lib/server-context';

export default function MyScreen() {
  const t = useTheme();
  const { baseUrl, status } = useServer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Screen title="My screen" subtitle="One line telling the user what this is for.">
      <Card>
        <Label hint="Optional helper text">Field</Label>
        <Input value="" onChangeText={() => {}} />
      </Card>

      {error ? <Notice tone="danger" title="Failed">{error}</Notice> : null}
    </Screen>
  );
}
```

What `Screen` gives you, and therefore what you must not re-add:

- The `ScrollView` with `keyboardShouldPersistTaps="handled"` and
  `keyboardDismissMode="on-drag"` — required for tap-to-submit inside a keyboard-heavy form.
- `backgroundColor: t.bg` and the themed header.
- `useSafeAreaInsets()` with `insets.top` added **on Android only** (native tabs already
  inset iOS), plus `maxWidth: MAX_CONTENT_WIDTH` and centered alignment for web/tablet.
- The title block: 26px / `'700'` / `letterSpacing: -0.6`, subtitle at 14px in `t.muted`.

For a `FlatList` screen use `useScreenContentStyle()` for `contentContainerStyle` and
copy the title block by hand — see `src/app/(tabs)/jobs.tsx:67-77`. Do not nest a
`FlatList` inside `Screen`.

## 3. Data flow

The base URL has exactly one source of truth. Always:

```tsx
const { baseUrl, status, latency, checkedAt, refresh, setBaseUrl, resetBaseUrl } = useServer();
```

- `useServer()` throws outside `<ServerProvider>` (`src/lib/server-context.tsx:91`). The
  provider is mounted once in `src/app/_layout.tsx`, so every screen is covered.
- Never read the base URL from AsyncStorage, never call `normalizeBaseUrl` yourself, and
  never `fetch` outside `src/lib/api.ts`.
- `status` is `'checking' | 'online' | 'offline'`. Guard destructive network actions on it
  and show a `Notice tone="warning"` when offline — see `src/app/(tabs)/index.tsx:25`.
- All HTTP goes through the functions in `src/lib/api.ts`
  (`getHealth`, `sendEmails`, `getJobStatus`). Each call takes `baseUrl` as its first
  argument. Add new endpoints there, never inline.

## 4. Async actions

Every action that hits the network follows this shape:

```tsx
const onSend = async () => {
  if (status === 'offline') {
    setError('The backend is unreachable. Check the base URL in Settings.');
    return;
  }
  if (valid.length === 0) {
    setError('Add at least one valid email address.');
    return;
  }

  tap();
  setBusy(true);
  setError(null);

  try {
    const response = await sendEmails(baseUrl, valid, mode);
    setReport(response);
    notify(true);
  } catch (cause) {
    setError(cause instanceof ApiError ? cause.message : 'Could not send the batch.');
    notify(false);
  } finally {
    setBusy(false);
  }
};
```

- Validate before mutating state; show the message, do not fire a doomed request.
- `tap()` before, `notify(success: boolean)` after, `setBusy(false)` in `finally`. Use
  `src/lib/haptics.ts`, never `expo-haptics` directly — the wrapper swallows rejections
  that occur on web and unentitled devices.
- Narrow with `cause instanceof ApiError ? cause.message : '<friendly fallback>'`.
- `sendEmails` returns `QueueReceipt | SendReport`. Discriminate with `isQueueReceipt`
  (`src/lib/api.ts:69`) and handle **both** arms. A partial failure is `report.failed > 0`
  and is a `warning` badge, not an error — sync mode returns `200` even when everything
  failed.
- When a queue receipt comes back, persist it with `trackJob` from
  `src/lib/store.ts` so it appears on the Jobs tab.

## 5. Polling a queue job

Reuse `src/hooks/use-job.ts`; do not write a second poller.

```tsx
const { data, error, isPolling, refresh } = useJob(baseUrl, jobId);
```

It polls `GET /send/status/:jobId` every 2s with a recursive `setTimeout` (not
`setInterval`), guards every `setState` behind an `alive` flag, clears its timer on
cleanup, and stops at `completed` / `failed`. If you add polling somewhere else, copy that
discipline exactly.

## 6. Route params

`typedRoutes: true`, so paths are checked at compile time.

```tsx
import { Stack, router, useLocalSearchParams } from 'expo-router';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : (id ?? '');

  return (
    <Screen>
      <Stack.Screen options={{ title: `Job #${jobId}` }} />
    </Screen>
  );
}
```

- The array coercion is required: `useLocalSearchParams` returns `string | string[]`.
- Set a per-screen title with the `<Stack.Screen options={{ title }} /> />` child, or
  centrally in the parent `_layout.tsx` `screenOptions` / `<Stack.Screen options>`.
- Navigate with the object form: `router.push({ pathname: '/job/[id]', params: { id } })`.
  A wrong path is a type error, which is the point — do not cast it away.

## 7. Register the route

**Detail screen:** add it to `src/app/_layout.tsx`:

```tsx
<Stack.Screen name="job/[id]" options={{ title: 'Job' }} />
```

The root layout's `screenOptions` already applies the themed header
(`headerShadowVisible: false`, `headerStyle: t.bg`, `headerTintColor: t.accent`,
`headerTitleStyle: t.text`, `contentStyle: t.bg`) and wraps everything in the Expo Router
`ThemeProvider` bridged to `useTheme()`. Do not re-theme per screen.

**New tab:** add a trigger to `src/app/(tabs)/_layout.tsx`, where the trigger `name`
must match the file name exactly:

```tsx
<NativeTabs.Trigger name="archive">
  <NativeTabs.Trigger.Icon sf="archivebox.fill" md="inventory" />
  <NativeTabs.Trigger.Label>Archive</NativeTabs.Trigger.Label>
</NativeTabs.Trigger>
```

Use an SF Symbol for `sf` and a Material icon for `md` so both platforms look native.
Keep `tabBarRespectsIMEInsets` — removing it breaks the Compose screen's multiline input.

## 8. Styling rules

`DESIGN.md` at the repo root is the design spec — token tables, the typography scale, and
per-component specifications. Read it when you are unsure of a value; it is the authority
over your instinct. It is a spec, not a description of the code, so some items
(monospace telemetry, input focus borders, the `scale: 0.98` press) are specified but not
built. Match what the code does unless the user asks you to build the spec.

- Colors from `useTheme()` only. `Tone` is
  `'accent' | 'success' | 'danger' | 'warning' | 'muted'`.
- Spacing from the `space` scale (`xs 4` … `xxl 32`) and `radius` (`sm 8`, `md 12`,
  `lg 16`, `pill 999`). No raw pixel values.
- `gap`, not margins. `Card` and `Screen` already provide gap.
- Inline style objects, **not** `StyleSheet.create` — the styles must read theme values
  at render time. Merge an incoming `style` prop as the last array element.
- Compose from `Screen`, `Card`, `Label`, `Muted`, `Input`, `Button`, `Segmented`, `Badge`,
  `Notice`, `KeyValue`, `Progress`, `Empty`. Add to `ui.tsx` only when the set genuinely
  lacks something.
- `Progress` clamps its own input; any new percentage driven by server data needs the same
  clamp.
- Haptics via `src/lib/haptics.ts`: `tap()` before a user intent, `notify(success)` after
  the result. Never `expo-haptics` directly.

## 9. No comments

Do not add inline `//` commentary. A single `/** ... */` line is acceptable only when the
reason is non-obvious — the repo uses it at `src/lib/config.ts:5`,
`src/components/ui.tsx:35`, `src/hooks/use-job.ts:14`.

## 10. Finish

1. `npx tsc --noEmit` — must be clean. There is no `typecheck` script; invoke `tsc`
   directly.
2. `npx expo lint` — must be clean. Use `npx`, not `bunx`: this repo has
   `package-lock.json` and no `bun.lock`.
3. There is **no test framework installed** — do not add test files.
4. Check the new screen in light and dark, and check the empty / loading / error / offline
   paths exist.
5. Report the files you created or changed and paste the real command output.

## Reference screens

| File | Shows |
| --- | --- |
| `src/app/(tabs)/index.tsx` | Full send flow, queue vs sync, result rendering |
| `src/app/(tabs)/compose.tsx` | Form with optional fields, `Switch`, the same result block |
| `src/app/(tabs)/settings.tsx` | Text input + presets, health readout, external links |
| `src/app/(tabs)/jobs.tsx` | `FlatList`, `useFocusEffect` reload, pull-to-refresh, lookup form |
| `src/app/job/[id].tsx` | Route param, polling, per-failure detail, `Stack.Screen` title |
| `src/app/_layout.tsx` | Root stack, theme bridge, `ServerProvider` |
| `src/app/(tabs)/_layout.tsx` | `NativeTabs` triggers |
