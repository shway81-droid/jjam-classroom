// PRD 9장 정적 검증. 그림 데이터를 전수 확인합니다.
// 의존성 없이 돕니다 — SVG path 파서와 bounding box 계산을 여기서 직접 합니다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { ROOT, readList, readDrawing, bundleText } from './bundle.mjs';

const DIFFICULTY = { easy: [6, 8], normal: [9, 12], hard: [13, 16] };
const DIFF_NAME = { easy: '쉬움', normal: '보통', hard: '도전' };
const THEMES = ['animal', 'person', 'plant', 'food', 'thing', 'season', 'fantasy'];
const PAPER = { portrait: '0 0 400 500', landscape: '0 0 500 400' };
const PAPER_WORD = { portrait: '세로', landscape: '가로' };
const GRADES = ['lower', 'middle', 'upper'];

const FIRST_STEP_MIN_RATIO = 0.4;   // PRD 4.1의 2번 — 높이 기준
const MAX_STROKES_PER_STEP = 6;     // PRD 4.1의 1번 — 잔 획 묶음 상한
const SECONDS_RANGE = [10, 30];     // PRD 7.2
const LABEL_LEN = [1, 8];           // PRD 4.5
const SAY_LEN = [15, 40];
const SETUP_LEN = [20, 50];

// PRD 4.5 "쓰지 않는 말" — 두 글자 이상이고 다른 낱말에 섞이지 않는 것만 기계로 봅니다.
const BANNED_WORDS = [
  'cm', 'mm', '삼각형', '사각형', '타원', '반원',
  '윤곽선', '명암', '비율', '원근', '데생',
  '똑바로', '정확히', '비뚤어지지', '예쁘게',
];
const BANNED_PATTERNS = [
  [/\d\s*(처럼|자로|배)/, '숫자 모양 비유·배수'],
  [/\d\s*\/\s*\d/, '분수'],
  [/%/, '백분율'],
];

const errors = [];
const fail = (where, msg) => errors.push(`${where} — ${msg}`);
const chars = (s) => [...s].length;

// ---------------------------------------------------------------- path 파서
// M · L · C · Z 만 받습니다. A(호)는 제어점 bounding box 가 뜻을 잃어
// 40% 검증과 viewBox 검증이 헛돌기 때문에 데이터에서 쓰지 않습니다.
const ALLOWED_CMD = /^[MLCZmlczs\s\d.,+-]*$/;

function parsePath(d) {
  if (!ALLOWED_CMD.test(d)) {
    const bad = [...new Set(d.match(/[A-Za-z]/g) || [])].filter((c) => !'MLCZmlcz'.includes(c));
    return { error: `쓸 수 없는 명령 ${bad.join('·')} (M·L·C·Z 만 씁니다)` };
  }
  const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+/g) || [];
  const points = [];
  let cmd = null;
  let nums = [];
  let started = false;
  let mCount = 0;

  const flush = () => {
    if (!cmd) return null;
    const need = cmd.toUpperCase() === 'M' || cmd.toUpperCase() === 'L' ? 2
      : cmd.toUpperCase() === 'C' ? 6 : 0;
    if (need === 0) { nums = []; return null; }
    if (nums.length === 0 || nums.length % need !== 0) {
      return `${cmd} 명령의 숫자 개수가 맞지 않습니다`;
    }
    for (let i = 0; i < nums.length; i += 2) points.push([nums[i], nums[i + 1]]);
    nums = [];
    return null;
  };

  for (const t of tokens) {
    if (/[MLCZmlcz]/.test(t)) {
      const err = flush();
      if (err) return { error: err };
      cmd = t;
      if (t.toUpperCase() === 'M') { mCount += 1; if (!started) started = true; }
      else if (!started) return { error: '경로가 M 으로 시작하지 않습니다' };
    } else {
      if (!cmd) return { error: '경로가 명령 없이 숫자로 시작합니다' };
      nums.push(Number(t));
    }
  }
  const err = flush();
  if (err) return { error: err };
  if (mCount !== 1) return { error: `M 이 ${mCount}개입니다 — 한 획에 하나입니다(PRD 7.1)` };
  if (/[mlcz]/.test(d)) return { error: '상대 좌표 소문자 명령은 쓰지 않습니다' };
  if (points.length === 0) return { error: '좌표가 없습니다' };
  return { points };
}

const bboxOf = (points) => ({
  x0: Math.min(...points.map((p) => p[0])),
  x1: Math.max(...points.map((p) => p[0])),
  y0: Math.min(...points.map((p) => p[1])),
  y1: Math.max(...points.map((p) => p[1])),
});

// ---------------------------------------------------------------- 검증
function checkSentence(where, field, text, range, endings) {
  const n = chars(text);
  if (n < range[0] || n > range[1]) {
    fail(where, `${field} 가 ${n}자입니다 — ${range[0]}~${range[1]}자여야 합니다`);
  }
  const body = text.slice(0, -1);
  if (!text.endsWith('.')) fail(where, `${field} 가 마침표로 끝나지 않습니다`);
  if (/[.!?]/.test(body)) fail(where, `${field} 가 한 문장이 아닙니다 — 문장 부호가 중간에 있습니다`);
  if (endings && !endings.some((e) => text.endsWith(e))) {
    fail(where, `${field} 의 끝맺음이 ${endings.join('·')} 가 아닙니다`);
  }
}

function checkWords(where, field, text) {
  for (const w of BANNED_WORDS) {
    if (text.includes(w)) fail(where, `${field} 에 쓰지 않는 말 "${w}" 이 있습니다(PRD 4.5)`);
  }
  for (const [re, name] of BANNED_PATTERNS) {
    if (re.test(text)) fail(where, `${field} 에 ${name} 표현이 있습니다(PRD 4.5)`);
  }
}

function validateDrawing(d) {
  const where = `${d.id}`;

  if (!DIFFICULTY[d.difficulty]) return fail(where, `difficulty "${d.difficulty}" 는 허용 값이 아닙니다`);
  if (!THEMES.includes(d.theme)) fail(where, `theme "${d.theme}" 는 허용 값이 아닙니다`);
  if (!PAPER[d.paper]) return fail(where, `paper "${d.paper}" 는 허용 값이 아닙니다`);
  if (d.viewBox !== PAPER[d.paper]) {
    fail(where, `viewBox 가 "${d.viewBox}" 입니다 — paper=${d.paper} 이면 "${PAPER[d.paper]}" 여야 합니다(PRD 7.3)`);
  }
  if (!Array.isArray(d.grades) || !d.grades.every((g) => GRADES.includes(g))) {
    fail(where, 'grades 에 허용되지 않은 값이 있습니다');
  }
  if (!Number.isInteger(d.coloringSeconds) || d.coloringSeconds < 30 || d.coloringSeconds > 300) {
    fail(where, 'coloringSeconds 가 30~300 범위를 벗어납니다');
  }

  // setupSay — 종이 방향과 첫 획 크기
  if (typeof d.setupSay !== 'string') {
    fail(where, 'setupSay 가 없습니다');
  } else {
    checkSentence(where, 'setupSay', d.setupSay, SETUP_LEN, null);
    checkWords(where, 'setupSay', d.setupSay);
    if (!d.setupSay.includes(PAPER_WORD[d.paper])) {
      fail(where, `setupSay 에 종이 방향("${PAPER_WORD[d.paper]}")이 없습니다(PRD 4.5)`);
    }
  }

  // 단계 수
  const [lo, hi] = DIFFICULTY[d.difficulty];
  const n = Array.isArray(d.steps) ? d.steps.length : 0;
  if (n < lo || n > hi) {
    fail(where, `단계가 ${n}개입니다 — ${DIFF_NAME[d.difficulty]}은 ${lo}~${hi}개입니다`);
  }

  const viewBox = d.viewBox.split(/\s+/).map(Number);
  const [vx, vy, vw, vh] = viewBox;
  const boxes = [];

  d.steps.forEach((step, i) => {
    const sw = `${d.id} #${i + 1}`;

    // 글과 그림을 따로 봅니다. 경로가 깨져도 멘트 검사를 건너뛰지 않습니다.
    if (typeof step.label !== 'string') fail(sw, 'label 이 없습니다');
    else {
      const ln = chars(step.label);
      if (ln < LABEL_LEN[0] || ln > LABEL_LEN[1]) {
        fail(sw, `label 이 ${ln}자입니다 — ${LABEL_LEN[0]}~${LABEL_LEN[1]}자여야 합니다`);
      }
      if (/[.!?]/.test(step.label)) fail(sw, 'label 에 마침표가 있습니다');
      checkWords(sw, 'label', step.label);
    }

    if (typeof step.teacherSay !== 'string') fail(sw, 'teacherSay 가 없습니다');
    else {
      checkSentence(sw, 'teacherSay', step.teacherSay, SAY_LEN, ['요.']);
      checkWords(sw, 'teacherSay', step.teacherSay);
      if (i === 0 && !step.teacherSay.includes('종이')) {
        fail(sw, '첫 단계 teacherSay 에 종이의 어디인지가 없습니다(PRD 4.5의 3번)');
      }
    }

    if (step.seconds !== undefined) {
      if (typeof step.seconds !== 'number' || step.seconds < SECONDS_RANGE[0] || step.seconds > SECONDS_RANGE[1]) {
        fail(sw, `seconds 가 ${step.seconds} 입니다 — ${SECONDS_RANGE.join('~')}초여야 합니다(PRD 7.2)`);
      }
    }

    // ---- 여기부터 그림
    if (!Array.isArray(step.d)) return fail(sw, 'd 가 배열이 아닙니다(PRD 7.1)');
    if (step.d.length === 0) return fail(sw, 'd 가 빈 배열입니다');
    if (step.d.length > MAX_STROKES_PER_STEP) {
      fail(sw, `한 단계에 획이 ${step.d.length}개입니다 — ${MAX_STROKES_PER_STEP}개까지입니다(PRD 4.1)`);
    }

    const pts = [];
    step.d.forEach((path, j) => {
      const parsed = parsePath(path);
      if (parsed.error) return fail(`${sw}.${j + 1}`, parsed.error);
      pts.push(...parsed.points);
    });
    if (pts.length === 0) return;

    const box = bboxOf(pts);
    boxes.push(box);
    if (box.x0 < vx || box.y0 < vy || box.x1 > vx + vw || box.y1 > vy + vh) {
      fail(sw, `제어점이 viewBox 밖으로 나갑니다 (x ${box.x0}~${box.x1}, y ${box.y0}~${box.y1})`);
    }
  });

  // 첫 단계가 크기와 위치를 정하는지 — 높이 기준 40%
  if (boxes.length === d.steps.length && boxes.length > 0) {
    const full = {
      y0: Math.min(...boxes.map((b) => b.y0)),
      y1: Math.max(...boxes.map((b) => b.y1)),
    };
    const fullH = full.y1 - full.y0;
    const firstH = boxes[0].y1 - boxes[0].y0;
    const ratio = firstH / fullH;
    if (ratio < FIRST_STEP_MIN_RATIO) {
      fail(where, `첫 단계 높이가 완성본 높이의 ${(ratio * 100).toFixed(1)}% 입니다 — 40% 이상이어야 합니다(PRD 4.1의 2번)`);
    }
    return { ratio, steps: d.steps.length };
  }
  return null;
}

// ---------------------------------------------------------------- 실행
const list = readList();
const folders = readdirSync(join(ROOT, 'drawings'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

if (new Set(list).size !== list.length) fail('list.json', 'id 가 중복됩니다');
for (const id of list) {
  if (!existsSync(join(ROOT, 'drawings', id, 'drawing.json'))) {
    fail('list.json', `"${id}" 폴더의 drawing.json 이 없습니다`);
  }
}
for (const f of folders) {
  if (!list.includes(f)) fail('drawings/', `"${f}" 폴더가 list.json 에 없습니다`);
}

const report = [];
for (const id of list) {
  if (!existsSync(join(ROOT, 'drawings', id, 'drawing.json'))) continue;
  const d = readDrawing(id);
  if (d.id !== id) fail(id, `drawing.json 의 id 가 "${d.id}" 입니다 — 폴더 이름과 달라요`);
  const r = validateDrawing(d);
  if (r) report.push(`  ${id.padEnd(12)} ${DIFF_NAME[d.difficulty]} · ${r.steps}단계 · 첫 획 ${(r.ratio * 100).toFixed(0)}%`);
}

// 통합본이 원본과 같은지 — 단일 소스 원칙
const bundlePath = join(ROOT, 'data', 'drawings.json');
if (!existsSync(bundlePath)) {
  fail('data/drawings.json', '통합본이 없습니다 — npm run bundle 을 돌려 주세요');
} else if (readFileSync(bundlePath, 'utf8') !== bundleText()) {
  fail('data/drawings.json', '통합본이 원본과 다릅니다 — npm run bundle 을 돌려 주세요');
}

// 교사 멘트 음성이 지금 문장으로 만든 것인지 — 문장을 고치고 음성을 안 만들면 여기서 멈춥니다.
// scripts/voice/build.py 와 같은 해시(준비 안내 + 단계 멘트를 줄바꿈으로 이은 sha1 앞 10자)입니다.
const voicePath = join(ROOT, 'data', 'voice.json');
if (!existsSync(voicePath)) {
  fail('data/voice.json', '음성 목록이 없습니다 — npm run voice 를 돌려 주세요');
} else {
  const voice = JSON.parse(readFileSync(voicePath, 'utf8'));
  for (const id of list) {
    if (!existsSync(join(ROOT, 'drawings', id, 'drawing.json'))) continue;
    const d = readDrawing(id);
    const texts = [d.setupSay, ...d.steps.map((s) => s.teacherSay)];
    const hash = createHash('sha1').update(texts.join('\n')).digest('hex').slice(0, 10);
    const e = voice.drawings?.[id];
    if (!e || e.hash !== hash) {
      fail(`${id} 음성`, '멘트가 바뀌었는데 음성이 옛것입니다 — npm run voice 를 돌려 주세요');
      continue;
    }
    for (const v of voice.voices) {
      const f = e[v.id];
      if (!f || !existsSync(join(ROOT, f.file))) fail(`${id} 음성`, `${v.id} 파일이 없습니다 — npm run voice 를 돌려 주세요`);
      else if (f.parts.length !== texts.length) fail(`${id} 음성`, `${v.id} 구간이 ${f.parts.length}개입니다 — 문장은 ${texts.length}개`);
    }
  }
}

if (errors.length) {
  console.error(`\n검증 실패 — ${errors.length}건\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error('');
  process.exit(1);
}
console.log(`\n검증 통과 — 그림 ${list.length}개\n`);
console.log(report.join('\n'));
console.log('');
