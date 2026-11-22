/* 가상 화면: IIS(인터넷 정보 서비스) 관리자 — 웹 사이트 추가, FTP 사이트 추가 마법사, 바인딩, 기본 문서, 디렉터리 검색,
 * IP 주소 및 도메인 제한, 인증, FTP 인증·권한 부여 규칙·메시지·SSL, 고급 설정(최대 연결 수)
 * 채점 키(대상 사이트 = 문제의 target 이름, 없으면 마지막에 만든 사이트):
 *   site.exists, site.name, site.path, site.ip, site.port, site.host, site.type, site.bindings[], site.started,
 *   site.docs[], site.docFirst, site.dirBrowse, site.allow[], site.deny[], site.unspec, site.anonAuth, site.basicAuth,
 *   ftp.ssl, ftp.anon, ftp.basic, ftp.rules[{mode, who, names, read, write}], ftp.anonRead, ftp.anonWrite, ftp.allRead, ftp.allWrite,
 *   ftp.msgBanner, ftp.msgWelcome, ftp.msgExit, ftp.msgMax, ftp.maxConn */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W; const IP = SIMS.IP;
  const ALL_IP = '지정하지 않은 모든 IP';
  const LABELS = { 'site.exists': '사이트를 만들었는지', 'site.name': '사이트 이름', 'site.path': '실제 경로', 'site.ip': '바인딩 IP 주소', 'site.port': '바인딩 포트', 'site.host': '호스트 이름', 'site.type': '바인딩 종류', 'site.bindings': '바인딩 목록', 'site.started': '사이트 시작 상태', 'site.docs': '기본 문서 목록', 'site.docFirst': '기본 문서 맨 위 항목', 'site.dirBrowse': '디렉터리 검색', 'site.allow': 'IP 허용 항목', 'site.deny': 'IP 거부 항목', 'site.unspec': '지정되지 않은 클라이언트 액세스', 'site.anonAuth': '익명 인증', 'site.basicAuth': '기본 인증', 'ftp.ssl': 'SSL 설정', 'ftp.anon': 'FTP 익명 인증', 'ftp.basic': 'FTP 기본 인증', 'ftp.rules': 'FTP 권한 부여 규칙', 'ftp.anonRead': '익명 사용자 읽기 권한', 'ftp.anonWrite': '익명 사용자 쓰기 권한', 'ftp.allRead': '모든 사용자 읽기 권한', 'ftp.allWrite': '모든 사용자 쓰기 권한', 'ftp.msgBanner': 'FTP 메시지: 배너', 'ftp.msgWelcome': 'FTP 메시지: 시작', 'ftp.msgExit': 'FTP 메시지: 끝', 'ftp.msgMax': 'FTP 메시지: 최대 연결 수', 'ftp.maxConn': '고급 설정: 최대 연결 수' };
  const DEFAULT_DOCS = ['Default.htm', 'Default.asp', 'index.htm', 'index.html', 'iisstart.htm'];
  const webSite = (name, path, b, id) => ({ id, kind: 'web', name, path, bindings: [b], started: true, docs: DEFAULT_DOCS.slice(), dirBrowse: false, ipRules: [], unspec: 'allow', auth: { anon: true, basic: false, win: false } });
  const blank = () => ({ serverIps: ['192.168.100.10', '192.168.0.10'], sites: [webSite('Default Web Site', '%SystemDrive%\\inetpub\\wwwroot', { type: 'http', ip: '*', port: 80, host: '' }, 1)] });

  function flat(st, q) {
    const own = st.sites.filter(s => s._new);
    const t = q && q.target ? st.sites.find(s => s.name.toLowerCase() === String(q.target).toLowerCase()) : own[own.length - 1];
    if (!t) return { 'site.exists': false };
    const b = t.bindings[0] || {};
    const o = { 'site.exists': true, 'site.kind': t.kind, 'site.name': t.name, 'site.path': t.path, 'site.ip': b.ip === '*' ? '' : b.ip, 'site.port': b.port, 'site.host': b.host, 'site.type': b.type, 'site.bindings': t.bindings.map(x => `${x.type}:${x.ip === '*' ? '*' : x.ip}:${x.port}:${x.host || ''}`), 'site.started': t.started,
      'site.allow': t.ipRules.filter(r => r.mode === 'allow').map(r => r.mask ? `${r.ip}/${r.mask}` : r.ip), 'site.deny': t.ipRules.filter(r => r.mode === 'deny').map(r => r.mask ? `${r.ip}/${r.mask}` : r.ip), 'site.unspec': t.unspec };
    if (t.kind === 'web') Object.assign(o, { 'site.docs': t.docs.slice(), 'site.docFirst': t.docs[0] || '', 'site.dirBrowse': t.dirBrowse, 'site.anonAuth': t.auth.anon, 'site.basicAuth': t.auth.basic });
    if (t.kind === 'ftp') {
      const f = t.ftp, has = (who, p) => f.rules.some(r => r.mode === 'allow' && r.who === who && r[p]);
      Object.assign(o, { 'ftp.ssl': f.ssl, 'ftp.anon': f.anon, 'ftp.basic': f.basic, 'ftp.rules': f.rules.map(r => ({ ...r })), 'ftp.anonRead': has('anon', 'read'), 'ftp.anonWrite': has('anon', 'write'), 'ftp.allRead': has('all', 'read'), 'ftp.allWrite': has('all', 'write'), 'ftp.msgBanner': f.msgs.banner, 'ftp.msgWelcome': f.msgs.welcome, 'ftp.msgExit': f.msgs.exit, 'ftp.msgMax': f.msgs.max, 'ftp.maxConn': f.maxConn });
      f.rules.filter(r => r.who === 'users' || r.who === 'roles').forEach(r => r.names.split(',').map(x => x.trim()).filter(Boolean).forEach(n => { o[`ftp.user.${n.toLowerCase()}.read`] = r.read; o[`ftp.user.${n.toLowerCase()}.write`] = r.write; }));
    }
    return o;
  }

  // 기능 아이콘: ICQA 에뮬레이터 화면에서 잘라 낸 그림(img/emu/iis/*.png). 그림이 없는 기능은 기본 SVG 아이콘을 씁니다.
  const IMG = 'img/emu/iis/';
  const FEAT_IMG = { '.NET 권한 부여 규칙': 'net-authz', '.NET 신뢰 수준': 'net-trust', '.NET 오류 페이지': 'net-error', '.NET 전역화': 'net-glob', '.NET 컴파일': 'net-compile', 'SMTP 전자 메일': 'smtp', '공급자': 'providers', '세션 상태': 'session', '연결 문자열': 'connstr', '응용 프로그램 설정': 'appsettings', '컴퓨터 키': 'machinekey', '페이지 및 컨트롤': 'pages',
    'FTP IPv4 주소 및 도메인 제한': 'ftp-ip', 'FTP SSL 설정': 'ftp-ssl', 'FTP 권한 부여 규칙': 'ftp-authz', 'FTP 디렉터리 검색': 'ftp-dir', 'FTP 로깅': 'ftp-log', 'FTP 메시지': 'ftp-msg', 'FTP 방화벽 지원': 'ftp-firewall', 'FTP 사용자 격리': 'ftp-isolation', 'FTP 요청 필터링': 'ftp-filter', 'FTP 인증': 'ftp-auth',
    'ASP': 'asp', 'HTTP 응답 헤더': 'http-headers', 'ISAPI 및 CGI 제한': 'isapi-cgi', 'ISAPI 필터': 'isapi-filter', 'MIME 형식': 'mime', '기본 문서': 'default-doc', '디렉터리 검색': 'dir-browse', '로깅': 'logging', '모듈': 'modules', '서버 인증서': 'server-cert', '압축': 'compression', '오류 페이지': 'error-pages', '요청 필터링': 'req-filter', '인증': 'auth', '작업자 프로세스': 'worker', '처리기 매핑': 'handlers', '출력 캐시': 'output-cache',
    '공유 구성': 'shared-config', '구성 편집기': 'config-editor', '기능 위임': 'delegation' };
  const FEAT_SVG = { 'IP 주소 및 도메인 제한': 'f_ip', 'SSL 설정': 'f_ssl' };
  const img = (name, size) => h('img', { src: IMG + name + '.png', width: size, height: size, alt: '', draggable: 'false' });
  const featIcon = t => (FEAT_IMG[t] ? img(FEAT_IMG[t], 32) : W.frag(g.icon(FEAT_SVG[t] || 'f_gen')));
  const ASPNET = ['.NET 권한 부여 규칙', '.NET 신뢰 수준', '.NET 오류 페이지', '.NET 전역화', '.NET 컴파일', 'SMTP 전자 메일', '공급자', '세션 상태', '연결 문자열', '응용 프로그램 설정', '컴퓨터 키', '페이지 및 컨트롤'];
  const FTPF = ['FTP IPv4 주소 및 도메인 제한', 'FTP SSL 설정', 'FTP 권한 부여 규칙', 'FTP 디렉터리 검색', 'FTP 로깅', 'FTP 메시지', 'FTP 방화벽 지원', 'FTP 사용자 격리', 'FTP 요청 필터링', 'FTP 인증'];
  const SRV_FEATS = [['ASP.NET', ASPNET], ['FTP', FTPF],
    ['IIS', ['ASP', 'HTTP 응답 헤더', 'ISAPI 및 CGI 제한', 'ISAPI 필터', 'MIME 형식', '기본 문서', '디렉터리 검색', '로깅', '모듈', '서버 인증서', '압축', '오류 페이지', '요청 필터링', '인증', '작업자 프로세스', '처리기 매핑', '출력 캐시']],
    ['관리', ['공유 구성', '구성 편집기', '기능 위임']]];
  const WEB_FEATS = [['ASP.NET', ASPNET],
    ['IIS', ['ASP', 'HTTP 응답 헤더', 'IP 주소 및 도메인 제한', 'ISAPI 필터', 'MIME 형식', 'SSL 설정', '기본 문서', '디렉터리 검색', '로깅', '모듈', '압축', '오류 페이지', '요청 필터링', '인증', '처리기 매핑', '출력 캐시']],
    ['관리', ['구성 편집기']]];
  const FTP_FEATS = [['FTP', FTPF], ['관리', ['구성 편집기']]];
  // 아이콘 아래 글자: 실제 목록 보기처럼 낱말 단위로 두 줄까지 나누고, 넘치면 둘째 줄 끝을 '...'으로 줄입니다.
  let measureCtx = null;
  function fitLabel(t) {
    if (!measureCtx) { measureCtx = document.createElement('canvas').getContext('2d'); measureCtx.font = '12px Gulim, 굴림, "Malgun Gothic", sans-serif'; }
    const m = s => measureCtx.measureText(s).width, LINE = 74, LAST = 58;
    const words = t.split(' ');
    let l1 = words.shift();
    while (words.length && m(l1 + ' ' + words[0]) <= LINE) l1 += ' ' + words.shift();
    if (!words.length) return [l1];
    let l2 = words.join(' ');
    if (m(l2) <= LINE) return [l1, l2];
    while (l2.length && m(l2 + '...') > LAST) l2 = l2.slice(0, -1);
    return [l1, l2 + '...'];
  }

  SIMS.def('iis', {
    title: 'IIS(인터넷 정보 서비스) 관리자', labels: LABELS, blank, flat,
    mount(desk, q) {
      const st = Object.assign(blank(), SIMS.clone((q && q.init) || {}));
      let M, feat = null, featNode = null; // feat = 열린 기능 이름, featNode = 그 기능을 연 사이트
      const siteOf = n => st.sites[+String(n.id).slice(5)];
      // 트리 줄: 에뮬레이터 아이콘 + 글자. data-d(깊이)·data-last(마지막 형제)·data-open(펼침)으로 CSS가 점선과 +/− 상자를 그립니다.
      const isOpen = id => (M && M.tree ? M.tree.open.has(id) : id === 'srv' || id === 'sites');
      const tl = (id, icon, text, d, last) => h('span', { class: 'emu-tl', dataset: { d: String(d), ...(last ? { last: '1' } : {}), ...(isOpen(id) ? { open: '1' } : {}) } }, img(icon, 16), h('span', { class: 't' }, text));
      const nodes = () => [{ id: 'srv', label: tl('srv', 'tree-server', 'ICQAServer', 0, true), icon: 'computer', kids: () => [{ id: 'pools', label: tl('pools', 'tree-pools', '응용 프로그램 풀', 1, false), icon: 'pool' }, { id: 'sites', label: tl('sites', 'tree-sites', '사이트', 1, true), icon: 'folder', kids: () => st.sites.map((s, i) => ({ id: 'site:' + i, label: tl('site:' + i, 'tree-site', s.name, 2, i === st.sites.length - 1), icon: s.kind === 'ftp' ? 'ftp' : 'site' })) }] }];
      const nameCell = (icon, text) => h('span', { class: 'emu-nm' }, img(icon, 16), text);
      const ipChoices = () => [ALL_IP].concat(st.serverIps);
      function menu(n) {
        if (n.id === 'sites') return [{ t: '웹 사이트 추가...', on: addWeb }, { t: 'FTP 사이트 추가...', on: addFtp }, '-', { t: '새로 고침(F)', on: () => M.refresh() }];
        if (String(n.id).startsWith('site:')) {
          const s = siteOf(n);
          const manage = [{ t: '다시 시작', on: () => { s.started = true; M.refresh(); } }, { t: '시작', dis: s.started, on: () => { s.started = true; M.refresh(); } }, { t: '중지', dis: !s.started, on: () => { s.started = false; M.refresh(); } }, '-', { t: '고급 설정...', on: () => advDlg(s) }];
          return [{ t: '탐색', dis: true }, { t: '권한 편집...', dis: true }, '-', { t: '응용 프로그램 추가...', dis: true }, { t: '가상 디렉터리 추가...', dis: true }, '-', { t: '바인딩 편집...', on: () => bindDlg(s) }, s.kind === 'web' ? { t: 'FTP 게시 추가...', dis: true } : null, { t: s.kind === 'ftp' ? 'FTP 사이트 관리' : '웹 사이트 관리', sub: manage }, '-', { t: '제거', on: () => { st.sites.splice(st.sites.indexOf(s), 1); M.tree.sel = 'sites'; M.refresh(); } }, { t: '새로 고침(F)', on: () => M.refresh() }].filter(Boolean);
        }
        return [{ t: '새로 고침(F)', on: () => M.refresh() }];
      }
      function render(n, el) {
        if (n.id === 'pools') { const L = W.list({ cols: [{ t: '이름', w: 200 }, { t: '상태', w: 80 }, { t: '.NET CLR 버전', w: 110 }, { t: '관리되는 파이프라인 모드', w: 160 }], rows: ['DefaultAppPool'].concat(st.sites.filter(s => s.kind === 'web' && s._new).map(s => s.name)).map(p => ({ id: p, cells: [nameCell('tree-pools', p), '시작됨', 'v4.0', '통합'] })) }); el.append(L.el); return; }
        if (n.id === 'sites') {
          const bind = b => `${b.ip} on :${b.port}${b.host ? ':' + b.host : ''} (${b.type})`;
          const L = W.list({ cols: [{ t: '이름', w: 170 }, { t: 'ID', w: 40 }, { t: '상태', w: 100 }, { t: '바인딩', w: 260 }, { t: '경로', w: 220 }], rows: st.sites.map((s, i) => ({ id: 'site:' + i, cells: [nameCell('tree-site', s.name), String(s.id), `${s.started ? '시작됨' : '중지됨'}(${(s.bindings[0] || {}).type || (s.kind === 'ftp' ? 'ftp' : 'http')})`, s.bindings.map(bind).join(', '), s.path] })), onDbl: r => M.select(r.id), onContext: (r, e) => M.ctx(menu({ id: r.id }), e), onBlank: e => M.ctx(menu(n), e) });
          el.append(L.el); return;
        }
        const s = String(n.id).startsWith('site:') ? siteOf(n) : null;
        if (feat && featNode !== n.id) feat = null;
        if (feat && s) return featPage(s, el);
        const groups = n.id === 'srv' ? SRV_FEATS : s && s.kind === 'ftp' ? FTP_FEATS : WEB_FEATS;
        const v = h('div', {}, h('div', { class: 'icv' }, groups.map(([gt, list]) => [h('h4', {}, gt), h('div', { class: 'grid' }, list.map(t => {
          const it = h('div', { class: 'it', tabindex: 0, title: t, 'aria-label': t }, featIcon(t), h('span', { class: 'lbl' }, fitLabel(t).map(l => h('span', {}, l))));
          it.addEventListener('mousedown', () => { v.querySelectorAll('.it.sel').forEach(x => x.classList.remove('sel')); it.classList.add('sel'); });
          it.addEventListener('dblclick', () => openFeat(n, t)); it.addEventListener('keydown', e => { if (e.key === 'Enter') openFeat(n, t); });
          it.addEventListener('contextmenu', e => { e.preventDefault(); M.ctx([{ t: '기능 열기', b: true, on: () => openFeat(n, t) }], e); });
          return it;
        }))])));
        // 실제 IIS 오른쪽 '작업' 창처럼, 사이트 홈에는 자주 쓰는 작업을 위에 보여 줍니다(연습용 도움 막대).
        if (s) {
          const bar = h('div', { class: 'iis-acts' }, h('span', { class: 'nm' }, img('tree-site', 16), h('b', {}, s.name + ' 홈')), h('span', { class: 'sep' }), h('span', { class: 'ttl' }, '작업:'),
            W.btn('바인딩 편집...', () => bindDlg(s), { sm: true }),
            W.btn('고급 설정...', () => advDlg(s), { sm: true }),
            W.btn('시작', () => { s.started = true; M.refresh(); }, { sm: true, dis: s.started }),
            W.btn('중지', () => { s.started = false; M.refresh(); }, { sm: true, dis: !s.started }),
            h('span', { class: 'st' + (s.started ? ' on' : '') }, s.started ? '상태: 시작됨' : '상태: 중지됨'));
          v.prepend(bar);
        }
        el.append(v);
      }
      function openFeat(n, t) {
        if (n.id === 'srv') { W.msg(desk, { title: 'IIS 관리자', text: '이 연습 프로그램에서는 서버 수준 기능을 다루지 않습니다.\n왼쪽 [사이트] 아래의 사이트를 선택해 설정하세요.', icon: 'info', owner: M.win }); return; }
        feat = t; featNode = n.id; M.refresh();
      }
      const back = () => { feat = null; M.refresh(); };
      function featPage(s, el) {
        const head = t => h('div', { class: 'feat-head' }, featIcon(t), h('span', { style: { flex: 1 } }, t), W.btn('◀ 사이트 홈으로', back, { sm: true }));
        const body = h('div', { class: 'feat-body' });
        el.append(head(feat), body);
        const ftp = s.kind === 'ftp';
        if (feat === 'IP 주소 및 도메인 제한' || feat === 'FTP IPv4 주소 및 도메인 제한') {
          body.append(h('p', {}, ftp ? 'FTP 콘텐츠에 액세스할 수 있는 IPv4 주소 또는 도메인 이름에 대한 규칙을 정의하려면 이 기능을 사용합니다.' : '웹 콘텐츠에 액세스할 수 있는 IP 주소 또는 도메인 이름에 대한 규칙을 정의하려면 이 기능을 사용합니다.'));
          const L = W.list({ cols: [{ t: '모드', w: 80 }, { t: '요청자', w: 260 }, { t: '항목 유형', w: 80 }], rows: s.ipRules.map((r, i) => ({ id: 'r' + i, cells: [r.mode === 'allow' ? '허용' : '거부', r.mask ? `${r.ip}(${r.mask})` : r.ip, '로컬'] })), empty: '규칙이 없습니다. 마우스 오른쪽 단추를 눌러 [허용 항목 추가] 또는 [거부 항목 추가]를 고르세요.',
            onContext: (r, e) => M.ctx([{ t: '제거', on: () => { s.ipRules.splice(+r.id.slice(1), 1); M.refresh(); } }], e), onBlank: e => M.ctx(acts(), e) });
          const acts = () => [{ t: '허용 항목 추가...', on: () => ruleDlg(s, 'allow') }, { t: '거부 항목 추가...', on: () => ruleDlg(s, 'deny') }, '-', { t: '기능 설정 편집...', on: () => unspecDlg(s) }];
          body.append(h('div', { style: { height: '260px', border: '1px solid #ccc' } }, L.el), W.row(W.btn('허용 항목 추가...', () => ruleDlg(s, 'allow')), W.btn('거부 항목 추가...', () => ruleDlg(s, 'deny')), W.btn('기능 설정 편집...', () => unspecDlg(s))), h('p', { class: 'muted7' }, `지정되지 않은 클라이언트에 대한 액세스: ${s.unspec === 'allow' ? '허용' : '거부'}`));
          return;
        }
        if (feat === '기본 문서') {
          body.append(h('p', {}, '클라이언트에서 파일 이름을 지정하지 않고 요청했을 때 반환할 기본 파일을 정의하려면 이 기능을 사용합니다. 기본 문서를 우선 순위대로 설정하십시오.'));
          const L = W.list({ cols: [{ t: '이름', w: 220 }, { t: '항목 유형', w: 90 }], rows: s.docs.map((d, i) => ({ id: 'd' + i, cells: [d, '로컬'], icon: 'doc' })),
            onContext: (r, e) => { const i = +r.id.slice(1); M.ctx([{ t: '추가...', on: () => docDlg(s) }, { t: '제거', on: () => { s.docs.splice(i, 1); M.refresh(); } }, '-', { t: '위로 이동', dis: i === 0, on: () => { [s.docs[i - 1], s.docs[i]] = [s.docs[i], s.docs[i - 1]]; M.refresh(); } }, { t: '아래로 이동', dis: i === s.docs.length - 1, on: () => { [s.docs[i + 1], s.docs[i]] = [s.docs[i], s.docs[i + 1]]; M.refresh(); } }], e); },
            onBlank: e => M.ctx([{ t: '추가...', on: () => docDlg(s) }], e) });
          body.append(h('div', { style: { height: '200px', border: '1px solid #ccc' } }, L.el), W.row(W.btn('추가...', () => docDlg(s)), W.btn('제거', () => { const r = L.selected(); if (r) { s.docs.splice(+r.id.slice(1), 1); M.refresh(); } }), W.btn('위로 이동', () => { const r = L.selected(); const i = r ? +r.id.slice(1) : -1; if (i > 0) { [s.docs[i - 1], s.docs[i]] = [s.docs[i], s.docs[i - 1]]; M.refresh(); } }), W.btn('아래로 이동', () => { const r = L.selected(); const i = r ? +r.id.slice(1) : -1; if (i >= 0 && i < s.docs.length - 1) { [s.docs[i + 1], s.docs[i]] = [s.docs[i], s.docs[i + 1]]; M.refresh(); } })));
          return;
        }
        if (feat === '디렉터리 검색' || feat === 'FTP 디렉터리 검색') {
          if (ftp) { body.append(h('p', {}, '이 연습 프로그램에서는 FTP 디렉터리 검색 설정을 다루지 않습니다.')); return; }
          body.append(h('p', {}, '디렉터리 목록에 표시할 정보를 지정하려면 이 기능을 사용합니다.'), ...['시간(T)', '크기(S)', '확장명(E)', '날짜(D)', '긴 날짜(L)'].map((t, i) => W.row(W.chk(t, i < 4, { dis: !s.dirBrowse }))),
            h('p', { style: { fontWeight: 700, color: s.dirBrowse ? '#1f8a4c' : '#b26b00' } }, s.dirBrowse ? '디렉터리 검색을 사용합니다.' : '디렉터리 검색이 사용 안 함으로 설정되었습니다.'),
            W.row(s.dirBrowse ? W.btn('사용 안 함(B)', () => { s.dirBrowse = false; M.refresh(); }) : W.btn('사용(E)', () => { s.dirBrowse = true; M.refresh(); })));
          return;
        }
        if (feat === '인증' || feat === 'FTP 인증') {
          const rows = ftp ? [['anon', '익명 인증', s.ftp.anon], ['basic', '기본 인증', s.ftp.basic]] : [['anon', '익명 인증', s.auth.anon], ['asp', 'ASP.NET 가장', false], ['basic', '기본 인증', s.auth.basic], ['win', 'Windows 인증', s.auth.win]];
          const tgt = ftp ? s.ftp : s.auth;
          const L = W.list({ cols: [{ t: '이름', w: 200 }, { t: '상태', w: 90 }, { t: '응답 유형', w: 160 }], rows: rows.map(([k, t, on]) => ({ id: k, cells: [t, on ? '사용' : '사용 안 함', ftp ? '' : k === 'win' || k === 'basic' ? 'HTTP 401 인증 확인' : ''], icon: 'user' })),
            onContext: (r, e) => { if (r.id === 'asp') return; M.ctx([{ t: '사용(E)', dis: tgt[r.id], on: () => { tgt[r.id] = true; M.refresh(); } }, { t: '사용 안 함(B)', dis: !tgt[r.id], on: () => { tgt[r.id] = false; M.refresh(); } }], e); } });
          body.append(h('p', {}, '항목을 마우스 오른쪽 단추로 클릭해 [사용] 또는 [사용 안 함]을 고르세요.'), h('div', { style: { height: '160px', border: '1px solid #ccc' } }, L.el), W.row(W.btn('사용(E)', () => { const r = L.selected(); if (r && r.id !== 'asp') { tgt[r.id] = true; M.refresh(); } }), W.btn('사용 안 함(B)', () => { const r = L.selected(); if (r && r.id !== 'asp') { tgt[r.id] = false; M.refresh(); } })));
          return;
        }
        if (feat === 'FTP 권한 부여 규칙') {
          const whoT = r => ({ all: '모든 사용자', anon: '모든 익명 사용자' })[r.who] || (r.who === 'users' ? r.names : '');
          const L = W.list({ cols: [{ t: '모드', w: 70 }, { t: '사용자', w: 170 }, { t: '역할', w: 140 }, { t: '권한', w: 90 }], rows: s.ftp.rules.map((r, i) => ({ id: 'r' + i, cells: [r.mode === 'allow' ? '허용' : '거부', whoT(r), r.who === 'roles' ? r.names : '', [r.read ? '읽기' : '', r.write ? '쓰기' : ''].filter(Boolean).join(', ')] })), empty: '규칙이 없습니다.',
            onContext: (r, e) => M.ctx([{ t: '편집...', on: () => authzDlg(s, s.ftp.rules[+r.id.slice(1)].mode, +r.id.slice(1)) }, { t: '제거', on: () => { s.ftp.rules.splice(+r.id.slice(1), 1); M.refresh(); } }], e), onBlank: e => M.ctx([{ t: '허용 규칙 추가...', on: () => authzDlg(s, 'allow') }, { t: '거부 규칙 추가...', on: () => authzDlg(s, 'deny') }], e) });
          body.append(h('p', {}, 'FTP 콘텐츠에 액세스할 수 있는 사용자와 역할에 대한 규칙을 관리합니다.'), h('div', { style: { height: '200px', border: '1px solid #ccc' } }, L.el), W.row(W.btn('허용 규칙 추가...', () => authzDlg(s, 'allow')), W.btn('거부 규칙 추가...', () => authzDlg(s, 'deny')), W.btn('제거', () => { const r = L.selected(); if (r) { s.ftp.rules.splice(+r.id.slice(1), 1); M.refresh(); } })));
          return;
        }
        if (feat === 'FTP 메시지') {
          const m = s.ftp.msgs;
          const tb = W.text(m.banner, { multi: true, rows: 2 }), tw = W.text(m.welcome, { multi: true, rows: 2 }), tx = W.text(m.exit, { multi: true, rows: 2 }), tm = W.text(m.max, { multi: true, rows: 2 });
          body.append(W.group('메시지 동작', W.row(W.chk('기본 배너 표시 안 함(S)', false)), W.row(W.chk('사용자 변수 지원(U)', false)), W.row(W.chk('로컬 요청에 대한 자세한 메시지 표시(D)', false))),
            W.group('메시지 텍스트', W.label('배너(B):', { cls: 'l' }), tb, W.label('시작(W):', { cls: 'l' }), tw, W.label('끝(X):', { cls: 'l' }), tx, W.label('최대 연결 수(M):', { cls: 'l' }), tm),
            W.row(W.btn('적용', () => { Object.assign(m, { banner: tb.value, welcome: tw.value, exit: tx.value, max: tm.value }); W.msg(desk, { title: 'IIS 관리자', text: '변경 내용을 저장했습니다.', icon: 'info', owner: M.win }); }, { def: true }), W.btn('취소', () => M.refresh())), h('p', { class: 'muted7' }, '글을 바꾼 뒤 [적용]을 눌러야 저장됩니다.'));
          return;
        }
        if (feat === 'FTP SSL 설정') {
          const r = W.radios([['allow', 'SSL 연결 허용(W)'], ['require', 'SSL 연결 필요(R)'], ['custom', '사용자 지정(C)']], s.ftp.ssl === 'none' ? 'allow' : s.ftp.ssl);
          body.append(W.form([['SSL 인증서(S):', W.select(['선택 안 함'], '선택 안 함', { w: 220 })]], { cols: '110px auto' }), W.group('SSL 정책', W.row(r.els[0]), W.row(r.els[1]), W.row(r.els[2])), W.row(W.btn('적용', () => { s.ftp.ssl = r.value; W.msg(desk, { title: 'IIS 관리자', text: '변경 내용을 저장했습니다.', icon: 'info', owner: M.win }); }, { def: true })));
          return;
        }
        body.append(h('p', {}, '이 연습 프로그램에서는 이 기능을 다루지 않습니다. 시험에 자주 나오는 기능: IP 주소 및 도메인 제한, 기본 문서, 디렉터리 검색, 인증, FTP 권한 부여 규칙, FTP 메시지.'));
      }
      function ruleDlg(s, mode) {
        let r, fIp, fR, fM;
        W.dialog(desk, { title: mode === 'allow' ? '허용 제한 규칙 추가' : '거부 제한 규칙 추가', w: 380, h: 280, owner: M.win,
          render: el => {
            r = W.radios([['one', '특정 IP 주소(S):'], ['range', 'IP 주소 범위(R):']], 'one'); fIp = W.text(''); fR = W.text(''); fM = W.text('');
            const sync = () => { fIp.disabled = r.value !== 'one'; fR.disabled = fM.disabled = r.value !== 'range'; };
            r.onChange(sync); sync();
            el.append(W.label(mode === 'allow' ? '다음 IPv4 주소 또는 범위에 대한 액세스 허용:' : '다음 IPv4 주소 또는 범위에 대한 액세스 거부:'), W.row(r.els[0]), h('div', { style: { paddingLeft: '20px' } }, fIp), W.row(r.els[1]), h('div', { style: { paddingLeft: '20px' } }, fR, W.label('마스크 또는 접두사(M):', { cls: 'l' }), fM));
          },
          buttons: [{ t: '확인', def: true, on: () => {
            if (r.value === 'one') { if (!IP.ok(fIp.value.trim())) { W.msg(desk, { title: '규칙 추가', text: '지정한 IP 주소가 잘못되었습니다.', icon: 'error' }); return false; } s.ipRules.push({ mode, ip: fIp.value.trim(), mask: '' }); }
            else {
              let m = fM.value.trim(); if (/^\/?\d{1,2}$/.test(m)) m = IP.maskOf(+m.replace('/', ''));
              if (!IP.ok(fR.value.trim()) || !IP.maskOk(m)) { W.msg(desk, { title: '규칙 추가', text: 'IP 주소 범위 또는 마스크가 잘못되었습니다.', icon: 'error' }); return false; }
              s.ipRules.push({ mode, ip: fR.value.trim(), mask: m });
            }
            M.refresh();
          } }, { t: '취소', cancel: true }] });
      }
      function unspecDlg(s) {
        let sel;
        W.dialog(desk, { title: 'IP 및 도메인 제한 설정 편집', w: 380, h: 200, owner: M.win, render: el => { sel = W.select([['allow', '허용'], ['deny', '거부']], s.unspec, { w: 120 }); el.append(W.label('지정되지 않은 클라이언트에 대한 액세스(A):', { cls: 'l' }), sel, W.row(W.chk('도메인 이름 제한 사용(E)', false, { dis: true }))); },
          buttons: [{ t: '확인', def: true, on: () => { s.unspec = sel.value; M.refresh(); } }, { t: '취소', cancel: true }] });
      }
      function docDlg(s) {
        let t;
        W.dialog(desk, { title: '기본 문서 추가', w: 340, h: 150, owner: M.win, render: el => { t = W.text(''); el.append(W.label('이름(N):', { cls: 'l' }), t); },
          buttons: [{ t: '확인', def: true, on: () => { const v = t.value.trim(); if (!v) return false; if (s.docs.some(d => d.toLowerCase() === v.toLowerCase())) { W.msg(desk, { title: '기본 문서 추가', text: '같은 이름의 기본 문서가 이미 있습니다.', icon: 'error' }); return false; } s.docs.unshift(v); M.refresh(); } }, { t: '취소', cancel: true }] });
      }
      function authzDlg(s, mode, idx) {
        const r0 = idx != null ? s.ftp.rules[idx] : { mode, who: 'all', names: '', read: false, write: false };
        let r, fR, fU, cR, cW;
        W.dialog(desk, { title: mode === 'allow' ? '허용 권한 부여 규칙 추가' : '거부 권한 부여 규칙 추가', w: 400, h: 340, owner: M.win,
          render: el => {
            r = W.radios([['all', '모든 사용자(A)'], ['anon', '모든 익명 사용자(N)'], ['roles', '지정한 역할 또는 사용자 그룹(R):'], ['users', '지정한 사용자(U):']], r0.who);
            fR = W.text(r0.who === 'roles' ? r0.names : ''); fU = W.text(r0.who === 'users' ? r0.names : ''); cR = W.chk('읽기(D)', r0.read); cW = W.chk('쓰기(W)', r0.write);
            const sync = () => { fR.disabled = r.value !== 'roles'; fU.disabled = r.value !== 'users'; }; r.onChange(sync); sync();
            el.append(W.label(mode === 'allow' ? '다음 사용자에게 이 콘텐츠에 대한 액세스 허용:' : '다음 사용자의 이 콘텐츠 액세스 거부:'), W.row(r.els[0]), W.row(r.els[1]), W.row(r.els[2]), h('div', { style: { paddingLeft: '20px' } }, fR), W.row(r.els[3]), h('div', { style: { paddingLeft: '20px' } }, fU, h('div', { class: 'muted7' }, '예: User1, User2')), W.group('사용 권한', W.row(cR), W.row(cW)));
          },
          buttons: [{ t: '확인', def: true, on: () => {
            if (!cR.checked && !cW.checked) { W.msg(desk, { title: '권한 부여 규칙', text: '하나 이상의 사용 권한을 선택해야 합니다.', icon: 'error' }); return false; }
            const names = r.value === 'roles' ? fR.value.trim() : r.value === 'users' ? fU.value.trim() : '';
            if ((r.value === 'roles' || r.value === 'users') && !names) { W.msg(desk, { title: '권한 부여 규칙', text: '사용자 또는 역할 이름을 입력하십시오.', icon: 'error' }); return false; }
            const rule = { mode, who: r.value, names, read: cR.checked, write: cW.checked };
            if (idx != null) s.ftp.rules[idx] = rule; else s.ftp.rules.push(rule);
            M.refresh();
          } }, { t: '취소', cancel: true }] });
      }
      function bindingFields(kind, b) {
        const fT = W.select(kind === 'ftp' ? ['ftp', 'ftps'] : ['http', 'https'], b.type);
        const cur = b.ip === '*' ? ALL_IP : b.ip;
        const fIp = W.select(ipChoices().concat(ipChoices().includes(cur) ? [] : [cur]), cur);
        const fP = W.text(String(b.port)); const fH = W.text(b.host || '');
        const cell = (t, c) => h('label', { class: 'emu-fl' }, h('span', {}, t), c);
        return { el: h('div', { class: 'emu-bind' }, h('div', { class: 'emu-bind-row' }, cell('종류(T):', fT), cell('IP 주소(I):', fIp), cell('포트(O):', fP)), cell('호스트 이름(H):', fH), h('div', { class: 'emu-hint' }, '예: www.contoso.com 또는 marketing.contoso.com')),
          read: () => ({ type: fT.value, ip: (fIp.value.trim() === ALL_IP || !fIp.value.trim() || fIp.value.trim() === '*') ? '*' : fIp.value.trim(), port: +fP.value, host: fH.value.trim() }) };
      }
      const validBinding = b => (b.ip === '*' || IP.ok(b.ip)) && b.port >= 1 && b.port <= 65535;
      function dupBinding(b, except) { return st.sites.some(s => s !== except && s.bindings.some(x => x.type.replace(/s$/, '') === b.type.replace(/s$/, '') && x.ip === b.ip && +x.port === +b.port && (x.host || '').toLowerCase() === (b.host || '').toLowerCase())); }
      function addWeb() {
        let fN, fPath, B, cStart;
        const dlg = W.dialog(desk, { title: '웹 사이트 추가', w: 600, h: 450, owner: M.win,
          render: (el, win) => {
            win.el.classList.add('emu-iis-dlg');
            fN = W.text(''); fPath = W.text(''); B = bindingFields('web', { type: 'http', ip: '*', port: 80, host: '' }); cStart = W.chk('웹 사이트 즉시 시작(M)', true);
            const pool = W.text('DefaultAppPool', { ro: true });
            const cell = (t, c) => h('label', { class: 'emu-fl' }, h('span', {}, t), c);
            // 사이트 이름과 실제 경로를 모두 채워야 [확인]이 눌립니다(실제 IIS와 같음).
            const sync = () => { const ok = win.btn('확인'); if (ok) ok.disabled = !(fN.value.trim() && fPath.value.trim()); };
            fN.addEventListener('input', sync); fPath.addEventListener('input', sync);
            el.append(h('div', { class: 'emu-site-row' }, cell('사이트 이름(S):', fN), cell('응용 프로그램 풀(L):', pool), W.btn('선택(E)...', null, { dis: true })),
              W.group('콘텐츠 디렉터리', cell('실제 경로(P):', h('div', { class: 'emu-path' }, fPath, W.btn('...', null, { dis: true }))), h('div', { class: 'emu-sub' }, '통과 인증'), h('div', { class: 'emu-btns' }, W.btn('연결 계정(C)...', null, { dis: true }), W.btn('설정 테스트', null, { dis: true }))),
              W.group('바인딩', B.el), h('div', { class: 'emu-start' }, cStart));
          },
          buttons: [{ t: '확인', def: true, dis: true, on: () => { submit(); return false; } }, { t: '취소', cancel: true }] });
        async function submit() {
          const name = fN.value.trim(), path = fPath.value.trim(), b = B.read();
          if (!name) return W.msg(desk, { title: '웹 사이트 추가', text: '사이트 이름을 입력해야 합니다.', icon: 'error', owner: dlg });
          if (st.sites.some(s => s.name.toLowerCase() === name.toLowerCase())) return W.msg(desk, { title: '웹 사이트 추가', text: '같은 이름의 사이트가 이미 있습니다.', icon: 'error', owner: dlg });
          if (!path) return W.msg(desk, { title: '웹 사이트 추가', text: '실제 경로를 입력해야 합니다.', icon: 'error', owner: dlg });
          if (!validBinding(b)) return W.msg(desk, { title: '웹 사이트 추가', text: '바인딩 IP 주소 또는 포트가 올바르지 않습니다.', icon: 'error', owner: dlg });
          let started = cStart.checked;
          if (dupBinding(b)) { const r = await W.msg(desk, { title: '웹 사이트 추가', text: '이 웹 사이트의 바인딩은 다른 사이트에 할당된 바인딩과 중복됩니다.\n이 웹 사이트를 추가하면 사이트를 시작할 수 없습니다. 계속하시겠습니까?', icon: 'warn', owner: dlg, buttons: ['예(Y)', '아니요(N)'] }); if (r !== '예(Y)') return; started = false; }
          const s = webSite(name, path, b, Math.max(...st.sites.map(x => x.id)) + 1); s.started = started; s._new = true;
          st.sites.push(s); dlg.close(true); M.tree.open.add('sites'); M.refresh(); M.select('site:' + (st.sites.length - 1));
        }
      }
      function addFtp() {
        const c = {};
        let fN, fPath, B, cVh, fVh, cAuto, rSsl, cAnon, cBasic, fWho, fNames, cR, cW;
        W.wizard(desk, { title: 'FTP 사이트 추가', owner: M.win, w: 560, h: 470, icon: 'ftp', ctx: c,
          pages: [
            { head: '사이트 정보', sub: '', render: el => { fN = W.text(''); fPath = W.text(''); el.append(W.label('FTP 사이트 이름(T):', { cls: 'l' }), fN, W.group('콘텐츠 디렉터리', W.label('실제 경로(H):', { cls: 'l' }), W.row(fPath, W.btn('...', null, { sm: true, dis: true })))); },
              next: () => { const n = fN.value.trim(); if (!n) return 'FTP 사이트 이름을 입력해야 합니다.'; if (st.sites.some(s => s.name.toLowerCase() === n.toLowerCase())) return '같은 이름의 사이트가 이미 있습니다.'; if (!fPath.value.trim()) return '실제 경로를 입력해야 합니다.'; c.name = n; c.path = fPath.value.trim(); return true; } },
            { head: '바인딩 및 SSL 설정', sub: '', render: el => {
              B = bindingFields('ftp', { type: 'ftp', ip: '*', port: 21, host: '' });
              cVh = W.chk('가상 호스트 이름 사용(V):', false); fVh = W.text(''); fVh.disabled = true; cVh.onToggle(() => (fVh.disabled = !cVh.checked));
              cAuto = W.chk('자동으로 FTP 사이트 시작(T)', true);
              rSsl = W.radios([['none', 'SSL 사용 안 함(L)'], ['allow', 'SSL 허용(W)'], ['require', 'SSL 필요(R)']], 'allow');
              const ipc = W.combo(ipChoices(), ALL_IP, { w: 220 }), port = W.text('21', { w: 60 });
              B.read = () => ({ type: 'ftp', ip: (ipc.value.trim() === ALL_IP || !ipc.value.trim()) ? '*' : ipc.value.trim(), port: +port.value, host: cVh.checked ? fVh.value.trim() : '' });
              el.append(W.group('바인딩', W.row(h('label', {}, 'IP 주소(A):', h('br'), ipc), h('label', {}, '포트(O):', h('br'), port)), W.row(cVh), fVh, h('div', { class: 'muted7' }, '가상 호스트(예: ftp.contoso.com)(H)')), W.row(cAuto), W.group('SSL', W.row(rSsl.els[0]), W.row(rSsl.els[1]), W.row(rSsl.els[2]), W.label('SSL 인증서(C):', { cls: 'l' }), W.select(['선택 안 함'], '선택 안 함', { w: 220 })));
            }, next: () => { const b = B.read(); if (!validBinding(b)) return '바인딩 IP 주소 또는 포트가 올바르지 않습니다.'; if (rSsl.value === 'require') return 'SSL이 필요하도록 설정하려면 SSL 인증서를 선택해야 합니다. 이 연습 서버에는 인증서가 없으므로 [SSL 사용 안 함] 또는 [SSL 허용]을 고르세요.'; c.b = b; c.auto = cAuto.checked; c.ssl = rSsl.value; return true; } },
            { head: '인증 및 권한 부여 정보', sub: '', finish: true, render: el => {
              cAnon = W.chk('익명(A)', false); cBasic = W.chk('기본(B)', false);
              fWho = W.select([['', ''], ['all', '모든 사용자'], ['anon', '익명 사용자'], ['roles', '지정한 역할 또는 사용자 그룹'], ['users', '지정한 사용자']], '', { w: 240 });
              fNames = W.text('', { w: 240 }); fNames.disabled = true; fWho.addEventListener('change', () => (fNames.disabled = !['roles', 'users'].includes(fWho.value)));
              cR = W.chk('읽기(D)', false); cW = W.chk('쓰기(W)', false);
              el.append(W.group('인증', W.row(cAnon), W.row(cBasic)), W.group('권한 부여', W.label('액세스 허용 대상(C):', { cls: 'l' }), fWho, fNames, W.label('사용 권한', { cls: 'l' }), W.row(cR, cW)));
            }, next: () => {
              if (fWho.value && !cR.checked && !cW.checked) return '사용 권한을 하나 이상 선택해야 합니다.';
              if (['roles', 'users'].includes(fWho.value) && !fNames.value.trim()) return '사용자 또는 역할 이름을 입력하십시오.';
              return true;
            } },
          ],
          onFinish: () => {
            const s = { id: Math.max(...st.sites.map(x => x.id)) + 1, kind: 'ftp', name: c.name, path: c.path, bindings: [c.b], started: c.auto && !dupBinding(c.b), ipRules: [], unspec: 'allow', _new: true,
              ftp: { ssl: c.ssl, anon: cAnon.checked, basic: cBasic.checked, rules: fWho.value ? [{ mode: 'allow', who: fWho.value, names: ['roles', 'users'].includes(fWho.value) ? fNames.value.trim() : '', read: cR.checked, write: cW.checked }] : [], msgs: { banner: '', welcome: '', exit: '', max: '' }, maxConn: 4294967295 } };
            st.sites.push(s); M.tree.open.add('sites'); M.refresh(); M.select('site:' + (st.sites.length - 1));
          } });
      }
      function bindDlg(s) {
        let L;
        const paint = () => L.set(s.bindings.map((b, i) => ({ id: 'b' + i, cells: [b.type, b.host || '', String(b.port), b.ip, ''] })));
        const edit = i => {
          const b0 = i != null ? s.bindings[i] : { type: s.kind === 'ftp' ? 'ftp' : 'http', ip: '*', port: s.kind === 'ftp' ? 21 : 80, host: '' };
          let B;
          W.dialog(desk, { title: i != null ? '사이트 바인딩 편집' : '사이트 바인딩 추가', w: 460, h: 230, owner: bw, render: el => { B = bindingFields(s.kind, b0); el.append(B.el); },
            buttons: [{ t: '확인', def: true, on: () => { const b = B.read(); if (!validBinding(b)) { W.msg(desk, { title: '사이트 바인딩', text: '바인딩 IP 주소 또는 포트가 올바르지 않습니다.', icon: 'error' }); return false; } if (dupBinding(b, s) || s.bindings.some((x, k) => k !== i && x.ip === b.ip && +x.port === b.port && (x.host || '') === b.host)) { W.msg(desk, { title: '사이트 바인딩', text: '같은 바인딩이 이미 있습니다.', icon: 'error' }); return false; } if (i != null) s.bindings[i] = b; else s.bindings.push(b); paint(); M.refresh(); } }, { t: '취소', cancel: true }] });
        };
        const bw = W.dialog(desk, { title: '사이트 바인딩', w: 560, h: 300, owner: M.win,
          render: el => { L = W.list({ cols: [{ t: '종류', w: 60 }, { t: '호스트 이름', w: 160 }, { t: '포트', w: 50 }, { t: 'IP 주소', w: 120 }, { t: '바인딩 정보', w: 90 }], onDbl: r => edit(+r.id.slice(1)) }); paint();
            el.style.display = 'flex'; el.style.gap = '8px'; el.append(h('div', { style: { flex: 1, border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el), h('div', { style: { display: 'flex', flexDirection: 'column', gap: '5px' } }, W.btn('추가(A)...', () => edit(null)), W.btn('편집(E)...', () => { const r = L.selected(); if (r) edit(+r.id.slice(1)); }), W.btn('제거(R)', () => { const r = L.selected(); if (r && s.bindings.length > 1) { s.bindings.splice(+r.id.slice(1), 1); paint(); M.refresh(); } }), W.btn('찾아보기(B)', null, { dis: true }))); },
          buttons: [{ t: '닫기(C)', def: true, cancel: true }] });
      }
      function advDlg(s) {
        let fPath, fMax;
        W.dialog(desk, { title: '고급 설정', w: 460, h: 380, owner: M.win,
          render: el => {
            fPath = h('input', { value: s.path }); fMax = h('input', { value: s.kind === 'ftp' ? String(s.ftp.maxConn) : '4294967295' });
            const row = (k, v) => h('tr', {}, h('td', {}, k), h('td', {}, v));
            el.append(h('table', { class: 'pg7' }, h('tr', { class: 'cat' }, h('td', { colspan: 2 }, '(일반)')), row('ID', String(s.id)), row('바인딩', s.bindings.map(b => `${b.type}:${b.ip}:${b.port}:${b.host || ''}`).join(',')), row('실제 경로', fPath), row('이름', s.name), row('응용 프로그램 풀', s.kind === 'web' ? s.name : ''), row('자동 시작', 'True'),
              s.kind === 'ftp' ? [h('tr', { class: 'cat' }, h('td', { colspan: 2 }, '연결')), row('연결 제한 시간(초)', '120'), row('최대 연결 수', fMax), row('UNIX 디렉터리 목록 형식 사용', 'False')] : [h('tr', { class: 'cat' }, h('td', { colspan: 2 }, '제한')), row('최대 동시 연결 수', fMax)]),
              h('p', { class: 'muted7' }, s.kind === 'ftp' ? '최대 연결 수: FTP 사이트에 동시에 접속할 수 있는 최대 연결 수입니다.' : ''));
          },
          buttons: [{ t: '확인', def: true, on: () => { s.path = fPath.value.trim() || s.path; if (s.kind === 'ftp') { const n = +fMax.value; if (!(n >= 0)) { W.msg(desk, { title: '고급 설정', text: '숫자를 입력하십시오.', icon: 'error' }); return false; } s.ftp.maxConn = n; } M.refresh(); } }, { t: '취소', cancel: true }] });
      }
      function open() {
        feat = null;
        // 에뮬레이터처럼: 메뉴는 파일·보기·도움말만, 도구 모음 없음, 상태 표시줄 '준비'
        const menus = (api, win) => [
          { label: '파일(F)', items: () => [{ t: '끝내기(X)', on: () => win().close() }] },
          { label: '보기(V)', items: () => [{ t: '새로 고침(F)', on: () => api().refresh() }] },
          { label: '도움말(H)', items: () => [{ t: '도움말 항목(H)', dis: true }] },
        ];
        M = SIMS.mmc(desk, { title: 'IIS(인터넷 정보 서비스) 관리자', icon: 'globe', w: 1009, h: 748, nodes, open: ['srv', 'sites'], sel: 'srv', render: (n, el) => render(n, el), menu, menus, toolbar: false, status: () => '준비', leftW: 184, onClose: () => SIMS.closed(desk, open, 'IIS 관리자') });
        M.win.el.classList.add('emu-iis');
        const tic = M.win.titleEl.querySelector('.ic'); if (tic) tic.replaceWith(img('title', 16));
        M.win.setStatus('준비');
      }
      open();
      return { state: () => flat(st, q), open, st };
    },
  });
})(window);
