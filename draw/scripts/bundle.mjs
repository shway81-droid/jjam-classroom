// 그림 파일들을 목록 통합본 하나로 묶습니다(PRD 11장 — 1요청).
// 원본은 언제나 drawings/<id>/drawing.json 이고, data/drawings.json 은 파생물입니다.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readList() {
  return JSON.parse(readFileSync(join(ROOT, 'drawings', 'list.json'), 'utf8'));
}

export function readDrawing(id) {
  return JSON.parse(readFileSync(join(ROOT, 'drawings', id, 'drawing.json'), 'utf8'));
}

// 목록에 올렸지만 아직 그리지 않은 그림은 통합본에서 빼 둡니다(검증은 그 그림을 따로 잡습니다).
export function buildBundle() {
  return { drawings: readList().filter((id) => existsSync(join(ROOT, 'drawings', id, 'drawing.json'))).map(readDrawing) };
}

export const bundleText = () => JSON.stringify(buildBundle(), null, 2) + '\n';

const runDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (runDirectly) {
  const text = bundleText();
  mkdirSync(join(ROOT, 'data'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'drawings.json'), text, 'utf8');
  console.log(`data/drawings.json — 그림 ${buildBundle().drawings.length}개`);
}
