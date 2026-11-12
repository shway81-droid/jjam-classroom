/* 짬짬이 유치원 — 오프라인 캐시

   network-first: 인터넷이 있으면 늘 새 내용을 받아 캐시를 바꾸고, 끊기면 캐시로 답한다.
   그림을 고쳐 배포했는데 선생님 화면에 옛 그림이 남는 일이 없게 cache-first 를 쓰지 않는다.
   그림 카드는 처음 열 때 전부 받아 둔다 — 놀이 중에 인터넷이 끊겨도 다음 카드가 비지 않게.
   카드를 더하거나 js/ 에 모듈을 더하면 ASSETS 에도 더한다(scripts/validate-data.mjs 가 막는다).
   CACHE 의 v 숫자는 발행할 때 커밋 번호로 바뀐다(발행 저장소 publish.yml). */
var CACHE = 'jjam-kinder-v1';

var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/deck.js',
  './js/sound.js',
  './js/speak.js',
  './shared/jjam-switcher.js',
  './data/cards.json',
  './favicon.svg',
  './manifest.json',
  './assets/fonts/PretendardVariable.subset.woff2',
  './assets/cards/rabbit.svg',
  './assets/cards/dog.svg',
  './assets/cards/cat.svg',
  './assets/cards/elephant.svg',
  './assets/cards/monkey.svg',
  './assets/cards/fish.svg',
  './assets/cards/bird.svg',
  './assets/cards/frog.svg',
  './assets/cards/snake.svg',
  './assets/cards/bear.svg',
  './assets/cards/duck.svg',
  './assets/cards/butterfly.svg',
  './assets/cards/dinosaur.svg',
  './assets/cards/apple.svg',
  './assets/cards/banana.svg',
  './assets/cards/watermelon.svg',
  './assets/cards/icecream.svg',
  './assets/cards/carrot.svg',
  './assets/cards/milk.svg',
  './assets/cards/candy.svg',
  './assets/cards/corn.svg',
  './assets/cards/car.svg',
  './assets/cards/airplane.svg',
  './assets/cards/boat.svg',
  './assets/cards/train.svg',
  './assets/cards/bicycle.svg',
  './assets/cards/firetruck.svg',
  './assets/cards/rocket.svg',
  './assets/cards/toothbrush.svg',
  './assets/cards/umbrella.svg',
  './assets/cards/ball.svg',
  './assets/cards/phone.svg',
  './assets/cards/glasses.svg',
  './assets/cards/scissors.svg',
  './assets/cards/hat.svg',
  './assets/cards/spoon.svg',
  './assets/cards/flower.svg',
  './assets/cards/tree.svg',
  './assets/cards/snowman.svg',
  './assets/cards/rain.svg',
  './assets/cards/rainbow.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // 자매 사이트(다른 출처)는 캐시하지 않는다.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
