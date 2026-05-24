"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyStudyReminder = exports.onNewStudentNotification = void 0;
const app_1 = require("firebase-admin/app");
const database_1 = require("firebase-admin/database");
const database_2 = require("firebase-functions/v2/database");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const webpush = __importStar(require("web-push"));
// ── Firebase Admin init ───────────────────────────────────────────────────────
// Pass databaseURL explicitly so getDatabase() connects to the correct RTDB instance.
(0, app_1.initializeApp)({
    databaseURL: "https://quanlyhocvien-b1796-default-rtdb.asia-southeast1.firebasedatabase.app",
});
function db() {
    return (0, database_1.getDatabase)();
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
async function sendToUidSubs(uid, payload) {
    const snap = await db().ref(`pushSubs/${uid}/subs`).get();
    if (!snap.exists())
        return;
    const payloadStr = JSON.stringify(payload);
    const promises = [];
    snap.forEach((child) => {
        const raw = child.val();
        if (!raw)
            return;
        try {
            const sub = JSON.parse(raw);
            promises.push(webpush.sendNotification(sub, payloadStr).catch(async (err) => {
                // 410 Gone → subscription expired, clean up
                if (err.statusCode === 410) {
                    await child.ref.remove().catch(() => undefined);
                }
            }));
        }
        catch {
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
exports.onNewStudentNotification = (0, database_2.onValueCreated)({
    ref: "/notifications/{studentCode}/{notifId}",
    instance: "quanlyhocvien-b1796-default-rtdb",
    region: "asia-southeast1",
    secrets: ["VAPID_SUBJECT", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
}, async (event) => {
    const { studentCode } = event.params;
    const data = event.data.val();
    if (!data)
        return;
    setupVapid();
    // Find uid(s) whose studentCode matches
    const snap = await db()
        .ref("pushSubs")
        .orderByChild("studentCode")
        .equalTo(studentCode)
        .get();
    if (!snap.exists())
        return;
    const sendPromises = [];
    snap.forEach((child) => {
        const uid = child.key;
        if (!uid)
            return;
        sendPromises.push(sendToUidSubs(uid, {
            title: data.title ?? "Thông báo mới từ thầy 📢",
            body: data.body ?? "",
            url: data.url ?? "/journal",
        }));
    });
    await Promise.all(sendPromises);
});
// ── P4: Daily 8 PM Vietnam reminder ──────────────────────────────────────────
/**
 * Sends a daily study reminder to ALL subscribed users at 20:00 ICT (13:00 UTC).
 * Iterates pushSubs/ in RTDB — only users who have subscribed will be reached.
 */
exports.dailyStudyReminder = (0, scheduler_1.onSchedule)({
    schedule: "0 13 * * *", // 13:00 UTC = 20:00 ICT (UTC+7)
    timeZone: "Asia/Ho_Chi_Minh",
    region: "asia-southeast1",
    secrets: ["VAPID_SUBJECT", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
}, async () => {
    setupVapid();
    const snap = await db().ref("pushSubs").get();
    if (!snap.exists())
        return;
    const payload = {
        title: "Nhắc nhở học tập 📚",
        body: "Hôm nay bạn đã ôn từ vựng chưa? Đừng quên kiểm tra bài tập nhé!",
        url: "/journal/vocab",
    };
    const sendPromises = [];
    snap.forEach((child) => {
        const uid = child.key;
        if (!uid)
            return;
        sendPromises.push(sendToUidSubs(uid, payload));
    });
    await Promise.all(sendPromises);
});
//# sourceMappingURL=index.js.map