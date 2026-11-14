/* 그림책 데이터 정적 검증 — CI 게이트(.github/workflows/picturebook.yml), PRD 8장 5·10장.
 *
 *   node scripts/validate-data.mjs
 *
 * 빌드 단계가 없는 정적 사이트라, 잘못된 데이터는 화면에서야 드러납니다. 여기서 먼저 잡습니다.
 *  - 책(book.json): 필수 칸, 원전 근거(origin.basis)·재화 표시, 안전 기준(sensitivity·cautions),
 *    장면 수(8~12), 장면당 문장 수(1~3)·문장 길이, 그림 파일·크기·용량
 *  - 음성(data/voice.json): 책마다 목소리 둘 다, 글 해시가 지금 글과 같은지, 문장 수가 글과 같은지, 파일이 있는지
 * 기준값 가운데 화면과 겹치는 것(원전 종류·시간)은 js/app.js 의 상수에서 읽어 옵니다 — 둘이 따로 놀지 않게.
 * 문제는 ✖(실패)와 ⚠(경고)로 나눕니다. ✖ 가 하나라도 있으면 끝 코드 1 입니다.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ── 기준 ───────────────────────────────────────────────────────────
const SCENES = [8, 12];          // 권당 장면 수(PRD 3.2)
const LINES = [1, 3];            // 장면당 문장 수(PRD 3.2)
const LINE_WARN = 30;            // 한 문장 글자 수 — 25자 안팎이 기준(PRD 3.5), 넘으면 경고
const LINE_MAX = 45;             // 이보다 길면 글 띠 한 줄에 다 들어가지 않습니다
const IMAGE_SIZE = [1600, 900];  // 그림 크기(PRD 7장)
const BOOK_BYTES = 2_000_000;    // 권당 그림 합계 목표(PRD 7장) — 넘으면 경고

// ── js/app.js 에서 읽는 기준 ─────────────────────────────────────────
const APP = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf-8');
function extract(label, re, parse) {
  const m = APP.match(re);
  if (!m) {
    err(`js/app.js 에서 ${label} 를 찾지 못했습니다 — 이름이 바뀌었다면 이 스크립트도 함께 고칩니다.`);
    return null;
  }
  return parse(m);
}
const ORIGIN_TYPES = extract('ORIGIN', /const ORIGIN = \{([^}]*)\}/, (m) =>
  [...m[1].matchAll(/'?([\w-]+)'?\s*:/g)].map((x) => x[1])) || [];
const MINUTES = extract('FILTERS.minutes', /minutes: \{[^\n]*opts: \[([^\n]*)\]\]/, (m) =>
  [...m[1].matchAll(/\[(\d+),/g)].map((x) => Number(x[1]))) || [];

// ── 도움 함수 ──────────────────────────────────────────────────────
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const chars = (s) => [...s.replace(/\s/g, '')].length;

// webp 머리에서 가로·세로를 읽습니다(VP8 · VP8L · VP8X).
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const v = b.readUInt32LE(21);
    return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)];
  }
  return null;
}

// scripts/voice/build.py 의 text_hash 와 같은 계산입니다 — 글이 바뀌었는데 음성을 다시 만들지 않았는지 봅니다.
function textHash(book) {
  const texts = [book.title, ...book.pages.flatMap((p) => p.text), book.question];
  return crypto.createHash('sha1').update(texts.join('\n'), 'utf-8').digest('hex').slice(0, 10);
}

// ── 책 ─────────────────────────────────────────────────────────────
const { books } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'books.json'), 'utf-8'));
const seen = new Map();
for (const b of books) {
  const where = `books/${b.id}`;
  const dir = path.join(ROOT, 'books', b.id);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id || '')) err(`${where}: id 는 영문 소문자·숫자·하이픈만 씁니다`);
  for (const k of ['title', 'retold', 'blurb', 'question']) if (!isText(b[k])) err(`${where}: ${k} 가 비어 있습니다`);
  for (const k of ['id', 'title']) {
    const key = `${k}:${b[k]}`;
    if (seen.has(key)) err(`${where}: ${k} '${b[k]}' 가 ${seen.get(key)} 와 겹칩니다`);
    seen.set(key, where);
  }

  // 원전·재화(PRD 3.1) — 저작권 근거를 비워 두면 실패
  if (!ORIGIN_TYPES.includes(b.origin?.type)) err(`${where}: origin.type '${b.origin?.type}' 은 ${ORIGIN_TYPES.join('·')} 가운데 하나여야 합니다`);
  if (!isText(b.origin?.basis)) err(`${where}: origin.basis(원전과 저작권 근거)가 비어 있습니다`);

  // 안전 기준(PRD 3.4) — 목록에는 low 만, 점검 기록은 꼭 남깁니다
  if (b.sensitivity !== 'low') err(`${where}: sensitivity 가 'low' 가 아닙니다('${b.sensitivity}') — 목록에 낼 수 없습니다`);
  if (!isText(b.cautions)) err(`${where}: cautions(안전·고정관념 점검 기록)가 비어 있습니다`);

  if (!MINUTES.includes(b.minutes)) err(`${where}: minutes 는 ${MINUTES.join('·')} 가운데 하나여야 합니다(지금 ${b.minutes})`);
  if (!Array.isArray(b.grades) || !b.grades.length || b.grades.some((g, i) => !Number.isInteger(g) || g < 1 || g > 6 || (i && g <= b.grades[i - 1]))) {
    err(`${where}: grades 는 1~6 을 작은 것부터 적은 배열이어야 합니다`);
  }
  if (!Array.isArray(b.keywords) || !b.keywords.every(isText)) err(`${where}: keywords 는 글자 배열이어야 합니다`);

  // 장면·문장(PRD 3.2·3.5)
  const pages = Array.isArray(b.pages) ? b.pages : [];
  if (pages.length < SCENES[0] || pages.length > SCENES[1]) err(`${where}: 장면이 ${pages.length}개 — ${SCENES[0]}~${SCENES[1]}개여야 합니다`);
  pages.forEach((p, i) => {
    const at = `${where} 장면 ${i + 1}`;
    const text = Array.isArray(p.text) ? p.text : [];
    if (text.length < LINES[0] || text.length > LINES[1]) err(`${at}: 문장이 ${text.length}개 — ${LINES[0]}~${LINES[1]}개여야 합니다`);
    for (const t of text) {
      if (!isText(t)) { err(`${at}: 빈 문장이 있습니다`); continue; }
      const n = chars(t);
      if (n > LINE_MAX) err(`${at}: 문장이 ${n}자로 너무 깁니다(${LINE_MAX}자 이하) — "${t}"`);
      else if (n > LINE_WARN) warn(`${at}: 문장이 ${n}자입니다(25자 안팎 권장) — "${t}"`);
    }
  });

  // 그림(PRD 7장) — 표지 + 장면마다 1장, 1600×900, 권당 합계 2MB 목표
  const images = ['cover.webp', ...pages.map((p) => p.image)];
  let bytes = 0;
  images.forEach((name, i) => {
    if (!isText(name)) { err(`${where} 장면 ${i}: image 가 비어 있습니다`); return; }
    const f = path.join(dir, name);
    if (!fs.existsSync(f)) { err(`${rel(f)}: 그림 파일이 없습니다`); return; }
    bytes += fs.statSync(f).size;
    const size = webpSize(f);
    if (!size) err(`${rel(f)}: webp 그림이 아닙니다`);
    else if (size[0] !== IMAGE_SIZE[0] || size[1] !== IMAGE_SIZE[1]) {
      warn(`${rel(f)}: ${size.join('×')} — ${IMAGE_SIZE.join('×')} 권장`);
    }
  });
  if (new Set(pages.map((p) => p.image)).size !== pages.length) err(`${where}: 같은 그림을 두 장면에 썼습니다`);
  if (bytes > BOOK_BYTES) warn(`${where}: 그림 합계 ${(bytes / 1e6).toFixed(1)}MB — 2MB 이하 목표`);
}

// ── 음성 ───────────────────────────────────────────────────────────
const VOICE = path.join(ROOT, 'data', 'voice.json');
if (!fs.existsSync(VOICE)) err('data/voice.json 이 없습니다 — python scripts/voice/build.py');
else {
  const v = JSON.parse(fs.readFileSync(VOICE, 'utf-8'));
  const ids = (v.voices || []).map((x) => x.id);
  if (ids.length < 2) err('data/voice.json: 목소리가 둘(여자·남자)이어야 합니다(PRD F4)');
  if (!isText(v.credit)) err('data/voice.json: credit(AI 음성 표시)이 비어 있습니다(PRD 3.1)');
  for (const b of books) {
    const e = v.books?.[b.id];
    const where = `data/voice.json ${b.id}`;
    if (!e) { err(`${where}: 음성이 없습니다 — python scripts/voice/build.py`); continue; }
    if (e.hash !== textHash(b)) err(`${where}: 글이 바뀌었는데 음성을 다시 만들지 않았습니다 — python scripts/voice/build.py`);
    for (const id of ids) {
      const s = e[id];
      if (!s) { err(`${where}: ${id} 목소리가 없습니다`); continue; }
      if (!fs.existsSync(path.join(ROOT, s.file))) err(`${where} ${id}: 파일 ${s.file} 이 없습니다`);
      if (!Array.isArray(s.title) || !Array.isArray(s.question)) err(`${where} ${id}: 제목·질문 구간이 없습니다`);
      const pages = s.pages || [];
      if (pages.length !== b.pages.length) err(`${where} ${id}: 장면 수 ${pages.length} ≠ 글 ${b.pages.length}`);
      pages.forEach((p, i) => {
        if (b.pages[i] && p.length !== b.pages[i].text.length) {
          err(`${where} ${id} 장면 ${i + 1}: 문장 구간 ${p.length}개 ≠ 글 ${b.pages[i].text.length}문장`);
        }
      });
    }
  }
  for (const id of Object.keys(v.books || {})) {
    if (!books.some((b) => b.id === id)) warn(`data/voice.json: 목록에 없는 책 '${id}' 의 음성이 남아 있습니다`);
  }
}

// ── 결과 ───────────────────────────────────────────────────────────
for (const w of warnings) console.log(`  ⚠ ${w}`);
for (const e of errors) console.error(`  ✖ ${e}`);
if (errors.length) {
  console.error(`\n✖ 데이터 검증 실패 — 문제 ${errors.length}개, 경고 ${warnings.length}개`);
  process.exit(1);
}
console.log(`✅ 데이터 검증 — ${books.length}권, 경고 ${warnings.length}개`);
