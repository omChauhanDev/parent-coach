import type { Language } from "@/lib/contract";

/** Small interface labels shown inside a reply, in the reply's language. */
export const REPLY_LABELS: Record<
  Language,
  { question: string; checkin: string; source: string; call: string }
> = {
  en: { question: "Question for you", checkin: "Check in", source: "Source", call: "Call" },
  ur: { question: "آپ سے سوال", checkin: "دوبارہ بتائیں", source: "ماخذ", call: "کال کریں" },
  roman_ur: {
    question: "Aap se sawal",
    checkin: "Dobara batayein",
    source: "Source",
    call: "Call karein",
  },
};

/** BCP 47 tags: `ur` switches to Nastaliq; Roman Urdu stays in the Latin face. */
export const LANG_TAG: Record<Language, string> = { en: "en", ur: "ur", roman_ur: "ur-Latn" };

/** tel: URI from a number as displayed ("800-725462", "+92 316 827 5336"). */
export function telHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}
