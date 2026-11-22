/* 가상 화면: 컴퓨터 관리 → 로컬 사용자 및 그룹 — 새 사용자, 사용자 속성(일반·소속 그룹·프로필), 새 그룹, 그룹 구성원, 암호 설정
 * 채점 키(이름은 소문자): user.<이름>.exists / full / desc / pw / mustChange / cannotChange / neverExpires / disabled / groups[] / homeLocal / profile / script
 *                         group.<이름>.exists / desc / members[] */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const BAD = /[\\/\[\]:;|=,+*?<>"@]/;
  const GROUPS = [['Administrators', '관리자는 컴퓨터/도메인에 대한 모든 액세스 권한을 가집니다.', ['Administrator']], ['Backup Operators', '백업 운영자는 파일을 백업하거나 복원하기 위해 보안 제한을 무시할 수 있습니다.', []], ['Event Log Readers', '이 그룹의 구성원은 로컬 컴퓨터의 이벤트 로그를 읽을 수 있습니다.', []], ['Guests', '게스트는 기본적으로 사용자 그룹의 구성원과 동일한 액세스 권한을 가집니다.', ['Guest']], ['IIS_IUSRS', '인터넷 정보 서비스에서 사용하는 기본 제공 그룹입니다.', []], ['Network Configuration Operators', '이 그룹의 구성원은 TCP/IP 주소 변경 등 네트워킹 기능의 구성을 관리할 수 있습니다.', []], ['Performance Log Users', '이 그룹의 구성원은 성능 카운터의 로깅을 예약할 수 있습니다.', []], ['Power Users', '이전 버전과의 호환성을 위해 포함되었으며 제한된 관리 권한을 가집니다.', []], ['Print Operators', '도메인 프린터를 관리할 수 있습니다.', []], ['Remote Desktop Users', '이 그룹의 구성원은 원격으로 로그온할 수 있는 권한이 있습니다.', []], ['Remote Management Users', '이 그룹의 구성원은 WS-Management 프로토콜을 통해 WMI 리소스에 액세스할 수 있습니다.', []], ['Users', '사용자는 시스템 차원의 변경을 할 수 없습니다.', ['ICQAUSER']]];
  const U = (desc, o = {}) => ({ full: '', desc, pw: '', mustChange: false, cannotChange: false, neverExpires: false, disabled: false, profile: '', script: '', homeMode: 'local', homeLocal: '', homeDrive: 'Z:', homeTo: '', ...o });
  const blank = () => ({
    users: { Administrator: U('컴퓨터/도메인을 관리하도록 기본 제공된 계정', { neverExpires: true }), Guest: U('게스트가 컴퓨터/도메인을 액세스하도록 기본 제공된 계정', { disabled: true, cannotChange: true, neverExpires: true }), ICQAUSER: U('') },
    groups: Object.fromEntries(GROUPS.map(([n, d, m]) => [n, { desc: d, members: m.slice(), builtin: true }])),
  });
  const findKey = (obj, name) => Object.keys(obj).find(k => k.toLowerCase() === String(name).toLowerCase());
  function flat(st) {
    const o = {};
    for (const [n, u] of Object.entries(st.users)) {
      const k = n.toLowerCase();
      Object.assign(o, { [`user.${k}.exists`]: true, [`user.${k}.full`]: u.full, [`user.${k}.desc`]: u.desc, [`user.${k}.pw`]: u.pw, [`user.${k}.mustChange`]: u.mustChange, [`user.${k}.cannotChange`]: u.cannotChange, [`user.${k}.neverExpires`]: u.neverExpires, [`user.${k}.disabled`]: u.disabled, [`user.${k}.profile`]: u.profile, [`user.${k}.script`]: u.script, [`user.${k}.homeLocal`]: u.homeMode === 'local' ? u.homeLocal : '', [`user.${k}.homeTo`]: u.homeMode === 'connect' ? u.homeTo : '' });
      o[`user.${k}.groups`] = Object.entries(st.groups).filter(([, gg]) => gg.members.some(m => m.toLowerCase() === k)).map(([gn]) => gn);
    }
    for (const [n, gg] of Object.entries(st.groups)) { const k = n.toLowerCase(); Object.assign(o, { [`group.${k}.exists`]: true, [`group.${k}.desc`]: gg.desc, [`group.${k}.members`]: gg.members.slice() }); }
    return o;
  }
  function label(k) {
    const p = k.split('.');
    const F = { exists: '만들기', full: '전체 이름', desc: '설명', pw: '암호', mustChange: '다음 로그온할 때 반드시 암호 변경', cannotChange: '사용자가 암호를 변경할 수 없음', neverExpires: '암호 사용 기간 제한 없음', disabled: '계정 사용 안 함', groups: '소속 그룹', homeLocal: '홈 폴더 로컬 경로', homeTo: '홈 폴더 연결 대상', profile: '프로필 경로', script: '로그온 스크립트', members: '구성원' };
    if (p[0] === 'user') return `사용자 ${p[1]}: ${F[p[2]] || p[2]}`;
    if (p[0] === 'group') return `그룹 ${p[1]}: ${F[p[2]] || p[2]}`;
    return k;
  }

  SIMS.def('users', {
    title: '컴퓨터 관리', label, blank, flat,
    mount(desk, q) {
      const st = blank();
      const init = (q && q.init) || {};
      // PC정비사 에뮬레이터에는 HomeGroupUser$, UpdatusUser 계정이 ICQAUSER 앞에 더 있습니다(그룹 소속은 바꾸지 않음).
      if (q && q.exam === 'pc') {
        const rest = Object.entries(st.users).filter(([n]) => n === 'ICQAUSER');
        delete st.users.ICQAUSER;
        Object.assign(st.users, { HomeGroupUser$: U('컴퓨터에 대한 홈 그룹 액세스를 위한 기본 제공 계정', { full: 'HomeGroupUser$', neverExpires: true, cannotChange: true }), UpdatusUser: U('NVIDIA 소프트웨어 업데이트 제공을 위해 예약된 계정', { full: 'UpdatusUser', neverExpires: true, cannotChange: true }) }, Object.fromEntries(rest));
      }
      Object.entries(init.users || {}).forEach(([n, u]) => { st.users[n] = U('', u); st.groups.Users.members.push(n); });
      Object.entries(init.groups || {}).forEach(([n, gg]) => (st.groups[n] = { desc: gg.desc || '', members: (gg.members || []).slice() }));
      let M;
      // 에뮬레이터의 트리: 컴퓨터 관리(로컬) → 시스템 도구 → 로컬 사용자 및 그룹 → 사용자/그룹 (다른 항목 없음)
      const nodes = () => [{ id: 'root', label: '컴퓨터 관리(로컬)', icon: 'computer', kids: [{ id: 'tools', label: '시스템 도구', icon: 'tools', kids: [{ id: 'lug', label: '로컬 사용자 및 그룹', icon: 'users', kids: [{ id: 'u', label: '사용자', icon: 'folder' }, { id: 'g', label: '그룹', icon: 'folder' }] }] }] }];
      const principals = () => Object.keys(st.users).map(n => ({ name: n, type: 'user', desc: st.users[n].desc })).concat(Object.keys(st.groups).map(n => ({ name: n, type: 'group', desc: st.groups[n].desc })));
      function menu(n) {
        if (n.id === 'u') return [{ t: '새 사용자(N)...', on: newUser }, '-', { t: '새로 고침(F)', on: () => M.refresh() }];
        if (n.id === 'g') return [{ t: '새 그룹(N)...', on: newGroup }, '-', { t: '새로 고침(F)', on: () => M.refresh() }];
        return null;
      }
      function render(n, el) {
        if (n.id === 'u') { el.append(cls('emu-ic usr-users', W.list({ cols: [{ t: '이름', w: 100 }, { t: '전체이름', w: 150 }, { t: '설명', w: 200 }], rows: Object.entries(st.users).map(([nm, u]) => ({ id: nm, cells: [nm, u.full, u.desc], icon: 'user', dis: u.disabled })), onDbl: r => userProps(r.id), onContext: (r, e) => M.ctx([{ t: '암호 설정(S)...', on: () => setPw(r.id) }, { t: '모든 작업(K)', sub: [{ t: '암호 설정(S)...', on: () => setPw(r.id) }] }, '-', { t: '삭제(D)', dis: ['Administrator', 'Guest'].includes(r.id), on: () => delUser(r.id) }, { t: '이름 바꾸기(M)', dis: true }, '-', { t: '속성(R)', b: true, on: () => userProps(r.id) }], e), onBlank: e => M.ctx(menu(n), e) }).el)); return; }
        if (n.id === 'g') { el.append(W.list({ cols: [{ t: '이름', w: 150 }, { t: '설명', w: 300 }], rows: Object.entries(st.groups).map(([nm, gg]) => ({ id: nm, cells: [nm, gg.desc], icon: 'group' })), onDbl: r => groupProps(r.id), onContext: (r, e) => M.ctx([{ t: '그룹에 추가(A)...', on: () => groupProps(r.id) }, '-', { t: '삭제(D)', dis: st.groups[r.id].builtin, on: () => { delete st.groups[r.id]; M.refresh(); } }, '-', { t: '속성(R)', b: true, on: () => groupProps(r.id) }], e), onBlank: e => M.ctx(menu(n), e) }).el); return; }
        if (n.id === 'lug') { el.append(cls('emu-ic usr-lug', W.list({ cols: [{ t: '이름', w: 150 }, { t: '설명', w: 300 }], rows: [{ id: 'u', cells: ['사용자', ''], icon: 'folder' }, { id: 'g', cells: ['그룹', ''], icon: 'folder' }], onDbl: r => M.select(r.id) }).el)); return; }
        el.append(h('div', { class: 'feat-body', style: { paddingTop: '20px' } }, h('p', {}, '이 연습 프로그램에서는 [로컬 사용자 및 그룹]만 다룹니다.')));
      }
      function delUser(nm) { W.msg(desk, { title: '로컬 사용자 및 그룹', text: `각 사용자 계정에는 사용자 이름 외에도 고유 식별자가 있습니다. 사용자 계정을 삭제하면 이 식별자도 영구적으로 삭제되며 복원할 수 없습니다.\n${nm} 사용자를 삭제하시겠습니까?`, icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win }).then(r => { if (r === '예(Y)') { delete st.users[nm]; Object.values(st.groups).forEach(gg => (gg.members = gg.members.filter(m => m !== nm))); M.refresh(); } }); }
      function newUser() {
        let fN, fF, fD, fP, fC, cM, cC, cE, cB;
        const dlg = W.dialog(desk, { title: '새 사용자', w: 400, h: 420, owner: M.win,
          render: el => {
            fN = W.text(''); fF = W.text(''); fD = W.text(''); fP = W.text('', { pw: true }); fC = W.text('', { pw: true });
            cM = W.chk('다음 로그온할 때 반드시 암호 변경(M)', true); cC = W.chk('사용자가 암호를 변경할 수 없음(S)', false); cE = W.chk('암호 사용 기간 제한 없음(W)', false); cB = W.chk('계정 사용 안 함(B)', false);
            cC.onToggle(() => { if (cC.checked && cM.checked) { cC.checked = false; W.msg(desk, { title: '로컬 사용자 및 그룹', text: '다음 로그온할 때 반드시 암호를 변경하도록 선택했습니다.\n[사용자가 암호를 변경할 수 없음]을 선택하려면 먼저 [다음 로그온할 때 반드시 암호 변경]의 선택을 취소하십시오.', icon: 'warn', owner: dlg }); } });
            cE.onToggle(() => { if (cE.checked) { cM.checked = false; cM.setDisabled(true); } else cM.setDisabled(false); });
            el.append(W.form([['사용자 이름(U):', fN], ['전체 이름(F):', fF], ['설명(D):', fD]], { cols: '110px 1fr' }), h('div', { style: { height: '10px' } }), W.form([['암호(P):', fP], ['암호 확인(C):', fC]], { cols: '110px 1fr' }), h('div', { style: { height: '8px' } }), W.row(cM), W.row(cC), W.row(cE), W.row(cB));
          },
          buttons: [{ t: '도움말(H)', left: true, on: () => false }, { t: '만들기(E)', def: true, on: () => { create(); return false; } }, { t: '닫기(O)', cancel: true }] });
        async function create() {
          const name = fN.value.trim();
          if (!name) return W.msg(desk, { title: '로컬 사용자 및 그룹', text: '사용자 이름을 입력해야 합니다.', icon: 'error', owner: dlg });
          if (BAD.test(name)) return W.msg(desk, { title: '로컬 사용자 및 그룹', text: '입력한 사용자 이름에 사용할 수 없는 문자가 있습니다. \\ / [ ] : ; | = , + * ? < > " @', icon: 'error', owner: dlg });
          if (findKey(st.users, name) || findKey(st.groups, name)) return W.msg(desk, { title: '로컬 사용자 및 그룹', text: `${name} 사용자 또는 그룹이 이미 있습니다.`, icon: 'error', owner: dlg });
          if (fP.value !== fC.value) return W.msg(desk, { title: '로컬 사용자 및 그룹', text: '입력한 암호가 일치하지 않습니다.', icon: 'error', owner: dlg });
          if (cM.checked && cC.checked) return W.msg(desk, { title: '로컬 사용자 및 그룹', text: '[다음 로그온할 때 반드시 암호 변경]과 [사용자가 암호를 변경할 수 없음]을 함께 선택할 수 없습니다.', icon: 'error', owner: dlg });
          st.users[name] = U(fD.value.trim(), { full: fF.value.trim(), pw: fP.value, mustChange: cM.checked, cannotChange: cC.checked, neverExpires: cE.checked, disabled: cB.checked });
          st.groups.Users.members.push(name);
          M.refresh();
          [fN, fF, fD, fP, fC].forEach(x => (x.value = '')); cM.checked = true; cM.setDisabled(false); cC.checked = false; cE.checked = false; cB.checked = false; fN.focus();
        }
      }
      function setPw(nm) {
        W.msg(desk, { title: `${nm} 암호 설정`, text: '이 사용자 계정의 암호를 다시 설정하면 일부 정보에 액세스하지 못할 수 있습니다.\n계속하시겠습니까?', icon: 'warn', buttons: ['계속(P)', '취소'], owner: M.win }).then(r => {
          if (r !== '계속(P)') return;
          let a, b;
          W.dialog(desk, { title: `${nm} 암호 설정`, w: 380, h: 220, owner: M.win, render: el => { a = W.text('', { pw: true }); b = W.text('', { pw: true }); el.append(W.form([['새 암호(N):', a], ['암호 확인(C):', b]], { cols: '100px 1fr' })); },
            buttons: [{ t: '확인', def: true, on: () => { if (a.value !== b.value) { W.msg(desk, { title: '로컬 사용자 및 그룹', text: '입력한 암호가 일치하지 않습니다.', icon: 'error' }); return false; } st.users[nm].pw = a.value; W.msg(desk, { title: '로컬 사용자 및 그룹', text: '암호가 설정되었습니다.', icon: 'info' }); } }, { t: '취소', cancel: true }] });
        });
      }
      function userProps(nm) {
        const u = st.users[nm];
        const groups = Object.entries(st.groups).filter(([, gg]) => gg.members.includes(nm)).map(([gn]) => gn);
        let fF, fD, cM, cC, cE, cB, Lg, fProf, fScr, rHome, fLocal, fDrv, fTo;
        const paintG = () => Lg.set(groups.map(gn => ({ id: gn, cells: [gn], icon: 'group' })));
        const commit = () => {
          if (cM.checked && cC.checked) { W.msg(desk, { title: '로컬 사용자 및 그룹', text: '[다음 로그온할 때 반드시 암호 변경]과 [사용자가 암호를 변경할 수 없음]을 함께 선택할 수 없습니다.', icon: 'error' }); return false; }
          Object.assign(u, { full: fF.value.trim(), desc: fD.value.trim(), mustChange: cM.checked, cannotChange: cC.checked, neverExpires: cE.checked, disabled: cB.checked, profile: fProf.value.trim(), script: fScr.value.trim(), homeMode: rHome.value, homeLocal: fLocal.value.trim(), homeDrive: fDrv.value, homeTo: fTo.value.trim() });
          Object.entries(st.groups).forEach(([gn, gg]) => { const want = groups.includes(gn), has = gg.members.includes(nm); if (want && !has) gg.members.push(nm); if (!want && has) gg.members = gg.members.filter(m => m !== nm); });
          M.refresh(); return true;
        };
        W.dialog(desk, { title: `${nm} 속성`, w: 440, h: 520, owner: M.win,
          render: el => {
            fF = W.text(u.full); fD = W.text(u.desc);
            cM = W.chk('다음 로그온할 때 반드시 암호 변경(M)', u.mustChange); cC = W.chk('사용자가 암호를 변경할 수 없음(C)', u.cannotChange); cE = W.chk('암호 사용 기간 제한 없음(P)', u.neverExpires); cB = W.chk('계정 사용 안 함(B)', u.disabled);
            cE.onToggle(() => { if (cE.checked) { cM.checked = false; cM.setDisabled(true); } else cM.setDisabled(false); }); if (u.neverExpires) cM.setDisabled(true);
            const gen = h('div', {}, h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } }, W.frag(g.icon('user')), h('b', {}, nm)), W.form([['전체 이름(F):', fF], ['설명(D):', fD]], { cols: '100px 1fr' }), h('div', { style: { height: '10px' } }), W.row(cM), W.row(cC), W.row(cE), W.row(cB), W.row(W.chk('계정 잠금 해제(O)', false, { dis: true })));
            Lg = W.list({ cols: [{ t: '', w: 300 }] }); paintG(); const th = Lg.el.querySelector('thead'); if (th) th.style.display = 'none';
            const mem = h('div', {}, W.label('소속 그룹(M):', { cls: 'l' }), h('div', { style: { height: '220px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, Lg.el),
              W.row(W.btn('추가(D)...', () => W.pickPrincipal(desk, { kind: '그룹', title: '그룹 선택', names: () => Object.keys(st.groups).map(n => ({ name: n, type: 'group', desc: st.groups[n].desc })), onOk: ns => { ns.forEach(n => { if (!groups.includes(n)) groups.push(n); }); paintG(); } })), W.btn('제거(R)', () => { const s = Lg.selected(); if (s) { groups.splice(groups.indexOf(s.id), 1); paintG(); } })),
              W.label('사용자의 그룹 구성원 자격에 대한 변경 내용은 다음에 사용자가 로그온할 때까지 적용되지 않습니다.', { cls: 'muted7' }));
            fProf = W.text(u.profile); fScr = W.text(u.script); rHome = W.radios([['local', '로컬 경로(O):'], ['connect', '연결(C):']], u.homeMode); fLocal = W.text(u.homeLocal); fDrv = W.select(['Z:', 'Y:', 'X:', 'W:', 'H:'], u.homeDrive, { w: 60 }); fTo = W.text(u.homeTo);
            const syncH = () => { fLocal.disabled = rHome.value !== 'local'; fDrv.disabled = fTo.disabled = rHome.value !== 'connect'; }; rHome.onChange(syncH); syncH();
            const prof = h('div', {}, W.group('사용자 프로필', W.form([['프로필 경로(P):', fProf], ['로그온 스크립트(L):', fScr]], { cols: '120px 1fr' })), W.group('홈 폴더', W.row(rHome.els[0], fLocal), W.row(rHome.els[1], fDrv, h('span', {}, '대상(T):'), fTo)));
            const none = t => h('div', {}, W.label(`이 연습 프로그램에서는 [${t}] 탭을 쓰지 않습니다.`));
            el.style.display = 'flex'; el.style.flexDirection = 'column';
            el.append(W.tabs([{ t: '일반', el: gen }, { t: '소속 그룹', el: mem }, { t: '프로필', el: prof }, { t: '환경', el: none('환경') }, { t: '세션', el: none('세션') }, { t: '원격 제어', el: none('원격 제어') }, { t: '원격 데스크톱 서비스 프로필', el: none('원격 데스크톱 서비스 프로필') }, { t: '전화 접속', el: none('전화 접속') }]).el);
          },
          buttons: [{ t: '확인', def: true, on: () => commit() }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { commit(); return false; } }, { t: '도움말', on: () => false }] });
      }
      function groupProps(gn) {
        const gg = st.groups[gn]; const members = gg.members.slice(); let fD, L;
        const paint = () => L.set(members.map(m => ({ id: m, cells: [m], icon: st.groups[m] ? 'group' : 'user' })));
        W.dialog(desk, { title: `${gn} 속성`, w: 420, h: 470, owner: M.win,
          render: el => {
            fD = W.text(gg.desc); L = W.list({ cols: [{ t: '', w: 300 }] }); paint(); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none';
            el.style.display = 'flex'; el.style.flexDirection = 'column';
            el.append(W.tabs([{ t: '일반', el: h('div', {}, h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } }, W.frag(g.icon('group')), h('b', {}, gn)), W.form([['설명(E):', fD]], { cols: '70px 1fr' }), W.label('구성원(M):', { cls: 'l' }), h('div', { style: { height: '200px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el), W.row(W.btn('추가(D)...', () => W.pickPrincipal(desk, { kind: '사용자', title: '사용자 선택', names: () => principals().filter(p => p.type === 'user'), onOk: ns => { ns.forEach(n => { if (!members.includes(n)) members.push(n); }); paint(); } })), W.btn('제거(R)', () => { const s = L.selected(); if (s) { members.splice(members.indexOf(s.id), 1); paint(); } })), W.label('사용자의 그룹 구성원 자격에 대한 변경 내용은 다음에 사용자가 로그온할 때까지 적용되지 않습니다.', { cls: 'muted7' })) }]).el);
          },
          buttons: [{ t: '확인', def: true, on: () => { gg.desc = fD.value.trim(); gg.members = members.slice(); M.refresh(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { gg.desc = fD.value.trim(); gg.members = members.slice(); M.refresh(); return false; } }, { t: '도움말', on: () => false }] });
      }
      function newGroup() {
        const members = []; let fN, fD, L;
        const paint = () => L.set(members.map(m => ({ id: m, cells: [m], icon: 'user' })));
        const dlg = W.dialog(desk, { title: '새 그룹', w: 420, h: 440, owner: M.win,
          render: el => { fN = W.text(''); fD = W.text(''); L = W.list({ cols: [{ t: '', w: 300 }] }); paint(); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none';
            el.append(W.form([['그룹 이름(G):', fN], ['설명(D):', fD]], { cols: '100px 1fr' }), W.label('구성원(M):', { cls: 'l' }), h('div', { style: { height: '170px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el), W.row(W.btn('추가(A)...', () => W.pickPrincipal(desk, { kind: '사용자', title: '사용자 선택', owner: dlg, names: () => principals().filter(p => p.type === 'user'), onOk: ns => { ns.forEach(n => { if (!members.includes(n)) members.push(n); }); paint(); } })), W.btn('제거(R)', () => { const s = L.selected(); if (s) { members.splice(members.indexOf(s.id), 1); paint(); } }))); },
          buttons: [{ t: '도움말(H)', left: true, on: () => false }, { t: '만들기(C)', def: true, on: () => {
            const name = fN.value.trim();
            if (!name) { W.msg(desk, { title: '로컬 사용자 및 그룹', text: '그룹 이름을 입력해야 합니다.', icon: 'error', owner: dlg }); return false; }
            if (BAD.test(name) || findKey(st.groups, name) || findKey(st.users, name)) { W.msg(desk, { title: '로컬 사용자 및 그룹', text: `${name} 그룹을 만들 수 없습니다. 같은 이름이 이미 있거나 사용할 수 없는 문자가 있습니다.`, icon: 'error', owner: dlg }); return false; }
            st.groups[name] = { desc: fD.value.trim(), members: members.slice() }; M.refresh();
            fN.value = ''; fD.value = ''; members.length = 0; paint(); return false;
          } }, { t: '닫기(O)', cancel: true }] });
      }
      const cls = (c, el) => { el.className = c; return el; };
      function open() {
        M = SIMS.mmc(desk, { title: '컴퓨터 관리', icon: 'computer', w: 860, h: 608, nodes, open: ['root', 'tools', 'lug'], sel: 'u', render, menu, leftW: 160, onClose: () => SIMS.closed(desk, open, '컴퓨터 관리') });
        M.win.el.classList.add('emu-acct', 'emu-usr');
        // +/− 상자를 에뮬레이터 그림으로: 펼친 항목에 .open 표시
        const markTg = () => M.tree.el.querySelectorAll('.tg').forEach(t => t.classList.toggle('open', t.textContent === '−'));
        new MutationObserver(markTg).observe(M.tree.el, { childList: true }); markTg();
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
