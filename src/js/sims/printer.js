/* 가상 화면: 장치 및 프린터 — 기본 프린터로 설정, 프린터 속성(일반·공유·포트·고급·보안)
 * 채점 키: prn.default, prn.<프린터 id>.shared / shareName / location / comment / always / from / to / priority / perm.<사용자>.print / perm.<사용자>.manage */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const PRN = [['p1', 'ICQA Laser P2000'], ['p2', 'Microsoft Print to PDF']];
  const blank = () => ({ def: 'p1', p: { p1: { shared: false, shareName: 'ICQA Laser P2000', render: true, location: '', comment: '', always: true, from: '오전 12:00', to: '오전 12:00', priority: 1, perm: { Everyone: { print: true, manage: false }, Administrators: { print: true, manage: true } } }, p2: { shared: false, shareName: 'Microsoft Print to PDF', render: true, location: '', comment: '', always: true, from: '오전 12:00', to: '오전 12:00', priority: 1, perm: { Everyone: { print: true, manage: false }, Administrators: { print: true, manage: true } } } } });
  function flat(st) {
    const o = { 'prn.default': PRN.find(p => p[0] === st.def)[1] };
    for (const [id, p] of Object.entries(st.p)) {
      ['shared', 'shareName', 'location', 'comment', 'always', 'from', 'to', 'priority'].forEach(k => (o[`prn.${id}.${k}`] = p[k]));
      for (const [u, v] of Object.entries(p.perm)) { o[`prn.${id}.perm.${u.toLowerCase()}.print`] = v.print; o[`prn.${id}.perm.${u.toLowerCase()}.manage`] = v.manage; }
    }
    return o;
  }
  const label = k => { const m = k.match(/^prn\.(p\d)\.(.+)$/); if (k === 'prn.default') return '기본 프린터'; if (!m) return k; const n = PRN.find(p => p[0] === m[1])[1]; return `${n}: ${({ shared: '이 프린터 공유', shareName: '공유 이름', location: '위치', comment: '설명', always: '항상 사용 가능', from: '사용 가능 시작 시간', to: '사용 가능 끝 시간', priority: '우선 순위' })[m[2]] || m[2].replace(/^perm\.(.+)\.print$/, '$1 인쇄 권한').replace(/^perm\.(.+)\.manage$/, '$1 프린터 관리 권한')}`; };
  const TIMES = []; for (let i = 0; i < 24; i++) TIMES.push(`${i < 12 ? '오전' : '오후'} ${String(i % 12 || 12).padStart(2, '0')}:00`);

  SIMS.def('printer', {
    title: '장치 및 프린터', label, blank, flat,
    mount(desk, q) {
      desk.el.classList.add('enx'); // 에뮬레이터 공통 창 틀(emu-netetc.css)
      const st = blank(); if (q && q.init) Object.assign(st, SIMS.clone(q.init));
      let win, area, selP = null;
      function paint() {
        area.innerHTML = '';
        const item = (id, name, ic, isPrn) => { const it = h('div', { class: 'it' + (selP === id ? ' sel' : ''), tabindex: 0 }, h('span', { class: 'ic', style: { width: '48px', height: '48px', position: 'relative' }, html: g.ICONS[ic] + (isPrn && st.def === id ? '<span style="position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:#2e9d3c;color:#fff;font-size:12px;display:grid;place-items:center">✓</span>' : '') + (isPrn && st.p[id].shared ? '<span style="position:absolute;left:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:#3f78c8;color:#fff;font-size:10px;display:grid;place-items:center">⇄</span>' : '') }), name);
          it.addEventListener('mousedown', () => { selP = isPrn ? id : null; paint(); });
          if (isPrn) { it.addEventListener('dblclick', () => props(id)); it.addEventListener('contextmenu', e => { e.preventDefault(); selP = id; paint(); const r = desk.el.getBoundingClientRect(); W.menu(desk, e.clientX - r.left, e.clientY - r.top, [{ t: '인쇄 작업 목록 보기(E)', dis: true }, '-', { t: '기본 프린터로 설정(A)', on: () => { st.def = id; paint(); } }, { t: '인쇄 기본 설정(G)...', dis: true }, { t: '프린터 속성(P)', on: () => props(id) }, '-', { t: '바로 가기 만들기(S)', dis: true }, '-', { t: '장치 제거(V)', dis: true }, { t: '문제 해결(T)', dis: true }, '-', { t: '속성(R)', b: true, dis: true }]); }); }
          return it; };
        area.append(h('div', { class: 'icv' }, h('h4', {}, '장치'), h('div', { class: 'grid' }, item('m', '일반 PnP 모니터', 'monitor'), item('pc', 'ICQAPC', 'computer'), item('dvd', 'DVD/CD-RW 드라이브', 'cd')), h('h4', {}, `프린터 (${PRN.length})`), h('div', { class: 'grid' }, PRN.map(([id, n]) => item(id, n, 'printer', true)))));
        win.setStatus(`${PRN.length + 3}개 항목`);
      }
      function props(id) {
        const p = SIMS.clone(st.p[id]); const name = PRN.find(x => x[0] === id)[1];
        let fLoc, fCom, cSh, fSh, cR, rA, fFrom, fTo, fPr, L, cP, cM;
        const read = () => Object.assign(p, { location: fLoc.value.trim(), comment: fCom.value.trim(), shared: cSh.checked, shareName: fSh.value.trim(), render: cR.checked, always: rA.value === 'always', from: fFrom.value, to: fTo.value, priority: +fPr.value });
        W.dialog(desk, { title: `${name} 속성`, w: 470, h: 520, owner: win,
          render: el => {
            fLoc = W.text(p.location); fCom = W.text(p.comment, { multi: true, rows: 3 });
            const gen = h('div', {}, h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' } }, h('span', { class: 'ic', style: { width: '32px', height: '32px' }, html: g.ICONS.printer }), W.text(name, { ro: true })), W.form([['위치(L):', fLoc], ['설명(C):', fCom]], { cols: '70px 1fr' }), W.form([['모델(O):', h('span', {}, name)]], { cols: '70px 1fr' }), W.group('기능', W.label('색: 아니요 · 양면: 예 · 스테이플: 아니요 · 속도: 20ppm · 최대 해상도: 1200dpi')), W.row(W.btn('기본 설정(I)...', null, { dis: true }), W.btn('테스트 페이지 인쇄(T)', () => W.msg(desk, { title: name, text: '(연습창) 테스트 페이지를 보냈습니다.', icon: 'info' }))));
            cSh = W.chk('이 프린터 공유(S)', p.shared); fSh = W.text(p.shareName); cR = W.chk('클라이언트 컴퓨터에서 인쇄 작업 렌더링(R)', p.render);
            const syncS = () => { fSh.disabled = !cSh.checked; cR.setDisabled(!cSh.checked); }; cSh.onToggle(syncS); syncS();
            const share = h('div', {}, W.label('이 프린터를 공유하면 사용자 이름과 암호를 가진 네트워크의 사용자만 이 프린터로 인쇄할 수 있습니다. 컴퓨터가 절전 모드이면 프린터를 사용할 수 없습니다.'), W.row(cSh), W.form([['공유 이름(H):', fSh]], { cols: '90px 1fr' }), W.row(cR), W.group('드라이버', W.label('이 프린터를 다른 버전의 Windows를 실행하는 사용자와 공유하는 경우 추가 드라이버를 설치해야 할 수도 있습니다.'), W.row(h('span', { style: { flex: 1 } }), W.btn('추가 드라이버(D)...', null, { dis: true }))));
            const port = h('div', {}, W.label('인쇄할 포트를 선택하십시오(P). 문서는 처음으로 사용할 수 있는 확인된 포트로 인쇄됩니다.'), h('div', { style: { height: '150px', border: '1px solid #828790', background: '#fff' } }, W.list({ cols: [{ t: '포트', w: 110 }, { t: '설명', w: 160 }, { t: '프린터', w: 150 }], rows: [['LPT1:', '프린터 포트', ''], ['COM1:', '직렬 포트', ''], ['USB001', '가상 프린터 포트(USB)', name], ['PORTPROMPT:', '로컬 포트', '']].map((r, i) => ({ id: 'p' + i, cells: r })) }).el));
            rA = W.radios([['always', '항상 사용 가능(L)'], ['time', '사용 가능 시간(B)']], p.always ? 'always' : 'time'); fFrom = W.select(TIMES, p.from, { w: 110 }); fTo = W.select(TIMES, p.to, { w: 110 }); fPr = W.num(p.priority, { min: 1, max: 99, w: 60 });
            const syncA = () => { fFrom.disabled = fTo.disabled = rA.value !== 'time'; }; rA.onChange(syncA); syncA();
            const adv = h('div', {}, W.row(rA.els[0]), W.row(rA.els[1], fFrom, h('span', {}, '~'), fTo), W.row(h('span', {}, '우선 순위(Y):'), fPr), W.row(h('span', {}, '드라이버(V):'), W.text(name, { ro: true, w: 220 })), W.row(W.radios([['s', '인쇄를 빨리 마치도록 스풀 사용(S)'], ['d', '프린터로 직접 인쇄(D)']], 's').els[0]));
            const users = Object.keys(p.perm);
            L = W.list({ cols: [{ t: '그룹 또는 사용자 이름(G):', w: 300 }], rows: users.map(u => ({ id: u, cells: [u], icon: 'group' })), onSelect: r => showPerm(r.id) });
            cP = W.chk('인쇄', false); cM = W.chk('이 프린터 관리', false); let curU = null;
            const showPerm = u => { curU = u; cP.checked = p.perm[u].print; cM.checked = p.perm[u].manage; };
            cP.onToggle(() => { if (curU) p.perm[curU].print = cP.checked; }); cM.onToggle(() => { if (curU) p.perm[curU].manage = cM.checked; });
            const sec = h('div', {}, h('div', { style: { height: '110px', border: '1px solid #828790', background: '#fff' } }, L.el), W.row(h('span', { style: { flex: 1 } }), W.btn('추가(D)...', () => W.pickPrincipal(desk, { title: '사용자 또는 그룹 선택', kind: '사용자 또는 그룹', names: () => ['Everyone', 'Administrators', 'Users', 'Guests', 'ICQA', 'user1'].map(n => ({ name: n, type: 'group' })), onOk: ns => { ns.forEach(n => { if (!p.perm[n]) p.perm[n] = { print: true, manage: false }; }); L.set(Object.keys(p.perm).map(u => ({ id: u, cells: [u], icon: 'group' }))); } })), W.btn('제거(R)', () => { const s = L.selected(); if (s) { delete p.perm[s.id]; L.set(Object.keys(p.perm).map(u => ({ id: u, cells: [u], icon: 'group' }))); } })), W.label('사용 권한(허용)(P):', { cls: 'l' }), W.row(cP), W.row(cM));
            el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(W.tabs([{ t: '일반', el: gen }, { t: '공유', el: share }, { t: '포트', el: port }, { t: '고급', el: adv }, { t: '색 관리', el: h('div', {}, W.label('이 연습 프로그램에서는 색 관리 탭을 쓰지 않습니다.')) }, { t: '보안', el: sec }], { start: q && q.start === 'share' ? 1 : 0 }).el);
          },
          buttons: [{ t: '확인', def: true, on: () => { read(); if (p.shared && !p.shareName) { W.msg(desk, { title: name, text: '공유 이름을 입력하십시오.', icon: 'error' }); return false; } st.p[id] = p; paint(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { read(); st.p[id] = SIMS.clone(p); paint(); return false; } }] });
      }
      function open() {
        win = new W.Win(desk, { title: '장치 및 프린터', icon: 'printer', w: 740, h: 500, status: '', closeOnly: true, onClose: () => SIMS.closed(desk, open, '장치 및 프린터') });
        win.body.append(h('div', { class: 'w7-toolbar', style: { height: '30px', gap: '18px', padding: '0 10px' } }, h('span', { style: { color: '#999' } }, '장치 추가'), h('span', { style: { color: '#999' } }, '프린터 추가')));
        area = h('div', { style: { flex: 1, background: '#fff', margin: '4px', border: '1px solid #ccc', overflow: 'auto' } });
        win.body.append(area); paint();
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
