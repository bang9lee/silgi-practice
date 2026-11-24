/* 앱 본체: 자료 불러오기, 화면 이동(#/...), 홈·연습·개념·모의고사·오답노트 */
(function (g) {
  'use strict';
  const { esc, rich } = g.MD;
  const h = g.W.h;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');
  let DATA = null, Q = [], BYID = new Map(), EXAMS = null, INFO = null, CONCEPTS = {};
  const S = () => g.STORE.d;

  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
  const exam = () => S().exam || 'net';
  const inExam = q => q.exam === exam() || q.exam === 'both';
  const catName = c => (EXAMS[exam()].cats.find(x => x[0] === c) || EXAMS.net.cats.concat(EXAMS.pc.cats).find(x => x[0] === c) || [c, c])[1];
  const labelBadge = q => `<span class="badge ${g.QT.LABEL_CLASS(q.label)}">[${esc(q.label)}]</span>`;
  const daysLeft = () => { const [y, m, d] = INFO.exam.date.split('-').map(Number); const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(y, m - 1, d) - t) / 86400000); };
  const ddayText = () => { const n = daysLeft(); return n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '시험 종료'; };
  const openLink = url => { if (g.api) g.api.openLink(url); else window.open(url); };
  const LABEL_ORDER = l => (/^기출/.test(l) ? 0 : /^변형/.test(l) ? 1 : /^심화/.test(l) ? 3 : 2);
  const isHard = q => /^심화/.test(q.label || '');

  // ───────── 자료 불러오기 ─────────
  async function loadData() {
    if (g.api && g.api.loadData) return g.api.loadData();
    // 브라우저로 바로 열었을 때(개발용): 같은 폴더 구조에서 fetch
    const names = ['concepts', 'info', 'old-drill', 'router', 'match-drag', 'pc-bios', 'exam', 'net-win', 'net-etc', 'pc-win', 'pc-etc', 'hard-net', 'hard-pc', 'principles'];
    const out = {};
    for (const n of names) { try { out[n] = await (await fetch(`../data/${n}.json`)).json(); } catch (e) { /* 없는 파일 */ } }
    return out;
  }
  function buildQuestions(D) {
    const list = [];
    (D['old-drill'] || []).forEach(q => list.push(q));
    (D['match-drag'] || []).forEach(q => list.push(q));
    (D.router || []).forEach(m => list.push({
      id: 'router-' + m.id, exam: 'net', cat: 'router', type: 'router', label: m.label, source: m.source, note: m.note, conceptRef: 'router',
      question: m.title, check: m.check, cmds: m.cmds,
      explain: `정답 명령 순서: ${m.cmds.map(c => '`' + c + '`').join(' → ')}\n\n${m.note ? m.note + '\n\n' : ''}저장은 특권 모드(#)에서 \`copy r s\`를 치고, \`Destination filename [startup-config]?\`가 나오면 **Enter를 한 번 더** 눌러야 끝납니다. 지시문에 "활성화"가 있으면 \`no shutdown\`, "로그인"이 있으면 \`login\`을 빠뜨리지 마세요.`,
    }));
    const B = D['pc-bios'];
    if (B) B.tasks.forEach(t => list.push({
      id: 'bios-' + t.id, exam: 'pc', cat: 'bios', type: 'bios', label: t.label || '예상', source: t.label === '변형' ? '예전 웹 버전 BIOS 미션의 조건을 바꾼 변형 문제' : '예전 웹 버전 BIOS 미션 (일반적인 Award BIOS 메뉴 기준 예상 문제)', conceptRef: 'bios',
      question: t.title, answer: t.answer, biosDef: B, explain: `정답 순서: ${t.hint}\n\n값을 바꾼 뒤 반드시 **F10 → Y → Enter**(또는 Save and Exit Setup)로 저장해야 합니다. 저장하지 않고 나가면 바꾼 값이 사라집니다.`,
      note: '2026.06.21 PC정비사 2번이 "바이오스 설정" 문제였다는 것은 복원 글 제목으로 확인했지만, 세부 조건은 원문 이미지에만 있어 확인 안 됨. 이 과제는 예상 문제입니다.',
    }));
    // 데이터 파일의 CMOS 문제(type: bios)에는 BIOS 화면 정의를 붙입니다.
    for (const [name, v] of Object.entries(D)) if (v && Array.isArray(v.questions)) v.questions.forEach(q => list.push({ ...q, _file: name, ...(q.type === 'bios' && B ? { biosDef: B } : {}) }));
    return list;
  }

  // ───────── 사이드바 · 제목 줄 ─────────
  const NI = {
    home: '<path d="M4 10.5L12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8.5 7.5h7"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>',
    note: '<path d="M6 3h9l4 4v13.5A.5.5 0 0 1 18.5 21h-13A.5.5 0 0 1 5 20.5V4a1 1 0 0 1 1-1z"/><path d="M9.5 11.5l5 5M14.5 11.5l-5 5"/>',
  };
  const ico = k => `<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${NI[k]}</svg>`;
  const PAGE_TITLE = { '': '홈', concepts: '개념', concept: '개념', practice: '유형별 연습', hard: '심화 문제', q: '문제 풀기', wrong: '오답노트', mock: '모의고사' };
  function paintTop(route) {
    $('#exam-switch').innerHTML = ['net', 'pc'].map(e => `<button type="button" data-exam="${e}" aria-pressed="${exam() === e}"><i class="dot ${e}"></i><span>${EXAMS[e].name}</span></button>`).join('');
    const wrongN = Object.keys(S().wrong).filter(id => BYID.has(id) && inExam(BYID.get(id))).length;
    const nav = [['#/', 'home', '홈'], ['#/concepts', 'book', '개념'], ['#/practice', 'target', '유형별 연습'], ['#/mock', 'timer', '모의고사'], ['#/wrong', 'note', '오답노트', wrongN]];
    $('#nav').innerHTML = nav.map(([href, ic, t, n]) => `<a href="${href}"${(route === href || (href !== '#/' && route.startsWith(href)) || (href === '#/concepts' && route.startsWith('#/concept/'))) ? ' aria-current="page"' : ''}>${ico(ic)}<span>${t}</span>${n ? `<span class="n">${n}</span>` : ''}</a>`).join('');
    const n = daysLeft();
    $('#dday').innerHTML = `<div class="dd-card"><small>실기 시험 · ${esc(INFO.exam.dateLabel)}</small><b>${ddayText()}</b><div class="bar"><span style="width:${Math.max(4, Math.min(100, (1 - Math.max(0, n) / 40) * 100))}%"></span></div><small>두 시험 같은 날 · 80분 · 60점 합격</small></div>`;
    const seg = route.replace(/^#\//, '').split('/')[0];
    $('#tb-title').textContent = PAGE_TITLE[seg] || '실기 연습';
    $('#tb-sub').textContent = EXAMS[exam()].name;
    document.documentElement.dataset.exam = exam();
  }
  $('#exam-switch').addEventListener('click', e => { const b = e.target.closest('button[data-exam]'); if (!b) return; S().exam = b.dataset.exam; g.STORE.save(); if (RUN && RUN.mode === 'mock' && !RUN.done) { if (!confirmLeave()) return; } RUN = null; location.hash = '#/'; render(); });
  function confirmLeave() { return window.confirm('진행 중인 모의고사를 그만두시겠습니까? 지금까지 푼 답은 채점되지 않습니다.'); }

  // ───────── 홈 ─────────
  function catStats(cat) {
    const qs = Q.filter(q => inExam(q) && q.cat === cat);
    const att = qs.filter(q => S().attempts[q.id]);
    const ok = qs.filter(q => (S().attempts[q.id] || {}).lastOk);
    const bad = qs.filter(q => S().wrong[q.id]);
    return { n: qs.length, tried: att.length, ok: ok.length, bad: bad.length };
  }
  function ringSVG(p) {
    const r = 26, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#edf1f7" stroke-width="8"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--pri)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 32 32)"/><text x="32" y="37" text-anchor="middle" font-size="14" font-weight="800" fill="var(--ink)">${Math.round(p * 100)}%</text></svg>`;
  }
  function catCard(c, l) {
    const s = catStats(c); if (!s.n) return '';
    const qs = Q.filter(q => inExam(q) && q.cat === c);
    const gi = qs.filter(q => /^기출/.test(q.label)).length, va = qs.filter(q => /^변형/.test(q.label)).length, hd = qs.filter(isHard).length;
    return `<div class="cat-card" data-go="#/practice/${c}"><div class="ttl"><span>${esc(l)}</span>${s.bad ? `<span class="badge bad">오답 ${s.bad}</span>` : s.n && s.ok === s.n ? '<span class="badge ok">완료</span>' : ''}</div>
      <div class="bar ok"><span style="width:${s.ok / s.n * 100}%"></span></div>
      <div class="meta"><span>맞힘 <b style="color:var(--ink)">${s.ok}</b> / ${s.n}</span><span>푼 문제 ${s.tried}</span></div>
      <div class="tags">${gi ? `<span class="badge gi">기출 복원 ${gi}</span>` : ''}${va ? `<span class="badge var">변형 ${va}</span>` : ''}${qs.length - gi - va - hd ? `<span class="badge ex">예상 ${qs.length - gi - va - hd}</span>` : ''}${hd ? `<span class="badge hard">심화 ${hd}</span>` : ''}</div></div>`;
  }
  function viewHome() {
    const E = EXAMS[exam()];
    const qs = Q.filter(inExam);
    const tried = qs.filter(q => S().attempts[q.id]).length, ok = qs.filter(q => (S().attempts[q.id] || {}).lastOk).length;
    const wrongIds = Object.entries(S().wrong).filter(([id]) => BYID.has(id) && inExam(BYID.get(id))).sort((a, b) => b[1] - a[1]);
    const mocks = S().mocks.filter(m => m.exam === exam()).slice(-5).reverse();
    const best = mocks.length ? Math.max(...mocks.map(m => m.score)) : null;
    const n = daysLeft();
    const now = new Date();
    const hello = now.getHours() < 12 ? '좋은 아침이에요' : now.getHours() < 18 ? '오늘도 한 문제씩' : '오늘 하루도 수고했어요';
    return `<div class="wrap">
      <div class="page-head"><div><span class="eyebrow">${now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</span><h1>${hello}</h1><p class="page-sub">${esc(E.name)} 실기 · 80분 · 60점 이상 합격 · 발표 ${esc(INFO.exam.result)}</p></div>
        <button class="btn" data-ai-ask="내 기록을 보고 오늘 뭐부터 공부하면 좋을지 알려 주세요"><svg class="bi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>오늘 공부 추천받기</button></div>
      <div class="widgets">
        <div class="widget w-dday"><small>2026년 제4회 · ${esc(INFO.exam.dateLabel)}</small><div class="big">${n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '시험 종료'}</div><p>두 시험 같은 날</p></div>
        <div class="widget w-ring">${ringSVG(qs.length ? ok / qs.length : 0)}<div><small>맞힌 문제</small><b>${ok}<span class="of"> / ${qs.length}</span></b><span class="muted small">마지막 시도 기준</span></div></div>
        <div class="widget"><small>푼 문제</small><b>${tried}</b><span class="muted small">전체 ${qs.length}문제 중</span></div>
        <div class="widget"><small>${best == null ? '오답노트' : '모의고사 최고점'}</small><b style="color:${best == null ? (wrongIds.length ? 'var(--bad)' : 'var(--ink)') : best >= 60 ? 'var(--ok)' : 'var(--bad)'}">${best == null ? wrongIds.length : best.toFixed(1)}</b><span class="muted small">${best == null ? '다시 풀 문제' : best >= 60 ? '합격선 통과' : '합격선 60점'}</span></div>
      </div>
      <div class="start-cards">
        <a href="#/concepts"><div class="tile"><span class="ti t1">${ico('book')}</span><b>개념부터</b><span>유형마다 쉬운 설명과 화면 경로</span></div></a>
        <a href="#/practice"><div class="tile"><span class="ti t2">${ico('target')}</span><b>유형별 연습</b><span>한 문제씩 풀고 바로 채점·해설</span></div></a>
        <a href="#/mock"><div class="tile"><span class="ti t3">${ico('timer')}</span><b>모의고사 80분</b><span>실제 구성 18문항 · 합격 여부</span></div></a>
        <a href="#/wrong"><div class="tile"><span class="ti t4">${ico('note')}</span><b>오답노트 ${wrongIds.length ? `<span class="badge bad">${wrongIds.length}</span>` : ''}</b><span>틀린 문제만 다시 · 맞히면 빠짐</span></div></a>
      </div>
      <div class="sec-title"><h2>유형별 진행률</h2><span class="muted small">카드를 누르면 바로 연습합니다</span></div>
      <div class="cat-grid">${E.cats.map(([c, l]) => catCard(c, l)).join('')}</div>
      <div class="home-cols">
        <div class="card"><h2>최근 오답</h2>${wrongIds.length ? `<ul class="list-plain">${wrongIds.slice(0, 6).map(([id]) => { const q = BYID.get(id); return `<li class="click" data-go="#/q/${encodeURIComponent(id)}"><span class="badge">${esc(catName(q.cat))}</span><span>${esc(q.question.slice(0, 52))}${q.question.length > 52 ? '…' : ''}</span></li>`; }).join('')}</ul><p style="margin:12px 0 0"><a class="btn sm pri" href="#/wrong">오답만 다시 풀기 →</a></p>` : '<p class="muted">아직 틀린 문제가 없어요.</p>'}</div>
        <div class="card"><h2>모의고사 기록</h2>${mocks.length ? `<ul class="list-plain">${mocks.map(m => `<li><span style="flex:1">${new Date(m.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><b>${m.score.toFixed(1)}점</b>${m.pass ? '<span class="badge ok">합격</span>' : '<span class="badge bad">불합격</span>'}</li>`).join('')}</ul>` : '<p class="muted">아직 본 모의고사가 없어요.</p>'}</div>
      </div>
      <div class="card" style="margin-top:16px"><h2>시험 당일 체크리스트</h2><ul class="list-plain check-list">${INFO.day.map(d => `<li><span><b>${esc(d.t)}</b><br><span class="muted small">${esc(d.d)}</span></span></li>`).join('')}</ul></div>
    </div>`;
  }

  // ───────── 개념 ─────────
  const CONCEPT_LISTS = {
    net: ['net-start', 'cable', 'win-tcpip', 'win-dhcp', 'win-iis-ftp', 'win-services', 'win-secpol', 'win-iis-web', 'win-dns', 'win-users', 'router', 'linux', 'short'],
    pc: ['pc-start', 'cable', 'bios', 'reg', 'pc-vmem', 'pc-folder', 'pc-disk', 'pc-remote', 'pc-secpol', 'pc-net', 'pc-dev', 'pc-printer', 'pc-share', 'console', 'drag'],
  };
  // 개념 글이 어느 시험 것인지 (AI 튜터 자료 검색용). 두 시험 목록에 다 있거나 어디에도 없으면 공통.
  const conceptExam = id => { const n = CONCEPT_LISTS.net.includes(id), p = CONCEPT_LISTS.pc.includes(id); return n && !p ? 'net' : p && !n ? 'pc' : 'both'; };
  function conceptIdsForExam() { return CONCEPT_LISTS[exam()].filter(id => CONCEPTS[id]); }
  function viewConcepts() {
    return `<div class="wrap"><h1>개념 먼저 보기</h1><p class="page-sub">유형마다 쉬운 설명과 실제 화면 경로를 정리했습니다. 읽은 뒤 [이 유형 문제 풀기]로 바로 연습하세요.</p>
      <div class="concept-grid">${conceptIdsForExam().map(id => `<a href="#/concept/${id}"><div class="card"><b>${esc(CONCEPTS[id].title)}</b><div style="margin-top:6px" class="${S().seen[id] ? 'read' : 'unread'}">${S().seen[id] ? '✓ 읽음' : '아직 안 읽음'}</div></div></a>`).join('')}</div></div>`;
  }
  const CONCEPT_CAT = { 'win-tcpip': 'win-tcpip', 'win-dhcp': 'win-dhcp', 'win-iis-ftp': 'win-iis-ftp', 'win-iis-web': 'win-iis-web', 'win-dns': 'win-dns', 'win-users': 'win-users', 'win-secpol': 'win-secpol', 'win-services': 'win-services', router: 'router', linux: 'linux', short: 'short', cable: 'cable', bios: 'bios', reg: 'reg', console: 'console', drag: 'drag', 'pc-vmem': 'pc-vmem', 'pc-folder': 'pc-folder', 'pc-disk': 'pc-disk', 'pc-remote': 'pc-remote', 'pc-secpol': 'pc-secpol', 'pc-net': 'pc-net', 'pc-dev': 'pc-dev', 'pc-printer': 'pc-printer', 'pc-share': 'pc-share' };
  const conceptPrinciple = id => { const P = DATA && DATA.principles; const k = P && P.concepts[id]; return k ? P.cards[k] : null; };
  function viewConcept(id) {
    const c = CONCEPTS[id];
    if (!c) return `<div class="wrap"><div class="empty">개념 글을 찾을 수 없습니다.</div></div>`;
    S().seen[id] = Date.now(); g.STORE.save();
    const cat = CONCEPT_CAT[id];
    return `<div class="wrap read"><p><a class="btn sm ghost" href="#/concepts">← 개념 목록</a></p><div class="card note" data-note style="padding:30px 34px;font-size:15px;line-height:1.75"><h1 style="margin-bottom:18px">${esc(c.title)}</h1>${g.QT.principleHTML(conceptPrinciple(id), true)}${c.html}</div>
      ${cat ? `<p style="margin-top:18px;text-align:right"><a class="btn pri lg" href="#/practice/${cat}">이 유형 문제 풀기 →</a></p>` : ''}</div>`;
  }

  // ───────── 유형별 연습 목록 ─────────
  function viewPractice() {
    const E = EXAMS[exam()];
    const hard = Q.filter(q => inExam(q) && isHard(q));
    const hardOk = hard.filter(q => (S().attempts[q.id] || {}).lastOk).length;
    return `<div class="wrap"><h1>유형별 연습</h1><p class="page-sub">${esc(E.structureNote)}</p>
      ${hard.length ? `<div class="hard-banner"><div class="hb-ic">${ico('target')}</div><div class="hb-t"><b>심화 문제 ${hard.length}개</b><span>실제 시험보다 어렵게 만든 문제예요. 계산·함정·여러 단계 작업이 섞여 있어요. 지금까지 맞힌 문제 ${hardOk}개.</span></div><a class="btn pri" href="#/hard">심화만 모아 풀기 →</a></div>` : ''}
      <div class="cat-grid">${E.cats.map(([c, l]) => catCard(c, l)).join('')}</div>
      <p class="muted small" style="margin-top:18px">순서: 기출 복원 → 변형 → 예상 → 심화. 기출 복원 문제도 대부분 <b>유형만 확인된 것</b>이고 숫자는 예시 값입니다(문제마다 '참고'에 적어 두었습니다).</p></div>`;
  }

  // 문제 칸과 작업 공간 사이 경계선: 끌어서 너비 조절(기억함), 두 번 누르면 자동 너비로
  const QW_KEY = 'silgi.qw';
  const applyQW = () => { const v = +localStorage.getItem(QW_KEY); if (v) document.documentElement.style.setProperty('--q-w', v + 'px'); else document.documentElement.style.removeProperty('--q-w'); };
  applyQW();
  function splitter() {
    const sp = h('div', { class: 'run-split', title: '끌어서 문제 칸 너비 조절 · 두 번 누르면 자동 너비' });
    sp.addEventListener('mousedown', e => {
      e.preventDefault();
      const left = sp.previousElementSibling, sx = e.clientX, sw = left.offsetWidth;
      document.body.classList.add('resizing');
      const mv = ev => { const max = Math.max(420, app.clientWidth - 360); const w = Math.round(Math.max(340, Math.min(max, sw + ev.clientX - sx))); document.documentElement.style.setProperty('--q-w', w + 'px'); };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('resizing'); localStorage.setItem(QW_KEY, left.offsetWidth); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
    });
    sp.addEventListener('dblclick', () => { localStorage.removeItem(QW_KEY); applyQW(); });
    return sp;
  }

  // 문제 유형 → ICQA 실습용 에뮬레이터 프로그램 (설치돼 있을 때만 단추가 보임)
  const EMU = { iis: 'ntIISC', dhcp: 'ntDHCPC', dns: 'ntDNSC', secpol: 'pcLocalAuthC', regedit: 'pcRegistryC', diskmgmt: 'pcDiskmgrC', devmgmt: 'pcDriverMgrC', folderopt: 'pcFolderC', tcpip: 'pcNetworkC', printer: 'pcPrinterC', share: 'ntShareC', mstsc: 'ntTerminalC', console: 'CMDC' };
  let EMU_HAVE = null;
  if (g.api && g.api.emu) g.api.emu.list().then(l => { EMU_HAVE = new Set(l); });
  function emuFor(q) {
    if (!EMU_HAVE || !EMU_HAVE.size) return null;
    let n = null;
    if (q.type === 'router') n = 'ntRouterC';
    else if (q.type === 'bios') n = 'pcBiosC';
    else if (q.type === 'sim') n = q.sim === 'services' ? (q.exam === 'pc' ? 'pcServiceC' : 'ntServiceC') : q.sim === 'users' ? (q.exam === 'pc' ? 'pcUserMgrC' : 'ntUserMgrC') : q.sim === 'sysprop' ? (q.cat === 'pc-remote' ? 'pcRemoteC' : 'pcSysInfoC') : EMU[q.sim];
    return n && EMU_HAVE.has(n) ? n : null;
  }

  // ───────── 문제 풀기 (연습·오답노트·한 문제) ─────────
  let RUN = null;
  function startRun(mode, ids, title, back) { RUN = { mode, ids, i: 0, title, back, res: {} }; }
  function paintRun() {
    const q = BYID.get(RUN.ids[RUN.i]);
    if (!q) { app.innerHTML = `<div class="wrap"><div class="empty">${RUN.mode === 'wrong' ? '오답노트가 비었습니다. 모두 맞혔어요!' : '풀 문제가 없습니다.'}<p><a class="btn" href="${RUN.back}">돌아가기</a></p></div></div>`; return; }
    const cRef = q.conceptRef || q.cat;
    const concept = CONCEPTS[cRef];
    const firstTime = concept && !S().seen[cRef];
    const left = h('div', { class: 'run-left' });
    const right = h('div', { class: 'run-right' });
    const wrapR = h('div', { class: 'run-rwrap' }, right);
    app.innerHTML = ''; app.append(h('div', { class: 'run' }, left, splitter(), wrapR));
    left.innerHTML = `<div class="run-head"><a class="btn sm ghost" href="${RUN.back}">← 그만</a><div class="prog"><div class="small muted">${esc(RUN.title)} · ${RUN.i + 1} / ${RUN.ids.length}</div><div class="bar"><span style="width:${(RUN.i) / RUN.ids.length * 100}%"></span></div></div>${emuFor(q) ? '<button class="btn sm" id="b-emu" title="설치된 ICQA 실습용 에뮬레이터에서 같은 화면을 엽니다. 다 보면 에뮬레이터 창을 닫으세요.">실제 에뮬레이터</button>' : ''}${concept ? '<button class="btn sm" id="b-concept">개념 보기</button>' : ''}</div>
      <div class="run-scroll">${questionHTML(q)}<div id="res"></div></div>
      <div class="run-foot"><button class="btn pri" id="b-grade">채점하기</button><button class="btn" id="b-reset" title="처음 상태로 다시">다시 풀기</button><span style="flex:1"></span>${RUN.i > 0 ? '<button class="btn" id="b-prev">← 이전</button>' : ''}<button class="btn" id="b-next">${RUN.i + 1 < RUN.ids.length ? '다음 →' : '끝내기'}</button></div>`;
    if (concept) {
      const showConcept = () => openConcept(wrapR, cRef);
      $('#b-concept', left).addEventListener('click', showConcept);
      if (firstTime) showConcept();
    }
    const be = $('#b-emu', left); if (be) be.addEventListener('click', async () => { const ok = await g.api.emu.open(emuFor(q)); toast(ok ? '실제 ICQA 에뮬레이터를 열었어요. 연습이 끝나면 에뮬레이터 창을 닫으세요.' : '에뮬레이터를 열지 못했어요.'); });
    wireLinks(left);
    const H = g.QT.mount(q, right);
    RUN.h = H; RUN.graded = false;
    // 정답을 그 자리에 보여 주는 유형은 채점하면 잠급니다(H.lock). 작업형은 잠그지 않고
    // [다시 채점]으로 바꿔 계속 조작해 보게 합니다. 기록에는 처음 채점 결과만 남깁니다.
    const doGrade = () => {
      const first = !RUN.graded;
      if (!first && H.lock) return;
      const r = H.grade(); RUN.graded = true; RUN.lastResult = r;
      if (first) { RUN.res[q.id] = r.ok; g.STORE.record(q.id, r.ok); }
      if (H.lock) H.lock(r);
      const note = H.lock ? '' : `<p class="small muted regrade-note">${first
        ? '채점 뒤에도 오른쪽 화면을 계속 조작할 수 있어요. 설정을 바꿔 본 뒤 [다시 채점]으로 확인하세요.'
        : `다시 채점한 결과예요. 기록에는 처음 채점 결과(${RUN.res[q.id] ? '정답' : '오답'})가 남아요.`}</p>`;
      $('#res', left).innerHTML = note + g.QT.review(q, r) +`<div class="ai-ask-row"><button class="ai-ask" data-ai-ask="${r.ok ? '이 문제 핵심만 짧게 정리해 주세요' : '왜 틀렸는지 알려 주세요'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>${r.ok ? 'AI 튜터와 핵심 정리' : 'AI 튜터에게 왜 틀렸는지 묻기'}</button></div>`;
      if (g.AI) g.AI.refresh();
      const gb = $('#b-grade', left);
      if (H.lock) gb.disabled = true;
      else if (first) { gb.textContent = '다시 채점'; gb.classList.remove('pri'); gb.title = '화면을 더 바꿔 본 뒤 다시 확인합니다. 기록은 처음 채점 결과로 남습니다.'; }
      if (first) { paintTop(location.hash); const nx = $('#b-next', left); nx.classList.add('pri'); nx.focus(); }
      $('#res', left).scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('#b-grade', left).addEventListener('click', doGrade);
    right.addEventListener('submit-answer', doGrade);
    $('#b-reset', left).addEventListener('click', () => paintRun());
    const prev = $('#b-prev', left); if (prev) prev.addEventListener('click', () => { RUN.i--; paintRun(); });
    $('#b-next', left).addEventListener('click', () => {
      if (RUN.i + 1 < RUN.ids.length) { RUN.i++; paintRun(); return; }
      const okN = Object.values(RUN.res).filter(Boolean).length;
      toast(`${Object.keys(RUN.res).length}문제 채점 · ${okN}문제 정답`);
      location.hash = RUN.back;
    });
    if (g.AI) g.AI.refresh();
  }
  // 지문: 문제 → <보기>(한 줄에 조건 하나, 값은 굵게) → 참고(예시 값 안내) → 출처
  function boxHTML(box) {
    const lines = String(box).split(/\n/).map(l => l.replace(/^\s*[·•\-]\s*/, '')).filter(l => l.trim()).flatMap(l => l.split(/\s+\/\s+(?=[^/:：]{1,24}[:：])/));
    return `<table class="conds"><tbody>${lines.map(l => {
      const m = /^\d+\)/.test(l) ? null : l.match(/^([^:：()]{1,30})[:：]\s*(.+)$/);
      if (m) return `<tr><th>${esc(m[1])}</th><td>${esc(m[2])}</td></tr>`;
      return `<tr><td colspan="2" class="full">${esc(l)}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  function questionHTML(q, extraMeta) {
    return `<div class="q-meta">${extraMeta || ''}${labelBadge(q)}<span class="badge">${esc(catName(q.cat))}</span><span class="badge">${esc(g.QT.TYPE_NAME[q.type] || q.type)}</span>${S().wrong[q.id] ? '<span class="badge bad">전에 틀림</span>' : ''}</div>
      <div class="q-text">${rich(q.question)}</div>
      ${q.box ? `<div class="q-boxh">&lt;보기&gt;</div>${boxHTML(q.box)}` : ''}
      ${q.note ? `<div class="q-note"><b>참고</b> ${esc(q.note)}</div>` : ''}
      <div class="q-src">출처: ${srcLinks(q.source)}</div>`;
  }
  // 개념 설명은 작업 화면 위에 넓게 펼칩니다.
  function openConcept(host, id) {
    const c = CONCEPTS[id]; if (!c) return;
    S().seen[id] = Date.now(); g.STORE.save();
    const old = host.querySelector('.concept-ov'); if (old) old.remove();
    const ov = h('div', { class: 'concept-ov' });
    ov.innerHTML = `<div class="concept-card"><div class="concept-top"><b>개념 먼저 보기 · ${esc(c.title)}</b><button class="btn sm pri" data-close>문제 풀러 가기 →</button></div><div class="note">${g.QT.principleHTML(conceptPrinciple(id), true)}${c.html}</div></div>`;
    host.append(ov);
    g.WIDGETS.mount(ov, INFO);
    ov.querySelector('[data-close]').addEventListener('click', () => ov.remove());
    ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
  }
  function srcLinks(src) {
    const list = [].concat(src || []);
    if (!list.length) return '없음';
    return list.map(s => /^https?:/.test(s) ? `<a data-link="${esc(s)}">${esc(decodeURIComponent(s).replace(/^https?:\/\//, '').slice(0, 90))}</a>` : esc(s)).join(' · ');
  }
  function wireLinks(root) { root.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', () => openLink(a.dataset.link))); }
  const sortQs = qs => qs.slice().sort((a, b) => LABEL_ORDER(a.label) - LABEL_ORDER(b.label));

  // ───────── 오답노트 ─────────
  function viewWrong() {
    const ids = Object.entries(S().wrong).filter(([id]) => BYID.has(id) && inExam(BYID.get(id))).sort((a, b) => b[1] - a[1]).map(([id]) => id);
    return `<div class="wrap"><h1>오답노트</h1><p class="muted">틀린 문제만 모았습니다. 다시 풀어서 맞히면 목록에서 빠집니다.</p>
      ${ids.length ? `<p><button class="btn pri" data-act="wrong-run">틀린 ${ids.length}문제 다시 풀기</button></p><div class="card"><table class="t"><thead><tr><th>유형</th><th>문제</th><th>틀린 날</th></tr></thead><tbody>${ids.map(id => { const q = BYID.get(id); return `<tr class="click" data-go="#/q/${encodeURIComponent(id)}"><td>${esc(catName(q.cat))}</td><td>${labelBadge(q)} ${esc(q.question.slice(0, 70))}</td><td class="small">${new Date(S().wrong[id]).toLocaleDateString('ko-KR')}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="card empty">오답노트가 비어 있습니다.</div>'}</div>`;
  }

  // ───────── 모의고사 ─────────
  function viewMockStart() {
    const E = EXAMS[exam()];
    return `<div class="wrap"><h1>${esc(E.name)} 모의고사</h1>
      <div class="card"><p><b>80분 · 18문항 · 60점 이상 합격.</b> 실제 시험 구성대로 문제를 골라 냅니다.</p><p class="muted">${esc(E.structureNote)}</p><p class="muted">${esc(E.pointsNote)}</p>
      <p class="muted">문제 사이를 자유롭게 오갈 수 있고, 가상 화면에서 바꾼 설정은 그대로 남습니다. [답안 제출]을 누르거나 시간이 다 되면 한꺼번에 채점합니다.</p>
      <p class="row"><button class="btn pri" data-act="mock-start">모의고사 시작</button><button class="btn" data-act="mock-hard">심화 모의고사 (어려운 문제 위주)</button></p></div></div>`;
  }
  function makeMock(hardMode) {
    const E = EXAMS[exam()], used = new Set(), items = [];
    const per = 100 / E.slots.length;
    for (const sl of E.slots) {
      let pool = Q.filter(q => inExam(q) && sl.cats.includes(q.cat) && (!sl.types || sl.types.includes(q.type)) && !used.has(q.id));
      if (!pool.length) pool = Q.filter(q => inExam(q) && sl.cats.includes(q.cat) && !used.has(q.id));
      if (!pool.length) continue;
      // 기출 복원·변형 문제를 조금 더 자주 냅니다. 심화 모의고사는 그 칸에 심화 문제가 있으면 심화에서만 냅니다.
      if (hardMode && pool.some(isHard)) pool = pool.filter(isHard);
      const weighted = hardMode ? pool : pool.flatMap(q => LABEL_ORDER(q.label) < 2 ? [q, q] : [q]);
      const q = weighted[Math.floor(Math.random() * weighted.length)];
      used.add(q.id); items.push({ id: q.id, points: sl.points || per });
    }
    const total = items.reduce((a, b) => a + b.points, 0);
    items.forEach(it => (it.points = it.points * 100 / total));
    return { mode: 'mock', hard: !!hardMode, exam: exam(), items, i: 0, H: {}, panes: {}, endAt: Date.now() + E.minutes * 60000, done: false };
  }
  let tick = null;
  function paintMock() {
    const M = RUN, it = M.items[M.i], q = BYID.get(it.id);
    if (!M.shell) {
      const left = h('div', { class: 'run-left' }), right = h('div', { class: 'run-right', style: { position: 'relative' } });
      M.shell = h('div', { class: 'run' }, left, splitter(), right); M.left = left; M.right = right;
    }
    app.innerHTML = ''; app.append(M.shell);
    const left = M.left;
    left.innerHTML = `<div class="run-head"><span class="timer" id="timer"></span><span style="flex:1"></span><button class="btn sm" id="m-quit">그만두기</button></div>
      <div class="run-scroll"><div class="mock-nav">${M.items.map((x, k) => `<button data-k="${k}" class="${k === M.i ? 'cur' : ''} ${M.visited && M.visited[k] ? 'done' : ''}">${k + 1}</button>`).join('')}</div>
        ${questionHTML(q, `<b class="qno">${M.i + 1}번</b><span class="badge">${it.points.toFixed(1)}점</span>`)}
        <p class="small muted" style="margin-top:14px">채점은 [답안 제출] 때 한꺼번에 합니다. 가상 화면은 [확인]/[적용]/[마침]으로 반영한 설정만, 라우터는 저장(copy r s)한 설정만, BIOS는 F10 저장한 값만 채점합니다.</p></div>
      <div class="run-foot">${M.i > 0 ? '<button class="btn" id="m-prev">← 이전</button>' : ''}${M.i + 1 < M.items.length ? '<button class="btn" id="m-next">다음 →</button>' : ''}<span style="flex:1"></span><button class="btn pri" id="m-submit">답안 제출</button></div>`;
    M.visited = M.visited || {}; M.visited[M.i] = true;
    // 작업 공간: 문항마다 따로 만들어 두고 보이기만 바꿉니다.
    Object.values(M.panes).forEach(p => (p.style.display = 'none'));
    if (!M.panes[M.i]) { const p = h('div', { style: { position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column' } }); M.right.append(p); M.panes[M.i] = p; const inner = h('div', { class: 'run-right', style: { flex: '1' } }); p.append(inner); M.H[M.i] = g.QT.mount(q, inner); }
    M.panes[M.i].style.display = 'flex';
    left.querySelectorAll('.mock-nav button').forEach(b => b.addEventListener('click', () => { M.i = +b.dataset.k; paintMock(); }));
    const pv = $('#m-prev', left); if (pv) pv.addEventListener('click', () => { M.i--; paintMock(); });
    const nx = $('#m-next', left); if (nx) nx.addEventListener('click', () => { M.i++; paintMock(); });
    $('#m-submit', left).addEventListener('click', () => { if (window.confirm('답안을 제출하고 채점할까요?')) finishMock(); });
    $('#m-quit', left).addEventListener('click', () => { if (confirmLeave()) { clearInterval(tick); RUN = null; location.hash = '#/mock'; } });
    clearInterval(tick); tick = setInterval(updTimer, 500); updTimer();
    if (g.AI) g.AI.refresh();
  }
  function updTimer() {
    if (!RUN || RUN.mode !== 'mock' || RUN.done) { clearInterval(tick); return; }
    const left = Math.max(0, RUN.endAt - Date.now());
    const t = $('#timer'); if (t) { const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60; t.textContent = `남은 시간 ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; t.classList.toggle('low', left < 10 * 60000); }
    if (left <= 0) { toast('시간이 끝났습니다. 자동으로 채점합니다.'); finishMock(); }
  }
  function finishMock() {
    const M = RUN; clearInterval(tick); M.done = true;
    let score = 0;
    M.results = M.items.map((it, k) => {
      const q = BYID.get(it.id); let r;
      if (M.H[k]) { try { r = M.H[k].grade(); } catch (e) { r = { ok: false }; } } else r = { ok: false, unvisited: true, given: null, items: [] };
      if (r.ok) score += it.points;
      g.STORE.record(q.id, r.ok);
      return { id: it.id, points: it.points, r };
    });
    M.score = score;
    const pass = score >= EXAMS[M.exam].pass - 1e-9;
    S().mocks.push({ at: Date.now(), exam: M.exam, score, pass, items: M.results.map(x => ({ id: x.id, ok: x.r.ok, points: x.points })) });
    g.STORE.save();
    location.hash = '#/mock/result';
  }
  function viewMockResult() {
    const M = RUN;
    if (!M || !M.results) return `<div class="wrap"><div class="empty">결과가 없습니다. <a href="#/mock">모의고사로</a></div></div>`;
    const pass = M.score >= EXAMS[M.exam].pass - 1e-9;
    const okN = M.results.filter(x => x.r.ok).length;
    return `<div class="wrap"><h1>모의고사 결과</h1>
      <div class="card" style="display:flex;gap:30px;align-items:center"><div class="score-big ${pass ? 'pass' : 'fail'}">${M.score.toFixed(1)}점</div><div><h2 class="${pass ? 'pass' : 'fail'}">${pass ? '합격' : '불합격'} (60점 이상 합격)</h2><p class="muted">${M.results.length}문항 중 ${okN}문항 정답 · ${esc(EXAMS[M.exam].pointsNote)}</p><p><a class="btn pri" href="#/mock">다시 보기</a> <a class="btn" href="#/wrong">오답노트로</a></p></div></div>
      <div class="card"><h2>문항별 해설</h2><p class="muted small">줄을 누르면 정답, 정답인 이유, 내 답이 틀린 이유가 펼쳐집니다.</p>
      ${M.results.map((x, k) => { const q = BYID.get(x.id); return `<details style="border-top:1px solid var(--line);padding:8px 0"><summary style="cursor:pointer"><b>${k + 1}번</b> ${x.r.ok ? '<span class="badge ok">정답</span>' : '<span class="badge bad">오답</span>'} <span class="badge">${x.points.toFixed(1)}점</span> ${labelBadge(q)} ${esc(catName(q.cat))} · ${esc(q.question.slice(0, 60))}${x.r.unvisited ? ' <span class="muted small">(열어 보지 않음)</span>' : ''}</summary><div style="padding:8px 4px"><div class="q-text small">${rich(q.question)}</div>${g.QT.review(q, x.r)}</div></details>`; }).join('')}</div></div>`;
  }

  // ───────── AI 튜터에게 넘길 "지금 화면" ─────────
  function weakText() {
    const E = EXAMS[exam()];
    const rows = E.cats.map(([c, l]) => ({ l, ...catStats(c) })).filter(s => s.n);
    const bad = rows.filter(s => s.bad).sort((a, b) => b.bad - a.bad).slice(0, 5).map(s => `${s.l} 오답 ${s.bad}`);
    const untried = rows.filter(s => !s.tried).map(s => s.l);
    const mocks = S().mocks.filter(m => m.exam === exam()).slice(-3).map(m => m.score.toFixed(1));
    return [`유형별(맞힘/전체): ${rows.map(s => `${s.l} ${s.ok}/${s.n}`).join(', ')}`, bad.length ? `오답 많은 유형: ${bad.join(', ')}` : '', untried.length ? `아직 안 푼 유형: ${untried.join(', ')}` : '', mocks.length ? `최근 모의고사 점수: ${mocks.join(', ')}` : '모의고사 기록 없음'].filter(Boolean).join('\n');
  }
  function aiCtx() {
    const route = location.hash || '#/';
    const [, a, b] = route.replace(/^#\//, '/').split('/');
    const E = EXAMS[exam()];
    const c = { route, exam: exam(), examName: E.name, examDate: INFO.exam.dateLabel, dday: Math.max(0, daysLeft()), page: PAGE_TITLE[a || ''] || '실기 연습' };
    if (RUN && RUN.mode === 'mock' && !RUN.done && a === 'mock' && b === 'run') {
      const it = RUN.items[RUN.i];
      Object.assign(c, { mock: true, q: BYID.get(it.id), H: RUN.H[RUN.i], pane: RUN.panes[RUN.i], pos: `${RUN.i + 1}/${RUN.items.length}번` });
      c.page = '모의고사 진행 중'; c.label = `모의고사 ${RUN.i + 1}번 · ${catName(c.q.cat)}`;
    } else if (RUN && RUN.h && RUN.ids && (a === 'practice' && b || a === 'hard' || a === 'q' || a === 'wrong' && b === 'run')) {
      const q = BYID.get(RUN.ids[RUN.i]);
      Object.assign(c, { q, H: RUN.h, graded: RUN.graded, ok: RUN.graded && RUN.lastResult && RUN.lastResult.ok, result: RUN.graded ? RUN.lastResult : null, pane: app.querySelector('.run-right'), pos: `${RUN.title} ${RUN.i + 1}/${RUN.ids.length}` });
      c.page = RUN.mode === 'single' ? '문제 풀기' : RUN.mode === 'wrong' ? '오답노트 다시 풀기' : `${RUN.title} 연습`; c.label = `${catName(q.cat)} · ${RUN.i + 1}/${RUN.ids.length}${RUN.graded ? (c.ok ? ' · 정답' : ' · 오답') : ''}`;
    } else if (a === 'concept' && CONCEPTS[b]) {
      c.concept = CONCEPTS[b]; c.conceptId = b; c.page = `개념 글`; c.label = `개념 · ${CONCEPTS[b].title}`;
    } else if (a === 'mock' && b === 'result' && RUN && RUN.results) {
      c.mockResult = `${RUN.score.toFixed(1)}점 (${RUN.score >= 60 ? '합격' : '불합격'})\n` + RUN.results.map((x, k) => { const q = BYID.get(x.id); return `${k + 1}번 ${x.r.ok ? '정답' : '오답'} · ${catName(q.cat)} · ${q.question.slice(0, 50)}`; }).join('\n');
      c.label = '모의고사 결과';
    }
    if (!c.q) c.weak = weakText();
    if (!c.label) c.label = `${c.page} · ${E.name}`;
    return c;
  }

  // ───────── 화면 이동 ─────────
  function render() {
    const route = location.hash || '#/';
    if (RUN && RUN.mode === 'mock' && !RUN.done && route !== '#/mock/run') {
      if (!confirmLeave()) { history.replaceState(null, '', '#/mock/run'); return; }
      clearInterval(tick); RUN = null;
    }
    paintTop(route);
    if (g.SHELL) g.SHELL.route(/^#\/(practice\/|hard|q\/|wrong\/run|mock\/run)/.test(route));
    setTimeout(() => g.AI && g.AI.refresh(), 0);
    const [, a, b] = route.replace(/^#\//, '/').split('/');
    app.scrollTop = 0;
    if (!a) app.innerHTML = viewHome();
    else if (a === 'concepts') app.innerHTML = viewConcepts();
    else if (a === 'concept') { app.innerHTML = viewConcept(b); const n = app.querySelector('[data-note]'); if (n) g.WIDGETS.mount(n, INFO); }
    else if (a === 'practice' && !b) app.innerHTML = viewPractice();
    else if (a === 'practice') { const cat = decodeURIComponent(b); startRun('practice', sortQs(Q.filter(q => inExam(q) && q.cat === cat)).map(q => q.id), catName(cat), '#/practice'); paintRun(); return; }
    else if (a === 'q') { startRun('single', [decodeURIComponent(b)], '한 문제', '#/'); paintRun(); return; }
    else if (a === 'hard') { const cat = b ? decodeURIComponent(b) : null; const order = c => EXAMS[exam()].cats.findIndex(x => x[0] === c); const ids = Q.filter(q => inExam(q) && isHard(q) && (!cat || q.cat === cat)).sort((x, y) => order(x.cat) - order(y.cat)).map(q => q.id); startRun('hard', ids, cat ? `심화 · ${catName(cat)}` : '심화 문제', '#/practice'); paintRun(); return; }
    else if (a === 'wrong' && b === 'run') { const ids = Object.entries(S().wrong).filter(([id]) => BYID.has(id) && inExam(BYID.get(id))).map(([id]) => id); startRun('wrong', g.QT.shuffle(ids), '오답노트', '#/wrong'); paintRun(); return; }
    else if (a === 'wrong') app.innerHTML = viewWrong();
    else if (a === 'mock' && b === 'run') { if (!RUN || RUN.mode !== 'mock') { location.hash = '#/mock'; return; } paintMock(); return; }
    else if (a === 'mock' && b === 'result') app.innerHTML = viewMockResult();
    else if (a === 'mock') app.innerHTML = viewMockStart();
    else app.innerHTML = `<div class="wrap"><div class="empty">없는 화면입니다. <a href="#/">홈으로</a></div></div>`;
    wireLinks(app);
  }
  app.addEventListener('click', e => {
    const go = e.target.closest('[data-go]'); if (go) { location.hash = go.dataset.go; return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    if (act.dataset.act === 'wrong-run') location.hash = '#/wrong/run';
    if (act.dataset.act === 'mock-start') { RUN = makeMock(); location.hash = '#/mock/run'; }
    if (act.dataset.act === 'mock-hard') { RUN = makeMock(true); location.hash = '#/mock/run'; }
  });
  addEventListener('hashchange', render);

  async function boot() {
    try {
      DATA = await loadData();
      await g.STORE.load();
      EXAMS = DATA.exam.exams; INFO = DATA.info; CONCEPTS = DATA.concepts || {};
      Q = buildQuestions(DATA); BYID = new Map(Q.map(q => [q.id, q]));
      const kb = g.KB ? g.KB.build({ concepts: CONCEPTS, questions: Q, conceptExam, principles: DATA.principles }) : null;
      g.APP = { Q, BYID, DATA, CONCEPTS, PRINCIPLES: DATA.principles || null, render, toast, aiCtx, catName, kb };
      render();
    } catch (e) {
      console.error(e);
      app.innerHTML = `<div class="wrap"><div class="card"><h2>프로그램을 시작하지 못했습니다</h2><pre>${esc(e.stack || e)}</pre></div></div>`;
    }
  }
  boot();
})(window);
