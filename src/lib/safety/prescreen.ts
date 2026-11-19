import type { CrisisCategory } from "@/lib/contract";
import { foldArabicScript, normalize } from "@/lib/safety/normalize";
import { PATTERNS } from "@/lib/safety/patterns";

/** SPEC §6.2 L1: when several categories match, the most urgent wins. */
export const CATEGORY_PRIORITY: readonly CrisisCategory[] = [
  "medical_emergency",
  "self_harm",
  "child_abuse",
  "domestic_violence",
];

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
  // Stretched letters are ambiguous ("nahiiii" → nahi, "jeeeene" → jeene), so try both squeezes.
  const variants = [...new Set([normalize(text, 1), normalize(text, 2)])].filter(Boolean);
  for (const { category, patterns } of COMPILED) {
    for (const { id, re } of patterns) {
      if (variants.some((v) => re.test(v))) return { category, patternId: id };
    }
  }
  return null;
}
