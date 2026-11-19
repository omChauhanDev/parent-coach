import { describe, expect, it } from "vitest";
import { ChatRequest, CoachReply, ModelOutput } from "@/lib/contract";

const contact = { label: "Police", number: "999", sourceUrl: "https://u.ae/en" };
const base = {
  language: "en",
  summary: "s",
  steps: ["a"],
  followUp: { kind: "checkin", text: "t" },
} as const;

describe("ChatRequest", () => {
  it.each([
    ["minimal message gets defaults", { message: "hi" }, true],
    ["trims whitespace", { message: "  hi  " }, true],
    ["empty message", { message: "" }, false],
    ["whitespace-only message", { message: "   " }, false],
    ["1000 chars", { message: "a".repeat(1000) }, true],
    ["1001 chars", { message: "a".repeat(1001) }, false],
    ["PK region", { message: "hi", region: "PK" }, true],
    ["unknown region", { message: "hi", region: "IN" }, false],
    [
      "8 turns of history",
      { message: "hi", history: Array(8).fill({ role: "parent", text: "x" }) },
      true,
    ],
    [
      "9 turns of history",
      { message: "hi", history: Array(9).fill({ role: "parent", text: "x" }) },
      false,
    ],
    ["bad turn role", { message: "hi", history: [{ role: "system", text: "x" }] }, false],
    ["missing message", { region: "AE" }, false],
    ["not an object", "hello", false],
  ])("%s", (_name, input, ok) => {
    expect(ChatRequest.safeParse(input).success).toBe(ok);
  });

  it("applies defaults", () => {
    expect(ChatRequest.parse({ message: "  hi " })).toEqual({
      message: "hi",
      history: [],
      region: "AE",
    });
  });
});

describe("ModelOutput", () => {
  const ok = {
    risk: "routine",
    crisisCategory: "none",
    summary: "s",
    steps: ["a"],
    followUp: { kind: "question", text: "q" },
  };
  it.each([
    ["valid", ok, true],
    ["crisis with category", { ...ok, risk: "crisis", crisisCategory: "self_harm" }, true],
    ["safety check", { ...ok, risk: "safety_check", crisisCategory: "none" }, true],
    ["unknown risk", { ...ok, risk: "high" }, false],
    ["unknown category", { ...ok, crisisCategory: "bullying" }, false],
    ["no steps", { ...ok, steps: [] }, false],
    ["5 steps", { ...ok, steps: ["a", "b", "c", "d", "e"] }, false],
    ["summary over 300", { ...ok, summary: "x".repeat(301) }, false],
    ["step over 220", { ...ok, steps: ["x".repeat(221)] }, false],
    ["follow-up over 200", { ...ok, followUp: { kind: "question", text: "x".repeat(201) } }, false],
    ["missing followUp", { ...ok, followUp: undefined }, false],
  ])("%s", (_name, input, valid) => {
    expect(ModelOutput.safeParse(input).success).toBe(valid);
  });
});

describe("CoachReply", () => {
  const escalation = {
    category: "self_harm",
    region: "AE",
    source: "prescreen",
    contacts: [contact],
  };
  it.each([
    ["coach reply", { ...base, kind: "coach", risk: "routine" }, true],
    ["fallback reply", { ...base, kind: "fallback", risk: "unknown" }, true],
    [
      "escalation with escalation block",
      { ...base, kind: "escalation", risk: "crisis", escalation },
      true,
    ],
    ["escalation without block", { ...base, kind: "escalation", risk: "crisis" }, false],
    ["coach with escalation block", { ...base, kind: "coach", risk: "routine", escalation }, false],
    [
      "no contacts",
      { ...base, kind: "escalation", risk: "crisis", escalation: { ...escalation, contacts: [] } },
      false,
    ],
    [
      "4 contacts",
      {
        ...base,
        kind: "escalation",
        risk: "crisis",
        escalation: { ...escalation, contacts: Array(4).fill(contact) },
      },
      false,
    ],
    [
      "contact without a URL source",
      {
        ...base,
        kind: "escalation",
        risk: "crisis",
        escalation: { ...escalation, contacts: [{ ...contact, sourceUrl: "u.ae" }] },
      },
      false,
    ],
    ["unknown language", { ...base, kind: "coach", risk: "routine", language: "hi" }, false],
  ])("%s", (_name, input, valid) => {
    expect(CoachReply.safeParse(input).success).toBe(valid);
  });
});
