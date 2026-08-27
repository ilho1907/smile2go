// smile2go · Service Worker
// 1) App-Hülle offline verfügbar halten (Netz weg = App startet trotzdem)
// 2) Web-Push empfangen und anzeigen
// 3) Klick auf die Meldung öffnet die App an der richtigen Stelle

const CACHE = "s2g-v1";
const HUELLE = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Netz zuerst, Cache als Rückfalle — so sieht die Nutzerin immer den aktuellen Stand,
// bleibt aber im Zug ohne Empfang handlungsfähig. API-Aufrufe werden nie gecacht.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/rest/") || url.pathname.startsWith("/auth/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const kopie = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopie));
        return res;
      })
      .catch(() => caches.match(e.request).then((treffer) => treffer || caches.match("/index.html"))),
  );
});

self.addEventListener("push", (e) => {
  let d = { titel: "smile2go", text: "Du hast eine neue Nachricht.", url: "/" };
  try { d = { ...d, ...e.data.json() }; } catch { if (e.data) d.text = e.data.text(); }

  e.waitUntil(
    self.registration.showNotification(d.titel, {
      body: d.text,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag || "smile2go",
      data: { url: d.url },
      vibrate: [80, 40, 80],
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ziel = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenster) => {
      const offen = fenster.find((f) => f.url.includes(self.location.origin));
      if (offen) { offen.focus(); offen.navigate(ziel); return; }
      return self.clients.openWindow(ziel);
    }),
  );
});
