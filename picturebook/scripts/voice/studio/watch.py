# VoiceStudio 의 엔진 설치(sidecar)·모델 받기가 끝날 때까지 지켜보고 상태가 바뀔 때만 한 줄씩 적습니다.
#   python watch.py engine1 engine2 ... [--model repo_id] [--max-min 60]
import json
import sys
import time
import urllib.request

API = 'http://localhost:3900'


def get(path):
    with urllib.request.urlopen(API + path, timeout=20) as r:
        return json.loads(r.read().decode('utf-8', 'replace'))


def main():
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    args = sys.argv[1:]
    models, engines, max_min = [], [], 60
    i = 0
    while i < len(args):
        if args[i] == '--model':
            models.append(args[i + 1]); i += 2
        elif args[i] == '--max-min':
            max_min = float(args[i + 1]); i += 2
        else:
            engines.append(args[i]); i += 1
    last = {}
    t0 = time.time()
    while time.time() - t0 < max_min * 60:
        pending = 0
        for e in engines:
            try:
                s = get(f'/engines/sidecar/{e}/install/status')
            except Exception as ex:  # noqa: BLE001
                line = f'status error {ex!r}'[:200]; pending += 1
            else:
                job = s.get('job') or {}
                state = job.get('state')
                steps = job.get('steps') or []
                cur = next((st for st in steps if st.get('state') in ('running', 'active')), None)
                wp = job.get('weights_progress') or {}
                pct = wp.get('percent') if isinstance(wp, dict) else None
                line = f'installed={s.get("installed")} state={state} step={(cur or {}).get("label") or (cur or {}).get("id")}'
                if pct is not None:
                    line += f' weights={pct:.0f}%' if isinstance(pct, (int, float)) else f' weights={pct}'
                if job.get('error'):
                    line += f' ERROR={str(job.get("error"))[:300]}'
                if not s.get('installed') and state not in ('failed', 'error', 'cancelled'):
                    pending += 1
            if last.get(e) != line:
                last[e] = line
                print(time.strftime('%H:%M:%S'), e, line, flush=True)
        for m in models:
            try:
                d = get('/models')
                items = d if isinstance(d, list) else d.get('models', [])
                it = next((x for x in items if x.get('repo_id') == m), {})
                line = f'installed={it.get("installed")}'
                if not it.get('installed'):
                    pending += 1
            except Exception as ex:  # noqa: BLE001
                line = f'error {ex!r}'[:200]; pending += 1
            if last.get(m) != line:
                last[m] = line
                print(time.strftime('%H:%M:%S'), m, line, flush=True)
        if pending == 0:
            print('all done', flush=True)
            return
        time.sleep(15)
    print('timeout', flush=True)


if __name__ == '__main__':
    main()
