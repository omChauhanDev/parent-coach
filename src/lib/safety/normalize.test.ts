import { describe, expect, it } from "vitest";
import { type Contractions, normalize } from "@/lib/safety/normalize";

describe("normalize", () => {
  it.each([
    ["lowercases and squeezes punctuation", "He  SAID: “Help!!”", "he said help"],
    ["drops apostrophes", "can't won’t", "cant wont"],
    ["splits hyphens", "4-year-old self-harm", "4 year old self harm"],
    ["collapses stretched letters", "nahiiiii", "nahi"],
    ["keeps doubled letters", "khoon", "khoon"],
    ["Arabic yeh → Farsi yeh", "ي", "ی"],
    ["Arabic kaf → keheh", "ك", "ک"],
    ["heh variants → heh goal", "ه ھ ة", "ہ ہ ہ"],
    ["strips harakat and tatweel", "خُودکـشی", "خودکشی"],
    ["strips ZWNJ / RLM / BOM", "خود\u200Cکشی\u200F\uFEFF", "خودکشی"],
    ["Urdu punctuation → space", "ہے۔کیا؟ہاں،", "ہے کیا ہاں"],
    ["Eastern digits → ASCII", "۱۲ ١٢", "12 12"],
    ["presentation forms (NFKC)", "ﺧﻮﺩ", "خود"],
    ["strips Latin accents (autocorrect)", "my fiancé", "my fiance"],
    ["modifier-letter apostrophe", "can\u02BCt", "cant"],
    ["prime as apostrophe", "can\u2032t", "cant"],
    ["keeps Urdu hamza letters", "جاؤں گئی", "جاؤں گئی"],
  ])("%s", (_name, input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it.each<[string, Contractions, string]>([
    ["He's choking!", "join", "hes choking"],
    ["He's choking!", "expand", "he is choking"],
    ["She's collapsed", "drop", "she collapsed"],
    ["I'm scared I'll hurt my baby", "expand", "i am scared i will hurt my baby"],
    ["can't won't doesn't", "expand", "cannot will not does not"],
    ["they're, we've, she'd", "expand", "they are we have she would"],
    ["He’s choking", "expand", "he is choking"],
    ["the baby's choking", "drop", "the baby choking"],
  ])("contractions: %s (%s)", (input, mode, expected) => {
    expect(normalize(input, 1, mode)).toBe(expected);
  });
});
