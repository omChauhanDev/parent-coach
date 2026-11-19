import type { CoachReply, Language } from "@/lib/contract";
import type { FailureReason } from "@/lib/coach/model";

/** One line per request (SPEC §6.6). Deliberately has no field that could carry message text. */
export interface LogLine {
  kind?: CoachReply["kind"];
  risk?: CoachReply["risk"];
  category?: NonNullable<CoachReply["escalation"]>["category"];
  source?: NonNullable<CoachReply["escalation"]>["source"];
  language?: Language;
  failure?: FailureReason | "postcheck" | "invalid_request";
  ms: number;
}

export function logRequest(line: LogLine): void {
  console.info(JSON.stringify({ route: "/api/coach", ...line }));
}
