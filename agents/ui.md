You build visual components for `minimal-email-mobile` by composing the existing design
system, not by inventing one.

## The design system, in full

**Theme** — `src/constants/theme.ts`. `useTheme()` (`src/hooks/use-theme.ts`) returns a
`Theme`; `useColorScheme()` resolves light/dark (with a `.web.tsx` variant that defers to
`'light'` during static rendering so hydration matches).

| Token | Role |
| --- | --- |
| `bg` | screen background |
| `surface` | card background |
| `surfaceAlt` | inset / pressed / track backgrounds |
| `border` | every 1px border |
| `text` | primary text |
| `muted` | secondary text, labels |
| `faint` | placeholders, disabled, timestamps |
| `accent` + `accentSoft` + `onAccent` | primary action / its tint / text on accent |
| `success` + `successSoft` | delivered |
| `danger` + `dangerSoft` | failed, destructive |
| `warning` + `warningSoft` | partial failure, warning |

`Tone = 'accent' | 'success' | 'danger' | 'warning' | 'muted'`. A `muted` tone resolves
to `fg: t.muted, bg: t.surfaceAlt` — so `'muted'` is the default everywhere, including
`Badge` and `Notice`.

**Scales** — never write a raw number:

- `space`: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`
- `radius`: `sm 8`, `md 12`, `lg 16`, `pill 999`
- `MAX_CONTENT_WIDTH: 640` — applied by `useScreenContentStyle` so web/tablet does not
  stretch edge to edge.

Both are `as const`, and `themes` uses `satisfies Record<'light' | 'dark', Theme>`. That is
what keeps `toneColors` exhaustive. Preserve both.

## Read `DESIGN.md` first

`DESIGN.md` at the repo root is the written design spec — full token tables, the
typography scale, per-component specifications, the screen architecture, and a
motion/haptics matrix. It is the authority when it and your instinct disagree, and its
section 6 is the project's own UI checklist.

It is a **spec, not a description of the current code**. Several items are specified but
not implemented. Do not assume they exist, and do not treat a gap as a bug to fix in
passing:

| Specified | Status in `src/` |
| --- | --- |
| Monospace for telemetry — job IDs, latency, URLs (`DESIGN.md` 2.2, 3.1) | Not implemented. Job IDs render in `t.text` with the system font (`index.tsx:114`); `formatLatency` has no mono styling. |
| Health pill: pulsing 8px dot + latency + env indicator (3.1) | Not implemented. Settings uses a `Badge` plus `KeyValue` rows (`settings.tsx:74-84`). |
| `Input` focus border `accent` 1.5px, error border `danger` (3.6) | Not implemented. `Input` has a single static border. |
| `Button` press **scale 0.98** (3.4, 5) | Implemented as `opacity: 0.8` instead (`ui.tsx:202`). Match the code, not the spec. |
| `Progress` animated fill (3.7) | Static width change. `react-native-reanimated` is installed but unused. |
| Copy job ID, Retry Job, Clear Completed (4.3, 4.4) | Not implemented. |
| Production Render preset in Settings (4.5) | Only the iOS and Android emulator presets exist (`settings.tsx:13-16`). |
| Shake on error, badge bounce, focus rings (5) | Not implemented. |

If the user asks for one of these, build it as specified and say what you added. Do not
silently substitute a different treatment.

## Typography

No font files; the system stack. `DESIGN.md` 2.2 defines the scale: `26 / 700 / -0.6`
screen title, `18 / 600 / -0.3` section header, `15 / 400` body, `13 / 400` dense
secondary, `11 / 600 / +0.8` uppercase label, `11 / 700 / +0.4` uppercase badge, `13 / 500`
monospace telemetry. The code currently uses `26/700`, `16/600`, `15/600`, `14`, `13`, and
the two uppercase sizes. Reuse what is there; do not introduce a new size for one
component.

## The primitives in `src/components/ui.tsx`

Build from these first. Most new UI needs no new component at all.

| Export | Use for |
| --- | --- |
| `Screen` | The scroll container. Title + subtitle header, themed bg, keyboard dismissal, safe area, max width. |
| `useScreenContentStyle` | The same content container, for when you need a `FlatList` instead. |
| `Card` | A grouped block: surface, border, `radius.lg`, `space.lg` padding, `space.md` gap. |
| `Label` | Uppercase field label with an optional `hint` line. |
| `Muted` | Secondary body text. |
| `Input` | Themed `TextInput`; handles `placeholderTextColor` and the multiline `minHeight: 104`. |
| `Button` | `variant`: `primary` \| `secondary` \| `ghost` \| `danger`; `loading`, `disabled`, press opacity. |
| `Segmented<T>` | Generic two-or-three-way toggle. `accessibilityRole="tab"`. |
| `Badge` | Small uppercased pill with a `Tone`. |
| `Notice` | Tinted block for a status or error, optional `title`. |
| `KeyValue` | Label-left / value-right row, optional `Tone` on the value. |
| `Progress` | Clamped percentage bar. |
| `Empty` | Centered empty-state title + subtitle. |

Prefer extending these over writing a parallel one. If a screen needs something the set
genuinely lacks, add it to `ui.tsx` as a named export with the same signature style
(inline props object, optional `style?: StyleProp<...>` merged last, theme read inside).

## Rules

1. **No hardcoded colors.** Every color comes from `useTheme()`. The single literal in the
   app — `Switch trackColor={{ true: '#4F46E5' }}` at `compose.tsx:109` — is an
   acknowledged gap, not a pattern. If you touch that `Switch`, fix it while you are
   there.
2. **`gap`, not margins.** `Card` and `Screen` already provide gap. For one-off spacing
   between siblings use the `space` scale. The literal `gap: 8` at `index.tsx:79` is a
   wart.
3. **Inline style objects, no `StyleSheet`.** The codebase passes style objects inline so
   theme values can be read at render time. `StyleSheet.create` cannot see `t.accent`.
   Do not introduce it. Merging an `extra`/`style` prop as the *last* element of the array
   is the established override pattern.
4. **Touchables are `Pressable`, not `TouchableOpacity`.** Use the
   `style={({ pressed }) => ...}` callback form for press feedback — see `jobs.tsx:126`.
5. **Every interactive primitive carries accessibility metadata.** `Button` sets
   `accessibilityRole="button"` and `accessibilityState={{ disabled, busy }}`; `Segmented`
   sets `accessibilityRole="tab"` and `selected`. A new touchable needs the equivalent, plus
   a minimum ~44pt target.
6. **Text truncation and wrapping.** Recipient lists and error strings are unbounded input
   — give them `numberOfLines` or let them wrap. `Muted` is the default for user-supplied
   values.
7. **Light and dark parity.** Every value you use must exist in both themes. If you add a
   token, add it to the `Theme` type and to `themes.light` and `themes.dark` — the
   `satisfies` will make you.
8. **No animation libraries in use.** `react-native-reanimated` is installed but unused.
   A fade or slide is fine; do not introduce an animation system for one interaction.
   If you do add Reanimated, verify the Reanimated 4 + React Native 0.86 setup for
   SDK 57 against current docs first.

## Composition patterns to copy

- **Card per logical group**, `Label` above the control, helper text via `Label`'s `hint`
  rather than a separate `Muted` when the text describes that field.
- **Error:** one `string | null` state, rendered as a single
  `<Notice tone="danger" title="...">{error}</Notice>` placed after the group that caused
  it. Never `Alert.alert` for an inline validation message.
- **Empty:** `Empty` with a title that states the situation and a subtitle that states the
  next action.
- **Result summary:** a `Badge` for the verdict, then `KeyValue` rows for the counts, then
  `Muted` lines for individual failures — see `index.tsx:124-136` and `compose.tsx:146-165`.
- **Section header:** a `View` with `flexDirection: 'row'`, `justifyContent:
  'space-between'`, an `Alignment`/`Label` on the left and an action on the right — see
  `settings.tsx:74` and `settings.tsx:102`.

## Haptics and motion

`DESIGN.md` section 5 defines the intended mapping. What the code actually does, and what
to follow:

| Interaction | Implemented |
| --- | --- |
| Any button press / dispatch intent | `tap()` before the action |
| Success or failure of a dispatch | `notify(true)` / `notify(false)` after |
| Tab change | Native, via `NativeTabs` — nothing to add |
| Pull to refresh | `RefreshControl` only, no extra haptic |
| Parse-count change, error shake, badge bounce | Not implemented |

Use `tap` / `notify` from `src/lib/haptics.ts` only. The module swallows rejections on
purpose, so never call `expo-haptics` directly. Do not add a haptic for a low-value
interaction (scrolling, typing) — the spec does not list one, and the wrappers only offer
`tap` and `notify` anyway.

## Finishing a UI change

1. Walk the screen in both light and dark. Any invisible text or invisible border is a
   token bug.
2. Confirm the empty, loading, error, and success states all exist and are reachable. A
   control that only works on the happy path is unfinished.
3. Confirm keyboard interaction: typing in a multiline `Input` inside `Screen` dismisses
   and persists taps correctly, because `Screen` owns those props.
4. Confirm the screen is inside `Screen` or `useScreenContentStyle`, so
   `MAX_CONTENT_WIDTH` still constrains it on tablet and web.
5. Re-run `DESIGN.md` section 6 against your change. It is the project's own checklist:

   - [ ] Tokens over ad-hoc values — `space`, `radius`, `useTheme()` only
   - [ ] Wrapped in `Screen` / `useScreenContentStyle` for the 640px column
   - [ ] Light and dark parity verified
   - [ ] 44x44pt minimum touch targets
   - [ ] `tap()` / `notify()` on meaningful actions

6. `npx tsc --noEmit` and `npx expo lint`, both clean. Paste the real output.
7. Say which primitives you reused and which, if any, you added to `ui.tsx`.
