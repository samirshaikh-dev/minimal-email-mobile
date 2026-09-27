# Repo agents and skills

Prompt files for opencode, tailored to `minimal-email-mobile` — an Expo SDK 57 / React
Native 0.86 / React 19.2 client for the `nodemailer-email-sender` Express backend
(`fetch` + `AbortController`, no auth, optional BullMQ queue, AsyncStorage for local
state).

These are **prompt bodies**, not standalone agent definitions. `opencode.json` at the
repo root registers each one, and `skills.paths` points at `agents/skills`.

Repo docs the prompts build on: `AGENTS.md` (Expo rules and commands), `DESIGN.md` (the
written design spec — tokens, typography, component specs), `be-docs/API.md` (the backend
HTTP contract), and `be-docs/guide.md` (architecture background; note it recommends Axios
and the app deliberately does not use it).

## Layout

```
agents/
  expo-feature.md        system prompt for the expo-feature agent
  api-contract.md        system prompt for the api-contract agent
  rn-reviewer.md         system prompt for the rn-reviewer agent
  debug-network.md       system prompt for the debug-network agent
  verify-changes.md      system prompt for the verify-changes agent
  ui.md                  system prompt for the ui agent
  ui-ux.md               system prompt for the ui-ux agent
  skills/
    expo-router-screen/SKILL.md
```

## The agents

| Agent | Mode | Edits? | Use it for |
| --- | --- | --- | --- |
| `expo-feature` | subagent | yes | Adding a screen, route, tab, or self-contained feature end to end. |
| `api-contract` | subagent | yes | Keeping `src/lib/api.ts` + `types.ts` faithful to `be-docs/API.md`; adding an endpoint. |
| `rn-reviewer` | subagent | no | Read-only RN/React 19/React Compiler correctness review. |
| `debug-network` | subagent | ask | Base URL, emulator hosts, Redis/BullMQ, sync vs queue, SMTP, Mailpit triage. |
| `verify-changes` | subagent | no | Runs `npx tsc --noEmit` and `npx expo lint`; reports real failures only. |
| `ui` | subagent | yes | Building components from the `ui.tsx` design system and theme tokens. |
| `ui-ux` | subagent | no | Read-only UX and accessibility audit of screens. |

## The skill

`expo-router-screen` — the full recipe for adding a screen in this app: route file
placement, `Screen`/`Card` composition, `useServer()` data flow, `typedRoutes` params,
`NativeTabs` registration, and the verification gate. It is loaded on demand rather than
sitting in every context, and it composes with the `expo-feature` agent.

## Editing

- Agent prompt: edit the `.md` file in `agents/`. `opencode.json` references it as
  `{file:agents/<name>.md}`, so the path and filename must stay in sync.
- Agent name, description, mode, permissions, and color: edit `opencode.json`. A
  `description` is required for an agent to be discoverable, and it is what the model
  reads when deciding whether to invoke it — write it in third person, front-loaded with
  the concrete trigger words.
- Adding an agent: create `agents/<name>.md`, then add an `agent.<name>` entry to
  `opencode.json` with `description`, `mode`, `prompt`, and `permission`.
- Adding a skill: create `agents/skills/<name>/SKILL.md` with `name` matching the folder
  and a third-person `description` covering both what it does and when to use it.

### Permission notes

`bash` rule objects are evaluated in order and the **last** match wins, so each entry
lists a broad `"*"` rule first and narrow allow-lists after it. Read-only agents deny
`edit` and deny `bash` except for specific `git` inspection commands.

## After any change here

Quit and restart opencode. Config-time files are loaded once at startup and are not
hot-reloaded, so a running session keeps using the old definitions.

## Other tools

`.claude/settings.json` already enables the official Expo Claude plugin. If you want these
same prompts available to Claude Code, copy the `agents/*.md` bodies into
`.claude/agents/<name>.md` with the metadata moved into YAML frontmatter
(`description`, `mode`, `model`, `tools`/`permission`) — the bodies are already
self-contained.
