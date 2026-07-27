/* 짬짬이 이야기 — 자투리 시간 이야기 말하기 활동 */
(function () {
  'use strict';

  // ── 상수 ─────────────────────────────────────────────
  var TYPES = {
    'next-story': { emoji: '🔮', name: '다음 이야기', desc: '다음 장면을 상상해요', color: '#6145B5' },
    'why':        { emoji: '🕵️', name: '왜 그랬을까', desc: '행동의 이유를 추리해요', color: '#4FA8E8' },
    'mind':       { emoji: '💗', name: '마음 읽기', desc: '인물의 감정을 읽어요', color: '#C14C40' },
    'choice':     { emoji: '⚖️', name: '선택 이야기', desc: '나의 선택과 이유를 말해요', color: '#12A57C' },
    'solve':      { emoji: '💡', name: '어떻게 할까', desc: '해결할 방법을 찾아 말해요', color: '#FDB333' }
  };

  var GRADES = {
    lower:  { name: '1~2학년', sub: '저학년' },
    middle: { name: '3~4학년', sub: '중학년' },
    upper:  { name: '5~6학년', sub: '고학년' }
  };

  // 시간 모드별 단계 구성(초). 3분은 대화 단계 없이 압축 진행.
  var PLANS = {
    3: [ ['STORY', 40], ['THINK', 30], ['PRESENT', 90] ],
    5: [ ['STORY', 40], ['THINK', 30], ['TALK', 60], ['PRESENT', 120], ['EXTEND', 50] ],
    7: [ ['STORY', 60], ['THINK', 30], ['TALK', 90], ['PRESENT', 120], ['EXTEND', 90] ]
  };

  var STAGE_INFO = {
    STORY:   { badge: '1️⃣ 이야기', title: '이야기 읽기' },
    THINK:   { badge: '2️⃣ 생각', title: '혼자 생각하기' },
    TALK:    { badge: '3️⃣ 대화', title: '이야기 나누기' },
    PRESENT: { badge: '🎤 발표', title: '발표하기' },
    EXTEND:  { badge: '➕ 한 걸음 더', title: '생각 넓히기' }
  };

  var PRAISES = [
    '오늘도 멋진 생각이 가득했어요!',
    '정답보다 빛나는 근거들이었어요!',
    '친구들의 다양한 생각, 최고예요!',
    '상상력이 교실을 가득 채웠어요!'
  ];

  var LS_KEY = 'jjam-story-v1';
  var RECENT_MAX = 10;

  // ── 상태 ─────────────────────────────────────────────
  var stories = [];
  var byId = {};
  var store = loadStore();

  var S = {
    type: null,          // 선택한 유형
    grade: store.grade || 'middle',
    duration: store.duration || 5,
    story: null,         // 현재 이야기 객체
    stages: [],          // [ [name, seconds], ... ]
    stageIdx: 0,
    revealed: {},        // { hint: bool, ideas: bool }
    picked: [],          // 뽑힌 번호들
    timer: { total: 0, remain: 0, running: false, handle: null }
  };

  // ── 저장소 ───────────────────────────────────────────
  function loadStore() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var s = raw ? JSON.parse(raw) : {};
      s.favorites = s.favorites || [];
      s.recent = s.recent || [];
      s.classSize = s.classSize || 24;
      return s;
    } catch (e) {
      return { favorites: [], recent: [], classSize: 24 };
    }
  }

  function saveStore() {
    store.grade = S.grade;
    store.duration = S.duration;
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  // ── 유틸 ─────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function show(screenId) {
    ['screen-home', 'screen-setup', 'screen-play', 'screen-done'].forEach(function (id) {
      $(id).hidden = (id !== screenId);
    });
    window.scrollTo(0, 0);
  }

  // ── 추천 로직 (FR-01, FR-07) ─────────────────────────
  function candidates(excludeRecent) {
    return stories.filter(function (st) {
      if (st.sensitivity !== 'low') return false;
      if (st.type !== S.type) return false;
      if (st.grades.indexOf(S.grade) === -1) return false;
      if (st.durationOptions.indexOf(S.duration) === -1) return false;
      if (excludeRecent && store.recent.indexOf(st.id) !== -1) return false;
      return true;
    });
  }

  function recommend(excludeId) {
    var pool = candidates(true).filter(function (st) { return st.id !== excludeId; });
    if (!pool.length) pool = candidates(false).filter(function (st) { return st.id !== excludeId; });
    if (!pool.length) pool = candidates(false); // 교체 불가능하면 현재 포함 전체에서
    return pool.length ? pick(pool) : null;
  }

  function markRecent(id) {
    store.recent = store.recent.filter(function (x) { return x !== id; });
    store.recent.unshift(id);
    if (store.recent.length > RECENT_MAX) store.recent.length = RECENT_MAX;
    saveStore();
  }

  // ── 홈 ───────────────────────────────────────────────
  function renderHome() {
    var grid = $('type-grid');
    grid.innerHTML = '';
    Object.keys(TYPES).forEach(function (key) {
      var t = TYPES[key];
      var count = stories.filter(function (s) { return s.type === key; }).length;
      var btn = document.createElement('button');
      btn.className = 'type-card';
      btn.type = 'button';
      btn.style.setProperty('--type-color', t.color);
      btn.innerHTML =
        '<span class="type-emoji">' + t.emoji + '</span>' +
        '<span class="type-name">' + esc(t.name) + '</span>' +
        '<span class="type-desc">' + esc(t.desc) + ' · ' + count + '편</span>';
      btn.addEventListener('click', function () { openSetup(key); });
      grid.appendChild(btn);
    });
    renderChipRow('fav-section', 'fav-row', store.favorites);
    renderChipRow('recent-section', 'recent-row', store.recent);
  }

  function renderChipRow(sectionId, rowId, ids) {
    var sec = $(sectionId), row = $(rowId);
    var valid = ids.filter(function (id) { return byId[id]; });
    sec.hidden = !valid.length;
    row.innerHTML = '';
    valid.forEach(function (id) {
      var st = byId[id];
      var chip = document.createElement('button');
      chip.className = 'story-chip';
      chip.type = 'button';
      chip.textContent = TYPES[st.type].emoji + ' ' + st.title;
      chip.addEventListener('click', function () {
        S.type = st.type;
        startPlay(st);
      });
      row.appendChild(chip);
    });
  }

  // ── 조건 선택 ────────────────────────────────────────
  function openSetup(typeKey) {
    S.type = typeKey;
    var t = TYPES[typeKey];
    $('setup-title').textContent = t.emoji + ' ' + t.name;
    renderOptions('opt-grade', GRADES, S.grade, function (k) { S.grade = k; }, function (k, v) {
      return v.name + '<span class="opt-sub">' + v.sub + '</span>';
    });
    var durations = { 3: null, 5: null, 7: null };
    renderOptions('opt-duration', durations, String(S.duration), function (k) { S.duration = Number(k); }, function (k) {
      return k + '분';
    });
    show('screen-setup');
  }

  function renderOptions(rowId, obj, selected, onPick, labelFn) {
    var row = $(rowId);
    row.innerHTML = '';
    Object.keys(obj).forEach(function (key) {
      var btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(key === String(selected)));
      btn.innerHTML = labelFn(key, obj[key]);
      btn.addEventListener('click', function () {
        onPick(key);
        Array.prototype.forEach.call(row.children, function (c) {
          c.setAttribute('aria-checked', 'false');
        });
        btn.setAttribute('aria-checked', 'true');
      });
      row.appendChild(btn);
    });
  }

  // ── 진행: 단계 구성 ──────────────────────────────────
  function buildStages() {
    return PLANS[S.duration].map(function (p) { return p.slice(); });
  }

  function startPlay(story) {
    S.story = story;
    S.stages = buildStages();
    S.stageIdx = 0;
    S.revealed = {};
    S.picked = [];
    markRecent(story.id);
    show('screen-play');
    renderStage();
  }

  function startFromSetup() {
    var st = recommend(null);
    if (!st) {
      alert('조건에 맞는 이야기가 아직 없습니다. 다른 조건을 선택해 주세요.');
      return;
    }
    saveStore();
    startPlay(st);
  }

  // ── 진행: 화면 렌더 ──────────────────────────────────
  function stageName() { return S.stages[S.stageIdx][0]; }
  function stageSecs() { return S.stages[S.stageIdx][1]; }

  function renderStage() {
    var name = stageName();
    var info = STAGE_INFO[name];
    var st = S.story;

    // 단계 점(진행 표시)
    var dots = $('stage-dots');
    dots.innerHTML = '';
    S.stages.forEach(function (p, i) {
      var d = document.createElement('span');
      d.className = 'stage-dot' + (i === S.stageIdx ? ' on' : (i < S.stageIdx ? ' past' : ''));
      d.textContent = STAGE_INFO[p[0]].title;
      dots.appendChild(d);
    });

    $('stage-badge').textContent = info.badge;
    $('stage-title').textContent = info.title;
    updateFavBtn();

    var body = $('stage-body');
    body.innerHTML = renderStageBody(name, st);
    bindStageEvents(name);

    // 다음 버튼 라벨
    var isLast = S.stageIdx === S.stages.length - 1;
    var nextBtn = $('btn-next');
    nextBtn.textContent = isLast ? '✅ 활동 마치기' : '다음 단계 →';
    nextBtn.classList.remove('pulse');

    // 이전 버튼: 첫 단계에서는 비활성
    $('btn-prev').disabled = (S.stageIdx === 0);

    startTimer(stageSecs());
  }

  function renderStageBody(name, st) {
    var t = TYPES[st.type];
    switch (name) {
      case 'STORY':
        return '<div class="story-title-line">' + t.emoji + ' ' + esc(st.title) + '</div>' +
          '<div class="story-text">' + st.story.map(function (line) {
            return '<p>' + esc(line) + '</p>';
          }).join('') + '</div>' +
          '<div class="guide-box"><b>진행 도움말</b>' +
          '<span>· 화면을 읽기보다 아이들 눈을 보며 들려주듯 말해 주세요.</span>' +
          st.teacherGuide.map(function (g) { return '<span>· ' + esc(g) + '</span>'; }).join('') +
          '</div>';

      case 'THINK':
        return '<p class="main-question">' + esc(st.mainQuestion) + '</p>' +
          '<p class="stage-note">🤫 조용히 나만의 생각을 만들어 보세요. 이유도 함께!</p>' +
          '<div class="reveal-row"><button class="btn btn-ghost" id="btn-hint" type="button">💡 힌트 보기</button></div>' +
          '<div id="hint-slot">' + (S.revealed.hint ? hintHtml(st) : '') + '</div>';

      case 'TALK':
        return '<p class="main-question">' + esc(st.mainQuestion) + '</p>' +
          '<p class="stage-note">🗣 짝이나 모둠과 서로의 생각을 나눠 보세요. "왜냐하면"을 붙여 말해요!</p>' +
          '<div class="reveal-row"><button class="btn btn-ghost" id="btn-hint" type="button">💡 힌트 보기</button></div>' +
          '<div id="hint-slot">' + (S.revealed.hint ? hintHtml(st) : '') + '</div>';

      case 'PRESENT':
        return '<p class="main-question">' + esc(st.mainQuestion) + '</p>' +
          '<div class="picker">' +
            '<div class="picker-display" id="picker-display">🎲</div>' +
            '<div class="picker-controls">' +
              '<label for="class-size">우리 반 인원</label>' +
              '<input type="number" id="class-size" min="1" max="99" value="' + store.classSize + '">' +
              '<button class="btn btn-primary" id="btn-pick" type="button">🎲 발표자 뽑기</button>' +
              '<button class="btn btn-ghost btn-sm" id="btn-pick-reset" type="button">다시</button>' +
            '</div>' +
            '<div class="picker-history" id="picker-history"></div>' +
          '</div>' +
          '<div class="reveal-row"><button class="btn btn-ghost" id="btn-ideas" type="button">🌱 예시 생각 보기</button></div>' +
          '<div id="ideas-slot">' + (S.revealed.ideas ? ideasHtml(st) : '') + '</div>';

      case 'EXTEND':
        return '<p class="stage-note">한 걸음 더 나아가 볼까요?</p>' +
          '<div class="follow-list">' + st.followUpQuestions.map(function (q) {
            return '<div class="follow-item">' + esc(q) + '</div>';
          }).join('') + '</div>' +
          '<div class="reveal-row"><button class="btn btn-ghost" id="btn-ideas" type="button">🌱 예시 생각 보기</button></div>' +
          '<div id="ideas-slot">' + (S.revealed.ideas ? ideasHtml(st) : '') + '</div>';
    }
    return '';
  }

  function hintHtml(st) {
    return '<div class="reveal-box">💡 ' + esc(st.hint) + '</div>';
  }

  function ideasHtml(st) {
    return '<div class="reveal-box ideas"><b>🌱 이런 생각도 가능해요 (정답이 아니에요!)</b><ul>' +
      st.sampleIdeas.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') +
      '</ul></div>';
  }

  function bindStageEvents(name) {
    var st = S.story;
    var hintBtn = $('btn-hint');
    if (hintBtn) {
      hintBtn.addEventListener('click', function () {
        S.revealed.hint = true;
        $('hint-slot').innerHTML = hintHtml(st);
        hintBtn.disabled = true;
      });
      if (S.revealed.hint) hintBtn.disabled = true;
    }
    var ideasBtn = $('btn-ideas');
    if (ideasBtn) {
      ideasBtn.addEventListener('click', function () {
        S.revealed.ideas = true;
        $('ideas-slot').innerHTML = ideasHtml(st);
        ideasBtn.disabled = true;
      });
      if (S.revealed.ideas) ideasBtn.disabled = true;
    }
    if (name === 'PRESENT') bindPicker();
  }

  // ── 번호 뽑기 (FR-04) ────────────────────────────────
  function bindPicker() {
    var input = $('class-size');
    var display = $('picker-display');
    var history = $('picker-history');

    function renderHistory() {
      history.textContent = S.picked.length ? '뽑힌 번호: ' + S.picked.join(', ') : '';
    }
    renderHistory();
    if (S.picked.length) display.textContent = String(S.picked[S.picked.length - 1]);

    $('btn-pick').addEventListener('click', function () {
      var n = Math.max(1, Math.min(99, Number(input.value) || 1));
      input.value = n;
      store.classSize = n;
      saveStore();

      var pool = [];
      for (var i = 1; i <= n; i++) if (S.picked.indexOf(i) === -1) pool.push(i);
      if (!pool.length) {
        display.textContent = '🎉';
        history.textContent = '모든 번호를 뽑았어요! [다시]를 눌러 주세요.';
        return;
      }
      var result = pick(pool);
      // 두구두구 연출
      var ticks = 12, count = 0;
      var anim = setInterval(function () {
        display.textContent = String(1 + Math.floor(Math.random() * n));
        if (++count >= ticks) {
          clearInterval(anim);
          display.textContent = String(result);
          S.picked.push(result);
          renderHistory();
        }
      }, 70);
    });

    $('btn-pick-reset').addEventListener('click', function () {
      S.picked = [];
      display.textContent = '🎲';
      renderHistory();
    });
  }

  // ── 타이머 (FR-03) ───────────────────────────────────
  function startTimer(secs) {
    stopTimer();
    S.timer.total = secs;
    S.timer.remain = secs;
    S.timer.running = true;
    updateTimerUI();
    $('btn-pause').textContent = '⏸ 일시정지';
    S.timer.handle = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (S.timer.handle) { clearInterval(S.timer.handle); S.timer.handle = null; }
    S.timer.running = false;
  }

  function tick() {
    if (!S.timer.running) return;
    S.timer.remain -= 1;
    if (S.timer.remain <= 0) {
      S.timer.remain = 0;
      stopTimer();
      $('btn-next').classList.add('pulse'); // 자동 전환 대신 교사가 딸깍
    }
    updateTimerUI();
  }

  function togglePause() {
    if (S.timer.remain <= 0) return;
    if (S.timer.handle) {
      stopTimer();
      $('btn-pause').textContent = '▶ 계속';
    } else {
      S.timer.running = true;
      S.timer.handle = setInterval(tick, 1000);
      $('btn-pause').textContent = '⏸ 일시정지';
    }
    updateTimerUI();
  }

  function plus30() {
    S.timer.remain += 30;
    S.timer.total = Math.max(S.timer.total, S.timer.remain);
    if (!S.timer.handle) {
      S.timer.running = true;
      S.timer.handle = setInterval(tick, 1000);
      $('btn-pause').textContent = '⏸ 일시정지';
    }
    $('btn-next').classList.remove('pulse');
    updateTimerUI();
  }

  function updateTimerUI() {
    var m = Math.floor(S.timer.remain / 60);
    var s = S.timer.remain % 60;
    $('timer-digits').textContent = m + ':' + (s < 10 ? '0' : '') + s;
    var ratio = S.timer.total ? (S.timer.remain / S.timer.total) : 0;
    $('timer-fill').style.width = (ratio * 100) + '%';
    var wrap = $('timer-wrap');
    wrap.classList.toggle('low', S.timer.remain <= 10 && S.timer.remain > 0);
    wrap.classList.toggle('paused', !S.timer.handle && S.timer.remain > 0);
  }

  // ── 단계 이동 / 마무리 ───────────────────────────────
  function nextStage() {
    if (S.stageIdx >= S.stages.length - 1) {
      finish();
      return;
    }
    S.stageIdx += 1;
    renderStage();
  }

  function prevStage() {
    if (S.stageIdx <= 0) return;
    S.stageIdx -= 1;
    renderStage();
  }

  function finish() {
    stopTimer();
    $('done-praise').textContent = pick(PRAISES);
    $('done-sub').textContent = '「' + S.story.title + '」 · ' +
      GRADES[S.grade].name + ' · ' + S.duration + '분';
    show('screen-done');
  }

  function swapStory() {
    var next = recommend(S.story.id);
    if (!next || next.id === S.story.id) {
      alert('바꿀 수 있는 다른 이야기가 없습니다.');
      return;
    }
    startPlay(next);
  }

  // ── 즐겨찾기 (FR-08) ─────────────────────────────────
  function updateFavBtn() {
    var btn = $('btn-fav');
    var on = store.favorites.indexOf(S.story.id) !== -1;
    btn.textContent = on ? '⭐' : '☆';
    btn.classList.toggle('fav-on', on);
    btn.setAttribute('aria-label', on ? '즐겨찾기 해제' : '즐겨찾기 추가');
  }

  function toggleFav() {
    var id = S.story.id;
    var idx = store.favorites.indexOf(id);
    if (idx === -1) store.favorites.unshift(id);
    else store.favorites.splice(idx, 1);
    saveStore();
    updateFavBtn();
  }

  // ── 초기화 ───────────────────────────────────────────
  function goHome() {
    stopTimer();
    renderHome();
    show('screen-home');
  }

  function bindGlobal() {
    $('brand-home').addEventListener('click', function (e) { e.preventDefault(); goHome(); });
    $('btn-home').addEventListener('click', goHome);
    $('btn-setup-back').addEventListener('click', goHome);
    $('btn-start').addEventListener('click', startFromSetup);
    $('btn-next').addEventListener('click', nextStage);
    $('btn-prev').addEventListener('click', prevStage);
    $('btn-pause').addEventListener('click', togglePause);
    $('btn-plus30').addEventListener('click', plus30);
    $('btn-swap').addEventListener('click', swapStory);
    $('btn-fav').addEventListener('click', toggleFav);
    $('btn-again').addEventListener('click', function () {
      var next = recommend(S.story ? S.story.id : null);
      if (next) startPlay(next);
      else goHome();
    });
    $('btn-done-home').addEventListener('click', goHome);

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      if ($('screen-play').hidden) return;
      if (e.code === 'Space') { e.preventDefault(); togglePause(); }
      if (e.code === 'ArrowRight' || e.code === 'Enter') { e.preventDefault(); nextStage(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); prevStage(); }
    });
  }

  function init() {
    fetch('data/stories.json')
      .then(function (r) {
        if (!r.ok) throw new Error('load fail');
        return r.json();
      })
      .then(function (data) {
        stories = data.stories;
        stories.forEach(function (s) { byId[s.id] = s; });
        bindGlobal();
        goHome();
      })
      .catch(function () {
        document.getElementById('app').innerHTML =
          '<p style="text-align:center;padding:3rem;font-weight:700;">이야기 데이터를 불러오지 못했습니다.<br>' +
          '로컬에서는 간단한 웹서버(예: npx http-server)로 실행해 주세요.</p>';
      });
  }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 무시 */ });
    });
  }

  init();
})();
