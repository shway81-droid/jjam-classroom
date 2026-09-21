/* ===================================================================
   짬짬이 1분 수업 — 런처
   ===================================================================
   짬짬이 영상과 다른 점은 탐색축이다. 여기서는 필터를 늘어놓지 않고
   **교과서 진도 순서**로 단원 → 차시를 그린다. 선생님이 찾는 것은
   "내일 나가는 그 차시" 하나이고, 그건 필터보다 목차가 빠르다.

   데이터는 data/lessons.index.json 하나만 받는다(scripts/gen-data.mjs 생성물).
   영상은 9:16 세로라 카드도 세로, 모달도 세로 그대로 띄운다.
   =================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'data/lessons.index.json';

  // 첫 화면은 출판사 → 교과 → 학년 순으로 좁힌다. 지금은 단계마다 하나씩뿐이라
  // 자동으로 골라 두지만, 교과서가 늘어나면 그대로 고르는 화면이 된다.
  var state = {
    lessons: [],
    publisher: null,
    subject: null,
    grade: null,
    query: ''
  };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function bookKey(L) { return L.subject + '/' + L.grade + '-' + L.semester; }
  function bookLabel(L) { return L.subject + ' ' + L.grade + '-' + L.semester; }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  /* 유튜브 썸네일 — Shorts 는 oardefault 가 원본 비율(9:16)이다.
     없으면 hqdefault(16:9)로 떨어뜨린다. */
  function thumbUrl(id) { return 'https://i.ytimg.com/vi/' + id + '/oardefault.jpg'; }
  function thumbFallback(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }

  /* ── 검색 ────────────────────────────────────────────── */
  function matches(L, q) {
    if (!q) return true;
    var hay = (
      L.topic + ' ' + L.lessonTitle + ' ' + L.unitTitle + ' ' +
      L.summary + ' ' + (L.keywords || []).join(' ') + ' ' +
      L.subject + ' ' + L.grade + '-' + L.semester + ' ' +
      L.unit + '단원 ' + L.lesson + '차시'
    ).toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (t) { return hay.indexOf(t) >= 0; });
  }

  function visible() {
    return state.lessons.filter(function (L) {
      if (state.publisher && L.publisher !== state.publisher) return false;
      if (state.subject && L.subject !== state.subject) return false;
      if (state.grade && L.grade !== state.grade) return false;
      return matches(L, state.query);
    });
  }

  /* ── 출판사 → 교과 → 학년 카드 ────────────────────────
     아직 각 단계에 하나씩뿐이다. 그래도 카드를 그리는 까닭은, 선생님이
     "내 교과서가 여기 있나"를 먼저 확인하기 때문이다. 없으면 검색해도 소용없다.
     그래서 무엇이 있고 무엇이 아직 없는지를 옆의 문구로 같이 알려 준다. */

  // 아직 못 담은 것 — 카드 옆에 붙는 안내. 담기면 여기서 지운다.
  var SOON = {
    publisher: '천재교과서부터 시작합니다. 다른 출판사는 차차 더합니다',
    subject: '사회부터 시작합니다. 다른 교과는 차차 더합니다',
    grade: '5학년부터 시작합니다. 다른 학년은 차차 더합니다'
  };

  function uniq(pick) {
    var seen = new Map();
    state.lessons.forEach(function (L) {
      var v = pick(L);
      if (!seen.has(v)) seen.set(v, 0);
      seen.set(v, seen.get(v) + 1);
    });
    return Array.from(seen.entries());   // [[값, 건수], ...]
  }

  function renderPickers() {
    drawCards(el.pubCards, uniq(function (L) { return L.publisher; }),
      function (v) { return v; }, 'publisher');
    drawCards(el.subjectCards, uniq(function (L) { return L.subject; }),
      function (v) { return v; }, 'subject');
    drawCards(el.gradeCards, uniq(function (L) { return L.grade; }),
      function (v) { return v + '학년'; }, 'grade');

    el.pubNote.textContent = SOON.publisher;
    el.subNote.textContent = SOON.subject;
    el.gradeNote.textContent = SOON.grade;
  }

  function drawCards(host, entries, labelOf, key) {
    host.innerHTML = '';
    entries.forEach(function (pair) {
      var value = pair[0];
      var count = pair[1];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt-card';
      b.setAttribute('aria-pressed', state[key] === value ? 'true' : 'false');
      b.innerHTML =
        '<span class="opt-name">' + esc(labelOf(value)) + '</span>' +
        '<span class="opt-sub">' + count + '편</span>';
      b.addEventListener('click', function () {
        // 하나뿐일 때는 꺼서 빈 화면을 만들 이유가 없다 — 항상 켜 둔다.
        if (entries.length > 1 && state[key] === value) state[key] = null;
        else state[key] = value;
        renderPickers();
        render();
      });
      host.appendChild(b);
    });
  }

  /* ── 단원 → 차시 ─────────────────────────────────────── */
  function render() {
    var list = visible();

    el.units.innerHTML = '';
    el.emptyMsg.hidden = list.length > 0;

    // 교과서 → 단원으로 묶는다. 데이터는 이미 진도 순서로 정렬돼 있다.
    var groups = [];
    var lastKey = null;
    list.forEach(function (L) {
      var k = bookKey(L) + '/' + L.unit;
      if (k !== lastKey) {
        groups.push({ key: k, book: bookLabel(L), unit: L.unit, unitTitle: L.unitTitle, items: [] });
        lastKey = k;
      }
      groups[groups.length - 1].items.push(L);
    });

    groups.forEach(function (g) {
      var sec = document.createElement('section');
      sec.className = 'unit';

      var head = document.createElement('div');
      head.className = 'unit-head';
      head.innerHTML =
        '<span class="unit-no">' + esc(g.book) + ' ' + g.unit + '단원</span>' +
        '<span class="unit-title">' + esc(g.unitTitle) + '</span>' +
        '<span class="unit-count">' + g.items.length + '편</span>';
      sec.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'grid';
      g.items.forEach(function (L) { grid.appendChild(card(L)); });
      sec.appendChild(grid);

      el.units.appendChild(sec);
    });

    var total = state.lessons.length;
    el.ctaCount.textContent = total;
    el.footCount.textContent = state.query
      ? '검색 결과 ' + list.length + '편'
      : '모두 ' + total + '편';
  }

  function card(L) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.setAttribute('aria-label', L.lesson + '차시 ' + L.topic + ' 재생');
    b.innerHTML =
      '<div class="thumb-wrap">' +
        '<img loading="lazy" decoding="async" alt="" src="' + thumbUrl(L.youtubeId) + '" ' +
          'data-fb="' + thumbFallback(L.youtubeId) + '" />' +
        '<span class="thumb-badge">' + L.lesson + '차시</span>' +
        '<span class="thumb-time">' + fmtTime(L.seconds) + '</span>' +
        '<span class="thumb-play"><svg aria-hidden="true"><use href="#i-play"/></svg></span>' +
      '</div>' +
      '<div class="card-body">' +
        '<span class="card-topic">' + esc(L.topic) + '</span>' +
        '<span class="card-lesson">' + esc(L.lessonTitle) + '</span>' +
      '</div>';

    var img = b.querySelector('img');
    img.addEventListener('error', function () {
      if (img.dataset.fb) { img.src = img.dataset.fb; img.removeAttribute('data-fb'); }
    });

    b.addEventListener('click', function () { openModal(L); });
    return b;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── 모달 ────────────────────────────────────────────── */
  var lastFocus = null;

  function openModal(L) {
    lastFocus = document.activeElement;

    el.mPlayer.innerHTML =
      '<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/' + L.youtubeId +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + esc(L.topic) +
      '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>';

    el.mBook.textContent = bookLabel(L);
    el.mUnit.textContent = L.unit + '단원 ' + L.lesson + '차시';
    el.mTime.textContent = fmtTime(L.seconds);
    el.mTitle.textContent = L.topic;
    el.mDesc.textContent = L.summary;

    el.mKeywords.innerHTML = '';
    (L.keywords || []).forEach(function (k) {
      var li = document.createElement('li');
      li.textContent = k;
      el.mKeywords.appendChild(li);
    });

    el.mYtBtn.href = 'https://youtube.com/shorts/' + L.youtubeId;

    el.mShareBtn.onclick = function () {
      var url = 'https://youtube.com/shorts/' + L.youtubeId;
      var text = bookLabel(L) + ' ' + L.unit + '단원 ' + L.lesson + '차시 ' + L.topic;
      if (navigator.share) { navigator.share({ title: text, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text + '\n' + url).then(function () {
          el.mShareBtn.textContent = '✓ 링크 복사됨';
          setTimeout(function () { el.mShareBtn.textContent = '🔗 공유'; }, 1600);
        });
      }
    };

    el.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    el.modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    el.modal.hidden = true;
    el.mPlayer.innerHTML = '';          // iframe 을 지워 소리를 끊는다
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ── 시작 ────────────────────────────────────────────── */
  function bind() {
    el.pubCards = $('pubCards');
    el.subjectCards = $('subjectCards');
    el.gradeCards = $('gradeCards');
    el.pubNote = $('pubNote');
    el.subNote = $('subNote');
    el.gradeNote = $('gradeNote');
    el.units = $('units');
    el.emptyMsg = $('emptyMsg');
    el.ctaCount = $('ctaCount');
    el.footCount = $('footCount');
    el.modal = $('modal');
    el.mPlayer = $('mPlayer');
    el.mBook = $('mBook');
    el.mUnit = $('mUnit');
    el.mTime = $('mTime');
    el.mTitle = $('mTitle');
    el.mDesc = $('mDesc');
    el.mKeywords = $('mKeywords');
    el.mYtBtn = $('mYtBtn');
    el.mShareBtn = $('mShareBtn');
    el.search = $('searchInput');
    el.searchClear = $('searchClear');

    el.search.addEventListener('input', function () {
      state.query = el.search.value.trim();
      el.searchClear.hidden = !state.query;
      render();
    });
    el.searchClear.addEventListener('click', function () {
      el.search.value = ''; state.query = '';
      el.searchClear.hidden = true; render(); el.search.focus();
    });

    el.modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.modal.hidden) closeModal();
    });

    $('fsBtn').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    });

    function net() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', net);
    window.addEventListener('offline', net);
    net();
  }

  function start() {
    bind();
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.lessons = data;
        // 단계마다 하나뿐이면 고를 것이 없다 — 미리 골라 둔다.
        ['publisher', 'subject', 'grade'].forEach(function (k) {
          var vals = uniq(function (L) { return L[k]; });
          if (vals.length === 1) state[k] = vals[0][0];
        });
        renderPickers();
        render();
      })
      .catch(function (e) {
        el.emptyMsg.hidden = false;
        el.emptyMsg.textContent = '차시 목록을 불러오지 못했습니다. 새로고침해 주세요.';
        console.error(e);
      });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
