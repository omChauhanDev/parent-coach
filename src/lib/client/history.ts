import type { CoachReply, Turn } from "@/lib/contract";

export const HISTORY_LIMIT = 8;
const TURN_MAX = 2000;

/** Flattens a reply into the plain text the model sees as a past coach turn. */
export function flattenReply(reply: CoachReply): string {
  return [reply.summary, ...reply.steps, reply.followUp.text].join("\n").slice(0, TURN_MAX);
}

/** The last 8 turns, oldest first (SPEC §2). */
export function recentHistory(turns: readonly Turn[]): Turn[] {
  return turns
    .slice(-HISTORY_LIMIT)
    .map((t) => ({ role: t.role, text: t.text.slice(0, TURN_MAX) }));
}
