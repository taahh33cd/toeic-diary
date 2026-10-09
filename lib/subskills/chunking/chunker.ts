// Bộ cắt chunk (thought group) theo quy ước ngữ pháp NP / VP / PP / clause.
//
// Dùng ở hai chỗ:
//   • script build dữ liệu nhánh Nghe  (scripts/chunking/build-listen-data.mjs)
//   • đối chiếu lại liệu nhánh Nói viết tay (scripts/chunking/check-speak-data.mjs)
//
// Quy ước khớp với mục "Cấu trúc câu" ở /grammar: trạng ngữ là bổ ngữ, nên cụm
// trạng ngữ đứng riêng thành một chunk chứ không dính vào vị ngữ.

/** Giới từ — ngắt TRƯỚC giới từ, và giới từ luôn đi liền với tân ngữ của nó. */
const PREPOSITIONS = new Set([
  "in", "on", "at", "for", "with", "from", "to", "by", "about", "into", "onto",
  "over", "under", "after", "before", "during", "through", "between", "among",
  "across", "against", "toward", "towards", "within", "without", "upon",
  "regarding", "including", "despite", "besides", "beyond", "near", "until",
  "till", "per", "via", "throughout", "alongside", "inside", "outside",
  "behind", "below", "above", "beside", "along",
]);

/** Liên từ phụ thuộc + đại từ quan hệ — mở đầu một clause mới. */
const SUBORDINATORS = new Set([
  "which", "who", "whom", "whose", "because", "since", "although",
  "though", "while", "when", "whenever", "where", "wherever", "if", "unless",
  "whether", "once",
]);

/** Trạng ngữ liên kết đứng đầu câu — tự thành một chunk. */
const CONNECTORS = new Set([
  "however", "therefore", "unfortunately", "fortunately", "actually",
  "hopefully", "meanwhile", "otherwise", "finally", "moreover", "also",
]);

/** Liên từ đẳng lập — chỉ ngắt khi hai bên đều đủ dài. */
const COORDINATORS = new Set(["and", "but", "or", "nor", "yet", "so"]);

/** Từ hạn định — KHÔNG được ngắt giữa chúng và danh từ phía sau. */
const DETERMINERS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "my", "your", "his",
  "her", "its", "our", "their", "some", "any", "each", "every", "no", "both",
  "all", "another", "other", "several", "many", "much", "few", "one", "two",
  "three", "four", "five", "six", "seven", "eight", "nine", "ten",
]);

/** Trợ động từ / động từ to be — KHÔNG ngắt giữa trợ động từ và động từ chính. */
const AUXILIARIES = new Set([
  "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "shall", "should", "can",
  "could", "may", "might", "must", "going", "want", "wants", "wanted",
  "need", "needs", "needed", "like", "likes", "liked", "try", "tries",
  "tried", "plan", "plans", "planned", "hope", "hopes", "hoped", "let",
  // Động từ kéo theo V-ing ngay sau — không tách khỏi nhau
  "begin", "begins", "began", "start", "starts", "started", "continue",
  "continues", "continued", "keep", "keeps", "kept", "finish", "finished",
  "stop", "stops", "stopped", "enjoy", "enjoys", "enjoyed", "avoid", "avoids",
]);

/** Trạng từ — đứng trước động từ thì không tách khỏi động từ. */
const ADVERB_HINTS = new Set([
  "really", "very", "just", "also", "already", "still", "never", "always",
  "often", "usually", "sometimes", "even", "only", "quite", "almost",
  "not", "never",
]);

/** Viết tắt có dấu chấm — không phải hết câu. */
const ABBREVIATIONS = new Set([
  "mr.", "mrs.", "ms.", "dr.", "prof.", "st.", "jr.", "sr.", "inc.", "ltd.",
  "co.", "corp.", "dept.", "ave.", "blvd.", "rd.", "no.", "vs.", "etc.",
  "a.m.", "p.m.", "u.s.", "u.k.",
]);

/** Hậu tố tính từ — không ngắt giữa tính từ và danh từ phía sau. */
const ADJECTIVE_SUFFIXES = [
  "ant", "ent", "ous", "ful", "ive", "able", "ible", "al", "ic", "ary",
  "less", "ional",
];
const ADJECTIVE_WORDS = new Set([
  "new", "good", "great", "big", "small", "old", "young", "high", "low",
  "best", "last", "next", "first", "main", "such", "late", "early", "long",
  "short", "free", "full", "open", "busy", "ready", "upcoming", "annual",
]);

const MIN_CHUNK_WORDS = 2;
const MAX_CHUNK_WORDS = 7;

export type Boundary = {
  /** Ngắt TRƯỚC từ thứ `at` (0-based trong mảng words) */
  at: number;
  /** Lý do ngắt, hiện ra khi chữa bài */
  reason: string;
};

export type ChunkedSentence = {
  words: string[];
  boundaries: Boundary[];
};

/** Bỏ dấu câu ở hai đầu và hạ chữ thường để tra trong các bảng trên. */
function bare(token: string): string {
  return token.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "").toLowerCase();
}

/** Từ này kết thúc một mệnh đề / ngữ đoạn bằng dấu câu? */
function closesPhrase(token: string): boolean {
  const low = token.toLowerCase();
  // "Mr." / "a.m." không phải hết câu; chữ cái đầu viết tắt ("J.") cũng vậy
  if (ABBREVIATIONS.has(low) || /^[a-z]\.$/.test(low)) return false;
  return /[,;:.!?—–]["')\]]?$/.test(token);
}

function isAdjective(w: string): boolean {
  if (ADJECTIVE_WORDS.has(w)) return true;
  return w.length > 5 && ADJECTIVE_SUFFIXES.some((s) => w.endsWith(s));
}

/**
 * Phân từ mở cụm bổ nghĩa, phân biệt với động từ chính và danh từ -ing.
 *
 * • "-ed": chỉ tính khi theo sau là giới từ — "appointment scheduled for…" đúng,
 *   còn "Several people mentioned that…" là động từ chính nên không ngắt.
 * • "-ing": chỉ tính khi từ trước là danh từ (không phải tính từ) — "his trip
 *   photographing scenes…" đúng, còn "an important meeting" thì không.
 */
function opensParticiplePhrase(cur: string, prev: string, next: string | undefined): boolean {
  if (cur.endsWith("ed") && cur.length > 4) {
    return !!next && PREPOSITIONS.has(next);
  }
  if (cur.endsWith("ing") && cur.length > 5) {
    return !isAdjective(prev) && !DETERMINERS.has(prev);
  }
  return false;
}

/**
 * Những chỗ TUYỆT ĐỐI không ngắt. `prev` là từ ngay trước chỗ định ngắt.
 * Dấu câu thắng mọi veto nên được xét trước khi gọi hàm này.
 */
function vetoed(prev: string, cur: string): boolean {
  // Giới từ phải đi liền tân ngữ: "for / my appointment" là sai
  if (PREPOSITIONS.has(prev)) return true;
  // Không tách từ hạn định khỏi danh từ: "a / three o'clock appointment" là sai
  if (DETERMINERS.has(prev)) return true;
  // Không tách trợ động từ khỏi động từ chính: "will / be able" là sai
  if (AUXILIARIES.has(prev)) return true;
  // Không tách trạng từ khỏi động từ: "really / liked" là sai
  if (ADVERB_HINTS.has(prev)) return true;
  // "of" luôn dính với danh từ phía trước: "line / of cheeses" là sai
  if (cur === "of") return true;
  // Sở hữu cách và gạch nối không bị cắt
  if (prev.endsWith("'s") || prev.endsWith("-")) return true;
  // Không ngắt ngay sau dạng viết tắt: "you're / shopping" là sai
  if (/'(re|m|ve|ll|d|s)$/.test(prev)) return true;
  // Liên từ đẳng lập phải dính với phần nó dẫn vào: "and / running" là sai
  if (COORDINATORS.has(prev)) return true;
  return false;
}

/** Cắt một câu thành các chunk theo quy ước ngữ pháp. */
export function chunkSentence(sentence: string): ChunkedSentence {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  const boundaries: Boundary[] = [];

  for (let i = 1; i < words.length; i++) {
    const prevRaw = words[i - 1];
    const prev = bare(prevRaw);
    const cur = bare(words[i]);

    if (closesPhrase(prevRaw)) {
      boundaries.push({ at: i, reason: `sau dấu câu "${prevRaw.slice(-1)}"` });
      continue;
    }
    if (vetoed(prev, cur)) continue;

    if (CONNECTORS.has(cur)) {
      boundaries.push({ at: i, reason: `trước trạng ngữ liên kết "${cur}"` });
      continue;
    }
    if (SUBORDINATORS.has(cur)) {
      boundaries.push({ at: i, reason: `trước liên từ "${cur}" mở mệnh đề mới` });
      continue;
    }
    if (cur === "that") {
      boundaries.push({ at: i, reason: 'trước "that" mở mệnh đề bổ ngữ' });
      continue;
    }
    if (PREPOSITIONS.has(cur)) {
      boundaries.push({ at: i, reason: `trước giới từ "${cur}" — cụm giới từ là một chunk` });
      continue;
    }
    if (COORDINATORS.has(cur)) {
      const left = i - (boundaries.at(-1)?.at ?? 0);
      const right = words.length - i;
      if (left >= 3 && right >= 3) {
        boundaries.push({ at: i, reason: `trước "${cur}" nối hai ngữ đoạn dài` });
      }
      continue;
    }
    if (opensParticiplePhrase(cur, prev, bare(words[i + 1] ?? ""))) {
      boundaries.push({ at: i, reason: `trước phân từ "${cur}" mở cụm bổ nghĩa` });
      continue;
    }
  }

  return enforceLengths({ words, boundaries });
}

/** Gộp chunk quá ngắn, chẻ chunk quá dài. */
function enforceLengths(s: ChunkedSentence): ChunkedSentence {
  const { words } = s;
  let bounds = [...s.boundaries].sort((a, b) => a.at - b.at);

  // Bỏ ranh giới tạo ra chunk dưới MIN_CHUNK_WORDS, trừ chunk kết thúc câu
  const keep: Boundary[] = [];
  let start = 0;
  for (const b of bounds) {
    const len = b.at - start;
    const endsSentence = /[.!?]["')\]]?$/.test(words[b.at - 1] ?? "");
    if (len < MIN_CHUNK_WORDS && !endsSentence) continue;
    keep.push(b);
    start = b.at;
  }
  while (keep.length && words.length - keep[keep.length - 1].at < MIN_CHUNK_WORDS) keep.pop();
  bounds = keep;

  // Chunk ngắn mở đầu bằng từ nối ("that photography", "If you're") thì gộp
  // sang phải — từ nối phải dính với cụm nó dẫn vào.
  const edgesForMerge = [0, ...bounds.map((b) => b.at), words.length];
  const dropped = new Set<number>();
  for (let k = 0; k + 2 < edgesForMerge.length; k++) {
    const from = edgesForMerge[k];
    const to = edgesForMerge[k + 1];
    const nextTo = edgesForMerge[k + 2];
    if (to - from > MIN_CHUNK_WORDS) continue;
    if (/[,;:.!?]["')\]]?$/.test(words[to - 1] ?? "")) continue;
    const head = bare(words[from]);
    const leads =
      SUBORDINATORS.has(head) || COORDINATORS.has(head) || head === "that";
    if (!leads) continue;
    if (nextTo - from > MAX_CHUNK_WORDS) continue;
    dropped.add(to);
  }
  bounds = bounds.filter((b) => !dropped.has(b.at));

  // Chẻ chunk vượt MAX_CHUNK_WORDS tại chỗ hợp lý nhất gần giữa
  const edges = [0, ...bounds.map((b) => b.at), words.length];
  const extra: Boundary[] = [];
  for (let k = 0; k < edges.length - 1; k++) {
    const from = edges[k];
    const to = edges[k + 1];
    if (to - from <= MAX_CHUNK_WORDS) continue;
    const mid = Math.floor((from + to) / 2);
    let best = -1;
    for (let i = from + MIN_CHUNK_WORDS; i <= to - MIN_CHUNK_WORDS; i++) {
      const prev = bare(words[i - 1]);
      const cur = bare(words[i]);
      if (vetoed(prev, cur)) continue;
      const candidate =
        DETERMINERS.has(cur) || AUXILIARIES.has(cur) || cur === "it" || cur === "there";
      if (!candidate) continue;
      if (best === -1 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
    }
    if (best !== -1) extra.push({ at: best, reason: "chẻ cụm quá dài cho vừa một nhịp thở" });
  }

  return { words, boundaries: [...bounds, ...extra].sort((a, b) => a.at - b.at) };
}

/** Ghép lại thành mảng chuỗi chunk để hiển thị. */
export function toChunkTexts(s: ChunkedSentence): string[] {
  const edges = [0, ...s.boundaries.map((b) => b.at), s.words.length];
  const out: string[] = [];
  for (let k = 0; k < edges.length - 1; k++) {
    out.push(s.words.slice(edges[k], edges[k + 1]).join(" "));
  }
  return out;
}
