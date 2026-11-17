// Đường ngữ điệu cho phần Shadow, suy từ chữ theo luật nhấn âm.
//
// Luật hạt nhân giống nhánh Nói của Chunking (`lib/subskills/chunking/speak.ts`):
// mỗi cụm ý có đúng một đỉnh nhấn, rơi vào TỪ NỘI DUNG CUỐI của cụm. Các từ nội
// dung khác chỉ gợn nhẹ, từ chức năng nằm ở đáy. Hết câu thì xuống, riêng câu
// hỏi Yes/No thì lên. Không đo cao độ thật của audio: đường vẽ là khuôn để bắt
// chước, không phải bản ghi phổ.

export type Stress = "nucleus" | "minor" | "none";

export interface ProsodyWord {
  /** Từ hiển thị, giữ nguyên dấu câu, tách theo khoảng trắng của `content`. */
  text: string;
  stress: Stress;
  /** Độ cao mục tiêu 0..1 (0 = đáy, 1 = đỉnh). */
  level: number;
  /** Từ này kết thúc một cụm ý. */
  chunkEnd: boolean;
}

export interface Prosody {
  words: ProsodyWord[];
  ending: "rise" | "fall";
}

// Từ chức năng: mạo từ, giới từ, đại từ, trợ động từ dạng khẳng định, liên từ.
// Trợ động từ phủ định (don't, can't…) KHÔNG nằm đây — người bản xứ nhấn chúng.
const FUNCTION_WORDS = new Set(
  `a an the this that these those some any
  of to in on at by for from with about as into onto over under after before
  between through during without within than up off out around near across
  i me my mine you your yours he him his she her hers it its we us our ours they them their theirs
  myself yourself himself herself itself ourselves themselves
  i'm i've i'll i'd you're you've you'll you'd he's he'll he'd she's she'll she'd
  it's it'll we're we've we'll we'd they're they've they'll they'd that's there's here's what's let's
  am is are was were be been being do does did have has had having
  will would shall should can could may might must
  and or but so if because while when where who whom whose which what how why
  there not just to`.split(/\s+/)
);

// Mở đầu câu hỏi Yes/No (trợ động từ đứng đầu).
const YES_NO_OPENERS = new Set(
  `am is are was were do does did have has had will would shall should can could may might must
  isn't aren't wasn't weren't don't doesn't didn't haven't hasn't hadn't won't wouldn't
  shouldn't can't couldn't mightn't mustn't`.split(/\s+/)
);

// Liên từ mở cụm mới khi cụm trước đã đủ dài. Không có "that": hay là từ hạn định
// ("try that new restaurant"), cắt ở đó sẽ đặt sai đỉnh nhấn.
const CHUNK_OPENERS = new Set(["and", "but", "so", "because", "or", "while", "although", "though", "which", "when", "if"]);

// Trạng từ cuối cụm thường không nhận đỉnh: "hasn't MOVED yet", "me TOO" thì giữ (không có từ nội dung khác).
const WEAK_TAIL = new Set(["yet", "too", "either", "though", "then"]);
const MIN_CHUNK_WORDS = 4;

const LEVEL = { none: 0.22, minor: 0.5, nucleus: 0.92 } as const;

export function coreWord(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

function isContent(core: string): boolean {
  if (!core) return false;
  if (/\d/.test(core)) return true; // số luôn được nhấn
  return !FUNCTION_WORDS.has(core);
}

/** Tách từ hiển thị — cùng quy ước với chỉ số của `wordTimings`. */
export function splitDisplayWords(content: string): string[] {
  return content.trim().split(/\s+/).filter(Boolean);
}

export function analyzeProsody(content: string): Prosody {
  const texts = splitDisplayWords(content);
  const cores = texts.map(coreWord);
  const n = texts.length;

  // 1. Cắt cụm: sau dấu , ; : — và trước liên từ khi cụm đã ≥ MIN_CHUNK_WORDS.
  const chunkEnd = new Array<boolean>(n).fill(false);
  let run = 0;
  for (let i = 0; i < n; i++) {
    run++;
    const t = texts[i];
    const next = cores[i + 1];
    if (/[,;:—–]$/.test(t) || /[.!?]$/.test(t)) { chunkEnd[i] = true; run = 0; continue; }
    if (next && CHUNK_OPENERS.has(next) && run >= MIN_CHUNK_WORDS) { chunkEnd[i] = true; run = 0; }
  }
  if (n > 0) chunkEnd[n - 1] = true;

  // 2. Đỉnh nhấn: từ nội dung cuối mỗi cụm; cụm không có từ nội dung thì lấy từ cuối.
  const stress: Stress[] = cores.map((c) => (isContent(c) ? "minor" : "none"));
  let chunkStart = 0;
  for (let i = 0; i < n; i++) {
    if (!chunkEnd[i]) continue;
    let nucleus = -1;
    for (let j = i; j >= chunkStart; j--) if (stress[j] !== "none") { nucleus = j; break; }
    if (nucleus > chunkStart && WEAK_TAIL.has(cores[nucleus])) {
      for (let j = nucleus - 1; j >= chunkStart; j--) if (stress[j] !== "none") { nucleus = j; break; }
    }
    if (nucleus === -1) nucleus = i;
    stress[nucleus] = "nucleus";
    chunkStart = i + 1;
  }

  // 3. Kiểu kết câu.
  const trimmed = content.trim();
  const isQuestion = trimmed.endsWith("?");
  const yesNo = isQuestion && YES_NO_OPENERS.has(cores[0] ?? "") && !cores.includes("or");
  const ending: Prosody["ending"] = yesNo ? "rise" : "fall";

  // 4. Độ cao: hạ dần qua câu (declination) để đỉnh sau thấp hơn đỉnh đầu một chút.
  const words: ProsodyWord[] = texts.map((text, i) => {
    const decline = n > 1 ? 0.08 * (i / (n - 1)) : 0;
    return { text, stress: stress[i], level: Math.max(0.05, LEVEL[stress[i]] - decline), chunkEnd: chunkEnd[i] };
  });
  return { words, ending };
}
