# ADR 0001 — Layered, fail-closed safety; escalation text is never model-written

Status: accepted · 2026-11-19

## Context
The coach must escalate emergencies, abuse, self-harm and domestic violence in three languages and must
never show unsafe text. Model output can be wrong, malformed, slow, refused, or steered by the input.
A missed crisis costs far more than an unnecessary escalation.

## Decision
1. A deterministic multilingual pre-screen runs first on the normalised message. A hit returns a
   pre-written escalation with **no model call**.
2. The model also classifies risk (ADR 0002). If it flags a crisis, the server discards the model's text
   and serves the **same pre-written escalation** (source `model`).
3. Model output is Zod-validated, then post-checked (no 3+ digit runs, URLs or dosage units). Any failure →
   pre-written fallback or refer template. Raw model text never reaches the UI.
4. Contacts are data (`contacts.ts`) with official source URLs, re-verified against raw page text on
   2026-11-19. The model is told not to write numbers; the post-check enforces it.
5. The selected region's emergency numbers are always in the footer, so even a client-side network failure
   leaves a path to help.
6. Prefer false positives, but match phrases (person + act, age + fever), not single words. Every
   escalation's follow-up invites the parent to continue if no one is in danger.

## Alternatives rejected
- **Prompt-only safety** — its failure mode (a confident, wrong, casual reply) is the one we must not have.
- **Model-written escalations** — wording can't be reviewed in advance and numbers can't be trusted.
- **Single-keyword blocking** ("kill", "mar") — Urdu hyperbole ("main to mar gayi") would make everyday use escalate.

## Consequences
- \+ Crisis handling works without an API key, during outages, and in milliseconds.
- \+ Every crisis response is reviewable text in the repo.
- − Pattern lists need maintenance; euphemisms rely on the model layer, measured by `pnpm eval`.
- − Urdu and Roman Urdu templates need native-speaker review.
