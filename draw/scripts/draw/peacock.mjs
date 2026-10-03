import { bench, ellipse } from './lib.mjs';

// ================================================================ 공작 — 참조 없음(직접 디자인), 꼬리를 편 앞모습
// 펼친 꼬리와 몸을 한 바퀴에 긋고(첫 획 40% 규칙), 머리를 넣은 뒤 목과 몸을 테두리와 머리 사이에 잇습니다.
export default function draw() {
  const b = bench();
  const fan = Array.from({ length: 17 }, (_, i) => {
    const a = Math.PI + (i / 16) * Math.PI; const r = i % 2 ? 160 : 172;
    return [200 + Math.cos(a) * r, 300 + Math.sin(a) * r];
  });
  const sil = b.closed('sil', [...fan, [300, 318], [236, 330], [230, 360], [214, 386], [200, 392], [186, 386], [170, 360], [164, 330], [100, 318]], 0.8);
  b.step('꼬리와 몸', '종이 가운데에 부채처럼 펼친 꼬리와 몸을 그려요.', sil);

  const head = b.closed('head', ellipse(200, 196, 22, 22, 10));
  b.step('머리', '꼬리 가운데에 동그란 머리를 그려요.', head);

  const nL = b.open('nL', [[166, 334], [172, 280], [182, 234], [188, 214]], ['sil', 'head']);
  const nR = b.open('nR', [[234, 334], [228, 280], [218, 234], [212, 214]], ['sil', 'head']);
  b.step('목과 몸', '머리 아래에서 몸까지 양쪽 줄을 그어요.', nL, nR);

  const cDots = [[186, 156], [200, 150], [214, 156]].map(([x, y], i) => b.closed(`cd${i}`, ellipse(x, y, 5, 5, 6)));
  const cLines = [[186, 156], [200, 150], [214, 156]].map(([x, y], i) => b.open(`cl${i}`, [[200 + (x - 200) * 0.3, 176], [x, y + 5]], ['head', `cd${i}`]));
  b.step('머리 깃', '머리 위에 끝이 동그란 깃을 세 개 그려요.', ...cDots, ...cLines);

  const eyeL = b.closed('eyeL', ellipse(192, 192, 4, 5, 6));
  const eyeR = b.closed('eyeR', ellipse(208, 192, 4, 5, 6));
  b.step('눈 두 개', '머리 안에 작은 눈을 두 개 그려요.', eyeL, eyeR);

  const beak = b.closed('beak', [[194, 202], [206, 202], [200, 212]], 0.2);
  b.step('부리', '두 눈 사이 아래에 작은 부리를 그려요.', beak);

  const spots = [195, 233, 307, 345].map((d) => {
    const a = (d * Math.PI) / 180; return [200 + Math.cos(a) * 128, 300 + Math.sin(a) * 128];
  });
  const eyes = spots.map(([x, y], i) => b.closed(`e${i}`, ellipse(x, y, 18, 18, 10)));
  b.step('깃털 눈', '꼬리 둘레에 동그란 깃털 무늬를 네 개 그려요.', ...eyes);

  const inner = spots.map(([x, y], i) => b.closed(`ei${i}`, ellipse(x, y, 7, 7, 8)));
  b.step('깃털 눈 안쪽', '깃털 무늬마다 안에 작은 동그라미를 그려요.', ...inner);

  const rays = [214, 256, 284, 326].map((d, i) => {
    const a = (d * Math.PI) / 180;
    const neck = i < 2 ? 'nL' : 'nR';
    return b.open(`ray${i}`, [[200 + Math.cos(a) * 40, 300 + Math.sin(a) * 40], [200 + Math.cos(a) * 166, 300 + Math.sin(a) * 166]], [neck, 'sil']);
  });
  b.step('깃털 줄', '몸에서 꼬리 끝까지 깃털 줄을 네 개 그어요.', ...rays);

  const wing = b.closed('wing', [[190, 290], [212, 286], [220, 320], [204, 352], [186, 332]], 0.8);
  b.step('날개', '몸 가운데에 작은 날개를 그려요.', wing);

  const fL = b.closed('fL', [[176, 452], [186, 440], [196, 452], [186, 456]], 0.3);
  const fR = b.closed('fR', [[204, 452], [214, 440], [224, 452], [214, 456]], 0.3);
  b.step('발', '몸 아래에 떨어뜨려서 작은 발을 두 개 그려요.', fL, fR);

  const legL = b.open('legL', [[190, 390], [188, 420], [186, 442]], ['sil', 'fL']);
  const legR = b.open('legR', [[210, 390], [212, 420], [214, 442]], ['sil', 'fR']);
  b.step('다리', '몸과 발을 가느다란 다리로 이어요.', legL, legR);

  const cheekL = b.closed('cheekL', ellipse(184, 204, 5, 3.5, 6));
  const cheekR = b.closed('cheekR', ellipse(216, 204, 5, 3.5, 6));
  b.step('볼 두 개', '부리 양옆에 작은 볼을 그려요.', cheekL, cheekR);

  return {
    id: 'peacock', title: '공작', theme: 'animal', difficulty: 'hard', grades: ['upper'],
    paper: 'portrait', viewBox: '0 0 400 500',
    setupSay: '종이를 세로로 놓고, 가운데에 종이를 가로지르는 꼬리부터 그릴 거예요.',
    coloringSeconds: 220, steps: b.steps, keywords: ['동물', '새', '동물원'],
  };
}
