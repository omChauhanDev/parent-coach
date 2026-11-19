# Safety research (Phase A)

Researched 2026-11-19 by a read-only research subagent. Every contact number in §5 was **re-verified by
hand against the raw text of the official page** (curl + text extraction, 08:31–08:42 IST), not only
the subagent's summary. Nothing here is written from memory. This file is the source material for
`src/lib/safety/patterns.ts`, `contacts.ts` and `templates.ts`.

## 1. Indicators by category (sources)

| Category | Indicators | Sources |
|---|---|---|
| `medical_emergency` | can't breathe; seizure; loses consciousness / unresponsive; bleeding that won't stop; serious burn; ingested poison/medicine; serious allergic reaction; choking that won't clear; found unresponsive after being underwater; under-5 red flags: blue/grey/pale/mottled skin, lips or tongue; very fast or struggling breathing; non-blanching rash; ≥38 °C under 3 months or ≥39 °C at 3–6 months; can't be woken; weak/high-pitched/continuous cry; no pee in 12 h. AAP: call even when unsure. | [AAP](https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/When-Your-Child-Needs-Emergency-Medical-Services.aspx), [NHS](https://www.nhs.uk/baby/health/is-your-baby-or-toddler-seriously-ill/) |
| `child_abuse` | physical, emotional, sexual abuse, neglect, exploitation of under-18s; injuries with no or implausible explanation; sudden lasting behaviour change. Disclosures may be direct, indirect, behavioural, non-verbal or partial. "There are no reliable signs" — so act on disclosure. | [WHO](https://www.who.int/news-room/fact-sheets/detail/child-maltreatment), [AAP](https://www.healthychildren.org/English/safety-prevention/at-home/Pages/What-to-Know-about-Child-Abuse.aspx), [NSPCC](https://learning.nspcc.org.uk/child-abuse-and-neglect/recognising-and-responding-to-abuse) |
| `self_harm` (child **or** parent) | talking about wanting to die; looking for a way; hopeless / no reason to live; trapped / unbearable pain; feeling a burden; withdrawing; saying goodbye; giving away possessions; researching ways to die. A parent's thoughts of harming their child → mental-health route, not police. | [988](https://988lifeline.org/learn/warning-signs/), [NIMH](https://www.nimh.nih.gov/health/publications/warning-signs-of-suicide) |
| `domestic_violence` | threats to hurt or kill you, or to kill themselves or the children; choking or holding down; slapping, hitting, burning; isolation; control of money/food; monitoring; unwanted sexual contact. | [NHS](https://www.nhs.uk/live-well/getting-help-for-domestic-violence/) |

## 2. Phrase patterns (pre-screen candidates)
Variants in Roman Urdu are separated by `/`. Match **phrases** (or person + act, or age + fever), never single words.

### medical_emergency
| English | Urdu | Roman Urdu |
|---|---|---|
| not breathing / stopped breathing / can't breathe | سانس نہیں لے رہا/رہی، سانس رک گئی | saans nahi/nahin/nai/nhi le raha/rahi; saans ruk gayi/gai |
| lips/face turning blue | ہونٹ نیلے ہو گئے | hont neele/neelay/nilay ho gaye |
| won't wake up / unconscious / unresponsive | بے ہوش ہو گیا، اٹھ نہیں رہا | behosh/be hosh/bayhosh; uth nahi raha |
| having a seizure / fitting | دورہ پڑ گیا، جھٹکے لگ رہے ہیں | dora/daura par/para gaya; jhatke/jhatkay lag rahe |
| swallowed pills / medicine / button battery / magnet | گولیاں کھا لیں، دوائی کھا لی | goliyan/golian kha li/lin; dawai/dawayi kha li |
| drank bleach / kerosene / acid / poison | زہر/تیزاب/مٹی کا تیل پی لیا | zehar/zahar/zehr pi/pee liya/lia; tezab/taizab; mitti ka tel |
| bleeding won't stop | خون نہیں رک رہا | khoon/khun nahi ruk raha |
| badly burned / boiling water fell on him | بری طرح جل گیا، کھولتا پانی گر گیا | buri tarah jal gaya; kholta/garam pani gir gaya |
| choking / something stuck in throat | گلے میں کچھ پھنس گیا | gale/galay mein phans/phas gaya |
| drowned / pulled from water | پانی میں ڈوب گیا | doob/dub gaya |
| fever in a baby under 3 months (age **and** fever) | نومولود کو بخار | naumolood/nomolood + bukhar/bukhaar |

### child_abuse
| English | Urdu | Roman Urdu |
|---|---|---|
| touched him/her down there / private parts | غلط جگہ ہاتھ لگایا، شرمگاہ کو چھوا | ghalat/galat jagah chuwa/chua/chhua/haath lagaya |
| [uncle/tutor/driver/qari] touches her (person + act) | گندی حرکت کرتا ہے | gandi harkat/harkatein karta hai |
| sexually abused / raped | جنسی زیادتی | jinsi zyadti/ziyadti/zyadati |
| told her it's a secret / don't tell mummy | کسی کو مت بتانا، یہ ہمارا راز ہے | kisi ko mat/na batana; raaz/raz hai |
| showed him porn / asked for naked pictures | گندی ویڈیو دکھائی، ننگی تصویریں | gandi video dikhai/dikhayi; nangi tasveerein/tasweeren |
| beat him with a belt / stick / wire, left marks | بیلٹ/ڈنڈے/تار سے مارا، نشان پڑ گئے | belt/danday/dande se maara/mara; nishan/nishaan |
| burned him with an iron / cigarette | استری/سگریٹ سے جلایا | istri/isteri se jalaya |
| shook the baby | بچے کو جھنجھوڑا | bache ko jhanjhora |
| locked in a room / not fed / left alone for days | کمرے میں بند کر دیا، کھانا نہیں دیتے | kamre/kamray mein band; khana nahi dete |
| parent: "I hit my child too hard / can't stop" | بچے کو بہت زیادہ مار دیا | — |

### self_harm (child or parent)
| English | Urdu | Roman Urdu |
|---|---|---|
| want to die / wish I was dead | مرنا چاہتا/چاہتی ہوں | marna chahta/chahti hoon/hun |
| kill myself / end my life / suicide | خودکشی، اپنی جان لے لوں گی | khudkushi/khudkashi/khud kushi/khudkhushi; apni jaan le lun/loon |
| wants to sleep forever / not wake up | ہمیشہ کے لیے سونا چاہتا ہے | hamesha/humesha ke liye so jana |
| better off without me / I'm a burden | میرے بغیر سب بہتر ہوں گے | mere/meray baghair/bagair sab behtar |
| no reason to live / don't want to live | جینے کا دل نہیں کرتا | jeene/jeenay/jine ka dil nahi karta; zinda nahi rehna |
| cutting himself / cuts on arms | نس کاٹ لی، بازو پر کٹ لگاتا ہے | nas kaat/kat li; bazu/baazu par cut |
| hang myself / jump from the roof | پنکھے سے لٹک جاؤں | pankhe/pankhay se latak; chhat se kood |
| goodbye note / giving things away / searching how to die | — | — |
| thoughts of hurting/killing my baby | بچے کو نقصان پہنچا دوں گی | bache/bachay ko nuqsan/nuksan pohncha dungi |
| kill the kids and myself | بچوں کو مار کر خود بھی مر جاؤں گی | bachon ko maar ke khud bhi |
| end it all | سب ختم کر دوں گی | sab khatam/khatm kar dun/doon |

### domestic_violence
| English | Urdu | Roman Urdu |
|---|---|---|
| husband hits/beats/slaps me | شوہر مجھے مارتا ہے، تھپڑ مارا | shohar/shauhar/husband maarta/marta; thappar/thapar/tamacha |
| choked / strangled me | گلا دبایا | gala dabaya/dabaaya |
| threatened to kill me / the kids | جان سے مارنے کی دھمکی | jaan se maarne ki dhamki/dhamkee |
| won't let me leave / locks me in / took my phone | گھر سے نکلنے نہیں دیتا، فون چھین لیا | bahar nahi jane deta; phone cheen/chheen liya |
| scared to go home / afraid of him | شوہر سے ڈر لگتا ہے | shohar se dar/darr lagta |
| in-laws beat me | سسرال والے مارتے ہیں | susral/sasural wale marte hain; saas maarti |
| threatened acid | تیزاب پھینکنے کی دھمکی | tezab/tezaab phenkne ki dhamki |
| hits me in front of the kids | بچوں کے سامنے مارتا ہے | bachon ke samne marta |
| forces me (sex) | زبردستی کرتا ہے | zabardasti karta |

## 3. False-positive traps (must NOT trigger the pre-screen)
- **English:** killing it; dying to go; could kill for a coffee; dead tired; I'm so dead (in trouble); dying of laughter; kill time; burned out / burnt the toast; my heart stopped (fright); blue shirt; suicide sprints; touched by his speech; beat him at chess; we fight a lot.
- **Urdu / Roman Urdu:** mar gayi / main to mar gayi; jaan nikal gayi; marne ki fursat nahi; mar mar ke; jaan se pyara; dimagh kharab kar diya; sar kha liya; pagal kar diya; tang aa gayi; neela peela ho gaya (furious); jal gayi / jalna (jealous); khoon pee liya; zehar lagta hai; maar khaye ga / maar dalun gi (common threats to a child); chhoo kar dekha (checked for fever); nange paon; gandi harkat (toddler naughtiness); zyadti alone (= injustice).
- **Mitigations:** phrase-level patterns; person + act (child + touch + body part); age + fever; "zindagi se tang" is left to the model; negated or hypothetical text **still escalates** (false positive preferred).

## 4. Normalisation for the matcher
Based on Doctor et al., *Graphemic Normalization of the Perso-Arabic Script* (<https://arxiv.org/abs/2210.12273>).
- NFC, then NFKC for Arabic presentation forms (U+FB50–FDFF, FE70–FEFF).
- Fold ي (U+064A) and ى (U+0649) → ی (U+06CC); ك (U+0643) → ک (U+06A9); ه (U+0647) and ة (U+0629) → ہ (U+06C1). Also fold ھ (U+06BE) ≈ ہ for matching (مجھے / مجہے). Handle ۂ (U+06C2) vs ہ + ٔ (U+0654).
- Strip harakat (U+064B–065F, U+0670), tatweel (U+0640), ZWNJ/ZWJ (U+200C/D), LRM/RLM (U+200E/F) and BOM (U+FEFF). Allow an optional space inside compounds (خودکشی / خود کشی).
- Digits: ٠–٩ (U+0660–0669) and ۰–۹ (U+06F0–06F9) → 0–9.
- Punctuation: ۔ (U+06D4), ، (U+060C), ؟ (U+061F) → space.
- Roman Urdu: lowercase, collapse runs of 3+ identical letters (nahiiii → nahi), variant regexes such as `kh?ud\s?k[auiy]sh?i` (Khan et al., <https://arxiv.org/abs/2004.00088>).

## 5. Verified contacts (used by the app)
Re-verified 2026-11-19 against the raw text of each official page. Quotes are the extracted page text.

| Region | Category use | Service | Number | Coverage / hours | Source | Raw-page quote |
|---|---|---|---|---|---|---|
| AE | emergency (all) | Police | 999 | nationwide | <https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/handling-emergencies> | "you can call the following numbers while anywhere in the UAE: 999 for Police 998 for Ambulance 997 for Fire Department" |
| AE | emergency (all), medical | Ambulance | 998 | nationwide | same | same |
| AE | child_abuse | MoI Child Protection Centre | 116111 | national | <https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/children-safety> | "You can report child abuse to MoI through the hotline number 116111" |
| AE | domestic_violence | Dubai Foundation for Women and Children | 800111 | Dubai; office hours (7:30–15:30 Mon–Thu listed) | <https://www.dfwac.ae> | "Call Us 04-6060300 / 04-2871177 800111" |
| AE | domestic_violence | Abu Dhabi Family Care Authority | 800-444 | Abu Dhabi | <https://www.mediaoffice.abudhabi/en/community/family-care-authority-releases-2023-statistics/> | "individuals seeking assistance can contact 800-444" |
| AE | self_harm | Department of Health Abu Dhabi, 800-SAKINA | 800-725462 | Abu Dhabi; 24/7 | <https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/> | "For mental health support, residents can call 800-SAKINA (800-725462)." / "activates 24/7 mental health support hotline" |
| AE | self_harm | Dubai Health Itma'en | 800506 | Dubai; daily 9:00–24:00 | <https://dubaihealth.ae/w/dubai-health-community-development-authority-and-dubai-health-authority-introduce-the-itma-en-service-to-support-mental-wellbeing-and-quality-of-life-in-dubai> | "a dedicated hotline (800506)" / "operating daily from 9:00 am to midnight" |
| PK | emergency (all) | Police | 15 | verified on KP Police site | <https://kppolice.gov.pk/> | "Emergency Helplines Police Emergency (15)" |
| PK | emergency (all), medical | Rescue 1122 | 1122 | Punjab Emergency Service (provincial) | <https://rescue.gov.pk/> | "Helplines Emergency Number 1122" |
| PK | emergency, medical | Edhi Foundation ambulance | 115 | national (NGO) | <https://edhi.org/> | "Emergency Call 115" |
| PK | child_abuse | KP Child Protection & Welfare Commission | 1121 | Khyber Pakhtunkhwa; toll free, 24 h | <https://kpcpwc.gov.pk/> | "Emergency Helpline 1121 Toll Free / 24 Hours" |
| PK | domestic_violence | Punjab Women's Helpline (PCSW) | 1043 | Punjab; Mon–Sat 8:00–16:00 | <https://pcswpb.org/esw/helpline_faqs.php> | "A Toll-Free Helpline # 1043 has been established by the Governemnt of Punjab." / "Monday to Saturday between 8:00 AM – 4:00 PM" |
| PK | self_harm | Taskeen (NGO psychologist line) | +92 316 827 5336 | national; hours not stated | <https://taskeen.org/> | "Our Helpline: +92 316 827 5336" |

**Not verified, so not used (no numbers recorded):** UAE national wellbeing line (hope.hw.gov.ae did not
resolve), Abu Dhabi Istijaba, Pakistan Ministry of Human Rights helpline, Punjab Child Protection & Welfare
Bureau, Sindh Child Protection Authority, Umang, Punjab Safe Cities psychologist option, federal mental-health
helpline, Pakistan National Poison Control Centre, Rozan, Madadgar, Islamabad Police page, Rescue 1122
outside Punjab (operators' own sites).

**Known gap:** Pakistan has no verified 24/7 national mental-health or child-protection line, so PK
escalations lead with 15 / 1122 / 115. Contacts must be re-verified before any real use.

## 6. How a non-clinical chatbot should respond
- Show care, take it seriously, don't judge ([#BeThe1To](http://bethe1to.com/bethe1to-steps-evidence/)).
- Ask directly about immediate safety; asking about suicide does not increase risk. Encourage distance from means and connection to support.
- Never describe or discuss methods ([WHO responsible reporting](https://www.who.int/initiatives/live-life-initiative-for-suicide-prevention/interact-with-media-for-responsible-reporting-of-suicide)); give help-seeking information.
- Abuse: listen, it is never the child's fault, never promise secrecy, don't confront the alleged abuser, don't investigate — "Let the child tell what happened in their own words" ([NSOPW](https://www.nsopw.gov/en/SafetyAndEducation/HowToRespond), NSPCC above). Immediate danger → police.
- Medical: urge an immediate emergency call, even when unsure (AAP); don't delay it with diagnosis.
- Domestic violence: call emergency in danger; you don't have to wait for an emergency to get help (NHS).
