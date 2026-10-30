// DeutschFlow çevrimdışı önbellek: sayfa önce ağdan (yeni sürüm gelsin), kütüphaneler önce önbellekten
const CACHE = 'deutschflow-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html']).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const LIBS = /(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com)$/;
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Sayfa ve kendi dosyalarımız: önce ağ, internet yoksa önbellek
    e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  if (LIBS.test(u.hostname)) {
    // CDN kütüphaneleri ve yazı tipleri: önbellekten hemen, arkada tazele
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(m => {
      const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }).catch(() => m);
      return m || net;
    })));
  }
  // Firebase veritabanı ve yapay zekâ istekleri önbelleğe alınmaz
});
