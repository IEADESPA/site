/*
 * Service worker mínimo, só para notificações push de eventos — não faz
 * cache nem funciona offline, então não interfere em nada do resto do site.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "IEADESPA", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "IEADESPA", {
      body: data.body || "",
      icon: "/favicon-192.png",
      badge: "/favicon-32.png",
      data: { url: data.url || "/eventos/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/eventos/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url === url);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
