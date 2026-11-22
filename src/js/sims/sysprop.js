/* 가상 화면: 시스템 속성(sysdm.cpl) — 컴퓨터 이름, 고급 → 성능 옵션(시각 효과·프로세서 일정·가상 메모리·DEP), 원격(원격 지원·원격 데스크톱·사용자 선택)
 *           원격 데스크톱 연결(mstsc) — 일반·디스플레이·로컬 리소스·작업 환경
 * 채점 키(sysprop): comp.desc, comp.name, comp.workgroup, ra, rd(allow/deny), nla, rdUsers[], vm.auto, vm.<드라이브>.mode(system/custom/none), vm.<드라이브>.init, vm.<드라이브>.max, perf.visual, perf.sched, dep
 * 채점 키(mstsc): rdp.computer, rdp.user, rdp.saveCred, rdp.size, rdp.color, rdp.bar, rdp.audio, rdp.keys, rdp.printers, rdp.clipboard, rdp.speed, rdp.connected */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const DRIVES = [['C:', '', 152340], ['D:', 'DATA', 409600]];
  const blank = () => ({ comp: { desc: '', name: 'ICQAPC', workgroup: 'WORKGROUP', domain: '', member: 'workgroup' }, ra: true, rd: 'deny', nla: true, rdUsers: [], vm: { auto: true, drives: { 'C:': { mode: 'system', init: 0, max: 0 }, 'D:': { mode: 'none', init: 0, max: 0 } } }, perf: { visual: 'auto', sched: 'programs' }, dep: 'essential' });
  function flat(st) {
    const o = { 'comp.desc': st.comp.desc, 'comp.name': st.comp.name, 'comp.workgroup': st.comp.member === 'workgroup' ? st.comp.workgroup : '', 'comp.domain': st.comp.member === 'domain' ? st.comp.domain : '', ra: st.ra, rd: st.rd, nla: st.nla, rdUsers: st.rdUsers.slice(), 'vm.auto': st.vm.auto, 'perf.visual': st.perf.visual, 'perf.sched': st.perf.sched, dep: st.dep };
    for (const [d, v] of Object.entries(st.vm.drives)) { const k = d.replace(':', ''); o[`vm.${k}.mode`] = st.vm.auto ? 'auto' : v.mode; o[`vm.${k}.init`] = v.mode === 'custom' && !st.vm.auto ? v.init : ''; o[`vm.${k}.max`] = v.mode === 'custom' && !st.vm.auto ? v.max : ''; }
    return o;
  }
  const LABELS = { 'comp.desc': '컴퓨터 설명', 'comp.name': '컴퓨터 이름', 'comp.workgroup': '작업 그룹', 'comp.domain': '도메인', ra: '원격 지원 연결 허용', rd: '원격 데스크톱 연결 허용', nla: '네트워크 수준 인증(NLA)만 허용', rdUsers: '원격 데스크톱 사용자', 'vm.auto': '모든 드라이브에 대한 페이징 파일 크기 자동 관리', 'vm.C.mode': 'C: 페이징 파일 방식', 'vm.C.init': 'C: 처음 크기(MB)', 'vm.C.max': 'C: 최대 크기(MB)', 'vm.D.mode': 'D: 페이징 파일 방식', 'vm.D.init': 'D: 처음 크기(MB)', 'vm.D.max': 'D: 최대 크기(MB)', 'perf.visual': '시각 효과', 'perf.sched': '프로세서 일정', dep: '데이터 실행 방지(DEP)' };
  const USERS = ['Administrator', 'ICQA', 'Guest', 'user1'].map(n => ({ name: n, type: 'user' })).concat(['Administrators', 'Users', 'Remote Desktop Users'].map(n => ({ name: n, type: 'group' })));

  SIMS.def('sysprop', {
    title: '시스템 속성', labels: LABELS, blank, flat,
    mount(desk, q) {
      desk.el.classList.add('enx'); // 에뮬레이터 공통 창 틀(emu-netetc.css)
      const st = blank();
      const init = (q && q.init) || {};
      Object.assign(st.comp, init.comp || {}); ['ra', 'rd', 'nla', 'dep'].forEach(k => { if (k in init) st[k] = init[k]; }); if (init.rdUsers) st.rdUsers = init.rdUsers.slice();
      function open() {
        const w = SIMS.clone(st);
        let fDesc, ra, rdR, nla, nameLbl, wgLbl;
        const tabName = h('div', {}, h('div', { style: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' } }, W.frag(g.icon('computer')), h('span', {}, '다음 정보로 네트워크에서 이 컴퓨터를 식별합니다.')),
          W.form([['컴퓨터 설명(D):', fDesc = W.text(w.comp.desc)]], { cols: '110px 1fr' }), W.label('예: "주방 컴퓨터" 또는 "Mary의 컴퓨터"', { cls: 'muted7' }),
          W.form([['전체 컴퓨터 이름:', nameLbl = h('span', {}, w.comp.name)], ['작업 그룹:', wgLbl = h('span', {}, w.comp.member === 'domain' ? w.comp.domain : w.comp.workgroup)]], { cols: '110px 1fr' }),
          W.row(h('span', { style: { flex: 1 } }, '도메인이나 작업 그룹에 가입하기 위해 마법사를 사용하려면 [네트워크 ID]를 클릭하십시오.'), W.btn('네트워크 ID(N)...', null, { dis: true })),
          W.row(h('span', { style: { flex: 1 } }, '이 컴퓨터의 이름을 바꾸거나 도메인 또는 작업 그룹을 변경하려면 [변경]을 클릭하십시오.'), W.btn('변경(C)...', () => changeName())));
        const tabHw = h('div', {}, W.group('장치 관리자', W.label('장치 관리자는 컴퓨터에 설치된 모든 하드웨어 장치를 나열합니다. 장치 관리자를 사용하여 장치의 속성을 변경할 수 있습니다.'), W.row(h('span', { style: { flex: 1 } }), W.btn('장치 관리자(D)', null, { dis: true }))), W.group('장치 설치 설정', W.label('장치에 사용할 수 있는 제조업체의 앱과 사용자 지정 아이콘을 자동으로 다운로드할지 여부를 선택합니다.'), W.row(h('span', { style: { flex: 1 } }), W.btn('장치 설치 설정(S)', null, { dis: true }))));
        const tabAdv = h('div', {}, W.label('이 내용을 변경하려면 관리자로 로그온해야 합니다.', { cls: 'hint7' }), W.group('성능', W.label('시각 효과, 프로세서 일정, 메모리 사용 및 가상 메모리'), W.row(h('span', { style: { flex: 1 } }), W.btn('설정(S)...', () => perfDlg()))), W.group('사용자 프로필', W.label('로그인과 관련된 바탕 화면 설정'), W.row(h('span', { style: { flex: 1 } }), W.btn('설정(E)...', null, { dis: true }))), W.group('시작 및 복구', W.label('시스템 시작, 시스템 오류 및 디버깅 정보'), W.row(h('span', { style: { flex: 1 } }), W.btn('설정(T)...', null, { dis: true }))), W.row(h('span', { style: { flex: 1 } }), W.btn('환경 변수(N)...', null, { dis: true })));
        const tabProt = h('div', {}, W.label('시스템 보호를 사용하여 원치 않는 시스템 변경 내용을 취소합니다.'), W.label('이 연습 프로그램에서는 시스템 보호 탭을 쓰지 않습니다.', { cls: 'muted7' }));
        ra = W.chk('이 컴퓨터에 대한 원격 지원 연결 허용(R)', w.ra);
        rdR = W.radios([['deny', '이 컴퓨터에 대한 원격 연결 허용 안 함(D)'], ['allow', '이 컴퓨터에 대한 원격 연결 허용(L)']], w.rd);
        nla = W.chk('네트워크 수준 인증을 사용하여 원격 데스크톱을 실행하는 컴퓨터에서만 연결 허용(권장)(N)', w.nla);
        const bUsers = W.btn('사용자 선택(S)...', () => usersDlg());
        const syncR = () => { const on = rdR.value === 'allow'; nla.setDisabled(!on); bUsers.disabled = !on; };
        rdR.onChange(syncR);
        const tabRemote = h('div', {}, W.group('원격 지원', W.row(ra), W.row(h('span', { style: { flex: 1 } }), W.btn('고급(V)...', null, { dis: true }))),
          W.group('원격 데스크톱', W.label('옵션을 선택한 다음 연결할 수 있는 사용자를 지정하십시오.'), W.row(rdR.els[0]), W.row(rdR.els[1]), h('div', { style: { paddingLeft: '20px' } }, W.row(nla)), W.row(h('span', { style: { flex: 1, color: '#0645ad' } }, '선택 방법'), bUsers)));
        syncR();
        const start = { name: 0, hw: 1, advanced: 2, protect: 3, remote: 4 }[(q && q.start) || 'name'] || 0;
        const commit = () => { Object.assign(st.comp, { desc: fDesc.value.trim() }); st.ra = ra.checked; st.rd = rdR.value; st.nla = nla.checked; st.rdUsers = w.rdUsers.slice(); };
        const main = W.dialog(desk, { title: '시스템 속성', w: 450, h: 500,
          render: el => { el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(W.tabs([{ t: '컴퓨터 이름', el: tabName }, { t: '하드웨어', el: tabHw }, { t: '고급', el: tabAdv }, { t: '시스템 보호', el: tabProt }, { t: '원격', el: tabRemote }], { start }).el); },
          buttons: [{ t: '확인', def: true, on: () => { commit(); setTimeout(() => SIMS.closed(desk, open, '시스템 속성'), 0); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { commit(); return false; } }],
          onCancelled: () => SIMS.closed(desk, open, '시스템 속성') });
        function changeName() {
          let fN, rM, fDom, fWg;
          W.dialog(desk, { title: '컴퓨터 이름/도메인 변경', w: 400, h: 400, owner: main,
            render: el => { fN = W.text(st.comp.name); fDom = W.text(st.comp.domain); fWg = W.text(st.comp.workgroup); rM = W.radios([['domain', '도메인(D):'], ['workgroup', '작업 그룹(W):']], st.comp.member);
              const sync = () => { fDom.disabled = rM.value !== 'domain'; fWg.disabled = rM.value !== 'workgroup'; }; rM.onChange(sync); sync();
              el.append(W.label('이 컴퓨터의 이름과 구성원을 변경할 수 있습니다. 변경 내용에 따라 네트워크 리소스에 대한 액세스가 영향을 받을 수 있습니다.'), W.label('컴퓨터 이름(C):', { cls: 'l' }), fN, W.label('전체 컴퓨터 이름:', { cls: 'l' }), h('div', {}, st.comp.name), W.row(h('span', { style: { flex: 1 } }), W.btn('자세히(M)...', null, { dis: true })), W.group('소속 그룹', W.row(rM.els[0]), fDom, W.row(rM.els[1]), fWg)); },
            buttons: [{ t: '확인', def: true, on: () => {
              const n = fN.value.trim();
              if (!n || n.length > 15 || /[\\/:*?"<>|,~!@#$%^&'.(){}_ ]/.test(n) || /^\d+$/.test(n)) { W.msg(desk, { title: '컴퓨터 이름/도메인 변경', text: '새 컴퓨터 이름이 올바르지 않습니다.\n컴퓨터 이름은 15자 이하이고, 숫자로만 이루어질 수 없으며, 공백이나 특수 문자를 포함할 수 없습니다.', icon: 'error' }); return false; }
              if (rM.value === 'workgroup' && !fWg.value.trim()) { W.msg(desk, { title: '컴퓨터 이름/도메인 변경', text: '작업 그룹 이름을 입력하십시오.', icon: 'error' }); return false; }
              if (rM.value === 'domain') { W.msg(desk, { title: '컴퓨터 이름/도메인 변경', text: '(연습창) 도메인에 연결할 수 없습니다. 이 연습 프로그램에는 도메인 컨트롤러가 없습니다.', icon: 'error' }); return false; }
              Object.assign(st.comp, { name: n, workgroup: fWg.value.trim(), member: rM.value });
              nameLbl.textContent = n + ' (다시 시작한 뒤 적용)'; wgLbl.textContent = fWg.value.trim();
              W.msg(desk, { title: '컴퓨터 이름/도메인 변경', text: '변경 내용을 적용하려면 컴퓨터를 다시 시작해야 합니다.', icon: 'info' });
            } }, { t: '취소', cancel: true }] });
        }
        function usersDlg() {
          const list = w.rdUsers.slice(); let L;
          const paint = () => L.set(list.map(n => ({ id: n, cells: [n], icon: 'user' })));
          W.dialog(desk, { title: '원격 데스크톱 사용자', w: 400, h: 360, owner: main,
            render: el => { L = W.list({ cols: [{ t: '', w: 330 }] }); paint(); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none';
              el.append(W.label('다음 사용자가 이 컴퓨터에 연결할 수 있습니다. Administrators 그룹의 구성원은 이 목록에 없어도 연결할 수 있습니다.'), h('div', { style: { height: '140px', border: '1px solid #828790', background: '#fff' } }, L.el), W.label('ICQA은(는) 이미 액세스 권한이 있습니다.', { cls: 'muted7' }), W.row(W.btn('추가(D)...', () => W.pickPrincipal(desk, { title: '사용자 선택', kind: '사용자', names: () => USERS, onOk: ns => { ns.forEach(n => { if (!list.includes(n)) list.push(n); }); paint(); } })), W.btn('제거(R)', () => { const s = L.selected(); if (s) { list.splice(list.indexOf(s.id), 1); paint(); } }))); },
            buttons: [{ t: '확인', def: true, on: () => { w.rdUsers = list.slice(); } }, { t: '취소', cancel: true }] });
        }
        function perfDlg() {
          let rV, rS, rD;
          const pw = SIMS.clone(st.perf);
          const vmTotal = h('span', {}, vmText());
          W.dialog(desk, { title: '성능 옵션', w: 420, h: 470, owner: main,
            render: el => {
              rV = W.radios([['auto', '컴퓨터에 맞게 자동으로 선택(L)'], ['appearance', '최적 모양으로 조정(B)'], ['performance', '최적 성능으로 조정(P)'], ['custom', '사용자 지정(C):']], pw.visual);
              const fx = ['마우스 포인터 아래 그림자 표시', '바탕 화면의 아이콘 레이블에 그림자 사용', '아이콘 대신 미리 보기 표시', '창 아래에 그림자 표시', '창을 최대화하거나 최소화할 때 애니메이션 효과 표시', '화면 글꼴의 가장자리 다듬기'].map(t => W.chk(t, true));
              rV.onChange(() => { const v = rV.value; fx.forEach(c => (c.checked = v !== 'performance')); });
              rS = W.radios([['programs', '프로그램(P)'], ['services', '백그라운드 서비스(S)']], pw.sched);
              rD = W.radios([['essential', '필수적인 Windows 프로그램 및 서비스에 대해서만 DEP 사용(T)'], ['all', '다음을 제외한 모든 프로그램 및 서비스에 대해 DEP 사용(U):']], st.dep);
              const t1 = h('div', {}, W.label('Windows의 모양 및 성능에 사용할 설정을 선택하십시오.'), W.row(rV.els[0]), W.row(rV.els[1]), W.row(rV.els[2]), W.row(rV.els[3]), h('div', { style: { height: '150px', overflow: 'auto', border: '1px solid #ccc', padding: '4px 6px' } }, fx.map(c => W.row(c))));
              const t2 = h('div', {}, W.group('프로세서 일정', W.label('최적 성능 조정 대상:'), W.row(rS.els[0], rS.els[1])), W.group('가상 메모리', W.label('페이징 파일은 Windows가 RAM처럼 사용하는 하드 디스크의 영역입니다.'), W.row(h('span', { style: { flex: 1 } }, '모든 드라이브의 총 페이징 파일 크기: ', vmTotal), W.btn('변경(C)...', () => vmDlg(vmTotal)))));
              const t3 = h('div', {}, W.label('DEP(데이터 실행 방지)는 바이러스와 기타 보안 위협으로부터 컴퓨터를 보호하는 데 도움이 됩니다.'), W.row(rD.els[0]), W.row(rD.els[1]), h('div', { style: { height: '90px', border: '1px solid #ccc', background: '#fff' } }));
              el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(W.tabs([{ t: '시각 효과', el: t1 }, { t: '고급', el: t2 }, { t: '데이터 실행 방지', el: t3 }]).el);
            },
            buttons: [{ t: '확인', def: true, on: () => { st.perf = { visual: rV.value, sched: rS.value }; st.dep = rD.value; } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { st.perf = { visual: rV.value, sched: rS.value }; st.dep = rD.value; return false; } }] });
        }
        function vmText() { const tot = st.vm.auto ? 2432 : Object.values(st.vm.drives).reduce((a, d) => a + (d.mode === 'custom' ? d.init : d.mode === 'system' ? 2432 : 0), 0); return `${tot}MB`; }
        function vmDlg(totalEl) {
          const v = SIMS.clone(st.vm); let sel = 'C:', L, cAuto, rM, fI, fX, selLbl, freeLbl;
          const sizeText = d => (v.auto ? (d === 'C:' ? '시스템이 관리' : '없음') : v.drives[d].mode === 'custom' ? `${v.drives[d].init} - ${v.drives[d].max}` : v.drives[d].mode === 'system' ? '시스템이 관리' : '없음');
          const paint = () => { L.set(DRIVES.map(([d, lb]) => ({ id: d, cells: [`${d}${lb ? ` [${lb}]` : ''}`, sizeText(d)], icon: 'disk' }))); L.sel = sel; L.paint(); };
          const showSel = () => { const d = v.drives[sel]; selLbl.textContent = sel; freeLbl.textContent = DRIVES.find(x => x[0] === sel)[2] + 'MB'; rM.value = d.mode; fI.value = d.mode === 'custom' ? d.init : ''; fX.value = d.mode === 'custom' ? d.max : ''; syncM(); };
          const syncM = () => { const dis = cAuto.checked; [L.el].forEach(x => (x.style.opacity = dis ? .6 : 1)); rM.els.forEach(e => { e.input.disabled = dis; e.classList.toggle('dis', dis); }); fI.disabled = fX.disabled = dis || rM.value !== 'custom'; setBtn.disabled = dis; };
          let setBtn;
          W.dialog(desk, { title: '가상 메모리', w: 400, h: 540, owner: null,
            render: el => {
              cAuto = W.chk('모든 드라이브에 대한 페이징 파일 크기 자동 관리(A)', v.auto);
              L = W.list({ cols: [{ t: '드라이브 [볼륨 레이블](D)', w: 170 }, { t: '페이징 파일 크기(MB)', w: 150 }], onSelect: r => { sel = r.id; showSel(); } });
              rM = W.radios([['custom', '사용자 지정 크기(C):'], ['system', '시스템이 관리하는 크기(Y)'], ['none', '페이징 파일 없음(N)']], 'system');
              fI = W.text('', { w: 90 }); fX = W.text('', { w: 90 }); selLbl = h('span'); freeLbl = h('span');
              setBtn = W.btn('설정(S)', () => {
                const d = v.drives[sel];
                if (rM.value === 'custom') {
                  const a = +fI.value, b = +fX.value; const free = DRIVES.find(x => x[0] === sel)[2];
                  if (!/^\d+$/.test(fI.value.trim()) || !/^\d+$/.test(fX.value.trim())) { W.msg(desk, { title: '시스템 속성', text: '처음 크기와 최대 크기에 숫자를 입력하십시오.', icon: 'error' }); return; }
                  if (a < 16) { W.msg(desk, { title: '시스템 속성', text: '처음 크기는 16MB 이상이어야 합니다.', icon: 'error' }); return; }
                  if (b < a) { W.msg(desk, { title: '시스템 속성', text: '최대 페이징 파일 크기는 처음 페이징 파일 크기보다 크거나 같아야 하며, 드라이브의 사용 가능한 공간보다 작아야 합니다.', icon: 'error' }); return; }
                  if (b > free) { W.msg(desk, { title: '시스템 속성', text: '최대 페이징 파일 크기는 드라이브의 사용 가능한 공간보다 작아야 합니다.', icon: 'error' }); return; }
                  Object.assign(d, { mode: 'custom', init: a, max: b });
                } else Object.assign(d, { mode: rM.value, init: 0, max: 0 });
                paint();
              });
              cAuto.onToggle(() => { v.auto = cAuto.checked; syncM(); paint(); });
              rM.onChange(syncM);
              el.append(W.row(cAuto), W.group('각 드라이브의 페이징 파일 크기', h('div', { style: { height: '70px', border: '1px solid #828790', background: '#fff' } }, L.el), W.form([['선택한 드라이브:', selLbl], ['사용 가능한 공간:', freeLbl]], { cols: '120px 1fr' }), W.row(rM.els[0]), h('div', { style: { paddingLeft: '20px' } }, W.form([['처음 크기(MB)(I):', fI], ['최대 크기(MB)(X):', fX]], { cols: '120px auto' })), W.row(rM.els[1]), W.row(rM.els[2]), W.row(h('span', { style: { flex: 1 } }), setBtn)),
                W.group('모든 드라이브의 총 페이징 파일 크기', W.form([['최소 허용:', h('span', {}, '16MB')], ['권장:', h('span', {}, '2924MB')], ['현재 할당:', h('span', {}, vmText())]], { cols: '120px 1fr' })));
              paint(); showSel();
            },
            buttons: [{ t: '확인', def: true, on: () => {
              const changed = JSON.stringify(v) !== JSON.stringify(st.vm);
              st.vm = v; totalEl.textContent = vmText();
              if (changed) W.msg(desk, { title: '시스템 속성', text: '변경 내용을 적용하려면 컴퓨터를 다시 시작해야 합니다.', icon: 'info' });
            } }, { t: '취소', cancel: true }] });
        }
        return main;
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });

  // ───────── 원격 데스크톱 연결 (mstsc) ─────────
  const RDP_LABELS = { 'rdp.computer': '컴퓨터', 'rdp.user': '사용자 이름', 'rdp.saveCred': '자격 증명 저장 허용', 'rdp.size': '원격 데스크톱 크기', 'rdp.color': '색 깊이', 'rdp.bar': '전체 화면 사용 시 연결 표시줄 표시', 'rdp.audio': '원격 오디오 재생', 'rdp.keys': 'Windows 키 조합 적용', 'rdp.printers': '로컬 장치: 프린터', 'rdp.clipboard': '로컬 장치: 클립보드', 'rdp.speed': '연결 속도', 'rdp.connected': '[연결] 누름' };
  SIMS.def('mstsc', {
    title: '원격 데스크톱 연결', labels: RDP_LABELS,
    mount(desk, q) {
      desk.el.classList.add('enx'); // 에뮬레이터 공통 창 틀(emu-netetc.css)
      const st = { computer: '', user: '', saveCred: false, size: '전체 화면', color: '최고 품질(32비트)', bar: true, audio: '이 컴퓨터에서 재생', keys: '전체 화면을 사용하는 경우에만', printers: true, clipboard: true, speed: '연결 품질 자동 검색', connected: false, ...((q && q.init) || {}) };
      const flat = () => Object.fromEntries(Object.entries(st).map(([k, v]) => ['rdp.' + k, v]));
      function open() {
        let fC, fU, cS, sz, col, bar, au, ky, pr, cb, sp;
        const SIZES = ['640 x 480', '800 x 600', '1024 x 768', '1280 x 720', '1280 x 1024', '1600 x 900', '1920 x 1080', '전체 화면'];
        const read = () => Object.assign(st, { computer: fC.value.trim(), user: fU.value.trim(), saveCred: cS.checked, size: sz.value, color: col.value, bar: bar.checked, audio: au.value, keys: ky.value, printers: pr.checked, clipboard: cb.checked, speed: sp.value });
        W.dialog(desk, { title: '원격 데스크톱 연결', w: 480, h: 560,
          render: el => {
            fC = W.combo(['192.168.10.2', 'ICQAPC'], st.computer); fU = W.text(st.user); cS = W.chk('자격 증명 저장 허용(R)', st.saveCred);
            sz = W.select(SIZES, st.size, { w: 160 }); col = W.select(['High Color(15비트)', 'High Color(16비트)', 'True Color(24비트)', '최고 품질(32비트)'], st.color, { w: 200 }); bar = W.chk('전체 화면을 사용하는 경우 연결 표시줄 표시(D)', st.bar);
            au = W.select(['이 컴퓨터에서 재생', '원격 컴퓨터에서 재생', '재생 안 함'], st.audio, { w: 220 }); ky = W.select(['이 컴퓨터에서', '원격 컴퓨터에서', '전체 화면을 사용하는 경우에만'], st.keys, { w: 240 }); pr = W.chk('프린터(T)', st.printers); cb = W.chk('클립보드(L)', st.clipboard);
            sp = W.select(['연결 품질 자동 검색', '모뎀(56Kbps)', '저속 광대역(256Kbps - 2Mbps)', '위성(2Mbps - 16Mbps, 높은 대기 시간)', '고속 광대역(2Mbps - 10Mbps)', 'WAN(10Mbps 이상, 높은 대기 시간)', 'LAN(10Mbps 이상)'], st.speed, { w: 300 });
            const head = h('div', { class: 'rdp-head' }, h('span', { style: { width: '48px', height: '48px', display: 'inline-flex' }, html: g.ICONS.rdp }), h('div', {}, h('div', { class: 't1' }, '원격 데스크톱'), h('div', { class: 't2' }, '연결')));
            const t1 = h('div', {}, W.group('로그온 설정', W.label('원격 컴퓨터의 이름을 입력하십시오.'), W.form([['컴퓨터(C):', fC], ['사용자 이름:', fU]], { cols: '90px 1fr' }), W.label('저장할 때 자격 증명을 묻습니다.', { cls: 'muted7' }), W.row(cS)), W.group('연결 설정', W.label('현재 연결 설정을 RDP 파일에 저장하거나 저장된 연결을 엽니다.'), W.row(W.btn('저장(S)', null, { dis: true }), W.btn('다른 이름으로 저장(V)...', null, { dis: true }), W.btn('열기(E)...', null, { dis: true }))));
            const t2 = h('div', {}, W.group('디스플레이 구성', W.label('원격 데스크톱 크기를 선택하십시오.'), sz, W.row(W.chk('원격 세션에 내 모든 모니터 사용(U)', false))), W.group('색', W.label('원격 세션의 색 농도를 선택하십시오.'), col), W.row(bar));
            const t3 = h('div', {}, W.group('원격 오디오', W.label('원격 오디오 재생 설정을 구성합니다.'), au), W.group('키보드', W.label('Windows 키 조합 적용(K):'), ky, W.label('예: Alt+Tab', { cls: 'muted7' })), W.group('로컬 장치 및 리소스', W.label('원격 세션에서 사용할 장치와 리소스를 선택하십시오.'), W.row(pr, cb), W.row(h('span', { style: { flex: 1 } }), W.btn('자세히(M)...', null, { dis: true }))));
            const t4 = h('div', {}, W.label('이 연습 프로그램에서는 프로그램 탭을 쓰지 않습니다.'));
            const t5 = h('div', {}, W.group('성능', W.label('성능을 최적화하려면 연결 속도를 선택하십시오.'), sp, W.row(W.chk('바탕 화면 배경', true)), W.row(W.chk('글꼴 다듬기', true)), W.row(W.chk('바탕 화면 구성', true)), W.row(W.chk('끌 때 창 내용 표시', true)), W.row(W.chk('메뉴 및 창 애니메이션', false)), W.row(W.chk('시각적 스타일', true))), W.row(W.chk('지속적 비트맵 캐싱(B)', true)), W.row(W.chk('연결이 끊어지면 다시 연결(O)', true)));
            const t6 = h('div', {}, W.label('이 연습 프로그램에서는 고급 탭을 쓰지 않습니다.'));
            el.style.cssText = 'flex:1;display:flex;flex-direction:column;padding:0';
            const tb = W.tabs([{ t: '일반', el: t1 }, { t: '디스플레이', el: t2 }, { t: '로컬 리소스', el: t3 }, { t: '프로그램', el: t4 }, { t: '작업 환경', el: t5 }, { t: '고급', el: t6 }]);
            tb.el.style.margin = '8px 10px 0';
            el.append(head, tb.el);
          },
          buttons: [{ t: '옵션 숨기기(O)', left: true, on: () => false }, { t: '연결(N)', def: true, on: () => { read(); if (!st.computer) { W.msg(desk, { title: '원격 데스크톱 연결', text: '컴퓨터 이름을 입력하십시오.', icon: 'warn' }); return false; } st.connected = true; W.msg(desk, { title: '원격 데스크톱 연결', text: `(연습창) ${st.computer}에 연결합니다. 설정을 채점에 반영했습니다.`, icon: 'info' }); setTimeout(() => SIMS.closed(desk, open, '원격 데스크톱 연결'), 0); } }, { t: '도움말(H)', on: () => false }],
          onCancelled: () => SIMS.closed(desk, open, '원격 데스크톱 연결') });
      }
      open();
      return { state: flat, open, st };
    },
  });
})(window);
