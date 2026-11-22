/* 가상 화면: 로컬 영역 연결 속성 → Internet Protocol Version 4 (TCP/IPv4) 속성 → 고급 TCP/IP 설정
 * 채점 키: mode(static/dhcp), ip, mask, gw, dns1, dns2, addrs(모든 IP "IP/마스크"), gws(모든 게이트웨이), dnsAll(모든 DNS) */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W; const IP = SIMS.IP;

  const LABELS = { mode: 'IP 주소 받는 방법', ip: 'IP 주소', mask: '서브넷 마스크', gw: '기본 게이트웨이', dns1: '기본 설정 DNS 서버', dns2: '보조 DNS 서버', addrs: '고급 → IP 주소 목록', gws: '고급 → 기본 게이트웨이 목록', dnsAll: '고급 → DNS 서버 주소 목록' };
  const blank = () => ({ dhcp: true, dnsAuto: true, addrs: [], gws: [], dns: [] });
  function flat(st) {
    return {
      mode: st.dhcp ? 'dhcp' : 'static', ip: st.dhcp ? '' : (st.addrs[0] || {}).ip || '', mask: st.dhcp ? '' : (st.addrs[0] || {}).mask || '',
      gw: st.gws[0] || '', dns1: st.dns[0] || '', dns2: st.dns[1] || '',
      addrs: st.addrs.map(a => `${a.ip}/${a.mask}`), gws: st.gws.slice(), dnsAll: st.dns.slice(),
    };
  }

  // IPv4 속성 대화 상자: work(작업용 복사본)를 고치고, 확인하면 done(work) 호출
  function ipv4Dialog(desk, owner, work, done) {
    work = SIMS.clone(work); // 취소하면 바깥 설정이 바뀌지 않도록 복사본으로 작업
    let rIp, rDns, fIp, fMask, fGw, fD1, fD2, chkV;
    const dlg = W.dialog(desk, {
      title: 'Internet Protocol Version 4 (TCP/IPv4) 속성', w: 403, h: 455, owner,
      render: b => {
        const tabsEl = h('div', { style: { display: 'flex', flexDirection: 'column' } });
        fIp = W.ip(''); fMask = W.ip(''); fGw = W.ip(''); fD1 = W.ip(''); fD2 = W.ip('');
        rIp = W.radios([['dhcp', '자동으로 IP 주소 받기(O)'], ['static', '다음 IP 주소 사용(S):']], work.dhcp ? 'dhcp' : 'static');
        rDns = W.radios([['auto', '자동으로 DNS 서버 주소 받기(B)'], ['manual', '다음 DNS 서버 주소 사용(E):']], work.dnsAuto ? 'auto' : 'manual');
        chkV = W.chk('끝낼 때 설정 유효성 검사(L)', false);
        const g1 = h('div', { class: 'grp7 enx-rgrp' }, h('span', { class: 'gt' }, rIp.els[1]), W.form([['IP 주소(I):', fIp], ['서브넷 마스크(U):', fMask], ['기본 게이트웨이(D):', fGw]], { cols: '150px auto' }));
        const g2 = h('div', { class: 'grp7 enx-rgrp' }, h('span', { class: 'gt' }, rDns.els[1]), W.form([['기본 설정 DNS 서버(P):', fD1], ['보조 DNS 서버(A):', fD2]], { cols: '150px auto' }));
        const tab = W.tabs([{ t: '일반', el: h('div', {}, W.label('네트워크가 IP 자동 설정 기능을 지원하면 IP 설정이 자동으로 할당되도록 할 수 있습니다. 지원하지 않으면, 네트워크 관리자에게 적절한 IP 설정값을 문의해야 합니다.'), W.row(rIp.els[0]), g1, W.row(rDns.els[0]), g2, h('div', { class: 'row7', style: { justifyContent: 'space-between' } }, chkV, W.btn('고급(V)...', () => advanced()))) }]);
        tabsEl.append(tab.el); b.style.display = 'flex'; b.style.flexDirection = 'column'; b.append(tab.el);
        load(work);
        rIp.onChange(sync); rDns.onChange(sync);
        // 서브넷 마스크가 비어 있으면 IP 클래스 기본 마스크를 채웁니다(Windows와 같은 동작).
        fIp.addEventListener('leave', () => { if (fIp.value && !fMask.value && IP.ok(fIp.value)) fMask.value = IP.classMask(fIp.value); });
        sync();
      },
      buttons: [{ t: '확인', def: true, on: () => { const r = collect(); if (r === false) return false; } }, { t: '취소', cancel: true }],
    });
    function load(w) {
      fIp.value = (w.addrs[0] || {}).ip || ''; fMask.value = (w.addrs[0] || {}).mask || ''; fGw.value = w.gws[0] || ''; fD1.value = w.dns[0] || ''; fD2.value = w.dns[1] || '';
    }
    function sync() {
      const st = rIp.value === 'static';
      if (st) { rDns.value = 'manual'; }
      rDns.setDisabled('auto', st);
      [fIp, fMask, fGw].forEach(f => f.setDisabled(!st));
      [fD1, fD2].forEach(f => f.setDisabled(rDns.value !== 'manual'));
    }
    function pull() {
      const w = SIMS.clone(work);
      w.dhcp = rIp.value === 'dhcp'; w.dnsAuto = rDns.value === 'auto';
      if (!w.dhcp) {
        const rest = w.addrs.slice(1), restG = w.gws.slice(1);
        w.addrs = fIp.value ? [{ ip: fIp.value, mask: fMask.value }].concat(rest) : rest;
        w.gws = (fGw.value ? [fGw.value] : []).concat(restG);
      }
      const restD = w.dns.slice(2);
      w.dns = w.dnsAuto ? [] : [fD1.value, fD2.value].filter(Boolean).concat(restD);
      return w;
    }
    async function collect() {
      const w = pull();
      if (!w.dhcp) {
        const a = w.addrs[0];
        if (!a || !IP.ok(a.ip)) { await W.msg(desk, { title: 'Microsoft TCP/IP', text: '올바른 IP 주소를 입력하십시오.', icon: 'error', owner: dlg }); return false; }
        if (!IP.maskOk(a.mask)) { await W.msg(desk, { title: 'Microsoft TCP/IP', text: '입력한 서브넷 마스크가 올바르지 않습니다.\n올바른 서브넷 마스크를 입력하십시오.', icon: 'error', owner: dlg }); return false; }
        if (IP.prefix(a.mask) < 31 && (a.ip === IP.net(a.ip, a.mask) || a.ip === IP.bcast(a.ip, a.mask))) {
          await W.msg(desk, { title: 'Microsoft TCP/IP', text: `이 IP 주소와 서브넷 마스크의 조합은 올바르지 않습니다.\nIP 주소 ${a.ip}은(는) ${a.ip === IP.net(a.ip, a.mask) ? '네트워크 주소(호스트 비트가 모두 0)' : '브로드캐스트 주소(호스트 비트가 모두 1)'}입니다.\n호스트에 사용할 수 있는 주소를 입력하십시오.`, icon: 'error', owner: dlg });
          return false;
        }
        if (w.gws[0] && IP.ok(w.gws[0]) && !IP.same(a.ip, w.gws[0], a.mask)) {
          const r = await W.msg(desk, { title: 'Microsoft TCP/IP', text: '기본 게이트웨이가 IP 주소와 서브넷 마스크로 정의된 같은 네트워크 세그먼트(서브넷)에 있지 않습니다.\n이 구성을 저장하시겠습니까?', icon: 'warn', owner: dlg, buttons: ['예(Y)', '아니요(N)'] });
          if (r !== '예(Y)') return false;
        }
      }
      done(w); dlg.close(true);
      return false;
    }
    function advanced() {
      const w = pull();
      advDialog(desk, dlg, w, nw => { Object.assign(work, nw); load(work); sync(); });
    }
    // 확인 버튼은 비동기 검사 후 직접 닫습니다.
    const ok = dlg.btn('확인'); const nok = ok.cloneNode(true); ok.replaceWith(nok); nok.addEventListener('click', () => collect());
    dlg.o.onEnter = () => collect();
    return dlg;
  }

  function advDialog(desk, owner, work, done) {
    const w = SIMS.clone(work);
    let Lip, Lgw, Ldns;
    const paint = () => {
      Lip.set(w.addrs.map((a, i) => ({ id: 'a' + i, cells: [a.ip, a.mask] })));
      Lgw.set(w.gws.map((x, i) => ({ id: 'g' + i, cells: [x, '자동'] })));
      Ldns.set(w.dns.map((x, i) => ({ id: 'd' + i, cells: [x] })));
    };
    const box = el => h('div', { style: { height: '96px', border: '1px solid #828790', background: '#fff', overflow: 'auto', flex: '1' } }, el);
    const idx = (L, p) => { const s = L.selected(); return s ? +s.id.slice(1) : -1; };
    function addrDlg(title, fields, cb, init = []) {
      const ins = fields.map((f, i) => W.ip(init[i] || ''));
      const d = W.dialog(desk, {
        title, w: 360, h: 170 + fields.length * 10, owner: advWin,
        render: b => { b.append(W.form(fields.map((f, i) => [f, ins[i]]), { cols: '120px auto' })); if (fields[0] === 'IP 주소(I):') ins[0].addEventListener('leave', () => { if (ins[0].value && !ins[1].value) ins[1].value = IP.classMask(ins[0].value); }); },
        buttons: [{ t: init.length ? '확인' : '추가(A)', def: true, on: () => { if (!ins.every(x => IP.ok(x.value))) { W.msg(desk, { title, text: '올바른 주소를 입력하십시오.', icon: 'error', owner: d }); return false; } cb(ins.map(x => x.value)); paint(); } }, { t: '취소', cancel: true }],
      });
    }
    const advWin = W.dialog(desk, {
      title: '고급 TCP/IP 설정', w: 420, h: 480, owner,
      render: b => {
        Lip = W.list({ cols: [{ t: 'IP 주소', w: 170 }, { t: '서브넷 마스크', w: 170 }] });
        Lgw = W.list({ cols: [{ t: '게이트웨이', w: 170 }, { t: '메트릭', w: 120 }] });
        Ldns = W.list({ cols: [{ t: '', w: 330 }] });
        const ipTab = h('div', {},
          W.group('IP 주소(R)', box(Lip.el), W.row(h('span', { style: { flex: 1 } }), W.btn('추가(A)...', () => addrDlg('TCP/IP 주소', ['IP 주소(I):', '서브넷 마스크(S):'], ([a, m]) => w.addrs.push({ ip: a, mask: m }))), W.btn('편집(E)...', () => { const i = idx(Lip); if (i >= 0) addrDlg('TCP/IP 주소', ['IP 주소(I):', '서브넷 마스크(S):'], ([a, m]) => (w.addrs[i] = { ip: a, mask: m }), [w.addrs[i].ip, w.addrs[i].mask]); }), W.btn('제거(V)', () => { const i = idx(Lip); if (i >= 0) { w.addrs.splice(i, 1); paint(); } }))),
          W.group('기본 게이트웨이(F):', box(Lgw.el), W.row(h('span', { style: { flex: 1 } }), W.btn('추가(D)...', () => addrDlg('TCP/IP 게이트웨이 주소', ['게이트웨이(G):'], ([x]) => w.gws.push(x))), W.btn('편집(T)...', () => { const i = idx(Lgw); if (i >= 0) addrDlg('TCP/IP 게이트웨이 주소', ['게이트웨이(G):'], ([x]) => (w.gws[i] = x), [w.gws[i]]); }), W.btn('제거(M)', () => { const i = idx(Lgw); if (i >= 0) { w.gws.splice(i, 1); paint(); } }))),
          W.row(W.chk('자동 메트릭(U)', true)), W.row(h('span', {}, '인터페이스 메트릭(N):'), W.text('', { w: 70, dis: true })));
        const dnsTab = h('div', {}, W.label('DNS 서버 주소(사용 순서)(N):', { cls: 'l' }), h('div', { style: { display: 'flex', gap: '6px' } }, box(Ldns.el), h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' } }, W.btn('↑', () => { const i = idx(Ldns); if (i > 0) { [w.dns[i - 1], w.dns[i]] = [w.dns[i], w.dns[i - 1]]; paint(); } }, { sm: true }), W.btn('↓', () => { const i = idx(Ldns); if (i >= 0 && i < w.dns.length - 1) { [w.dns[i + 1], w.dns[i]] = [w.dns[i], w.dns[i + 1]]; paint(); } }, { sm: true }))),
          W.row(h('span', { style: { flex: 1 } }), W.btn('추가(A)...', () => addrDlg('TCP/IP DNS 서버', ['DNS 서버(S):'], ([x]) => { w.dns.push(x); w.dnsAuto = false; })), W.btn('편집(E)...', () => { const i = idx(Ldns); if (i >= 0) addrDlg('TCP/IP DNS 서버', ['DNS 서버(S):'], ([x]) => (w.dns[i] = x), [w.dns[i]]); }), W.btn('제거(V)', () => { const i = idx(Ldns); if (i >= 0) { w.dns.splice(i, 1); paint(); } })),
          W.label('다음 세 설정은 TCP/IP를 사용하는 모든 연결에 적용됩니다. 정규화되지 않은 이름을 확인하려면:', { cls: 'hint7' }),
          W.row(W.radios([['p', '주 DNS 접미사 및 연결별 DNS 접미사 추가(P)'], ['s', '다음 DNS 접미사 추가(순서대로)(H):']], 'p').els[0]));
        const winsTab = h('div', {}, W.label('WINS 주소(사용 순서)(W):'), box(h('div')), W.label('이 연습 프로그램에서는 WINS 탭을 쓰지 않습니다.', { cls: 'muted7' }));
        const t = W.tabs([{ t: 'IP 설정', el: ipTab }, { t: 'DNS', el: dnsTab }, { t: 'WINS', el: winsTab }]);
        b.style.display = 'flex'; b.style.flexDirection = 'column'; b.append(t.el);
        if (w.dhcp) { Lip.set([{ id: 'x', cells: ['DHCP 사용', ''] }]); }
        paint();
      },
      buttons: [{ t: '확인', def: true, on: () => done(w) }, { t: '취소', cancel: true }],
    });
  }

  // 에뮬레이터 아이콘(img/emu/netetc)과 절대 위치 도우미
  const img = n => h('img', { src: `img/emu/netetc/${n}.png`, class: 'enx-ic', alt: '', draggable: 'false' });
  const at = (el, l, t, w, hh) => { el.classList.add('enx-abs'); Object.assign(el.style, { left: l + 'px', top: t + 'px' }, w ? { width: w + 'px' } : null, hh ? { height: hh + 'px' } : null); return el; };

  SIMS.def('tcpip', {
    title: '로컬 영역 연결 속성', labels: LABELS, blank, flat,
    mount(desk, q) {
      desk.el.classList.add('enx');
      const st = Object.assign(blank(), SIMS.clone((q && q.init) || {}));
      let work;
      function open() {
        work = SIMS.clone(st);
        let L;
        const items = ['Microsoft Networks용 클라이언트', 'QoS 패킷 스케줄러', 'Microsoft 네트워크용 파일 및 프린터 공유', 'Internet Protocol Version 6 (TCP/IP v6)', 'Internet Protocol Version 4 (TCP/IP v4)', 'Link-Layer Topology Discovery Mapper I/O Driver', 'Link-Layer Topology Discovery Responder'];
        const desc = ['네트워크의 리소스에 액세스할 수 있도록 합니다.', '흐름 속도 및 우선 순위 서비스를 포함한 네트워크 트래픽 제어를 제공합니다.', '다른 컴퓨터가 Microsoft 네트워크를 사용하여 이 컴퓨터의 리소스에 액세스할 수 있도록 합니다.', '다양하게 연결된 네트워크 간의 통신을 제공하는 최신 버전의 인터넷 프로토콜입니다.', '다양하게 연결된 네트워크 간의 통신을 제공하는 기본 WAN(Wide Area Network) 프로토콜입니다.', '네트워크의 다른 PC, 장치 및 인프라를 검색하고 찾는 데 사용됩니다.', '네트워크에서 이 PC를 검색하고 찾을 수 있도록 합니다.'];
        const ICO = ['client', 'service', 'service', 'protocol', 'protocol', 'protocol', 'protocol'];
        let propBtn, descEl;
        // 에뮬레이터(pcNetworkC)와 같은 461×477 창, 탭 안 부품은 잰 좌표에 그대로 놓습니다.
        const main = W.dialog(desk, {
          title: '로컬 영역 연결 속성', w: 461, h: 477, bodyClass: 'dlg-body enx-net',
          render: b => {
            descEl = h('div', { class: 'tx' }, '설명');
            L = W.list({
              cols: [{ t: '', w: 386 }], rows: items.map((t, i) => ({ id: 'i' + i, cells: [h('span', {}, h('input', { type: 'checkbox', checked: true }), img(ICO[i]), t)] })),
              onSelect: r => { const i = +r.id.slice(1); propBtn.disabled = !(i === 3 || i === 4); descEl.textContent = desc[i]; },
              onDbl: r => { if (r.id === 'i4') openV4(); },
            });
            L.el.querySelector('thead').style.display = 'none';
            propBtn = W.btn('속성(R)', () => { const s = L.selected(); if (!s) return; if (s.id === 'i3') W.msg(desk, { title: '알림', text: '이 연습 프로그램에서는 IPv4 설정만 연습합니다.', icon: 'info', owner: main }); else openV4(); }, { dis: true });
            const btn3 = (el, l) => { el.classList.add('enx-wide'); return at(el, l, 245, 124, 21); };
            const pane = h('div', { style: { position: 'relative', height: '100%' } },
              at(h('div', { class: 'enx-lbl' }, '연결에 사용할 장치:'), 21, 15),
              at(h('div', { class: 'enx-dev' }, img('netadapter'), 'Realtek PCIs FE Family Controller'), 21, 36, 389, 24),
              at(W.btn('구성(C)...', null, { dis: true }), 314, 67, 95, 21),
              at(h('div', { class: 'enx-lbl' }, '이 연결에 다음 항목 사용(O):'), 21, 89),
              at(h('div', { class: 'enx-items' }, L.el), 21, 107, 389, 130),
              btn3(W.btn('설치(N)...', null), 22), btn3(W.btn('제거(U)', null, { dis: true }), 153), btn3(propBtn, 285),
              at(h('div', { class: 'enx-desc' }, h('span', { class: 'gt' }, '설명'), descEl), 21, 291, 389, 66));
            const t = W.tabs([{ t: '네트워킹', el: pane }]);
            b.append(t.el);
          },
          buttons: [{ t: '확인', def: true, on: () => { Object.assign(st, SIMS.clone(work)); } }, { t: '취소', cancel: true }],
          onCancelled: () => SIMS.closed(desk, open, '로컬 영역 연결 속성'),
        });
        const ok = main.btn('확인'); ok.addEventListener('click', () => setTimeout(() => SIMS.closed(desk, open, '로컬 영역 연결 속성'), 0));
        function openV4() { ipv4Dialog(desk, main, work, w => { work = w; }); }
        return main;
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
