// sw.js - Service worker for offline support
//
// 전략 A: Network-First for 디렉토리 파일
// - 메인 런처(스코프 루트 — 루트 배포 '/' 또는 GitHub Pages '/jjamjjami-gyosil/' — 및 /index.html)
//   + games/registry.json + manifest.json → 항상 네트워크 우선
//   (NETWORK_TIMEOUT_MS 내 응답 없거나 실패 시 캐시 폴백)
//   → 새 게임 추가 시 사용자에게 즉시 표시됨
// - 그 외 게임 파일들 (game.js, style.css 등) → 캐시 우선 (빠른 로딩 + 오프라인 지원)
//   → 설치 때 registry.json 의 전 게임을 미리 받아, 안 열어 본 게임도 오프라인에서 열린다.
//   → 이미 배포된 games/*·shared/* 파일을 수정해도, 배포 시 CACHE_NAME이 커밋 SHA로
//     자동 치환되므로 기존 방문자에게 다음 접속 시 반영됨 (수동 버전 범프 불필요).

// 배포 시 .github/workflows/pages.yml이 이 값을 커밋 SHA로 자동 치환한다.
// (게임/공통 파일 수정이 기존 방문자에게 확실히 반영되도록 — 수동 +1 불필요)
// 로컬 개발에서는 아래 기본값이 그대로 쓰인다.
const CACHE_NAME = 'gyosil-noriplan-v14';

// 느린 회선에서 network-first가 첫 화면을 오래 막지 않도록 캐시로 폴백하는 대기 시간
const NETWORK_TIMEOUT_MS = 3000;

// 런처와 공통 파일 — 하나라도 못 받으면 설치를 실패시킨다(다음 방문에 다시 시도)
const CORE_FILES = [
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
];

// 게임 한 판에 필요한 자기 폴더 파일. 공통 파일(../../shared/*)은 CORE_FILES 가 맡는다.
// 게임이 이 밖의 파일을 참조하면 scripts/verify-game.js 가 막는다.
const GAME_FILES = ['index.html', 'style.css', 'game.js'];

// 한 번에 받는 게임 수 — 전 게임(약 3MB)을 한꺼번에 요청해 학교 회선을 막지 않도록
const PRECACHE_BATCH = 8;

// HTTP 캐시(GitHub Pages 는 10분)에 남은 옛 파일이 새 캐시에 굳지 않도록 항상 새로 받는다
function fresh(url) {
  return new Request(url, { cache: 'no-cache' });
}

// 전 게임 미리 받기 — 한 번도 안 열어 본 게임도 오프라인에서 열리도록.
// 게임 하나가 실패해도 설치는 계속한다(그 게임은 온라인에서 처음 열 때 캐시된다).
function precacheGames(cache) {
  return fetch(fresh('./games/registry.json'))
    .then(function(r) { return r.json(); })
    .then(function(folders) {
      var urls = [];
      folders.forEach(function(folder) {
        GAME_FILES.forEach(function(file) { urls.push('./games/' + folder + '/' + file); });
      });
      var i = 0;
      function next() {
        if (i >= urls.length) return Promise.resolve();
        var batch = urls.slice(i, i + PRECACHE_BATCH);
        i += PRECACHE_BATCH;
        return Promise.all(batch.map(function(url) {
          return cache.add(fresh(url)).catch(function() {});
        })).then(next);
      }
      return next();
    })
    .catch(function() {});
}

// Install: 런처·공통 파일 + 전 게임 미리 받기
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CORE_FILES.map(fresh)).then(function() {
        return precacheGames(cache);
      });
    })
  );
  self.skipWaiting();
});

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
// SW 스코프 루트 경로 — 루트 배포면 '/', GitHub Pages 프로젝트 페이지면 '/jjamjjami-gyosil/'
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

// Fetch: 디렉토리 파일은 network-first, 나머지는 cache-first
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

  // Cache-First: 게임 파일들 (빠른 로딩 + 오프라인 지원)
  // ignoreSearch — 게임은 공통 파일을 '../../shared/engine.js?v=12' 처럼 부르지만 미리 받은 건
  // 쿼리 없는 주소다. 쿼리를 따지면 안 열어 본 게임이 오프라인에서 공통 파일을 못 찾는다.
  // (갱신은 ?v= 가 아니라 배포마다 바뀌는 CACHE_NAME 이 맡으므로 무시해도 안전하다)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request, { cache: 'no-cache' }).then(function(response) {
        if (response.ok && (event.request.url.includes('/games/') || event.request.url.includes('/shared/') || event.request.url.includes('/assets/'))) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
