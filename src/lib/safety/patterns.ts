import type { CrisisCategory } from "@/lib/contract";

/**
 * Pre-screen patterns (data only), from docs/research/safety.md §2–§3.
 *
 * Matched against `normalize(text)`: lowercase, apostrophes removed (can't → cant), punctuation and
 * hyphens turned into single spaces, Urdu letters folded. Every pattern is anchored at a word start
 * by the matcher. Patterns are phrases (person + act, age + fever), never single risky words, so
 * everyday hyperbole ("killing it", "main to mar gayi") does not match. Negated or hypothetical
 * phrasing still matches on purpose — false positives are preferred.
 */
export interface CrisisPattern {
  id: string;
  category: CrisisCategory;
  source: string;
}

const r = String.raw;

/** A space plus up to three words in between: write `a${G}b`. */
const G = r` (?:\S+ ){0,3}`;
/** A space plus up to six words in between: write `a${G6}b`. */
const G6 = r` (?:\S+ ){0,6}`;
/** Word end. */
const E = r`(?![\p{L}\p{N}])`;

// ---------- shared vocabulary ----------
const EN_PARTNER = r`(?:husband|hubby|wife|partner|ex|ex husband|ex wife|boyfriend|fiance|spouse|father in law|mother in law|in laws|inlaws|brother in law|sister in law|his (?:mother|mum|mom|father|dad|family))`;
const EN_CHILD = r`(?:him|her|them|my (?:son|daughter|child|kid|kids|children|baby|boy|girl|toddler)|the (?:baby|kids|children|child)|our (?:baby|son|daughter|child|kids))`;
const EN_ADULT = r`(?:uncle|tutor|teacher|driver|van driver|qari|maulvi|molvi|imam|coach|cousin|neighbou?r|step ?father|step ?dad|grand ?father|grandpa|chacha|mamu|mamoo|khalu|phupha|servant|maid|nanny|guard|watchman|babysitter|man|older boy|relative|family friend|priest|trainer|instructor|someone|somebody|stranger)`;
const UR_PARTNER = r`(?:شوہر|خاوند|میاں|سسر|ساس|دیور|جیٹھ|نند|سسرال|سسرال والے|منگیتر|سابقہ شوہر)`;
const UR_ADULT = r`(?:انکل|چاچا|چچا|چاچو|ماموں|خالو|پھوپھا|قاری|مولوی|امام|ٹیوٹر|استاد|ٹیچر|ڈرائیور|وین والا|ملازم|نوکر|چوکیدار|گارڈ|کزن|پڑوسی|ہمسایہ|سوتیلا باپ|سوتیلے والد|دادا|نانا|آدمی|کوئی شخص|رشتہ دار)`;
const RU_PARTNER = r`(?:shohar|shauhar|shoher|shohr|khawand|khaavind|husband|hubby|miyan|mian|sasur|susar|saas|sas|dewar|devar|jeth|nand|susral|sasural|susraal|sasraal|susral wale|sasural wale|in ?laws|mangetar|ex)`;
const RU_ADULT = r`(?:uncle|chacha|chachu|mamu|mamoo|mamun|maamu|khalu|phupha|phuppa|qari|qari sahab|maulvi|molvi|moulvi|imam|tutor|teacher|ustad|driver|van wala|naukar|mulazim|servant|chowkidar|chokidar|guard|cousin|parosi|padosi|hamsaya|sotela|sautela|dada|nana|aadmi|admi|rishtedar|rishte ?dar)`;
const RU_NOT = r`(?:nahi|nahin|nai|nhi|na)`;

export const PATTERNS: readonly CrisisPattern[] = [
  // =====================================================================
  // medical_emergency
  // =====================================================================
  {
    id: "en.med.breathing",
    category: "medical_emergency",
    source: r`(?:not|isnt|wasnt|stopped|stops|cant|cannot|can not|couldnt|struggling to|trouble|difficulty|hard time) breath(?:e|es|ing)?${E}|gasping for (?:air|breath)`,
  },
  {
    id: "en.med.blue",
    category: "medical_emergency",
    source: r`(?:lips|face|skin|tongue)${G}(?:turn(?:ed|ing|s)?|went|going|are|is|look(?:s|ing)?) (?:blue|grey|gray)${E}|turn(?:ed|ing) (?:blue|grey|gray)${E}`,
  },
  {
    id: "en.med.unresponsive",
    category: "medical_emergency",
    source: r`unconscious|unresponsive|(?<!finally |just |literally )passed out|lost consciousness|(?:he|she|baby|son|daughter|child|toddler|kid|they) (?:just |suddenly )?collapsed|(?:wont|will not|doesnt|does not|isnt|is not|not) wak(?:e|ing) up(?! for| in time| on time| early| in the morning| before)|(?:cant|cannot|couldnt) wake (?:him|her|them|my \S+|the baby)(?! up for| for| in time| on time| early| in the morning)`,
  },
  { id: "en.med.seizure", category: "medical_emergency", source: r`seizure|convuls|epileptic fit` },
  {
    id: "en.med.ingestion",
    category: "medical_emergency",
    source: r`(?:swallowed|ate|eaten|drank|drunk|ingested|got into|gotten into)${G}(?:pills?|tablets|medicines?|medication|meds|button batter(?:y|ies)|batter(?:y|ies)|magnets?|bleach|detergent|laundry pods?|cleaning (?:liquid|fluid|products?)|chemicals?|poison|kerosene|petrol|acid|drain cleaner|rat poison|insecticide|pesticide|paracetamol|panadol|calpol|iron tablets?)${E}`,
  },
  {
    id: "en.med.overdose",
    category: "medical_emergency",
    source: r`overdos|(?:pills|tablets|medicine|meds|medication)${G6}(?:eaten|swallowed|ate|drank|taken)${E}|(?:took|taken|swallowed)${G}(?:whole|entire|all (?:the|of|my|his|her)|lots of|a lot of|many|handful of|bottle of|packet of|pack of|strip of)${G}(?:pills|tablets|medicine|meds)`,
  },
  {
    id: "en.med.poison",
    category: "medical_emergency",
    source: r`(?<!food )poisoning|(?:was|been|is|got) poisoned`,
  },
  {
    id: "en.med.bleeding",
    category: "medical_emergency",
    source: r`(?:bleed(?:ing)?|nosebleed) (?:wont|will not|doesnt|does not|isnt|is not|hasnt|has not|not) stop|(?:cant|cannot|couldnt) stop (?:the |his |her )?bleeding|bleeding (?:heavily|badly|a lot|everywhere|profusely)|(?:so|too) much blood|losing (?:a lot of )?blood`,
  },
  {
    id: "en.med.burn",
    category: "medical_emergency",
    source: r`(?:badly|severely|seriously) burn(?:ed|t)|burn(?:ed|t) (?:his|her|their) (?:hand|arm|leg|face|skin|body|foot|feet|fingers?|chest|back|neck)|boiling (?:water|oil|milk|tea)${G}(?:fell|spilled|spilt|poured|went|splashed)|(?:spilled|spilt|poured|knocked)${G}boiling|scald(?:ed|ing)?${E}|electrocuted|electric shock`,
  },
  {
    id: "en.med.choking",
    category: "medical_emergency",
    source: r`chok(?:ing|ed|es) on${E}|(?:is|was|s|keeps|started|baby|toddler|son|daughter|child) chok(?:ing|ed)(?! me| up| her mum| his mum)|(?:stuck|lodged) in (?:his|her|their|the) (?:throat|windpipe|airway)`,
  },
  {
    id: "en.med.drowning",
    category: "medical_emergency",
    source: r`(?:almost|nearly) drowned|drown(?:ed|ing)? (?:in|at) (?:the )?(?:pool|bath|bathtub|tub|sea|water|beach|lake|river|bucket)|(?:he|she|baby|son|daughter|child|toddler|kid) (?:drowned|was drowning|is drowning)(?! in (?:homework|work|paperwork|laundry|tears|school|assignments|chores|exams|tests|stuff|books))|pulled (?:him|her|them) (?:out )?(?:of|from) the (?:water|pool|bath|sea)|(?:found|was) (?:him |her )?(?:face down|floating) in the (?:pool|water|bath)`,
  },
  {
    id: "en.med.infant-fever",
    category: "medical_emergency",
    source: r`(?:newborn|new born|neonate|(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve) (?:days?|weeks?) old|(?:[123]|one|two|three) months? old)${G6}(?:fever|temperature|temp)${E}|(?:fever|temperature)${G6}(?:newborn|new born|(?:\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve) (?:days?|weeks?) old|(?:[123]|one|two|three) months? old)`,
  },
  {
    id: "en.med.red-flags",
    category: "medical_emergency",
    source: r`non blanching|rash${G}(?:doesnt|does not|wont|will not|didnt|did not) fade|glass test|anaphyla|throat (?:is )?(?:closing|swelling|swollen)|(?:tongue|lips) (?:is |are )?swell|floppy and|limp and (?:pale|unresponsive|not)|high pitched (?:cry|crying)|fell (?:from|off|out of) (?:the |a |our |his |her )?(?:balcony|roof|window|stairs|second floor|third floor|bunk bed)|hit by a (?:car|bus|truck|motorbike|bike)|hit (?:his|her) head${G6}(?:vomit|throwing up|unconscious|sleepy|drowsy|seizure|bleeding)`,
  },
  // Urdu
  {
    id: "ur.med.breathing",
    category: "medical_emergency",
    source: r`سانس نہیں (?:لے|آ) (?:رہا|رہی|رہے|پا)|سانس رک (?:گئی|گیا|جاتی)|سانس لینے میں (?:بہت )?(?:مشکل|دشواری|تکلیف)`,
  },
  {
    id: "ur.med.blue",
    category: "medical_emergency",
    source: r`ہونٹ${G}نیلے|(?:چہرہ|رنگ)${G}نیلا`,
  },
  {
    id: "ur.med.unresponsive",
    category: "medical_emergency",
    source: r`بے ?ہوش|(?:جگانے|ہلانے) (?:پر|سے) بھی نہیں اٹھ`,
  },
  {
    id: "ur.med.seizure",
    category: "medical_emergency",
    source: r`(?<!غصے کا )دورہ (?:پڑ|پڑا)|(?<!غصے کے )دورے (?:پڑ|پڑے)|جھٹکے لگ|مرگی`,
  },
  {
    id: "ur.med.ingestion",
    category: "medical_emergency",
    source: r`(?:گولیاں|گولی)${G6}(?:کھا|نگل) (?:بھی )?ل|(?:ساری|پوری|بہت سی|کئی|ڈھیر) (?:گولیاں|دوائی|دوا|دوائیاں)${G}(?:کھا|پی|نگل) ل|غلطی سے${G}(?:کھا|پی|نگل) ل|نگل${G}(?:سکہ|بیٹری|سیل|مقناطیس)|(?:سکہ|بیٹری|سیل|مقناطیس)${G}نگل|(?:زہر|تیزاب|مٹی کا تیل|کیروسین|بلیچ|فینائل|کیڑے مار)${G}(?:پی|کھا) ل`,
  },
  {
    id: "ur.med.bleeding",
    category: "medical_emergency",
    source: r`خون${G}(?:نہیں|نہ) رک|خون بند نہیں ہو`,
  },
  {
    id: "ur.med.burn",
    category: "medical_emergency",
    source: r`بری طرح (?:جل|جھلس)|کھولتا (?:ہوا )?(?:پانی|تیل|دودھ|چائے)${G}(?:گر|پڑ)|گرم (?:پانی|تیل|دودھ|چائے)${G}گر (?:گیا|گئی|گئے)`,
  },
  { id: "ur.med.choking", category: "medical_emergency", source: r`گلے میں${G}(?:پھنس|اٹک)` },
  {
    id: "ur.med.drowning",
    category: "medical_emergency",
    source: r`(?<!(?:سورج|(?:فون|موبائل|گیم|گیمز|کتاب|کتابوں|سوچ|کام|خیالوں|پڑھائی) میں) )ڈوب (?:گیا|گئی|رہا|رہی|گئے)|ڈوبتے ڈوبتے|ڈوبنے سے`,
  },
  {
    id: "ur.med.infant-fever",
    category: "medical_emergency",
    source: r`(?:نومولود|نوزائیدہ|(?:\d|ایک|دو|تین) (?:ماہ|مہینے|مہینہ) (?:کا|کی|کے)|(?:\d{1,2}|ایک|دو|تین|چار|پانچ|چھ|سات|آٹھ|نو|دس|گیارہ|بارہ) (?:ہفتے|دن) (?:کا|کی|کے))${G6}بخار|بخار${G6}(?:نومولود|نوزائیدہ)`,
  },
  // Roman Urdu
  {
    id: "ru.med.breathing",
    category: "medical_emergency",
    source: r`saa?ns ${RU_NOT} (?:le|lay|aa?) (?:raha|rahi|rha|rhi|rahe|pa|paa)|saa?ns (?:ruk|rok) (?:gayi|gai|gaya|gya|gyi|jati)|saa?ns lene (?:mein|me|main) (?:bohat |bahut )?(?:mushkil|takleef|takleef|dikkat)`,
  },
  {
    id: "ru.med.blue",
    category: "medical_emergency",
    source: r`(?:hont|honth|honton|hoth)\S*${G}n(?:ee|i|e)l(?:e|ay|ey|a)${E}`,
  },
  {
    id: "ru.med.unresponsive",
    category: "medical_emergency",
    source: r`(?:be ?h(?:o|ou)sh|bayhosh|beyhosh)|(?:jagane|hilane|jagaane|hilaane) (?:par|pe|se) bhi ${RU_NOT} uth`,
  },
  {
    id: "ru.med.seizure",
    category: "medical_emergency",
    source: r`(?<!gh?(?:u|o)s+(?:e|ay|y|a) (?:ka|ke) )(?:dora|daura|doura|dorah|dore|daure|dauray|doray) (?:par|para|pad|pada|parh|parha|pr|pd|parr)|jh?atk(?:e|ay|ey|y) (?:lag|a) (?:rahe|rahay|rhe|gaye)|mirgi`,
  },
  {
    id: "ru.med.ingestion",
    category: "medical_emergency",
    source: r`goli(?:yan|an|yaan|ya)?${G6}(?:kha|nigal) (?:bhi )?(?:li|lin|leen|lein|liya|lia|lee|gaya|gayi|gai)|(?:saari|sari|puri|poori|bohat saari|bahut saari|kai) (?:goliyan|golian|golia|dawai|dawayi|dawa|dawaiyan|tablets?)${G}(?:kha|pi|pee|nigal) (?:li|lin|liya|lia|lee|gaya|gayi|gai)|gh?alti se${G}(?:kha|pi|pee|nigal) (?:li|liya|lia|lee|gaya|gayi|gai)|nigal${G}(?:sikka|battery|cell|magnet)|(?:sikka|battery|cell|magnet)${G}nigal|(?:zehar|zahar|zehr|zeher|tezab|tezaab|taizab|tizab|mitti ka tel|kerosene|bleach|phenyl|phenol|keeray? mar)${G}(?:pi|pee|kha) (?:liya|lia|li|lee|gaya|gayi|gai|lya)`,
  },
  {
    id: "ru.med.bleeding",
    category: "medical_emergency",
    source: r`kh(?:o+|u)n${G}${RU_NOT} (?:ruk|rok|band ho)`,
  },
  {
    id: "ru.med.burn",
    category: "medical_emergency",
    source: r`buri tarah (?:jal|jhulas)|(?:kholta|kholte|ubalta|ubalte) (?:hua )?(?:pani|paani|tel|doodh|chai)${G}(?:gir|par|pad)|(?:garam|garm) (?:pani|paani|tel|doodh|chai)${G}gir (?:gaya|gya|gayi|gai|gaye)`,
  },
  {
    id: "ru.med.choking",
    category: "medical_emergency",
    source: r`gal(?:e|ay|y|ey) (?:mein|me|main|mai|mn)${G}(?:phans|phas|atak|atk)`,
  },
  {
    id: "ru.med.drowning",
    category: "medical_emergency",
    source: r`(?<!(?:suraj|sooraj|(?:phone|mobile|game|games|kitab|kitabon|soch|kaam|khayalon|parhai|padhai) (?:mein|me|main|mai)) )(?:doob|dub) (?:gaya|gya|gayi|gai|raha|rahi|gaye)|doobte doobte|doobne se`,
  },
  {
    id: "ru.med.infant-fever",
    category: "medical_emergency",
    source: r`(?:naumolood|nomolood|nau ?zaida|newborn|(?:\d|ek|do|teen) (?:mahine|mahina|maah|month|months) (?:ka|ki|ke)|(?:\d{1,2}|ek|do|teen|char|paanch|panch|chhe|saat|aath|nau|das|gyarah|barah) (?:hafte|haftay|din|week|weeks) (?:ka|ki|ke))${G6}bukh?aa?r|bukh?aa?r${G6}(?:naumolood|nomolood|newborn)`,
  },

  // =====================================================================
  // self_harm (child or parent; includes a parent's thoughts of harming their child)
  // =====================================================================
  {
    id: "en.self.kill-self",
    category: "self_harm",
    source: r`(?:kill|killing|killed|kills|unalive|unaliving|unalived) (?:him|her|my|them|your|our)sel(?:f|ves)|(?:end|ending|take|taking) (?:my|his|her|their) (?:own )?life|hang (?:my|him|her|them)sel(?:f|ves)`,
  },
  {
    id: "en.self.suicide",
    category: "self_harm",
    source: r`suicid(?!e sprints?|e drills?|e squad|e runs?)`,
  },
  {
    id: "en.self.hurt-self",
    category: "self_harm",
    source: r`(?:want|wants|wanted|wanting|going|try|trying|tried|threaten\S*|talk\S* about|thinking (?:of|about)|says? (?:he|she|they|i) (?:will|wants? to|is going to)|will) (?:to )?(?:hurt|harm|cut) (?:him|her|my|them)sel(?:f|ves)|self ?harm|cutting (?:him|her|them|my)sel(?:f|ves)|cuts (?:him|her)self|cut (?:him|her)self on purpose|cuts on (?:his|her|their|my) (?:arms?|wrists?|legs?|thighs?)`,
  },
  {
    id: "en.self.want-die",
    category: "self_harm",
    source: r`(?:want|wants|wanted|wanting) to die(?! of| laughing)|wish(?:es|ed)? (?:i|he|she|they) (?:was|were|had) (?:dead|died|never (?:been )?born)|better off dead|(?:dont|doesnt|do not|does not|didnt) want to (?:live|be alive|exist|be here anymore)|no reason to live|nothing to live for|end it all`,
  },
  {
    id: "en.self.sleep-forever",
    category: "self_harm",
    source: r`(?:want|wants|wanted|wish|wishes|wished|says? (?:he|she|they|i) (?:wants?|will|is going)|going) (?:to )?(?:go to )?sleep${G}(?:forever|and (?:not|never) wake up)|(?:wants?|wish(?:es)?)${G}(?:not|never) (?:to )?wake up`,
  },
  {
    id: "en.self.burden",
    category: "self_harm",
    source: r`better off without (?:me|him|her)|(?:i am|im|i feel|feels? like|feel like)${G}(?:a )?burden`,
  },
  {
    id: "en.self.signs",
    category: "self_harm",
    source: r`goodbye (?:note|letter)|suicide note|how to (?:die|kill (?:my|him|her)self)|ways to die|search(?:ed|ing)? (?:for )?(?:how|ways) to die|jump(?:ed|ing)? (?:off|from) (?:the |a )?(?:roof|bridge|building|balcony)`,
  },
  {
    id: "en.self.harm-child",
    category: "self_harm",
    source: r`(?:thoughts? (?:of|about)|thinking (?:of|about)|want to|feel like|scared (?:i|that i) (?:will|might|ll|could)|afraid (?:i|that i) (?:will|might|ll|could)|urge to|might)${G}(?:hurt(?:ing)?|harm(?:ing)?|kill(?:ing)?|smother(?:ing)?|shak(?:e|ing)|drown(?:ing)?) (?:my |the |our )?(?:baby|child|son|daughter|kids?|children|toddler|newborn|infant|him|her)${E}|kill (?:the|my|our) (?:kids|children|baby) and (?:my|him|her)self`,
  },
  // Urdu
  {
    id: "ur.self.want-die",
    category: "self_harm",
    source: r`مرنا چاہت|مر جانا چاہت|مرنے کو (?:دل|جی) (?:کرتا|چاہتا)|(?<!(?:شرم|ہنس ہنس کر|خوشی) سے )مر جاؤں|دنیا سے (?:ہی )?(?:چلا|چلی) جاؤں`,
  },
  {
    id: "ur.self.suicide",
    category: "self_harm",
    source: r`خود ?کشی|اپنی جان (?:لے|لینے|لینا)|اپنے آپ کو (?:ختم|مار)|خود کو (?:ختم|مار) (?:کر|ڈال|لوں|دوں)|زندگی ختم کر`,
  },
  { id: "ur.self.sleep-forever", category: "self_harm", source: r`ہمیشہ کے (?:لیے|لئے) سو` },
  { id: "ur.self.burden", category: "self_harm", source: r`(?:میرے|اس کے|اسکے) بغیر سب${G}بہتر` },
  {
    id: "ur.self.no-life",
    category: "self_harm",
    source: r`جینے کا (?:دل|من) نہیں|زندہ نہیں رہنا|جینا نہیں چاہت`,
  },
  {
    id: "ur.self.cutting",
    category: "self_harm",
    source: r`(?:نس|نسیں|کلائی) کاٹ|(?:بازو|بازوؤں|کلائی|ٹانگ|ران)${G}(?:کٹ|کاٹ|بلیڈ)`,
  },
  {
    id: "ur.self.method",
    category: "self_harm",
    source: r`پنکھے سے${G}لٹک|پھندا|چھت سے${G}(?:کود|چھلانگ)`,
  },
  {
    id: "ur.self.harm-child",
    category: "self_harm",
    source: r`(?:بچے|بچی|بچوں) کو${G}نقصان (?:پہنچا (?:دوں|بیٹھوں)|پہنچانے (?:کا|کے) (?:خیال|خیالات|دل))|(?:بچوں|بچے) کو${G}مار (?:کر|کے) خود`,
  },
  { id: "ur.self.end-all", category: "self_harm", source: r`سب (?:کچھ )?ختم کر (?:دوں|دیں|ڈالوں)` },
  // Roman Urdu
  {
    id: "ru.self.want-die",
    category: "self_harm",
    source: r`marn(?:a|e|ay) cha+h?t(?:a|i|e|ay)|(?<!(?:sharam|sharm|hans hans ke|khushi) se )mar ja(?:un|oon|aun|aon|na cha)|duniya se (?:hi )?(?:chala|chali) ja(?:un|oon|aun|aon)|marne ko (?:dil|jee|ji) (?:karta|krta|chahta)`,
  },
  {
    id: "ru.self.suicide",
    category: "self_harm",
    source: r`kh?ud ?kh?[auiy]sh?i(?! kh?ushi)|apni jaa?n (?:le|lay|lena|leni|loon|lun|lon|lo)${E}|(?:apni )?zindagi kh?ata?m (?:kar|karna|krna)|khud ko (?:khatam|khatm|maar|mar) (?:kar|dal|daal)`,
  },
  {
    id: "ru.self.sleep-forever",
    category: "self_harm",
    source: r`(?:hamesha|humesha|hamesh) ke? (?:liye|liay|lie|lye) (?:so|sona|so jana|so jaun|so jaon)${E}`,
  },
  {
    id: "ru.self.burden",
    category: "self_harm",
    source: r`(?:mere|meray|mery|mairay|us ke|uske) (?:baghair|bagair|baghayr|bina|beghair) (?:sab|sub)${G}(?:behtar|bahtar|better)`,
  },
  {
    id: "ru.self.no-life",
    category: "self_harm",
    source: r`(?:jeene|jeenay|jine|jeeny|jeena|jina) (?:ka|ko) (?:dil|mann?) ${RU_NOT} (?:karta|krta|karti|krti)|zinda ${RU_NOT} (?:rehna|rahna)|jee?na ${RU_NOT} (?:chahta|chahti|chata|chati)`,
  },
  {
    id: "ru.self.cutting",
    category: "self_harm",
    source: r`(?:nas|nasen|naslen|kalai) (?:kaat|kat|kati|kaati)|(?:bazu|baazu|bazoo|kalai)\S*${G}(?:par|pe|pr) (?:cut|cuts|kat|zakhm|blade)`,
  },
  {
    id: "ru.self.method",
    category: "self_harm",
    source: r`(?:pankh(?:e|ay|y)|pankha) se${G}lat(?:ak|ka|ki|kna|ak)|phand(?:a|aa)${E}|chh?at se${G}(?:kood|kud|chhalang|chalang)`,
  },
  {
    id: "ru.self.harm-child",
    category: "self_harm",
    source: r`bach(?:e|ay|y|on|o|i|ey) ko${G}(?:nuq?sa+n|nuksan|nuqsaan) (?:pohncha|pohcha|pahuncha|puhncha) (?:dun|doon|dungi|dunga|du|baithun)|bach(?:on|o) ko (?:maar|mar) (?:ke|kar|kay|k) khud`,
  },
  {
    id: "ru.self.end-all",
    category: "self_harm",
    source: r`sab (?:kuch )?kh?ata?m kar (?:dun|doon|du|dein|den|daloon|dalun)${E}`,
  },

  // =====================================================================
  // child_abuse
  // =====================================================================
  {
    id: "en.abuse.adult-touch",
    category: "child_abuse",
    source: r`${EN_ADULT}${G}(?:touch(?:es|ed|ing)? (?:him|her|them|me|my|his|our)${E}|fondl\S*|grop\S*|molest\S*|feels (?:him|her) up)${E}`,
  },
  {
    id: "en.abuse.touch-private",
    category: "child_abuse",
    source: r`touched ${EN_CHILD}${G}(?:down there|private|privates|inappropriately|in a bad way|in a wrong way|in the wrong place|where (?:he|she) shouldnt)|inappropriate(?:ly)? touch|touch\S* inappropriately|bad touch`,
  },
  {
    id: "en.abuse.sexual",
    category: "child_abuse",
    source: r`molest|sexual(?:ly)? (?:abus|assault|touch)|(?:child|sexual|physical|emotional) abuse|incest|rap(?:e|ed|ing)${E}|groom(?:ed|ing) (?:him|her|my (?:son|daughter|child))(?! hair| nails)|abus(?:ed|ing|es) ${EN_CHILD}${E}|(?:being|was|been|is|got) abused`,
  },
  {
    id: "en.abuse.secret",
    category: "child_abuse",
    source: r`(?:told|tells|asked|asks|made|makes) ${EN_CHILD} (?:to )?(?:keep (?:it )?(?:a |our |their )?secret|not (?:to )?tell (?:mummy|mommy|mum|mom|mama|anyone|anybody|his mum|her mum|parents|you))|our little secret|dont tell (?:mummy|mommy|mum|mom|mama|your (?:mum|mom|parents))`,
  },
  {
    id: "en.abuse.images",
    category: "child_abuse",
    source: r`(?:showed|shows|showing|sent|sends|sending) ${EN_CHILD}${G}(?:porn\S*|naked|nude|dirty (?:videos?|pictures?|photos?)|sexual)|(?:asked|asks|asking)${G}(?:for |to send )(?:naked|nude|sexy|private) (?:pictures?|photos?|pics?|selfies?|videos?)`,
  },
  {
    id: "en.abuse.beating",
    category: "child_abuse",
    source: r`(?:beat(?:s|en)?|hit(?:s)?|whip(?:ped|s)?|lash(?:ed|es)?|hits) ${EN_CHILD}${G}with (?:a |the |his |her )?(?:belt|stick|wire|cable|cane|shoe|slipper|chappal|hanger|rod|pipe)|left (?:marks|bruises|welts) on (?:him|her|them|his|their|my)${E}|unexplained (?:bruises|injuries|marks|burns)|bruises (?:that )?(?:he|she|they) (?:cant|wont|will not|cannot) explain`,
  },
  {
    id: "en.abuse.burn-shake",
    category: "child_abuse",
    source: r`burn(?:ed|t|s)? ${EN_CHILD} (?:with|using) (?:a |an |the )?(?:iron|cigarette|lighter|spoon|hot)|shak(?:e|es|ing|en|ed) the baby|shook (?:the|my|our) baby|shaken baby`,
  },
  {
    id: "en.abuse.neglect",
    category: "child_abuse",
    source: r`(?:left|leaves|leave) ${EN_CHILD}${G}alone for (?:days|\d+ days|two days|three days|the whole day)|(?:no|without) food for (?:days|\d+ days)|lock(?:s|ed|ing)? ${EN_CHILD}${G}(?:in|inside) (?:a |the |his |her )?(?:room|bathroom|cupboard|closet|toilet|store ?room)${G}(?:for days|for hours|the whole day|without food|no food)`,
  },
  {
    id: "en.abuse.parent-hit",
    category: "child_abuse",
    source: r`(?:i|we)${G}(?:hit|beat|slapped|smacked|spanked) ${EN_CHILD} (?:too hard|so hard|really hard|until)|(?:cant|cannot) stop (?:hitting|beating) ${EN_CHILD}${E}`,
  },
  // Urdu
  {
    id: "ur.abuse.wrong-place",
    category: "child_abuse",
    source: r`غلط (?:جگہ|طریقے سے)${G}(?:ہاتھ لگا|چھو)|(?:شرم ?گاہ|پرائیویٹ (?:پارٹ|پارٹس|حصے|جگہ))${G}(?:کو )?(?:ہاتھ لگا|چھوا|چھوتا|چھوتے)`,
  },
  {
    id: "ur.abuse.adult-act",
    category: "child_abuse",
    source: r`${UR_ADULT}${G6}(?:گندی (?:حرکت|حرکتیں)|غلط (?:جگہ|طریقے)|ہاتھ لگاتا|چھوتا|چھیڑتا|چھیڑ|جنسی)`,
  },
  {
    id: "ur.abuse.sexual",
    category: "child_abuse",
    source: r`جنسی (?:زیادتی|ہراسانی|ہراسگی|تشدد|استحصال)|(?:ریپ|عصمت دری)`,
  },
  {
    id: "ur.abuse.secret",
    category: "child_abuse",
    source: r`(?:کسی کو|امی کو|ماما کو|ممی کو|ابو کو|ماں کو) (?:مت|نہ) بتانا|(?:ہمارا|ہمارے) (?:راز|سیکرٹ)`,
  },
  {
    id: "ur.abuse.images",
    category: "child_abuse",
    source: r`گندی (?:ویڈیو|ویڈیوز|فلم|فلمیں|تصویر|تصویریں)${G}دکھا|ننگی (?:تصویر|تصویریں|ویڈیو)`,
  },
  {
    id: "ur.abuse.beating",
    category: "child_abuse",
    source: r`(?:بیلٹ|ڈنڈے|ڈنڈا|تار|چھڑی|جوتے|چپل|پائپ|ہینگر) سے${G}(?:مارا|مارتا|مارتے|مارتی|پیٹا|پیٹتا|پیٹتے)|(?:مار|پیٹ)\S*${G}(?:نشان|نیل) پڑ`,
  },
  {
    id: "ur.abuse.burn-shake",
    category: "child_abuse",
    source: r`(?:استری|سگریٹ|چمچ|لائٹر) سے${G}جلا|(?:بچے|بچی|بچہ) کو (?:زور سے )?جھنجھوڑ`,
  },
  {
    id: "ur.abuse.neglect",
    category: "child_abuse",
    source: r`کمرے میں بند (?:کر (?:دیا|دیتے|دیتا|دیتی)|رکھ)|(?:کو|اسے|انہیں|ہمیں) کھانا (?:نہیں|نہ) (?:دیتے|دیتا|دیتی)`,
  },
  {
    id: "ur.abuse.parent-hit",
    category: "child_abuse",
    source: r`(?:بچے|بچی|بیٹے|بیٹی) کو (?:بہت زیادہ|بہت|زور سے|بری طرح) (?:مار دیا|مارا|پیٹا)`,
  },
  // Roman Urdu
  {
    id: "ru.abuse.wrong-place",
    category: "child_abuse",
    source: r`gh?ala?t (?:jagah|jaga|jgah|jagha|tareeqe|tarike|tareeke)(?: se)?${G}(?:chuwa|chua|chhua|chhuwa|choo|chu|chhoo|haath laga|hath laga|touch)`,
  },
  {
    id: "ru.abuse.adult-act",
    category: "child_abuse",
    source: r`${RU_ADULT}${G6}(?:gandi harkat\S*|gh?ala?t (?:jagah|jaga)|chhed(?:ta|te|a)|chher(?:ta|te|a)|touch kar(?:ta|te|a)|(?:haath|hath) laga(?:ta|te|ya)|chhu(?:ta|te|a)${E}|jinsi)`,
  },
  {
    id: "ru.abuse.sexual",
    category: "child_abuse",
    source: r`jinsi (?:zyadti|ziyadti|zyadati|ziyadati|ziadti|harasani|harasgi|tashaddud)`,
  },
  {
    id: "ru.abuse.secret",
    category: "child_abuse",
    source: r`(?:kisi ko|ammi ko|ami ko|mama ko|mummy ko|mumma ko|abbu ko|abu ko|maa ko) (?:mat|na|nah|mt) bata(?:na|o|ana)${E}|(?:hamara|humara|hmara) (?:raaz|raz|secret)`,
  },
  {
    id: "ru.abuse.images",
    category: "child_abuse",
    source: r`gandi (?:video|videos|film|movie|pictures?|tasveer\S*|tasweer\S*)${G}dikha|nangi (?:tasveer|tasweer|tasvir|picture|photo|video)`,
  },
  {
    id: "ru.abuse.beating",
    category: "child_abuse",
    source: r`(?:belt|danday|dande|danda|dandey|taar|tar|chhari|chari|joote|jootay|chappal|pipe|hanger) se${G}(?:maara|mara|marta|maarta|marte|maarte|peeta|pita|peet)|(?:maar|mar|peet)\S*${G}(?:nishan|nishaan|neel) (?:par|pad|parh)`,
  },
  {
    id: "ru.abuse.burn-shake",
    category: "child_abuse",
    source: r`(?:istri|isteri|cigarette|sigret|cigrette|lighter) se${G}jala(?:ya|ta|ti|te|i|ia)${E}|(?:bache|bachay|bachi|baby|bacha|bachey) ko (?:zor se )?jh?anjh?or`,
  },
  {
    id: "ru.abuse.neglect",
    category: "child_abuse",
    source: r`kamr(?:e|ay|y|a) (?:mein|me|main|mai) band (?:kar (?:diya|dia|dete|deta|deti)|rakh)|(?:ko|usay|use|usey|unhein|inhein|unhe) khana ${RU_NOT} (?:dete|deta|deti)${E}`,
  },

  // =====================================================================
  // domestic_violence
  // =====================================================================
  {
    id: "en.dv.partner-hits",
    category: "domestic_violence",
    source: r`${EN_PARTNER}${G}(?:hits|hit|beats|beat|slaps|slapped|punches|punched|kicks|kicked|pushes|pushed|shoves|shoved|chokes|choked|strangles|strangled|throws things at|hurts|hurt|attacks|attacked) (?:me|us|her|him|the kids|the children|my (?:son|daughter|kids|children))(?! at | in a | in the game)`,
  },
  {
    id: "en.dv.front-of-kids",
    category: "domestic_violence",
    source: r`(?:hit|hits|beat|beats|slap|slaps|slapped|punch|punched|kick|kicked|choke|choked) (?:me|her|him) in front of (?:the|my|our) (?:kids|children)`,
  },
  {
    id: "en.dv.choke",
    category: "domestic_violence",
    source: r`(?:he|she|${EN_PARTNER})${G}(?:chok(?:ed|es|ing)|strangl(?:ed|es|ing)) me|hands? (?:around|round|on) my (?:neck|throat)|(?:held|holds|pinned|pins) me down`,
  },
  {
    id: "en.dv.threats",
    category: "domestic_violence",
    source: r`threaten(?:ed|s|ing)? to (?:kill|hurt|harm|take) (?:me|us|the kids|the children|my|our)|threw acid|throw acid|acid attack`,
  },
  {
    id: "en.dv.control",
    category: "domestic_violence",
    source: r`${EN_PARTNER}${G}(?:(?:wont|doesnt|does not|will not) let me (?:leave|go out|go anywhere|see my (?:family|parents|friends)|work|have (?:my )?(?:own )?(?:phone|money))|(?:took|takes|taken|snatched|smashed|broke) my phone|locks me (?:in|inside|out)|locked me (?:in|inside|out))`,
  },
  {
    id: "en.dv.fear",
    category: "domestic_violence",
    source: r`(?:i am|im|i feel|i get) (?:so |really |very )?(?:scared|afraid|terrified|frightened) (?:of|to go home to) (?:my )?(?:husband|partner|wife|him|in laws)${E}|(?:scared|afraid|terrified) to go (?:back )?home`,
  },
  {
    id: "en.dv.named",
    category: "domestic_violence",
    source: r`domestic (?:violence|abuse)|marital rape|forces? me to have sex|forced me (?:to have sex|into sex)|${EN_PARTNER}${G}(?:abuses|abused|is abusive|is violent|gets violent)`,
  },
  // Urdu
  {
    id: "ur.dv.partner-hits",
    category: "domestic_violence",
    source: r`${UR_PARTNER}${G}(?:مجھے |ہمیں |بچوں کو )?(?:مارتا|مارتی|مارتے|مارا|پیٹتا|پیٹتے|پیٹا|تھپڑ|طمانچہ|لاتیں|گھونسے)`,
  },
  {
    id: "ur.dv.choke",
    category: "domestic_violence",
    source: r`گلا (?:دبایا|دباتا|دبانے|گھونٹا|گھونٹنے)`,
  },
  {
    id: "ur.dv.threats",
    category: "domestic_violence",
    source: r`جان سے مارنے کی (?:دھمکی|دھمکیاں)|(?:قتل کرنے|مار ڈالنے) کی دھمکی|تیزاب (?:پھینکنے|ڈالنے) کی دھمکی|تیزاب پھینک`,
  },
  {
    id: "ur.dv.control",
    category: "domestic_violence",
    source: r`${UR_PARTNER}${G}(?:گھر سے (?:باہر )?(?:نکلنے|جانے) نہیں دیتا|(?:فون|موبائل) (?:چھین|توڑ))`,
  },
  {
    id: "ur.dv.fear",
    category: "domestic_violence",
    source: r`(?:شوہر|خاوند|میاں|سسرال)${G}(?:سے )?(?:ڈر|خوف) لگتا`,
  },
  {
    id: "ur.dv.front-of-kids",
    category: "domestic_violence",
    source: r`بچوں کے سامنے (?:مجھے )?(?:مارتا|پیٹتا)|${UR_PARTNER}${G6}(?:slap|hit|beat|punch|kick|push)\S* (?:کیا|کرتا|کرتے|کرتی)`,
  },
  { id: "ur.dv.forced", category: "domestic_violence", source: r`زبردستی کرتا` },
  // Roman Urdu
  {
    id: "ru.dv.partner-hits",
    category: "domestic_violence",
    source: r`${RU_PARTNER}${G}(?:mujhe |humein |hamein |mujhay |mujhy |bachon ko )?(?:maarta|marta|maarte|marte|maarti|marti|mara|maara|peet\S*|pitta|thappar|thapar|thappad|tamacha|tamaacha|laat|latain|ghoonse|ghunse)${E}`,
  },
  {
    id: "ru.dv.choke",
    category: "domestic_violence",
    source: r`gal(?:a|aa) (?:dabaya|dabaaya|dabata|dabane|dabana|ghonta|ghotna|ghonte)`,
  },
  {
    id: "ru.dv.threats",
    category: "domestic_violence",
    source: r`jaa?n se (?:maar|mar)(?:ne|nay|dene) ki (?:dhamki|dhamkee|dhamkiyan|dhamkian)|(?:qatal|qatl|katal) (?:karne|kar dene) ki dhamki|(?:tezab|tezaab|tizab|acid) (?:\S+ )?(?:phenk|phaink|phek|daal|dal)\S*`,
  },
  {
    id: "ru.dv.control",
    category: "domestic_violence",
    source: r`${RU_PARTNER}${G}(?:(?:bahar|ghar se bahar|ghar se) ${RU_NOT} (?:jane|jaane|nikalne) (?:deta|dete|deti)|(?:phone|mobile|fone) (?:cheen|chheen|chin|tor|tod) (?:liya|lia|diya|dia))`,
  },
  {
    id: "ru.dv.fear",
    category: "domestic_violence",
    source: r`(?:shohar|shauhar|shoher|khawand|husband|miyan|susral|sasural)${G}(?:se )?(?:dar|darr|khauf|khof) (?:lagta|lgta)`,
  },
  {
    id: "ru.dv.front-of-kids",
    category: "domestic_violence",
    source: r`bachon k(?:e|ay|y)? (?:samne|saamne|samnay) (?:mujhe )?(?:maarta|marta|peet|(?:slap|hit|beat|punch|kick)\S* (?:kiya|kia|karta|karte|krta))|${RU_PARTNER}${G6}(?:slap|hit|beat|punch|kick|push)\S* (?:kiya|kia|karta|karte|krta|kartay)${E}`,
  },
  {
    id: "ru.dv.forced",
    category: "domestic_violence",
    source: r`zabardasti (?:karta|krta|kartay|karte)${E}`,
  },
];
