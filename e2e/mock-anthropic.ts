/**
 * Local stand-in for the Anthropic Messages API (ADR 0003). The Next server under test points
 * `ANTHROPIC_BASE_URL` here; the real SDK serialises the request and parses this response.
 *   POST /v1/messages → canned structured output (language picked from the request)
 *   GET  /health      → 200 once listening
 *   GET  /__count     → { count } of /v1/messages requests received
 *   GET  /__last      → { historyTurns } sent in the last /v1/messages request
 *   POST /__reset     → resets the count
 */
import { createServer, type IncomingMessage } from "node:http";
import type { ModelOutput } from "../src/lib/contract";

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const CANNED: Record<"en" | "ur" | "roman_ur", ModelOutput> = {
  en: {
    risk: "routine",
    crisisCategory: "none",
    summary:
      "Bedtime battles are really common at four, and a calm, predictable routine usually helps.",
    steps: [
      "Start the same short routine at the same time each night: bath, pyjamas, two books, lights out.",
      "Give a five-minute warning before each step so the change doesn't come as a surprise.",
      "If he gets up, walk him back to bed calmly with as few words as possible.",
    ],
    followUp: { kind: "checkin", text: "Try this for a week and tell me how long settling takes." },
  },
  ur: {
    risk: "routine",
    crisisCategory: "none",
    summary: "کھانے کے وقت ضد اس عمر میں عام ہے، اور پرسکون معمول سے فرق پڑتا ہے۔",
    steps: [
      "کھانے کا وقت روز ایک جیسا رکھیں اور اسکرین بند کر دیں۔",
      "تھوڑی مقدار دیں اور بچے کو خود کھانے دیں۔",
    ],
    followUp: { kind: "checkin", text: "ایک ہفتہ آزما کر بتائیں کہ کھانے کا وقت کیسا گزرا۔" },
  },
  roman_ur: {
    risk: "routine",
    crisisCategory: "none",
    summary: "Is umar mein school jane se rona aam hai, aur pyar bhara mamool madad karta hai.",
    steps: [
      "Subah ka mamool har din ek jaisa rakhein.",
      "Alvida ko chhota aur pyar bhara rakhein, phir chale jayein.",
    ],
    followUp: { kind: "checkin", text: "Ek hafta aazma kar batayein ke subah kaisi guzri." },
  },
};

let count = 0;
let lastHistoryTurns = -1;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk.toString("utf8")));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** The app sends one user turn whose text embeds `{replyLanguage, history, message}` as JSON. */
function historyTurns(body: string): number {
  try {
    const request = JSON.parse(body) as { messages?: { content?: unknown }[] };
    const content = request.messages?.[0]?.content;
    const text = typeof content === "string" ? content : "";
    const data = JSON.parse(text.slice(text.indexOf("{"))) as { history?: unknown[] };
    return Array.isArray(data.history) ? data.history.length : -1;
  } catch {
    return -1;
  }
}

function pickLanguage(body: string): keyof typeof CANNED {
  if (body.includes("Roman Urdu")) return "roman_ur";
  if (body.includes("Nastaliq")) return "ur";
  return "en";
}

const server = createServer(async (req, res) => {
  const json = (status: number, payload: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  if (req.method === "GET" && req.url === "/health") return json(200, { ok: true });
  if (req.method === "GET" && req.url === "/__count") return json(200, { count });
  if (req.method === "GET" && req.url === "/__last")
    return json(200, { historyTurns: lastHistoryTurns });
  if (req.method === "POST" && req.url === "/__reset") {
    count = 0;
    return json(200, { count });
  }
  if (req.method === "POST" && req.url?.startsWith("/v1/messages")) {
    count += 1;
    const body = await readBody(req);
    lastHistoryTurns = historyTurns(body);
    return json(200, {
      id: `msg_mock_${count}`,
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: [{ type: "text", text: JSON.stringify(CANNED[pickLanguage(body)]) }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  }
  json(404, { type: "error", error: { type: "not_found_error", message: "not found" } });
});

server.listen(PORT, () => console.log(`mock anthropic listening on ${PORT}`));
