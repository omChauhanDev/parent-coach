# Build plan

Hard stop **16:00 IST Thu 19 Nov 2026** · target 15:30 · run `date` at the start of every milestone.
Each milestone = **exactly one commit** with the subject below (≤ 60 chars, no body).
Safety (M5, M6) is never cut. If behind, cut from the end and log it in `docs/PROGRESS.md`.

## Milestones

| # | Commit subject | Done when | ETA (IST) | Cuttable |
|---|---|---|---|---|
| M1 | `docs: add spec, architecture, plan and ADRs` | Docs + harness written and approved; branch `main`; committed | 09:00 | no |
| M2 | `chore: scaffold next app with lint, test and hooks` | `pnpm check` + `pnpm build` green; sanitiser strips a body/trailer message to its subject; `echo "bad msg" \| pnpm exec commitlint` fails | 09:30 | no |
| M3 | `ci: add github actions check and build workflow` | Public repo created and pushed; Actions run green (`gh run watch`) | 09:45 | no |
| M4 | `feat: add coach api with zod contract and basic ui` | Real key: English everyday message → valid `CoachReply` shown in bare UI; contract + language tests green; next-devtools MCP clean | 10:20 | no |
| M5 | `feat: add multilingual safety pre-screen` | Table tests green (EN/UR/Roman positives, euphemisms, buried, FP traps → null); crisis route test proves no model call; safety-redteam gaps folded in | 11:00 | **never** |
| M6 | `feat: add model triage and fail-closed fallbacks` | All failure-mode integration tests green (ARCHITECTURE §4); reviewer verdict `ship` | 11:40 | **never** |
| M7 | `feat: render structured replies with rtl support` | SPEC §8 steps 0:15–1:50 pass manually; next-devtools MCP clean | 12:15 | no |
| M8 | `test: add playwright e2e with mock anthropic api` | 2 e2e specs green locally and in CI; crisis spec asserts 0 model requests; reviewer verdict `ship` | 12:45 | trim (keep crisis) |
| M9 | `docs: add readme` | README run/test/eval/safety/limitations; agent-usage note written to `notes/agent-usage.md` (git-ignored, not committed); final reviewer pass on full diff; CI green | 13:10 | no |
| M10 | `test: add golden eval set against real model` | `pnpm eval` runs 15–20 cases; crisis recall 100%; results logged in PROGRESS | 13:40 | trim to 8 cases |
| M11 | `feat: polish chat layout and add example prompts` | Example chips, empty state, mobile width; e2e green | 14:05 | **yes, first** |

Buffer 14:05–15:30 for review fixes, CI, and the video. **Checkpoints:** M7 not done by 12:45 → drop M11.
15:00 → feature freeze: README + CI green only.

## Tasks per milestone

**M1** — Write docs/ (SPEC, ARCHITECTURE, ADRs, PLAN, PROGRESS, research/safety), CLAUDE.md, `.claude/agents/*`.
`git branch -m master main`; commit (existing `.git/hooks/commit-msg` sanitises).

**M2** — Scaffold
- `pnpm create next-app@16.4.6 <scratchpad>/app --ts --app --eslint --tailwind --src-dir --use-pnpm --import-alias "@/*" --disable-git` (+ `--no-agents-md --no-agent-feedback` if `--help` lists them). The repo dir is refused (`.mcp.json`, `.env.local`), so copy files in; merge `.gitignore`.
- Exact pins from ARCHITECTURE §6 (no `^`); `"packageManager": "pnpm@12.21.0"`; tsconfig `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride`.
- `eslint.config.mjs` = next core-web-vitals + typescript + `eslint-config-prettier/flat`; `.prettierrc`.
- Scripts: `typecheck` (`tsc --noEmit`, `next typegen` first if needed), `lint` (`eslint . && prettier --check .`), `test` (`vitest run`), `check` (typecheck + lint + test), `e2e`, `eval`.
- `vitest.config.mts` (node env, `@/` alias, `server-only` → `test/server-only-stub.ts`) + one smoke test.
- `scripts/sanitize-commit-msg.sh` = verbatim copy of current `.git/hooks/commit-msg`; `lefthook.yml` `commit-msg` with `piped: true`, `jobs`: sanitize `{1}` → `pnpm exec commitlint --edit {1}`; `commitlint.config.mjs` (config-conventional, `header-max-length: [2, "always", 72]`); `pnpm-workspace.yaml` `allowBuilds: { lefthook: true, … }`. lefthook renames the old hook to `commit-msg.old` — expected.
- `.env.example` (`ANTHROPIC_API_KEY=`, `COACH_MODEL=claude-opus-5-5`); `.gitignore` += `playwright-report/ test-results/ coverage/ *.tsbuildinfo next-env.d.ts`.

**M3** — `.github/workflows/ci.yml`: on push/PR; checkout@v7 → pnpm/action-setup@v6 → setup-node@v7 (Node 26, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm check` → `pnpm build`.
`gh repo create omChauhanDev/parent-coach --public --source . --remote origin --push`; `gh run watch`.

**M4** — `contract.ts` (SPEC §5 verbatim), `language.ts`, `coach/{prompt,model,anthropic-client,pipeline}.ts` (any failure → generic fallback for now), `api/coach/route.ts`, bare `page.tsx` listing reply fields. Tests: contract parsing table, language table.

**M5** — `safety/{normalize,patterns,prescreen,contacts,templates}.ts` from `docs/research/safety.md`; pre-screen wired before the model. ≥ 40 table rows across category × language incl. buried, hypothetical, normalisation variants and FP traps — and the exact Urdu and Roman Urdu crisis strings from the SPEC §8 video script; contacts test (https `sourceUrl`, `verifiedOn`). Run **safety-redteam**; fold deterministic gaps into patterns + tests; keep model-layer cases for M10.

**M6** — Triage gate, `postcheck.ts`, full error/stop-reason mapping in `model.ts`, 20 s deadline, log line without text. Route integration tests with a fake client throwing real SDK error classes (ARCHITECTURE §4 rows). Run **reviewer** on the staged diff; fix before committing.

**M7** — `ReplyCard` (escalation banner `role="alert"`, `tel:` links + source links, summary, ordered steps, follow-up), `Composer` (`dir="auto"`, 1000-char counter, Enter sends, Shift+Enter newline), region toggle, footer, Clear, Noto Nastaliq Urdu via `next/font` on `:lang(ur)`, history cap 8, client fetch-failure message.

**M8** — `e2e/mock-anthropic.ts`, `playwright.config.ts` (`webServer` array: mock + `next build && next start` with `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY=test`; chromium only), `e2e/everyday.spec.ts`, `e2e/crisis.spec.ts`. CI: `playwright install --with-deps chromium`, `pnpm e2e`, upload report on failure. Run **reviewer**.

**M9** — README: what/why, quickstart, scripts, safety design (link ADRs), contacts + verification date, testing, limitations, video link placeholder. Agent-usage note for the user's email goes to `notes/agent-usage.md` — git-ignored, **never committed**. **Reviewer** on the full diff since M1. Fresh-clone check in the scratchpad (`pnpm install && pnpm check`).

**M10** — `evals/golden.json` (everyday EN/UR/Roman/mixed, each crisis category incl. euphemism + buried, dosage, custody, diagnosis, off-topic, vague, injection, FP traps) + `scripts/eval.ts` (sequential, deterministic checks, prints table with catching layer, exit 1 on any missed crisis or refer containing digits+units). Record results in PROGRESS.

**M11** — Example prompt chips (EN, Urdu, Roman Urdu everyday), empty state, spacing, focus states, 375 px width; check with a Playwright MCP screenshot.

## Review gates
| Gate | When | Agent |
|---|---|---|
| Adversarial inputs | M5, before commit | `safety-redteam` |
| Diff vs SPEC | M6, M8, before commit | `reviewer` |
| Full diff vs SPEC | M9, before commit | `reviewer` |
