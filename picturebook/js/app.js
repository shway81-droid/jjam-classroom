/* 짬짬이 그림책 — 그림이 화면 가득, 목소리가 읽어 주고 저절로 넘어갑니다.
 *  - 3클릭 시작: 서가 → 책 → [읽어 주기 시작]. 시작한 뒤에는 조작 0회(PRD 11·13장)
 *  - 음성 파일 하나 = 책 하나 = 목소리 하나. 문장마다의 구간은 data/voice.json 에 있습니다(PRD F3)
 *  - 시간은 시각 차이로 셉니다. setTimeout 을 쌓아 진행하지 않습니다(PRD F2, 그리기 3.2)
 *  - 키는 e.code 로 받습니다. 한글 입력 상태에서도 P·S·T·V·F 가 동작해야 합니다
 */
'use strict';

const $ = (id) => document.getElementById(id);

const AUTO_WAIT = 1.5;      // 낭독이 끝나고 다음 장으로 넘어가기까지(초, PRD 4장)
const CONTROLS_MS = 3000;   // 마우스를 멈추면 조작 막대를 숨기기까지

const MODES = {
  read: {
    name: '읽어 주기', start: '읽어 주기 시작',
    note: '목소리가 읽어 주고, 다 읽으면 저절로 다음 장으로 넘어갑니다.',
  },
  teacher: {
    name: '선생님이 읽기', start: '읽기 시작',
    note: '소리 없이 글을 크게 보여 줍니다. 선생님이 읽고 넘깁니다.',
  },
  story: {
    name: '그림 보고 이야기 짓기', start: '그림 보기 시작',
    note: '글을 숨기고 그림만 보여 줍니다. 반이 이야기를 지어 말한 뒤, 마지막에 원래 이야기를 들려줍니다.',
  },
};
const ORIGIN = { 'korean-folk': '한국 옛이야기', aesop: '이솝 우화', grimm: '그림 형제 동화', andersen: '안데르센 동화' };

/* ------------------------------------------------------------------ 저장 */
const KEY = 'jjam-picturebook:';
const store = {
  get(k, dflt) {
    try { const v = localStorage.getItem(KEY + k); return v === null ? dflt : JSON.parse(v); }
    catch { return dflt; }
  },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* 저장 못 해도 읽기는 됩니다 */ } },
};

let books = [];
let voiceData = null;
let voice = store.get('voice', null);     // 고른 목소리 — 다음에도 기억합니다(PRD F4)
let readIds = store.get('read', []);      // 이 기기에서 다 읽은 책 id 만. 이름·날짜는 적지 않습니다(PRD F6)
let mode = 'read';                        // 읽기 방법은 기억하지 않고 늘 '읽어 주기'로 엽니다(PRD 4.1 기본)
let book = null;

/* ------------------------------------------------------------------ 소리 */
let ac = null;
function audioCtx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  return ac;
}

const fetched = new Map();   // 파일 → 받은 바이트 약속
const decoded = new Map();   // 파일 → AudioBuffer 약속(못 받으면 null)

function voiceEntry(b = book, v = voice) {
  return voiceData?.books?.[b?.id]?.[v] || null;
}

function loadVoice(b = book, v = voice) {
  const e = voiceEntry(b, v);
  const c = audioCtx();
  if (!e || !c) return Promise.resolve(null);
  if (!decoded.has(e.file)) {
    if (!fetched.has(e.file)) {
      fetched.set(e.file, fetch(e.file).then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.arrayBuffer();
      }));
    }
    decoded.set(e.file, fetched.get(e.file)
      .then((bytes) => c.decodeAudioData(bytes.slice(0)))
      .catch(() => { fetched.delete(e.file); decoded.delete(e.file); return null; }));
  }
  return decoded.get(e.file);
}

// 지금 읽는 구간. spans 는 파일 안 시각 [시작, 길이] 들입니다.
// 소리가 있으면 소리 시계(ac.currentTime)로, 없으면 화면 시계(quiet)로 위치를 셉니다.
// 소리 시계는 멈춤(ac.suspend) 동안 서 있으므로, 멈췄다 이어도 문장 강조가 어긋나지 않습니다.
let seg = null;
let soundBlocked = false;   // 브라우저가 소리를 막았으면 참 — 그동안은 글만 넘깁니다

function hush() {
  if (seg?.src) { try { seg.src.stop(); } catch { /* 이미 끝남 */ } }
  seg = null;
}

function play(spans, buf) {
  hush();
  const from = Math.max(0, spans[0][0] - 0.05);
  const last = spans[spans.length - 1];
  const end = last[0] + last[1] + 0.1;
  seg = { spans, from, end, src: null, when: 0, quiet: 0, stuck: 0 };
  if (!buf || !ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => { /* 막혀 있으면 tick 이 글만 보여 줍니다 */ });
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  seg.when = ac.currentTime + 0.05;
  src.start(seg.when, from, end - from);
  seg.src = src;
}

function segPos() {
  return seg.from + (seg.src ? ac.currentTime - seg.when : seg.quiet);
}

// 음성이 없을 때(못 받았거나 아직 만들지 않은 책) 글 길이로 읽는 시간을 어림합니다.
function guessSpans(lines) {
  let t = 0;
  return lines.map((s) => {
    const d = 0.6 + s.replace(/\s/g, '').length * 0.2;
    const span = [t, d];
    t += d + 0.4;
    return span;
  });
}

function spansOf(sc) {
  const lines = sc.kind === 'question' ? [book.question] : sc.lines;
  const e = voiceEntry();
  let spans = null;
  if (e && sc.kind === 'title') spans = [e.title];
  else if (e && sc.kind === 'page') spans = e.pages[sc.page];
  else if (e && sc.kind === 'question') spans = [e.question];
  // 글을 고친 뒤 음성을 다시 만들지 않으면 문장 수가 어긋납니다 — 그때는 소리 없이 어림한 시간으로 넘깁니다.
  if (!spans || spans.length !== lines.length) return { spans: guessSpans(lines), quiet: true };
  return { spans, quiet: false };
}

function chime() {
  const c = audioCtx();
  if (!c || mode !== 'read') return;
  try {
    const t0 = c.currentTime;
    [[784, 0], [1047, 0.12]].forEach(([freq, offset]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.35);
      osc.connect(gain).connect(c.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.4);
    });
  } catch { /* 소리는 없어도 됩니다 */ }
}

/* ------------------------------------------------------------------ 화면 전환 */
const SCREENS = ['shelf', 'cover', 'read'];
let screen = 'shelf';

function show(name) {
  hush();
  run.token += 1;
  screen = name;
  for (const s of SCREENS) $(`s-${s}`).hidden = s !== name;
  // 읽기 화면에서는 상단바를 숨겨 그림에 집중합니다(PRD 5장).
  $('topbar').hidden = name === 'read';
  window.scrollTo(0, 0);
}

function gradesText(g) {
  if (!g?.length) return '';
  return g.length === 1 ? `${g[0]}학년` : `${g[0]}~${g[g.length - 1]}학년`;
}

/* ------------------------------------------------------------------ 서가 */
// 필터·오늘의 그림책은 PRD 12장 3단계에서 붙입니다.
function paintShelf() {
  $('shelfGrid').replaceChildren(...books.map((b) => {
    const li = document.createElement('li');
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'book';
    const img = document.createElement('img');
    img.src = `books/${b.id}/cover.webp`;
    img.alt = '';
    img.loading = 'lazy';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = b.title;
    const facts = document.createElement('div');
    facts.className = 'facts';
    facts.textContent = [`약 ${b.minutes}분`, ORIGIN[b.origin?.type], gradesText(b.grades)].filter(Boolean).join(' · ');
    card.append(img, name, facts);
    if (readIds.includes(b.id)) {
      const stamp = document.createElement('span');
      stamp.className = 'stamp';
      stamp.textContent = '읽었어요';
      card.append(stamp);
    }
    card.addEventListener('click', () => openCover(b.id));
    li.append(card);
    return li;
  }));
}

/* ------------------------------------------------------------------ 표지 */
function segment(host, pairs, get, set) {
  host.replaceChildren(...pairs.map(([value, text]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-pressed', String(get() === value));
    b.addEventListener('click', () => set(value));
    return b;
  }));
}

function setVoice(v) {
  voice = v;
  store.set('voice', v);
}

function paintOptions() {
  segment($('modeSeg'), Object.entries(MODES).map(([k, m]) => [k, m.name]), () => mode,
    (v) => { mode = v; paintOptions(); });
  $('modeNote').textContent = MODES[mode].note;
  $('startBtn').textContent = MODES[mode].start;
  const voices = voiceData?.voices || [];
  // 선생님이 읽기에서는 소리를 쓰지 않으니 목소리를 묻지 않습니다.
  $('voiceOpt').hidden = mode === 'teacher' || voices.length < 2 || !voiceEntry();
  segment($('voiceSeg'), voices.map((v) => [v.id, v.label]), () => voice,
    (v) => { setVoice(v); paintOptions(); preview(); });
}

// 목소리를 고르면 그 목소리로 제목을 읽어 줍니다 — 들어 보고 고를 수 있게.
async function preview() {
  const e = voiceEntry();
  if (!e || screen !== 'cover') return;
  const token = ++run.token;
  const buf = await loadVoice();
  if (token !== run.token || screen !== 'cover' || !buf) return;
  play([e.title], buf);
}

function openCover(id) {
  book = books.find((b) => b.id === id);
  if (!book) return;
  mode = 'read';
  $('coverImg').src = `books/${book.id}/cover.webp`;
  $('coverKicker').textContent = [ORIGIN[book.origin?.type], `약 ${book.minutes}분`, `${book.pages.length}장면`, gradesText(book.grades)]
    .filter(Boolean).join(' · ');
  $('coverTitle').textContent = book.title;
  $('coverBlurb').textContent = book.blurb;
  paintOptions();
  show('cover');
  preload(`books/${book.id}/${book.pages[0].image}`);
  loadVoice();   // [시작]을 누르면 바로 읽도록 미리 받아 둡니다
}

function openInfo() {
  if (!book) return;
  $('infoTitle').textContent = book.title;
  $('infoOrigin').textContent = [ORIGIN[book.origin?.type], book.origin?.basis].filter(Boolean).join(' — ');
  $('infoRetold').textContent = book.retold === '자체 재화'
    ? '원전의 줄거리만 가져와 짬짬이 그림책이 새로 다시 썼습니다.'
    : book.retold;
  $('infoVoice').textContent = voiceData?.credit ? `${voiceData.credit}입니다.` : '읽어 주는 목소리가 아직 없습니다.';
  $('info').showModal();
}

/* ------------------------------------------------------------------ 읽기 */
const run = {
  scenes: [],
  i: 0,
  token: 0,       // 장면이 바뀌면 늘어납니다 — 늦게 끝난 불러오기가 엉뚱한 장면을 읽지 않게
  held: false,    // 자동 넘김 멈춤(P, ←)
  frozen: false,  // 낭독을 그 자리에 세움(P, 나가기 확인, 화면 가림)
  wait: null,     // 다음 장까지 남은 초
  think: null,    // 생각 시간 남은 초
  band: true,     // 글 띠 보이기(T)
  now: -1,        // 굵게 보이는 문장
  last: performance.now(),
};

// 장면: 표지(제목) → 장면 1…N → 마지막 질문 → 다 읽었어요.
// 그림 보고 이야기 짓기는 장면 N 다음에 '원래 이야기 듣기'로 가고, 거기서 읽어 주기로 처음부터 읽습니다.
function scenesOf(b, m) {
  const dir = `books/${b.id}/`;
  const cover = `${dir}cover.webp`;
  const list = [{ kind: 'title', image: cover, lines: [b.title] }];
  b.pages.forEach((p, page) => list.push({ kind: 'page', page, image: dir + p.image, lines: p.text }));
  if (m === 'story') list.push({ kind: 'retell', image: list[list.length - 1].image });
  else list.push({ kind: 'question', image: cover }, { kind: 'done', image: cover });
  return list;
}

const scene = () => run.scenes[run.i];
const reads = (sc) => sc.kind === 'title' || sc.kind === 'page';

function startReading() {
  if (!book) return;
  const c = audioCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => { /* 막혀도 글은 넘어갑니다 */ });
  soundBlocked = false;
  run.scenes = scenesOf(book, mode);
  run.held = false;
  run.frozen = false;
  run.band = mode !== 'story';
  $('s-read').classList.toggle('teacher', mode === 'teacher');
  front = null;
  $('picA').classList.remove('on');
  $('picB').classList.remove('on');
  show('read');
  enterScene(0);
  showControls();
}

function enterScene(i) {
  run.i = i;
  run.token += 1;
  run.wait = null;
  run.think = null;
  hush();
  if (run.frozen) unfreeze();
  const sc = scene();
  showPic(sc.image);
  const after = run.scenes[i + 1];
  if (after) preload(after.image);   // 다음 장 그림을 미리 받아 넘김이 끊기지 않게(PRD F8)
  paintScene();
  if (sc.kind === 'done') markRead();
  if (mode === 'read' && (reads(sc) || sc.kind === 'question')) narrate();
}

async function narrate() {
  const sc = scene();
  const { spans, quiet } = spansOf(sc);
  const token = run.token;
  // 처음 한 번은 받는 데 걸릴 수 있습니다. 오래 걸리면 기다리지 않고 글만 넘깁니다.
  const buf = quiet || soundBlocked
    ? null
    : await Promise.race([loadVoice(), new Promise((r) => setTimeout(() => r(null), 5000))]);
  if (token !== run.token || screen !== 'read') return;
  play(spans, buf);
}

function afterNarration() {
  hush();
  paintLines(-1);
  if (mode === 'read' && reads(scene())) run.wait = AUTO_WAIT;
}

function next() {
  const sc = scene();
  if (sc.kind === 'retell') { retell(); return; }
  if (sc.kind === 'done') { toShelf(); return; }
  if (run.i < run.scenes.length - 1) enterScene(run.i + 1);
}

// 뒤로 가기는 다시 보여 주기입니다. 그 장을 다시 읽고, 자동 넘김은 멈춥니다(PRD 5장).
function prev() {
  if (run.i === 0) return;
  if (mode === 'read') run.held = true;
  enterScene(run.i - 1);
}

function retell() {
  mode = 'read';
  run.scenes = scenesOf(book, mode);
  run.held = false;
  run.band = true;
  enterScene(0);
}

function freeze() {
  run.frozen = true;
  if (ac && ac.state === 'running') ac.suspend().catch(() => { /* 무시 */ });
}

function unfreeze() {
  run.frozen = false;
  if (ac && ac.state === 'suspended') ac.resume().catch(() => { /* 무시 */ });
}

// P: 읽는 중이면 그 자리에 세우고 자동 넘김도 멈춥니다. 다시 누르면 이어서 읽고 저절로 넘어갑니다.
function togglePause() {
  if (mode !== 'read' || !reads(scene())) return;
  if (run.held || run.frozen) {
    run.held = false;
    unfreeze();
  } else {
    run.held = true;
    if (seg) freeze();
  }
  paintState();
}

// S: 이 장을 처음부터 다시 읽습니다. 선생님이 읽기에서도 들려줄 수 있습니다.
function sayAgain() {
  const sc = scene();
  if (mode === 'story' || !(reads(sc) || sc.kind === 'question') || !voiceEntry()) return;
  run.token += 1;
  run.wait = null;
  if (run.frozen) unfreeze();
  narrate();
}

// V: 목소리를 바꾸고 이 장을 새 목소리로 처음부터 다시 읽습니다.
function switchVoice() {
  const vs = voiceData?.voices || [];
  if (vs.length < 2 || mode === 'teacher' || !voiceEntry()) return;
  const k = vs.findIndex((v) => v.id === voice);
  const nextVoice = vs[(k + 1) % vs.length];
  setVoice(nextVoice.id);
  toast(nextVoice.label);
  paintControls();
  const sc = scene();
  if (mode === 'read' && (reads(sc) || sc.kind === 'question')) {
    run.token += 1;
    run.wait = null;
    if (run.frozen) unfreeze();
    narrate();
  }
}

function toggleBand() {
  run.band = !run.band;
  paintBand();
}

function startThink(sec) {
  if (scene().kind !== 'question') return;
  run.think = sec;
  paintThink();
}

function markRead() {
  if (readIds.includes(book.id)) return;
  readIds = [...readIds, book.id];
  store.set('read', readIds);
}

function fullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => { /* 막혀 있어도 읽기는 됩니다 */ });
}

/* ------------------------------------------------------------------ 나가기 확인 */
// 브라우저 기본 confirm 창은 작아서 8m 에서 읽히지 않고 리모컨으로 답할 수 없습니다(그리기와 같음).
let confirming = false;
let frozeForConfirm = false;

function askExit() {
  if (scene()?.kind === 'done') { toShelf(); return; }
  confirming = true;
  frozeForConfirm = !run.frozen;
  if (frozeForConfirm) freeze();
  $('confirmExit').hidden = false;
  $('exitYes').focus();
}

function cancelExit() {
  if (!confirming) return;
  confirming = false;
  $('confirmExit').hidden = true;
  if (frozeForConfirm) unfreeze();
  frozeForConfirm = false;
  paintState();
}

function toShelf() {
  confirming = false;
  frozeForConfirm = false;
  $('confirmExit').hidden = true;
  run.wait = null;
  run.think = null;
  show('shelf');
  paintShelf();
}

/* ------------------------------------------------------------------ 그리기(화면) */
let front = null;
let picToken = 0;
const preloaded = new Set();

function preload(src) {
  if (!src || preloaded.has(src)) return;
  preloaded.add(src);
  const img = new Image();
  img.src = src;
}

// 두 장을 겹쳐 두고 번갈아 쓰며 가볍게 페이드합니다(PRD 9장).
function showPic(src) {
  if (front && front.getAttribute('src') === src) return;
  const back = front === $('picA') ? $('picB') : $('picA');
  const token = ++picToken;
  back.src = src;
  const reveal = () => {
    if (token !== picToken) return;
    back.classList.add('on');
    if (front && front !== back) front.classList.remove('on');
    front = back;
  };
  (back.decode ? back.decode() : Promise.resolve()).then(reveal, reveal);
}

function bandVisible(sc) {
  if (!reads(sc)) return false;
  // 그림 보고 이야기 짓기에서도 제목은 보입니다. 장면 글은 T 로 꺼내 볼 수 있습니다.
  return run.band || (mode === 'story' && sc.kind === 'title');
}

function paintBand() {
  const sc = scene();
  $('band').hidden = !bandVisible(sc);
  $('band').classList.toggle('title', sc.kind === 'title');
}

function paintScene() {
  const sc = scene();
  $('lines').replaceChildren(...(reads(sc) ? sc.lines : []).map((t) => {
    const s = document.createElement('span');
    s.className = 'line';
    s.textContent = t;
    return s;
  }));
  paintLines(-1);
  paintBand();
  $('retellCard').hidden = sc.kind !== 'retell';
  $('questionCard').hidden = sc.kind !== 'question';
  $('doneCard').hidden = sc.kind !== 'done';
  if (sc.kind === 'question') { $('questionText').textContent = book.question; paintThink(); }
  if (sc.kind === 'done') $('doneTitle').textContent = book.title;
  paintDots();
  paintState();
  paintControls();
}

// 지금 읽는 문장을 굵게(PRD F3). k = -1 이면 모두 보통.
function paintLines(k) {
  run.now = k;
  $('lines').classList.toggle('speaking', k >= 0);
  [...$('lines').children].forEach((el, j) => el.classList.toggle('now', j === k));
}

function paintDots() {
  const n = book.pages.length;
  const sc = scene();
  const at = sc.kind === 'page' ? sc.page : sc.kind === 'title' ? -1 : n;
  const ol = $('dots');
  if (ol.children.length !== n) ol.replaceChildren(...Array.from({ length: n }, () => document.createElement('li')));
  [...ol.children].forEach((li, j) => li.classList.toggle('on', j <= at));
}

function paintState() {
  const sc = scene();
  let text = '';
  if (mode === 'read' && reads(sc) && run.frozen) text = '멈춤 · P 를 누르면 이어 읽어요';
  else if (mode === 'read' && reads(sc) && run.held) text = '넘김 멈춤 · P 를 누르면 저절로 넘어가요';
  $('state').textContent = text;
  $('state').hidden = !text;
  $('pauseBtn').firstChild.textContent = run.held || run.frozen ? '이어서' : '멈춤';
}

function paintControls() {
  const vs = voiceData?.voices || [];
  const hasVoice = !!voiceEntry();
  $('pauseBtn').hidden = mode !== 'read';
  $('sayBtn').hidden = mode === 'story' || !hasVoice;
  $('voiceBtn').hidden = mode === 'teacher' || vs.length < 2 || !hasVoice;
  const k = vs.findIndex((v) => v.id === voice);
  if (vs.length > 1) $('voiceBtn').firstChild.textContent = `${vs[(k + 1) % vs.length].label}로`;
}

function paintThink() {
  const el = $('thinkTime');
  el.hidden = run.think === null;
  if (run.think === null) return;
  const s = Math.max(0, Math.ceil(run.think));
  el.textContent = s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '끝!';
  el.classList.toggle('end', s === 0);
}

let toastTimer = 0;
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 1600);
}

let controlsTimer = 0;
function showControls() {
  $('s-read').classList.add('show-controls');
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => $('s-read').classList.remove('show-controls'), CONTROLS_MS);
}

/* ------------------------------------------------------------------ 시계 */
// setInterval 로 돌리고 시간은 실제 시각 차이로 셉니다. requestAnimationFrame 은 창이 가려지면 멈춥니다.
function tick() {
  const t = performance.now();
  const dt = Math.min(1, (t - run.last) / 1000);
  run.last = t;
  if (screen !== 'read') return;
  const still = run.frozen || confirming;

  if (seg) {
    // 브라우저가 소리를 막아 소리 시계가 서 있으면, 글만 보여 주며 넘깁니다.
    if (seg.src && ac.state !== 'running' && !still) {
      seg.stuck += dt;
      if (seg.stuck > 2) {
        try { seg.src.stop(); } catch { /* 무시 */ }
        seg.quiet = Math.max(0, ac.currentTime - seg.when);   // 읽던 자리에서 이어 갑니다
        seg.src = null;
        soundBlocked = true;   // 다음 장면부터는 기다리지 않고 글만 넘깁니다. [시작]을 다시 누르면 다시 시도합니다.
        toast('소리를 낼 수 없어 글만 보여 줍니다');
      }
    }
    if (!seg.src && !still) seg.quiet += dt;
    const pos = segPos();
    if (pos >= seg.end) {
      afterNarration();
    } else {
      let k = -1;
      seg.spans.forEach((s, j) => { if (pos >= s[0] - 0.08) k = j; });
      if (k !== run.now) paintLines(reads(scene()) ? k : -1);
    }
  }

  if (run.wait !== null && !run.held && !still) {
    run.wait -= dt;
    if (run.wait <= 0) { run.wait = null; next(); }
  }

  if (run.think !== null && run.think > 0 && !confirming) {
    run.think -= dt;
    if (run.think <= 0) { run.think = 0; chime(); }
    paintThink();
  }
}
setInterval(tick, 100);

/* ------------------------------------------------------------------ 키보드·리모컨 */
// 프레젠터 리모컨은 대개 PageUp/PageDown 을 보냅니다.
const NEXT_CODES = ['Space', 'ArrowRight', 'PageDown', 'Enter', 'NumpadEnter', 'ArrowDown'];
const PREV_CODES = ['ArrowLeft', 'PageUp', 'ArrowUp'];
const PRESS_CODES = ['Enter', 'NumpadEnter', 'Space'];

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if ($('info').open) return;   // 정보 창은 Esc 로 닫힙니다(브라우저 기본)

  if (screen === 'cover') {
    // 단추에 초점이 있으면 Enter·Space 는 그 단추를 누릅니다. 리모컨의 다음 키는 곧 시작입니다.
    if (PRESS_CODES.includes(e.code) && e.target.closest?.('button, a')) return;
    if (NEXT_CODES.includes(e.code)) { e.preventDefault(); startReading(); }
    else if (e.code === 'Escape') { e.preventDefault(); toShelf(); }
    return;
  }
  if (screen !== 'read') return;

  // 나가기 확인 중에는 Enter 와 Esc 만 받습니다 — 리모컨으로 답할 수 있어야 합니다.
  if (confirming) {
    e.preventDefault();
    if (e.code === 'Enter' || e.code === 'NumpadEnter') toShelf();
    else if (e.code === 'Escape') cancelExit();
    return;
  }

  if (NEXT_CODES.includes(e.code)) { e.preventDefault(); next(); return; }
  if (PREV_CODES.includes(e.code)) { e.preventDefault(); prev(); return; }
  switch (e.code) {
    case 'KeyP': togglePause(); break;
    case 'KeyS': sayAgain(); break;
    case 'KeyT': toggleBand(); break;
    case 'KeyV': switchVoice(); break;
    case 'KeyF': fullscreen(); break;
    case 'Escape': askExit(); break;
    case 'Digit3': case 'Numpad3': startThink(30); break;
    case 'Digit6': case 'Numpad6': startThink(60); break;
    default: return;
  }
  e.preventDefault();
});

// 화면이 안 보이는 동안은 세우고, 돌아오면 P 로 이어 갑니다(그리기와 같음).
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || screen !== 'read') return;
  if (mode === 'read' && reads(scene())) run.held = true;
  if (seg) freeze();
  paintState();
});

/* ------------------------------------------------------------------ 누르기 */
$('s-read').addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') showControls(); });
$('s-read').addEventListener('pointerdown', showControls);

// 선생님이 넘기는 두 방법에서는 그림을 누르면 넘어갑니다(왼쪽 1/3 은 앞 장).
// 읽어 주기에서는 실수로 닿아도 넘어가지 않고 조작 막대만 나옵니다.
$('stage').addEventListener('click', (e) => {
  if (e.target.closest('.over') || mode === 'read' || confirming) return;
  const r = $('stage').getBoundingClientRect();
  if (e.clientX - r.left < r.width / 3) prev();
  else next();
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.tagName === 'A') e.preventDefault();   // 상단바 로고 — 새로 읽지 않고 서가로
  switch (el.dataset.act) {
    case 'shelf': toShelf(); break;
    case 'start': startReading(); break;
    case 'info': openInfo(); break;
    case 'next': next(); break;
    case 'prev': prev(); break;
    case 'pause': togglePause(); break;
    case 'say': sayAgain(); break;
    case 'band': toggleBand(); break;
    case 'voice': switchVoice(); break;
    case 'full': fullscreen(); break;
    case 'exit': askExit(); break;
    case 'exit-yes': toShelf(); break;
    case 'exit-no': cancelExit(); break;
    case 'retell': retell(); break;
    case 'again': run.held = false; enterScene(0); break;
    case 'think': startThink(Number(el.dataset.sec)); break;
    default: break;
  }
});

/* ------------------------------------------------------------------ 시작 */
async function boot() {
  const res = await fetch('data/books.json');
  if (!res.ok) throw new Error(res.status);
  books = (await res.json()).books;
  // 음성 목록이 없어도 읽기는 됩니다 — 그때는 글만 넘깁니다.
  voiceData = await fetch('data/voice.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const ids = (voiceData?.voices || []).map((v) => v.id);
  if (!ids.includes(voice)) voice = ids[0] || null;
  paintShelf();
  show('shelf');
}

boot().catch((err) => {
  document.body.innerHTML = '<p style="padding:6vh 6vw;font-size:24px">책 목록을 읽지 못했습니다. '
    + 'data/books.json 이 있는지, 간단한 웹 서버로 열었는지 확인해 주세요.</p>';
  console.error(err);
});
