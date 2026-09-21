/* ===================================================================
   공유 카드(og-image) 생성 — favicon.svg 가 단일 소스다
   ===================================================================
   카카오톡·슬랙에 주소를 붙이면 뜨는 미리보기 카드 그림이다.
   1200×630 PNG 로 굽는다 (SVG 를 og:image 로 주면 대부분의 메신저가 못 읽는다).

   왜 만들었나 — 로고를 새로 그렸는데 카드에는 **은퇴한 옛 로고**가 그대로
   남아 있었다. favicon.svg 와 og-image.svg 가 각자 손으로 관리되던 탓이다.
   그래서 카드를 favicon.svg 에서 **파생**시킨다. 이제 로고를 고치면 카드도
   따라오고, 안 따라오면 `--check` 가 잡는다.

   그림에 숫자를 넣지 않는 것도 같은 이유다. "미니게임 78" 처럼 개수를 구워
   두면 게임이 늘 때마다 낡고, 메신저는 카드를 오래 캐시해 두기 때문에
   고쳐도 한참 옛것이 보인다. 개수는 글자(og:description)로만 적는다.

     node scripts/gen-og.mjs           다섯 사이트의 og-image.svg·png 를 다시 만든다
     node scripts/gen-og.mjs --check   SVG 가 어긋났는지만 본다 (브라우저 불필요)

   `--check` 가 SVG 만 보는 이유는 CI 에서 크로미움을 띄우지 않기 위해서다.
   PNG 는 이 스크립트만 쓰므로, SVG 가 맞으면 PNG 도 맞다 —
   **og-image.svg 를 손으로 고치지 마라.** 고쳐 봐야 여기서 덮어쓴다.
   =================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const W = 1200;
const H = 630;

// 부제·아래띠는 **그림 안의 글자**다. 개수처럼 늘었다 줄었다 하는 말은 넣지 않는다.
const SITES = [
  {
    dir: 'game', accent: '#FFB703',
    title: '짬짬이 게임',
    subtitle: '전자칠판으로 즐기는 자투리 시간 미니게임',
    footer: '설치 없음 · 로그인 없음 · 룰렛 버튼 하나로 게임 시작',
  },
  {
    dir: 'quiz', accent: '#12A57C',
    title: '짬짬이 퀴즈',
    subtitle: '전자칠판으로 즐기는 자투리 시간 문답형 미니게임',
    footer: '설치 없음 · 로그인 없음 · 룰렛 버튼 하나로 퀴즈 시작',
  },
  {
    dir: 'video', accent: '#4FA8E8',
    title: '짬짬이 영상',
    subtitle: '애매하게 남은 시간, 뭐 틀지?',
    footer: '시간 · 주제 · 학년으로 1초 만에 찾는 교실 영상',
  },
  {
    dir: 'story', accent: '#6145B5',
    title: '짬짬이 이야기',
    subtitle: '수업 전후 3~7분, 생각하고 말하기',
    footer: '짧은 이야기 하나로 준비는 줄이고 학생의 말은 늘린다',
  },
  {
    dir: 'word', accent: '#E4576E',
    title: '짬짬이 낱말',
    subtitle: '보기 없이 반 전체가 입으로 외치는 말놀이',
    footer: '교사는 딸깍 세 번 · 설치 없음 · 로그인 없음',
  },
  {
    dir: '1min', accent: '#E8590C',
    title: '짬짬이 1분 수업',
    subtitle: '교과서 한 차시를 1분으로',
    footer: '진도 순서대로 골라 바로 트는 교과서 숏폼',
  },
];

// ── 카드 그리기 ─────────────────────────────────────────────────
// favicon.svg 를 통째로 중첩 <svg> 로 넣는다. viewBox 가 있으므로 좌표계가
// 알아서 맞춰지고, 로고 모양을 여기서 다시 그릴 필요가 없다 — 그 중복이
// 애초에 카드가 낡은 원인이었다.
function compose(site) {
  const favicon = fs.readFileSync(path.join(ROOT, site.dir, 'favicon.svg'), 'utf8');
  const inner = favicon
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
    .split('\n')
    .map((l) => '      ' + l.trim())
    .filter((l) => l.trim())
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- 이 파일은 scripts/gen-og.mjs 가 favicon.svg 에서 만든다. 손으로 고치지 마라. -->
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%">
      <stop offset="0%" stop-color="#1F3468"/>
      <stop offset="100%" stop-color="#0C1730"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${site.accent}"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${site.accent}"/>
  <g transform="translate(170,200) rotate(-12)">
    <svg x="0" y="0" width="180" height="180" viewBox="0 0 100 100">
${inner}
    </svg>
  </g>
  <rect x="420" y="190" width="660" height="250" rx="36" fill="#FFFFFF"/>
  <text x="750" y="300" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="84" font-weight="900" fill="#152447">${site.title}</text>
  <text x="750" y="378" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="27" font-weight="700" fill="#7A8499">${site.subtitle}</text>
  <text x="600" y="560" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${site.footer}</text>
</svg>
`;
}

// ── 글자가 서브셋 폰트에 다 들어 있는지 ─────────────────────────
// 카드 글자는 .html/.js/.json/.css 어디에도 없으므로 check-font-coverage 가
// 훑지 못한다. 빠진 글자가 있으면 두부(□)로 구워지므로 여기서 직접 본다.
function assertCovered(site) {
  const cov = path.join(ROOT, site.dir, 'assets', 'fonts', 'coverage.txt');
  const covered = new Set(
    fs.readFileSync(cov, 'utf8')
      .split('\n')
      .filter((l) => !l.startsWith('#') && !l.startsWith('!'))
      .join(',')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s.replace(/^U\+/i, ''), 16))
  );
  const gone = [...new Set([...site.title, ...site.subtitle, ...site.footer])]
    .filter((ch) => !covered.has(ch.codePointAt(0)));
  if (gone.length) {
    console.error(`  ✗ ${site.dir}: 카드 글자 ${gone.join(' ')} 이(가) 서브셋 폰트에 없습니다.`);
    console.error('      그대로 구우면 두부(□)로 나옵니다. 문구를 바꾸거나 서브셋을 다시 만드세요.');
    process.exit(1);
  }
}

// ── SVG 먼저 ────────────────────────────────────────────────────
let drift = 0;
const composed = new Map();

for (const site of SITES) {
  const svg = compose(site);
  composed.set(site.dir, svg);
  const out = path.join(ROOT, site.dir, 'og-image.svg');
  const now = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;

  if (CHECK) {
    if (now !== svg) {
      console.log(`  ✗ ${site.dir}/og-image.svg 가 favicon.svg·문구와 어긋납니다`);
      drift++;
    }
    continue;
  }

  assertCovered(site);
  if (now === svg) {
    console.log(`  = ${site.dir}/og-image.svg 그대로`);
  } else {
    fs.writeFileSync(out, svg, 'utf8');
    console.log(`  ↻ ${site.dir}/og-image.svg 갱신`);
  }
}

if (CHECK) {
  if (drift) {
    console.log(`\n❌ 공유 카드 ${drift}건이 어긋났습니다 — \`node scripts/gen-og.mjs\` 를 돌리세요.`);
    process.exit(1);
  }
  console.log('\n✅ 공유 카드 SVG 가 favicon·문구와 일치 (5건 확인)');
  process.exit(0);
}

// ── PNG 굽기 ────────────────────────────────────────────────────
// 크로미움이 필요하다. game/ 에만 playwright 가 깔려 있으므로 거기서 빌려 쓴다
// (저장소 루트에는 package.json 을 두지 않는다 — 빌드 단계 없음이 원칙).
let chromium;
try {
  ({ chromium } = await createRequire(path.join(ROOT, 'game', 'package.json'))('playwright'));
} catch {
  console.error('\n  ✗ playwright 가 없습니다. `cd game && npm ci` 뒤에 다시 돌리세요.');
  console.error('      (SVG 는 이미 갱신됐습니다 — PNG 만 남았습니다.)');
  process.exit(1);
}

// 사이트가 실제로 쓰는 Pretendard 로 굽는다. 이 컨테이너의 기본 한글 폰트는
// 비트맵이라 그대로 구우면 카드 글자가 뭉개진다.
const font = fs.readFileSync(
  path.join(ROOT, 'game', 'assets', 'fonts', 'PretendardVariable.subset.woff2')
).toString('base64');

// 크로미움을 다른 곳에 받아 둔 환경(개발 컨테이너 등)에서는 경로를 넘길 수 있다.
//   CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/gen-og.mjs
const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

for (const site of SITES) {
  const svg = composed.get(site.dir);
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>
       @font-face{font-family:Pretendard;src:url(data:font/woff2;base64,${font}) format('woff2');
                  font-weight:45 930;font-display:block}
       html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden}
     </style>${svg}`,
    { waitUntil: 'load' }
  );
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(ROOT, site.dir, 'og-image.png');
  await page.screenshot({ path: out, type: 'png' });
  console.log(`  ✓ ${site.dir}/og-image.png  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

await browser.close();
console.log('\n✅ 공유 카드 5벌 생성 완료');
