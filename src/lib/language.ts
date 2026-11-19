import type { Language } from "@/lib/contract";

const ARABIC_SCRIPT = /\p{Script=Arabic}/u;
const LETTER = /\p{L}/u;

// Common Roman-Urdu function words and parenting vocabulary (SPEC §3). Words that are also everyday
// English ("to", "is", "main", "par", "jab", "din") are deliberately left out.
const ROMAN_URDU_LEXICON = new Set([
  "hai",
  "hain",
  "tha",
  "thi",
  "ho",
  "hoon",
  "hun",
  "nahi",
  "nahin",
  "nai",
  "nhi",
  "na",
  "mera",
  "meri",
  "mere",
  "meray",
  "mujhe",
  "mujh",
  "hum",
  "humara",
  "hamara",
  "humari",
  "bacha",
  "bachi",
  "bache",
  "bachay",
  "bachon",
  "bachy",
  "beta",
  "beti",
  "betay",
  "kya",
  "kyun",
  "kyon",
  "kaise",
  "kaisay",
  "kab",
  "kahan",
  "karta",
  "karti",
  "karte",
  "kartay",
  "karna",
  "kar",
  "karo",
  "raha",
  "rahi",
  "rahe",
  "rahay",
  "aur",
  "ko",
  "se",
  "ka",
  "ki",
  "ke",
  "bhi",
  "woh",
  "wo",
  "yeh",
  "ye",
  "bohat",
  "bahut",
  "bohot",
  "saal",
  "abhi",
  "sirf",
  "keh",
  "kehta",
  "kehti",
  "jata",
  "jati",
  "jane",
  "jana",
  "rota",
  "roti",
  "khana",
  "sota",
  "soti",
]);

/** Deterministic reply-language detection (SPEC §3); first matching rule wins. */
export function detectLanguage(text: string): Language {
  let letters = 0;
  let arabic = 0;
  for (const ch of text) {
    if (!LETTER.test(ch)) continue;
    letters += 1;
    if (ARABIC_SCRIPT.test(ch)) arabic += 1;
  }
  if (letters > 0 && arabic / letters >= 0.3) return "ur";

  const tokens = text
    .toLowerCase()
    .replace(/([a-z])\1{2,}/g, "$1")
    .match(/[a-z]+/g);
  let hits = 0;
  for (const token of tokens ?? []) {
    if (ROMAN_URDU_LEXICON.has(token)) hits += 1;
    if (hits >= 2) return "roman_ur";
  }
  return "en";
}
