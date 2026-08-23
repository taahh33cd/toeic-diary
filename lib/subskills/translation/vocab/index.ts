import type { TransLevelSlug, VocabEntry } from "../types";
import { cumDanhTuVocab } from "./cum-danh-tu";
import { tuDaNghiaVocab } from "./tu-da-nghia";
import { cumDongTuVocab } from "./cum-dong-tu";
import { thiVaThoiVocab } from "./thi-va-thoi";
import { biDongVocab } from "./bi-dong";
import { menhDeQuanHeVocab } from "./menh-de-quan-he";
import { danhTuHoaVocab } from "./danh-tu-hoa";
import { thamChieuVocab } from "./tham-chieu";
import { tuNoiVocab } from "./tu-noi";
import { sacThaiVocab } from "./sac-thai";
import { hamYVocab } from "./ham-y";

/**
 * Bộ từ vựng theo từng level, tách khỏi file data câu hỏi cho dễ bảo trì.
 * Nhóm nào chưa soạn thì màn học từ tự động bị bỏ qua (vào thẳng bài).
 */
export const TOPIC_VOCAB: Record<string, Partial<Record<TransLevelSlug, VocabEntry[]>>> = {
  "cum-danh-tu": cumDanhTuVocab,
  "tu-da-nghia": tuDaNghiaVocab,
  "cum-dong-tu": cumDongTuVocab,
  "thi-va-thoi": thiVaThoiVocab,
  "bi-dong": biDongVocab,
  "menh-de-quan-he": menhDeQuanHeVocab,
  "danh-tu-hoa": danhTuHoaVocab,
  "tham-chieu": thamChieuVocab,
  "tu-noi": tuNoiVocab,
  "sac-thai": sacThaiVocab,
  "ham-y": hamYVocab,
};

export function getLevelVocab(topicSlug: string, levelSlug: TransLevelSlug): VocabEntry[] {
  return TOPIC_VOCAB[topicSlug]?.[levelSlug] ?? [];
}
