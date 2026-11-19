# Progress

**Deadline: HARD STOP 16:00 IST, Thu 19 Nov 2026** — everything built, reviewed, README written, pushed,
CI green. **Target 15:30 IST.** This supersedes the email's "4:00 PM Dubai time" (= 17:30 IST).

**Current milestone:** M1 complete · next M2 (awaiting go-ahead)
**Last updated:** 2026-11-19 08:48 IST

## Status
| # | Subject | Status | Time |
|---|---|---|---|
| M1 | docs: add spec, architecture, plan and ADRs | done | 08:48 |
| M2 | chore: scaffold next app with lint, test and hooks | todo | |
| M3 | ci: add github actions check and build workflow | todo | |
| M4 | feat: add coach api with zod contract and basic ui | todo | |
| M5 | feat: add multilingual safety pre-screen | todo | |
| M6 | feat: add model triage and fail-closed fallbacks | todo | |
| M7 | feat: render structured replies with rtl support | todo | |
| M8 | test: add playwright e2e with mock anthropic api | todo | |
| M9 | docs: add readme | todo | |
| M10 | test: add golden eval set against real model | todo | |
| M11 | feat: polish chat layout and add example prompts | todo | |

## Decisions
- Model `claude-opus-5-5`, effort `low`, override via `COACH_MODEL`.
- Helplines: header toggle UAE / Pakistan, default UAE; footer always shows the region's emergency numbers.
- Repo: public `omChauhanDev/parent-coach`, created at M3, pushed after every milestone.
- Local only; no deployment, no rate limiting.
- Safety architecture: [ADR 0001](decisions/0001-layered-fail-closed-safety.md) · triage + structured output: [ADR 0002](decisions/0002-single-call-structured-triage.md) · e2e mocking: [ADR 0003](decisions/0003-e2e-mock-at-http-boundary.md).
- Contacts re-verified against raw official page text at 08:31–08:42 IST (`docs/research/safety.md` §5).
- Agent-usage note lives in `notes/agent-usage.md` (git-ignored, for the user's email); never committed.
- Video crisis example is Urdu (Nastaliq) then Roman Urdu, so the multilingual pre-screen is visible.
- Node: stay on local Node 25 unless something actually breaks; then `brew install node@26`, use it for
  this project, and log it here. Do not stop to ask.

## Next step
M2: scaffold Next.js 16.4.6 in the scratchpad, copy in, pin versions, wire Vitest, ESLint + Prettier,
lefthook + commitlint; `pnpm check` + `pnpm build` green.

## Open questions / risks
- Local Node is 25.8.1; Vitest 5.1.1 engines are `^22.12 || ^24 || >=26` (CI uses Node 26). Policy above:
  only switch to node@26 if something actually breaks, and log it.
- `tsc --noEmit` on a clean checkout may need `next typegen` first.
- Confirm `--no-agents-md` / `--no-agent-feedback` via `create-next-app --help`.
- Urdu / Roman Urdu template text needs native-speaker review (README limitation).
- Pakistan has no verified 24/7 national mental-health or child-protection line.

## Cut log
_(none)_
