/* ===================================================================
   짬짬이 1분사회 — 런처
   ===================================================================
   탐색축은 교과서 진도 순서다(단원 → 차시). 선생님이 찾는 것은 "내일 나가는
   그 차시" 하나이고, 그건 필터보다 목차가 빠르다.

   한 차시에는 영상이 여러 편 있다.
     · 차시 영상   — 차시 전체를 1분으로 (youtubeId)
     · 설명 영상   — 차시 전체를 가로 화면으로 자세히 (explainVideo, 16:9)
     · 핵심 낱말 영상 — 그 차시의 핵심 낱말 3개를 1분씩 (wordVideos)
   그래서 목록은 차시마다 한 줄로 그리고, 카드를 열지 않아도 낱말이 보이게 한다.
   재생 창은 이 영상들을 한 재생목록으로 묶어 끝나면 다음 편으로 넘어간다(이어 보기).

   낱말 영상은 출판사가 달라도 같은 낱말이면 한 편을 같이 쓴다. 그래서
   '낱말 사전' 보기에서는 학년·학기의 낱말을 한곳에 모으고 어느 교과서
   몇 차시에 나오는지 함께 보여 준다.

   데이터는 data/lessons.index.json 하나만 받는다(scripts/gen-data.mjs 생성물).
   =================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'data/lessons.index.json';

  var state = {
    lessons: [],
    view: 'lessons',   // 'lessons' | 'words'
    publisher: null,
    subject: null,
    grade: null,
    unit: null,        // null 이면 그 학년의 모든 단원
    query: ''
  };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function bookKey(L) { return L.subject + '/' + L.grade + '-' + L.semester; }
  function bookLabel(L) { return L.subject + ' ' + L.grade + '-' + L.semester; }
  function pubShort(p) { return p.replace('교과서', '').replace('교육', '').replace('미디어', ''); }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }
  function fmtTotal(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + '분' + (s ? ' ' + s + '초' : '');
  }

  /* 차시 번호 — 연차시(두 차시를 한 번에 하는 수업)는 '6~7' 처럼 범위로 보인다. */
  function lessonNo(L) {
    return L.lessonEnd && L.lessonEnd > L.lesson ? L.lesson + '~' + L.lessonEnd : String(L.lesson);
  }
  // 검색용: 범위 안의 차시 번호마다 'N차시' 를 만든다('7차시' 로 찾아도 6~7차시가 나오게)
  function lessonWords(L) {
    var w = [], end = L.lessonEnd && L.lessonEnd > L.lesson ? L.lessonEnd : L.lesson;
    for (var n = L.lesson; n <= end; n++) w.push(L.unit + '단원 ' + n + '차시');
    return w.join(' ') + ' ' + lessonNo(L) + '차시';
  }

  function words(L) { return L.wordVideos || []; }
  function explain(L) { return L.explainVideo || null; }
  // 차시 영상 + 설명 영상 + 낱말 영상의 편수·길이
  function extraCount(L) { return (explain(L) ? 1 : 0) + words(L).length; }
  function totalSec(L) {
    return L.seconds + (explain(L) ? explain(L).seconds : 0) + words(L).reduce(function (n, w) { return n + w.seconds; }, 0);
  }

  /* 유튜브 썸네일 — Shorts 는 oardefault 가 원본 비율(9:16)이다. 없으면 hqdefault. */
  function thumbUrl(id) { return 'https://i.ytimg.com/vi/' + id + '/oardefault.jpg'; }
  function thumbFallback(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── 검색 ────────────────────────────────────────────── */
  function hit(hay, q) {
    hay = hay.toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (t) { return hay.indexOf(t) >= 0; });
  }
  function matches(L, q) {
    if (!q) return true;
    return hit(
      L.topic + ' ' + L.lessonTitle + ' ' + L.unitTitle + ' ' +
      L.summary + ' ' + (L.keywords || []).join(' ') + ' ' +
      words(L).map(function (w) { return w.word; }).join(' ') + ' ' +
      L.subject + ' ' + L.grade + '-' + L.semester + ' ' + lessonWords(L), q);
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
     출판사·교과·학년은 학기 내내 거의 안 바뀌므로 드롭다운으로 접고 기억해 둔다.
     단원은 진도 따라 자주 바뀌므로 펼쳐 둔다(기억하지 않는다). */

  var REMEMBER_KEY = 'jjam1min:pick';
  var LEVELS = ['publisher', 'subject', 'grade', 'unit'];

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
    return Array.from(seen.entries());
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
      var only = entries[0];
      var span = document.createElement('span');
      span.className = 'sel-fixed';
      span.innerHTML = only
        ? esc(LABEL[key](only[0])) + '<span class="n">' + only[1] + '차시</span>'
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
      o.textContent = LABEL[key](pair[0]) + ' (' + pair[1] + '차시)';
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
    if (entries.length > 1) el.unitChips.appendChild(unitChip(null, '전체', sum(entries)));
    entries.forEach(function (p) { el.unitChips.appendChild(unitChip(p[0], p[0] + '단원', p[1])); });
  }

  function sum(entries) { return entries.reduce(function (n, p) { return n + p[1]; }, 0); }

  function unitChip(value, label, count) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label + ' · ' + count;
    b.setAttribute('aria-pressed', state.unit === value ? 'true' : 'false');
    b.addEventListener('click', function () { choose('unit', value); });
    return b;
  }

  function choose(key, value) {
    state[key] = value;
    LEVELS.slice(LEVELS.indexOf(key) + 1).forEach(function (k) { state[k] = null; });
    autoPick();
    remember();
    renderPickers();
    render();
  }

  function autoPick() {
    ['publisher', 'subject', 'grade'].forEach(function (k) {
      var vals = uniq(k);
      if (!vals.length) { state[k] = null; return; }
      var still = vals.some(function (p) { return p[0] === state[k]; });
      if (!still) state[k] = vals[0][0];
    });
    var units = uniq('unit');
    if (units.length === 1) state.unit = units[0][0];
    else if (state.unit !== null && !units.some(function (p) { return p[0] === state.unit; })) state.unit = null;
  }

  function remember() {
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        publisher: state.publisher, subject: state.subject, grade: state.grade
      }));
    } catch (e) { /* 사생활 보호 모드 등 */ }
  }

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

  /* ── 보기 전환: 차시별 / 낱말 사전 ───────────────────── */
  function setView(v) {
    state.view = v;
    el.tabLessons.setAttribute('aria-selected', v === 'lessons' ? 'true' : 'false');
    el.tabWords.setAttribute('aria-selected', v === 'words' ? 'true' : 'false');
    document.body.classList.toggle('view-words', v === 'words');
    el.search.placeholder = v === 'words'
      ? '낱말 찾기 (예: 고인돌, 선사 시대)'
      : '차시명·주제·낱말로 찾기 (예: 고인돌, 삼국, 불국사)';
    try { history.replaceState(null, '', v === 'words' ? '#words' : location.pathname + location.search); } catch (e) {}
    render();
  }

  function render() {
    if (state.view === 'words') renderWords(); else renderLessons();
    var total = state.lessons.length;
    el.ctaCount.textContent = total;
    el.ctaWords.textContent = allWordVideos().length;
    el.ctaExplain.textContent = state.lessons.filter(explain).length;
  }

  /* ── 차시별: 단원 → 차시 한 줄씩 ─────────────────────── */
  function renderLessons() {
    var list = visible();
    el.units.innerHTML = '';
    el.dict.hidden = true;
    el.units.hidden = false;
    el.emptyMsg.hidden = list.length > 0;
    el.emptyMsg.textContent = '찾는 차시가 없어요. 검색어를 바꿔 보세요.';

    var groups = [], lastKey = null;
    list.forEach(function (L) {
      var k = bookKey(L) + '/' + L.unit;
      if (k !== lastKey) {
        groups.push({ book: bookLabel(L), unit: L.unit, unitTitle: L.unitTitle, items: [] });
        lastKey = k;
      }
      groups[groups.length - 1].items.push(L);
    });

    groups.forEach(function (g) {
      var sec = document.createElement('section');
      sec.className = 'unit';
      var nWords = g.items.reduce(function (n, L) { return n + words(L).length; }, 0);
      var nEx = g.items.filter(explain).length;
      var head = document.createElement('div');
      head.className = 'unit-head';
      head.innerHTML =
        '<span class="unit-no">' + esc(g.book) + ' ' + g.unit + '단원</span>' +
        '<span class="unit-title">' + esc(g.unitTitle) + '</span>' +
        '<span class="unit-count">' + g.items.length + '차시' + (nEx ? ' · 설명 영상 ' + nEx + '편' : '') + (nWords ? ' · 낱말 영상 ' + nWords + '편' : '') + '</span>';
      sec.appendChild(head);

      var rows = document.createElement('div');
      rows.className = 'rows';
      g.items.forEach(function (L) { rows.appendChild(row(L)); });
      sec.appendChild(rows);
      el.units.appendChild(sec);
    });

    el.footCount.textContent = state.query ? '검색 결과 ' + list.length + '차시' : '모두 ' + state.lessons.length + '차시';
  }

  function row(L) {
    var W = words(L), X = explain(L);
    var r = document.createElement('article');
    r.className = 'row';

    var th = document.createElement('button');
    th.type = 'button';
    th.className = 'row-thumb';
    th.setAttribute('aria-label', lessonNo(L) + '차시 차시 영상 재생');
    th.innerHTML =
      '<img loading="lazy" decoding="async" alt="" src="' + thumbUrl(L.youtubeId) + '" data-fb="' + thumbFallback(L.youtubeId) + '" />' +
      '<span class="thumb-time">' + fmtTime(L.seconds) + '</span>' +
      '<span class="thumb-play"><svg aria-hidden="true"><use href="#i-play"/></svg></span>';
    var img = th.querySelector('img');
    img.addEventListener('error', function () { if (img.dataset.fb) { img.src = img.dataset.fb; img.removeAttribute('data-fb'); } });
    th.addEventListener('click', function () { openPlayer(L, 0, false); });

    var body = document.createElement('div');
    body.className = 'row-body';
    body.innerHTML =
      '<span class="row-no">' + lessonNo(L) + '차시' + (L.topic && L.topic !== L.lessonTitle ? ' · ' + esc(L.topic) : '') + '</span>' +
      '<button type="button" class="row-title">' + esc(L.lessonTitle) + '</button>' +
      '<p class="row-sum">' + esc(L.summary) + '</p>';
    body.querySelector('.row-title').addEventListener('click', function () { openPlayer(L, 0, false); });

    if (W.length || X) {
      var chips = document.createElement('div');
      chips.className = 'wchips';
      if (X) {
        var xc = document.createElement('button');
        xc.type = 'button';
        xc.className = 'wchip xchip';
        xc.title = '차시 전체를 가로 화면으로 자세히 설명하는 영상';
        xc.innerHTML = '<span class="w">설명 영상</span><span class="t">' + fmtTime(X.seconds) + '</span>';
        xc.addEventListener('click', function () { openPlayer(L, 1, false); });
        chips.appendChild(xc);
      }
      W.forEach(function (w, i) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'wchip';
        c.title = w.meaning || w.word;
        c.innerHTML = '<span class="w">' + esc(w.word) + '</span><span class="t">' + fmtTime(w.seconds) + '</span>';
        c.addEventListener('click', function () { openPlayer(L, i + 1 + (X ? 1 : 0), false); });
        chips.appendChild(c);
      });
      body.appendChild(chips);
    }

    var act = document.createElement('div');
    act.className = 'row-act';
    var go = document.createElement('button');
    go.type = 'button';
    go.className = 'go-btn';
    if (W.length || X) {
      go.innerHTML = '<svg aria-hidden="true"><use href="#i-play"/></svg>' + (extraCount(L) + 1) + '편 이어 보기<span class="t">' + fmtTotal(totalSec(L)) + '</span>';
      go.addEventListener('click', function () { openPlayer(L, 0, true); });
    } else {
      go.className += ' plain';
      go.innerHTML = '<svg aria-hidden="true"><use href="#i-play"/></svg>차시 영상<span class="t">' + fmtTime(L.seconds) + '</span>';
      go.addEventListener('click', function () { openPlayer(L, 0, false); });
    }
    act.appendChild(go);

    r.appendChild(th);
    r.appendChild(body);
    r.appendChild(act);
    return r;
  }

  /* ── 낱말 사전 ───────────────────────────────────────────
     같은 낱말 영상(youtubeId)을 쓰는 차시를 모은다. 교과·학년이 같으면 출판사는 묻지 않는다. */
  function allWordVideos(filter) {
    var byId = new Map();
    state.lessons.forEach(function (L) {
      if (filter && !filter(L)) return;
      words(L).forEach(function (w) {
        var e = byId.get(w.youtubeId);
        if (!e) { e = { word: w.word, youtubeId: w.youtubeId, seconds: w.seconds, meaning: w.meaning || '', lessons: [] }; byId.set(w.youtubeId, e); }
        e.lessons.push(L);
      });
    });
    return Array.from(byId.values());
  }

  function renderWords() {
    el.units.hidden = true;
    el.dict.hidden = false;
    var list = allWordVideos(function (L) {
      return (!state.subject || L.subject === state.subject) && (!state.grade || L.grade === state.grade);
    }).filter(function (e) {
      return !state.query || hit(e.word + ' ' + e.meaning, state.query);
    }).sort(function (a, b) { return a.word.localeCompare(b.word, 'ko'); });

    el.dict.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'dict-head';
    var any = state.lessons.find(function (L) { return L.subject === state.subject && L.grade === state.grade; });
    head.innerHTML = '<span class="unit-no">' + (any ? esc(bookLabel(any)) : '') + ' 핵심 낱말</span>' +
      '<span class="unit-count">' + list.length + '개 · 가나다순 · 출판사가 달라도 같은 낱말은 영상 하나를 같이 씁니다</span>';
    el.dict.appendChild(head);

    var grid = document.createElement('div');
    grid.className = 'dict-grid';
    list.forEach(function (e) {
      var c = document.createElement('article');
      c.className = 'wcard';
      var refs = e.lessons.map(function (L) {
        var mine = state.publisher === L.publisher;
        return '<button type="button" class="ref' + (mine ? ' mine' : '') + '" data-id="' + esc(L.id) + '">' +
          esc(pubShort(L.publisher)) + ' ' + L.unit + '-' + lessonNo(L) + '</button>';
      }).join('');
      c.innerHTML =
        '<button type="button" class="wcard-play" aria-label="' + esc(e.word) + ' 영상 재생">' +
          '<svg aria-hidden="true"><use href="#i-play"/></svg>' +
          '<span class="k">' + esc(e.word) + '</span><span class="t">' + fmtTime(e.seconds) + '</span>' +
        '</button>' +
        (e.meaning ? '<p class="m">' + esc(e.meaning) + '</p>' : '') +
        '<div class="refs"><span class="cap">나오는 차시</span>' + refs + '</div>';
      c.querySelector('.wcard-play').addEventListener('click', function () {
        var L = e.lessons.find(function (x) { return x.publisher === state.publisher; }) || e.lessons[0];
        var idx = words(L).findIndex(function (w) { return w.youtubeId === e.youtubeId; });
        openPlayer(L, idx + 1 + (explain(L) ? 1 : 0), false);
      });
      Array.prototype.forEach.call(c.querySelectorAll('.ref'), function (b) {
        b.addEventListener('click', function () {
          var L = e.lessons.find(function (x) { return x.id === b.dataset.id; });
          openPlayer(L, 0, false);
        });
      });
      grid.appendChild(c);
    });
    el.dict.appendChild(grid);

    el.emptyMsg.hidden = list.length > 0;
    el.emptyMsg.textContent = state.query
      ? '찾는 낱말이 없어요. 검색어를 바꿔 보세요.'
      : '이 학년의 핵심 낱말 영상은 아직 준비 중이에요.';
    el.footCount.textContent = '핵심 낱말 ' + list.length + '개';
  }

  /* ── 재생 창: 차시 영상 + 낱말 영상 = 한 재생목록 ────────
     유튜브 IFrame API 로 영상이 끝난 것을 알아 '이어 보기'가 켜져 있으면 다음 편을 튼다.
     API 를 못 불러오면(오프라인·차단) 그냥 iframe 으로 틀고 이어 보기만 안 된다. */
  var AUTO_KEY = 'jjam1min:auto';
  var P = { L: null, items: [], i: 0, yt: null, ready: false, apiState: 'none' };
  var lastFocus = null;

  function autoOn() {
    try { return localStorage.getItem(AUTO_KEY) !== '0'; } catch (e) { return true; }
  }

  function loadApi() {
    if (P.apiState !== 'none') return;
    P.apiState = 'loading';
    window.onYouTubeIframeAPIReady = function () { P.apiState = 'ready'; if (!el.modal.hidden) mountPlayer(); };
    var s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = function () { P.apiState = 'failed'; if (!el.modal.hidden) mountPlayer(); };
    document.head.appendChild(s);
    setTimeout(function () { if (P.apiState === 'loading') { P.apiState = 'failed'; if (!el.modal.hidden && !P.yt) mountPlayer(); } }, 6000);
  }

  function playlistOf(L) {
    var X = explain(L);
    return [{ kind: 'lesson', id: L.youtubeId, sec: L.seconds, title: '차시 영상', sub: '차시 전체를 1분으로', meaning: L.summary }]
      .concat(X ? [{ kind: 'explain', id: X.youtubeId, sec: X.seconds, title: '설명 영상', sub: '차시 전체를 가로 화면으로 자세히', wide: true }] : [])
      .concat(words(L).map(function (w) {
        return { kind: 'word', id: w.youtubeId, sec: w.seconds, title: w.word, sub: w.meaning || '', meaning: w.meaning || '' };
      }));
  }

  function openPlayer(L, start, auto) {
    lastFocus = document.activeElement;
    P.L = L;
    P.items = playlistOf(L);
    P.i = Math.max(0, Math.min(start || 0, P.items.length - 1));
    if (auto && !autoOn()) { try { localStorage.setItem(AUTO_KEY, '1'); } catch (e) {} }

    el.mBook.textContent = L.publisher + ' · ' + bookLabel(L);
    el.mUnit.textContent = L.unit + '단원 ' + lessonNo(L) + '차시';
    el.mTitle.textContent = L.lessonTitle;
    el.mAuto.checked = autoOn();
    el.mAutoWrap.hidden = P.items.length < 2;
    el.mNav.hidden = P.items.length < 2;

    el.mKeywords.innerHTML = '';
    (L.keywords || []).forEach(function (k) {
      var li = document.createElement('li'); li.textContent = k; el.mKeywords.appendChild(li);
    });

    drawList();
    el.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    loadApi();
    mountPlayer();
    el.modal.querySelector('.modal-close').focus();
  }

  function drawList() {
    el.mList.innerHTML = '';
    var tot = 0;
    P.items.forEach(function (it, i) {
      tot += it.sec || 0;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pl-item' + (it.kind === 'lesson' ? ' is-lesson' : '');
      b.setAttribute('aria-current', i === P.i ? 'true' : 'false');
      b.innerHTML = '<span class="n">' + (i + 1) + '</span>' +
        '<span class="w"><b>' + esc(it.title) + '</b>' + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</span>' +
        '<span class="t">' + fmtTime(it.sec) + '</span>';
      b.addEventListener('click', function () { go(i); });
      el.mList.appendChild(b);
    });
    el.mListWrap.hidden = P.items.length < 2;
    el.mTotal.textContent = P.items.length > 1 ? P.items.length + '편 · 모두 ' + fmtTotal(tot) : '';
    var cur = P.items[P.i];
    el.mTime.textContent = fmtTime(cur.sec);
    el.mDesc.textContent = cur.kind !== 'word' ? P.L.summary : '';
    el.mPanel.classList.toggle('is-wide', !!cur.wide);
    el.mWordMean.hidden = cur.kind !== 'word' || !cur.meaning;
    el.mWordMean.innerHTML = cur.kind === 'word' ? '<b>' + esc(cur.title) + '</b> ' + esc(cur.meaning) : '';
    el.mDesc.hidden = cur.kind === 'word';
    el.mYtBtn.href = cur.wide ? 'https://www.youtube.com/watch?v=' + cur.id : 'https://youtube.com/shorts/' + cur.id;
    el.mPrev.disabled = P.i === 0;
    el.mNext.disabled = P.i >= P.items.length - 1;
  }

  function mountPlayer() {
    var cur = P.items[P.i];
    if (!cur) return;
    if (P.apiState === 'ready' && window.YT && YT.Player) {
      if (P.yt && P.ready) { P.yt.loadVideoById(cur.id); return; }
      if (P.yt) return; // 만드는 중 — onReady 에서 지금 편을 튼다
      el.mPlayer.innerHTML = '<div class="frame"><div id="ytHost"></div></div>';
      P.ready = false;
      P.yt = new YT.Player('ytHost', {
        host: 'https://www.youtube-nocookie.com',
        videoId: cur.id,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: function (e) {
            P.ready = true;
            var want = P.items[P.i];
            if (want && e.target.getVideoData && e.target.getVideoData().video_id !== want.id) e.target.loadVideoById(want.id);
            else e.target.playVideo();
          },
          onStateChange: function (e) {
            if (e.data === 0 && el.mAuto.checked && P.i < P.items.length - 1) go(P.i + 1);
          }
        }
      });
      return;
    }
    if (P.apiState === 'loading') {
      el.mPlayer.innerHTML = '<div class="frame"><div class="frame-wait">영상을 불러오는 중…</div></div>';
      return;
    }
    // API 없이: 그냥 iframe (이어 보기는 동작하지 않는다)
    el.mPlayer.innerHTML =
      '<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/' + cur.id +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + esc(cur.title) +
      '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>';
  }

  function go(i) {
    if (i < 0 || i >= P.items.length) return;
    P.i = i;
    drawList();
    mountPlayer();
  }

  function closeModal() {
    el.modal.hidden = true;
    el.mPanel.classList.remove('is-wide');
    if (P.yt && P.yt.destroy) { try { P.yt.destroy(); } catch (e) {} }
    P.yt = null; P.ready = false;
    el.mPlayer.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function share() {
    var cur = P.items[P.i], L = P.L;
    var url = cur.wide ? 'https://www.youtube.com/watch?v=' + cur.id : 'https://youtube.com/shorts/' + cur.id;
    var text = bookLabel(L) + ' ' + L.unit + '단원 ' + lessonNo(L) + '차시 ' + (cur.kind === 'word' ? '핵심 낱말 ' + cur.title : cur.kind === 'explain' ? L.topic + ' 설명 영상' : L.topic);
    if (navigator.share) { navigator.share({ title: text, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text + '\n' + url).then(function () {
        el.mShareBtn.textContent = '✓ 링크 복사됨';
        setTimeout(function () { el.mShareBtn.textContent = '공유'; }, 1600);
      });
    }
  }

  /* ── 시작 ────────────────────────────────────────────── */
  function bind() {
    ['pubSlot', 'subjectSlot', 'gradeSlot', 'unitChips', 'units', 'dict', 'emptyMsg', 'ctaCount', 'ctaWords',
     'footCount', 'ctaExplain', 'modal', 'mPlayer', 'mBook', 'mUnit', 'mTime', 'mTitle', 'mDesc', 'mWordMean', 'mKeywords',
     'mList', 'mListWrap', 'mTotal', 'mAuto', 'mAutoWrap', 'mNav', 'mPrev', 'mNext', 'mYtBtn', 'mShareBtn',
     'tabLessons', 'tabWords'].forEach(function (id) { el[id] = $(id); });
    el.mPanel = el.modal.querySelector('.modal-panel');
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

    el.tabLessons.addEventListener('click', function () { setView('lessons'); });
    el.tabWords.addEventListener('click', function () { setView('words'); });

    el.mPrev.addEventListener('click', function () { go(P.i - 1); });
    el.mNext.addEventListener('click', function () { go(P.i + 1); });
    el.mAuto.addEventListener('change', function () {
      try { localStorage.setItem(AUTO_KEY, el.mAuto.checked ? '1' : '0'); } catch (e) {}
    });
    el.mShareBtn.addEventListener('click', share);

    el.modal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (el.modal.hidden) return;
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight' && P.items.length > 1) { e.preventDefault(); go(P.i + 1); }
      else if (e.key === 'ArrowLeft' && P.items.length > 1) { e.preventDefault(); go(P.i - 1); }
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
        setView(location.hash === '#words' ? 'words' : 'lessons');
      })
      .catch(function (e) {
        el.emptyMsg.hidden = false;
        el.emptyMsg.textContent = '차시 목록을 불러오지 못했습니다. 새로고침해 주세요.';
        console.error(e);
      });

    if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
