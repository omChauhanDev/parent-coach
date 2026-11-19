# Progress

**Deadline: HARD STOP 16:00 IST, Thu 19 Nov 2026** — everything built, reviewed, README written, pushed,
CI green. **Target 15:30 IST.** This supersedes the email's "4:00 PM Dubai time" (= 17:30 IST).

**Current milestone:** M9 complete · next M10
**Last updated:** 2026-11-19 10:05 IST

## Status
| # | Subject | Status | Time |
|---|---|---|---|
| M1 | docs: add spec, architecture, plan and ADRs | done | 08:48 |
| M2 | chore: scaffold next app with lint, test and hooks | done | 08:57 |
| M3 | ci: add github actions check and build workflow | done (CI green) | 08:58 |
| M4 | feat: add coach api with zod contract and basic ui | done | 09:05 |
| M5 | feat: add multilingual safety pre-screen | done | 09:31 |
| M6 | feat: add model triage and fail-closed fallbacks | done | 09:42 |
| M7 | feat: render structured replies with rtl support | done | 09:48 |
| M8 | test: add playwright e2e with mock anthropic api | done | 09:55 |
| M9 | docs: add readme | done | 10:05 |
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
M10: commit `evals/golden.json` (46 cases) + `scripts/eval.ts`; log the full run here.

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

- M6: overall model deadline is 19 s (not 20) so a fallback is always on the wire before AC-14's 20 s;
  the SDK keeps `timeout: 15_000, maxRetries: 1`, the deadline aborts via AbortSignal.
- M6: SDK errors map most-specific first (abort/timeout → `timeout`, connection → `network`, 429 →
  `rate_limit`, 401/403 → `auth`, 408/504 → `timeout`, 5xx incl. 529 → `upstream`, other 4xx →
  `bad_request`, SDK parse errors → `malformed`, anything else → `unexpected`).
- M6 post-check (conservative extension of SPEC L4's "…"): also trips on medicine names (SPEC §6.4 "never
  names medicines"), dosing-interval phrases ("repeat the dose every…"), Urdu-script ml/mg, any dotted
  host, and invisible characters are stripped first. Household words that double as doses ("spoon",
  "tablet", "chamach", "چمچ") and "every N hours" only count in a medicine or symptom context (fever,
  pain, cough, بخار, pila…), so feeding / screen-time / sleep advice survives.
- M6 reviewer: verdict "fix first — B1" (post-check missed teaspoonful, saline drops, prescribed tablets,
  Urdu-script units, dosing intervals; M1 bare domains; m1 zero-width chars; m2 household FPs; m3 a refer
  test that could not fail). Re-review: "fix first — B2" (my m2 fix had moved Urdu/Roman drops and capful
  behind the medicine-word check; singular "drop" missed; feeding intervals "every 2–3 hours" tripped;
  "half the dose" missed; ORS dropped from the medicine list). All fixed with table rows. 3rd pass:
  **Verdict: ship**; its two minors (m6 everyday false positives — "a drop in grades", "painting",
  pulao, feeding interval next to "doctor"; m7 "twice a day") were fixed with rows before commit.

- M7 design: cool "night-feed" palette (peacock teal coach, red reserved for crisis, marigold focus
  ring), Atkinson Hyperlegible Next (legibility for tired parents) + Noto Nastaliq Urdu on `:lang(ur)`
  (Roman Urdu = `ur-Latn`, stays Latin). Base CSS lives in `@layer base` so utilities win; Nastaliq gets
  language-aware line heights (2.2) because Tailwind's `leading-*` would clip it.
- M7 UI checks (Playwright MCP, EN + UR RTL, 375 px + 1280 px, light + dark) found and fixed: Urdu parent
  bubble flipping to the left (`dir=auto` + logical margin), step badges offset by Nastaliq line height,
  bidi reordering of "800-SAKINA" inside the Urdu label (label reworded, number shown separately),
  contact rows crushed at 375 px (stacked on mobile), escalation banner scrolled out of view on mobile
  (new replies scroll to their top), textarea scrollbar, and template text saying helplines are "below"
  when the UI renders them above (templates now say "above"; test row asserts no "below/نیچے/neeche").
- M7 SPEC §8 manual pass on `pnpm dev` with the real key: F1 → coach/routine, 4 steps, check-in; Urdu
  crisis → red banner, Urdu template RTL Nastaliq, 999 + 800-725462 tel links with sources, safety
  question, log `kind=escalation source=prescreen`; PK + Roman crisis → 1122 / 15 / Taskeen, log
  `source=prescreen`; paracetamol → `coach/refer`, no dose, points to doctor/pharmacist. next-devtools
  `get_errors` and `get_compilation_issues` clean.
- M7: with the earlier suicide disclosure still in history, the paracetamol question escalated
  (source `model`) — history is triaged by the model by design (SPEC §6.2); Clear resets it.
- M7: composer does not truncate pasted text (a crisis at the end of a long paste must not be cut); it
  shows the count and blocks sending above 1000 characters instead.

- M8 e2e (3 tests, 2 specs): everyday (mock wording rendered, 1 model call, follow-up sends 2 history
  turns, Clear → next request sends 0 turns, web storage empty); Urdu crisis (RTL card, 999 + 800-725462
  tel links, https sources, **0 model requests**); PK toggle + Roman Urdu crisis (footer 1122, Taskeen,
  0 model requests). Next's route announcer also has `role="alert"`, so alert locators are scoped to the
  reply card.
- M8: in CI the Playwright web server runs only `next start` (CI builds in the step before); locally it
  builds first. Mock adds `GET /__last` (history turns of the last request) beyond ADR 0003's endpoints.
- M8 reviewer: **Verdict: ship**; minor (the AC-16-labelled check could not fail — mutation-tested) fixed
  by asserting history turns via the mock and empty web storage. Reviewer also ran 30 repeated e2e runs
  (no flakes) and a simulated CI run (`pnpm build` then `CI=true pnpm e2e`).

- M9 full-diff reviewer (M2–M8 + README): "fix first — B1". B1: a long Urdu conversation (UTF-8 2 bytes
  per letter) could build a valid `ChatRequest` over the 16 KB body limit, so the server returned 400 and
  the current message was never pre-screened → the client now drops the oldest history turns until the
  body fits (`buildRequestBody`, shared `src/lib/limits.ts`, table test). M1: Clear during a pending
  request let the late reply re-insert the cleared turn into history → generation ref + AbortController.
  m1/m2: README said 20 s (code 19 s) and described eval files not yet committed → fixed; eval docs land
  with M10. Code fixes ride in the M9 commit because the plan has no separate review-fix commit.
  Re-review: **Verdict: ship** (its m3 — README test count / eval clause — fixed before commit).
- M9 fresh-clone check (scratchpad, from GitHub): `pnpm install --frozen-lockfile && pnpm check` green
  (376 tests); no `.env.local` or `notes/` in the clone. Agent-usage note written to `notes/agent-usage.md`
  (git-ignored, not committed).
- CI green on GitHub for every pushed milestone (M3–M8; the M6 run was cancelled by M7's push under
  `concurrency: cancel-in-progress`, and M7's run covers it). M8's run includes Playwright e2e.

## Open questions / risks
- Local Node is 25.8.1; Vitest 5.1.1 engines are `^22.12 || ^24 || >=26` (CI uses Node 26). Policy above:
  only switch to node@26 if something actually breaks, and log it.
- Urdu / Roman Urdu template text needs native-speaker review (README limitation).
- Pakistan has no verified 24/7 national mental-health or child-protection line.

## Cut log
_(none)_
