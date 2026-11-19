# Parent Coach

A parent describes a concern in **English, Urdu (Nastaliq) or Roman Urdu**. The coach replies with a short,
structured plan (a summary, up to four steps, a follow-up) — and when a message describes a medical
emergency, child abuse, self-harm or domestic violence, it stops coaching and shows **pre-written
escalation guidance with verified local helplines** for the UAE or Pakistan.

> Not a medical, legal or crisis service. It never diagnoses, names medicines or doses, or gives legal steps.

<!-- Demo video: _link to be added_ -->

## Quickstart

Requirements: Node 26 (CI) — Node 25 also works — and pnpm 12 (`packageManager` pins 12.21.0).

```sh
pnpm install
cp .env.example .env.local        # then set ANTHROPIC_API_KEY
pnpm dev                          # http://localhost:3000
```

Without a key the app still runs: crisis messages are escalated by the pre-screen, everything else gets a
safe fallback with the region's emergency numbers.

| Variable            | Purpose                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Server-side only (`src/lib/coach/anthropic-client.ts`, `server-only`) |
| `COACH_MODEL`       | Defaults to `claude-opus-5-5` (effort `low`, structured output)       |

## Scripts

| Command                                  | What it does                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js 16 app                                                                                        |
| `pnpm check`                             | `tsc` + ESLint + Prettier + Vitest (unit + route integration) — runs in CI                            |
| `pnpm e2e`                               | Playwright (chromium) against `next build && next start` with Anthropic mocked over HTTP — runs in CI |
| `pnpm eval`                              | Golden set against the **real model** — costs money, never in CI                                      |

## How it stays safe

Layered and fail-closed ([ADR 0001](docs/decisions/0001-layered-fail-closed-safety.md)):

| Layer | What happens                                                                                                                                                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L0    | Request validated with Zod (≤ 1000-char message, ≤ 8 history turns, ≤ 16 KB body) → 400 otherwise                                                                                                                                                                             |
| L1    | **Deterministic pre-screen** of the current message — normalised (NFKC, Urdu letter folding, diacritics/ZWNJ stripped, Eastern digits) and matched against phrase-level patterns in all three languages. A hit returns the escalation template **without calling the model**. |
| L2    | **Model triage** — `risk` and `crisisCategory` are the first fields of the structured output ([ADR 0002](docs/decisions/0002-single-call-structured-triage.md)). A crisis flag discards the model's text and serves the same pre-written escalation.                          |
| L3    | Output validation — `stop_reason` (refusal, max_tokens), JSON parse, Zod schema → fallback on any failure                                                                                                                                                                     |
| L4    | **Post-check** — any 3+ digit run, URL, dosage unit or medicine name in model text → refer template                                                                                                                                                                           |
| L5    | The UI renders `CoachReply` fields only; the region's emergency numbers are always in the footer                                                                                                                                                                              |

Every error path (timeout, 429, 5xx/529, 401, network, refusal, malformed output, missing key, our own
19 s deadline) returns HTTP 200 with a fallback that includes the emergency number. Server logs carry one
line per request — `{kind, risk, category, source, language, failure, ms}` — and never message text.

### Helplines

All numbers live in [`src/lib/safety/contacts.ts`](src/lib/safety/contacts.ts), each with its official
`https` source page and `verifiedOn: 2026-11-19`, re-checked by hand against the raw page text
([research notes](docs/research/safety.md#5-verified-contacts-used-by-the-app)). The model never writes
numbers.

| Region   | Always shown                       | Category lines                                                                                                                                  |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| UAE      | 999 police · 998 ambulance         | 116111 child protection · 800-725462 (Abu Dhabi, 24/7) and 800506 (Dubai) mental health · 800111 (Dubai) and 800-444 (Abu Dhabi) family support |
| Pakistan | 15 police · 1122 rescue · 115 Edhi | 1121 child protection (KP) · 1043 women's helpline (Punjab) · Taskeen psychologist line (NGO)                                                   |

## Testing

- **Unit (table-driven)** — normalisation, pre-screen positives per category × language, euphemisms,
  buried and hypothetical disclosures, false-positive traps ("killing it", "main to mar gayi"…), language
  detection, contract parsing, post-check, contacts vs the SPEC table, every template.
- **Route integration** — a fake Anthropic client throwing the SDK's real error classes; asserts the
  status, reply kind, the logged failure reason and that no message text is logged.
- **E2E (3 tests)** — everyday flow (incl. Clear resetting the history the model sees) and Urdu /
  Roman Urdu crises with the region toggle; the crisis spec asserts the mock received **zero** model
  requests ([ADR 0003](docs/decisions/0003-e2e-mock-at-http-boundary.md)).
- **Eval** — 46 golden cases (`evals/golden.json`, incl. 25 from an adversarial red-team pass) through
  the real pipeline and model; prints which layer caught each crisis and exits 1 on any missed crisis or
  any dose / number / URL leaking into a coach reply. Last run (2026-11-19): 46/46 pass, crisis recall
  21/21 — 18 caught by the pre-screen, 3 only by the model (buried warning signs, coercive control).

## Limitations

- Urdu and Roman Urdu template wording is a draft and needs native-speaker review.
- Pakistan has no verified 24/7 national mental-health or child-protection line; PK escalations lead with
  15 / 1122 / 115. Contacts must be re-verified before any real use.
- The pre-screen catches explicit phrases; euphemisms and indirect signs rely on the model layer
  (measured by `pnpm eval`).
  It prefers false positives — every escalation invites the parent to continue if no one is in danger.
- Local only: no auth, persistence, rate limiting or deployment. History lives in React state (last 8
  turns sent); "Clear conversation" empties it.

## Docs

[Spec](docs/SPEC.md) · [Architecture](docs/ARCHITECTURE.md) · [Plan](docs/PLAN.md) · [Progress](docs/PROGRESS.md) · [ADRs](docs/decisions/)
