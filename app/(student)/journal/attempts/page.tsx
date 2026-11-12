import { redirect } from "next/navigation";

/**
 * Trang "Luyện đề" cũ đã gộp vào trang Kết quả (/journal/scores).
 * Giữ route để link/bookmark cũ vẫn chạy; trang xem lại từng lượt
 * (/journal/attempts/[id]) vẫn ở đây.
 */
export default function AttemptsPage() {
  redirect("/journal/scores");
}
