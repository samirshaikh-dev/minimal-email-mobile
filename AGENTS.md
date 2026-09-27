This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Before you change anything

Load the matching skill or agent **first**. Never start editing from memory of this repo —
the conventions below are only a summary; the skill is the source of truth and it is
verified against the current SDK.

| Task | Load first |
| --- | --- |
| **Any** screen, route, tab, or detail page | Skill `expo-router-screen` — `agents/skills/expo-router-screen/SKILL.md` |
| Adding or extending a feature | Agent `expo-feature` — `agents/expo-feature.md` |
| Any HTTP call, response shape, or `src/lib/types.ts` | Agent `api-contract` — `agents/api-contract.md` |
| Building or restyling visual components | Agent `ui` — `agents/ui.md` |
| Reviewing React Native / React correctness | Agent `rn-reviewer` (read-only) — `agents/rn-reviewer.md` |
| Reviewing UX and accessibility | Agent `ui-ux` (read-only) — `agents/ui-ux.md` |
| Cannot reach the backend, or mail never arrives | Agent `debug-network` — `agents/debug-network.md` |
| Verifying a change before calling it done | Agent `verify-changes` — `agents/verify-changes.md` |

In opencode these are registered in `opencode.json` and load by name. If your tool cannot
load skills or agents, read the file directly before you edit.

Read these alongside the skill when they apply:

- `DESIGN.md` — design tokens, typography, component specs. A **spec, not a description of
  the code**: several items (monospace telemetry, the pulsing health pill, input focus
  borders, the `scale: 0.98` button press, an animated `Progress` fill) are specified but
  not built. Do not assume they exist, and do not "fix" them in passing.
- `be-docs/API.md` — the backend HTTP contract. Authoritative.
- `be-docs/guide.md` — background only. It recommends Axios and a `useJobPoller` hook; this
  app deliberately uses `fetch` with `AbortController` and `src/hooks/use-job.ts`. The
  code, not the guide, is the precedent.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done. This gate is the `verify-changes`
agent (`agents/verify-changes.md`); there is no test framework installed, so do not add
one.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
