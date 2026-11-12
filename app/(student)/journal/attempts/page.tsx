import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/journal/paper/PageHeading";
import { describeAttemptGroups, loadAttemptHistory } from "@/lib/journal/attempts";
import { AttemptsClient, type ClientAttempt } from "./_attempts-client";

export const metadata = { title: "Kết quả luyện đề" };

export default async function AttemptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/journal/attempts");

  const items = await loadAttemptHistory(user.id);

  // Date không qua ranh giới server/client an toàn — đổi sang ISO, phía client
  // tự định dạng theo giờ Việt Nam.
  const payload: ClientAttempt[] = items.map((a) => ({
    id: a.id,
    kind: a.kind,
    status: a.status,
    groupKey: a.groupKey,
    groupLabel: a.groupLabel,
    testTitle: a.testTitle,
    testHref: a.testHref,
    modeLabel: a.modeLabel,
    correct: a.correct,
    gradable: a.gradable,
    total: a.total,
    answered: a.answered,
    atISO: a.at.toISOString(),
  }));

  // Tổng số đề mỗi dạng bài — phần "nên luyện gì tiếp" cần biết còn bao nhiêu
  // đề chưa làm. Catalog là JSON chỉ đọc được ở server.
  const groupMeta = describeAttemptGroups([...new Set(items.map((i) => i.groupKey))]);

  return (
    <div className="max-w-5xl mx-auto w-full">
      <PageHeading
        title="Kết quả luyện đề"
        note="Mọi lượt bạn đã làm ở khu Luyện đề. Bấm vào một lượt để xem lại từng câu, nghe lại audio."
      />
      <AttemptsClient items={payload} groupMeta={groupMeta} />
    </div>
  );
}
