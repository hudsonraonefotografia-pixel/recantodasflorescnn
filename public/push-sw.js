// Push notification handlers.
// Este arquivo é importado pelo service worker gerado pelo vite-plugin-pwa
// (workbox.importScripts em vite.config.ts), pois o sw.js gerado substitui public/sw.js.
self.addEventListener("push", (event) => {
  let data = { title: "Recanto das Flores", body: "Nova notificação!", url: "/home" };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    try {
      data.body = event.data.text();
    } catch (_) {}
  }

  const options = {
    body: data.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || "/home" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
