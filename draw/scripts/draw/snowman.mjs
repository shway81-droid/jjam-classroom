import { bench, ellipse } from './lib.mjs';

// ================================================================ 눈사람 — 참조: refs/snowman.png
// 첫 획은 머리와 몸을 한 번에 두르는 눈사람 테두리입니다. 머리 위쪽은 모자 챙 아래에서 끝나고,
// 목 부분은 목도리 바깥 끝을 지나므로 나중에 그리는 모자·목도리 안으로 지나가는 선이 없습니다.

// 나뭇가지 팔 — 가는 가지 테두리를 몸에서 나와 몸으로 돌아오는 한 획으로 긋습니다.
// base(몸에 붙는 곳) → fork(갈라지는 곳) → tip1(가지 끝), fork → tip2(곁가지 끝). w는 가지 굵기의 반.
function twig(base, fork, tip1, tip2, w) {
  const unit = (a, b) => { const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const nrm = (u) => [-u[1], u[0]];
  const u0 = unit(base, fork); const u1 = unit(fork, tip1); const u2 = unit(fork, tip2);
  const n0 = nrm(u0); const n1 = nrm(u1); const n2 = nrm(u2);
  // 곁가지가 n 쪽(side +)에 있는지
  const side = (u2[0] * n0[0] + u2[1] * n0[1]) > 0 ? 1 : -1;
  const s = -side; // 큰 가지 바깥쪽(곁가지 반대쪽)부터
  const crotch = add(fork, [(u1[0] + u2[0]) / 2, (u1[1] + u2[1]) / 2], w * 1.6);
  return [
    add(base, n0, s * w),
    add(fork, n0, s * w),
    add(tip1, n1, s * w * 0.8), add(tip1, u1, w * 0.9), add(tip1, n1, -s * w * 0.8),
    crotch,
    add(tip2, n2, s * w * 0.8), add(tip2, u2, w * 0.9), add(tip2, n2, -s * w * 0.8),
    add(fork, n0, -s * w),
    add(base, n0, -s * w),
  ];
}

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [122, 191], [148, 164], [200, 151], [250, 162], [274, 181],
    [276, 206], [272, 232], [268, 252], [271, 268], [289, 295],
    [305, 322], [312, 356], [307, 392], [290, 422], [258, 442], [200, 450],
    [142, 442], [110, 422], [93, 392], [88, 356], [95, 322], [111, 295],
    [129, 270], [132, 252], [126, 230], [121, 207],
  ]);
  b.step('눈사람 몸', '종이 가운데에 위는 작고 아래는 큰 눈사람을 그려요.', body);

  const eyeL = b.closed('eyeL', ellipse(172, 196, 10, 11));
  const eyeR = b.closed('eyeR', ellipse(229, 189, 10, 11));
  b.step('눈 두 개', '머리 가운데에 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const nose = b.closed('nose', [[194, 203], [210, 200], [231, 207], [212, 214], [198, 215], [191, 209]], 0.8);
  const mouth = b.closed('mouth', [[182, 224], [202, 228], [222, 223], [215, 235], [201, 240], [188, 235]], 0.8);
  b.step('코와 입', '눈 사이에 당근 코를, 그 아래에 웃는 입을 그려요.', nose, mouth);

  const brim = b.open('brim', [
    [122, 189], [117, 166], [125, 146], [150, 130], [200, 121], [250, 130], [272, 148], [277, 170], [274, 182],
  ], ['body', 'body']);
  const pom = b.closed('pom', Array.from({ length: 48 }, (_, i) => {
    // 다섯 개의 동글동글한 혹이 있는 털방울
    const a = (i / 48) * Math.PI * 2;
    const r = 18 + 5 * Math.sqrt(Math.abs(Math.sin(a * 2.5)));
    return [164 + Math.cos(a) * r, 56 + Math.sin(a) * r];
  }), 0.5);
  const cone = b.open('cone', [
    [130, 140], [138, 112], [150, 92], [163, 81], [180, 79], [198, 82], [222, 98], [242, 116], [256, 132],
  ], ['brim', 'brim']);
  b.step('털모자', '머리 위에 털모자를 씌우고 꼭대기에 방울을 달아요.', brim, cone, pom);

  const scarfTop = b.open('scarfTop', [[131, 254], [165, 262], [200, 258], [235, 250], [269, 244]], ['body', 'body']);
  const scarfBot = b.open('scarfBot', [[130, 268], [168, 282], [200, 286], [232, 281], [270, 265]], ['body', 'body']);
  b.step('목도리', '머리와 몸 사이에 두툼한 목도리를 둘러요.', scarfTop, scarfBot);

  const tail = b.open('tail', [
    [222, 283], [234, 310], [246, 336], [254, 344], [260, 333], [267, 342], [273, 330], [281, 336],
    [285, 324], [290, 318], [276, 292], [262, 270],
  ], ['scarfBot', 'scarfBot'], 0.6);
  b.step('목도리 끝', '목도리 아래로 술이 달린 끝을 늘어뜨려요.', tail);

  const armL = b.open('armL', twig([107, 300], [80, 278], [50, 262], [76, 244], 6.5), ['body', 'body'], 0.7);
  const armR = b.open('armR', twig([293, 300], [320, 278], [350, 262], [324, 244], 6.5), ['body', 'body'], 0.7);
  b.step('나뭇가지 팔', '몸 양옆에 갈라진 나뭇가지 팔을 하나씩 그려요.', armL, armR);

  const btn1 = b.closed('btn1', ellipse(199, 312, 11, 11));
  const btn2 = b.closed('btn2', ellipse(199, 360, 11, 11));
  b.step('단추 두 개', '목도리 아래 몸 가운데에 단추를 두 개 그려요.', btn1, btn2);

  return {
    id: 'snowman', title: '눈사람', theme: 'season', difficulty: 'easy', grades: ['lower'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 손바닥만큼 크게 그릴 거예요.',
    coloringSeconds: 150, steps: b.steps, keywords: ['겨울', '눈사람', '눈'],
  };
}
