// Service Worker — mytoeicdiary
// Handles Web Push notifications and offline shell cache.

const CACHE_NAME = "mytoeicdiary-shell-v2";
const SHELL_URLS = ["/journal", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Network-first fetch (fall back to cache for navigation) ──────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match("/offline").then((r) => r ?? Response.error())
    )
  );
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

  // No icon/badge: iOS fetches them asynchronously in background
  // and may silently drop the notification if the fetch fails/times out.
  // iOS uses the web app manifest icon automatically.
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: "push",
      data: { url },
    }).catch(() =>
      self.registration.showNotification("Anh Hiếu²", { body: "Bạn có thông báo mới" })
    )
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
