import { describe, expect, it } from "vitest";
import { CoachReply, type CrisisCategory, type Language, type Region } from "@/lib/contract";
import { ESCALATION_CONTACTS } from "@/lib/safety/contacts";
import {
  buildEscalation,
  buildFallback,
  buildRefer,
  buildSafetyCheck,
  isSafetyCheck,
  LAST_RESORT,
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

// A medicine question during an open medical emergency gets the same answer from either card.
const NO_MEDICINE: Record<Language, string> = {
  en: "don't give any medicine until a doctor or the call handler tells you to",
  ur: "جب تک ڈاکٹر یا کال سننے والا نہ کہے، بچے کو کوئی دوا نہ دیں",
  roman_ur: "jab tak doctor ya call sunne wala na kahe, bachay ko koi dawa na dein",
};
const KEPT: Record<Language, readonly string[]> = {
  en: [
    "Stay with your child",
    "keep the packet or bottle",
    "Don't wait to see whether it gets better",
  ],
  ur: ["بچے کے ساتھ رہیں", "پیکٹ یا بوتل", "یہ دیکھنے کا انتظار نہ کریں"],
  roman_ur: ["Bachay ke saath rahein", "packet ya bottle", "Yeh dekhne ka intezar na karein"],
};

describe("medical escalation says not to give medicine (SPEC §6.3)", () => {
  it.each(LANGUAGES.flatMap((l) => REGIONS.map((r) => [l, r] as const)))(
    "full medical card %s · %s keeps every earlier step and adds the medicine line",
    (language, region) => {
      const steps = buildEscalation("medical_emergency", language, region, "prescreen").steps;
      expect(steps).toHaveLength(4);
      expect(steps.join(" ").toLowerCase()).toContain(NO_MEDICINE[language].toLowerCase());
      for (const kept of KEPT[language]) expect(steps.join(" ")).toContain(kept);
    },
  );
  it.each(CATEGORIES.filter((c) => c !== "medical_emergency"))(
    "other full cards are unchanged by it (%s)",
    (category) => {
      for (const language of LANGUAGES) {
        const text = buildEscalation(category, language, "AE", "prescreen").steps.join(" ");
        expect(text.toLowerCase()).not.toContain(NO_MEDICINE[language].toLowerCase());
      }
    },
  );
});

describe("buildSafetyCheck (SPEC §6.3)", () => {
  it.each(escalationRows)("%s · %s · %s", (category, language, region) => {
    const reply = buildSafetyCheck(category, language, region);
    const full = buildEscalation(category, language, region, "model");
    expect(CoachReply.safeParse(reply).success).toBe(true);
    expect(reply).toMatchObject({ kind: "escalation", risk: "crisis", language });
    expect(reply.escalation).toEqual(full.escalation);
    // Still leads with the immediate-danger call; shorter than the full card; names the way out.
    expect(reply.steps[0]).toBe(full.steps[0]);
    expect(reply.steps).toHaveLength(2);
    expect(reply.summary).not.toBe(full.summary);
    expect(reply.followUp.kind).toBe("question");
    expect(reply.followUp.text).toMatch(/"everyone is safe"|"سب محفوظ ہیں"|"sab mehfooz hain"/);
    expect(isSafetyCheck(reply)).toBe(true);
    expect(isSafetyCheck(full)).toBe(false);
    expect(JSON.stringify(reply)).not.toMatch(/below|نیچے|neeche/i);
  });
  it.each(LANGUAGES)("the full card also names the way out (%s)", (language) => {
    const full = buildEscalation("self_harm", language, "AE", "prescreen");
    expect(full.followUp.text).toMatch(/"everyone is safe"|"سب محفوظ ہیں"|"sab mehfooz hain"/);
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
  it.each([
    ["AE", "999", "1122"],
    ["PK", "1122", "999"],
  ] as const)(
    "last-resort reply for %s shows that region's numbers only",
    (region, has, hasNot) => {
      const reply = LAST_RESORT[region];
      expect(CoachReply.safeParse(reply).success).toBe(true);
      expect(reply.steps.join(" ")).toContain(has);
      expect(reply.steps.join(" ")).not.toContain(hasNot);
    },
  );
});
