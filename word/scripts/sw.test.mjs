// sw.js 미리 받기 목록 테스트 — 오프라인에서 앱이 뜨는가
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]);

// 모듈 하나라도 빠지면 import 가 실패해 앱 전체가 안 뜬다. 온라인으로 한 번만
// 열고 교실에서 오프라인이 되면 바로 그 상황이다 — clock.js 가 실제로 빠져 있었다.
test('js/ 의 모듈이 모두 미리 받기 목록에 있다', () => {
  for (const f of readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js'))) {
    assert.ok(assets.includes(`./js/${f}`), `sw.js ASSETS 에 ./js/${f} 가 없습니다`);
  }
});

test('미리 받기 목록의 파일이 모두 실제로 있다', () => {
  for (const a of assets) {
    if (a === './') continue;
    assert.doesNotThrow(() => readFileSync(join(root, a)), `${a} 파일이 없습니다 — 설치가 통째로 실패합니다`);
  }
});
