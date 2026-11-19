import { describe, expect, it } from "vitest";
import { postCheck, type PostCheckViolation } from "@/lib/safety/postcheck";

const ZW = String.fromCharCode(0x200b);

describe("postCheck (AC-9)", () => {
  it.each<[string, string, PostCheckViolation | null]>([
    // clean everyday advice
    ["clean English", "Keep the same short routine every night for a week.", null],
    ["small numbers are fine", "Offer 2 choices and give a 5 minute warning before bath.", null],
    ["age with digits", "Most 4-year-olds need 10 to 13 hours of sleep.", null],
    ["tablet as a device", "Keep the tablet out of the bedroom an hour before sleep.", null],
    ["own spoon", "Let him use his own spoon, even if it gets messy.", null],
    ["clean Urdu", "ہر رات ایک ہی وقت پر سونے کا معمول رکھیں۔", null],
    ["clean Roman Urdu", "Har raat ek hi waqt par sone ka mamool rakhein.", null],
    ["Urdu own spoon", "بچے کو اپنا چمچ خود استعمال کرنے دیں۔", null],
    // digits
    ["phone number", "Call 999 if you are worried.", "digits"],
    [
      "two-digit number to call",
      "To report it, call 15 or visit the nearest police station.",
      "digits",
    ],
    ["spaced number to dial", "Call 1-1-2-2 now", "digits"],
    ["split number to call", "call 11 22", "digits"],
    ["Roman Urdu number then call", "15 par call karein", "digits"],
    ["Urdu number then call", "15 پر کال کریں", "digits"],
    ["phone time limit is fine", "Limit phone time to 30 minutes a day.", null],
    ["minute range is fine", "Spend 10-15 minutes of one-on-one time.", null],
    ["call him for dinner is fine", "Give him 5 minutes, then call him to the table.", null],
    ["Urdu minutes is fine", "کھانا کھلانے سے پہلے 2 منٹ دیں", null],
    // Arabic code points (kaf / yeh / heh) fold like the pre-screen
    ["Arabic heh in drops", "دو قطره دوا", "dosage"],
    ["Arabic kaf in dose", "خوراك", "dosage"],
    ["Arabic yeh in milligram", "ملي گرام", "dosage"],
    ["Arabic yeh in pills", "دو گوليان", "dosage"],
    // regional brands and supplements
    ["UAE brand Adol", "Give him Adol for the fever", "medicine"],
    ["PK brand Ponstan", "Try Ponstan", "medicine"],
    ["PK brand Hydryllin", "Give Hydryllin syrup", "medicine"],
    ["Zyrtec", "Zyrtec before bed", "medicine"],
    ["iron supplements", "give her iron supplements", "medicine"],
    ["vitamin D drops", "Start vitamin D drops", "medicine"],
    ["adolescent is not Adol", "He is an adolescent now, give him space.", null],
    ["iron-rich food is fine", "Offer iron-rich foods like lentils and spinach.", null],
    ["dashed number", "Ring 800-725462 for support.", "digits"],
    ["Eastern digits", "۹۹۹ پر کال کریں", "digits"],
    ["Arabic-Indic digits", "١١٢٢ پر رابطہ کریں", "digits"],
    ["temperature 38.5 is two runs of <3", "If the fever is 38.5 see a doctor", null],
    // URLs and emails
    ["https", "See https://example.com for more.", "url"],
    ["www", "Visit www.example.org", "url"],
    ["bare domain", "Look at healthychildren.org for tips", "url"],
    ["email", "Write to help@example.com", "url"],
    // dosage units
    ["mg", "Give 5mg at night.", "dosage"],
    ["ml spaced", "about 2.5 ml is typical", "dosage"],
    ["bare unit", "the usual mg per kg", "dosage"],
    ["half a tablet", "half a tablet before bed", "dosage"],
    ["two drops", "put two drops in each ear", "dosage"],
    ["teaspoon", "one teaspoon of syrup", "dosage"],
    ["dosage word", "check the dosage on the box", "dosage"],
    ["Urdu goli", "رات کو ایک گولی دیں", "dosage"],
    ["Urdu milligram", "پانچ ملی گرام دیں", "dosage"],
    ["Urdu half spoon", "آدھا چمچ شربت دیں", "dosage"],
    ["Roman goli", "raat ko aadhi goli de dein", "dosage"],
    ["Roman ek chamach", "ek chamach syrup pilayein", "dosage"],
    // reviewer (M6) B1: dose forms that must trip
    ["teaspoonful", "Give half a teaspoonful of syrup", "dosage"],
    ["2 teaspoonfuls", "Give 2 teaspoonfuls of syrup", "dosage"],
    ["a few drops of saline", "Put a few drops of saline in each nostril", "dosage"],
    ["saline drops", "Put saline drops in her nose", "dosage"],
    ["prescribed tablets", "Give her the tablets the doctor prescribed", "dosage"],
    ["Urdu-script ml", "بچے کو ۵ ایم ایل شربت دیں", "dosage"],
    ["Urdu-script mg", "بچے کو 5 ایم جی دیں", "dosage"],
    ["dosing interval", "You can repeat the dose every four to six hours", "dosage"],
    // reviewer (M6) M1: any dotted host
    ["who.int", "See who.int for growth charts", "url"],
    [".ca host", "Look at caringforkids.cps.ca", "url"],
    ["bit.ly", "bit.ly/sleep-tips has a chart", "url"],
    // reviewer (M6) m1: invisible characters cannot split a number or a host
    ["zero-width digits", `Call 9${ZW}9${ZW}9 now`, "digits"],
    ["zero-width host", `Visit example${ZW}.com`, "url"],
    // reviewer (M6) m2: everyday household words stay clean
    ["hold a spoon", "Let him hold a spoon and feed himself.", null],
    ["Urdu one spoon of each food", "ہر نئی چیز کا ایک چمچ پلیٹ میں رکھیں۔", null],
    ["Roman two spoons of rice", "Do chamach chawal plate mein rakhein", null],
    ["tablet as a reward", "Give her a tablet only after homework", null],
    ["phones and tablets", "Keep phones and tablets out of the bedroom.", null],
    ["dropping food", "If he drops food on the floor, calmly pick it up together.", null],
    ["e.g. and i.e.", "Offer two choices, e.g. the red or blue cup, i.e. small decisions.", null],
    ["doses depend (no instruction)", "Doses depend on weight, so ask a pharmacist.", null],
    // reviewer (M6) B2: drops / capful / symptom-framed doses
    ["Urdu two drops in each ear", "ہر کان میں دو قطرے ڈالیں", "dosage"],
    ["Roman two drops in the nose", "do qatre naak mein daalein", "dosage"],
    ["Urdu one capful", "ایک ڈھکن پلائیں", "dosage"],
    ["Urdu spoon for fever", "بخار ہو تو ایک چمچ پلائیں", "dosage"],
    ["tablet for fever", "Give him a tablet at bedtime when the fever is high.", "dosage"],
    ["one drop in each eye", "Put one drop in each eye", "dosage"],
    // reviewer (M6) m4: dose adjustments
    ["half the dose", "Give half the dose at night.", "dosage"],
    ["the usual dose", "Use the usual dose before bed.", "dosage"],
    ["halve the dose", "Halve the dose if he is sleepy.", "dosage"],
    ["interval with a medicine word", "Give the syrup every four to six hours", "dosage"],
    // reviewer (M6) M2: feeding / sleep intervals stay clean
    [
      "newborn wakes every two to three hours",
      "Newborns wake every two to three hours to feed, which is normal.",
      null,
    ],
    ["meals every two to three hours", "Offer meals and snacks every two to three hours.", null],
    ["feed every 3 hours", "Feed her every 3 hours during the day.", null],
    [
      "ask for the right dose (no instruction)",
      "A pharmacist can tell you the right dose for her weight.",
      null,
    ],
    // reviewer (M6) m6: everyday sentences that must stay clean
    ["drop in grades", "If you notice a drop in his grades, talk to his teacher.", null],
    [
      "feeding interval + doctor",
      "Newborns wake every two to three hours to feed. If you're worried about weight gain, talk to your doctor.",
      null,
    ],
    ["teething wakes", "Teething pain can make babies wake every two hours.", null],
    ["Urdu pulao", "ایک چمچ پلاؤ اس کی پلیٹ میں رکھیں", null],
    ["Roman pulao", "ek chamach pilao uski plate mein rakhein", null],
    ["painting with a spoon", "Let her paint with a spoon; painting is messy fun.", null],
    // reviewer (M6) m7: dosing frequency
    ["twice a day", "Give the medicine twice a day", "dosage"],
    // medicine names (SPEC §6.4)
    ["paracetamol", "You can give paracetamol for the fever.", "medicine"],
    ["melatonin", "Some parents try melatonin.", "medicine"],
    ["Urdu panadol", "بچے کو پیناڈول دیں", "medicine"],
    ["ORS (reviewer m5)", "Give ORS after each loose stool.", "medicine"],
  ])("%s", (_name, text, expected) => {
    expect(postCheck([text])).toBe(expected);
  });

  it("checks every field", () => {
    expect(postCheck(["fine", "also fine", "call 1122"])).toBe("digits");
  });
});
