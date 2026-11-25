import { redirect } from "next/navigation";

/** Danh sách bộ thẻ đã gộp vào trang Sổ từ vựng (tab Bộ thẻ). */
export default function DecksPage() {
  redirect("/journal/vocab?tab=decks");
}
