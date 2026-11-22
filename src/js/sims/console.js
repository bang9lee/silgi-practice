/* 가상 화면: 명령 프롬프트 (cmd.exe) — 시험에 자주 나오는 명령의 출력을 흉내 냅니다.
 * 채점: 입력한 명령 기록 중에 정답 명령이 있는지 (grader.gradeConsole). 출력 내용은 연습용 예시입니다. */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const NET = { host: 'ICQAPC', ip: '192.168.0.10', mask: '255.255.255.0', gw: '192.168.0.1', dns: ['168.126.63.1', '168.126.63.2'], mac: '00-1A-2B-3C-4D-5E', ll: 'fe80::1c2d:3e4f:5a6b:7c8d%12' };
  const HOSTS = { 'www.icqa.or.kr': '203.0.113.10', 'icqa.or.kr': '203.0.113.10', 'www.google.com': '142.250.206.228', 'google.com': '142.250.206.238', 'www.naver.com': '223.130.200.104', 'naver.com': '223.130.200.107', 'localhost': '127.0.0.1' };
  const isIp = s => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
  const resolve = s => (isIp(s) ? s : HOSTS[s.toLowerCase()] || null);
  const pad = (s, n) => String(s).padEnd(n);
  const GUI = { msconfig: '시스템 구성', regedit: '레지스트리 편집기', regedt32: '레지스트리 편집기', 'devmgmt.msc': '장치 관리자', 'diskmgmt.msc': '디스크 관리', 'compmgmt.msc': '컴퓨터 관리', 'services.msc': '서비스', 'eventvwr': '이벤트 뷰어', 'eventvwr.msc': '이벤트 뷰어', 'gpedit.msc': '로컬 그룹 정책 편집기', 'secpol.msc': '로컬 보안 정책', 'lusrmgr.msc': '로컬 사용자 및 그룹', msinfo32: '시스템 정보', dxdiag: 'DirectX 진단 도구', mstsc: '원격 데스크톱 연결', taskmgr: '작업 관리자', perfmon: '성능 모니터', resmon: '리소스 모니터', control: '제어판', 'ncpa.cpl': '네트워크 연결', 'sysdm.cpl': '시스템 속성', 'appwiz.cpl': '프로그램 및 기능', 'firewall.cpl': 'Windows Defender 방화벽', 'main.cpl': '마우스 속성', 'desk.cpl': '디스플레이 설정', 'powercfg.cpl': '전원 옵션', 'inetcpl.cpl': '인터넷 속성', notepad: '메모장', calc: '계산기', mspaint: '그림판', explorer: '파일 탐색기', winver: 'Windows 정보', cleanmgr: '디스크 정리', dfrgui: '드라이브 최적화', 'taskschd.msc': '작업 스케줄러', 'certmgr.msc': '인증서 관리자', 'printmanagement.msc': '인쇄 관리' };

  function run(line, ctx) {
    const raw = line.trim();
    if (!raw) return '';
    const tk = raw.split(/\s+/); const c = tk[0].toLowerCase().replace(/\.exe$/, ''); const args = tk.slice(1); const low = args.map(a => a.toLowerCase());
    const has = (...o) => low.some(a => o.includes(a));
    const opt = (o) => { const i = low.findIndex(a => a === o); return i >= 0 ? args[i + 1] : null; };
    const target = () => args.filter((a, i) => !/^[-/]/.test(a) && !/^[-/]/.test(args[i - 1] || '') || (/^[-/]/.test(args[i - 1] || '') && !/^[-/][nlwhij]$/i.test(args[i - 1]) && !/^[-/]/.test(a))).pop();
    switch (c) {
      case 'cls': ctx.clear(); return null;
      case 'exit': ctx.exit(); return null;
      case 'ver': return '\nMicrosoft Windows [Version 6.2.9200]\n';
      case 'hostname': return NET.host;
      case 'whoami': return `${NET.host.toLowerCase()}\\icqa`;
      case 'echo': return raw.slice(4).trim() || 'ECHO가 설정되어 있습니다.';
      case 'date': return has('/t') ? '2026-12-06 일' : '현재 날짜: 2026-12-06 일\n(연습창) 날짜는 바꾸지 않습니다.';
      case 'time': return has('/t') ? '09:20' : '현재 시간:  9:20:00.00\n(연습창) 시간은 바꾸지 않습니다.';
      case 'help': return '특정 명령어에 대한 자세한 내용은 HELP 명령어 이름을 입력하십시오.\nARP · ATTRIB · CD · CHKDSK · CLS · CONVERT · DATE · DIR · ECHO · EXIT · FORMAT · GETMAC · HOSTNAME · IPCONFIG · NBTSTAT · NET · NETSTAT · NSLOOKUP · PATHPING · PING · ROUTE · SFC · SHUTDOWN · SYSTEMINFO · TASKKILL · TASKLIST · TIME · TRACERT · VER · WHOAMI\n(연습창에서 출력을 흉내 내는 명령 목록입니다.)';
      case 'cd': return args.length ? '(연습창) 폴더 이동은 하지 않습니다.' : 'C:\\';
      case 'dir': return ' C 드라이브의 볼륨에는 이름이 없습니다.\n 볼륨 일련 번호: 5A3C-1F2E\n\n C:\\ 디렉터리\n\n2026-11-30  오전 09:12    <DIR>          PerfLogs\n2026-12-01  오후 02:40    <DIR>          Program Files\n2026-12-01  오후 02:41    <DIR>          Program Files (x86)\n2026-12-05  오전 10:03    <DIR>          Users\n2026-12-05  오전 10:05    <DIR>          Windows\n               0개 파일                   0 바이트\n               5개 디렉터리  152,328,192,000 바이트 남음';
      case 'ipconfig': {
        if (has('/release', '-release')) return `\nWindows IP 구성\n\n이더넷 어댑터 이더넷:\n\n   연결별 DNS 접미사. . . . :\n   링크-로컬 IPv6 주소 . . . . : ${NET.ll}\n   기본 게이트웨이 . . . . . . :\n(연습창) DHCP로 받은 IP를 반납했습니다.`;
        if (has('/renew', '-renew')) return `\nWindows IP 구성\n\n이더넷 어댑터 이더넷:\n\n   IPv4 주소 . . . . . . . . . : ${NET.ip}\n   서브넷 마스크 . . . . . . . : ${NET.mask}\n   기본 게이트웨이 . . . . . . : ${NET.gw}\n(연습창) DHCP 서버에서 IP를 다시 받았습니다.`;
        if (has('/flushdns', '-flushdns')) return '\nWindows IP 구성\n\nDNS 확인자 캐시를 플러시했습니다.';
        if (has('/displaydns', '-displaydns')) return '\nWindows IP 구성\n\n    www.icqa.or.kr\n    ----------------------------------------\n    레코드 이름 . . . . . : www.icqa.or.kr\n    레코드 유형 . . . . . : 1\n    TTL(Time To Live) . . : 3412\n    데이터 길이 . . . . . : 4\n    섹션 . . . . . . . : 응답\n    A(호스트) 레코드 . . . : 203.0.113.10';
        if (has('/registerdns', '-registerdns')) return '\nWindows IP 구성\n\n이 컴퓨터의 모든 어댑터에 대한 DNS 리소스 레코드 등록을 시작했습니다. 오류는 15분 후에 이벤트 뷰어에 보고됩니다.';
        if (has('/all', '-all')) return `\nWindows IP 구성\n\n   호스트 이름 . . . . . . . . : ${NET.host}\n   주 DNS 접미사 . . . . . . . :\n   노드 유형 . . . . . . . . . : 혼성\n   IP 라우팅 사용. . . . . . . : 아니요\n   WINS 프록시 사용. . . . . . : 아니요\n\n이더넷 어댑터 이더넷:\n\n   연결별 DNS 접미사. . . . :\n   설명. . . . . . . . . . . . : Realtek PCIe GbE Family Controller\n   물리적 주소 . . . . . . . . : ${NET.mac}\n   DHCP 사용 . . . . . . . . . : 아니요\n   자동 구성 사용. . . . . . . : 예\n   링크-로컬 IPv6 주소 . . . . : ${NET.ll}(기본 설정)\n   IPv4 주소 . . . . . . . . . : ${NET.ip}(기본 설정)\n   서브넷 마스크 . . . . . . . : ${NET.mask}\n   기본 게이트웨이 . . . . . . : ${NET.gw}\n   DNS 서버. . . . . . . . . . : ${NET.dns[0]}\n                                 ${NET.dns[1]}\n   Tcpip를 통한 NetBIOS. . . . : 사용`;
        if (args.length && !/^[/-]\?$/.test(args[0])) return `오류: 인식할 수 없는 명령줄 인수입니다: "${args[0]}"\n(ipconfig /? 로 옵션을 확인하세요: /all /release /renew /flushdns /displaydns /registerdns)`;
        if (args.length) return 'ipconfig [/allcompartments] [/? | /all | /renew [어댑터] | /release [어댑터] | /flushdns | /displaydns | /registerdns ...]';
        return `\nWindows IP 구성\n\n\n이더넷 어댑터 이더넷:\n\n   연결별 DNS 접미사. . . . :\n   링크-로컬 IPv6 주소 . . . . : ${NET.ll}\n   IPv4 주소 . . . . . . . . . : ${NET.ip}\n   서브넷 마스크 . . . . . . . : ${NET.mask}\n   기본 게이트웨이 . . . . . . : ${NET.gw}`;
      }
      case 'ping': {
        const t = args.filter((a, i) => !/^[-/]/.test(a) && !/^[-/][nliwj]$/i.test(args[i - 1] || '')).pop();
        if (!t) return '\n사용법: ping [-t] [-a] [-n count] [-l size] [-f] [-i TTL] [-v TOS] [-r count] [-s count] [-w timeout] 대상 이름\n\n옵션:\n    -t             중지될 때까지 지정한 호스트를 ping합니다.\n    -a             주소를 호스트 이름으로 확인합니다.\n    -n count       보낼 에코 요청의 수입니다.\n    -l size        송신 버퍼 크기입니다.\n    -i TTL         Time To Live';
        const ip = resolve(t);
        if (!ip) return `Ping 요청에서 ${t} 호스트를 찾을 수 없습니다. 이름을 확인하고 다시 시도하십시오.`;
        const n = has('-t', '/t') ? 6 : +(opt('-n') || opt('/n') || 4); const size = +(opt('-l') || opt('/l') || 32);
        const name = isIp(t) ? t : `${t} [${ip}]`;
        const tm = ip.startsWith('192.168.0.') ? '시간<1ms' : '시간=7ms';
        const L = [`\nPing ${name} ${size}바이트 데이터 사용:`];
        for (let i = 0; i < Math.min(n, 20); i++) L.push(`${ip}의 응답: 바이트=${size} ${tm} TTL=${ip.startsWith('192.168.0.') ? 64 : 116}`);
        if (has('-t', '/t')) L.push('Control-C', '^C', '(연습창) -t는 Ctrl+C를 누를 때까지 계속 보냅니다. 여기서는 6번만 보여 줍니다.');
        L.push('', `${ip}에 대한 Ping 통계:`, `    패킷: 보냄 = ${Math.min(n, 20)}, 받음 = ${Math.min(n, 20)}, 손실 = 0 (0% 손실),`, '왕복 시간(밀리초):', ip.startsWith('192.168.0.') ? '    최소 = 0ms, 최대 = 1ms, 평균 = 0ms' : '    최소 = 6ms, 최대 = 8ms, 평균 = 7ms');
        return L.join('\n');
      }
      case 'tracert': {
        const t = args.filter((a, i) => !/^[-/]/.test(a) && !/^[-/][hwj]$/i.test(args[i - 1] || '')).pop();
        if (!t) return '\n사용법: tracert [-d] [-h maximum_hops] [-j host-list] [-w timeout] target_name';
        const ip = resolve(t); if (!ip) return `대상 이름 ${t}을(를) 확인할 수 없습니다.`;
        const d = has('-d', '/d'); const max = +(opt('-h') || opt('/h') || 30);
        const hops = [['192.168.0.1', 'gateway.local'], ['10.10.0.1', 'isp-gw1.example'], ['172.16.4.9', 'core1.example'], [ip, t]];
        return [`\n최대 ${max}홉 이상의`, `${isIp(t) ? t : `${t} [${ip}]`}(으)로 가는 경로 추적:\n`].concat(hops.slice(0, Math.min(max, 4)).map(([a, n], i) => `  ${i + 1}    ${i === 0 ? '<1 ms    <1 ms    <1 ms' : `${2 + i} ms     ${2 + i} ms     ${3 + i} ms`}  ${d || i === 3 ? a : `${n} [${a}]`}`)).concat(['', '추적을 완료했습니다.']).join('\n');
      }
      case 'pathping': { const t = args.filter(a => !/^[-/]/.test(a)).pop(); if (!t) return '사용법: pathping [-g host-list] [-h maximum_hops] [-n] target_name'; const ip = resolve(t) || t; return `\n최대 30홉 이상의\n${t} [${ip}](으)로 가는 경로 추적:\n  0  ${NET.host} [${NET.ip}]\n  1  gateway.local [192.168.0.1]\n  2  ${t} [${ip}]\n\n통계를 계산하는 중... 50초 후 완료됩니다.\n            원본에서 여기까지   이 노드/링크\n홉  RTT    손실/보냄 = Pct  손실/보냄 = Pct  주소\n  1    0ms     0/ 100 =  0%     0/ 100 =  0%  gateway.local [192.168.0.1]\n  2    7ms     0/ 100 =  0%     0/ 100 =  0%  ${t} [${ip}]\n\n추적을 완료했습니다.`; }
      case 'netstat': {
        if (has('-r', '/r')) return routeTable();
        if (has('-e', '/e')) return '인터페이스 통계\n\n                           받음               보냄\n\n바이트                   1584729352       98234512\n유니캐스트 패킷              1203391         643920\n비유니캐스트 패킷               3211            918\n버림                               0              0\n오류                               0              0\n알 수 없는 프로토콜                0';
        if (has('-s', '/s')) return 'IPv4 통계\n\n  받은 패킷                       = 1204102\n  받은 헤더 오류                  = 0\n  받은 주소 오류                  = 0\n  ...(연습창 예시)\n\nTCP 통계(IPv4)\n\n  활성 열기                       = 1532\n  수동 열기                       = 87\n  ...(연습창 예시)';
        const flags = low.join('').replace(/[-/]/g, '');
        const num = flags.includes('n'), all = flags.includes('a'), pid = flags.includes('o');
        const rows = [['TCP', '0.0.0.0:135', '0.0.0.0:0', 'LISTENING', 1032], ['TCP', '0.0.0.0:445', '0.0.0.0:0', 'LISTENING', 4], ['TCP', '0.0.0.0:3389', '0.0.0.0:0', 'LISTENING', 1188], ['TCP', `${NET.ip}:139`, '0.0.0.0:0', 'LISTENING', 4], [`TCP`, `${NET.ip}:52344`, `203.0.113.10:443`, 'ESTABLISHED', 8120], ['TCP', `${NET.ip}:52360`, `142.250.206.228:443`, 'ESTABLISHED', 8120], ['UDP', '0.0.0.0:5353', '*:*', '', 2104], ['UDP', `${NET.ip}:137`, '*:*', '', 4]];
        const show = rows.filter(r => all || r[3] === 'ESTABLISHED');
        const nm = a => (num ? a : a.replace(NET.ip, NET.host).replace('0.0.0.0', NET.host).replace('203.0.113.10:443', 'www.icqa.or.kr:https').replace('142.250.206.228:443', 'www.google.com:https').replace(':3389', ':ms-wbt-server').replace(':445', ':microsoft-ds').replace(':135', ':epmap').replace(':139', ':netbios-ssn'));
        return ['\n활성 연결\n', `  ${pad('프로토콜', 6)}${pad('로컬 주소', 22)}${pad('외부 주소', 24)}${pad('상태', 14)}${pid ? 'PID' : ''}`].concat(show.map(r => `  ${pad(r[0], 7)}${pad(nm(r[1]), 23)}${pad(nm(r[2]), 25)}${pad(r[3], 15)}${pid ? r[4] : ''}`)).join('\n');
      }
      case 'route': if (low[0] === 'print') return routeTable(); if (['add', 'delete', 'change'].includes(low[0])) return ' 확인!'; return '\n명령을 조작합니다. 사용법: ROUTE [-f] [-p] [-4|-6] command [destination] [MASK netmask] [gateway] [METRIC metric] [IF interface]\n\n  command    PRINT  경로를 인쇄합니다.\n             ADD    경로를 추가합니다.\n             DELETE 경로를 삭제합니다.\n             CHANGE 기존 경로를 수정합니다.';
      case 'nslookup': {
        const t = args.find(a => !/^-/.test(a));
        const head = `기본 서버:  kns.kornet.net\nAddress:  ${NET.dns[0]}\n`;
        if (!t) return head + '\n> (연습창) 대화형 모드는 지원하지 않습니다. nslookup 도메인 이름 처럼 한 줄로 입력하세요.';
        const ip = resolve(t);
        if (isIp(t)) return `서버:    kns.kornet.net\nAddress:  ${NET.dns[0]}\n\n이름:    ${Object.keys(HOSTS).find(k => HOSTS[k] === t) || 'unknown.example'}\nAddress:  ${t}`;
        return ip ? `서버:    kns.kornet.net\nAddress:  ${NET.dns[0]}\n\n권한 없는 응답:\n이름:    ${t}\nAddress:  ${ip}` : `서버:    kns.kornet.net\nAddress:  ${NET.dns[0]}\n\n*** kns.kornet.net이(가) ${t}을(를) 찾을 수 없습니다: Non-existent domain`;
      }
      case 'arp': {
        if (has('-a', '/a', '-g', '/g')) return `\n인터페이스: ${NET.ip} --- 0xc\n  인터넷 주소           물리적 주소           유형\n  192.168.0.1           00-08-9f-12-34-56     동적\n  192.168.0.20          3c-7c-3f-aa-bb-01     동적\n  192.168.0.255         ff-ff-ff-ff-ff-ff     정적\n  224.0.0.22            01-00-5e-00-00-16     정적\n  239.255.255.250       01-00-5e-7f-ff-fa     정적`;
        if (has('-d', '/d')) return '(연습창) ARP 캐시 항목을 지웠습니다. (실제로는 관리자 권한이 필요합니다.)';
        if (has('-s', '/s')) return '(연습창) 정적 ARP 항목을 추가했습니다.';
        return '\nIP-실제 주소 변환 표를 표시하고 수정합니다.\n\nARP -s inet_addr eth_addr [if_addr]\nARP -d inet_addr [if_addr]\nARP -a [inet_addr] [-N if_addr] [-v]\n\n  -a            현재 프로토콜 데이터를 질문하여 현재 ARP 항목을 표시합니다.\n  -d            inet_addr로 지정된 호스트를 삭제합니다.\n  -s            호스트를 추가하고 인터넷 주소를 실제 주소와 연결합니다.';
      }
      case 'getmac': return `\n물리적 주소           전송 이름\n=================== ==========================================================\n${NET.mac}   \\Device\\Tcpip_{8A1F3C2E-6B7D-4E9F-A123-4567890ABCDE}`;
      case 'nbtstat': if (has('-n', '/n')) return `\n이더넷:\n노드 IP 주소: [${NET.ip}] 범위 ID: []\n\n                NetBIOS 로컬 이름 테이블\n\n       이름               유형         상태\n    ---------------------------------------------\n    ${pad(NET.host, 15)}<00>  UNIQUE      등록됨\n    WORKGROUP      <00>  GROUP       등록됨\n    ${pad(NET.host, 15)}<20>  UNIQUE      등록됨`; if (has('-c', '/c')) return '\n이더넷:\n노드 IP 주소: [192.168.0.10] 범위 ID: []\n\n    원격 캐시 이름 테이블에 이름이 없습니다.'; return '\nTCP/IP를 사용한 NBT(NetBIOS over TCP/IP)에 대한 현재 연결 및 프로토콜 통계를 표시합니다.\n\nNBTSTAT [ [-a RemoteName] [-A IP address] [-c] [-n] [-r] [-R] [-RR] [-s] [-S] [interval] ]';
      case 'net': {
        const s = low[0];
        if (s === 'user' && args.length >= 3 && has('/add')) return '명령을 잘 실행했습니다.';
        if (s === 'user' && args.length >= 2 && has('/delete')) return '명령을 잘 실행했습니다.';
        if (s === 'user' && args[1]) return `사용자 이름                 ${args[1]}\n전체 이름\n설명\n계정 활성 상태              예\n계정 만료 날짜              기한 없음\n\n마지막으로 암호 설정한 날짜 2026-12-01 오전 10:00:00\n암호 만료 날짜              2027-01-12 오전 10:00:00\n로컬 그룹 구성원            *Users\n명령을 잘 실행했습니다.`;
        if (s === 'user') return `\n\\\\${NET.host}에 대한 사용자 계정\n\n-------------------------------------------------------------------------------\nAdministrator            DefaultAccount           Guest\nICQA                     WDAGUtilityAccount\n명령을 잘 실행했습니다.`;
        if (s === 'share') return '\n공유 이름     리소스                          설명\n\n-------------------------------------------------------------------------------\nC$           C:\\                             기본 공유\nIPC$                                         원격 IPC\nADMIN$       C:\\Windows                      원격 관리\nshare        C:\\share\n명령을 잘 실행했습니다.';
        if (s === 'use') return args[1] ? '명령을 잘 실행했습니다.' : '새 연결 정보가 기억됩니다.\n\n\n상태       로컬      원격                      네트워크\n\n-------------------------------------------------------------------------------\n연결 끊김  Z:        \\\\192.168.0.20\\share       Microsoft Windows Network\n명령을 잘 실행했습니다.';
        if (s === 'localgroup') return `\n\\\\${NET.host}에 대한 별칭\n\n-------------------------------------------------------------------------------\n*Administrators\n*Backup Operators\n*Guests\n*Remote Desktop Users\n*Users\n명령을 잘 실행했습니다.`;
        if (s === 'start' && args[1]) return `${args.slice(1).join(' ')} 서비스를 시작합니다..\n${args.slice(1).join(' ')} 서비스가 잘 시작되었습니다.`;
        if (s === 'stop' && args[1]) return `${args.slice(1).join(' ')} 서비스를 멈춥니다..\n${args.slice(1).join(' ')} 서비스를 잘 멈추었습니다.`;
        if (s === 'start') return '다음 Windows 서비스가 시작되었습니다.\n\n   DHCP Client\n   DNS Client\n   Print Spooler\n   Server\n   Workstation\n   ...\n명령을 잘 실행했습니다.';
        if (s === 'view') return `서버 이름            설명\n\n-------------------------------------------------------------------------------\n\\\\${NET.host}\n\\\\PRINTSRV\n명령을 잘 실행했습니다.`;
        return '이 명령의 구문은 다음과 같습니다.\n\nNET\n    [ ACCOUNTS | COMPUTER | CONFIG | CONTINUE | FILE | GROUP | HELP |\n      HELPMSG | LOCALGROUP | PAUSE | SESSION | SHARE | START |\n      STATISTICS | STOP | TIME | USE | USER | VIEW ]';
      }
      case 'systeminfo': return `\n호스트 이름:                ${NET.host}\nOS 이름:                    Microsoft Windows 11 Pro\nOS 버전:                    10.0.22631 N/A 빌드 22631\nOS 제조업체:                Microsoft Corporation\n등록된 소유자:              ICQA\n시스템 제조업체:            ICQA\n시스템 종류:                x64-based PC\n프로세서:                   프로세서 1개 설치됨.\n                            [01]: Intel64 Family 6 Model 151 GenuineIntel ~2496Mhz\nBIOS 버전:                  American Megatrends Inc. 1.20, 2026-05-01\nWindows 디렉터리:           C:\\Windows\n총 실제 메모리:             16,236MB\n사용 가능한 실제 메모리:    10,102MB\n네트워크 카드:              NIC 1개 설치됨.\n                            [01]: Realtek PCIe GbE Family Controller\n                                  연결 이름: 이더넷\n                                  DHCP 사용: 아니요\n                                  IP 주소\n                                  [01]: ${NET.ip}`;
      case 'tasklist': return '\n이미지 이름                    PID 세션 이름              세션#  메모리 사용\n========================= ======== ================ =========== ============\nSystem Idle Process              0 Services                   0          8 K\nSystem                           4 Services                   0      2,132 K\nsmss.exe                       420 Services                   0      1,124 K\ncsrss.exe                      612 Services                   0      5,680 K\nwininit.exe                    704 Services                   0      6,912 K\nservices.exe                   780 Services                   0     10,480 K\nlsass.exe                      796 Services                   0     22,936 K\nsvchost.exe                   1032 Services                   0     30,112 K\nexplorer.exe                  5120 Console                    1    121,804 K\nnotepad.exe                   7344 Console                    1     14,200 K\nchrome.exe                    8120 Console                    1    210,332 K\ncmd.exe                       9010 Console                    1      5,412 K';
      case 'taskkill': { const im = opt('/im') || opt('-im'), p = opt('/pid') || opt('-pid'); if (!im && !p) return '오류: 잘못된 구문입니다. /IM 이미지이름 또는 /PID 프로세스ID를 지정하십시오.\n"TASKKILL /?"를 입력하면 사용법을 볼 수 있습니다.'; return has('/f', '-f') ? `성공: 프로세스 "${im || p}"(PID ${p || 7344})이(가) 종료되었습니다.` : `성공: 프로세스 "${im || p}"(PID ${p || 7344})에 종료 신호를 보냈습니다.`; }
      case 'shutdown': {
        if (has('/a', '-a')) return '(연습창) 예약된 시스템 종료를 취소했습니다. "로그오프가 취소되었습니다" 알림이 표시됩니다.';
        const t = opt('/t') || opt('-t');
        const what = has('/r', '-r') ? '다시 시작' : has('/s', '-s') ? '종료' : has('/l', '-l') ? '로그오프' : null;
        if (!what) return '사용법: shutdown [/i | /l | /s | /sg | /r | /g | /a | /p | /h | /e | /o] [/hybrid] [/soft] [/fw] [/f]\n    [/m \\\\computer][/t xxx][/d [p|u:]xx:yy [/c "comment"]]\n\n    /s         컴퓨터를 종료합니다.\n    /r         컴퓨터를 완전히 종료하고 다시 시작합니다.\n    /a         시스템 종료를 취소합니다.\n    /t xxx     시스템 종료 전 제한 시간을 xxx초로 설정합니다.';
        return `(연습창) ${t ? `${t}초(${Math.round(+t / 60)}분) 후에` : '잠시 후'} Windows를 ${what}합니다. 실제로 끄지는 않습니다.`;
      }
      case 'chkdsk': {
        const fix = has('/f', '/r', '-f', '-r');
        if (fix) return `파일 시스템 유형은 NTFS입니다.\n볼륨이 다른 프로세스에서 사용 중이므로 CHKDSK를 실행할 수 없습니다.\n다음에 시스템을 다시 시작할 때 이 볼륨을 검사하도록 하시겠습니까 (Y/N)? Y\n다음에 시스템을 다시 시작할 때 이 볼륨을 검사합니다.${has('/r', '-r') ? '\n(/r: 불량 섹터를 찾아 읽을 수 있는 정보를 복구합니다. /f 기능을 포함합니다.)' : ''}`;
        return '파일 시스템 유형은 NTFS입니다.\n\n경고! /F 매개 변수를 지정하지 않았습니다.\nCHKDSK를 읽기 전용 모드로 실행 중입니다.\n\n1단계: 기본 파일 시스템 구조를 검사하는 중...\n2단계: 파일 이름 링크를 검사하는 중...\n3단계: 보안 설명자를 검사하는 중...\n\nWindows에서 파일 시스템을 검사했으며 문제가 없습니다.\n추가 작업이 필요하지 않습니다.';
      }
      case 'sfc': if (has('/scannow')) return '\n시스템 검색을 시작합니다. 이 프로세스는 약간의 시간이 걸릴 수 있습니다.\n\n시스템 검색의 확인 단계를 시작합니다.\n확인 100% 완료되었습니다.\n\nWindows 리소스 보호에서 무결성 위반을 찾지 못했습니다.'; if (has('/verifyonly')) return '\n확인 100% 완료되었습니다.\n\nWindows 리소스 보호에서 무결성 위반을 찾지 못했습니다.'; return '\nMicrosoft (R) Windows (R) 리소스 검사기 버전 6.0\n\nSFC [/SCANNOW] [/VERIFYONLY] [/SCANFILE=<파일>] [/VERIFYFILE=<파일>]\n\n/SCANNOW        보호된 모든 시스템 파일의 무결성을 검사하고 가능하면 문제가 있는 파일을 복구합니다.\n/VERIFYONLY     보호된 모든 시스템 파일의 무결성을 검사합니다. 복구 작업은 수행하지 않습니다.';
      case 'gpupdate': return has('/force') || has('-force') ? '컴퓨터 정책을 업데이트하는 중...\n\n컴퓨터 정책 업데이트를 완료했습니다.\n사용자 정책을 업데이트하는 중...\n\n사용자 정책 업데이트를 완료했습니다.' : '컴퓨터 정책을 업데이트하는 중...\n\n컴퓨터 정책 업데이트를 완료했습니다.\n사용자 정책을 업데이트하는 중...\n\n사용자 정책 업데이트를 완료했습니다.\n(바뀐 정책만 적용합니다. 모든 정책을 다시 적용하려면 gpupdate /force)';
      case 'convert': return /^[a-z]:$/i.test(args[0] || '') && has('/fs:ntfs') ? `파일 시스템 유형은 FAT32입니다.\n(연습창) ${args[0].toUpperCase()} 드라이브를 데이터를 지우지 않고 NTFS로 변환합니다. 변환이 완료되었습니다.` : 'CONVERT volume /FS:NTFS [/V] [/CvtArea:filename] [/NoSecurity] [/X]';
      case 'format': return args[0] ? `(연습창) FORMAT은 드라이브의 모든 데이터를 지웁니다. 실제로 실행하지 않습니다.\n정답 확인: 포맷 대상 ${args[0].toUpperCase()}${has('/q') ? ', 빠른 포맷(/q)' : ''}${opt('/fs:ntfs') !== null || has('/fs:ntfs') ? ', NTFS' : ''}` : '필요한 매개 변수가 없습니다.';
      case 'defrag': return args[0] ? `Microsoft 드라이브 최적화\n(C) Microsoft Corporation.\n\n${args[0].toUpperCase()}에서 ${has('/a', '-a') ? '분석' : '조각 모음'}을 호출하는 중...\n\n작업이 완료되었습니다.\n\n사후 최적화 보고서:\n\n    볼륨 정보:\n        볼륨 크기                 = 237.86 GB\n        사용 가능한 공간          = 141.87 GB\n        총 조각난 공간            = 0%\n\n    이 볼륨은 조각 모음할 필요가 없습니다.` : '오류: 매개 변수 지정이 잘못되었습니다.\n사용법: defrag <볼륨> [/A] [/O] [/U] [/V]';
      case 'attrib': return args.length ? '(연습창) 파일 속성을 바꿨습니다. (+r 읽기 전용, +h 숨김, +s 시스템, +a 보관)' : '     A                    C:\\pagefile.sys\n     A  SH                C:\\hiberfil.sys';
      case 'diskpart': return '\nMicrosoft DiskPart 버전 10.0.22621.1\n\n(연습창) DiskPart 대화형 모드는 지원하지 않습니다. 디스크 관리는 [디스크 관리] 화면 문제로 연습하세요.';
      case 'bootrec': return has('/fixmbr', '/fixboot', '/scanos', '/rebuildbcd') ? '작업을 완료했습니다. (연습창: Windows 복구 환경에서 쓰는 명령입니다.)' : 'BOOTREC [/FIXMBR | /FIXBOOT | /SCANOS | /REBUILDBCD]';
    }
    if (GUI[c] || GUI[c + '.exe']) return `(연습창) ${GUI[c]} 창이 열립니다.`;
    return `'${tk[0]}'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는\n배치 파일이 아닙니다.`;
  }
  function routeTable() {
    return `===========================================================================\n인터페이스 목록\n 12...${NET.mac.replace(/-/g, ' ').toLowerCase()} ......Realtek PCIe GbE Family Controller\n  1...........................Software Loopback Interface 1\n===========================================================================\n\nIPv4 경로 테이블\n===========================================================================\n활성 경로:\n네트워크 대상        네트워크 마스크     게이트웨이       인터페이스    메트릭\n          0.0.0.0          0.0.0.0      ${pad(NET.gw, 15)}  ${pad(NET.ip, 13)}   25\n        127.0.0.0        255.0.0.0      연결됨           127.0.0.1    331\n      192.168.0.0    255.255.255.0      연결됨        ${pad(NET.ip, 13)}   281\n     192.168.0.10  255.255.255.255      연결됨        ${pad(NET.ip, 13)}   281\n    192.168.0.255  255.255.255.255      연결됨        ${pad(NET.ip, 13)}   281\n===========================================================================\n영구 경로:\n  없음`;
  }

  SIMS.def('console', {
    title: '명령 프롬프트', labels: {},
    mount(desk, q) {
      desk.el.classList.add('enx');
      const hist = []; let out = [];
      const banner = 'Microsoft Windows [Version 6.2.9200]\n(c) 2007 Microsoft Corporation. All rights reserved.\n';
      let win, scr, inp, prompt = 'C:\\>';
      function paint() {
        scr.innerHTML = '';
        scr.append(h('div', {}, out.join('\n') + '\n')); // 끝의 빈 줄도 보이게(배너 다음 빈 줄)
        const line = h('div', { class: 'in' }, h('span', {}, prompt), inp);
        scr.append(line); scr.scrollTop = scr.scrollHeight; inp.focus();
      }
      function open() {
        out = [banner];
        // 에뮬레이터(CMDC)와 같은 785×576 창: 닫기 단추만, 굴림체 12px 흰 글자, 오른쪽 스크롤 막대
        win = new W.Win(desk, { title: 'C:\\Windows\\system32\\cmd.exe', icon: 'cmd', w: 785, h: 576, closeOnly: true, onClose: () => SIMS.closed(desk, open, '명령 프롬프트') });
        win.el.classList.add('enx-cmd');
        const ti = win.titleEl.querySelector('.ic'); const ci = h('img', { src: 'img/emu/netetc/cmd16.png', class: 'enx-ic', alt: '', draggable: 'false' }); if (ti) ti.replaceWith(ci); else win.titleEl.prepend(ci);
        scr = h('div', { class: 'cmd7' });
        inp = h('input', { spellcheck: 'false', autocomplete: 'off', 'aria-label': '명령 입력' });
        let hp = -1;
        inp.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault(); const v = inp.value; inp.value = ''; hp = -1;
            out.push(prompt + v);
            if (v.trim()) hist.push(v.trim());
            const r = run(v, { clear: () => { out = []; }, exit: () => setTimeout(() => win.close(), 0) });
            if (r != null && r !== '') out.push(r, '');
            else if (r === '') { /* 빈 줄 */ }
            paint();
          } else if (e.key === 'ArrowUp') { e.preventDefault(); if (!hist.length) return; hp = hp < 0 ? hist.length - 1 : Math.max(0, hp - 1); inp.value = hist[hp]; }
          else if (e.key === 'ArrowDown') { e.preventDefault(); if (hp < 0) return; hp++; if (hp >= hist.length) { hp = -1; inp.value = ''; } else inp.value = hist[hp]; }
        });
        scr.addEventListener('mouseup', () => { if (!getSelection().toString()) inp.focus(); });
        const sb = h('div', { class: 'enx-sb', 'aria-hidden': 'true' }, h('i', { onclick: () => { scr.scrollTop -= 12; } }), h('i', { class: 'dn', onclick: () => { scr.scrollTop += 12; } }));
        win.body.append(h('div', { class: 'enx-cmdwrap' }, scr, sb));
        paint();
      }
      open();
      return { history: () => hist.slice(), state: () => ({ history: hist.slice() }), open, _run: run };
    },
  });
  SIMS.consoleRun = run;
})(window);
