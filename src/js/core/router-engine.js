/* 라우터 명령 창 엔진 — 예전 웹 버전(silgi.js)의 라우터 연습창을 화면과 분리해 옮긴 것입니다.
 * createRouter() → { exec(줄), prompt(), st(상태), out(출력 줄 목록) }
 * 화면 없이 Node에서도 돌아가므로 자동 테스트가 미션 정답 명령을 그대로 실행해 채점합니다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ROUTER = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ifc = serial => ({ ip: '', mask: '', sec: [], shut: true, desc: '', bw: serial ? 1544 : 100000, clock: 0, encap: serial ? 'hdlc' : '', dlci: 0, serial: !!serial });
  const lnc = () => ({ pw: '', login: false, tm: null, tr: '' });
  function fresh() {
    return { host: 'Router', mode: 'user', cur: null, line: null, pool: null, wait: null, ifs: { 'FastEthernet0/0': ifc(0), 'FastEthernet0/1': ifc(0), 'Serial2/0': ifc(1), 'Serial2/1': ifc(1) }, lines: { con: lnc(), vty: lnc() }, enSecret: '', enPass: '', gw: '', defnet: '', pools: {}, excluded: [], routes: [], snmp: [], banner: '', shows: [], saved: null };
  }
  const CONF_KEYS = ['host', 'ifs', 'lines', 'enSecret', 'enPass', 'gw', 'defnet', 'pools', 'excluded', 'routes', 'snmp', 'banner', 'shows'];
  const snap = st => JSON.parse(JSON.stringify(CONF_KEYS.reduce((o, k) => (o[k] = st[k], o), {})));
  const PROMPTS = { user: '>', priv: '#', config: '(config)#', if: '(config-if)#', line: '(config-line)#', dhcp: '(dhcp-config)#' };
  function pick(tok, words) {
    if (tok == null) return null;
    const t = tok.toLowerCase();
    if (words.includes(t)) return t;
    const c = words.filter(w => w.startsWith(t));
    if (c.length === 1) return c[0];
    if (c.length > 1) return '?amb';
    return null;
  }
  const isIp = s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || '') && s.split('.').every(x => +x <= 255);
  const isMask = s => { if (!isIp(s)) return false; const b = s.split('.').map(x => (+x).toString(2).padStart(8, '0')).join(''); return /^1*0*$/.test(b); };
  const prefixOf = m => m.split('.').map(x => (+x).toString(2).split('').filter(c => c === '1').length).reduce((a, b) => a + b, 0);
  const netOf = (ip, m) => ip.split('.').map((x, i) => (+x & +m.split('.')[i])).join('.');
  const CLOCKS = [1200, 2400, 4800, 9600, 14400, 19200, 28800, 32000, 38400, 48000, 56000, 57600, 64000, 72000, 115200, 125000, 128000, 148000, 192000, 250000, 256000, 384000, 500000, 512000, 768000, 800000, 1000000, 1300000, 2000000, 4000000];

  const HELP = {
    user: [['enable', '특권(관리자) 모드로 · 줄임 en'], ['show', '정보 보기 (일부만)'], ['exit', '접속 끝내기']],
    priv: [['configure', '설정 모드로 · conf t'], ['copy', '설정 복사·저장 · copy r s'], ['write', '저장 · write memory'], ['show', '정보 보기 · sh'], ['disable', '사용자 모드로'], ['exit', '접속 끝내기']],
    config: [['hostname', '장비 이름 바꾸기'], ['interface', '인터페이스로 들어가기 · int fa0/0, int s2/0'], ['line', '콘솔·Telnet 줄 · line con 0, line vty 0 4'], ['enable', '특권 암호 · enable secret/password'], ['ip', 'route · default-gateway · default-network · dhcp pool · dhcp excluded-address'], ['snmp-server', 'SNMP(Simple Network Management Protocol) 커뮤니티'], ['banner', '접속 배너 · banner motd #글#'], ['no', '설정 지우기'], ['do', '설정 모드에서 특권 명령 · do show ip route'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    if: [['ip', 'ip address IP 마스크 [secondary]'], ['shutdown', '포트 끄기 (켜기는 no shutdown)'], ['no', 'no shutdown · no ip address'], ['description', '설명(주석)'], ['bandwidth', '대역폭 (kbps)'], ['clock', 'clock rate 숫자 (bps, 시리얼만)'], ['encapsulation', 'frame-relay · ppp · hdlc (시리얼만)'], ['frame-relay', 'frame-relay interface-dlci 번호'], ['interface', '다른 인터페이스로'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    line: [['password', '비밀번호 정하기'], ['login', '접속할 때 비밀번호 묻기'], ['exec-timeout', '자동 종료 · 분 초'], ['transport', 'transport input ssh/telnet/all'], ['no', 'no login 등'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    dhcp: [['network', 'network 네트워크 마스크'], ['default-router', '기본 게이트웨이'], ['dns-server', 'DNS 서버'], ['domain-name', '도메인 이름'], ['lease', '임대 기간(일 [시간 [분]])'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
  };
  const WORDS = {};
  for (const [m, list] of Object.entries(HELP)) WORDS[m] = [...new Set(list.map(x => x[0]).concat(m === 'user' || m === 'priv' ? ['logout'] : []).concat(m === 'priv' ? ['enable'] : []))];
  const TAB_WORDS = ['terminal', 'running-config', 'startup-config', 'fastethernet', 'serial', 'address', 'secondary', 'console', 'vty', 'route', 'default-gateway', 'default-network', 'dhcp', 'pool', 'excluded-address', 'rate', 'memory', 'interfaces', 'flash:', 'users', 'processes', 'hosts', 'version', 'frame-relay', 'community', 'input', 'ssh', 'shutdown', 'login', 'password', 'brief'];

  function createRouter() {
    const R = { st: fresh(), out: [], hist: [] };
    const out = (text, cls) => { String(text).split('\n').forEach(l => R.out.push([l, cls || ''])); if (R.out.length > 600) R.out.splice(0, R.out.length - 600); };
    const prompt = (st = R.st) => st.host + PROMPTS[st.mode];

    function bad(raw, i, msg) {
      if (i >= 0) {
        const tk = raw.trim().split(/\s+/);
        let pos = raw.indexOf(raw.trim());
        for (let k = 0; k < i && k < tk.length; k++) pos = raw.indexOf(tk[k], pos) + tk[k].length;
        if (tk[i] !== undefined) pos = raw.indexOf(tk[i], pos);
        out(' '.repeat(prompt().length + Math.max(0, pos)) + '^', 'e');
      }
      out("% Invalid input detected at '^' marker.", 'e');
      if (msg) out('  ↳ ' + msg, 'h');
    }
    const incomplete = msg => { out('% Incomplete command.', 'e'); if (msg) out('  ↳ ' + msg, 'h'); };
    const amb = (tok, msg) => {
      out(`% Ambiguous command:  "${tok}"`, 'e');
      const c = (WORDS[R.st.mode] || []).filter(w => w.startsWith(String(tok).toLowerCase()));
      out('  ↳ ' + (c.length > 1 && !msg ? `"${tok}"로 시작하는 명령이 여러 개예요: ${c.join(', ')}. 조금 더 쳐 보세요.` : (msg || '조금 더 길게 쳐 보세요.')), 'h');
    };
    function parseIf(tk) {
      const s = tk.join('');
      const m = s.match(/^([a-z-]+)(\d+\/\d+)$/i);
      if (!m) return null;
      const ty = pick(m[1], ['fastethernet', 'serial']);
      if (!ty || ty === '?amb') return null;
      const name = (ty === 'fastethernet' ? 'FastEthernet' : 'Serial') + m[2];
      return R.st.ifs[name] ? name : '';
    }

    function exec(raw) {
      raw = String(raw ?? '');
      const st = R.st;
      if (st.wait === 'copy') {
        out('Destination filename [startup-config]? ' + raw, 'c');
        st.wait = null;
        const v = raw.trim();
        if (!v || /^startup-config$/i.test(v)) doSave();
        else out('%Error opening ' + v + ' (연습창에서는 startup-config만 저장해요)', 'e');
        return;
      }
      if (st.wait && st.wait.startsWith('banner:')) {
        const d = st.wait.slice(7);
        out(raw, 'c');
        const k = raw.indexOf(d);
        if (k >= 0) { st.banner += (st.banner ? '\n' : '') + raw.slice(0, k); st.wait = null; } else st.banner += (st.banner ? '\n' : '') + raw;
        return;
      }
      out(prompt() + raw, 'c');
      const line = raw.trim();
      if (!line) return;
      R.hist.push(raw); if (R.hist.length > 100) R.hist.shift();
      if (line.endsWith('?')) { help(line.slice(0, -1)); return; }
      const tk = line.split(/\s+/);
      switch (st.mode) {
        case 'user': return cmdUser(tk, raw);
        case 'priv': return cmdPriv(tk, raw);
        case 'config': return cmdConfig(tk, raw);
        case 'if': return cmdSub(tk, raw, cmdIf);
        case 'line': return cmdSub(tk, raw, cmdLine);
        case 'dhcp': return cmdSub(tk, raw, cmdDhcp);
      }
    }
    // 하위 모드에서 모르는 명령은 전역 설정 명령으로 실행합니다(IOS와 같음).
    function cmdSub(tk, raw, fn) {
      const st = R.st;
      const r = fn(tk, raw);
      if (r !== 'pass') return;
      const w = pick(tk[0], WORDS.config);
      if (w === 'do') { const before = st.mode; const t2 = tk.slice(1); if (!t2.length) { incomplete(); return; } st.mode = 'priv'; cmdPriv(t2, raw); if (st.mode === 'priv' || st.mode === 'user') st.mode = before; return; }
      if (w && w !== '?amb' && !['exit', 'end', 'no'].includes(w)) {
        const before = st.mode;
        st.mode = 'config';
        const ok = cmdConfig(tk, raw);
        if (ok === false && st.mode === 'config') st.mode = before;
        return;
      }
      if (w === '?amb') { amb(tk[0]); return; }
      const hint = st.mode === 'if' ? '인터페이스 모드에서 쓸 수 있는 명령은 ? 로 확인하세요.' : st.mode === 'line' ? '라인 모드 명령: password, login, exec-timeout, transport input' : 'DHCP 모드 명령: network, default-router, dns-server, lease';
      bad(raw, 0, configHint(tk) || hint);
    }
    function configHint(tk) {
      const w0 = (tk[0] || '').toLowerCase();
      if (/^(en|ena|enab|enabl|enable)$/.test(w0) && R.st.mode !== 'user') return '이미 특권 모드 이상이에요.';
      if (/^(conf|confi|config|configu|configur|configure)$/.test(w0)) return 'configure terminal은 특권 모드(#)에서 칩니다. end로 나가세요.';
      if (/^(cop|copy)$/.test(w0) || /^(sh|sho|show)$/.test(w0) || /^(wr|wri|writ|write)$/.test(w0)) return '이 명령은 특권 모드(#)에서 쳐요. end로 나가거나 앞에 do를 붙이세요 (예: do show ip route).';
      if (/^(no)$/.test(w0) && /^shut/.test((tk[1] || '').toLowerCase())) return 'no shutdown은 인터페이스 모드에서 칩니다. 먼저 interface ...';
      if (/^(ip)$/.test(w0) && /^add/.test((tk[1] || '').toLowerCase())) return 'ip address는 인터페이스 모드에서 칩니다. 먼저 interface fastethernet 0/0 처럼 들어가세요.';
      if (/^(cl|clo|cloc|clock|ba|ban|band|bandw|bandwi|bandwid|bandwidt|bandwidth|desc|descr|descri|descrip|descript|descripti|descriptio|description|encap|encaps|encapsu|encapsul|encapsula|encapsulat|encapsulati|encapsulatio|encapsulation)$/.test(w0)) return '인터페이스 명령이에요. 먼저 interface serial 2/0 처럼 들어가세요.';
      if (/^(pass|passw|passwo|passwor|password|login|exec|exec-|exec-t|exec-ti|exec-tim|exec-time|exec-timeo|exec-timeou|exec-timeout|tran|trans|transp|transpo|transpor|transport)$/.test(w0)) return '라인 명령이에요. 먼저 line vty 0 4 또는 line console 0.';
      if (/^(network|default-router|dns-server)$/.test(w0)) return 'DHCP 풀 명령이에요. 먼저 ip dhcp pool 이름.';
      return '';
    }
    function cmdUser(tk, raw) {
      const st = R.st;
      const w = pick(tk[0], WORDS.user);
      if (w === '?amb') return amb(tk[0]);
      if (w === 'enable') { st.mode = 'priv'; return; }
      if (w === 'exit' || w === 'logout') { out('(연습창) 접속을 끝냈다고 보고 처음 상태로 돌아갑니다.', 'h'); return; }
      if (w === 'show') {
        const s = pick(tk[1], ['version', 'users', 'hosts', 'history', 'running-config', 'startup-config', 'ip', 'interfaces', 'flash:', 'processes']);
        if (['version', 'users', 'hosts', 'history'].includes(s)) return doShow(tk.slice(1), raw, 1);
        return bad(raw, 1, '이 show는 특권 모드(#)에서 됩니다. 먼저 enable(en).');
      }
      bad(raw, 0, configHint(tk) || '지금은 사용자 모드(>)예요. 먼저 enable(en)로 특권 모드에 들어가세요.');
    }
    function cmdPriv(tk, raw) {
      const st = R.st;
      const w = pick(tk[0], WORDS.priv);
      if (w === '?amb') return amb(tk[0]);
      switch (w) {
        case 'enable': return;
        case 'disable': st.mode = 'user'; return;
        case 'exit': case 'logout': st.mode = 'user'; out('(연습창) 로그아웃 → 사용자 모드(>)로 돌아갑니다.', 'h'); return;
        case 'configure': {
          if (tk[1] && pick(tk[1], ['terminal', 'memory', 'network']) !== 'terminal') return bad(raw, 1, 'configure terminal (conf t)');
          st.mode = 'config'; out('Enter configuration commands, one per line.  End with CNTL/Z.'); return;
        }
        case 'copy': {
          const L = ['running-config', 'startup-config', 'flash:', 'tftp:'];
          if (!tk[1]) return incomplete('copy running-config startup-config (copy r s)');
          const a = pick(tk[1], L); if (!a || a === '?amb') return bad(raw, 1, 'copy r s = copy running-config startup-config');
          if (!tk[2]) return incomplete('저장할 곳을 붙이세요: copy r s');
          const b = pick(tk[2], L); if (!b || b === '?amb') return bad(raw, 2, 'copy r s');
          if (a === 'running-config' && b === 'startup-config') { st.wait = 'copy'; out('  ↳ 저장할 파일 이름을 묻고 있어요. Enter를 한 번 더 누르세요 (빈칸 그대로 Enter).', 'h'); return; }
          if (a === 'startup-config' && b === 'running-config') { if (st.saved) { Object.assign(st, JSON.parse(JSON.stringify(st.saved))); out('[OK] 저장된 설정을 불러왔어요.'); } else out('%% Non-volatile configuration memory is not present (저장된 설정 없음)', 'e'); return; }
          out('(연습창에서는 copy running-config startup-config만 연습해요)', 'h'); return;
        }
        case 'write': {
          const s = tk[1] ? pick(tk[1], ['memory', 'terminal', 'erase']) : 'memory';
          if (s === 'memory') { out('Building configuration...'); doSave(true); return; }
          if (s === 'terminal') return doShow(['running-config'], raw, 0);
          if (s === 'erase') { st.saved = null; out('[OK] 저장된 설정을 지웠어요.'); return; }
          return bad(raw, 1);
        }
        case 'show': return doShow(tk.slice(1), raw, 1);
      }
      bad(raw, 0, configHint(tk) || (/^(int|interface|hostname|line|ip|host)/i.test(tk[0]) ? '설정 명령이에요. 먼저 configure terminal(conf t)로 설정 모드에 들어가세요.' : ''));
    }
    function cmdConfig(tk, raw) {
      const st = R.st;
      const w = pick(tk[0], WORDS.config);
      if (w === '?amb') { amb(tk[0]); return false; }
      switch (w) {
        case 'exit': st.mode = 'priv'; return;
        case 'end': st.mode = 'priv'; return;
        case 'do': { const t2 = tk.slice(1); if (!t2.length) { incomplete(); return false; } const m = st.mode; st.mode = 'priv'; cmdPriv(t2, raw); if (st.mode === 'priv' || st.mode === 'user') st.mode = m; return; }
        case 'hostname': {
          if (!tk[1]) { incomplete('hostname 이름'); return false; }
          if (!/^[A-Za-z][\w-]*$/.test(tk[1])) { bad(raw, 1, '이름은 영문자로 시작해야 해요.'); return false; }
          st.host = tk[1]; return;
        }
        case 'interface': {
          if (!tk[1]) { incomplete('interface fastethernet 0/0 또는 interface serial 2/0'); return false; }
          const name = parseIf(tk.slice(1));
          if (name === null) { bad(raw, 1, '예: interface fastethernet 0/0 · int fa0/0 · int s2/0'); return false; }
          if (name === '') { bad(raw, 1, '이 연습 장비 포트: FastEthernet0/0, FastEthernet0/1, Serial2/0, Serial2/1'); return false; }
          st.mode = 'if'; st.cur = name; return;
        }
        case 'line': {
          const t = pick(tk[1], ['console', 'vty', 'aux']);
          if (!t || t === '?amb') { bad(raw, 1, 'line console 0 또는 line vty 0 4'); return false; }
          if (t === 'console') { if (tk[2] !== '0') { (tk[2] ? bad(raw, 2, 'line console 0') : incomplete('line console 0')); return false; } st.mode = 'line'; st.line = 'con'; return; }
          if (t === 'vty') { if (tk[2] !== '0' || !/^(4|15)$/.test(tk[3] || '')) { (tk[2] ? bad(raw, tk[2] !== '0' ? 2 : 3, 'line vty 0 4') : incomplete('line vty 0 4')); return false; } st.mode = 'line'; st.line = 'vty'; return; }
          out('(연습창에서는 console과 vty만 연습해요)', 'h'); return false;
        }
        case 'enable': {
          const t = pick(tk[1], ['secret', 'password']);
          if (!t || t === '?amb') { bad(raw, 1, 'enable secret 암호 / enable password 암호'); return false; }
          if (!tk[2]) { incomplete(); return false; }
          if (t === 'secret') st.enSecret = tk.slice(2).join(' '); else st.enPass = tk.slice(2).join(' ');
          return;
        }
        case 'ip': {
          const t = pick(tk[1], ['route', 'default-gateway', 'default-network', 'dhcp', 'domain-name', 'host', 'routing', 'address']);
          if (t === 'address') { bad(raw, 1, 'ip address는 인터페이스 모드에서 칩니다. 먼저 interface ...'); return false; }
          if (!t || t === '?amb') { bad(raw, 1, 'ip route · ip default-gateway · ip default-network · ip dhcp pool'); return false; }
          if (t === 'route') {
            if (!isIp(tk[2])) { tk[2] ? bad(raw, 2) : incomplete('ip route 목적지 마스크 다음홉'); return false; }
            if (!isMask(tk[3])) { tk[3] ? bad(raw, 3, '마스크 예: 255.255.255.0') : incomplete(); return false; }
            if (!isIp(tk[4])) { tk[4] ? bad(raw, 4, '다음 홉 IP') : incomplete('다음 홉 IP를 붙이세요'); return false; }
            st.routes = st.routes.filter(r => !(r.net === tk[2] && r.mask === tk[3]));
            st.routes.push({ net: tk[2], mask: tk[3], via: tk[4] }); return;
          }
          if (t === 'default-gateway' || t === 'default-network') {
            if (!isIp(tk[2])) { tk[2] ? bad(raw, 2) : incomplete(); return false; }
            if (t === 'default-gateway') st.gw = tk[2]; else st.defnet = tk[2]; return;
          }
          if (t === 'dhcp') {
            const s = pick(tk[2], ['pool', 'excluded-address']);
            if (s === 'excluded-address') {
              if (!isIp(tk[3])) { tk[3] ? bad(raw, 3) : incomplete('ip dhcp excluded-address 시작IP [끝IP]'); return false; }
              if (tk[4] && !isIp(tk[4])) { bad(raw, 4); return false; }
              st.excluded.push({ from: tk[3], to: tk[4] || tk[3] }); return;
            }
            if (s !== 'pool') { bad(raw, 2, 'ip dhcp pool 이름'); return false; }
            if (!tk[3]) { incomplete('ip dhcp pool 이름'); return false; }
            st.pools[tk[3]] = st.pools[tk[3]] || { net: '', mask: '', gw: '', dns: '', domain: '', lease: null };
            st.mode = 'dhcp'; st.pool = tk[3]; return;
          }
          out('(연습창에서는 이 ip 명령을 기록만 합니다)', 'h'); return;
        }
        case 'snmp-server': {
          if (pick(tk[1], ['community', 'location', 'contact']) !== 'community') { bad(raw, 1, 'snmp-server community 이름 ro'); return false; }
          if (!tk[2]) { incomplete('snmp-server community 이름 ro'); return false; }
          const md = tk[3] ? pick(tk[3], ['ro', 'rw']) : 'ro';
          if (!md || md === '?amb') { bad(raw, 3, 'ro(읽기 전용) 또는 rw(읽기·쓰기)'); return false; }
          st.snmp = st.snmp.filter(x => x.name !== tk[2]); st.snmp.push({ name: tk[2], mode: md }); return;
        }
        case 'banner': {
          if (pick(tk[1], ['motd', 'login', 'exec']) !== 'motd') { bad(raw, 1, 'banner motd #글#'); return false; }
          const rest = raw.slice(raw.toLowerCase().indexOf(tk[1].toLowerCase()) + tk[1].length).trim();
          if (!rest) { incomplete(); return false; }
          const d = rest[0], body = rest.slice(1), k = body.indexOf(d);
          st.banner = '';
          if (k >= 0) st.banner = body.slice(0, k);
          else { st.banner = body; st.wait = 'banner:' + d; out(`Enter TEXT message.  End with the character '${d}'.`); }
          return;
        }
        case 'no': {
          const t = pick(tk[1], ['ip', 'hostname', 'snmp-server', 'banner', 'enable']);
          if (t === 'ip') {
            const s = pick(tk[2], ['route', 'default-gateway', 'default-network', 'dhcp']);
            if (s === 'route') { st.routes = st.routes.filter(r => !(r.net === tk[3] && r.mask === tk[4])); return; }
            if (s === 'default-gateway') { st.gw = ''; return; }
            if (s === 'default-network') { st.defnet = ''; return; }
            if (s === 'dhcp' && tk[4]) { delete st.pools[tk[4]]; return; }
          }
          if (t === 'hostname') { st.host = 'Router'; return; }
          if (t === 'snmp-server' && tk[3]) { st.snmp = st.snmp.filter(x => x.name !== tk[3]); return; }
          if (t === 'banner') { st.banner = ''; return; }
          if (t === 'enable') { const s = pick(tk[2], ['secret', 'password']); if (s === 'secret') st.enSecret = ''; else if (s === 'password') st.enPass = ''; return; }
          bad(raw, 1, configHint(tk) || ''); return false;
        }
      }
      bad(raw, 0, configHint(tk) || '설정 모드 명령은 ? 로 확인하세요.');
      return false;
    }
    function cmdIf(tk, raw) {
      const st = R.st, I = st.ifs[st.cur];
      const w = pick(tk[0], WORDS.if);
      if (w === '?amb') { amb(tk[0]); return; }
      switch (w) {
        case 'exit': st.mode = 'config'; st.cur = null; return;
        case 'end': st.mode = 'priv'; st.cur = null; return;
        case 'interface': { const before = st.cur; st.mode = 'config'; if (cmdConfig(tk, raw) === false) { st.mode = 'if'; st.cur = before; } return; }
        case 'shutdown': I.shut = true; return;
        case 'ip': {
          const gl = pick(tk[1], ['route', 'default-gateway', 'default-network', 'dhcp']);
          if (gl && gl !== '?amb') return 'pass';
          const t = pick(tk[1], ['address', 'helper-address', 'nat']);
          if (t !== 'address') { bad(raw, 1, 'ip address IP 마스크'); return; }
          if (!isIp(tk[2])) { tk[2] ? bad(raw, 2, 'IP 예: 192.168.0.100') : incomplete('ip address IP 마스크'); return; }
          if (!tk[3]) { incomplete('마스크를 붙이세요 (/24 → 255.255.255.0)'); return; }
          if (!isMask(tk[3])) { bad(raw, 3, /^\/?\d+$/.test(tk[3]) ? '라우터는 /24 표기를 안 받아요. 255.255.255.0 처럼 쓰세요.' : '마스크 예: 255.255.255.0'); return; }
          if (tk[4] !== undefined) {
            if (pick(tk[4], ['secondary']) !== 'secondary') { bad(raw, 4, '보조 IP는 끝에 secondary'); return; }
            if (!I.ip) { out('% Primary address must be configured first (첫 IP부터 설정하세요)', 'e'); return; }
            I.sec = I.sec.filter(x => x.ip !== tk[2]); I.sec.push({ ip: tk[2], mask: tk[3] }); return;
          }
          I.ip = tk[2]; I.mask = tk[3]; return;
        }
        case 'description': {
          const rest = raw.trim().slice(tk[0].length).trim();
          if (!rest) { incomplete('description 글'); return; }
          I.desc = rest; return;
        }
        case 'bandwidth': {
          if (!/^\d+$/.test(tk[1] || '')) { tk[1] ? bad(raw, 1, '숫자만 (kbps). 예: bandwidth 2048') : incomplete('bandwidth 숫자(kbps)'); return; }
          I.bw = +tk[1]; return;
        }
        case 'clock': {
          if (pick(tk[1], ['rate']) !== 'rate') { bad(raw, 1, 'clock rate 숫자'); return; }
          if (!I.serial) { bad(raw, 0, 'clock rate는 시리얼 포트에만 설정해요.'); return; }
          if (!/^\d+$/.test(tk[2] || '')) { tk[2] ? bad(raw, 2, '숫자만 (bps). 72k → 72000') : incomplete('clock rate 숫자(bps)'); return; }
          if (!CLOCKS.includes(+tk[2])) { bad(raw, 2, '라우터가 받는 값이 아니에요. 예: 9600, 56000, 64000, 72000, 128000'); return; }
          I.clock = +tk[2]; return;
        }
        case 'encapsulation': {
          if (!I.serial) { bad(raw, 0, '이 연습창에서 캡슐화는 시리얼 포트에서만 해요.'); return; }
          const e = pick(tk[1], ['frame-relay', 'ppp', 'hdlc']);
          if (!e || e === '?amb') { tk[1] ? bad(raw, 1, 'frame-relay · ppp · hdlc') : incomplete('encapsulation frame-relay'); return; }
          I.encap = e; return;
        }
        case 'frame-relay': {
          if (pick(tk[1], ['interface-dlci', 'lmi-type', 'map']) !== 'interface-dlci') { bad(raw, 1, 'frame-relay interface-dlci 번호'); return; }
          const n = +tk[2];
          if (!(n >= 16 && n <= 1007)) { tk[2] ? bad(raw, 2, 'DLCI(Data Link Connection Identifier)는 16~1007') : incomplete(); return; }
          I.dlci = n; return;
        }
        case 'no': {
          const t = pick(tk[1], ['shutdown', 'ip', 'description', 'bandwidth', 'clock']);
          if (t === 'shutdown') { I.shut = false; out(`%LINK-3-UPDOWN: Interface ${st.cur}, changed state to up`, 'ok'); return; }
          if (t === 'ip') { if (pick(tk[2], ['address']) === 'address') { if (tk[3] && tk[5] && /^sec/i.test(tk[5])) I.sec = I.sec.filter(x => x.ip !== tk[3]); else { I.ip = ''; I.mask = ''; I.sec = []; } return; } }
          if (t === 'description') { I.desc = ''; return; }
          if (t === 'bandwidth') { I.bw = I.serial ? 1544 : 100000; return; }
          if (t === 'clock') { I.clock = 0; return; }
          bad(raw, 1, 'no shutdown · no ip address · no description'); return;
        }
      }
      return 'pass';
    }
    function cmdLine(tk, raw) {
      const st = R.st, L = st.lines[st.line];
      const w = pick(tk[0], WORDS.line);
      if (w === '?amb') { amb(tk[0]); return; }
      switch (w) {
        case 'exit': st.mode = 'config'; st.line = null; return;
        case 'end': st.mode = 'priv'; st.line = null; return;
        case 'password': if (!tk[1]) { incomplete('password 비밀번호'); return; } L.pw = tk.slice(1).join(' '); return;
        case 'login': L.login = true; return;
        case 'exec-timeout': {
          if (!/^\d+$/.test(tk[1] || '')) { tk[1] ? bad(raw, 1, '분 초 순서: exec-timeout 3 50') : incomplete('exec-timeout 분 초'); return; }
          if (tk[2] !== undefined && !/^\d+$/.test(tk[2])) { bad(raw, 2, '초는 숫자'); return; }
          L.tm = [+tk[1], tk[2] !== undefined ? +tk[2] : 0]; return;
        }
        case 'transport': {
          if (pick(tk[1], ['input', 'output', 'preferred']) !== 'input') { bad(raw, 1, 'transport input ssh'); return; }
          const opts = tk.slice(2).map(x => pick(x, ['ssh', 'telnet', 'all', 'none']));
          if (!opts.length) { incomplete('transport input ssh'); return; }
          if (opts.some(x => !x || x === '?amb')) { bad(raw, 2 + opts.findIndex(x => !x || x === '?amb'), 'ssh · telnet · all · none'); return; }
          L.tr = opts.join(' '); return;
        }
        case 'no': { const t = pick(tk[1], ['login', 'password', 'exec-timeout']); if (t === 'login') { L.login = false; return; } if (t === 'password') { L.pw = ''; return; } if (t === 'exec-timeout') { L.tm = null; return; } bad(raw, 1); return; }
      }
      return 'pass';
    }
    function cmdDhcp(tk, raw) {
      const st = R.st, P = st.pools[st.pool];
      const w = pick(tk[0], WORDS.dhcp);
      if (w === '?amb') { amb(tk[0]); return; }
      switch (w) {
        case 'exit': st.mode = 'config'; st.pool = null; return;
        case 'end': st.mode = 'priv'; st.pool = null; return;
        case 'network': {
          if (!isIp(tk[1])) { tk[1] ? bad(raw, 1) : incomplete('network 192.168.100.0 255.255.255.0'); return; }
          let m = tk[2];
          if (/^\/\d{1,2}$/.test(m || '')) { const n = +m.slice(1); const v = n ? (0xFFFFFFFF << (32 - n)) >>> 0 : 0; m = [24, 16, 8, 0].map(k => (v >>> k) & 255).join('.'); }
          if (!isMask(m)) { tk[2] ? bad(raw, 2, '마스크 예: 255.255.255.0') : incomplete('마스크를 붙이세요'); return; }
          P.net = tk[1]; P.mask = m; return;
        }
        case 'default-router': if (!isIp(tk[1])) { tk[1] ? bad(raw, 1) : incomplete(); return; } P.gw = tk[1]; return;
        case 'dns-server': if (!isIp(tk[1])) { tk[1] ? bad(raw, 1) : incomplete(); return; } P.dns = tk[1]; return;
        case 'domain-name': if (!tk[1]) { incomplete(); return; } P.domain = tk[1]; return;
        case 'lease': if (!/^\d+$/.test(tk[1] || '')) { tk[1] ? bad(raw, 1) : incomplete('lease 일 [시간 [분]]'); return; } P.lease = +tk[1]; return;
      }
      return 'pass';
    }
    function doSave(direct) {
      if (!direct) out('Building configuration...');
      R.st.saved = snap(R.st);
      out('[OK]', 'ok');
      if (R.onSave) R.onSave();
    }
    function help(prefix) {
      const st = R.st;
      const p = prefix.trim();
      const list = HELP[st.mode];
      const t0 = p.split(/\s+/);
      if (p && (pick(t0[0], ['show']) === 'show' || (pick(t0[0], ['do']) === 'do' && pick(t0[1], ['show']) === 'show'))) {
        out('show 다음에 올 수 있는 것:', 'h');
        [['running-config', '지금 설정 전체'], ['startup-config', '저장된 설정'], ['ip route', '라우팅 테이블'], ['ip interface brief', '인터페이스 요약'], ['interfaces', '인터페이스 자세히'], ['flash', '플래시 메모리'], ['users', '접속 사용자'], ['processes', '프로세스'], ['hosts', '호스트 표'], ['version', '버전'], ['clock', '시계']].forEach(([w, d]) => out(`  ${w.padEnd(20)} ${d}`, 'h'));
        return;
      }
      if (!p || /\s$/.test(prefix)) {
        out(p ? `"${p}" 다음에 올 수 있는 것은 아래 설명을 참고하세요.` : '지금 모드에서 쓸 수 있는 명령:', 'h');
        list.forEach(([w, d]) => out(`  ${w.padEnd(14)} ${d}`, 'h'));
        return;
      }
      const tk = p.split(/\s+/);
      if (tk.length === 1) {
        const c = list.filter(([w]) => w.startsWith(tk[0].toLowerCase()));
        if (!c.length) out('% Unrecognized command', 'e'); else c.forEach(([w, d]) => out(`  ${w.padEnd(14)} ${d}`, 'h'));
        return;
      }
      out('명령을 끝까지 쓴 뒤 한 칸 띄우고 ? 를 쳐 보세요.', 'h');
    }
    function doShow(tk, raw, base) {
      const st = R.st;
      if (!tk.length) return incomplete('show ip route · show running-config · show flash …');
      const w = pick(tk[0], ['running-config', 'startup-config', 'ip', 'interfaces', 'version', 'flash:', 'users', 'processes', 'hosts', 'history', 'clock']);
      if (!w || w === '?amb') return w === '?amb' ? amb(tk[0], 'show 다음 단어를 조금 더 쳐 보세요.') : bad(raw, base, 'show ip route · show flash · show users · show running-config');
      let key = w.replace(':', '');
      if (w === 'running-config') out(configText(st, false));
      else if (w === 'startup-config') { if (st.saved) out(configText(st.saved, true)); else out('startup-config is not present (아직 저장 안 함)', 'e'); }
      else if (w === 'ip') {
        const s = pick(tk[1], ['route', 'interface', 'protocols']);
        if (s === 'route') { key = 'ip route'; out(routeText(st)); }
        else if (s === 'interface') { key = 'ip interface brief'; out(briefText(st)); }
        else return tk[1] ? bad(raw, base + 1, 'show ip route · show ip interface brief') : incomplete('show ip route');
      }
      else if (w === 'interfaces') {
        let names = Object.keys(st.ifs);
        if (tk[1]) { const n = parseIf(tk.slice(1)); if (!n) return bad(raw, base + 1, 'show interfaces serial 2/0'); names = [n]; }
        out(names.map(n => ifText(st, n)).join('\n'));
      }
      else if (w === 'version') out(`Cisco IOS Software (연습창 예시 화면)\nROM: System Bootstrap\n${st.host} uptime is 12 minutes\nSystem image file is "flash:ios-image.bin"\n2 FastEthernet interfaces\n2 Serial interfaces\n32K bytes of NVRAM.\nConfiguration register is 0x2102`);
      else if (w === 'flash:') out('System flash directory:\nFile  Length   Name/status\n  1   16599160 ios-image.bin\n[16599224 bytes used, 16955208 available, 33554432 total]\n32768K bytes of processor board System flash (Read/Write)');
      else if (w === 'users') out('    Line       User       Host(s)              Idle       Location\n*  0 con 0                idle                 00:00:00');
      else if (w === 'processes') out('CPU utilization for five seconds: 0%/0%; one minute: 0%; five minutes: 0%\n PID QTy       PC Runtime(ms)  Invoked   uSecs    Stacks TTY Process\n   1 Cwe 60A0B9D8           0        1       0 5644/6000   0 Chunk Manager\n   2 Csp 60A1FCA4           4      153      26 2640/3000   0 Load Meter\n   … (연습창 예시)');
      else if (w === 'hosts') out('Default domain is not set\nName/address lookup uses domain service\nName servers are 255.255.255.255\n\nHost                      Port  Flags      Age Type   Address(es)');
      else if (w === 'history') out(R.hist.slice(-10).map(h => '  ' + h).join('\n'));
      else if (w === 'clock') out('*09:20:00.000 KST Sun Dec 6 2026');
      st.shows.push(key);
    }
    function configText(c, saved) {
      const L = [];
      L.push('Building configuration...', '', `Current configuration : ${600 + JSON.stringify(c).length % 400} bytes`, '!', 'version 12.4', 'no service password-encryption', '!', `hostname ${c.host}`, '!');
      if (c.enSecret) L.push('enable secret 5 (암호화된 값)');
      if (c.enPass) L.push(`enable password ${c.enPass}`);
      (c.excluded || []).forEach(x => L.push(`ip dhcp excluded-address ${x.from}${x.to !== x.from ? ' ' + x.to : ''}`));
      for (const [n, p] of Object.entries(c.pools)) { L.push('!', `ip dhcp pool ${n}`); if (p.net) L.push(` network ${p.net} ${p.mask}`); if (p.gw) L.push(` default-router ${p.gw}`); if (p.dns) L.push(` dns-server ${p.dns}`); if (p.domain) L.push(` domain-name ${p.domain}`); if (p.lease != null) L.push(` lease ${p.lease}`); }
      for (const [n, I] of Object.entries(c.ifs)) {
        L.push('!', `interface ${n}`);
        if (I.desc) L.push(` description ${I.desc}`);
        if (I.serial && I.bw !== 1544) L.push(` bandwidth ${I.bw}`);
        if (!I.serial && I.bw !== 100000) L.push(` bandwidth ${I.bw}`);
        if (I.ip) { L.push(` ip address ${I.ip} ${I.mask}`); I.sec.forEach(s => L.push(` ip address ${s.ip} ${s.mask} secondary`)); } else L.push(' no ip address');
        if (I.serial && I.encap !== 'hdlc') L.push(` encapsulation ${I.encap}`);
        if (I.dlci) L.push(` frame-relay interface-dlci ${I.dlci}`);
        if (I.shut) L.push(' shutdown');
        if (I.clock) L.push(` clock rate ${I.clock}`);
        if (!I.serial) L.push(' duplex auto', ' speed auto');
      }
      L.push('!');
      if (c.gw) L.push(`ip default-gateway ${c.gw}`);
      if (c.defnet) L.push(`ip default-network ${c.defnet}`);
      c.routes.forEach(r => L.push(`ip route ${r.net} ${r.mask} ${r.via}`));
      if (c.snmp.length) { L.push('!'); c.snmp.forEach(s => L.push(`snmp-server community ${s.name} ${s.mode.toUpperCase()}`)); }
      if (c.banner) L.push('!', `banner motd ^C${c.banner}^C`);
      L.push('!');
      const ln = (title, x) => { L.push(title); if (x.tm) L.push(` exec-timeout ${x.tm[0]} ${x.tm[1]}`); if (x.pw) L.push(` password ${x.pw}`); if (x.login) L.push(' login'); if (x.tr) L.push(` transport input ${x.tr}`); };
      ln('line con 0', c.lines.con); L.push('line aux 0'); ln('line vty 0 4', c.lines.vty);
      L.push('!', 'end');
      if (saved) L[2] = 'Using ' + (600 + JSON.stringify(c).length % 400) + ' out of 29688 bytes';
      return L.join('\n');
    }
    function briefText(c) {
      const pad = (s, n) => String(s).padEnd(n);
      return [pad('Interface', 23) + pad('IP-Address', 16) + 'OK? Method Status                Protocol']
        .concat(Object.entries(c.ifs).map(([n, I]) => pad(n, 23) + pad(I.ip || 'unassigned', 16) + pad('YES', 4) + pad(I.ip ? 'manual' : 'unset', 7) + (I.shut ? pad('administratively down', 22) + 'down' : pad('up', 22) + 'up'))).join('\n');
    }
    function ifText(c, n) {
      const I = c.ifs[n];
      return `${n} is ${I.shut ? 'administratively down' : 'up'}, line protocol is ${I.shut ? 'down' : 'up'}\n  Hardware is ${I.serial ? 'PowerQUICC Serial' : 'Fast Ethernet'}${I.desc ? `\n  Description: ${I.desc}` : ''}\n  ${I.ip ? `Internet address is ${I.ip}/${prefixOf(I.mask)}` : 'Internet address is not set'}\n  MTU 1500 bytes, BW ${I.bw} Kbit/sec, DLY ${I.serial ? 20000 : 100} usec\n  Encapsulation ${I.serial ? I.encap.toUpperCase() : 'ARPA'}${I.serial && I.clock ? `\n  DCE, clock rate ${I.clock}` : ''}`;
    }
    function routeText(c) {
      const L = ['Codes: C - connected, S - static, R - RIP, O - OSPF, D - EIGRP', '       * - candidate default', '', 'Gateway of last resort is not set', ''];
      let any = false;
      for (const [n, I] of Object.entries(c.ifs)) {
        if (I.shut || !I.ip) continue;
        L.push(`C    ${netOf(I.ip, I.mask)}/${prefixOf(I.mask)} is directly connected, ${n}`); any = true;
        I.sec.forEach(s => L.push(`C    ${netOf(s.ip, s.mask)}/${prefixOf(s.mask)} is directly connected, ${n}`));
      }
      c.routes.forEach(r => { L.push(`S    ${r.net}/${prefixOf(r.mask)} [1/0] via ${r.via}`); any = true; });
      if (!any) L.push('(경로 없음: 켜진(no shutdown) 인터페이스나 정적 경로가 없어요)');
      return L.join('\n');
    }
    function tabComplete(v) {
      const tk = v.split(' '); const last = tk[tk.length - 1];
      if (!last) return v;
      const words = tk.length === 1 ? WORDS[R.st.mode] : TAB_WORDS;
      const c = words.filter(w => w.startsWith(last.toLowerCase()));
      if (c.length === 1) tk[tk.length - 1] = c[0] + ' ';
      return tk.join(' ');
    }
    function reset() { R.st = fresh(); R.out = []; R.hist = []; }
    Object.assign(R, { exec, prompt, reset, configText, tabComplete, flat: () => flatten(R.st.saved) });
    return R;
  }

  // 채점용: 저장된 설정을 평평한 key→값으로 바꿉니다.
  function flatten(c) {
    if (!c) return { saved: false };
    const o = { saved: true, host: c.host, enSecret: c.enSecret, enPass: c.enPass, gw: c.gw, defnet: c.defnet, routes: c.routes, snmp: c.snmp, shows: c.shows, banner: c.banner, excluded: c.excluded || [] };
    for (const [n, I] of Object.entries(c.ifs)) for (const k of ['ip', 'mask', 'sec', 'shut', 'desc', 'bw', 'clock', 'encap', 'dlci']) o[`${n}.${k}`] = I[k];
    for (const l of ['con', 'vty']) { const L = c.lines[l]; o[`${l}.pw`] = L.pw; o[`${l}.login`] = L.login; o[`${l}.tm`] = L.tm; o[`${l}.tr`] = L.tr; }
    for (const [n, p] of Object.entries(c.pools)) for (const k of ['net', 'mask', 'gw', 'dns', 'domain', 'lease']) o[`pool.${n}.${k}`] = p[k];
    o.pools = Object.keys(c.pools);
    return o;
  }

  return { createRouter, flatten, isIp, isMask, prefixOf, netOf };
});
