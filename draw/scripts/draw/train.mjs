import { bench, ellipse } from './lib.mjs';

// ================================================================ 칙칙폭폭 증기기관차 — 참조 선화 없음(직접 디자인), 왼쪽으로 달립니다
// 보일러와 운전실을 한 몸으로 먼저 긋고, 굴뚝·연기·바퀴를 붙입니다. 바퀴는 몸 아래로 보이는 부분만 긋고,
// 연결 막대는 양 끝이 큰 바퀴 두 개의 축에 닿습니다. 보일러 앞쪽에 웃는 얼굴을 넣었습니다.

// 몸 아래로 드러난 바퀴 — 중심 (cx, cy), 반지름 r, 몸 밑선 y0 위의 두 점을 잇는 아래쪽 호.
const wheel = (cx, cy, r, y0) => {
  const a0 = Math.asin((cy - y0) / r);
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI - a0 + ((Math.PI + 2 * a0) * i) / 12; // 왼쪽 위 → 아래 → 오른쪽 위
    pts.push([cx + Math.cos(a) * r, cy - Math.sin(a) * r]);
  }
  return pts;
};
// 연기 한 뭉치 — 둥근 혹 다섯 개짜리 구름
const puff = (cx, cy, r, n = 5) => Array.from({ length: n * 4 }, (_, i) => {
  const a = (i / (n * 4)) * Math.PI * 2;
  const f = (i % 4) / 4;
  const rr = r * (0.84 + 0.2 * Math.sin(f * Math.PI) ** 0.7);
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8];
});

export default function draw() {
  const b = bench();
  const body = b.closed('body', [
    [52, 284], [44, 250], [46, 214], [62, 192], [92, 186], [180, 186], [272, 186],
    [290, 180], [292, 132], [278, 124], [282, 108], [304, 100], [420, 100], [440, 108],
    [442, 122], [430, 130], [430, 200], [432, 284], [330, 286], [200, 286], [110, 286],
  ], 0.55);
  b.step('기차 몸', '종이 가운데에 앞이 둥근 보일러와 높은 운전실을 그려요.', body);

  const win = b.closed('win', [[332, 138], [394, 138], [400, 146], [400, 178], [394, 186], [332, 186], [326, 178], [326, 146]], 0.6);
  b.step('창문', '운전실 위쪽에 둥근 네모 창문을 그려요.', win);

  const stack = b.open('stack', [[98, 187], [96, 160], [84, 140], [80, 124], [134, 124], [130, 140], [120, 160], [120, 187]], ['body', 'body'], 0.6);
  b.step('굴뚝', '보일러 앞쪽 위에 위가 넓은 굴뚝을 그려요.', stack);

  const smoke = [[116, 98, 19, 4], [160, 70, 25, 5], [222, 44, 31, 5]].map(([x, y, r, n], k) => b.closed(`smoke${k}`, puff(x, y, r, n)));
  b.step('연기', '굴뚝 위로 점점 커지는 연기를 세 개 그려요.', ...smoke);

  const dome = b.open('dome', [[180, 187], [184, 170], [202, 162], [220, 170], [224, 187]], ['body', 'body']);
  b.step('둥근 지붕', '굴뚝 뒤 보일러 위에 둥근 뚜껑을 그려요.', dome);

  const lamp = b.open('lamp', [[52, 202], [40, 194], [38, 178], [52, 170], [66, 176], [70, 190]], ['body', 'body']);
  b.step('불빛', '보일러 맨 앞 위에 둥근 불빛을 그려요.', lamp);

  const eye = b.closed('eye', ellipse(96, 222, 8, 10));
  const mouth = b.closed('mouth', [[74, 242], [94, 248], [114, 244], [108, 256], [94, 261], [80, 254]], 0.8);
  b.step('웃는 얼굴', '보일러 앞쪽에 눈과 웃는 입을 그려요.', eye, mouth);

  const frame = b.open('frame', [[46, 264], [150, 264], [290, 264], [430, 264]], ['body', 'body']);
  b.step('밑판 줄', '몸 아래쪽을 가로질러 긴 줄을 그어요.', frame);

  const band1 = b.open('band1', [[160, 187], [162, 226], [160, 264]], ['body', 'frame']);
  const band2 = b.open('band2', [[250, 187], [252, 226], [250, 264]], ['body', 'frame']);
  b.step('보일러 띠', '보일러 위에서 밑판 줄까지 띠를 두 줄 그어요.', band1, band2);

  const catcher = b.open('catcher', [[52, 274], [36, 300], [32, 314], [98, 314], [94, 286]], ['body', 'body'], 0.6);
  b.step('앞 범퍼', '기차 맨 앞 아래에 비스듬한 범퍼를 그려요.', catcher);

  const big = [[288, 302], [380, 302]].map(([x, y], k) => b.open(`big${k}`, wheel(x, y, 38, 286), ['body', 'body']));
  b.step('큰 바퀴', '운전실 아래에 큰 바퀴를 두 개 그려요.', ...big);

  const small = [[136, 302], [196, 302]].map(([x, y], k) => b.open(`small${k}`, wheel(x, y, 25, 286), ['body', 'body']));
  b.step('작은 바퀴', '보일러 아래에 작은 바퀴를 두 개 그려요.', ...small);

  const hubs = [[288, 302, 9], [380, 302, 9], [136, 302, 6], [196, 302, 6]].map(([x, y, r], k) => b.closed(`hub${k}`, ellipse(x, y, r, r)));
  b.step('바퀴 축', '바퀴마다 가운데에 작은 동그라미를 그려요.', ...hubs);

  const rod = b.open('rod', [[297, 302], [334, 306], [371, 302]], ['hub0', 'hub1']);
  b.step('연결 막대', '큰 바퀴 두 개의 가운데를 막대로 이어요.', rod);

  return {
    id: 'train', title: '기차', theme: 'thing', difficulty: 'hard', grades: ['upper'],
    paper: 'landscape', viewBox: '0 0 500 400',
    setupSay: '종이를 가로로 놓고, 가운데에 손바닥만큼 큰 기차 몸부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['탈것', '기차', '여행'],
  };
}
