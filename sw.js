const CACHE='クエnavi-v1';
const FILES=[
  '/game-kingdom/quest-tracker.html',
  '/game-kingdom/patch.js'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{})));
self.addEventListener('fetch',e=>{
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});