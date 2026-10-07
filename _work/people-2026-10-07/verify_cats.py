"""고른 사진이 그 사람의 공용 분류에 들어 있는지 대조한다. 출력: key, 파일, 일치 여부, 분류 목록"""
import sys, os, json, glob, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from commons import get
import phase_b
pick = json.load(open('pick.json')) if os.path.exists('pick.json') else {}
rows = []
for mp in sorted(glob.glob('out/*/meta.json')):
    m = json.load(open(mp)); key = m['key']
    if pick.get(key) == 'skip': continue
    cands = [c for c in m['cands'] if os.path.exists(f"out/{key}/crop-{c['idx']}.jpg")]
    if not cands: continue
    p = pick.get(key)
    best = next((c for c in cands if isinstance(p, dict) and c['idx'] == p.get('idx')), None) or max(cands, key=lambda c: c['score'])
    rows.append((key, best['title']))
cache = json.load(open('cats_cache.json')) if os.path.exists('cats_cache.json') else {}
todo = [t for _, t in rows if t not in cache]
for i in range(0, len(todo), 40):
    r = get({'action': 'query', 'titles': '|'.join(todo[i:i+40]), 'prop': 'categories', 'cllimit': 'max', 'clshow': '!hidden'})
    norm = {n['to']: n['from'] for n in r['query'].get('normalized', [])}
    for pg in r['query']['pages']:
        cats = [c['title'][9:] for c in pg.get('categories', [])]
        cache[norm.get(pg['title'], pg['title'])] = cats
json.dump(cache, open('cats_cache.json', 'w'), ensure_ascii=False, indent=0)
for key, t in rows:
    ko, ens = phase_b.NAMES.get(key, ('', []))
    cats = cache.get(t, [])
    ok = any(phase_b.squash(e) and phase_b.squash(e) in phase_b.squash(c) for c in cats for e in ens) or any(ko.replace(' ', '') in c.replace(' ', '') for c in cats)
    print(('OK ' if ok else '?? ') + key, '|', t[5:60], '|', '; '.join(cats)[:150])
