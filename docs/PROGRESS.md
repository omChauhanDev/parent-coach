# Progress

**Deadline: HARD STOP 16:00 IST, Thu 19 Nov 2026** — everything built, reviewed, README written, pushed,
CI green. **Target 15:30 IST.** This supersedes the email's "4:00 PM Dubai time" (= 17:30 IST).

**Current milestone:** M2 complete · next M3
**Last updated:** 2026-11-19 08:57 IST

## Status
| # | Subject | Status | Time |
|---|---|---|---|
| M1 | docs: add spec, architecture, plan and ADRs | done | 08:48 |
| M2 | chore: scaffold next app with lint, test and hooks | done | 08:57 |
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
  this project, and log it here. Do not stop to ask. M2: Vitest 5.1.1 runs fine on Node 25.8.1.
- M2: `create-next-app` lists `--no-agents-md` / `--no-agent-feedback`; both used, plus `--no-react-compiler`.
  Scaffold defaults kept: `cacheComponents: true`, `partialPrefetching: true`.
- M2: `pnpm-workspace.yaml` `allowBuilds` also allows `esbuild` (pnpm 12 fails install on ignored builds).
- M2: `typecheck` runs `next typegen` first (`LayoutProps` global needs generated types on a clean checkout).
- M2: Prettier skips `docs/`, `.claude/`, `CLAUDE.md`, `.mcp.json` (hand-formatted, must not be rewritten).
- M2: `next dev` 16.4 writes `AGENTS.md` by default; `agentRules: false` in `next.config.ts` keeps the
  `--no-agents-md` choice (CLAUDE.md is the agent guide).
- Repo: per the run instructions, the GitHub repo is created and pushed right after M2 (first runnable
  milestone) instead of inside M3; M3 still adds CI and its done-when (pushed + Actions green) is unchanged.

## Next step
M3: `.github/workflows/ci.yml` (check + build on Node 26), push, `gh run watch` green.

## Open questions / risks
- Local Node is 25.8.1; Vitest 5.1.1 engines are `^22.12 || ^24 || >=26` (CI uses Node 26). Policy above:
  only switch to node@26 if something actually breaks, and log it.
- Urdu / Roman Urdu template text needs native-speaker review (README limitation).
- Pakistan has no verified 24/7 national mental-health or child-protection line.

## Cut log
_(none)_
