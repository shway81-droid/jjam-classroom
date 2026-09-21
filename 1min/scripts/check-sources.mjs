/* ===================================================================
   출처 검증 — 등록된 영상이 정말 내 채널의 살아 있는 영상인지
   ===================================================================
   짬짬이 영상의 check-sources.mjs 를 이 사이트에 맞게 줄였다.

   짬짬이 영상은 "적어 둔 채널명과 실제 업로더가 같은가"를 봤다(남의 영상을
   큐레이션하므로). 이 사이트의 영상은 전부 내가 만들어 내 채널에 올린 것이라
   볼 것이 둘로 줄어든다.

     1. 그 영상이 아직 살아 있는가 — 삭제·비공개로 바뀌면 교실 화면이 검게 뜬다
     2. 업로더가 내 채널인가 — 데이터에 남의 영상 ID 를 잘못 적는 것을 막는다

   유튜브 oEmbed 공개 엔드포인트만 쓴다. API 키가 필요 없다.

   실행
     node scripts/check-sources.mjs                 전수
     node scripts/check-sources.mjs --since <sha>   그 커밋 이후 바뀐 영상만
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'data', 'lessons.json');

// 이 채널 이름으로 올라온 것만 통과시킨다.
const CHANNEL = 'Shway Song';

const sinceIdx = process.argv.indexOf('--since');
const SINCE = sinceIdx >= 0 ? process.argv[sinceIdx + 1] : null;

const lessons = JSON.parse(fs.readFileSync(SOURCE, 'utf-8'));

let targets = lessons;

if (SINCE) {
  // 바뀐 영상만 고른다. 데이터 파일이 안 바뀌었으면 볼 것이 없다.
  let before = null;
  try {
    before = JSON.parse(execSync(`git show ${SINCE}:1min/data/lessons.json`, { encoding: 'utf-8' }));
  } catch {
    console.log(`(${SINCE} 에 데이터 파일이 없어 전수로 돌립니다)`);
  }
  if (before) {
    const old = new Map(before.map((L) => [L.id, L.youtubeId]));
    targets = lessons.filter((L) => old.get(L.id) !== L.youtubeId);
    console.log(`바뀐 영상 ${targets.length}편만 확인합니다 (전체 ${lessons.length}편).`);
  }
}

if (!targets.length) {
  console.log('\n✅ 확인할 영상이 없습니다.');
  process.exit(0);
}

const fails = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 네트워크는 간헐적으로 한 번 실패한다(TLS 가로채기, 일시적 거절 등).
// 영상이 진짜 삭제된 것과 구별하려면 몇 번 다시 물어봐야 한다.
async function askYouTube(api, tries = 3) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fetch(api, { headers: { 'User-Agent': 'jjam-1min-check-sources' } });
    } catch (e) {
      last = e;
      if (i < tries) await sleep(1200 * i);
    }
  }
  throw last;
}

for (const L of targets) {
  const url = `https://www.youtube.com/watch?v=${L.youtubeId}`;
  const api = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  let res;
  try {
    res = await askYouTube(api);
  } catch (e) {
    fails.push(`${L.id}: 유튜브에 물어보지 못했습니다 (${e.message})`);
    continue;
  }

  if (res.status === 401 || res.status === 403 || res.status === 404) {
    fails.push(
      `${L.id} '${L.topic}': 영상이 삭제되었거나 비공개입니다 (HTTP ${res.status})\n` +
        `      ${url}\n` +
        `      교실에서 검은 화면이 뜹니다. 다시 올리고 youtubeId 를 고쳐 주세요.`
    );
    continue;
  }
  if (!res.ok) {
    fails.push(`${L.id}: 유튜브가 HTTP ${res.status} 로 답했습니다 — 잠시 뒤 다시 실행해 주세요.`);
    continue;
  }

  const data = await res.json();
  if (data.author_name !== CHANNEL) {
    fails.push(
      `${L.id} '${L.topic}': 내 채널 영상이 아닙니다.\n` +
        `      기대한 채널: ${CHANNEL}\n` +
        `      실제 업로더: ${data.author_name}\n` +
        `      실제 제목: ${data.title}`
    );
    continue;
  }

  console.log(`  ✓ ${L.id} ${L.topic} — ${data.title}`);
}

if (fails.length) {
  console.error(`\n❌ 출처 검증 실패 — ${fails.length}건`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log(`\n✅ 출처 검증 통과 — ${targets.length}편 모두 ${CHANNEL} 채널의 살아 있는 영상입니다.`);
