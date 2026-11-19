// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachReply, type ModelOutput } from "@/lib/contract";
import type { CoachModel, ModelResult } from "@/lib/coach/model";

const generate = vi.fn<CoachModel["generate"]>();
let model: CoachModel | null = { generate };

vi.mock("@/lib/coach/anthropic-client", () => ({
  getCoachModel: () => model,
}));

const { POST } = await import("@/app/api/coach/route");

const ROUTINE: ModelOutput = {
  risk: "routine",
  crisisCategory: "none",
  summary: "Bedtime battles are common at this age.",
  steps: ["Keep the same short routine every night."],
  followUp: { kind: "checkin", text: "Try it for a week and tell me how it goes." },
};

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function reply(res: Response) {
  expect(res.status).toBe(200);
  return CoachReply.parse(await res.json());
}

beforeEach(() => {
  model = { generate };
  generate.mockReset();
  generate.mockResolvedValue({ ok: true, output: ROUTINE } satisfies ModelResult);
  vi.spyOn(console, "info").mockImplementation(() => {});
});

describe("POST /api/coach — pre-screen crisis (AC-4)", () => {
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
    async (_n, message, region, category, language) => {
      const r = await reply(await post({ message, region }));
      expect(r).toMatchObject({ kind: "escalation", risk: "crisis", language });
      expect(r.escalation).toMatchObject({ category, region, source: "prescreen" });
      expect(generate).not.toHaveBeenCalled();
    },
  );

  it("escalates even with no API key configured", async () => {
    model = null;
    const r = await reply(await post({ message: "She is not breathing" }));
    expect(r.kind).toBe("escalation");
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
    expect(generate).toHaveBeenCalledOnce();
  });
});
