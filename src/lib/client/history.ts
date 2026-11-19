import type { CoachReply, Region, Turn } from "@/lib/contract";
import { HISTORY_LIMIT, MAX_BODY_BYTES } from "@/lib/limits";

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

const utf8Bytes = (text: string): number => new TextEncoder().encode(text).length;

/**
 * The JSON body for `POST /api/coach`. Urdu takes 2 bytes per letter in UTF-8, so a long Urdu
 * conversation can exceed the server's 16 KB limit even with only 8 turns; the oldest turns are
 * dropped until it fits, so the current message is always sent (and pre-screened).
 */
export function buildRequestBody(
  message: string,
  history: readonly Turn[],
  region: Region,
): string {
  let turns = recentHistory(history);
  let body = JSON.stringify({ message, history: turns, region });
  while (utf8Bytes(body) > MAX_BODY_BYTES && turns.length > 0) {
    turns = turns.slice(1);
    body = JSON.stringify({ message, history: turns, region });
  }
  return body;
}
