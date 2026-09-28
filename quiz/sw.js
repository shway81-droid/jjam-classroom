// sw.js - Service worker for offline support
//
// 전략 A: Network-First for 디렉토리 파일
// - 메인 런처(스코프 루트 — 루트 배포 '/' 또는 GitHub Pages '/jjam-quiz/' — 및 /index.html)
//   + games/registry.json + games/meta.json + manifest.json → 항상 네트워크 우선
//   (NETWORK_TIMEOUT_MS 내 응답 없거나 실패 시 캐시 폴백)
//   → 새 게임 추가 시 사용자에게 즉시 표시됨
// - 그 외 게임·공통 파일들 (game.js, shared/style.css 등) → Stale-While-Revalidate
//   → 캐시로 즉시 응답해 로딩 속도·오프라인 동작을 유지하되, 백그라운드로 네트워크를
//     다시 받아 캐시를 갱신한다. 기존 방문자에게도 다음 접속 때 최신 파일이 반영된다.
// - 설치 때 registry.json 의 전 게임을 미리 받아 둔다 → 안 열어 본 게임도 오프라인에서 뜬다.
//
// 이 저장소는 main 브랜치를 그대로 GitHub Pages로 서빙하므로, 배포 시 CACHE_NAME을
// 커밋 SHA로 치환해 주는 빌드 단계가 없다. 따라서 캐시 무효화를 배포 파이프라인에
// 의존하지 않고 서비스 워커 자체(Stale-While-Revalidate)로 해결한다.
// (참고: 원본 저장소 jjam은 gh-pages 브랜치 발행 단계에서 이 값을 SHA로 치환한다.)
const CACHE_NAME = 'jjamquiz-v3';

// 느린 회선에서 network-first가 첫 화면을 오래 막지 않도록 캐시로 폴백하는 대기 시간
const NETWORK_TIMEOUT_MS = 3000;

// 게임 한 개를 띄우는 데 필요한 게임 폴더 안 파일 (scripts/sw.test.mjs 가 index.html 참조와 대조)
const GAME_FILES = ['index.html', 'style.css', 'game.js'];

// 게임 파일을 받을 때 동시에 여는 요청 수 — 학교 와이파이를 한꺼번에 막지 않도록
const GAME_PRECACHE_CONCURRENCY = 6;

// Install: 런처·공통 파일은 반드시, 전 게임은 할 수 있는 만큼 미리 받는다.
// 예전에는 런처만 받아서, 온라인일 때 한 번도 안 열어 본 게임은 오프라인에서
// (룰렛으로 뽑혀도) 뜨지 않았다.
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './shared/style.css',
        './shared/engine.js',
        './shared/jjam-switcher.js',
        './games/registry.json',
        './games/meta.json',
        './favicon.svg',
        './og-image.svg',
        './og-image.png',
        './manifest.json',
        './assets/fonts/PretendardVariable.subset.woff2'
      ]).then(function() { return precacheGames(cache); });
    })
  );
  self.skipWaiting();
});

// 전 게임 파일을 미리 받는다. 하나가 실패해도 설치는 막지 않는다(best-effort) —
// 그 게임은 예전처럼 처음 열 때 캐시된다. 이미 캐시에 있는 파일은 다시 받지 않는다
// (갱신은 게임을 열 때 Stale-While-Revalidate 가 맡는다).
function precacheGames(cache) {
  return cache.match('./games/registry.json').then(function(res) {
    return res ? res.json() : [];
  }).then(function(folders) {
    var urls = [];
    folders.forEach(function(folder) {
      GAME_FILES.forEach(function(f) { urls.push('./games/' + folder + '/' + f); });
    });
    var next = 0;
    function worker() {
      if (next >= urls.length) return Promise.resolve();
      var url = urls[next++];
      return cache.match(url).then(function(hit) {
        if (hit) return;
        return cache.add(url);
      }).then(null, function() {}).then(worker);
    }
    var workers = [];
    for (var i = 0; i < GAME_PRECACHE_CONCURRENCY; i++) workers.push(worker());
    return Promise.all(workers);
  }).then(null, function() {});
}

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// "디렉토리 파일" 판별: 게임 목록을 결정하는 파일들
// - 메인 런처 index.html (게임 카드 그리드 포함)
// - games/registry.json (게임 폴더 목록)
// - manifest.json (앱 메타데이터)
// 게임 폴더 안의 index.html은 제외 (그건 게임 자체이므로 캐시 우선)
// SW 스코프 루트 경로 — 루트 배포면 '/', GitHub Pages 프로젝트 페이지면 '/jjam-quiz/'
var SCOPE_PATH = new URL('./', self.location).pathname;

function isDirectoryFile(url) {
  var pathname = new URL(url).pathname;

  // 메인 런처: 스코프 루트 또는 '/index.html'로 끝 (단, '/games/xxx/index.html'은 제외)
  if (pathname === SCOPE_PATH ||
      pathname.endsWith('/index.html') && !pathname.includes('/games/')) {
    return true;
  }
  // registry.json
  if (pathname.endsWith('/games/registry.json')) return true;
  // meta.json (런처가 받는 전 게임 메타 통합본 — 신규 게임 즉시 반영 위해 network-first)
  if (pathname.endsWith('/games/meta.json')) return true;
  // manifest.json
  if (pathname.endsWith('/manifest.json')) return true;

  return false;
}

// 캐시에 담아 둘 파일: 게임별 자산과 공통 엔진·스타일, 자가 호스팅 웹폰트
function isCacheable(url) {
  return url.includes('/games/') || url.includes('/shared/') || url.includes('/assets/');
}

// Fetch: 디렉토리 파일은 network-first, 나머지는 stale-while-revalidate
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  if (isDirectoryFile(event.request.url)) {
    // Network-First: 항상 최신 가져오기, 실패/지연(타임아웃) 시 캐시 폴백
    var networkFetch = fetch(event.request, { cache: 'no-cache' }).then(function(response) {
      // 성공 시 캐시 갱신 (오프라인 폴백용)
      if (response.ok) {
        var clone = response.clone();
        return caches.open(CACHE_NAME).then(function(cache) {
          return cache.put(event.request, clone);
        }).then(function() { return response; });
      }
      return response;
    });
    // 타임아웃으로 캐시가 먼저 응답해도 fetch는 끝까지 진행해 다음 방문용 캐시를 갱신
    event.waitUntil(networkFetch.then(null, function() {}));

    event.respondWith(
      Promise.race([
        networkFetch.then(null, function() { return null; }),
        new Promise(function(resolve) {
          setTimeout(function() { resolve(null); }, NETWORK_TIMEOUT_MS);
        })
      ]).then(function(response) {
        if (response) return response;
        // 네트워크 실패 또는 응답 지연 → 캐시에서 시도
        return caches.match(event.request).then(function(cached) {
          // 캐시도 없으면 (첫 방문 + 느린 회선) 네트워크 응답을 끝까지 기다림
          return cached || networkFetch;
        });
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Stale-While-Revalidate: 게임·공통 파일들
  // 캐시가 있으면 즉시 응답(빠른 로딩 + 오프라인 지원)하고, 네트워크 요청은 백그라운드에서
  // 끝까지 진행시켜 캐시를 갱신한다 → 파일을 수정하면 다음 접속 때 반영된다.
  var revalidate = fetch(event.request, { cache: 'no-cache' }).then(function(response) {
    if (response.ok && isCacheable(event.request.url)) {
      var responseClone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, responseClone);
      });
    }
    return response;
  });

  // 캐시로 즉시 응답하더라도 갱신 요청은 끝까지 진행시킨다(다음 접속용).
  event.waitUntil(revalidate.then(null, function() {}));

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return revalidate.catch(function() {
        // 오프라인: 게임 화면은 공통 파일을 '?v=12' 처럼 버전을 붙여 부르는데 미리 받은 건
        // 버전 없는 주소다. 쿼리를 떼고 한 번 더 찾아, 안 열어 본 게임도 뜨게 한다.
        return caches.match(event.request, { ignoreSearch: true }).then(function(loose) {
          return loose || new Response('Offline', { status: 503 });
        });
      });
    })
  );
});
