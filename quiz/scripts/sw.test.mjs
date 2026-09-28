// sw.js 미리 받기 테스트 — 안 열어 본 게임도 오프라인에서 뜨는가
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]).filter((a) => a !== './games/');
const gameFiles = JSON.parse(sw.match(/const GAME_FILES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const folders = JSON.parse(readFileSync(join(root, 'games/registry.json'), 'utf8'));

// 게임 페이지가 부르는 로컬 파일 (쿼리 제외)
function refsOf(folder) {
  const html = readFileSync(join(root, 'games', folder, 'index.html'), 'utf8');
  return [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((m) => m[1].split('?')[0])
    .filter((u) => !/^(https?:|data:|mailto:)/.test(u));
}

test('미리 받기 목록의 파일이 모두 실제로 있다', () => {
  for (const a of assets) {
    if (a === './') continue;
    assert.ok(existsSync(join(root, a)), `${a} 파일이 없습니다 — 설치가 통째로 실패합니다`);
  }
});

test('모든 게임에 GAME_FILES 가 다 있다', () => {
  for (const folder of folders) {
    for (const f of gameFiles) {
      assert.ok(existsSync(join(root, 'games', folder, f)), `games/${folder}/${f} 가 없습니다`);
    }
  }
});

// 게임 폴더 안 파일을 새로 부르면 GAME_FILES 에, 공통 파일을 새로 부르면 설치 목록에
// 넣어야 한다. 빠지면 그 게임은 안 열어 본 채로 오프라인이 됐을 때 깨진다.
test('게임 페이지가 부르는 파일이 모두 미리 받아진다', () => {
  for (const folder of folders) {
    for (const ref of refsOf(folder)) {
      if (ref.startsWith('../../')) {
        const shared = './' + ref.slice('../../'.length);
        assert.ok(assets.includes(shared), `games/${folder} 가 부르는 ${shared} 가 sw.js 설치 목록에 없습니다`);
      } else {
        assert.ok(gameFiles.includes(ref), `games/${folder} 가 부르는 ${ref} 가 GAME_FILES 에 없습니다`);
      }
    }
  }
});
