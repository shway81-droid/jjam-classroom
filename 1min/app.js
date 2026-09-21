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

  /* ── 출판사 · 교과 · 학년 · 단원 고르기 ─────────────────
     네 항목은 바꾸는 빈도가 다르다. 출판사·교과·학년은 5학년 담임이면
     3월부터 2월까지 안 바뀌고, 단원은 진도 따라 계속 바뀐다.
     그래서 앞의 셋은 드롭다운으로 접고 단원만 펼쳐 둔다.

     앞의 셋은 브라우저에 기억해 둔다 — 두 번째 방문부터는 건드릴 일이 없다.
     단원은 기억하지 않는다. 진도는 매번 다르다. */

  var REMEMBER_KEY = 'jjam1min:pick';
  var LEVELS = ['publisher', 'subject', 'grade', 'unit'];

  // 위 단계에서 고른 것까지만 반영해 센다 (단원 수는 고른 학년 안에서 세야 맞다)
  function poolFor(level) {
    var upto = LEVELS.indexOf(level);
    return state.lessons.filter(function (L) {
      for (var i = 0; i < upto; i++) {
        var k = LEVELS[i];
        if (state[k] && L[k] !== state[k]) return false;
      }
      return true;
    });
  }

  function uniq(level) {
    var seen = new Map();
    poolFor(level).forEach(function (L) {
      var v = L[level];
      seen.set(v, (seen.get(v) || 0) + 1);
    });
    return Array.from(seen.entries());   // [[값, 건수], ...]
  }

  var LABEL = {
    publisher: function (v) { return v; },
    subject: function (v) { return v; },
    grade: function (v) { return v + '학년'; },
    unit: function (v) { return v + '단원'; }
  };

  function renderPickers() {
    drawSelect(el.pubSlot, 'publisher', 'pubSelect');
    drawSelect(el.subjectSlot, 'subject', 'subjectSelect');
    drawSelect(el.gradeSlot, 'grade', 'gradeSelect');
    drawUnits();
  }

  function drawSelect(host, key, id) {
    var entries = uniq(key);
    host.innerHTML = '';

    if (entries.length <= 1) {
      // 하나뿐이면 드롭다운이 아니라 그냥 글자로 보여 준다
      var only = entries[0];
      var span = document.createElement('span');
      span.className = 'sel-fixed';
      span.innerHTML = only
        ? esc(LABEL[key](only[0])) + '<span class="n">' + only[1] + '편</span>'
        : '<span class="n">없음</span>';
      host.appendChild(span);
      return;
    }

    var sel = document.createElement('select');
    sel.className = 'pick-select';
    sel.id = id;
    entries.forEach(function (pair) {
      var o = document.createElement('option');
      o.value = String(pair[0]);
      o.textContent = LABEL[key](pair[0]) + ' (' + pair[1] + '편)';
      if (state[key] === pair[0]) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      var picked = entries.find(function (p) { return String(p[0]) === sel.value; });
      choose(key, picked ? picked[0] : null);
    });
    host.appendChild(sel);
  }

  function drawUnits() {
    var entries = uniq('unit').sort(function (x, y) { return x[0] - y[0]; });
    el.unitChips.innerHTML = '';

    // 단원이 여럿일 때만 '전체'를 둔다. 하나뿐이면 1단원과 같은 뜻이다.
    if (entries.length > 1) {
      el.unitChips.appendChild(unitChip(null, '전체', sum(entries)));
    }
    entries.forEach(function (p) {
      el.unitChips.appendChild(unitChip(p[0], p[0] + '단원', p[1]));
    });
  }

  function sum(entries) {
    return entries.reduce(function (n, p) { return n + p[1]; }, 0);
  }

  function unitChip(value, label, count) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label + ' · ' + count + '편';
    b.setAttribute('aria-pressed', state.unit === value ? 'true' : 'false');
    b.addEventListener('click', function () { choose('unit', value); });
    return b;
  }

  function choose(key, value) {
    state[key] = value;
    // 위를 바꾸면 아래 선택이 더는 맞지 않는다 (5학년 1단원과 6학년 1단원은 다른 단원이다)
    LEVELS.slice(LEVELS.indexOf(key) + 1).forEach(function (k) { state[k] = null; });
    autoPick();
    remember();
    renderPickers();
    render();
  }

  // 출판사·교과·학년은 늘 하나가 정해져 있어야 한다. 비워 두면 드롭다운에는
  // 첫 항목이 보이는데 실제로는 전체가 걸려서, 보이는 것과 적용된 것이 어긋난다.
  // (위를 바꿔 아래 선택이 더는 없는 값이 된 경우도 여기서 첫 항목으로 되돌린다.)
  //
  // 단원만 예외다. 여럿이면 '전체'(null)로 두어 한 학기를 다 보여 준다.
  function autoPick() {
    ['publisher', 'subject', 'grade'].forEach(function (k) {
      var vals = uniq(k);
      if (!vals.length) { state[k] = null; return; }
      var still = vals.some(function (p) { return p[0] === state[k]; });
      if (!still) state[k] = vals[0][0];
    });

    var units = uniq('unit');
    if (units.length === 1) state.unit = units[0][0];
    else if (state.unit !== null && !units.some(function (p) { return p[0] === state.unit; })) {
      state.unit = null;
    }
  }

  function remember() {
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        publisher: state.publisher, subject: state.subject, grade: state.grade
      }));
    } catch (e) { /* 사생활 보호 모드 등 — 기억하지 못해도 동작에는 지장이 없다 */ }
  }

  // 기억해 둔 값을 되살린다. 그 사이에 데이터가 바뀌어 없어진 값은 버린다.
  function restore() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'); } catch (e) { saved = null; }
    if (!saved) return;
    ['publisher', 'subject', 'grade'].forEach(function (k) {
      if (saved[k] === undefined || saved[k] === null) return;
      var ok = uniq(k).some(function (p) { return p[0] === saved[k]; });
      if (ok) state[k] = saved[k];
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
    el.pubSlot = $('pubSlot');
    el.subjectSlot = $('subjectSlot');
    el.gradeSlot = $('gradeSlot');
    el.unitChips = $('unitChips');
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
        restore();
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
