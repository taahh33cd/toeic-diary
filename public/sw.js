// Service Worker — mytoeicdiary
// Handles Web Push notifications and offline caching.

// Đổi số này khi sửa chiến lược cache. Đổi tên thì activate dưới dọn bản cũ.
const SHELL = "mytoeicdiary-shell-v6";
const TRANG = "mytoeicdiary-pages-v6";
const TINH = "mytoeicdiary-static-v6";
const DUNG = [SHELL, TRANG, TINH];

const SHELL_URLS = ["/journal", "/offline"];

// Trang được giữ lại để mở khi mất mạng. Chỉ khu từ vựng: học bài offline là
// việc có nghĩa ở đó (thẻ đã tải về, không cần server), còn lịch học hay học
// phí mà hiện số liệu cũ thì tai hại hơn là hiện trang offline.
const CHO_PHEP_OFFLINE = /^\/journal\/vocab(\/|$)/;
const TOI_DA_TRANG = 40;
// Mỗi lần deploy sinh một bộ file hash MỚI, file cũ nằm lại vĩnh viễn vì tên
// khác nhau nên không bao giờ bị ghi đè. Không có trần thì sau vài chục lần
// deploy cache phình lên hàng trăm MB trên máy học viên.
const TOI_DA_TINH = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Giữ MỌI cache đang dùng. Bản cũ xoá tất cả trừ một cái, nên thêm cache
      // thứ hai là nó tự dọn mất ngay lần bump version sau.
      .then((keys) => Promise.all(keys.filter((k) => !DUNG.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Cắt bớt cache trang cho khỏi phình vô hạn. */
async function gonCache(ten, toiDa) {
  const cache = await caches.open(ten);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - toiDa; i++) await cache.delete(keys[i]);
}

/**
 * Tài nguyên build của Next: /_next/static/... mang hash nội dung trong tên.
 *
 * Nên cache-first ở đây AN TOÀN tuyệt đối: nội dung đổi thì tên file đổi theo,
 * không bao giờ có chuyện phục vụ nhầm bản cũ cho một URL. Đây cũng là thứ
 * khiến mở trang offline chạy được — HTML cũ tham chiếu đúng những file hash
 * đang nằm trong cache.
 */
async function layTinh(req) {
  const cache = await caches.open(TINH);
  const co = await cache.match(req);
  if (co) return co;
  const res = await fetch(req);
  if (res.ok) {
    await cache.put(req, res.clone());
    gonCache(TINH, TOI_DA_TINH);
  }
  return res;
}

/**
 * HTML và RSC: LUÔN hỏi mạng trước.
 *
 * Không bao giờ cache-first ở đây. Site này deploy liên tục; cache-first cho
 * HTML là học viên kẹt bản cũ sau mỗi lần đẩy code, mà họ không có cách nào
 * tự gỡ ngoài xoá dữ liệu trang.
 */
async function layTrang(req) {
  const cache = await caches.open(TRANG);
  try {
    const res = await fetch(req);
    if (res.ok && CHO_PHEP_OFFLINE.test(new URL(req.url).pathname)) {
      cache.put(req, res.clone());
      gonCache(TRANG, TOI_DA_TRANG);
    }
    return res;
  } catch (e) {
    const co = await cache.match(req);
    if (co) return co;
    // Thử bỏ query (?_rsc=…) — cùng trang nhưng khoá khác
    const sach = await cache.match(new URL(req.url).pathname);
    if (sach) return sach;
    const off = await caches.match("/offline");
    if (off) return off;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Chỉ lo tài nguyên của chính site; bỏ qua Supabase, Cloudinary, Firebase…
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(layTinh(req));
    return;
  }

  // API không cache: dữ liệu học viên phải tươi, và trang đã tự giữ bản sao
  // riêng của bộ thẻ để dùng khi mất mạng.
  if (url.pathname.startsWith("/api/")) return;

  const laRsc = url.searchParams.has("_rsc");
  if (req.mode === "navigate" || laRsc) {
    event.respondWith(layTrang(req));
  }
});

// ── Push notification handler ─────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let title = "Anh Hiếu²";
  let body = "Bạn có thông báo mới";
  let url = "/journal";
  try {
    if (event.data) {
      const d = event.data.json();
      if (d.title) title = d.title;
      if (d.body) body = d.body;
      if (d.url) url = d.url;
    }
  } catch {}

  // Show notification — no icon/badge to avoid background fetch failures on iOS.
  // Unique tag per push: a fixed tag makes iOS/WebKit *silently* replace the
  // previous notification (no alert) unless renotify is set — that made every
  // notification after the first invisible. renotify re-alerts on same tag.
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: `push-${Date.now()}`,
      renotify: true,
      data: { url },
    })
  );
});

// ── Notification click → focus or open tab ────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/journal";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        return existing ? existing.focus() : self.clients.openWindow(url);
      })
  );
});
