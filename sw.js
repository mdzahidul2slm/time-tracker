// Time tracker offline support. Bump VERSION whenever you change index.html.
const VERSION = 'tt-v2';
const REMINDER = 'tt-reminder'; // reminder settings copied here by the page
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== REMINDER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: cache first, they never change.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))
      )
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // App files: answer from the cache right away, refresh it in the background.
  event.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req, { ignoreSearch: true }).then((hit) => {
        const fresh = fetch(req)
          .then((res) => { if (res.ok) c.put(req, res.clone()); return res; })
          .catch(() => hit || (req.mode === 'navigate' ? c.match('./index.html') : undefined));
        return hit || fresh;
      })
    )
  );
});

// Daily reminder. Android Chrome (installed app) wakes this up now and then;
// other devices rely on the page and the calendar reminder.
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
async function maybeRemind() {
  const c = await caches.open(REMINDER);
  const hit = await c.match('reminder.json');
  if (!hit) return;
  const r = await hit.json();
  const now = new Date(), today = dkey(now);
  const [h, m] = String(r.time || '21:00').split(':').map(Number);
  const at = new Date(now); at.setHours(h, m, 0, 0);
  if (!r.on || r.filled === today || r.notified === today || now < at) return;
  r.notified = today;
  await c.put('reminder.json', new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } }));
  await self.registration.showNotification('Time tracker', {
    body: "You haven't colored in today yet. Take a minute to fill in your day.",
    icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'daily-reminder'
  });
}
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') event.waitUntil(maybeRemind());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const w of list) if ('focus' in w) return w.focus();
      return self.clients.openWindow('./');
    })
  );
});
