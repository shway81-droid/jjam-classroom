// 그림 생성기 — scripts/draw/<id>.mjs 가 그림의 원본이고, drawings/<id>/drawing.json 은 그 결과입니다.
// 참조 선화는 refs/<id>.png(AI 생성 원본)·refs/<id>.svg(potrace)이고, 좌표는 원본을 viewBox 에 맞춰 놓고 읽었습니다.
//
//   npm run draw            → 전부 다시 만들고 data/drawings.json 까지 묶습니다
//   npm run draw -- owl     → 고른 그림만
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, readList, bundleText } from '../bundle.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const strokesSvg = (dw) => {
  const [, , w, h] = dw.viewBox.split(' ');
  const paths = dw.steps.flatMap((s) => s.d).map((d) => `  <path d="${d}"/>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${dw.viewBox}" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#fff"/>
  <g fill="none" stroke="#111" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
${paths}
  </g>
</svg>
`;
};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : readList();
mkdirSync(join(ROOT, 'refs'), { recursive: true });
for (const id of ids) {
  const file = join(HERE, `${id}.mjs`);
  if (!existsSync(file)) { console.log(`${id} — 원본 없음, 건너뜀`); continue; }
  const dw = (await import(pathToFileURL(file).href)).default();
  if (dw.id !== id) throw new Error(`${file} 의 id 가 ${dw.id} 입니다`);
  mkdirSync(join(ROOT, 'drawings', id), { recursive: true });
  writeFileSync(join(ROOT, 'drawings', id, 'drawing.json'), JSON.stringify(dw, null, 2) + '\n');
  writeFileSync(join(ROOT, 'refs', `${id}-strokes.svg`), strokesSvg(dw));
  console.log(`${id} — ${dw.steps.length}단계`);
}
writeFileSync(join(ROOT, 'data', 'drawings.json'), bundleText(), 'utf8');
