// 심화 문제(data/hard-*.json) 검사: 형식, 정답 키 모양, 값의 범위, 라우터 정답 명령 실행, 단답·콘솔 자기 채점.
// 사용: node --test test/hard.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const GRADER = require('../src/js/core/grader.js');
const ROUTER = require('../src/js/core/router-engine.js');

const DATA = path.join(__dirname, '..', 'data');
const read = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const EXAMS = read('exam.json').exams;
const BIOS = read('pc-bios.json');
const HARD = [...read('hard-net.json').questions, ...read('hard-pc.json').questions];

// 이미 있는 문제 id (겹치면 안 됨)
const OLD_IDS = new Set();
for (const f of fs.readdirSync(DATA)) {
  if (!f.endsWith('.json') || f.startsWith('hard-')) continue;
  const d = read(f);
  (Array.isArray(d) ? d : d.questions || []).forEach(q => q && q.id && OLD_IDS.add(q.id));
  if (f === 'router.json') d.forEach(m => OLD_IDS.add('router-' + m.id));
  if (f === 'pc-bios.json') d.tasks.forEach(t => OLD_IDS.add('bios-' + t.id));
}

// 가상 화면별 채점 키 모양 (각 sims/*.js 의 flat()과 같게)
const KEY = {
  tcpip: [/^(mode|ip|mask|gw|dns1|dns2|addrs|gws|dnsAll)$/],
  dhcp: [/^scope\.(exists|name|desc|start|end|mask|excl|leaseD|leaseH|leaseM|router|dns|domain|active|resIps)$/, /^scope\.res\.[^.]+\.(ip|mac|desc)$/],
  iis: [/^site\.(exists|kind|name|path|ip|port|host|type|bindings|started|docs|docFirst|dirBrowse|allow|deny|unspec|anonAuth|basicAuth)$/, /^ftp\.(ssl|anon|basic|rules|anonRead|anonWrite|allRead|allWrite|msgBanner|msgWelcome|msgExit|msgMax|maxConn)$/, /^ftp\.user\.[a-z0-9_]+\.(read|write)$/],
  dns: [/^zone\|[a-z0-9.-]+\|(exists|type|dyn|file)$/, /^rec\|[a-z0-9.-]+\|(@|[a-z0-9.-]+)\|(A|AAAA|CNAME|MX|PTR)(\|prio)?$/, /^soa\|[a-z0-9.-]+\|(serial|primary|resp|refresh|retry|expire|minttl)$/, /^xfer\|[a-z0-9.-]+\|(allow|mode|list)$/],
  secpol: [/^pw\.(complexity|history|maxAge|minLen|minAge|reversible)$/, /^lock\.(duration|threshold|reset)$/, /^audit\.(objAccess|acctMgmt|acctLogon|privUse|ds|logon|system|policy|process)\.(success|failure)$/, /^rights\.(netAccess|denyNet|logonLocal|denyLocal|rdp|denyRdp|shutdown|remoteShutdown|systime|timezone|backup|restore|ownership|driver|auditLog)$/, /^sec\.(guestStatus|adminName|guestName|blankPw|noLastUser|noCad|msgTitle|msgText|shutdownNoLogon)$/],
  services: [/^svc\.(AxInstSV|AppIDSvc|Appinfo|BITS|BFE|bthserv|EventSystem|Dhcp|DHCPServer|Dnscache|DNS|IISADMIN|FTPSVC|Netlogon|Spooler|RemoteAccess|RemoteRegistry|TermService|LanmanServer|SNMP|Schedule|TlntSvr|mpssvc|EventLog|WinRM|W32Time|wuauserv|LanmanWorkstation|W3SVC)\.(start|status)$/],
  users: [/^user\.[a-z0-9_]+\.(exists|full|desc|pw|mustChange|cannotChange|neverExpires|disabled|groups|homeLocal|homeTo|profile|script)$/, /^group\.[a-z0-9_ ]+\.(exists|desc|members)$/],
  regedit: [/^(key|val|type):hkey_(classes_root|current_user|local_machine|users|current_config)(\\[^\\]+)*$/],
  sysprop: [/^(comp\.(desc|name|workgroup|domain)|ra|rd|nla|rdUsers|vm\.auto|vm\.[CD]\.(mode|init|max)|perf\.(visual|sched)|dep)$/],
  mstsc: [/^rdp\.(computer|user|saveCred|size|color|bar|audio|keys|printers|clipboard|speed|connected)$/],
  folderopt: [/^fo\.(browse|click|navAll|navExpand|hidden|sysDirs|zip|contents|alwaysIcons|alwaysMenus|showFullPath|hideEmpty|hideExt|hideProtected|sepProcess|restorePrev|colorNtfs|statusBar|checkboxes|sharingWizard)$/],
  diskmgmt: [/^vol\.[A-Z]\.(exists|fs|label|sizeMB|quick|compress|disk)$/, /^disk[01]\.unallocMB$/, /^letters$/],
  devmgmt: [/^dev\.(dvd|ahci|nic|wifi|ssd|hdd|gpu|mouse|mon|usbroot|usbstor|audio|pci|rtc|acpi|kbd|com1|cpu0|cpu1)\.(enabled|present)$/],
  printer: [/^prn\.default$/, /^prn\.p[12]\.(shared|shareName|location|comment|always|from|to|priority)$/, /^prn\.p[12]\.perm\.[a-z0-9 ]+\.(print|manage)$/],
  share: [/^share\.(on|name|limit|comment)$/, /^share\.[a-z0-9 ]+\.(full|change|read)\.(allow|deny)$/, /^ntfs\.[a-z0-9 ]+\.(full|modify|rx|list|read|write)\.(allow|deny)$/, /^ntfs\.users$/],
};
// 값이 정해진 목록 안에 있어야 하는 칸
const ENUM = [
  [/^svc\..+\.start$/, ['자동(지연된 시작)', '자동', '수동', '사용 안 함']], [/^svc\..+\.status$/, ['running', 'stopped']],
  [/^mode$/, ['static', 'dhcp']], [/^site\.kind$/, ['web', 'ftp']], [/^site\.type$/, ['http', 'https', 'ftp', 'ftps']], [/^site\.unspec$/, ['allow', 'deny']], [/^ftp\.ssl$/, ['none', 'allow', 'require', 'custom']],
  [/^zone\|.+\|type$/, ['primary', 'secondary', 'stub']], [/^zone\|.+\|dyn$/, ['none', 'nonsecure']], [/^xfer\|.+\|mode$/, ['any', 'ns', 'list']],
  [/^rd$/, ['allow', 'deny']], [/^vm\.[CD]\.mode$/, ['custom', 'system', 'none']], [/^perf\.visual$/, ['auto', 'appearance', 'performance', 'custom']], [/^perf\.sched$/, ['programs', 'services']], [/^dep$/, ['essential', 'all']],
  [/^rdp\.size$/, ['640 x 480', '800 x 600', '1024 x 768', '1280 x 720', '1280 x 1024', '1600 x 900', '1920 x 1080', '전체 화면']], [/^rdp\.color$/, ['High Color(15비트)', 'High Color(16비트)', 'True Color(24비트)', '최고 품질(32비트)']],
  [/^rdp\.audio$/, ['이 컴퓨터에서 재생', '원격 컴퓨터에서 재생', '재생 안 함']], [/^rdp\.keys$/, ['이 컴퓨터에서', '원격 컴퓨터에서', '전체 화면을 사용하는 경우에만']],
  [/^rdp\.speed$/, ['연결 품질 자동 검색', '모뎀(56Kbps)', '저속 광대역(256Kbps - 2Mbps)', '위성(2Mbps - 16Mbps, 높은 대기 시간)', '고속 광대역(2Mbps - 10Mbps)', 'WAN(10Mbps 이상, 높은 대기 시간)', 'LAN(10Mbps 이상)']],
  [/^fo\.browse$/, ['same', 'new']], [/^fo\.click$/, ['double', 'single']], [/^fo\.hidden$/, ['hide', 'show']],
  [/^vol\..\.fs$/, ['NTFS', 'FAT32', 'exFAT']], [/^prn\.default$/, ['ICQA Laser P2000', 'Microsoft Print to PDF']],
  [/^type:/, ['REG_SZ', 'REG_BINARY', 'REG_DWORD', 'REG_QWORD', 'REG_MULTI_SZ', 'REG_EXPAND_SZ']],
];
const TIMES = []; for (let i = 0; i < 24; i++) TIMES.push(`${i < 12 ? '오전' : '오후'} ${String(i % 12 || 12).padStart(2, '0')}:00`);
ENUM.push([/^prn\.p[12]\.(from|to)$/, TIMES]);
const GROUPS = ['administrators', 'backup operators', 'event log readers', 'guests', 'iis_iusrs', 'network configuration operators', 'performance log users', 'power users', 'print operators', 'remote desktop users', 'remote management users', 'users'];

// 정답 조건 안의 실제 값들 (연산자 풀기)
const leaves = v => (v && typeof v === 'object' && !Array.isArray(v)) ? ('$any' in v ? v.$any.flatMap(leaves) : '$eq' in v ? leaves(v.$eq) : '$has' in v ? leaves(v.$has) : '$hasAll' in v ? v.$hasAll.flatMap(leaves) : '$set' in v ? v.$set.flatMap(leaves) : '$none' in v ? [] : [v]) : Array.isArray(v) ? v.flatMap(leaves) : [v];

test('심화 문제: id·필수 칸·유형', () => {
  const seen = new Set();
  assert.ok(HARD.length >= 100, `심화 문제가 ${HARD.length}개뿐`);
  for (const q of HARD) {
    assert.ok(q.id && !seen.has(q.id) && !OLD_IDS.has(q.id), `id 겹침: ${q.id}`); seen.add(q.id);
    for (const k of ['exam', 'cat', 'type', 'label', 'source', 'question', 'explain']) assert.ok(q[k], `${q.id}: ${k} 없음`);
    assert.equal(q.label, '심화', `${q.id}: label`);
    const cats = q.exam === 'both' ? [...EXAMS.net.cats, ...EXAMS.pc.cats] : EXAMS[q.exam].cats;
    assert.ok(cats.some(c => c[0] === q.cat), `${q.id}: 없는 유형 ${q.cat}`);
  }
});

test('심화 문제: 가상 화면 정답 키 모양과 값', () => {
  for (const q of HARD.filter(x => x.type === 'sim' && x.sim !== 'console')) {
    const pats = KEY[q.sim]; assert.ok(pats, `${q.id}: 모르는 화면 ${q.sim}`);
    for (const [k, v] of Object.entries(q.answer)) {
      assert.ok(pats.some(p => p.test(k)), `${q.id}: 채점 키 모양이 다름 → ${k}`);
      if (q.sim === 'regedit') assert.equal(k, k.toLowerCase(), `${q.id}: 키는 소문자여야 함 → ${k}`);
      if (q.sim === 'dns') k.split('|').slice(1, 3).forEach(p => assert.equal(p, p.toLowerCase(), `${q.id}: 영역·이름은 소문자여야 함 → ${k}`));
      for (const [re, list] of ENUM) if (re.test(k)) for (const x of leaves(v)) assert.ok(list.includes(x), `${q.id}: ${k} 값 '${x}'이(가) 목록에 없음`);
      if (/^user\..+\.groups$/.test(k)) {
        const made = Object.keys(q.answer).filter(x => /^group\.[^.]+\.exists$/.test(x)).map(x => x.split('.')[1]);
        for (const gname of leaves(v)) assert.ok(GROUPS.includes(String(gname).toLowerCase()) || made.includes(String(gname).toLowerCase()), `${q.id}: 없는 그룹 ${gname}`);
      }
    }
    if (q.target) assert.ok(['dhcp', 'iis'].includes(q.sim), `${q.id}: target은 dhcp·iis만`);
  }
});

test('심화 문제: 라우터 정답 명령을 실행하면 정답, 아무것도 안 하면 오답', () => {
  const run = cmds => { const R = ROUTER.createRouter(); cmds.forEach(c => R.exec(c === '(Enter)' ? '' : c)); return ROUTER.flatten(R.st.saved); };
  for (const q of HARD.filter(x => x.type === 'router')) {
    const r = GRADER.gradeState(q.check, run(q.cmds));
    assert.ok(r.ok, `${q.id}: 정답 명령으로 채점 실패 → ${JSON.stringify(r.items.filter(i => !i.ok))}`);
    assert.equal(GRADER.gradeState(q.check, run(['en', 'copy r s', '(Enter)'])).ok, false, `${q.id}: 아무것도 안 했는데 정답`);
  }
});

test('심화 문제: 단답·콘솔은 첫 번째 정답 표기로 채점하면 정답', () => {
  for (const q of HARD.filter(x => x.type === 'short')) {
    assert.ok(q.answer.accept.length, q.id);
    q.answer.accept.forEach(a => assert.ok(GRADER.gradeShort(q, a).ok, `${q.id}: '${a}' 채점 실패`));
    assert.equal(GRADER.gradeShort(q, '모르겠음').ok, false, q.id);
  }
  for (const q of HARD.filter(x => x.sim === 'console')) {
    q.answer.accept.forEach(a => assert.ok(GRADER.gradeConsole(q, [a]).ok, `${q.id}: '${a}'`));
    assert.equal(GRADER.gradeConsole(q, ['ipconfig']).ok, q.answer.accept.includes('ipconfig'), q.id);
  }
});

test('심화 문제: 선택·다택·드래그 형식', () => {
  for (const q of HARD.filter(x => x.type === 'choice')) {
    assert.ok(q.answer.index >= 0 && q.answer.index < q.options.length, q.id);
    if (q.optionWhy) assert.equal(q.optionWhy.length, q.options.length, `${q.id}: optionWhy 개수`);
  }
  for (const q of HARD.filter(x => x.type === 'multi')) {
    assert.ok(q.answer.indexes.length && q.answer.indexes.every(i => i >= 0 && i < q.options.length), q.id);
    if (q.optionWhy) assert.equal(q.optionWhy.length, q.options.length, `${q.id}: optionWhy 개수`);
  }
  for (const q of HARD.filter(x => x.type === 'drag')) {
    const items = new Set(q.items.map(i => i.id));
    q.slots.forEach(s => assert.ok(items.has([].concat(q.answer.slots[s.id])[0]), `${q.id}: ${s.id} 정답 없음`));
    assert.ok(GRADER.gradeDrag(q, Object.fromEntries(Object.entries(q.answer.slots).map(([k, v]) => [k, [].concat(v)[0]]))).ok, q.id);
  }
});

test('심화 문제: CMOS 정답이 실제 메뉴 항목·값', () => {
  const items = Object.fromEntries(Object.values(BIOS.menus).flatMap(m => m.items || []).map(i => [i.id, i]));
  for (const q of HARD.filter(x => x.type === 'bios')) {
    for (const [k, v] of Object.entries(q.answer)) {
      if (k === 'supw' || k === 'uspw') continue;
      const it = items[k]; assert.ok(it, `${q.id}: 없는 항목 ${k}`);
      if (it.kind === 'date') assert.match(String(v), /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d\d$/, `${q.id}: 날짜 형식`);
      else assert.ok(it.opts && it.opts.includes(v), `${q.id}: ${k} 값 '${v}'이(가) 메뉴에 없음`);
    }
  }
});
