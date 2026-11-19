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

/**
 * NFKC -> Urdu letter folding -> ASCII digits -> lowercase -> punctuation to spaces -> squeeze runs
 * of 3+ identical letters to `squeezeTo` (1: "nahiiii" -> "nahi"; 2: "jeeeene" -> "jeene").
 */
export function normalize(text: string, squeezeTo: 1 | 2 = 1): string {
  let s = text.normalize("NFKC");
  s = foldArabicScript(s);
  s = asciiDigits(s);
  s = s.toLowerCase();
  s = s.replace(/\p{M}/gu, ""); // any remaining combining marks
  s = s.replace(/['\u2018\u2019`\u00B4]/g, ""); // can't -> cant
  s = s.replace(/[^\p{L}\p{N}]+/gu, " "); // punctuation incl. Urdu full stop, comma, question mark
  s = s.replace(/(\p{L})\1{2,}/gu, squeezeTo === 1 ? "$1" : "$1$1");
  return s.trim();
}
