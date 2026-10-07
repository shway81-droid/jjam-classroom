"""out/*/ 의 최선 크롭을 모아 번호 붙은 모아보기 시트로 만든다.
사용: python3 sheet.py <topic> [start] [count]"""
import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
topic = sys.argv[1]; start = int(sys.argv[2]) if len(sys.argv) > 2 else 0; count = int(sys.argv[3]) if len(sys.argv) > 3 else 15
font = ImageFont.truetype('/home/user/jjam-classroom/word/assets/fonts/PretendardVariable.subset.woff2', 22) if False else None
try:
    from PIL import ImageFont
    font = ImageFont.load_default(size=22)
except Exception:
    try: font = ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', 20)
    except Exception: font = ImageFont.load_default()
pick = json.load(open('pick.json')) if os.path.exists('pick.json') else {}
rows = []
for mp in sorted(glob.glob(f'out/{topic}_*/meta.json')):
    m = json.load(open(mp))
    key = m['key']
    if key in pick and pick[key] == 'skip': continue
    cands = [c for c in m['cands'] if os.path.exists(f"out/{key}/crop-{c['idx']}.jpg")]
    if not cands: continue
    if key in pick and isinstance(pick[key], int):
        best = next((c for c in cands if c['idx'] == pick[key]), None)
    else:
        best = max(cands, key=lambda c: c['score'])
    if best: rows.append((key, m['ko'], best))
sel = rows[start:start + count]
TW, TH = 234, 300
cols = 5
sheet = Image.new('RGB', (cols * TW, ((len(sel) + cols - 1) // cols) * (TH + 30)), 'white')
d = ImageDraw.Draw(sheet)
for i, (key, ko, c) in enumerate(sel):
    im = Image.open(f"out/{key}/crop-{c['idx']}.jpg"); im.thumbnail((TW - 6, TH - 6))
    x, y = (i % cols) * TW, (i // cols) * (TH + 30)
    sheet.paste(im, (x + 3, y + 3))
    d.text((x + 4, y + TH), f"{start + i}  #{c['idx']}  {c['size'][0]}x{c['size'][1]}", fill='black', font=font)
out = f'sheet_{topic}_{start}.jpg'
for i, (key, ko, c) in enumerate(sel): print(start + i, ko, '|', c['nlicense'], '|', c['artist'][:40], '|', c['date'][:10], '|', c['title'][5:70])
sheet.save(out, quality=82)
print(out, len(rows))
