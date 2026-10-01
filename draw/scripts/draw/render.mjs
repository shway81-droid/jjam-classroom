// 그림 완성본(refs/<id>-strokes.svg)을 굵은 선 PNG로 찍습니다 — 귀여운지, 선이 뭉치지 않는지 눈으로 봅니다.
//   node scripts/draw/render.mjs <out.png> <id> [id...]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../bundle.mjs';

const [out, ...ids] = process.argv.slice(2);
const { chromium } = await import('playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
const cells = ids.map((id) => `<div style="width:500px;height:500px;display:grid;place-items:center;border:1px solid #ddd">${readFileSync(join(ROOT, 'refs', `${id}-strokes.svg`), 'utf8')}</div>`).join('');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 500 * ids.length, height: 500 } });
await p.setContent(`<body style="margin:0;display:flex">${cells}</body>`);
await p.screenshot({ path: out });
await b.close();
console.log(out);
