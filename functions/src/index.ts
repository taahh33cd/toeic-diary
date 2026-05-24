import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { onValueCreated } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as webpush from "web-push";

// ── Firebase Admin init ───────────────────────────────────────────────────────
// Cloud Functions automatically initialise with Application Default Credentials.
initializeApp();

const DB_URL =
  "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app";

function db() {
  return getDatabase(undefined, DB_URL);
}

// ── VAPID setup helper ────────────────────────────────────────────────────────
function setupVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID env vars not set (VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/** Send push to all subscriptions stored under pushSubs/{uid}/subs/* */
async function sendToUidSubs(
  uid: string,
  payload: object
): Promise<void> {
  const snap = await db().ref(`pushSubs/${uid}/subs`).get();
  if (!snap.exists()) return;

  const payloadStr = JSON.stringify(payload);
  const promises: Promise<unknown>[] = [];

  snap.forEach((child) => {
    const raw = child.val() as string | null;
    if (!raw) return;
    try {
      const sub = JSON.parse(raw) as webpush.PushSubscription;
      promises.push(
        webpush.sendNotification(sub, payloadStr).catch(async (err: { statusCode?: number }) => {
          // 410 Gone → subscription expired, clean up
          if (err.statusCode === 410) {
            await child.ref.remove().catch(() => undefined);
          }
        })
      );
    } catch {
      // malformed JSON in RTDB — ignore
    }
  });

  await Promise.all(promises);
}

// ── P3: Push notification on new RTDB notification node ──────────────────────
/**
 * Triggered whenever a teacher writes to notifications/{studentCode}/{notifId}.
 * Looks up the student's supabaseUid via pushSubs, then sends a web push.
 *
 * Expected notification node shape: { title?: string, body?: string, url?: string }
 */
export const onNewStudentNotification = onValueCreated(
  {
    ref: "/notifications/{studentCode}/{notifId}",
    instance: "quanlyhocvien-b1796-default-rtdb",
    region: "asia-southeast1",
  },
  async (event) => {
    const { studentCode } = event.params;
    const data = event.data.val() as {
      title?: string;
      body?: string;
      url?: string;
    } | null;

    if (!data) return;

    setupVapid();

    // Find uid(s) whose studentCode matches
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

// ── P4: Daily 8 PM Vietnam reminder ──────────────────────────────────────────
/**
 * Sends a daily study reminder to ALL subscribed users at 20:00 ICT (13:00 UTC).
 * Iterates pushSubs/ in RTDB — only users who have subscribed will be reached.
 */
export const dailyStudyReminder = onSchedule(
  {
    schedule: "0 13 * * *", // 13:00 UTC = 20:00 ICT (UTC+7)
    timeZone: "Asia/Ho_Chi_Minh",
    region: "asia-southeast1",
  },
  async () => {
    setupVapid();

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
