import { bench, ellipse } from './lib.mjs';

// ================================================================ 다람쥐 — 참조 선화 없음(직접 디자인), 앉아서 도토리를 안고 왼쪽을 봅니다
// 몸 뒤로 크게 말려 올라간 꼬리가 귀여움의 중심입니다. 꼬리 털은 꼬리 바깥 테두리를 따라 둥근 혹으로 냅니다.
// 꼬리 바깥 테두리를 복슬복슬하게 — 지나가는 점들을 같은 길이로 n 토막 내고, 토막 가운데를 바깥으로 h 만큼 밀어 냅니다.
const fluffy = (pts, n, h) => {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = acc[acc.length - 1];
  const at = (s) => {
    let i = acc.findIndex((a) => a >= s); if (i <= 0) i = 1;
    const t = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  const out = [];
  for (let k = 0; k < n; k++) {
    const a = at((L * k) / n); const c = at((L * (k + 1)) / n);
    const dx = c[0] - a[0]; const dy = c[1] - a[1]; const dl = Math.hypot(dx, dy);
    // 진행 방향의 왼쪽(화면에서 바깥)으로 밉니다 — 혹 하나에 점 셋을 둬서 둥글게 부풉니다
    const push = (f, hh) => { const m = at((L * (k + f)) / n); return [m[0] + (dy / dl) * hh, m[1] - (dx / dl) * hh]; };
    out.push(a, push(0.12, h * 0.75), push(0.5, h * 1.15), push(0.88, h * 0.75));
  }
  out.push(at(L));
  return out;
};

export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [140, 94], [184, 100], [214, 126], [224, 164], [214, 202], [188, 228],
    [146, 240], [108, 234], [80, 214], [60, 192], [52, 172], [62, 150],
    [80, 124], [106, 104],
  ]);
  const body = b.open('body', [
    [112, 236], [88, 272], [76, 320], [76, 370], [90, 410], [122, 436],
    [170, 442], [212, 432], [232, 400], [234, 350], [222, 290], [196, 230],
  ], ['head', 'head']);
  b.step('머리와 몸', '종이 왼쪽 가운데에 둥근 머리와 통통한 몸을 그려요.', head, body);

  const eye = b.closed('eye', ellipse(116, 156, 10, 12));
  b.step('눈', '머리 앞쪽에 까만 눈을 그려요.', eye);

  const ear = b.open('ear', [[150, 96], [150, 70], [160, 46], [174, 38], [188, 52], [192, 78], [190, 104]], ['head', 'head']);
  b.step('뾰족한 귀', '머리 꼭대기 뒤쪽에 뾰족한 귀를 그려요.', ear);

  const earIn = b.closed('earIn', [[172, 58], [178, 68], [178, 84], [170, 86], [166, 74]]);
  b.step('귀 안쪽', '귀 안에 작고 길쭉한 동그라미를 넣어요.', earIn);

  const nose = b.closed('nose', [[60, 164], [72, 162], [78, 170], [72, 178], [62, 176]]);
  const mouth = b.closed('mouth', [[74, 194], [86, 198], [98, 194], [95, 204], [86, 209], [77, 204]], 0.8);
  b.step('코와 입', '머리 앞 끝에 작은 코를 그리고 아래에 입을 그려요.', nose, mouth);

  const cheek = b.closed('cheek', ellipse(148, 196, 14, 9));
  b.step('볼', '눈 아래 뒤쪽에 발그레한 볼을 그려요.', cheek);

  const cap = b.closed('cap', [
    [140, 286], [166, 290], [180, 302], [172, 314], [140, 316], [108, 314], [100, 302], [114, 290],
  ]);
  b.step('도토리 모자', '머리 아래 몸 가운데에 납작한 도토리 모자를 그려요.', cap);

  const nut = b.open('nut', [[112, 314], [114, 336], [126, 356], [140, 364], [154, 356], [166, 336], [168, 314]], ['cap', 'cap']);
  const stem = b.open('stem', [[134, 288], [134, 274], [146, 272], [148, 287]], ['cap', 'cap']);
  b.step('도토리', '모자 아래에 둥근 도토리를 그리고 꼭지를 붙여요.', nut, stem);

  const arm = b.open('arm', [[80, 296], [96, 302], [108, 318], [104, 334], [80, 340]], ['body', 'body']);
  const arm2 = b.open('arm2', [[176, 308], [190, 316], [194, 334], [182, 344], [164, 338]], ['cap', 'nut']);
  b.step('작은 손', '도토리 양옆에 도토리를 꼭 잡은 손을 그려요.', arm, arm2);

  const thigh = b.open('thigh', [[233, 350], [256, 366], [264, 400], [250, 430], [214, 438]], ['body', 'body']);
  b.step('뒷다리', '몸 뒤쪽 아래에 동그란 뒷다리를 그려요.', thigh);

  const footF = b.open('footF', [[110, 428], [86, 444], [78, 462], [98, 472], [140, 470], [160, 456], [156, 441]], ['body', 'body']);
  const footB = b.open('footB', [[236, 437], [230, 458], [250, 470], [290, 468], [298, 452], [262, 424]], ['thigh', 'thigh']);
  b.step('두 발', '몸 아래에 앞으로 내민 발을 두 개 그려요.', footF, footB);

  const outer = fluffy([
    [270, 412], [300, 420], [345, 400], [372, 352], [380, 290], [372, 222],
    [356, 160], [334, 112], [300, 78], [258, 64],
  ], 6, -16);
  const tail = b.open('tail', [
    [262, 404], ...outer, [222, 74], [210, 98],
    [222, 124], [246, 132], [266, 140], [282, 180], [284, 232], [270, 280], [236, 318],
  ], ['thigh', 'body'], 0.7);
  b.step('큰 꼬리', '몸 뒤로 머리 위까지 크게 말려 올라간 꼬리를 그려요.', tail);

  const curl = b.open('curl', [[230, 126], [244, 104], [272, 96], [304, 114], [326, 156], [340, 214], [344, 280], [350, 330], [366, 360]], ['tail', 'tail']);
  b.step('꼬리 줄', '꼬리 끝에서 꼬리를 따라 안쪽 줄을 그어요.', curl);

  return {
    id: 'squirrel', title: '다람쥐', theme: 'animal', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 주먹만큼 큰 머리부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['동물', '다람쥐', '가을'],
  };
}
