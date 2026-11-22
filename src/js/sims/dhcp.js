/* 가상 화면: DHCP 관리자 (새 범위 마법사, 제외 범위, 예약, 활성화, 범위 옵션, 범위 속성)
 * 채점 키(대상 범위 = 문제의 target 이름, 없으면 마지막에 만든 범위):
 *   scope.exists, scope.name, scope.desc, scope.start, scope.end, scope.mask, scope.excl["시작-끝"], scope.leaseD/H/M,
 *   scope.router[], scope.dns[], scope.domain, scope.active, scope.res.<예약 이름>.ip/.mac, scope.resIps[] */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W; const IP = SIMS.IP;
  const normMac = m => String(m || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
  const LABELS = { 'scope.exists': '범위를 만들었는지', 'scope.name': '범위 이름', 'scope.desc': '범위 설명', 'scope.start': '시작 IP 주소', 'scope.end': '끝 IP 주소', 'scope.mask': '서브넷 마스크', 'scope.excl': '제외 범위', 'scope.leaseD': '임대 기간(일)', 'scope.leaseH': '임대 기간(시간)', 'scope.leaseM': '임대 기간(분)', 'scope.router': '라우터(기본 게이트웨이)', 'scope.dns': 'DNS 서버', 'scope.domain': '부모 도메인', 'scope.active': '범위 활성화', 'scope.resIps': '예약한 IP 주소' };
  const blank = () => ({ scopes: [] });

  // ICQA 에뮬레이터 화면에서 잘라 온 아이콘(img/emu/dhcpdns) — 공용 아이콘 표(ICONS)에 dd 접두어로 더합니다.
  const E = 'img/emu/dhcpdns/';
  const img = (n, w = 16, hh = 16) => `<img src="${E}${n}.png" width="${w}" height="${hh}" alt="" draggable="false">`;
  Object.assign(g.ICONS, { ddDhcp: img('dhcp'), ddServer: img('server'), ddIpv4: img('ipv4'), ddSopt: img('sopt'), ddFilter: img('filter'), ddFolder: img('folder'), ddTitleDhcp: img('title-dhcp') });
  // 에뮬레이터 모양 입히기: 창 틀·글꼴(emu-dhcpdns.css), 트리 +/− 단추 그림
  const skin = (M, cls) => {
    M.win.el.classList.add('emu-dd', cls);
    const mark = () => M.tree.el.querySelectorAll('.tg').forEach(t => t.classList.toggle('dd-open', t.textContent === '−'));
    new MutationObserver(mark).observe(M.tree.el, { childList: true });
    mark();
  };
  const toolbar = () => h('span', { class: 'dd-tbar', title: '콘솔 트리 표시/숨기기' }, h('img', { src: E + 'tbar.png', width: 32, height: 25, alt: '', draggable: 'false' }));

  function flat(st, q) {
    const t = q && q.target ? st.scopes.find(s => s.name.toLowerCase() === String(q.target).toLowerCase()) : st.scopes[st.scopes.length - 1];
    if (!t) return { 'scope.exists': false };
    const o = { 'scope.exists': true, 'scope.name': t.name, 'scope.desc': t.desc, 'scope.start': t.start, 'scope.end': t.end, 'scope.mask': t.mask, 'scope.excl': t.excl.map(e => `${e.from}-${e.to}`), 'scope.leaseD': t.lease.d, 'scope.leaseH': t.lease.h, 'scope.leaseM': t.lease.m, 'scope.router': t.router.slice(), 'scope.dns': t.dns.slice(), 'scope.domain': t.domain, 'scope.active': t.active, 'scope.resIps': t.res.map(r => r.ip) };
    t.res.forEach(r => { o[`scope.res.${r.name}.ip`] = r.ip; o[`scope.res.${r.name}.mac`] = normMac(r.mac); o[`scope.res.${r.name}.desc`] = r.desc; });
    return o;
  }
  const scopeTitle = s => `범위 [${IP.net(s.start, s.mask)}] ${s.name}`;

  SIMS.def('dhcp', {
    title: 'DHCP', labels: LABELS, blank, flat,
    mount(desk, q) {
      const st = Object.assign(blank(), SIMS.clone((q && q.init) || {}));
      let M;
      const sid = s => 'sc:' + st.scopes.indexOf(s);
      const scopeOf = n => st.scopes[+String(n.id).split(':')[1]];
      function nodes() {
        // 에뮬레이터 트리: DHCP > ICQAServer > IPv4(범위들, 서버 옵션, 필터) / IPv6 — 정책 폴더는 없습니다.
        return [{ id: 'dhcp', label: 'DHCP', icon: 'ddDhcp', kids: () => [{ id: 'srv', label: 'ICQAServer', icon: 'ddServer', kids: () => [
          { id: 'v4', label: 'IPv4', icon: 'ddIpv4', kids: () => st.scopes.map(s => ({ id: sid(s), label: scopeTitle(s), icon: 'ddFolder', kids: () => [
            { id: sid(s) + ':pool', label: '주소 풀', icon: 'pool' }, { id: sid(s) + ':lease', label: '주소 임대', icon: 'lease' },
            { id: sid(s) + ':res', label: '예약', icon: 'ddFolder', kids: () => s.res.map((r, k) => ({ id: sid(s) + ':r:' + k, label: `[${r.ip}] ${r.name}`, icon: 'reserve' })) },
            { id: sid(s) + ':opt', label: '범위 옵션', icon: 'ddSopt' }] })).concat([
            { id: 'sopt', label: '서버 옵션', icon: 'ddSopt' }, { id: 'flt', label: '필터', icon: 'ddFilter', kids: [{ id: 'flt-a', label: '허용', icon: 'ddFilter' }, { id: 'flt-d', label: '거부', icon: 'ddFilter' }] }]) },
          { id: 'v6', label: 'IPv6', icon: 'ddIpv4', kids: [{ id: 'v6o', label: '서버 옵션', icon: 'ddSopt' }] }] }] }];
      }
      const part = n => { const p = String(n.id).split(':'); return p[0] === 'sc' ? { s: st.scopes[+p[1]], sub: p[2], k: p[3] != null ? +p[3] : null } : null; };
      function menu(n) {
        const p = part(n);
        if (n.id === 'v4') return [{ t: '표시 통계(S)...', dis: true }, { t: '새 범위(P)...', on: newScope }, { t: '새 슈퍼 범위(S)...', dis: true }, { t: '새 다중 캐스트 범위(M)...', dis: true }, '-', { t: '새로 고침(F)', on: () => M.refresh() }, '-', { t: '속성(R)', dis: true }];
        if (p && !p.sub) return [{ t: '표시 통계(S)...', dis: true }, p.s.active ? { t: '비활성화(E)', on: () => { p.s.active = false; M.refresh(); } } : { t: '활성화(A)', on: () => { p.s.active = true; M.refresh(); } }, '-', { t: '삭제(D)', on: () => delScope(p.s) }, { t: '새로 고침(F)', on: () => M.refresh() }, '-', { t: '속성(R)', on: () => scopeProps(p.s) }];
        if (p && p.sub === 'pool') return [{ t: '새 제외 범위(X)...', on: () => exclDlg(p.s) }, { t: '새로 고침(F)', on: () => M.refresh() }];
        if (p && p.sub === 'res' && p.k == null) return [{ t: '새 예약(R)...', on: () => resDlg(p.s) }, { t: '새로 고침(F)', on: () => M.refresh() }];
        if (p && p.sub === 'r') return [{ t: '삭제(D)', on: () => { p.s.res.splice(p.k, 1); M.tree.sel = null; M.refresh(); } }, { t: '속성(R)', on: () => resDlg(p.s, p.k) }];
        if (p && p.sub === 'opt') return [{ t: '옵션 구성(C)...', on: () => optDlg(p.s) }, { t: '새로 고침(F)', on: () => M.refresh() }];
        return [{ t: '새로 고침(F)', on: () => M.refresh() }];
      }
      function render(n, el) {
        const p = part(n);
        let cols, rows = [], onDbl, onCtx, onBlank;
        if (n.id === 'v4') { cols = [{ t: 'DHCP 서버의 내용', w: 200 }, { t: '상태', w: 100 }, { t: '설명', w: 100 }]; rows = st.scopes.map(s => ({ id: sid(s), cells: [scopeTitle(s), s.active ? '** 활성 **' : '** 비활성 **', s.desc], icon: 'ddFolder' })).concat([{ id: 'sopt', cells: ['서버 옵션', '', ''], icon: 'ddSopt' }, { id: 'flt', cells: ['필터', '', ''], icon: 'ddFilter' }]); onDbl = r => M.select(r.id); onBlank = e => M.ctx(menu(n), e); }
        else if (p && !p.sub) { cols = [{ t: '범위의 내용', w: 200 }]; rows = ['pool', 'lease', 'res', 'opt'].map((x, i) => ({ id: sid(p.s) + ':' + x, cells: [['주소 풀', '주소 임대', '예약', '범위 옵션'][i]], icon: ['pool', 'lease', 'ddFolder', 'ddSopt'][i] })); onDbl = r => M.select(r.id); }
        else if (p && p.sub === 'pool') { cols = [{ t: '시작 IP 주소', w: 150 }, { t: '끝 IP 주소', w: 150 }, { t: '설명', w: 260 }]; rows = [{ id: 'rng', cells: [p.s.start, p.s.end, '주소 범위 배포'], icon: 'pool' }].concat(p.s.excl.map((e, k) => ({ id: 'x' + k, cells: [e.from, e.to, '배포에서 제외된 IP 주소'], icon: 'filter' }))); onCtx = (r, e) => { if (r.id.startsWith('x')) M.ctx([{ t: '삭제(D)', on: () => { p.s.excl.splice(+r.id.slice(1), 1); M.refresh(); } }], e); }; onBlank = e => M.ctx(menu(n), e); }
        else if (p && p.sub === 'res' && p.k == null) { cols = [{ t: '예약', w: 320 }]; rows = p.s.res.map((r, k) => ({ id: sid(p.s) + ':r:' + k, cells: [`[${r.ip}] ${r.name}`], icon: 'reserve' })); onDbl = r => M.select(r.id); onBlank = e => M.ctx(menu(n), e); if (!rows.length) el.append(h('div', { class: 'feat-body', style: { paddingTop: '30px' } }, h('p', {}, '이 범위에 예약된 주소가 없습니다.'), h('p', {}, '새 예약을 추가하려면 [동작] 메뉴에서 [새 예약]을 클릭하십시오.'))); }
        else if (p && p.sub === 'r') { const r = p.s.res[p.k]; cols = [{ t: '옵션 이름', w: 200 }, { t: '값', w: 300 }]; rows = [{ id: 'a', cells: ['예약된 IP 주소', r.ip] }, { id: 'b', cells: ['MAC 주소', r.mac] }]; }
        else if (p && p.sub === 'opt') { cols = [{ t: '옵션 이름', w: 200 }, { t: '공급업체', w: 90 }, { t: '값', w: 260 }, { t: '클래스', w: 60 }]; if (p.s.router.length) rows.push({ id: 'o3', cells: ['003 라우터', '표준', p.s.router.join(', '), '없음'], icon: 'ddSopt' }); if (p.s.dns.length) rows.push({ id: 'o6', cells: ['006 DNS 서버', '표준', p.s.dns.join(', '), '없음'], icon: 'ddSopt' }); if (p.s.domain) rows.push({ id: 'o15', cells: ['015 DNS 도메인 이름', '표준', p.s.domain, '없음'], icon: 'ddSopt' }); onBlank = e => M.ctx(menu(n), e); }
        else if (n.id === 'srv' || n.id === 'dhcp') { cols = [{ t: '이름', w: 200 }]; rows = [{ id: 'v4', cells: ['IPv4'], icon: 'ddIpv4' }, { id: 'v6', cells: ['IPv6'], icon: 'ddIpv4' }]; onDbl = r => M.select(r.id); }
        else { cols = [{ t: '이름', w: 200 }]; }
        const L = W.list({ cols, rows, onDbl, onContext: (r, e) => (onCtx ? onCtx(r, e) : M.ctx(menu(M.tree.node(r.id) || n), e)), onBlank });
        if (!el.children.length) el.append(L.el);
      }
      function delScope(s) { W.msg(desk, { title: 'DHCP', text: `범위를 삭제하시겠습니까?\n${scopeTitle(s)}`, icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win }).then(r => { if (r === '예(Y)') { st.scopes.splice(st.scopes.indexOf(s), 1); M.tree.sel = 'v4'; M.refresh(); } }); }

      // ───────── 새 범위 마법사 ─────────
      function newScope() {
        const c = { name: '', desc: '', start: '', end: '', len: 24, mask: '255.255.255.0', excl: [], lease: { d: 8, h: 0, m: 0 }, cfg: 'yes', router: [], domain: '', dns: [], act: 'yes' };
        const ipList = (arr, label) => {
          const fIp = W.ip(''); const L = W.list({ cols: [{ t: '', w: 160 }] }); L.el.querySelector('thead') && (L.el.style.minHeight = '0');
          const paint = () => { L.set(arr.map((x, i) => ({ id: 'i' + i, cells: [x] }))); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none'; };
          paint();
          const box = h('div', { style: { height: '90px', width: '180px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el);
          return h('div', {}, W.row(h('span', { style: { width: '80px' } }, label), fIp, W.btn('추가(D)', () => { if (!IP.ok(fIp.value)) { W.msg(desk, { title: 'DHCP', text: '올바른 IP 주소를 입력하십시오.', icon: 'error', owner: wz }); return; } if (!arr.includes(fIp.value)) arr.push(fIp.value); fIp.value = ''; paint(); })),
            W.row(h('span', { style: { width: '80px' } }), box, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, W.btn('제거(R)', () => { const s = L.selected(); if (s) { arr.splice(+s.id.slice(1), 1); paint(); } }), W.btn('위로(U)', () => { const s = L.selected(); const i = s ? +s.id.slice(1) : -1; if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; paint(); } }), W.btn('아래로(O)', () => { const s = L.selected(); const i = s ? +s.id.slice(1) : -1; if (i >= 0 && i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; paint(); } }))));
        };
        let fName, fDesc, fStart, fEnd, fLen, fMask, fxS, fxE, Lx, fD, fH, fM, rCfg, fDom, rAct;
        const wz = W.wizard(desk, {
          title: '새 범위 마법사', owner: M.win, w: 540, h: 450, icon: 'dhcp', ctx: c,
          pages: [
            { welcome: { title: '새 범위 마법사 시작', text: ['이 마법사를 사용하면 DHCP 클라이언트에 IP 주소를 배포하기 위한 범위를 설정할 수 있습니다.', '계속하려면 [다음]을 클릭하십시오.'] } },
            { head: '범위 이름', sub: '범위를 식별하는 이름을 입력해야 합니다. 설명을 입력할 수도 있습니다.', render: el => { fName = W.text(''); fDesc = W.text(''); el.append(W.label('이 범위의 이름 및 설명을 입력하십시오. 이 정보를 사용하면 네트워크에서 범위가 사용되는 방식을 쉽게 식별할 수 있습니다.'), W.form([['이름(A):', fName], ['설명(D):', fDesc]], { cols: '80px 1fr' })); },
              next: () => { if (!fName.value.trim()) return '범위의 이름을 입력해야 합니다.'; c.name = fName.value.trim(); c.desc = fDesc.value.trim(); return true; } },
            { head: 'IP 주소 범위', sub: '연속된 IP 주소 집합을 식별하여 범위 주소 범위를 정의합니다.', render: el => {
              fStart = W.ip(''); fEnd = W.ip(''); fLen = W.num(24, { min: 1, max: 30, w: 50 }); fMask = W.ip('255.255.255.0');
              fStart.addEventListener('leave', () => { if (IP.ok(fStart.value)) { const m = IP.classMask(fStart.value); if (m) { fMask.value = m; fLen.value = IP.prefix(m); } } });
              fLen.addEventListener('input', () => { const n = +fLen.value; if (n >= 1 && n <= 30) fMask.value = IP.maskOf(n); });
              fMask.addEventListener('change', () => { if (IP.maskOk(fMask.value)) fLen.value = IP.prefix(fMask.value); });
              el.append(W.group('DHCP 서버의 구성 설정', W.label('범위에서 배포하는 주소 범위를 입력하십시오.'), W.form([['시작 IP 주소(S):', fStart], ['끝 IP 주소(E):', fEnd]], { cols: '120px auto' })),
                W.group('DHCP 클라이언트에 전파할 구성 설정', W.form([['길이(L):', fLen], ['서브넷 마스크(U):', fMask]], { cols: '120px auto' })));
            },
              next: () => {
                const s = fStart.value, e = fEnd.value, m = fMask.value;
                if (!IP.ok(s) || !IP.ok(e)) return '올바른 IP 주소를 입력하십시오.';
                if (!IP.maskOk(m)) return '서브넷 마스크가 올바르지 않습니다.';
                if (IP.toInt(e) < IP.toInt(s)) return '끝 IP 주소는 시작 IP 주소보다 크거나 같아야 합니다.';
                if (!IP.same(s, e, m)) return '시작 IP 주소와 끝 IP 주소가 같은 서브넷에 있지 않습니다. 서브넷 마스크를 확인하십시오.';
                c.start = s; c.end = e; c.mask = m; return true;
              } },
            { head: '제외 및 지연 추가', sub: '제외는 서버에서 배포하지 않는 주소 또는 주소 범위입니다. 지연은 서버가 DHCPOFFER 메시지 전송을 지연하는 기간입니다.', render: el => {
              fxS = W.ip(''); fxE = W.ip(''); Lx = W.list({ cols: [{ t: '', w: 250 }] });
              const paint = () => { Lx.set(c.excl.map((x, i) => ({ id: 'x' + i, cells: [x.from === x.to ? x.from : `주소 ${x.from} - ${x.to}`] }))); const th = Lx.el.querySelector('thead'); if (th) th.style.display = 'none'; };
              paint();
              el.append(W.label('제외할 IP 주소 범위를 입력하십시오. 단일 주소를 제외하려면 시작 IP 주소에만 주소를 입력하십시오.'),
                W.row(h('span', { style: { width: '110px' } }, '시작 IP 주소(S):'), fxS, h('span', {}, '끝 IP 주소(E):'), fxE, W.btn('추가(D)', () => {
                  const a = fxS.value, b = fxE.value || fxS.value;
                  if (!IP.ok(a) || !IP.ok(b)) { W.msg(desk, { title: 'DHCP', text: '올바른 IP 주소를 입력하십시오.', icon: 'error', owner: wz }); return; }
                  if (IP.toInt(a) < IP.toInt(c.start) || IP.toInt(b) > IP.toInt(c.end) || IP.toInt(b) < IP.toInt(a)) { W.msg(desk, { title: 'DHCP', text: `제외할 주소 범위는 범위 주소 범위(${c.start} - ${c.end}) 안에 있어야 합니다.`, icon: 'error', owner: wz }); return; }
                  c.excl.push({ from: a, to: b }); fxS.value = ''; fxE.value = ''; paint();
                })),
                W.label('제외된 주소 범위(C):', { cls: 'l' }), W.row(h('div', { style: { height: '90px', width: '280px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, Lx.el), W.btn('제거(V)', () => { const s = Lx.selected(); if (s) { c.excl.splice(+s.id.slice(1), 1); paint(); } })),
                W.row(h('span', {}, '서브넷 지연(밀리초)(L):'), W.num(0, { w: 60 })));
            } },
            { head: '임대 기간', sub: '임대 기간은 클라이언트가 이 범위의 IP 주소를 사용할 수 있는 기간을 지정합니다.', render: el => {
              fD = W.num(8, { min: 0, max: 999, w: 55 }); fH = W.num(0, { min: 0, max: 23, w: 55 }); fM = W.num(0, { min: 0, max: 59, w: 55 });
              el.append(W.label('임대 기간은 일반적으로 컴퓨터가 동일한 물리적 네트워크에 연결된 평균 시간과 같아야 합니다. 주로 휴대용 컴퓨터나 전화 접속 클라이언트로 구성된 모바일 네트워크에서는 짧은 임대 기간이 유용합니다.'), W.label('이 서버에서 배포되는 범위 임대 기간을 설정하십시오.'),
                W.label('제한:', { cls: 'l' }), h('div', { style: { display: 'flex', gap: '14px' } }, h('label', {}, '일(D):', h('br'), fD), h('label', {}, '시간(O):', h('br'), fH), h('label', {}, '분(M):', h('br'), fM)));
            }, next: () => { c.lease = { d: +fD.value || 0, h: +fH.value || 0, m: +fM.value || 0 }; if (!c.lease.d && !c.lease.h && !c.lease.m) return '임대 기간은 0일 수 없습니다.'; return true; } },
            { head: 'DHCP 옵션 구성', sub: '클라이언트가 범위를 사용하려면 가장 일반적인 DHCP 옵션을 구성해야 합니다.', render: el => {
              rCfg = W.radios([['yes', '예, 지금 이 옵션을 구성하겠습니다(Y)'], ['no', '아니요, 나중에 이 옵션을 구성하겠습니다(O)']], 'yes');
              el.append(W.label('클라이언트가 주소를 얻을 때 라우터(기본 게이트웨이), DNS 서버 IP 주소, 해당 범위에 대한 WINS 설정과 같은 DHCP 옵션이 지정됩니다.'), W.label('여기서 선택하는 설정은 이 범위에 대한 것이며 이 서버의 서버 옵션 폴더에 있는 설정보다 우선합니다.'), W.label('지금 이 범위에 대해 DHCP 옵션을 구성하시겠습니까?'), W.row(rCfg.els[0]), W.row(rCfg.els[1]));
            }, next: () => (rCfg.value === 'yes' ? true : 'skip:10') },
            { head: '라우터(기본 게이트웨이)', sub: '이 범위가 배포할 라우터 또는 기본 게이트웨이를 지정할 수 있습니다.', render: el => { el.append(W.label('클라이언트가 사용하는 라우터의 IP 주소를 추가하려면 아래에 주소를 입력하십시오.'), ipList(c.router, 'IP 주소(P):')); } },
            { head: '도메인 이름 및 DNS 서버', sub: 'DNS(Domain Name System)는 네트워크에서 클라이언트가 사용하는 도메인 이름을 매핑하고 변환합니다.', render: el => { fDom = W.text('', { w: 220 }); el.append(W.label('네트워크의 클라이언트 컴퓨터가 DNS 이름 확인에 사용할 부모 도메인을 지정할 수 있습니다.'), W.row(h('span', { style: { width: '100px' } }, '부모 도메인(M):'), fDom), W.label('DNS 서버를 사용하도록 범위 클라이언트를 구성하려면 해당 서버의 IP 주소를 입력하십시오.'), W.row(h('span', { style: { width: '100px' } }, '서버 이름(S):'), W.text('', { w: 160 }), W.btn('확인(E)', null, { dis: true })), ipList(c.dns, 'IP 주소(P):')); }, next: () => { c.domain = fDom.value.trim(); return true; } },
            { head: 'WINS 서버', sub: 'WINS를 실행하는 컴퓨터는 NetBIOS 이름을 IP 주소로 변환합니다.', render: el => { el.append(W.label('여기에 서버 IP 주소를 입력하면 Windows 클라이언트가 브로드캐스트를 사용하여 NetBIOS 이름을 등록하고 확인하기 전에 WINS를 쿼리할 수 있습니다.'), ipList([], 'IP 주소(P):')); } },
            { head: '범위 활성화', sub: '클라이언트는 범위가 활성화된 경우에만 주소 임대를 얻을 수 있습니다.', render: el => { rAct = W.radios([['yes', '예, 지금 이 범위를 활성화하겠습니다(Y)'], ['no', '아니요, 나중에 이 범위를 활성화하겠습니다(O)']], 'yes'); el.append(W.label('지금 이 범위를 활성화하시겠습니까?'), W.row(rAct.els[0]), W.row(rAct.els[1])); }, next: () => { c.act = rAct.value; return 'skip:11'; } },
            { head: '범위 활성화', sub: '옵션을 나중에 구성합니다.', render: el => { el.append(W.label('DHCP 옵션을 나중에 구성하기로 했으므로 범위는 활성화되지 않은 상태로 만들어집니다. 옵션을 구성한 뒤 범위를 마우스 오른쪽 단추로 클릭해 [활성화]하십시오.')); }, next: () => { c.act = 'no'; c.skipped = true; return true; } },
            { final: { title: '새 범위 마법사 완료', text: ['새 범위 마법사를 완료했습니다.', '마법사를 닫으려면 [마침]을 클릭하십시오.'] } },
          ],
          onFinish: () => {
            const s = { name: c.name, desc: c.desc, start: c.start, end: c.end, mask: c.mask, excl: c.excl, lease: c.lease, router: c.skipped ? [] : c.router, dns: c.skipped ? [] : c.dns, domain: c.skipped ? '' : c.domain, active: c.act === 'yes', res: [] };
            st.scopes.push(s); M.tree.open.add('v4'); M.tree.open.add(sid(s)); M.refresh(); M.select(sid(s));
          },
        });
      }
      function exclDlg(s) {
        let a, b;
        W.dialog(desk, { title: '제외 범위 추가', w: 360, h: 190, owner: M.win, render: el => { a = W.ip(''); b = W.ip(''); el.append(W.label('제외할 IP 주소 범위를 입력하십시오. 단일 주소를 제외하려면 시작 IP 주소에만 주소를 입력하십시오.'), W.form([['시작 IP 주소(S):', a], ['끝 IP 주소(E):', b]], { cols: '110px auto' })); },
          buttons: [{ t: '추가(D)', def: true, on: () => { const x = a.value, y = b.value || a.value; if (!IP.ok(x) || !IP.ok(y) || IP.toInt(x) < IP.toInt(s.start) || IP.toInt(y) > IP.toInt(s.end) || IP.toInt(y) < IP.toInt(x)) { W.msg(desk, { title: 'DHCP', text: `제외할 주소 범위는 범위 주소 범위(${s.start} - ${s.end}) 안에 있어야 합니다.`, icon: 'error' }); return false; } s.excl.push({ from: x, to: y }); a.value = ''; b.value = ''; M.refresh(); return false; } }, { t: '닫기(C)', cancel: true }] });
      }
      function resDlg(s, k) {
        const r0 = k != null ? s.res[k] : { name: '', ip: '', mac: '', desc: '', type: 'both' };
        let fn, fi, fm, fd, rt;
        W.dialog(desk, { title: k != null ? '예약 속성' : '새 예약', w: 380, h: 330, owner: M.win,
          render: el => {
            fn = W.text(r0.name); fi = W.ip(r0.ip || IP.net(s.start, s.mask).replace(/\.0$/, '.')); fm = W.text(r0.mac); fd = W.text(r0.desc);
            if (!r0.ip) fi.value = IP.net(s.start, s.mask).split('.').slice(0, 3).join('.') + '.';
            rt = W.radios([['dhcp', 'DHCP(D)'], ['bootp', 'BOOTP(O)'], ['both', '둘 다(B)']], r0.type || 'both');
            el.append(W.label('예약된 클라이언트에 대한 정보를 입력하십시오.'), W.form([['예약 이름(R):', fn], ['IP 주소(P):', fi], ['MAC 주소(M):', fm], ['설명(E):', fd]], { cols: '100px 1fr' }), W.group('지원되는 유형', W.row(rt.els[0]), W.row(rt.els[1]), W.row(rt.els[2])));
          },
          buttons: [{ t: k != null ? '확인' : '추가(A)', def: true, on: () => {
            const ip = fi.value;
            if (!fn.value.trim()) { W.msg(desk, { title: 'DHCP', text: '예약 이름을 입력하십시오.', icon: 'error' }); return false; }
            if (!IP.ok(ip) || IP.toInt(ip) < IP.toInt(s.start) || IP.toInt(ip) > IP.toInt(s.end)) { W.msg(desk, { title: 'DHCP', text: `지정한 IP 주소가 범위(${s.start} - ${s.end})에 속하지 않습니다.`, icon: 'error' }); return false; }
            if (normMac(fm.value).length !== 12) { W.msg(desk, { title: 'DHCP', text: 'MAC 주소는 16진수 12자리여야 합니다. (예: 00-1A-2B-3C-4D-5E)', icon: 'error' }); return false; }
            const r = { name: fn.value.trim(), ip, mac: fm.value.trim(), desc: fd.value.trim(), type: rt.value };
            if (k != null) { s.res[k] = r; M.refresh(); return; }
            s.res.push(r); M.refresh(); fn.value = ''; fm.value = ''; fd.value = ''; return false;
          } }, { t: k != null ? '취소' : '닫기(C)', cancel: true }] });
      }
      function scopeProps(s) {
        let fn, fs, fe, fD, fH, fM, fd;
        W.dialog(desk, { title: `${scopeTitle(s)} 속성`, w: 420, h: 440, owner: M.win,
          render: el => {
            fn = W.text(s.name); fs = W.ip(s.start); fe = W.ip(s.end); fD = W.num(s.lease.d, { w: 50 }); fH = W.num(s.lease.h, { w: 50 }); fM = W.num(s.lease.m, { w: 50 }); fd = W.text(s.desc);
            const t = W.tabs([{ t: '일반', el: h('div', {}, W.form([['범위 이름(C):', fn], ['시작 IP 주소(S):', fs], ['끝 IP 주소(E):', fe], ['길이:', W.text(String(IP.prefix(s.mask)), { ro: true, w: 50 })], ['서브넷 마스크(U):', W.text(s.mask, { ro: true, w: 130 })]], { cols: '110px 1fr' }), W.group('DHCP 클라이언트 임대 기간', W.row(h('span', {}, '제한:'), h('label', {}, '일(D) ', fD), h('label', {}, '시간(O) ', fH), h('label', {}, '분(M) ', fM))), W.form([['설명(D):', fd]], { cols: '110px 1fr' })) }, { t: 'DNS', el: h('div', {}, W.label('이 연습 프로그램에서는 DNS 탭을 쓰지 않습니다.')) }, { t: '네트워크 액세스 보호', el: h('div') }, { t: '고급', el: h('div') }]);
            el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(t.el);
          },
          buttons: [{ t: '확인', def: true, on: () => { if (!IP.ok(fs.value) || !IP.ok(fe.value) || !IP.same(fs.value, fe.value, s.mask)) { W.msg(desk, { title: 'DHCP', text: '주소 범위가 올바르지 않습니다.', icon: 'error' }); return false; } Object.assign(s, { name: fn.value.trim() || s.name, start: fs.value, end: fe.value, desc: fd.value.trim(), lease: { d: +fD.value || 0, h: +fH.value || 0, m: +fM.value || 0 } }); M.refresh(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { Object.assign(s, { name: fn.value.trim() || s.name, desc: fd.value.trim(), lease: { d: +fD.value || 0, h: +fH.value || 0, m: +fM.value || 0 } }); M.refresh(); return false; } }] });
      }
      function optDlg(s) {
        const work = { router: s.router.slice(), dns: s.dns.slice(), domain: s.domain };
        let L, area;
        const OPTS = [['router', '003 라우터'], ['dns', '006 DNS 서버'], ['domain', '015 DNS 도메인 이름']];
        W.dialog(desk, { title: '범위 옵션', w: 430, h: 470, owner: M.win,
          render: el => {
            area = h('div', { style: { minHeight: '150px' } });
            L = W.list({ cols: [{ t: '사용 가능한 옵션', w: 250 }, { t: '설명', w: 120 }], rows: OPTS.map(([k, t]) => ({ id: k, cells: [h('span', {}, h('input', { type: 'checkbox', checked: k === 'domain' ? !!work.domain : !!work[k].length, disabled: true, style: { marginRight: '6px' } }), t), k === 'domain' ? 'DNS 도메인' : k === 'dns' ? 'DNS 서버 배열' : '라우터 배열'] })), onSelect: r => show(r.id) });
            el.append(W.tabs([{ t: '일반', el: h('div', {}, h('div', { style: { height: '120px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el), W.group('데이터 입력', area)) }, { t: '고급', el: h('div') }]).el);
            el.style.display = 'flex'; el.style.flexDirection = 'column';
          },
          buttons: [{ t: '확인', def: true, on: () => { Object.assign(s, work); M.refresh(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { Object.assign(s, SIMS.clone(work)); M.refresh(); return false; } }] });
        function show(k) {
          area.innerHTML = '';
          if (k === 'domain') { const t = W.text(work.domain); t.addEventListener('input', () => (work.domain = t.value.trim())); area.append(W.label('문자열 값(S):', { cls: 'l' }), t); return; }
          const arr = work[k]; const fi = W.ip(''); const LL = W.list({ cols: [{ t: 'IP 주소', w: 160 }] });
          const paint = () => LL.set(arr.map((x, i) => ({ id: 'i' + i, cells: [x] })));
          paint();
          area.append(W.row(h('span', {}, 'IP 주소(P):'), fi, W.btn('추가(D)', () => { if (IP.ok(fi.value)) { arr.push(fi.value); fi.value = ''; paint(); } })), W.row(h('div', { style: { height: '80px', width: '200px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, LL.el), W.btn('제거(R)', () => { const x = LL.selected(); if (x) { arr.splice(+x.id.slice(1), 1); paint(); } })));
        }
      }
      function open() {
        // 창 크기·왼쪽 칸 너비는 에뮬레이터(ntDHCPC) 화면과 같은 픽셀 값
        M = SIMS.mmc(desk, { title: 'DHCP', icon: 'ddTitleDhcp', w: 964, h: 701, nodes, open: ['dhcp', 'srv', 'v4'], sel: 'v4', render, menu, leftW: 179, toolbar: toolbar(), onClose: () => SIMS.closed(desk, open, 'DHCP 관리자') });
        skin(M, 'emu-dhcp');
      }
      open();
      return { state: () => flat(st, q), open, st };
    },
  });
})(window);
