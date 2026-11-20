import type { P7QItem, P7QLesson, P7QType } from "./types";
import { mucDichCoBan, mucDichNangCao } from "./data/muc-dich";
import { notCoBan, notNangCao } from "./data/not";
import { tongHop, tongHop2, tongHop3 } from "./data/tong-hop";
import { chiTietCoBan, chiTietNangCao } from "./data/chi-tiet";
import { indicatedCoBan, indicatedNangCao } from "./data/indicated";
import { suyLuanCoBan, suyLuanNangCao } from "./data/suy-luan";
import { doiTuongCoBan, doiTuongNangCao } from "./data/doi-tuong";
import { dongNghiaCoBan, dongNghiaNangCao } from "./data/dong-nghia";
import { yDinhCoBan, yDinhNangCao } from "./data/y-dinh";
import { dienCauCoBan, dienCauNangCao } from "./data/dien-cau";
import { lienKetCoBan, lienKetNangCao } from "./data/lien-ket";

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
    slug: "dong-nghia-co-ban",
    title: "Đồng nghĩa · Cơ bản",
    type: "dong-nghia",
    level: "co-ban",
    description: "Từ quen nhưng nghĩa khác: points, space, solid, reflects…",
    items: dongNghiaCoBan,
  },
  {
    slug: "dong-nghia-nang-cao",
    title: "Đồng nghĩa · Nâng cao",
    type: "dong-nghia",
    level: "nang-cao",
    description: "just, last, meet, turn, function, driven: nghĩa phụ hay bị bẫy",
    items: dongNghiaNangCao,
  },
  {
    slug: "y-dinh-co-ban",
    title: "Ý định người viết · Cơ bản",
    type: "y-dinh",
    level: "co-ban",
    description: "Câu trả lời ngắn trong chat: Consider it done, You got it, I'll handle it…",
    items: yDinhCoBan,
  },
  {
    slug: "y-dinh-nang-cao",
    title: "Ý định người viết · Nâng cao",
    type: "y-dinh",
    level: "nang-cao",
    description: "Câu trích dẫn cần đọc lùi xa hơn 1 tin, nghĩa đen ≠ nghĩa thật",
    items: yDinhNangCao,
  },
  {
    slug: "dien-cau-co-ban",
    title: "Điền câu · Cơ bản",
    type: "dien-cau",
    level: "co-ban",
    description: "Từ móc nối rõ: This / She also / these / for instance",
    items: dienCauCoBan,
  },
  {
    slug: "dien-cau-nang-cao",
    title: "Điền câu · Nâng cao",
    type: "dien-cau",
    level: "nang-cao",
    description: "Móc nối bằng chủ đề: Alternatively, Otherwise, that capacity, câu chủ đề",
    items: dienCauNangCao,
  },
  {
    slug: "lien-ket-co-ban",
    title: "Liên kết · Cơ bản",
    type: "lien-ket",
    level: "co-ban",
    description: "Chìa khoá rõ: mã sản phẩm, giờ, ngày, giá, bộ phận",
    items: lienKetCoBan,
  },
  {
    slug: "lien-ket-nang-cao",
    title: "Liên kết · Nâng cao",
    type: "lien-ket",
    level: "nang-cao",
    description: "Ghép lý do, loại trừ ngày, văn bản không nêu tên / mã",
    items: lienKetNangCao,
  },
  {
    slug: "tong-hop-1",
    title: "Tổng hợp 1",
    type: null,
    level: "co-ban",
    description: "Trộn Mục đích, NOT và câu Chi tiết có 'not' viết thường: có thêm bước nhận diện dạng",
    items: tongHop,
  },
  {
    slug: "tong-hop-2",
    title: "Tổng hợp 2",
    type: null,
    level: "co-ban",
    description: "Trộn 9 dạng, mỗi dạng 1 câu điển hình",
    items: tongHop2,
  },
  {
    slug: "tong-hop-3",
    title: "Tổng hợp 3",
    type: null,
    level: "nang-cao",
    description: "Cặp dễ nhầm: suggest … do / suggested about, What is true / most likely true, just = only / exactly",
    items: tongHop3,
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
  "chi-tiet": {
    signs: "Wh- + thông tin cụ thể: When / Where / How much / Why does X… · What does X ask / offer / suggest sb to do · According to…",
    how: "S2: scan từ khoá nội dung (tên, số, ngày, danh từ chính), đọc kỹ 1–2 câu quanh đó. Đáp án thường là bản diễn đạt lại (paraphrase).",
    traps: [
      "ask / suggest / encourage sb to do: người yêu cầu ≠ người làm.",
      "Bị động: be required of, be billed, be done by X → X là người làm / chịu.",
      "Bài có nhiều ngày / giá / tên giống nhau: chỉ lấy đúng dòng của 🟩.",
    ],
  },
  indicated: {
    signs: "What is indicated / mentioned / stated / true about X? · What does the [văn bản] indicate about X?",
    how: "S3: scan X để khoanh vùng, rồi đối chiếu lần lượt từng phương án. Thông tin về X có thể rải rác nhiều chỗ.",
    traps: [
      "'What is true' (Indicated) khác 'What is most likely true' (Suy luận).",
      "Phương án đúng một nửa: đúng người nhưng sai số / sai thời điểm.",
      "X là người viết hoặc người nhận → thông tin về X nằm ở chữ 'I' hoặc 'you'.",
    ],
  },
  "suy-luan": {
    signs: "suggested / implied / concluded about X · most likely / probably · What will X do next?",
    how: "Có chi tiết cụ thể để dò → S2; chỉ 'about X' chung chung → S3. Đáp án không có nguyên văn, phải suy ra từ 1–2 câu.",
    traps: [
      "suggested ABOUT X = ngụ ý về X. Còn 'X suggest (that) sb do' = đề xuất → Chi tiết.",
      "Phương án suy diễn quá xa hoặc dùng từ tuyệt đối (always, only, all).",
      "do next → đọc câu CUỐI của người đó (I'll… / Let me…).",
    ],
  },
  "doi-tuong": {
    signs: "For whom is … (most likely) intended? · Who most likely is X? · What kind of business / In what industry…? · Where would … be found?",
    how: "Hỏi người đọc / loại doanh nghiệp → S1 (tiêu đề, lời chào, 2–3 câu đầu). Hỏi danh tính một người → S2 (scan tên, chức danh, việc được nhờ).",
    traps: [
      "intended for = dành CHO ai (người đọc), không phải ai viết.",
      "Tên công ty có chữ nghĩa thường (Covered Bridge, Financial…): đừng dịch theo nghĩa đen.",
      "Người gửi ≠ người nhận: xem kỹ dòng From / To.",
    ],
  },
  "dong-nghia": {
    signs: "The word \"…\" in paragraph n, line m, is closest in meaning to",
    how: "S5: đọc cả câu chứa từ, hiểu nghĩa theo ngữ cảnh, thay từng phương án vào. Không chọn theo nghĩa quen nhất.",
    traps: [
      "Luôn là từ đa nghĩa: just (only / exactly), last (previous), meet (satisfy), turn (gain)…",
      "Phương án sai thường là một nghĩa ĐÚNG của từ nhưng không hợp câu này.",
      "Nhìn từ đi kèm: meet the demand, turn a profit, corporate function.",
    ],
  },
  "y-dinh": {
    signs: "At [giờ], what does X (most likely) mean / imply when he writes, \"…\"?",
    how: "S4: tìm tin nhắn theo giờ, đọc tin NGAY TRƯỚC (câu trích dẫn đang trả lời điều gì) và tin ngay sau (phản ứng của người kia).",
    traps: [
      "Nghĩa đen ≠ nghĩa thật: 'Can you give me 45 minutes?' = để lát nữa tôi giúp.",
      "Đôi khi câu được trả lời nằm cách 2–3 tin (I saw those, That one is the best).",
      "it / that / those trong câu trích dẫn trỏ về thứ gì → đó là chìa khoá.",
    ],
  },
  "dien-cau": {
    signs: "In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong?",
    how: "S6: tìm từ móc nối trong câu cho sẵn (this / these / she / also / otherwise / for instance…), xác định nó trỏ về đâu, đặt câu ngay sau chỗ đó; đọc thử câu sau.",
    traps: [
      "Không có đại từ → móc bằng chủ đề (lương → phúc lợi; trực tiếp → Alternatively trực tuyến).",
      "Câu chủ đề ('The position features several duties…') đứng TRƯỚC câu liệt kê chi tiết.",
      "Đọc cả câu ĐỨNG SAU vị trí: mạch văn phải liền.",
    ],
  },
  "lien-ket": {
    signs: "Bộ 2–3 văn bản, câu hỏi không ghi phạm vi, có mã sản phẩm / ngày / giờ / người xuất hiện ở cả hai văn bản.",
    how: "S7: lấy chìa khoá ở văn bản 1 (tên, mã, giờ đi, loại khoá học…), dùng nó tra văn bản 2 (bảng, lịch, hoá đơn) để ra đáp án.",
    traps: [
      "Đáp án sai thường là con số / ngày CÓ trong bảng nhưng của dòng khác.",
      "Có phạm vi (In the first e-mail / According to the schedule) → thường KHÔNG cần ghép.",
      "Phải tự tính: ngày gửi + 'the very next day', tháng 11 + 'the following month'.",
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
