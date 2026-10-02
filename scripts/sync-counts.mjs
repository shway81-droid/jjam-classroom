/* ===================================================================
   모아보기 카드의 개수를 데이터에서 뽑는다 — 손으로 적지 않는다
   ===================================================================
   `home/index.html` 의 카드마다 "미니게임 105", "차시 영상 192" 같은 개수가
   붙는다. 이걸 손으로 적어 두면 낡는다. 실제로 낡았다 —

     · 1분사회 "187" : 모아보기를 만든 10/02 00:17 에는 맞았는데, 같은 날
       아침에 192 가 되면서 열 시간 만에 틀린 수가 됐다.
     · 낱말 "1,564" : 이력을 훑어보면 1465 → 1779 → 1837 → 1944 로 갔고,
       1,564 는 **어느 시점에도 맞은 적이 없다.** 처음부터 틀린 수였다.

   gen-og.mjs 가 같은 이유로 그림에 숫자를 넣지 않는다. 그 머리말의 결론을
   여기서도 쓴다 — 개수는 **데이터가 말하게 하고, 안 따라오면 `--check` 가 잡는다.**

     node scripts/sync-counts.mjs            home/index.html 의 개수를 데이터에 맞춘다
     node scripts/sync-counts.mjs --check    어긋났는지만 본다 (고치지 않는다)
     node scripts/sync-counts.mjs --target <파일>   그 파일을 대신 고친다

   `--target` 은 발행 워크플로(home.yml)가 쓴다. 발행 직전에 site/index.html 로
   한 번 더 밀어 넣어서, 저장소의 index.html 이 낡아 있어도 **올라가는 화면은
   언제나 맞게** 한다. 그래서 1분사회에 차시를 더하는 날마다 CI 가 사람을
   부르지 않는다 — home.yml 이 데이터 폴더까지 보고 있다가 알아서 다시 발행한다.

   ── 키를 추측하지 않는 이유 ─────────────────────────────────────────
   일곱 데이터가 최상위 구조가 전부 다르다. 배열인 것(video·1min), `items`
   인 것(word), `stories`·`drawings` 인 것, 폴더를 세는 것(game·quiz).
   "아무 키나 있으면 그걸 쓴다" 식으로 짜면 키를 잘못 짚었을 때 **0 을 돌려주고
   조용히 지나간다.** 그래서 사이트마다 키를 명시하고, 모양이 다르면 멈춘다.
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const tIdx = process.argv.indexOf('--target');
const TARGET = tIdx !== -1 && process.argv[tIdx + 1]
  ? path.resolve(process.argv[tIdx + 1])
  : path.join(ROOT, 'home', 'index.html');

/* 배열을 꺼낸다. key 가 null 이면 파일 자체가 배열이어야 한다.
   모양이 다르면 0 을 돌려주지 말고 멈춘다 — 조용한 0 이 가장 위험하다. */
function rows(rel, key) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) throw new Error(`${rel} 이 없습니다.`);
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const v = key === null ? d : d[key];
  if (!Array.isArray(v)) {
    const got = key === null ? `최상위가 ${typeof d}` : `'${key}' 가 ${typeof d[key]}`;
    throw new Error(`${rel}: 배열을 찾지 못했습니다 (${got}). 데이터 구조가 바뀌었으면 이 파일의 SITES 도 고쳐야 합니다.`);
  }
  return v.length;
}

/* 폴더 하나가 게임 하나다. game.json 이 있는 것만 센다. */
function folders(rel) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) throw new Error(`${rel} 이 없습니다.`);
  const n = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'game.json')))
    .length;
  if (n === 0) throw new Error(`${rel}: game.json 을 가진 폴더가 하나도 없습니다.`);
  return n;
}

// data-count 값 → 붙일 말과 세는 법. index.html 의 span 과 짝이 맞아야 한다.
const SITES = [
  { key: 'game',  label: '미니게임',  count: () => folders('game/games') },
  { key: 'quiz',  label: '문답 게임', count: () => folders('quiz/games') },
  { key: 'word',  label: '문항',      count: () => rows('word/data/words.json', 'items') },
  { key: 'story', label: '이야기',    count: () => rows('story/data/stories.json', 'stories') },
  { key: 'video', label: '영상',      count: () => rows('video/data/videos.json', null) },
  { key: '1min',  label: '차시 영상', count: () => rows('1min/data/lessons.json', null) },
  { key: 'draw',  label: '그림',      count: () => rows('draw/data/drawings.json', 'drawings') },
];

const fmt = (n) => n.toLocaleString('ko-KR'); // 1944 → 1,944

if (!fs.existsSync(TARGET)) {
  console.error(`✗ 대상 파일이 없습니다: ${TARGET}`);
  process.exit(1);
}

let html = fs.readFileSync(TARGET, 'utf8');
const changed = [];
let missing = 0;

for (const site of SITES) {
  const want = `${site.label} ${fmt(site.count())}`;
  // <span class="amt" data-count="게임">…</span> 의 속만 바꾼다.
  const re = new RegExp(`(<span class="amt" data-count="${site.key}">)([^<]*)(</span>)`);
  const m = html.match(re);
  if (!m) {
    console.error(`✗ data-count="${site.key}" 인 .amt span 을 찾지 못했습니다.`);
    missing++;
    continue;
  }
  if (m[2] !== want) changed.push({ key: site.key, from: m[2], to: want });
  html = html.replace(re, `$1${want}$3`);
}

if (missing) {
  console.error(`\n✗ ${missing}개를 찾지 못했습니다. ${path.relative(ROOT, TARGET)} 의 span 과 이 파일의 SITES 가 어긋났습니다.`);
  process.exit(1);
}

if (CHECK) {
  if (changed.length) {
    console.log(`✗ 개수가 데이터와 어긋납니다 (${changed.length}곳):`);
    for (const c of changed) console.log(`    ${c.key}: "${c.from}" → "${c.to}"`);
    console.log('  → node scripts/sync-counts.mjs 로 맞춥니다.');
    process.exit(1);
  }
  console.log(`✅ 개수가 데이터와 같습니다 (${SITES.length}곳)`);
  process.exit(0);
}

fs.writeFileSync(TARGET, html);
const where = path.relative(ROOT, TARGET) || TARGET;
if (changed.length) {
  console.log(`✅ ${where} 의 개수 ${changed.length}곳을 맞췄습니다:`);
  for (const c of changed) console.log(`    ${c.key}: "${c.from}" → "${c.to}"`);
} else {
  console.log(`✅ ${where} — 이미 데이터와 같습니다 (${SITES.length}곳)`);
}
