/**
 * lib/homework/drafts.ts — sinh nháp BTVN từ giáo trình + lịch học, và giao nháp.
 *
 * Nháp sinh cuốn chiếu: chỉ buổi nào sắp tới (trong `ahead` ngày) mới có nháp,
 * vì giáo trình không cố định — giáo viên còn sửa buổi sau. Mỗi lần làm mới:
 *   - nháp chưa giáo viên sửa → lấy lại nội dung mới nhất của buổi trong giáo trình;
 *   - nháp nào cũng được cập nhật ngày (đổi lịch, thêm ngày nghỉ thì tự lùi);
 *   - nháp đã giao / đã bỏ qua thì không đụng tới.
 */

import { prisma } from "@/lib/db/prisma";
import type { Homework } from "@/lib/firebase/types";
import { contentOf, toJson, type HwContent } from "./content";
import { assignHomework, readTarget } from "./assign-server";
import { lessonDates } from "./schedule";
import { vnTodayKey } from "./library";

export type Lesson = { id: string; topic: string; content: HwContent };

export function parseLessons(raw: unknown): Lesson[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l): l is Lesson => !!l && typeof (l as Lesson).id === "string")
    .map((l) => ({ id: l.id, topic: l.topic ?? "", content: contentOf(l.content ?? {}) }));
}

export function lessonTitle(no: number, topic: string): string {
  return topic.trim() ? `Buổi ${no} — ${topic.trim()}` : `Buổi ${no}`;
}

function addDays(key: string, n: number): string {
  return new Date(new Date(key + "T00:00:00Z").getTime() + n * 86_400_000).toISOString().slice(0, 10);
}

const OPEN = ["draft", "approved"];

/** Làm mới nháp cho các giáo trình đang chạy. Trả số nháp tạo mới. */
export async function refreshDrafts(
  opts: {
    runIds?: string[];
    ahead?: number;
    /** Đọc lịch tuần của lớp/HV — mặc định đọc RTDB; thay được khi chạy thử. */
    weekdaysOf?: (type: "class" | "student", id: string) => Promise<string[]>;
  } = {},
): Promise<number> {
  const weekdaysOf =
    opts.weekdaysOf ?? (async (type: "class" | "student", id: string) => (await readTarget({ type, id })).weekdays);
  const today = vnTodayKey();
  const until = addDays(today, opts.ahead ?? 10);
  const runs = await prisma.hwRun.findMany({
    where: { status: "active", ...(opts.runIds ? { id: { in: opts.runIds } } : {}) },
    include: { curriculum: { select: { lessons: true } }, drafts: true },
  });

  let created = 0;
  for (const run of runs) {
    const lessons = parseLessons(run.curriculum.lessons);
    let weekdays: string[] = [];
    try {
      weekdays = await weekdaysOf(run.targetType as "class" | "student", run.targetId);
    } catch (e) {
      console.error("[refreshDrafts] readTarget", run.id, e instanceof Error ? e.message : e);
      continue;
    }
    const dates = lessonDates({
      lessonCount: lessons.length,
      startDate: run.startDate,
      startLesson: run.startLesson,
      weekdays,
      skipDates: run.skipDates,
    });
    const byLesson = new Map(run.drafts.map((d) => [d.lessonId, d]));

    for (let k = 0; k < lessons.length; k++) {
      const lesson = lessons[k];
      const d = dates[k];
      const existing = byLesson.get(lesson.id);
      const no = k + 1;
      const title = lessonTitle(no, lesson.topic);

      if (!existing) {
        // Chỉ tạo nháp cho buổi sắp tới; buổi đã qua lúc gắn giáo trình thì thôi.
        if (!d || d.date > until || d.date < addDays(today, -1)) continue;
        await prisma.hwDraft.create({
          data: {
            runId: run.id,
            lessonId: lesson.id,
            lessonNo: no,
            date: d.date,
            endDate: d.endDate,
            title,
            content: toJson(lesson.content),
          },
        });
        created++;
        continue;
      }
      if (!OPEN.includes(existing.status) || !d) continue;
      const patch: Record<string, unknown> = {};
      if (existing.date !== d.date) patch.date = d.date;
      if ((existing.endDate ?? null) !== d.endDate) patch.endDate = d.endDate;
      if (existing.lessonNo !== no) patch.lessonNo = no;
      if (!existing.edited) {
        if (existing.title !== title) patch.title = title;
        if (JSON.stringify(existing.content) !== JSON.stringify(lesson.content)) patch.content = toJson(lesson.content);
      }
      if (Object.keys(patch).length) await prisma.hwDraft.update({ where: { id: existing.id }, data: patch });
    }

    // Buổi bị xoá khỏi giáo trình → bỏ nháp chưa sửa, chưa giao.
    const alive = new Set(lessons.map((l) => l.id));
    const orphans = run.drafts.filter((d) => !alive.has(d.lessonId) && OPEN.includes(d.status) && !d.edited);
    if (orphans.length) await prisma.hwDraft.deleteMany({ where: { id: { in: orphans.map((o) => o.id) } } });
  }
  return created;
}

/** Id BTVN cố định theo nháp → giao lại thì cập nhật, không nhân đôi. */
export function draftHomeworkId(draftId: string): string {
  return `hwd${draftId.replace(/-/g, "").slice(0, 16)}`;
}

/** Giao một nháp cho lớp/HV của nó. */
export async function assignDraft(draftId: string, assignedBy: string): Promise<{ students: number }> {
  const draft = await prisma.hwDraft.findUnique({ where: { id: draftId }, include: { run: true } });
  if (!draft) throw new Error("Không tìm thấy nháp");
  const content = contentOf((draft.content ?? {}) as HwContent);
  const hw: Homework = {
    id: draft.homeworkId ?? draftHomeworkId(draft.id),
    date: draft.date,
    ...(draft.endDate ? { endDate: draft.endDate } : {}),
    ...(draft.title ? { title: draft.title } : {}),
    ...content,
  };
  const res = await assignHomework(
    { type: draft.run.targetType as "class" | "student", id: draft.run.targetId },
    hw,
    assignedBy,
  );
  await prisma.hwDraft.update({
    where: { id: draft.id },
    data: { status: "assigned", homeworkId: hw.id, assignedAt: new Date() },
  });
  return { students: res.students };
}

/** Cron: giao các nháp đã duyệt của giáo trình bật "tự giao", tới ngày rồi. */
export async function autoAssignDue(): Promise<{ assigned: number; failed: number }> {
  await refreshDrafts();
  const today = vnTodayKey();
  const due = await prisma.hwDraft.findMany({
    where: { status: "approved", date: { lte: today }, run: { status: "active", autoAssign: true } },
    include: { run: { select: { createdBy: true } } },
  });
  let assigned = 0;
  let failed = 0;
  for (const d of due) {
    // Nội dung trống thì không giao — chờ giáo viên soạn.
    if (Object.keys(contentOf((d.content ?? {}) as HwContent)).length === 0) continue;
    try {
      await assignDraft(d.id, d.run.createdBy);
      assigned++;
    } catch (e) {
      failed++;
      console.error("[autoAssignDue]", d.id, e instanceof Error ? e.message : e);
    }
  }
  return { assigned, failed };
}
