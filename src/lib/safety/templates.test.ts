import { describe, expect, it } from "vitest";
import { CoachReply, type CrisisCategory, type Language, type Region } from "@/lib/contract";
import { ESCALATION_CONTACTS } from "@/lib/safety/contacts";
import {
  buildEscalation,
  buildFallback,
  buildRefer,
  LAST_RESORT_REPLY,
} from "@/lib/safety/templates";

const LANGUAGES: Language[] = ["en", "ur", "roman_ur"];
const REGIONS: Region[] = ["AE", "PK"];
const CATEGORIES: (CrisisCategory | "general")[] = [
  "medical_emergency",
  "self_harm",
  "child_abuse",
  "domestic_violence",
  "general",
];

const escalationRows = CATEGORIES.flatMap((category) =>
  LANGUAGES.flatMap((language) => REGIONS.map((region) => [category, language, region] as const)),
);

describe("buildEscalation (SPEC §6.3)", () => {
  it.each(escalationRows)("%s · %s · %s", (category, language, region) => {
    const reply = buildEscalation(category, language, region, "prescreen");
    expect(CoachReply.safeParse(reply).success).toBe(true);
    expect(reply).toMatchObject({ kind: "escalation", risk: "crisis", language });
    expect(reply.escalation).toMatchObject({ category, region, source: "prescreen" });
    // Step 1 is the immediate-danger call, with the category's first (emergency) number.
    const first = ESCALATION_CONTACTS[region][category][0];
    expect(reply.steps[0]).toContain(first?.number);
    expect(reply.escalation?.contacts.map((c) => c.number)).toEqual(
      ESCALATION_CONTACTS[region][category].map((c) => c.number),
    );
    expect(reply.followUp.kind).toBe("question");
    // The UI shows the contacts ABOVE the steps, so the text must never point "below".
    expect(JSON.stringify(reply)).not.toMatch(/below|نیچے|neeche/i);
  });
});

describe("buildRefer and buildFallback", () => {
  const rows = LANGUAGES.flatMap((language) =>
    REGIONS.map((region) => [language, region] as const),
  );
  it.each(rows)("refer %s · %s", (language, region) => {
    const reply = buildRefer(language, region);
    expect(CoachReply.safeParse(reply).success).toBe(true);
    expect(reply).toMatchObject({ kind: "coach", risk: "refer", language });
    expect(reply.steps.at(-1)).toContain(region === "AE" ? "999" : "15");
  });
  it.each(rows)("fallback %s · %s", (language, region) => {
    const reply = buildFallback(language, region);
    expect(CoachReply.safeParse(reply).success).toBe(true);
    expect(reply).toMatchObject({ kind: "fallback", risk: "unknown", language });
    expect(reply.steps.join(" ")).toContain(region === "AE" ? "999" : "15");
  });
  it("last-resort reply is a valid English UAE fallback", () => {
    expect(CoachReply.safeParse(LAST_RESORT_REPLY).success).toBe(true);
    expect(LAST_RESORT_REPLY).toMatchObject({ kind: "fallback", language: "en" });
  });
});
