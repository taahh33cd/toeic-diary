import { redirect } from "next/navigation";

/** Thư viện bộ mẫu đã gộp vào trang Sổ từ vựng (tab Thư viện). */
export default function LibraryPage() {
  redirect("/journal/vocab?tab=library");
}
