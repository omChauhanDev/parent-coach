import { describe, expect, it } from "vitest";
import { Contact, type Language, type Region } from "@/lib/contract";
import {
  CONTACTS,
  ESCALATION_CONTACTS,
  FOOTER_CONTACTS,
  localiseContact,
  VERIFIED_ON,
} from "@/lib/safety/contacts";

const LANGUAGES: Language[] = ["en", "ur", "roman_ur"];

describe("every verified contact (AC-13)", () => {
  it.each(Object.entries(CONTACTS))("%s has an official https source and verifiedOn", (_id, c) => {
    expect(new URL(c.sourceUrl).protocol).toBe("https:");
    expect(c.verifiedOn).toBe("2026-11-19");
    expect(VERIFIED_ON).toBe("2026-11-19");
    for (const language of LANGUAGES) {
      expect(Contact.safeParse(localiseContact(c, language)).success).toBe(true);
      expect(c.label[language].trim()).not.toBe("");
      if (c.note) expect(c.note[language].trim()).not.toBe("");
    }
  });
});

// Exactly SPEC §6.7, in order (emergency first).
describe("contacts per region × category match SPEC §6.7", () => {
  it.each<[Region, string, string[]]>([
    ["AE", "footer", ["999", "998"]],
    ["AE", "medical_emergency", ["998", "999"]],
    ["AE", "self_harm", ["999", "800-725462", "800506"]],
    ["AE", "child_abuse", ["999", "116111"]],
    ["AE", "domestic_violence", ["999", "800111", "800-444"]],
    ["AE", "general", ["999", "998"]],
    ["PK", "footer", ["15", "1122", "115"]],
    ["PK", "medical_emergency", ["1122", "115"]],
    ["PK", "self_harm", ["1122", "15", "+92 316 827 5336"]],
    ["PK", "child_abuse", ["15", "1121"]],
    ["PK", "domestic_violence", ["15", "1043"]],
    ["PK", "general", ["15", "1122", "115"]],
  ])("%s %s", (region, category, numbers) => {
    const list =
      category === "footer"
        ? FOOTER_CONTACTS[region]
        : ESCALATION_CONTACTS[region][category as keyof (typeof ESCALATION_CONTACTS)["AE"]];
    expect(list.map((c) => c.number)).toEqual(numbers);
    expect(list.length).toBeLessThanOrEqual(3);
  });
});
