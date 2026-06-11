const C = 'campong-v2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x != C).map(x => caches.delete(x)))));
  self.clients.claim();
});
// network-first for the page itself (so updates arrive), cache-first for everything else (CDN libs, icons)
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(n => {
      const cl = n.clone(); caches.open(C).then(c => c.put('./index.html', cl)).catch(() => {});
      return n;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => {
    const cl = n.clone(); caches.open(C).then(c => c.put(e.request, cl)).catch(() => {});
    return n;
  })));
});
