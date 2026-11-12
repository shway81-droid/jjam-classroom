#!/usr/bin/env node
/* —— 한 파일로 묶기 — 카톡 등으로 파일 하나만 보내 쓰게 ——

   사이트(index.html·css·js·data·그림·폰트)를 HTML 파일 하나에 담는다.
   받은 사람이 파일을 더블클릭하면(file://) 인터넷 없이 그대로 놀 수 있다.

     node scripts/build-single.mjs          → dist/짬짬이유치원.html

   원본은 언제나 사이트 파일이다. 이 결과물은 손으로 고치지 않는다 —
   사이트를 고친 뒤 이 스크립트를 다시 돌린다. dist/ 는 커밋하지 않는다(.gitignore).

   file:// 에서 막히는 것들을 이렇게 푼다.
   - fetch('data/cards.json')      → 카드 목록을 스크립트 안에 넣는다
   - <script type="module"> 의 import → 모듈마다 함수로 감싸 한 스크립트에 이어 붙인다
   - 그림·폰트·파비콘              → data: 주소로 넣는다
   - 서비스워커·manifest           → 뺀다(파일 하나라 캐시할 것이 없다)

   원본 코드 모양이 바뀌어 바꿔 넣을 자리를 못 찾으면 조용히 넘어가지 않고 멈춘다 —
   "만들어졌는데 열면 안 되는" 파일을 보내는 일이 없게. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, '짬짬이유치원.html');

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');
const svgUri = (p) => `data:image/svg+xml;base64,${b64(p)}`;

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

/* 정확히 한 번 나와야 하는 자리를 바꾼다. 없거나 여러 번이면 멈춘다. */
function replaceOnce(text, find, repl, where) {
  const n = text.split(find).length - 1;
  if (n !== 1) die(`${where}: "${find}" 가 ${n}번 나온다(1번이어야 한다) — 원본이 바뀌었으면 이 스크립트도 맞춘다`);
  return text.replace(find, () => repl);
}

/* ES 모듈 하나를 함수로 감싸 내보낸 이름들을 객체로 돌려준다. */
function wrapModule(file) {
  let src = read(file);
  if (/^\s*import\s/m.test(src)) die(`${file}: 다른 모듈을 import 한다 — 이 스크립트는 app.js 만 import 한다고 본다`);
  const names = [];
  src = src.replace(/^export\s+(function|const|let)\s+([A-Za-z_$][\w$]*)/gm, (_, kind, name) => {
    names.push(name);
    return `${kind} ${name}`;
  });
  if (/^\s*export\s/m.test(src)) die(`${file}: 이 스크립트가 모르는 export 모양이 있다`);
  return `(() => {\n${src}\nreturn { ${names.join(', ')} };\n})()`;
}

/* —— 데이터 —— */
const cards = JSON.parse(read('data/cards.json'));
const artIds = new Set(cards.items.map((c) => c.id));

/* —— app.js — import·fetch·그림 경로를 바꾼다 —— */
let app = read('js/app.js');
app = replaceOnce(app, "import { drawCard, emptyDeck } from './deck.js';", 'const { drawCard, emptyDeck } = __deck;', 'js/app.js');
app = replaceOnce(app, "import * as sound from './sound.js';", 'const sound = __sound;', 'js/app.js');
if (/^\s*import\s/m.test(app)) die('js/app.js: 이 스크립트가 모르는 import 가 있다');
app = app.replace(/^export\s+(const|function)/gm, '$1');
app = replaceOnce(app,
  "const res = await fetch('data/cards.json');\n  const data = await res.json();",
  'const data = __CARDS;', 'js/app.js');
// 그림 경로 → __art(...) — 카드 그림(`assets/cards/${id}.svg`)과
// 주제 아이콘(HTML 문자열 안의 src="assets/cards/${icon}.svg") 두 군데
let artHits = 0;
app = app.replace(/`assets\/cards\/\$\{([^}]+)\}\.svg`/g, (_, expr) => { artHits += 1; return `__art(${expr})`; });
app = app.replace(/src="assets\/cards\/\$\{([^}]+)\}\.svg"/g, (_, expr) => { artHits += 1; return `src="\${__art(${expr})}"`; });
if (artHits !== 2) die(`js/app.js: 그림 경로가 ${artHits}군데다(2군데여야 한다)`);
if (app.includes('assets/')) die('js/app.js: 바꾸지 못한 assets/ 경로가 남아 있다');

/* 주제 아이콘도 카드 그림 중 하나여야 한다 */
for (const m of app.matchAll(/icon:\s*'([a-z]+)'/g)) {
  if (!artIds.has(m[1])) die(`js/app.js: 주제 아이콘 '${m[1]}' 이 카드 그림에 없다`);
}

const art = {};
for (const id of artIds) art[id] = svgUri(`assets/cards/${id}.svg`);

const appScript = [
  `const __CARDS = ${JSON.stringify(cards)};`,
  `const __ART = ${JSON.stringify(art)};`,
  'const __art = (id) => __ART[id] || "";',
  `const __deck = ${wrapModule('js/deck.js')};`,
  `const __sound = ${wrapModule('js/sound.js')};`,
  app,
].join('\n');

/* —— CSS — 폰트를 data: 로 —— */
let css = read('css/style.css');
css = replaceOnce(css,
  "url('../assets/fonts/PretendardVariable.subset.woff2')",
  `url('data:font/woff2;base64,${b64('assets/fonts/PretendardVariable.subset.woff2')}')`,
  'css/style.css');
if (/url\(\s*(?!['"]?data:)/.test(css)) die('css/style.css: data: 로 못 바꾼 url() 이 남아 있다');

/* —— index.html —— */
let html = read('index.html');
const favicon = svgUri('favicon.svg');
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');

html = replaceOnce(html, '<link rel="icon" href="favicon.svg" type="image/svg+xml">', `<link rel="icon" href="${favicon}" type="image/svg+xml">`, 'index.html');
html = replaceOnce(html, '  <link rel="manifest" href="manifest.json">\n', '', 'index.html');
html = html.replace(/  <!-- 폰트는 css\/style\.css[^\n]*\n/, '');
html = replaceOnce(html, '  <link rel="preload" href="assets/fonts/PretendardVariable.subset.woff2" as="font" type="font/woff2" crossorigin>\n', '', 'index.html');
html = replaceOnce(html, '<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`, 'index.html');
html = replaceOnce(html, '<img class="ic" src="favicon.svg"', `<img class="ic" src="${favicon}"`, 'index.html');
html = html.replace(/src="assets\/cards\/([a-z]+)\.svg"/g, (_, id) => {
  if (!artIds.has(id)) die(`index.html: 그림 '${id}' 이 카드 그림에 없다`);
  return `src="${art[id]}"`;
});
html = replaceOnce(html, '<script type="module" src="js/app.js"></script>', `<script type="module">\n${esc(appScript)}\n</script>`, 'index.html');
html = html.replace(/  <script>\s*if \('serviceWorker' in navigator\)[\s\S]*?<\/script>\n/, '');

/* 남은 상대 경로가 있으면 file:// 에서 깨진다 */
// (스크립트·스타일 안의 글자는 빼고 본다 — 주석이나 문자열 조립까지 걸리지 않게)
const markup = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '');
const leftover = markup.match(/(?:src|href)="(?!data:|https?:|#)[^"]+"/g);
if (leftover) die(`index.html: 묶지 못한 경로가 남아 있다 — ${leftover.join(', ')}`);
if (html.includes('serviceWorker')) die('index.html: 서비스워커 등록이 남아 있다');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`✅ ${path.relative(ROOT, OUT)} — ${kb} KB (카드 ${cards.items.length}장)`);
