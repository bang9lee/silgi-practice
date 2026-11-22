/* 가상 화면: DNS 관리자 — 새 영역 마법사(정방향·역방향), 새 호스트(A), 새 별칭(CNAME), 새 MX, 새 포인터(PTR), 영역 속성(SOA, 영역 전송, 동적 업데이트)
 * 채점 키 (영역 이름은 소문자):
 *   zone|<영역>|exists, zone|<영역>|type(primary/secondary/stub), zone|<영역>|dyn(none/nonsecure), zone|<영역>|file
 *   rec|<영역>|<이름>|<A/CNAME/MX/PTR/AAAA> = 데이터 (부모 도메인과 같으면 이름 @), rec|<영역>|<이름>|MX|prio
 *   soa|<영역>|serial / primary / resp / refresh / retry / expire / minttl  (시간 값은 "15 분"처럼 숫자 + 단위)
 *   xfer|<영역>|allow, xfer|<영역>|mode(any/ns/list), xfer|<영역>|list[] */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W; const IP = SIMS.IP;
  const UNITS = ['초', '분', '시간', '일'];
  const low = s => String(s || '').trim().replace(/\.$/, '').toLowerCase();
  const tv = x => `${x.v} ${x.u}`;
  const blank = () => ({ zones: [] });

  // ICQA 에뮬레이터 화면에서 잘라 온 아이콘(img/emu/dhcpdns) — 공용 아이콘 표(ICONS)에 dd 접두어로 더합니다.
  const E = 'img/emu/dhcpdns/';
  const img = (n, w = 16, hh = 16) => `<img src="${E}${n}.png" width="${w}" height="${hh}" alt="" draggable="false">`;
  Object.assign(g.ICONS, { ddDns: img('dns'), ddServer: img('server'), ddFolder: img('folder'), ddTitleDns: img('title-dns') });
  // 에뮬레이터 모양 입히기: 창 틀·글꼴(emu-dhcpdns.css), 트리 +/− 단추 그림
  const skin = (M, cls) => {
    M.win.el.classList.add('emu-dd', cls);
    const mark = () => M.tree.el.querySelectorAll('.tg').forEach(t => t.classList.toggle('dd-open', t.textContent === '−'));
    new MutationObserver(mark).observe(M.tree.el, { childList: true });
    mark();
  };
  const toolbar = () => h('span', { class: 'dd-tbar', title: '콘솔 트리 표시/숨기기' }, h('img', { src: E + 'tbar.png', width: 32, height: 25, alt: '', draggable: 'false' }));
  const newZone = (name, rev, type, file, dyn) => ({ name, reverse: rev, type, file, dyn, records: [], soa: { serial: 1, primary: 'icqaserver.', resp: 'hostmaster.', refresh: { v: 15, u: '분' }, retry: { v: 10, u: '분' }, expire: { v: 1, u: '일' }, minttl: { v: 1, u: '시간' } }, xfer: { allow: false, mode: 'ns', list: [] }, masters: [] });

  function flat(st) {
    const o = { zones: st.zones.map(z => low(z.name)) };
    st.zones.forEach(z => {
      const n = low(z.name);
      Object.assign(o, { [`zone|${n}|exists`]: true, [`zone|${n}|type`]: z.type, [`zone|${n}|dyn`]: z.dyn, [`zone|${n}|file`]: z.file });
      z.records.forEach(r => { const rn = r.name ? low(r.name) : '@'; o[`rec|${n}|${rn}|${r.type}`] = r.type === 'A' || r.type === 'AAAA' ? r.data : low(r.data); if (r.type === 'MX') o[`rec|${n}|${rn}|MX|prio`] = r.prio; });
      const s = z.soa;
      Object.assign(o, { [`soa|${n}|serial`]: s.serial, [`soa|${n}|primary`]: low(s.primary), [`soa|${n}|resp`]: low(s.resp), [`soa|${n}|refresh`]: tv(s.refresh), [`soa|${n}|retry`]: tv(s.retry), [`soa|${n}|expire`]: tv(s.expire), [`soa|${n}|minttl`]: tv(s.minttl) });
      Object.assign(o, { [`xfer|${n}|allow`]: z.xfer.allow, [`xfer|${n}|mode`]: z.xfer.mode, [`xfer|${n}|list`]: z.xfer.list.slice() });
    });
    return o;
  }
  function label(k) {
    const p = String(k).split('|');
    const SOA = { serial: '일련 번호', primary: '주 서버', resp: '책임자', refresh: '새로 고침 간격', retry: '다시 시도 간격', expire: '다음 날짜 이후 만료', minttl: '최소(기본값) TTL' };
    if (p[0] === 'zone') return `${p[1]} 영역 ${({ exists: '만들기', type: '형식', dyn: '동적 업데이트', file: '영역 파일' })[p[2]]}`;
    if (p[0] === 'rec') return `${p[1]} 영역의 ${p[2] === '@' ? '(부모 폴더와 같음)' : p[2]} ${p[3]} 레코드${p[4] ? ' 우선 순위' : ''}`;
    if (p[0] === 'soa') return `${p[1]} SOA: ${SOA[p[2]] || p[2]}`;
    if (p[0] === 'xfer') return `${p[1]} 영역 전송: ${({ allow: '허용', mode: '대상', list: '서버 목록' })[p[2]]}`;
    return k;
  }

  SIMS.def('dns', {
    title: 'DNS 관리자', label, blank, flat,
    mount(desk, q) {
      const st = Object.assign(blank(), SIMS.clone((q && q.init) || {}));
      st.zones = st.zones.map(z => Object.assign(newZone(z.name, !!z.reverse, z.type || 'primary', z.file || z.name + '.dns', z.dyn || 'none'), z));
      let M;
      const zid = z => 'z:' + st.zones.indexOf(z);
      const zoneOf = id => st.zones[+String(id).split(':')[1]];
      const nodes = () => [{ id: 'dns', label: 'DNS', icon: 'ddDns', kids: () => [{ id: 'srv', label: 'ICQAServer', icon: 'ddServer', kids: () => [
        { id: 'fwd', label: '정방향 조회 영역', icon: 'ddFolder', kids: () => st.zones.filter(z => !z.reverse).map(z => ({ id: zid(z), label: z.name, icon: 'zone' })) },
        { id: 'rev', label: '역방향 조회 영역', icon: 'ddFolder', kids: () => st.zones.filter(z => z.reverse).map(z => ({ id: zid(z), label: z.name, icon: 'zone' })) },
        { id: 'cf', label: '조건부 전달자', icon: 'ddFolder' }] }] }];
      const fqdn = (z, n) => (n ? `${n}.${z.name}` : z.name);
      function menu(n) {
        if (n.id === 'fwd' || n.id === 'rev') return [{ t: '새 영역(Z)...', on: () => zoneWizard(n.id === 'rev') }, '-', { t: '새로 고침(F)', on: () => M.refresh() }];
        if (String(n.id).startsWith('z:')) {
          const z = zoneOf(n.id);
          const common = ['-', { t: '삭제(D)', on: () => W.msg(desk, { title: 'DNS', text: `${z.name} 영역을 삭제하시겠습니까?`, icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win }).then(r => { if (r === '예(Y)') { st.zones.splice(st.zones.indexOf(z), 1); M.tree.sel = z.reverse ? 'rev' : 'fwd'; M.refresh(); } }) }, { t: '새로 고침(F)', on: () => M.refresh() }, '-', { t: '속성(R)', on: () => zoneProps(z) }];
          if (z.reverse) return [{ t: '새 포인터(PTR)(P)...', on: () => ptrDlg(z) }, { t: '새 별칭(CNAME)(A)...', on: () => cnameDlg(z) }, { t: '기타 새 레코드(C)...', on: () => otherDlg(z) }].concat(common);
          return [{ t: '영역 데이터 파일 업데이트(U)', dis: true }, { t: '서버 데이터 다시 로드(E)', dis: true }, '-', { t: '새 호스트(A 또는 AAAA)(S)...', on: () => hostDlg(z) }, { t: '새 별칭(CNAME)(A)...', on: () => cnameDlg(z) }, { t: '새 MX(메일 교환기)(M)...', on: () => mxDlg(z) }, { t: '새 도메인(O)...', dis: true }, { t: '새 위임(G)...', dis: true }, { t: '기타 새 레코드(C)...', on: () => otherDlg(z) }].concat(common);
        }
        return [{ t: '새로 고침(F)', on: () => M.refresh() }];
      }
      const TYPE_T = { SOA: '권한 시작(SOA)', NS: '이름 서버(NS)', A: '호스트(A)', AAAA: 'IPv6 호스트(AAAA)', CNAME: '별칭(CNAME)', MX: '메일 교환기(MX)', PTR: '포인터(PTR)' };
      function render(n, el) {
        if (n.id === 'fwd' || n.id === 'rev') {
          const zs = st.zones.filter(z => z.reverse === (n.id === 'rev'));
          if (!zs.length) { el.append(h('div', { class: 'dd-info' }, h('div', { class: 'dd-info-h' }, h('img', { src: E + 'info.png', width: 32, height: 32, alt: '', draggable: 'false' }), h('b', {}, '새 영역 추가')), h('p', {}, 'DNS(Domain Name System)가 DNS 네임스페이스를 영역으로 분할하도록 허용합니다.'), h('p', {}, '각 영역에 하나 이상의 인접 DNS 도메인에 대한 정보를 저장합니다.'), h('p', {}, '새 영역을 추가하려면 [동작] 메뉴에서 [새 영역]을 클릭하십시오.'))); el.addEventListener('contextmenu', e => { e.preventDefault(); M.ctx(menu(n), e); }); return; }
          el.append(W.list({ cols: [{ t: '이름', w: 230 }, { t: '형식', w: 140 }, { t: '상태', w: 90 }], rows: zs.map(z => ({ id: zid(z), cells: [z.name, ({ primary: '표준 주 영역', secondary: '표준 보조 영역', stub: '스텁 영역' })[z.type], '실행 중'], icon: 'zone' })), onDbl: r => M.select(r.id), onContext: (r, e) => M.ctx(menu({ id: r.id }), e), onBlank: e => M.ctx(menu(n), e) }).el);
          return;
        }
        if (String(n.id).startsWith('z:')) {
          const z = zoneOf(n.id);
          const rows = [{ id: 'soa', cells: ['(부모 폴더와 같음)', TYPE_T.SOA, `[${z.soa.serial}], ${z.soa.primary}, ${z.soa.resp}`, '고정'] }, { id: 'ns', cells: ['(부모 폴더와 같음)', TYPE_T.NS, 'icqaserver.', '고정'] }]
            .concat(z.records.map((r, i) => ({ id: 'r' + i, cells: [r.name || '(부모 폴더와 같음)', TYPE_T[r.type] || r.type, r.type === 'MX' ? `[${r.prio}]  ${r.data}` : r.data, '고정'], icon: 'record' })));
          rows.slice(0, 2).forEach(r => (r.icon = 'record'));
          el.append(W.list({ cols: [{ t: '이름', w: 170 }, { t: '종류', w: 150 }, { t: '데이터', w: 280 }, { t: '타임스탬프', w: 80 }], rows,
            onDbl: r => { if (r.id === 'soa' || r.id === 'ns') zoneProps(z, r.id === 'soa' ? 1 : 2); else recEdit(z, +r.id.slice(1)); },
            onContext: (r, e) => { if (r.id === 'soa' || r.id === 'ns') M.ctx([{ t: '속성(R)', on: () => zoneProps(z, r.id === 'soa' ? 1 : 2) }], e); else M.ctx([{ t: '삭제(D)', on: () => { z.records.splice(+r.id.slice(1), 1); M.refresh(); } }, '-', { t: '속성(R)', on: () => recEdit(z, +r.id.slice(1)) }], e); },
            onBlank: e => M.ctx(menu(n), e) }).el);
          return;
        }
        if (n.id === 'srv') el.append(W.list({ cols: [{ t: '이름', w: 220 }], rows: [{ id: 'fwd', cells: ['정방향 조회 영역'], icon: 'ddFolder' }, { id: 'rev', cells: ['역방향 조회 영역'], icon: 'ddFolder' }, { id: 'cf', cells: ['조건부 전달자'], icon: 'ddFolder' }], onDbl: r => M.select(r.id) }).el);
      }
      // ───────── 새 영역 마법사 ─────────
      function zoneWizard(rev) {
        const c = { type: 'primary', rev, name: '', file: '', dyn: 'none', masters: [] };
        let rT, fName, rV, fNet, fRevName, rNet, rFile, fFile, fExist, rDyn, mIp, mL;
        const P = [
          { welcome: { title: '새 영역 마법사 시작', text: ['이 마법사를 사용하면 DNS 서버에 대한 새 영역을 만들 수 있습니다.', '영역은 DNS 이름을 IP 주소와 같은 관련 데이터로 변환하여 네트워크 서비스를 사용할 수 있도록 합니다.', '계속하려면 [다음]을 클릭하십시오.'] } },
          { head: '영역 형식', sub: 'DNS 서버는 다양한 형식의 영역과 저장소를 지원합니다.', render: el => {
            rT = W.radios([['primary', '주 영역(P)'], ['secondary', '보조 영역(S)'], ['stub', '스텁 영역(U)']], 'primary');
            el.append(W.label('만들 영역의 형식을 선택하십시오.'), W.row(rT.els[0]), W.label('직접 업데이트할 수 있는 서버에 영역의 복사본을 만듭니다.', { cls: 'muted7' }), W.row(rT.els[1]), W.label('다른 서버에 있는 영역의 복사본을 만듭니다. 이 옵션은 주 서버의 처리 부하를 분산하고 내결함성을 제공합니다.', { cls: 'muted7' }), W.row(rT.els[2]), W.label('NS(이름 서버), SOA(권한 시작) 및 GLUE 호스트(A) 레코드만 포함하는 영역의 복사본을 만듭니다.', { cls: 'muted7' }), W.row(W.chk('Active Directory에 영역 저장(DNS 서버가 쓰기 가능한 도메인 컨트롤러인 경우에만 사용 가능)(A)', false, { dis: true })));
          }, next: () => { c.type = rT.value; return rev ? 'skip:3' : 'skip:2'; } },
          { head: '영역 이름', sub: '새 영역의 이름은 무엇입니까?', render: el => { fName = W.text(''); el.append(W.label('영역 이름은 이 DNS 서버가 신뢰할 수 있는 DNS 네임스페이스 부분을 지정합니다. 조직의 도메인 이름(예: microsoft.com)이나 도메인 이름의 일부분(예: newzone.microsoft.com)일 수 있습니다. 영역 이름은 DNS 서버 이름이 아닙니다.'), W.label('영역 이름(Z):', { cls: 'l' }), fName); },
            next: () => { const n = fName.value.trim().replace(/\.$/, ''); if (!n || !/^[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(n)) return '올바른 영역 이름을 입력하십시오. (예: icqa.or.kr)'; if (st.zones.some(z => low(z.name) === low(n))) return '같은 이름의 영역이 이미 있습니다.'; c.name = n; return c.type === 'primary' ? 'skip:5' : 'skip:7'; } },
          { head: '역방향 조회 영역 이름', sub: '역방향 조회 영역은 IP 주소를 DNS 이름으로 변환합니다.', render: el => {
            rV = W.radios([['v4', 'IPv4 역방향 조회 영역(4)'], ['v6', 'IPv6 역방향 조회 영역(6)']], 'v4');
            el.append(W.label('IPv4 주소에 대한 역방향 조회 영역을 만들지, 아니면 IPv6 주소에 대한 역방향 조회 영역을 만들지 선택하십시오.'), W.row(rV.els[0]), W.row(rV.els[1]));
          }, next: () => (rV.value === 'v6' ? '이 연습 프로그램에서는 IPv4 역방향 조회 영역만 만듭니다.' : true) },
          { head: '역방향 조회 영역 이름', sub: '역방향 조회 영역은 IP 주소를 DNS 이름으로 변환합니다.', render: el => {
            rNet = W.radios([['id', '네트워크 ID(E):'], ['name', '역방향 조회 영역 이름(V):']], 'id');
            fNet = h('span', { class: 'ip7' }, ...[0, 1, 2].flatMap(i => [h('input', { maxlength: 3, style: { width: '34px' }, oninput: e => { e.target.value = e.target.value.replace(/\D/g, ''); upd(); } }), i < 2 ? h('i', {}, '.') : null]).filter(Boolean));
            fRevName = W.text('', { ro: true });
            const upd = () => { const v = [...fNet.querySelectorAll('input')].map(x => x.value).filter(Boolean); fRevName.value = v.length ? v.slice().reverse().join('.') + '.in-addr.arpa' : ''; };
            rNet.onChange(() => { fRevName.readOnly = rNet.value !== 'name'; });
            el.append(W.label('역방향 조회 영역을 식별하려면 네트워크 ID 또는 영역 이름을 입력하십시오.'), W.row(rNet.els[0]), h('div', { style: { paddingLeft: '20px' } }, fNet), W.label('네트워크 ID는 이 영역에 속하는 IP 주소의 부분입니다. 네트워크 ID를 일반(역방향이 아닌) 순서로 입력하십시오.', { cls: 'muted7' }), W.row(rNet.els[1]), h('div', { style: { paddingLeft: '20px' } }, fRevName));
          }, next: () => { const n = fRevName.value.trim(); if (!/^(\d{1,3}\.){1,3}in-addr\.arpa$/i.test(n)) return '네트워크 ID를 입력하십시오. (예: 192.168.100)'; if (st.zones.some(z => low(z.name) === low(n))) return '같은 이름의 영역이 이미 있습니다.'; c.name = n; return c.type === 'primary' ? true : 'skip:7'; } },
          { head: '영역 파일', sub: '새 영역 파일을 만들거나 다른 DNS 서버에서 복사한 기존 파일을 사용할 수 있습니다.', render: el => {
            rFile = W.radios([['new', '다음 이름으로 새 파일 만들기(C):'], ['exist', '기존 파일 사용(U):']], 'new'); fFile = W.text(c.name ? c.name + '.dns' : ''); fExist = W.text('', { dis: true });
            rFile.onChange(() => { fFile.disabled = rFile.value !== 'new'; fExist.disabled = rFile.value === 'new'; });
            el.append(W.label('새 영역 파일을 만들지, 아니면 다른 DNS 서버에서 복사한 기존 파일을 사용할지 선택하십시오.'), W.row(rFile.els[0]), h('div', { style: { paddingLeft: '20px' } }, fFile), W.row(rFile.els[1]), h('div', { style: { paddingLeft: '20px' } }, fExist), W.label('기존 파일을 사용하려면 먼저 이 서버의 %SystemRoot%\\system32\\dns 폴더에 복사해야 합니다.', { cls: 'muted7' }));
          }, refresh: () => { if (rFile.value === 'new') fFile.value = c.name + '.dns'; }, next: () => { c.file = rFile.value === 'new' ? fFile.value.trim() : fExist.value.trim(); if (!c.file) return '영역 파일 이름을 입력하십시오.'; return true; } },
          { head: '동적 업데이트', sub: '이 DNS 영역이 보안, 비보안 또는 동적 업데이트를 받지 않도록 지정할 수 있습니다.', render: el => {
            rDyn = W.radios([['secure', '보안 동적 업데이트만 허용(Active Directory용으로 권장)(S)'], ['nonsecure', '보안 및 비보안 동적 업데이트 모두 허용(A)'], ['none', '동적 업데이트 허용 안 함(D)']], 'none');
            rDyn.setDisabled('secure', true);
            el.append(W.label('동적 업데이트를 사용하면 DNS 클라이언트 컴퓨터가 변경될 때마다 리소스 레코드를 DNS 서버에 등록하고 동적으로 업데이트할 수 있습니다.'), W.label('허용할 동적 업데이트 형식을 선택하십시오.'), W.row(rDyn.els[0]), W.row(rDyn.els[1]), W.label('이 옵션은 보안상 취약하므로 신뢰할 수 있는 원본에서만 업데이트를 받도록 하는 것이 좋습니다.', { cls: 'muted7' }), W.row(rDyn.els[2]), W.label('이 영역에서 동적 업데이트를 받을 수 없습니다. 이 영역의 레코드를 직접 업데이트해야 합니다.', { cls: 'muted7' }));
          }, next: () => { c.dyn = rDyn.value; return 'skip:8'; } },
          { head: '마스터 DNS 서버', sub: '영역을 복사할 DNS 서버를 지정하십시오.', render: el => {
            mIp = W.ip(''); mL = W.list({ cols: [{ t: 'IP 주소', w: 160 }, { t: '서버 FQDN', w: 160 }, { t: '확인됨', w: 70 }] });
            const paint = () => mL.set(c.masters.map((x, i) => ({ id: 'm' + i, cells: [x, '', '확인'] })));
            el.append(W.label('영역을 복사할 서버는 나열된 순서대로 연결됩니다.'), W.label('마스터 서버(M):', { cls: 'l' }), W.row(mIp, W.btn('추가', () => { if (IP.ok(mIp.value)) { c.masters.push(mIp.value); mIp.value = ''; paint(); } })), h('div', { style: { height: '100px', border: '1px solid #828790', background: '#fff' } }, mL.el));
          }, next: () => { if (!c.masters.length) return '마스터 서버의 IP 주소를 하나 이상 입력하십시오.'; c.file = c.name + '.dns'; return true; } },
          { final: { title: '새 영역 마법사 완료', text: ['새 영역 마법사를 완료했습니다. 다음 설정을 지정했습니다.'] }, render: el => { el.append(h('div', { class: 'q-box', style: { background: '#f7f7f7', border: '1px solid #ccc', padding: '8px', whiteSpace: 'pre-wrap' } }, `이름: ${c.name}\n형식: ${({ primary: '표준 주', secondary: '표준 보조', stub: '스텁' })[c.type]}\n조회 형식: ${rev ? '역방향' : '정방향'}\n파일 이름: ${c.file}`), h('p', {}, '마법사를 닫고 새 영역을 만들려면 [마침]을 클릭하십시오.')); } },
        ];
        W.wizard(desk, { title: '새 영역 마법사', owner: M.win, w: 540, h: 470, icon: 'dns', ctx: c, pages: P, onFinish: () => {
          const z = newZone(c.name, rev, c.type, c.file, c.dyn); z.masters = c.masters;
          st.zones.push(z); M.tree.open.add(rev ? 'rev' : 'fwd'); M.refresh(); M.select(zid(z));
        } });
      }
      // ───────── 레코드 대화 상자 ─────────
      function addRec(z, r) {
        const same = z.records.find(x => low(x.name) === low(r.name) && x.type === r.type && (r.type !== 'A' || x.data === r.data));
        if (same && r.type === 'CNAME') return '같은 이름의 별칭(CNAME) 레코드가 이미 있습니다.';
        if (r.type === 'CNAME' && z.records.some(x => low(x.name) === low(r.name) && x.type !== 'CNAME')) return `같은 이름(${r.name})의 다른 레코드가 있어서 별칭(CNAME)을 만들 수 없습니다.`;
        if (same) return '같은 레코드가 이미 있습니다.';
        z.records.push(r); M.refresh(); return null;
      }
      function hostDlg(z) {
        let fN, fF, fI, cP, done = false;
        const dlg = W.dialog(desk, { title: '새 호스트', w: 400, h: 330, owner: M.win,
          render: el => { fN = W.text(''); fF = W.text(z.name + '.', { ro: true }); fI = W.ip(''); cP = W.chk('연결된 PTR(포인터) 레코드 만들기(C)', false);
            fN.addEventListener('input', () => (fF.value = fqdn(z, fN.value.trim()) + '.'));
            el.append(W.label('이름(입력하지 않으면 부모 도메인 이름 사용)(N):', { cls: 'l' }), fN, W.label('FQDN(정규화된 도메인 이름)(F):', { cls: 'l' }), fF, W.label('IP 주소(P):', { cls: 'l' }), fI, h('div', { style: { height: '8px' } }), W.row(cP), W.row(W.chk('같은 소유자 이름으로 인증된 사용자가 DNS 레코드를 업데이트하도록 허용(O)', false, { dis: true }))); },
          buttons: [{ t: '호스트 추가(H)', def: true, on: () => {
            const name = fN.value.trim(), ip = fI.value;
            if (!IP.ok(ip)) { W.msg(desk, { title: 'DNS', text: '올바른 IP 주소를 입력하십시오.', icon: 'error' }); return false; }
            const err = addRec(z, { name, type: 'A', data: ip });
            if (err) { W.msg(desk, { title: 'DNS', text: err, icon: 'error' }); return false; }
            if (cP.checked) {
              const rz = st.zones.find(x => x.reverse && ip.startsWith(x.name.replace(/\.in-addr\.arpa$/i, '').split('.').reverse().join('.') + '.'));
              if (rz) { const host = ip.split('.').slice(rz.name.split('.').length - 2).reverse().join('.'); rz.records.push({ name: host, type: 'PTR', data: fqdn(z, name) }); }
              else W.msg(desk, { title: 'DNS', text: '연결된 PTR 레코드를 만들 수 없습니다. 이 IP 주소에 맞는 역방향 조회 영역이 없습니다.', icon: 'warn' });
            }
            W.msg(desk, { title: 'DNS', text: `호스트 레코드 ${fqdn(z, name)}을(를) 만들었습니다.`, icon: 'info' });
            fN.value = ''; fI.value = ''; fF.value = z.name + '.'; done = true; dlg.btn('취소').textContent = '완료'; return false;
          } }, { t: '취소', cancel: true }] });
      }
      function cnameDlg(z, idx) {
        const r0 = idx != null ? z.records[idx] : { name: '', data: '' };
        let fN, fF, fT;
        W.dialog(desk, { title: idx != null ? '별칭(CNAME) 속성' : '새 리소스 레코드', w: 410, h: 320, owner: M.win,
          render: el => { fN = W.text(r0.name, { ro: idx != null }); fF = W.text(fqdn(z, r0.name) + '.', { ro: true }); fT = W.text(r0.data);
            fN.addEventListener('input', () => (fF.value = fqdn(z, fN.value.trim()) + '.'));
            el.append(W.tabs([{ t: '별칭(CNAME)', el: h('div', {}, W.label('별칭 이름(부모 도메인을 사용할 경우 비워 둠)(S):', { cls: 'l' }), fN, W.label('FQDN(정규화된 도메인 이름)(U):', { cls: 'l' }), fF, W.label('대상 호스트의 FQDN(정규화된 도메인 이름)(F):', { cls: 'l' }), W.row(fT, W.btn('찾아보기(B)...', null, { dis: true }))) }]).el); el.style.display = 'flex'; el.style.flexDirection = 'column'; },
          buttons: [{ t: '확인', def: true, on: () => {
            const name = fN.value.trim(), data = fT.value.trim();
            if (!data) { W.msg(desk, { title: 'DNS', text: '대상 호스트의 FQDN을 입력하십시오.', icon: 'error' }); return false; }
            if (idx != null) { z.records[idx].data = data; M.refresh(); return; }
            const err = addRec(z, { name, type: 'CNAME', data }); if (err) { W.msg(desk, { title: 'DNS', text: err, icon: 'error' }); return false; }
          } }, { t: '취소', cancel: true }] });
      }
      function mxDlg(z, idx) {
        const r0 = idx != null ? z.records[idx] : { name: '', data: '', prio: 10 };
        let fN, fF, fT, fP;
        W.dialog(desk, { title: idx != null ? '메일 교환기(MX) 속성' : '새 리소스 레코드', w: 410, h: 350, owner: M.win,
          render: el => { fN = W.text(r0.name, { ro: idx != null }); fF = W.text(fqdn(z, r0.name) + '.', { ro: true }); fT = W.text(r0.data); fP = W.text(String(r0.prio), { w: 60 });
            fN.addEventListener('input', () => (fF.value = fqdn(z, fN.value.trim()) + '.'));
            el.append(W.tabs([{ t: '메일 교환기(MX)', el: h('div', {}, W.label('호스트 또는 자식 도메인(H):', { cls: 'l' }), fN, W.label('기본적으로 메일 교환기 레코드를 만들 때 DNS는 부모 도메인 이름을 사용합니다. 호스트 또는 자식 이름을 지정할 수 있지만 대부분의 배포에서 위 필드는 비워 둡니다.', { cls: 'muted7' }), W.label('FQDN(정규화된 도메인 이름)(U):', { cls: 'l' }), fF, W.label('메일 서버의 FQDN(정규화된 도메인 이름)(F):', { cls: 'l' }), W.row(fT, W.btn('찾아보기(B)...', null, { dis: true })), W.label('메일 서버 우선 순위(S):', { cls: 'l' }), fP) }]).el); el.style.display = 'flex'; el.style.flexDirection = 'column'; },
          buttons: [{ t: '확인', def: true, on: () => {
            const data = fT.value.trim(), prio = +fP.value;
            if (!data) { W.msg(desk, { title: 'DNS', text: '메일 서버의 FQDN을 입력하십시오.', icon: 'error' }); return false; }
            if (!(prio >= 0 && prio <= 65535)) { W.msg(desk, { title: 'DNS', text: '우선 순위는 0~65535 사이의 숫자입니다.', icon: 'error' }); return false; }
            if (idx != null) { Object.assign(z.records[idx], { data, prio }); M.refresh(); return; }
            const err = addRec(z, { name: fN.value.trim(), type: 'MX', data, prio }); if (err) { W.msg(desk, { title: 'DNS', text: err, icon: 'error' }); return false; }
          } }, { t: '취소', cancel: true }] });
      }
      function ptrDlg(z, idx) {
        const prefix = z.name.replace(/\.in-addr\.arpa$/i, '').split('.').reverse().join('.');
        const r0 = idx != null ? z.records[idx] : { name: '', data: '' };
        let fI, fT;
        W.dialog(desk, { title: idx != null ? '포인터(PTR) 속성' : '새 리소스 레코드', w: 410, h: 300, owner: M.win,
          render: el => { fI = W.text(prefix + '.' + (r0.name ? r0.name.split('.').reverse().join('.') : ''), { ro: idx != null }); fT = W.text(r0.data);
            el.append(W.tabs([{ t: '포인터(PTR)', el: h('div', {}, W.label('호스트 IP 주소(P):', { cls: 'l' }), fI, W.label('호스트 이름(H):', { cls: 'l' }), W.row(fT, W.btn('찾아보기(B)...', null, { dis: true }))) }]).el); el.style.display = 'flex'; el.style.flexDirection = 'column'; },
          buttons: [{ t: '확인', def: true, on: () => {
            const ip = fI.value.trim(), data = fT.value.trim();
            if (!IP.ok(ip) || !ip.startsWith(prefix + '.')) { W.msg(desk, { title: 'DNS', text: `이 영역에 맞는 호스트 IP 주소를 입력하십시오. (${prefix}.x)`, icon: 'error' }); return false; }
            if (!data) { W.msg(desk, { title: 'DNS', text: '호스트 이름을 입력하십시오.', icon: 'error' }); return false; }
            if (idx != null) { z.records[idx].data = data; M.refresh(); return; }
            const host = ip.slice(prefix.length + 1).split('.').reverse().join('.');
            const err = addRec(z, { name: host, type: 'PTR', data }); if (err) { W.msg(desk, { title: 'DNS', text: err, icon: 'error' }); return false; }
          } }, { t: '취소', cancel: true }] });
      }
      function otherDlg(z) {
        let L;
        W.dialog(desk, { title: '리소스 레코드 종류', w: 360, h: 320, owner: M.win,
          render: el => { L = W.list({ cols: [{ t: '리소스 레코드 종류 선택(S):', w: 300 }], rows: [['AAAA', 'IPv6 호스트(AAAA)'], ['CNAME', '별칭(CNAME)'], ['MX', '메일 교환기(MX)'], ['PTR', '포인터(PTR)'], ['SRV', '서비스 위치(SRV)'], ['TXT', '텍스트(TXT)']].map(([id, t]) => ({ id, cells: [t] })) }); el.append(h('div', { style: { height: '170px', border: '1px solid #828790', background: '#fff' } }, L.el)); },
          buttons: [{ t: '레코드 만들기(C)...', def: true, on: () => { const s = L.selected(); if (!s) return false; if (s.id === 'CNAME') cnameDlg(z); else if (s.id === 'MX') mxDlg(z); else if (s.id === 'PTR') { if (z.reverse) ptrDlg(z); else W.msg(desk, { title: 'DNS', text: '포인터(PTR) 레코드는 역방향 조회 영역에서 만드세요.', icon: 'info' }); } else W.msg(desk, { title: 'DNS', text: '이 연습 프로그램에서는 이 레코드 종류를 다루지 않습니다.', icon: 'info' }); } }, { t: '완료', cancel: true }] });
      }
      function recEdit(z, i) { const r = z.records[i]; if (r.type === 'CNAME') cnameDlg(z, i); else if (r.type === 'MX') mxDlg(z, i); else if (r.type === 'PTR') ptrDlg(z, i); else hostEdit(z, i); }
      function hostEdit(z, i) {
        const r = z.records[i]; let fI;
        W.dialog(desk, { title: `${r.name || '(부모 폴더와 같음)'} 속성`, w: 380, h: 240, owner: M.win, render: el => { fI = W.ip(r.data); el.append(W.tabs([{ t: '호스트(A)', el: h('div', {}, W.label('호스트(부모 도메인을 사용할 경우 비워 둠)(H):', { cls: 'l' }), W.text(r.name, { ro: true }), W.label('IP 주소(P):', { cls: 'l' }), fI) }]).el); el.style.display = 'flex'; el.style.flexDirection = 'column'; },
          buttons: [{ t: '확인', def: true, on: () => { if (!IP.ok(fI.value)) return false; r.data = fI.value; M.refresh(); } }, { t: '취소', cancel: true }] });
      }
      // ───────── 영역 속성 (일반, SOA, 이름 서버, WINS, 영역 전송) ─────────
      function zoneProps(z, start) {
        const s = SIMS.clone(z.soa); let dyn, fSer, fPri, fResp, tf = {}, xa, xr, xIp, xL; const xlist = z.xfer.list.slice();
        const timeRow = (label, key) => { const n = W.text(String(s[key].v), { w: 60 }); const u = W.select(UNITS, s[key].u, { w: 70 }); tf[key] = [n, u]; return [label, W.row(n, u)]; };
        const apply = () => {
          for (const [k, [n, u]] of Object.entries(tf)) { const v = +n.value; if (!(v >= 0)) { W.msg(desk, { title: 'DNS', text: '시간 간격은 숫자로 입력하십시오.', icon: 'error' }); return false; } z.soa[k] = { v, u: u.value }; }
          const ser = +fSer.value; if (!(ser >= 0)) { W.msg(desk, { title: 'DNS', text: '일련 번호는 숫자로 입력하십시오.', icon: 'error' }); return false; }
          z.soa.serial = ser; z.soa.primary = fPri.value.trim(); z.soa.resp = fResp.value.trim(); z.dyn = dyn.value;
          z.xfer = { allow: xa.checked, mode: xr.value, list: xlist.slice() };
          M.refresh(); return true;
        };
        W.dialog(desk, { title: `${z.name} 속성`, w: 470, h: 520, owner: M.win,
          render: el => {
            dyn = W.select([['none', '없음'], ['nonsecure', '비보안 및 보안']], z.dyn, { w: 160 });
            fSer = W.text(String(s.serial), { w: 110 }); fPri = W.text(s.primary); fResp = W.text(s.resp);
            const gen = h('div', {}, W.form([['상태:', W.row(h('span', {}, '실행 중'), W.btn('일시 중지(U)', null, { dis: true }))], ['유형:', W.row(h('span', {}, ({ primary: '주', secondary: '보조', stub: '스텁' })[z.type]), W.btn('변경(C)...', null, { dis: true }))], ['영역 파일 이름(Z):', W.text(z.file, { ro: true })], ['동적 업데이트(N):', dyn]], { cols: '120px 1fr' }), W.label('비보안 동적 업데이트를 허용하면 신뢰할 수 없는 원본으로부터 업데이트를 받을 수 있으므로 보안상 취약합니다.', { cls: 'muted7' }));
            const soa = h('div', {}, W.form([['일련 번호(S):', W.row(fSer, W.btn('증가(N)', () => (fSer.value = String((+fSer.value || 0) + 1))))], ['주 서버(P):', W.row(fPri, W.btn('찾아보기(B)...', null, { dis: true }))], ['책임자(R):', W.row(fResp, W.btn('찾아보기(O)...', null, { dis: true }))], timeRow('새로 고침 간격(E):', 'refresh'), timeRow('다시 시도 간격(V):', 'retry'), timeRow('다음 날짜 이후 만료(X):', 'expire'), timeRow('최소(기본값) TTL(M):', 'minttl'), ['이 레코드의 TTL(T):', W.text('0 :1 :0 :0', { w: 110, ro: true })]], { cols: '140px 1fr' }));
            const ns = h('div', {}, W.label('이 영역의 이름 서버를 추가하려면 [추가]를 클릭하십시오.'), h('div', { style: { height: '160px', border: '1px solid #828790', background: '#fff' } }, W.list({ cols: [{ t: '서버 FQDN(정규화된 도메인 이름)', w: 240 }, { t: 'IP 주소', w: 140 }], rows: [{ id: 'n', cells: ['icqaserver.', '[192.168.100.10]'] }] }).el));
            xa = W.chk('영역 전송 허용(O):', z.xfer.allow); xr = W.radios([['any', '아무 서버로(T)'], ['ns', '이름 서버 탭에 나열된 서버로만(S)'], ['list', '다음 서버로만(H)']], z.xfer.mode);
            xIp = W.ip(''); xL = W.list({ cols: [{ t: 'IP 주소', w: 160 }, { t: '서버 FQDN', w: 160 }] });
            const pxl = () => xL.set(xlist.map((x, i) => ({ id: 'x' + i, cells: [x, ''] }))); pxl();
            const sync = () => { xr.els.forEach(e => { e.input.disabled = !xa.checked; e.classList.toggle('dis', !xa.checked); }); };
            xa.onToggle(sync);
            const xf = h('div', {}, W.label('영역 전송은 네트워크에 있는 다른 DNS 서버에 영역의 복사본을 보냅니다.'), W.row(xa), h('div', { style: { paddingLeft: '20px' } }, W.row(xr.els[0]), W.row(xr.els[1]), W.row(xr.els[2]), W.row(xIp, W.btn('편집(E)...', () => { if (IP.ok(xIp.value)) { xlist.push(xIp.value); xIp.value = ''; pxl(); } }), W.btn('제거', () => { const r = xL.selected(); if (r) { xlist.splice(+r.id.slice(1), 1); pxl(); } })), h('div', { style: { height: '80px', border: '1px solid #828790', background: '#fff' } }, xL.el)), W.label('[편집]을 누르면 왼쪽 칸의 IP를 목록에 추가합니다.', { cls: 'muted7' }));
            sync();
            const t = W.tabs([{ t: '일반', el: gen }, { t: 'SOA(권한 시작)', el: soa }, { t: '이름 서버', el: ns }, { t: 'WINS', el: h('div', {}, W.label('이 연습 프로그램에서는 WINS 탭을 쓰지 않습니다.')) }, { t: '영역 전송', el: xf }], { start: start || 0 });
            el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(t.el);
          },
          buttons: [{ t: '확인', def: true, on: () => apply() }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { apply(); return false; } }] });
      }
      // 창 크기·왼쪽 칸 너비는 에뮬레이터(ntDNSC) 화면과 같은 픽셀 값
      function open() { M = SIMS.mmc(desk, { title: 'DNS 관리자', icon: 'ddTitleDns', w: 1016, h: 746, nodes, open: ['dns', 'srv', 'fwd', 'rev'], sel: 'fwd', render, menu, leftW: 188, toolbar: toolbar(), onClose: () => SIMS.closed(desk, open, 'DNS 관리자') }); skin(M, 'emu-dns'); }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
