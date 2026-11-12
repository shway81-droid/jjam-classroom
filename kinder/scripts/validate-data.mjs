/* ===================================================================
   짬짬이 유치원 — 카드 데이터·그림 검증 (CI 게이트)
   ===================================================================
   유치원 아이들은 글자를 못 읽는다. 그림이 빠지거나 깨진 카드는 그냥 "글자 카드"가 되어
   이 사이트가 있는 이유가 사라진다. 그래서 그림을 데이터와 같은 무게로 검사한다.

   보는 것
     1) cards.json — id·낱말·주제·몸짓 힌트의 모양, 중복
     2) 낱말 수준 — 한글만, 1~5글자 (유치원 대상이라는 것을 잊지 않게)
     3) 주제 — js/app.js 의 TOPICS 와 같은지, 주제마다 카드가 있는지
     4) 그림 — 카드마다 assets/cards/<id>.svg 가 있는지, 안 쓰는 그림이 없는지,
        그림 규칙(240×240, 글자·스크립트·외부 주소 없음)
     5) sw.js — 그림과 js 모듈이 오프라인 캐시 목록에 다 들어 있는지

   실행: node scripts/validate-data.mjs
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

const errors = [];
const fail = (msg) => errors.push(msg);

// —— 주제: js/app.js 의 TOPICS 를 정규식으로 읽는다 (모양을 바꾸면 여기도 고친다) ——
const appSrc = read('js/app.js');
const topicsBlock = appSrc.match(/export const TOPICS = \[([\s\S]*?)\];/);
if (!topicsBlock) {
  console.error('✖ js/app.js 에서 TOPICS 를 못 찾았다 — 상수 모양을 바꿨다면 이 검사도 고쳐야 한다');
  process.exit(1);
}
const TOPICS = [...topicsBlock[1].matchAll(/\{ key: '([^']+)', icon: '([^']+)' \}/g)].map((m) => ({ key: m[1], icon: m[2] }));
if (!TOPICS.length) fail('TOPICS 가 비었다');

// —— 카드 ——
const data = JSON.parse(read('data/cards.json'));
const items = Array.isArray(data.items) ? data.items : [];
if (!items.length) fail('cards.json 에 카드가 없다');

const HANGUL_WORD = /^[가-힣]{1,5}$/;
const seenId = new Set();
const seenWord = new Set();
for (const [i, c] of items.entries()) {
  const at = `카드 #${i + 1}(${c.id ?? '?'})`;
  if (typeof c.id !== 'string' || !/^[a-z]+$/.test(c.id)) fail(`${at}: id 는 영문 소문자만 — 그림 파일 이름이 된다`);
  if (seenId.has(c.id)) fail(`${at}: id 가 겹친다`);
  seenId.add(c.id);

  if (typeof c.word !== 'string' || !HANGUL_WORD.test(c.word)) {
    fail(`${at}: 낱말은 한글 1~5글자 — 유치원 아이들이 듣고 바로 아는 말로 ("${c.word}")`);
  }
  if (seenWord.has(c.word)) fail(`${at}: 낱말 "${c.word}" 이(가) 겹친다`);
  seenWord.add(c.word);

  if (!TOPICS.some((t) => t.key === c.topic)) fail(`${at}: 주제 "${c.topic}" 가 js/app.js TOPICS 에 없다`);

  if (typeof c.hint !== 'string' || c.hint.trim().length < 4) fail(`${at}: 몸짓 힌트가 없다`);
  else if (c.hint.length > 40) fail(`${at}: 몸짓 힌트가 너무 길다(${c.hint.length}자) — 선생님이 한 번에 읽어 줄 수 있게 40자 안으로`);
  else if (c.word && c.hint.includes(c.word)) fail(`${at}: 몸짓 힌트에 정답 "${c.word}" 이(가) 들어 있다 — 힌트를 읽어 주면 답이 새어 나간다`);

  const allowed = new Set(['id', 'word', 'topic', 'hint']);
  for (const k of Object.keys(c)) if (!allowed.has(k)) fail(`${at}: 모르는 칸 "${k}"`);
}

for (const t of TOPICS) {
  const n = items.filter((c) => c.topic === t.key).length;
  if (n < 4) fail(`주제 "${t.key}" 의 카드가 ${n}장뿐 — 4장 이상이어야 놀이가 된다`);
  if (!seenId.has(t.icon)) fail(`주제 "${t.key}" 의 아이콘 "${t.icon}" 이(가) 카드에 없다`);
}

// —— 그림 ——
const CARD_DIR = 'assets/cards';
const files = fs.readdirSync(path.join(ROOT, CARD_DIR)).filter((f) => !f.startsWith('.'));
const svgIds = new Set(files.filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)));
for (const f of files) if (!f.endsWith('.svg')) fail(`${CARD_DIR}/${f}: 카드 그림은 SVG 만 둔다`);
for (const id of seenId) if (!svgIds.has(id)) fail(`카드 "${id}" 의 그림 ${CARD_DIR}/${id}.svg 가 없다`);
for (const id of svgIds) if (!seenId.has(id)) fail(`${CARD_DIR}/${id}.svg: 어느 카드도 안 쓰는 그림이다`);

for (const id of svgIds) {
  const rel = `${CARD_DIR}/${id}.svg`;
  const svg = read(rel);
  if (!svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">')) {
    fail(`${rel}: 240×240 viewBox 로 시작해야 한다 — 그림마다 크기가 달라지면 카드가 들쭉날쭉해진다`);
  }
  // 그림 안의 글자는 웹폰트를 못 쓴다(<img> 로 넣은 SVG 는 페이지 폰트를 모른다). 낱말은 화면 글자로만.
  if (/<text[\s>]/.test(svg)) fail(`${rel}: 그림 안에 글자(<text>)를 넣지 않는다`);
  if (/<script[\s>]/i.test(svg) || /\son[a-z]+=/i.test(svg)) fail(`${rel}: 스크립트를 넣지 않는다`);
  // 외부 그림·폰트를 끌어오면 오프라인에서 빈칸이 된다. xmlns 주소만 허용.
  const external = svg.replace('xmlns="http://www.w3.org/2000/svg"', '').match(/https?:\/\//);
  if (external) fail(`${rel}: 외부 주소를 쓰지 않는다`);
  if (!/stroke="#3B2F2F"/.test(svg)) fail(`${rel}: 테두리 색(#3B2F2F)이 다르다 — 같은 그림체를 지키자`);
}

// —— 오프라인 캐시 목록 ——
const swSrc = read('sw.js');
const assetsBlock = swSrc.match(/var ASSETS = \[([\s\S]*?)\];/);
if (!assetsBlock) {
  fail('sw.js 에서 ASSETS 를 못 찾았다');
} else {
  const assets = [...assetsBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const a of assets) {
    if (a === './') continue;
    if (!fs.existsSync(path.join(ROOT, a))) fail(`sw.js ASSETS 의 ${a} 가 없는 파일이다 — 설치가 통째로 실패한다`);
  }
  for (const id of seenId) {
    if (!assets.includes(`./${CARD_DIR}/${id}.svg`)) fail(`sw.js ASSETS 에 ./${CARD_DIR}/${id}.svg 가 빠졌다 — 오프라인에서 그림이 빈다`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'js'))) {
    if (f.endsWith('.js') && !assets.includes(`./js/${f}`)) fail(`sw.js ASSETS 에 ./js/${f} 가 빠졌다 — 오프라인 첫 실행에서 앱이 안 뜬다`);
  }
}

if (errors.length) {
  console.error(`\n✖ 검증 실패 ${errors.length}건`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
const byTopic = TOPICS.map((t) => `${t.key} ${items.filter((c) => c.topic === t.key).length}`).join(' · ');
console.log(`✅ 카드 ${items.length}장 · 그림 ${svgIds.size}장 확인 (${byTopic})`);
