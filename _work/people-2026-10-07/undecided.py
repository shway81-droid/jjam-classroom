import sys, os, json, glob
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
topic = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 20
pick = json.load(open('pick.json'))
rows = []
for mp in sorted(glob.glob(f'out/{topic}_*/meta.json')):
    m = json.load(open(mp)); key = m['key']
    if key in pick: continue
    cands = [c for c in m['cands'] if os.path.exists(f"out/{key}/crop-{c['idx']}.jpg")]
    if not cands: continue
    best = max(cands, key=lambda c: c['score'])
    rows.append((key, m['ko'], best))
sel = rows[:n]
TW, TH, cols = 234, 300, 5
sheet = Image.new('RGB', (cols * TW, max(1, (len(sel) + cols - 1) // cols) * (TH + 30)), 'white')
d = ImageDraw.Draw(sheet); font = ImageFont.load_default(size=22)
for i, (key, ko, c) in enumerate(sel):
    im = Image.open(f"out/{key}/crop-{c['idx']}.jpg"); im.thumbnail((TW - 6, TH - 6))
    x, y = (i % cols) * TW, (i // cols) * (TH + 30)
    sheet.paste(im, (x + 3, y + 3))
    d.text((x + 4, y + TH), f"{i}  #{c['idx']}  {c['size'][0]}x{c['size'][1]}", fill='black', font=font)
    print(i, ko, f"#{c['idx']}", '|', c['nlicense'], '|', c['artist'][:30], '|', c['date'][:10], '|', c['title'][5:80])
sheet.save(f'und_{topic}.jpg', quality=82)
print('remaining undecided with crops:', len(rows))
