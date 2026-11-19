import { describe, expect, it } from "vitest";
import { ChatRequest, type Turn } from "@/lib/contract";
import { buildRequestBody } from "@/lib/client/history";
import { MAX_BODY_BYTES } from "@/lib/limits";

const bytes = (s: string) => new TextEncoder().encode(s).length;
const urdu = (n: number) => "ب".repeat(n);

describe("buildRequestBody (body ≤ 16 KB so the message is always pre-screened)", () => {
  it.each<[string, Turn[], number]>([
    ["short English history keeps all 8 turns", Array(8).fill({ role: "parent", text: "hi" }), 8],
    [
      "4 long Urdu exchanges drop the oldest turns",
      Array.from({ length: 4 }, () => [
        { role: "parent" as const, text: urdu(800) },
        { role: "coach" as const, text: urdu(1045) },
      ]).flat(),
      -1,
    ],
    ["8 max-length Urdu turns", Array(8).fill({ role: "coach", text: urdu(2000) }), -1],
  ])("%s", (_name, history, expectedTurns) => {
    const message = urdu(1000);
    const body = buildRequestBody(message, history, "PK");
    expect(bytes(body)).toBeLessThanOrEqual(MAX_BODY_BYTES);
    const parsed = ChatRequest.parse(JSON.parse(body));
    expect(parsed.message).toBe(message);
    expect(parsed.region).toBe("PK");
    if (expectedTurns >= 0) expect(parsed.history).toHaveLength(expectedTurns);
    else {
      expect(parsed.history.length).toBeLessThan(history.length);
      // what remains is the most recent turns, in order
      expect(parsed.history).toEqual(history.slice(history.length - parsed.history.length));
    }
  });
});
