/**
 * lib/roadmap/access.ts — ai được dùng khu Lộ trình.
 *
 * Quy tắc đã chốt (plan-roadmap-ai.md §15.1): tính năng dành cho học viên MỚI,
 * tức tài khoản tạo từ `FEATURE_LAUNCH_DATE` trở đi. Tài khoản cũ không thấy lối
 * vào, trừ khi được bật tay bằng cờ `Profile.roadmapEnabled`.
 *
 * Cố ý KHÔNG gắn vào `lib/access.ts` (freemium/khoá học): hai thứ trả lời hai
 * câu hỏi khác nhau — bên kia là "đã trả tiền chưa", bên này là "có thuộc nhóm
 * đang chạy thử không". Trộn vào nhau thì sau muốn mở cho tất cả lại phải gỡ
 * ngược logic tính phí.
 */

import { FEATURE_LAUNCH_DATE } from "./config";

export interface RoadmapAccessProfile {
  createdAt: Date;
  roadmapEnabled: boolean;
}

export function canUseRoadmap(
  profile: RoadmapAccessProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.roadmapEnabled) return true;
  // FEATURE_LAUNCH_DATE = null nghĩa là chưa mở cho ai ngoài người có cờ.
  if (FEATURE_LAUNCH_DATE === null) return false;
  return profile.createdAt.getTime() >= FEATURE_LAUNCH_DATE.getTime();
}

/** Câu giải thích cho người không có quyền — hiện trên trang, không phải 404. */
export const ROADMAP_CLOSED_MESSAGE =
  "Lộ trình học cá nhân hoá đang chạy thử với một nhóm học viên. Nhắn cho thầy nếu bạn muốn dùng thử.";
