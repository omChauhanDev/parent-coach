import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/lib/language";

describe("detectLanguage", () => {
  it.each([
    // SPEC §4 flows
    [
      "F1 English",
      "My 4-year-old screams every night at bedtime and it takes two hours to settle him.",
      "en",
    ],
    ["F2 Urdu", "میرا بیٹا کھانے کے وقت بہت ضد کرتا ہے", "ur"],
    [
      "F8 mixed English + Roman Urdu",
      "My beta 6 saal ka hai aur school jane se rota hai",
      "roman_ur",
    ],
    // SPEC §8 video strings
    ["video Urdu crisis", "میرا چودہ سال کا بیٹا کہہ رہا ہے کہ وہ خودکشی کرنا چاہتا ہے", "ur"],
    ["video Roman Urdu crisis", "Mera beta keh raha hai ke woh khudkushi kar lega", "roman_ur"],
    // edge cases
    ["Roman Urdu with stretched letters", "Meri bachi bilkul nahiiii sunti", "roman_ur"],
    ["Urdu with an English word", "میرا بیٹا school نہیں جانا چاہتا", "ur"],
    [
      "mostly English with one Urdu word",
      "My son is so stubborn about homework, he says nahi to everything",
      "en",
    ],
    ["single Roman Urdu word is not enough", "help my beta", "en"],
    ["English that contains 'to' and 'is'", "Is it normal to want to sleep in our bed?", "en"],
    ["digits and punctuation only", "??? 123", "en"],
    ["vague", "help", "en"],
    ["Arabic-script presentation forms", "ﻣﯿﺮا ﺑﯿﭩﺎ", "ur"],
  ])("%s", (_name, text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });
});
