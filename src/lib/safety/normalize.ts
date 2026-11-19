/**
 * Text normalisation for the pre-screen (docs/research/safety.md §4, after Doctor et al. 2022).
 * `foldArabicScript` is also applied to pattern sources so patterns and input agree.
 */

// Harakat, superscript alef, tatweel, and invisible format characters (soft hyphen, Mongolian vowel
// separator, ZWSP, ZWNJ, ZWJ, LRM, RLM, word joiner, BOM) that would otherwise split words.
const MARKS_AND_CONTROLS = /[\u064B-\u065F\u0670\u0640\u00AD\u180E\u200B-\u200F\u2060\uFEFF]/g;

export function foldArabicScript(text: string): string {
  return text
    .replace(/[\u064A\u0649]/g, "\u06CC") // Arabic yeh, alef maksura -> Farsi yeh
    .replace(/\u0643/g, "\u06A9") // Arabic kaf -> keheh
    .replace(/[\u0647\u0629\u06BE\u06C0\u06C2\u06D5]/g, "\u06C1") // heh variants -> heh goal
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // alef with madda / hamza -> alef
    .replace(/\u06D3/g, "\u06D2") // yeh barree with hamza -> yeh barree
    .replace(MARKS_AND_CONTROLS, "");
}

function asciiDigits(text: string): string {
  return text
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Apostrophe look-alikes: ASCII, curly quotes, backtick, acute, modifier letters, prime.
const APOS = "['\u2018\u2019`\u00B4\u02BC\u02B9\u2032]";
const EXPANSIONS: readonly [RegExp, string][] = [
  [new RegExp(`\\bcan${APOS}t\\b`, "g"), "cannot"],
  [new RegExp(`\\bwon${APOS}t\\b`, "g"), "will not"],
  [new RegExp(`n${APOS}t\\b`, "g"), " not"],
  [new RegExp(`${APOS}s\\b`, "g"), " is"],
  [new RegExp(`${APOS}ll\\b`, "g"), " will"],
  [new RegExp(`${APOS}re\\b`, "g"), " are"],
  [new RegExp(`${APOS}ve\\b`, "g"), " have"],
  [new RegExp(`${APOS}m\\b`, "g"), " am"],
  [new RegExp(`${APOS}d\\b`, "g"), " would"],
];
const CLITIC = new RegExp(`${APOS}(?:s|ll|re|ve|m|d)\\b`, "g");
const APOSTROPHES = new RegExp(APOS, "g");

/**
 * How English contractions are handled. The pre-screen tries all three, because patterns are written
 * for one form: "join" glues them ("can't" -> "cant"), "expand" spells them out ("he's choking" ->
 * "he is choking", "I'll" -> "i will"), "drop" removes the clitic ("she's collapsed" -> "she collapsed").
 */
export type Contractions = "join" | "expand" | "drop";

/**
 * NFKC -> Latin accents stripped -> Urdu letter folding -> ASCII digits -> lowercase -> contractions
 * -> punctuation to spaces -> squeeze runs of 3+ identical letters to `squeezeTo`
 * (1: "nahiiii" -> "nahi"; 2: "jeeeene" -> "jeene").
 */
export function normalize(
  text: string,
  squeezeTo: 1 | 2 = 1,
  contractions: Contractions = "join",
): string {
  let s = text.normalize("NFKC");
  // "fiancé" -> "fiance". Latin ranges only: decomposing Arabic script would split ؤ / ئ.
  s = s.replace(/[\u00C0-\u024F\u1E00-\u1EFF]/g, (c) => c.normalize("NFD").replace(/\p{M}/gu, ""));
  s = foldArabicScript(s);
  s = asciiDigits(s);
  s = s.toLowerCase();
  s = s.replace(/\p{M}/gu, ""); // any remaining combining marks
  if (contractions === "expand") {
    for (const [re, to] of EXPANSIONS) s = s.replace(re, to);
  } else if (contractions === "drop") {
    s = s.replace(CLITIC, "");
  }
  s = s.replace(APOSTROPHES, ""); // can't -> cant
  s = s.replace(/[^\p{L}\p{N}]+/gu, " "); // punctuation incl. Urdu full stop, comma, question mark
  s = s.replace(/(\p{L})\1{2,}/gu, squeezeTo === 1 ? "$1" : "$1$1");
  return s.trim();
}
