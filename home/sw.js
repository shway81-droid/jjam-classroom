/* 짬짬이 교실 모아보기 — 오프라인 대비(2026-10-02).

   왜 캐시 우선이 아니라 **네트워크 우선**인가.
   이 화면은 원래 서비스워커를 일부러 두지 않았다. index.html 맨 위 주석에 적힌 이유가
   "고쳤을 때 새로 고침 없이 바로 보이게 하려는 것"이었다. 캐시 우선으로 두면 그 성질이
   깨진다 — 카드를 하나 고쳐도 선생님 화면에는 옛 화면이 한 번 더 뜬다.

   그래서 **인터넷이 되면 언제나 네트워크를 먼저 쓰고, 끊겼을 때만 캐시를 꺼낸다.**
   고친 내용은 전과 똑같이 즉시 보이고, 교실 와이파이가 흔들릴 때만 캐시가 일한다.

   왜 넣는가.
   짬짬이 일곱 사이트는 각자 캐시가 있어 인터넷이 끊겨도 열린다. 그런데 그 일곱 곳으로
   들어가는 이 문만 캐시가 없었다. "주소 하나만 기억하세요"라고 안내하는 순간,
   가장 약한 곳을 모두가 가장 먼저 지나가게 된다.

   캐시 이름의 커밋 번호는 발행할 때 home.yml 이 박는다(아래 VERSION 참고).
*/

// 발행할 때 home.yml 이 'jjam-classroom-<커밋 7자리>' 로 바꾼다.
// 치환이 안 되면 워크플로가 실패하므로, 이 값이 그대로 올라가는 일은 없다.
const VERSION = 'jjam-classroom-dev';

// 이 화면이 쓰는 전부다. 거의 링크뿐인 페이지라 목록이 짧다(스크립트는 아래 등록 한 줄뿐).
// 일곱 칸의 링크는 각자 다른 주소(/jjam/, /jjam-quiz/ …)이고 그쪽은 그쪽 캐시가 맡는다.
// 아이콘 PNG 는 담지 않는다 — 홈 화면에 추가하면 기기가 따로 갖고 있다.
const ASSETS = [
  './',
  'index.html',
  'favicon.svg',
  'manifest.json',
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
    await Promise.all(names.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 네트워크 우선, 실패하면 캐시. 같은 출처의 GET 만 다룬다.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      // 제대로 받아 왔을 때만 캐시를 갱신한다(404·500 을 캐시에 넣지 않는다).
      if (fresh && fresh.ok) {
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // 여기 오면 인터넷이 끊긴 것이다.
      const hit = await caches.match(req);
      if (hit) return hit;
      // 주소창으로 들어온 이동이면 첫 화면이라도 돌려준다.
      if (req.mode === 'navigate') {
        const home = await caches.match('./') || await caches.match('index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});
