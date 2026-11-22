/* 가상 화면: 폴더 속성 — 공유 탭(고급 공유, 공유 권한)과 보안 탭(NTFS 권한)
 * 채점 키: share.on, share.name, share.limit, share.comment, share.<사용자>.<full|change|read>.<allow|deny>,
 *          ntfs.<사용자>.<full|modify|rx|list|read|write>.<allow|deny>, ntfs.users[]  (사용자 이름은 소문자) */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const SHP = [['full', '모든 권한'], ['change', '변경'], ['read', '읽기']];
  const NTP = [['full', '모든 권한'], ['modify', '수정'], ['rx', '읽기 및 실행'], ['list', '폴더 내용 보기'], ['read', '읽기'], ['write', '쓰기']];
  const P = (allow = [], deny = []) => Object.fromEntries(NTP.map(([k]) => [k, { allow: allow.includes(k), deny: deny.includes(k) }]));
  const SP = (allow = [], deny = []) => Object.fromEntries(SHP.map(([k]) => [k, { allow: allow.includes(k), deny: deny.includes(k) }]));
  const blank = () => ({ folder: 'C:\\share', share: { on: false, name: 'share', limit: 20, comment: '', perm: { Everyone: SP(['read']) } }, ntfs: { 'CREATOR OWNER': P(['full', 'modify', 'rx', 'list', 'read', 'write']), SYSTEM: P(['full', 'modify', 'rx', 'list', 'read', 'write']), Administrators: P(['full', 'modify', 'rx', 'list', 'read', 'write']), Users: P(['rx', 'list', 'read']) } });
  function flat(st) {
    const o = { 'share.on': st.share.on, 'share.name': st.share.on ? st.share.name : '', 'share.limit': st.share.limit, 'share.comment': st.share.comment, 'ntfs.users': Object.keys(st.ntfs) };
    for (const [u, p] of Object.entries(st.share.perm)) for (const [k, v] of Object.entries(p)) { o[`share.${u.toLowerCase()}.${k}.allow`] = v.allow; o[`share.${u.toLowerCase()}.${k}.deny`] = v.deny; }
    for (const [u, p] of Object.entries(st.ntfs)) for (const [k, v] of Object.entries(p)) { o[`ntfs.${u.toLowerCase()}.${k}.allow`] = v.allow; o[`ntfs.${u.toLowerCase()}.${k}.deny`] = v.deny; }
    return o;
  }
  function label(k) {
    const N = Object.fromEntries([...SHP, ...NTP]);
    let m = k.match(/^share\.(.+)\.(\w+)\.(allow|deny)$/); if (m) return `공유 권한: ${m[1]} ${N[m[2]]} ${m[3] === 'allow' ? '허용' : '거부'}`;
    m = k.match(/^ntfs\.(.+)\.(\w+)\.(allow|deny)$/); if (m) return `보안(NTFS) 권한: ${m[1]} ${N[m[2]]} ${m[3] === 'allow' ? '허용' : '거부'}`;
    return ({ 'share.on': '선택한 폴더 공유', 'share.name': '공유 이름', 'share.limit': '동시 사용자 수 제한', 'share.comment': '설명', 'ntfs.users': '보안 탭 사용자 목록' })[k] || k;
  }
  // 권한 체크 연동: 위 권한을 켜면 아래 권한도 켜집니다(Windows와 같음).
  const IMPL = { full: ['modify', 'rx', 'list', 'read', 'write', 'change'], change: ['read'], modify: ['rx', 'list', 'read', 'write'], rx: ['list', 'read'] };
  const NAMES = ['Everyone', 'Administrators', 'Users', 'Guests', 'Authenticated Users', 'ICQA', 'user1', 'SYSTEM'].map(n => ({ name: n, type: /s$|Everyone|SYSTEM/.test(n) && n !== 'Users1' ? 'group' : 'user' }));

  function permEditor(desk, owner, title, perms, defs, readOnlyTop) {
    // perms: {user: {perm: {allow, deny}}} — 이 객체를 직접 고칩니다.
    let L, grid, cur = Object.keys(perms)[0];
    const box = h('div');
    const paintGrid = () => {
      grid.innerHTML = '';
      grid.append(h('tr', {}, h('th', {}, `${cur || ''}의 사용 권한(P)`), h('th', {}, '허용'), h('th', {}, '거부')));
      defs.forEach(([k, n]) => {
        const p = cur && perms[cur] ? perms[cur][k] : { allow: false, deny: false };
        const mk = side => { const c = h('input', { type: 'checkbox' }); c.checked = p[side]; c.disabled = !cur || readOnlyTop; c.addEventListener('change', () => { p[side] = c.checked; if (c.checked) { (IMPL[k] || []).forEach(x => { if (perms[cur][x]) perms[cur][x][side] = true; }); const other = side === 'allow' ? 'deny' : 'allow'; p[other] = false; } else if (side === 'allow' && k !== 'full') perms[cur].full && (perms[cur].full.allow = false); paintGrid(); }); return h('td', {}, c); };
        grid.append(h('tr', {}, h('td', {}, n), mk('allow'), mk('deny')));
      });
    };
    const paintL = () => { L.set(Object.keys(perms).map(u => ({ id: u, cells: [u], icon: /s$|Everyone|SYSTEM|OWNER/.test(u) ? 'group' : 'user' }))); L.sel = cur; L.paint(); };
    L = W.list({ cols: [{ t: '그룹 또는 사용자 이름(G):', w: 330 }], onSelect: r => { cur = r.id; paintGrid(); } });
    grid = h('table', { class: 'enx-perm-grid' });
    box.append(h('div', { class: 'enx-cap' }, '그룹 또는 사용자 이름(G):'), h('div', { class: 'enx-perm-users' }, L.el));
    if (!readOnlyTop) box.append(W.row(h('span', { style: { flex: 1 } }), W.btn('추가(D)...', () => W.pickPrincipal(desk, { title: '사용자 또는 그룹 선택', kind: '사용자 또는 그룹', names: () => NAMES, onOk: ns => { ns.forEach(n => { if (!perms[n]) perms[n] = Object.fromEntries(defs.map(([k]) => [k, { allow: defs === SHP ? k === 'read' : ['rx', 'list', 'read'].includes(k), deny: false }])); cur = n; }); paintL(); paintGrid(); } })), W.btn('제거(R)', () => { if (cur) { delete perms[cur]; cur = Object.keys(perms)[0]; paintL(); paintGrid(); } })));
    box.append(h('div', { style: { height: '8px' } }), grid);
    paintL(); paintGrid();
    return box;
  }

  SIMS.def('share', {
    title: '폴더 속성', label, blank, flat,
    mount(desk, q) {
      desk.el.classList.add('enx');
      const st = blank(); if (q && q.init) Object.assign(st, SIMS.clone(q.init));
      const img = n => h('img', { src: `img/emu/netetc/${n}.png`, class: 'enx-ic', alt: '', draggable: 'false' });
      const at = (el, l, t, w) => { Object.assign(el.style, { left: l + 'px', top: t + 'px' }, w ? { width: w + 'px' } : null); return el; };
      function open() {
        const name = st.folder.split('\\').pop();
        const parent = st.folder.slice(0, st.folder.length - name.length) || 'C:\\';
        let pathLbl, stateLbl, secTabEl;
        // 에뮬레이터(ntPermissionC)와 같은 443×461 창, 일반/공유/보안 세 탭.
        // render는 W.dialog 안에서 바로 실행되므로, 그 안에서는 아직 main을 쓸 수 없습니다(만든 뒤에 secTab을 붙임).
        const main = W.dialog(desk, { title: `${name} 속성`, w: 443, h: 461, bodyClass: 'dlg-body enx-fold',
          render: el => {
            pathLbl = h('div', { class: 'enx-path' }, st.share.on ? `\\\\ICQAPC\\${st.share.name}` : '공유 안 됨');
            stateLbl = h('div', {}, st.share.on ? '공유됨' : '공유 안 함');
            // 일반 탭: 에뮬레이터 화면에서 잰 좌표(탭 안쪽 기준)
            const gen = h('div', { class: 'enx-gen' },
              at(img('folder32'), 18, 11), at(W.text(name), 101, 22, 284),
              at(h('div', { class: 'enx-sep' }), 14, 51),
              at(h('span', {}, '종류:'), 17, 61), at(h('span', {}, '파일 폴더'), 101, 61),
              at(h('span', {}, '위치:'), 17, 85), at(h('span', {}, parent), 101, 85),
              at(h('span', {}, '크기:'), 17, 108), at(h('span', {}, '1.2KB (13,579 바이트)'), 101, 108),
              at(h('span', {}, '디스크 할당 크기:'), 17, 133), at(h('span', {}, '1.4KB (15,376 바이트)'), 131, 133),
              at(h('span', {}, '내용:'), 17, 157), at(h('span', {}, '파일 12, 폴더 0'), 101, 157),
              at(h('div', { class: 'enx-sep' }), 14, 182),
              at(h('span', {}, '만든 날짜 : 2014년 1월 1일 화요일, 오전 11:10:21'), 17, 195),
              at(h('div', { class: 'enx-sep' }), 14, 217),
              at(h('span', {}, '특성:'), 17, 228),
              at(W.chk('읽기 전용 (폴더의 파일에만 적용)', false), 101, 253), at(W.chk('숨김', false), 101, 275));
            const shareTab = h('div', { class: 'enx-pane' }, W.group('네트워크 파일 및 폴더 공유', h('div', { class: 'enx-share-hd' }, img('folder32'), h('div', {}, h('div', {}, name), stateLbl)), W.label('네트워크 경로(N):', { cls: 'l' }), pathLbl, W.row(W.btn('공유(S)...', null, { dis: true }))),
              W.group('고급 공유', W.label('사용자 지정 권한을 설정하고 다중 공유를 만들며 고급 공유 옵션을 설정합니다.'), W.row(W.btn('고급 공유(D)...', () => advShare()))), W.group('암호 보호', W.label('이 컴퓨터에 대한 사용자 계정과 암호가 있는 사용자만 공유 폴더에 액세스할 수 있습니다.')));
            const secTab = h('div', { class: 'enx-pane' }, W.form([['개체 이름:', h('span', {}, st.folder)]], { cols: '70px 1fr' }), permEditor(desk, null, '', st.ntfs, NTP, true), W.row(h('span', { style: { flex: 1 } }, '사용 권한을 변경하려면 [편집]을 클릭하십시오.'), W.btn('편집(E)...', () => editNtfs())), W.row(h('span', { style: { flex: 1 } }, '특정 권한이나 고급 설정을 보려면 [고급]을 클릭하십시오.'), W.btn('고급(V)', null, { dis: true })));
            const tabs = W.tabs([{ t: '일반', el: gen }, { t: '공유', el: shareTab }, { t: '보안', el: secTab }], { start: q && q.start === 'security' ? 2 : 1 });
            el.append(tabs.el);
            secTabEl = secTab;
          },
          buttons: [{ t: '확인', def: true, on: () => setTimeout(() => SIMS.closed(desk, open, '폴더 속성'), 0) }, { t: '취소', cancel: true }, { t: '적용', dis: true }],
          onCancelled: () => SIMS.closed(desk, open, '폴더 속성') });
        const ti = main.titleEl.querySelector('.ic'); const fi = img('folder16'); if (ti) ti.replaceWith(fi); else main.titleEl.prepend(fi);
        main.secTab = secTabEl;
        function advShare() {
          const w = SIMS.clone(st.share); let cOn, fN, fL, fC;
          W.dialog(desk, { title: '고급 공유', w: 400, h: 400, owner: main,
            render: el => { cOn = W.chk('선택한 폴더 공유(S)', w.on); fN = W.combo([w.name], w.name); fL = W.num(w.limit, { min: 1, max: 16777216, w: 80 }); fC = W.text(w.comment, { multi: true, rows: 3 });
              const sync = () => { [fN.input, fL, fC].forEach(x => (x.disabled = !cOn.checked)); }; cOn.onToggle(sync); sync();
              el.append(W.row(cOn), W.group('설정', W.label('공유 이름(H):', { cls: 'l' }), fN, W.row(W.btn('추가(A)', null, { dis: true }), W.btn('제거(R)', null, { dis: true })), W.row(h('span', {}, '동시 사용자 수 제한(L):'), fL), W.label('설명(O):', { cls: 'l' }), fC, W.row(W.btn('권한(P)', () => { if (!cOn.checked) return; const pw = SIMS.clone(w.perm); W.dialog(desk, { title: `${name}의 사용 권한`, w: 380, h: 420, owner: null, render: e2 => { e2.append(W.tabs([{ t: '공유 권한', el: permEditor(desk, null, '', pw, SHP, false) }]).el); e2.style.display = 'flex'; e2.style.flexDirection = 'column'; }, buttons: [{ t: '확인', def: true, on: () => { w.perm = pw; } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { w.perm = SIMS.clone(pw); return false; } }] }); }), W.btn('캐싱(C)', null, { dis: true })))); },
            buttons: [{ t: '확인', def: true, on: () => { w.on = cOn.checked; w.name = fN.value.trim() || name; w.limit = +fL.value; w.comment = fC.value.trim(); st.share = w; pathLbl.textContent = w.on ? `\\\\ICQAPC\\${w.name}` : '공유 안 됨'; stateLbl.textContent = w.on ? '공유됨' : '공유 안 함'; } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { w.on = cOn.checked; w.name = fN.value.trim() || name; w.limit = +fL.value; w.comment = fC.value.trim(); st.share = SIMS.clone(w); return false; } }] });
        }
        function editNtfs() {
          const pw = SIMS.clone(st.ntfs);
          W.dialog(desk, { title: `${name}의 사용 권한`, w: 400, h: 470, owner: main,
            render: el => { el.append(W.tabs([{ t: '보안', el: h('div', {}, W.form([['개체 이름:', h('span', {}, st.folder)]], { cols: '70px 1fr' }), permEditor(desk, null, '', pw, NTP, false)) }]).el); el.style.display = 'flex'; el.style.flexDirection = 'column'; },
            buttons: [{ t: '확인', def: true, on: () => { st.ntfs = pw; refreshSec(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { st.ntfs = SIMS.clone(pw); refreshSec(); return false; } }] });
        }
        function refreshSec() { const box = main.secTab; const old = box.children[1]; const nb = permEditor(desk, main, '', st.ntfs, NTP, true); box.replaceChild(nb, old); }
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
