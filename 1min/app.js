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
    unit: null,      // null 이면 그 학년의 모든 단원
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
      if (state.unit && L.unit !== state.unit) return false;
      return matches(L, state.query);
    });
  }

  /* ── 출판사 → 교과 → 학년 → 단원 타일 ─────────────────
     선생님이 가장 먼저 확인하는 것은 "내가 쓰는 교과서가 여기 있는가"다.
     그래서 고르기를 검색 아래 네 줄로 둔다.
     위 단계에서 고른 것에 따라 아래 단계의 목록과 건수가 줄어든다. */

  // 타일 아이콘. 교과는 이름으로 고르고, 모르는 교과는 책으로 둔다.
  var SVG = {
    book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/>' +
          '<path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 0 20 18.5z"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 2.4 14.2 0 17' +
           'M12 3.5c-2.4 2.4-2.4 14.2 0 17"/>',
    flask: '<path d="M9 3h6M10 3v6l-4.5 9A2 2 0 0 0 7.3 21h9.4a2 2 0 0 0 1.8-3L14 9V3"/>',
    pen: '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M14.5 5.5l4 4"/>',
    note: '<path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z"/>'
  };
  var SUBJECT_ICON = { '사회': 'globe', '과학': 'flask', '국어': 'pen', '수학': 'note' };

  function svgTile(key) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
           'stroke-linecap="round" stroke-linejoin="round">' + SVG[key] + '</svg>';
  }
  function numTile(n) { return '<span class="opt-num">' + n + '</span>'; }

  // 위 단계에서 고른 것까지만 반영해 센다 (단원 수는 고른 학년 안에서 세야 맞다)
  function poolFor(level) {
    var order = ['publisher', 'subject', 'grade', 'unit'];
    var upto = order.indexOf(level);
    return state.lessons.filter(function (L) {
      for (var i = 0; i < upto; i++) {
        var k = order[i];
        if (state[k] && L[k] !== state[k]) return false;
      }
      return true;
    });
  }

  function uniq(level, pick) {
    var seen = new Map();
    poolFor(level).forEach(function (L) {
      var v = pick(L);
      seen.set(v, (seen.get(v) || 0) + 1);
    });
    return Array.from(seen.entries());   // [[값, 건수], ...]
  }

  function renderPickers() {
    drawCards(el.pubCards, uniq('publisher', function (L) { return L.publisher; }),
      'publisher', function (v) { return v; }, function () { return svgTile('book'); });

    drawCards(el.subjectCards, uniq('subject', function (L) { return L.subject; }),
      'subject', function (v) { return v; },
      function (v) { return svgTile(SUBJECT_ICON[v] || 'book'); });

    drawCards(el.gradeCards, uniq('grade', function (L) { return L.grade; }),
      'grade', function (v) { return v + '학년'; }, function (v) { return numTile(v); });

    drawCards(el.unitCards, uniq('unit', function (L) { return L.unit; }),
      'unit', function (v) { return v + '단원'; }, function (v) { return numTile(v); });
  }

  function drawCards(host, entries, key, labelOf, iconOf) {
    host.innerHTML = '';

    // 단원이 여럿이면 '전체'를 앞에 둔다 — 한 학기를 통째로 보는 쓰임이 있다.
    if (key === 'unit' && entries.length > 1) {
      host.appendChild(tile(null, sum(entries), '전체', svgTile('note'), key));
    }
    entries.forEach(function (pair) {
      host.appendChild(tile(pair[0], pair[1], labelOf(pair[0]), iconOf(pair[0]), key));
    });
  }

  function sum(entries) {
    return entries.reduce(function (n, p) { return n + p[1]; }, 0);
  }

  function tile(value, count, label, icoHtml, key) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt-card';
    b.setAttribute('aria-pressed', state[key] === value ? 'true' : 'false');
    b.innerHTML =
      '<span class="opt-ico">' + icoHtml + '</span>' +
      '<span class="opt-txt">' +
        '<span class="opt-name">' + esc(label) + '</span>' +
        '<span class="opt-sub">' + count + '편</span>' +
      '</span>';
    b.addEventListener('click', function () {
      state[key] = value;
      // 위를 바꾸면 아래 선택이 더는 맞지 않을 수 있으므로 비운다
      var order = ['publisher', 'subject', 'grade', 'unit'];
      order.slice(order.indexOf(key) + 1).forEach(function (k) { state[k] = null; });
      autoPick();
      renderPickers();
      render();
    });
    return b;
  }

  // 단계에 하나뿐이면 고를 것이 없다 — 미리 골라 둔다.
  // 단원은 예외다. 여럿이면 '전체'(null)로 두어 한 학기를 다 보여 준다.
  function autoPick() {
    ['publisher', 'subject', 'grade', 'unit'].forEach(function (k) {
      if (state[k] !== null) return;
      var vals = uniq(k, function (L) { return L[k]; });
      if (vals.length === 1) state[k] = vals[0][0];
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
    el.unitCards = $('unitCards');
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
        autoPick();
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
