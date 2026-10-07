import json, re, sys, urllib.request, urllib.parse, html
UA = 'jjam-word-people/1.0 (https://github.com/shway81-droid/jjam-classroom)'
API = 'https://commons.wikimedia.org/w/api.php'

import time, urllib.error
_last = {}
GAP = 5.0
GAPS = {'upload.wikimedia.org': 3.0, 'thumb.wikimedia.org': 3.0}
def fetch(url, binary=False):
    host = urllib.parse.urlparse(url).netloc
    gap = GAPS.get(host, GAP)
    for attempt in range(8):
        wait = _last.get(host, 0) + gap - time.time()
        if wait > 0: time.sleep(wait)
        _last[host] = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            data = urllib.request.urlopen(req, timeout=60).read()
            return data if binary else json.loads(data)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                ra = e.headers.get('retry-after')
                w = min(int(ra) if ra and ra.isdigit() else 10, 30) + 5 * attempt
                sys.stderr.write(f'{time.strftime("%H:%M:%S")} 429 {host} wait {w}\n'); sys.stderr.flush()
                time.sleep(w)
                continue
            raise
        except Exception as e:
            sys.stderr.write(f'{time.strftime("%H:%M:%S")} ERR {host} {e}\n'); sys.stderr.flush()
            time.sleep(10)
    raise RuntimeError('rate limited: ' + url)

class RateLimited(Exception):
    def __init__(self, wait): self.wait = wait

def fetch_once(url):
    """한 번만 요청한다. 429 면 RateLimited(retry-after) 를 던진다. 호스트별 간격은 지킨다."""
    host = urllib.parse.urlparse(url).netloc
    gap = GAPS.get(host, GAP)
    wait = _last.get(host, 0) + gap - time.time()
    if wait > 0: time.sleep(wait)
    _last[host] = time.time()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        return urllib.request.urlopen(req, timeout=60).read()
    except urllib.error.HTTPError as e:
        if e.code == 429:
            ra = e.headers.get('retry-after')
            raise RateLimited(int(ra) if ra and ra.isdigit() else 30)
        raise

def get(params):
    params = dict(params, format='json', formatversion='2')
    return fetch(API + '?' + urllib.parse.urlencode(params))

def strip(s):
    s = re.sub(r'<[^>]+>', '', s or '')
    return html.unescape(s).strip()

def info(titles, width=720):
    """titles: list of 'File:...' -> dict title -> meta"""
    out = {}
    for i in range(0, len(titles), 40):
        chunk = titles[i:i+40]
        r = get({'action': 'query', 'titles': '|'.join(chunk), 'prop': 'imageinfo',
                 'iiprop': 'url|size|extmetadata|mime', 'iiurlwidth': width})
        norm = {n['from']: n['to'] for n in r['query'].get('normalized', [])}
        for pg in r['query']['pages']:
            if 'imageinfo' not in pg:
                out[pg['title']] = None; continue
            ii = pg['imageinfo'][0]; m = ii.get('extmetadata', {})
            out[pg['title']] = {
                'title': pg['title'], 'w': ii['width'], 'h': ii['height'], 'mime': ii.get('mime'),
                'url': ii['url'], 'thumb': ii.get('thumburl'), 'tw': ii.get('thumbwidth'), 'th': ii.get('thumbheight'),
                'page': ii['descriptionurl'],
                'license': strip(m.get('LicenseShortName', {}).get('value')),
                'artist': strip(m.get('Artist', {}).get('value')),
                'credit': strip(m.get('Credit', {}).get('value'))[:200],
                'date': strip(m.get('DateTimeOriginal', {}).get('value'))[:40],
                'desc': strip(m.get('ImageDescription', {}).get('value'))[:200],
                'cats': strip(m.get('Categories', {}).get('value'))[:300],
                'restrict': strip(m.get('Restrictions', {}).get('value')),
            }
        for a, b in norm.items():
            out[a] = out.get(b)
    return out

def catfiles(cat, limit=200):
    r = get({'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file|subcat', 'cmlimit': limit})
    return [m['title'] for m in r['query']['categorymembers']]

def search(text, limit=30):
    r = get({'action': 'query', 'list': 'search', 'srsearch': text, 'srnamespace': 6, 'srlimit': limit})
    return [m['title'] for m in r['query']['search']]

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'info':
        for t, m in info(sys.argv[2:]).items(): print(json.dumps(m, ensure_ascii=False))
    elif cmd == 'cat':
        print('\n'.join(catfiles(sys.argv[2])))
    elif cmd == 'search':
        print('\n'.join(search(' '.join(sys.argv[2:]))))
