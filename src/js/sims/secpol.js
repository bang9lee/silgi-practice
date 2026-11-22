/* 가상 화면: 로컬 보안 정책 (secpol.msc) — 네트워크관리사·PC정비사 공용
 * 채점 키: pw.complexity, pw.history, pw.maxAge, pw.minLen, pw.minAge, pw.reversible,
 *          lock.duration, lock.threshold, lock.reset (해당 없음 = ''), audit.<id>.success / .failure, rights.<id>[], sec.<id> */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const PW = [
    { id: 'complexity', name: '암호는 복잡성을 만족해야 함', kind: 'bool', def: false, desc: '사용하면 암호에 영문 대문자, 영문 소문자, 숫자, 특수 문자 중 세 가지 이상을 섞고, 사용자 이름을 넣을 수 없습니다.' },
    { id: 'history', name: '최근 암호 기억', kind: 'num', def: 0, max: 24, unit: '개 암호 기억됨', text: '다음 개수의 최근 암호를 기억:', desc: '같은 암호를 다시 쓰지 못하게, 최근에 쓴 암호를 몇 개까지 기억할지 정합니다.' },
    { id: 'maxAge', name: '최대 암호 사용 기간', kind: 'num', def: 42, max: 999, unit: '일', text: '암호 사용 기간 만료:', desc: '암호를 최대 며칠 동안 쓸 수 있는지 정합니다. 0이면 만료되지 않습니다.' },
    { id: 'minLen', name: '최소 암호 길이', kind: 'num', def: 0, max: 14, unit: '문자', text: '암호는 최소한 다음 길이여야 함:', desc: '암호가 최소 몇 글자여야 하는지 정합니다.' },
    { id: 'minAge', name: '최소 암호 사용 기간', kind: 'num', def: 0, max: 998, unit: '일', text: '다음 기간 후 암호 변경 가능:', desc: '암호를 바꾼 뒤 최소 며칠이 지나야 다시 바꿀 수 있는지 정합니다.' },
    { id: 'reversible', name: '해독 가능한 암호화를 사용하여 암호 저장', kind: 'bool', def: false, desc: '사용하면 암호를 되돌릴 수 있는 방식으로 저장합니다. 보안상 사용하지 않습니다.' },
  ];
  const LOCK = [
    { id: 'duration', name: '계정 잠금 기간', kind: 'num', def: null, max: 99999, unit: '분', text: '계정 잠금 기간:', desc: '잠긴 계정이 자동으로 풀리기까지의 시간(분)입니다. 0이면 관리자가 풀 때까지 잠겨 있습니다.' },
    { id: 'threshold', name: '계정 잠금 임계값', kind: 'num', def: 0, max: 999, unit: '번의 잘못된 로그온 시도', text: '다음 이후 계정 잠금:', desc: '로그온을 몇 번 틀리면 계정을 잠글지 정합니다. 0이면 잠그지 않습니다.' },
    { id: 'reset', name: '다음 시간 후 계정 잠금 수를 원래대로 설정', kind: 'num', def: null, max: 99999, unit: '분', text: '다음 시간 후 계정 잠금 수를 원래대로 설정:', desc: '틀린 횟수를 0으로 되돌리기까지의 시간(분)입니다. 계정 잠금 기간보다 작거나 같아야 합니다.' },
  ];
  const AUDIT = [['objAccess', '개체 액세스 감사'], ['acctMgmt', '계정 관리 감사'], ['acctLogon', '계정 로그온 이벤트 감사'], ['privUse', '권한 사용 감사'], ['ds', '디렉터리 서비스 액세스 감사'], ['logon', '로그온 이벤트 감사'], ['system', '시스템 이벤트 감사'], ['policy', '정책 변경 감사'], ['process', '프로세스 추적 감사']];
  const RIGHTS = [
    ['netAccess', '네트워크에서 이 컴퓨터 액세스', ['Everyone', 'Administrators', 'Users', 'Backup Operators']],
    ['denyNet', '네트워크에서 이 컴퓨터 액세스 거부', []],
    ['logonLocal', '로컬 로그온 허용', ['Administrators', 'Backup Operators', 'Users']],
    ['denyLocal', '로컬 로그온 거부', []],
    ['rdp', '원격 데스크톱 서비스를 통한 로그온 허용', ['Administrators', 'Remote Desktop Users']],
    ['denyRdp', '원격 데스크톱 서비스를 통한 로그온 거부', []],
    ['shutdown', '시스템 종료', ['Administrators', 'Backup Operators']],
    ['remoteShutdown', '원격 시스템에서 강제로 시스템 종료', ['Administrators']],
    ['systime', '시스템 시간 변경', ['LOCAL SERVICE', 'Administrators']],
    ['timezone', '표준 시간대 변경', ['LOCAL SERVICE', 'Administrators']],
    ['backup', '파일 및 디렉터리 백업', ['Administrators', 'Backup Operators']],
    ['restore', '파일 및 디렉터리 복원', ['Administrators', 'Backup Operators']],
    ['ownership', '파일 또는 기타 개체의 소유권 가져오기', ['Administrators']],
    ['driver', '장치 드라이버 로드 및 언로드', ['Administrators']],
    ['auditLog', '감사 및 보안 로그 관리', ['Administrators']],
  ];
  const SEC = [
    ['guestStatus', '계정: Guest 계정 상태', 'bool', false],
    ['adminName', '계정: Administrator 계정 이름 바꾸기', 'text', 'Administrator'],
    ['guestName', '계정: Guest 계정 이름 바꾸기', 'text', 'Guest'],
    ['blankPw', '계정: 콘솔 로그온 시 로컬 계정에서 빈 암호 사용 제한', 'bool', true],
    ['noLastUser', '대화형 로그온: 마지막으로 로그온한 사용자 표시 안 함', 'bool', false],
    ['noCad', '대화형 로그온: <Ctrl+Alt+Del>을 사용할 필요 없음', 'bool', false],
    ['msgTitle', '대화형 로그온: 로그온을 시도하는 사용자에 대한 메시지 제목', 'text', ''],
    ['msgText', '대화형 로그온: 로그온을 시도하는 사용자에 대한 메시지 텍스트', 'text', ''],
    ['shutdownNoLogon', '시스템 종료: 로그온하지 않고 시스템 종료 허용', 'bool', false],
  ];
  const PRINCIPALS = ['Administrator', 'Guest', 'ICQAUSER', 'Administrators', 'Users', 'Guests', 'Backup Operators', 'Remote Desktop Users', 'Power Users', 'Everyone', 'Authenticated Users', 'LOCAL SERVICE', 'NETWORK SERVICE'];

  function blank() {
    const s = { pw: {}, lock: {}, audit: {}, rights: {}, sec: {} };
    PW.forEach(p => (s.pw[p.id] = p.def)); LOCK.forEach(p => (s.lock[p.id] = p.def));
    AUDIT.forEach(([id]) => (s.audit[id] = { success: false, failure: false }));
    RIGHTS.forEach(([id, , m]) => (s.rights[id] = m.slice())); SEC.forEach(([id, , , d]) => (s.sec[id] = d));
    return s;
  }
  function flat(st) {
    const o = {};
    PW.forEach(p => (o['pw.' + p.id] = st.pw[p.id])); LOCK.forEach(p => (o['lock.' + p.id] = st.lock[p.id] == null ? '' : st.lock[p.id]));
    AUDIT.forEach(([id]) => { o[`audit.${id}.success`] = st.audit[id].success; o[`audit.${id}.failure`] = st.audit[id].failure; });
    RIGHTS.forEach(([id]) => (o['rights.' + id] = st.rights[id].slice())); SEC.forEach(([id]) => (o['sec.' + id] = st.sec[id]));
    return o;
  }
  const LABELS = {};
  PW.forEach(p => (LABELS['pw.' + p.id] = '암호 정책 → ' + p.name)); LOCK.forEach(p => (LABELS['lock.' + p.id] = '계정 잠금 정책 → ' + p.name));
  AUDIT.forEach(([id, n]) => { LABELS[`audit.${id}.success`] = `${n} (성공)`; LABELS[`audit.${id}.failure`] = `${n} (실패)`; });
  RIGHTS.forEach(([id, n]) => (LABELS['rights.' + id] = '사용자 권한 할당 → ' + n)); SEC.forEach(([id, n]) => (LABELS['sec.' + id] = '보안 옵션 → ' + n));

  const showVal = (p, v) => (p.kind === 'bool' ? (v ? '사용' : '사용 안 함') : v == null ? '해당 없음' : `${v} ${p.unit}`);
  const auditText = a => (a.success && a.failure ? '성공, 실패' : a.success ? '성공' : a.failure ? '실패' : '감사 안 함');

  SIMS.def('secpol', {
    title: '로컬 보안 정책', labels: LABELS, blank, flat,
    mount(desk, q) {
      const st = blank();
      const init = (q && q.init) || {};
      ['pw', 'lock', 'sec'].forEach(k => Object.assign(st[k], init[k] || {}));
      Object.entries(init.audit || {}).forEach(([k, v]) => Object.assign(st.audit[k], v));
      Object.entries(init.rights || {}).forEach(([k, v]) => (st.rights[k] = v.slice()));
      let M;
      const nodes = () => [{ id: 'root', label: '보안 설정', icon: 'policy', kids: [
        { id: 'acct', label: '계정 정책', icon: 'folderPolicy', kids: [{ id: 'pw', label: '암호 정책', icon: 'folderPolicy' }, { id: 'lock', label: '계정 잠금 정책', icon: 'folderPolicy' }] },
        { id: 'local', label: '로컬 정책', icon: 'folderPolicy', kids: [{ id: 'audit', label: '감사 정책', icon: 'folderPolicy' }, { id: 'rights', label: '사용자 권한 할당', icon: 'folderPolicy' }, { id: 'sec', label: '보안 옵션', icon: 'folderPolicy' }] },
        { id: 'fw', label: '고급 보안이 포함된 Windows Defender 방화벽', icon: 'folderPolicy' }, { id: 'nl', label: '네트워크 목록 관리자 정책', icon: 'folderPolicy' }, { id: 'pk', label: '공개 키 정책', icon: 'folderPolicy' }, { id: 'srp', label: '소프트웨어 제한 정책', icon: 'folderPolicy' }, { id: 'acp', label: '응용 프로그램 제어 정책', icon: 'folderPolicy' }, { id: 'ipsec', label: 'IP 보안 정책(위치:로컬 컴퓨터)', icon: 'perm' }, { id: 'adv', label: '고급 감사 정책 구성', icon: 'folderPolicy' }] }];
      function rowsFor(id) {
        if (id === 'pw') return PW.map(p => ({ id: p.id, cells: [p.name, showVal(p, st.pw[p.id])], icon: 'policy', p, grp: 'pw' }));
        if (id === 'lock') return LOCK.map(p => ({ id: p.id, cells: [p.name, showVal(p, st.lock[p.id])], icon: 'policy', p, grp: 'lock' }));
        if (id === 'audit') return AUDIT.map(([a, n]) => ({ id: a, cells: [n, auditText(st.audit[a])], icon: 'policy', grp: 'audit', n }));
        if (id === 'rights') return RIGHTS.map(([a, n]) => ({ id: a, cells: [n, st.rights[a].join(',')], icon: 'policy', grp: 'rights', n }));
        if (id === 'sec') return SEC.map(([a, n, k]) => ({ id: a, cells: [n, k === 'bool' ? (st.sec[a] ? '사용' : '사용 안 함') : st.sec[a] || ''], icon: 'policy', grp: 'sec', n, k }));
        return null;
      }
      function render(n, el) {
        const rows = rowsFor(n.id);
        if (!rows) { const kids = (n.kids || []); const F = W.list({ cols: [{ t: '이름', w: 300 }, { t: '설명', w: 300 }], rows: kids.map(k => ({ id: k.id, cells: [k.label, ''], icon: 'folderPolicy' })), onDbl: r => M.select(r.id) }); F.el.classList.add('emu-ic', 'sec-folders'); el.append(F.el); return; }
        // 에뮬레이터: 맨 앞은 머리글이 빈 아이콘 칸, 처음 열면 맨 위 정책이 선택된 채로 보임
        const P = W.list({ cols: [{ t: '', w: 44 }, { t: '정책', w: 300 }, { t: '보안 설정', w: 150 }], rows: rows.map(r => ({ ...r, cells: ['', ...r.cells] })), onDbl: r => props(r), onContext: (r, e) => M.ctx([{ t: '속성(R)', b: true, on: () => props(r) }, '-', { t: '도움말(H)', dis: true }], e) });
        P.el.classList.add('emu-ic', 'sec-pol'); P.sel = rows[0].id; P.paint(); el.append(P.el);
      }
      function props(r) {
        const isAudit = r.grp === 'audit', isRight = r.grp === 'rights', isSec = r.grp === 'sec';
        const name = r.p ? r.p.name : r.n;
        let get;
        const local = h('div');
        if (r.grp === 'pw' || r.grp === 'lock') {
          const p = r.p, cur = st[r.grp][p.id];
          local.append(h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' } }, W.frag(g.icon('policy')), h('b', {}, p.name)));
          if (p.kind === 'bool') { const rd = W.radios([['1', '사용(E)'], ['0', '사용 안 함(S)']], cur ? '1' : '0'); local.append(W.row(rd.els[0]), W.row(rd.els[1])); get = () => rd.value === '1'; }
          else {
            const ndef = cur == null ? (p.id === 'duration' || p.id === 'reset' ? 30 : 0) : cur;
            const num = W.num(ndef, { min: 0, max: p.max, w: 70 });
            if (p.id === 'duration' || p.id === 'reset') { const c = W.chk('이 정책 설정 정의(D)', cur != null); local.append(W.row(c)); c.onToggle(() => (num.disabled = !c.checked)); num.disabled = cur == null; get = () => (c.checked ? +num.value : null); }
            else get = () => +num.value;
            local.append(W.label(p.text, { cls: 'l' }), W.row(num, h('span', {}, p.unit)));
            if (p.id === 'maxAge') local.append(W.label('0으로 하면 암호가 만료되지 않습니다.', { cls: 'muted7' }));
            if (p.id === 'duration') local.append(W.label('0으로 하면 관리자가 잠금을 해제할 때까지 잠깁니다.', { cls: 'muted7' }));
          }
        } else if (isAudit) {
          const a = st.audit[r.id]; const cS = W.chk('성공(S)', a.success), cF = W.chk('실패(F)', a.failure);
          local.append(h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' } }, W.frag(g.icon('policy')), h('b', {}, r.n)), W.label('다음 시도 감사:', { cls: 'l' }), W.row(cS), W.row(cF));
          get = () => ({ success: cS.checked, failure: cF.checked });
        } else if (isRight) {
          const members = st.rights[r.id].slice(); let L;
          const paint = () => L.set(members.map((m, i) => ({ id: 'm' + i, cells: [m], icon: /s$|Everyone|SERVICE|Users/.test(m) ? 'group' : 'user' })));
          L = W.list({ cols: [{ t: '', w: 320 }] }); paint(); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none';
          local.append(h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' } }, W.frag(g.icon('policy')), h('b', {}, r.n)), h('div', { style: { height: '170px', border: '1px solid #828790', background: '#fff', overflow: 'auto' } }, L.el),
            W.row(W.btn('사용자 또는 그룹 추가(U)...', () => W.pickPrincipal(desk, { owner: dlg, kind: '사용자 또는 그룹', names: () => PRINCIPALS.map(n => ({ name: n, type: /s$|Everyone|SERVICE/.test(n) && n !== 'Administrator' ? 'group' : 'user' })), onOk: ns => { ns.forEach(n => { if (!members.includes(n)) members.push(n); }); paint(); } })), W.btn('제거(R)', () => { const s = L.selected(); if (s) { members.splice(+s.id.slice(1), 1); paint(); } })));
          get = () => members.slice();
        } else if (isSec) {
          const cur = st.sec[r.id];
          local.append(h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' } }, W.frag(g.icon('policy')), h('b', {}, r.n)));
          if (r.k === 'bool') { const rd = W.radios([['1', '사용(E)'], ['0', '사용 안 함(S)']], cur ? '1' : '0'); local.append(W.row(rd.els[0]), W.row(rd.els[1])); get = () => rd.value === '1'; }
          else { const t = W.text(cur || '', { multi: r.id === 'msgText', rows: 4 }); local.append(t); get = () => t.value; }
        }
        const descT = h('div', { class: 'hint7' }, (r.p && r.p.desc) || `${name} 정책입니다.`);
        const dlg = W.dialog(desk, { title: `${name} 속성`, w: 420, h: 450, owner: M.win,
          render: el => { el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(W.tabs([{ t: '로컬 보안 설정', el: local }, { t: '설명', el: h('div', {}, h('b', {}, name), descT) }]).el); },
          buttons: [{ t: '확인', def: true, on: () => commit(false) }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { commit(true); return false; } }] });
        function commit() {
          const v = get();
          if (r.grp === 'pw') {
            const n = { ...st.pw, [r.id]: v };
            if (r.p.kind === 'num' && (v < 0 || v > r.p.max || !Number.isFinite(v))) { W.msg(desk, { title: '로컬 보안 정책', text: `값은 0부터 ${r.p.max}까지입니다.`, icon: 'error', owner: dlg }); return false; }
            if (n.maxAge !== 0 && n.minAge >= n.maxAge) { W.msg(desk, { title: '로컬 보안 정책', text: '최소 암호 사용 기간은 최대 암호 사용 기간보다 짧아야 합니다.', icon: 'error', owner: dlg }); return false; }
            st.pw = n;
          } else if (r.grp === 'lock') {
            if (v != null && (v < 0 || v > r.p.max || !Number.isFinite(v))) { W.msg(desk, { title: '로컬 보안 정책', text: `값은 0부터 ${r.p.max}까지입니다.`, icon: 'error', owner: dlg }); return false; }
            if (r.id === 'threshold') {
              const before = st.lock.threshold;
              if (v > 0 && (st.lock.duration == null || st.lock.reset == null)) {
                // Windows처럼 "제안된 값 변경" 상자를 띄웁니다.
                suggest(before, v); return false;
              }
              st.lock.threshold = v; if (!v) { st.lock.duration = null; st.lock.reset = null; }
            } else {
              if (st.lock.threshold === 0 && v != null) { W.msg(desk, { title: '로컬 보안 정책', text: '계정 잠금 임계값이 0(계정 잠그지 않음)이므로 이 정책은 의미가 없습니다.\n먼저 계정 잠금 임계값을 설정하십시오.', icon: 'warn', owner: dlg }); return false; }
              const n = { ...st.lock, [r.id]: v };
              if (n.duration != null && n.reset != null && n.duration !== 0 && n.reset > n.duration) { W.msg(desk, { title: '로컬 보안 정책', text: '[다음 시간 후 계정 잠금 수를 원래대로 설정] 값은 [계정 잠금 기간] 값보다 작거나 같아야 합니다.', icon: 'error', owner: dlg }); return false; }
              st.lock = n;
            }
          } else if (r.grp === 'audit') st.audit[r.id] = v;
          else if (r.grp === 'rights') st.rights[r.id] = v;
          else if (r.grp === 'sec') st.sec[r.id] = v;
          M.refresh();
          return true;
        }
        function suggest(before, v) {
          const sd = st.lock.duration ?? 30, sr = st.lock.reset ?? 30;
          W.dialog(desk, { title: '제안된 값 변경', w: 470, h: 300, owner: dlg,
            render: el => { el.append(W.label(`계정 잠금 임계값 값이 ${before}에서 ${v}번의 잘못된 로그온 시도로 변경되었으므로 다음 항목의 설정이 제안 값으로 변경됩니다.`), h('div', { style: { height: '90px', border: '1px solid #828790', background: '#fff' } }, W.list({ cols: [{ t: '정책', w: 270 }, { t: '데이터베이스 설정', w: 80 }, { t: '제안된 설정', w: 80 }], rows: [{ id: 'd', cells: ['계정 잠금 기간', st.lock.duration == null ? '해당 없음' : `${st.lock.duration}분`, `${sd}분`], icon: 'policy' }, { id: 'r', cells: ['다음 시간 후 계정 잠금 수를 원래대로 설정', st.lock.reset == null ? '해당 없음' : `${st.lock.reset}분`, `${sr}분`], icon: 'policy' }] }).el)); },
            buttons: [{ t: '확인', def: true, on: () => { st.lock.threshold = v; st.lock.duration = sd; st.lock.reset = sr; M.refresh(); setTimeout(() => dlg.close(true), 0); } }, { t: '취소', cancel: true }] });
        }
      }
      function open() {
        M = SIMS.mmc(desk, { title: '로컬 보안 정책', icon: 'policy', w: 864, h: 572, nodes, open: ['root', 'acct', 'local'], sel: 'pw', render, menu: n => (rowsFor(n.id) ? [{ t: '새로 고침(F)', on: () => M.refresh() }] : null), leftW: 160, onClose: () => SIMS.closed(desk, open, '로컬 보안 정책') });
        M.win.el.classList.add('emu-acct', 'emu-sec');
        // +/− 상자를 에뮬레이터 그림으로: 펼친 항목에 .open 표시
        const markTg = () => M.tree.el.querySelectorAll('.tg').forEach(t => t.classList.toggle('open', t.textContent === '−'));
        new MutationObserver(markTg).observe(M.tree.el, { childList: true }); markTg();
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
