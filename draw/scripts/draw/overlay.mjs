// 따라 그리기 밑판(ref-place.mjs 결과) 위에 격자와 그림 획을 겹쳐 PNG로 찍습니다. 단계마다 색이 다릅니다.
// Playwright(chromium)가 필요합니다.
//   node scripts/draw/overlay.mjs <밑판.png> <out.png> [drawings/<id>/drawing.json] [portrait|landscape]
import { readFileSync, existsSync } from 'node:fs';

const [ref, out, json, paperArg] = process.argv.slice(2);
const dw = json && existsSync(json) ? JSON.parse(readFileSync(json, 'utf8')) : null;
const paper = dw ? dw.paper : (paperArg || 'portrait');
const [W, H] = paper === 'landscape' ? [500, 400] : [400, 500];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
const img = 'data:image/png;base64,' + readFileSync(ref).toString('base64');
let grid = '';
for (let x = 0; x <= W; x += 20) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${x % 100 ? '#cde' : '#79c'}" stroke-width="${x % 100 ? 0.5 : 1}"/>` + (x % 40 ? '' : `<text x="${x + 1}" y="9" font-size="7" fill="#36a">${x}</text>`);
for (let y = 0; y <= H; y += 20) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${y % 100 ? '#cde' : '#79c'}" stroke-width="${y % 100 ? 0.5 : 1}"/>` + (y % 40 ? '' : `<text x="1" y="${y - 1}" font-size="7" fill="#36a">${y}</text>`);
let paths = '';
if (dw) dw.steps.forEach((s, i) => s.d.forEach((p) => { paths += `<path d="${p}" fill="none" stroke="hsl(${(i * 47) % 360} 90% 45%)" stroke-width="3" stroke-linecap="round" opacity=".85"/>`; }));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><image href="${img}" width="${W}" height="${H}" opacity="${dw ? 0.45 : 1}"/>${grid}${paths}</svg>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W * 2, height: H * 2 } });
await p.setContent(`<body style="margin:0">${svg}</body>`);
await p.screenshot({ path: out });
await b.close();
console.log(out);
