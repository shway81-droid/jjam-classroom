/* ===================================================================
   다섯 사이트가 공유하는 파일의 이탈 감지·동기화
   ===================================================================
   폴더는 다섯이지만 아래 파일들은 글자 하나까지 같아야 한다. 헤더의 자매 사이트
   바로가기와 웹폰트가 그렇다 — 한쪽만 고치면 사이트마다 다른 글씨체·다른
   바로가기가 되어 버린다.

   왜 한 벌로 줄이지 않았나
     폰트와 스위처는 각 사이트가 **배포될 때 자기 루트에** 갖고 있어야 한다.
     저장소 루트에 한 벌만 두면 `game/index.html` 의 `shared/jjam-switcher.js`
     경로가 안 맞고, `../shared/` 로 바꾸면 배포된 사이트에서 사이트 루트를
     벗어나 404 가 난다. 심볼릭 링크나 빌드 단계를 쓰면 되지만, 이 프로젝트는
     **빌드 단계 없음**이 원칙이고 심링크는 윈도우 체크아웃에서 말썽이다.

     그래서 파일은 다섯 벌로 두되, **손으로 고치는 것은 game/ 한 벌**로 정했다.
     나머지 넷은 이 스크립트가 만든다. CI 가 --check 로 어긋남을 막는다.

   상류는 `game/` 이다 (저장소를 합치기 전 jjam 이 상류였던 것을 그대로 잇는다).

   쓰는 법
     node scripts/sync-shared.mjs           game/ 내용으로 나머지 넷을 맞춘다
     node scripts/sync-shared.mjs --check   어긋난 곳만 알려 준다 (고치지 않음)
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const SOURCE = 'game';
const TARGETS = ['quiz', 'video', 'story', 'word'];

// 다섯 폴더에서 동일해야 하는 파일 (폴더 기준 상대경로).
// 여기 없는 파일은 사이트마다 다른 것이 정상 — index.html·sw.js·데이터가 그렇다.
// game/shared/style.css 와 game/shared/engine.js 는 게임 전용이라 들어가지 않는다.
const SHARED = [
  'shared/jjam-switcher.js',
  'scripts/check-font-coverage.mjs',
  'assets/fonts/PretendardVariable.subset.woff2',
  'assets/fonts/coverage.txt',
  'assets/fonts/LICENSE.txt',
];

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

let drift = 0;
let copied = 0;
let same = 0;

for (const rel of SHARED) {
  const srcPath = path.join(ROOT, SOURCE, rel);
  if (!fs.existsSync(srcPath)) {
    console.error(`✖ 상류에 없다: ${SOURCE}/${rel}`);
    process.exit(1);
  }
  const src = fs.readFileSync(srcPath);

  for (const t of TARGETS) {
    const dstPath = path.join(ROOT, t, rel);
    const exists = fs.existsSync(dstPath);
    const equal = exists && sha(fs.readFileSync(dstPath)) === sha(src);

    if (equal) {
      same++;
      continue;
    }

    drift++;
    const mark = exists ? '↻ 다름' : '＋ 없음';
    if (CHECK) {
      console.error(`  ${mark}  ${t}/${rel}`);
    } else {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.writeFileSync(dstPath, src);
      copied++;
      console.log(`  ${mark} → ${t}/${rel} 갱신`);
    }
  }
}

if (CHECK) {
  if (drift) {
    console.error(
      `\n✖ 공통 파일 ${drift}곳이 ${SOURCE}/ 와 다르다.\n` +
        `  고치려면: node scripts/sync-shared.mjs\n` +
        `  (공통 파일은 ${SOURCE}/ 한 곳에서만 고친다 — 나머지는 이 스크립트가 만든다)`
    );
    process.exit(1);
  }
  console.log(`✅ 공통 파일 ${SHARED.length}종이 다섯 폴더에서 모두 일치 (${same}건 확인)`);
} else {
  console.log(
    copied
      ? `\n✅ 동기화 완료 — 갱신 ${copied}개 / 이미 일치 ${same}개`
      : `\n✅ 이미 모두 일치 (${same}건)`
  );
}
