// 렌더 전에 한 번: 글꼴 · 효과음 · 개수 · 배경음악 · 사이트 화면
// 만들어지는 것은 모두 intro/public/ 아래이고 **저장소에는 넣지 않는다**(.gitignore).
//
//   cd intro && npm run prep
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (...p) => join(HERE, 'public', ...p);
const run = (script) => execFileSync(process.execPath, [join(HERE, 'scripts', script)], { stdio: 'inherit' });

// 1) 글꼴: Pretendard 전체(SIL OFL 1.1).
//    사이트들이 쓰는 것은 자주 쓰는 글자만 남긴 서브셋인데, 영상 자막에는 거기 없는
//    글자도 나온다. 그래서 영상만 전체 글꼴을 쓴다.
mkdirSync(pub('fonts'), { recursive: true });
for (const w of ['Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black']) {
  copyFileSync(join(HERE, 'node_modules/pretendard/dist/web/static/woff2', `Pretendard-${w}.woff2`), pub('fonts', `Pretendard-${w}.woff2`));
}
console.log('글꼴: 다섯 굵기 복사');

// 1-2) 로고: 모아보기의 favicon.svg 를 그대로 쓴다(영상에서 다시 그리지 않는다)
copyFileSync(join(HERE, '..', 'home', 'favicon.svg'), pub('logo.svg'));

// 2) 효과음: Remotion 이 제공하는 짧은 소리
mkdirSync(pub('sfx'), { recursive: true });
for (const name of ['whoosh', 'mouse-click', 'ding']) {
  const file = pub('sfx', `${name}.wav`);
  if (existsSync(file)) continue;
  const res = await fetch(`https://remotion.media/${name}.wav`);
  if (!res.ok) throw new Error(`효과음 ${name} 을 받지 못했습니다 (${res.status})`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}
console.log('효과음: whoosh · mouse-click · ding');

// 3) 여덟 사이트의 글귀·개수: 모아보기에서 읽는다(손으로 적지 않는다). 4)번이 이 값을 쓴다.
run('sites.mjs');

// 4) 사이트 화면: 저장소를 띄워 진짜 화면을 찍는다
run('capture.mjs');

// 5) 배경음악: 코드로 만든 곡
run('make-bgm.mjs');

console.log('\n준비 끝 — `npm run render` 또는 `npm run dev`');
