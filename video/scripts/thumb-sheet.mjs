/* ===================================================================
   썸네일 검토판 — 카드에 뜰 그림을 한 화면에서 훑어본다
   ===================================================================
   기계가 못 보는 것이 하나 남는다. "이 그림을 교실 화면에 띄워도 되는가".

   실제로 두 번 다 썸네일이 결정적이었다. '스승의 날 특집'은 제목·소개가
   멀쩡했고, '불교 문화 이야기'는 썸네일에 총구를 겨눈 장면이 있었다.
   validate-data.mjs 도 check-sources.mjs 도 이건 못 잡는다.

   그래서 자동으로 판정하지 않고, 사람이 1초에 한 장씩 넘겨볼 수 있게
   HTML 한 장으로 모아 준다. 영상을 추가한 뒤 이 파일을 열어 보면 된다.

   썸네일은 유튜브(i.ytimg.com)에서 바로 불러오므로 내려받지 않는다
   → 의존성이 없고, 만들어진 HTML 은 열 때 인터넷이 필요하다.

   실행:
     node scripts/thumb-sheet.mjs                전체
     node scripts/thumb-sheet.mjs --since REF    그 커밋 이후 새로 생긴 영상만
     node scripts/thumb-sheet.mjs --out 경로.html

   기본 출력: thumb-sheet.html (.gitignore 에 있다 — 검토용이라 커밋하지 않는다)
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const videos = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'videos.json'), 'utf-8'));

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
};
const SINCE = arg('--since');
const OUT = path.resolve(ROOT, arg('--out') || 'thumb-sheet.html');

let targets = videos;
if (SINCE) {
  let before;
  try {
    const raw = execFileSync('git', ['show', `${SINCE}:video/data/videos.json`], {
      cwd: path.join(ROOT, '..'), encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024,
    });
    before = new Set(JSON.parse(raw).map((v) => v.id));
  } catch (e) {
    console.error(`  ✗ ${SINCE} 의 videos.json 을 읽지 못했습니다 — ${e.message.split('\n')[0]}`);
    process.exit(1);
  }
  targets = videos.filter((v) => !before.has(v.id));
}

if (targets.length === 0) {
  console.log('새로 추가된 영상이 없습니다 — 검토판을 만들지 않았습니다.');
  process.exit(0);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const cards = targets.map((v) => `
  <a class="c" href="https://www.youtube.com/watch?v=${esc(v.youtubeId)}" target="_blank" rel="noopener">
    <img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/hqdefault.jpg" alt="">
    <div class="t">${esc(v.title)}</div>
    <div class="m"><b>${esc(v.channel)}</b> · ${esc(v.topic)} · ${esc(v.minutes)}분</div>
  </a>`).join('');

fs.writeFileSync(OUT, `<!doctype html><html lang="ko"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>썸네일 검토판 — ${targets.length}편</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; padding:16px; font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif; }
  h1 { font-size:18px; margin:0 0 4px; }
  p.lead { margin:0 0 16px; opacity:.75; }
  .g { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
  .c { display:block; color:inherit; text-decoration:none; }
  .c img { width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:8px; background:#8883; display:block; }
  .t { margin-top:6px; font-weight:600; }
  .m { opacity:.7; font-size:12px; }
  .c:hover .t { text-decoration:underline; }
</style>
<h1>썸네일 검토판 — ${targets.length}편${SINCE ? ` <span style="font-weight:400;opacity:.7">(${esc(SINCE)} 이후 추가분)</span>` : ''}</h1>
<p class="lead">교실 화면에 띄워도 되는 그림인지 훑어보세요. 카드를 누르면 유튜브에서 영상이 열립니다.</p>
<div class="g">${cards}
</div>
</html>
`);

console.log(`\n✅ 썸네일 검토판 — ${targets.length}편`);
console.log(`   ${path.relative(process.cwd(), OUT)} 를 브라우저로 열어 확인해 주세요.`);
