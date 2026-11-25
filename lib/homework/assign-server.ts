/**
 * lib/homework/assign-server.ts — giao BTVN từ phía server (Admin SDK).
 *
 * Dùng cho: giao nháp từ giáo trình (bấm tay hoặc cron tự giao) và giao một
 * BTVN cho nhiều lớp/HV cùng lúc. Ghi đúng những chỗ trang lớp vẫn ghi ở
 * client: `classes/{id}/homework`, `students/{code}/homework`, chuông
 * `notifications/{code}`, và giao bộ thẻ trong BTVN (vocab_deck_assignments).
 *
 * Ghi theo kiểu upsert theo `hw.id`: giao lại cùng một BTVN thì cập nhật chứ
 * không nhân đôi, và HV thuộc hai lớp cùng nhận chỉ có một bản.
 */

import { prisma } from "@/lib/db/prisma";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push";
import type { ClassSession, Homework, HwItem } from "@/lib/firebase/types";
import { HW_SECTION_KEYS } from "./content";
import { shiftToSchedule } from "./schedule";

export type HwTarget = { type: "class" | "student"; id: string };

function asList(v: unknown): Homework[] {
  if (Array.isArray(v)) return v.filter(Boolean) as Homework[];
  if (v && typeof v === "object") return Object.values(v) as Homework[];
  return [];
}

/** Ghi đè bản có cùng id, chưa có thì thêm cuối. Trả true nếu là bản mới. */
async function upsertAt(path: string, hw: Homework): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db.ref(path).get();
  const list = asList(snap.val());
  const idx = list.findIndex((h) => h?.id === hw.id);
  if (idx === -1) list.push(hw);
  else list[idx] = hw;
  await db.ref(path).set(list);
  return idx === -1;
}

export async function readTarget(t: HwTarget): Promise<{
  weekdays: string[];
  members: string[];
  label: string;
}> {
  const db = getAdminDb();
  if (t.type === "class") {
    const snap = await db.ref(`classes/${t.id}`).get();
    const c = (snap.val() ?? {}) as { name?: string; members?: string[]; weeklySchedule?: ClassSession[] };
    return {
      weekdays: (c.weeklySchedule ?? []).map((s) => s.day),
      members: Array.isArray(c.members) ? c.members : Object.values(c.members ?? {}),
      label: c.name ?? t.id,
    };
  }
  const [stSnap, clsSnap] = await Promise.all([db.ref(`students/${t.id}`).get(), db.ref("classes").get()]);
  const st = (stSnap.val() ?? {}) as { name?: string; weeklySchedule?: ClassSession[] };
  // HV thuộc lớp thì học theo lịch lớp — giống mục "Lịch học cố định" ở trang HV.
  const classes = Object.values((clsSnap.val() ?? {}) as Record<string, { members?: string[]; weeklySchedule?: ClassSession[] }>);
  const own = classes.find((c) => (c.members ?? []).includes(t.id));
  const sched = own?.weeklySchedule ?? st.weeklySchedule ?? [];
  return { weekdays: sched.map((s) => s.day), members: [t.id], label: st.name ?? t.id };
}

async function assignDecks(hw: Homework, codes: string[], assignedBy: string) {
  const deckIds = new Set<string>();
  for (const k of HW_SECTION_KEYS) for (const it of (hw[k] as HwItem[] | undefined) ?? []) if (it.deckId) deckIds.add(it.deckId);
  if (deckIds.size === 0 || codes.length === 0) return;
  const due = new Date(`${hw.endDate ?? hw.date}T23:59:00+07:00`);
  for (const deckId of deckIds) {
    const deck = await prisma.vocabDeck.findUnique({ where: { id: deckId }, select: { id: true, visibility: true } });
    if (!deck) continue;
    // HV phải mở được link bộ thẻ.
    if (deck.visibility === "private") {
      await prisma.vocabDeck.update({ where: { id: deckId }, data: { visibility: "link" } });
    }
    for (const studentCode of codes) {
      await prisma.vocabDeckAssignment.upsert({
        where: { deckId_studentCode: { deckId, studentCode } },
        create: {
          id: `va${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          deckId,
          assignedBy,
          studentCode,
          activity: "study",
          minScore: 70,
          dueDate: due,
          homeworkId: hw.id,
        },
        update: { dueDate: due, homeworkId: hw.id },
      });
    }
  }
}

async function notify(codes: string[], hw: Homework, isNew: Map<string, boolean>) {
  const db = getAdminDb();
  const fresh = codes.filter((c) => isNew.get(c));
  if (fresh.length === 0) return;
  const now = new Date().toISOString();
  await Promise.allSettled(
    fresh.map((code, i) =>
      db.ref(`notifications/${code}/${Date.now() + i}`).set({
        type: "homework",
        title: "📚 Bài tập mới từ giáo viên!",
        body: hw.title ?? "Thầy vừa giao bài tập mới. Kiểm tra ngay nhé!",
        read: false,
        createdAt: now,
      }),
    ),
  );
  const profiles = await prisma.profile.findMany({
    where: { studentCode: { in: fresh } },
    select: { id: true },
  });
  await Promise.allSettled(
    profiles.map((p) =>
      sendPushToUser(p.id, {
        title: "📚 Bài tập mới từ thầy!",
        body: hw.title ? `Thầy vừa giao: ${hw.title}. Kiểm tra ngay nhé!` : "Thầy vừa giao bài tập mới. Vào journal để xem chi tiết!",
        url: "/journal",
      }),
    ),
  );
}

/**
 * Giao một BTVN cho một lớp hoặc một HV. `shift` = dời ngày theo lịch của đối
 * tượng (dùng khi giao hàng loạt từ một BTVN soạn cho lớp khác).
 * Trả về BTVN đúng như đã ghi.
 */
export async function assignHomework(
  target: HwTarget,
  hw: Homework,
  assignedBy: string,
  opts: { shift?: boolean } = {},
): Promise<{ hw: Homework; students: number }> {
  const info = await readTarget(target);
  let final = hw;
  if (opts.shift) {
    const { date, endDate } = shiftToSchedule(hw.date, hw.endDate, info.weekdays);
    final = { ...hw, date };
    delete final.endDate;
    if (endDate) final.endDate = endDate;
  }

  if (target.type === "class") await upsertAt(`classes/${target.id}/homework`, final);
  const isNew = new Map<string, boolean>();
  for (const code of info.members) {
    isNew.set(code, await upsertAt(`students/${code}/homework`, final));
  }
  await assignDecks(final, info.members, assignedBy).catch((e) =>
    console.error("[assignHomework decks]", e instanceof Error ? e.message : e),
  );
  await notify(info.members, final, isNew).catch(() => {});
  return { hw: final, students: info.members.length };
}
