// roster.js 순수 로직 테스트 — 인물 번호·세트·정답지 순서 출제
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { numberPeople, setsOf, nextInOrder, SET_SIZE } from '../js/roster.js';
import { candidates } from '../js/pick.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { items } = JSON.parse(readFileSync(join(root, 'data', 'words.json'), 'utf8'));
const people = items.filter((it) => it.type === 'person');

test('numberPeople: 인물만, 데이터 순서대로 1부터 빈틈없이 번호를 붙인다', () => {
  const nums = numberPeople(items);
  assert.equal(nums.size, people.length);
  people.forEach((p, i) => assert.equal(nums.get(p.id), i + 1));
  assert.ok(!nums.has(items.find((it) => it.type !== 'person').id));
});

test('setsOf: 후보를 SET_SIZE 명씩 끊고, 마지막 세트는 남은 만큼', () => {
  const nums = numberPeople(items);
  const pool = candidates(items, { type: 'person', topic: '가수' });
  const sets = setsOf(pool, nums);
  assert.equal(sets.length, Math.ceil(pool.length / SET_SIZE));
  assert.equal(sets.reduce((s, x) => s + x.size, 0), pool.length);
  assert.equal(sets[0].from, nums.get(pool[0].id));
  assert.equal(sets[0].to, nums.get(pool[Math.min(SET_SIZE, pool.length) - 1].id));
  assert.equal(sets[1].start, SET_SIZE);
});

test('setsOf: 난이도로 거르면 번호가 건너뛰어도 세트 범위는 실제 첫·끝 사람', () => {
  const nums = numberPeople(items);
  const pool = candidates(items, { type: 'person', level: 'easy' });
  for (const s of setsOf(pool, nums)) {
    assert.equal(s.from, nums.get(pool[s.start].id));
    assert.equal(s.to, nums.get(pool[s.start + s.size - 1].id));
    assert.ok(s.from <= s.to);
  }
});

test('nextInOrder: 차례대로 나오고 끝에서 처음으로 돈다', () => {
  const pool = people.slice(0, 3);
  let got = nextInOrder(pool, -1);
  assert.equal(got.item, pool[0]);
  assert.equal(got.wrapped, false);
  got = nextInOrder(pool, got.pos);
  assert.equal(got.item, pool[1]);
  got = nextInOrder(pool, 2);
  assert.equal(got.item, pool[0]);
  assert.equal(got.wrapped, true);
  assert.equal(nextInOrder([], 0), null);
});

test('nextInOrder: 세트 시작 자리에서 출발하면 그 세트의 첫 사람부터', () => {
  const pool = people.slice(0, 25);
  assert.equal(nextInOrder(pool, SET_SIZE - 1).item, pool[SET_SIZE]);
});
