/* 문제 유형별 작업 공간과 채점·해설 화면
 * QT.mount(q, el) → { grade() → 결과, lock(결과)? }   QT.review(q, 결과) → 해설 HTML
 * lock은 정답을 그 자리에 보여 주는 유형(단답·선택·끌어 놓기·케이블)에만 있습니다.
 * 작업형(라우터·BIOS·가상 Windows)은 채점 뒤에도 계속 조작하며 어디서 무엇을 바꾸는지 익히게 잠그지 않습니다. */
(function (g) {
  'use strict';
  const { esc, inline, rich } = g.MD;
  const GR = g.GRADER;
  const h = g.W.h;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const M = {};

  // ───────── 단답형 ─────────
  M.short = (q, el) => {
    el.className = 'run-right plain';
    const inp = h('input', { class: 'input mono', autocomplete: 'off', spellcheck: 'false', placeholder: q.router ? '명령어를 입력하세요 (줄임말도 됩니다)' : '답을 입력하세요', 'aria-label': '답 입력' });
    el.append(h('div', { class: 'ans-pane' }, h('h3', {}, '답안'), inp, h('p', { class: 'muted small' }, q.cs ? '대소문자를 구분합니다. Enter로 채점합니다.' : '대소문자와 앞뒤 공백은 따지지 않습니다. Enter로 채점합니다.')));
    setTimeout(() => inp.focus(), 0);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.dispatchEvent(new CustomEvent('submit-answer', { bubbles: true })); } });
    return { grade: () => ({ ...GR.gradeShort(q, inp.value), given: inp.value }), lock: () => (inp.disabled = true) };
  };

  // ───────── 선택형(하나) / 다택형(모두) ─────────
  function choice(multi) {
    return (q, el) => {
      el.className = 'run-right plain';
      let pick = multi ? [] : null, locked = false;
      const box = h('div', { class: 'opts' });
      const paint = (res) => {
        box.innerHTML = '';
        q.options.forEach((o, i) => {
          const sel = multi ? pick.includes(i) : pick === i;
          const right = multi ? q.answer.indexes.includes(i) : q.answer.index === i;
          let cls = sel ? 'sel' : '', tag = '';
          if (res) { cls = right ? 'right' : sel ? 'wrong' : ''; tag = right ? (sel ? '내 답 · 정답' : '정답') : sel ? '내 답 · 오답' : ''; }
          const why = res && q.optionWhy && q.optionWhy[i] ? h('span', { class: 'why' }, q.optionWhy[i]) : null;
          const b = h('button', { class: 'opt ' + cls, type: 'button', disabled: locked }, h('span', { class: 'mk' }, multi ? (sel ? '✓' : '') : String(i + 1)), h('span', {}, o, why), tag ? h('span', { class: 'res' }, tag) : null);
          b.addEventListener('click', () => { if (locked) return; if (multi) pick = pick.includes(i) ? pick.filter(x => x !== i) : pick.concat(i); else pick = i; paint(); });
          box.append(b);
        });
      };
      paint();
      el.append(h('div', { class: 'ans-pane' }, h('h3', {}, multi ? '알맞은 것을 모두 고르세요' : '하나를 고르세요'), box, h('p', { class: 'muted small' }, multi ? '정답을 모두 고른 뒤 [채점하기]를 누르세요. 부분 점수는 없습니다.' : '숫자 키 1~9로도 고를 수 있습니다.')));
      const key = e => { if (locked || multi || !el.isConnected || el.offsetParent === null || e.target.matches('input,textarea')) return; const n = +e.key; if (n >= 1 && n <= q.options.length) { pick = n - 1; paint(); } };
      addEventListener('keydown', key);
      return {
        grade: () => { const r = multi ? GR.gradeMulti(q, pick) : GR.gradeChoice(q, pick); return { ...r, given: pick }; },
        lock: (res) => { locked = true; paint(res); },
        destroy: () => removeEventListener('keydown', key),
      };
    };
  }
  M.choice = choice(false); M.multi = choice(true);

  // ───────── 드래그 앤 드롭 (끌어 놓기, 또는 보기를 누르고 칸을 눌러도 됨) ─────────
  M.drag = (q, el) => {
    el.className = 'run-right plain';
    const placed = {}; let selItem = null, locked = false;
    const pool = h('div', { class: 'dd-pool' });
    const slots = h('div', { class: 'dd-slots' });
    const order = shuffle(q.items);
    const itemEl = it => { const d = h('div', { class: 'dd-item' + (selItem === it.id ? ' sel' : ''), draggable: !locked, dataset: { id: it.id } }, it.label); d.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', it.id); d.classList.add('dragging'); }); d.addEventListener('dragend', () => d.classList.remove('dragging')); d.addEventListener('click', e => { e.stopPropagation(); if (locked) return; selItem = selItem === it.id ? null : it.id; paint(); }); return d; };
    const put = (slot, id) => { for (const k of Object.keys(placed)) if (placed[k] === id) delete placed[k]; if (slot) placed[slot] = id; selItem = null; paint(); };
    function paint(res) {
      pool.innerHTML = ''; slots.innerHTML = '';
      const used = new Set(Object.values(placed));
      order.filter(it => !used.has(it.id)).forEach(it => pool.append(itemEl(it)));
      if (!pool.children.length) pool.append(h('span', { class: 'muted small' }, '모든 보기를 놓았습니다.'));
      q.slots.forEach(s => {
        const it = q.items.find(x => x.id === placed[s.id]);
        const r = res && res.items.find(x => x.key === s.id);
        const drop = h('div', { class: 'drop' + (r ? (r.ok ? ' ok' : ' x') : '') }, it ? itemEl(it) : h('span', { class: 'muted small' }, '여기에 놓기'));
        drop.addEventListener('dragover', e => { if (locked) return; e.preventDefault(); drop.classList.add('over'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('over'));
        drop.addEventListener('drop', e => { e.preventDefault(); if (!locked) put(s.id, e.dataTransfer.getData('text/plain')); });
        drop.addEventListener('click', () => { if (!locked && selItem) put(s.id, selItem); });
        slots.append(h('div', { class: 'dd-slot' }, h('div', { class: 'lab' }, s.label), drop));
      });
    }
    pool.addEventListener('dragover', e => e.preventDefault());
    pool.addEventListener('drop', e => { e.preventDefault(); if (!locked) put(null, e.dataTransfer.getData('text/plain')); });
    paint();
    el.append(h('div', { class: 'ans-pane', style: { maxWidth: '900px' } }, h('h3', {}, '보기를 끌어다 알맞은 칸에 놓으세요'), h('div', { class: 'dd' }, slots, pool), h('p', { class: 'muted small' }, '끌기가 불편하면 보기를 한 번 누르고 칸을 누르세요. 칸에 놓인 보기를 오른쪽 상자로 끌면 뺍니다.')));
    return { grade: () => ({ ...GR.gradeDrag(q, placed), given: { ...placed } }), lock: res => { locked = true; paint(res); } };
  };

  // ───────── 케이블 색 순서 ─────────
  M['cable-order'] = (q, el) => {
    el.className = 'run-right plain';
    const { WIRE, ORDER, wireBg } = g.WIDGETS;
    const std = q.answer.std, want = ORDER[std];
    const placed = Array(8).fill(null); let sel = null, locked = false;
    const deck = shuffle(Object.keys(WIRE));
    const slotsEl = h('div', { class: 'cab-slots' }), poolEl = h('div', { class: 'cab-pool' });
    const wire = k => { const w = h('div', { class: 'wire', draggable: !locked, title: WIRE[k].n, style: { background: wireBg(k), outline: sel === k ? '3px solid #2457c5' : '' } }); w.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', k)); w.addEventListener('click', e => { e.stopPropagation(); if (!locked) { sel = sel === k ? null : k; paint(); } }); return w; };
    const put = (i, k) => { const old = placed.indexOf(k); if (old >= 0) placed[old] = null; if (i != null) placed[i] = k; sel = null; paint(); };
    function paint(res) {
      slotsEl.innerHTML = ''; poolEl.innerHTML = '';
      placed.forEach((k, i) => {
        const s = h('div', { class: 'cab-slot' + (res ? (k === want[i] ? ' ok' : ' x') : '') }, h('span', { class: 'n' }, `${i + 1}번`), k ? wire(k) : h('span', { class: 'muted small' }, '빈칸'), k ? h('small', {}, WIRE[k].n) : null, res && k !== want[i] ? h('small', { style: { color: '#c8382b' } }, '정답 ' + WIRE[want[i]].n) : null);
        s.addEventListener('dragover', e => { if (!locked) { e.preventDefault(); s.classList.add('over'); } });
        s.addEventListener('dragleave', () => s.classList.remove('over'));
        s.addEventListener('drop', e => { e.preventDefault(); if (!locked) put(i, e.dataTransfer.getData('text/plain')); });
        s.addEventListener('click', () => { if (!locked && sel) put(i, sel); });
        slotsEl.append(s);
      });
      deck.filter(k => !placed.includes(k)).forEach(k => poolEl.append(h('div', { class: 'w' }, wire(k), WIRE[k].n)));
    }
    poolEl.addEventListener('dragover', e => e.preventDefault());
    poolEl.addEventListener('drop', e => { e.preventDefault(); if (!locked) put(null, e.dataTransfer.getData('text/plain')); });
    paint();
    el.append(h('div', { class: 'ans-pane', style: { maxWidth: '900px' } }, h('h3', {}, `RJ-45 커넥터 1번~8번 자리에 선을 놓으세요`), h('p', { class: 'muted small' }, '커넥터 클립(걸쇠)이 아래, 금색 핀이 위로 보이게 들었을 때 왼쪽이 1번입니다.'), h('div', { class: 'cab' }, slotsEl, poolEl)));
    return {
      grade: () => { const items = want.map((k, i) => ({ key: `${i + 1}번`, label: `${i + 1}번 핀`, expected: WIRE[k].n, got: placed[i] ? WIRE[placed[i]].n : '(비어 있음)', ok: placed[i] === k })); return { ok: items.every(x => x.ok), items, given: placed.slice() }; },
      lock: res => { locked = true; paint(res); },
    };
  };

  // ───────── 라우터 명령 창 ─────────
  M.router = (q, el) => {
    el.className = 'run-right plain';
    const R = g.ROUTERUI.mount(el, q);
    return { grade: () => ({ ...GR.gradeState(q.check, R.flat(), ROUTER_LABELS), saved: R.saved() }) };
  };
  const ROUTER_LABELS = new Proxy({}, { get: (t, k) => routerLabel(String(k)) });
  function routerLabel(k) {
    const m = k.match(/^(FastEthernet|Serial)(\d+\/\d+)\.(\w+)$/);
    const f = { ip: 'IP 주소', mask: '서브넷 마스크', sec: '보조 IP(secondary)', shut: '꺼짐(shutdown) 상태', desc: '설명(description)', bw: '대역폭(bandwidth)', clock: '클럭(clock rate)', encap: '캡슐화(encapsulation)', dlci: 'DLCI' };
    if (m) return `${m[1]} ${m[2]} ${f[m[3]] || m[3]}`;
    const p = k.match(/^pool\.([^.]+)\.(\w+)$/);
    if (p) return `DHCP 풀 ${p[1]}의 ${{ net: 'network', mask: 'network 마스크', gw: 'default-router', dns: 'dns-server', lease: 'lease', domain: 'domain-name' }[p[2]] || p[2]}`;
    return ({ host: '호스트 이름(hostname)', gw: '기본 게이트웨이(ip default-gateway)', 'vty.pw': 'Telnet(vty) 비밀번호', 'vty.login': 'Telnet(vty) login', 'vty.tm': 'Telnet(vty) exec-timeout', 'vty.tr': 'Telnet(vty) transport input', 'con.pw': '콘솔 비밀번호', 'con.login': '콘솔 login', routes: '정적 경로(ip route)', snmp: 'SNMP 커뮤니티', shows: '실행한 show 명령', saved: '저장(copy r s)' })[k] || k;
  }

  // ───────── CMOS Setup ─────────
  M.bios = (q, el) => {
    el.className = 'run-right';
    const B = g.BIOSUI.mount(el, q);
    return { grade: () => ({ ...GR.gradeState(q.answer, B.flat(), B.labels()), saved: B.saved() }) };
  };

  // ───────── 가상 Windows 화면 ─────────
  M.sim = (q, el) => {
    el.className = 'run-right';
    const def = g.SIMS.get(q.sim);
    if (!def) { el.append(h('div', { class: 'empty' }, `가상 화면 "${q.sim}"을(를) 찾을 수 없습니다.`)); return { grade: () => ({ ok: false, items: [] }) }; }
    const desk = new g.W.Desk(el);
    desk.el.style.flex = '1';
    const H = def.mount(desk, q);
    const labels = new Proxy({}, { get: (t, k) => (q.labels && q.labels[k]) || (def.labels && def.labels[k]) || (def.label && typeof k === 'string' ? def.label(k, q) : undefined) });
    // 채점: 화면마다 값을 읽기 쉽게 바꾸는 pretty()가 있으면 적용하고, '어디서 틀렸나' 설명을 위해 최종 상태도 함께 돌려줍니다.
    const gradeSim = () => {
      const st = H.state();
      const r = GR.gradeState(q.answer, st, labels);
      if (def.pretty) r.items.forEach(i => { i.expected = def.pretty(i.key, i.expected); i.got = def.pretty(i.key, i.got); });
      return { ...r, state: st };
    };
    return {
      grade: () => q.sim === 'console' ? { ...GR.gradeConsole(q, H.history()), given: H.history() } : gradeSim(),
      state: () => H.state && H.state(),
    };
  };

  const TYPE_NAME = { short: '단답형', choice: '선택형', multi: '다택형(모두 고르기)', drag: '드래그 앤 드롭', 'cable-order': '케이블 색 순서', router: '라우터 명령', bios: 'CMOS Setup', sim: '가상 Windows 작업' };

  function mount(q, el) {
    el.innerHTML = '';
    const fn = M[q.type];
    if (!fn) { el.append(h('div', { class: 'empty' }, '알 수 없는 문제 유형: ' + q.type)); return { grade: () => ({ ok: false }) }; }
    return fn(q, el);
  }

  // ───────── 해설 ─────────
  function answerText(q) {
    switch (q.type) {
      case 'short': return q.answer.accept.map(a => `<code>${esc(a)}</code>`).join(' <span class="muted">또는</span> ');
      case 'choice': return `${q.answer.index + 1}번 ${esc(q.options[q.answer.index])}`;
      case 'multi': return q.answer.indexes.map(i => `${i + 1}번 ${esc(q.options[i])}`).join(' · ');
      case 'drag': return q.slots.map(s => `${esc(s.label)} → <b>${esc((q.items.find(i => i.id === [].concat(q.answer.slots[s.id])[0]) || {}).label)}</b>`).join('<br>');
      case 'cable-order': { const { WIRE, ORDER } = g.WIDGETS; return `T568${q.answer.std}: ` + ORDER[q.answer.std].map((k, i) => `${i + 1} ${WIRE[k].n}`).join(' · '); }
      case 'router': return (q.cmds || []).map(c => `<code>${esc(c)}</code>`).join(' → ');
      case 'sim': if (q.sim === 'console') return q.answer.accept.map(a => `<code>${esc(a)}</code>`).join(' <span class="muted">또는</span> ');
    }
    return '';
  }
  function givenText(q, r) {
    const v = r.given;
    switch (q.type) {
      case 'short': return v ? `<code>${esc(v)}</code>` : '(비어 있음)';
      case 'choice': return v == null ? '(고르지 않음)' : `${v + 1}번 ${esc(q.options[v])}`;
      case 'multi': return v && v.length ? v.slice().sort((a, b) => a - b).map(i => `${i + 1}번 ${esc(q.options[i])}`).join(' · ') : '(고르지 않음)';
      case 'sim': if (q.sim === 'console') return v && v.length ? v.slice(-6).map(c => `<code>${esc(c)}</code>`).join(' ') : '(입력한 명령 없음)';
    }
    return '';
  }
  function whyWrong(q, r) {
    if (r.ok) return '';
    const out = [];
    if (q.type === 'choice' && r.given != null) {
      out.push(q.optionWhy && q.optionWhy[r.given] ? esc(q.optionWhy[r.given]) : `고른 ${r.given + 1}번은 정답이 아닙니다. 아래 해설에서 정답과 비교해 보세요.`);
    }
    if (q.type === 'multi') {
      if (r.missing && r.missing.length) out.push('빠뜨린 정답: ' + r.missing.map(i => `${i + 1}번${q.optionWhy && q.optionWhy[i] ? ` — ${esc(q.optionWhy[i])}` : ''}`).join(' / '));
      if (r.extra && r.extra.length) out.push('잘못 고른 보기: ' + r.extra.map(i => `${i + 1}번${q.optionWhy && q.optionWhy[i] ? ` — ${esc(q.optionWhy[i])}` : ''}`).join(' / '));
    }
    if (q.type === 'short') {
      const given = String(r.given || '').trim();
      const hint = (q.wrongWhy || []).find(w => w.match.some(m => GR.normShort(m) === GR.normShort(given)));
      if (r.empty) out.push('답을 비워 두었습니다.');
      else if (hint) out.push(esc(hint.why));
      else out.push(q.router ? '명령어의 철자·순서·숫자를 정답과 한 단어씩 비교해 보세요. 줄임말은 다른 명령과 겹치지 않을 만큼 쳐야 인정됩니다.' : '정답 표기와 다릅니다. 철자, 띄어쓰기, 옵션 글자(/ 또는 -)를 비교해 보세요.');
    }
    if (q.type === 'sim' && q.sim === 'console') {
      out.push(r.given && r.given.length ? '입력한 명령 중 정답과 같은 명령이 없습니다. 명령 이름과 옵션 글자를 비교해 보세요.' : '명령 창에 아무 명령도 입력하지 않았습니다.');
    }
    if (r.items && r.items.length) {
      const bad = r.items.filter(i => !i.ok);
      if (q.type === 'router' && r.saved === false) out.push('<b>설정을 저장하지 않았습니다.</b> 특권 모드(#)에서 <code>copy r s</code> 다음 Enter까지 해야 채점됩니다.');
      if (q.type === 'bios' && r.saved === false) out.push('<b>저장하지 않았습니다.</b> F10 또는 Save and Exit Setup → Y 로 저장해야 채점됩니다.');
      let rest = bad;
      if (q.type === 'sim' && q.sim === 'regedit' && r.state) {
        const hint = regHints(q, r);
        hint.msgs.forEach(x => out.push(x));
        rest = bad.filter(i => !hint.done.has(i.key)); // 위에서 이미 설명한 칸은 다시 늘어놓지 않음
      }
      if (rest.length) out.push(`${rest.length === bad.length ? `틀린 칸 ${bad.length}개` : '그 밖에 틀린 칸'}<ul class="why-list">${rest.map(i => `<li><b>${esc(title(i.label))}</b>${q.why && q.why[i.key] ? ` — ${esc(q.why[i.key])}` : ''}</li>`).join('')}</ul>`);
    }
    return out.map(x => `<div class="why-p">${x}</div>`).join('');
  }
  const title = l => String(l).split('\n')[0];

  // 레지스트리: '어디서 틀렸나'를 최종 상태에서 찾아 알려 줍니다.
  //  · 같은 이름의 값·키를 다른 위치에 만들었을 때  · 16진수 단위 그대로 숫자를 넣었을 때
  function regHints(q, r) {
    const def = g.SIMS.get('regedit'); const st = r.state || {};
    const parts = low => (def && def.nice ? def.nice(low, q, false) : String(low).split('\\'));
    // 두 경로를 조각별로 비교해 다른 조각에 색 표시 (대소문자만 다른 건 같은 것으로 봄)
    const marked = (a, b, cls) => { const A = parts(a), B = parts(b); return A.map((s, k) => (B[k] && B[k].toLowerCase() === s.toLowerCase() ? esc(s) : `<mark class="${cls}">${esc(s)}</mark>`)).join('\\<wbr>'); };
    const msgs = [], done = new Set(), seen = new Set();
    for (const i of r.items.filter(x => !x.ok)) {
      const m = i.key.match(/^(key|val|type):(.*)\\([^\\]*)$/); if (!m) continue;
      const [, kind, parentLow, nameLow] = m;
      const isVal = kind !== 'key', prefix = isVal ? 'val:' : 'key:';
      const here = `${prefix}${parentLow}\\${nameLow}`;
      const name = def && def.nice ? def.nice(`${parentLow}\\${nameLow}`, q, isVal).pop() : nameLow;
      const tag = (isVal ? 'v:' : 'k:') + parentLow + '\\' + nameLow;
      if (!(here in st)) {
        const elsewhere = Object.keys(st).filter(k => k.startsWith(prefix) && k.endsWith('\\' + nameLow) && k !== here).map(k => k.slice(prefix.length, -(nameLow.length + 1)));
        if (elsewhere.length || isVal) done.add(i.key);
        if (seen.has(tag)) continue; seen.add(tag);
        if (elsewhere.length) msgs.push(`<b>${esc(name)}</b> ${isVal ? '값을' : '키를'} 다른 위치에 만드셨어요. 색칠된 부분이 달라요.<div class="path-cmp"><div><span>내가 만든 위치</span><code>${marked(elsewhere[0], parentLow, 'seg-x')}</code></div><div><span>문제의 위치</span><code>${marked(parentLow, elsewhere[0], 'seg-o')}</code></div></div>`);
        else if (isVal) msgs.push(`<b>${esc(parts(parentLow).join('\\'))}</b> 키 안에 <b>${esc(name)}</b> 값이 없어요. 왼쪽에서 그 키를 먼저 클릭한 다음, 오른쪽 빈 곳을 오른쪽 클릭해 새로 만드세요.`);
        continue;
      }
      if (kind === 'val') {
        const exp = q.answer[i.key], got = st[i.key];
        if (typeof exp === 'number' && typeof got === 'number' && got !== exp && got === parseInt(String(exp), 16)) { done.add(i.key); msgs.push(`<b>${esc(name)}</b>에 <b>${got}</b>이(가) 들어갔어요. 편집 창의 단위가 <b>16진수</b>인 채로 ${exp}을(를) 입력했기 때문이에요. <b>10진수</b>를 먼저 고르고 다시 입력하세요.`); }
      }
    }
    return { msgs, done };
  }

  // 항목별 비교: 좁은 칸에서도 잘리지 않게 항목마다 카드로 (틀린 칸 먼저)
  function diffTable(r) {
    if (!r.items || !r.items.length) return '';
    const head = l => { const [t, ...rest] = String(l).split('\n'); return `<b>${esc(t)}</b>${rest.length ? `<small>${esc(rest.join(' '))}</small>` : ''}`; };
    const items = r.items.filter(i => !i.ok).concat(r.items.filter(i => i.ok));
    return `<h4>항목별 비교</h4><div class="diff2">${items.map(i => i.ok
      ? `<div class="d-item o"><span class="mk">✓</span><div class="d-b">${head(i.label)}<div class="d-ok">${esc(i.got)}</div></div></div>`
      : `<div class="d-item x"><span class="mk">✗</span><div class="d-b">${head(i.label)}<div class="d-row"><span>정답</span><span class="v">${esc(i.expected)}</span></div><div class="d-row"><span>내 설정</span><span class="v">${esc(i.got)}</span></div></div></div>`).join('')}</div>`;
  }
  function review(q, r) {
    const ans = answerText(q), given = givenText(q, r);
    return `<div class="result ${r.ok ? 'ok' : 'bad'}"><div class="rh">${r.ok ? '✓ 정답입니다' : '✗ 오답입니다'}</div><div class="rb">
      ${ans ? `<h4>정답</h4><p>${ans}</p>` : ''}
      ${given ? `<h4>내 답</h4><p>${given}</p>` : ''}
      ${diffTable(r)}
      ${!r.ok ? `<h4>내 답이 틀린 이유</h4>${whyWrong(q, r)}` : ''}
      <h4>정답인 이유 · 해설</h4>${rich(q.explain || '')}
      ${principleHTML(principleFor(q), !r.ok)}
    </div></div>`;
  }

  // ───────── 원리로 이해하기 (유형별 카드: data/principles.json) ─────────
  // 정답 암기가 아니라 원리·문장 단서·변형 대처를 익혀, 조건이 바뀐 문제도 풀 수 있게 합니다.
  function principleFor(q) {
    const P = g.APP && g.APP.PRINCIPLES; if (!P || !q) return null;
    const key = P.map[`${q.exam}:${q.cat}`] || P.map[q.cat] || P.concepts[q.conceptRef];
    return key ? P.cards[key] : null;
  }
  const BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/></svg>';
  function principleHTML(card, open = true) {
    if (!card) return '';
    const li = arr => (arr || []).map(x => `<li>${inline(x)}</li>`).join('');
    return `<details class="principle"${open ? ' open' : ''}><summary><span class="pr-ic">${BULB}</span><span>원리로 이해하기 · ${esc(card.title)}</span></summary>
      <div class="pr-body"><p class="pr-idea">${inline(card.idea)}</p>
      ${card.why && card.why.length ? `<h5>왜 이렇게 되나</h5><ul>${li(card.why)}</ul>` : ''}
      ${card.clues && card.clues.length ? `<h5>문제 문장 읽는 법</h5><ul>${li(card.clues)}</ul>` : ''}
      ${card.variants && card.variants.length ? `<h5>이렇게 바뀌어 나와도</h5><ul>${li(card.variants)}</ul>` : ''}</div>
    </details>`;
  }

  const LABEL_CLASS = l => (/^기출/.test(l) ? 'gi' : /^변형/.test(l) ? 'var' : /^심화/.test(l) ? 'hard' : 'ex');
  g.QT = { mount, review, TYPE_NAME, LABEL_CLASS, shuffle, principleFor, principleHTML };
})(window);
