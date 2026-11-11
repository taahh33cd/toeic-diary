// Engine chấm bài Speaking/Writing bằng AI.
//
// Một cửa duy nhất: `gradeSubmission()` nhận bản nộp đã lưu trong DB và trả về
// đúng khuôn `SubmissionFeedback` mà sổ tay học viên và trang chấm của giáo
// viên đang dùng — nên bài AI chấm và bài thầy chấm hiển thị y như nhau, và
// thầy mở ra sửa được tiếp.
//
// Thêm part mới = thêm một hàm `grade<Part>()` rồi cắm vào `switch` dưới đây,
// cộng một dòng trong AI_GRADABLE_UNITS (lib/submissions) để client biết part
// đó có AI chấm.

import {
  baseUnit,
  type SubmissionFeedback,
  type SubmissionItem,
} from "@/lib/submissions";
import { gradeSpeakingQ12 } from "./speaking/q1-2";
import { gradeSpeakingQ57 } from "./speaking/q5-7";
import { gradeWritingQ15 } from "./writing-q1-5";
import { gradeWritingQ67 } from "./writing-q6-7";
import { gradeWritingQ8 } from "./writing-q8";
import type { GradedItem } from "./types";

export { aiConfigured } from "./json";

export interface GradeInput {
  skill: string;
  unit: string;
  testKey: string;
  items: SubmissionItem[];
}

/** `null` = part này chưa có AI chấm, caller để nguyên cho giáo viên. */
export async function gradeSubmission(input: GradeInput): Promise<SubmissionFeedback | null> {
  const unit = baseUnit(input.skill, input.unit);

  let graded: GradedItem[];
  if (input.skill === "writing" && unit === "q1-5") {
    graded = await gradeWritingQ15(input.testKey, input.items);
  } else if (input.skill === "writing" && unit === "q6-7") {
    graded = await gradeWritingQ67(input.testKey, input.items);
  } else if (input.skill === "writing" && unit === "q8") {
    graded = await gradeWritingQ8(input.testKey, input.items);
  } else if (input.skill === "speaking" && unit === "q1-2") {
    graded = await gradeSpeakingQ12(input.testKey, input.items);
  } else if (input.skill === "speaking" && unit === "q5-7") {
    graded = await gradeSpeakingQ57(input.testKey, input.items);
  } else {
    return null;
  }

  if (graded.length === 0) return null;

  // Không ghi `overall`: sổ tay đã có nhãn "AI chấm · điểm ước tính" trên mỗi
  // bài, còn ô nhận xét chung để trống cho thầy viết khi soát lại.
  return {
    items: graded.map((g) => g.feedback),
    annotations: graded.flatMap((g) => g.annotations),
    by: "ai",
  };
}
