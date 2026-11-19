import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  createCoachModel,
  DEFAULT_MODEL,
  SDK_MAX_RETRIES,
  SDK_TIMEOUT_MS,
  type CoachModel,
} from "@/lib/coach/model";

let cached: { key: string; model: CoachModel } | undefined;

/** The only place the API key is read. Returns null when no key is configured. */
export function getCoachModel(): CoachModel | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  if (cached?.key !== apiKey) {
    const client = new Anthropic({ apiKey, timeout: SDK_TIMEOUT_MS, maxRetries: SDK_MAX_RETRIES });
    cached = {
      key: apiKey,
      model: createCoachModel(client, process.env.COACH_MODEL || DEFAULT_MODEL),
    };
  }
  return cached.model;
}
