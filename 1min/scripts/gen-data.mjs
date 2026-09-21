/* ===================================================================
   data/lessons.json → 런처가 받는 파생 데이터 생성
   ===================================================================
   사람이 고치는 단일 소스는 data/lessons.json 하나다.
   이 스크립트가 거기서 런처용 파일 하나를 만든다.

     data/lessons.index.json   런처가 받는 것. 들여쓰기 없이 한 줄

   왜 나누나
     lessons.json 은 사람이 읽기 좋게 들여쓴 파일이라 절반이 공백이다.
     차시가 늘어나면(한 학기 43차시 × 과목 × 학년) 그 공백이 그대로 전송량이 된다.
     짬짬이 영상에서 이미 겪은 일이라 처음부터 나눠 둔다.

   짬짬이 영상과 달리 detail 파일은 두지 않는다. 이 사이트는 카드에서
   summary·keywords 를 바로 쓰기 때문에 목록과 상세가 같은 필드를 본다.

   실행
     node scripts/gen-data.mjs           파생 파일 생성
     node scripts/gen-data.mjs --check   생성물이 최신인지 확인 (CI 게이트)
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const SOURCE = path.join(ROOT, 'data', 'lessons.json');
const INDEX = path.join(ROOT, 'data', 'lessons.index.json');

const lessons = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// 교과서 진도 순서로 정렬해 둔다 — 런처가 다시 정렬하지 않아도 되게.
const sorted = [...lessons].sort(
  (a, b) =>
    a.subject.localeCompare(b.subject, 'ko') ||
    a.grade - b.grade ||
    a.semester - b.semester ||
    a.unit - b.unit ||
    a.lesson - b.lesson
);

const json = JSON.stringify(sorted);

const before = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf-8') : null;

if (before === json) {
  console.log('  = data/lessons.index.json 최신 상태');
} else if (CHECK) {
  console.error('  ✗ data/lessons.index.json 가 lessons.json 과 불일치 — `node scripts/gen-data.mjs` 실행 필요');
  process.exit(1);
} else {
  fs.writeFileSync(INDEX, json);
  console.log(`  ↻ data/lessons.index.json 생성 (${(json.length / 1024).toFixed(1)} KB)`);
}

const srcKB = (fs.statSync(SOURCE).size / 1024).toFixed(1);
console.log(
  `\n✅ 파생 데이터 ${CHECK ? '동기화 확인' : '생성 완료'} — ` +
    `원본 ${srcKB} KB → 런처 ${(json.length / 1024).toFixed(1)} KB · 차시 ${sorted.length}편`
);
