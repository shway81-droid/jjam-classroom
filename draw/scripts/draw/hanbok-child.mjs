import { bench, ellipse } from './lib.mjs';

// ================================================================ 한복 입은 아이 — 참조: refs/hanbok-child.png, 리본 단 여자아이
export default function draw() {
  const b = bench();
  const head = b.closed('head', [
    [207, 65], [250, 72], [279, 98], [292, 135], [291, 172], [280, 200],
    [262, 220], [236, 232], [208, 235], [178, 232], [152, 220], [135, 200],
    [126, 170], [127, 134], [140, 100], [170, 74],
  ]);
  b.step('둥근 머리', '종이 위쪽에 주먹만큼 크고 둥근 머리를 그려요.', head);

  const bangs = b.open('bangs', [
    [134, 188], [144, 160], [158, 142], [176, 148], [190, 117], [200, 142],
    [236, 108], [252, 132], [270, 146], [282, 184],
  ], ['head', 'head']);
  b.step('앞머리', '머리 양옆을 이어 가운데가 갈라진 앞머리를 그려요.', bangs);

  const eyeL = b.closed('eyeL', ellipse(179, 181, 8, 9));
  const eyeR = b.closed('eyeR', ellipse(245, 179, 8, 9));
  b.step('눈 두 개', '앞머리 아래에 작고 동그란 눈을 두 개 그려요.', eyeL, eyeR);

  const mouth = b.closed('mouth', [[200, 203], [212, 206], [224, 203], [220, 211], [212, 214], [204, 211]], 0.8);
  b.step('웃는 입', '두 눈 사이 아래에 작게 웃는 입을 그려요.', mouth);

  const earL = b.open('earL', [[133, 184], [125, 186], [122, 198], [130, 208], [144, 212]], ['head', 'head']);
  const earR = b.open('earR', [[287, 182], [295, 184], [297, 196], [290, 206], [276, 210]], ['head', 'head']);
  b.step('귀 두 개', '머리 양옆 아래에 작고 둥근 귀를 그려요.', earL, earR);

  const knot = b.closed('knot', ellipse(150, 82, 9, 8));
  const loopUp = b.open('loopUp', [[156, 76], [158, 60], [168, 50], [180, 54], [178, 66], [166, 76], [158, 84]], ['knot', 'knot']);
  const loopL = b.open('loopL', [[142, 80], [126, 76], [112, 84], [108, 98], [112, 110], [104, 120], [110, 132], [124, 130], [134, 116], [138, 100], [144, 88]], ['knot', 'knot']);
  b.step('머리 리본', '머리 위 왼쪽에 매듭을 그리고 리본 날개를 달아요.', knot, loopUp, loopL);

  const jacket = b.open('jacket', [
    [186, 233], [176, 244], [166, 258], [162, 280], [165, 303], [200, 304],
    [236, 304], [258, 303], [261, 280], [257, 258], [246, 244], [234, 231],
  ], ['head', 'head']);
  b.step('저고리', '머리 아래에 어깨가 둥근 짧은 저고리를 그려요.', jacket);

  const sleeveL = b.open('sleeveL', [[168, 254], [152, 274], [140, 298], [131, 320], [143, 330], [158, 325], [163, 300]], ['jacket', 'jacket']);
  const sleeveR = b.open('sleeveR', [[255, 254], [271, 274], [283, 298], [292, 320], [280, 330], [265, 325], [260, 300]], ['jacket', 'jacket']);
  b.step('소매 두 개', '저고리 양옆에 아래로 넓어지는 소매를 그려요.', sleeveL, sleeveR);

  const cuffL = b.open('cuffL', [[135, 309], [148, 314], [160, 311]], ['sleeveL', 'sleeveL']);
  const cuffR = b.open('cuffR', [[288, 309], [275, 314], [263, 311]], ['sleeveR', 'sleeveR']);
  b.step('소매 끝동', '소매 끝에 가로로 줄을 하나씩 그어요.', cuffL, cuffR);

  const handL = b.open('handL', [[138, 328], [136, 342], [145, 350], [155, 345], [154, 327]], ['sleeveL', 'sleeveL']);
  const handR = b.open('handR', [[285, 328], [287, 342], [278, 350], [268, 345], [269, 327]], ['sleeveR', 'sleeveR']);
  b.step('손 두 개', '소매 끝 아래에 작고 둥근 손을 그려요.', handL, handR);

  const collarA = b.open('collarA', [[240, 242], [212, 266], [186, 288], [166, 300]], ['jacket', 'jacket']);
  const collarB = b.open('collarB', [[222, 234], [198, 254], [176, 272], [163, 282]], ['head', 'jacket']);
  const collarC = b.open('collarC', [[186, 236], [194, 248], [202, 256]], ['jacket', 'collarB']);
  b.step('깃', '목에서 허리 쪽으로 비스듬히 겹치는 깃을 그려요.', collarA, collarB, collarC);

  const skirt = b.open('skirt', [
    [166, 304], [152, 340], [142, 380], [136, 414], [170, 424], [211, 427],
    [252, 424], [287, 414], [281, 380], [270, 340], [257, 304],
  ], ['jacket', 'jacket']);
  b.step('긴 치마', '저고리 아래에 아래로 넓게 퍼지는 긴 치마를 그려요.', skirt);

  const bow = b.closed('bow', ellipse(226, 304, 9, 8));
  const ribL = b.open('ribL', [[220, 310], [208, 348], [196, 388], [212, 392], [221, 352], [228, 312]], ['bow', 'bow']);
  const ribR = b.open('ribR', [[232, 311], [238, 350], [236, 392], [252, 390], [250, 348], [234, 306]], ['bow', 'bow']);
  b.step('고름', '저고리 앞 매듭에서 길게 늘어진 고름을 그려요.', bow, ribL, ribR);

  const shoeL = b.open('shoeL', [[174, 425], [166, 436], [172, 447], [196, 448], [204, 438], [202, 427]], ['skirt', 'skirt']);
  const shoeR = b.open('shoeR', [[222, 427], [220, 438], [228, 448], [252, 447], [258, 436], [250, 425]], ['skirt', 'skirt']);
  b.step('꽃신 두 개', '치마 아래에 앞이 둥근 신발을 두 개 그려요.', shoeL, shoeR);

  return {
    id: 'hanbok-child', title: '한복 입은 아이', theme: 'person', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 위쪽에 주먹만큼 큰 머리부터 그릴 거예요.',
    coloringSeconds: 180, steps: b.steps, keywords: ['표정', '한복', '명절'],
  };
}
