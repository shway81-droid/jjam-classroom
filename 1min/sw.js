/* ===================================================================
   짬짬이 1분 수업 — 오프라인 지원 서비스 워커
   ===================================================================
   전략 (짬짬이 영상과 같다)
   - 차시 목록(data/*.json) · 런처 HTML → Network-First
     차시가 추가되면 곧바로 보여야 하므로 네트워크를 먼저 본다. 느린 회선에서
     첫 화면이 막히지 않도록 NETWORK_TIMEOUT_MS 뒤에는 캐시로 응답하고,
     네트워크 응답은 끝까지 받아 다음 방문용 캐시를 갱신한다.
   - 나머지 정적 자산(css · js · 웹폰트 · 아이콘) → Stale-While-Revalidate

   유튜브(썸네일 i.ytimg.com · 임베드)는 교차 출처라 가로채지 않는다.
   → 영상 재생은 인터넷이 필요하다. 오프라인에서는 목록·검색이 동작한다.

   CACHE_NAME 은 발행 저장소(jjam-1min)의 publish.yml 이 상류 커밋 해시로
   바꿔 넣는다. 여기 적힌 값은 로컬에서 띄울 때만 쓰인다.
   =================================================================== */

const CACHE_NAME = 'jjam1min-v1';
const NETWORK_TIMEOUT_MS = 3000;

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './shared/jjam-switcher.js',
  './data/lessons.index.json',
  './favicon.svg',
  './manifest.json',
  './assets/fonts/PretendardVariable.subset.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // 하나가 404 여도 설치가 실패하지 않게 개별로 넣는다
      return Promise.all(PRECACHE.map(function (u) {
        return cache.add(u).catch(function () {});
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

function networkFirst(request) {
  return caches.open(CACHE_NAME).then(function (cache) {
    var fromNet = fetch(request).then(function (res) {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    });

    var timeout = new Promise(function (resolve) {
      setTimeout(function () {
        cache.match(request).then(function (hit) { if (hit) resolve(hit); });
      }, NETWORK_TIMEOUT_MS);
    });

    return Promise.race([fromNet, timeout]).catch(function () {
      return cache.match(request).then(function (hit) {
        return hit || cache.match('./index.html');
      });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.match(request).then(function (hit) {
      var fetching = fetch(request).then(function (res) {
        if (res && res.ok) cache.put(request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fetching;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 유튜브는 건드리지 않는다

  var isDoc = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  var isData = url.pathname.indexOf('/data/') >= 0;

  event.respondWith((isDoc || isData) ? networkFirst(req) : staleWhileRevalidate(req));
});
