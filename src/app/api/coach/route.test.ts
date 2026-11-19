// @vitest-environment node
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  OverloadedError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CoachReply, ErrorBody, type ModelOutput } from "@/lib/contract";
import {
  createCoachModel,
  type CoachModel,
  type FailureReason,
  type MessagesClient,
} from "@/lib/coach/model";

const create = vi.fn<MessagesClient["messages"]["create"]>();
let model: CoachModel | null = null;

vi.mock("@/lib/coach/anthropic-client", () => ({
  getCoachModel: () => model,
}));

const { POST } = await import("@/app/api/coach/route");

// ---------------------------------------------------------------- fixtures
const ROUTINE: ModelOutput = {
  risk: "routine",
  crisisCategory: "none",
  summary: "MODEL_SUMMARY bedtime battles are common at this age.",
  steps: ["MODEL_STEP keep the same short routine every night."],
  followUp: { kind: "checkin", text: "MODEL_FOLLOWUP try it for a week and tell me how it goes." },
};

function message(text: string | null, stop: Message["stop_reason"] = "end_turn"): Message {
  const content = [
    { type: "thinking", thinking: "", signature: "sig" },
    ...(text === null ? [] : [{ type: "text", text, citations: null }]),
  ];
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content,
    stop_reason: stop,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Message;
}
const output = (o: Partial<ModelOutput>) => message(JSON.stringify({ ...ROUTINE, ...o }));

const headers = new Headers({ "request-id": "req_test" });
const errBody = { type: "error", error: { type: "api_error", message: "upstream detail" } };

function post(body: unknown, init: RequestInit = {}): Promise<Response> {
  return POST(
    new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  );
}

async function reply(res: Response): Promise<CoachReply> {
  expect(res.status).toBe(200);
  return CoachReply.parse(await res.json());
}

const EVERYDAY = { message: "My 4-year-old screams every night at bedtime." };
let logs: string[] = [];

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue(output({}));
  model = createCoachModel({ messages: { create } }, "claude-opus-5-5");
  logs = [];
  vi.spyOn(console, "info").mockImplementation((line: unknown) => {
    logs.push(String(line));
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------- pre-screen (AC-4)
describe("pre-screen crisis (AC-4)", () => {
  it.each([
    [
      "en self_harm",
      "My 14-year-old told me tonight he wants to kill himself.",
      "AE",
      "self_harm",
      "en",
    ],
    [
      "ur self_harm",
      "میرا چودہ سال کا بیٹا کہہ رہا ہے کہ وہ خودکشی کرنا چاہتا ہے",
      "AE",
      "self_harm",
      "ur",
    ],
    [
      "roman self_harm PK",
      "Mera beta keh raha hai ke woh khudkushi kar lega",
      "PK",
      "self_harm",
      "roman_ur",
    ],
    ["en medical", "My toddler swallowed a button battery", "AE", "medical_emergency", "en"],
    ["ur abuse", "قاری صاحب بچی کو غلط جگہ ہاتھ لگاتے ہیں", "PK", "child_abuse", "ur"],
    ["roman dv", "mera shohar mujhe roz maarta hai", "AE", "domestic_violence", "roman_ur"],
  ])(
    "%s → escalation, source prescreen, model never called",
    async (_n, msg, region, category, language) => {
      const r = await reply(await post({ message: msg, region }));
      expect(r).toMatchObject({ kind: "escalation", risk: "crisis", language });
      expect(r.escalation).toMatchObject({ category, region, source: "prescreen" });
      expect(create).not.toHaveBeenCalled();
    },
  );

  it("escalates even with no API key configured", async () => {
    model = null;
    const r = await reply(await post({ message: "She is not breathing" }));
    expect(r.escalation?.source).toBe("prescreen");
  });

  it("only the current message is pre-screened; history goes to the model", async () => {
    const r = await reply(
      await post({
        message: "Thanks, she is safe now. How do I handle bedtime?",
        history: [{ role: "parent", text: "She said she wants to kill herself" }],
      }),
    );
    expect(r.kind).toBe("coach");
    expect(create).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------- model path
describe("model reply (AC-1, AC-7, AC-8, AC-9)", () => {
  it("everyday → coach routine built from validated model fields (AC-1)", async () => {
    const r = await reply(await post(EVERYDAY));
    expect(r).toMatchObject({
      kind: "coach",
      risk: "routine",
      language: "en",
      summary: ROUTINE.summary,
    });
    expect(r.steps).toEqual(ROUTINE.steps);
    expect(r.followUp).toEqual(ROUTINE.followUp);
  });

  it("sends structured-output params, the language, and parent text only in the user turn", async () => {
    await post({
      message: "Mera beta bohat ziddi hai",
      history: [{ role: "coach", text: "Earlier tip" }],
    });
    const [params] = create.mock.calls[0] ?? [];
    expect(params?.model).toBe("claude-opus-5-5");
    expect(params?.output_config?.effort).toBe("low");
    expect(params?.output_config?.format).toBeTruthy();
    expect(params).not.toHaveProperty("temperature");
    expect(String(params?.system)).not.toContain("ziddi");
    const user = JSON.stringify(params?.messages);
    expect(user).toContain("ziddi");
    expect(user).toContain("Earlier tip");
    expect(user).toContain("Roman Urdu");
  });

  it.each([
    ["crisis + category", { risk: "crisis", crisisCategory: "self_harm" }, "self_harm"],
    ["routine but category set", { risk: "routine", crisisCategory: "child_abuse" }, "child_abuse"],
    ["crisis without category → general", { risk: "crisis", crisisCategory: "none" }, "general"],
  ] as const)(
    "model flags %s → escalation, source model, model text discarded (AC-7)",
    async (_n, o, category) => {
      create.mockResolvedValue(output(o));
      const res = await post({
        message: "She gave away all her things and said she won't need them soon.",
      });
      const raw = await res.clone().text();
      const r = await reply(res);
      expect(r).toMatchObject({ kind: "escalation", risk: "crisis" });
      expect(r.escalation).toMatchObject({ category, source: "model", region: "AE" });
      expect(raw).not.toMatch(/MODEL_/);
    },
  );

  it("refer with clean text → coach refer from model fields (AC-8)", async () => {
    create.mockResolvedValue(
      output({
        risk: "refer",
        summary: "MODEL_SUMMARY a doctor or pharmacist should advise on medicine.",
      }),
    );
    const r = await reply(await post({ message: "How much paracetamol for my 2 year old?" }));
    expect(r).toMatchObject({ kind: "coach", risk: "refer" });
    // Built from the model's (clean) fields, not replaced by the refer template.
    expect(r.summary).toBe("MODEL_SUMMARY a doctor or pharmacist should advise on medicine.");
    expect(logs.at(-1)).not.toContain('"failure"');
  });

  it.each([
    ["3+ digit run", { steps: ["MODEL_STEP call 999 now"] }],
    ["URL", { summary: "MODEL_SUMMARY see https://example.com" }],
    ["dosage unit", { risk: "refer", steps: ["MODEL_STEP give 5 ml at night"] }],
    [
      "medicine name",
      { followUp: { kind: "question", text: "MODEL_FOLLOWUP did paracetamol help?" } },
    ],
  ] as const)("post-check: %s → refer template, model text never shown (AC-9)", async (_n, o) => {
    create.mockResolvedValue(output(o as Partial<ModelOutput>));
    const res = await post(EVERYDAY);
    const raw = await res.clone().text();
    const r = await reply(res);
    expect(r).toMatchObject({ kind: "coach", risk: "refer" });
    expect(raw).not.toMatch(/MODEL_/);
    expect(logs.at(-1)).toContain('"failure":"postcheck"');
  });
});

// ---------------------------------------------------------------- failures (AC-10, ARCHITECTURE §4)
describe("failure modes → fallback, HTTP 200, no details (AC-10)", () => {
  it.each<[string, () => void, FailureReason]>([
    ["timeout", () => create.mockRejectedValue(new APIConnectionTimeoutError()), "timeout"],
    [
      "429",
      () => create.mockRejectedValue(new RateLimitError(429, errBody, "rate limited", headers)),
      "rate_limit",
    ],
    [
      "500",
      () => create.mockRejectedValue(new InternalServerError(500, errBody, "boom", headers)),
      "upstream",
    ],
    [
      "529",
      () => create.mockRejectedValue(new OverloadedError(529, errBody, "overloaded", headers)),
      "upstream",
    ],
    [
      "401",
      () => create.mockRejectedValue(new AuthenticationError(401, errBody, "bad key", headers)),
      "auth",
    ],
    [
      "400",
      () => create.mockRejectedValue(new BadRequestError(400, errBody, "bad request", headers)),
      "bad_request",
    ],
    [
      "connection",
      () => create.mockRejectedValue(new APIConnectionError({ message: "ECONNRESET" })),
      "network",
    ],
    ["unknown throw", () => create.mockRejectedValue(new Error("weird")), "unexpected"],
    [
      "refusal",
      () => create.mockResolvedValue(message(JSON.stringify(ROUTINE), "refusal")),
      "refusal",
    ],
    [
      "max_tokens",
      () => create.mockResolvedValue(message('{"risk":"routine","summ', "max_tokens")),
      "max_tokens",
    ],
    [
      "non-JSON",
      () => create.mockResolvedValue(message("Sure! Here is some advice.")),
      "malformed",
    ],
    [
      "schema mismatch",
      () => create.mockResolvedValue(message(JSON.stringify({ ...ROUTINE, steps: [] }))),
      "malformed",
    ],
    ["no text block", () => create.mockResolvedValue(message(null)), "malformed"],
    ["missing key", () => (model = null), "config"],
  ])("%s → fallback (%s)", async (_n, arrange, failure) => {
    arrange();
    const res = await post({ ...EVERYDAY, region: "PK" });
    const raw = await res.clone().text();
    const r = await reply(res);
    expect(r).toMatchObject({ kind: "fallback", risk: "unknown", language: "en" });
    expect(r.steps.join(" ")).toContain("15");
    expect(raw).not.toMatch(/upstream detail|bad key|ECONNRESET|weird|req_test/);
    expect(logs.at(-1)).toContain(`"failure":"${failure}"`);
  });

  it("replies with a fallback within 20 s when the model hangs (AC-14)", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    create.mockImplementation((_body, options) => {
      signal = options?.signal;
      return new Promise<Message>(() => {});
    });
    const pending = post(EVERYDAY);
    await vi.advanceTimersByTimeAsync(20_000);
    const r = await reply(await pending);
    expect(r.kind).toBe("fallback");
    expect(signal?.aborted).toBe(true);
    expect(logs.at(-1)).toContain('"failure":"timeout"');
  });
});

// ---------------------------------------------------------------- input validation (AC-11)
describe("invalid input → 400 ErrorBody (AC-11)", () => {
  it.each([
    ["invalid JSON", "{not json"],
    ["empty message", { message: "" }],
    ["whitespace message", { message: "   " }],
    ["1001 chars", { message: "a".repeat(1001) }],
    ["wrong type", { message: 42 }],
    ["bad region", { message: "hi", region: "IN" }],
    ["9 history turns", { message: "hi", history: Array(9).fill({ role: "parent", text: "x" }) }],
    [
      "body over 16 KB",
      {
        message: "hi",
        history: [{ role: "parent", text: "x".repeat(1999) }],
        pad: "y".repeat(17_000),
      },
    ],
  ])("%s", async (_n, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(ErrorBody.safeParse(await res.json()).success).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------- logging (AC-15)
describe("logging (AC-15)", () => {
  it("logs one line per request without message or history text", async () => {
    const secret = "Zubaida-unique-phrase";
    await post({
      message: `My son ${secret} won't sleep`,
      history: [{ role: "parent", text: `${secret} history` }],
    });
    await post({ message: `${secret} wants to kill himself` });
    await post({ message: "" });
    expect(logs).toHaveLength(3);
    for (const line of logs) expect(line).not.toContain(secret);
    expect(JSON.parse(logs[0] ?? "{}")).toMatchObject({
      kind: "coach",
      risk: "routine",
      language: "en",
    });
    expect(JSON.parse(logs[1] ?? "{}")).toMatchObject({
      kind: "escalation",
      category: "self_harm",
      source: "prescreen",
    });
    expect(JSON.parse(logs[2] ?? "{}")).toMatchObject({ failure: "invalid_request" });
  });
});
