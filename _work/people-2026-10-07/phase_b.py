"""2단계: 표준 크기 썸네일만 천천히 내려받아 얼굴을 찾고 자른다. out/<key>/meta.json (gather 와 같은 형식)
위키미디어는 원본·비표준 크기 직접 요청을 막는다(https://w.wiki/GHai). 표준: 500·960·1280·1920."""
import sys, os, json, re, io, time, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import commons
from gather import faces, crop_portrait, score
from PIL import Image, ImageOps
commons.GAPS['upload.wikimedia.org'] = 6.0

def thumb_url(m):
    u = urllib.parse.urlsplit(m['url'])
    path = u.path  # /wikipedia/commons/a/ab/Name.jpg
    mm = re.match(r'^/wikipedia/commons/([0-9a-f])/([0-9a-f]{2})/(.+)$', path)
    if not mm: return None
    name = mm.group(3)
    if not re.search(r'\.(jpe?g|png)$', name, re.I): return None
    w = m['w']
    step = next((s for s in (1920, 1280, 960, 500) if s < w), None)
    if not step: return None
    return f'https://upload.wikimedia.org/wikipedia/commons/thumb/{mm.group(1)}/{mm.group(2)}/{name}/{step}px-{name}'

def fetch_img(url):
    # 429 면 retry-after 를 지킨다(최대 11분). 다른 오류는 포기.
    for attempt in range(6):
        try:
            raw = commons.fetch_once(url)
            return ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
        except commons.RateLimited as e:
            w = min(max(e.wait, 15), 660)
            sys.stderr.write(f'{time.strftime("%H:%M:%S")} 429 wait {w} {url[-60:]}\n'); sys.stderr.flush()
            time.sleep(w)
        except Exception as e:
            sys.stderr.write(f'{time.strftime("%H:%M:%S")} ERR {e} {url[-60:]}\n'); sys.stderr.flush()
            return None
    return None

NAMES = {}
for f in ('cand_ent.tsv', 'cand_ent2.tsv', 'cand_actor.tsv', 'cand_singer.tsv'):
    for line in open(f, encoding='utf-8'):
        if not line.strip() or line.startswith('#'): continue
        t, ko, cats, q = (line.rstrip('\n').split('\t') + ['', '', ''])[:4]
        ens = [re.sub(r'\s*\(.*?\)', '', c).strip() for c in cats.split('|') if c]
        NAMES[t + '_' + ko.replace(' ', '_')] = (ko, ens)

def squash(s):
    return re.sub(r'[\s\-_.,]', '', s).lower()

GROUP = re.compile(r'(cast|members|group|fan ?meeting|팬미팅|단체|멤버들| and )', re.I)
def rank(key, good):
    ko, ens = NAMES.get(key, ('', []))
    def r(ix_m):
        i, m = ix_m
        t = m['title'][5:]
        return (0 if hit_of(key, m) else 1, 1 if GROUP.search(t) else 0, i)
    allowed = json.load(open(f'out/{key}/allowed.json')) if os.path.exists(f'out/{key}/allowed.json') else {}
    return [x for x in sorted(enumerate(good), key=r) if x[1]['title'] in allowed]

def hit_of(key, m):
    ko, ens = NAMES.get(key, ('', []))
    t = m['title'][5:] + ' ' + (m.get('desc') or '')
    return bool((ko and ko.replace(' ', '') in t.replace(' ', '')) or any(e and squash(e) in squash(t) for e in ens))

def run(key):
    d = os.path.join('out', key)
    mp = os.path.join(d, 'meta.json')
    if os.path.exists(mp): return None
    info = json.load(open(os.path.join(d, 'info.json')))
    if not os.path.exists(os.path.join(d, 'allowed.json')):
        import own_cat2
        own_cat2.allowed_for([key], verbose=False)
    res = []
    tried = 0
    for i, m in rank(key, info['good']):
        if tried >= 3: break
        url = thumb_url(m)
        if not url: continue
        tried += 1
        img = fetch_img(url)
        if img is None: continue
        fs = faces(img)
        sc, why = score(m, img, fs)
        img.save(os.path.join(d, f'cand-{i}.jpg'), quality=90)
        if fs: crop_portrait(img, fs[0]).save(os.path.join(d, f'crop-{i}.jpg'), quality=88)
        res.append(dict(m, idx=i, score=sc, why=why, size=img.size, faces=fs[:4], dl=url))
        if sc >= 20: break
    out = {'key': key, 'ko': info['ko'], 'n_titles': info['n'], 'n_ok': len(info['good']), 'cands': res}
    json.dump(out, open(mp, 'w'), ensure_ascii=False, indent=1)
    return out

if __name__ == '__main__':
    keys = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    for k in keys:
        while not os.path.exists(f'out/{k}/info.json'):
            if 'PHASE_A_DONE' in open('log_a.txt').read(): break
            time.sleep(10)
        if not os.path.exists(f'out/{k}/info.json'): continue
        o = run(k)
        if o is None: continue
        best = max(o['cands'], key=lambda c: c['score'], default=None)
        print(f"{k}\tok={o['n_ok']}\tcands={len(o['cands'])}\tbest={best and round(best['score'], 1)} {best and best['why']}", flush=True)
    print('PHASE_B_DONE', flush=True)
