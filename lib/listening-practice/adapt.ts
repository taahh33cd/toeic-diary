// Chuyển bộ luyện nghe CA sang shape FullTest để dùng lại nguyên bộ máy làm bài
// của /skills/full-tests (ExamScreen + ReviewPanel + scoreAttempt) thay vì dựng
// một màn làm bài thứ hai.
//
// Chỉ import type từ lib/full-tests — index.ts bên đó nạp 20 file JSON đề.
import type { FullTest, FullTestGroup, PartNumber } from "@/lib/full-tests/types";
import type { ListeningPart, PracticeQuestion, PracticeTest } from "./types";

/** Khoá lượt làm: kèm nguồn ("ca") để sau này thêm bộ đề khác không đụng nhau. */
export function practiceAttemptSlug(testNumber: number, part: ListeningPart): string {
  return `ca-test-${testNumber}-part${part}`;
}

/** Đọc ngược khoá lượt làm. Trả null nếu không đúng định dạng — route handler dùng để chặn slug bịa. */
export function parsePracticeAttemptSlug(
  slug: string,
): { testNumber: number; part: ListeningPart } | null {
  const m = /^ca-test-(\d+)-part([12])$/.exec(slug);
  if (!m) return null;
  return { testNumber: Number(m[1]), part: Number(m[2]) as ListeningPart };
}

/** Audio trong data là URL tuyệt đối, còn ExamScreen ghép `audioBase/audio` ⇒ tách đôi. */
function splitAudio(questions: PracticeQuestion[]): { base: string; name: (url: string) => string } {
  const sample = questions.find((q) => q.audio)?.audio ?? "";
  const cut = sample.lastIndexOf("/");
  return {
    base: cut > 0 ? sample.slice(0, cut) : "",
    name: (url) => url.slice(url.lastIndexOf("/") + 1),
  };
}

/**
 * Mỗi câu Part 1/2 là một nhóm riêng — giống hệt cách build_est2026.py sinh data
 * full test, nên UI hiển thị y như nhau:
 *   Part 1: transcript = 4 lựa chọn, prompt = null
 *   Part 2: transcript = null, prompt = câu hỏi
 * Cả hai đều showText = false ⇒ lúc làm bài chỉ có audio, chữ hiện khi xem lại.
 */
export function toFullTest(test: PracticeTest, part: ListeningPart): FullTest {
  const questions = test.questions.filter((q) => q.part === part);
  const audio = splitAudio(questions);

  const groups: FullTestGroup[] = questions.map((q) => ({
    part: part as PartNumber,
    questionStart: q.number,
    questionEnd: q.number,
    audio: q.audio ? audio.name(q.audio) : undefined,
    image: q.image,
    transcript: part === 1
      ? q.options.map((o) => `(${o.id}) ${o.text}`).join("\n")
      : null,
    keywords: [],
    questions: [{
      number: q.number,
      part: part as PartNumber,
      prompt: part === 2 ? q.prompt : null,
      options: Object.fromEntries(q.options.map((o) => [o.id, o.text])),
      showText: false,
      // Thiếu file audio gốc ⇒ không nghe được, loại khỏi mẫu số khi chấm.
      broken: !q.audio,
      answer: q.answer,
      explanation: null,
    }],
  }));

  const broken = questions.filter((q) => !q.audio).map((q) => q.number);

  return {
    examSlug: "ca",
    examTitle: "Luyện nghe theo part",
    testNumber: test.testNumber,
    slug: practiceAttemptSlug(test.testNumber, part),
    title: test.title,
    audioBase: audio.base,
    locked: false,
    lockReason: null,
    stats: {
      questions: questions.length,
      answered: questions.length - broken.length,
      missingAnswers: questions.filter((q) => !q.answer).map((q) => q.number),
      brokenQuestions: broken,
    },
    groups,
    warnings: [],
  };
}
