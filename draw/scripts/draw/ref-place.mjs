// 참조 선화(refs/<id>.png)를 그림의 viewBox 좌표로 옮긴 2배 PNG를 만듭니다 — 따라 그리기 밑판.
// ImageMagick(convert)이 필요합니다. 그림이 viewBox 안쪽 maxW×maxH 에 꽉 차게, 가운데에 놓입니다.
//   node scripts/draw/ref-place.mjs <id> <portrait|landscape> [maxW] [maxH] [out.png]
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from '../bundle.mjs';

const args = process.argv.slice(2);
// 출력 경로(.png)는 크기 인자 없이 바로 와도 됩니다.
const outArg = args.find((a, i) => i > 0 && a.endsWith('.png'));
const [id, paper = 'portrait', mw, mh] = args.filter((a) => a !== outArg);
const [W, H] = paper === 'landscape' ? [500, 400] : [400, 500];
const maxW = Number(mw || W * 0.8);
const maxH = Number(mh || H * 0.8);
const src = join(ROOT, 'refs', `${id}.png`);
const out = outArg || `/tmp/${id}-ref.png`;
const info = execFileSync('convert', [src, '-colorspace', 'gray', '-threshold', '60%', '-negate', '-trim', 'info:-']).toString().split(' ');
const [w, h] = info[2].split('x').map(Number);
const [, ox, oy] = info[3].split('+').map(Number);
const s = Math.min(maxW / w, maxH / h);
const tx = W / 2 - (ox + w / 2) * s;
const ty = H / 2 - (oy + h / 2) * s;
const S = 2;
const off = (v) => (v >= 0 ? `+${Math.round(v)}` : `${Math.round(v)}`);
execFileSync('convert', [src, '-resize', `${100 * s * S}%`, '-background', 'white', '-gravity', 'northwest',
  '-extent', `${W * S}x${H * S}${off(-tx * S)}${off(-ty * S)}`, out]);
console.log(`${out} — viewBox 0 0 ${W} ${H}, 배율 ${s.toFixed(4)}`);
