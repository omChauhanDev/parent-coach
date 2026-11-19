import { CoachReply, type ChatRequest, type Language, type ModelOutput } from "@/lib/contract";
import { detectLanguage } from "@/lib/language";
import { postCheck } from "@/lib/safety/postcheck";
import { preScreen } from "@/lib/safety/prescreen";
import {
  buildEscalation,
  buildFallback,
  buildRefer,
  buildSafetyCheck,
  LAST_RESORT,
} from "@/lib/safety/templates";
import type { CoachModel, GenerateInput, ModelResult } from "@/lib/coach/model";
import type { LogLine } from "@/lib/log";

export interface ChatDeps {
  /** null when no API key is configured. */
  model: CoachModel | null;
  log?: (line: LogLine) => void;
  now?: () => number;
  /** Overall model deadline; a reply (possibly fallback) always arrives before 20 s (AC-14). */
  deadlineMs?: number;
}

export const MODEL_DEADLINE_MS = 19_000;

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

/** Races the model against the deadline and aborts the request when the deadline wins. */
async function generateWithDeadline(
  model: CoachModel,
  input: GenerateInput,
  deadlineMs: number,
): Promise<ModelResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<ModelResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ ok: false, reason: "timeout" });
    }, deadlineMs);
  });
  try {
    return await Promise.race([model.generate(input, controller.signal), deadline]);
  } finally {
    clearTimeout(timer);
  }
}

async function decide(request: ChatRequest, language: Language, deps: ChatDeps): Promise<Decision> {
  const { region } = request;

  // L1: deterministic pre-screen of the current message only; a hit never reaches the model.
  const hit = preScreen(request.message);
  if (hit) return { reply: buildEscalation(hit.category, language, region, "prescreen") };

  if (!deps.model) return { reply: buildFallback(language, region), failure: "config" };

  // L2 + L3: one structured-output call; any failure is fail-closed to the fallback.
  const result = await generateWithDeadline(
    deps.model,
    { message: request.message, history: request.history.slice(-8), language },
    deps.deadlineMs ?? MODEL_DEADLINE_MS,
  );
  if (!result.ok) return { reply: buildFallback(language, region), failure: result.reason };

  // Triage gate: a crisis or safety-check flag OR any category discards the model's text entirely.
  const { output } = result;
  const category = output.crisisCategory === "none" ? "general" : output.crisisCategory;
  // Earlier crisis, nothing new that is dangerous, safety not confirmed → ask before helping. With no
  // history there is no earlier crisis to refer to, so the full card is shown instead.
  if (output.risk === "safety_check" && request.history.length > 0) {
    return { reply: buildSafetyCheck(category, language, region) };
  }
  if (
    output.risk === "crisis" ||
    output.risk === "safety_check" ||
    output.crisisCategory !== "none"
  ) {
    return { reply: buildEscalation(category, language, region, "model") };
  }

  // L4: post-check of everything the model wrote.
  if (postCheck([output.summary, ...output.steps, output.followUp.text])) {
    return { reply: buildRefer(language, region), failure: "postcheck" };
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
  const reply = checked.success ? checked.data : LAST_RESORT[request.region];
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
