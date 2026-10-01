import { bench, ellipse, star } from './lib.mjs';

// ================================================================ 소방관 — 참조 없음(직접 디자인), 호스를 든 어린이 소방관(불 없음)
// 가운데 줄을 따라 굵기 w 인 가는 관(호스)의 테두리 점 — 한쪽으로 내려갔다가 둥근 끝을 돌아 올라옵니다.
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
  // 헬멧 둥근 윗부분 + 넓은 챙 + 얼굴을 한 바퀴에 그립니다.
  const head = b.closed('head', [
    [200, 48], [250, 56], [286, 86], [298, 128], [326, 140], [336, 154], [322, 166],
    [292, 170], [294, 202], [284, 236], [262, 258], [230, 270], [200, 272], [170, 270],
    [138, 258], [116, 236], [106, 202], [108, 170], [78, 166], [64, 154], [74, 140],
    [102, 128], [114, 86], [150, 56],
  ], 0.9);
  b.step('헬멧 쓴 얼굴', '종이 위쪽에 챙이 넓은 헬멧을 쓴 둥근 얼굴을 그려요.', head);

  const brim = b.open('brim', [[100, 129], [150, 140], [200, 143], [250, 140], [300, 129]], ['head', 'head']);
  const brimB = b.open('brimB', [[100, 168], [150, 172], [200, 174], [250, 172], [300, 168]], ['head', 'head']);
  b.step('헬멧 챙', '헬멧 아래쪽을 가로지르는 줄을 두 개 그어 챙을 만들어요.', brim, brimB);

  const badge = b.closed('badge', [[200, 64], [226, 74], [228, 98], [218, 116], [200, 126], [182, 116], [172, 98], [174, 74]], 0.9);
  const badgeStar = b.closed('badgeStar', star(200, 97, 13, 6));
  b.step('헬멧 방패', '헬멧 앞 가운데에 방패를 그리고 안에 별을 넣어요.', badge, badgeStar);

  const eyeL = b.closed('eyeL', ellipse(166, 204, 9, 11));
  const eyeR = b.closed('eyeR', ellipse(234, 204, 9, 11));
  b.step('눈 두 개', '챙 아래에 작고 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[184, 230], [200, 234], [216, 230], [212, 243], [200, 248], [188, 243]], 0.8);
  const cheekL = b.closed('cheekL', ellipse(136, 232, 11, 7));
  const cheekR = b.closed('cheekR', ellipse(264, 232, 11, 7));
  b.step('웃는 입과 볼', '두 눈 사이 아래에 웃는 입을 그리고 양 볼을 그려요.', mouth, cheekL, cheekR);

  const jacket = b.open('jacket', [
    [168, 266], [136, 280], [118, 310], [114, 350], [116, 392], [160, 398],
    [200, 400], [240, 398], [284, 392], [286, 350], [282, 310], [264, 280], [232, 266],
  ], ['head', 'head']);
  b.step('두꺼운 옷', '얼굴 아래에 어깨가 둥근 두꺼운 소방복을 그려요.', jacket);

  const zip = b.open('zip', [[200, 270], [200, 330], [200, 398]], ['head', 'jacket']);
  b.step('가운데 줄', '얼굴 아래에서 옷 끝까지 가운데 줄을 그어요.', zip);

  const armL = b.open('armL', [[122, 296], [102, 320], [90, 352], [88, 372], [106, 378], [118, 366]], ['jacket', 'jacket']);
  const armR = b.open('armR', [[278, 296], [302, 298], [322, 292], [332, 306], [324, 322], [302, 328], [285, 332]], ['jacket', 'jacket']);
  b.step('팔 두 개', '한 팔은 아래로 내리고 한 팔은 옆으로 뻗어 그려요.', armL, armR);

  const gloveL = b.open('gloveL', [[90, 370], [86, 388], [94, 402], [110, 402], [116, 388], [110, 376]], ['armL', 'armL']);
  const gloveR = b.open('gloveR', [[324, 294], [340, 284], [356, 290], [362, 306], [354, 322], [338, 326], [324, 318]], ['armR', 'armR']);
  b.step('장갑 두 개', '팔 끝마다 둥글고 두툼한 장갑을 그려요.', gloveL, gloveR);

  const st1 = b.open('st1', [[115, 352], [160, 356], [200, 357], [240, 356], [286, 352]], ['jacket', 'jacket']);
  const st2 = b.open('st2', [[115, 370], [160, 374], [200, 375], [240, 374], [285, 370]], ['jacket', 'jacket']);
  b.step('반짝이 띠', '옷 아래쪽에 가로로 긴 띠를 두 줄 그어요.', st1, st2);

  const pants = b.open('pants', [
    [134, 397], [134, 420], [136, 440], [166, 442], [194, 440], [196, 414], [200, 402],
    [204, 414], [206, 440], [234, 442], [264, 440], [266, 420], [266, 397],
  ], ['jacket', 'jacket']);
  b.step('바지', '옷 아래에 짧고 통통한 다리를 두 개 그려요.', pants);

  const bootL = b.open('bootL', [[138, 438], [130, 452], [134, 464], [170, 466], [196, 464], [194, 440]], ['pants', 'pants']);
  const bootR = b.open('bootR', [[206, 440], [204, 464], [230, 466], [266, 464], [270, 452], [262, 438]], ['pants', 'pants']);
  b.step('장화 두 개', '다리 아래에 앞이 둥근 장화를 하나씩 그려요.', bootL, bootR);

  const nozzle = b.open('nozzle', [[340, 288], [342, 262], [350, 238], [362, 232], [372, 240], [366, 264], [358, 292]], ['gloveR', 'gloveR']);
  const band = b.open('band', [[343, 258], [355, 262], [368, 260]], ['nozzle', 'nozzle']);
  b.step('물 나오는 통', '장갑 위로 끝이 위를 향한 물 나오는 통을 그려요.', nozzle, band);

  const hose = b.open('hose', tube([[344, 322], [340, 356], [330, 388], [332, 418], [350, 440], [372, 450]], 9), ['gloveR', 'gloveR']);
  b.step('긴 호스', '장갑 아래로 바닥까지 구불구불한 호스를 그려요.', hose);

  const d1 = b.closed('d1', [[380, 196], [388, 208], [384, 218], [374, 218], [372, 208]], 0.9);
  const d2 = b.closed('d2', [[346, 190], [353, 201], [350, 210], [341, 210], [339, 201]], 0.9);
  b.step('물방울', '통 끝 위에 작은 물방울을 두 개 그려요.', d1, d2);

  return {
    id: 'firefighter', title: '소방관', theme: 'person', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 헬멧 쓴 얼굴부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['직업', '소방관', '안전'],
  };
}
