import type { CoachReply, Language, Region } from "@/lib/contract";
import { FOOTER_CONTACTS, type VerifiedContact } from "@/lib/safety/contacts";

/**
 * Every escalation, refer and fallback string the parent can see. Numbers are interpolated from
 * contacts.ts, never written here. Urdu and Roman Urdu wording is a draft pending native review.
 */

const OR: Record<Language, string> = { en: "or", ur: "یا", roman_ur: "ya" };

function formatNumbers(contacts: readonly VerifiedContact[], language: Language): string {
  return contacts.map((c) => `${c.number} (${c.label[language]})`).join(` ${OR[language]} `);
}

/** The region's first two footer numbers, e.g. "999 (Police) or 998 (Ambulance)". */
export function emergencyLine(region: Region, language: Language): string {
  return formatNumbers(FOOTER_CONTACTS[region].slice(0, 2), language);
}

const FALLBACK: Record<
  Language,
  { summary: string; retry: string; danger: (n: string) => string; followUp: string }
> = {
  en: {
    summary: "Sorry — I couldn't put together a reply just now.",
    retry: "Please wait a minute, then send your message again.",
    danger: (n) => `If anyone may be in danger, call ${n} now.`,
    followUp: "When you're ready, send your message again and we'll plan the next step together.",
  },
  ur: {
    summary: "معذرت — ابھی جواب تیار نہیں ہو سکا۔",
    retry: "براہ کرم ایک منٹ انتظار کریں، پھر اپنا پیغام دوبارہ بھیجیں۔",
    danger: (n) => `اگر کسی کو خطرہ ہو سکتا ہے تو ابھی ${n} پر کال کریں۔`,
    followUp: "جب آپ تیار ہوں تو اپنا پیغام دوبارہ بھیجیں تاکہ اگلا قدم مل کر طے کیا جا سکے۔",
  },
  roman_ur: {
    summary: "Maazrat — abhi jawab tayyar nahi ho saka.",
    retry: "Baraye meharbani ek minute intezar karein, phir apna paigham dobara bhejein.",
    danger: (n) => `Agar kisi ko khatra ho sakta hai to abhi ${n} par call karein.`,
    followUp:
      "Jab aap tayyar hon to apna paigham dobara bhejein taake agla qadam mil kar tay ho sake.",
  },
};

export function buildFallback(language: Language, region: Region): CoachReply {
  const t = FALLBACK[language];
  return {
    kind: "fallback",
    language,
    risk: "unknown",
    summary: t.summary,
    steps: [t.retry, t.danger(emergencyLine(region, language))],
    followUp: { kind: "question", text: t.followUp },
  };
}

/** Sent only if a reply we built ourselves fails `CoachReply` validation (ARCHITECTURE §2 step 9). */
export const LAST_RESORT_REPLY: CoachReply = buildFallback("en", "AE");
