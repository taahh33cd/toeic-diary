import type { TransLevel, TransLevelSlug, TransTopicConfig, BestScore } from "./types";
export { buildLevelMeta } from "./levels";
import { cumDanhTuLevels } from "./data/cum-danh-tu";
import { tuDaNghiaLevels } from "./data/tu-da-nghia";
import { cumDongTuLevels } from "./data/cum-dong-tu";
import { thiVaThoiLevels } from "./data/thi-va-thoi";
import { biDongLevels } from "./data/bi-dong";
import { menhDeQuanHeLevels } from "./data/menh-de-quan-he";
import { danhTuHoaLevels } from "./data/danh-tu-hoa";
import { thamChieuLevels } from "./data/tham-chieu";
import { tuNoiLevels } from "./data/tu-noi";
import { sacThaiLevels } from "./data/sac-thai";
import { hamYLevels } from "./data/ham-y";
import { getLevelVocab } from "./vocab";

export { getLevelVocab } from "./vocab";

// ── Danh mục 11 nhóm vấn đề ──────────────────────────────────────────────────

export type TransTopicMeta = Omit<TransTopicConfig, "levels"> & {
  available: boolean;
};

export const TOPIC_METAS: TransTopicMeta[] = [
  {
    slug: "cum-danh-tu",
    name: "Cụm danh từ dài",
    nameEn: "Long Noun Phrases",
    problem:
      "Tiếng Anh chồng bổ ngữ TRƯỚC danh từ chính, tiếng Việt để bổ ngữ SAU — dịch tuyến tính là câu vỡ ngay.",
    principle:
      "Tìm danh từ chính trước, dịch nó ra đầu, rồi lần ngược các bổ ngữ từ gần ra xa.",
    sample: {
      en: "the recently revised employee travel expense policy",
      wrong: "cái gần đây được sửa nhân viên đi lại chi phí chính sách",
      right: "chính sách chi phí đi lại của nhân viên vừa được sửa đổi gần đây",
    },
    importance: 3,
    part7: true,
    available: true,
  },
  {
    slug: "tu-da-nghia",
    name: "Từ đa nghĩa",
    nameEn: "Polysemy in Context",
    problem:
      "Một từ tiếng Anh mang nhiều nghĩa, học sinh chỉ nhớ nghĩa số 1 trong từ điển rồi áp vào mọi câu.",
    principle:
      "Nghĩa nằm ở ngữ cảnh, không nằm trong từ. Nhìn từ đi kèm để chọn nghĩa.",
    sample: {
      en: "We will address the issue at the next meeting.",
      wrong: "Chúng tôi sẽ địa chỉ vấn đề ở cuộc họp tới.",
      right: "Chúng tôi sẽ giải quyết vấn đề này trong cuộc họp tới.",
    },
    importance: 3,
    part7: true,
    available: true,
  },
  {
    slug: "cum-dong-tu",
    name: "Phrasal verb & collocation",
    nameEn: "Phrasal Verbs & Collocations",
    problem:
      "Nghĩa của cụm không cộng dồn từ các từ thành phần — dịch tách rời là sai hoàn toàn.",
    principle: "Nhận ra cụm trước khi tra từ. Cụm là một đơn vị nghĩa.",
    sample: {
      en: "The workshop has been called off.",
      wrong: "Buổi workshop đã được gọi tắt.",
      right: "Buổi workshop đã bị huỷ.",
    },
    importance: 3,
    part7: false,
    available: true,
  },
  {
    slug: "thi-va-thoi",
    name: "Thì & thời gian",
    nameEn: "Tense & Time Reference",
    problem:
      "Tiếng Việt không chia động từ, thông tin thời gian dễ bị bỏ rơi hoặc bị nhét thừa 'đã/đang'.",
    principle:
      "Xác định mốc thời gian trước, rồi mới chọn đã / đang / sẽ / vừa / rồi — hoặc không cần gì cả.",
    sample: {
      en: "She has worked here since 2019.",
      wrong: "Cô ấy đã làm việc ở đây từ năm 2019.",
      right: "Cô ấy làm ở đây từ năm 2019 đến giờ.",
    },
    importance: 3,
    part7: false,
    available: true,
  },
  {
    slug: "bi-dong",
    name: "Bị động",
    nameEn: "Passive Voice",
    problem:
      "'được' và 'bị' mang sắc thái tốt–xấu, không phủ hết bị động tiếng Anh; nhiều câu phải dịch chủ động.",
    principle:
      "Hỏi: việc này tốt hay xấu với người nhận? Có cần nêu người thực hiện không? Rồi mới chọn được / bị / chủ động.",
    sample: {
      en: "Applicants will be notified by Friday.",
      wrong: "Người nộp đơn sẽ bị thông báo trước thứ Sáu.",
      right: "Chúng tôi sẽ thông báo cho ứng viên trước thứ Sáu.",
    },
    importance: 3,
    part7: false,
    available: true,
  },
  {
    slug: "menh-de-quan-he",
    name: "Mệnh đề quan hệ",
    nameEn: "Relative Clauses",
    problem:
      "Tiếng Việt không có mệnh đề quan hệ — nhồi hết vào một câu bằng 'mà' là câu nghẹt thở.",
    principle: "Mệnh đề không xác định thì tách thành câu riêng, đừng cố nhét bằng 'mà'.",
    sample: {
      en: "The policy, which takes effect on June 1, applies to all staff.",
      wrong: "Chính sách mà có hiệu lực vào ngày 1/6 áp dụng cho toàn bộ nhân viên.",
      right: "Chính sách này áp dụng cho toàn bộ nhân viên và có hiệu lực từ ngày 1/6.",
    },
    importance: 2,
    part7: true,
    available: true,
  },
  {
    slug: "danh-tu-hoa",
    name: "Danh từ hoá",
    nameEn: "Nominalization",
    problem:
      "Văn phong công sở tiếng Anh đầy danh từ trừu tượng; giữ nguyên khi dịch là câu Việt khô cứng.",
    principle: "Trả danh từ trừu tượng về động từ: 'the implementation of' → 'việc triển khai'.",
    sample: {
      en: "The implementation of the new system caused a delay.",
      wrong: "Sự thực thi của hệ thống mới đã gây ra một sự trì hoãn.",
      right: "Việc triển khai hệ thống mới làm chậm tiến độ.",
    },
    importance: 2,
    part7: true,
    available: true,
  },
  {
    slug: "tham-chieu",
    name: "Tham chiếu",
    nameEn: "Reference & Anaphora",
    problem:
      "it / they / this / such thay cho cái gì? Xác định sai là hiểu sai cả đoạn — và mất điểm câu hỏi 'refers to'.",
    principle: "Mỗi đại từ phải chỉ được ra một danh từ cụ thể trước đó. Tiếng Việt thường lặp lại danh từ.",
    sample: {
      en: "The vendor missed two deadlines. This prompted a review of the contract.",
      wrong: "Nhà cung cấp lỡ hai hạn chót. Điều này đã thúc đẩy một sự xem xét hợp đồng.",
      right: "Nhà cung cấp trễ hai lần. Vì vậy công ty phải rà soát lại hợp đồng.",
    },
    importance: 3,
    part7: true,
    available: true,
  },
  {
    slug: "tu-noi",
    name: "Từ nối & quan hệ logic",
    nameEn: "Connectors & Logic",
    problem: "Dịch nhầm một từ nối là đảo ngược ý cả đoạn.",
    principle: "Từ nối chỉ hướng đi của lập luận: cùng chiều, ngược chiều, hay hệ quả?",
    sample: {
      en: "The venue is small; nevertheless, we will proceed as planned.",
      wrong: "Địa điểm nhỏ; tuy nhiên chúng tôi sẽ tiến hành như kế hoạch.",
      right: "Địa điểm hơi nhỏ, nhưng chúng tôi vẫn tổ chức đúng kế hoạch.",
    },
    importance: 2,
    part7: true,
    available: true,
  },
  {
    slug: "sac-thai",
    name: "Sắc thái & lịch sự",
    nameEn: "Modality & Politeness",
    problem:
      "may / should / would appreciate mang mức độ khác nhau; dịch phẳng thành 'sẽ, có thể' là mất thái độ người viết.",
    principle: "Dịch hành động lời nói, không dịch mặt chữ: đây là đề nghị, nhắc nhở hay bắt buộc?",
    sample: {
      en: "We would appreciate it if you could confirm by Thursday.",
      wrong: "Chúng tôi sẽ đánh giá cao nếu bạn có thể xác nhận trước thứ Năm.",
      right: "Mong quý vị xác nhận giúp trước thứ Năm.",
    },
    importance: 2,
    part7: true,
    available: true,
  },
  {
    slug: "ham-y",
    name: "Hàm ý",
    nameEn: "Implication",
    problem:
      "Câu chữ lịch sự che một hành động khác: từ chối, phàn nàn, nhắc nợ. Đây đúng là chỗ mất điểm câu suy luận Part 7.",
    principle: "Sau khi dịch xong, hỏi thêm: người viết thực ra đang làm gì?",
    sample: {
      en: "We are unable to process your request at this time.",
      wrong: "Chúng tôi không thể xử lý yêu cầu của bạn vào lúc này.",
      right: "Chúng tôi xin từ chối yêu cầu này (ít nhất là ở thời điểm hiện tại).",
    },
    importance: 3,
    part7: true,
    available: true,
  },
];

// ── Data đã có ───────────────────────────────────────────────────────────────

const TOPIC_LEVELS: Record<string, TransLevel[]> = {
  "cum-danh-tu": cumDanhTuLevels,
  "tu-da-nghia": tuDaNghiaLevels,
  "cum-dong-tu": cumDongTuLevels,
  "thi-va-thoi": thiVaThoiLevels,
  "bi-dong": biDongLevels,
  "menh-de-quan-he": menhDeQuanHeLevels,
  "danh-tu-hoa": danhTuHoaLevels,
  "tham-chieu": thamChieuLevels,
  "tu-noi": tuNoiLevels,
  "sac-thai": sacThaiLevels,
  "ham-y": hamYLevels,
};

export function getTopicMeta(slug: string): TransTopicMeta | null {
  return TOPIC_METAS.find((t) => t.slug === slug) ?? null;
}

export function getTopicConfig(slug: string): TransTopicConfig | null {
  const meta = getTopicMeta(slug);
  const levels = TOPIC_LEVELS[slug];
  if (!meta || !levels) return null;
  const { available: _available, ...rest } = meta;
  // Gắn bộ từ vựng của từng level (nhóm chưa soạn thì mảng rỗng)
  return {
    ...rest,
    levels: levels.map((l) => ({ ...l, vocab: getLevelVocab(slug, l.slug) })),
  };
}

// ── Mở khoá level ────────────────────────────────────────────────────────────

const UNLOCK_REQ: Record<TransLevelSlug, TransLevelSlug | null> = {
  l1: null,
  l2: "l1",
  l3: "l2",
  l4: "l3",
  l5: "l4",
  l6: "l5",
};

export function isLevelUnlocked(
  levelSlug: TransLevelSlug,
  best: Record<string, BestScore>,
  isTestUser: boolean,
): boolean {
  if (isTestUser) return true;
  const req = UNLOCK_REQ[levelSlug];
  if (!req) return true;
  return best[req]?.passed === true;
}
