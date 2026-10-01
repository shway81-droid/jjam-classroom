/* ===================================================================
   짬짬이 사이트 전환 — 헤더에 자매 사이트를 바로 놓는다
   ===================================================================
   짬짬이 게임·퀴즈·영상·이야기·낱말·1분사회·그리기는 발행 저장소가 일곱으로 갈라져 있지만
   선생님에게는 "자투리 시간에 쓰는 짬짬이" 하나다. 지금은 한 곳에 들어오면 나머지가
   있다는 걸 알 방법이 없어서, 헤더에서 곧바로 건너갈 수 있게 한다.

   모양은 [아이콘 + 그 아래 이름] 한 벌씩. 아이콘만 두는 안도 검토했지만,
   처음 보는 사람은 그 그림이 "다른 사이트로 가는 것"인 줄 모른다.
   (구글의 점 아홉 개처럼 이미 학습된 기호가 아니다.) 그래서 이름을 붙였다.

   쓰는 법 — 헤더 오른쪽 버튼 줄 안에 host 를 하나 놓고 이 파일을 불러온다.

     <div class="jjam-switch" data-site="game"></div>
     <script src="shared/jjam-switcher.js" defer></script>

   data-site 는 "지금 있는 곳"이다(game | quiz | video | story | word | 1min | draw).
   그 항목은 빠지고 SITES 의 나머지가 그려진 뒤, 맨 끝에 '전체 보기'(모아보기)가 붙는다.

   이 파일은 여섯 저장소에서 글자 하나까지 같아야 한다.
   고칠 때는 jjam(상류)에서 고친 뒤 나머지 넷에서 `sync:shared` 를 돌린다.

   스타일·아이콘까지 이 파일 안에 들어 있다. 여섯 사이트의 CSS 가 서로 다른
   구조라서, 각 CSS 에 같은 규칙을 다섯 번 복사해 두면 또 어긋나기 때문이다.
   =================================================================== */

(function () {
  'use strict';

  // label — 화면에 보이는 이름. 폭을 맞추려고 띄어쓰기를 넣지 않았다.
  // go    — 화면 낭독기가 읽는 문장. 조사(으로/로)가 이름마다 달라 통째로 적는다.
  //
  // 헤더에 거는 것은 **완성된 일곱**뿐이다 — 게임·퀴즈·영상·이야기·낱말·1분사회·그리기.
  // (그리기는 2026-10-01 완성되어 더했다.) 쉼·스트레칭은 저장소는 있지만 아직 작업 중이라 넣지 않는다.
  // (완성되면 여기에 한 벌씩 더하면 된다.)
  //
  // 나중에 쉼을 걸 때는 아래 한 벌만 되살리면 된다(아이콘은 ART.rest 에 그대로 있다).
  //   { key: 'rest', label: '짬짬이쉼', go: '짬짬이 쉼으로 가기',
  //     url: 'https://shway81-droid.github.io/jjam-rest/' }
  var SITES = [
    { key: 'game',  label: '짬짬이게임',   go: '짬짬이 게임으로 가기',
      url: 'https://shway81-droid.github.io/jjam/' },
    { key: 'quiz',  label: '짬짬이퀴즈',   go: '짬짬이 퀴즈로 가기',
      url: 'https://shway81-droid.github.io/jjam-quiz/' },
    { key: 'video', label: '짬짬이영상',   go: '짬짬이 영상으로 가기',
      url: 'https://shway81-droid.github.io/jjam-video/' },
    { key: 'story', label: '짬짬이이야기', go: '짬짬이 이야기로 가기',
      url: 'https://shway81-droid.github.io/jjam-story/' },
    { key: 'word',  label: '짬짬이낱말',   go: '짬짬이 낱말로 가기',
      url: 'https://shway81-droid.github.io/jjam-word/' },
    { key: '1min',  label: '짬짬이1분사회', go: '짬짬이 1분사회로 가기',
      url: 'https://shway81-droid.github.io/jjam-1min/' },
    { key: 'draw',  label: '짬짬이그리기', go: '짬짬이 그리기로 가기',
      url: 'https://shway81-droid.github.io/jjam-draw/' }
  ];

  // 맨 끝의 '전체 보기' — 일곱 사이트를 모은 모아보기(짬짬이 교실, 2026-10-01).
  // 사이트가 더 늘어 헤더에 다 걸 수 없게 되어도 여기로 가면 전부 있다.
  var HOME = { key: 'home', label: '전체보기', go: '짬짬이 교실 전체 보기',
    url: 'https://shway81-droid.github.io/jjam-classroom/' };

  // 각 사이트의 favicon.svg 와 같은 그림 — 둥근 타일 + 우상단 "자투리 시간" 시계 배지.
  // 다른 사이트의 파일을 가져올 수는 없으므로(오프라인·교차 출처) 여기에 넣는다.
  var BADGE =
    '<circle cx="76" cy="24" r="14" fill="#FFFFFF"/>' +
    '<path d="M76 15.5 V24.5 L82.5 28.5" fill="none" stroke="#152447" ' +
    'stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>';

  var ART = {
    game:
      '<rect width="100" height="100" rx="24" fill="#FFB703"/>' +
      '<circle cx="44" cy="58" r="30" fill="#152447"/>' +
      '<path d="M37 44 L37 72 L61 58 Z" fill="#FFB703"/>' + BADGE,
    quiz:
      '<rect width="100" height="100" rx="24" fill="#12A57C"/>' +
      '<circle cx="44" cy="58" r="30" fill="#FFFFFF"/>' +
      '<path d="M34 49 A11 11 0 1 1 45 60 L45 64" fill="none" stroke="#12A57C" ' +
      'stroke-width="7.4" stroke-linecap="round"/>' +
      '<circle cx="45" cy="73.5" r="4.4" fill="#12A57C"/>' + BADGE,
    video:
      '<rect width="100" height="100" rx="24" fill="#4FA8E8"/>' +
      '<rect x="14" y="44" width="60" height="36" rx="7" fill="#FFFFFF"/>' +
      '<path d="M21 44 H67 A7 7 0 0 1 74 51 V58 H14 V51 A7 7 0 0 1 21 44 Z" fill="#152447"/>' +
      '<path d="M28 44 L22 58 M44 44 L38 58 M60 44 L54 58" fill="none" stroke="#FFFFFF" ' +
      'stroke-width="4.4" stroke-linecap="round"/>' + BADGE,
    story:
      '<rect width="100" height="100" rx="24" fill="#6145B5"/>' +
      '<path d="M17 43c8.5-4.5 17-4.5 26 0v37c-9-4.5-17.5-4.5-26 0z" fill="#FFFFFF"/>' +
      '<path d="M71 43c-8.5-4.5-17-4.5-26 0v37c9-4.5 17.5-4.5 26 0z" fill="#E8DEFF"/>' + BADGE,
    word:
      '<rect width="100" height="100" rx="24" fill="#E4576E"/>' +
      '<path d="M20 36h34a10 10 0 0 1 10 10v14a10 10 0 0 1-10 10H38L24 82V70h-4a10 10 0 0 1-10-10' +
      'V46a10 10 0 0 1 10-10z" fill="#FFFFFF"/>' +
      '<path d="M24 44h26v20h-7V51H24z" fill="#E4576E"/>' + BADGE,
    '1min':
      '<rect width="100" height="100" rx="24" fill="#E8590C"/>' +
      '<rect x="24" y="30" width="40" height="58" rx="8" fill="#FFFFFF"/>' +
      '<rect x="30" y="38" width="28" height="42" rx="4" fill="#152447"/>' +
      '<circle cx="44" cy="59" r="10.5" fill="none" stroke="#FFFFFF" stroke-width="3"/>' +
      '<ellipse cx="44" cy="59" rx="4.6" ry="10.5" fill="none" stroke="#FFFFFF" stroke-width="2.6"/>' +
      '<path d="M33.5 59 H54.5" fill="none" stroke="#FFFFFF" stroke-width="2.6"/>' + BADGE,
    // jjam-draw 의 favicon.svg 와 같은 연필(배지는 가족 공통 BADGE 로 맞췄다)
    draw:
      '<rect width="100" height="100" rx="24" fill="#E4572E"/>' +
      '<polygon points="71.6,86.4 32.1,46.9 44.9,34.1 84.4,73.6" fill="#FFFFFF"/>' +
      '<polygon points="32.1,46.9 24,26 44.9,34.1" fill="#152447"/>' +
      '<polygon points="71.6,86.4 65.4,80.2 78.2,67.4 84.4,73.6" fill="#152447"/>' +
      '<line x1="38.5" y1="40.5" x2="78" y2="80" stroke="#E4572E" stroke-width="2.4" stroke-opacity=".55"/>' + BADGE,
    // 모아보기(짬짬이 교실) 로고 — home/favicon.svg 와 같은 그림. 흰 타일이라 네이비 헤더 위에서 구분된다.
    home:
      '<rect width="100" height="100" rx="24" fill="#FFFFFF"/>' +
      '<circle cx="50" cy="52" r="28" fill="none" stroke="#152447" stroke-width="9"/>' +
      '<path d="M50 35 V53 L62 61" fill="none" stroke="#FFB703" stroke-width="9" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    // rest 는 SITES 에 아직 없어서 지금은 그려지지 않는다. 링크를 거는 순간
    // 바로 쓰도록 그림만 남겨 둔다 (jjam-rest 의 favicon.svg 와 같은 그림).
    rest:
      '<rect width="100" height="100" rx="24" fill="#0E7C86"/>' +
      '<circle cx="44" cy="58" r="9" fill="#FFFFFF"/>' +
      '<circle cx="44" cy="58" r="17.5" fill="none" stroke="#FFFFFF" stroke-width="6"/>' +
      '<circle cx="44" cy="58" r="27" fill="none" stroke="#FFFFFF" stroke-width="6" ' +
      'stroke-opacity="0.62"/>' + BADGE
  };

  var CSS = [
    /* host 는 헤더 버튼 줄의 flex 자식 하나다. 안쪽 배치는 스스로 책임진다. */
    '.jjam-switch{position:relative;display:flex;align-items:center;gap:4px;flex:none}',
    '.jjam-switch[hidden]{display:none}',
    '.jjam-switch-sep{width:1px;height:30px;background:rgba(255,255,255,.28);margin:0 3px;flex:none}',
    '.jjam-switch-btn{display:inline-flex;flex-direction:column;align-items:center;gap:4px;',
    'padding:6px 6px 5px;border-radius:12px;background:transparent;border:1px solid transparent;',
    'text-decoration:none;cursor:pointer;font:inherit;transition:background .12s,transform .1s}',
    '.jjam-switch-btn svg{width:34px;height:34px;display:block;flex:none}',
    '.jjam-switch-btn span{font-size:11px;font-weight:700;line-height:1;white-space:nowrap;color:#fff}',
    '.jjam-switch-btn:hover{background:rgba(255,255,255,.14)}',
    '.jjam-switch-btn:active{transform:translateY(1px)}',
    '.jjam-switch-btn:focus-visible{outline:3px solid #FFD34D;outline-offset:2px}',
    /* 오프라인 — 다른 사이트는 저장소가 따로라 캐시가 없다. 눌러도 못 간다. */
    '.jjam-switch.is-offline .jjam-switch-btn{opacity:.45}',
    '.jjam-switch.is-offline .jjam-switch-btn:hover{background:transparent}',
    '.jjam-switch-note{position:absolute;top:100%;right:0;margin-top:6px;z-index:30;',
    'background:#1C2333;color:#fff;font-size:13px;font-weight:600;line-height:1.4;',
    'padding:8px 13px;border-radius:9px;white-space:nowrap;box-shadow:0 6px 16px rgba(8,14,32,.32)}',
    '.jjam-switch-note[hidden]{display:none}',
    '@media (prefers-reduced-motion:reduce){.jjam-switch-btn{transition:none}}',
    /* 좁은 화면(태블릿·휴대폰) — 자매 사이트 아이콘은 접고 '전체 보기' 하나만 남긴다.
       예전에는 이름만 숨기고 아이콘 줄을 남겼는데(720 → 820px), 그 줄이 헤더를 밀어
       영상(768~1024px)·1분사회(390px)의 제목과 버튼 글자가 세로로 눌려 있었다.
       모아보기에서 한 번 더 누르면 어디든 갈 수 있으니 여기서는 한 칸으로 줄인다(2026-10-01). */
    '@media (max-width:1100px){.jjam-switch-btn:not(.is-home),.jjam-switch-sep{display:none}}',
    /* 중간 폭 — 아이콘은 두고 이름만 숨긴다(영상 960~1280px 에서 이름까지 두면 헤더가 눌렸다).
       '전체 보기'는 어느 폭에서나 이름을 단다 — 그림만으로는 무엇인지 모른다. */
    '@media (max-width:1280px){.jjam-switch-btn:not(.is-home) span{display:none}',
    '.jjam-switch-btn:not(.is-home){padding:6px}}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('jjam-switch-css')) return;
    var el = document.createElement('style');
    el.id = 'jjam-switch-css';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function iconSvg(key) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + ART[key] + '</svg>';
  }

  function render(host) {
    var current = host.getAttribute('data-site');
    var html = '<span class="jjam-switch-sep" aria-hidden="true"></span>';

    SITES.forEach(function (s) {
      if (s.key === current) return;
      html += '<a class="jjam-switch-btn" href="' + s.url + '" aria-label="' + s.go + '">' +
              iconSvg(s.key) + '<span>' + s.label + '</span></a>';
    });

    html += '<span class="jjam-switch-sep" aria-hidden="true"></span>' +
            '<a class="jjam-switch-btn is-home" href="' + HOME.url + '" aria-label="' + HOME.go + '">' +
            iconSvg(HOME.key) + '<span>' + HOME.label + '</span></a>';

    html += '<p class="jjam-switch-note" role="status" hidden></p>';
    host.innerHTML = html;

    host.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.jjam-switch-btn') : null;
      if (!a || navigator.onLine !== false) return;
      // 오프라인이면 넘어가 봐야 빈 화면이다. 지금 쓰던 화면을 지키고 이유를 알린다.
      e.preventDefault();
      showNote(host, '인터넷에 연결되면 갈 수 있어요.');
    });
  }

  var noteTimer = null;
  function showNote(host, text) {
    var note = host.querySelector('.jjam-switch-note');
    if (!note) return;
    note.textContent = text;
    note.hidden = false;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { note.hidden = true; }, 3000);
  }

  function syncOnline() {
    var off = navigator.onLine === false;
    [].forEach.call(document.querySelectorAll('.jjam-switch'), function (host) {
      host.classList.toggle('is-offline', off);
      if (!off) {
        var note = host.querySelector('.jjam-switch-note');
        if (note) note.hidden = true;
      }
    });
  }

  function init() {
    var hosts = document.querySelectorAll('.jjam-switch[data-site]');
    if (!hosts.length) return;
    injectStyle();
    [].forEach.call(hosts, render);
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
