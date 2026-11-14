import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { describeAttemptGroups, loadAttemptHistory, toClientAttempt } from "@/lib/journal/attempts";
import { ScoresClient } from "./_scores-client";
import type { ClientAttempt, GroupMeta } from "@/components/results/ResultsParts";

export const metadata = { title: "Kết quả" };

/**
 * Trang Kết quả: điểm thi thật (nhập tay, đọc từ Firebase ở client) + mọi lượt
 * làm bài ở khu Luyện đề (Postgres, nạp ở đây). Nhật ký lỗi và Paraphrase dùng
 * chung route qua ?tab= — hai mục đó không cần lịch sử luyện đề nên bỏ qua.
 */
export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  const needAttempts = tab !== "errorlog" && tab !== "paraphrase";

  let attempts: ClientAttempt[] | null = null;
  let groupMeta: GroupMeta[] = [];
  let attemptsError = false;

  if (needAttempts) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login?next=/journal/scores");

    try {
      const items = await loadAttemptHistory(user.id);
      attempts = items.map(toClientAttempt);
      // Tổng số đề mỗi dạng bài — "nên luyện gì tiếp" cần biết còn bao nhiêu đề
      // chưa làm. Catalog là JSON chỉ đọc được ở server.
      groupMeta = describeAttemptGroups([...new Set(items.map((i) => i.groupKey))]);
    } catch (err) {
      // Lỗi DB không được làm sập cả trang: điểm thi thật vẫn xem/nhập được.
      console.error("[journal/scores] loadAttemptHistory failed", err);
      attempts = [];
      attemptsError = true;
    }
  }

  return <ScoresClient attempts={attempts} groupMeta={groupMeta} attemptsError={attemptsError} />;
}
