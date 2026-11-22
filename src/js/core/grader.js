/* 채점기 — 화면(브라우저)과 자동 테스트(Node)가 같은 코드를 씁니다.
 * 정답 조건 표기:
 *   값            → 같으면 정답 (글자는 대소문자·앞뒤 공백 무시, 숫자는 숫자로 비교)
 *   {$eq, $cs}    → $cs:true면 대소문자 구분
 *   {$any:[…]}    → 여러 표기 중 하나
 *   {$has: x}     → 목록에 x가 들어 있음 (x가 객체면 그 칸들이 모두 맞는 항목)
 *   {$set:[…]}    → 목록이 순서 상관없이 똑같음
 *   {$none:true}  → 비어 있음(없음)
 *   배열          → 순서까지 똑같음
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GRADER = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const numLike = v => typeof v === 'number' || (typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v));

  function norm(v, cs) {
    if (v == null) return '';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    let s = String(v).trim().replace(/\s+/g, ' ');
    if (!cs) s = s.toLowerCase();
    return s;
  }
  function eqPrim(exp, got, cs) {
    if (typeof exp === 'boolean' || typeof got === 'boolean') return !!exp === !!got && (got !== undefined || exp === false);
    if (numLike(exp) && numLike(got) && exp !== '' && got !== '') return Number(exp) === Number(got);
    return norm(exp, cs) === norm(got, cs);
  }
  function eqItem(exp, got, cs) {
    if (isObj(exp)) {
      if (!isObj(got)) return false;
      return Object.keys(exp).every(k => match(exp[k], got[k], cs).ok);
    }
    if (Array.isArray(exp)) return Array.isArray(got) && exp.length === got.length && exp.every((e, i) => eqItem(e, got[i], cs));
    return eqPrim(exp, got, cs);
  }
  const empty = v => v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0);

  // 한 칸 비교 → {ok}
  function match(exp, got, csIn) {
    if (isObj(exp)) {
      const cs = exp.$cs != null ? exp.$cs : csIn;
      if ('$any' in exp) return { ok: exp.$any.some(e => match(e, got, cs).ok) };
      if ('$has' in exp) return { ok: Array.isArray(got) && got.some(x => eqItem(exp.$has, x, cs)) };
      if ('$hasAll' in exp) return { ok: Array.isArray(got) && exp.$hasAll.every(e => got.some(x => eqItem(e, x, cs))) };
      if ('$set' in exp) { const a = exp.$set, b = Array.isArray(got) ? got : []; return { ok: a.length === b.length && a.every(e => b.some(x => eqItem(e, x, cs))) && b.every(x => a.some(e => eqItem(e, x, cs))) }; }
      if ('$none' in exp) return { ok: empty(got) };
      if ('$eq' in exp) return { ok: eqItem(exp.$eq, got, cs) };
      return { ok: eqItem(exp, got, cs) };
    }
    return { ok: eqItem(exp, got, csIn) };
  }

  // 보여 주기용 글자
  function show(v) {
    if (v == null || v === '') return '(비어 있음)';
    if (typeof v === 'boolean') return v ? '예(켬)' : '아니요(끔)';
    if (Array.isArray(v)) return v.length ? v.map(show).join(', ') : '(없음)';
    if (isObj(v)) {
      if ('$any' in v) return v.$any.map(show).join(' 또는 ');
      if ('$has' in v) return show(v.$has) + ' 포함';
      if ('$hasAll' in v) return v.$hasAll.map(show).join(', ') + ' 모두 포함';
      if ('$set' in v) return show(v.$set);
      if ('$none' in v) return '(없음)';
      if ('$eq' in v) return show(v.$eq);
      return Object.entries(v).map(([k, x]) => `${k}=${show(x)}`).join(' ');
    }
    return String(v);
  }

  // 가상 화면의 최종 상태(평평한 key→값)와 정답 조건 비교
  function gradeState(answer, state, labels) {
    const items = Object.keys(answer).map(key => {
      const exp = answer[key];
      const got = state ? state[key] : undefined;
      const ok = match(exp, got).ok;
      return { key, label: (labels && labels[key]) || key, expected: show(exp), got: show(got), ok };
    });
    return { ok: items.length > 0 && items.every(i => i.ok), items };
  }

  // 단답형: 대소문자·앞뒤 공백 무시, 끝의 마침표 무시, 여러 표기 인정
  function normShort(s, cs) {
    let t = String(s == null ? '' : s).trim().replace(/\s+/g, ' ').replace(/[.。]$/, '');
    if (!cs) t = t.toLowerCase();
    return t;
  }
  // 라우터 명령 줄임말 인식 (예전 웹 버전의 routerMatch를 그대로 옮김)
  const ROUTER_KW = new Set(['enable', 'configure', 'terminal', 'copy', 'running-config', 'startup-config', 'write', 'memory', 'no', 'shutdown', 'interface', 'fastethernet', 'serial', 'ip', 'address', 'secondary', 'clock', 'rate', 'bandwidth', 'description', 'line', 'console', 'vty', 'password', 'login', 'exec-timeout', 'hostname', 'default-gateway', 'default-network', 'dhcp', 'pool', 'network', 'show', 'route', 'flash:', 'users', 'processes', 'hosts', 'version', 'interfaces', 'encapsulation', 'frame-relay', 'snmp-server', 'community', 'ro', 'rw', 'transport', 'input', 'ssh', 'default-router', 'dns-server', 'excluded-address', 'lease']);
  const ONE_LETTER_OK = new Set(['terminal', 'running-config', 'startup-config']);
  function normIf(s) {
    return s.replace(/\b(f|fa|fas|fast|faste|fastet|fasteth|fastethe|fastether|fastethern|fastetherne|fastethernet)\s*(\d+\/\d+)/gi, 'fastethernet $2')
      .replace(/\b(s|se|ser|seri|seria|serial)\s*(\d+\/\d+)/gi, 'serial $2');
  }
  function routerMatch(input, ans, cs) {
    let a = normIf(String(input).trim().replace(/\s+/g, ' '));
    if (/^(wr|wri|writ|write)$/i.test(a)) a = 'write memory';
    const it = a.split(' '), at = normIf(ans).split(' ');
    if (it.length !== at.length) return false;
    return at.every((w, i) => {
      const x = it[i];
      const kw = ROUTER_KW.has(w) || w === 'flash';
      if (kw) { const lx = w === 'flash' ? x.toLowerCase().replace(/:$/, '') : x.toLowerCase(); if (lx === w) return true; if (!w.startsWith(lx)) return false; return lx.length >= 2 || ONE_LETTER_OK.has(w); }
      if (/^\d+$/.test(w) && /^\d+$/.test(x)) return +x === +w;
      return cs ? x === w : x.toLowerCase() === w.toLowerCase();
    });
  }

  function gradeShort(q, input) {
    if (q.router) {
      const g = String(input || '').trim().replace(/\s+/g, ' ').replace(/[.。]$/, '');
      if (!g) return { ok: false, empty: true };
      return { ok: q.answer.accept.some(a => routerMatch(g, a, q.cs) || (a === 'show users' && routerMatch(g, 'show user', q.cs))) };
    }
    const g = normShort(input, q.cs);
    if (!g) return { ok: false, empty: true };
    const acc = q.answer.accept || [];
    const loose = x => x.replace(/[\s\-_()]/g, '');
    const ok = acc.some(a => { const n = normShort(a, q.cs); return n === g || (q.loose !== false && loose(n) === loose(g)); });
    return { ok };
  }
  function gradeChoice(q, pick) { return { ok: pick === q.answer.index }; }
  function gradeMulti(q, picks) {
    const a = (q.answer.indexes || []).slice().sort((x, y) => x - y), b = (picks || []).slice().sort((x, y) => x - y);
    return { ok: a.length === b.length && a.every((x, i) => x === b[i]), missing: a.filter(x => !b.includes(x)), extra: b.filter(x => !a.includes(x)) };
  }
  // 드래그 앤 드롭: {칸 id: 항목 id}
  function gradeDrag(q, placed) {
    const items = Object.keys(q.answer.slots).map(slot => {
      const exp = q.answer.slots[slot], got = (placed || {})[slot];
      const accept = Array.isArray(exp) ? exp : [exp];
      return { key: slot, ok: accept.includes(got), expected: accept[0], got };
    });
    return { ok: items.every(i => i.ok), items };
  }

  // 명령어(콘솔) 비교: 대소문자·공백 무시, 옵션 순서 무시 옵션
  function normCmd(s) { return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function cmdMatches(input, pattern, anyOrder) {
    const a = normCmd(input), b = normCmd(pattern);
    if (a === b) return true;
    if (!anyOrder) return false;
    const ta = a.split(' '), tb = b.split(' ');
    return ta.length === tb.length && ta[0] === tb[0] && ta.slice(1).sort().join(' ') === tb.slice(1).sort().join(' ');
  }
  function gradeConsole(q, history) {
    const acc = q.answer.accept || [];
    const hit = (history || []).find(h => acc.some(a => cmdMatches(h, a, q.answer.anyOrder)));
    return { ok: !!hit, used: hit };
  }

  return { routerMatch, norm, match, show, gradeState, gradeShort, gradeChoice, gradeMulti, gradeDrag, gradeConsole, cmdMatches, normShort };
});
