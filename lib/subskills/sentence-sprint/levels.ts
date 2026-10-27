import type { SprintLevel } from "./types";

// Thang 5 cấp cho mỗi nhánh. Hai nhánh đi song song trên CÙNG bộ từ: cấp 1-3
// dựng câu có khung đỡ, cấp 4-5 bỏ khung — tự nghĩ ra câu trong thời gian ép.
//
// Đồng hồ không phải để trang trí. Vấn đề của học viên là độ trễ, nên mỗi cấp
// đặt mức thời gian vừa đủ cho người đã thuộc từ, và hết giờ là nộp nguyên
// trạng — y như lúc thi Speaking không ai chờ mình nghĩ thêm.

export const SPRINT_LEVELS: SprintLevel[] = [
  // ── Nhánh Viết ─────────────────────────────────────────────────────────────
  {
    branch: "viet",
    slug: "l1",
    name: "Điền đúng dạng",
    goal: "Biết từ đi với cấu trúc nào và phải chia ra dạng gì",
    instruction:
      "Gõ dạng đúng của từ cho sẵn vào chỗ trống. Nhớ nghĩa thôi chưa đủ — sai dạng là câu sai.",
    kind: "frame",
    passThreshold: 80,
    count: 8,
    seconds: 25,
  },
  {
    branch: "viet",
    slug: "l2",
    name: "Câu nào dùng đúng",
    goal: "Nhận ra ngay cách dùng sai mà mình vẫn hay viết",
    instruction:
      "Ba câu đều dùng từ đó, chỉ một câu đúng. Hai câu kia là lỗi học viên hay mắc — chọn rồi đọc lý do.",
    kind: "pick",
    passThreshold: 80,
    count: 8,
    seconds: 25,
  },
  {
    branch: "viet",
    slug: "l3",
    name: "Ghép câu nhanh",
    goal: "Dựng được trật tự câu mà không phải nghĩ lâu",
    instruction:
      "Bấm các mảnh theo đúng thứ tự để thành câu. Bấm lại mảnh đã chọn để bỏ ra.",
    kind: "order",
    passThreshold: 80,
    count: 6,
    seconds: 35,
  },
  {
    branch: "viet",
    slug: "l4",
    name: "Tự viết 1 câu",
    goal: "Tự ra câu với từ cho sẵn, đúng tình huống, trong 45 giây",
    instruction:
      "Viết MỘT câu dùng từ cho sẵn, khớp tình huống. AI chấm 4 tiêu chí: dùng đúng từ, đúng ngữ pháp, khớp tình huống, tự nhiên.",
    kind: "write-one",
    passThreshold: 70,
    count: 5,
    seconds: 45,
  },
  {
    branch: "viet",
    slug: "l5",
    name: "Viết với 2–3 từ",
    goal: "Gói nhiều từ vào một câu gọn thay vì viết rời rạc",
    instruction:
      "Dùng HẾT các từ cho sẵn trong 1–2 câu. Thiếu một từ là mất điểm phần dùng từ.",
    kind: "write-combo",
    passThreshold: 70,
    count: 4,
    seconds: 75,
  },

  // ── Nhánh Nói ──────────────────────────────────────────────────────────────
  {
    branch: "noi",
    slug: "l1",
    name: "Nói trọn câu từ khuôn",
    goal: "Chuyển khuôn trên giấy thành câu nói liền mạch",
    instruction:
      "Khuôn có chỗ trống. Đừng gõ — nói to TRỌN câu đã điền. Bản thu được chuyển thành chữ rồi so với câu đúng.",
    kind: "speak-frame",
    passThreshold: 70,
    count: 5,
    seconds: 15,
    thinkSeconds: 5,
  },
  {
    branch: "noi",
    slug: "l2",
    name: "Thấy từ là bật câu",
    goal: "Rút độ trễ từ lúc thấy từ đến lúc ra câu xuống dưới 5 giây",
    instruction:
      "Chỉ có một từ. Nghĩ 5 giây rồi nói một câu bất kỳ dùng từ đó — đúng và trôi là đạt, không cần hay.",
    kind: "speak-word",
    passThreshold: 70,
    count: 5,
    seconds: 15,
    thinkSeconds: 5,
  },
  {
    branch: "noi",
    slug: "l3",
    name: "Nói theo tình huống",
    goal: "Ra câu đúng vai, đúng việc — như Q5-7 Speaking",
    instruction:
      "Có tình huống cụ thể. Nói một câu dùng từ cho sẵn mà người trong tình huống đó thật sự sẽ nói.",
    kind: "speak-situation",
    passThreshold: 70,
    count: 5,
    seconds: 20,
    thinkSeconds: 8,
  },
  {
    branch: "noi",
    slug: "l4",
    name: "Nhồi nhiều từ vào 1 câu",
    goal: "Nối hai ý trong một câu thay vì nói hai câu cụt",
    instruction:
      "2–3 từ, một câu. Phải dùng hết các từ mà câu vẫn nghe được.",
    kind: "speak-two",
    passThreshold: 70,
    count: 4,
    seconds: 25,
    thinkSeconds: 10,
  },
  {
    branch: "noi",
    slug: "l5",
    name: "Chuỗi 3 câu",
    goal: "Nói liền mạch 2–3 câu quanh một tình huống, không đứt giữa",
    instruction:
      "Ba từ, nói liền 2–3 câu theo tình huống. Chấm cả việc các câu có dính vào nhau hay không.",
    kind: "speak-chain",
    passThreshold: 70,
    count: 3,
    seconds: 35,
    thinkSeconds: 15,
  },
];

export const BRANCHES: Record<"viet" | "noi", { label: string; emoji: string; blurb: string }> = {
  viet: {
    label: "Nhánh Viết",
    emoji: "✍️",
    blurb: "Gõ câu trong thời gian ép — dùng cho Writing Q1-5 và thói quen viết email",
  },
  noi: {
    label: "Nhánh Nói",
    emoji: "🗣",
    blurb: "Ghi âm rồi chuyển thành chữ để chấm — dùng cho Speaking Q5-7 và Q11",
  },
};
