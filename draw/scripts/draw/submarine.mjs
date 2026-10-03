import { bench, ellipse } from './lib.mjs';

// ================================================================ 잠수함 — 참조 없음(직접 디자인), 바닷속
// 길쭉한 몸을 먼저 긋고, 망루·꼬리 날개는 몸 위에 양 끝을 붙입니다. 바닷속 친구들은 맨 마지막입니다.
const tube = (c, w) => {
  const side = (k) => c.map((p, i) => {
    const a = c[Math.max(0, i - 1)]; const z = c[Math.min(c.length - 1, i + 1)];
    const tx = z[0] - a[0]; const ty = z[1] - a[1]; const l = Math.hypot(tx, ty);
    return [p[0] + (-ty / l) * w * k, p[1] + (tx / l) * w * k];
  });
  const L = side(1); const R = side(-1); const n = c.length - 1;
  const tx = c[n][0] - c[n - 1][0]; const ty = c[n][1] - c[n - 1][1]; const l = Math.hypot(tx, ty);
  const cap = [c[n][0] + (tx / l) * w, c[n][1] + (ty / l) * w];
  return [...L, cap, ...R.reverse()];
};

export default function draw() {
  const b = bench();
  const body = b.closed('body', ellipse(240, 240, 180, 70, 16));
  b.step('잠수함 몸', '종이 가운데에 옆으로 아주 긴 몸을 그려요.', body);

  const tower = b.open('tower', [[190, 176], [196, 130], [280, 130], [290, 176]], ['body', 'body'], 0.3);
  b.step('망루', '몸 위 가운데에 네모난 망루를 그려요.', tower);

  const scope = b.closed('scope', [[244, 130], [244, 86], [276, 86], [276, 98], [256, 98], [256, 130]], 0.1);
  b.step('잠망경', '망루 위로 꺾인 잠망경을 그려요.', scope);

  const lid = b.closed('lid', [[204, 130], [208, 120], [220, 118], [226, 130]], 0.6);
  b.step('뚜껑', '망루 위 왼쪽에 작은 뚜껑을 그려요.', lid);

  const holes = [160, 240, 320].map((x, i) => b.closed(`h${i}`, ellipse(x, 240, 18, 18, 10)));
  b.step('둥근 창', '몸 가운데에 동그란 창을 세 개 그려요.', ...holes);

  const sh = [160, 240, 320].map((x, i) => b.closed(`s${i}`, ellipse(x - 6, 234, 3.5, 6, 6, 0.5)));
  b.step('창 반짝이', '창마다 왼쪽 위에 작은 반짝이를 그려요.', ...sh);

  const finT = b.open('finT', [[92, 204], [66, 176], [50, 186], [70, 228]], ['body', 'body']);
  const finB = b.open('finB', [[92, 276], [66, 304], [50, 294], [70, 252]], ['body', 'body']);
  b.step('꼬리 날개', '몸 왼쪽 끝 위아래에 꼬리 날개를 그려요.', finT, finB);

  const hub = b.closed('hub', ellipse(52, 240, 8, 8, 8));
  const bl1 = b.closed('bl1', ellipse(44, 222, 6, 13));
  const bl2 = b.closed('bl2', ellipse(44, 258, 6, 13));
  b.step('프로펠러', '꼬리 끝에 작은 프로펠러를 그려요.', hub, bl1, bl2);

  const band1 = b.open('band1', [[110, 192], [104, 240], [110, 288]], ['body', 'body']);
  const band2 = b.open('band2', [[380, 196], [386, 240], [380, 284]], ['body', 'body']);
  b.step('줄무늬', '몸 양쪽 끝 가까이에 둥근 세로줄을 그어요.', band1, band2);

  const lamp = b.closed('lamp', ellipse(404, 240, 8, 10));
  b.step('앞 불빛', '몸 맨 앞에 동그란 불빛을 그려요.', lamp);

  const bub = [[300, 112, 10], [322, 82, 7], [340, 58, 5], [120, 140, 7]].map(([x, y, r], i) => b.closed(`bu${i}`, ellipse(x, y, r, r)));
  b.step('거품', '잠수함 위로 올라가는 거품을 그려요.', ...bub);

  const fish = b.closed('fish', ellipse(434, 110, 26, 15, 10));
  const tail = b.closed('tail', [[458, 110], [478, 96], [478, 124]], 0.2);
  const fEye = b.closed('fEye', ellipse(422, 106, 3.5, 3.5, 6));
  b.step('물고기', '오른쪽 위에 작은 물고기를 그려요.', fish, tail, fEye);

  const w1 = b.closed('w1', tube([[400, 392], [392, 364], [404, 340], [396, 316]], 6), 0.8);
  const w2 = b.closed('w2', tube([[430, 392], [438, 368], [428, 346]], 6), 0.8);
  b.step('해초', '오른쪽 아래에 구불구불한 해초를 그려요.', w1, w2);

  return {
    id: 'submarine', title: '잠수함', theme: 'thing', difficulty: 'hard', grades: ['upper'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 종이를 가로지르는 긴 몸부터 그릴 거예요.',
    coloringSeconds: 200, steps: b.steps, keywords: ['탈것', '바다', '탐험'],
  };
}
