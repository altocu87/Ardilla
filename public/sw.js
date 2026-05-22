// Service Worker — Ardilla Push Notifications

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "🐿️ Ardilla", body: "¡Tienes un nuevo mensaje!", emoji: "🌿", url: "/" };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch {}
  }

  const title = `${data.emoji} ${data.title}`;

  const options = {
    body: data.body,
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || "ardilla-notif",
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Ver ahora" },
      { action: "close", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
