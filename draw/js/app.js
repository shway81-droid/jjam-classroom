/* 짬짬이 그리기 — 교사는 시작만 누르고, 화면이 한 획씩 이끈다.
 * 목표 1(교사 편의)이 이 파일의 대부분입니다.
 *  - 3클릭 시작: 홈 → 카드 → 시작
 *  - 시작 후 조작 0회: 자동 모드가 기본
 *  - 리모컨: PageUp/PageDown 을 포함해 키를 e.code 로 받습니다(한글 입력 상태에서도 동작)
 *  - 속도 변경은 지금 단계의 남은 시간에도 바로 적용
 *  - 교사 멘트는 미리 만든 AI 음성으로 읽어 줍니다(FR-28) — 교사가 읽지 않아도 진행됩니다
 */
'use strict';

const NS = 'http://www.w3.org/2000/svg';

const SPEED = { slow: 1.5, normal: 1.0, fast: 0.7 };
const SPEED_TEXT = { slow: '느리게', normal: '보통', fast: '빠르게' };
const SPEED_LIST = ['slow', 'normal', 'fast'];

const DIFF = [['easy', '쉬움'], ['normal', '보통'], ['hard', '도전']];
const THEME = [
  ['animal', '동물'], ['person', '사람과 표정'], ['plant', '식물'], ['food', '음식'],
  ['thing', '사물과 탈것'], ['season', '계절과 행사'], ['fantasy', '상상'],
];
const DIFF_TEXT = Object.fromEntries(DIFF);

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------------ 저장 */
const KEY = 'jjam-draw:';
const store = {
  get(k, dflt) {
    try { const v = localStorage.getItem(KEY + k); return v === null ? dflt : JSON.parse(v); }
    catch { return dflt; }
  },
  set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* 저장 못 해도 진행 */ } },
  del(k) { try { localStorage.removeItem(KEY + k); } catch { /* 무시 */ } },
};

// 소리는 세 가지입니다. 예전에 켬·끔(true·false)으로 저장한 값도 그대로 읽습니다.
const SOUND_LIST = ['voice', 'beep', 'off'];
const soundOf = (v) => (v === true ? 'voice' : v === false ? 'off' : SOUND_LIST.includes(v) ? v : 'voice');

const settings = {
  speed: SPEED_LIST.includes(store.get('speed', 'normal')) ? store.get('speed', 'normal') : 'normal',
  sound: soundOf(store.get('sound', 'voice')),
  voice: store.get('voice', 'F1'),
  coloring: store.get('coloring', true),
  mode: store.get('mode', 'auto'),
};
let favorites = store.get('favorites', []);
let recent = store.get('recent', []);
let filterDiff = null;
let filterTheme = null;

/* ------------------------------------------------------------------ 길이 재기 */
// seconds 와 애니메이션 길이는 획 길이에서 나옵니다(PRD 7.2). 데이터에 적지 않습니다.
const measure = (() => {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  const p = document.createElementNS(NS, 'path');
  svg.appendChild(p);
  document.body.appendChild(svg);
  return (d) => { p.setAttribute('d', d); return p.getTotalLength(); };
})();

// 고정 8초(음성 멘트 약 4초 + 화면에서 종이로 눈 옮기기) + 길이당 12초
// + 한 단계에 획이 여럿이면 하나 늘 때마다 2초(연필을 옮겨 대는 시간). 10~30초, 1초 단위(PRD 7.2).
const SEC_BASE = 8;
const SEC_PER_LENGTH = 12;
const SEC_PER_EXTRA_STROKE = 2;
const SEC_RANGE = [10, 30];

function prepare(drawing) {
  const [, , w, h] = drawing.viewBox.split(/\s+/).map(Number);
  const diagonal = Math.hypot(w, h);

  drawing.sec = drawing.steps.map((step) => {
    if (typeof step.seconds === 'number') return step.seconds;
    const len = step.d.reduce((sum, d) => sum + measure(d), 0);
    const sec = SEC_BASE + SEC_PER_LENGTH * (len / diagonal) + SEC_PER_EXTRA_STROKE * (step.d.length - 1);
    return Math.round(Math.min(Math.max(sec, SEC_RANGE[0]), SEC_RANGE[1]));
  });
  drawing.anim = drawing.steps.map((step) => {
    const longest = Math.max(...step.d.map(measure));
    return Math.min(1600, Math.max(500, longest * 3));
  });
  drawing.totalSec = drawing.sec.reduce((a, b) => a + b, 0);
  return drawing;
}

/* ------------------------------------------------------------------ 소리 */
let audio = null;
function ctx() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function beep() {
  if (settings.sound === 'off') return;
  try {
    ctx();
    const t0 = audio.currentTime;
    [[880, 0], [1175, 0.08]].forEach(([freq, offset]) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.08);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.09);
    });
  } catch { /* 소리는 없어도 활동은 진행됩니다 */ }
}

/* ------------------------------------------------------------------ 읽어 주기 */
// 그림 하나 · 목소리 하나가 MP3 하나이고, 문장마다의 구간은 data/voice.json 에 있습니다.
// 0번이 준비 안내(setupSay), 1번부터 단계 멘트입니다. 음성은 scripts/voice/build.py 가 만듭니다.
// 파일을 아직 못 받았으면 기기 음성(speechSynthesis)으로 대신 읽어, 소리가 비는 일이 없게 합니다.
let voiceData = null;
const voiceBuf = new Map();   // 파일 → AudioBuffer 약속
let speaking = null;
let sayToken = 0;

function voiceEntry(d) {
  return voiceData?.drawings?.[d.id]?.[settings.voice] || null;
}

function loadVoice(d) {
  const e = d && voiceEntry(d);
  if (!e) return Promise.resolve(null);
  if (!voiceBuf.has(e.file)) {
    voiceBuf.set(e.file, fetch(e.file)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((b) => ctx().decodeAudioData(b))
      .catch(() => { voiceBuf.delete(e.file); return null; }));
  }
  return voiceBuf.get(e.file);
}

function hush() {
  sayToken += 1;
  try { speaking?.stop(); } catch { /* 이미 끝남 */ }
  speaking = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

// index 0 = 준비 안내, 1.. = 단계 멘트. delay 는 신호음 뒤에 말을 시작하려는 틈(초)입니다.
async function say(index, delay = 0) {
  hush();
  const d = run.drawing;
  if (settings.sound !== 'voice' || !d) return;
  const token = sayToken;
  const text = index === 0 ? d.setupSay : d.steps[index - 1]?.teacherSay;
  if (!text) return;
  const e = voiceEntry(d);
  // 받는 데 오래 걸리면 기다리지 않고 기기 음성으로 읽습니다.
  const buf = e ? await Promise.race([loadVoice(d), new Promise((r) => setTimeout(() => r(null), 1500))]) : null;
  if (token !== sayToken) return;
  try {
    if (buf && e.parts[index]) {
      const c = ctx();
      const [start, dur] = e.parts[index];
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      // 문장 앞뒤에 무음이 있어 구간을 조금 넉넉히 잡아도 옆 문장이 섞이지 않습니다.
      src.start(c.currentTime + delay, Math.max(0, start - 0.05), dur + 0.15);
      speaking = src;
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const ko = speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ko'));
    if (ko) u.voice = ko;
    setTimeout(() => { if (token === sayToken) speechSynthesis.speak(u); }, delay * 1000);
  } catch { /* 소리는 없어도 활동은 진행됩니다 */ }
}

/* ------------------------------------------------------------------ 그리기 */
function paintPaths(svg, drawing, upto, currentIndex) {
  svg.setAttribute('viewBox', drawing.viewBox);
  svg.replaceChildren();
  const made = [];
  for (let i = 0; i <= upto; i += 1) {
    const isNow = i === currentIndex;
    for (const d of drawing.steps[i].d) {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', d);
      el.setAttribute('class', isNow ? 'now' : 'past');
      svg.appendChild(el);
      if (isNow) made.push(el);
    }
  }
  return made;
}

// 완성본은 전 단계를 겹쳐 그린 것입니다 — 따로 두지 않습니다(PRD 7장).
function paintFull(svg, drawing) {
  paintPaths(svg, drawing, drawing.steps.length - 1, -1);
}

function thumbnail(drawing) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'thumb');
  svg.setAttribute('aria-hidden', 'true');
  paintFull(svg, drawing);
  return svg;
}

/* ------------------------------------------------------------------ 화면 전환 */
const SCREENS = ['home', 'ready', 'draw', 'done', 'complete'];
let screen = 'home';

function show(name) {
  screen = name;
  for (const s of SCREENS) $(`s-${s}`).hidden = s !== name;
  // 따라 그리기 화면에서는 상단바를 숨겨 그림을 크게 보입니다 — 활동 중에 바로가기를 눌러 나가지 않게도 합니다.
  $('topbar').hidden = name === 'draw';
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------ 활동 상태 */
const run = {
  drawing: null,
  step: 0,
  remain: 0,
  paused: false,
  last: 0,
  timer: 0,
  shown: -1,
  colorRemain: 0,
  colorTimer: 0,
};

let drawings = [];
const byId = (id) => drawings.find((d) => d.id === id);

/* ------------------------------------------------------------------ 홈 */
function buildChips() {
  const mk = (host, pairs, get, set) => {
    host.replaceChildren();
    for (const [value, text] of pairs) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = text;
      b.setAttribute('aria-pressed', String(get() === value));
      b.addEventListener('click', () => { set(get() === value ? null : value); buildChips(); paintGrid(); });
      host.appendChild(b);
    }
  };
  mk($('diffChips'), DIFF, () => filterDiff, (v) => { filterDiff = v; });
  mk($('themeChips'), THEME, () => filterTheme, (v) => { filterTheme = v; });
}

function minutes(sec) { return Math.max(1, Math.round(sec / 60)); }

function paintGrid() {
  const grid = $('cardGrid');
  grid.replaceChildren();
  const list = drawings.filter((d) =>
    (!filterDiff || d.difficulty === filterDiff) && (!filterTheme || d.theme === filterTheme));

  // 즐겨찾기 먼저, 그 다음 최근 사용
  list.sort((a, b) => {
    const fa = favorites.includes(a.id) ? 0 : 1;
    const fb = favorites.includes(b.id) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return drawings.indexOf(a) - drawings.indexOf(b);
  });

  $('emptyMsg').hidden = list.length > 0;

  for (const d of list) {
    const li = document.createElement('li');
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.appendChild(thumbnail(d));

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = d.title;
    card.appendChild(name);

    const facts = document.createElement('div');
    facts.className = 'facts';
    facts.textContent = `${DIFF_TEXT[d.difficulty]} · ${d.steps.length}단계 · 약 ${minutes(d.totalSec)}분`;
    card.appendChild(facts);

    card.addEventListener('click', () => openReady(d.id));
    li.appendChild(card);

    if (recent[0] === d.id) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = '최근';
      li.appendChild(badge);
    }

    const star = document.createElement('button');
    star.className = 'star';
    star.type = 'button';
    const on = favorites.includes(d.id);
    star.textContent = on ? '★' : '☆';
    star.setAttribute('aria-label', `${d.title} 즐겨찾기 ${on ? '해제' : '추가'}`);
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      favorites = on ? favorites.filter((x) => x !== d.id) : [d.id, ...favorites];
      store.set('favorites', favorites);
      paintGrid();
    });
    li.appendChild(star);

    li.style.position = 'relative';
    grid.appendChild(li);
  }
}

/* ------------------------------------------------------------------ 세그먼트 단추 */
function segment(host, pairs, get, set) {
  host.replaceChildren();
  for (const [value, text] of pairs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-pressed', String(get() === value));
    b.addEventListener('click', () => set(value));
    host.appendChild(b);
  }
}

function paintOptions() {
  segment($('modeSeg'), [['auto', '자동'], ['manual', '수동']], () => settings.mode,
    (v) => { settings.mode = v; store.set('mode', v); paintOptions(); });
  segment($('readySpeedSeg'), SPEED_LIST.map((k) => [k, SPEED_TEXT[k]]), () => settings.speed,
    (v) => { settings.speed = v; store.set('speed', v); paintOptions(); });
  segment($('soundSeg'), [['voice', '읽어 주기'], ['beep', '신호음만'], ['off', '끔']], () => settings.sound,
    (v) => {
      settings.sound = v; store.set('sound', v); paintOptions();
      if (v === 'voice') { say(0); precacheVoice(); } else hush();
    });
  const voices = voiceData?.voices || [];
  $('voiceOpt').hidden = settings.sound !== 'voice' || voices.length < 2;
  segment($('voiceSeg'), voices.map((v) => [v.id, v.label]), () => settings.voice,
    (v) => { settings.voice = v; store.set('voice', v); paintOptions(); say(0); precacheVoice(); });
  segment($('coloringSeg'), [[true, '켬'], [false, '끔']], () => settings.coloring,
    (v) => { settings.coloring = v; store.set('coloring', v); paintOptions(); });
}

function paintDrawSpeed() {
  segment($('drawSpeedSeg'), SPEED_LIST.map((k, i) => [k, `${SPEED_TEXT[k]}`]),
    () => settings.speed, setSpeed);
  [...$('drawSpeedSeg').children].forEach((b, i) => {
    const kbd = document.createElement('kbd');
    kbd.textContent = String(i + 1);
    b.appendChild(document.createTextNode(' '));
    b.appendChild(kbd);
  });
}

/* ------------------------------------------------------------------ 준비 */
function openReady(id) {
  const d = byId(id);
  if (!d) return;
  run.drawing = d;
  $('readyKicker').textContent = `${DIFF_TEXT[d.difficulty]} · ${d.steps.length}단계 · 약 ${minutes(d.totalSec)}분`;
  $('readyTitle').textContent = d.title;
  $('readySetup').textContent = d.setupSay;
  paintFull($('readyCanvas'), d);
  paintOptions();
  show('ready');
  // 준비 화면에서 종이 방향과 첫 획 크기를 읽어 줍니다 — 교사가 시작 전에 할 말입니다.
  loadVoice(d);
  say(0);
}

/* ------------------------------------------------------------------ 따라 그리기 */
function startActivity(fromStep = 0, paused = false) {
  const d = run.drawing;
  recent = [d.id, ...recent.filter((x) => x !== d.id)].slice(0, 6);
  store.set('recent', recent);

  run.step = fromStep;
  run.paused = paused;
  $('resumeHint').hidden = !paused;
  $('tapHint').hidden = settings.mode !== 'manual';
  paintDrawSpeed();
  show('draw');
  // 새로고침 뒤 이어 가기(멈춘 채 시작)에서는 갑자기 말하지 않습니다.
  enterStep({ beep: false, say: !paused });
  startLoop();
}

// 단계에 들어갈 때 신호음을 울리고, 그 뒤에 멘트를 읽습니다(PRD 3.4 · FR-28).
function enterStep({ beep: ring = true, say: speak = true } = {}) {
  const d = run.drawing;
  run.remain = d.sec[run.step] * 1000 * SPEED[settings.speed];
  run.last = performance.now();
  run.shown = -1;

  const made = paintPaths($('canvas'), d, run.step, run.step);
  const duration = d.anim[run.step];
  for (const el of made) {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.style.transition = `stroke-dashoffset ${duration}ms linear`;
    // 시작점 점 — 어디서 시작하는지 알려 줍니다
    const p0 = el.getPointAtLength(0);
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', p0.x);
    dot.setAttribute('cy', p0.y);
    dot.setAttribute('r', '6');
    dot.setAttribute('class', 'dot');
    $('canvas').appendChild(dot);
  }
  requestAnimationFrame(() => {
    for (const el of made) el.style.strokeDashoffset = '0';
  });

  $('stepNo').textContent = `${run.step + 1} / ${d.steps.length}`;
  $('stepLabel').textContent = d.steps[run.step].label;
  $('stepSay').textContent = d.steps[run.step].teacherSay;
  paintPause();
  paintTime();
  if (ring) beep();
  if (speak) say(run.step + 1, ring ? 0.3 : 0);
  else hush();

  store.set('progress', { id: d.id, step: run.step });
}

function paintTime() {
  const secs = Math.max(0, Math.ceil(run.remain / 1000));
  if (secs === run.shown) return;
  run.shown = secs;
  $('timeLeft').textContent = settings.mode === 'auto' ? `${secs}초` : '수동';
}

function paintPause() {
  const btn = $('pauseBtn');
  btn.replaceChildren(document.createTextNode(run.paused ? '재개' : '멈춤'));
  const kbd = document.createElement('kbd');
  kbd.textContent = 'P';
  btn.appendChild(kbd);
}

// 타이머는 setInterval 로 돌리고 시간은 실제 시각 차이로 셉니다(PRD 3.2).
// requestAnimationFrame 은 창이 가려지면 아예 멈춰서 진행이 서 버립니다.
// 간격이 늘어져도 남은 시간은 시각으로 계산하므로 밀리지 않고, 한 번에 한 단계씩만 넘어갑니다.
function startLoop() {
  stopLoop();
  run.last = performance.now();
  run.timer = setInterval(() => {
    const now = performance.now();
    const dt = now - run.last;
    run.last = now;
    if (screen !== 'draw') return;
    if (settings.mode === 'auto' && !run.paused && !confirming) {
      run.remain -= dt;
      if (run.remain <= 0) { next(); return; }
    }
    paintTime();
  }, 100);
}

function stopLoop() { clearInterval(run.timer); run.timer = 0; }

function next() {
  const d = run.drawing;
  if (run.step >= d.steps.length - 1) { finish(); return; }
  run.step += 1;
  $('resumeHint').hidden = true;
  enterStep();
}

// 뒤로 가기는 취소가 아니라 다시 보여 주기입니다. 그래서 자동 진행을 함께 멈춥니다(PRD 3.3).
function prev() {
  if (run.step === 0) return;
  run.step -= 1;
  run.paused = true;
  enterStep({ beep: false });
}

// 다시 보여 주면서 시간을 주지 않으면 뜻이 없으므로 타이머도 처음부터입니다(PRD 3.3).
function replay() {
  $('resumeHint').hidden = true;
  enterStep({ beep: false });
}

function togglePause() {
  run.paused = !run.paused;
  if (!run.paused) $('resumeHint').hidden = true;
  else hush();
  run.last = performance.now();
  paintPause();
}

function setSpeed(key) {
  if (!SPEED[key]) return;
  const before = SPEED[settings.speed];
  settings.speed = key;
  store.set('speed', key);
  // 지금 단계의 남은 시간에도 바로 적용합니다(PRD 3.2).
  run.remain = run.remain * SPEED[key] / before;
  run.shown = -1;
  paintDrawSpeed();
  paintTime();
}

let peeking = false;
function peek(on) {
  if (on === peeking) return;
  peeking = on;
  const svg = $('peek');
  if (on) paintFull(svg, run.drawing);
  svg.hidden = !on;
}

function fullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => { /* 막혀 있어도 진행 */ });
}

// 나가기 확인은 화면 안에서 받습니다. 교실 뒤에 있는 교사가 리모컨으로 답해야 하므로
// 브라우저 기본 confirm 창은 쓰지 않습니다(작아서 8m 에서 읽히지도 않습니다).
let confirming = false;

function askExit() {
  confirming = true;
  $('confirmExit').hidden = false;
  $('exitYes').focus();
}

function cancelExit() {
  confirming = false;
  $('confirmExit').hidden = true;
}

function exitActivity() {
  hush();
  confirming = false;
  $('confirmExit').hidden = true;
  stopLoop();
  store.del('progress');
  peek(false);
  show('home');
  paintGrid();
}

/* ------------------------------------------------------------------ 완성·색칠 */
function finish() {
  hush();
  stopLoop();
  cancelExit();
  store.del('progress');
  peek(false);
  const d = run.drawing;
  paintFull($('doneCanvas'), d);
  $('doneTitle').textContent = d.title;
  show('done');
  beep();

  const useColor = settings.coloring;
  $('colorTime').hidden = !useColor;
  $('colorPlus').hidden = !useColor;
  $('colorSkip').hidden = !useColor;
  $('toComplete').hidden = useColor;
  $('doneSay').textContent = useColor
    ? '다 그렸어요. 이제 색칠해 볼까요?'
    : '다 그렸어요. 완성본을 함께 봅니다.';

  if (!useColor) return;
  run.colorRemain = d.coloringSeconds * 1000;
  paintColorTime();
  clearInterval(run.colorTimer);
  let last = performance.now();
  run.colorTimer = setInterval(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (screen !== 'done') return;
    run.colorRemain -= dt;
    if (run.colorRemain <= 0) { endColoring(); return; }
    paintColorTime();
  }, 200);
}

function paintColorTime() {
  const s = Math.max(0, Math.ceil(run.colorRemain / 1000));
  $('colorTime').textContent = `색칠 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function endColoring() {
  clearInterval(run.colorTimer);
  run.colorTimer = 0;
  beep();
  show('complete');
}

function nextDrawing() {
  const i = drawings.indexOf(run.drawing);
  const nextOne = drawings[(i + 1) % drawings.length];
  openReady(nextOne.id);
}

/* ------------------------------------------------------------------ 키보드·리모컨 */
// 프레젠터 리모컨은 대개 PageUp/PageDown 을 보냅니다.
// 글자 키는 e.code 로 봅니다 — 한글 입력 상태에서도 R·P·C·F 가 동작해야 합니다.
const NEXT_CODES = ['Space', 'ArrowRight', 'PageDown', 'Enter', 'NumpadEnter', 'ArrowDown'];
const PREV_CODES = ['ArrowLeft', 'PageUp', 'ArrowUp'];
const SPEED_CODES = { Digit1: 'slow', Numpad1: 'slow', Digit2: 'normal', Numpad2: 'normal', Digit3: 'fast', Numpad3: 'fast' };

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  if (screen === 'ready' && NEXT_CODES.includes(e.code)) {
    e.preventDefault();
    startActivity();
    return;
  }
  if (screen === 'done' && NEXT_CODES.includes(e.code)) { e.preventDefault(); endColoring(); return; }
  if (screen === 'complete' && NEXT_CODES.includes(e.code)) { e.preventDefault(); nextDrawing(); return; }
  if (screen !== 'draw') return;

  // 나가기 확인 중에는 Enter 와 Esc 만 받습니다 — 리모컨으로 답할 수 있어야 합니다.
  if (confirming) {
    e.preventDefault();
    if (e.code === 'Enter' || e.code === 'NumpadEnter') exitActivity();
    else if (e.code === 'Escape') cancelExit();
    return;
  }

  if (NEXT_CODES.includes(e.code)) { e.preventDefault(); next(); return; }
  if (PREV_CODES.includes(e.code)) { e.preventDefault(); prev(); return; }
  if (SPEED_CODES[e.code]) { e.preventDefault(); setSpeed(SPEED_CODES[e.code]); return; }

  switch (e.code) {
    case 'KeyR': e.preventDefault(); replay(); break;
    case 'KeyS': e.preventDefault(); say(run.step + 1); break;
    case 'KeyP': e.preventDefault(); togglePause(); break;
    case 'KeyF': e.preventDefault(); fullscreen(); break;
    case 'KeyC': e.preventDefault(); if (!e.repeat) peek(true); break;
    case 'Escape': e.preventDefault(); askExit(); break;
    default: break;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyC') peek(false);
});

// 화면이 안 보이는 동안은 세우고, 돌아오면 그 자리에서 이어갑니다.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hush();
  if (document.hidden && screen === 'draw' && !run.paused) { run.paused = true; paintPause(); }
  run.last = performance.now();
});

/* ------------------------------------------------------------------ 누르기 */
// 수동 모드는 화면 어디를 눌러도 다음 획입니다. 조작 막대만 제외합니다(PRD 5.1).
$('s-draw').addEventListener('click', (e) => {
  if (e.target.closest('#bar') || e.target.closest('#confirmExit')) return;
  if (confirming) return;
  if (settings.mode !== 'manual') return;   // 자동 모드에서 실수로 닿아도 아무 일 없음
  next();
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  const act = el?.dataset.act;
  if (!act) return;
  if (el.tagName === 'A') e.preventDefault();   // 상단바 로고 — 새로 읽지 않고 홈으로
  switch (act) {
    case 'start': startActivity(); break;
    case 'home': hush(); stopLoop(); store.del('progress'); show('home'); paintGrid(); break;
    case 'next': next(); break;
    case 'prev': prev(); break;
    case 'replay': replay(); break;
    case 'say': say(run.step + 1); break;
    case 'pause': togglePause(); break;
    case 'full': fullscreen(); break;
    case 'exit': askExit(); break;
    case 'exit-yes': exitActivity(); break;
    case 'exit-no': cancelExit(); break;
    case 'color-plus': run.colorRemain += 30000; paintColorTime(); break;
    case 'color-skip': endColoring(); break;
    case 'to-complete': endColoring(); break;
    case 'next-drawing': nextDrawing(); break;
    default: break;
  }
});

// 완성본 보기는 누르고 있는 동안만입니다(PRD 3.3).
const peekBtn = document.querySelector('[data-act="peek"]');
['pointerdown'].forEach((t) => peekBtn.addEventListener(t, (e) => { e.preventDefault(); peek(true); }));
['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => peekBtn.addEventListener(t, () => peek(false)));

/* ------------------------------------------------------------------ 오프라인 */
// PWA 는 한 번은 온라인에서 열어야 캐시가 생깁니다. 그래서 홈에 준비 여부를 보여 줍니다(PRD 3.6).
let coreReady = false;
let voiceReady = false;
function paintOffline() {
  if (!coreReady) return;
  $('offlineHint').textContent = voiceReady || settings.sound !== 'voice'
    ? '준비 끝 — 이제 인터넷 없이도 됩니다.'
    : '준비 끝 — 읽어 주는 목소리는 받는 중입니다.';
}

// 고른 목소리의 음성 파일을 화면이 뜬 뒤 뒤에서 받아 둡니다 — 첫 화면은 느려지지 않습니다.
// 목록에 없는 옛 파일(문장을 고치기 전 음성)은 서비스 워커가 지웁니다.
function precacheVoice() {
  if (!voiceData || settings.sound !== 'voice' || !('serviceWorker' in navigator)) return;
  const want = Object.values(voiceData.drawings).map((d) => d[settings.voice]?.file).filter(Boolean);
  const keep = Object.values(voiceData.drawings).flatMap((d) => voiceData.voices.map((v) => d[v.id]?.file)).filter(Boolean);
  navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ precache: want, keep }));
}

function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(() => {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.ready) { coreReady = true; paintOffline(); }
      if (e.data?.audio) { voiceReady = e.data.audio.done >= e.data.audio.total; paintOffline(); }
    });
    const ask = () => navigator.serviceWorker.controller?.postMessage('ready?');
    ask();
    navigator.serviceWorker.ready.then(ask);
    setTimeout(ask, 1500);
    precacheVoice();
  }).catch(() => { /* 서비스 워커가 막혀도 활동은 됩니다 */ });
}

/* ------------------------------------------------------------------ 시작 */
async function boot() {
  const res = await fetch('data/drawings.json');
  const data = await res.json();
  drawings = data.drawings.map(prepare);
  $('drawingCount').textContent = `${drawings.length}가지`;
  // 음성 목록이 없어도 활동은 됩니다 — 그때는 기기 음성으로 읽습니다.
  voiceData = await fetch('data/voice.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (voiceData && !voiceData.voices.some((v) => v.id === settings.voice)) settings.voice = voiceData.voices[0].id;

  buildChips();
  paintGrid();
  registerOffline();

  // 전자칠판이 새로고침돼도 그 단계에서 이어집니다(PRD 3.6).
  const saved = store.get('progress', null);
  if (saved && byId(saved.id)) {
    const d = byId(saved.id);
    const step = Math.min(Math.max(0, saved.step | 0), d.steps.length - 1);
    run.drawing = d;
    startActivity(step, true);
    return;
  }
  show('home');
}

boot().catch((err) => {
  document.body.innerHTML =
    '<p style="padding:6vh 6vw;font-size:24px">그림 데이터를 읽지 못했습니다. '
    + 'data/drawings.json 이 있는지 확인해 주세요.</p>';
  console.error(err);
});
