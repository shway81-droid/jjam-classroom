// urimal.js 순수 로직 테스트 — 우리말 퀴즈의 문제 글자·힌트 단계
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { POINTS, leadOf, hintsOf, pointsAt, tilesOf, maskOf, maskProblem } from '../js/urimal.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { items } = JSON.parse(readFileSync(join(root, 'data', 'words.json'), 'utf8'));
const urimal = items.filter((it) => it.type === 'urimal');

test('점수는 30·20·10점, 힌트 수만큼', () => {
  assert.deepEqual(POINTS, [30, 20, 10]);
  assert.equal(pointsAt(1), 30);
  assert.equal(pointsAt(2), 20);
  assert.equal(pointsAt(3), 10);
});

test('pointsAt: 범위를 벗어나면 가장자리 점수', () => {
  assert.equal(pointsAt(0), 30);
  assert.equal(pointsAt(9), 10);
});

test('leadOf: 겹자음은 그대로 — 꼬 는 ㄲ', () => {
  assert.equal(leadOf('난'), 'ㄴ');
  assert.equal(leadOf('꼬'), 'ㄲ');
  assert.equal(leadOf('a'), null);
});

test('maskOf: 한 글자의 초성만 남기고 나머지는 빈칸', () => {
  assert.equal(maskOf('장난', 1), '○ㄴ');
  assert.equal(maskOf('꽹과리', 1), '○ㄱ○');
  assert.equal(maskOf('잠꼬대', 1), '○ㄲ○');
});

test('tilesOf: 빈칸과 초성 칸으로 나눈다', () => {
  assert.deepEqual(tilesOf('○ㄱ○'), [{ blank: true }, { blank: false, text: 'ㄱ' }, { blank: true }]);
});

test('hintsOf: 가운뎃점으로 가른다 — 힌트 안의 쉼표·띄어쓰기는 그대로', () => {
  assert.deepEqual(hintsOf('손 · 말 · 불'), ['손', '말', '불']);
  assert.deepEqual(hintsOf('금, 은 · 고리 · 쌍'), ['금, 은', '고리', '쌍']);
  assert.deepEqual(hintsOf('대나무 · 여름밤 · 끼고 잠'), ['대나무', '여름밤', '끼고 잠']);
});

test('maskProblem: 맞는 문제는 null', () => {
  assert.equal(maskProblem('○ㄴ', '장난'), null);
  assert.equal(maskProblem('ㅈ○', '장난'), null);   // 다른 칸이어도 규칙은 같다
  assert.equal(maskProblem('○ㄲ○', '잠꼬대'), null);
});

test('maskProblem: 틀린 문제를 잡는다', () => {
  assert.match(maskProblem('○ㄱ○', '잠꼬대'), /초성 'ㄲ'/);        // 겹자음을 홑자음으로
  assert.match(maskProblem('○ㄴ', '장난감'), /칸 수/);
  assert.match(maskProblem('○○', '장난'), /하나여야/);              // 초성이 하나도 없다
  assert.match(maskProblem('ㅈㄴ', '장난'), /하나여야/);            // 둘 다 보인다
  assert.match(maskProblem('○ㄴ○○', '장난감틀'), /두세 글자/);
  assert.match(maskProblem('○A', '장A'), /두세 글자/);
});

test('데이터: 우리말 퀴즈 101문항이 모두 규칙에 맞는다', () => {
  assert.equal(urimal.length, 101);
  for (const it of urimal) {
    assert.equal(maskProblem(it.prompt, it.answer), null, it.id);
    assert.equal(hintsOf(it.hint).length, POINTS.length, it.id);
  }
});
