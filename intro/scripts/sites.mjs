// 여덟 사이트의 이름·한 줄 소개·시간·개수를 **모아보기에서 그대로 읽어 온다**
//   → intro/public/sites.json
//
// 영상 자막에 손으로 베껴 적지 않는 이유 ─────────────────────────────
// 저장소 맨 위 scripts/sync-counts.mjs 머리말이 같은 이야기를 한다. 모아보기 카드에
// 손으로 적어 둔 개수가 1분사회는 열 시간 만에, 낱말은 처음부터 틀려 있었다.
// 영상은 더 나쁘다 — 한 번 올리면 고치기 어렵고 유튜브·메신저에 그대로 남는다.
// 그래서 글귀는 home/index.html 에서 읽고, 개수는 sync-counts.mjs 로 데이터에서 다시
// 뽑는다. 저장소의 home/index.html 은 **건드리지 않는다**(발행에 닿는 파일이다 —
// 사본을 만들어 그 사본에 넣는다).
//
//   cd intro && node scripts/sites.mjs
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(HERE, '..');
const OUT = join(HERE, 'public', 'sites.json');

mkdirSync(join(HERE, 'public'), { recursive: true });
const tmp = join(HERE, 'public', '.home-copy.html');
copyFileSync(join(REPO, 'home', 'index.html'), tmp);

try {
  // 사본의 개수를 데이터에 맞춘다(저장소 파일은 낡아 있을 수 있다)
  execFileSync(process.execPath, [join(REPO, 'scripts', 'sync-counts.mjs'), '--target', tmp], { stdio: 'pipe' });
  const html = readFileSync(tmp, 'utf8');

  const sites = [];
  const card = /<a class="card" href="([^"]+)">([\s\S]*?)<\/a>/g;
  let m;
  while ((m = card.exec(html))) {
    const [, url, inner] = m;
    const pick = (re, what) => {
      const g = inner.match(re);
      if (!g) throw new Error(`모아보기 카드에서 ${what} 를 찾지 못했습니다 (${url}). home/index.html 이 바뀌었으면 이 파일도 고쳐야 합니다.`);
      return g[1].trim();
    };
    const amt = inner.match(/<span class="amt" data-count="([^"]+)">([^<]*)<\/span>/);
    if (!amt) throw new Error(`모아보기 카드에서 개수를 찾지 못했습니다 (${url}).`);
    sites.push({
      key: amt[1],
      url,
      name: pick(/<h3>([^<]+)<\/h3>/, '이름'),
      line: pick(/<p class="line">([^<]+)<\/p>/, '한 줄 소개'),
      min: pick(/<span class="min">([^<]+)<\/span>/, '걸리는 시간'),
      amt: amt[2].trim(),
    });
  }

  if (sites.length !== 8) {
    throw new Error(`여덟 사이트가 나와야 하는데 ${sites.length}개를 읽었습니다. home/index.html 의 카드 모양이 바뀌었나요?`);
  }

  writeFileSync(OUT, JSON.stringify(sites, null, 2) + '\n');
  for (const s of sites) console.log(`  · ${s.name} — ${s.line} (${s.min} · ${s.amt})`);
} finally {
  rmSync(tmp, { force: true });
}
