import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ModelOutput, type Language, type Turn } from "@/lib/contract";
import { buildMessages, SYSTEM_PROMPT } from "@/lib/coach/prompt";

export const DEFAULT_MODEL = "claude-opus-5-5";
export const MAX_TOKENS = 16_000;

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

export function mapError(): FailureReason {
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
      } catch {
        return { ok: false, reason: mapError() };
      }
    },
  };
}
