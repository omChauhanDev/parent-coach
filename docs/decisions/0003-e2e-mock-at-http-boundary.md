# ADR 0003 — E2E tests mock the Anthropic API at the HTTP boundary

Status: accepted · 2026-11-19

## Context
End-to-end tests must run in CI without an API key and with deterministic output. Playwright's
`page.route` only intercepts browser traffic, not the server's call to Anthropic.

## Decision
Playwright's `webServer` array starts a small Node mock of `POST /v1/messages` (plus `/health` and
`/__count`) and `next build && next start` with `ANTHROPIC_BASE_URL` pointing at it. The SDK honours
`ANTHROPIC_BASE_URL`, and process env takes precedence over `.env.local`. The mock returns
`content-type: application/json` with a canned `ModelOutput` in `content[0].text`, and counts requests so
the crisis test can assert the model was never called.

## Alternatives rejected
- **An env flag that swaps in a fake model inside app code** — test code on the production path.
- **MSW inside the Next server** — more moving parts for the same result.
- **Real API in CI** — needs a secret, costs money, non-deterministic.

## Consequences
- \+ Production code has zero test hooks; the real SDK serialisation and our parsing are exercised.
- − The mock must keep the response shape the SDK expects.
