# Progress

**Deadline: HARD STOP 16:00 IST, Thu 19 Nov 2026** — everything built, reviewed, README written, pushed,
CI green. **Target 15:30 IST.** This supersedes the email's "4:00 PM Dubai time" (= 17:30 IST).

**Current milestone:** M5 complete · next M6
**Last updated:** 2026-11-19 09:31 IST

## Status
| # | Subject | Status | Time |
|---|---|---|---|
| M1 | docs: add spec, architecture, plan and ADRs | done | 08:48 |
| M2 | chore: scaffold next app with lint, test and hooks | done | 08:57 |
| M3 | ci: add github actions check and build workflow | done (CI green) | 08:58 |
| M4 | feat: add coach api with zod contract and basic ui | done | 09:05 |
| M5 | feat: add multilingual safety pre-screen | done | 09:31 |
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
M6: triage gate, `postcheck.ts`, full SDK error mapping, 19 s deadline, route integration tests for every
ARCHITECTURE §4 row; reviewer on the staged diff.

- M4: `contacts.ts` (all verified contacts) and the fallback part of `templates.ts` land in M4, because the
  fallback must show the region's emergency number and numbers may only come from `contacts.ts`.
  Escalation + refer templates and the contacts test come in M5 as planned.
- M4 (temporary, removed in M5/M6): a model-flagged crisis fails closed to the fallback until escalation
  templates exist. SDK error classes all map to `unexpected` until M6's full mapping.
- M4: The model gets one user turn holding `{replyLanguage, history, message}` as JSON (SPEC §6.5); the
  JSON text block is found by `type`, since Opus 5.5 returns thinking blocks first (researcher, SDK 1.10.0).
- M4 smoke run (real key): F1 bedtime → `coach · routine · en`, 4 steps, check-in; 6.0 s.

- M5 pre-screen: 120+ table rows (EN/UR/Roman positives per category, buried, hypothetical, negated,
  injection, normalisation variants, SPEC §8 strings) + 45 false-positive traps. Patterns are phrase-level
  (person + act, age + fever, partner + verb); everyday sibling/toddler hitting, venting ("I'm going to
  kill him if he draws on the wall") and Urdu hyperbole stay quiet.
- M5 deliberate false positives (policy prefers them): a child saying "I want to die", "choking on food",
  "I can't breathe", "child abuse" in an information question, "cousin chherta". Each escalation invites
  the parent to continue if no one is in danger.
- M5 safety-redteam (25 cases): 10 pre-screen misses + 7 everyday false positives found and all fixed
  (incl. two real bugs: Roman `ghalat jagah` could never match; squeezing 3+ letters to one broke double
  vowels, so the matcher now tries both 1- and 2-letter squeezes). Invisible format characters (ZWSP,
  soft hyphen, word joiner) are stripped. Code-mixed English verbs in Urdu/Roman DV sentences are caught.
  Remaining model-layer case: rt-04 (buried giving-away + apology notes), with F4 — both go to M10 evals.
- M5: F4 ("gave away all her favourite things…") is intentionally NOT a pre-screen pattern, so SPEC F4's
  expected `source: model` holds.
- M5: escalation step 1 uses the category's first contact (AE medical → 998, PK medical/self-harm → 1122);
  the fallback/refer danger line uses the region's first two footer numbers.

## Open questions / risks
- Local Node is 25.8.1; Vitest 5.1.1 engines are `^22.12 || ^24 || >=26` (CI uses Node 26). Policy above:
  only switch to node@26 if something actually breaks, and log it.
- Urdu / Roman Urdu template text needs native-speaker review (README limitation).
- Pakistan has no verified 24/7 national mental-health or child-protection line.

## Cut log
_(none)_
