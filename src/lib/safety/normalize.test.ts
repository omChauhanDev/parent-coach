import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/safety/normalize";

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
  ])("%s", (_name, input, expected) => {
    expect(normalize(input)).toBe(expected);
  });
});
