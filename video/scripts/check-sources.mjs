/* ===================================================================
   영상 출처 검증 — 적어 둔 채널이 진짜인가, 영상이 아직 살아 있는가
   ===================================================================
   validate-data.mjs 는 네트워크 없이 도는 빠른 관문이라
   "channel 이 승인 목록에 있는가"까지만 본다. 그것만으로는
   승인된 채널명을 적어 두고 엉뚱한 영상을 넣는 것을 막지 못한다.

   여기서 유튜브에 직접 물어 두 가지를 본다.

     1. 영상이 아직 재생되는가   삭제·비공개·차단되면 교실에서 검은 화면이 뜬다
     2. 실제 업로더 = 적어 둔 channel 인가

   2번이 이 스크립트의 핵심이다. 유해 영상이 섞여 든 두 번의 사고
   (3분휴지 '스승의 날 특집', 현대불교 '불교 문화 이야기')는 둘 다
   제목·소개가 그럴듯했고 채널만 달랐다. 사람이 고쳐 적는 제목과 달리
   업로더는 유튜브가 알려 주므로 속일 수 없다.

   유튜브 oEmbed 공개 엔드포인트만 쓴다 — API 키가 필요 없다.

   실행:
     node scripts/check-sources.mjs               전체 점검
     node scripts/check-sources.mjs --since REF   그 커밋 이후 새로 생기거나
                                                  출처가 바뀐 영상만 (PR 용)
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'data', 'videos.json');

const OEMBED = 'https://www.youtube.com/oembed';
const CONCURRENCY = 6;      // 유튜브에 몰아치지 않을 정도
const RETRIES = 3;          // 일시적인 네트워크 실패용 — 404/401 은 재시도하지 않는다
const TIMEOUT_MS = 20000;

const sinceIdx = process.argv.indexOf('--since');
const SINCE = sinceIdx !== -1 ? process.argv[sinceIdx + 1] : null;
if (sinceIdx !== -1 && !SINCE) {
  console.error('  ✗ --since 에는 비교할 git 참조를 함께 적어 주세요 (예: --since origin/main)');
  process.exit(1);
}

const videos = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

// ── 무엇을 볼지 고르기 ───────────────────────────────────────────
// PR 에서는 바뀐 것만 본다. 400편을 매번 조회하면 느리고, 유튜브가
// 잠시 응답을 안 하는 날 관계없는 PR 까지 빨간불이 된다.
let targets = videos;
if (SINCE) {
  let before;
  try {
    const raw = execFileSync('git', ['show', `${SINCE}:video/data/videos.json`], {
      cwd: path.join(ROOT, '..'), encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024,
    });
    before = new Map(JSON.parse(raw).map((v) => [v.id, v]));
  } catch (e) {
    console.error(`  ✗ ${SINCE} 의 videos.json 을 읽지 못했습니다 — ${e.message.split('\n')[0]}`);
    console.error('    (얕은 체크아웃이면 비교 대상 브랜치를 먼저 fetch 해야 합니다)');
    process.exit(1);
  }
  targets = videos.filter((v) => {
    const old = before.get(v.id);
    return !old || old.youtubeId !== v.youtubeId || old.channel !== v.channel;
  });
}

if (targets.length === 0) {
  console.log('\n✅ 출처 검증 — 새로 추가되거나 출처가 바뀐 영상이 없습니다.');
  process.exit(0);
}

// ── 조회 ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSource(v) {
  const url = `${OEMBED}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${v.youtubeId}`)}&format=json`;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      // 400·401·403·404 는 "그런 영상이 없다/못 본다"는 확정적인 답이다. 재시도는 낭비다.
      // (유튜브는 없는 ID 에 400, 삭제·비공개에 401/403/404 를 준다)
      if ([400, 401, 403, 404].includes(res.status)) {
        return { dead: `재생할 수 없습니다 (HTTP ${res.status} — 삭제·비공개·지역차단이거나 잘못된 영상 ID)` };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      return { title: d.title, channel: d.author_name };
    } catch (e) {
      if (attempt === RETRIES) return { unreachable: e.message };
      await sleep(1000 * attempt);
    }
  }
  return { unreachable: '알 수 없음' };
}

const errors = [];
const queue = [...targets];
async function worker() {
  while (queue.length) {
    const v = queue.shift();
    const r = await fetchSource(v);
    const where = `${v.id} '${v.title}'`;
    if (r.dead) {
      errors.push(`${where}: ${r.dead}`);
    } else if (r.unreachable) {
      // 조회 자체가 안 된 것은 데이터 잘못이 아니다 — 조용히 통과시키지 않고 실패시킨다.
      errors.push(`${where}: 유튜브에 물어보지 못했습니다 (${r.unreachable}) — 네트워크를 확인해 주세요.`);
    } else if (r.channel !== v.channel) {
      errors.push(
        `${where}: 적어 둔 채널과 실제 업로더가 다릅니다.\n` +
        `      적힌 채널: ${v.channel}\n` +
        `      실제 업로더: ${r.channel}\n` +
        `      실제 제목: ${r.title}`
      );
    }
  }
}

console.log(`  · ${targets.length}편의 출처를 유튜브에 확인합니다${SINCE ? ` (${SINCE} 이후 바뀐 것만)` : ''}...`);
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

for (const e of errors) console.error(`  ✗ ${e}`);

if (errors.length) {
  console.error(`\n❌ 출처 검증 실패 — ${errors.length}건`);
  process.exit(1);
}

console.log(`\n✅ 출처 검증 통과 — ${targets.length}편 모두 재생 가능하고 채널이 일치합니다.`);
