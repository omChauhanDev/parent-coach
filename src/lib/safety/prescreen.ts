import type { CrisisCategory } from "@/lib/contract";
import { type Contractions, foldArabicScript, normalize } from "@/lib/safety/normalize";
import { PATTERNS } from "@/lib/safety/patterns";

/** SPEC §6.2 L1: when several categories match, the most urgent wins. */
export const CATEGORY_PRIORITY: readonly CrisisCategory[] = [
  "medical_emergency",
  "self_harm",
  "child_abuse",
  "domestic_violence",
];

const CONTRACTIONS: readonly Contractions[] = ["join", "expand", "drop"];

export interface PreScreenHit {
  category: CrisisCategory;
  patternId: string;
}

const COMPILED = CATEGORY_PRIORITY.map((category) => ({
  category,
  patterns: PATTERNS.filter((p) => p.category === category).map((p) => ({
    id: p.id,
    // Anchor at a word start; fold Urdu letters in the source exactly as the input is folded.
    re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${foldArabicScript(p.source)})`, "u"),
  })),
}));

/** Deterministic multilingual crisis pre-screen of the current message. No model, no I/O. */
export function preScreen(text: string): PreScreenHit | null {
  // Stretched letters are ambiguous ("nahiiii" → nahi, "jeeeene" → jeene), so try both squeezes;
  // English contractions are tried glued, expanded and dropped ("he's choking" → "he is choking").
  // More variants can only add matches — the pre-screen prefers false positives.
  const variants = [
    ...new Set(
      ([1, 2] as const).flatMap((squeeze) =>
        CONTRACTIONS.map((contractions) => normalize(text, squeeze, contractions)),
      ),
    ),
  ].filter(Boolean);
  for (const { category, patterns } of COMPILED) {
    for (const { id, re } of patterns) {
      if (variants.some((v) => re.test(v))) return { category, patternId: id };
    }
  }
  return null;
}
