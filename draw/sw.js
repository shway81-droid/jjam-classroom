// 오프라인에서 전 기능이 동작해야 합니다(PRD 3.6 · 10장).
// 학교 인터넷을 신뢰하지 않으므로, 첫 방문에서 필요한 것을 전부 캐시합니다.
// 그림 데이터는 통합본 하나라 파일 수가 늘지 않습니다(PRD 11장).
const VERSION = 'jjam-draw-v7'; // 상단바를 짬짬이 가족 디자인으로 바꾸고 그림 45개로 캐시를 바꿉니다
// 음성 파일은 따로 둡니다 — 앱을 고쳐 VERSION 이 바뀌어도 수 MB 를 다시 받지 않게 합니다.
// 파일 이름에 문장 해시가 있어 문장이 바뀐 그림만 새 파일이 됩니다.
const AUDIO = 'jjam-draw-audio';
const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'data/drawings.json',
  'data/voice.json',
  'favicon.svg',
  'shared/jjam-switcher.js',
  'icons/home-1.svg',
  'assets/fonts/PretendardVariable.subset.woff2',
  'manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((k) => k !== VERSION && k !== AUDIO).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 캐시 우선. 교실에서 인터넷이 끊겨도 같은 속도로 열립니다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok) {
        const isAudio = new URL(req.url).pathname.includes('/audio/');
        const cache = await caches.open(isAudio ? AUDIO : VERSION);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      const shell = await caches.match('index.html');
      if (shell && req.mode === 'navigate') return shell;
      throw new Error('오프라인이고 캐시에도 없습니다: ' + req.url);
    }
  })());
});

// 고른 목소리의 음성을 뒤에서 하나씩 받아 둡니다. keep 에 없는 옛 파일은 지웁니다.
async function precache(source, want, keep) {
  const cache = await caches.open(AUDIO);
  const base = new URL('./', self.location).href;
  const keepUrls = new Set(keep.map((p) => new URL(p, base).href));
  for (const req of await cache.keys()) {
    if (!keepUrls.has(req.url)) await cache.delete(req);
  }
  let done = 0;
  for (const p of want) {
    const url = new URL(p, base).href;
    if (!(await cache.match(url))) {
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      } catch { /* 오프라인이면 다음에 다시 받습니다 */ }
    }
    if (await cache.match(url)) done += 1;
  }
  source?.postMessage({ audio: { done, total: want.length } });
}

// 캐시가 준비되었는지 홈에서 물어봅니다(PRD 3.6의 캐시 완료 표시).
self.addEventListener('message', async (e) => {
  if (e.data?.precache) { e.waitUntil(precache(e.source, e.data.precache, e.data.keep || [])); return; }
  if (e.data !== 'ready?') return;
  const cache = await caches.open(VERSION);
  const keys = await cache.keys();
  e.source?.postMessage({ ready: keys.length >= ASSETS.length });
});
