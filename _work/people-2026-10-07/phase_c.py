"""대체 사진 내려받기. 사용: python3 phase_c.py <key> <info.good 번호|목록> ...  또는  --list <key>
번호를 주면 그 파일을 표준 썸네일로 받아 meta.json cands 에 더한다."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import phase_b
from gather import faces, crop_portrait, score

def listing(key):
    info = json.load(open(f'out/{key}/info.json'))
    for i, m in enumerate(info['good']):
        print(i, 'HIT' if phase_b.hit_of(key, m) else '   ', m['w'], m['h'], m['nlicense'], '|', m['artist'][:20], '|', m['date'][:10], '|', m['title'][5:80])

def get(key, idxs):
    d = f'out/{key}'
    info = json.load(open(f'{d}/info.json'))
    mp = f'{d}/meta.json'
    meta = json.load(open(mp)) if os.path.exists(mp) else {'key': key, 'ko': info['ko'], 'n_titles': info['n'], 'n_ok': len(info['good']), 'cands': []}
    have = {c['idx'] for c in meta['cands']}
    for i in idxs:
        if i in have: continue
        m = info['good'][i]
        url = phase_b.thumb_url(m)
        if not url: print(key, i, 'no thumb'); continue
        img = phase_b.fetch_img(url)
        if img is None: print(key, i, 'fail'); continue
        fs = faces(img)
        sc, why = score(m, img, fs)
        img.save(f'{d}/cand-{i}.jpg', quality=90)
        if fs: crop_portrait(img, fs[0]).save(f'{d}/crop-{i}.jpg', quality=88)
        meta['cands'].append(dict(m, idx=i, score=sc, why=why, size=img.size, faces=fs[:4], dl=url))
        print(key, i, round(sc, 1), why, flush=True)
    json.dump(meta, open(mp, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    if sys.argv[1] == '--list':
        for k in sys.argv[2:]: print('##', k); listing(k)
    else:
        args = sys.argv[1:]
        for a in args:
            k, _, ids = a.partition(':')
            get(k, [int(x) for x in ids.split(',') if x])
