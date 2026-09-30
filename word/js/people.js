/* 인물퀴즈 정답 리스트 (people.html) — 선생님용.

   출제 화면은 정답을 마지막에야 보여 주므로, 선생님이 "그 이름이 맞나?"를 판정하려면
   누가 나오는지 미리 알아야 한다. 분야별로 사진·이름·같이 맞는 이름·힌트를 한눈에
   보여 주고, 엑셀(CSV)로 내려받거나 인쇄(PDF 저장)할 수 있게 한다.

   data/words.json 한 곳에서 읽는다 — 인물을 더하면 여기도 저절로 따라온다.

   번호(No.)는 출제 화면과 같은 규칙(roster.js)으로 붙인다 — '정답지 순서대로' 출제하면
   화면의 No. 와 이 리스트의 No. 가 같은 사람이다.
   선생님 창: 출제 창이 BroadcastChannel 로 지금 문제를 알려 오면 맨 위에 그 정답을 띄운다. */

import { numberPeople, LIVE_CHANNEL } from './roster.js';

const LEVEL_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움' };

const $ = (id) => document.getElementById(id);

const state = { people: [], topics: [], topic: 'all', numbers: new Map(), liveId: null };

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
    sec.append(el('h2', null, `${tp} (${group.length}명)`));
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

/* —— 선생님 창 ——————————————————————————————————————————————— */

function renderLive(msg) {
  const box = $('live');
  const p = msg && msg.kind === 'item' ? state.people.find((x) => x.id === msg.id) : null;
  state.liveId = p ? p.id : null;
  for (const card of document.querySelectorAll('.person-card.is-live')) card.classList.remove('is-live');
  box.hidden = false;
  if (!p) {
    box.dataset.state = 'idle';
    $('live-name').textContent = '문제를 기다리는 중';
    $('live-meta').textContent = '칠판에서 인물퀴즈를 시작하면 여기에 지금 문제의 정답이 떠요.';
    $('live-also').textContent = '';
    $('live-photo').hidden = true;
    return;
  }
  box.dataset.state = 'item';
  $('live-photo').hidden = false;
  $('live-photo').src = p.photo.file;
  $('live-name').textContent = p.answer;
  const stage = { PROMPT: '문제', HINT: '힌트 열림', ANSWER: '정답 공개됨' }[msg.stage] || '';
  $('live-meta').textContent = `No.${state.numbers.get(p.id)} · ${p.topic}${stage ? ` · 칠판: ${stage}` : ''}`;
  const also = (p.also || []).filter(Boolean);
  $('live-also').textContent = also.length ? `이것도 정답: ${also.join(' · ')}` : '';
  const card = document.querySelector(`.person-card[data-id="${p.id}"]`);
  if (card) card.classList.add('is-live');
}

function listenLive() {
  if (typeof BroadcastChannel !== 'function') return;
  renderLive(null);   // 연결 전에는 "문제를 기다리는 중" — 이 칸이 무엇인지 먼저 보여 준다
  const ch = new BroadcastChannel(LIVE_CHANNEL);
  ch.onmessage = (e) => renderLive(e.data);
  // 문제 도중에 이 창을 열었을 수 있다 — 지금 무엇이 나와 있는지 물어본다.
  ch.postMessage({ kind: 'hello' });
}

async function boot() {
  $('btn-print').addEventListener('click', () => window.print());
  $('btn-csv').addEventListener('click', downloadCsv);
  try {
    const res = await fetch('data/words.json', { cache: 'no-cache' });
    const data = await res.json();
    state.people = data.items.filter((it) => it.type === 'person' && it.photo);
    state.numbers = numberPeople(data.items);
  } catch {
    $('people-sub').textContent = '정답 리스트를 불러오지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.';
    return;
  }
  // 분야 순서는 데이터에 처음 나온 순서 그대로 (가수 → 배우 → …)
  state.topics = [...new Set(state.people.map((p) => p.topic))];
  $('people-sub').textContent = `모두 ${state.people.length}명 · 분야 ${state.topics.length}개 — 문제를 내기 전에 미리 보시면 정답 판정이 쉬워요.`;
  $('btn-csv').disabled = false;
  renderFilter();
  renderList();
  listenLive();
}

boot();
