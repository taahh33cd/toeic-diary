import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { onValueCreated, onValueWritten } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as webpush from "web-push";

// ── Firebase Admin init ───────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    databaseURL:
      "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app",
  });
}

function db() {
  return getDatabase();
}

// ── VAPID setup ───────────────────────────────────────────────────────────────
/** Convert any base64 / base64url variant to unpadded base64url */
function toBase64Url(s: string): string {
  return s.trim()           // remove accidental whitespace / newlines
    .replace(/\+/g, "-")   // standard base64 → base64url
    .replace(/\//g, "_")   // standard base64 → base64url
    .replace(/=/g, "");    // remove padding
}

function setupVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = toBase64Url(process.env.VAPID_PUBLIC_KEY ?? "");
  const privateKey = toBase64Url(process.env.VAPID_PRIVATE_KEY ?? "");
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID env vars not set");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// secrets v7
const SECRETS: string[] = ["VAPID_SUBJECT", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"];
const REGION = "asia-southeast1";
const DB_INSTANCE = "quanlyhocvien-b1796-default-rtdb";

// ── Helper: is subscription permanently dead? (purge it) ─────────────────────
// ONLY 410 (Gone) / 404 (Not Found) mean the subscription itself is revoked/expired.
// 401/403 and 400+VapidPkHashMismatch are VAPID *server-key* problems — the
// subscription is still valid, our signing key was wrong. Deleting on those was a
// bug: a transient key mismatch (e.g. during key rotation) permanently nuked live
// subscriptions, so admin pushes silently stopped reaching those devices. Fix the
// key instead; never purge the sub for an auth/config error.
function isDeadSubscription(err: { statusCode?: number; body?: string }): boolean {
  return err.statusCode === 410 || err.statusCode === 404;
}

// ── Helper: push to all subs under pushSubs/{uid}/subs/* ─────────────────────
async function sendToUidSubs(uid: string, payload: object): Promise<void> {
  const snap = await db().ref(`pushSubs/${uid}/subs`).get();
  if (!snap.exists()) return;

  const payloadStr = JSON.stringify(payload);
  const promises: Promise<unknown>[] = [];

  snap.forEach((child) => {
    const raw = child.val() as string | null;
    if (!raw) return;
    try {
      const sub = JSON.parse(raw) as webpush.PushSubscription;
      const endpoint = (sub as { endpoint?: string }).endpoint ?? "";
      promises.push(
        webpush.sendNotification(sub, payloadStr).catch(async (err: { statusCode?: number; message?: string; body?: string }) => {
          console.error(`[push/uid=${uid}] status=${err.statusCode} ep=...${String(endpoint).slice(-30)}`, err.message);
          if (isDeadSubscription(err)) {
            await child.ref.remove().catch(() => undefined);
          }
        })
      );
    } catch {
      // malformed JSON — ignore
    }
  });

  await Promise.all(promises);
}

// ── Helper: write notification to adminNotifications/ for bell icon ──────────
async function writeAdminNotification(payload: { title: string; body?: string; url?: string }): Promise<void> {
  await db().ref("adminNotifications").push({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/admin",
    createdAt: Date.now(),
    read: false,
  });
}

// ── Helper: push to all adminSubs/* ──────────────────────────────────────────
async function sendToAdminSubs(payload: object): Promise<void> {
  const snap = await db().ref("adminSubs").get();
  if (!snap.exists()) return;

  const payloadStr = JSON.stringify(payload);
  const promises: Promise<unknown>[] = [];

  snap.forEach((child) => {
    const data = child.val() as { subscription?: string } | null;
    if (!data?.subscription) return;
    try {
      const sub = JSON.parse(data.subscription) as webpush.PushSubscription;
      const endpoint = (sub as { endpoint?: string }).endpoint ?? "";
      promises.push(
        webpush.sendNotification(sub, payloadStr).catch(async (err: { statusCode?: number; message?: string; body?: string }) => {
          console.error(`[push/admin] status=${err.statusCode} ep=...${String(endpoint).slice(-30)}`, err.message);
          if (isDeadSubscription(err)) {
            await child.ref.remove().catch(() => undefined);
          }
        })
      );
    } catch {
      // malformed JSON — ignore
    }
  });

  await Promise.all(promises);
}

// ── Helper: push to student by studentCode (via supabaseUid mapping) ─────────
async function sendToStudentByCode(studentCode: string, payload: object): Promise<void> {
  const uidSnap = await db().ref(`students/${studentCode}/supabaseUid`).get();
  if (!uidSnap.exists()) return;
  await sendToUidSubs(uidSnap.val() as string, payload);
}

// ── Helper: parse booking date+time (ICT) to UTC Date ────────────────────────
function parseBookingTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

// ── P3: Push to student when teacher writes a notification node ───────────────
export const onNewStudentNotification = onValueCreated(
  {
    ref: "/notifications/{studentCode}/{notifId}",
    instance: DB_INSTANCE,
    region: REGION,
    secrets: SECRETS,
  },
  async (event) => {
    const { studentCode } = event.params;
    const data = event.data.val() as { title?: string; body?: string; url?: string } | null;
    if (!data) return;

    setupVapid();

    const snap = await db()
      .ref("pushSubs")
      .orderByChild("studentCode")
      .equalTo(studentCode)
      .get();
    if (!snap.exists()) return;

    const sendPromises: Promise<void>[] = [];
    snap.forEach((child) => {
      const uid = child.key;
      if (!uid) return;
      sendPromises.push(
        sendToUidSubs(uid, {
          title: data.title ?? "Thông báo mới từ thầy 📢",
          body: data.body ?? "",
          url: data.url ?? "/journal",
        })
      );
    });

    await Promise.all(sendPromises);
  }
);

// ── P4: Daily 8 PM Vietnam reminder (all users — free + enrolled) ─────────────
export const dailyStudyReminder = onSchedule(
  {
    schedule: "0 13 * * *", // 13:00 UTC = 20:00 ICT
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: SECRETS,
  },
  async () => {
    setupVapid();

    // Only pushSubs/ — admin subscriptions are in adminSubs/ and should NOT get this
    const snap = await db().ref("pushSubs").get();
    if (!snap.exists()) return;

    const payload = {
      title: "Nhắc nhở học tập 📚",
      body: "Hôm nay bạn đã ôn từ vựng chưa? Đừng quên kiểm tra bài tập nhé!",
      url: "/journal/vocab",
    };

    const sendPromises: Promise<void>[] = [];
    snap.forEach((child) => {
      const uid = child.key;
      if (!uid) return;
      sendPromises.push(sendToUidSubs(uid, payload));
    });

    await Promise.all(sendPromises);
  }
);

// ── A1: Student nộp daylink → push admin ─────────────────────────────────────
export const onStudentDaylink = onValueCreated(
  {
    ref: "/daylinks/{studentCode}/{hwId}",
    instance: DB_INSTANCE,
    region: REGION,
    secrets: SECRETS,
  },
  async (event) => {
    const { studentCode } = event.params;

    const nameSnap = await db().ref(`students/${studentCode}/name`).get();
    const name: string = nameSnap.exists() ? (nameSnap.val() as string) : studentCode;

    const daylinkPayload = {
      title: `📎 ${name} vừa nộp link bài!`,
      body: "Nhấn để xem ngay",
      url: `/admin/students/${studentCode}`,
    };
    await writeAdminNotification(daylinkPayload).catch((e) => console.error("[notify] write failed:", e));

    setupVapid();
    await sendToAdminSubs(daylinkPayload);
  }
);

// ── A2: Student done all tasks → push admin (with dedup) ─────────────────────
export const onStudentProgressDone = onValueWritten(
  {
    ref: "/progress/{studentCode}/{date}",
    instance: DB_INSTANCE,
    region: REGION,
    secrets: SECRETS,
  },
  async (event) => {
    const { studentCode, date } = event.params;
    const after = event.data.after.val() as { done?: number; total?: number } | null;

    if (!after || typeof after.done !== "number" || typeof after.total !== "number") return;
    if (after.done < after.total) return;

    // Dedup: only push once per student per date
    const dedupRef = db().ref(`notifiedAdmin/${studentCode}/${date}`);
    const dedupSnap = await dedupRef.get();
    if (dedupSnap.exists()) return;
    await dedupRef.set(true);

    const nameSnap = await db().ref(`students/${studentCode}/name`).get();
    const name: string = nameSnap.exists() ? (nameSnap.val() as string) : studentCode;

    const progressPayload = {
      title: `✅ ${name} đã hoàn thành tất cả nhiệm vụ hôm nay!`,
      body: `${after.done}/${after.total} nhiệm vụ — ${date}`,
      url: `/admin/students/${studentCode}`,
    };
    await writeAdminNotification(progressPayload).catch((e) => console.error("[notify] write failed:", e));

    setupVapid();
    await sendToAdminSubs(progressPayload);
  }
);

// ── A3: Student đặt lịch → push admin ────────────────────────────────────────
export const onBookingCreated = onValueCreated(
  {
    ref: "/bookings/{id}",
    instance: DB_INSTANCE,
    region: REGION,
    secrets: SECRETS,
  },
  async (event) => {
    const booking = event.data.val() as {
      studentId?: string;
      studentName?: string;
      date?: string;
      time?: string;
    } | null;
    if (!booking?.studentId) return;

    const bookingPayload = {
      title: `📅 ${booking.studentName ?? booking.studentId} vừa đặt lịch học`,
      body: booking.date && booking.time ? `${booking.date} lúc ${booking.time}` : "",
      url: "/admin/bookings",
    };
    await writeAdminNotification(bookingPayload).catch((e) => console.error("[notify] write failed:", e));

    setupVapid();
    await sendToAdminSubs(bookingPayload);
  }
);

// ── S5: Admin duyệt/từ chối booking → push student ───────────────────────────
export const onBookingStatusChanged = onValueWritten(
  {
    ref: "/bookings/{id}",
    instance: DB_INSTANCE,
    region: REGION,
    secrets: SECRETS,
  },
  async (event) => {
    const before = event.data.before.val() as { status?: string; studentId?: string; date?: string; time?: string } | null;
    const after = event.data.after.val() as { status?: string; studentId?: string; date?: string; time?: string } | null;

    if (!after?.studentId) return;
    if (!before || before.status === after.status) return; // status không đổi

    const { status, studentId, date, time } = after;
    if (status !== "approved" && status !== "declined") return;

    setupVapid();

    const payload =
      status === "approved"
        ? {
            title: "✅ Lịch học đã được xác nhận!",
            body: date && time ? `Buổi học: ${date} lúc ${time}` : "Kiểm tra lịch học của bạn nhé!",
            url: "/journal/schedule",
          }
        : {
            title: "❌ Lịch học không được chấp nhận",
            body: "Bạn có thể đặt lịch khác nhé!",
            url: "/journal/booking",
          };

    await sendToStudentByCode(studentId, payload);
  }
);

// ── S8: Nhắc trước buổi học 30 phút (cron mỗi 5 phút) ───────────────────────
export const scheduledSessionReminder = onSchedule(
  {
    schedule: "*/5 * * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: SECRETS,
  },
  async () => {
    setupVapid();

    const now = new Date();
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000); // 25 min from now
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);   // 35 min from now

    const snap = await db().ref("bookings").orderByChild("status").equalTo("approved").get();
    if (!snap.exists()) return;

    const promises: Promise<void>[] = [];

    snap.forEach((child) => {
      const b = child.val() as { studentId?: string; date?: string; time?: string } | null;
      if (!b?.studentId || !b.date || !b.time) return;

      const sessionTime = parseBookingTime(b.date, b.time);
      if (sessionTime < windowStart || sessionTime > windowEnd) return;

      const bookingId = child.key!;
      promises.push(
        (async () => {
          // Dedup: only remind once per booking
          const dedupRef = db().ref(`remindedSessions/${bookingId}`);
          const already = await dedupRef.get();
          if (already.exists()) return;
          await dedupRef.set(true);

          await sendToStudentByCode(b.studentId!, {
            title: "⏰ Buổi học sắp bắt đầu!",
            body: `Còn 30 phút nữa — ${b.date} lúc ${b.time}`,
            url: "/journal/schedule",
          });
        })()
      );
    });

    await Promise.all(promises);
  }
);
