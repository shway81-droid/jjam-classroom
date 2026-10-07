"""저장소에는 사진(jpg)을 올리지 않았다. 고른 사진(pick.json)의 원본 썸네일만 다시 받는다.
사용: python3 refetch_picks.py   (build.py 전에 한 번)"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import phase_b
from gather import faces, crop_portrait
picks = json.load(open('pick.json'))
for key, p in picks.items():
    if p == 'skip': continue
    d = f'out/{key}'
    if os.path.exists(f"{d}/cand-{p['idx']}.jpg"): continue
    meta = json.load(open(f'{d}/meta.json'))
    c = next(c for c in meta['cands'] if c['idx'] == p['idx'])
    img = phase_b.fetch_img(c.get('dl') or phase_b.thumb_url(c))
    if img is None: print('실패', key); continue
    img.save(f"{d}/cand-{p['idx']}.jpg", quality=90)
    fs = faces(img)
    if fs: crop_portrait(img, fs[0]).save(f"{d}/crop-{p['idx']}.jpg", quality=88)
    print('받음', key, flush=True)
