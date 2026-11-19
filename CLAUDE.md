# Parent Coach

Next.js app: a parent describes a concern (English / Urdu / Roman Urdu); an LLM coach returns a brief,
structured, safe plan with a follow-up, and escalates crises with verified contacts.
Read first: docs/SPEC.md (contract, safety policy, ACs) · docs/ARCHITECTURE.md · docs/PLAN.md · docs/PROGRESS.md

## Commands
- `pnpm dev` — local app (needs `ANTHROPIC_API_KEY` in `.env.local`)
- `pnpm check` — typecheck + lint + unit/integration tests; must pass before every commit
- `pnpm build` · `pnpm e2e` (Playwright against a mocked Anthropic API)
- `pnpm eval` — golden set against the real model; costs money; never in CI

## Conventions
- TypeScript strict; no `any`; validate every boundary with Zod (`src/lib/contract.ts`).
- The UI renders `CoachReply` fields only — never raw model text.
- Escalation, refer and fallback text come only from `src/lib/safety/templates.ts`; contacts only from
  `src/lib/safety/contacts.ts` (official https source + `verifiedOn`). Never write a phone number from memory.
- Any failure → safe fallback (fail closed). The pre-screen prefers false positives, matched at phrase level.
- Every safety change ships with a table-driven test row. No snapshot tests.
- The API key stays server-side (`anthropic-client.ts`, `server-only`). Never log message text.
- Look up library APIs and versions with the `researcher` agent instead of guessing; pin exact versions.

## Workflow
- Run `date` at the start of every milestone and compare with the deadline in docs/PROGRESS.md.
- One milestone = one commit, using the subject pre-written in docs/PLAN.md.
- Update docs/PROGRESS.md before every commit (status, decisions, next step, cut log).
- After each milestone, use the next-devtools MCP to check build/runtime errors.
- Review gates per docs/PLAN.md: `safety-redteam` in M5; `reviewer` in M6, M8 and before M9.
- Behind schedule → cut from the end of the plan (polish first, never safety) and log it in PROGRESS.

## Git
- Commit as the configured git user. Never pass `--author`, never `--no-verify`, never rewrite pushed history.
- Message = one Conventional Commit subject line, ≤ 60 chars (e.g. `feat: add safety pre-screen`).
  No body, no trailers, no Co-Authored-By.
- From M2, lefthook `commit-msg` (piped): `scripts/sanitize-commit-msg.sh` → commitlint.

## Compaction
When compacting, preserve: the list of modified files, the current milestone and its done-when check,
failing tests with their error output, and any decision not yet written to docs/PROGRESS.md.
