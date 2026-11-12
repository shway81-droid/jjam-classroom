import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, drawCard, emptyDeck } from '../js/deck.js';

// 정해진 순서로 도는 가짜 난수 — 결과를 고정한다
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test('shuffle 은 원본을 바꾸지 않고 같은 원소를 돌려준다', () => {
  const src = ['a', 'b', 'c', 'd'];
  const out = shuffle(src, seq(0.1, 0.7, 0.3));
  assert.deepEqual(src, ['a', 'b', 'c', 'd']);
  assert.deepEqual([...out].sort(), src);
});

test('한 바퀴 도는 동안 같은 카드가 두 번 나오지 않는다', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];
  let deck = emptyDeck();
  const seen = [];
  for (let i = 0; i < ids.length; i++) {
    const got = drawCard(deck, ids, Math.random);
    deck = got.deck;
    seen.push(got.id);
  }
  assert.deepEqual([...seen].sort(), ids);
});

test('새로 섞을 때 바로 앞 카드가 첫 장으로 다시 나오지 않는다', () => {
  const ids = ['a', 'b'];
  // 매번 [a, b] 순서가 되도록 — 섞어도 그대로인 난수
  const keep = () => 0.99;
  for (let round = 0; round < 10; round++) {
    let deck = { queue: [], last: 'a' };
    const got = drawCard(deck, ids, keep);
    assert.notEqual(got.id, 'a');
    assert.equal(got.reshuffled, true);
  }
});

test('주제를 줄이면 남은 줄에서 빠진 주제 카드가 걷힌다', () => {
  const deck = { queue: ['a', 'x', 'b'], last: null };
  const got = drawCard(deck, ['a', 'b'], Math.random);
  assert.equal(got.id, 'a');
  assert.deepEqual(got.deck.queue, ['b']);
  assert.equal(got.reshuffled, false);
});

test('카드가 하나도 없으면 null', () => {
  assert.equal(drawCard(emptyDeck(), []), null);
});

test('카드가 한 장뿐이면 그 한 장이 계속 나온다', () => {
  let deck = emptyDeck();
  for (let i = 0; i < 3; i++) {
    const got = drawCard(deck, ['only']);
    assert.equal(got.id, 'only');
    deck = got.deck;
  }
});
