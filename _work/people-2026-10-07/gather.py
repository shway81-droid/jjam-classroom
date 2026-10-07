"""후보 인물마다 공용 분류/검색에서 사진을 모아 라이선스를 거르고, 얼굴을 찾아 세로로 자른다.
입력: candidates.tsv (topic \t ko \t cat1|cat2 \t search)
출력: out/<key>/cand-N.jpg + meta.json (후보 전부), 그리고 best 선택"""
import sys, os, json, re, io, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons
from commons import get, info, fetch
import cv2, numpy as np
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
OK_LIC = re.compile(r'^(CC0|Public domain|CC BY(-SA)? [1-4]\.0( [a-z]{2})?|KOGL Type 1)$')
CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
OUT = 'out'

def norm_license(l):
    l = (l or '').strip()
    l = re.sub(r'\s+', ' ', l)
    if l.lower() in ('public domain', 'pd'): return 'Public domain'
    if l.upper() == 'CC0' or l.startswith('CC0 '): return 'CC0'
    m = re.match(r'^CC[ -]BY(-SA)?[ -]([1-4]\.0)( [a-z]{2})?$', l, re.I)
    if m: return 'CC BY%s %s%s' % ((m.group(1) or '').upper(), m.group(2), (m.group(3) or '').lower())
    if 'KOGL' in l.upper() and ('1' in l): return 'KOGL Type 1'
    return l

def files_in_cat(cat, depth=1):
    out = []
    try:
        r = get({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file|subcat', 'cmlimit': 200, 'cmsort': 'timestamp', 'cmdir': 'desc'})
    except Exception as e:
        return out
    subs = []
    for m in r['query']['categorymembers']:
        t = m['title']
        if t.startswith('File:'): out.append(t)
        elif t.startswith('Category:') and re.search(r'20\d\d', t): subs.append(t[9:])
    if depth > 0 and len(out) < 8:
        for s in sorted(subs, reverse=True)[:2]:
            out += files_in_cat(s, depth - 1)
    return out

def search_files(q, n=20):
    try:
        r = get({'action': 'query', 'list': 'search', 'srsearch': q, 'srnamespace': 6, 'srlimit': n})
        return [m['title'] for m in r['query']['search']]
    except Exception:
        return []

def faces(img):
    g = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    s = min(img.size)
    fs = CASCADE.detectMultiScale(g, scaleFactor=1.08, minNeighbors=7, minSize=(max(40, s // 14),) * 2)
    return sorted([tuple(map(int, f)) for f in fs], key=lambda f: -f[2] * f[3])

def crop_portrait(img, face, r=0.78, mult=3.4, eye=0.36):
    W, H = img.size
    fx, fy, fw, fh = face
    ch = fh * mult; cw = ch * r
    if cw > W: cw = W; ch = cw / r
    if ch > H: ch = H; cw = ch * r
    cx = fx + fw / 2; cy = fy + fh / 2
    left = min(max(cx - cw / 2, 0), W - cw)
    top = min(max(cy - eye * ch, 0), H - ch)
    return img.crop((int(left), int(top), int(left + cw), int(top + ch)))

def score(meta, img, fs):
    W, H = img.size
    if not fs: return -1, 'noface'
    f = fs[0]
    big = f[2] * f[3]
    others = [g for g in fs[1:] if g[2] * g[3] > big * 0.35]
    sc = min(f[2], 260) / 260 * 50          # 얼굴 픽셀 크기
    sc -= 25 * len(others)                    # 비슷한 크기 얼굴이 또 있으면 단체 사진
    y = re.search(r'(20\d\d)', meta.get('date', '') or meta['title'])
    if y: sc += (int(y.group(1)) - 2012) * 1.5
    return sc, f'face={f[2]} others={len(others)}'

def gen_infos(params):
    """generator 쿼리 한 번으로 파일 목록과 사진 정보를 같이 받는다."""
    base = {'action': 'query', 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mime', 'iiurlwidth': 960}
    try:
        r = get(dict(base, **params))
    except Exception:
        return [], []
    out, subs = [], []
    for pg in r.get('query', {}).get('pages', []):
        t = pg['title']
        if t.startswith('Category:'):
            subs.append(t[9:]); continue
        if 'imageinfo' not in pg or not re.search(r'\.(jpe?g|png|webp)$', t, re.I): continue
        ii = pg['imageinfo'][0]; m = ii.get('extmetadata', {})
        st = commons.strip
        out.append({'title': t, 'w': ii['width'], 'h': ii['height'], 'mime': ii.get('mime'), 'url': ii['url'],
                    'thumb': ii.get('thumburl'), 'page': ii['descriptionurl'],
                    'license': st(m.get('LicenseShortName', {}).get('value')), 'artist': st(m.get('Artist', {}).get('value')),
                    'credit': st(m.get('Credit', {}).get('value'))[:200], 'date': st(m.get('DateTimeOriginal', {}).get('value'))[:40],
                    'desc': st(m.get('ImageDescription', {}).get('value'))[:200]})
    return out, subs

def process(key, ko, cats, query, maxcand=2):
    d = os.path.join(OUT, key); os.makedirs(d, exist_ok=True)
    mp = os.path.join(d, 'meta.json')
    if os.path.exists(mp): return json.load(open(mp))
    metas = []
    for c in cats:
        if not c: continue
        got, subs = gen_infos({'generator': 'categorymembers', 'gcmtitle': 'Category:' + c, 'gcmtype': 'file|subcat',
                               'gcmlimit': 40, 'gcmsort': 'timestamp', 'gcmdir': 'desc'})
        metas += got
        if len(got) < 6:
            for sc in sorted([x for x in subs if re.search(r'20\d\d', x)], reverse=True)[:1]:
                metas += gen_infos({'generator': 'categorymembers', 'gcmtitle': 'Category:' + sc, 'gcmtype': 'file', 'gcmlimit': 30})[0]
        if metas: break
    if len(metas) < 3 and query:
        metas += gen_infos({'generator': 'search', 'gsrsearch': query, 'gsrnamespace': 6, 'gsrlimit': 20})[0]
    titles = [m['title'] for m in metas]
    good = []
    seen = set()
    for m in metas:
        if m['title'] in seen: continue
        seen.add(m['title'])
        m['nlicense'] = norm_license(m['license'])
        if not OK_LIC.match(m['nlicense']): continue
        if min(m['w'], m['h']) < 450: continue
        good.append(m)
    # 최신 + 세로 사진 우선으로 앞에서 몇 장만 내려받는다
    def pre(m):
        y = re.search(r'(20\d\d)', (m.get('date') or '') + ' ' + m['title'])
        return (int(y.group(1)) if y else 2000) + (1 if m['h'] >= m['w'] else 0)
    good.sort(key=pre, reverse=True)
    res = []
    for i, m in enumerate(good[:maxcand]):
        try:
            url = m['thumb'] if m['w'] > 960 else m['url']
            raw = fetch(url, binary=True)
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
        except Exception as e:
            continue
        fs = faces(img)
        sc, why = score(m, img, fs)
        p = os.path.join(d, f'cand-{i}.jpg')
        img.save(p, quality=88)
        if fs:
            crop_portrait(img, fs[0]).save(os.path.join(d, f'crop-{i}.jpg'), quality=88)
        res.append(dict(m, idx=i, score=sc, why=why, size=img.size, faces=fs[:4]))
        if sc >= 20: break
    out = {'key': key, 'ko': ko, 'n_titles': len(titles), 'n_ok': len(good), 'cands': res}
    json.dump(out, open(mp, 'w'), ensure_ascii=False, indent=1)
    return out

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[1]) if l.strip() and not l.startswith('#')]
    for r in rows:
        topic, ko, cats, query = (r + ['', '', ''])[:4]
        key = topic + '_' + ko.replace(' ', '_')
        try:
            o = process(key, ko, cats.split('|'), query)
            best = max(o['cands'], key=lambda c: c['score'], default=None)
            print(f"{topic}\t{ko}\ttitles={o['n_titles']} ok={o['n_ok']} cands={len(o['cands'])} best={best and round(best['score'],1)} {best and best['why']}", flush=True)
        except Exception as e:
            print(f'{topic}\t{ko}\tERR {e}', flush=True)
