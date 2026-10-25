// This worker displays notifications requested by an open app. It does not schedule background reminders.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const client = windows.find(
        (c) => new URL(c.url).origin === self.location.origin,
      );
      if (client) {
        await client.focus();
        client.postMessage({ type: "OPEN_REMINDERS" });
      } else await self.clients.openWindow("/#reminders");
    })(),
  );
});
