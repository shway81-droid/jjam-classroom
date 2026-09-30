/* —— 짬짬이 낱말 ——
   화면에 닿는 코드는 전부 여기 있다. 출제 규칙(pick.js)·저장(store.js)은
   DOM을 모르는 모듈로 빼 두었다.

   검증 스크립트(scripts/validate-data.mjs)가 아래 TYPES·LEVELS·TOPICS 를
   정규식으로 읽어 간다. 상수 이름이나 형태를 바꾸면 그쪽도 함께 고쳐야 한다
   (안 고치면 검증이 통과하는 대신 실패한다 — 조용히 무력화되지 않도록). */

import { candidates, pickNext } from './pick.js';
import { numberPeople, setsOf, nextInOrder, LIVE_CHANNEL } from './roster.js';
import { store } from './store.js';
import { sound } from './sound.js';
import { createRound, advance, expire, checkWord, currentWord, nextHeads, okCount, hasWords } from './chain.js';
import * as clock from './clock.js';

const TYPES = {
  choseong: { label: 'ㄱㄴㄷ 초성퀴즈', emoji: '🔤', kind: 'quiz', topics: true, blurb: '초성을 보고 낱말을 외쳐요' },
  proverb: { label: '속담 이어말하기', emoji: '🗣', kind: 'quiz', topics: false, blurb: '앞부분을 보고 뒷부분을 외쳐요' },
  idiom: { label: '사자성어', emoji: '🀄', kind: 'quiz', topics: false, blurb: '뜻을 보고 사자성어를 외쳐요' },
  riddle: { label: '수수께끼', emoji: '❓', kind: 'quiz', topics: false, blurb: '수수께끼의 답을 외쳐요' },
  // 외쳐라 말놀이 묶음의 뒤쪽 넷 (2026-09-28). cue 는 문제 위에 작게 띄우는 물음이다 —
  // '뜨겁다' 한 낱말만 띄우면 무엇을 외칠지 화면만 보고는 모른다.
  opposite: { label: '반대말 외치기', emoji: '🔄', kind: 'quiz', topics: false, cue: '반대말은?', blurb: '낱말을 보고 반대말을 외쳐요' },
  mimetic: { label: '흉내 내는 말', emoji: '🐸', kind: 'quiz', topics: false, blurb: '빈칸에 어울리는 소리·모양을 외쳐요' },
  spelling: { label: '맞춤법 고치기', emoji: '📝', kind: 'quiz', topics: false, cue: '바르게 고치면?', blurb: '틀린 말을 바르게 고쳐 외쳐요' },
  scramble: { label: '글자 뒤섞기', emoji: '🔀', kind: 'quiz', topics: true, cue: '글자를 바로 놓으면?', blurb: '뒤섞인 글자를 바로 놓아 외쳐요' },
  chain: { label: '끝말잇기 도우미', emoji: '🔗', kind: 'tool', topics: false, blurb: '차례와 시간을 화면이 맡아요' },
  gesture: { label: '몸으로 말해요', emoji: '🎭', kind: 'tool', topics: true, blurb: '단어 카드를 크게 띄워요' },
  // 지구오락실 말놀이 — 예능에서 본 놀이를 교실로. 홈에서 두 번째 묶음에 선다(arcade).
  fourword: { label: '4글자 이어말하기', emoji: '🔠', kind: 'quiz', topics: false, arcade: true, blurb: '앞 두 글자를 보고 뒤 두 글자를 외쳐요' },
  person: { label: '인물퀴즈', emoji: '🧑', kind: 'quiz', topics: true, arcade: true, blurb: '사진을 보고 누구인지 외쳐요' },
  relay: { label: '줄줄이 말해요', emoji: '🔁', kind: 'tool', topics: false, arcade: true, blurb: '그 글자로 시작하는 말을 차례로 외쳐요' },
};

const LEVELS = ['easy', 'normal', 'hard'];
const TOPICS = ['동물', '음식', '학교물건', '직업', '나라', '자연', '탈것', '운동'];
// 인물퀴즈는 낱말 주제와 겹치지 않는 자기 분야를 쓴다 — '동물' 인물은 없다.
const PERSON_TOPICS = ['가수', '배우', '예능인', '운동선수', '역사 인물', '과학자', '예술가'];
const topicsOf = (type) => (type === 'person' ? PERSON_TOPICS : TOPICS);

// 끝말잇기와 줄줄이 말해요는 같은 판(차례·타이머·성공/탈락)을 쓴다. 제시어만 다르다.
const ROUND_TYPES = ['chain', 'relay'];
const ROUND_LABEL = { chain: '시작 단어', relay: '이 글자로 시작하는 말!' };
const STATES = ['HOME', 'SETUP', 'PROMPT', 'HINT', 'ANSWER', 'CHAIN', 'GESTURE', 'DONE'];

const LEVEL_LABEL = { all: '전체', easy: '쉬움', normal: '보통', hard: '어려움' };
const GROUPS = [2, 3, 4, 5, 6, 7, 8];
const SECONDS = [5, 10, 15, 20];

// 문제 길이에 따라 글자 크기를 세 단계로 (CSS .quiz-prompt[data-len])
const LEN_MID = 8;
const LEN_LONG = 18;
const LEN_WORDS = 5;
function lenClass(text) {
  if (text.length > LEN_LONG) return 'long';
  if (text.length > LEN_MID) return 'mid';
  // 띄어 쓴 여러 낱말(맞춤법 '틈틈히 연습해요')은 8자 이하여도 가장 큰 글자로는 두 줄로 접혀
  // 1920×950 칠판에서 [다음 문제] 를 밀어냈다. 한 글자씩 띄운 글자 뒤섞기('스 크 레 파')는
  // 한 줄에 들어가므로 그대로 둔다.
  if (text.length > LEN_WORDS && text.split(' ').filter((w) => w.length > 1).length > 1) return 'mid';
  return 'short';
}

// 최근 주제는 "3연속 회피"에만 쓰므로 몇 개만 들고 있으면 된다.
const TOPIC_MEMORY = 4;

// 속담은 빈칸을 그 자리에 채워야 한 문장으로 읽힌다.
//   "모르면 ______"  +  "약이요 아는 게 병"  →  "모르면 약이요 아는 게 병"
// 빈칸을 남겨 둔 채 답을 아래에 따로 띄우면, 정작 "이어 말한" 모습이 화면에 없다.
const BLANK = '______';

function fillBlank(el, prompt, answer) {
  const at = prompt.indexOf(BLANK);
  if (at < 0) return false;
  const head = prompt.slice(0, at);
  const tail = prompt.slice(at + BLANK.length);
  const span = document.createElement('span');
  span.className = 'filled';
  span.textContent = answer;
  el.textContent = '';
  el.append(document.createTextNode(head), span, document.createTextNode(tail));
  // 채우고 나면 문장이 길어진다 — 글자 크기를 다시 계산해 한 화면에 담는다.
  el.dataset.len = lenClass(head + answer + tail);
  return true;
}

// 4글자 이어말하기는 뒤가 딱 두 글자다. 속담용 빈칸(______)을 그대로 그리면
// 밑줄이 길게 이어져 뒤에 글자가 많아 보인다 — 정답 글자 수만큼 한 칸씩 끊어 그린다.
function slotBlank(el, prompt, count) {
  const at = prompt.indexOf(BLANK);
  if (at < 0) return false;
  const slots = Array.from({ length: count }, () => {
    const slot = document.createElement('span');
    slot.className = 'slot';
    slot.setAttribute('aria-hidden', 'true');
    return slot;
  });
  el.textContent = '';
  el.append(
    document.createTextNode(prompt.slice(0, at)),
    ...slots,
    document.createTextNode(prompt.slice(at + BLANK.length)),
  );
  return true;
}

const state = {
  screen: 'HOME',
  type: null,
  level: 'all',
  topic: 'all',
  groups: 4,
  seconds: 10,
  pool: [],
  item: null,
  stage: 'PROMPT',
  hintOpened: false,
  counted: false,
  recentTopics: [],
  items: [],
  // 인물퀴즈 — 출제 순서. 'sheet' 면 정답지(번호) 순서대로 세트를 낸다.
  order: 'random',
  setStart: 0,        // 고른 세트의 첫 자리(후보 안에서)
  seqPos: -1,         // 정답지 순서 출제에서 지금 자리
  numbers: new Map(), // 인물 id → 번호(No.)
  round: null,        // 끝말잇기 한 판
  timerId: null,
  deadline: 0,
  paused: false,
  remainMs: 0,        // 멈춰 둔 동안 들고 있는 남은 시간
  lastTick: 0,        // 초읽기를 초당 한 번만 울리기 위한 마지막 정수 초
  chainWarn: null,    // 끝말잇기 — 적은 낱말에 걸리는 점 { text, reason }
  cardCount: 0,       // 몸으로 말해요 — 이번에 넘긴 카드 수
  clock: clock.createClock(),   // 수업 타이머 — 놀이를 바꿔도 이어서 흐른다
  clockId: null,
  clockSec: 0,        // 재깍재깍을 초당 한 번만 울리기 위한 마지막 정수 초
};

const $ = (id) => document.getElementById(id);

const SCREENS = {
  HOME: 'screen-home',
  SETUP: 'screen-setup',
  PROMPT: 'screen-quiz',
  HINT: 'screen-quiz',
  ANSWER: 'screen-quiz',
  CHAIN: 'screen-chain',
  GESTURE: 'screen-gesture',
  DONE: 'screen-done',
  ERROR: 'screen-error',
};

function show(screen) {
  if (screen !== 'ERROR' && !STATES.includes(screen)) return;
  // 끝말잇기 화면을 떠나면 타이머를 끊는다. 안 끊으면 다른 화면에서
  // 시간이 다 되어 판이 끝나 버린다.
  if (state.screen === 'CHAIN' && screen !== 'CHAIN') stopChainTimer();
  const wasQuiz = SCREENS[state.screen] === 'screen-quiz';
  state.screen = screen;
  if (wasQuiz || SCREENS[screen] === 'screen-quiz') liveSend();
  const wanted = SCREENS[screen];
  for (const id of new Set(Object.values(SCREENS))) {
    $(id).hidden = id !== wanted;
  }
  window.scrollTo(0, 0);
}

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* —— 홈 —————————————————————————————————————————————————————— */

function renderHome() {
  const quiz = $('type-grid-quiz');
  const tool = $('type-grid-tool');
  const arcade = $('type-grid-arcade');
  quiz.textContent = '';
  tool.textContent = '';
  arcade.textContent = '';

  for (const [key, t] of Object.entries(TYPES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'type-card btn';
    btn.innerHTML =
      `<span class="type-emoji" aria-hidden="true">${t.emoji}</span>` +
      `<span class="type-body"><span class="type-label"></span>` +
      `<span class="type-blurb"></span></span>`;
    btn.querySelector('.type-label').textContent = t.label;
    btn.querySelector('.type-blurb').textContent = t.blurb;
    btn.addEventListener('click', () => openSetup(key));
    (t.arcade ? arcade : t.kind === 'quiz' ? quiz : tool).appendChild(btn);
  }
}

/* —— 조건 선택 ———————————————————————————————————————————————— */

function optionButton(row, label, checked, onPick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'option-btn';
  btn.setAttribute('role', 'radio');
  btn.setAttribute('aria-checked', checked ? 'true' : 'false');
  btn.textContent = label;
  btn.addEventListener('click', () => {
    for (const sib of row.querySelectorAll('.option-btn')) sib.setAttribute('aria-checked', 'false');
    btn.setAttribute('aria-checked', 'true');
    onPick();
  });
  row.appendChild(btn);
}

function openSetup(type) {
  state.type = type;
  state.level = 'all';
  state.topic = 'all';
  state.recentTopics = [];

  const t = TYPES[type];
  $('setup-title').textContent = `${t.emoji} ${t.label}`;

  // 끝말잇기 시작 단어는 난이도가 없다. 줄줄이 말해요는 글자에 따라 쉽고 어렵다.
  const isRound = ROUND_TYPES.includes(type);
  const hasLevel = type !== 'chain';
  $('group-level').hidden = !hasLevel;
  $('group-topic').hidden = !t.topics;
  $('group-groups').hidden = !isRound;
  // 인물퀴즈만 — 선생님이 정답 판정을 하려면 누가 나오는지 미리 알아야 한다(2026-09-30 요청).
  $('group-people').hidden = type !== 'person';
  $('group-order').hidden = type !== 'person';
  state.order = 'random';
  state.setStart = 0;
  if (type === 'person') {
    const orderRow = $('opt-order');
    orderRow.textContent = '';
    optionButton(orderRow, '무작위', true, () => { state.order = 'random'; updateCount(); });
    optionButton(orderRow, '정답지 순서대로', false, () => { state.order = 'sheet'; updateCount(); });
  }
  $('group-seconds').hidden = !isRound;

  if (hasLevel) {
    const levelRow = $('opt-level');
    levelRow.textContent = '';
    for (const lv of ['all', ...LEVELS]) {
      optionButton(levelRow, LEVEL_LABEL[lv], lv === 'all', () => {
        state.level = lv;
        updateCount();
      });
    }
  }

  if (t.topics) {
    const topicRow = $('opt-topic');
    topicRow.textContent = '';
    // 그 유형에 실제로 문항이 있는 주제만 보여 준다 — 고르고 나서 "0개"가 되면
    // 선생님이 이유를 알 수 없다.
    const present = topicsOf(type).filter((tp) => candidates(state.items, { type, topic: tp }).length > 0);
    optionButton(topicRow, '전체', true, () => {
      state.topic = 'all';
      updateCount();
    });
    for (const tp of present) {
      optionButton(topicRow, tp, false, () => {
        state.topic = tp;
        updateCount();
      });
    }
  }

  if (isRound) {
    const gRow = $('opt-groups');
    gRow.textContent = '';
    for (const g of GROUPS) {
      optionButton(gRow, `${g}모둠`, g === state.groups, () => { state.groups = g; });
    }
    const sRow = $('opt-seconds');
    sRow.textContent = '';
    for (const s of SECONDS) {
      optionButton(sRow, `${s}초`, s === state.seconds, () => { state.seconds = s; });
    }
  }

  updateCount();
  show('SETUP');
}

function poolNow() {
  return candidates(state.items, { type: state.type, level: state.level, topic: state.topic });
}

function updateCount() {
  const el = $('setup-count');
  if (ROUND_TYPES.includes(state.type)) {
    const n = poolNow().length;
    el.textContent = state.type === 'chain' ? `시작 단어 ${n}개 중에서 뽑아요.` : `제시 글자 ${n}개 중에서 뽑아요.`;
    el.classList.toggle('is-empty', n === 0);
    $('btn-start').disabled = n === 0;
    return;
  }
  const n = poolNow().length;
  el.textContent = n === 0
    ? '이 조건에 맞는 문제가 없어요. 난이도나 주제를 바꿔 주세요.'
    : `고른 조건에 맞는 문제 ${n}개`;
  if (state.type === 'person') renderSets();
  el.classList.toggle('is-empty', n === 0);
  $('btn-start').disabled = n === 0;
}

/* 인물퀴즈 '정답지 순서대로' — 고른 조건의 인물을 번호 순서대로 10명씩 끊어 세트로 고르게 한다.
   선생님은 정답 리스트(인쇄물)를 들고 번호를 따라가기만 하면 된다. 조건을 바꾸면 세트도 다시 짠다. */
function renderSets() {
  const group = $('group-set');
  const sheet = state.order === 'sheet';
  group.hidden = !sheet;
  if (!sheet) return;
  const sets = setsOf(poolNow(), state.numbers);
  if (!sets.some((x) => x.start === state.setStart)) state.setStart = 0;
  const row = $('opt-set');
  row.textContent = '';
  sets.forEach((x, i) => {
    const label = x.from === x.to ? `${i + 1}세트 · No.${x.from}` : `${i + 1}세트 · No.${x.from}~${x.to}`;
    optionButton(row, label, x.start === state.setStart, () => { state.setStart = x.start; });
  });
}

/* —— 출제 ———————————————————————————————————————————————————— */

function start() {
  // 첫 사용자 제스처에서 오디오를 깨운다 — 이보다 늦으면 자동재생 정책에 막힌다.
  sound.ensure();
  state.pool = poolNow();
  if (TYPES[state.type].kind === 'tool') {
    startTool();
    return;
  }
  if (state.pool.length === 0) return;
  state.seqPos = state.setStart - 1;
  nextItem();
}

function nextItem() {
  const sheet = state.type === 'person' && state.order === 'sheet';
  const got = sheet
    ? nextInOrder(state.pool, state.seqPos)
    : pickNext(state.pool, {
      recentIds: store.recentIds(state.type),
      recentTopics: state.recentTopics,
    });
  if (!got) { show('HOME'); return; }
  if (sheet) state.seqPos = got.pos;

  // 후보를 다 돌았으면 기록을 접는다. 접지 않으면 다음 문항부터 계속 exhausted 다.
  if (got.exhausted) store.clearRecent(state.type);

  state.item = got.item;
  store.pushRecent(state.type, got.item.id);
  state.recentTopics = [...state.recentTopics, got.item.topic].slice(-TOPIC_MEMORY);
  state.hintOpened = false;
  state.counted = false;

  renderItem();
  setStage('PROMPT');
  show('PROMPT');
}

function renderItem() {
  const it = state.item;
  // 인물은 번호(No.)를 함께 띄운다 — 선생님이 정답 리스트에서 바로 찾는다(아이들이 봐도 정답은 아니다).
  const no = it.type === 'person' ? `No.${state.numbers.get(it.id)}` : null;
  $('quiz-topic').textContent = [no, it.topic, TYPES[it.type].cue].filter(Boolean).join(' · ');
  $('btn-people-live').hidden = it.type !== 'person';
  const prompt = $('quiz-prompt');
  prompt.textContent = it.prompt;
  if (it.type === 'fourword') slotBlank(prompt, it.prompt, [...it.answer].length);
  prompt.dataset.len = lenClass(it.prompt);
  renderPhoto(it);
  $('quiz-hint').textContent = it.hint;
  $('answer-text').textContent = it.answer;
  $('answer-text').dataset.len = lenClass(it.answer);   // 긴 이름(크리스티아누 호날두)은 한 줄에 담기게 줄인다
  $('answer-text').hidden = false;   // 빈칸에 채운 문항에서는 정답을 아래에 또 띄우지 않는다

  const also = $('answer-also');
  const alsoList = Array.isArray(it.also) ? it.also.filter(Boolean) : [];
  also.hidden = alsoList.length === 0;
  also.textContent = alsoList.length ? `이것도 맞아요 — ${alsoList.join(' · ')}` : '';

  const note = $('answer-note');
  note.hidden = !it.note;
  note.textContent = it.note || '';

  $('quiz-count').textContent = `오늘 ${store.todayCount(todayStr())}문항`;
}

/* 인물퀴즈 사진. 한 번 본 사진만 오프라인 캐시에 남으므로(sw.js 가 미리 받지 않는다 —
   사진을 다 받으면 첫 방문이 몇 MB 가 된다) 못 불러오는 때가 있다. 그때는 빈 사진틀을
   두지 않고 힌트를 바로 연다 — 초성과 설명만으로도 맞힐 수 있다. */
function renderPhoto(it) {
  const img = $('quiz-photo');
  const credit = $('answer-credit');
  img.onerror = null;
  if (!it.photo) {
    img.hidden = true;
    img.removeAttribute('src');
    credit.hidden = true;
    return;
  }
  img.hidden = false;
  img.onerror = () => {
    img.hidden = true;
    if (state.item === it && state.stage === 'PROMPT') setStage('HINT');
  };
  img.src = it.photo.file;
  // 자유 라이선스(CC BY·BY-SA)의 조건 — 저작자·라이선스·원본을 밝히고, 고친 것(크기)을 적는다.
  const link = $('answer-credit-link');
  link.href = it.photo.source;
  link.textContent = `사진: ${it.photo.author} · ${it.photo.license} · 위키미디어 공용 (크기 조정)`;
  credit.hidden = false;
}

function setStage(stage) {
  const entering = state.stage !== stage;
  state.stage = stage;
  if (stage === 'HINT') state.hintOpened = true;
  const showAnswer = stage === 'ANSWER';
  // 단계에 따라 사진 크기가 바뀐다(css .quiz[data-stage]) — 힌트·정답이 쌓여도 한 화면에 든다.
  $('screen-quiz').dataset.stage = stage;
  // 첫 문항은 아직 설정 화면에서 여기로 온다 — 그때는 show() 가 알린다.
  if (SCREENS[state.screen] === 'screen-quiz') liveSend();

  if (entering && stage === 'HINT') sound.hint();
  if (entering && stage === 'ANSWER') sound.reveal();

  // 건너뛴 힌트는 정답과 함께 나타나지 않는다. 안 그러면 정답 버튼 한 번에
  // 힌트와 정답이 동시에 튀어나와, 아이들 눈이 어디를 봐야 할지 모른다.
  $('quiz-hint').hidden = !state.hintOpened;
  $('quiz-answer').hidden = !showAnswer;
  $('btn-hint').hidden = state.hintOpened || showAnswer;   // 힌트는 한 번만
  $('btn-reveal').hidden = showAnswer;
  $('btn-next').hidden = !showAnswer;

  if (showAnswer) {
    // 빈칸이 있는 유형(속담)은 그 자리를 채운다. 채웠으면 같은 답을 아래에
    // 한 번 더 띄우지 않는다 — 화면에 답이 두 번 나오면 어디를 읽어야 할지 흐려진다.
    const filledIn = fillBlank($('quiz-prompt'), state.item.prompt, state.item.answer);
    $('answer-text').hidden = filledIn;
  }
  // 빈칸에 채운 문항은 문제 줄이 곧 정답이다 — css 가 그 줄을 줄이지 않도록 알린다.
  $('screen-quiz').toggleAttribute('data-filled', showAnswer && $('answer-text').hidden);

  if (showAnswer && !state.counted) {
    // 오늘 푼 수는 정답을 처음 열 때만 센다. 힌트를 여러 번 눌러도 늘지 않는다.
    state.counted = true;
    $('quiz-count').textContent = `오늘 ${store.bumpToday(todayStr())}문항`;
  }
}

/* Space 한 번의 뜻 — 지금 단계에서 "다음"에 해당하는 하나 */
function advanceStage() {
  if (state.stage === 'ANSWER') nextItem();
  else setStage('ANSWER');
}

function finish() {
  const n = store.todayCount(todayStr());
  $('done-text').textContent = n > 0 ? `오늘 ${n}문항 했어요!` : '오늘도 잘했어요!';
  show('DONE');
}

/* —— 도구형 (끝말잇기·몸으로 말해요) ——————————————————————————
   화면은 각자의 모듈에서 그린다. 여기서는 어느 화면으로 보낼지만 정한다. */

function startTool() {
  if (ROUND_TYPES.includes(state.type)) { startChain(); return; }
  state.cardCount = 0;
  nextCard();
}

/* —— 몸으로 말해요 ——
   한 명만 화면을 등지고 맞힌다. 정답 데이터가 없으니 단계도 없다 —
   카드를 크게 띄우고 [다음 카드] 하나뿐이다. */

function nextCard() {
  const got = pickNext(state.pool, {
    recentIds: store.recentIds('gesture'),
    recentTopics: state.recentTopics,
  });
  if (!got) { show('HOME'); return; }
  if (got.exhausted) store.clearRecent('gesture');

  state.item = got.item;
  store.pushRecent('gesture', got.item.id);
  state.recentTopics = [...state.recentTopics, got.item.topic].slice(-TOPIC_MEMORY);
  state.cardCount += 1;

  $('gesture-topic').textContent = got.item.topic || '';
  $('gesture-word').textContent = got.item.word;
  $('gesture-count').textContent = `${state.cardCount}장`;
  show('GESTURE');
}

/* —— 끝말잇기 도우미 ——
   차례와 남은 시간을 맡고, 성공·탈락은 교사의 딸깍으로 기록한다.
   교사가 아이가 말한 낱말을 적으면(선택) 그 낱말과 다음 글자가 화면에 뜬다. */

// 적은 낱말에 걸리는 점 — 알려 주기만 한다. 같은 낱말로 Enter 를 한 번 더 누르면 인정한다.
const CHAIN_WARN = {
  hangul: '한글 낱말이 아니에요',
  short: '한 글자 낱말이에요',
  head: '첫 글자가 달라요',
  used: '이미 나온 말이에요',
};

function startChain() {
  const type = state.type;
  const got = pickNext(poolNow(), { recentIds: store.recentIds(type) });
  if (!got) { show('HOME'); return; }
  if (got.exhausted) store.clearRecent(type);
  store.pushRecent(type, got.item.id);
  state.round = createRound({
    word: got.item.word, groups: state.groups, seconds: state.seconds,
    mode: type === 'relay' ? 'relay' : 'chain',
  });
  state.chainWarn = null;
  $('chain-input').value = '';
  state.paused = false;   // 지난 판을 멈춰 둔 채 나갔을 수 있다
  renderChain();
  show('CHAIN');
  startChainTimer();
}

const LOG_SHOWN = 6;

// 끝말잇기는 앞말에서 뒷말로 이어지고, 줄줄이는 한 글자에서 나란히 뻗는다.
const trailSep = (r) => (r.mode === 'chain' ? '→' : '·');

/* 지나간 기록 — 한 줄.
   낱말을 적었으면 이어진 말을 화살표로 잇는다(기차 → 차표 → 표범). 들어가는 만큼 보여 주고,
   넘치면 오래된 말부터 빼고 앞에 … 을 붙인다 — 앞에 더 있다는 표시다. 전부는 판이 끝나면 펼친다.
   낱말을 안 적었으면 예전처럼 최근 차례(1번 ✓ 2번 ✗)를 보여 준다. */
function renderChainLog(r) {
  const log = $('chain-log');
  log.textContent = '';
  const trail = hasWords(r);
  log.classList.toggle('is-trail', trail);
  log.hidden = r.done && trail;   // 판이 끝나면 아래 요약이 전부 보여 준다
  if (!trail) {
    for (const e of r.log.slice(-LOG_SHOWN)) {
      const chip = document.createElement('span');
      chip.className = 'chain-log-item' + (e.result === 'ok' ? '' : ' is-out');
      const mark = e.result === 'ok' ? '✓' : e.result === 'timeout' ? '초과' : '✗';
      chip.textContent = `${e.turn}번 ${mark}`;
      log.appendChild(chip);
    }
    return;
  }
  if (log.hidden) return;
  const words = r.words;
  const paint = (from) => {
    log.textContent = '';
    if (from > 0) log.append(trailPart('…', 'chain-trail-more'));
    words.slice(from).forEach((w, i) => {
      if (i > 0 || from > 0) log.append(trailPart(trailSep(r), 'chain-trail-sep'));
      log.append(trailPart(w, 'chain-trail-word'));
    });
  };
  // 넘치지 않을 때까지 앞에서부터 뺀다. 마지막 낱말은 무슨 일이 있어도 남긴다.
  let from = 0;
  paint(from);
  while (log.scrollWidth > log.clientWidth + 1 && from < words.length - 1) paint(++from);
}

function trailPart(text, cls) {
  const el = document.createElement('span');
  el.className = cls;
  el.textContent = text;
  return el;
}

/* 판이 끝나면 — 몇 번 이었는지와 이어진 말 전부. 낱말이 많을수록 글자를 줄여 한 화면에 담는다. */
function renderChainSummary(r) {
  const box = $('chain-summary');
  const n = okCount(r);
  box.hidden = !r.done || n === 0;
  $('chain-clock').hidden = r.done && !box.hidden;
  if (box.hidden) return;
  $('chain-summary-title').textContent = r.mode === 'chain' ? `🔗 ${n}번 이어졌어요!` : `🔁 ${n}개 말했어요!`;
  const words = $('chain-summary-words');
  const trail = hasWords(r);
  words.hidden = !trail;
  // 화살표는 앞말에 붙인다(줄바꿈 없는 공백) — 줄이 바뀌어도 새 줄이 화살표로 시작하지 않게.
  words.textContent = trail ? r.words.join(`\u00A0${trailSep(r)} `) : '';
  const count = r.words.length;
  words.dataset.size = count > 30 ? 's' : count > 15 ? 'm' : 'l';
}

function renderChain() {
  const r = state.round;
  // 시간이 다 됐지만 아직 교사가 판정하지 않은 상태. 판은 살아 있다.
  const expired = r.expired && !r.done;

  const said = r.mode === 'chain' && r.words.length > 1;
  $('chain-label').textContent = said ? '방금 나온 말' : ROUND_LABEL[state.type];
  $('chain-word').textContent = currentWord(r);
  // 다음 글자 — 끝말잇기만. 줄줄이는 제시 글자가 곧 다음 글자다.
  const next = $('chain-next');
  next.hidden = r.mode !== 'chain' || r.done;
  next.textContent = `다음 글자: ${nextHeads(r).join(' · ')}`;
  $('chain-turn').textContent = r.done
    ? '판이 끝났어요'
    : expired ? `${r.turn}번 모둠 — 시간 초과` : `${r.turn}번 모둠 차례`;
  $('chain-turn').classList.toggle('is-expired', expired);

  renderChainLog(r);
  renderChainSummary(r);

  // 시간이 다 되면 두 버튼의 *뜻*이 바뀐다 — 자리는 그대로 둔다.
  // 교사는 화면이 아니라 교실을 보고 있으므로, 손이 기억한 위치가 흔들리면 안 된다.
  // Space 는 어느 쪽이든 "지금 가장 흔한 다음"에 붙는다.
  $('btn-chain-ok').innerHTML = expired ? '그래도 성공' : '성공 <kbd>Space</kbd>';
  $('btn-chain-out').innerHTML = expired ? '시간 초과 <kbd>Space</kbd>' : '탈락';
  $('btn-chain-ok').hidden = r.done;
  $('btn-chain-out').hidden = r.done;
  $('btn-chain-again').hidden = !r.done;

  $('chain-entry').hidden = r.done;
  const warn = $('chain-warn');
  const w = state.chainWarn;
  warn.hidden = !w;
  warn.textContent = !w ? ''
    : `${CHAIN_WARN[w.reason]}${w.reason === 'head' ? ` (다음 글자: ${nextHeads(r).join(' · ')})` : ''} — 그래도 인정하려면 Enter`;

  const pause = $('btn-chain-pause');
  pause.hidden = r.done || expired;
  pause.textContent = state.paused ? '▶ 이어서 (P)' : '‖ 잠깐 (P)';
  pause.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
}

function stopChainTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

const TICK_MS = 100;      // 링이 뚝뚝 끊기지 않을 만큼만 자주 (숫자는 초 단위로 바뀐다)
const URGENT_FROM = 3;    // 남은 3초부터 초읽기

function startChainTimer() {
  stopChainTimer();
  state.paused = false;
  state.deadline = Date.now() + state.round.seconds * 1000;
  // 시작하자마자 초읽기가 울리지 않게 첫 초보다 위에서 시작한다.
  state.lastTick = state.round.seconds + 1;
  // 남은 시간은 벽시계(Date.now)로 계산한다. 인터벌이 몇 번 돌았는지로 세면
  // 탭이 백그라운드로 갔을 때 브라우저가 인터벌을 늦춰 시간이 어긋난다.
  state.timerId = setInterval(tickChainTimer, TICK_MS);
  tickChainTimer();
}

function tickChainTimer() {
  const leftMs = Math.max(0, state.deadline - Date.now());
  paintTimer(leftMs);

  // 초읽기는 정수 초가 내려간 순간에만. 인터벌은 그보다 훨씬 자주 돈다.
  const left = Math.ceil(leftMs / 1000);
  if (left > 0 && left <= URGENT_FROM && left < state.lastTick) sound.tick();
  state.lastTick = left;

  if (leftMs === 0) chainTimeUp();
}

/* 0 초 — 소리 한 번 울리고 화면은 여기서 멈춘다.
   다음에 무슨 일이 일어날지는 교사의 딸깍이 정한다. */
function chainTimeUp() {
  stopChainTimer();
  state.round = expire(state.round);
  sound.timeUp();
  renderChain();
}

function toggleChainPause() {
  if (state.round.done || state.round.expired) return;
  if (state.paused) {
    state.deadline = Date.now() + state.remainMs;
    state.paused = false;
    state.timerId = setInterval(tickChainTimer, TICK_MS);
    tickChainTimer();
  } else {
    state.remainMs = Math.max(0, state.deadline - Date.now());
    stopChainTimer();
    state.paused = true;
    paintTimer(state.remainMs);
  }
  renderChain();
}

function paintTimer(leftMs) {
  const el = $('chain-timer');
  const left = Math.ceil(leftMs / 1000);
  el.textContent = String(left);
  // 색으로만 알리지 않는다 — CSS 에서 크기도 함께 커지고, 링이 함께 줄어든다.
  el.classList.toggle('is-urgent', left > 0 && left <= URGENT_FROM);
  el.classList.toggle('is-over', left === 0);

  // 링은 남은 비율(0~1)로 그린다. 뒷자리에서는 숫자보다 줄어드는 호가 먼저 읽힌다.
  const total = state.round ? state.round.seconds * 1000 : 1;
  const clock = $('chain-clock');
  clock.style.setProperty('--left', String(Math.max(0, Math.min(1, leftMs / total))));
  clock.classList.toggle('is-paused', state.paused);
  clock.classList.toggle('is-over', leftMs === 0);
}

/* [성공]·Space·Enter 가 모두 여기로 온다. 적어 둔 낱말이 있으면 함께 기록한다.
   걸리는 점이 있으면 한 번은 멈춰 알려 주고, 같은 낱말로 다시 오면 인정한다. */
function chainOk() {
  const r = state.round;
  const input = $('chain-input');
  const text = input.value.trim();
  if (!text) { chainAdvance(r.expired ? 'timeout' : 'ok'); return; }
  const reason = checkWord(r, text);
  if (reason && !(state.chainWarn && state.chainWarn.text === text)) {
    state.chainWarn = { text, reason };
    renderChain();
    return;
  }
  input.value = '';
  chainAdvance('ok', text);
}

function chainAdvance(result, word) {
  stopChainTimer();
  state.chainWarn = null;
  state.round = advance(state.round, result, word);
  renderChain();
  if (!state.round.done) startChainTimer();
}

/* —— 전체화면 ——————————————————————————————————————————————————
   전자칠판에서 주소창·탭 높이만큼 문제를 더 크게 쓴다. 게임·퀴즈의 헤더 버튼과 같은 동작이다.
   API 가 없는 브라우저(아이폰 사파리 등)에서는 버튼을 숨긴다 — 눌러도 아무 일이 없는 버튼보다 낫다. */
function bindFullscreen() {
  const btn = $('btn-fs');
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!request || !exit) { btn.hidden = true; return; }
  const current = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const paint = () => {
    const on = !!current();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? '전체화면 끄기' : '전체화면');
    btn.title = on ? '전체화면 끄기' : '전체화면';
  };
  btn.addEventListener('click', () => {
    try {
      const p = current() ? exit.call(document) : request.call(root);
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* 막힌 환경에서는 조용히 넘어간다 */ }
  });
  document.addEventListener('fullscreenchange', paint);
  document.addEventListener('webkitfullscreenchange', paint);
  paint();
}

/* —— 수업 타이머 ———————————————————————————————————————————————
   규칙(js/clock.js)은 DOM 을 모른다. 여기서는 그리고 듣기만 한다.
   화면을 옮겨도 끊지 않는다 — show() 가 이 시계를 건드리지 않는 것이 핵심이다.
   (끝말잇기 차례 타이머는 반대로 화면을 떠나면 끊는다. 다른 물건이다.) */

const CLOCK_TICK_MS = 250;      // 숫자는 초 단위로만 바뀐다. 이보다 자주 볼 이유가 없다.
const CLOCK_URGENT_MS = 10000;  // 마지막 10초부터 커진다
const CLOCK_URGENT_SEC = CLOCK_URGENT_MS / 1000;

function renderClock() {
  const c = state.clock;
  const left = clock.remaining(c, Date.now());
  const urgent = c.running && left > 0 && left <= CLOCK_URGENT_MS;
  const idle = clock.isIdle(c);

  $('clock').dataset.state = idle ? 'idle'
    : c.expired ? 'over'
    : urgent ? 'urgent'
    : c.running ? 'running' : 'paused';

  $('clock-time').textContent = c.expired ? '시간 끝' : clock.format(left);

  // 마지막 10초에는 상단바가 1초마다 밝아졌다 돌아온다 — 뒷자리에서는 이게
  // 패널의 숫자보다 먼저 보인다. 본문은 건드리지 않는다.
  document.body.classList.toggle('is-urgent', urgent);
  document.body.classList.toggle('is-over', c.expired);

  // 지금 걸려 있는 시간에 표시를 남긴다 — 3분을 걸어 뒀는지 5분인지 나중에 헷갈린다.
  for (const b of $('clock-picks').children) {
    b.setAttribute('aria-pressed', !idle && Number(b.dataset.min) === c.totalMs / 60000 ? 'true' : 'false');
  }

  const pause = $('btn-clock');
  const canPause = !idle && !c.expired;
  pause.disabled = !canPause;
  pause.innerHTML = c.running || !canPause ? '‖ 잠깐 <kbd>P</kbd>' : '▶ 이어서 <kbd>P</kbd>';
  // 눈으로 보이는 글자와 화면 낭독기가 읽는 말이 서로 어긋나지 않게 한다.
  pause.setAttribute('aria-label', !canPause ? '잠깐 멈춤 — 걸어 둔 시간이 없어요'
    : c.running ? `남은 시간 ${clock.format(left)}, 잠깐 멈추기`
    : `${clock.format(left)} 남기고 멈춤. 이어서 하기`);

  $('btn-clock-reset').disabled = idle;
}

function startClockTicking() {
  stopClockTicking();
  state.clockId = setInterval(clockTick, CLOCK_TICK_MS);
}

function stopClockTicking() {
  if (state.clockId !== null) {
    clearInterval(state.clockId);
    state.clockId = null;
  }
}

function clockTick() {
  const now = Date.now();
  const next = clock.tick(state.clock, now);
  const justEnded = next.expired && !state.clock.expired;
  const left = Math.ceil(clock.remaining(next, now) / 1000);

  // 재깍재깍·심장박동은 정수 초가 내려간 순간에만. 인터벌은 그보다 훨씬 자주 돈다.
  if (next.running && left > 0 && left !== state.clockSec) {
    if (store.isTicking()) {
      // 마지막 10초에 점점 커진다. 그 전에는 늘 같은 세기로 조용히 간다.
      const urgency = left <= CLOCK_URGENT_SEC ? (CLOCK_URGENT_SEC - left + 1) / CLOCK_URGENT_SEC : 0;
      sound.tock(urgency, left % 2 === 0);
    }
    if (left <= CLOCK_URGENT_SEC) beatClock();
  }
  state.clockSec = left;

  state.clock = next;
  if (justEnded) {
    stopClockTicking();
    sound.sessionEnd();
  }
  renderClock();
}

/* 1초마다 숫자가 한 번 부푼다. 클래스를 지웠다 다시 붙여야 애니메이션이 또 돈다. */
function beatClock() {
  const el = $('clock-time');
  el.classList.remove('is-beat');
  void el.offsetWidth;
  el.classList.add('is-beat');
}

/* 고르는 순간이 곧 시작이다. 시간이 끝나도 놀이를 닫지 않는다 —
   답을 외치는 중에 화면이 혼자 홈으로 돌아가 버리면 곤란하다. */
function setClockMinutes(minutes) {
  sound.ensure();     // 첫 사용자 조작 — 여기서 오디오를 깨워 둔다
  state.clock = clock.start(state.clock, minutes, Date.now());
  startClockTicking();
  renderClock();
}

function resetClock() {
  stopClockTicking();
  state.clock = clock.createClock();
  state.clockSec = 0;
  renderClock();
}

function toggleTicking() {
  sound.ensure();
  const on = !store.isTicking();
  store.setTicking(on);
  paintTickButton();
  if (on) sound.tock(0.2, false);   // 켜는 순간 한 번 들려 준다 — 어떤 소리인지 알고 켜야 한다
}

function paintTickButton() {
  const on = store.isTicking();
  const b = $('btn-clock-tick');
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute('aria-label', on ? '재깍재깍 소리 끄기' : '재깍재깍 소리 켜기');
  b.textContent = on ? '🔔 재깍재깍' : '🔕 재깍재깍';
}

/* 걸어 둔 시간이 없거나 이미 끝났으면 아무 일도 하지 않는다 —
   잠깐 멈춤은 "멈춤"이지 "타이머 켜기"가 아니다. */
function pauseClockNow() {
  const c = state.clock;
  if (!c.running) return;
  state.clock = clock.pause(c, Date.now());
  stopClockTicking();
  renderClock();
}

function resumeClockNow() {
  const c = state.clock;
  if (c.running || c.expired || clock.isIdle(c)) return;
  state.clock = clock.resume(c, Date.now());
  startClockTicking();
  renderClock();
}

function toggleClockPause() {
  if (state.clock.running) pauseClockNow(); else resumeClockNow();
}

/** `P` 와 끝말잇기의 [‖ 잠깐] 이 함께 부른다.
    끝말잇기 화면에서는 차례 타이머와 수업 타이머가 한 번에 멈춘다 — 아이 말을
    되물을 때 둘 중 하나만 멈추면 소용이 없다. 하나라도 흐르고 있으면 둘 다
    멈추고, 아무것도 흐르지 않으면 둘 다 이어서 간다(따로 놀지 않게). */
function togglePauseAll() {
  const chainLive = state.screen === 'CHAIN' && state.round && !state.round.done && !state.round.expired;
  const running = state.clock.running || (chainLive && !state.paused);
  if (chainLive && state.paused !== running) toggleChainPause();
  if (running) pauseClockNow(); else resumeClockNow();
}

/* 시간 버튼은 늘 펴 둔다. 접어 두면 3분을 걸려고 딸깍을 두 번 해야 하는데,
   교실에서는 그 한 박자가 늦다 (교사 조작을 늘리지 않는다 — PRD 4절과 같은 뜻). */
function buildClockPicks() {
  const picks = $('clock-picks');
  for (const m of clock.MINUTES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.min = String(m);
    b.setAttribute('aria-pressed', 'false');
    b.textContent = `${m}분`;
    b.addEventListener('click', () => setClockMinutes(m));
    picks.appendChild(b);
  }
}

/* —— 부팅 ———————————————————————————————————————————————————— */

// 정답 리스트 새 창. 창 이름을 고정해 두면 여러 번 눌러도 창이 하나만 뜬다
// ('noopener' 를 주면 브라우저가 이름으로 찾지 않고 매번 새 창을 띄운다 — 우리 사이트 창이라 필요 없다).
function openPeopleWindow() {
  window.open('people.html', 'jjam-word-people');
}

function wire() {
  $('brand-home').addEventListener('click', (e) => { e.preventDefault(); show('HOME'); });
  $('btn-setup-back').addEventListener('click', () => show('HOME'));
  $('btn-start').addEventListener('click', start);
  // 새 창 — 출제 화면을 그대로 둔 채 정답 리스트를 옆에 띄워 놓고 쓸 수 있게.
  $('btn-people-list').addEventListener('click', openPeopleWindow);
  $('btn-people-live').addEventListener('click', openPeopleWindow);
  $('btn-hint').addEventListener('click', () => setStage('HINT'));
  $('btn-reveal').addEventListener('click', () => setStage('ANSWER'));
  $('btn-next').addEventListener('click', nextItem);
  $('btn-skip').addEventListener('click', nextItem);
  $('btn-quit').addEventListener('click', finish);
  $('btn-continue').addEventListener('click', () => (state.item ? nextItem() : show('HOME')));
  $('btn-home').addEventListener('click', () => show('HOME'));

  // 시간 초과 뒤의 [탈락] 자리는 '시간 초과'다 — 기록에 '초과' 로 남는다.
  // 적어 둔 낱말이 있으면 [성공]도 그 낱말을 함께 기록한다. 시간이 지났어도 '그래도 성공'이다.
  $('btn-chain-ok').addEventListener('click', () => {
    if ($('chain-input').value.trim()) chainOk();
    else chainAdvance('ok');
  });
  // 창 크기가 바뀌면 이어진 말 한 줄을 다시 맞춘다 — 들어가는 개수가 화면 폭에 달렸다.
  window.addEventListener('resize', () => {
    if (state.screen === 'CHAIN' && state.round) renderChain();
  });
  // 입력칸 안에서는 Enter 만 우리 것이다. 한글 조합 중의 Enter 는 글자를 확정할 뿐이다.
  $('chain-input').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.target.blur(); return; }
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    if (!state.round) return;
    if (state.round.done) startChain();
    else chainOk();
  });
  $('chain-input').addEventListener('input', () => {
    // 고쳐 쓰면 경고를 거둔다 — 지난 낱말에 대한 경고가 새 낱말에 붙어 있으면 헷갈린다.
    if (state.chainWarn && state.chainWarn.text !== $('chain-input').value.trim()) {
      state.chainWarn = null;
      renderChain();
    }
  });
  $('btn-chain-out').addEventListener('click', () => chainAdvance(state.round.expired ? 'timeout' : 'out'));
  $('btn-chain-pause').addEventListener('click', togglePauseAll);
  $('btn-chain-again').addEventListener('click', startChain);
  $('btn-chain-new').addEventListener('click', startChain);
  $('btn-chain-quit').addEventListener('click', () => show('HOME'));

  $('btn-gesture-next').addEventListener('click', nextCard);
  $('btn-gesture-quit').addEventListener('click', () => show('HOME'));

  buildClockPicks();
  paintTickButton();
  renderClock();
  $('btn-clock').addEventListener('click', togglePauseAll);
  $('btn-clock-reset').addEventListener('click', resetClock);
  $('btn-clock-tick').addEventListener('click', toggleTicking);

  const mute = $('btn-mute');
  const paintMute = () => mute.setAttribute('aria-pressed', store.isMuted() ? 'true' : 'false');
  paintMute();
  sound.setMuted(store.isMuted());
  mute.addEventListener('click', () => {
    store.setMuted(!store.isMuted());
    sound.setMuted(store.isMuted());
    paintMute();
  });

  bindFullscreen();

  // 버튼에 포커스가 남으면 Space 가 두 번 먹는다(클릭 + 키보드). 눌린 뒤 포커스를 뗀다.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) b.blur();
  });

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // 글자를 적는 중에는 단축키를 쓰지 않는다 — 'ㅔ'(P)·Space 가 잠깐·성공으로 새면 안 된다.
    if (e.target instanceof HTMLInputElement) return;
    const onQuiz = state.screen === 'PROMPT' || state.screen === 'HINT' || state.screen === 'ANSWER';
    const onChain = state.screen === 'CHAIN';
    const onGesture = state.screen === 'GESTURE';

    if (e.key === 'Escape') {
      if (onQuiz) { e.preventDefault(); finish(); }
      else if (onChain || onGesture) { e.preventDefault(); show('HOME'); }
      return;
    }

    // P 는 어느 화면에서든 "잠깐". 끝말잇기에서는 차례 타이머와 수업 타이머가
    // 한 번에 멈춘다 — 아이 말을 되물을 때 둘 중 하나만 멈추면 소용이 없다.
    // (한글 자판이 켜져 있으면 P 자리에서 'ㅔ' 가 온다 — 교실에서 흔한 상황이다.)
    if (e.key === 'p' || e.key === 'P' || e.key === 'ㅔ') {
      e.preventDefault();
      togglePauseAll();
      return;
    }

    if (onGesture) {
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); nextCard(); }
      return;
    }

    if (onChain) {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!state.round) return;
        // 시간이 다 됐으면 Space 의 뜻이 '시간 초과'로 옮겨 간다 — 화면의 버튼과 같다.
        if (state.round.done) startChain();
        else chainOk();
      }
      return;
    }
    if (!onQuiz) return;

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();       // 스크롤 방지
      advanceStage();
    } else if (e.key === 'h' || e.key === 'H' || e.key === 'ㅗ') {
      // 한글 자판이 켜져 있으면 H 자리에서 'ㅗ' 가 온다 — 교실에서 흔한 상황이다.
      e.preventDefault();
      if (state.stage === 'PROMPT') setStage('HINT');
    }
  });
}

/* —— 선생님 창 (정답 리스트 새 창과 실시간 연결) ——
   칠판(확장 화면)에는 문제만, 선생님 노트북 화면의 정답 리스트 창에는 "지금 문제의 정답"이 뜬다.
   같은 브라우저의 두 창끼리 BroadcastChannel 로 알린다 — 서버 없이, 인터넷 없이 된다.
   지원하지 않는 브라우저에서는 조용히 빠진다(정답 리스트는 그대로 쓸 수 있다). */
const live = typeof BroadcastChannel === 'function' ? new BroadcastChannel(LIVE_CHANNEL) : null;

function liveSend() {
  if (!live) return;
  const onQuiz = SCREENS[state.screen] === 'screen-quiz';
  const it = state.item;
  if (onQuiz && it && it.type === 'person') {
    live.postMessage({ kind: 'item', id: it.id, no: state.numbers.get(it.id), stage: state.stage });
  } else {
    live.postMessage({ kind: 'idle' });
  }
}

if (live) {
  // 선생님 창을 문제 도중에 열면 "지금 무엇이 나와 있나"를 물어 온다.
  live.onmessage = (e) => { if (e.data && e.data.kind === 'hello') liveSend(); };
}

async function boot() {
  wire();
  try {
    const res = await fetch('data/words.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    if (state.items.length === 0) throw new Error('빈 데이터');
    state.numbers = numberPeople(state.items);
  } catch {
    show('ERROR');
    return;
  }
  renderHome();
  show('HOME');
}

boot();

// 오프라인 (FR-09). 등록에 실패해도 앱은 그대로 돌아간다 — 오프라인만 안 될 뿐이다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
