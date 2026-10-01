import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 요정 — 참조 없음(직접 디자인), 두 팔을 벌리고 별 지팡이를 든 꼬마 요정
const mirror = (pts) => pts.map(([x, y]) => [400 - x, y]);

export default function draw() {
  const b = bench();
  const head = b.closed('head', ellipse(200, 160, 80, 86, 16));
  b.step('둥근 얼굴', '종이 위쪽에 주먹만큼 크고 둥근 얼굴을 그려요.', head);

  const bangs = b.open('bangs', [
    [124, 182], [132, 152], [154, 130], [176, 142], [196, 114], [214, 138],
    [244, 120], [264, 140], [278, 180],
  ], ['head', 'head']);
  b.step('앞머리', '얼굴 위쪽에 양옆을 이어 물결 같은 앞머리를 그려요.', bangs);

  const bun = b.open('bun', [[172, 82], [164, 60], [176, 40], [200, 33], [224, 40], [236, 60], [228, 82]], ['head', 'head']);
  b.step('머리 묶음', '머리 꼭대기에 동그랗게 묶은 머리를 올려 그려요.', bun);

  const eyeL = b.closed('eyeL', ellipse(170, 190, 9, 11));
  const eyeR = b.closed('eyeR', ellipse(230, 190, 9, 11));
  b.step('눈 두 개', '앞머리 아래에 작고 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[186, 214], [200, 218], [214, 214], [210, 225], [200, 229], [190, 225]], 0.8);
  const cheekL = b.closed('cheekL', ellipse(158, 216, 9, 6));
  const cheekR = b.closed('cheekR', ellipse(242, 216, 9, 6));
  b.step('웃는 입과 볼', '두 눈 사이 아래에 웃는 입을 그리고 양 볼을 그려요.', mouth, cheekL, cheekR);

  const dress = b.open('dress', [
    [174, 242], [154, 256], [148, 288], [152, 316], [132, 356], [110, 398], [150, 408],
    [200, 411], [250, 408], [290, 398], [268, 356], [248, 316], [252, 288], [246, 256], [226, 242],
  ], ['head', 'head']);
  b.step('퍼지는 치마', '얼굴 아래에 아래로 넓게 퍼지는 원피스를 그려요.', dress);

  const belt = b.open('belt', [[150, 312], [176, 318], [200, 320], [224, 318], [250, 312]], ['dress', 'dress']);
  b.step('허리 줄', '원피스 허리를 가로지르는 줄을 하나 그어요.', belt);

  const armPts = [[154, 258], [138, 254], [122, 248], [110, 238], [96, 236], [86, 246], [88, 262], [102, 268], [116, 264], [134, 272], [149, 282]];
  const armL = b.open('armL', armPts, ['dress', 'dress']);
  const armR = b.open('armR', mirror(armPts), ['dress', 'dress']);
  b.step('팔 두 개', '어깨에서 양옆으로 벌린 짧은 팔을 그려요.', armL, armR);

  const wandStar = b.closed('wandStar', star(336, 178, 24, 11));
  const stick = b.open('stick', [[304, 238], [318, 214], [330, 196]], ['armR', 'wandStar']);
  b.step('별 지팡이', '오른손 위에 별을 그리고 손까지 막대를 이어요.', wandStar, stick);

  const upPts = [[126, 268], [100, 276], [72, 266], [48, 264], [38, 286], [48, 314], [78, 330], [114, 324], [149, 306]];
  const upL = b.open('upL', upPts, ['armL', 'dress']);
  const upR = b.open('upR', mirror(upPts), ['armR', 'dress']);
  b.step('위쪽 날개', '팔 아래에서 몸 옆으로 둥글고 큰 날개를 그려요.', upL, upR);

  const loPts = [[148, 326], [118, 336], [90, 348], [80, 372], [96, 390], [122, 382], [134, 358]];
  const loL = b.open('loL', loPts, ['dress', 'dress']);
  const loR = b.open('loR', mirror(loPts), ['dress', 'dress']);
  b.step('아래쪽 날개', '큰 날개 아래에 작은 날개를 한 쌍 더 그려요.', loL, loR);

  const linePts = [[148, 300], [108, 300], [62, 292]];
  const lineL = b.open('lineL', linePts, ['upL', 'upL']);
  const lineR = b.open('lineR', mirror(linePts), ['upR', 'upR']);
  b.step('날개 무늬', '큰 날개 안에 가로로 줄을 하나씩 그어요.', lineL, lineR);

  const legPts = [[176, 408], [176, 428], [164, 438], [168, 450], [194, 450], [198, 432], [196, 410]];
  const legL = b.open('legL', legPts, ['dress', 'dress']);
  const legR = b.open('legR', mirror(legPts), ['dress', 'dress']);
  b.step('다리와 신발', '치마 아래에 짧은 다리와 둥근 신발을 그려요.', legL, legR);

  const sp1 = b.closed('sp1', star(68, 110, 16, 7));
  const sp2 = b.closed('sp2', star(346, 420, 14, 6));
  b.step('반짝이 별', '요정 옆 빈 곳에 작은 별을 두 개 그려요.', sp1, sp2);

  return {
    id: 'fairy', title: '요정', theme: 'fantasy', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['상상', '요정', '날개'],
  };
}
