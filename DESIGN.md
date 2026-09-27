# Design Specification — Minimal Email Mobile

> **Design Direction:** SaaS-Type Minimal  
> **Inspiration:** Linear, Resend, Vercel, Raycast  
> **Platform:** Universal Mobile (iOS, Android, Web) via Expo & React Native

---

## 1. Vision & Core Philosophy

**Minimal Email Mobile** is an administrative and dispatch client for background email queue workers (`nodemailer-email-sender`). The UI embodies a **modern, high-density, utility-first SaaS aesthetic**:

1. **High Signal, Zero Fluff:** Content, telemetry, and actions take precedence. Decorative illustrations and bloated padding are replaced by crisp typography and structured layouts.
2. **Hairline & Surface Separation:** Depth is established via subtle surface elevation and 1px hairline borders (`#E4E4E7` / `#27272A`) rather than heavy drop shadows.
3. **Precision Typography & Monospace Accents:** Clear hierarchy with tight tracking for headings, uppercase micro-labels for metadata, and monospace numerals for IDs, timestamps, and latency counters.
4. **Tactile Micro-Interactions:** Deterministic haptic feedback for every user intent (tap, dispatch, status change) paired with snappy micro-animations.
5. **Universal SaaS Experience:** Beautiful on iOS and Android native devices while gracefully scaling up to tablet and web viewports (max content width container of 640px).

---

## 2. Design Tokens & Foundations

### 2.1 Color Palette

The color system uses deep neutral zinc tones paired with an electric indigo accent, adhering to strict WCAG 2.1 AA contrast requirements.

#### Light Mode (Clean SaaS Slate)
| Token | Hex | Role / Usage |
| :--- | :--- | :--- |
| `bg` | `#FFFFFF` | Canvas background |
| `surface` | `#FAFAFA` | Cards, input fields, containers |
| `surfaceAlt` | `#F4F4F5` | Segmented control track, pill backgrounds |
| `border` | `#E4E4E7` | 1px hairline borders, card outlines, separators |
| `text` | `#18181B` | Primary headings, body copy, active items |
| `muted` | `#52525B` | Secondary copy, metadata, descriptive labels |
| `faint` | `#A1A1AA` | Placeholder text, subtle captions, disabled icons |
| `accent` | `#4F46E5` | Primary brand actions, active toggles, focus rings |
| `accentSoft` | `#EEF2FF` | Active badge backgrounds, selected row tints |
| `onAccent` | `#FFFFFF` | Text/icons on solid accent buttons |
| `success` | `#15803D` | Delivered status, online indicators, valid counts |
| `successSoft`| `#F0FDF4` | Delivered badge background, health notice tint |
| `warning` | `#B45309` | Queued status, invalid email notices |
| `warningSoft`| `#FFFBEB` | Warning badge background |
| `danger` | `#B91C1C` | Failed status, network offline, destructive actions |
| `dangerSoft` | `#FEF2F2` | Error banner background, failure badge tint |

#### Dark Mode (Linear / Vercel Deep Zinc)
| Token | Hex | Role / Usage |
| :--- | :--- | :--- |
| `bg` | `#09090B` | Deep zinc background |
| `surface` | `#111113` | Elevated card surfaces, inputs |
| `surfaceAlt` | `#1C1C1F` | Segmented track, interactive hover/press states |
| `border` | `#27272A` | Subtle 1px borders, separators |
| `text` | `#FAFAFA` | High-contrast readable foreground text |
| `muted` | `#A1A1AA` | Secondary body text, property keys |
| `faint` | `#71717A` | Inactive icons, subtle hints, placeholders |
| `accent` | `#818CF8` | Electric indigo for dark surfaces |
| `accentSoft` | `#1E1B4B` | Dark indigo tint for active badges |
| `onAccent` | `#0B0B0F` | High-contrast text on bright accent buttons |
| `success` | `#4ADE80` | Emerald green for success states & worker health |
| `successSoft`| `#052E16` | Dark emerald badge background |
| `warning` | `#FBBF24` | Amber for warnings & retryable states |
| `warningSoft`| `#422006` | Dark amber badge background |
| `danger` | `#F87171` | Vibrant coral red for errors & failed jobs |
| `dangerSoft` | `#450A0A` | Dark red badge & notice background |

---

### 2.2 Typography Scale

Defaulting to native platform system fonts (`-apple-system`, `SF Pro Display`, `Roboto`, `Inter`), prioritizing clarity and information density.

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Screen Title** | `26px` | Bold (`700`) | `32px` | `-0.6px` | Screen primary headers |
| **Card / Section Header** | `18px` | SemiBold (`600`) | `24px` | `-0.3px` | Group titles, drawer headers |
| **Body (Default)** | `15px` | Regular (`400`) | `22px` | `0px` | Inputs, paragraph text, buttons |
| **Body (Dense / Secondary)**| `13px` | Regular (`400`) | `19px` | `0px` | Explanatory notes, list descriptions |
| **Section Label** | `11px` | SemiBold (`600`) | `14px` | `+0.8px` | Uppercase field headers, category titles |
| **Badge / Micro Tag** | `11px` | Bold (`700`) | `14px` | `+0.4px` | Uppercase status chips (`COMPLETED`, `FAILED`) |
| **Monospace / Telemetry** | `13px` | Medium (`500`) | `18px` | `0px` | Job IDs (`#104`), latency (`12ms`), URLs |

---

### 2.3 Spacing & Grid System

Based on a strict 4pt/8pt modular grid:

```
 space.xs  =  4px   // Micro gaps between label and input
 space.sm  =  8px   // Standard element gaps, button internal horizontal gaps
 space.md  = 12px   // Form field padding, badge padding, card internal row gaps
 space.lg  = 16px   // Screen gutter padding, card outer padding
 space.xl  = 24px   // Section separation
 space.xxl = 32px   // Screen bottom insets, empty state spacing
```

- **Max Content Width:** `640px` (enforces clean, readable column centering on iPads, foldable displays, and web browsers).
- **Corner Radii:**
  - `sm: 8px` — Inner elements, segmented buttons, input controls
  - `md: 12px` — Inputs, interactive buttons, notices
  - `lg: 16px` — Cards, modals, bottom sheets
  - `pill: 999px` — Badges, indicator dots, progress bars

---

## 3. SaaS Component Specifications

### 3.1 Server Liveness & Health Pill
- **Visual:** Inset indicator displayed on Settings and Top Bars.
- **Components:** Pulsing 8px dot (`#10B981` online, `#EF4444` offline) + Monospace latency readout (`24ms`) + Environment indicator (`Localhost` / `Production`).
- **Interaction:** Tapping triggers an instant health-check ping with haptic feedback.

### 3.2 Structured Cards (`Card`)
- **Structure:** 1px hairline border (`border`), flat surface (`surface`), `16px` border-radius, `16px` internal padding.
- **Separators:** Rows inside cards are separated by hairline borders or `12px` gaps.
- **States:** Hover/pressed opacity transitions on interactive cards (`opacity: 0.75`).

### 3.3 Status Badges (`Badge`)
- **Format:** High-density pill container with uppercase bold text.
- **Tones:**
  - `success`: `bg: successSoft`, `fg: success` (e.g., `VALID`, `COMPLETED`, `SENT`)
  - `warning`: `bg: warningSoft`, `fg: warning` (e.g., `WAITING`, `DELAYED`, `SYNC`)
  - `danger`: `bg: dangerSoft`, `fg: danger` (e.g., `FAILED`, `OFFLINE`)
  - `accent`: `bg: accentSoft`, `fg: accent` (e.g., `ACTIVE`, `QUEUE`)
  - `muted`: `bg: surfaceAlt`, `fg: muted` (e.g., `UNKNOWN`, `IDLE`)

### 3.4 Buttons (`Button`)
- **Primary:** High-contrast solid accent background (`accent`), white bold text, subtle active press shrink (`scale: 0.98`).
- **Secondary:** Surface background with hairline border (`border`), high contrast text.
- **Ghost:** Transparent background with accent or muted label for secondary actions (e.g., `Clear`, `Refresh`).
- **Destructive:** Soft red tint (`dangerSoft`), danger text (`danger`), used for clearing logs or aborting jobs.
- **Loading State:** Inlined subtle `ActivityIndicator` preserving button dimensions without layout shifting.

### 3.5 Segmented Switch (`Segmented`)
- **Format:** Linear-inspired segmented control inside a rounded `surfaceAlt` track.
- **Selection:** High-contrast solid `bg` slab with hairline border that shifts between options (`Queue` vs `Sync`).
- **Typography:** `13px`, medium weight for inactive, semibold for active.

### 3.6 Form Inputs & Textareas (`Input`)
- **Format:** Full-width container with crisp 1px border.
- **States:**
  - Default: hairline `border`
  - Focused: 1.5px highlighted `accent` border
  - Error: 1.5px `danger` border with an inline error message below
- **Multi-line / Recipient Box:** Fixed minimum height (`104px`), top-aligned text, monospace-capable font for email parsing.

### 3.7 Progress & Queue Telemetry Bar (`Progress`)
- **Format:** Ultra-thin `6px` pill track with smooth animated fill (`accent`).
- **SaaS Telemetry:** Paired with a fractional counter (e.g., `74 / 100 Sent • 74%`).

### 3.8 Notice & Error Callout (`Notice`)
- **Format:** Inset card with tone-matched soft background (`dangerSoft`, `warningSoft`, `successSoft`).
- **Typography:** Bold `13px` title with readable `13px` explanation text.

---

## 4. Screen Architecture & SaaS Layouts

```
┌─────────────────────────────────────────────────────────────┐
│ (tabs) Root Navigation                                      │
├───────────────┬────────────────┬─────────────┬──────────────┤
│ 1. Quick Send │ 2. Compose     │ 3. Jobs     │ 4. Settings  │
│ (Fast Dispatch│ (Full Campaign │ (BullMQ     │ (Diagnostics │
│  Zero-Payload)│  Editor)       │  Telemetry) │  & Health)   │
└───────────────┴────────────────┴─────────────┴──────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │ 5. Job Details  │
                               │ (Stack Screen)  │
                               └─────────────────┘
```

### 4.1 Screen 1: Quick Send (`/` - Send)
Designed for high-speed batch dispatch leveraging the backend's automated templates (`data/subject.txt`, `data/body.txt`, `resume.pdf`):
- **Hero Header:** "Quick Send" with contextual subtitle indicating zero-payload automation.
- **Recipient Input Card:** Multi-line text field for pasting comma, space, or newline separated emails.
- **Real-Time Validation Bar:** Immediate parsing count badges:
  - `[ 12 VALID ]` (Emerald)
  - `[ 2 INVALID ]` (Amber) + expandable list of skipped entries.
- **Delivery Mode Selector:** Seamless toggle between `Queue` (BullMQ async) and `Sync` (instant inline).
- **Action Bar:** Prominent "Send Batch" primary button with tactile haptic feedback.
- **Receipt Modal / Notification:** Job ID chip with direct link to live progress tracking.

### 4.2 Screen 2: Compose (`/compose`)
For targeted, customized emails overriding server defaults:
- **Recipient Field:** Multi-format recipient input with live validator.
- **Subject Field:** Single-line input with placeholder indicating fallback to `data/subject.txt`.
- **Message Body Editor:** Clean, auto-expanding text editor for plain text or HTML formatting.
- **Attachment Toggle Card:** Clean switch row with PDF icon: "Attach Resume PDF" (`Samir_Shaikh_FullStack_Developer.pdf`).
- **Dispatch Button:** Primary action with mode switch (`Queue` vs `Sync`).

### 4.3 Screen 3: Jobs & Telemetry (`/jobs`)
Centralized monitoring dashboard for all background jobs:
- **Header Actions:** Live refresh button + "Clear Completed" ghost action.
- **Quick Lookup Bar:** Monospace input for searching or jumping directly to a specific Job ID.
- **Job List Cards:**
  - Card Header: `#JOB-ID` + relative timestamp (`2m ago`, `Just now`) + State Badge (`ACTIVE`, `COMPLETED`, `FAILED`).
  - Progress Gauge: Thin progress bar showing active worker delivery progress.
  - KPI Row: `Total: 50` • `Sent: 48` • `Failed: 2`.
  - Tap Target: Smooth transition into Job Detail Inspector.
- **Empty State:** Minimal tray icon, "No tracked jobs", with a CTA to send the first batch.

### 4.4 Screen 4: Job Detail Inspector (`/job/[id]`)
Deep telemetry inspection for debugging worker executions:
- **Header:** Job identification with copy-to-clipboard action.
- **Status Overview Card:** State badge, progress bar, queue timestamp, and retry counter.
- **Failure Diagnostic Card (Conditional):**
  - Highlighted error reason in `dangerSoft` card.
  - List of individual failed recipient addresses with SMTP error codes (e.g., `550 Recipient Rejected`).
- **External Tools Quick Link:** Direct button to launch local **Mailpit Web UI** (`http://localhost:8025`) for inspection.
- **Actions:** "Retry Job" (if failed) and "Remove from History".

### 4.5 Screen 5: Settings & Diagnostics (`/settings`)
Backend connectivity and developer tooling:
- **Connection Health Card:**
  - Visual status pill: `ONLINE (18ms)` or `OFFLINE`.
  - Last checked relative time with manual re-test button.
- **Base URL Configuration:**
  - Input field for custom backend URL.
  - One-tap quick presets:
    - `iOS Simulator`: `http://localhost:4000`
    - `Android Emulator`: `http://10.0.2.2:4000`
    - `Production (Render)`: `https://<service>.onrender.com`
- **Mailpit Preview Link:** Direct link to open Mailpit inbox in native browser.
- **Storage Management:** Clear local AsyncStorage job history.

---

## 5. Interaction, Motion & Haptics Matrix

To achieve the tactile "native SaaS" feel, every gesture maps to deliberate feedback:

| Action | Micro-Animation | Haptic Trigger |
| :--- | :--- | :--- |
| **Button Press** | Scale to `0.98`, opacity `0.85` | `impactAsync(Light)` |
| **Tab Change** | Smooth native fade / slide transition | `selectionAsync()` |
| **Email Added / Parsed** | Badge count scale bounce | None (subtle visual only) |
| **Queue Dispatch Success** | Button returns to state, receipt badge appears | `notificationAsync(Success)` |
| **Error / Network Offline** | Shake animation on input/card | `notificationAsync(Error)` |
| **Pull to Refresh** | Spinner with native resistance | `impactAsync(Medium)` on release |

---

## 6. Implementation & Consistency Checklist

When writing or modifying UI components in the codebase:
- [ ] **Tokens over Ad-hoc Values:** Always import `space`, `radius`, and `useTheme()` from `@/constants/theme` and `@/hooks/use-theme`. Do not hardcode arbitrary hex colors.
- [ ] **Maximum Content Width:** Ensure all screen views wrap inside `Screen` or apply `useScreenContentStyle` to constrain width to `MAX_CONTENT_WIDTH` (`640px`).
- [ ] **Dark & Light Parity:** Verify visual hierarchy in both light (`#FFFFFF`) and dark (`#09090B`) themes.
- [ ] **Accessibility:** Maintain touch target minimums of `44x44pt` for all interactive buttons and inputs.
- [ ] **Haptics:** Call `tap()` or `notify()` from `@/lib/haptics` on meaningful user actions.
