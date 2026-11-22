// 모든 문제: 정답을 넣으면 정답, 틀린 답을 넣으면 오답으로 채점되는지 확인합니다.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DATA, buildQuestions, loadSims, GRADER, ROUTER } = require('./helpers');

const Q = buildQuestions();
const SIMS = loadSims();
const LABELS = ['기출 복원 2026.06.21', '기출 복원 2026.09.13', '기출 복원 (회차 확인 안 됨)', '예상', '변형', '심화'];

test('문제가 충분히 있고 id가 겹치지 않는다', () => {
  assert.ok(Q.length > 250, `문제 수 ${Q.length}`);
  const ids = new Set();
  for (const q of Q) { assert.ok(!ids.has(q.id), '중복 id ' + q.id); ids.add(q.id); }
});

test('모든 문제에 라벨·출처·지문·시험 종류·유형이 있다', () => {
  const cats = { net: DATA.exam.exams.net.cats.map(c => c[0]), pc: DATA.exam.exams.pc.cats.map(c => c[0]) };
  for (const q of Q) {
    assert.ok(LABELS.includes(q.label), `${q.id} 라벨 "${q.label}"`);
    assert.ok(q.source && [].concat(q.source).every(Boolean), `${q.id} 출처 없음`);
    assert.ok(q.question && q.question.length > 5, `${q.id} 지문 없음`);
    assert.ok(['net', 'pc', 'both'].includes(q.exam), `${q.id} exam`);
    const inCats = q.exam === 'both' ? cats.net.includes(q.cat) || cats.pc.includes(q.cat) : cats[q.exam].includes(q.cat);
    assert.ok(inCats, `${q.id} 유형 ${q.cat}가 exam.json 목록에 없음`);
  }
});

// 정답 조건을 실제 값으로 바꿉니다 (가상 화면 문제의 '정답 상태' 만들기).
function concrete(exp) {
  if (exp && typeof exp === 'object' && !Array.isArray(exp)) {
    if ('$any' in exp) return concrete(exp.$any[0]);
    if ('$has' in exp) return [concrete(exp.$has)];
    if ('$hasAll' in exp) return exp.$hasAll.map(concrete);
    if ('$set' in exp) return exp.$set.map(concrete).reverse();
    if ('$none' in exp) return '';
    if ('$eq' in exp) return concrete(exp.$eq);
    return Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, concrete(v)]));
  }
  return Array.isArray(exp) ? exp.map(concrete) : exp;
}
function wrong(v) {
  if (typeof v === 'boolean') return !v;
  if (typeof v === 'number') return v + 7;
  if (Array.isArray(v)) return v.length ? [] : ['zzz'];
  if (v === '') return 'zzz-wrong';
  if (v && typeof v === 'object') return {};
  return String(v) + 'X';
}

test('단답형: 인정 답 모두 정답, 엉뚱한 답·빈칸은 오답', () => {
  for (const q of Q.filter(q => q.type === 'short')) {
    for (const a of q.answer.accept) assert.ok(GRADER.gradeShort(q, a).ok, `${q.id} "${a}"`);
    assert.ok(GRADER.gradeShort(q, `  ${q.answer.accept[0].toUpperCase()}  `).ok || q.cs, `${q.id} 대소문자·공백 무시`);
    assert.equal(GRADER.gradeShort(q, 'zzqx 틀린답').ok, false, q.id);
    assert.equal(GRADER.gradeShort(q, '').ok, false, q.id);
  }
});

test('선택형·다택형: 정답만 정답', () => {
  for (const q of Q.filter(q => q.type === 'choice')) {
    assert.ok(q.answer.index >= 0 && q.answer.index < q.options.length, q.id);
    assert.ok(GRADER.gradeChoice(q, q.answer.index).ok, q.id);
    assert.equal(GRADER.gradeChoice(q, (q.answer.index + 1) % q.options.length).ok, false, q.id);
    if (q.optionWhy) assert.equal(q.optionWhy.length, q.options.length, `${q.id} optionWhy 개수`);
  }
  for (const q of Q.filter(q => q.type === 'multi')) {
    const a = q.answer.indexes;
    assert.ok(a.length && a.every(i => i >= 0 && i < q.options.length), q.id);
    assert.ok(GRADER.gradeMulti(q, a.slice().reverse()).ok, q.id);
    assert.equal(GRADER.gradeMulti(q, a.slice(1)).ok, false, `${q.id} 하나 빠짐`);
    const extra = q.options.map((o, i) => i).find(i => !a.includes(i));
    if (extra != null) assert.equal(GRADER.gradeMulti(q, a.concat(extra)).ok, false, `${q.id} 하나 더`);
  }
});

test('드래그 앤 드롭: 정답 배치만 정답', () => {
  for (const q of Q.filter(q => q.type === 'drag')) {
    const right = Object.fromEntries(Object.entries(q.answer.slots).map(([s, i]) => [s, [].concat(i)[0]]));
    for (const id of Object.values(right)) assert.ok(q.items.some(it => it.id === id), q.id);
    assert.ok(GRADER.gradeDrag(q, right).ok, q.id);
    const keys = Object.keys(right); const bad = { ...right, [keys[0]]: right[keys[1]], [keys[1]]: right[keys[0]] };
    assert.equal(GRADER.gradeDrag(q, bad).ok, false, q.id);
    assert.equal(GRADER.gradeDrag(q, {}).ok, false, q.id);
  }
});

test('케이블 순서: 표준 이름이 맞다', () => {
  for (const q of Q.filter(q => q.type === 'cable-order')) assert.ok(['A', 'B'].includes(q.answer.std), q.id);
});

test('라우터: 정답 명령을 엔진으로 실행하면 정답, 저장을 빼거나 다른 미션 명령이면 오답', () => {
  const routers = Q.filter(q => q.type === 'router');
  const run = cmds => { const R = ROUTER.createRouter(); cmds.forEach(c => R.exec(c === '(Enter)' ? '' : c)); return ROUTER.flatten(R.st.saved); };
  for (const q of routers) {
    assert.ok(GRADER.gradeState(q.check, run(q.cmds)).ok, `${q.id} 정답 명령으로 채점 실패: ${JSON.stringify(GRADER.gradeState(q.check, run(q.cmds)).items.filter(i => !i.ok))}`);
    const noSave = q.cmds.filter(c => !/^copy r s$|^\(Enter\)$/.test(c));
    assert.equal(GRADER.gradeState(q.check, run(noSave)).ok, false, `${q.id} 저장 안 했는데 정답`);
    assert.equal(GRADER.gradeState(q.check, run(['en', 'copy r s', '(Enter)'])).ok, false, `${q.id} 아무것도 안 했는데 정답`);
  }
  // 줄임말도 같은 결과
  const q1 = routers.find(q => q.id === 'router-m05');
  assert.ok(GRADER.gradeState(q1.check, run(['enable', 'configure terminal', 'interface serial 2/0', 'ip address 192.168.0.101 255.255.255.0', 'ip address 192.168.0.102 255.255.255.0 secondary', 'no shutdown', 'end', 'copy running-config startup-config', ''])).ok);
});

test('라우터 단답형: 줄임말 인정, 틀린 명령은 오답', () => {
  const q = { type: 'short', router: true, answer: { accept: ['interface fastethernet 0/0'] } };
  for (const a of ['int fa0/0', 'interface fastethernet 0/0', 'int f0/0', 'INT FA 0/0']) assert.ok(GRADER.gradeShort(q, a).ok, a);
  for (const a of ['int s2/0', 'interface fa0/1', 'i fa0/0']) assert.equal(GRADER.gradeShort(q, a).ok, false, a);
});

test('BIOS: 정답 값이 메뉴 선택지에 있고, 기본값 그대로면 오답', () => {
  const B = DATA['pc-bios'];
  const items = Object.values(B.menus).flatMap(m => m.items || []);
  const defaults = () => { const o = { saved: true, supw: '', uspw: '' }; items.forEach(i => { if (i.opts) o[i.id] = i.opts[i.def]; else if (i.kind) o[i.id] = i.def; }); return o; };
  for (const q of Q.filter(q => q.type === 'bios')) {
    for (const [k, v] of Object.entries(q.answer)) {
      const val = concrete(v);
      if (k === 'supw' || k === 'uspw') continue;
      const it = items.find(i => i.id === k);
      assert.ok(it, `${q.id} 항목 ${k} 없음`);
      if (it.opts) assert.ok(it.opts.includes(val), `${q.id} ${k} 값 "${val}"이 선택지에 없음`);
    }
    const st = { ...defaults(), ...Object.fromEntries(Object.entries(q.answer).map(([k, v]) => [k, concrete(v)])) };
    assert.ok(GRADER.gradeState(q.answer, st).ok, q.id);
    assert.equal(GRADER.gradeState(q.answer, defaults()).ok, false, `${q.id} 기본값이 이미 정답`);
    assert.equal(GRADER.gradeState(q.answer, { saved: false }).ok, false, `${q.id} 저장 안 함`);
  }
});

// 가상 화면 정답 키 검사: 정적 키는 모델의 flat(blank())에 있어야 하고, 동적 키는 형식이 맞아야 합니다.
const KEY_RULES = {
  tcpip: /^(mode|ip|mask|gw|dns1|dns2|addrs|gws|dnsAll)$/,
  dhcp: /^scope\.(exists|name|desc|start|end|mask|excl|leaseD|leaseH|leaseM|router|dns|domain|active|resIps|res\.[^.]+\.(ip|mac|desc))$/,
  iis: /^(site\.(exists|kind|name|path|ip|port|host|type|bindings|started|docs|docFirst|dirBrowse|allow|deny|unspec|anonAuth|basicAuth)|ftp\.(ssl|anon|basic|rules|anonRead|anonWrite|allRead|allWrite|msgBanner|msgWelcome|msgExit|msgMax|maxConn|user\.[a-z0-9_]+\.(read|write)))$/,
  dns: /^(zones|zone\|[a-z0-9.-]+\|(exists|type|dyn|file)|rec\|[a-z0-9.-]+\|[a-z0-9@.-]+\|(A|AAAA|CNAME|MX|PTR)(\|prio)?|soa\|[a-z0-9.-]+\|(serial|primary|resp|refresh|retry|expire|minttl)|xfer\|[a-z0-9.-]+\|(allow|mode|list))$/,
  users: /^(user\.[a-z0-9_]+\.(exists|full|desc|pw|mustChange|cannotChange|neverExpires|disabled|groups|homeLocal|homeTo|profile|script)|group\.[a-z0-9 _]+\.(exists|desc|members))$/,
  regedit: /^(key|val|type):hkey_(classes_root|current_user|local_machine|users|current_config)(\\[^\\]+)*$/,
  diskmgmt: /^(vol\.[A-Z]\.(exists|fs|label|sizeMB|quick|compress|disk)|disk\d\.unallocMB|letters)$/,
  mstsc: /^rdp\.(computer|user|saveCred|size|color|bar|audio|keys|printers|clipboard|speed|connected)$/,
  share: /^(share\.(on|name|limit|comment)|share\.[a-z0-9 _]+\.(full|change|read)\.(allow|deny)|ntfs\.users|ntfs\.[a-z0-9 _]+\.(full|modify|rx|list|read|write)\.(allow|deny))$/,
  printer: /^(prn\.default|prn\.p[12]\.(shared|shareName|location|comment|always|from|to|priority)|prn\.p[12]\.perm\.[a-z0-9 _]+\.(print|manage))$/, // 보안 탭에서 추가한 사용자의 권한 키도 허용
};
const ENUMS = {
  services: { start: ['자동(지연된 시작)', '자동', '수동', '사용 안 함'], status: ['running', 'stopped'] },
};

test('가상 화면 문제: 정답 키가 화면 모델에 있고, 정답 상태는 정답·한 칸만 틀려도 오답', () => {
  const sims = Q.filter(q => q.type === 'sim' && q.sim !== 'console');
  assert.ok(sims.length >= 70, `가상 화면 문제 ${sims.length}개`);
  for (const q of sims) {
    const def = SIMS.list[q.sim];
    assert.ok(def, `${q.id} 가상 화면 ${q.sim} 없음`);
    const staticKeys = def.blank && def.flat && !KEY_RULES[q.sim] ? new Set(Object.keys(def.flat(def.blank(), q))) : null;
    for (const k of Object.keys(q.answer)) {
      if (KEY_RULES[q.sim]) assert.match(k, KEY_RULES[q.sim], `${q.id} 키 형식 ${k}`);
      else assert.ok(staticKeys.has(k), `${q.id} 키 ${k}가 ${q.sim} 모델에 없음`);
    }
    if (q.sim === 'services') for (const [k, v] of Object.entries(q.answer)) { const f = k.split('.').pop(); assert.ok(ENUMS.services[f].includes(v), `${q.id} ${k}=${v}`); }
    const good = Object.fromEntries(Object.entries(q.answer).map(([k, v]) => [k, concrete(v)]));
    const r = GRADER.gradeState(q.answer, good);
    assert.ok(r.ok, `${q.id} 정답 상태가 오답: ${JSON.stringify(r.items.filter(i => !i.ok))}`);
    for (const k of Object.keys(q.answer)) {
      const bad = { ...good, [k]: wrong(good[k]) };
      assert.equal(GRADER.gradeState(q.answer, bad).ok, false, `${q.id} ${k}를 틀려도 정답`);
    }
    // 아무것도 안 한 처음 상태는 오답이어야 합니다(문제가 이미 풀려 있으면 안 됨).
    if (def.blank && def.flat) {
      const init = def.blank();
      const qi = q.init ? JSON.parse(JSON.stringify(q.init)) : null;
      if (qi && (q.sim === 'devmgmt' || q.sim === 'services')) Object.entries(qi).forEach(([k, v]) => Object.assign(init[k], v));
      else if (qi && !['regedit', 'dns', 'secpol', 'users'].includes(q.sim)) Object.assign(init, qi);
      assert.equal(GRADER.gradeState(q.answer, def.flat(init, q)).ok, false, `${q.id} 처음 상태가 이미 정답`);
    }
  }
});

test('콘솔 문제: 정답 명령을 시뮬레이터가 알아듣고, 정답 명령만 정답', () => {
  for (const q of Q.filter(q => q.sim === 'console')) {
    for (const a of q.answer.accept) {
      const out = SIMS.consoleRun(a, { clear() {}, exit() {} });
      assert.ok(out && !/내부 또는 외부 명령/.test(out) && !/인식할 수 없는/.test(out), `${q.id} "${a}" 출력: ${String(out).slice(0, 60)}`);
      assert.ok(GRADER.gradeConsole(q, ['dir', a]).ok, `${q.id} ${a}`);
    }
    assert.equal(GRADER.gradeConsole(q, ['dir', 'hostname']).ok, false, q.id);
    assert.equal(GRADER.gradeConsole(q, []).ok, false, q.id);
  }
});

test('모의고사 구성: 두 시험 모두 18문항을 뽑을 수 있다', () => {
  for (const ex of ['net', 'pc']) {
    const E = DATA.exam.exams[ex];
    const used = new Set(); let n = 0;
    for (const sl of E.slots) {
      const pool = Q.filter(q => (q.exam === ex || q.exam === 'both') && sl.cats.includes(q.cat) && (!sl.types || sl.types.includes(q.type)) && !used.has(q.id));
      assert.ok(pool.length > 0, `${ex} 슬롯 ${JSON.stringify(sl)}에 문제가 없음`);
      used.add(pool[0].id); n++;
    }
    assert.equal(n, 18, ex);
  }
});

test('유형마다 기출 복원 또는 변형 + 예상 문제가 3개 이상 있다 (가상 화면 유형)', () => {
  const simCats = [...new Set(Q.filter(q => q.type === 'sim' || q.type === 'router' || q.type === 'bios').map(q => q.cat))];
  for (const c of simCats) {
    const qs = Q.filter(q => q.cat === c && (q.type === 'sim' || q.type === 'router' || q.type === 'bios'));
    assert.ok(qs.length >= 3, `${c}: ${qs.length}개`);
  }
});
