import type { CoachReply, CrisisCategory, Language, Region } from "@/lib/contract";
import {
  ESCALATION_CONTACTS,
  escalationContacts,
  FOOTER_CONTACTS,
  type VerifiedContact,
} from "@/lib/safety/contacts";

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
/** Pre-built per region, so even a last-resort reply shows the selected region's numbers. */
export const LAST_RESORT: Readonly<Record<Region, CoachReply>> = {
  AE: buildFallback("en", "AE"),
  PK: buildFallback("en", "PK"),
};
/** For failures before the request (and so the region) has been parsed. */
export const LAST_RESORT_REPLY: CoachReply = LAST_RESORT.AE;

// ---------------------------------------------------------------------------
// Escalation (SPEC §6.3): care first → immediate action → category steps → safety question.
// ---------------------------------------------------------------------------

export type EscalationCategory = CrisisCategory | "general";

/** Heading of the escalation banner in the UI. */
export const ESCALATION_HEADING: Record<Language, string> = {
  en: "Get help now",
  ur: "ابھی مدد لیں",
  roman_ur: "Abhi madad lein",
};

interface EscalationText {
  care: string;
  why: Record<EscalationCategory, string>;
  danger: (number: string) => string;
  steps: Record<EscalationCategory, readonly string[]>;
  followUp: string;
}

const ESCALATION: Record<Language, EscalationText> = {
  en: {
    care: "Thank you for telling me — you don't have to handle this alone.",
    why: {
      medical_emergency: "This could be a medical emergency, so please get help right away.",
      self_harm: "What you've shared is serious, and help is available right now.",
      child_abuse:
        "Your child's safety comes first, and you're doing the right thing by speaking up.",
      domestic_violence: "No one deserves to be hurt or threatened, and help is available.",
      general: "This sounds serious, so please reach out for help now.",
    },
    danger: (n) => `If anyone is in danger right now, call ${n} now.`,
    steps: {
      medical_emergency: [
        "Stay with your child and follow what the call handler tells you.",
        "If they swallowed something, keep the packet or bottle to show the medics.",
        "Don't wait to see whether it gets better on its own, and don't give any medicine until a doctor or the call handler tells you to.",
      ],
      self_harm: [
        "Don't leave them alone — stay with them, or ask someone you trust to.",
        "Move medicines and sharp objects out of reach.",
        "Talk to a mental-health professional today; the helplines listed above can help, including if these thoughts are your own.",
      ],
      child_abuse: [
        "Listen calmly, let your child tell it in their own words, and tell them it is never their fault.",
        "Don't promise to keep it secret, and don't confront the person or investigate yourself.",
        "Report it to child protection (number above) so trained people can help keep your child safe.",
      ],
      domestic_violence: [
        "Plan a safe place you and the children can go, and someone you can call.",
        "Keep your phone, ID documents and some money close to you.",
        "You don't need to wait for an emergency — the helplines listed above can help you plan.",
      ],
      general: ["Stay with whoever is at risk and keep away from anything that could cause harm."],
    },
    followUp:
      'Is everyone safe right now? If so, tell me "everyone is safe" and what is happening, and I\'ll help you plan the next step.',
  },
  ur: {
    care: "مجھے بتانے کا شکریہ — آپ کو یہ سب اکیلے نہیں سنبھالنا۔",
    why: {
      medical_emergency: "یہ طبی ایمرجنسی ہو سکتی ہے، اس لیے فوراً مدد لیں۔",
      self_harm: "آپ نے جو بتایا وہ سنجیدہ بات ہے، اور مدد ابھی دستیاب ہے۔",
      child_abuse: "بچے کی حفاظت سب سے پہلے ہے، اور بات کر کے آپ صحیح قدم اٹھا رہے ہیں۔",
      domestic_violence: "کوئی بھی تشدد یا دھمکیوں کا حقدار نہیں، اور مدد دستیاب ہے۔",
      general: "یہ سنجیدہ لگتا ہے، اس لیے ابھی مدد لیں۔",
    },
    danger: (n) => `اگر اس وقت کسی کو خطرہ ہے تو ابھی ${n} پر کال کریں۔`,
    steps: {
      medical_emergency: [
        "بچے کے ساتھ رہیں اور کال سننے والے اہلکار کی ہدایات پر عمل کریں۔",
        "اگر بچے نے کچھ نگل لیا ہے تو اس کا پیکٹ یا بوتل طبی عملے کو دکھانے کے لیے پاس رکھیں۔",
        "یہ دیکھنے کا انتظار نہ کریں کہ حالت خود بہتر ہوتی ہے یا نہیں، اور جب تک ڈاکٹر یا کال سننے والا نہ کہے، بچے کو کوئی دوا نہ دیں۔",
      ],
      self_harm: [
        "انہیں اکیلا نہ چھوڑیں — ان کے ساتھ رہیں، یا کسی بھروسے والے شخص کو ساتھ رہنے کو کہیں۔",
        "دوائیاں اور تیز دھار چیزیں پہنچ سے دور کر دیں۔",
        "آج ہی کسی ماہر نفسیات سے بات کریں؛ اوپر دی گئی ہیلپ لائنز مدد کر سکتی ہیں، چاہے یہ خیالات آپ کے اپنے ہوں۔",
      ],
      child_abuse: [
        "تحمل سے سنیں، بچے کو اپنے الفاظ میں بتانے دیں، اور انہیں بتائیں کہ یہ کبھی ان کی غلطی نہیں۔",
        "راز رکھنے کا وعدہ نہ کریں، اور اس شخص کا سامنا یا خود تفتیش نہ کریں۔",
        "چائلڈ پروٹیکشن کو اطلاع دیں (نمبر اوپر دیا گیا ہے) تاکہ تربیت یافتہ لوگ بچے کو محفوظ رکھنے میں مدد کر سکیں۔",
      ],
      domestic_violence: [
        "کوئی محفوظ جگہ طے کریں جہاں آپ اور بچے جا سکیں، اور کوئی ایسا شخص جسے آپ کال کر سکیں۔",
        "اپنا فون، شناختی دستاویزات اور کچھ رقم اپنے پاس رکھیں۔",
        "ایمرجنسی کا انتظار کرنا ضروری نہیں — اوپر دی گئی ہیلپ لائنز منصوبہ بنانے میں مدد کر سکتی ہیں۔",
      ],
      general: ["خطرے میں موجود شخص کے ساتھ رہیں اور نقصان پہنچانے والی ہر چیز سے دور رہیں۔"],
    },
    followUp:
      'کیا اس وقت سب محفوظ ہیں؟ اگر ہاں، تو لکھیں "سب محفوظ ہیں" اور بتائیں کیا ہو رہا ہے، تاکہ اگلا قدم مل کر طے کیا جا سکے۔',
  },
  roman_ur: {
    care: "Mujhe batane ka shukriya — aap ko yeh sab akele nahi sambhalna.",
    why: {
      medical_emergency: "Yeh medical emergency ho sakti hai, is liye foran madad lein.",
      self_harm: "Aap ne jo bataya woh sanjeeda baat hai, aur madad abhi mojood hai.",
      child_abuse:
        "Bachay ki hifazat sab se pehle hai, aur baat kar ke aap sahi qadam utha rahe hain.",
      domestic_violence: "Koi bhi tashaddud ya dhamkiyon ka haqdar nahi, aur madad mojood hai.",
      general: "Yeh sanjeeda lagta hai, is liye abhi madad lein.",
    },
    danger: (n) => `Agar is waqt kisi ko khatra hai to abhi ${n} par call karein.`,
    steps: {
      medical_emergency: [
        "Bachay ke saath rahein aur call sunne wale ahlkar ki hidayat par amal karein.",
        "Agar bachay ne kuch nigal liya hai to us ka packet ya bottle medical team ko dikhane ke liye paas rakhein.",
        "Yeh dekhne ka intezar na karein ke haalat khud behtar hoti hai ya nahi, aur jab tak doctor ya call sunne wala na kahe, bachay ko koi dawa na dein.",
      ],
      self_harm: [
        "Unhein akela na chhorein — un ke saath rahein, ya kisi bharose wale shakhs ko saath rehne ko kahein.",
        "Dawaiyan aur tez dhaar cheezein pohanch se door kar dein.",
        "Aaj hi kisi mahir-e-nafsiyat se baat karein; upar di gayi helplines madad kar sakti hain, chahe yeh khayalat aap ke apne hon.",
      ],
      child_abuse: [
        "Tahammul se sunein, bachay ko apne alfaaz mein batane dein, aur unhein batayein ke yeh kabhi un ki ghalti nahi.",
        "Raaz rakhne ka waada na karein, aur us shakhs ka saamna ya khud tafteesh na karein.",
        "Child protection ko ittila dein (number upar diya gaya hai) taake tarbiyat yafta log bachay ko mehfooz rakhne mein madad kar sakein.",
      ],
      domestic_violence: [
        "Koi mehfooz jagah tay karein jahan aap aur bachay ja sakein, aur koi aisa shakhs jise aap call kar sakein.",
        "Apna phone, shanakhti documents aur kuch raqam apne paas rakhein.",
        "Emergency ka intezar zaroori nahi — upar di gayi helplines plan banane mein madad kar sakti hain.",
      ],
      general: [
        "Khatre mein mojood shakhs ke saath rahein aur nuqsan pohanchane wali har cheez se door rahein.",
      ],
    },
    followUp:
      'Kya is waqt sab mehfooz hain? Agar haan, to likhein "sab mehfooz hain" aur batayein kya ho raha hai, taake agla qadam mil kar tay kiya ja sake.',
  },
};

export function buildEscalation(
  category: EscalationCategory,
  language: Language,
  region: Region,
  source: "prescreen" | "model",
): CoachReply {
  const t = ESCALATION[language];
  const contacts = ESCALATION_CONTACTS[region][category];
  const first = contacts[0] ?? FOOTER_CONTACTS[region][0];
  const emergency = first ? formatNumbers([first], language) : emergencyLine(region, language);
  return {
    kind: "escalation",
    language,
    risk: "crisis",
    summary: `${t.care} ${t.why[category]}`,
    steps: [t.danger(emergency), ...t.steps[category]].slice(0, 4),
    followUp: { kind: "question", text: t.followUp },
    escalation: {
      category,
      region,
      source,
      contacts: escalationContacts(region, category, language),
    },
  };
}

// ---------------------------------------------------------------------------
// Safety check / follow-up card (SPEC §6.3). Shown instead of repeating a full card: after an
// escalation of the same category, or when an earlier crisis is unresolved and the parent asks
// something new. Keeps the call-now line and contacts; names the way out ("everyone is safe").
// ---------------------------------------------------------------------------

interface SafetyCheckText {
  summary: string;
  lines: Record<EscalationCategory, readonly string[]>;
  followUp: string;
}

const SAFETY_CHECK: Record<Language, SafetyCheckText> = {
  en: {
    summary:
      "I'm still here with you. Safety comes first, and I'll help with anything else as soon as everyone is safe.",
    lines: {
      medical_emergency: [
        "Stay with your child and follow what the call handler tells you.",
        "Don't give any medicine until a doctor or the call handler tells you to.",
      ],
      self_harm: ["Stay with them, and keep medicines and sharp objects out of reach."],
      child_abuse: ["Keep your child away from the person who may have hurt them."],
      domestic_violence: [
        "If it isn't safe to talk, move somewhere safe first and keep your phone with you.",
      ],
      general: ["Stay with whoever is at risk and keep away from anything that could cause harm."],
    },
    followUp:
      'Is everyone safe right now? If so, tell me "everyone is safe" and I\'ll help with what you need.',
  },
  ur: {
    summary:
      "میں آپ کے ساتھ ہوں۔ حفاظت سب سے پہلے ہے — سب کے محفوظ ہوتے ہی باقی ہر بات میں مدد کی جائے گی۔",
    lines: {
      medical_emergency: [
        "بچے کے ساتھ رہیں اور کال سننے والے اہلکار کی ہدایات پر عمل کریں۔",
        "جب تک ڈاکٹر یا کال سننے والا نہ کہے، بچے کو کوئی دوا نہ دیں۔",
      ],
      self_harm: ["ان کے ساتھ رہیں، اور دوائیں اور تیز دھار چیزیں پہنچ سے دور رکھیں۔"],
      child_abuse: ["بچے کو اس شخص سے دور رکھیں جس نے اسے نقصان پہنچایا ہو سکتا ہے۔"],
      domestic_violence: [
        "اگر بات کرنا محفوظ نہیں تو پہلے کسی محفوظ جگہ چلے جائیں اور فون اپنے پاس رکھیں۔",
      ],
      general: ["خطرے میں موجود شخص کے ساتھ رہیں اور نقصان پہنچانے والی ہر چیز سے دور رہیں۔"],
    },
    followUp:
      'کیا اس وقت سب محفوظ ہیں؟ اگر ہاں، تو لکھیں "سب محفوظ ہیں" — پھر آپ کی ضرورت کے مطابق مدد کی جائے گی۔',
  },
  roman_ur: {
    summary:
      "Main aap ke saath hoon. Hifazat sab se pehle hai — sab ke mehfooz hote hi baqi har baat mein madad ki jayegi.",
    lines: {
      medical_emergency: [
        "Bachay ke saath rahein aur call sunne wale ahlkar ki hidayat par amal karein.",
        "Jab tak doctor ya call sunne wala na kahe, bachay ko koi dawa na dein.",
      ],
      self_harm: [
        "Un ke saath rahein, aur dawaiyan aur tez dhaar cheezein pohanch se door rakhein.",
      ],
      child_abuse: [
        "Bachay ko us shakhs se door rakhein jis ne use nuqsan pohanchaya ho sakta hai.",
      ],
      domestic_violence: [
        "Agar baat karna mehfooz nahi to pehle kisi mehfooz jagah chale jayein aur phone apne paas rakhein.",
      ],
      general: [
        "Khatre mein mojood shakhs ke saath rahein aur nuqsan pohanchane wali har cheez se door rahein.",
      ],
    },
    followUp:
      'Kya is waqt sab mehfooz hain? Agar haan, to likhein "sab mehfooz hain" — phir aap ki zaroorat ke mutabiq madad ki jayegi.',
  },
};

export function buildSafetyCheck(
  category: EscalationCategory,
  language: Language,
  region: Region,
  source: "prescreen" | "model" = "model",
): CoachReply {
  const full = buildEscalation(category, language, region, source);
  const t = SAFETY_CHECK[language];
  return {
    ...full,
    summary: t.summary,
    steps: [full.steps[0] ?? emergencyLine(region, language), ...t.lines[category]],
    followUp: { kind: "question", text: t.followUp },
  };
}

/** True when a reply is the safety-check card (used by `pnpm eval`). */
export function isSafetyCheck(reply: CoachReply): boolean {
  return (
    reply.kind === "escalation" && reply.followUp.text === SAFETY_CHECK[reply.language].followUp
  );
}

const LANGUAGES: readonly Language[] = ["en", "ur", "roman_ur"];
const CATEGORIES: readonly EscalationCategory[] = [
  "medical_emergency",
  "self_harm",
  "child_abuse",
  "domestic_violence",
  "general",
];

/**
 * The category of an escalation card the client sent back as a past coach turn (the flattened text
 * of our own template), or null when that turn was not an escalation. Used so the same full card is
 * never shown twice in a row. A forged turn can at most turn a full card into the follow-up card,
 * which keeps the call-now line, the banner and the contacts.
 */
export function escalationCategoryOf(text: string): EscalationCategory | null {
  for (const language of LANGUAGES) {
    if (text.includes(SAFETY_CHECK[language].followUp)) {
      const lines = SAFETY_CHECK[language].lines;
      return CATEGORIES.find((c) => lines[c].every((line) => text.includes(line))) ?? "general";
    }
    if (text.includes(ESCALATION[language].followUp)) {
      const why = ESCALATION[language].why;
      return CATEGORIES.find((c) => text.includes(why[c])) ?? "general";
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Refer (SPEC §6.2 L4): model text failed the post-check, so we point to professionals instead.
// ---------------------------------------------------------------------------

const REFER: Record<
  Language,
  { summary: string; steps: readonly string[]; danger: (n: string) => string; followUp: string }
> = {
  en: {
    summary:
      "This is best answered by a professional who can look at your child's situation — I can't give doses, diagnoses or legal steps.",
    steps: [
      "For medicines, doses or worrying symptoms, speak to your child's doctor or a pharmacist.",
      "For questions about a diagnosis or development, ask your paediatrician or a child psychologist.",
      "For custody, travel or other legal questions, speak to a family lawyer.",
    ],
    danger: (n) => `If anyone may be in danger, call ${n} now.`,
    followUp: "Would you like ideas for what you can do at home in the meantime?",
  },
  ur: {
    summary:
      "اس کا بہترین جواب کوئی ماہر دے سکتا ہے جو بچے کی صورتحال دیکھ سکے — یہاں دوا کی مقدار، تشخیص یا قانونی طریقہ نہیں بتایا جا سکتا۔",
    steps: [
      "دوا، اس کی مقدار یا پریشان کن علامات کے بارے میں بچے کے ڈاکٹر یا فارماسسٹ سے بات کریں۔",
      "تشخیص یا نشوونما کے سوالات کے لیے بچوں کے ڈاکٹر یا چائلڈ سائیکالوجسٹ سے پوچھیں۔",
      "حضانت، سفر یا دیگر قانونی معاملات کے لیے فیملی وکیل سے بات کریں۔",
    ],
    danger: (n) => `اگر کسی کو خطرہ ہو سکتا ہے تو ابھی ${n} پر کال کریں۔`,
    followUp: "کیا آپ چاہیں گے کہ اس دوران گھر پر کیے جانے والے کچھ کام بتائے جائیں؟",
  },
  roman_ur: {
    summary:
      "Is ka behtareen jawab koi mahir de sakta hai jo bachay ki surat-e-haal dekh sake — dawa ki miqdar, tashkhees ya qanooni tareeqa yahan nahi bataya ja sakta.",
    steps: [
      "Dawa, us ki miqdar ya pareshan kun alamaat ke baare mein bachay ke doctor ya pharmacist se baat karein.",
      "Tashkhees ya nashonuma ke sawalaat ke liye bachon ke doctor ya child psychologist se poochein.",
      "Custody, safar ya doosre qanooni maamlaat ke liye family lawyer se baat karein.",
    ],
    danger: (n) => `Agar kisi ko khatra ho sakta hai to abhi ${n} par call karein.`,
    followUp: "Kya aap chahenge ke is dauran ghar par karne wale kuch kaam bataye jayein?",
  },
};

export function buildRefer(language: Language, region: Region): CoachReply {
  const t = REFER[language];
  return {
    kind: "coach",
    language,
    risk: "refer",
    summary: t.summary,
    steps: [...t.steps, t.danger(emergencyLine(region, language))],
    followUp: { kind: "question", text: t.followUp },
  };
}
