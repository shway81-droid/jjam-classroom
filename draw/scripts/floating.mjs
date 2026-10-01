// 떠 있는 획 비율을 잽니다. 열린 획의 양 끝 중 하나라도 앞서 그린 획 위(4 단위 안)에 없으면 떠 있는 획입니다.
//   node scripts/floating.mjs                 → list.json 전체 + 시안(*-v2)
//   node scripts/floating.mjs cat-face cat-v2 → 고른 그림만
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readList, readDrawing } from './bundle.mjs';
import { floatingReport } from './path-geom.mjs';

const trials = readdirSync(join(ROOT, 'drawings')).filter((f) => f.endsWith('-v2'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : [...readList(), ...trials];
for (const id of ids) {
  const r = floatingReport(readDrawing(id));
  const pct = (r.ratio * 100).toFixed(0).padStart(3);
  console.log(`${id.padEnd(14)} 획 ${String(r.total).padStart(2)}개 (열린 ${r.open} · 닫힌 ${r.closed}) · 떠 있는 획 ${r.floating.length}개 = ${pct}%`);
  for (const f of r.floating) console.log(`    #${f.step}.${f.stroke} ${f.label} — 끝점이 앞 획에서 ${f.off.join(' / ')} 떨어짐`);
}
