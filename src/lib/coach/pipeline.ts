import { CoachReply, type ChatRequest, type Language, type ModelOutput } from "@/lib/contract";
import { detectLanguage } from "@/lib/language";
import { buildFallback, LAST_RESORT_REPLY } from "@/lib/safety/templates";
import type { CoachModel } from "@/lib/coach/model";
import type { LogLine } from "@/lib/log";

export interface ChatDeps {
  /** null when no API key is configured. */
  model: CoachModel | null;
  log?: (line: LogLine) => void;
  now?: () => number;
}

export interface ChatOutcome {
  reply: CoachReply;
  meta: LogLine;
}

interface Decision {
  reply: CoachReply;
  failure?: LogLine["failure"];
}

function coachReply(output: ModelOutput, language: Language): CoachReply {
  return {
    kind: "coach",
    language,
    risk: output.risk === "refer" ? "refer" : "routine",
    summary: output.summary,
    steps: output.steps,
    followUp: output.followUp,
  };
}

async function decide(request: ChatRequest, language: Language, deps: ChatDeps): Promise<Decision> {
  const { region } = request;
  if (!deps.model) return { reply: buildFallback(language, region), failure: "config" };

  const result = await deps.model.generate({
    message: request.message,
    history: request.history.slice(-8),
    language,
  });
  if (!result.ok) return { reply: buildFallback(language, region), failure: result.reason };

  const { output } = result;
  // Until the escalation templates land, a model-flagged crisis fails closed to the fallback.
  if (output.risk === "crisis" || output.crisisCategory !== "none") {
    return { reply: buildFallback(language, region) };
  }
  return { reply: coachReply(output, language) };
}

/** Orchestrates the safety layers for one validated request. Never throws. */
export async function handleChat(request: ChatRequest, deps: ChatDeps): Promise<ChatOutcome> {
  const now = deps.now ?? Date.now;
  const started = now();
  let language: Language = "en";
  let decision: Decision;
  try {
    language = detectLanguage(request.message);
    decision = await decide(request, language, deps);
  } catch {
    decision = { reply: buildFallback(language, request.region), failure: "unexpected" };
  }

  const checked = CoachReply.safeParse(decision.reply);
  const reply = checked.success ? checked.data : LAST_RESORT_REPLY;
  const failure = checked.success ? decision.failure : "unexpected";

  const meta: LogLine = {
    kind: reply.kind,
    risk: reply.risk,
    ...(reply.escalation
      ? { category: reply.escalation.category, source: reply.escalation.source }
      : {}),
    language: reply.language,
    ...(failure ? { failure } : {}),
    ms: Math.round(now() - started),
  };
  deps.log?.(meta);
  return { reply, meta };
}
