import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createCoachModel, DEFAULT_MODEL, type CoachModel } from "@/lib/coach/model";

/** SDK per-attempt timeout; the pipeline also enforces an overall 20 s deadline. */
export const SDK_TIMEOUT_MS = 15_000;

let cached: { key: string; model: CoachModel } | undefined;

/** The only place the API key is read. Returns null when no key is configured. */
export function getCoachModel(): CoachModel | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  if (cached?.key !== apiKey) {
    const client = new Anthropic({ apiKey, timeout: SDK_TIMEOUT_MS, maxRetries: 1 });
    cached = {
      key: apiKey,
      model: createCoachModel(client, process.env.COACH_MODEL || DEFAULT_MODEL),
    };
  }
  return cached.model;
}
