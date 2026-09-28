/* ===================================================================
   data/words.json 정적 검증 — CI 게이트 (.github/workflows/ci.yml)
   ===================================================================
   빌드 단계가 없는 정적 사이트라, 잘못된 데이터는 배포된 뒤 교실 화면에서야
   드러난다. 여기서 "화면(js/app.js)이 실제로 소화할 수 있는 데이터인가"와
   "PRD 3절 안전 기준을 지켰는가"를 미리 확인한다.

   검증 기준(유형·난이도·주제)은 js/app.js 의 상수에서 직접 읽어 온다.
   → 화면 상수와 데이터가 따로 노는 상황을 잡는다(하드코딩 X).
   상수를 못 찾으면 조용히 넘어가지 않고 실패한다 — 리팩터링으로 검증이
   무력화되는 것을 막기 위해서다.

   실행: node scripts/validate-data.mjs
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// 금칙어 표는 banned.mjs 에 있다 — 오탐/탐지를 banned.test.mjs 로 고정해 두었다.
import { violations, CHOSEONG_BANNED } from './banned.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ── app.js 에서 검증 기준 상수 추출 ──────────────────────────────
const APP = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf-8');

function extract(label, re, parse) {
  const m = APP.match(re);
  if (!m) {
    err(`js/app.js에서 ${label}를 찾지 못했습니다 — 상수 이름이 바뀌었다면 이 스크립트도 함께 고쳐야 합니다.`);
    return null;
  }
  return parse(m);
}

const TYPES_BLOCK = /const TYPES = \{([\s\S]*?)\n\};/;

const TYPE_KEYS = extract('TYPES', TYPES_BLOCK, (m) =>
  [...m[1].matchAll(/^\s*(\w+):\s*\{/gm)].map((x) => x[1]));

// 유형별 kind(quiz/tool)·topics(주제를 쓰는가)를 TYPES 블록 안에서만 읽는다.
// 파일 전체를 정규식으로 훑으면 주석이나 다른 코드에 걸려 엉뚱한 값을 읽을 수 있다.
const TYPE_META = extract('TYPES(kind·topics)', TYPES_BLOCK, (m) => {
  const out = {};
  for (const blk of m[1].split(/\n(?=\s*\w+:\s*\{)/)) {
    const k = blk.match(/^\s*(\w+):\s*\{/);
    if (!k) continue;
    const kind = blk.match(/kind:\s*'(\w+)'/);
    const topics = blk.match(/topics:\s*(true|false)/);
    if (!kind) { err(`TYPES.${k[1]} 에 kind 가 없습니다.`); continue; }
    if (!topics) { err(`TYPES.${k[1]} 에 topics 가 없습니다.`); continue; }
    out[k[1]] = { kind: kind[1], topics: topics[1] === 'true' };
  }
  return out;
});

const LEVELS = extract('LEVELS', /const LEVELS = \[([^\]]*)\];/, (m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

const TOPICS = extract('TOPICS', /const TOPICS = \[([^\]]*)\];/, (m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

// 인물퀴즈는 낱말 주제 대신 자기 분야(가수·배우…)를 쓴다.
const PERSON_TOPICS = extract('PERSON_TOPICS', /const PERSON_TOPICS = \[([^\]]*)\];/, (m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
const topicsOf = (type) => (type === 'person' ? PERSON_TOPICS : TOPICS);

if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

// ── 목표 분포 (PRD 11절) ────────────────────────────────────────
// 합계 800. 난이도가 한쪽으로 쏠리면 "쉬움만 골랐더니 20문항뿐"이 되어
// 자투리 5분에 10~15개(PRD 1.3)를 소화할 수 없다.
//
// 2026-08-07 문항을 2배로 늘리면서 목표도 2배로 올렸다. 목표는 상한이기도 해서
// (±15% 를 넘으면 실패한다) 데이터만 늘리면 검증이 막는다 — 함께 고쳐야 한다.
const TARGET = {
  choseong: { easy: 90, normal: 90, hard: 60 },   // 240
  proverb:  { easy: 70, normal: 80, hard: 50 },   // 200
  idiom:    { easy: 50, normal: 70, hard: 60 },   // 180
  riddle:   { easy: 70, normal: 70, hard: 40 },   // 180
  // 문제 내기 뒤쪽 넷 (2026-09-28). 글자 뒤섞기는 초성퀴즈의 세 글자 이상 낱말에서 나왔다.
  opposite: { easy: 25, normal: 20, hard: 15 },   // 60
  mimetic:  { easy: 25, normal: 21, hard: 16 },   // 62
  spelling: { easy: 22, normal: 24, hard: 22 },   // 68
  scramble: { easy: 32, normal: 65, hard: 27 },   // 124
  // 지구오락실 말놀이 (2026-09-28)
  fourword: { easy: 60, normal: 60, hard: 30 },   // 150
  // 인물 수는 자유 라이선스 사진이 있는 사람으로 정해진다 — 사진을 못 구하면 넣지 않는다.
  person:   { easy: 47, normal: 45, hard: 43 },   // 135
};
const TOOL_TARGET = { chain: 120, gesture: 200, relay: 60 };
const TOLERANCE = 0.15;   // 목표 대비 ±15%까지는 통과

const QUIZ_REQUIRED = ['id', 'type', 'level', 'topic', 'prompt', 'hint', 'answer', 'also', 'note'];
const TOOL_REQUIRED = ['id', 'type', 'level', 'word'];
const PROMPT_MAX = 34;   // 전자칠판 한 화면에 읽히는 길이 (경고)
const ANSWER_MAX = 20;

// 인물 사진에 허용하는 라이선스. 모두 교실 화면·공개 사이트에 출처만 밝히면 쓸 수 있다.
// 이 밖의 것(비상업 전용 NC, 변경 금지 ND, 각국 정부 라이선스 등)은 받지 않는다.
const PHOTO_LICENSE = /^(CC0|Public domain|CC BY(-SA)? [1-4]\.0( [a-z]{2})?|KOGL Type 1)$/;
const PHOTO_SOURCE = 'https://commons.wikimedia.org/wiki/File:';

// 초성 'ㄹ' 로 시작하는 한글 음절 구간. 두음법칙 때문에 우리말에는 ㄹ 로
// 시작하는 낱말이 거의 없어, 끝말잇기 시작 단어가 이렇게 끝나면 이어 갈 말이 없다.
const R_HEAD_START = 0xb77c;   // '라'
const R_HEAD_END = 0xb9c7;     // '릿' 다음까지 — 초성 ㄹ 구간의 끝

// 한글 음절의 초성 19개 (유니코드 순서 그대로 — 이 순서로 나눠떨어진다).
const LEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
              'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const SYLLABLE_START = 0xac00;
const SYLLABLE_COUNT = 11172;

/** '토끼' → 'ㅌㄲ'. 한글 음절이 아닌 글자(공백·기호)는 건너뛴다. */
function choseongOf(word) {
  return [...word]
    .map((ch) => {
      const at = ch.charCodeAt(0) - SYLLABLE_START;
      return at >= 0 && at < SYLLABLE_COUNT ? LEAD[Math.floor(at / 588)] : null;
    })
    .filter(Boolean)
    .join('');
}

const data = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf-8'));
  } catch (e) {
    console.error(`  ✗ data/words.json 파싱 실패 — ${e.message}`);
    process.exit(1);
  }
})();

if (data.version === undefined) err('최상위 version 필드가 없습니다.');
if (!Array.isArray(data.items) || data.items.length === 0) {
  console.error('  ✗ items 는 비어 있지 않은 배열이어야 합니다.');
  process.exit(1);
}

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';
const seenId = new Map();
const seenAnswer = new Map();   // `${type}\u0000${answer}` → index
const seenWord = new Map();     // 도구형 단어 중복

const usedPhotos = new Set();
function checkPhoto(where, photo) {
  if (typeof photo !== 'object' || photo === null) {
    err(`${where}: 인물퀴즈에는 photo 가 있어야 합니다 — 사진을 못 구한 인물은 넣지 않습니다.`);
    return;
  }
  for (const k of ['file', 'author', 'license', 'source']) {
    if (!nonEmpty(photo[k])) err(`${where}: photo.${k} 가 비어 있습니다.`);
  }
  for (const k of Object.keys(photo)) {
    if (!['file', 'author', 'license', 'source'].includes(k)) err(`${where}: photo 에 알 수 없는 필드 '${k}'`);
  }
  if (nonEmpty(photo.license) && !PHOTO_LICENSE.test(photo.license)) {
    err(`${where}: 허용하지 않는 사진 라이선스 '${photo.license}' — CC0·퍼블릭 도메인·CC BY·CC BY-SA·공공누리 1유형만 됩니다.`);
  }
  if (nonEmpty(photo.source) && !photo.source.startsWith(PHOTO_SOURCE)) {
    err(`${where}: 사진 출처는 위키미디어 공용 파일 주소여야 합니다 — '${photo.source}'`);
  }
  if (nonEmpty(photo.file)) {
    if (!/^assets\/people\/[\w-]+\.webp$/.test(photo.file)) {
      err(`${where}: 사진 파일은 assets/people/<이름>.webp 여야 합니다 — '${photo.file}'`);
    } else if (!fs.existsSync(path.join(ROOT, photo.file))) {
      err(`${where}: 사진 파일이 없습니다 — ${photo.file}`);
    } else if (usedPhotos.has(photo.file)) {
      err(`${where}: 사진 ${photo.file} 을 다른 인물이 이미 씁니다.`);
    }
    usedPhotos.add(photo.file);
  }
}

function checkSafety(where, text) {
  for (const why of violations(text)) {
    err(`${where}: 안전 기준 위반 — ${why}\n      "${text}"`);
  }
}

data.items.forEach((it, i) => {
  const where = `items[${i}] (${it && it.id ? it.id : 'id 없음'})`;
  if (typeof it !== 'object' || it === null || Array.isArray(it)) {
    err(`${where}: 객체가 아닙니다.`);
    return;
  }

  if (!nonEmpty(it.id)) err(`${where}: id 는 비어 있지 않은 문자열이어야 합니다.`);
  else if (seenId.has(it.id)) err(`${where}: id '${it.id}' 중복 (items[${seenId.get(it.id)}]와 동일)`);
  else seenId.set(it.id, i);

  if (!TYPE_KEYS.includes(it.type)) {
    err(`${where}: 알 수 없는 유형 '${it.type}' (가능: ${TYPE_KEYS.join(', ')})`);
    return;
  }
  if (!LEVELS.includes(it.level)) {
    err(`${where}: 알 수 없는 난이도 '${it.level}' (가능: ${LEVELS.join(', ')})`);
  }

  const meta = TYPE_META[it.type];
  const isQuiz = meta.kind === 'quiz';
  const required = isQuiz ? QUIZ_REQUIRED : TOOL_REQUIRED;
  const allowed = new Set(isQuiz ? QUIZ_REQUIRED : [...TOOL_REQUIRED, 'topic']);
  if (it.type === 'person') allowed.add('photo');

  for (const k of required) {
    if (it[k] === undefined) err(`${where}: 필수 필드 '${k}' 누락`);
  }
  for (const k of Object.keys(it)) {
    if (!allowed.has(k)) err(`${where}: 알 수 없는 필드 '${k}'`);
  }

  // 주제 — topics:true 인 유형만 값을 갖는다. 나머지 문항형은 반드시 null.
  if (meta.topics) {
    if (!topicsOf(it.type).includes(it.topic)) {
      err(`${where}: 알 수 없는 주제 '${it.topic}' (가능: ${topicsOf(it.type).join(', ')})`);
    }
  } else if (isQuiz && it.topic !== null) {
    err(`${where}: 유형 '${it.type}' 은 주제를 갖지 않습니다 — topic 은 null 이어야 합니다.`);
  }

  if (isQuiz) {
    for (const k of ['prompt', 'hint', 'answer']) {
      if (!nonEmpty(it[k])) err(`${where}: ${k} 가 비어 있습니다.`);
    }
    if (!Array.isArray(it.also)) err(`${where}: also 는 배열이어야 합니다 (없으면 []).`);
    if (typeof it.note !== 'string') err(`${where}: note 는 문자열이어야 합니다 (없으면 "").`);

    // 같은 유형 안에서 정답이 겹치면 사실상 같은 문제다.
    if (nonEmpty(it.answer)) {
      const key = `${it.type}\u0000${it.answer}`;
      if (seenAnswer.has(key)) {
        err(`${where}: 정답 '${it.answer}' 이 items[${seenAnswer.get(key)}] 와 같은 유형에서 중복됩니다.`);
      } else seenAnswer.set(key, i);
    }

    // 힌트가 정답을 통째로 담고 있으면 힌트가 아니라 정답이다.
    if (nonEmpty(it.hint) && nonEmpty(it.answer) && it.hint.includes(it.answer)) {
      err(`${where}: 힌트에 정답 '${it.answer}' 이 그대로 들어 있습니다.`);
    }

    // 초성 문제는 초성만 있어야 한다 (완성형 한글이 섞이면 답이 보인다).
    if (it.type === 'choseong' && /[가-힣]/.test(it.prompt)) {
      err(`${where}: 초성퀴즈 prompt 에 완성형 한글이 섞였습니다 — 초성만 적어 주세요.`);
    }
    // 초성은 정답에서 그대로 나와야 한다. 사람이 손으로 적으면 겹자음이 가장 먼저
    // 틀린다 — 토끼를 ㅌㄱ 으로, 딸기를 ㄷㄱ 으로 적는 식이다. 그러면 화면이
    // 아이들에게 틀린 초성을 가르치게 된다(초성은 국어 교육과정의 내용이다).
    // 답이 좁혀지는 것은 감수한다 — 맞는 초성이 먼저다.
    if (it.type === 'choseong' && nonEmpty(it.answer)) {
      const want = choseongOf(it.answer);
      if (want !== it.prompt) {
        err(`${where}: 초성이 정답과 맞지 않습니다 — '${it.answer}' 의 초성은 '${want}' 인데 '${it.prompt}' 로 적혀 있습니다.`);
      }
    }
    // 화면 가득 띄우는 두 글자가 욕설로 읽히면 수업이 거기서 끝난다.
    if (it.type === 'choseong' && CHOSEONG_BANNED.includes(it.prompt)) {
      err(`${where}: 초성 '${it.prompt}' 은 욕설로 읽힙니다 — 다른 낱말로 바꿔 주세요.`);
    }
    // 사자성어 정답은 네 글자.
    if (it.type === 'idiom' && nonEmpty(it.answer) && it.answer.replace(/\s/g, '').length !== 4) {
      err(`${where}: 사자성어 정답은 네 글자여야 합니다 — '${it.answer}'`);
    }
    // 4글자 이어말하기 — 앞 두 글자 + 빈칸, 답은 뒤 두 글자, 힌트는 답의 초성.
    if (it.type === 'fourword') {
      if (!/^[가-힣]{2}______$/.test(it.prompt)) {
        err(`${where}: 4글자 prompt 는 '앞 두 글자 + ______' 여야 합니다 — '${it.prompt}'`);
      }
      if (!/^[가-힣]{2}$/.test(it.answer)) err(`${where}: 4글자 정답은 한글 두 글자여야 합니다 — '${it.answer}'`);
      else if (it.hint !== choseongOf(it.answer)) {
        err(`${where}: 힌트는 정답의 초성 '${choseongOf(it.answer)}' 이어야 합니다 — '${it.hint}'`);
      }
    }
    // 반대말·흉내 내는 말 — 힌트는 정답의 초성(기계적으로).
    if ((it.type === 'opposite' || it.type === 'mimetic') && nonEmpty(it.answer) && it.hint !== choseongOf(it.answer)) {
      err(`${where}: 힌트는 정답의 초성 '${choseongOf(it.answer)}' 이어야 합니다 — '${it.hint}'`);
    }
    // 흉내 내는 말은 문장 속 빈칸을 채운다 — 정답을 열면 그 자리에 들어간다.
    if (it.type === 'mimetic' && !it.prompt.includes('______')) {
      err(`${where}: 흉내 내는 말 prompt 에 빈칸(______, 언더바 6개)이 없습니다.`);
    }
    // 맞춤법 — 틀린 말과 바른 말이 같으면 고칠 것이 없다.
    if (it.type === 'spelling' && it.prompt === it.answer) {
      err(`${where}: 맞춤법 문제와 정답이 같습니다 — '${it.prompt}'`);
    }
    // 글자 뒤섞기 — 문제는 정답의 글자를 순서만 바꾼 것이어야 한다(띄어쓰기는 무시).
    if (it.type === 'scramble' && nonEmpty(it.prompt) && nonEmpty(it.answer)) {
      const letters = (w) => [...w.replace(/\s/g, '')].sort().join('');
      if (letters(it.prompt) !== letters(it.answer)) {
        err(`${where}: 뒤섞은 글자가 정답 '${it.answer}' 의 글자와 다릅니다 — '${it.prompt}'`);
      } else if (it.prompt.replace(/\s/g, '') === it.answer) {
        err(`${where}: 글자가 섞이지 않았습니다 — '${it.prompt}'`);
      }
    }
    // 인물퀴즈 — 힌트는 이름의 초성으로 시작한다(초성은 정답에서 기계적으로 나온다).
    if (it.type === 'person' && nonEmpty(it.answer) && nonEmpty(it.hint)) {
      const cho = choseongOf(it.answer);
      if (cho && !it.hint.startsWith(`${cho} · `)) {
        err(`${where}: 인물 힌트는 '${cho} · 설명' 으로 시작해야 합니다 — '${it.hint}'`);
      }
    }
    // 속담 이어말하기는 빈칸이 있어야 문제가 성립한다.
    if (it.type === 'proverb' && !it.prompt.includes('______')) {
      err(`${where}: 속담 prompt 에 빈칸(______, 언더바 6개)이 없습니다.`);
    }

    if (it.prompt && it.prompt.length > PROMPT_MAX) {
      warn(`${where}: 문제가 ${it.prompt.length}자 — 전자칠판 한 화면에는 ${PROMPT_MAX}자 안팎이 읽기 좋습니다.`);
    }
    if (it.answer && it.answer.length > ANSWER_MAX) {
      warn(`${where}: 정답이 ${it.answer.length}자 — 한 줄에 들어가지 않을 수 있습니다.`);
    }

    for (const f of ['prompt', 'hint', 'answer', 'note']) {
      if (nonEmpty(it[f])) checkSafety(`${where} ${f}`, it[f]);
    }

    // 인물 사진 — 저작권이 걸린 사진이 배포되지 않도록 출처·라이선스를 강제한다.
    if (it.type === 'person') checkPhoto(where, it.photo);
    for (const a of Array.isArray(it.also) ? it.also : []) {
      if (nonEmpty(a)) checkSafety(`${where} also`, a);
    }
  } else {
    if (!nonEmpty(it.word)) {
      err(`${where}: word 가 비어 있습니다.`);
    } else {
      checkSafety(`${where} word`, it.word);
      const key = `${it.type}\u0000${it.word}`;
      if (seenWord.has(key)) {
        err(`${where}: 단어 '${it.word}' 이 items[${seenWord.get(key)}] 와 같은 유형에서 중복됩니다.`);
      } else seenWord.set(key, i);

      // 줄줄이 말해요의 제시어는 한글 한 글자다.
      if (it.type === 'relay' && !/^[가-힣]$/.test(it.word)) {
        err(`${where}: 줄줄이 말해요 제시어는 한글 한 글자여야 합니다 — '${it.word}'`);
      }
      // 끝말잇기 시작 단어가 ㄹ 로 시작하는 글자로 끝나면 이을 말이 없다(두음법칙).
      if (it.type === 'chain') {
        const tail = it.word.codePointAt(it.word.length - 1);
        if (tail >= R_HEAD_START && tail <= R_HEAD_END) {
          err(`${where}: 시작 단어 '${it.word}' 는 ㄹ 로 시작하는 글자로 끝나 이어 갈 말이 없습니다.`);
        }
      }
    }
  }
});

// ── 분포 집계 (PRD 12절 완료 기준) ──────────────────────────────
const tally = {};
for (const it of data.items) {
  tally[it.type] = tally[it.type] || {};
  tally[it.type][it.level] = (tally[it.type][it.level] || 0) + 1;
}

console.log('\n  문항 분포');
let quizTotal = 0;
for (const [type, want] of Object.entries(TARGET)) {
  const got = tally[type] || {};
  const row = LEVELS.map((lv) => `${lv} ${String(got[lv] || 0).padStart(3)}/${want[lv]}`).join('  ');
  const sum = LEVELS.reduce((a, lv) => a + (got[lv] || 0), 0);
  quizTotal += sum;
  console.log(`    ${type.padEnd(9)} ${row}   합계 ${String(sum).padStart(3)}`);
  for (const lv of LEVELS) {
    const n = got[lv] || 0;
    const lo = Math.floor(want[lv] * (1 - TOLERANCE));
    const hi = Math.ceil(want[lv] * (1 + TOLERANCE));
    if (n < lo || n > hi) {
      err(`분포: ${type}/${lv} 이 ${n}개입니다 — 목표 ${want[lv]}개(허용 ${lo}~${hi}) 범위를 벗어났습니다.`);
    }
  }
}
const quizWant = Object.values(TARGET).reduce((a, t) => a + LEVELS.reduce((b, lv) => b + t[lv], 0), 0);
console.log(`    — 문항형 합계 ${quizTotal} (목표 ${quizWant})`);

for (const [type, want] of Object.entries(TOOL_TARGET)) {
  const n = data.items.filter((it) => it.type === type).length;
  console.log(`    ${type.padEnd(9)} ${n}/${want}`);
  if (n < want) err(`분포: ${type} 이 ${n}개입니다 — MVP 기준은 ${want}개입니다.`);
}

// 일부러 비워 둔 주제. 몸으로 말해요에서 '나라'를 흉내 내라고 하면 아이들이
// 특정 민족을 비하하는 몸짓(눈 찢기 등)으로 가기 쉽다 — 안전 기준(PRD 3절) 위반이다.
// 빈 주제 경고에서 빼고, 거꾸로 문항이 들어오면 막는다.
const EXCLUDED_TOPICS = { gesture: ['나라'] };
for (const [type, topics] of Object.entries(EXCLUDED_TOPICS)) {
  for (const it of data.items) {
    if (it.type === type && topics.includes(it.topic)) {
      err(`${it.id}: 유형 '${type}' 은 주제 '${it.topic}' 을 쓰지 않습니다 — 흉내가 민족 비하로 번지기 쉽습니다.`);
    }
  }
}

// 주제를 쓰는 유형은 화면에 주제 버튼이 뜨므로, 주제별로 최소한이 있어야 한다.
for (const [type, meta] of Object.entries(TYPE_META)) {
  if (!meta.topics) continue;
  const byTopic = {};
  for (const it of data.items) if (it.type === type) byTopic[it.topic] = (byTopic[it.topic] || 0) + 1;
  const skip = EXCLUDED_TOPICS[type] || [];
  const empty = topicsOf(type).filter((tp) => !byTopic[tp] && !skip.includes(tp));
  if (empty.length && data.items.some((it) => it.type === type)) {
    warn(`유형 '${type}' 에 문항이 없는 주제: ${empty.join(', ')} — 그 주제 버튼은 화면에 뜨지 않습니다.`);
  }
}

// 어느 인물도 쓰지 않는 사진 — 라이선스를 확인한 적 없는 파일이 배포되는 것을 막는다.
const PEOPLE_DIR = path.join(ROOT, 'assets', 'people');
if (fs.existsSync(PEOPLE_DIR)) {
  for (const f of fs.readdirSync(PEOPLE_DIR)) {
    if (!usedPhotos.has(`assets/people/${f}`)) err(`assets/people/${f}: 어느 인물도 쓰지 않는 사진입니다 — 지워 주세요.`);
  }
}

for (const w of warnings) console.log(`  ⚠ ${w}`);
for (const e of errors) console.error(`  ✗ ${e}`);

if (errors.length) {
  console.error(`\n❌ 낱말 데이터 검증 실패 — 오류 ${errors.length}건`);
  process.exit(1);
}
console.log(`\n✅ 낱말 데이터 검증 통과 — ${data.items.length}개${warnings.length ? ` (경고 ${warnings.length}건)` : ''}`);
