#!/usr/bin/env node
/**
 * engine.js onTap 터치 회귀 검사 (크로미움, 터치 에뮬레이션)
 *
 * 사용법: node scripts/touch-tap.test.js   (npm run test:touch)
 *
 * browser-verify.js 는 마우스로 플레이하므로 터치에서만 생기는 문제를 못 본다.
 * 크로미움은 disabled 버튼에 click 은 안 보내지만 touchstart 는 보낸다 —
 * onTap 이 이걸 걸러야 전자칠판에서 꺼 둔 버튼(시간 초과로 공개된 정답 등)이 눌리지 않는다.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ENGINE = fs.readFileSync(path.join(__dirname, '..', 'shared', 'engine.js'), 'utf-8');

const PAGE = `<!doctype html><html><body>
  <button id="off" disabled style="position:absolute;left:0;top:0;width:100px;height:60px">off</button>
  <button id="on" style="position:absolute;left:120px;top:0;width:100px;height:60px">on</button>
  <div id="box" style="position:absolute;left:0;top:100px;width:240px;height:60px">
    <button id="boxOff" disabled style="width:100px;height:60px">boxOff</button>
    <button id="boxOn" style="width:100px;height:60px">boxOn</button>
  </div>
</body></html>`;

async function main() {
  const exe = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch({ headless: true, executablePath: exe || undefined });
  const ctx = await browser.newContext({ hasTouch: true, viewport: { width: 400, height: 300 } });
  const page = await ctx.newPage();
  await page.setContent(PAGE);
  await page.addScriptTag({ content: ENGINE });
  await page.evaluate(() => {
    window.hits = { off: 0, on: 0, box: [] };
    onTap(document.getElementById('off'), () => hits.off++);
    onTap(document.getElementById('on'), () => hits.on++);
    onTap(document.getElementById('box'), (e) => hits.box.push(e.target.id));
  });

  const results = [];
  const expect = (name, actual, wanted) => {
    const ok = JSON.stringify(actual) === JSON.stringify(wanted);
    results.push({ name, ok, actual, wanted });
  };

  await page.touchscreen.tap(50, 30);    // disabled 버튼
  await page.touchscreen.tap(170, 30);   // 켜진 버튼
  await page.touchscreen.tap(50, 130);   // 부모에 onTap — disabled 자식
  await page.touchscreen.tap(150, 130);  // 부모에 onTap — 켜진 자식
  let h = await page.evaluate(() => JSON.parse(JSON.stringify(hits)));
  expect('터치: disabled 버튼은 무시', h.off, 0);
  expect('터치: 켜진 버튼은 1회', h.on, 1);
  expect('터치: 부모 onTap 에서 disabled 자식은 무시, 켜진 자식만', h.box, ['boxOn']);

  // 터치 직후 마우스 클릭이 영구히 한 번 먹히던 문제 — 잠시 뒤 마우스 클릭은 통해야 한다
  await page.waitForTimeout(700);
  await page.mouse.click(170, 30);
  h = await page.evaluate(() => hits.on);
  expect('터치 뒤 마우스 클릭도 1회로 인정', h, 2);

  await page.mouse.click(50, 30);
  h = await page.evaluate(() => hits.off);
  expect('마우스: disabled 버튼은 무시', h, 0);

  await browser.close();

  console.log('\n=== onTap 터치 회귀 검사 ===\n');
  let failed = 0;
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}` + (r.ok ? '' : ` — 기대 ${JSON.stringify(r.wanted)}, 실제 ${JSON.stringify(r.actual)}`));
    if (!r.ok) failed++;
  }
  console.log(`\n결과: ${results.length - failed}/${results.length} 통과`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
