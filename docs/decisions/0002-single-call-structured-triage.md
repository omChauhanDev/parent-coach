# ADR 0002 — One structured-output call with in-schema risk triage

Status: accepted · 2026-11-19

## Context
The proposed design had model risk triage as its own step and a structured reply via tool use or JSON
schema. Facts checked on 2026-11-19:
- Forced `tool_choice` (`tool` / `any`) returns 400 on `claude-opus-5-5`.
- Native structured outputs (`output_config.format`) constrain decoding to a JSON schema, but the SDK strips
  `maxLength` / `maxItems` / `minLength` from what the model sees.
- The SDK's `messages.parse()` never inspects `stop_reason`, so a refusal or truncation surfaces only as a
  generic parse error.

## Decision
- One call to `claude-opus-5-5` (`effort: "low"`) with `output_config.format = zodOutputFormat(ModelOutput)`.
  `risk` and `crisisCategory` are the first fields, so the model classifies before it writes advice.
- Use `messages.create()`, check `stop_reason` (`refusal`, `max_tokens` → fallback), take the text block,
  `JSON.parse`, then `ModelOutput.safeParse`. Zod is the real enforcement of lengths and counts.
- No separate classifier call.

## Alternatives rejected
- **Separate triage call** (e.g. a small model before the coach): doubles latency, timeouts and mocks for a
  marginal recall gain, because the deterministic pre-screen already runs first. Revisit if `pnpm eval`
  shows model-layer crisis recall below 100%.
- **Forced tool use**: 400 on current models.
- **`messages.parse()`**: loses the refusal / truncation distinction we need for logging.

## Consequences
- \+ One request, one deadline, one mock.
- − An injection that passes the pre-screen could downgrade the model's own triage. Mitigated by the system
  prompt, the deterministic layers and injection cases in `pnpm eval`.
