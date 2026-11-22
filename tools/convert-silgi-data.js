// 예전 웹 버전 자료(silgi_source/app/data/silgi_data.js)를 data/*.json으로 바꿉니다.
// 한 번 실행해 만든 JSON이 이후의 원본입니다. (다시 실행하면 아래 파일들을 덮어씁니다.)
//   data/concepts.json   개념 설명 글
//   data/info.json       시험 정보, 시험 당일 체크리스트, 케이블 만드는 순서
//   data/old-drill.json  예전 실전 문제 (단답·선택·다택)
//   data/router.json     라우터 미션 (채점 조건 포함) + 기출 유형 명령
//   data/match-drag.json 짝 맞추기 → 드래그 앤 드롭 문제
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'silgi_source', 'app', 'data', 'silgi_data.js');
const OUT = path.join(ROOT, 'data');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(SRC, 'utf8'), ctx);
const D = ctx.window.SGD;
const write = (name, obj) => { fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 1) + '\n', 'utf8'); console.log('wrote', name); };
fs.mkdirSync(OUT, { recursive: true });

const OLD_SRC = '예전 웹 버전 실전 문제 (합격 후기·필기 기출을 바탕으로 만든 예상 문제)';

// ───────── 개념 글 ─────────
// 화면 위젯 중 새 프로그램에 없는 것(연습창·짝 맞추기·체크리스트)은 빼고, 그림 위젯(pins, steps, bin2dec, chmod, rtypes)은 남깁니다.
const clean = html => html
  .replace(/<div data-sg-widget="(router|bios|match|check|colors)"[^>]*><\/div>/g, '')
  .replace(/<div data-widget="subnet"><\/div>/g, '')
  .replace(/<h2>(라우터 연습창|BIOS 연습 화면|색 순서 연습)<\/h2>\s*<p>[\s\S]*?<\/p>/g, '')
  .trim();
function splitH2(html) {
  const parts = html.split(/(?=<h2>)/);
  const intro = parts[0].startsWith('<h2>') ? '' : parts.shift();
  return { intro, secs: parts };
}
const win = splitH2(clean(D.net.html.win));
const pcw = splitH2(clean(D.pc.html.wintask));
const sec = (s, i) => (s.secs[i] || '');
const concepts = {
  'cable': { title: '랜 케이블 (T568A·T568B, 다이렉트·크로스)', html: clean(D.CABLE) },
  'net-start': { title: '네트워크관리사 2급 실기 한눈에 보기', html: clean(D.net.html.start) },
  'pc-start': { title: 'PC정비사 2급 실기 한눈에 보기', html: clean(D.pc.html.start) },
  'net-win': { title: 'Windows Server 작업형 전체', html: win.intro },
  'win-tcpip': { title: '네트워크(IP) 설정', html: win.intro + sec(win, 0) },
  'win-dns': { title: 'DNS 서버 설정', html: sec(win, 1) },
  'win-dhcp': { title: 'DHCP 서버 설정', html: sec(win, 2) },
  'win-iis-ftp': { title: 'FTP 사이트 추가', html: sec(win, 3) },
  'win-iis-web': { title: '웹 사이트(IIS) 추가', html: sec(win, 4) },
  'win-users': { title: '사용자 계정·그룹', html: sec(win, 5) },
  'win-secpol': { title: '로컬 보안 정책', html: sec(win, 6) },
  'win-services': { title: '서비스 설정', html: sec(win, 7) },
  'router': { title: '라우터 명령어', html: clean(D.net.html.router) },
  'linux': { title: '리눅스 명령어', html: clean(D.net.html.linux) },
  'short': { title: '단답형·선택형', html: clean(D.net.html.short) },
  'bios': { title: 'CMOS(BIOS) Setup', html: clean(D.pc.html.cmos) },
  'console': { title: '콘솔(명령 프롬프트) 명령어', html: clean(D.pc.html.console) },
  'pc-win': { title: '가상 Windows 작업형 전체', html: pcw.intro },
  'pc-net': { title: '네트워크 설정 (PC)', html: sec(pcw, 0) },
  'pc-remote': { title: '원격 데스크톱', html: sec(pcw, 1) },
  'pc-share': { title: '폴더 공유와 권한', html: sec(pcw, 2) },
  'pc-vmem': { title: '가상 메모리', html: sec(pcw, 3) },
  'pc-printer': { title: '프린터 공유', html: sec(pcw, 4) },
  'reg': { title: '레지스트리', html: sec(pcw, 5) },
  'drag': { title: '부품·드래그 앤 드롭', html: clean(D.pc.html.drag) },
};
// 새 프로그램에서 추가하는 개념 글이 이미 있으면 지우지 않고 합칩니다.
const cfile = path.join(OUT, 'concepts.json');
let prev = {};
try { prev = JSON.parse(fs.readFileSync(cfile, 'utf8')); } catch (e) { /* 처음 */ }
write('concepts.json', Object.assign(prev, concepts));

// ───────── 시험 정보 ─────────
write('info.json', { exam: D.EXAM, day: D.DAY, plan: D.PLAN, steps: D.STEPS, rtypes: D.RTYPES });

// ───────── 예전 실전 문제 ─────────
const CAT_CONCEPT = { router: 'router', win: 'net-win', linux: 'linux', short: 'short', cable: 'cable', cmos: 'bios', console: 'console', reg: 'reg', hw: 'drag' };
const conv = (q, exam) => {
  const base = { id: `old-${exam}-${q.id}`, exam, cat: q.c, label: '예상', source: OLD_SRC, conceptRef: CAT_CONCEPT[q.c], question: q.q, explain: q.e };
  if (q.type === 'input') return { ...base, type: 'short', answer: { accept: q.a }, cs: !!q.cs, router: !!q.router };
  if (q.type === 'choice') return { ...base, type: 'choice', options: q.o, answer: { index: q.a } };
  return { ...base, type: 'multi', options: q.o, answer: { indexes: q.a } };
};
const cableIds = new Set(D.net.drill.filter(q => q.c === 'cable').map(q => q.id));
const out = [];
D.net.drill.filter(q => !cableIds.has(q.id)).forEach(q => out.push(conv(q, 'net')));
D.pc.drill.filter(q => q.c !== 'cable').forEach(q => out.push(conv(q, 'pc')));
D.net.drill.filter(q => q.c === 'cable').forEach(q => out.push({ ...conv(q, 'both'), id: `old-cable-${q.id}` }));
write('old-drill.json', out);

// ───────── 라우터 미션 ─────────
// 예전 미션의 채점 함수(k)를 같은 뜻의 채점 조건(JSON)으로 옮겼습니다. 키 이름은 router-engine.js의 flatten()과 같습니다.
const CS = v => ({ $eq: v, $cs: true });
const CHECK = {
  m01: { 'FastEthernet0/0.ip': '192.168.0.100', 'FastEthernet0/0.mask': '255.255.255.0' },
  m02: { 'Serial2/0.bw': 2048 },
  m03: { 'Serial2/0.clock': 72000 },
  m04: { 'FastEthernet0/0.desc': CS('ICQA') },
  m05: { 'Serial2/0.ip': '192.168.0.101', 'Serial2/0.mask': '255.255.255.0', 'Serial2/0.sec': { $has: { ip: '192.168.0.102', mask: '255.255.255.0' } }, 'Serial2/0.shut': false },
  m06: { gw: '192.168.0.10' },
  m07: { 'pool.icqa.net': '192.168.100.0', 'pool.icqa.mask': '255.255.255.0' },
  m08: { 'vty.pw': CS('icqa'), 'vty.login': true },
  m09: { 'vty.tm': [3, 50] },
  m10: { 'con.pw': CS('ICQA'), 'con.login': true },
  m11: { host: CS('network2'), 'con.pw': CS('route5'), 'con.login': true },
  m12: { 'Serial2/0.encap': 'frame-relay' },
  m13: { shows: { $has: 'ip route' } },
  m14: { shows: { $has: 'flash' } },
  m15: { snmp: { $has: { name: 'ICQA', mode: 'ro' }, $cs: true } },
  m16: { 'vty.tr': 'ssh' },
  m17: { routes: { $has: { net: '192.168.20.0', mask: '255.255.255.0', via: '192.168.0.1' } } },
};
const BLOG0621 = 'https://tech-network.tistory.com/entry/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EA%B4%80%EB%A6%AC%EC%82%AC-2%EA%B8%89-%EC%8B%A4%EA%B8%B0-%EB%AC%B8%EC%A0%9C-%EB%B3%B5%EC%9B%90-%EB%B0%8F-%EA%B0%80%EC%B1%84%EC%A0%90-20260621';
const BLOG0913 = 'https://tech-network.tistory.com/entry/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EA%B4%80%EB%A6%AC%EC%82%AC-2%EA%B8%89-%EC%8B%A4%EA%B8%B0-%EB%AC%B8%EC%A0%9C-%EB%B3%B5%EC%9B%90-%EB%B0%8F-%EA%B0%80%EC%B1%84%EC%A0%90-20260913';
const LABEL = {
  // 2026.06.21 복원 16번 "인터페이스 활성화 + secondary", 18번 "정적 라우팅", 2026.09.13 라우터 3번 "Telnet 비밀번호 + login"
  m05: ['기출 복원 2026.06.21', BLOG0621, '복원 글에서 확인된 것은 유형(활성화 + secondary)뿐입니다. 인터페이스 이름과 IP는 예시 값입니다.'],
  m17: ['기출 복원 2026.06.21', BLOG0621, '복원 글에서 확인된 것은 유형(정적 라우팅)뿐입니다. 목적지·다음 홉 IP는 예시 값입니다.'],
  m08: ['기출 복원 2026.09.13', BLOG0913, '복원 글에서 확인된 것은 유형(Telnet 비밀번호 + login)뿐입니다. 비밀번호는 예시 값입니다.'],
};
const missions = D.MISSIONS.map(m => {
  const [label, source, note] = LABEL[m.id] || ['예상', OLD_SRC, ''];
  return { id: m.id, title: m.t, label, source, note, check: CHECK[m.id], cmds: D.MISSION_CMDS[m.id] };
});
// 새 미션 (작업 지시서 4장)
missions.push(
  { id: 'm18', title: '라우터에 접속 중인 사용자를 확인한 뒤 설정을 저장하세요.', label: '기출 복원 2026.09.13', source: BLOG0913, note: '복원 글 본문에는 "접속한 user 확인" 유형이라는 것까지만 글로 나옵니다. 정확한 지시문은 원문 이미지에만 있어 확인 안 됨.', check: { shows: { $has: 'users' } }, cmds: ['en', 'show users', 'copy r s', '(Enter)'] },
  { id: 'm19', title: 'DHCP 풀 이름 ICQA를 만들고 네트워크 192.168.10.0/24, 기본 게이트웨이 192.168.10.1, DNS 서버 168.126.63.1을 설정한 뒤 저장하세요.', label: '기출 복원 2026.06.21', source: BLOG0621, note: '복원 글에서 확인된 것은 "라우터 DHCP 설정" 유형뿐입니다. 풀 이름·네트워크·게이트웨이·DNS 값은 원문 이미지에만 있어 예시 값으로 넣었습니다.', check: { 'pool.ICQA.net': '192.168.10.0', 'pool.ICQA.mask': '255.255.255.0', 'pool.ICQA.gw': '192.168.10.1', 'pool.ICQA.dns': '168.126.63.1' }, cmds: ['en', 'conf t', 'ip dhcp pool ICQA', 'network 192.168.10.0 255.255.255.0', 'default-router 192.168.10.1', 'dns-server 168.126.63.1', 'end', 'copy r s', '(Enter)'] },
  { id: 'm20', title: 'FastEthernet 0/1에 IP 10.10.10.1/24를 설정하고 활성화한 뒤 저장하세요.', label: '변형', source: BLOG0913, note: '2026.09.13 라우터 2번이 "인터페이스 관련" 유형이었다는 것을 바탕으로 만든 변형 문제입니다.', check: { 'FastEthernet0/1.ip': '10.10.10.1', 'FastEthernet0/1.mask': '255.255.255.0', 'FastEthernet0/1.shut': false }, cmds: ['en', 'conf t', 'int fa0/1', 'ip add 10.10.10.1 255.255.255.0', 'no shutdown', 'end', 'copy r s', '(Enter)'] },
  { id: 'm21', title: 'FastEthernet 0/0을 활성화하고 IP 172.16.1.1/24, 보조 IP 172.16.2.1/24를 설정한 뒤 저장하세요.', label: '변형', source: BLOG0621, note: '2026.06.21 라우터 1번(활성화 + secondary)의 숫자를 바꾼 변형입니다.', check: { 'FastEthernet0/0.ip': '172.16.1.1', 'FastEthernet0/0.mask': '255.255.255.0', 'FastEthernet0/0.sec': { $has: { ip: '172.16.2.1', mask: '255.255.255.0' } }, 'FastEthernet0/0.shut': false }, cmds: ['en', 'conf t', 'int fa0/0', 'ip add 172.16.1.1 255.255.255.0', 'ip add 172.16.2.1 255.255.255.0 secondary', 'no shutdown', 'end', 'copy r s', '(Enter)'] },
  { id: 'm22', title: '목적지 10.20.0.0/16으로 가는 정적 경로를 다음 홉 192.168.1.254로 설정하고 저장하세요.', label: '변형', source: BLOG0621, note: '2026.06.21 라우터 3번(정적 라우팅)의 숫자를 바꾼 변형입니다.', check: { routes: { $has: { net: '10.20.0.0', mask: '255.255.0.0', via: '192.168.1.254' } } }, cmds: ['en', 'conf t', 'ip route 10.20.0.0 255.255.0.0 192.168.1.254', 'end', 'copy r s', '(Enter)'] },
  { id: 'm23', title: 'Telnet 접속 비밀번호를 Network2로 설정하고 로그인할 때 비밀번호를 묻도록 한 뒤 저장하세요. (대소문자 구분)', label: '변형', source: BLOG0913, note: '2026.09.13 라우터 3번(Telnet 비밀번호 + login)의 값을 바꾼 변형입니다. 블로그 글에 "로그인 내용이 있으면 반드시 login 입력, 안 하면 틀림"이라고 적혀 있습니다.', check: { 'vty.pw': CS('Network2'), 'vty.login': true }, cmds: ['en', 'conf t', 'line vty 0 4', 'password Network2', 'login', 'end', 'copy r s', '(Enter)'] },
  { id: 'm24', title: 'DHCP 풀 이름 net2를 만들고 네트워크 172.16.0.0/16, 기본 게이트웨이 172.16.0.1, DNS 서버 8.8.8.8, 임대 기간 7일을 설정한 뒤 저장하세요.', label: '변형', source: BLOG0621, note: '2026.06.21 라우터 2번(라우터 DHCP 설정)의 값을 바꾼 변형입니다.', check: { 'pool.net2.net': '172.16.0.0', 'pool.net2.mask': '255.255.0.0', 'pool.net2.gw': '172.16.0.1', 'pool.net2.dns': '8.8.8.8', 'pool.net2.lease': 7 }, cmds: ['en', 'conf t', 'ip dhcp pool net2', 'network 172.16.0.0 255.255.0.0', 'default-router 172.16.0.1', 'dns-server 8.8.8.8', 'lease 7', 'end', 'copy r s', '(Enter)'] },
);
write('router.json', missions);

// ───────── 짝 맞추기 → 드래그 앤 드롭 ─────────
const DRAG_EXAM = { ports: 'net', osi: 'net', icmp: 'net', rcmd: 'net', linux: 'net', bios: 'pc', cmd: 'pc', reg: 'pc', board: 'pc', mem: 'pc', jack: 'pc' };
const drags = [];
for (const [setId, set] of Object.entries(D.MATCH)) {
  const pairs = set.pairs;
  for (let i = 0; i < pairs.length; i += 6) {
    let chunk = pairs.slice(i, i + 6);
    if (chunk.length < 3 && i > 0) chunk = pairs.slice(Math.max(0, pairs.length - 6));
    const n = drags.filter(d => d.set === setId).length + 1;
    drags.push({
      id: `drag-${setId}-${n}`, set: setId, exam: DRAG_EXAM[setId] || 'both', cat: 'drag', type: 'drag', label: '예상', source: OLD_SRC, conceptRef: DRAG_EXAM[setId] === 'pc' ? 'drag' : 'short',
      question: `${set.title}: 오른쪽 보기를 끌어다 알맞은 칸에 놓으세요.`,
      slots: chunk.map((p, k) => ({ id: 's' + k, label: p[0] })),
      items: chunk.map((p, k) => ({ id: 'i' + k, label: p[1] })),
      answer: { slots: Object.fromEntries(chunk.map((p, k) => ['s' + k, 'i' + k])) },
      explain: chunk.map(p => `**${p[0]}** → ${p[1]}`).join('\n'),
    });
    if (chunk.length < 6) break;
  }
}
write('match-drag.json', drags);
