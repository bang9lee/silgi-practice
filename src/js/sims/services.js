/* 가상 화면: 서비스 (services.msc) — 서비스 속성(시작 유형, 시작/중지), 오른쪽 클릭 메뉴
 * 채점 키: svc.<서비스 이름>.start (자동/자동(지연된 시작)/수동/사용 안 함), svc.<서비스 이름>.status (running/stopped)
 * 시작/중지 버튼은 누르는 즉시 반영되고, 시작 유형은 [확인]이나 [적용]을 눌러야 반영됩니다(실제 Windows와 같음). */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const T = ['자동(지연된 시작)', '자동', '수동', '사용 안 함'];
  // [서비스 이름, 표시 이름, 설명, 상태(1=실행 중), 시작 유형, 로그온]
  const LIST = [
    ['AxInstSV', 'ActiveX Installer (AxInstSV)', '인터넷을 통해 ActiveX 컨트롤을 설치하기 위한 사용자 계정 컨트롤 유효성 검사를 제공합니다.', 0, '수동', 'Local System'],
    ['AppIDSvc', 'Application Identity', '응용 프로그램의 ID를 확인하고 검증합니다.', 0, '수동', 'Local Service'],
    ['Appinfo', 'Application Information', '추가적인 관리 권한으로 대화형 응용 프로그램을 실행할 수 있도록 합니다.', 1, '수동', 'Local System'],
    ['BITS', 'Background Intelligent Transfer Service', '유휴 네트워크 대역폭을 사용하여 백그라운드에서 파일을 전송합니다.', 0, '수동', 'Local System'],
    ['BFE', 'Base Filtering Engine', 'BFE(기본 필터링 엔진)는 방화벽 및 IPsec 정책을 관리하는 서비스입니다.', 1, '자동', 'Local Service'],
    ['bthserv', 'Bluetooth 지원 서비스', 'Bluetooth 서비스는 원격 Bluetooth 장치의 검색 및 연결을 지원합니다.', 0, '수동', 'Local Service'],
    ['EventSystem', 'COM+ Event System', 'SENS(System Event Notification Service)를 지원합니다.', 1, '자동', 'Local Service'],
    ['Dhcp', 'DHCP Client', '이 컴퓨터의 IP 주소를 등록하고 업데이트합니다.', 1, '자동', 'Local Service'],
    ['DHCPServer', 'DHCP 서버', 'DHCP(Dynamic Host Configuration Protocol) 클라이언트에 IP 주소를 자동으로 할당합니다.', 1, '자동', 'Network Service'],
    ['Dnscache', 'DNS Client', 'DNS 클라이언트 서비스는 DNS 이름을 확인하여 캐시에 저장합니다.', 1, '자동', 'Network Service'],
    ['DNS', 'DNS 서버', 'DNS 서버가 DNS 이름에 대한 쿼리와 업데이트 요청에 응답하도록 합니다.', 1, '자동', 'Local System'],
    ['IISADMIN', 'IIS Admin Service', '이 서버가 FTP 메타베이스 같은 IIS 구성을 관리할 수 있게 합니다.', 1, '자동', 'Local System'],
    ['FTPSVC', 'Microsoft FTP Service', '이 서버를 FTP(File Transfer Protocol) 서버로 사용할 수 있게 합니다.', 1, '자동', 'Local System'],
    ['Netlogon', 'Netlogon', '사용자 및 서비스 인증을 위해 이 컴퓨터와 도메인 컨트롤러 간에 보안 채널을 유지합니다.', 0, '수동', 'Local System'],
    ['Spooler', 'Print Spooler', '이 서비스는 인쇄 작업을 스풀링하고 프린터와의 상호 작용을 처리합니다.', 1, '자동', 'Local System'],
    ['RemoteAccess', 'Routing and Remote Access', 'LAN 및 WAN 환경에서 라우팅 서비스를 제공합니다.', 0, '사용 안 함', 'Local System'],
    ['RemoteRegistry', 'Remote Registry', '원격 사용자가 이 컴퓨터의 레지스트리 설정을 수정할 수 있게 합니다.', 0, '자동(지연된 시작)', 'Local Service'],
    ['TermService', 'Remote Desktop Services', '사용자가 원격 컴퓨터에 대화형으로 연결할 수 있게 합니다.', 1, '수동', 'Network Service'],
    ['LanmanServer', 'Server', '이 컴퓨터에서 네트워크를 통한 파일, 인쇄 및 명명된 파이프 공유를 지원합니다.', 1, '자동', 'Local System'],
    ['SNMP', 'SNMP 서비스', 'SNMP(Simple Network Management Protocol) 요청을 이 컴퓨터에서 처리할 수 있게 합니다.', 1, '자동', 'Local System'],
    ['Schedule', 'Task Scheduler', '사용자가 이 컴퓨터에서 자동화된 작업을 구성하고 예약할 수 있도록 합니다.', 1, '자동', 'Local System'],
    ['TlntSvr', 'Telnet', '원격 사용자가 이 컴퓨터에 로그온하여 프로그램을 실행할 수 있게 하며, 다양한 TCP/IP Telnet 클라이언트를 지원합니다.', 1, '자동', 'Local System'],
    ['mpssvc', 'Windows Defender Firewall', 'Windows Defender 방화벽은 인터넷이나 네트워크를 통해 권한 없는 사용자가 컴퓨터에 액세스하는 것을 방지합니다.', 1, '자동', 'Local Service'],
    ['EventLog', 'Windows Event Log', '이벤트 및 이벤트 로그를 관리합니다.', 1, '자동', 'Local Service'],
    ['WinRM', 'Windows Remote Management (WS-Management)', 'WS-Management 프로토콜을 구현합니다.', 1, '자동', 'Network Service'],
    ['W32Time', 'Windows Time', '네트워크의 모든 클라이언트와 서버에서 날짜 및 시간 동기화를 유지 관리합니다.', 1, '수동', 'Local Service'],
    ['wuauserv', 'Windows Update', 'Windows 및 기타 프로그램에 대한 업데이트를 검색, 다운로드 및 설치합니다.', 0, '수동', 'Local System'],
    ['LanmanWorkstation', 'Workstation', 'SMB 프로토콜을 사용하여 원격 서버에 대한 클라이언트 네트워크 연결을 만들고 유지 관리합니다.', 1, '자동', 'Network Service'],
    ['W3SVC', 'World Wide Web 게시 서비스', 'IIS 관리자를 통해 웹 연결 및 관리를 제공합니다.', 1, '자동', 'Local System'],
    // 에뮬레이터처럼 목록을 길게 보이게 하는 나머지 서비스(문제에는 쓰지 않음)
    ['adfssrv', 'ADFS(Active Directory Federation Services)', 'ADFS(Active Directory Federation Services)는 웹 응용 프로그램에 대한 페더레이션 인증을 제공합니다.', 0, '수동', 'Network Service'],
    ['AJRouter', 'AllJoyn Router Service', '로컬 AllJoyn 클라이언트에 대한 AllJoyn 메시지를 라우팅합니다.', 0, '수동', 'Local Service'],
    ['AppReadiness', 'App Readiness', '사용자가 이 PC에 처음 로그인할 때와 새 앱을 추가할 때 앱을 사용할 수 있도록 준비합니다.', 0, '수동', 'Local System'],
    ['AppHostSvc', 'Application Host Helper Service', 'IIS에 대한 관리 서비스(구성 기록, 응용 프로그램 풀 계정 매핑 등)를 제공합니다.', 1, '자동', 'Local System'],
    ['ALG', 'Application Layer Gateway Service', '인터넷 연결 공유에 대한 타사 프로토콜 플러그 인을 지원합니다.', 0, '수동', 'Local Service'],
    ['AppMgmt', 'Application Management', '그룹 정책을 통해 배포된 소프트웨어에 대한 설치, 제거 및 열거 요청을 처리합니다.', 0, '수동', 'Local System'],
    ['AppXSvc', 'AppX Deployment Service (AppXSVC)', '저장소 응용 프로그램 배포를 위한 인프라를 지원합니다.', 0, '수동', 'Local System'],
    ['aspnet_state', 'ASP.NET State Service', 'Provides support for out-of-process session states for ASP.NET.', 0, '수동', 'Network Service'],
    ['BrokerInfrastructure', 'Background Tasks Infrastructure Service', '시스템에서 실행할 수 있는 백그라운드 작업을 제어하는 Windows 인프라 서비스입니다.', 1, '자동', 'Local System'],
    ['CertPropSvc', 'Certificate Propagation', '스마트 카드의 사용자 인증서와 루트 인증서를 현재 사용자의 인증서 저장소로 복사합니다.', 0, '수동', 'Local System'],
    ['ClipSVC', 'Client License Service (ClipSVC)', 'Microsoft Store에 대한 인프라 지원을 제공합니다.', 0, '수동', 'Local System'],
    ['KeyIso', 'CNG Key Isolation', 'CNG 키 격리 서비스는 LSA 프로세스에서 호스팅됩니다.', 1, '수동', 'Local System'],
    ['COMSysApp', 'COM+ System Application', 'COM+ 기반 구성 요소의 구성 및 추적을 관리합니다.', 0, '수동', 'Local System'],
    ['Browser', 'Computer Browser', '네트워크에 있는 컴퓨터의 업데이트된 목록을 유지 관리하고 이 목록을 브라우저로 지정된 컴퓨터에 제공합니다.', 0, '사용 안 함', 'Local System'],
    ['CryptSvc', 'Cryptographic Services', '카탈로그 데이터베이스, 루트 인증서, 키 서비스를 관리합니다.', 1, '자동', 'Network Service'],
    ['DcomLaunch', 'DCOM Server Process Launcher', 'DCOMLAUNCH 서비스는 개체 활성화 요청에 대한 응답으로 COM 및 DCOM 서버를 시작합니다.', 1, '자동', 'Local System'],
    ['TrkWks', 'Distributed Link Tracking Client', '컴퓨터 내 또는 네트워크의 컴퓨터 간에 NTFS 파일 사이의 링크를 유지 관리합니다.', 1, '자동', 'Local System'],
    ['MSDTC', 'Distributed Transaction Coordinator', '데이터베이스, 메시지 큐, 파일 시스템 등 여러 리소스 관리자에 걸친 트랜잭션을 조정합니다.', 1, '자동(지연된 시작)', 'Network Service'],
    ['gpsvc', 'Group Policy Client', '관리자가 구성 요소 정책 영역을 통해 적용한 설정을 적용합니다.', 1, '자동', 'Local System'],
    ['IKEEXT', 'IKE and AuthIP IPsec Keying Modules', 'IKEEXT 서비스는 IKE(인터넷 키 교환) 및 AuthIP 키 모듈을 호스팅합니다.', 1, '자동', 'Local System'],
    ['iphlpsvc', 'IP Helper', 'IPv6 전환 기술과 IP-HTTPS를 사용하여 터널 연결을 제공합니다.', 1, '자동', 'Local System'],
    ['PolicyAgent', 'IPsec Policy Agent', 'IPsec(인터넷 프로토콜 보안)은 네트워크 수준 피어 인증과 데이터 무결성을 지원합니다.', 0, '수동', 'Network Service'],
    ['NlaSvc', 'Network Location Awareness', '네트워크 구성 정보를 수집 및 저장하고 이 정보가 수정되면 프로그램에 알립니다.', 1, '자동', 'Network Service'],
    ['nsi', 'Network Store Interface Service', '이 서비스는 사용자 모드 클라이언트에 네트워크 알림을 배달합니다.', 1, '자동', 'Local Service'],
    ['PlugPlay', 'Plug and Play', '사용자 입력이 거의 또는 전혀 없이 컴퓨터가 하드웨어 변경을 인식하고 적응할 수 있게 합니다.', 1, '수동', 'Local System'],
    ['RpcSs', 'Remote Procedure Call (RPC)', 'RPCSS 서비스는 COM 및 DCOM 서버의 서비스 제어 관리자입니다.', 1, '자동', 'Network Service'],
    ['SamSs', 'Security Accounts Manager', '이 서비스를 시작하면 SAM(보안 계정 관리자)이 준비되었음을 다른 서비스에 알립니다.', 1, '자동', 'Local System'],
    ['ShellHWDetection', 'Shell Hardware Detection', '자동 실행 하드웨어 이벤트에 대한 알림을 제공합니다.', 1, '자동', 'Local System'],
    ['SSDPSRV', 'SSDP Discovery', 'SSDP 검색 프로토콜을 사용하는 네트워크 장치 및 서비스(예: UPnP 장치)를 검색합니다.', 0, '사용 안 함', 'Local Service'],
    ['SENS', 'System Event Notification Service', '시스템 이벤트를 모니터링하고 이러한 이벤트를 COM+ 이벤트 시스템 구독자에게 알립니다.', 1, '자동', 'Local System'],
    ['Themes', 'Themes', '사용자 경험 테마 관리를 제공합니다.', 1, '자동', 'Local System'],
    ['UserManager', 'User Manager', '사용자 관리자는 다중 사용자 상호 작용에 필요한 런타임 구성 요소를 제공합니다.', 1, '자동', 'Local System'],
    ['Winmgmt', 'Windows Management Instrumentation', '운영 체제, 장치, 응용 프로그램 및 서비스에 대한 관리 정보에 액세스하는 공통 인터페이스와 개체 모델을 제공합니다.', 1, '자동', 'Local System'],
  ];
  // 에뮬레이터처럼 표시 이름 순(대소문자 무시)으로 늘어놓습니다.
  LIST.sort((a, b) => { const x = a[1].toUpperCase(), y = b[1].toUpperCase(); return x < y ? -1 : x > y ? 1 : 0; });
  const blank = () => { const s = {}; LIST.forEach(([k, , , run, st]) => (s[k] = { start: st, run: !!run })); return s; };
  const flat = st => { const o = {}; for (const [k, v] of Object.entries(st)) { o[`svc.${k}.start`] = v.start; o[`svc.${k}.status`] = v.run ? 'running' : 'stopped'; } return o; };
  const LABELS = {}; LIST.forEach(([k, d]) => { LABELS[`svc.${k}.start`] = `${d} → 시작 유형`; LABELS[`svc.${k}.status`] = `${d} → 서비스 상태`; });
  const byKey = Object.fromEntries(LIST.map(x => [x[0], x]));

  SIMS.def('services', {
    title: '서비스', labels: LABELS, blank, flat, list: LIST,
    mount(desk, q) {
      const st = blank();
      Object.entries((q && q.init) || {}).forEach(([k, v]) => Object.assign(st[k] || (st[k] = {}), v));
      let M, L, descPane, selKey = null;
      const statusText = k => (st[k].run ? '실행 중' : '중지됨');
      // 목록의 [상태] 칸: 네트워크관리사 에뮬레이터는 실행 중/중지됨, PC정비사 에뮬레이터는 시작됨/(빈칸)
      const pc = !!(q && q.exam === 'pc');
      const listStatus = k => (pc ? (st[k].run ? '시작됨' : '') : statusText(k));
      async function startSvc(k, owner) {
        if (st[k].start === '사용 안 함') { await W.msg(desk, { title: '서비스', text: `로컬 컴퓨터의 ${byKey[k][1]} 서비스를 시작할 수 없습니다.\n\n오류 1058: 서비스를 시작할 수 없습니다. 서비스가 사용되지 않도록 설정되었거나 연결된 활성 장치가 없습니다.`, icon: 'error', owner }); return false; }
        st[k].run = true; paint(); return true;
      }
      function stopSvc(k) { st[k].run = false; paint(); }
      function ctxItems(k) { return [{ t: '시작(S)', dis: st[k].run, on: () => startSvc(k, M.win) }, { t: '중지(O)', dis: !st[k].run, on: () => stopSvc(k) }, { t: '일시 중지(U)', dis: true }, { t: '계속(M)', dis: true }, { t: '다시 시작(E)', dis: !st[k].run, on: () => { stopSvc(k); startSvc(k, M.win); } }, '-', { t: '모든 작업(K)', sub: [{ t: '새로 고침', on: paint }] }, '-', { t: '새로 고침(F)', on: paint }, '-', { t: '속성(R)', b: true, on: () => props(k) }, '-', { t: '도움말(H)', dis: true }]; }
      function paint() {
        if (!L) return;
        L.set(LIST.map(([k, d, ds, , , lo]) => ({ id: k, cells: ['', d, ds, listStatus(k), st[k].start, lo], icon: 'service' })));
        paintDesc();
      }
      function paintDesc() {
        descPane.innerHTML = '';
        if (!selKey) { descPane.append(h('b', { class: 'hint' }, '설명이 필요한 항목을 선택하십시오.'), h('p', {}, '설명:')); return; }
        const [k, d, ds] = byKey[selKey];
        const link = (t, fn) => h('a', { href: '#', style: { color: '#0645ad' }, onclick: e => { e.preventDefault(); fn(); } }, t);
        descPane.append(h('b', { style: { fontSize: '14px' } }, d), h('p', {}, st[k].run ? [link('서비스 중지', () => stopSvc(k)), h('br'), link('서비스 다시 시작', () => { stopSvc(k); startSvc(k, M.win); })] : link('서비스 시작', () => startSvc(k, M.win))), h('p', {}, '설명:'), h('p', {}, ds));
      }
      function render(n, el) {
        descPane = h('div', { class: 'svc-desc' });
        // 에뮬레이터: 맨 앞 칸은 머리글이 빈 아이콘 칸, 이름 칸에 정렬 화살표
        L = W.list({ cols: [{ t: '', w: 19 }, { t: '이름', w: 151 }, { t: '설명', w: 100 }, { t: '상태', w: 100 }, { t: '시작 유형', w: 100 }, { t: '다음 사용자로 로그온', w: 130 }], onSelect: r => { selKey = r.id; paintDesc(); }, onDbl: r => props(r.id), onContext: (r, e) => { selKey = r.id; paintDesc(); M.ctx(ctxItems(r.id), e); } });
        el.style.display = 'flex'; el.append(descPane, h('div', { class: 'svc-listbox' }, L.el));
        L.sel = LIST[0][0]; // 처음 열면 맨 위 줄이 선택된 채로 보입니다(설명 칸은 비어 있음).
        paint();
      }
      function props(k) {
        const [, d, ds] = byKey[k];
        let sel, stEl, bS, bT;
        const upd = () => { stEl.textContent = statusText(k); bS.disabled = st[k].run; bT.disabled = !st[k].run; };
        const dlg = W.dialog(desk, { title: `${d} 속성(로컬 컴퓨터)`, w: 430, h: 490, owner: M.win,
          render: el => {
            sel = W.select(T, st[k].start, { w: 220 }); stEl = h('span'); bS = W.btn('시작(S)', async () => { await startSvc(k, dlg); upd(); }); bT = W.btn('중지(T)', () => { stopSvc(k); upd(); });
            const gen = h('div', {}, W.form([['서비스 이름:', h('span', {}, k)], ['표시 이름:', W.text(d, { ro: true })], ['설명:', W.text(ds, { ro: true, multi: true, rows: 3 })]], { cols: '100px 1fr' }),
              W.label('실행 파일 경로:', { cls: 'l' }), W.text(`C:\\Windows\\system32\\svchost.exe -k ${k}`, { ro: true }),
              h('div', { class: 'row7', style: { margin: '12px 0' } }, h('span', { style: { width: '100px' } }, '시작 유형(E):'), sel),
              h('div', { style: { borderTop: '1px solid #ddd', margin: '6px 0' } }),
              W.row(h('span', { style: { width: '100px' } }, '서비스 상태:'), stEl), W.row(bS, bT, W.btn('일시 중지(P)', null, { dis: true }), W.btn('계속(R)', null, { dis: true })),
              W.label('여기서 서비스를 시작할 때 적용할 시작 매개 변수를 지정할 수 있습니다.', { cls: 'muted7' }), W.row(h('span', {}, '시작 매개 변수(M):'), W.text('', { dis: true })));
            el.style.display = 'flex'; el.style.flexDirection = 'column';
            el.append(W.tabs([{ t: '일반', el: gen }, { t: '로그온', el: h('div', {}, W.label('다음 계정으로 로그온:'), W.text(byKey[k][5], { ro: true })) }, { t: '복구', el: h('div', {}, W.label('이 연습 프로그램에서는 복구 탭을 쓰지 않습니다.')) }, { t: '종속성', el: h('div', {}, W.label('이 연습 프로그램에서는 종속성 탭을 쓰지 않습니다.')) }]).el);
            upd();
          },
          buttons: [{ t: '확인', def: true, on: () => { st[k].start = sel.value; paint(); } }, { t: '취소', cancel: true }, { t: '적용(A)', on: () => { st[k].start = sel.value; paint(); return false; } }] });
      }
      function open() {
        L = null;
        M = SIMS.mmc(desk, { title: '서비스', icon: 'service', w: 982, h: 604, nodes: [{ id: 'svc', label: '서비스(로컬)', icon: 'service' }], sel: 'svc', render, menu: () => (selKey ? ctxItems(selKey) : null), leftW: 182, onClose: () => SIMS.closed(desk, open, '서비스') });
        M.win.el.classList.add('emu-acct', 'emu-svc');
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
