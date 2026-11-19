import type { Contact, CrisisCategory, Language, Region } from "@/lib/contract";

/**
 * Verified contacts — copied exactly from docs/research/safety.md §5, where each number was checked
 * against the raw text of its official page on 2026-11-19. Never add a number from memory.
 * Urdu / Roman Urdu labels and notes are drafts pending native-speaker review.
 */
export const VERIFIED_ON = "2026-11-19";

type Localised = Readonly<Record<Language, string>>;

export interface VerifiedContact {
  readonly label: Localised;
  readonly number: string;
  readonly note?: Localised;
  readonly sourceUrl: string;
  readonly verifiedOn: string;
}

const UAE_EMERGENCIES =
  "https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/handling-emergencies";

export const CONTACTS = {
  aePolice: {
    label: { en: "Police", ur: "پولیس", roman_ur: "Police" },
    number: "999",
    note: {
      en: "Anywhere in the UAE",
      ur: "یو اے ای میں کہیں بھی",
      roman_ur: "UAE mein kahin bhi",
    },
    sourceUrl: UAE_EMERGENCIES,
    verifiedOn: VERIFIED_ON,
  },
  aeAmbulance: {
    label: { en: "Ambulance", ur: "ایمبولینس", roman_ur: "Ambulance" },
    number: "998",
    note: {
      en: "Anywhere in the UAE",
      ur: "یو اے ای میں کہیں بھی",
      roman_ur: "UAE mein kahin bhi",
    },
    sourceUrl: UAE_EMERGENCIES,
    verifiedOn: VERIFIED_ON,
  },
  aeChildProtection: {
    label: {
      en: "Ministry of Interior Child Protection Centre",
      ur: "وزارت داخلہ چائلڈ پروٹیکشن سینٹر",
      roman_ur: "Wazarat-e-Dakhla Child Protection Centre",
    },
    number: "116111",
    note: { en: "UAE-wide", ur: "پورے یو اے ای کے لیے", roman_ur: "Poore UAE ke liye" },
    sourceUrl:
      "https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/children-safety",
    verifiedOn: VERIFIED_ON,
  },
  aeDubaiWomenChildren: {
    label: {
      en: "Dubai Foundation for Women and Children",
      ur: "دبئی فاؤنڈیشن فار ویمن اینڈ چلڈرن",
      roman_ur: "Dubai Foundation for Women and Children",
    },
    number: "800111",
    note: {
      en: "Dubai · office hours",
      ur: "دبئی · دفتری اوقات",
      roman_ur: "Dubai · daftari auqaat",
    },
    sourceUrl: "https://www.dfwac.ae",
    verifiedOn: VERIFIED_ON,
  },
  aeAbuDhabiFamilyCare: {
    label: {
      en: "Abu Dhabi Family Care Authority",
      ur: "ابوظہبی فیملی کیئر اتھارٹی",
      roman_ur: "Abu Dhabi Family Care Authority",
    },
    number: "800-444",
    note: { en: "Abu Dhabi", ur: "ابوظہبی", roman_ur: "Abu Dhabi" },
    sourceUrl:
      "https://www.mediaoffice.abudhabi/en/community/family-care-authority-releases-2023-statistics/",
    verifiedOn: VERIFIED_ON,
  },
  aeSakina: {
    label: {
      en: "800-SAKINA mental health line (Department of Health Abu Dhabi)",
      ur: "ذہنی صحت ہیلپ لائن 800-SAKINA (محکمہ صحت ابوظہبی)",
      roman_ur: "Zehni sehat helpline 800-SAKINA (Department of Health Abu Dhabi)",
    },
    number: "800-725462",
    note: {
      en: "Abu Dhabi · 24/7",
      ur: "ابوظہبی · چوبیس گھنٹے",
      roman_ur: "Abu Dhabi · 24 ghante",
    },
    sourceUrl:
      "https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/",
    verifiedOn: VERIFIED_ON,
  },
  aeItmaen: {
    label: {
      en: "Itma'en mental wellbeing line (Dubai Health)",
      ur: "اطمینان ذہنی صحت ہیلپ لائن (دبئی ہیلتھ)",
      roman_ur: "Itma'en zehni sehat helpline (Dubai Health)",
    },
    number: "800506",
    note: {
      en: "Dubai · daily 9:00–24:00",
      ur: "دبئی · روزانہ صبح 9 سے رات 12 بجے تک",
      roman_ur: "Dubai · rozana subah 9 se raat 12 baje tak",
    },
    sourceUrl:
      "https://dubaihealth.ae/w/dubai-health-community-development-authority-and-dubai-health-authority-introduce-the-itma-en-service-to-support-mental-wellbeing-and-quality-of-life-in-dubai",
    verifiedOn: VERIFIED_ON,
  },
  pkPolice: {
    label: { en: "Police", ur: "پولیس", roman_ur: "Police" },
    number: "15",
    note: { en: "Police emergency", ur: "پولیس ایمرجنسی", roman_ur: "Police emergency" },
    sourceUrl: "https://kppolice.gov.pk/",
    verifiedOn: VERIFIED_ON,
  },
  pkRescue: {
    label: { en: "Rescue", ur: "ریسکیو", roman_ur: "Rescue" },
    number: "1122",
    note: {
      en: "Punjab Emergency Service (provincial)",
      ur: "پنجاب ایمرجنسی سروس (صوبائی)",
      roman_ur: "Punjab Emergency Service (soobai)",
    },
    sourceUrl: "https://rescue.gov.pk/",
    verifiedOn: VERIFIED_ON,
  },
  pkEdhi: {
    label: { en: "Edhi ambulance", ur: "ایدھی ایمبولینس", roman_ur: "Edhi ambulance" },
    number: "115",
    note: {
      en: "Edhi Foundation (NGO) · nationwide",
      ur: "ایدھی فاؤنڈیشن (غیر سرکاری) · ملک بھر میں",
      roman_ur: "Edhi Foundation (NGO) · mulk bhar mein",
    },
    sourceUrl: "https://edhi.org/",
    verifiedOn: VERIFIED_ON,
  },
  pkKpChildProtection: {
    label: {
      en: "KP Child Protection & Welfare Commission",
      ur: "خیبر پختونخوا چائلڈ پروٹیکشن اینڈ ویلفیئر کمیشن",
      roman_ur: "KP Child Protection & Welfare Commission",
    },
    number: "1121",
    note: {
      en: "Khyber Pakhtunkhwa · toll-free, 24 hours",
      ur: "خیبر پختونخوا · مفت، چوبیس گھنٹے",
      roman_ur: "Khyber Pakhtunkhwa · muft, 24 ghante",
    },
    sourceUrl: "https://kpcpwc.gov.pk/",
    verifiedOn: VERIFIED_ON,
  },
  pkPunjabWomen: {
    label: {
      en: "Punjab Women's Helpline (PCSW)",
      ur: "پنجاب ویمن ہیلپ لائن",
      roman_ur: "Punjab Women's Helpline (PCSW)",
    },
    number: "1043",
    note: {
      en: "Punjab · Mon–Sat 8:00–16:00",
      ur: "پنجاب · پیر تا ہفتہ صبح 8 سے شام 4 بجے تک",
      roman_ur: "Punjab · peer se hafta subah 8 se shaam 4 baje tak",
    },
    sourceUrl: "https://pcswpb.org/esw/helpline_faqs.php",
    verifiedOn: VERIFIED_ON,
  },
  pkTaskeen: {
    label: {
      en: "Taskeen psychologist helpline",
      ur: "تسکین ماہر نفسیات ہیلپ لائن",
      roman_ur: "Taskeen psychologist helpline",
    },
    number: "+92 316 827 5336",
    note: {
      en: "NGO · hours not stated",
      ur: "غیر سرکاری تنظیم · اوقات درج نہیں",
      roman_ur: "NGO · auqaat darj nahi",
    },
    sourceUrl: "https://taskeen.org/",
    verifiedOn: VERIFIED_ON,
  },
} as const satisfies Record<string, VerifiedContact>;

const C = CONTACTS;

/** Always visible in the footer (SPEC §6.7). */
export const FOOTER_CONTACTS: Readonly<Record<Region, readonly VerifiedContact[]>> = {
  AE: [C.aePolice, C.aeAmbulance],
  PK: [C.pkPolice, C.pkRescue, C.pkEdhi],
};

/** Escalation contacts: emergency first, then category lines; at most 3 (SPEC §6.3, §6.7). */
export const ESCALATION_CONTACTS: Readonly<
  Record<Region, Readonly<Record<CrisisCategory | "general", readonly VerifiedContact[]>>>
> = {
  AE: {
    medical_emergency: [C.aeAmbulance, C.aePolice],
    self_harm: [C.aePolice, C.aeSakina, C.aeItmaen],
    child_abuse: [C.aePolice, C.aeChildProtection],
    domestic_violence: [C.aePolice, C.aeDubaiWomenChildren, C.aeAbuDhabiFamilyCare],
    general: FOOTER_CONTACTS.AE,
  },
  PK: {
    medical_emergency: [C.pkRescue, C.pkEdhi],
    self_harm: [C.pkRescue, C.pkPolice, C.pkTaskeen],
    child_abuse: [C.pkPolice, C.pkKpChildProtection],
    domestic_violence: [C.pkPolice, C.pkPunjabWomen],
    general: FOOTER_CONTACTS.PK,
  },
};

export function localiseContact(contact: VerifiedContact, language: Language): Contact {
  return {
    label: contact.label[language],
    number: contact.number,
    ...(contact.note ? { note: contact.note[language] } : {}),
    sourceUrl: contact.sourceUrl,
  };
}

export function footerContacts(region: Region, language: Language): Contact[] {
  return FOOTER_CONTACTS[region].map((c) => localiseContact(c, language));
}

export function escalationContacts(
  region: Region,
  category: CrisisCategory | "general",
  language: Language,
): Contact[] {
  return ESCALATION_CONTACTS[region][category].map((c) => localiseContact(c, language));
}
