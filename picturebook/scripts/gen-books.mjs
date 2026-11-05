/* books/<id>/book.json 들을 data/books.json 하나로 묶습니다(PRD 7장 — 화면은 이 파일 하나만 받습니다).
 *
 *   node scripts/gen-books.mjs           다시 만듭니다
 *   node scripts/gen-books.mjs --check   어긋났는지만 봅니다(고치지 않음)
 *
 * 원본은 book.json 이고 data/books.json 은 생성물입니다. 손으로 고치지 않습니다.
 * 차례는 ORDER 에 적은 대로이고, 적지 않은 책은 그 뒤에 id 순으로 붙습니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOKS = path.join(ROOT, 'books');
const OUT = path.join(ROOT, 'data', 'books.json');
const CHECK = process.argv.includes('--check');

// 서가에 놓이는 차례입니다. 30권이 모이면 여기서 정합니다.
const ORDER = ['golden-axe'];

const ids = fs.readdirSync(BOOKS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(BOOKS, d.name, 'book.json')))
  .map((d) => d.name)
  .sort((a, b) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    if (ia !== ib) return (ia < 0 ? Infinity : ia) - (ib < 0 ? Infinity : ib);
    return a.localeCompare(b);
  });

const books = ids.map((id) => {
  const book = JSON.parse(fs.readFileSync(path.join(BOOKS, id, 'book.json'), 'utf-8'));
  if (book.id !== id) throw new Error(`books/${id}/book.json 의 id 가 폴더 이름과 다릅니다: ${book.id}`);
  return book;
});

const text = `${JSON.stringify({ books }, null, 2)}\n`;

if (CHECK) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8').replace(/\r\n/g, '\n') : '';
  if (now !== text) {
    console.error('✖ data/books.json 이 books/*/book.json 과 다릅니다. 고치려면: node scripts/gen-books.mjs');
    process.exit(1);
  }
  console.log(`✅ data/books.json — ${books.length}권, 원본과 같음`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text);
  console.log(`✅ data/books.json — ${books.length}권 (${books.map((b) => b.id).join(', ')})`);
}
