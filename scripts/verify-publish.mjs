/* 발행 확인 — 아홉 사이트(여덟 발행 저장소 + 모아보기)에 지금 main 내용이 올라가 있는지 본다.
 *
 *   node scripts/verify-publish.mjs              한 번 보고 끝낸다
 *   node scripts/verify-publish.mjs --wait 900   다 맞을 때까지 30초마다 다시 본다(최대 900초)
 *   node scripts/verify-publish.mjs --ref <커밋>  origin/main 대신 이 커밋과 견준다
 *   node scripts/verify-publish.mjs --no-fetch   git fetch 를 하지 않는다
 *
 * 왜 만들었나 (2026-11-14) — 퀴즈가 1분 사이에 두 번 발행됐고, GitHub 기록은 나중 배포가 '성공'인데
 * 사이트에는 **앞 배포의 옛 내용**이 나왔다. 발행 워크플로는 배포만 하고 끝나서 아무도 몰랐다.
 * 루트 CLAUDE.md 5절의 '아홉 줄' 확인을 사람이 손으로 돌릴 때만 드러났다. 그 확인을 기계가 하게 한다.
 *
 * 어떻게 판정하나 — 각 사이트 sw.js 의 캐시 이름에는 발행할 때의 커밋 번호가 박혀 있다.
 * 사이트는 **자기 폴더가 바뀔 때만** 다시 발행되므로 커밋 번호가 main 과 같을 필요는 없다.
 * 대신 "그 커밋과 main 사이에 그 사이트를 만드는 파일이 하나도 안 바뀌었는가"를 git 으로 본다.
 *   ✓ 최신      — 바뀐 것 없음
 *   ✖ 옛 내용   — 그 뒤로 사이트 파일이 바뀌었는데 발행이 안 됐거나, 앞 배포가 다시 올라왔다
 *                 (커밋 번호 없이 'jjamquiz-v3' 같은 이름만 나와도 옛 내용이다)
 *   ? 판정 불가 — sw.js 를 못 받았다. **조용히 빠지지 않게** 줄로 남긴다(5절의 함정)
 * 줄은 늘 아홉 줄이다. 끝 코드: 모두 ✓ 이면 0, 아니면 1.
 *
 * GitHub Actions 안에서 돌면($GITHUB_OUTPUT) `bad`(문제 있는 폴더, 빈칸으로 구분)와 `report`(표)를 남긴다.
 * 쓰는 곳: .github/workflows/publish-verify.yml
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// 폴더 → 발행 저장소. `paths` 는 그 사이트의 발행 묶음이 나오는 파일들이다.
// 여덟 사이트는 자기 폴더만 복사해 발행한다(각 저장소 publish.yml). 모아보기는 home.yml 이
// home/ 에 더해 개수를 뽑는 데이터·스크립트까지 본다 — home.yml 의 push.paths 와 맞춘다.
const SITES = [
  { folder: 'game', name: '게임', repo: 'jjam' },
  { folder: 'quiz', name: '퀴즈', repo: 'jjam-quiz' },
  { folder: 'video', name: '영상', repo: 'jjam-video' },
  { folder: 'story', name: '이야기', repo: 'jjam-story' },
  { folder: 'word', name: '낱말', repo: 'jjam-word' },
  { folder: '1min', name: '수업영상', repo: 'jjam-1min' },
  { folder: 'draw', name: '그리기', repo: 'jjam-draw' },
  { folder: 'picturebook', name: '그림책', repo: 'jjam-picturebook' },
  {
    folder: 'home', name: '모아보기', repo: 'jjam-classroom',
    paths: [
      'home', '.github/workflows/home.yml', 'scripts/sync-counts.mjs',
      'game/games/**/game.json', 'quiz/games/**/game.json',
      'word/data/words.json', 'story/data/stories.json', 'video/data/videos.json',
      '1min/data/lessons.json', 'draw/data/drawings.json', 'picturebook/data/books.json',
    ],
  },
];
const OWNER = 'shway81-droid';
const POLL = 30;     // 다시 볼 간격(초)
const CONFIRM = 60;  // 다 맞으면 이만큼 뒤 한 번 더 본다 — 잠깐 맞았다 옛것으로 돌아간 일이 있었다

// ── 인자 ───────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const WAIT = Number(opt('--wait') || 0);
const REF = opt('--ref') || 'origin/main';
const FETCH = !argv.includes('--no-fetch') && !opt('--ref');

const git = (...a) => execFileSync('git', a, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function liveVersion(site) {
  const url = `https://${OWNER}.github.io/${site.repo}/sw.js?verify=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return { error: `sw.js 를 못 받음 (HTTP ${res.status})` };
    const m = (await res.text()).match(/(?:CACHE(?:_NAME)?|VERSION) = '([^']*)'/);
    if (!m) return { error: 'sw.js 에 캐시 이름이 없음' };
    return { version: m[1], sha: m[1].match(/-([0-9a-f]{7,40})$/)?.[1] };
  } catch (e) {
    return { error: `sw.js 를 못 받음 (${e.name === 'TimeoutError' ? '20초 넘김' : e.message})` };
  }
}

function judge(site, live, ref) {
  if (live.error) return { mark: '?', note: `판정 불가 — ${live.error}` };
  if (!live.sha) return { mark: '✖', note: '커밋 번호 없는 이름 — 옛 내용' };
  try {
    git('cat-file', '-e', `${live.sha}^{commit}`);
  } catch {
    return { mark: '✖', note: `${live.sha} 를 이 저장소 기록에서 못 찾음` };
  }
  const changed = git('diff', '--name-only', live.sha, ref, '--', ...(site.paths || [site.folder]))
    .split('\n').filter(Boolean);
  if (!changed.length) return { mark: '✓', note: '최신' };
  // 견준 커밋보다 사이트가 더 새것이면(그 사이 머지가 또 있었으면) 옛 내용이 아니다.
  try {
    git('merge-base', '--is-ancestor', ref, live.sha);
    return { mark: '✓', note: `견준 커밋보다 새것 (${live.sha})` };
  } catch { /* 새것이 아니다 — 아래에서 옛 내용으로 */ }
  return { mark: '✖', note: `옛 내용 — ${live.sha} 뒤로 ${changed.length}개 파일이 바뀜 (예: ${changed[0]})` };
}

async function checkAll() {
  if (FETCH) {
    try { git('fetch', '-q', 'origin', 'main'); } catch (e) { console.error(`git fetch 실패: ${e.message}`); }
  }
  const ref = git('rev-parse', '--short', REF);
  const rows = await Promise.all(SITES.map(async (s) => {
    const live = await liveVersion(s);
    return { ...s, live, ...judge(s, live, ref) };
  }));
  return { ref, rows };
}

function table({ ref, rows }) {
  const lines = rows.map((r) =>
    `${r.mark} ${r.name.padEnd(5, '　')} ${r.repo.padEnd(17)} ${(r.live.version || '-').padEnd(30)} ${r.note}`);
  return [`기준: ${REF} (${ref})`, ...lines].join('\n');
}

// ── 실행 ───────────────────────────────────────────────────────────
const deadline = Date.now() + WAIT * 1000;
let result = await checkAll();
for (;;) {
  const bad = result.rows.filter((r) => r.mark !== '✓');
  if (!bad.length) {
    if (!WAIT) break;
    // 다 맞았다 — 잠깐 뒤 한 번 더 본다. 그래도 맞으면 끝.
    console.log(`${new Date().toISOString().slice(11, 19)} 아홉 곳 모두 최신 — ${CONFIRM}초 뒤 한 번 더 봅니다`);
    await sleep(CONFIRM);
    result = await checkAll();
    if (result.rows.every((r) => r.mark === '✓')) break;
    continue;
  }
  if (Date.now() + POLL * 1000 > deadline) break;
  console.log(`${new Date().toISOString().slice(11, 19)} 기다리는 중: ${bad.map((r) => `${r.name}(${r.mark})`).join(' ')}`);
  await sleep(POLL);
  result = await checkAll();
}

const report = table(result);
console.log(report);
const bad = result.rows.filter((r) => r.mark !== '✓');
if (result.rows.length !== SITES.length) throw new Error('줄 수가 아홉이 아닙니다'); // 빠진 줄이 정상처럼 보이지 않게

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `bad=${bad.map((r) => r.folder).join(' ')}\nreport<<__REPORT__\n${report}\n__REPORT__\n`);
}
if (bad.length) {
  console.log(`\n✖ 최신이 아닌 곳 ${bad.length}곳: ${bad.map((r) => r.name).join(', ')}`);
  process.exit(1);
}
console.log('\n✓ 아홉 곳 모두 최신');
