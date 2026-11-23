// 소개 영상에 쓸 **진짜 사이트 화면**을 찍는다 → intro/public/shots/*.png
// 그림을 따로 그리지 않는다. 사이트가 바뀌면 다시 찍으면 영상도 따라 바뀐다.
//
//   cd intro && node scripts/capture.mjs
//   (프리인스톨된 크로미움을 쓰려면 CHROME_PATH=/경로/chrome 을 함께)
//
// 두 가지를 조심한다.
//  1) 화면이 짧은 사이트(이야기·낱말)는 1920×1080 으로 찍으면 아래가 허옇게 빈다.
//     그래서 **내용 높이를 재서 창을 줄인 뒤** 다시 찍는다. 크기는 shots.json 에 남겨
//     영상 쪽에서 그 비율 그대로 띄운다.
//  2) 깊은 화면(게임 플레이·그리기·그림책)은 눌러서 들어가야 한다. 누를 곳을 못 찾으면
//     **조용히 넘기지 않고 멈춘다** — 빈 화면이 영상에 박히는 것보다 낫다.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  throw new Error('playwright 를 찾지 못했습니다. intro/ 에서 `npm install` 을 먼저 하세요.');
}

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const OUT = join(PUB, 'shots');
mkdirSync(OUT, { recursive: true });

// 여덟 사이트의 글귀와 개수(scripts/sites.mjs 가 모아보기에서 읽어 둔 것)
let SITES;
try {
  SITES = JSON.parse(readFileSync(join(PUB, 'sites.json'), 'utf8'));
} catch {
  throw new Error('public/sites.json 이 없습니다. `node scripts/sites.mjs` 를 먼저 돌리세요(npm run prep 이 순서대로 합니다).');
}

const W = 1920;
const H = 1080;
const MIN_H = 620; // 이보다 더 줄이지는 않는다(너무 납작하면 영상에서 보기 나쁘다)

const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2, // 2배로 찍어야 영상에서 글자가 또렷하다
  reducedMotion: 'no-preference',
});

const sizes = {};
const problems = [];

/** 한 장 찍는다. 내용이 창보다 짧으면 창을 줄여 아래 빈 곳을 없앤다. */
async function shoot(page, name, { fixed = false } = {}) {
  let h = H;
  if (!fixed) {
    // scrollHeight 는 쓸 수 없다 — 여덟 사이트 모두 바탕이 창 높이만큼 늘어나 늘 1080 이 나온다.
    // 그래서 **글자·그림이 실제로 끝나는 자리**(자식 없는 요소들의 가장 아래)를 재고 여백을 더한다.
    const content = await page.evaluate(() => {
      let bottom = 0;
      for (const el of document.querySelectorAll('body *')) {
        if (el.children.length || !el.getClientRects().length) continue; // 숨은 것·껍데기는 뺀다
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.bottom > bottom) bottom = r.bottom;
      }
      return bottom;
    });
    h = Math.max(MIN_H, Math.min(H, Math.ceil(content) + 56));
    if (h !== H) {
      await page.setViewportSize({ width: W, height: h });
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  sizes[name] = { w: W, h };
  console.log(`  · ${name}.png  ${W}×${h}`);
  if (h !== H) await page.setViewportSize({ width: W, height: H });
}

/** 눌러야 할 것이 없으면 멈춘다 — 조용히 넘어가면 빈 화면이 영상에 박힌다. */
async function must(page, selector, what) {
  const el = page.locator(selector).first();
  try {
    await el.waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    problems.push(`${what}: '${selector}' 를 찾지 못했습니다`);
    throw new Error(`${what}: '${selector}' 를 찾지 못했습니다 — 사이트가 바뀌었으면 이 파일을 고쳐야 합니다.`);
  }
  return el;
}

async function open(url, { wait = 1200 } = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(wait);
  if (errors.length) problems.push(`${url}: 자바스크립트 오류 ${errors[0]}`);
  return page;
}

// ── 1) 모아보기와 여덟 사이트의 첫 화면 ──────────────────────────────
const FRONTS = [
  ['home', 'home/'],
  ['game', 'game/'],
  ['quiz', 'quiz/'],
  ['word', 'word/'],
  ['story', 'story/'],
  ['video', 'video/'],
  ['1min', '1min/'],
  ['draw', 'draw/'],
  ['picturebook', 'picturebook/'],
];

console.log('첫 화면:');
for (const [name, url] of FRONTS) {
  const page = await open(url);
  // 모아보기 카드의 개수만 발행본과 맞춘다.
  // 저장소의 home/index.html 에 적힌 수는 낡아 있을 수 있다 — 발행 직전에 home.yml 이
  // scripts/sync-counts.mjs 로 데이터에서 다시 뽑아 넣기 때문이다. 여기서 그대로 찍으면
  // **사이트에는 없는 옛 숫자**가 영상에 박힌다(2026-11-23 실제로 그랬다: 문항 1,944 ·
  // 차시 영상 192 · 그림 44). 그래서 counts.json 의 값으로 덮어쓰고 찍는다.
  if (name === 'home') {
    const missing = await page.evaluate((sites) => {
      const left = [];
      for (const s of sites) {
        const el = document.querySelector(`.amt[data-count="${s.key}"]`);
        if (!el) left.push(s.key);
        else el.textContent = s.amt;
      }
      return left;
    }, SITES);
    if (missing.length) throw new Error(`모아보기에서 개수 칸을 찾지 못했습니다: ${missing.join(', ')}`);
    await page.waitForTimeout(200);
  }
  await shoot(page, name);

  // 여덟 아이콘도 모아보기에서 가져온다 — 영상에서 다시 그리지 않으려는 것이다.
  // 머리띠의 44px 바로가기를 오리면 영상에서 뿌옇다. 모아보기 안에 들어 있는 SVG 원본
  // (<symbol id="i-게임키">)을 480px 로 한 번 더 그려 찍는다. 로고가 바뀌면 다시 찍기만 하면 된다.
  if (name === 'home') {
    const ICON = 480;
    for (const s of SITES) {
      const ok = await page.evaluate(({ key, size }) => {
        if (!document.getElementById(`i-${key}`)) return false;
        // 투명 배경으로 찍으려면 바탕을 그리는 것이 없어야 한다(omitBackground 는 그려진 색을 못 지운다)
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
        document.getElementById('shot-icon')?.remove();
        const box = document.createElement('div');
        box.id = 'shot-icon';
        box.style.cssText = `position:fixed;left:0;top:0;width:${size}px;height:${size}px;z-index:9999`;
        box.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 100 100"><use href="#i-${key}"></use></svg>`;
        document.body.appendChild(box);
        return true;
      }, { key: s.key, size: ICON });
      if (!ok) throw new Error(`모아보기에 '#i-${s.key}' 아이콘이 없습니다. home/index.html 이 바뀌었나요?`);
      const file = `icon-${s.key}`;
      await page.screenshot({ path: join(OUT, `${file}.png`), clip: { x: 0, y: 0, width: ICON, height: ICON }, omitBackground: true });
      sizes[file] = { w: ICON, h: ICON };
    }
    await page.evaluate(() => {
      document.getElementById('shot-icon')?.remove();
      document.documentElement.style.background = '';
      document.body.style.background = '';
    });
    console.log(`  · icon-*.png  ${SITES.length}개 (${ICON}px)`);
  }
  // 헤더의 자매 사이트 바로가기만 따로 한 장.
  // 이야기 화면에서 찍는다 — 사이트는 **자기 자신을 빼고** 거는지라, 게임 화면에서 찍으면
  // 정작 맨 앞의 게임 아이콘이 없다. 좌우로 여백을 주면 옆 단추가 딸려 들어오므로 딱 맞게 오린다.
  if (name === 'story') {
    const bar = await must(page, '.jjam-switch', '바로가기 띠');
    const b = await bar.boundingBox();
    if (!b) throw new Error('바로가기 띠의 자리를 재지 못했습니다.');
    await page.screenshot({ path: join(OUT, 'switcher.png'), clip: b });
    sizes.switcher = { w: Math.round(b.width), h: Math.round(b.height) };
    console.log(`  · switcher.png  ${sizes.switcher.w}×${sizes.switcher.h}`);
  }
  await page.close();
}

// ── 2) 깊은 화면 — 실제로 눌러서 들어간다 ────────────────────────────
console.log('활동 화면:');

// 게임 하나를 실제로 플레이 중인 모습 (주사위 덧셈 — 전자칠판에 크게 뜨는 두 편 게임)
{
  const page = await open('game/games/dice-sum/', { wait: 900 });
  await (await must(page, '.btn-play', '게임 PLAY 단추')).click();
  await page.waitForTimeout(6500); // 3·2·1 세는 동안을 지나 실제로 노는 장면까지
  await shoot(page, 'game-play', { fixed: true });
  await page.close();
}

// 그리기: 첫 그림을 골라 한 획씩 그리는 중
{
  const page = await open('draw/', { wait: 1200 });
  await (await must(page, '#cardGrid li a, #cardGrid li button, #cardGrid li', '그리기 카드')).click();
  await (await must(page, '[data-act="start"]', '그리기 시작 단추')).click();
  await page.waitForTimeout(14000); // 획이 여러 개 그려질 만큼
  await shoot(page, 'draw-step', { fixed: true });
  await page.close();
}

// 그림책: 오늘의 그림책을 펴서 읽는 중
{
  const page = await open('picturebook/', { wait: 1200 });
  await (await must(page, '[data-act="today"]', '그림책 [이 책 읽기]')).click();
  await (await must(page, '#startBtn', '그림책 [읽어 주기 시작]')).click();
  await page.waitForTimeout(3500);
  await shoot(page, 'book-page', { fixed: true });
  await page.close();
}

// 낱말: 초성퀴즈를 켠 모습 (반 전체가 보고 외치는 큰 글자)
{
  const page = await open('word/', { wait: 1200 });
  await (await must(page, '#type-grid-quiz > *', '낱말 말놀이 카드')).click();
  await (await must(page, '#btn-start', '낱말 [시작] 단추')).click();
  await must(page, '#quiz-prompt', '낱말 문제');
  await page.waitForTimeout(1500);
  await shoot(page, 'word-play', { fixed: true });
  await page.close();
}

writeFileSync(join(OUT, 'shots.json'), JSON.stringify(sizes, null, 2) + '\n');
await browser.close();
server.close();

if (problems.length) {
  console.error('\n⚠ 찍는 중에 걸린 것:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`\n찍음: ${OUT} (${Object.keys(sizes).length}장)`);
