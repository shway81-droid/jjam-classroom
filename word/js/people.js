/* 선생님용 실시간 정답 창 (people.html) — 문답형 말놀이 10종.

   주인공은 맨 위의 "지금 칠판 문제의 정답" 칸이다(아래 listenLive). 출제 화면은 정답을
   마지막에야 보여 주므로, 선생님이 "그 답이 맞나?"를 판정하려면 정답을 미리 알아야 한다.
   출제 창이 BroadcastChannel 로 지금 문제의 id 를 알려 오면 이 창이 words.json 에서 찾아
   문제·정답·같이 맞는 답·덧붙임을 띄운다. 인물퀴즈 전용으로 시작해(2026-09-30)
   문답형 모두로 넓혔다(2026-10-06) — 파일 이름이 people 인 것은 그 때문이다.

   그 아래 인물퀴즈 전체 명단은 보조. 분야별로 사진·이름·같이 맞는 이름·힌트를 한눈에
   보여 주고, 엑셀(CSV)로 내려받거나 인쇄(PDF 저장)할 수 있게 한다.
   인물퀴즈가 아닌 놀이에서 열면(주소의 ?type=) 접어 둔다.

   data/words.json 한 곳에서 읽는다 — 문항·인물을 더하면 여기도 저절로 따라온다.

   번호(No.)는 출제 화면과 같은 규칙(roster.js)으로 붙인다 — '정답지 순서대로' 출제하면
   화면의 No. 와 이 리스트의 No. 가 같은 사람이다. */

import { numberPeople, LIVE_CHANNEL } from './roster.js';

const LEVEL_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };

const $ = (id) => document.getElementById(id);

// byId — 정답 칸이 찾는 문답형 문항 전부(인물 포함). people — 아래 명단에 쓰는 인물만.
const state = { byId: new Map(), people: [], topics: [], topic: 'all', numbers: new Map(), liveId: null };

/** 힌트 'ㅇㅇㅇ · 설명' 에서 설명만 — 리스트에는 이름이 이미 있으니 초성은 군더더기다. */
function hintText(p) {
  const at = p.hint.indexOf(' · ');
  return at >= 0 ? p.hint.slice(at + 3) : p.hint;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function renderFilter() {
  const nav = $('people-filter');
  nav.textContent = '';
  for (const tp of ['all', ...state.topics]) {
    const n = tp === 'all' ? state.people.length : state.people.filter((p) => p.topic === tp).length;
    const b = el('button', 'option-btn', `${tp === 'all' ? '전체' : tp} ${n}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(state.topic === tp));
    b.addEventListener('click', () => {
      state.topic = tp;
      renderFilter();
      renderList();
    });
    nav.append(b);
  }
}

function renderList() {
  const main = $('people-list');
  main.textContent = '';
  const shown = state.topic === 'all' ? state.topics : [state.topic];
  for (const tp of shown) {
    const group = state.people.filter((p) => p.topic === tp);
    if (!group.length) continue;
    const sec = el('section', 'people-group');
    sec.append(el('h3', null, `${tp} (${group.length}명)`));
    const grid = el('ol', 'people-grid');
    for (const p of group) {
      const li = el('li', 'person-card');
      const img = el('img', 'person-photo');
      img.src = p.photo.file;
      img.alt = p.answer;
      img.loading = 'lazy';
      img.decoding = 'async';
      li.append(img);
      const body = el('div', 'person-body');
      li.dataset.id = p.id;
      if (p.id === state.liveId) li.classList.add('is-live');
      li.append(el('span', 'person-no', `No.${state.numbers.get(p.id)}`));
      const name = el('p', 'person-name', p.answer);
      name.append(el('span', `person-level lv-${p.level}`, LEVEL_LABEL[p.level] || p.level));
      body.append(name);
      const also = (p.also || []).filter(Boolean);
      if (also.length) body.append(el('p', 'person-also', `이것도 정답: ${also.join(' · ')}`));
      body.append(el('p', 'person-hint', hintText(p)));
      li.append(body);
      grid.append(li);
    }
    sec.append(grid);
    main.append(sec);
  }
}

/** 엑셀이 한글을 깨뜨리지 않도록 BOM 을 붙인 CSV. */
function downloadCsv() {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['번호', '분야', '이름', '이것도 정답', '난이도', '힌트', '사진 저작자', '사진 라이선스', '사진 출처']];
  state.people.forEach((p) => {
    rows.push([
      state.numbers.get(p.id), p.topic, p.answer, (p.also || []).join(' / '), LEVEL_LABEL[p.level] || p.level,
      hintText(p), p.photo.author, p.photo.license, p.photo.source,
    ]);
  });
  const csv = '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = el('a');
  a.href = url;
  // 영문 이름 — 한글 이름은 브라우저에 따라 'download'(확장자 없음)로 저장돼 엑셀이 못 연다.
  a.download = 'jjam-word-person-answers.csv';
  document.body.append(a);
  a.click();
  // 바로 지우면 몇몇 브라우저가 파일 이름(download 속성)을 잃고 'download' 로 저장한다.
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
}

/* 인쇄 — 사진은 화면에 보일 때만 불러오므로(loading=lazy) 그대로 인쇄하면 아래쪽 사진이 빈칸으로 나온다.
   인쇄 전에 전부 불러온다(오래 걸려도 5초에서 끊고 인쇄한다). */
async function printRoster() {
  $('roster').open = true;   // 접혀 있으면 인쇄물에도 명단이 안 나온다
  const imgs = [...document.querySelectorAll('.person-photo')];
  for (const img of imgs) img.loading = 'eager';
  const loaded = Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => null))));
  await Promise.race([loaded, new Promise((r) => setTimeout(r, 5000))]);
  window.print();
}

/* —— 선생님 창 ——————————————————————————————————————————————— */

const STAGE_LABEL = { PROMPT: '문제', HINT: '힌트 열림', ANSWER: '정답 공개됨' };

// 출제 창 이외의 화면(홈·끝말잇기·몸으로 말해요…)에 있을 때 — 도구형 놀이는 정해진 정답이 없다.
const IDLE_META = '칠판에서 문답형 말놀이를 시작하면 여기에 정답이 떠요. 끝말잇기·줄줄이 말해요·몸으로 말해요는 정해진 정답이 없어 뜨지 않아요.';

// 긴 정답(속담 뒷부분·긴 이름)은 글자를 줄여 노트북 창에서 두 줄 안에 담는다.
const ANSWER_LONG = 8;

function renderLive(msg) {
  const box = $('live');
  const it = msg && msg.kind === 'item' ? state.byId.get(msg.id) : null;
  state.liveId = it ? it.id : null;
  for (const card of document.querySelectorAll('.person-card.is-live')) card.classList.remove('is-live');
  box.hidden = false;
  const photo = $('live-photo');
  const prompt = $('live-prompt');
  const note = $('live-note');
  if (!it) {
    box.dataset.state = 'idle';
    $('live-answer').textContent = '문제를 기다리는 중';
    delete $('live-answer').dataset.len;
    $('live-meta').textContent = IDLE_META;
    $('live-also').textContent = '';
    prompt.hidden = true;
    note.hidden = true;
    photo.hidden = true;
    return;
  }
  box.dataset.state = 'item';
  // 인물은 사진이 곧 문제다. 나머지는 칠판에 뜬 문제 글자를 그대로 띄운다 — 어느 문제의 정답인지 맞춰 보게.
  photo.hidden = !it.photo;
  if (it.photo) photo.src = it.photo.file;
  else photo.removeAttribute('src');
  prompt.hidden = Boolean(it.photo);
  prompt.textContent = it.photo ? '' : it.prompt;
  $('live-answer').textContent = it.answer;
  $('live-answer').dataset.len = [...it.answer].length > ANSWER_LONG ? 'long' : 'short';
  const also = (it.also || []).filter(Boolean);
  $('live-also').textContent = also.length ? `이것도 정답: ${also.join(' · ')}` : '';
  note.hidden = !it.note;
  note.textContent = it.note || '';
  const no = state.numbers.get(it.id);
  const stage = STAGE_LABEL[msg.stage];
  $('live-meta').textContent = [
    msg.label, no ? `No.${no}` : null, it.topic, stage ? `칠판: ${stage}` : null,
  ].filter(Boolean).join(' · ');
  const card = document.querySelector(`.person-card[data-id="${it.id}"]`);
  if (card) card.classList.add('is-live');
}

function listenLive() {
  if (typeof BroadcastChannel !== 'function') {
    $('live-meta').textContent = '이 브라우저에서는 실시간 정답이 뜨지 않아요. 크롬이나 엣지에서 열어 주세요. 인물퀴즈는 아래 명단을 인쇄해 써도 돼요.';
    return;
  }
  renderLive(null);   // 연결 전에는 "문제를 기다리는 중" — 이 칸이 무엇인지 먼저 보여 준다
  const ch = new BroadcastChannel(LIVE_CHANNEL);
  ch.onmessage = (e) => renderLive(e.data);
  // 문제 도중에 이 창을 열었을 수 있다 — 지금 무엇이 나와 있는지 물어본다.
  ch.postMessage({ kind: 'hello' });
}

async function boot() {
  // 인물퀴즈가 아닌 놀이에서 열었으면 인물 명단은 접어 둔다 — 초성퀴즈를 하는데 인물 사진이 잔뜩
  // 펼쳐져 있으면 헷갈린다. 주소에 type 이 없으면(즐겨찾기로 바로 연 창) 예전처럼 펼친다.
  const from = new URLSearchParams(location.search).get('type');
  if (from && from !== 'person') $('roster').open = false;
  $('btn-print').addEventListener('click', printRoster);
  $('btn-csv').addEventListener('click', downloadCsv);
  try {
    const res = await fetch('data/words.json', { cache: 'no-cache' });
    const data = await res.json();
    // 정답이 있는 문항만 — 끝말잇기·몸으로 말해요·줄줄이 말해요 카드는 answer 가 없다.
    for (const it of data.items) if (it.answer) state.byId.set(it.id, it);
    state.people = data.items.filter((it) => it.type === 'person' && it.photo);
    state.numbers = numberPeople(data.items);
  } catch {
    $('people-sub').textContent = '명단을 불러오지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.';
    $('live-meta').textContent = '문제를 불러오지 못해 정답을 띄울 수 없어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.';
    return;
  }
  // 분야 순서는 데이터에 처음 나온 순서 그대로 (가수 → 배우 → …)
  state.topics = [...new Set(state.people.map((p) => p.topic))];
  $('people-sub').textContent = `모두 ${state.people.length}명 · 분야 ${state.topics.length}개 — 번호(No.)는 칠판 위쪽 띠의 번호와 같아요.`;
  $('btn-csv').disabled = false;
  renderFilter();
  renderList();
  listenLive();
}

boot();
