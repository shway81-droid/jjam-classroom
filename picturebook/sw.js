// 짬짬이 그림책 서비스 워커 — 학교 와이파이가 끊겨도 한 번 연 책은 다시 읽을 수 있게(PRD F7·11장).
//
//  - 틀(화면·글·목록): 첫 방문에 전부 받아 둡니다. 캐시 우선이라 인터넷이 끊겨도 같은 속도로 열립니다.
//  - 책(그림·음성): 30권을 다 받으면 무거우므로 **연 책만** 받아 둡니다. 서가 표지는 본 것만 남습니다.
//    표지의 [이 책 미리 받기]나 [읽어 주기 시작]이 그 책의 그림 전부와 두 목소리 음성을 받아 둡니다.
//  - 책 캐시는 VERSION 과 따로 둡니다 — 화면을 고쳐도 받아 둔 책을 다시 받지 않게.
//
// VERSION 은 발행할 때 커밋 번호로 바꿉니다(다른 사이트처럼 — 발행은 아직 정하지 않음, PRD D6).
// 로컬 미리보기(localhost)에서는 고친 것이 바로 보이도록 등록하지 않습니다. 시험할 때는 주소에 ?sw=1.
const VERSION = 'jjam-picturebook-v1';
const BOOKS = 'jjam-picturebook-books';
const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'data/books.json',
  'data/voice.json',
  'favicon.svg',
  'assets/fonts/PretendardVariable.subset.woff2',
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
    await Promise.all(names.filter((k) => k !== VERSION && k !== BOOKS).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const isBookFile = (url) => /\/(books|audio)\//.test(new URL(url).pathname);

// 음성 파일 이름에는 글 해시가 들어 있습니다(audio/<목소리>/<책>-<해시>.mp3).
// 새 파일을 넣을 때 같은 책·목소리의 옛 해시 파일은 지웁니다 — 글을 고친 책이 캐시에 쌓이지 않게.
async function putBookFile(cache, url, res) {
  const m = new URL(url).pathname.match(/\/audio\/([^/]+)\/(.+)-[0-9a-f]+\.mp3$/);
  if (m) {
    for (const req of await cache.keys()) {
      const k = new URL(req.url).pathname.match(/\/audio\/([^/]+)\/(.+)-[0-9a-f]+\.mp3$/);
      if (k && k[1] === m[1] && k[2] === m[2] && req.url !== url) await cache.delete(req);
    }
  }
  await cache.put(url, res);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const book = isBookFile(req.url);
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) {
      // 그림은 이름이 그대로인 채 바뀔 수 있어, 받아 둔 것을 먼저 보여 주고 뒤에서 새로 받아 둡니다.
      if (book && !req.url.includes('/audio/')) {
        e.waitUntil(fetch(req).then(async (res) => {
          if (res.ok) await (await caches.open(BOOKS)).put(req, res);
        }).catch(() => { /* 오프라인이면 다음에 */ }));
      }
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res.ok) {
        const cache = await caches.open(book ? BOOKS : VERSION);
        if (book) await putBookFile(cache, req.url, res.clone());
        else await cache.put(req, res.clone());
      }
      return res;
    } catch {
      const shell = await caches.match('index.html');
      if (shell && req.mode === 'navigate') return shell;
      throw new Error(`오프라인이고 받아 둔 것도 없습니다: ${req.url}`);
    }
  })());
});

// 화면이 책 하나의 파일 목록을 넘기면 하나씩 받아 두고, 받는 대로 몇 개 남았는지 알려 줍니다.
// check 이면 받지 않고 몇 개가 이미 있는지만 셉니다.
async function prefetch(source, { id, files, check }) {
  const cache = await caches.open(BOOKS);
  const base = new URL('./', self.location).href;
  let done = 0;
  const say = () => source?.postMessage({ prefetch: { id, done, total: files.length, check: !!check } });
  for (const p of files) {
    const url = new URL(p, base).href;
    if (!(await cache.match(url)) && !check) {
      try {
        const res = await fetch(url);
        if (res.ok) await putBookFile(cache, url, res);
      } catch { /* 오프라인이면 다음에 다시 받습니다 */ }
    }
    if (await cache.match(url)) done += 1;
    if (!check) say();
  }
  say();
}

self.addEventListener('message', (e) => {
  if (e.data?.prefetch) e.waitUntil(prefetch(e.source, e.data.prefetch));
});
