/* eslint-disable */
// Generator for Speaking Part 1 subskills — creates tests 6..20 for all 5 skills.
// Content is assembled from curated linguistic banks (correct IPA / deterministic
// intonation-stress-linking rules) into the exact JSON schema used by tests 1..5.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "lib", "subskills", "speaking");
const FIRST_NEW = 6;
const LAST_NEW = 20;

// ── seeded RNG ────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// rotate a bank: give `n` items for testNum, stepping the window so consecutive
// tests use different slices (cycles when the bank is smaller than 15*n).
function pick(bank, n, testNum) {
  const out = [];
  const off = ((testNum - 1) * n) % bank.length;
  for (let i = 0; i < n; i++) out.push(bank[(off + i) % bank.length]);
  return out;
}
const LETTERS = ["A", "B", "C", "D"];
function mcq(id, instruction, tts, correctText, distractors, explanation, rng) {
  const opts = shuffle([{ t: correctText, c: true }, ...distractors.map((t) => ({ t, c: false }))], rng);
  const options = opts.map((o, i) => ({ id: LETTERS[i], text: o.t }));
  const correct = LETTERS[opts.findIndex((o) => o.c)];
  return { id, type: "multiple_choice", instruction, tts_text: tts, options, correct_answers: [correct], explanation };
}
function essay(id, instruction, content, tts, answers, explanation) {
  return { id, type: "essay_typing", instruction, content, tts_text: tts, options: [], correct_answers: answers, explanation };
}

// ══════════════════════════════════════════════════════════════
// SKILL 1 — phat-am (Pronunciation)
// ══════════════════════════════════════════════════════════════
// full-word IPA choice
const minimalWords = [
  ["ship", "/ʃɪp/", ["/ʃiːp/", "/sɪp/", "/siːp/"], "'ship' (con tàu) là âm i ngắn /ɪ/. Phân biệt 'sheep' /ʃiːp/."],
  ["sheep", "/ʃiːp/", ["/ʃɪp/", "/tʃiːp/", "/siːp/"], "'sheep' (con cừu) là âm i dài /iː/."],
  ["pan", "/pæn/", ["/pen/", "/pæŋ/", "/bæn/"], "'pan' (cái chảo) có âm /æ/. Phân biệt 'pen' /pen/."],
  ["pen", "/pen/", ["/pæn/", "/pɪn/", "/ben/"], "'pen' có âm /e/. Phân biệt 'pan' /pæn/."],
  ["think", "/θɪŋk/", ["/tɪŋk/", "/sɪŋk/", "/fɪŋk/"], "'th' trong 'think' là âm vô thanh /θ/."],
  ["this", "/ðɪs/", ["/dɪs/", "/zɪs/", "/θɪs/"], "'th' trong 'this' là âm hữu thanh /ð/."],
  ["very", "/ˈveri/", ["/ˈberi/", "/ˈweri/", "/ˈferi/"], "'very' có âm /v/ (răng chạm môi)."],
  ["live", "/lɪv/", ["/laɪv/", "/liːv/", "/lɪf/"], "Động từ 'live' (sống) là /lɪv/."],
  ["leave", "/liːv/", ["/lɪv/", "/liːf/", "/leɪv/"], "'leave' là âm i dài /iː/ + /v/."],
  ["full", "/fʊl/", ["/fuːl/", "/faʊl/", "/fɔːl/"], "'full' có âm u ngắn /ʊ/. Phân biệt 'fool' /fuːl/."],
  ["fool", "/fuːl/", ["/fʊl/", "/foʊl/", "/fɔːl/"], "'fool' có âm u dài /uː/."],
  ["bad", "/bæd/", ["/bed/", "/bæt/", "/bɜːd/"], "'bad' có âm /æ/. Phân biệt 'bed' /bed/."],
  ["bed", "/bed/", ["/bæd/", "/bɪd/", "/bɜːd/"], "'bed' có âm /e/."],
  ["cat", "/kæt/", ["/kʌt/", "/ket/", "/keɪt/"], "'cat' có âm /æ/. Phân biệt 'cut' /kʌt/."],
  ["cut", "/kʌt/", ["/kæt/", "/kɒt/", "/kʊt/"], "'cut' có âm /ʌ/."],
  ["work", "/wɜːrk/", ["/wɔːk/", "/wɑːk/", "/wʊrk/"], "'work' có âm /ɜːr/. Phân biệt 'walk' /wɔːk/."],
  ["walk", "/wɔːk/", ["/wɜːrk/", "/wɑːk/", "/wʊk/"], "'walk' có âm /ɔː/, chữ 'l' câm."],
  ["beach", "/biːtʃ/", ["/bɪtʃ/", "/biːʃ/", "/bætʃ/"], "'beach' có âm i dài /iː/ + /tʃ/."],
  ["seat", "/siːt/", ["/sɪt/", "/set/", "/siːd/"], "'seat' có âm i dài /iː/. Phân biệt 'sit' /sɪt/."],
  ["sit", "/sɪt/", ["/siːt/", "/set/", "/sɪːt/"], "'sit' có âm i ngắn /ɪ/."],
  ["food", "/fuːd/", ["/fʊd/", "/fuːt/", "/foʊd/"], "'food' có âm u dài /uː/ + /d/."],
  ["good", "/ɡʊd/", ["/ɡuːd/", "/ɡɒd/", "/ɡʌd/"], "'good' có âm u ngắn /ʊ/."],
  ["coat", "/koʊt/", ["/kɔːt/", "/kʌt/", "/kɒt/"], "'coat' có âm đôi /oʊ/. Phân biệt 'caught' /kɔːt/."],
  ["rice", "/raɪs/", ["/laɪs/", "/raɪz/", "/reɪs/"], "'rice' có âm /r/ + /aɪs/. Phân biệt 'lice' /laɪs/."],
  ["right", "/raɪt/", ["/laɪt/", "/riːt/", "/reɪt/"], "'right' có âm /r/. Phân biệt 'light' /laɪt/."],
  ["light", "/laɪt/", ["/raɪt/", "/liːt/", "/leɪt/"], "'light' có âm /l/."],
  ["saw", "/sɔː/", ["/soʊ/", "/saʊ/", "/sɑː/"], "'saw' có âm /ɔː/. Phân biệt 'so' /soʊ/."],
  ["thin", "/θɪn/", ["/tɪn/", "/sɪn/", "/fɪn/"], "'thin' có âm /θ/. Phân biệt 'tin' /tɪn/."],
  ["three", "/θriː/", ["/triː/", "/friː/", "/sriː/"], "'three' có âm /θr/. Phân biệt 'tree' /triː/."],
  ["tree", "/triː/", ["/θriː/", "/driː/", "/triːə/"], "'tree' có âm /tr/."],
  ["hat", "/hæt/", ["/het/", "/hɑːt/", "/hʌt/"], "'hat' có âm /æ/. Phân biệt 'hot' /hɒt/."],
  ["glass", "/ɡlæs/", ["/ɡlaːs/", "/ɡles/", "/ɡlæz/"], "'glass' (AmE) có âm /æ/ + /s/."],
  ["watch", "/wɒtʃ/", ["/wɔːtʃ/", "/wætʃ/", "/wɒʃ/"], "'watch' có âm /ɒ/ + /tʃ/."],
  ["clock", "/klɒk/", ["/klɔːk/", "/klʌk/", "/klɒg/"], "'clock' có âm /ɒ/ + /k/."],
  ["boat", "/boʊt/", ["/bɔːt/", "/bʌt/", "/bɒt/"], "'boat' có âm đôi /oʊ/ + /t/."],
];
// which 'th' sound
const thWords = [
  ["think", "θ"], ["thank", "θ"], ["three", "θ"], ["thin", "θ"], ["mouth", "θ"], ["bath", "θ"],
  ["teeth", "θ"], ["path", "θ"], ["thick", "θ"], ["thought", "θ"], ["thousand", "θ"], ["theater", "θ"],
  ["healthy", "θ"], ["nothing", "θ"], ["birthday", "θ"], ["method", "θ"], ["author", "θ"], ["thirsty", "θ"],
  ["this", "ð"], ["that", "ð"], ["they", "ð"], ["then", "ð"], ["mother", "ð"], ["father", "ð"],
  ["brother", "ð"], ["weather", "ð"], ["together", "ð"], ["another", "ð"], ["breathe", "ð"], ["although", "ð"],
  ["rather", "ð"], ["whether", "ð"], ["smooth", "ð"], ["southern", "ð"], ["either", "ð"], ["clothing", "ð"],
];
// ending sound: word -> IPA symbol (without slashes)
const endingBank = [
  ["book", "k"], ["black", "k"], ["work", "k"], ["milk", "k"], ["desk", "k"], ["week", "k"], ["like", "k"], ["lake", "k"], ["think", "k"], ["pink", "k"], ["cook", "k"], ["talk", "k"],
  ["cat", "t"], ["hat", "t"], ["night", "t"], ["right", "t"], ["wait", "t"], ["gate", "t"], ["meet", "t"], ["boat", "t"], ["report", "t"], ["start", "t"], ["light", "t"], ["seat", "t"],
  ["stop", "p"], ["top", "p"], ["map", "p"], ["cup", "p"], ["help", "p"], ["keep", "p"], ["shop", "p"], ["jump", "p"], ["sleep", "p"], ["deep", "p"], ["cheap", "p"], ["group", "p"],
  ["bus", "s"], ["class", "s"], ["kiss", "s"], ["nice", "s"], ["ice", "s"], ["price", "s"], ["place", "s"], ["face", "s"], ["race", "s"], ["box", "s"], ["fix", "s"], ["dance", "s"],
  ["buzz", "z"], ["nose", "z"], ["rose", "z"], ["close", "z"], ["lose", "z"], ["these", "z"], ["cheese", "z"], ["size", "z"], ["prize", "z"], ["choose", "z"], ["news", "z"], ["please", "z"],
  ["wish", "sh"], ["fish", "sh"], ["wash", "sh"], ["push", "sh"], ["cash", "sh"], ["fresh", "sh"], ["finish", "sh"], ["dish", "sh"], ["brush", "sh"], ["English", "sh"], ["crash", "sh"], ["flash", "sh"],
  ["watch", "ch"], ["catch", "ch"], ["match", "ch"], ["teach", "ch"], ["beach", "ch"], ["rich", "ch"], ["much", "ch"], ["lunch", "ch"], ["church", "ch"], ["which", "ch"], ["each", "ch"], ["reach", "ch"],
  ["bridge", "j"], ["page", "j"], ["age", "j"], ["large", "j"], ["change", "j"], ["village", "j"], ["message", "j"], ["orange", "j"], ["edge", "j"], ["judge", "j"], ["stage", "j"], ["manage", "j"],
  ["leaf", "f"], ["half", "f"], ["safe", "f"], ["knife", "f"], ["life", "f"], ["cough", "f"], ["enough", "f"], ["roof", "f"], ["chief", "f"], ["laugh", "f"], ["proof", "f"], ["staff", "f"],
  ["love", "v"], ["live", "v"], ["give", "v"], ["move", "v"], ["have", "v"], ["save", "v"], ["five", "v"], ["drive", "v"], ["leave", "v"], ["believe", "v"], ["arrive", "v"], ["improve", "v"],
  ["come", "m"], ["time", "m"], ["name", "m"], ["game", "m"], ["home", "m"], ["room", "m"], ["team", "m"], ["dream", "m"], ["swim", "m"], ["farm", "m"], ["system", "m"], ["problem", "m"],
  ["sun", "n"], ["run", "n"], ["ten", "n"], ["pen", "n"], ["rain", "n"], ["train", "n"], ["phone", "n"], ["line", "n"], ["machine", "n"], ["green", "n"], ["clean", "n"], ["question", "n"],
  ["sing", "ng"], ["king", "ng"], ["ring", "ng"], ["long", "ng"], ["song", "ng"], ["wrong", "ng"], ["strong", "ng"], ["morning", "ng"], ["evening", "ng"], ["meeting", "ng"], ["building", "ng"], ["young", "ng"],
  ["ball", "l"], ["call", "l"], ["tell", "l"], ["sell", "l"], ["feel", "l"], ["well", "l"], ["school", "l"], ["table", "l"], ["people", "l"], ["little", "l"], ["apple", "l"], ["small", "l"],
  ["month", "th"], ["path", "th"], ["math", "th"], ["tenth", "th"], ["mouth", "th"], ["teeth", "th"], ["health", "th"], ["both", "th"], ["south", "th"], ["north", "th"], ["fourth", "th"], ["breath", "th"],
];
const soundLabel = { k: "/k/", t: "/t/", p: "/p/", s: "/s/", z: "/z/", sh: "/ʃ/", ch: "/tʃ/", j: "/dʒ/", f: "/f/", v: "/v/", m: "/m/", n: "/n/", ng: "/ŋ/", l: "/l/", th: "/θ/", g: "/ɡ/", d: "/d/", b: "/b/", r: "/r/" };
const soundAnswers = {
  k: ["k", "K"], t: ["t", "T"], p: ["p", "P"], s: ["s", "S"], z: ["z", "Z"], f: ["f", "F"], v: ["v", "V"],
  m: ["m", "M"], n: ["n", "N"], l: ["l", "L"], sh: ["sh", "SH", "Sh"], ch: ["ch", "CH", "Ch"],
  j: ["j", "ge", "J", "GE"], th: ["th", "TH", "Th"], ng: ["ng", "NG", "Ng"], g: ["g", "G"], d: ["d", "D"],
};
const allSoundLabels = Object.values(soundLabel);
function endingDistractors(correctSym, rng) {
  const correct = soundLabel[correctSym];
  const pool = allSoundLabels.filter((s) => s !== correct);
  return shuffle(pool, rng).slice(0, 3);
}
// noun/verb stress pairs: [word, syl1, syl2]
const nvPairs = [
  ["record", "re", "cord"], ["present", "pre", "sent"], ["import", "im", "port"], ["export", "ex", "port"],
  ["object", "ob", "ject"], ["subject", "sub", "ject"], ["project", "pro", "ject"], ["produce", "pro", "duce"],
  ["permit", "per", "mit"], ["contract", "con", "tract"], ["conduct", "con", "duct"], ["contrast", "con", "trast"],
  ["increase", "in", "crease"], ["decrease", "de", "crease"], ["insult", "in", "sult"], ["progress", "pro", "gress"],
  ["protest", "pro", "test"], ["refund", "re", "fund"], ["reject", "re", "ject"], ["suspect", "sus", "pect"],
  ["discount", "dis", "count"], ["survey", "sur", "vey"], ["transport", "trans", "port"], ["upgrade", "up", "grade"],
  ["rebel", "re", "bel"], ["digest", "di", "gest"], ["export", "ex", "port"], ["convert", "con", "vert"],
];
// -s ending rule
const sEndBank = [
  ["books", "/s/"], ["maps", "/s/"], ["cats", "/s/"], ["cups", "/s/"], ["laughs", "/s/"], ["rocks", "/s/"], ["stops", "/s/"], ["hits", "/s/"], ["shops", "/s/"], ["cliffs", "/s/"],
  ["dogs", "/z/"], ["cars", "/z/"], ["pens", "/z/"], ["boys", "/z/"], ["keys", "/z/"], ["songs", "/z/"], ["girls", "/z/"], ["doors", "/z/"], ["rooms", "/z/"], ["ideas", "/z/"], ["days", "/z/"], ["trees", "/z/"],
  ["boxes", "/ɪz/"], ["watches", "/ɪz/"], ["buses", "/ɪz/"], ["wishes", "/ɪz/"], ["pages", "/ɪz/"], ["dishes", "/ɪz/"], ["prices", "/ɪz/"], ["changes", "/ɪz/"], ["oranges", "/ɪz/"], ["classes", "/ɪz/"], ["bridges", "/ɪz/"],
];
// -ed ending rule
const edEndBank = [
  ["worked", "/t/"], ["helped", "/t/"], ["watched", "/t/"], ["washed", "/t/"], ["laughed", "/t/"], ["stopped", "/t/"], ["kissed", "/t/"], ["looked", "/t/"], ["cooked", "/t/"], ["passed", "/t/"], ["asked", "/t/"], ["missed", "/t/"],
  ["played", "/d/"], ["cleaned", "/d/"], ["called", "/d/"], ["opened", "/d/"], ["listened", "/d/"], ["arrived", "/d/"], ["moved", "/d/"], ["loved", "/d/"], ["closed", "/d/"], ["studied", "/d/"], ["changed", "/d/"], ["enjoyed", "/d/"], ["lived", "/d/"], ["used", "/d/"],
  ["wanted", "/ɪd/"], ["needed", "/ɪd/"], ["started", "/ɪd/"], ["decided", "/ɪd/"], ["visited", "/ɪd/"], ["waited", "/ɪd/"], ["ended", "/ɪd/"], ["added", "/ɪd/"], ["painted", "/ɪd/"], ["invited", "/ɪd/"], ["counted", "/ɪd/"], ["created", "/ɪd/"],
];
// stress position: [word, stressIndex, syllableCount, splitLabel]
const stressBank = [
  ["develop", 2, 3, "de-VEL-op"], ["information", 3, 4, "in-for-MA-tion"], ["economy", 2, 4, "e-CON-o-my"], ["photographer", 2, 4, "pho-TOG-ra-pher"],
  ["important", 2, 3, "im-POR-tant"], ["beautiful", 1, 3, "BEAU-ti-ful"], ["understand", 3, 3, "un-der-STAND"], ["necessary", 1, 4, "NEC-es-sa-ry"],
  ["celebrate", 1, 3, "CEL-e-brate"], ["manager", 1, 3, "MAN-a-ger"], ["employee", 3, 3, "em-ploy-EE"], ["engineer", 3, 3, "en-gi-NEER"],
  ["volunteer", 3, 3, "vol-un-TEER"], ["introduce", 3, 3, "in-tro-DUCE"], ["represent", 3, 3, "rep-re-SENT"], ["guarantee", 3, 3, "gua-ran-TEE"],
  ["recommend", 3, 3, "rec-om-MEND"], ["education", 3, 4, "ed-u-CA-tion"], ["population", 3, 4, "pop-u-LA-tion"], ["operation", 3, 4, "op-er-A-tion"],
  ["organize", 1, 3, "OR-gan-ize"], ["industry", 1, 3, "IN-dus-try"], ["available", 2, 4, "a-VAIL-a-ble"], ["experience", 2, 4, "ex-PE-ri-ence"],
  ["development", 2, 4, "de-VEL-op-ment"], ["environment", 2, 4, "en-VI-ron-ment"], ["communicate", 2, 4, "com-MU-ni-cate"], ["responsible", 2, 4, "re-SPON-si-ble"],
  ["particular", 2, 4, "par-TIC-u-lar"], ["activity", 2, 4, "ac-TIV-i-ty"], ["community", 2, 4, "com-MU-ni-ty"], ["majority", 2, 4, "ma-JOR-i-ty"],
  ["political", 2, 4, "po-LIT-i-cal"], ["economic", 3, 4, "ec-o-NOM-ic"], ["competition", 3, 4, "com-pe-TI-tion"], ["photograph", 1, 3, "PHO-to-graph"],
];
// tricky/silent letters (hard): [word, letter, correctText, distractors[3], ipa]
const trickyBank = [
  ["island", "s", "Âm câm (Silent)", ["/s/", "/z/", "/ʃ/"], "/ˈaɪlənd/ — chữ 's' câm."],
  ["women", "o", "/ɪ/", ["/oʊ/", "/ɒ/", "/uː/"], "/ˈwɪmɪn/ — 'o' đọc là /ɪ/."],
  ["heart", "ea", "/ɑː/", ["/ɪə/", "/iː/", "/eɪ/"], "/hɑːrt/ — 'ea' đọc là /ɑː/."],
  ["choir", "ch", "/kw/", ["/tʃ/", "/k/", "/ʃ/"], "/ˈkwaɪər/ — 'ch' đọc như 'kw'."],
  ["debt", "b", "Âm câm (Silent)", ["/b/", "/p/", "/v/"], "/det/ — chữ 'b' câm."],
  ["receipt", "p", "Âm câm (Silent)", ["/p/", "/f/", "/t/"], "/rɪˈsiːt/ — chữ 'p' câm."],
  ["comb", "b", "Âm câm (Silent)", ["/b/", "/m/", "/p/"], "/koʊm/ — chữ 'b' câm."],
  ["knee", "k", "Âm câm (Silent)", ["/k/", "/n/", "/g/"], "/niː/ — chữ 'k' câm."],
  ["write", "w", "Âm câm (Silent)", ["/w/", "/v/", "/r/"], "/raɪt/ — chữ 'w' câm."],
  ["hour", "h", "Âm câm (Silent)", ["/h/", "/aʊ/", "/w/"], "/ˈaʊər/ — chữ 'h' câm."],
  ["honest", "h", "Âm câm (Silent)", ["/h/", "/ə/", "/w/"], "/ˈɒnɪst/ — chữ 'h' câm."],
  ["castle", "t", "Âm câm (Silent)", ["/t/", "/s/", "/d/"], "/ˈkæsl/ — chữ 't' câm."],
  ["listen", "t", "Âm câm (Silent)", ["/t/", "/s/", "/d/"], "/ˈlɪsn/ — chữ 't' câm."],
  ["Wednesday", "d", "Âm câm (Silent)", ["/d/", "/z/", "/t/"], "/ˈwenzdeɪ/ — chữ 'd' câm."],
  ["foreign", "g", "Âm câm (Silent)", ["/g/", "/dʒ/", "/n/"], "/ˈfɒrɪn/ — chữ 'g' câm."],
  ["sign", "g", "Âm câm (Silent)", ["/g/", "/dʒ/", "/n/"], "/saɪn/ — chữ 'g' câm."],
  ["doubt", "b", "Âm câm (Silent)", ["/b/", "/p/", "/t/"], "/daʊt/ — chữ 'b' câm."],
  ["climb", "b", "Âm câm (Silent)", ["/b/", "/m/", "/p/"], "/klaɪm/ — chữ 'b' câm."],
  ["thumb", "b", "Âm câm (Silent)", ["/b/", "/m/", "/p/"], "/θʌm/ — chữ 'b' câm."],
  ["muscle", "c", "Âm câm (Silent)", ["/k/", "/s/", "/tʃ/"], "/ˈmʌsl/ — chữ 'c' câm."],
  ["knife", "k", "Âm câm (Silent)", ["/k/", "/n/", "/f/"], "/naɪf/ — chữ 'k' câm."],
  ["answer", "w", "Âm câm (Silent)", ["/w/", "/v/", "/r/"], "/ˈænsər/ — chữ 'w' câm."],
  ["half", "l", "Âm câm (Silent)", ["/l/", "/f/", "/v/"], "/hɑːf/ — chữ 'l' câm."],
  ["salmon", "l", "Âm câm (Silent)", ["/l/", "/m/", "/s/"], "/ˈsæmən/ — chữ 'l' câm."],
  ["ghost", "h", "Âm câm (Silent)", ["/h/", "/g/", "/dʒ/"], "/ɡoʊst/ — chữ 'h' câm."],
  ["busy", "u", "/ɪ/", ["/ʌ/", "/uː/", "/juː/"], "/ˈbɪzi/ — 'u' đọc là /ɪ/."],
  ["blood", "oo", "/ʌ/", ["/uː/", "/ʊ/", "/oʊ/"], "/blʌd/ — 'oo' đọc là /ʌ/."],
  ["flood", "oo", "/ʌ/", ["/uː/", "/ʊ/", "/ɒ/"], "/flʌd/ — 'oo' đọc là /ʌ/."],
  ["bread", "ea", "/e/", ["/iː/", "/eɪ/", "/ɪə/"], "/bred/ — 'ea' đọc là /e/."],
  ["break", "ea", "/eɪ/", ["/iː/", "/e/", "/ɪə/"], "/breɪk/ — 'ea' đọc là /eɪ/."],
  ["great", "ea", "/eɪ/", ["/iː/", "/e/", "/ɑː/"], "/ɡreɪt/ — 'ea' đọc là /eɪ/."],
  ["bury", "u", "/e/", ["/ʌ/", "/uː/", "/ɜː/"], "/ˈberi/ — 'u' đọc là /e/."],
];
// tricky endings (hard): [word, correctText, distractors[3], explanation]
const trickyEndBank = [
  ["clothes", "/ðz/", ["/s/", "/ɪz/", "/z/"], "/kloʊðz/ — có /ð/ rung rồi /z/."],
  ["sixth", "/ksθ/", ["/kst/", "/kθ/", "/sθ/"], "/sɪksθ/ — cụm /ksθ/ khó đọc."],
  ["months", "/nθs/", ["/nts/", "/nθ/", "/mθs/"], "/mʌnθs/ — cụm /nθs/."],
  ["asked", "/skt/", ["/skɪd/", "/sk/", "/kst/"], "/æskt/ — '-ed' đọc /t/ sau /k/."],
  ["texts", "/ksts/", ["/kst/", "/ks/", "/tks/"], "/teksts/ — cụm phụ âm /ksts/."],
  ["clothe", "/ð/", ["/θ/", "/z/", "/d/"], "/kloʊð/ — kết thúc /ð/ hữu thanh."],
  ["breathe", "/ð/", ["/θ/", "/z/", "/d/"], "/briːð/ — động từ kết thúc /ð/."],
  ["worlds", "/ldz/", ["/lts/", "/lds/", "/lz/"], "/wɜːrldz/ — cụm /ldz/."],
];

function genPhatAm(testNum, rng) {
  const idp = (l, i) => `s1_t${testNum}_${l}${i}`;
  // EASY
  const easy = [];
  let i = 1;
  for (const [w, ipa, dis, ex] of pick(minimalWords, 5, testNum)) easy.push(mcq(idp("e", i++), "Chọn phiên âm chuẩn xác nhất cho từ sau.", w, ipa, dis, ex, rng));
  for (const [w, s] of pick(thWords, 2, testNum)) {
    const correct = s === "θ" ? "/θ/ (vô thanh)" : "/ð/ (hữu thanh)";
    const dis = ["/t/", "/d/", s === "θ" ? "/ð/ (hữu thanh)" : "/θ/ (vô thanh)"];
    easy.push(mcq(idp("e", i++), `Âm 'th' trong từ '${w}' được phát âm là gì?`, w, correct, dis, `'th' trong '${w}' là âm ${s === "θ" ? "vô thanh /θ/" : "hữu thanh /ð/"}.`, rng));
  }
  for (const [w, s] of pick(endingBank, 3, testNum)) easy.push(mcq(idp("e", i++), `Từ '${w}' kết thúc bằng âm gì?`, w, soundLabel[s], endingDistractors(s, rng), `'${w}' kết thúc bằng âm ${soundLabel[s]}.`, rng));
  for (const [w, s] of pick(endingBank, 10, testNum + 3)) easy.push(essay(idp("e", i++), "Gõ lại ÂM ĐUÔI (Ending sound) của từ sau bằng chữ cái tiếng Anh (VD: k, t, sh).", w, w, soundAnswers[s], `'${w}' kết thúc bằng âm ${soundLabel[s]}.`));
  for (const [w, s1, s2] of pick(nvPairs, 5, testNum)) {
    const noun = rng() < 0.5;
    const ans = noun ? [`${s1.toUpperCase()}-${s2}`, `${s1.toUpperCase()}${s2}`] : [`${s1}-${s2.toUpperCase()}`, `${s1}${s2.toUpperCase()}`];
    easy.push(essay(idp("e", i++), "Gõ lại từ, viết HOA âm tiết mang trọng âm (VD: RE-cord).", `${w} (${noun ? "danh từ" : "động từ"})`, w, ans, `${noun ? "Danh từ" : "Động từ"} 2 âm tiết → nhấn âm ${noun ? "1" : "2"}.`));
  }
  // MEDIUM
  const med = [];
  i = 1;
  for (const [w, s] of pick(sEndBank, 6, testNum)) {
    const dis = ["/s/", "/z/", "/ɪz/"].filter((x) => x !== s);
    med.push(mcq(idp("m", i++), `Từ '${w}' phát âm đuôi '-s/-es' như thế nào?`, w, s, dis.concat("/es/").slice(0, 3), `Đuôi '-s' của '${w}' đọc là ${s}.`, rng));
  }
  for (const [w, s] of pick(edEndBank, 6, testNum)) {
    const dis = ["/t/", "/d/", "/ɪd/"].filter((x) => x !== s);
    med.push(mcq(idp("m", i++), `Từ '${w}' phát âm đuôi '-ed' như thế nào?`, w, s, dis.concat("/ed/").slice(0, 3), `Đuôi '-ed' của '${w}' đọc là ${s}.`, rng));
  }
  for (const [w, idx, cnt, split] of pick(stressBank, 4, testNum)) {
    const opts = ["Thứ 1", "Thứ 2", "Thứ 3", "Thứ 4"].slice(0, cnt);
    const correct = `Thứ ${idx}`;
    const dis = opts.filter((o) => o !== correct).slice(0, 3);
    while (dis.length < 3) dis.push(["Thứ 1", "Thứ 2", "Thứ 3", "Thứ 4"].filter((o) => o !== correct && !dis.includes(o))[0]);
    med.push(mcq(idp("m", i++), `Trọng âm của từ '${w}' rơi vào âm tiết thứ mấy?`, w, correct, dis, `${split} — trọng âm âm tiết ${idx}.`, rng));
  }
  for (const [w, s] of pick(sEndBank, 3, testNum + 2)) med.push(essay(idp("m", i++), "Gõ lại âm đuôi '-s' của từ sau (s, z, hay iz).", w, w, s === "/s/" ? ["s", "S"] : s === "/z/" ? ["z", "Z"] : ["iz", "IZ", "Iz"], `Đuôi đọc là ${s}.`));
  for (const [w, s] of pick(edEndBank, 3, testNum + 2)) med.push(essay(idp("m", i++), "Gõ lại âm đuôi '-ed' của từ sau (t, d, hay id).", w, w, s === "/t/" ? ["t", "T"] : s === "/d/" ? ["d", "D"] : ["id", "ID", "Id"], `Đuôi đọc là ${s}.`));
  for (const [w, idx, cnt, split] of pick(stressBank, 3, testNum + 4)) med.push(essay(idp("m", i++), "Gõ lại từ, viết HOA âm tiết mang trọng âm (VD: im-POR-tant).", w, w, [split, split.replace(/-/g, "")], `Trọng âm âm tiết ${idx}.`));
  // HARD
  const hard = [];
  i = 1;
  for (const [w, letter, correct, dis, ex] of pick(trickyBank, 12, testNum)) hard.push(mcq(idp("h", i++), `Chữ '${letter}' trong từ '${w}' được phát âm là gì?`, w, correct, dis, ex, rng));
  for (const [w, correct, dis, ex] of pick(trickyEndBank, 4, testNum)) hard.push(mcq(idp("h", i++), `Từ '${w}' kết thúc bằng âm/cụm âm gì?`, w, correct, dis, ex, rng));
  for (const [w, idx, cnt, split] of pick(stressBank, 5, testNum + 8)) {
    const opts = ["Thứ 1", "Thứ 2", "Thứ 3", "Thứ 4"].slice(0, Math.max(cnt, 4));
    const correct = `Thứ ${idx}`;
    const dis = ["Thứ 1", "Thứ 2", "Thứ 3", "Thứ 4"].filter((o) => o !== correct).slice(0, 3);
    hard.push(mcq(idp("h", i++), `Trọng âm của từ '${w}' rơi vào âm tiết thứ mấy?`, w, correct, dis, `${split} — trọng âm âm tiết ${idx}.`, rng));
  }
  for (const [w, idx, cnt, split] of pick(stressBank, 4, testNum + 12)) hard.push(essay(idp("h", i++), "Gõ lại từ, viết HOA âm tiết mang trọng âm.", w, w, [split, split.replace(/-/g, "")], `Trọng âm âm tiết ${idx}.`));
  return [easy, med, hard];
}

// ══════════════════════════════════════════════════════════════
// SKILL 2 — ngat-nghi (Chunking & Pausing)
// break: index of word AFTER which the natural pause falls (0-based)
// ══════════════════════════════════════════════════════════════
const chunkEasy = [
  ["Please wait in the lobby.", 1, "Ngắt trước cụm giới từ chỉ địa điểm."],
  ["Thanks for calling our customer service.", 2, "Ngắt trước cụm danh từ làm tân ngữ."],
  ["If you need help, please call us.", 3, "Ngắt giữa mệnh đề điều kiện và mệnh đề chính."],
  ["The meeting starts at nine.", 2, "Ngắt trước cụm giới từ chỉ thời gian."],
  ["We are closed on weekends.", 2, "Ngắt trước cụm giới từ."],
  ["Please turn off your phone.", 2, "Ngắt trước cụm tân ngữ."],
  ["The train arrives in ten minutes.", 2, "Ngắt trước cụm giới từ chỉ thời gian."],
  ["I would like a coffee, please.", 4, "Ngắt trước từ lịch sự cuối câu."],
  ["Our office is on the third floor.", 2, "Ngắt trước cụm giới từ chỉ vị trí."],
  ["Please sign at the bottom.", 2, "Ngắt trước cụm giới từ."],
  ["The store opens at eight.", 2, "Ngắt trước cụm giới từ thời gian."],
  ["Thank you for your patience.", 1, "Ngắt trước cụm danh từ."],
  ["We offer free delivery.", 1, "Ngắt trước cụm tân ngữ."],
  ["The manager is in a meeting.", 2, "Ngắt trước cụm giới từ."],
  ["Please leave a message.", 1, "Ngắt trước cụm tân ngữ."],
  ["The elevator is out of order.", 2, "Ngắt trước cụm bổ ngữ."],
  ["We accept all major cards.", 1, "Ngắt trước cụm tân ngữ."],
  ["Your table is ready now.", 2, "Ngắt trước phần vị ngữ mở rộng."],
  ["Please fasten your seatbelt.", 1, "Ngắt trước cụm tân ngữ."],
  ["The library closes at six.", 2, "Ngắt trước cụm giới từ thời gian."],
  ["We hope to see you soon.", 3, "Ngắt trước trạng ngữ cuối câu."],
  ["The package will arrive tomorrow.", 2, "Ngắt trước phần vị ngữ."],
  ["Please check your email regularly.", 2, "Ngắt trước cụm tân ngữ."],
  ["The results are quite impressive.", 2, "Ngắt trước phần bổ ngữ."],
  ["We value your feedback greatly.", 1, "Ngắt trước cụm tân ngữ."],
];
const chunkMedium = [
  ["The report that you requested is on your desk.", 5, "Ngắt sau mệnh đề quan hệ, trước động từ chính."],
  ["We offer discounts to all our loyal customers.", 2, "Ngắt trước cụm giới từ dài."],
  ["The new employees will start their training next week.", 5, "Ngắt sau tân ngữ, trước trạng ngữ thời gian."],
  ["Everyone who attended the seminar received a certificate.", 4, "Ngắt sau mệnh đề quan hệ."],
  ["The company announced a new policy this morning.", 4, "Ngắt sau tân ngữ, trước trạng ngữ."],
  ["Our team is working hard to meet the deadline.", 4, "Ngắt trước mệnh đề chỉ mục đích (to)."],
  ["The customer asked for a full refund yesterday.", 5, "Ngắt trước trạng ngữ thời gian."],
  ["Please submit your application before the end of the month.", 3, "Ngắt trước cụm giới từ thời gian."],
  ["The conference will be held in the main auditorium.", 4, "Ngắt trước cụm giới từ chỉ nơi chốn."],
  ["All visitors must register at the front desk.", 3, "Ngắt trước cụm giới từ chỉ nơi chốn."],
  ["The document you signed is now legally binding.", 3, "Ngắt sau mệnh đề quan hệ rút gọn."],
  ["We would appreciate your response as soon as possible.", 4, "Ngắt trước cụm trạng ngữ."],
  ["The technician who fixed the printer left a note.", 5, "Ngắt sau mệnh đề quan hệ."],
  ["Our flight was delayed because of the bad weather.", 3, "Ngắt trước mệnh đề chỉ lý do."],
  ["The instructions are printed on the back of the box.", 4, "Ngắt trước cụm giới từ chỉ vị trí."],
  ["Employees are encouraged to take regular breaks.", 3, "Ngắt trước mệnh đề bị động chỉ mục đích."],
  ["The proposal was approved after a long discussion.", 3, "Ngắt trước cụm giới từ thời gian."],
  ["She reviewed the contract before signing it.", 3, "Ngắt trước mệnh đề thời gian."],
  ["The hotel provides free breakfast for all guests.", 4, "Ngắt trước cụm giới từ."],
  ["We need to increase sales in the next quarter.", 4, "Ngắt trước cụm giới từ thời gian."],
  ["The speaker thanked the audience for their attention.", 3, "Ngắt trước cụm giới từ."],
  ["Customers who spend over fifty dollars get free shipping.", 6, "Ngắt sau mệnh đề quan hệ."],
  ["The factory produces thousands of units every day.", 4, "Ngắt trước trạng ngữ thời gian."],
  ["Our records show that the payment was received.", 3, "Ngắt trước mệnh đề tân ngữ (that)."],
  ["The workshop will cover several important topics.", 3, "Ngắt trước cụm tân ngữ."],
];
const chunkHard = [
  ["Welcome to the grand opening of our new branch in downtown Seattle.", 4, "Ngắt trước cụm giới từ 'of'."],
  ["Passengers traveling to London should proceed to Gate 5 immediately.", 4, "Ngắt sau chủ ngữ lớn, trước động từ."],
  ["In order to complete the survey, please click the link below.", 5, "Ngắt sau mệnh đề phụ chỉ mục đích."],
  ["Due to unforeseen circumstances, the event has been postponed.", 3, "Ngắt sau cụm trạng ngữ mở đầu."],
  ["The committee, after much deliberation, reached a final decision.", 2, "Ngắt trước cụm chêm giữa hai dấu phẩy."],
  ["Although the price is high, the quality justifies the cost.", 4, "Ngắt sau mệnh đề nhượng bộ."],
  ["Once the payment is confirmed, we will ship your order.", 4, "Ngắt sau mệnh đề thời gian."],
  ["The keynote speaker, a renowned economist, will present the findings.", 2, "Ngắt trước cụm đồng vị ngữ."],
  ["To ensure your safety, please read all the instructions carefully.", 3, "Ngắt sau mệnh đề mục đích mở đầu."],
  ["Whenever you have a question, feel free to contact our support team.", 4, "Ngắt sau mệnh đề thời gian."],
  ["The building, which was constructed in 1920, is now a museum.", 2, "Ngắt trước mệnh đề quan hệ không xác định."],
  ["After reviewing your resume, we would like to invite you for an interview.", 3, "Ngắt sau mệnh đề phân từ mở đầu."],
  ["Despite the heavy rain, the outdoor concert continued as planned.", 3, "Ngắt sau cụm giới từ nhượng bộ."],
  ["The proposal, if approved by the board, will take effect immediately.", 2, "Ngắt trước mệnh đề điều kiện chêm giữa."],
  ["Before you leave the building, make sure all the lights are off.", 4, "Ngắt sau mệnh đề thời gian mở đầu."],
  ["Our latest product, designed for professionals, offers advanced features.", 2, "Ngắt trước cụm phân từ chêm giữa."],
  ["Since the market is changing rapidly, we must adapt our strategy.", 4, "Ngắt sau mệnh đề chỉ lý do."],
  ["The award, presented annually to top performers, recognizes excellence.", 2, "Ngắt trước cụm phân từ chêm giữa."],
  ["If you are not satisfied, we offer a full refund within thirty days.", 4, "Ngắt sau mệnh đề điều kiện."],
  ["As mentioned in the previous email, the deadline has been extended.", 5, "Ngắt sau cụm trạng ngữ mở đầu."],
  ["The new regulations, which take effect next month, affect all departments.", 3, "Ngắt trước mệnh đề quan hệ chêm giữa."],
  ["While we appreciate your interest, the position has already been filled.", 4, "Ngắt sau mệnh đề nhượng bộ."],
  ["Upon arrival at the airport, please collect your baggage from carousel three.", 4, "Ngắt sau cụm giới từ mở đầu."],
  ["The seminar, hosted by industry experts, attracted hundreds of participants.", 2, "Ngắt trước cụm phân từ chêm giữa."],
  ["Given the current situation, we recommend booking your tickets early.", 3, "Ngắt sau cụm trạng ngữ mở đầu."],
];
function buildBreak(words, at) {
  return words.map((w, k) => (k === at ? w + " /" : w)).join(" ").replace(/\s+\/\s+/g, " / ");
}
function buildBreak2(words, a, b) {
  return words.map((w, k) => (k === a || k === b ? w + " /" : w)).join(" ").replace(/\s+\/\s+/g, " / ");
}
function chunkOptions(sentence, correctAt, rng) {
  const words = sentence.replace(/\.$/, "").split(" ");
  const n = words.length;
  const correctText = buildBreak(words, correctAt) + ".";
  const wrongGaps = [];
  for (let k = 0; k < n - 1; k++) if (k !== correctAt) wrongGaps.push(k);
  // pool of wrong renderings: single wrong break, then padded with no-break / double-break
  const pool = shuffle(wrongGaps, rng).map((k) => buildBreak(words, k) + ".");
  pool.push(words.join(" ") + "."); // no break
  const shuffledGaps = shuffle(wrongGaps, rng);
  for (let a = 0; a < shuffledGaps.length; a++)
    for (let b = a + 1; b < shuffledGaps.length; b++)
      pool.push(buildBreak2(words, shuffledGaps[a], shuffledGaps[b]) + ".");
  const distractors = [];
  for (const p of pool) {
    if (p === correctText || distractors.includes(p)) continue;
    distractors.push(p);
    if (distractors.length === 3) break;
  }
  return { correctText, distractors };
}
function genNgatNghi(testNum, rng) {
  const idp = (l, i) => `s2_t${testNum}_${l}${i}`;
  const build = (bank, offset, letter, instr) => {
    const out = [];
    let i = 1;
    for (const [sentence, at, reason] of pick(bank, 25, testNum + offset)) {
      const { correctText, distractors } = chunkOptions(sentence, at, rng);
      out.push(mcq(idp(letter, i++), instr, sentence, correctText, distractors, reason, rng));
    }
    return out;
  };
  return [
    build(chunkEasy, 0, "e", "Chọn cách ngắt câu (/) tự nhiên nhất."),
    build(chunkMedium, 0, "m", "Chọn cách ngắt câu (/) tự nhiên nhất."),
    build(chunkHard, 0, "h", "Chọn cách ngắt câu (/) tự nhiên nhất cho câu phức tạp."),
  ];
}

// ══════════════════════════════════════════════════════════════
// SKILL 3 — ngu-dieu (Intonation) — rule based
// ══════════════════════════════════════════════════════════════
const INTON = { rise: "Lên giọng (↗)", fall: "Xuống giọng (↘)", flat: "Giữ ngang (→)", risefall: "Lên rồi xuống (↗↘)", fallrise: "Xuống rồi lên (↘↗)" };
const yesnoQ = ["Are you ready?", "Do you like coffee?", "Is this seat taken?", "Can you help me?", "Have you finished?", "Did you call him?", "Would you like some tea?", "Is the office open?", "Are they coming?", "Do we have a meeting?", "Can I sit here?", "Has the train left?", "Will you join us?", "Is it raining?", "Do you need help?", "Are you from Canada?", "Did she arrive?", "Is dinner ready?", "Can they wait?", "Do you understand?", "Are we late?", "Is he a doctor?", "Would you mind waiting?", "Have they paid?", "Does it work?"];
const whQ = ["What is your name?", "Where do you live?", "Who called you?", "When does it start?", "Why are you late?", "How much is it?", "What time is the meeting?", "Where is the station?", "Who is the manager?", "How do I get there?", "What does it mean?", "Where did you go?", "When will it arrive?", "Why did he leave?", "How many people came?", "What is the problem?", "Where are the documents?", "Who wrote this report?", "How long does it take?", "What happened yesterday?", "Where should I sign?", "When is the deadline?", "Why is it closed?", "How was your trip?", "What are you doing?"];
const statements = ["I like coffee.", "Please sit down.", "The store is closed.", "She works here.", "We are ready.", "Turn off the lights.", "It is raining.", "He lives nearby.", "The meeting is over.", "Take a seat.", "They arrived early.", "The food is delicious.", "Close the door.", "I understand.", "The report is finished.", "Follow me, please.", "It costs ten dollars.", "The bus is late.", "Welcome aboard.", "Have a nice day.", "The results are good.", "Sign here, please.", "The office is upstairs.", "We appreciate your help.", "The project is complete."];
const listSent = [
  ["I bought apples, bananas, and oranges.", "apples", "bananas", "oranges"],
  ["We need pens, pencils, and paper.", "pens", "pencils", "paper"],
  ["She speaks English, French, and Spanish.", "English", "French", "Spanish"],
  ["The kit includes a manual, a cable, and a charger.", "manual", "cable", "charger"],
  ["We offer coffee, tea, and juice.", "coffee", "tea", "juice"],
  ["Please bring your passport, ticket, and visa.", "passport", "ticket", "visa"],
  ["The menu has soup, salad, and bread.", "soup", "salad", "bread"],
  ["He visited Rome, Paris, and Berlin.", "Rome", "Paris", "Berlin"],
  ["Our goals are quality, speed, and safety.", "quality", "speed", "safety"],
  ["The box contains screws, bolts, and nails.", "screws", "bolts", "nails"],
  ["I need milk, eggs, and butter.", "milk", "eggs", "butter"],
  ["They sell shirts, pants, and shoes.", "shirts", "pants", "shoes"],
  ["The course covers reading, writing, and speaking.", "reading", "writing", "speaking"],
  ["We accept cash, cards, and checks.", "cash", "cards", "checks"],
  ["The team includes John, Mary, and Paul.", "John", "Mary", "Paul"],
  ["Please review the budget, schedule, and plan.", "budget", "schedule", "plan"],
  ["The tour visits the museum, the park, and the castle.", "museum", "park", "castle"],
  ["She teaches math, science, and history.", "math", "science", "history"],
  ["We provide breakfast, lunch, and dinner.", "breakfast", "lunch", "dinner"],
  ["The report covers sales, costs, and profits.", "sales", "costs", "profits"],
];
const midComma = [
  ["If you are ready, we will start.", "ready", "start"],
  ["When the bell rings, please leave.", "rings", "leave"],
  ["Before you go, sign the form.", "go", "form"],
  ["After the meeting, we had lunch.", "meeting", "lunch"],
  ["Because it was late, we left.", "late", "left"],
  ["Although it rained, we continued.", "rained", "continued"],
  ["Once you finish, let me know.", "finish", "know"],
  ["Since you asked, I will explain.", "asked", "explain"],
  ["While I cook, you can rest.", "cook", "rest"],
  ["As soon as it opens, we will enter.", "opens", "enter"],
  ["If the price drops, we will buy.", "drops", "buy"],
  ["When you arrive, call the office.", "arrive", "office"],
  ["Before the show starts, take your seats.", "starts", "seats"],
  ["After you register, collect your badge.", "register", "badge"],
  ["Because of the delay, we apologized.", "delay", "apologized"],
];
const tagQ = [
  ["You haven't seen my keys, have you?", "keys", "have you"],
  ["She is the manager, isn't she?", "manager", "isn't she"],
  ["They didn't call, did they?", "call", "did they"],
  ["You can swim, can't you?", "swim", "can't you"],
  ["He works here, doesn't he?", "here", "doesn't he"],
  ["We are late, aren't we?", "late", "aren't we"],
  ["You won't forget, will you?", "forget", "will you"],
  ["It wasn't easy, was it?", "easy", "was it"],
  ["They have arrived, haven't they?", "arrived", "haven't they"],
  ["You like it, don't you?", "it", "don't you"],
];
function intonOptions(correctKey, rng) {
  const keys = ["rise", "fall", "flat", "risefall"];
  const correct = INTON[correctKey];
  const dis = keys.filter((k) => k !== correctKey).map((k) => INTON[k]).slice(0, 3);
  return { correct, dis };
}
function genNguDieu(testNum, rng) {
  const idp = (l, i) => `s3_t${testNum}_${l}${i}`;
  // EASY: yesno(rise), wh(fall), statements(fall)
  const easy = [];
  let i = 1;
  for (const s of pick(yesnoQ, 9, testNum)) { const { correct, dis } = intonOptions("rise", rng); easy.push(mcq(idp("e", i++), "Ngữ điệu ở cuối câu sau đây là gì?", s, correct, dis, "Câu hỏi Yes/No → Lên giọng (↗) ở cuối.", rng)); }
  for (const s of pick(whQ, 8, testNum)) { const { correct, dis } = intonOptions("fall", rng); easy.push(mcq(idp("e", i++), "Ngữ điệu ở cuối câu sau đây là gì?", s, correct, dis, "Câu hỏi Wh- → Xuống giọng (↘) ở cuối.", rng)); }
  for (const s of pick(statements, 8, testNum)) { const { correct, dis } = intonOptions("fall", rng); easy.push(mcq(idp("e", i++), "Ngữ điệu ở cuối câu trần thuật/mệnh lệnh sau là gì?", s, correct, dis, "Câu trần thuật/mệnh lệnh → Xuống giọng (↘).", rng)); }
  // MEDIUM: lists + mid-comma
  const med = [];
  i = 1;
  for (const [s, a, b, c] of pick(listSent, 13, testNum)) {
    const correct = `${a} (↗), ${b} (↗), and ${c} (↘)`;
    const dis = [`${a} (↘), ${b} (↘), and ${c} (↘)`, `${a} (↗), ${b} (↘), and ${c} (↗)`, `${a} (↘), ${b} (↗), and ${c} (↗)`];
    med.push(mcq(idp("m", i++), "Chọn chuỗi ngữ điệu đúng cho câu liệt kê sau.", s, correct, dis, "Liệt kê: Lên giọng ở các mục đầu/giữa, Xuống giọng ở mục cuối.", rng));
  }
  for (const [s, a, b] of pick(midComma, 12, testNum)) {
    const correct = `${a} (↗), ${b} (↘)`;
    const dis = [`${a} (↘), ${b} (↘)`, `${a} (↗), ${b} (↗)`, `${a} (↘), ${b} (↗)`];
    med.push(mcq(idp("m", i++), "Ngữ điệu trước và sau dấu phẩy trong câu sau là gì?", s, correct, dis, "Chưa hết ý (trước phẩy) → Lên giọng (↗); kết thúc câu → Xuống giọng (↘).", rng));
  }
  // HARD: tag questions + complex lists
  const hard = [];
  i = 1;
  for (const [s, a, b] of pick(tagQ, 10, testNum)) {
    const correct = `${a} (↘), ${b} (↗)`;
    const dis = [`${a} (↗), ${b} (↘)`, `${a} (↘), ${b} (↘)`, `${a} (↗), ${b} (↗)`];
    hard.push(mcq(idp("h", i++), "Ngữ điệu câu hỏi đuôi khi THỰC SỰ MUỐN HỎI (không chắc chắn) là gì?", s, correct, dis, "Không chắc chắn → Xuống ở vế đầu, LÊN giọng ở câu hỏi đuôi (↗).", rng));
  }
  for (const [s, a, b] of pick(tagQ, 5, testNum + 3)) {
    const correct = `${a} (↘), ${b} (↘)`;
    const dis = [`${a} (↘), ${b} (↗)`, `${a} (↗), ${b} (↗)`, `${a} (↗), ${b} (↘)`];
    hard.push(mcq(idp("h", i++), "Ngữ điệu câu hỏi đuôi khi CHỈ MUỐN XÁC NHẬN (đã chắc chắn) là gì?", s, correct, dis, "Đã chắc chắn, chỉ xác nhận → Xuống giọng ở cả hai vế (↘).", rng));
  }
  for (const [s, a, b, c] of pick(listSent, 10, testNum + 5)) {
    const correct = `${a} (↗), ${b} (↗), and ${c} (↘)`;
    const dis = [`${a} (↘), ${b} (↗), and ${c} (↗)`, `${a} (↗), ${b} (↘), and ${c} (↘)`, `${a} (↘), ${b} (↘), and ${c} (↗)`];
    hard.push(mcq(idp("h", i++), "Chọn chuỗi ngữ điệu đúng cho câu liệt kê sau.", s, correct, dis, "Các mục đầu/giữa Lên giọng (↗), mục cuối Xuống giọng (↘).", rng));
  }
  return [easy, med, hard];
}

// ══════════════════════════════════════════════════════════════
// SKILL 4 — trong-am (Sentence Stress) — rule based (content vs function)
// ══════════════════════════════════════════════════════════════
const FUNCTION_WORDS = new Set(["a", "an", "the", "in", "on", "at", "to", "of", "for", "with", "from", "by", "into", "onto", "about", "over", "under", "as", "and", "but", "or", "so", "if", "when", "that", "because", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my", "your", "his", "its", "our", "their", "is", "are", "am", "was", "were", "be", "been", "being", "do", "does", "did", "have", "has", "had", "will", "would", "can", "could", "shall", "should", "may", "might", "must"]);
const NEG_WORDS = new Set(["not", "don't", "doesn't", "didn't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "shouldn't", "wouldn't", "couldn't", "never"]);
function isContent(word) {
  const w = word.toLowerCase().replace(/[.,!?]/g, "");
  if (NEG_WORDS.has(w)) return true;
  return !FUNCTION_WORDS.has(w);
}
const stressConcept = [
  ["Đại từ nhân xưng (he, she, it...)", ["Danh từ (Noun)", "Động từ chính (Main Verb)", "Tính từ (Adjective)"], "ĐỌC LƯỚT", "Đại từ nhân xưng là từ chức năng, thường đọc lướt."],
  ["Giới từ (in, on, at...)", ["Danh từ (Noun)", "Trạng từ (Adverb)", "Động từ (Verb)"], "ĐỌC LƯỚT", "Giới từ là từ chức năng, đọc lướt."],
  ["Mạo từ (a, an, the)", ["Tính từ", "Danh từ", "Động từ"], "ĐỌC LƯỚT", "Mạo từ là từ chức năng, đọc lướt."],
  ["Liên từ (and, but, or)", ["Danh từ", "Động từ chính", "Trạng từ"], "ĐỌC LƯỚT", "Liên từ chỉ nối câu, đọc lướt."],
  ["Trợ động từ (do, does, is)", ["Động từ chính", "Danh từ", "Tính từ"], "ĐỌC LƯỚT", "Trợ động từ (khẳng định) thường đọc lướt."],
];
const stressContent = [
  ["Danh từ (Noun)", ["Mạo từ (the)", "Giới từ (in)", "Đại từ (it)"], "NHẤN MẠNH", "Danh từ mang nghĩa chính → nhấn."],
  ["Động từ chính (Main Verb)", ["Trợ động từ (do)", "Giới từ (on)", "Liên từ (and)"], "NHẤN MẠNH", "Động từ chính mang nghĩa → nhấn."],
  ["Tính từ (Adjective)", ["Mạo từ (a)", "Giới từ (of)", "Đại từ (he)"], "NHẤN MẠNH", "Tính từ miêu tả → nhấn."],
  ["Trạng từ (Adverb)", ["Giới từ (at)", "Liên từ (but)", "Mạo từ (the)"], "NHẤN MẠNH", "Trạng từ bổ nghĩa → nhấn."],
  ["Trợ động từ phủ định (don't, can't)", ["Trợ động từ khẳng định (do)", "Giới từ", "Mạo từ"], "NHẤN MẠNH", "Phủ định LUÔN được nhấn để làm rõ nghĩa."],
];
const stressSentences = [
  "The report is on the desk.", "I will call you tomorrow.", "She doesn't like coffee.", "We need more time.",
  "The manager wants the report.", "They bought a new car.", "He works in the city.", "Please close the window.",
  "The meeting starts at noon.", "I can't find my keys.", "The train arrives at six.", "She teaches English well.",
  "We finished the project early.", "The store sells fresh bread.", "He never eats meat.", "They visited the museum.",
  "The children played outside.", "I bought some flowers.", "The doctor helped the patient.", "We watched a good movie.",
  "The company hired new staff.", "She wrote a long letter.", "The garden looks beautiful.", "He fixed the broken chair.",
  "They ordered pizza tonight.",
];
function contentWords(sentence) {
  return sentence.replace(/[.,!?]/g, "").split(" ").filter(isContent);
}
function rhythmString(sentence) {
  return sentence.replace(/[.,!?]$/, "").split(" ").map((w) => (isContent(w) ? w.toUpperCase() : w.toLowerCase())).join(" ") + (sentence.match(/[.,!?]$/) ? sentence.match(/[.,!?]$/)[0] : "");
}
function genTrongAm(testNum, rng) {
  const idp = (l, i) => `s4_t${testNum}_${l}${i}`;
  // EASY: conceptual
  const easy = [];
  let i = 1;
  const conceptPool = shuffle([
    ...stressConcept.map((x) => ({ x, kind: "luot" })),
    ...stressContent.map((x) => ({ x, kind: "nhan" })),
  ], mulberry32(400 + testNum));
  // repeat pool to reach 25 with varied phrasing
  for (let k = 0; k < 25; k++) {
    const { x, kind } = conceptPool[(k + (testNum - 1) * 3) % conceptPool.length];
    const [correct, dis, tag, ex] = x;
    const instr = kind === "luot"
      ? "Loại từ nào sau đây thường BỊ ĐỌC LƯỚT (nhỏ, nhanh)?"
      : "Loại từ nào sau đây cần được ĐỌC NHẤN MẠNH?";
    easy.push(mcq(idp("e", i++), instr, "", correct, dis, ex, rng));
  }
  // MEDIUM: which words are stressed
  const med = [];
  i = 1;
  for (const s of pick(stressSentences, 25, testNum)) {
    const content = contentWords(s);
    const correct = content.join(", ");
    const dis = [
      content.slice(0, -1).join(", ") || content[0],
      content.slice(1).join(", ") || content[content.length - 1],
      [...content.slice(0, 1), "the", ...content.slice(-1)].join(", "),
    ];
    const uniqDis = [...new Set(dis.filter((d) => d !== correct))].slice(0, 3);
    while (uniqDis.length < 3) uniqDis.push(content.slice(0, uniqDis.length + 1).join(", ") + " (thiếu)");
    med.push(mcq(idp("m", i++), `Trong câu '${s}', những từ nào CẦN NHẤN MẠNH?`, s, correct, uniqDis, `Từ nội dung: ${correct}. Các từ chức năng còn lại đọc lướt.`, rng));
  }
  // HARD: correct rhythm string
  const hard = [];
  i = 1;
  for (const s of pick(stressSentences, 25, testNum + 5)) {
    const correct = rhythmString(s);
    const words = s.replace(/[.,!?]$/, "").split(" ");
    const punct = s.match(/[.,!?]$/) ? s.match(/[.,!?]$/)[0] : "";
    const allUpper = words.map((w) => w.toUpperCase()).join(" ") + punct;
    const inverted = words.map((w) => (isContent(w) ? w.toLowerCase() : w.toUpperCase())).join(" ") + punct;
    const shifted = words.map((w, k) => (k % 2 === 0 ? w.toUpperCase() : w.toLowerCase())).join(" ") + punct;
    const dis = [...new Set([allUpper, inverted, shifted].filter((d) => d !== correct))].slice(0, 3);
    while (dis.length < 3) dis.push(words.map((w, k) => (k === dis.length ? w.toUpperCase() : w.toLowerCase())).join(" ") + punct);
    hard.push(mcq(idp("h", i++), "Câu nào có nhịp điệu ĐÚNG NHẤT? (Chữ IN HOA là từ được nhấn)", s, correct, dis, `Nhấn các từ nội dung: ${contentWords(s).join(", ")}.`, rng));
  }
  return [easy, med, hard];
}

// ══════════════════════════════════════════════════════════════
// SKILL 5 — noi-am (Linking Sounds)
// ══════════════════════════════════════════════════════════════
// C→V linking: [phrase, correctLinked, distractors[3], explanation]
const linkCV = [
  ["look at", "loo - kat (/lʊ - kæt/)", ["look - at (không nối)", "lo - kat", "loo - a - t"], "/k/ cuối 'look' nối với /æ/ đầu 'at'."],
  ["hold on", "hol - don (/hoʊl - dɒn/)", ["hold - on (không nối)", "hol - d - on", "ho - don"], "/d/ cuối nối với /ɒ/ đầu 'on'."],
  ["come in", "co - min (/kʌ - mɪn/)", ["come - in (không nối)", "co - me - in", "c - omin"], "'e' câm, /m/ nối với /ɪ/."],
  ["turn off", "tur - noff (/tɜːr - nɒf/)", ["turn - off (không nối)", "tu - noff", "tur - n - off"], "/n/ cuối nối với /ɒ/ đầu 'off'."],
  ["pick it up", "pi - ki - tup (/pɪ - kɪ - tʌp/)", ["pick - it - up", "pic - kit - up", "pi - kit - up"], "Nối liên tiếp /k/+it, /t/+up."],
  ["stand up", "stan - dup (/stæn - dʌp/)", ["stand - up (không nối)", "sta - dup", "stan - d - up"], "/d/ cuối nối với /ʌ/ đầu 'up'."],
  ["sit down", "sit - down", ["si - down", "sitt - own", "s - itdown"], "'down' bắt đầu bằng phụ âm /d/ nên KHÔNG nối kiểu C→V."],
  ["get up", "ge - tup (/ɡe - tʌp/)", ["get - up (không nối)", "g - etup", "ge - t - up"], "/t/ cuối nối với /ʌ/ đầu 'up'."],
  ["put it on", "pu - ti - ton (/pʊ - tɪ - tɒn/)", ["put - it - on", "put - i - ton", "pu - tit - on"], "Nối liên tiếp /t/+it, /t/+on."],
  ["far away", "fa - raway (/fɑː - rəweɪ/)", ["far - away (không nối)", "fa - away", "far - r - away"], "/r/ cuối nối với /ə/ đầu 'away'."],
  ["an apple", "a - napple (/ə - næpl/)", ["an - apple (không nối)", "a - apple", "an - n - apple"], "/n/ cuối nối với /æ/ đầu 'apple'."],
  ["this evening", "thi - sevening (/ðɪ - siːvnɪŋ/)", ["this - evening (không nối)", "thi - evening", "thiss - evening"], "/s/ cuối nối với /iː/ đầu 'evening'."],
  ["not at all", "no - ta - tall (/nɒ - tə - tɔːl/)", ["not - at - all", "no - tat - all", "not - a - tall"], "Nối liên tiếp /t/+at, /t/+all."],
  ["give it back", "gi - vit - back (/ɡɪ - vɪt - bæk/)", ["give - it - back", "gi - vi - tback", "giv - it - back"], "/v/ nối với /ɪ/; 'back' bắt đầu phụ âm."],
  ["take it easy", "ta - ki - teasy (/teɪ - kɪ - tiːzi/)", ["take - it - easy", "ta - kit - easy", "tak - it - easy"], "Nối liên tiếp /k/+it, /t/+easy."],
  ["fill in", "fi - lin (/fɪ - lɪn/)", ["fill - in (không nối)", "fi - in", "fill - l - in"], "/l/ cuối nối với /ɪ/ đầu 'in'."],
  ["call us", "ca - lus (/kɔː - ləs/)", ["call - us (không nối)", "ca - us", "call - l - us"], "/l/ cuối nối với /ə/ đầu 'us'."],
  ["read it", "rea - dit (/riː - dɪt/)", ["read - it (không nối)", "rea - it", "rea - d - it"], "/d/ cuối nối với /ɪ/ đầu 'it'."],
  ["keep out", "kee - pout (/kiː - paʊt/)", ["keep - out (không nối)", "kee - out", "keep - p - out"], "/p/ cuối nối với /aʊ/ đầu 'out'."],
  ["work out", "wor - kout (/wɜːr - kaʊt/)", ["work - out (không nối)", "wor - out", "work - k - out"], "/k/ cuối nối với /aʊ/ đầu 'out'."],
  ["check in", "che - kin (/tʃe - kɪn/)", ["check - in (không nối)", "che - in", "check - k - in"], "/k/ cuối nối với /ɪ/ đầu 'in'."],
  ["fall asleep", "fa - lasleep (/fɔː - ləsliːp/)", ["fall - asleep (không nối)", "fa - asleep", "fall - l - asleep"], "/l/ cuối nối với /ə/ đầu 'asleep'."],
  ["run errands", "ru - nerrands (/rʌ - nerəndz/)", ["run - errands (không nối)", "ru - errands", "run - n - errands"], "/n/ cuối nối với /e/ đầu 'errands'."],
  ["sign in", "sig - nin (/saɪ - nɪn/)", ["sign - in (không nối)", "si - nin", "sign - n - in"], "'g' câm, /n/ nối với /ɪ/ đầu 'in'."],
  ["laugh at", "lau - ghat (/læ - fæt/)", ["laugh - at (không nối)", "lau - at", "laughh - at"], "'gh' đọc /f/, nối với /æ/ đầu 'at'."],
];
// -ed / -s linking concept (medium)
const linkEd = [
  ["He played a game.", "'played' (/d/) nối với 'a' (/ə/): /pleɪ - də/.", "played + a → /pleɪ - də/."],
  ["She worked on it.", "'worked' (/t/) nối 'on'; 'on' nối 'it'.", "worked-on /wɜːrk - tɒn/, on-it /ɒ - nɪt/ — 2 chỗ nối."],
  ["They moved out.", "'moved' (/d/) nối 'out': /muːv - daʊt/.", "moved + out → /muːv - daʊt/."],
  ["We asked him.", "'asked' (/t/) đứng trước 'him' (phụ âm /h/), không nối C→V.", "'him' bắt đầu bằng phụ âm."],
  ["I cleaned it up.", "'cleaned' (/d/) nối 'it'; 'it' nối 'up'.", "cleaned-it, it-up — 2 chỗ nối."],
  ["He turned around.", "'turned' (/d/) nối 'around': /tɜːrn - dəraʊnd/.", "turned + around → nối /d/ với /ə/."],
  ["She fixed everything.", "'fixed' (/kst/) nối 'everything': /fɪks - tevriθɪŋ/.", "đuôi /t/ nối với /e/."],
  ["They arrived early.", "'arrived' (/d/) nối 'early': /əraɪv - dɜːrli/.", "arrived + early → nối /d/ với /ɜː/."],
];
// w/j insertion (hard): [phrase, insert 'w'|'j', explanation]
const linkWJ = [
  ["go away", "w", "/oʊ/ chu môi → sinh /w/: go-w-away."],
  ["go out", "w", "/oʊ/ chu môi → sinh /w/: go-w-out."],
  ["do it", "w", "/uː/ chu môi → sinh /w/: do-w-it."],
  ["you are", "w", "/uː/ chu môi → sinh /w/: you-w-are."],
  ["how is", "w", "/aʊ/ chu môi → sinh /w/: how-w-is."],
  ["now and then", "w", "/aʊ/ chu môi → sinh /w/: now-w-and."],
  ["too easy", "w", "/uː/ chu môi → sinh /w/: too-w-easy."],
  ["so it is", "w", "/oʊ/ chu môi → sinh /w/: so-w-it."],
  ["I am", "j", "/aɪ/ lưỡi cao → sinh /j/: I-y-am."],
  ["my own", "j", "/aɪ/ lưỡi cao → sinh /j/: my-y-own."],
  ["they are", "j", "/eɪ/ lưỡi cao → sinh /j/: they-y-are."],
  ["be honest", "j", "/iː/ lưỡi cao → sinh /j/: be-y-honest."],
  ["the end", "j", "/iː/ (the trước nguyên âm) → sinh /j/: the-y-end."],
  ["say it", "j", "/eɪ/ lưỡi cao → sinh /j/: say-y-it."],
  ["he asked", "j", "/iː/ lưỡi cao → sinh /j/: he-y-asked."],
  ["try again", "j", "/aɪ/ lưỡi cao → sinh /j/: try-y-again."],
  ["who is", "w", "/uː/ chu môi → sinh /w/: who-w-is."],
  ["throw away", "w", "/oʊ/ chu môi → sinh /w/: throw-w-away."],
  ["may I", "j", "/eɪ/ lưỡi cao → sinh /j/: may-y-I."],
  ["see it", "j", "/iː/ lưỡi cao → sinh /j/: see-y-it."],
];
function genNoiAm(testNum, rng) {
  const idp = (l, i) => `s5_t${testNum}_${l}${i}`;
  // EASY: C→V linking
  const easy = [];
  let i = 1;
  for (const [phrase, correct, dis, ex] of pick(linkCV, 25, testNum)) easy.push(mcq(idp("e", i++), `Cụm '${phrase}' được nối âm như thế nào?`, phrase, correct, dis, ex, rng));
  // MEDIUM: -ed/-s linking concept + more C→V
  const med = [];
  i = 1;
  for (const [sent, correct, ex] of pick(linkEd, 13, testNum)) {
    const dis = ["Ngắt nghỉ rõ ràng giữa 2 từ, không nối.", "Âm cuối bị câm hoàn toàn.", "Đổi âm cuối thành âm khác."];
    med.push(mcq(idp("m", i++), `Trong câu '${sent}', hiện tượng nối âm nào xảy ra?`, sent, correct, dis, ex, rng));
  }
  for (const [phrase, correct, dis, ex] of pick(linkCV, 12, testNum + 3)) med.push(mcq(idp("m", i++), `Cụm '${phrase}' được nối âm như thế nào?`, phrase, correct, dis, ex, rng));
  // HARD: w/j insertion
  const hard = [];
  i = 1;
  for (const [phrase, ins, ex] of pick(linkWJ, 15, testNum)) {
    const correct = ins === "w" ? "Chèn âm /w/" : "Chèn âm /j/ (y)";
    const dis = [ins === "w" ? "Chèn âm /j/ (y)" : "Chèn âm /w/", "Chèn âm /r/", "Không chèn âm nào"];
    hard.push(mcq(idp("h", i++), `Khi nối '${phrase}' (nguyên âm + nguyên âm), người bản xứ chèn thêm âm gì?`, phrase, correct, dis, ex, rng));
  }
  for (const [phrase, ins, ex] of pick(linkWJ, 10, testNum + 4)) {
    const correct = ins === "w" ? "go/do/you → âm /w/" : "I/my/they → âm /j/";
    // reframe as identify rule
    const dis = ["Luôn chèn âm /h/", "Luôn chèn âm /r/", "Nối trực tiếp không cần chèn"];
    hard.push(mcq(idp("h", i++), `Cụm '${phrase}' được chèn thêm âm gì để nối cho mượt?`, phrase, ins === "w" ? "Âm /w/" : "Âm /j/ (y)", ["Âm /r/", "Âm /h/", ins === "w" ? "Âm /j/ (y)" : "Âm /w/"], ex, rng));
  }
  return [hard.length, easy, med, hard][0] ? [easy, med, hard] : [easy, med, hard];
}

// ══════════════════════════════════════════════════════════════
// Drive generation
// ══════════════════════════════════════════════════════════════
const SKILLS = [
  { id: "phat-am", si: 1, gen: genPhatAm },
  { id: "ngat-nghi", si: 2, gen: genNgatNghi },
  { id: "ngu-dieu", si: 3, gen: genNguDieu },
  { id: "trong-am", si: 4, gen: genTrongAm },
  { id: "noi-am", si: 5, gen: genNoiAm },
];

function levelObj(level, exercises) {
  return { level, exercises };
}

let total = 0;
for (const skill of SKILLS) {
  const meta = JSON.parse(fs.readFileSync(path.join(DIR, `${skill.id}.1.json`), "utf8"));
  for (let t = FIRST_NEW; t <= LAST_NEW; t++) {
    const rng = mulberry32(skill.si * 1000 + t);
    const [easy, med, hard] = skill.gen(t, rng);
    if (easy.length !== 25 || med.length !== 25 || hard.length !== 25) {
      throw new Error(`${skill.id} test ${t}: counts ${easy.length}/${med.length}/${hard.length}`);
    }
    const out = {
      course: meta.course,
      skill: meta.skill,
      levels: [levelObj("Easy", easy), levelObj("Medium", med), levelObj("Hard", hard)],
    };
    fs.writeFileSync(path.join(DIR, `${skill.id}.${t}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
    total += 75;
  }
  console.log(`✔ ${skill.id}: tests ${FIRST_NEW}-${LAST_NEW} written`);
}
console.log(`Done. ${total} exercises across ${SKILLS.length * (LAST_NEW - FIRST_NEW + 1)} files.`);

// ── emit index.ts import + map blocks for wiring ──────────────
function camel(id) { return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
const importLines = [];
const mapLines = [];
for (const skill of SKILLS) {
  const cv = camel(skill.id);
  const cap = cv.charAt(0).toUpperCase() + cv.slice(1);
  const vars = [];
  for (let t = 1; t <= LAST_NEW; t++) { importLines.push(`import ${cv}${t} from "./${skill.id}.${t}.json";`); vars.push(`${cv}${t}`); }
  importLines.push("");
  mapLines.push(`  "${skill.id}": [${vars.join(", ")}] as SpeakingTestData[],`);
}
fs.writeFileSync(path.join(__dirname, "gen-speaking-p1.blocks.txt"), importLines.join("\n") + "\n\n=== MAP ===\n" + mapLines.join("\n") + "\n", "utf8");
console.log("Wrote index.ts blocks to scripts/gen-speaking-p1.blocks.txt");
