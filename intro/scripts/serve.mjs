// 저장소를 그대로 띄우는 작은 정적 서버. 화면을 찍을 때만 쓴다.
// 여덟 사이트가 전부 빌드 단계 없는 정적 사이트라, 저장소 맨 위를 뿌리로 주면
// /game/ · /quiz/ … 가 발행된 모습 그대로 열린다.
//
//   import { startServer } from './serve.mjs';
//   const server = await startServer(0);           // 0 = 빈 포트 아무거나
//   `http://127.0.0.1:${server.address().port}/`
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 모르는 확장자를 application/octet-stream 으로 내보내면 브라우저가 조용히 무시한다.
// 사이트가 쓰는 것만 적어 두고, 빠진 게 생기면 여기에 더한다.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};

export function startServer(port = 0) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    // 뿌리 밖으로 나가는 ../ 를 막는다
    const file = join(REPO, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    try {
      if (statSync(file).isDirectory()) throw new Error('디렉터리');
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('404');
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
