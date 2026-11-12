/* —— 짬짬이 유치원 — 화면과 상태 ——
   DOM 에 닿는 코드는 여기만 있다. 카드 뽑기 규칙은 js/deck.js(순수)가 맡는다.

   놀이 두 가지가 같은 카드 화면을 쓴다.
     gesture  몸으로 말해요 — 그림과 낱말을 함께 띄운다. 한 친구가 화면을 등지고 서고,
              나머지가 몸으로 알려 준다. 흉내를 어떻게 낼지 모르는 아이를 위해 [몸짓 힌트].
     guess    무엇일까요?  — 그림만 띄운다. 다 같이 외친 뒤 [정답 보기]를 누르면
              글자가 나타난다.

   낱말을 소리로 읽어 주지 않는다 — 효과음만 낸다(js/sound.js).

   유치원 아이들은 아직 글자를 못 읽는다 — 그래서 화면의 주인공은 언제나 그림이다.
   글자는 그림 밑에 붙어 "이 그림의 이름은 이렇게 생겼구나"를 보여 주는 정도로 둔다. */

import { drawCard, emptyDeck } from './deck.js';
import * as sound from './sound.js';

// 주제 — data/cards.json 의 topic 과 같아야 한다(scripts/validate-data.mjs 가 맞춰 본다).
// icon 은 주제 버튼에 붙는 그림 — 글자를 못 읽는 아이도 고를 수 있게.
export const TOPICS = [
  { key: '동물', icon: 'rabbit' },
  { key: '먹을거리', icon: 'apple' },
  { key: '탈것', icon: 'car' },
  { key: '물건', icon: 'ball' },
  { key: '자연', icon: 'flower' },
];

const STORE_TOPICS = 'jjam-kinder:topics';
const STORE_MUTED = 'jjam-kinder:muted';

const $ = (id) => document.getElementById(id);

const state = {
  cards: [],
  topics: new Set(TOPICS.map((t) => t.key)),
  mode: 'gesture',
  deck: emptyDeck(),
  item: null,
  revealed: false,
  count: 0,
  muted: false,
};

/* —— 저장 — 막힌 브라우저(시크릿 창 등)에서도 놀이는 된다 —— */
function load(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); } catch { /* 저장 못 해도 그만 */ }
}

function show(name) {
  $('screen-home').hidden = name !== 'HOME';
  $('screen-card').hidden = name !== 'CARD';
  document.body.dataset.screen = name;
}

/* —— 첫 화면 —— */

function renderTopics() {
  const box = $('topics');
  box.textContent = '';
  for (const t of TOPICS) {
    const n = state.cards.filter((c) => c.topic === t.key).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic';
    btn.setAttribute('aria-pressed', state.topics.has(t.key) ? 'true' : 'false');
    btn.innerHTML = `<img src="assets/cards/${t.icon}.svg" alt="" aria-hidden="true"><span class="topic-name"></span><span class="topic-n"></span>`;
    btn.querySelector('.topic-name').textContent = t.key;
    btn.querySelector('.topic-n').textContent = `${n}장`;
    btn.addEventListener('click', () => toggleTopic(t.key));
    box.appendChild(btn);
  }
  const total = poolIds().length;
  $('topics-count').textContent = `모두 ${total}장`;
  for (const m of document.querySelectorAll('.mode')) m.disabled = total === 0;
}

function toggleTopic(key) {
  if (state.topics.has(key)) state.topics.delete(key);
  else state.topics.add(key);
  save(STORE_TOPICS, JSON.stringify([...state.topics]));
  renderTopics();
}

function poolIds() {
  return state.cards.filter((c) => state.topics.has(c.topic)).map((c) => c.id);
}

/* —— 카드 화면 —— */

function start(mode) {
  state.mode = mode;
  state.count = 0;
  document.body.dataset.mode = mode;
  nextCard();
}

function nextCard() {
  const got = drawCard(state.deck, poolIds());
  if (!got) { show('HOME'); return; }
  state.deck = got.deck;
  state.item = state.cards.find((c) => c.id === got.id);
  state.revealed = state.mode === 'gesture';
  state.count += 1;
  renderCard(true);
  show('CARD');
  sound.card();
}

function reveal() {
  state.revealed = true;
  renderCard(false);
  sound.reveal();
}

function renderCard(fresh) {
  const c = state.item;
  const card = $('card');
  $('card-topic').textContent = c.topic;
  const art = $('card-art');
  art.src = `assets/cards/${c.id}.svg`;
  art.alt = state.revealed ? c.word : '무엇일까요?';
  $('card-word').textContent = c.word;
  $('card-word').hidden = !state.revealed;
  $('card-ask').hidden = state.revealed;
  $('card-hint').textContent = c.hint;
  $('card-hint').hidden = true;
  $('btn-hint').hidden = state.mode !== 'gesture';
  $('btn-hint').setAttribute('aria-pressed', 'false');
  $('btn-next').innerHTML = state.revealed
    ? '다음 카드 → <kbd>Space</kbd>'
    : '정답 보기 <kbd>Space</kbd>';
  $('card-count').textContent = `${state.count}번째 카드`;
  if (fresh) {
    card.classList.remove('is-pop');
    void card.offsetWidth;   // 애니메이션을 처음부터 다시 돌리려고 한 번 읽는다
    card.classList.add('is-pop');
  } else {
    $('card-word').classList.remove('is-pop');
    void card.offsetWidth;
    $('card-word').classList.add('is-pop');
  }
}

function advance() {
  if (!state.revealed) reveal();
  else nextCard();
}

function toggleHint() {
  const el = $('card-hint');
  el.hidden = !el.hidden;
  $('btn-hint').setAttribute('aria-pressed', el.hidden ? 'false' : 'true');
  if (!el.hidden) sound.hint();
}

/* —— 상단바 —— */

function bindMute() {
  const btn = $('btn-mute');
  const paint = () => {
    btn.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
    btn.setAttribute('aria-label', state.muted ? '소리 켜기' : '소리 끄기');
  };
  state.muted = load(STORE_MUTED) === '1';
  sound.setMuted(state.muted);
  paint();
  btn.addEventListener('click', () => {
    state.muted = !state.muted;
    sound.setMuted(state.muted);
    save(STORE_MUTED, state.muted ? '1' : '0');
    paint();
  });
}

/* 전체화면 — 전자칠판에서 주소창·탭 높이만큼 그림을 더 크게 쓴다.
   API 가 없는 브라우저에서는 버튼을 숨긴다. */
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
    } catch { /* 막힌 환경에서는 조용히 넘어간다 */ }
  });
  document.addEventListener('fullscreenchange', paint);
  document.addEventListener('webkitfullscreenchange', paint);
  paint();
}

/* —— 키보드 — 선생님 손에 리모컨·무선 마우스가 있을 때 ——
   Space·Enter·→ 다음, Esc 처음으로. 버튼에 초점이 있을 때 Space 는 브라우저가 이미
   그 버튼을 누르므로 두 번 넘어가지 않게 막는다. */
function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.body.dataset.screen !== 'CARD') return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      advance();
    } else if (e.key === 'Escape') {
      show('HOME');
    }
  });
}

async function boot() {
  const saved = load(STORE_TOPICS);
  if (saved) {
    try {
      const keys = JSON.parse(saved).filter((k) => TOPICS.some((t) => t.key === k));
      state.topics = new Set(keys);
    } catch { /* 망가진 값이면 전부 고른 상태로 */ }
  }

  bindMute();
  bindFullscreen();
  bindKeys();

  for (const m of document.querySelectorAll('.mode')) {
    m.addEventListener('click', () => start(m.dataset.mode));
  }
  $('btn-next').addEventListener('click', (e) => { e.currentTarget.blur(); advance(); });
  $('btn-hint').addEventListener('click', (e) => { e.currentTarget.blur(); toggleHint(); });
  $('btn-quit').addEventListener('click', () => show('HOME'));
  $('brand-home').addEventListener('click', (e) => { e.preventDefault(); show('HOME'); });

  const res = await fetch('data/cards.json');
  const data = await res.json();
  state.cards = data.items;
  renderTopics();
  show('HOME');
}

boot();
