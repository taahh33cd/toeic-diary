// Kiểu dùng chung của engine chấm bài.

import type { Annotation, FeedbackItem } from "@/lib/submissions";

/** Kết quả chấm một câu: điểm + nhận xét, kèm các chỗ tô trong bài. */
export interface GradedItem {
  feedback: FeedbackItem;
  annotations: Annotation[];
}
