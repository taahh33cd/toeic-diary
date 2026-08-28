// Dựng dữ liệu danh sách bộ đề cho các unit Speaking chỉ có chữ + audio
// (Q1-2, Q5-7, Q11). Tách khỏi trang để trang route gọn và dễ thêm unit mới.

import type { UnitListGroup } from "@/components/skills/exam/SpeakingUnitList";
import { Q12_TESTS } from "./speaking-q1-2";
import { Q57_CATEGORIES, Q57_TESTS } from "./speaking-q5-7";
import { Q11_FORMS, Q11_TESTS } from "./speaking-q11";

const Q57_COLOR: Record<string, string> = {
  life: "#0891b2",
  media: "#7c3aed",
  shopping: "#c2410c",
  tech: "#1e419a",
  travel: "#0d9488",
  living: "#a16207",
};

const Q11_COLOR: Record<string, string> = {
  agree_disagree: "#1e419a",
  choice_2: "#0d9488",
  open_q: "#7c3aed",
  policy: "#c2410c",
};

export function q12Groups(): UnitListGroup[] {
  return [
    {
      id: "all",
      label: "Đọc to đoạn văn",
      labelEn: "Read a text aloud",
      hint:
        "Chấm ở phát âm, trọng âm và ngữ điệu — nội dung không tính điểm. Đọc chậm hơn bình thường một chút, ngắt đúng dấu câu.",
      color: "#1e419a",
      tests: Q12_TESTS.map((t) => ({
        slug: t.slug,
        tag: t.label,
        title: t.texts.map((x) => x.genreVi).join(" · "),
        subtitle: t.note ?? `${t.texts.length} bài đọc · mỗi bài 45 giây chuẩn bị, 45 giây đọc`,
        free: t.free ?? false,
      })),
    },
  ];
}

export function q57Groups(): UnitListGroup[] {
  return Q57_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    labelEn: c.labelEn,
    hint: c.hint,
    color: Q57_COLOR[c.id] ?? "#1e419a",
    tests: Q57_TESTS.filter((t) => t.category === c.id).map((t) => ({
      slug: t.slug,
      tag: `Đề ${t.index}`,
      title: t.topicVi,
      subtitle: t.topic,
      free: t.free,
    })),
  }));
}

export function q11Groups(): UnitListGroup[] {
  return Q11_FORMS.map((f) => ({
    id: f.id,
    label: f.label,
    labelEn: f.labelEn,
    hint: f.hint,
    color: Q11_COLOR[f.id] ?? "#1e419a",
    tests: Q11_TESTS.filter((t) => t.form === f.id).map((t) => ({
      slug: t.slug,
      tag: `Đề ${t.index}`,
      title: t.topicVi,
      free: t.free,
    })),
  }));
}
