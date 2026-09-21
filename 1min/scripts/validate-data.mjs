/* ===================================================================
   data/lessons.json 검증
   ===================================================================
   짬짬이 영상의 validate-data.mjs 를 이 사이트에 맞게 줄인 것이다.

   무엇이 빠졌나 — **승인 채널 목록이 없다.**
     짬짬이 영상은 남의 영상을 큐레이션하므로 "이 채널을 학생에게 보여도 되는가"가
     핵심이었다. 이 사이트의 영상은 전부 내가 교과서로 만들어 내 채널에 올린 것이라
     그 관문이 필요 없다. 대신 "정말 내 채널 영상인가"는 check-sources.mjs 가 본다.

   무엇을 보나
     1. 필수 필드가 있는지, 타입이 맞는지
     2. id 와 youtubeId 가 중복되지 않는지
     3. 같은 (과목·학년·학기·단원·차시)가 두 번 있지 않은지
     4. youtubeId 가 유튜브 11자리 형식인지
     5. **런처가 실제로 그릴 수 있는 데이터인지** — 단원 제목이 같은 단원 안에서
        엇갈리면 화면에 단원이 두 번 나온다. 그것을 여기서 잡는다.

   실행: node scripts/validate-data.mjs
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'data', 'lessons.json');

const errors = [];
const warns = [];

let lessons;
try {
  lessons = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));
} catch (e) {
  console.error(`✗ data/lessons.json 을 읽을 수 없습니다: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(lessons)) {
  console.error('✗ data/lessons.json 의 최상위는 배열이어야 합니다.');
  process.exit(1);
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

const REQUIRED = {
  id: 'string',
  subject: 'string',
  grade: 'number',
  semester: 'number',
  unit: 'number',
  unitTitle: 'string',
  lesson: 'number',
  lessonTitle: 'string',
  topic: 'string',
  youtubeId: 'string',
  seconds: 'number',
  summary: 'string',
};

const seenId = new Map();
const seenYt = new Map();
const seenSlot = new Map();
const unitTitles = new Map();

lessons.forEach((L, i) => {
  const at = `lessons[${i}]${L && L.id ? ` (${L.id})` : ''}`;

  for (const [k, t] of Object.entries(REQUIRED)) {
    if (L[k] === undefined || L[k] === null || L[k] === '') {
      errors.push(`${at}: 필수 항목 '${k}' 가 없습니다.`);
    } else if (typeof L[k] !== t) {
      errors.push(`${at}: '${k}' 는 ${t} 여야 합니다 (지금 ${typeof L[k]}).`);
    }
  }

  if (!Array.isArray(L.keywords) || L.keywords.length === 0) {
    errors.push(`${at}: 'keywords' 는 한 개 이상 든 배열이어야 합니다 — 검색이 이 값을 씁니다.`);
  }

  if (typeof L.youtubeId === 'string' && !YT_ID.test(L.youtubeId)) {
    errors.push(`${at}: youtubeId '${L.youtubeId}' 가 유튜브 11자리 형식이 아닙니다.`);
  }

  if (typeof L.seconds === 'number' && (L.seconds < 20 || L.seconds > 200)) {
    warns.push(`${at}: 길이 ${L.seconds}초 — 1분 숏폼이라기엔 벗어납니다. 확인해 주세요.`);
  }

  if (L.id) {
    if (seenId.has(L.id)) errors.push(`${at}: id 가 lessons[${seenId.get(L.id)}] 와 중복입니다.`);
    else seenId.set(L.id, i);
  }
  if (L.youtubeId) {
    if (seenYt.has(L.youtubeId))
      errors.push(`${at}: youtubeId 가 lessons[${seenYt.get(L.youtubeId)}] 와 중복입니다 — 같은 영상을 두 번 등록했습니다.`);
    else seenYt.set(L.youtubeId, i);
  }

  const slot = `${L.subject}/${L.grade}-${L.semester}/${L.unit}/${L.lesson}`;
  if (seenSlot.has(slot))
    errors.push(`${at}: ${slot} 차시가 lessons[${seenSlot.get(slot)}] 에 이미 있습니다.`);
  else seenSlot.set(slot, i);

  // 같은 단원인데 단원 제목이 다르면 화면에 단원이 두 번 나온다.
  const uk = `${L.subject}/${L.grade}-${L.semester}/${L.unit}`;
  if (unitTitles.has(uk) && unitTitles.get(uk) !== L.unitTitle) {
    errors.push(
      `${at}: 같은 단원(${uk})의 unitTitle 이 엇갈립니다 — ` +
        `'${unitTitles.get(uk)}' vs '${L.unitTitle}'. 런처가 단원을 두 번 그립니다.`
    );
  } else {
    unitTitles.set(uk, L.unitTitle);
  }
});

for (const w of warns) console.log(`⚠ ${w}`);

if (errors.length) {
  console.error(`\n❌ 검증 실패 — ${errors.length}건`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

const units = [...unitTitles.keys()].length;
console.log(`\n✅ 검증 통과 — 차시 ${lessons.length}편 · 단원 ${units}개${warns.length ? ` (경고 ${warns.length}건)` : ''}`);
