import type { P7QItem, P7QLesson, P7QType } from "./types";
import { mucDichCoBan, mucDichNangCao } from "./data/muc-dich";
import { notCoBan, notNangCao } from "./data/not";
import { tongHop } from "./data/tong-hop";
import { chiTietCoBan, chiTietNangCao } from "./data/chi-tiet";
import { indicatedCoBan, indicatedNangCao } from "./data/indicated";
import { suyLuanCoBan, suyLuanNangCao } from "./data/suy-luan";
import { doiTuongCoBan, doiTuongNangCao } from "./data/doi-tuong";

export const LESSONS: P7QLesson[] = [
  {
    slug: "muc-dich-co-ban",
    title: "Mục đích · Cơ bản",
    type: "muc-dich",
    level: "co-ban",
    description: "purpose / main purpose / one purpose / Why did X write",
    items: mucDichCoBan,
  },
  {
    slug: "muc-dich-nang-cao",
    title: "Mục đích · Nâng cao",
    type: "muc-dich",
    level: "nang-cao",
    description: "Bộ nhiều văn bản, mục đích không nằm ở câu đầu, most likely",
    items: mucDichNangCao,
  },
  {
    slug: "chi-tiet-co-ban",
    title: "Chi tiết · Cơ bản",
    type: "chi-tiet",
    level: "co-ban",
    description: "Wh- + thông tin cụ thể: ngày, giá, nơi chốn, lý do, yêu cầu",
    items: chiTietCoBan,
  },
  {
    slug: "chi-tiet-nang-cao",
    title: "Chi tiết · Nâng cao",
    type: "chi-tiet",
    level: "nang-cao",
    description: "be required of, be billed, suggest … do, câu điều kiện dài",
    items: chiTietNangCao,
  },
  {
    slug: "indicated-co-ban",
    title: "Indicated / True · Cơ bản",
    type: "indicated",
    level: "co-ban",
    description: "What is indicated / mentioned / true about X",
    items: indicatedCoBan,
  },
  {
    slug: "indicated-nang-cao",
    title: "Indicated / True · Nâng cao",
    type: "indicated",
    level: "nang-cao",
    description: "What does [văn bản] indicate about…, có phạm vi, mệnh đề bổ nghĩa",
    items: indicatedNangCao,
  },
  {
    slug: "not-co-ban",
    title: "NOT · Cơ bản",
    type: "not",
    level: "co-ban",
    description: "NOT mentioned / indicated / included, danh sách ngắn",
    items: notCoBan,
  },
  {
    slug: "not-nang-cao",
    title: "NOT · Nâng cao",
    type: "not",
    level: "nang-cao",
    description: "Câu dài, bị động, paraphrase, ghép 2 văn bản",
    items: notNangCao,
  },
  {
    slug: "suy-luan-co-ban",
    title: "Suy luận · Cơ bản",
    type: "suy-luan",
    level: "co-ban",
    description: "suggested / implied / concluded / most likely true / do next",
    items: suyLuanCoBan,
  },
  {
    slug: "suy-luan-nang-cao",
    title: "Suy luận · Nâng cao",
    type: "suy-luan",
    level: "nang-cao",
    description: "suggest about vs suggest … do, tính ngày tháng, ghép manh mối",
    items: suyLuanNangCao,
  },
  {
    slug: "doi-tuong-co-ban",
    title: "Đối tượng · Cơ bản",
    type: "doi-tuong",
    level: "co-ban",
    description: "For whom … intended / What kind of business / Who most likely is",
    items: doiTuongCoBan,
  },
  {
    slug: "doi-tuong-nang-cao",
    title: "Đối tượng · Nâng cao",
    type: "doi-tuong",
    level: "nang-cao",
    description: "In what field / industry, câu đảo, đoán danh tính từ email",
    items: doiTuongNangCao,
  },
  {
    slug: "tong-hop-1",
    title: "Tổng hợp 1",
    type: null,
    level: "co-ban",
    description: "Trộn Mục đích, NOT và câu Chi tiết có 'not' viết thường: có thêm bước nhận diện dạng",
    items: tongHop,
  },
];

/** Bài ôn câu sai: dựng động từ danh sách id, không có trong LESSONS */
export const REVIEW_SLUG = "on-tap";

export function getLesson(slug: string): P7QLesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

const ITEM_INDEX = new Map<string, { item: P7QItem; lesson: P7QLesson }>();
for (const lesson of LESSONS) for (const item of lesson.items) ITEM_INDEX.set(item.id, { item, lesson });

export function findItem(id: string) {
  return ITEM_INDEX.get(id);
}

/** Thẻ chiến lược hiện ở đầu bài theo dạng (tóm tắt từ docs/part7-question-strategies.md) */
export const TYPE_CARDS: Partial<Record<P7QType, { signs: string; how: string; traps: string[] }>> = {
  "muc-dich": {
    signs: "What is the (main / one) purpose of…? · Why did X write / send…? · What is … mainly about / discussing?",
    how: "S1: đọc tiêu đề + 2–3 câu đầu. Mở đầu bằng lời cảm ơn / giới thiệu bản thân thì đọc tiếp đến câu 'I am writing to… / Please… / I am looking for…'.",
    traps: [
      "one purpose = MỘT TRONG các mục đích → có thể nằm giữa bài, phải đối chiếu từng phương án (S3).",
      "Why did X send → X là người GỬI; đừng dịch thành người nhận.",
      "Phương án lấy chi tiết nhỏ cuối bài: đúng thông tin nhưng không phải mục đích.",
    ],
  },
  not: {
    signs: "NOT viết hoa: What is NOT mentioned / indicated / included / listed…? · đôi khi 'does not need to'.",
    how: "S3: tìm 3 phương án CÓ trong bài và gạch đi, còn lại là đáp án. Thông tin thường nằm trong danh sách, gạch đầu dòng hoặc một câu liệt kê.",
    traps: [
      "Từ của đáp án có xuất hiện trong bài nhưng nói về đối tượng / thời điểm khác (summer, Werribee…).",
      "Bài diễn đạt lại (paraphrase): Setting schedules = Establish construction schedules.",
      "'not' viết thường trong câu Why / What … about thường là câu Chi tiết, không phải dạng NOT.",
    ],
  },
};

/** Thứ tự dạng trên trang tổng quan */
export const TYPE_ORDER: P7QType[] = [
  "muc-dich",
  "chi-tiet",
  "indicated",
  "not",
  "suy-luan",
  "doi-tuong",
  "dong-nghia",
  "y-dinh",
  "dien-cau",
  "lien-ket",
];
