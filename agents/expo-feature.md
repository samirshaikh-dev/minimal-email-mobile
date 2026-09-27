You add screens and self-contained features to `minimal-email-mobile`.

## What this app is

An Expo SDK 57 / React Native 0.86 / React 19.2 mobile client for a bulk job-application
email sender. The backend is an Express service (`nodemailer-email-sender`) that delivers
email over SMTP, optionally through a BullMQ + Redis queue. The app is a thin, four-tab
client: it never talks to SMTP, never stores message bodies server-side, and keeps all
local state in AsyncStorage.

Verified stack facts — read `package.json` if you need more:

- `expo` `~57.0.25`, `react` `19.2.3`, `react-native` `0.86.3`, `expo-router` `~57.0.23`
- `app.json` experiments: `typedRoutes: true`, `reactCompiler: true`
- TypeScript `~6.0.3`, `strict: true`; path alias `@/*` -> `./src/*`
- Lint via `eslint-config-expo/flat`; **there is no test framework installed** — do not
  write test files, and do not add one without being asked
- npm, not bun (`package-lock.json` exists, `bun.lock` does not) — use `npx`, never `bunx`

## Hard rules

1. **Routes live in `src/app/`.** Every file there is a screen. `_layout.tsx` defines a
   navigator. Components, hooks, and utilities must NOT go in `src/app/` — they belong in
   `src/components/`, `src/hooks/`, `src/lib/`.
2. **Never create or edit `ios/` or `android/`.** Both are gitignored (Continuous Native
   Generation). Native behavior goes in `app.json` or a config plugin.
3. **Install with `npx expo install <pkg>` only.** Never `npm install` a package directly —
   it will resolve an SDK-incompatible version.
4. **Verify every Expo/RN API against SDK 57 docs before using it.** Fetch the versioned
   page (`https://docs.expo.dev/versions/v57.0.0/...`), and use
   `https://docs.expo.dev/llms.txt` when unsure. Do not rely on memory; SDK 57 renamed and
   moved APIs. This matters most for `expo-router/unstable-native-tabs`, which is
   experimental and change-prone — confirm the import path and prop names before writing
   code, and say so in your summary if you could not confirm them.
5. **No inline comments.** At most a single `/** ... */` line where the *reason* is
   non-obvious. The repo uses this sparingly: `src/lib/config.ts:5`,
   `src/components/ui.tsx:35`, `src/hooks/use-job.ts:14`, `src/app/(tabs)/jobs.tsx:35`.
6. **Finish with `npx tsc --noEmit` and `npx expo lint`, both clean.** Report the actual
   output; never claim a clean run you did not perform.

## File conventions

- Files: `kebab-case.ts` / `kebab-case.tsx` (`use-job.ts`, `server-context.tsx`,
  `use-color-scheme.web.ts`).
- Screens: `export default function PascalCaseScreen() { ... }`.
- Strings: single quotes, semicolons, 2-space indent, ~100 col soft wrap.
- Cross-directory imports use the alias: `import { sendEmails } from '@/lib/api';`.
- Import order as the existing files do it: react/react-native, then `expo-*`, then the
  `@/` group, alphabetized within the group.

## The screen recipe

`src/app/(tabs)/index.tsx` and `src/app/(tabs)/settings.tsx` are the reference
implementations. A screen looks like this:

```tsx
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Card, Input, Label, Muted, Notice, Screen, Segmented } from '@/components/ui';
import { ApiError, isQueueReceipt, sendEmails } from '@/lib/api';
import { notify, tap } from '@/lib/haptics';
import { parseRecipients } from '@/lib/recipients';
import { useServer } from '@/lib/server-context';
import { trackJob } from '@/lib/store';
import type { SendMode, SendReport } from '@/lib/types';

export default function MyScreen() {
  const { baseUrl, status } = useServer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (status === 'offline') {
      setError('The backend is unreachable. Check the base URL in Settings.');
      return;
    }
    tap();
    setBusy(true);
    setError(null);
    try {
      notify(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not complete the request.');
      notify(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="Title" subtitle="One line of orientation for the user.">
      <Card>
        <Label hint="Optional helper text">Field</Label>
        <Input value={draft} onChangeText={setDraft} />
      </Card>

      {error ? <Notice tone="danger" title="Failed">{error}</Notice> : null}
    </Screen>
  );
}
```

Non-negotiable pieces of that shape:

- **`Screen`** owns the `ScrollView`, background color, keyboard-dismiss behavior
  (`keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`), max content
  width, and safe-area padding. Do not add your own `ScrollView`.
- **Everything is a `Card`.** `Card` supplies surface, border, `radius.lg`, `space.lg`
  padding, and `space.md` `gap`. Do not hand-roll those styles.
- **Spacing is `gap` + the `space` scale, never ad-hoc margins.** `space` is
  `xs 4 / sm 8 / md 12 / lg 16 / xl 24 / xxl 32`. Literal `8` appears once in
  `index.tsx:79` as a gap and is a wart, not a pattern.
- **Colors come from `useTheme()`**, never literals. `Tone` is
  `'accent' | 'success' | 'danger' | 'warning' | 'muted'`. The single literal in the app
  is `Switch trackColor={{ true: '#4F46E5' }}` in `compose.tsx:109`, which is a known
  gap — do not copy it.
- **A busy action always has three states**: `tap()` before, `notify(success)` /
  `notify(false)` after, and `setBusy(false)` in `finally`. Never call `expo-haptics`
  directly; `src/lib/haptics.ts` swallows rejections deliberately.
- **Errors are a single `string | null` state** rendered as
  `<Notice tone="danger" title="...">{error}</Notice>`. Narrow with
  `cause instanceof ApiError ? cause.message : '<friendly fallback>'`.
- **The server is reached only through `useServer()`** (`src/lib/server-context.tsx`).
  Never read `AsyncStorage` for the base URL from a screen, never call
  `getHealth`/`sendEmails` with a hand-built URL, never call `normalizeBaseUrl` outside
  `config.ts` / `server-context.tsx`.

## Adding a route

**New detail screen with a param** — `src/app/job/[id].tsx` is the template:

```tsx
import { Stack, router, useLocalSearchParams } from 'expo-router';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : (id ?? '');
  // ...
  return (
    <Screen>
      <Stack.Screen options={{ title: `Job #${jobId}` }} />
    </Screen>
  );
}
```

- `useLocalSearchParams<{ id: string }>()` then coerce the array case. Typed routes are on,
  so `router.push({ pathname: '/job/[id]', params: { id } })` must use a literal path
  string that exists. A typo is a type error, not a runtime 404 — that is the point.
- Register the screen in `src/app/_layout.tsx` under `<Stack.Screen name="job/[id]" ... />`
  so it gets a title and themed header.
- For a modal/presentational route, follow the same pattern with a title in
  `screenOptions` and present it as the header style requires.

**New tab** — edit `src/app/(tabs)/_layout.tsx`. Each tab needs a
`<NativeTabs.Trigger name="...">` with an `.Icon` (`sf` for iOS SF Symbols, `md` for
Material) and a `.Label`, plus a matching `src/app/(tabs)/<name>.tsx`. Trigger `name` and
file name must match exactly. Then update the `Stack.Screen` list in `_layout.tsx` if the
tab set changes.

**Not a screen** — shared logic goes in `src/hooks/<kebab-case>.ts` (a hook per concern,
like `src/hooks/use-job.ts`) and pure logic in `src/lib/<kebab-case>.ts`. New UI
primitives go in `src/components/ui.tsx` or a new file under `src/components/`, exported
as named exports.

## Polling and long-running work

If the feature observes a queued job, reuse `src/hooks/use-job.ts` rather than writing a
new poller. Its contract: recursive `setTimeout` (not `setInterval`), an `alive` flag
guarding every `setState` after the `await`, a `clearTimeout` in the effect cleanup, and
a terminal-state check (`completed` / `failed`) that stops the loop. Copy that discipline.
Polling stops when the component unmounts or `baseUrl`/`jobId` changes.

## Local persistence

`src/lib/store.ts` owns AsyncStorage. Keys are `minimal-email.*`. Job history is capped at
`MAX_JOBS = 40` inside `writeJobs`, and `readJobs` already swallows `JSON.parse` failures
and non-array payloads. Extend that module rather than calling AsyncStorage from a screen
or a new hook. `trackJob` de-duplicates by id; `untrackJob`, `clearJobs`, `writeBaseUrl`,
`readBaseUrl` complete the surface.

## Platform behavior

- The app targets iOS, Android, and web static export. Prefer primitives that work on all
  three. If you need a divergence, use the platform-extension file pattern
  (`src/hooks/use-color-scheme.ts` + `use-color-scheme.web.ts`) rather than `Platform.OS`
  branches scattered through a component.
- One `Platform.OS` branch is intentional and load-bearing: `useScreenContentStyle` adds
  `insets.top` padding on Android only, because native tabs already inset the top edge on
  iOS. Preserve that.
- Android cleartext HTTP is enabled through the `expo-build-properties` plugin in
  `app.json`. Do not add a second plugin for it.

## Before you finish

1. `npx tsc --noEmit` — clean.
2. `npx expo lint` — clean.
3. Confirm the new screen renders in light and dark: every color is themed, nothing is a
   hardcoded hex.
4. Confirm the offline path: with `status === 'offline'` the screen shows a
   `Notice tone="warning"` or `tone="danger"`, it does not silently do nothing.
5. Report which files you added/changed and paste the real verification output.
