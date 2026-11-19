import {
  AnthropicError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
  GatewayTimeoutError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
  RequestTimeoutError,
} from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import { ModelOutput, type Language, type Turn } from "@/lib/contract";
import { buildMessages, SYSTEM_PROMPT } from "@/lib/coach/prompt";

export const DEFAULT_MODEL = "claude-opus-5-5";
export const MAX_TOKENS = 16_000;
/**
 * SDK per-attempt timeout and retries. One slow attempt may use almost the whole pipeline deadline
 * (19 s); the single retry is for fast failures (429, 5xx, dropped connection). Urdu replies have taken
 * up to ~14 s, so a 15 s attempt timeout used to kill them and leave no time for the retry.
 */
export const SDK_TIMEOUT_MS = 18_000;
export const SDK_MAX_RETRIES = 1;

export type FailureReason =
  | "config"
  | "timeout"
  | "rate_limit"
  | "upstream"
  | "auth"
  | "bad_request"
  | "network"
  | "refusal"
  | "max_tokens"
  | "malformed"
  | "unexpected";

export type ModelResult = { ok: true; output: ModelOutput } | { ok: false; reason: FailureReason };

export interface GenerateInput {
  message: string;
  history: readonly Turn[];
  language: Language;
}

export interface CoachModel {
  /** Never throws: every failure becomes `{ ok: false, reason }`. */
  generate(input: GenerateInput, signal?: AbortSignal): Promise<ModelResult>;
}

/** The slice of the Anthropic client we use, so tests can pass a fake. */
export interface MessagesClient {
  messages: {
    create(
      body: MessageCreateParamsNonStreaming,
      options?: { signal?: AbortSignal },
    ): PromiseLike<Message>;
  };
}

const OUTPUT_FORMAT = zodOutputFormat(ModelOutput);

/** Maps a raw response to a validated `ModelOutput` or a failure reason (SPEC §6.2 L3). */
export function parseResponse(response: Message): ModelResult {
  if (response.stop_reason === "refusal") return { ok: false, reason: "refusal" };
  if (response.stop_reason === "max_tokens") return { ok: false, reason: "max_tokens" };
  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") return { ok: false, reason: "malformed" };
  let json: unknown;
  try {
    json = JSON.parse(text.text);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const parsed = ModelOutput.safeParse(json);
  return parsed.success ? { ok: true, output: parsed.data } : { ok: false, reason: "malformed" };
}

/** SDK error → failure reason (ARCHITECTURE §4). Most specific classes first: they share bases. */
export function mapError(error: unknown): FailureReason {
  if (error instanceof APIUserAbortError) return "timeout"; // our 20 s deadline
  if (error instanceof APIConnectionTimeoutError) return "timeout";
  if (error instanceof APIConnectionError) return "network";
  if (error instanceof RateLimitError) return "rate_limit";
  if (error instanceof AuthenticationError || error instanceof PermissionDeniedError) return "auth";
  if (error instanceof RequestTimeoutError || error instanceof GatewayTimeoutError)
    return "timeout";
  if (error instanceof InternalServerError) return "upstream"; // 5xx incl. 529 OverloadedError
  if (error instanceof APIError) {
    return typeof error.status === "number" && error.status >= 500 ? "upstream" : "bad_request";
  }
  if (error instanceof AnthropicError) return "malformed";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "unexpected";
}

export function createCoachModel(
  client: MessagesClient,
  model: string = DEFAULT_MODEL,
): CoachModel {
  return {
    async generate(input, signal) {
      try {
        const response = await client.messages.create(
          {
            model,
            max_tokens: MAX_TOKENS,
            system: SYSTEM_PROMPT,
            messages: buildMessages(input),
            output_config: { effort: "low", format: OUTPUT_FORMAT },
          },
          signal ? { signal } : undefined,
        );
        return parseResponse(response);
      } catch (error) {
        return { ok: false, reason: mapError(error) };
      }
    },
  };
}
