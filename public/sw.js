// Service Worker for Push Notifications
self.addEventListener("push", (event) => {
  let data = { title: "Recanto das Flores", body: "Nova notificação!" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const options = {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    data: { url: "/home" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/home";
  event.waitUntil(clients.openWindow(url));
});
