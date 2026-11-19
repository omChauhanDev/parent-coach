/**
 * SPEC §6.2 L4 — screens model-written text before it can reach the UI. Any hit → refer template.
 * Fail-closed: when in doubt it trips. Household words that are also dose words ("spoon", "tablet",
 * "chamach", "چمچ") only count when the same text is about medicine, so feeding and screen-time
 * advice is not replaced.
 */

import { foldArabicScript } from "@/lib/safety/normalize";

export type PostCheckViolation = "digits" | "url" | "dosage" | "medicine";

const DIGIT_RUN = /\d{3,}/;
// Short or spaced numbers next to "call" / "dial" ("call 15", "dial 1-1-2-2", "15 par call karein"):
// numbers come only from contacts.ts (SPEC §6.7), so any number the model attaches to a call trips.
const CALL_NUMBER = new RegExp(
  foldArabicScript(
    [
      String.raw`(?:\b(?:call|calling|called|dial|dialing|dialling|dialled|dialed)\b|کال|ڈائل)[^\d\n.!?؟۔]{0,15}\d`,
      String.raw`\d[^\d\n.!?؟۔]{0,12}(?:\b(?:call|dial)\b|کال|ڈائل)`,
    ].join("|"),
  ),
  "iu",
);

const URL_LIKE = new RegExp(
  [
    String.raw`https?:\/\/`,
    String.raw`\bwww\.`,
    String.raw`[^\s@]+@[^\s@]+\.[a-z]{2,}`,
    // any dotted host: who.int, caringforkids.cps.ca, bit.ly/x (also "night.Then" — fail-closed)
    String.raw`\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b`,
  ].join("|"),
  "iu",
);

const QTY = String.raw`(?:\d+(?:[.,/]\d+)?|half|quarter|one|two|three|four|five|a|an|a few|few|some|couple of|ek|do|teen|char|aadha|adha|aadhi|chand|آدھا|آدھی|ایک|دو|تین|چار|پانچ|چند)`;

/** Always a dose, whatever the context. */
const DOSAGE = new RegExp(
  foldArabicScript(
    [
      String.raw`\d\s*(?:mg|ml|mcg|µg|cc|g|iu)\b`,
      String.raw`\b(?:mg|ml|mcg|µg|iu|mg\/kg|ml\/kg)\b`,
      String.raw`\b(?:milligrams?|millilit(?:re|er)s?|micrograms?|dosage|dosing|teaspoons?|tablespoons?|teaspoonfuls?|tablespoonfuls?|spoonfuls?|tsp|tbsp|capsules?|sachets?|suppositor(?:y|ies)|pills?)\b`,
      String.raw`\b(?:\d+(?:[.,/]\d+)?|half(?: a)?|quarter(?: of a)?|one|two|three|four)\s+tablets?\b`,
      String.raw`\b${QTY}\s+(?:drops|syringes?|puffs?)\b`,
      String.raw`\b(?:\d+|one|two|three|half|a single)\s+drop\b`,
      String.raw`\b(?:give|take|repeat|use)\b[^.]{0,30}\bevery (?:\w+ )?(?:to \w+ )?hours\b`,
      String.raw`\b(?:eye|ear|nose|nasal|saline|medicine|medicated) drops?\b`,
      String.raw`\bdrops? (?:of|in (?:each|his|her|their|the|your) (?:eye|ear|nose|nostril))`,
      // dosing instructions without a unit
      String.raw`\b(?:repeat|give|another|next|each|per|maximum|max|missed?|double|halve|use|skip|reduce|increase|lower|raise)(?: (?:the|a|one|half|usual|full|same|normal|right|correct|his|her|their|your))* doses?\b`,
      String.raw`\bdoses? (?:every|per|a day|twice|three times|of)\b`,
      // Urdu script
      String.raw`ملی ?(?:گرام|لیٹر)|ایم ?ایل|ایم ?جی|سی ?سی|کیپسول|ٹیبلٹ|گولی|گولیاں|خوراک|خوراکیں|قطرے|قطرہ|ڈھکن`,
      // Roman Urdu
      String.raw`\b(?:goli|goliyan|golian|khurak|khuraak|qatre|qatray|qatra|qatrey|dhakkan|dhakan)\b`,
    ].join("|"),
  ),
  "iu",
);

/** Household words that are doses only in a medicine context. */
const DOSE_IN_CONTEXT = new RegExp(
  foldArabicScript(
    [
      String.raw`\b${QTY}\s+(?:spoons?|tablet|chamach|chamcha|chammach)\b`,
      String.raw`\b(?:once|twice|three times|\w+ times) (?:a|per) day\b|\bdaily\b`,
      String.raw`${QTY}\s+(?:چمچ|چمچہ|چمچے)`,
      String.raw`\btablets\b`,
    ].join("|"),
  ),
  "iu",
);
const MEDICINE_CONTEXT = new RegExp(
  foldArabicScript(
    String.raw`(?:syrup|medicine|medication|prescri|pharmac|doctor|\bdoses?\b|fever|\bpain\b|cough|\bdawa|\bdawai|sharbat|bukh?aa?r|\bdard|khansi|\bpil(?:a|aa)(?:y|ye|yein|yen|en|ein|na|nay)\b|شربت|دوا|دوائی|سیرپ|بخار|درد|کھانسی|پلا(?:ئیں|نا|ئے))`,
  ),
  "iu",
);

// SPEC §6.4: the coach never names medicines. Common paediatric / OTC names in EN + Urdu script.
const MEDICINE = new RegExp(
  foldArabicScript(
    [
      String.raw`\b(?:paracetamol|acetaminophen|ibuprofen|panadol|calpol|tylenol|brufen|motrin|nurofen|aspirin|disprol|melatonin|antihistamines?|cetirizine|loratadine|benadryl|diphenhydramine|amoxicillin|augmentin|antibiotics?|ritalin|methylphenidate|risperidone|sertraline|fluoxetine|prozac|gripe water|domperidone|ondansetron|steroids?|prednisolone|ventolin|salbutamol|ors|oral rehydration)\b`,
      // regional OTC brands (UAE, Pakistan) and supplements
      String.raw`\b(?:adol|fevadol|profinal|ponstan|disprin|arinac|hydryllin|piriton|zyrtec|claritine|actifed|septran|flagyl|supplements?|multivitamins?|(?:iron|zinc|calcium|vitamin [a-z]\d?) (?:drops|syrup|tablets?|capsules|gummies))\b`,
      String.raw`پیناڈول|پیراسیٹامول|بروفین|اینٹی ?بائیوٹک|کیلپول`,
    ].join("|"),
  ),
  "iu",
);

function prepare(text: string): string {
  // Invisible format characters must not split "9\u200B9\u200B9". Arabic kaf / yeh / heh variants
  // fold to the Urdu letters, as in the pre-screen; the patterns above are folded the same way.
  return foldArabicScript(text.normalize("NFKC").replace(/\p{Cf}/gu, ""))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Returns the first violation found in any of the texts, or null when all are clean. */
export function postCheck(texts: readonly string[]): PostCheckViolation | null {
  for (const raw of texts) {
    const text = prepare(raw);
    if (DIGIT_RUN.test(text) || CALL_NUMBER.test(text)) return "digits";
    if (URL_LIKE.test(text)) return "url";
    if (DOSAGE.test(text)) return "dosage";
    if (DOSE_IN_CONTEXT.test(text) && MEDICINE_CONTEXT.test(text)) return "dosage";
    if (MEDICINE.test(text)) return "medicine";
  }
  return null;
}
