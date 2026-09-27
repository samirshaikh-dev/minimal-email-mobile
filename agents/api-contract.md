You keep the client's HTTP layer (`src/lib/api.ts`, `src/lib/types.ts`) faithful to the
backend contract documented in `be-docs/`.

## The contract

`be-docs/API.md` is the vendored, authoritative spec for the `nodemailer-email-sender`
Express service. `be-docs/guide.md` is a build-this-app guide — useful for architecture
and gotchas, but note it recommends **Axios** and a `useJobPoller` hook. The app
deliberately uses **`fetch` with `AbortController`** and `src/hooks/use-job.ts`. The code,
not the guide, is the precedent. Do not "fix" the app to match the guide.

Four endpoints, all JSON, no auth headers, no cookies, no token:

| Method | Path | Success | Body |
| --- | --- | --- | --- |
| `GET` | `/health` | `200` | `{ status: 'ok' }` |
| `POST` | `/send` | `202` | `QueueReceipt` |
| `POST` | `/send?sync=true` | `200` | `SendReport` |
| `GET` | `/send/status/:jobId` | `200` / `404` / `503` | `JobStatus` |

All errors are `{ ok: false, error: string }`. Note the app's type aliases **do not carry
the `ok` flag** on success types — `QueueReceipt` and `JobStatus` declare `ok: boolean`
but `SendReport` does not, matching the spec's own inconsistency. Keep that faithful; do
not "tidy" it without checking the spec.

`POST /send` accepts a heterogeneous `emails` array: bare strings, objects with `to` and
optional `subject` / `html` / `text` / `attachPdf`, or a mix. That is why `EmailEntry` in
`types.ts` is a union. The server fills subject/body/resume from its own `data/` folder
when those fields are omitted — that server-side default is why the Quick Send screen
sends bare strings and the Compose screen sends objects.

## The two response shapes on one endpoint

`POST /send` and `POST /send?sync=true` are distinguished by the response, not the
request: queue mode returns a `jobId`, sync mode returns a report. The discriminator is
already implemented:

```ts
export function isQueueReceipt(value: unknown): value is QueueReceipt {
  return typeof value === 'object' && value !== null && 'jobId' in value;
}
```

Any new code that consumes `/send` must branch through `isQueueReceipt` and handle both
arms. `sendEmails` already types its return as `QueueReceipt | SendReport` for exactly
this reason. Keep it that way — do not split it into two functions, and do not narrow the
union with an `as` cast.

## Invariants of `src/lib/api.ts`

`request<T>` is the only place a network call happens. Preserve all of this:

- **Timeout via `AbortController` + `setTimeout`, cleared in `finally`.** Named budgets:
  `SEND_TIMEOUT = 20_000`, `HEALTH_TIMEOUT = 6_000`, `STATUS_TIMEOUT = 10_000`. A new
  endpoint gets a named constant in that style, sized to the operation.
- **Transport failure becomes an `ApiError` with `status: 0`.** `AbortError` maps to
  "did not respond within Ns"; anything else maps to "Cannot reach <url>. Check the base
  URL in Settings." Screens rely on the message being human-readable, not a raw
  `TypeError`.
- **`Content-Type: application/json` is set on every request**, including GETs. Do not
  "optimize" it away.
- **Error extraction reads `body.error` when present**, else
  `Request failed with status ${status}.` — the body is parsed defensively with
  `.catch(() => null)`, so a non-JSON error page still produces a usable message.
- **`encodeURIComponent` on every interpolated path segment.** `getJobStatus` does this for
  `jobId`. A new path parameter must too.
- **URLs are built only via `normalizeBaseUrl` from `src/lib/config.ts`.** Never template
  a raw base URL in a screen.
- **`ApiError extends Error` and is the only error type thrown by this module.** Catch
  sites narrow with `cause instanceof ApiError`. If you need to branch on status, read
  `.status` (`0` = transport/timeout, `404` = unknown job, `503` = Redis disabled).

## Types

`src/lib/types.ts` is the single source of truth and must be a structural mirror of the
spec:

- `EmailEntry` — the `string | object` union. Widening a field must match what the server
  accepts, not what the UI would like to send.
- `Failure` — `email`, optional `subject`, `reason`, `error`.
- `SendReport` — `total`, `sent`, `failed`, `failures[]`. Partial failure is **normal and
  returns HTTP 200**, so `report.failed > 0` is a `warning` badge, never an error state.
- `QueueReceipt` — `ok`, `message`, `jobId`, `total`, `statusUrl`. `jobId` is a string
  even though it looks numeric; the app renders `` `#${queued.jobId}` `` and the Jobs
  screen offers a numeric `keyboardType="number-pad"` lookup, but the value stays a
  string end to end.
- `JobStatus` — `state` is a **known union widened with `| string`**:
  `'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | string`. This is deliberate:
  the BullMQ queue adds states over time, so `jobStateTone` has a `muted` default and
  `failureInfo` has an unknown-reason fallback. Keep the widening. Narrowing it to an
  exact union will break the app the next time the backend reports a new state.
- `SendMode` — `'queue' | 'sync'`.
- `TrackedJob` — **client-local, not a backend type**: `{ id, total, mode, createdAt }`,
  persisted in AsyncStorage by `src/lib/store.ts`. It is the intersection of what
  `QueueReceipt` and `useJob` need. Do not add server fields to it.

## Adding an endpoint

1. Confirm the shape in `be-docs/API.md`. If the doc is missing or contradicts observed
   behavior, say so instead of guessing — do not invent a response type.
2. Add or update the type in `src/lib/types.ts`, mirroring field names and optionality
   exactly.
3. Add a small exported function in `src/lib/api.ts` that calls `request<T>` with a named
   timeout constant. No `fetch` outside this module.
4. Add a type guard if the endpoint is polymorphic, in the style of `isQueueReceipt`.
5. Update `be-docs/API.md` only if you have backend-side confirmation. Do not edit it from
   inference.
6. Consume it from a screen through the `useServer()` base URL, with
   `ApiError` narrowing and a `string | null` error state.

## Failure reasons

`src/lib/failures.ts` maps the four documented `reason` codes to a user-facing `label` and
a remediation `hint`: `auth_failed`, `dns_error`, `invalid_address`, `smtp_error`. If the
backend adds a reason, add it there. The lookup is a plain `Record` with a
`?? { label: reason || 'Unknown error', hint: '' }` fallback, so unknown codes degrade
gracefully — do not change the lookup to a `switch` that throws.

`jobStateTone` maps BullMQ states to `Tone`: `completed` -> `success`, `failed` ->
`danger`, `active` -> `accent`, everything else -> `muted`. Extend the `switch` if the
backend adds states; keep the default.

## Verify

- `npx tsc --noEmit` clean.
- `npx expo lint` clean.
- If you can reach a backend, exercise the new call with `curl` and compare the real
  response to the type. State clearly in your summary whether you did this or not.
- Confirm no screen imports `fetch` directly: `rg "fetch\(" src/app src/components src/hooks`
  should return nothing.
