/* 2급 합격 노트 — 실기 메뉴 (#/silgi)
 * 자료: app/data/silgi_data.js (window.SGD) · 앱 공통 기능: window.APP (app.js가 노출)
 * 기록: 맞힘·체크 상태는 APP.S.read['sg:…']에 저장해 기존 기기 간 동기화를 그대로 탑니다.
 *       값 = 시간(ms, 10단위) + 상태(1 = 맞힘·완료, 2 = 틀림·해제). 더 최근 값이 이깁니다. */
(() => {
  'use strict';
  const D = window.SGD;
  if (!D) return;
  const A = () => window.APP;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const inline = s => (A() && A().inline ? A().inline(s) : esc(s));
  const rich = s => (A() && A().rich ? A().rich(s) : `<p>${esc(s)}</p>`);
  const toast = m => A() && A().toast(m);

  // ───────── 기록 ─────────
  const KEYP = 'sg:';
  function mark(key) { const v = (A().S.read || {})[KEYP + key]; return v ? v % 10 : 0; }
  function setMark(key, state) {
    const S = A().S; S.read = S.read || {};
    const prev = S.read[KEYP + key] || 0;
    let ts = Math.floor(Date.now() / 10) * 10;
    if (ts <= prev - (prev % 10)) ts = prev - (prev % 10) + 10;
    S.read[KEYP + key] = ts + state;
    A().save();
  }
  let LOCAL = {};
  try { LOCAL = JSON.parse(localStorage.getItem('netadmin2.silgi.local') || '{}') || {}; } catch (e) { LOCAL = {}; }
  const saveLocal = () => { try { localStorage.setItem('netadmin2.silgi.local', JSON.stringify(LOCAL)); } catch (e) { /* 저장 공간 없음 */ } };

  // ───────── 날짜 ─────────
  function daysLeft() {
    const [y, m, d] = D.EXAM.date.split('-').map(Number);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000);
  }
  const ddayText = () => { const n = daysLeft(); return n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '시험 종료'; };

  const track = () => (A().TR ? A().TR() : 'net');
  const T = () => D[track()] || D.net;

  // ═════════════ 화면 ═════════════
  function view(r) {
    const tr = track(), t = T();
    const sec = t.secs.some(s => s[0] === r.a) ? r.a : 'start';
    const full = tr === 'pc' ? 'PC정비사 2급' : '네트워크관리사 2급';
    const n = daysLeft();
    let body = '';
    switch (sec) {
      case 'start': body = viewStart(); break;
      case 'cable': body = article(D.CABLE, ['ICQA 종목 안내', 'velog 합격 후기(케이블 채점 기준·장비 그룹)', 'DigiKey·router-switch 케이블 제작 안내(길이)']); break;
      case 'drill': body = viewDrill(); break;
      case 'day': body = viewDay(); break;
      default: body = article(t.html[sec] || '', sources(sec));
    }
    return `<div class="wrap sg-wrap">
      <div class="page-head" style="margin-bottom:14px"><div><span class="eyebrow">실기 · ${esc(full)}</span><h1>${esc(full)} 실기</h1><p>${esc(D.EXAM.dateLabel)} · <strong>${ddayText()}</strong> · 80분 · 60점 이상 합격</p></div></div>
      <nav class="sg-tabs" aria-label="실기 메뉴">${t.secs.map(([id, label]) => `<a href="#/silgi/${id}"${id === sec ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('')}</nav>
      ${body}
    </div>`;
  }
  function sources(sec) {
    const net = { win: ['velog 합격 후기·기출 복원(문제 지시문)', 'ICQA 출제기준 변경(Windows Server 2022, 교재 공지)'], router: ['blog.solyi.kr 라우터 문제 정리', 'velog 합격 후기(no shutdown·copy r s 주의)'], linux: ['velog 합격 후기(리눅스 기출)'], short: ['velog 합격 후기(단답형 기출)', '나무위키(2026년 1회 NGFW)'] };
    const pc = { cmos: ['PC정비사 필기 기출(Award BIOS 메뉴)', '실기 강의 목차(CMOS Setup)'], console: ['실기 강의 목차(시스템·네트워크 명령어)', '2009년 합격 후기(콘솔형)'], wintask: ['실기 강의 목차(네트워크·레지스트리·원격 데스크톱·폴더 권한)'], drag: ['나무위키(드래그 앤 드롭형)', '실기 강의 목차(메인보드 칩셋·기억장치·백패널)'] };
    return (track() === 'pc' ? pc : net)[sec] || [];
  }
  function article(html, src) {
    return `<article class="card note-body sg-article">${html}
      ${src && src.length ? `<p class="sg-src">출처: ${src.map(esc).join(' · ')}</p>` : ''}</article>`;
  }

  // ───────── 개요 ─────────
  function viewStart() {
    const tr = track(), t = T();
    const ids = t.drill.map(q => q.id);
    const ok = ids.filter(id => mark('q:' + id) === 1).length, bad = ids.filter(id => mark('q:' + id) === 2).length;
    const sims = tr === 'pc' ? D.BIOS.tasks.map(x => 'b:' + x.id) : D.MISSIONS.map(x => 'r:' + x.id);
    const simDone = sims.filter(k => mark(k) === 1).length;
    const planDone = D.PLAN.filter(p => mark('c:' + p.id) === 1).length;
    const other = tr === 'pc' ? 'net' : 'pc';
    const otherName = other === 'pc' ? 'PC정비사 2급' : '네트워크관리사 2급';
    const n = daysLeft();
    const cards = t.secs.filter(([id]) => id !== 'start').map(([id, label]) => `<a class="card sg-jump" href="#/silgi/${id}"><b>${esc(label)}</b><span>${esc(jumpDesc(id))}</span></a>`).join('');
    return `<section class="sg-hero">
        <div class="sg-hero-l">
          <span class="kicker">2026년 제4회 실기 · ${esc(D.EXAM.dateLabel)}</span>
          <h2>${n > 0 ? `실기까지 <span class="big">${n}일</span>` : n === 0 ? '오늘이 실기 시험일!' : '실기 시험이 끝났어요'}</h2>
          <p>필기 합격 축하해요. 원서 접수 ${esc(D.EXAM.apply)} · 발표 ${esc(D.EXAM.result)}</p>
        </div>
        <div class="sg-hero-stats">
          <div><small>실전 문제</small><b>${ok}<i>/${ids.length}</i></b><span>${bad ? `틀린 문제 ${bad}개` : '맞힌 문제'}</span></div>
          <div><small>${tr === 'pc' ? 'BIOS 미션' : '라우터 미션'}</small><b>${simDone}<i>/${sims.length}</i></b><span>성공</span></div>
          <div><small>공부 계획</small><b>${planDone}<i>/${D.PLAN.length}</i></b><span>완료</span></div>
        </div>
      </section>
      <div class="grid g4 sg-jumps">${cards}</div>
      ${article(t.html.start + `<h2>남은 기간 공부 계획</h2><p class="muted">두 시험이 같은 날이라 계획을 하나로 묶었어요. 끝낸 항목을 눌러 체크하세요. 체크는 다른 기기와 함께 맞춰집니다.</p><div data-sg-widget="check" data-list="plan"></div>
        <h2>같은 날 보는 다른 시험</h2><p><strong>${esc(otherName)}</strong> 실기도 ${esc(D.EXAM.dateLabel)}에 봐요. 위쪽 시험 전환 버튼으로 바꾸면 그 시험의 실기 메뉴가 열립니다.</p>
        <p><button class="btn btn-outline btn-sm" data-sg="switch" data-v="${other}">${esc(otherName)} 실기 보기 →</button></p>
        ${notesLinks()}`, ['ICQA 종목 안내(일정·검정료·합격 기준)', 'velog 합격 후기 2025·2026(문제 수·배점·시간)', 'ICQA 자료실(연습 프로그램)'])}`;
  }
  function jumpDesc(id) {
    return ({ cable: 'T568B 순서·다이렉트/크로스·제작 그림', win: '8유형 × 5.5점 = 44점', router: '명령어 + 연습창 미션 17개', linux: '기출 명령어·권한 계산기', short: '기출 정답·포트·ICMP', drill: '직접 입력·선택형 실전 문제', day: '준비물·입실 시간 체크', cmos: 'BIOS 메뉴 + 연습 화면', console: 'ipconfig·netstat·chkdsk 등', wintask: '원격·공유·권한·레지스트리', drag: '부품·메모리 핀·단자 색' })[id] || '';
  }
  function notesLinks() {
    const t = T();
    const ok = t.notes.filter(([id]) => !A().hasTopic || A().hasTopic(id));
    if (!ok.length) return '';
    return `<h2>함께 보면 좋은 핵심 요약</h2><div class="sg-notes">${ok.map(([id, l]) => `<a class="chip" href="#/notes/${id}">${esc(l)} →</a>`).join('')}</div>`;
  }

  // ───────── 시험 당일 ─────────
  function viewDay() {
    const tr = track();
    const tips = tr === 'pc'
      ? `<ul><li>부분 점수가 없어요. 작업형 시뮬레이션과 콘솔 명령은 옵션 글자까지 정확하게.</li><li>레지스트리는 키를 하나씩 열어 보며 답을 찾습니다.</li><li>드래그·다지선다 1~2문제는 어려워도 넘어가고 아는 문제부터.</li><li>영어·한글 답이 다 되는 용어는 한글로 써서 철자 실수를 줄입니다.</li></ul>`
      : `<ul><li>케이블은 10분 안에 제출(감독관 회수). 배열·끝까지 닿음·빠지지 않음을 확인.</li><li>윈도우 8문제: &lt;보기&gt; 값을 하나씩 체크하며 입력. 단위(분·시간·일)와 대소문자 확인.</li><li>라우터 3문제(마지막 20분): 활성화 → no shutdown, 로그인 → login, 저장 → copy r s + Enter.</li><li>ROUTER1과 ROUTER2를 헷갈리지 않기.</li></ul>`;
    return article(`<h2>시험 정보</h2>
      <div class="tbl"><table><tbody>
      <tr><td>시험일</td><td>2026년 ${esc(D.EXAM.dateLabel)}</td></tr>
      <tr><td>입실</td><td>2022년 제4회 공지 기준: 네트워크관리사 2급 실기 <strong>09:20</strong>, PC정비사 2급 실기 <strong>11:20</strong> (각 80분). 이번 회차 시간은 수험표로 꼭 확인하세요.</td></tr>
      <tr><td>합격 발표</td><td>${esc(D.EXAM.result)} (지난 회차는 오전 9시 발표)</td></tr>
      </tbody></table></div>
      <h2>체크리스트</h2><div data-sg-widget="check" data-list="day"></div>
      <h2>시험 중 기억할 것</h2>${tips}`, ['ICQA 2022년 제4회 실기 원서접수 안내(입실 시간)', 'ICQA 종목 안내', '합격 후기'] );
  }

  // ───────── 실전 문제 ─────────
  const DR = { cat: 'all', mode: 'all', run: null };
  function drillPool() {
    const t = T();
    let list = t.drill.filter(q => DR.cat === 'all' || q.c === DR.cat);
    if (DR.mode === 'wrong') list = list.filter(q => mark('q:' + q.id) === 2);
    if (DR.mode === 'new') list = list.filter(q => !mark('q:' + q.id));
    return list;
  }
  function viewDrill() {
    const t = T(), cats = D.CATS[track()];
    const R = DR.run && DR.run.tr === track() ? DR.run : null;
    if (R) return viewDrillRun(R);
    const stat = c => { const l = t.drill.filter(q => c === 'all' || q.c === c); return { n: l.length, ok: l.filter(q => mark('q:' + q.id) === 1).length, bad: l.filter(q => mark('q:' + q.id) === 2).length }; };
    const all = stat('all');
    const pool = drillPool();
    return `<div class="card pad-lg">
      <div class="section-head"><h2>실전 문제</h2><span class="muted" style="font-size:13.5px">전체 ${all.n}문제 · 맞힘 ${all.ok} · 틀림 ${all.bad}</span></div>
      <p class="muted" style="margin-bottom:14px">실기처럼 <strong>명령어를 직접 입력</strong>하는 문제와 고르는 문제를 섞었어요. 틀리면 정답과 이유를 바로 보여 줍니다. 라우터 명령은 줄임말(conf t, int fa0/0 등)도 정답으로 인정해요.</p>
      <div class="opt-group"><span class="lab">범위</span><div class="chips">${[['all', '전체']].concat(cats).map(([id, l]) => { const s = stat(id); return `<button class="chip" data-sg="dr-cat" data-v="${id}" aria-pressed="${DR.cat === id}">${esc(l)}<span class="n">${s.ok}/${s.n}</span></button>`; }).join('')}</div></div>
      <div class="opt-group"><span class="lab">문제</span><div class="chips">${[['all', '모두'], ['new', '안 푼 문제'], ['wrong', '틀린 문제']].map(([v, l]) => `<button class="chip" data-sg="dr-mode" data-v="${v}" aria-pressed="${DR.mode === v}">${l}</button>`).join('')}</div></div>
      <div class="row" style="margin-top:18px"><button class="btn btn-primary" data-sg="dr-start"${pool.length ? '' : ' disabled'}>▶ ${pool.length ? `${Math.min(pool.length, 20)}문제 풀기` : '풀 문제가 없어요'}</button>${pool.length > 20 ? `<button class="btn btn-outline" data-sg="dr-start" data-v="all">전체 ${pool.length}문제</button>` : ''}</div>
    </div>
    <div class="card pad-lg" style="margin-top:14px"><h3 style="margin-bottom:10px">범위별 기록</h3>
      <div class="tbl sg-tbl"><table><thead><tr><th>범위</th><th>문제</th><th>맞힘</th><th>틀림</th></tr></thead><tbody>${cats.map(([id, l]) => { const s = stat(id); return `<tr><td>${esc(l)}</td><td>${s.n}</td><td>${s.ok}</td><td>${s.bad ? `<span class="badge fail">${s.bad}</span>` : '0'}</td></tr>`; }).join('')}</tbody></table></div>
    </div>`;
  }
  function viewDrillRun(R) {
    const t = T();
    const byId = new Map(t.drill.map(q => [q.id, q]));
    if (R.idx >= R.ids.length) {
      const okN = R.ids.filter(id => R.res[id]).length;
      const wrong = R.ids.filter(id => !R.res[id]);
      return `<div class="card pad-lg sg-drill-end">
        <h2>${okN === R.ids.length ? '전부 맞혔어요!' : '끝까지 풀었어요'}</h2>
        <p class="sg-score"><b>${okN}</b> / ${R.ids.length} 맞힘 (${Math.round(okN / R.ids.length * 100)}%)</p>
        ${wrong.length ? `<p class="muted">틀린 문제 ${wrong.length}개는 아래에서 다시 보거나 바로 다시 풀 수 있어요.</p>` : ''}
        <div class="row" style="margin:14px 0">${wrong.length ? `<button class="btn btn-primary" data-sg="dr-retry">틀린 ${wrong.length}문제 다시</button>` : ''}<button class="btn btn-outline" data-sg="dr-quit">처음 화면</button></div>
        ${wrong.map(id => { const q = byId.get(id); return q ? `<details class="card witem"><summary><span class="t">${esc(q.q)}</span></summary><div class="wbody">${explainBox(q, R.ans[id], false)}</div></details>` : ''; }).join('')}
      </div>`;
    }
    const q = byId.get(R.ids[R.idx]);
    if (!q) { R.idx++; return viewDrillRun(R); }
    const answered = Object.prototype.hasOwnProperty.call(R.ans, q.id);
    const cat = (D.CATS[track()].find(c => c[0] === q.c) || ['', ''])[1];
    let inputHTML = '';
    if (q.type === 'input') {
      inputHTML = `<form class="sg-ans" data-sg-form="dr-answer"><input class="input mono" id="sg-in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="답을 입력하세요" ${answered ? `value="${esc(R.ans[q.id])}" disabled` : ''}><button class="btn btn-primary" ${answered ? 'disabled' : ''}>확인</button></form>${answered ? '' : '<p class="muted" style="font-size:13px;margin-top:6px">Enter로 확인 · 모르면 빈칸으로 확인을 눌러 정답 보기</p>'}`;
    } else {
      const multi = q.type === 'multi';
      const chosen = answered ? R.ans[q.id] : (R.pick || []);
      inputHTML = `<div class="opts">${q.o.map((o, j) => {
        let cls = '', res = '';
        const isAns = multi ? q.a.includes(j) : q.a === j;
        const picked = multi ? chosen.includes(j) : chosen === j;
        if (answered) { if (isAns) { cls = 'correct'; res = picked ? '내 답 · 정답' : '정답'; } else if (picked) { cls = 'wrong'; res = '내 답'; } else cls = 'dim'; }
        else if (picked) cls = 'selected';
        return `<button class="opt ${cls}" ${answered ? 'disabled' : `data-sg="${multi ? 'dr-toggle' : 'dr-pick'}" data-i="${j}"`} aria-pressed="${picked}"><span class="mk">${multi ? (picked ? '✓' : '') : j + 1}</span><span class="ot">${esc(o)}</span>${res ? `<span class="res">${res}</span>` : ''}</button>`;
      }).join('')}</div>${multi && !answered ? `<div class="row" style="margin-top:12px"><button class="btn btn-primary" data-sg="dr-multi"${(R.pick || []).length ? '' : ' disabled'}>확인</button><span class="muted" style="font-size:13px">정답을 모두 고른 뒤 확인</span></div>` : ''}`;
    }
    const doneN = Object.keys(R.ans).length, okN = R.ids.filter(id => R.res[id]).length;
    return `<div class="sg-drill-top"><button class="btn btn-ghost btn-sm" data-sg="dr-quit">← 그만 풀기</button><div class="bar"><span style="width:${(R.idx + (answered ? 1 : 0)) / R.ids.length * 100}%"></span></div><span class="score">${R.idx + 1}/${R.ids.length} · 정답 ${okN}/${doneN}</span></div>
      <div class="card q-card">
        <div class="q-meta"><span class="badge info">${esc(cat)}</span><span>${q.type === 'input' ? '직접 입력' : q.type === 'multi' ? '모두 고르기' : '하나 고르기'}</span>${q.cs ? '<span class="badge warn">대소문자 구분</span>' : ''}${mark('q:' + q.id) === 2 && !answered ? '<span class="badge fail">전에 틀림</span>' : ''}</div>
        <div class="q-stem">${inline(q.q)}</div>
        ${inputHTML}
        ${answered ? explainBox(q, R.ans[q.id], true) : ''}
        ${answered ? `<div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-primary" id="sg-next" data-sg="dr-next">${R.idx + 1 < R.ids.length ? '다음 문제 →' : '결과 보기'}</button></div>` : ''}
      </div>`;
  }
  function answerText(q) {
    if (q.type === 'input') return q.a.map(a => `<code>${esc(a)}</code>`).join(' <span class="muted">또는</span> ');
    if (q.type === 'multi') return q.a.map(i => `<b class="ansno">${i + 1}</b>${esc(q.o[i])}`).join(' · ');
    return `<b class="ansno">${q.a + 1}</b>${esc(q.o[q.a])}`;
  }
  function explainBox(q, given, live) {
    const ok = judge(q, given);
    const empty = q.type === 'input' && !String(given || '').trim();
    const head = ok ? `<div class="ex-head ok">✓ 정답입니다 <span class="ans">${answerText(q)}</span></div>`
      : `<div class="ex-head bad">✗ ${empty ? '정답 확인' : '오답입니다'} <span class="ans">정답 ${answerText(q)}</span></div>`;
    const mine = q.type === 'input' && !ok && !empty ? `<p>내 답: <code>${esc(given)}</code>${q.router ? ' — 명령어 철자·순서·숫자를 비교해 보세요.' : ''}</p>` : '';
    return `<div class="explain">${head}<div class="ex-body">${mine}${rich(q.e)}</div></div>`;
  }

  // 정답 비교
  const ROUTER_KW = new Set(['enable', 'configure', 'terminal', 'copy', 'running-config', 'startup-config', 'write', 'memory', 'no', 'shutdown', 'interface', 'fastethernet', 'serial', 'ip', 'address', 'secondary', 'clock', 'rate', 'bandwidth', 'description', 'line', 'console', 'vty', 'password', 'login', 'exec-timeout', 'hostname', 'default-gateway', 'default-network', 'dhcp', 'pool', 'network', 'show', 'route', 'flash:', 'users', 'processes', 'hosts', 'version', 'interfaces', 'encapsulation', 'frame-relay', 'snmp-server', 'community', 'ro', 'rw', 'transport', 'input', 'ssh']);
  const ONE_LETTER_OK = new Set(['terminal', 'running-config', 'startup-config']);
  function normIf(s) {
    return s.replace(/\b(f|fa|fas|fast|faste|fastet|fasteth|fastethe|fastether|fastethern|fastetherne|fastethernet)\s*(\d+\/\d+)/gi, 'fastethernet $2')
      .replace(/\b(s|se|ser|seri|seria|serial)\s*(\d+\/\d+)/gi, 'serial $2');
  }
  function routerMatch(input, ans, cs) {
    let a = normIf(input.trim().replace(/\s+/g, ' '));
    if (/^(wr|wri|writ|write)$/i.test(a)) a = 'write memory';
    const it = a.split(' '), at = ans.split(' ');
    if (it.length !== at.length) return false;
    return at.every((w, i) => {
      const x = it[i];
      const kw = ROUTER_KW.has(w) || w === 'flash';
      if (kw) { const lx = w === 'flash' ? x.toLowerCase().replace(/:$/, '') : x.toLowerCase(); if (lx === w) return true; if (!w.startsWith(lx)) return false; return lx.length >= 2 || ONE_LETTER_OK.has(w); }
      if (/^\d+$/.test(w) && /^\d+$/.test(x)) return +x === +w;
      return cs ? x === w : x.toLowerCase() === w.toLowerCase();
    });
  }
  function judge(q, given) {
    if (q.type === 'input') {
      const g = String(given || '').trim().replace(/\s+/g, ' ').replace(/[.。]$/, '');
      if (!g) return false;
      return q.a.some(a => {
        if (q.router) return routerMatch(g, a, q.cs) || (a === 'show users' && routerMatch(g, 'show user', q.cs));
        return q.cs ? g === a : g.toLowerCase() === a.toLowerCase();
      });
    }
    if (q.type === 'multi') { const g = (given || []).slice().sort(), a = q.a.slice().sort(); return g.length === a.length && g.every((x, i) => x === a[i]); }
    return given === q.a;
  }
  function answerDrill(val) {
    const R = DR.run; if (!R) return;
    const q = T().drill.find(x => x.id === R.ids[R.idx]); if (!q) return;
    if (Object.prototype.hasOwnProperty.call(R.ans, q.id)) return;
    R.ans[q.id] = val;
    const ok = judge(q, val);
    R.res[q.id] = ok;
    R.pick = null;
    setMark('q:' + q.id, ok ? 1 : 2);
    rerender(() => { const nx = $('#sg-next'); if (nx) nx.focus({ preventScroll: true }); const ex = $('.sg-wrap .explain'); if (ex && ex.getBoundingClientRect().top > innerHeight - 120) ex.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  }

  // ═════════════ 위젯 ═════════════
  function mount(root) {
    $$('[data-sg-widget]', root).forEach(el => {
      const w = el.dataset.sgWidget;
      try {
        if (w === 'pins') el.innerHTML = pinsHTML();
        else if (w === 'steps') el.innerHTML = stepsHTML();
        else if (w === 'colors') paintColors(el);
        else if (w === 'bin2dec') mountBin(el);
        else if (w === 'chmod') mountChmod(el);
        else if (w === 'rtypes') el.innerHTML = rtypesHTML();
        else if (w === 'router') paintRouter(el);
        else if (w === 'bios') paintBios(el);
        else if (w === 'match') paintMatch(el);
        else if (w === 'check') paintCheck(el);
      } catch (e) { el.innerHTML = `<p class="muted">이 부분을 불러오지 못했어요. 새로고침해 주세요.</p>`; if (window.console) console.error(e); }
    });
    const inp = $('#sg-in', root);
    if (inp && !inp.disabled && matchMedia('(hover: hover)').matches) inp.focus({ preventScroll: true });
  }
  function rerender(after) { A().render(); if (after) after(); }

  // ───────── 핀 배열 그림 ─────────
  const WIRE = {
    wo: { n: '흰주', c: '#f28c28', s: 1 }, o: { n: '주', c: '#f28c28' }, wg: { n: '흰초', c: '#2e9d4a', s: 1 }, g: { n: '초', c: '#2e9d4a' },
    wb: { n: '흰파', c: '#2f6fde', s: 1 }, b: { n: '파', c: '#2f6fde' }, wbr: { n: '흰갈', c: '#8b5a2b', s: 1 }, br: { n: '갈', c: '#8b5a2b' },
  };
  const ORDER = { B: ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'], A: ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'] };
  let svgSeq = 0;
  function stripeDefs(id) {
    return `<defs>${Object.entries(WIRE).filter(([, w]) => w.s).map(([k, w]) => `<pattern id="${id}-${k}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="#fff"/><rect width="3.4" height="8" fill="${w.c}"/></pattern>`).join('')}</defs>`;
  }
  const fillOf = (id, k) => (WIRE[k].s ? `url(#${id}-${k})` : WIRE[k].c);
  function connectorSVG(std) {
    const id = 'sgw' + (++svgSeq);
    const ord = ORDER[std];
    const x0 = 28, gap = 30;
    const wires = ord.map((k, i) => {
      const x = x0 + i * gap;
      return `<rect x="${x}" y="40" width="20" height="150" rx="4" fill="${fillOf(id, k)}" stroke="#55606f" stroke-width="1"/>
        <rect x="${x + 2}" y="44" width="16" height="14" rx="2" fill="#d6a531" stroke="#8a6a1c" stroke-width=".8"/>
        <text x="${x + 10}" y="32" text-anchor="middle" class="pin-n">${i + 1}</text>
        <text x="${x + 10}" y="210" text-anchor="middle" class="pin-l">${WIRE[k].n}</text>`;
    }).join('');
    return `<svg viewBox="0 0 280 222" role="img" aria-label="T568${std} 배열: ${ord.map((k, i) => `${i + 1}번 ${WIRE[k].n}`).join(', ')}" class="sg-pinsvg">${stripeDefs(id)}
      <rect x="14" y="36" width="252" height="130" rx="10" fill="rgba(180,200,230,.18)" stroke="currentColor" stroke-opacity=".35"/>
      ${wires}
      <rect x="14" y="166" width="252" height="10" fill="rgba(120,130,150,.35)"/>
      </svg>`;
  }
  function pinsHTML() {
    return `<div class="sg-pins">
      <figure><figcaption><b>T568B</b> · 다이렉트 기본</figcaption>${connectorSVG('B')}</figure>
      <figure><figcaption><b>T568A</b> · 크로스의 반대쪽</figcaption>${connectorSVG('A')}</figure>
    </div>
    <p class="sg-cap">커넥터를 <strong>클립(걸쇠)이 아래</strong>, 금색 핀이 위로 보이게 들었을 때 모습입니다. 왼쪽이 1번. 줄무늬 선 = 흰색 바탕에 색 줄.</p>`;
  }

  // ───────── 케이블 만드는 순서 그림 ─────────
  function stepSVG(i) {
    const id = 'sgs' + (++svgSeq);
    const defs = stripeDefs(id);
    const ord = ORDER.B;
    const jacket = (x, w) => `<rect x="${x}" y="56" width="${w}" height="28" rx="12" fill="#c9ced8" stroke="#8e96a6"/>`;
    const fan = (x1, spread) => ord.map((k, j) => { const y = 70 + (j - 3.5) * spread; return `<path d="M${x1} 70 C ${x1 + 30} 70, ${x1 + 40} ${y}, ${x1 + 80} ${y}" stroke="${WIRE[k].c}" stroke-width="5" fill="none" ${WIRE[k].s ? 'stroke-dasharray="4 3"' : ''}/>`; }).join('');
    const flat = (x1, len) => ord.map((k, j) => `<rect x="${x1}" y="${52 + j * 4.6}" width="${len}" height="4.2" fill="${fillOf(id, k)}" stroke="#5d6676" stroke-width=".3"/>`).join('');
    const arrow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="var(--primary)" stroke-width="2.5" marker-end="url(#${id}-ar)"/>`;
    const ar = `<marker id="${id}-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--primary)"/></marker>`;
    const lab = (x, y, t) => `<text x="${x}" y="${y}" class="st-l" text-anchor="middle">${t}</text>`;
    let g = '';
    switch (i) {
      case 0: g = `${jacket(10, 150)}<rect x="160" y="60" width="70" height="20" rx="6" fill="#e3e6ec" stroke="#9aa2b1" stroke-dasharray="3 3"/>
        <path d="M150 40 v60" stroke="var(--bad)" stroke-width="2" stroke-dasharray="4 3"/>
        <rect x="128" y="24" width="44" height="18" rx="5" fill="#333a48"/>${lab(150, 18, '탈피기를 한 바퀴')}
        <path d="M160 108 h70" stroke="var(--primary)" stroke-width="1.5"/><path d="M160 103v10M230 103v10" stroke="var(--primary)" stroke-width="1.5"/>${lab(195, 126, '약 2.5~3cm')}`; break;
      case 1: g = `${jacket(10, 100)}${fan(110, 9)}${lab(200, 126, '꼬임을 풀어 곧게 편다')}`; break;
      case 2: g = `${jacket(10, 100)}${flat(110, 110)}<text x="226" y="58" class="st-s" font-size="9">1 흰주</text><text x="226" y="90" class="st-s" font-size="9">8 갈</text>${lab(165, 126, '흰주·주·흰초·파·흰파·초·흰갈·갈')}`; break;
      case 3: g = `${jacket(10, 100)}${flat(110, 70)}<rect x="180" y="52" width="40" height="37" fill="none" stroke="#9aa2b1" stroke-dasharray="3 3"/>
        <path d="M180 40 v60" stroke="var(--bad)" stroke-width="2.5"/>${lab(180, 34, '✂ 일자로')}
        <path d="M110 108 h70" stroke="var(--primary)" stroke-width="1.5"/><path d="M110 103v10M180 103v10" stroke="var(--primary)" stroke-width="1.5"/>${lab(145, 126, '1.2~1.5cm 남김')}`; break;
      case 4: g = `${jacket(10, 120)}${flat(130, 62)}<rect x="118" y="40" width="96" height="62" rx="6" fill="rgba(170,200,240,.25)" stroke="#8aa0c0"/>
        <rect x="186" y="44" width="24" height="54" fill="#d6a531" opacity=".55"/>${lab(166, 120, '선 끝이 맨 앞까지 · 겉피복도 안으로')}
        ${arrow(40, 30, 105, 30)}${lab(70, 22, '밀어 넣기')}<text x="226" y="74" class="st-s">클립↓</text>`; break;
      case 5: g = `${jacket(10, 110)}<rect x="120" y="44" width="70" height="52" rx="6" fill="rgba(170,200,240,.35)" stroke="#8aa0c0"/>
        <path d="M110 18 L200 18 L210 40 L100 40 z" fill="#2e3646"/><path d="M110 122 L200 122 L210 100 L100 100 z" fill="#2e3646"/>
        ${arrow(155, 4, 155, 16)}${arrow(155, 136, 155, 124)}${lab(250, 74, '꽉! 2번')}`; break;
      case 6: g = `<rect x="14" y="30" width="110" height="80" rx="10" fill="#f4f6fa" stroke="#9aa2b1"/><rect x="156" y="30" width="110" height="80" rx="10" fill="#f4f6fa" stroke="#9aa2b1"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(j => `<circle cx="${30 + j * 11.5}" cy="58" r="4" fill="#2bd46b"/><text x="${30 + j * 11.5}" y="76" font-size="7" text-anchor="middle" class="st-s">${j + 1}</text><circle cx="${172 + j * 11.5}" cy="58" r="4" fill="#2bd46b"/><text x="${172 + j * 11.5}" y="76" font-size="7" text-anchor="middle" class="st-s">${j + 1}</text>`).join('')}
        ${lab(69, 98, 'MASTER')}${lab(211, 98, 'REMOTE')}${lab(140, 128, '다이렉트: 1-1 … 8-8 차례로 켜짐')}`; break;
    }
    return `<svg viewBox="0 0 280 140" class="sg-stepsvg" aria-hidden="true"><defs>${ar}</defs>${defs}${g}</svg>`;
  }
  function stepsHTML() {
    return `<div class="sg-steps">${D.STEPS.map((s, i) => `<div class="sg-step"><div class="sg-step-n">${i + 1}</div><div class="sg-step-b"><h3>${esc(s.t)}</h3>${stepSVG(i)}<p>${s.d}</p></div></div>`).join('')}</div>`;
  }

  // ───────── 색 순서 연습 ─────────
  const CT = { std: 'B', seq: [], miss: 0, start: 0, deck: null, flash: '', done: 0 };
  function paintColors(el) {
    if (!CT.deck) CT.deck = shuffle(Object.keys(WIRE));
    const ord = ORDER[CT.std];
    const id = 'sgc';
    const slots = ord.map((k, i) => { const got = CT.seq[i]; return `<div class="sg-slot ${got ? 'on' : ''}"><span class="i">${i + 1}</span>${got ? `<span class="w" style="background:${WIRE[got].s ? `repeating-linear-gradient(135deg,#fff 0 5px,${WIRE[got].c} 5px 9px)` : WIRE[got].c}"></span><small>${WIRE[got].n}</small>` : '<span class="w empty"></span><small>&nbsp;</small>'}</div>`; }).join('');
    const best = LOCAL['best' + CT.std];
    const complete = CT.seq.length === 8;
    el.innerHTML = `<div class="sg-colors" id="${id}">
      <div class="row" style="justify-content:space-between"><div class="chips">${['B', 'A'].map(s => `<button class="chip" data-sg="ct-std" data-v="${s}" aria-pressed="${CT.std === s}">T568${s}</button>`).join('')}</div>
      <span class="muted" style="font-size:13px">${best ? `최고 기록 ${(best / 1000).toFixed(1)}초` : '기록 없음'}</span></div>
      <div class="sg-slots">${slots}</div>
      ${complete ? `<div class="sg-ok">완성! ${((CT.done - CT.start) / 1000).toFixed(1)}초 · 실수 ${CT.miss}번 <button class="btn btn-primary btn-sm" data-sg="ct-reset">다시</button></div>`
        : `<div class="sg-wires">${CT.deck.filter(k => !CT.seq.includes(k)).map(k => `<button class="sg-wire ${CT.flash === k ? 'bad' : ''}" data-sg="ct-pick" data-v="${k}"><span class="w" style="background:${WIRE[k].s ? `repeating-linear-gradient(135deg,#fff 0 5px,${WIRE[k].c} 5px 9px)` : WIRE[k].c}"></span>${WIRE[k].n}</button>`).join('')}</div>
        <p class="muted" style="font-size:13px;margin-top:8px">${CT.seq.length + 1}번 선을 누르세요 · 실수 ${CT.miss}번</p>`}
    </div>`;
  }
  function ctPick(k) {
    const ord = ORDER[CT.std];
    if (!CT.seq.length) CT.start = Date.now();
    if (ord[CT.seq.length] === k) { CT.seq.push(k); CT.flash = ''; if (CT.seq.length === 8) { CT.done = Date.now(); const t = CT.done - CT.start; if (!LOCAL['best' + CT.std] || t < LOCAL['best' + CT.std]) { LOCAL['best' + CT.std] = t; saveLocal(); } } }
    else { CT.miss++; CT.flash = k; toast(`${CT.seq.length + 1}번은 ${WIRE[ord[CT.seq.length]].n}이에요`); }
    $$('[data-sg-widget="colors"]').forEach(paintColors);
  }

  // ───────── 2진수 변환기 ─────────
  function mountBin(el) {
    el.innerHTML = `<div class="calc"><div class="row"><input class="input mono" value="10101100.00010000.10010110.01110011" aria-label="2진수 IP" style="flex:1;min-width:240px"></div><div class="out"></div></div>`;
    const input = $('input', el), out = $('.out', el);
    const run = () => {
      const s = input.value.trim();
      const parts = s.split('.');
      if (parts.length === 4 && parts.every(p => /^[01]{1,8}$/.test(p))) {
        const dec = parts.map(p => parseInt(p, 2));
        out.innerHTML = `<div>10진수 IP<b>${dec.join('.')}</b></div>${parts.map((p, i) => `<div>${i + 1}번째 옥텟<b>${p.padStart(8, '0')} = ${dec[i]}</b></div>`).join('')}`;
      } else if (parts.length === 4 && parts.every(p => /^\d{1,3}$/.test(p) && +p <= 255)) {
        out.innerHTML = `<div>2진수 IP<b>${parts.map(p => (+p).toString(2).padStart(8, '0')).join('.')}</b></div>`;
      } else if (/^\/?\d{1,2}$/.test(s) && +s.replace('/', '') <= 32) {
        const n = +s.replace('/', ''); const m = n ? (0xFFFFFFFF << (32 - n)) >>> 0 : 0;
        out.innerHTML = `<div>/${n} 마스크<b>${[24, 16, 8, 0].map(k => (m >>> k) & 255).join('.')}</b></div>`;
      } else out.innerHTML = '<div style="grid-column:1/-1"><b>2진수 IP(점 4개), 10진수 IP, 또는 /22 같은 비트 수를 넣어 보세요</b></div>';
    };
    input.addEventListener('input', run); run();
  }

  // ───────── chmod 계산기 ─────────
  const CH = { v: [7, 5, 5] };
  function mountChmod(el) {
    const who = ['소유자(u)', '그룹(g)', '기타(o)'], bits = [['r', 4, '읽기'], ['w', 2, '쓰기'], ['x', 1, '실행']];
    const paint = () => {
      const sym = CH.v.map(n => bits.map(([c, b]) => (n & b ? c : '-')).join('')).join('');
      el.innerHTML = `<div class="calc sg-chmod">
        <div class="sg-chgrid">${who.map((w, i) => `<div class="sg-chrow"><span>${w}</span>${bits.map(([c, b, l]) => `<button class="chip" data-i="${i}" data-b="${b}" aria-pressed="${!!(CH.v[i] & b)}">${c} ${l}</button>`).join('')}<b>${CH.v[i]}</b></div>`).join('')}</div>
        <div class="out"><div>숫자<b>${CH.v.join('')}</b></div><div>기호<b>${sym}</b></div><div>명령<b>chmod ${CH.v.join('')} 파일</b></div></div>
        <div class="row" style="margin-top:10px"><input class="input mono" maxlength="3" value="${CH.v.join('')}" aria-label="권한 숫자" style="width:110px;min-width:0"><span class="muted" style="font-size:13px">숫자 3개를 넣어도 됩니다</span></div></div>`;
      $$('.sg-chrow .chip', el).forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, k = +b.dataset.b; CH.v[i] ^= k; paint(); }));
      const inp = $('input', el);
      inp.addEventListener('input', () => { if (/^[0-7]{3}$/.test(inp.value)) { CH.v = inp.value.split('').map(Number); paint(); const ni = $('input', el); ni.focus(); ni.setSelectionRange(3, 3); } });
    };
    paint();
  }

  // ───────── 체크리스트 ─────────
  function paintCheck(el) {
    const list = el.dataset.list === 'day' ? D.DAY : D.PLAN;
    const done = list.filter(p => mark('c:' + p.id) === 1).length;
    el.innerHTML = `<div class="sg-check"><div class="sg-progress"><span style="width:${done / list.length * 100}%"></span></div><p class="muted" style="font-size:13px;margin:4px 0 10px">${done}/${list.length} 완료</p>
      ${list.map(p => { const on = mark('c:' + p.id) === 1; return `<button class="sg-ci ${on ? 'on' : ''}" data-sg="check" data-v="${p.id}" aria-pressed="${on}"><span class="box">${on ? '✓' : ''}</span><span class="tx">${p.when ? `<small>${esc(p.when)}</small>` : ''}<strong>${esc(p.t)}</strong><span>${esc(p.d)}</span></span></button>`; }).join('')}</div>`;
  }

  // ───────── 짝 맞추기 ─────────
  const MS = {};
  function newMatch(setId) {
    const set = D.MATCH[setId];
    const pairs = shuffle(set.pairs).slice(0, Math.min(6, set.pairs.length));
    MS[setId] = { pairs, left: shuffle(pairs.map((p, i) => i)), right: shuffle(pairs.map((p, i) => i)), done: [], selL: null, selR: null, miss: 0, bad: null };
  }
  function paintMatch(el) {
    const setId = el.dataset.set, set = D.MATCH[setId];
    if (!set) return;
    if (!MS[setId]) newMatch(setId);
    const M = MS[setId];
    const fin = M.done.length === M.pairs.length;
    const btn = (side, i) => {
      const doneP = M.done.includes(i);
      const sel = side === 'L' ? M.selL === i : M.selR === i;
      const bad = M.bad && M.bad[side] === i;
      const txt = M.pairs[i][side === 'L' ? 0 : 1];
      return `<button class="sg-mb ${doneP ? 'done' : ''} ${sel ? 'sel' : ''} ${bad ? 'bad' : ''}" ${doneP ? 'disabled' : `data-sg="mt-pick" data-set="${setId}" data-side="${side}" data-i="${i}"`}>${esc(txt)}</button>`;
    };
    el.innerHTML = `<div class="sg-match card">
      <div class="row" style="justify-content:space-between;margin-bottom:10px"><b>짝 맞추기 · ${esc(set.title)}</b><span class="muted" style="font-size:13px">${M.done.length}/${M.pairs.length} · 실수 ${M.miss}</span></div>
      ${fin ? `<div class="sg-ok">다 맞혔어요! 실수 ${M.miss}번 <button class="btn btn-primary btn-sm" data-sg="mt-new" data-set="${setId}">새 문제</button></div>` : ''}
      <div class="sg-mgrid"><div>${M.left.map(i => btn('L', i)).join('')}</div><div>${M.right.map(i => btn('R', i)).join('')}</div></div>
      ${fin ? '' : '<p class="muted" style="font-size:12.5px;margin-top:8px">왼쪽 하나, 오른쪽 하나를 차례로 누르세요.</p>'}
    </div>`;
  }
  function mtPick(setId, side, i) {
    const M = MS[setId]; if (!M) return;
    if (side === 'L') M.selL = M.selL === i ? null : i; else M.selR = M.selR === i ? null : i;
    M.bad = null;
    if (M.selL !== null && M.selR !== null) {
      if (M.selL === M.selR) { M.done.push(M.selL); }
      else { M.miss++; M.bad = { L: M.selL, R: M.selR }; const p = M.pairs[M.selL]; toast(`${p[0]} → ${p[1]}`); }
      M.selL = null; M.selR = null;
    }
    $$(`[data-sg-widget="match"][data-set="${setId}"]`).forEach(paintMatch);
  }

  // ═════════════ 라우터 연습창 ═════════════
  const RS = { st: null, out: [], hist: [], hpos: -1, mission: 'm01', hint: 0 };
  const ifc = serial => ({ ip: '', mask: '', sec: [], shut: true, desc: '', bw: serial ? 1544 : 100000, clock: 0, encap: serial ? 'hdlc' : '', dlci: 0, serial: !!serial });
  const lnc = () => ({ pw: '', login: false, tm: null, tr: '' });
  function rsFresh() {
    return { host: 'Router', mode: 'user', cur: null, line: null, pool: null, wait: null, ifs: { 'FastEthernet0/0': ifc(0), 'FastEthernet0/1': ifc(0), 'Serial2/0': ifc(1), 'Serial2/1': ifc(1) }, lines: { con: lnc(), vty: lnc() }, enSecret: '', enPass: '', gw: '', defnet: '', pools: {}, routes: [], snmp: [], banner: '', shows: [], saved: null };
  }
  const CONF_KEYS = ['host', 'ifs', 'lines', 'enSecret', 'enPass', 'gw', 'defnet', 'pools', 'routes', 'snmp', 'banner', 'shows'];
  const snap = st => JSON.parse(JSON.stringify(CONF_KEYS.reduce((o, k) => (o[k] = st[k], o), {})));
  function prompt(st) { return st.host + ({ user: '>', priv: '#', config: '(config)#', if: '(config-if)#', line: '(config-line)#', dhcp: '(dhcp-config)#' })[st.mode]; }
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
    config: [['hostname', '장비 이름 바꾸기'], ['interface', '인터페이스로 들어가기 · int fa0/0, int s2/0'], ['line', '콘솔·Telnet 줄 · line con 0, line vty 0 4'], ['enable', '특권 암호 · enable secret/password'], ['ip', 'route · default-gateway · default-network · dhcp pool'], ['snmp-server', 'SNMP 커뮤니티'], ['banner', '접속 배너 · banner motd #글#'], ['no', '설정 지우기'], ['do', '설정 모드에서 특권 명령 · do show ip route'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    if: [['ip', 'ip address IP 마스크 [secondary]'], ['shutdown', '포트 끄기 (켜기는 no shutdown)'], ['no', 'no shutdown · no ip address'], ['description', '설명(주석)'], ['bandwidth', '대역폭 (kbps)'], ['clock', 'clock rate 숫자 (bps, 시리얼만)'], ['encapsulation', 'frame-relay · ppp · hdlc (시리얼만)'], ['frame-relay', 'frame-relay interface-dlci 번호'], ['interface', '다른 인터페이스로'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    line: [['password', '비밀번호 정하기'], ['login', '접속할 때 비밀번호 묻기'], ['exec-timeout', '자동 종료 · 분 초'], ['transport', 'transport input ssh/telnet/all'], ['no', 'no login 등'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
    dhcp: [['network', 'network 네트워크 마스크'], ['default-router', '기본 게이트웨이'], ['dns-server', 'DNS 서버'], ['lease', '임대 기간(일)'], ['exit', '한 칸 뒤로'], ['end', '특권 모드(#)로']],
  };
  const WORDS = {};
  for (const [m, list] of Object.entries(HELP)) WORDS[m] = [...new Set(list.map(x => x[0]).concat(m === 'user' || m === 'priv' ? ['logout'] : []).concat(m === 'priv' ? ['enable'] : []))];

  function out(text, cls) { String(text).split('\n').forEach(l => RS.out.push([l, cls || ''])); if (RS.out.length > 400) RS.out.splice(0, RS.out.length - 400); }
  function bad(raw, i, msg) {
    if (i >= 0) {
      const tk = raw.trim().split(/\s+/);
      let pos = raw.indexOf(raw.trim());
      for (let k = 0; k < i && k < tk.length; k++) pos = raw.indexOf(tk[k], pos) + tk[k].length;
      if (tk[i] !== undefined) pos = raw.indexOf(tk[i], pos);
      out(' '.repeat(prompt(RS.st).length + Math.max(0, pos)) + '^', 'e');
    }
    out("% Invalid input detected at '^' marker.", 'e');
    if (msg) out('  ↳ ' + msg, 'h');
  }
  const incomplete = msg => { out('% Incomplete command.', 'e'); if (msg) out('  ↳ ' + msg, 'h'); };
  const amb = (tok, msg) => {
    out(`% Ambiguous command:  "${tok}"`, 'e');
    const words = WORDS[RS.st.mode] || [];
    const c = words.filter(w => w.startsWith(String(tok).toLowerCase()));
    out('  ↳ ' + (c.length > 1 && RS.st.mode && !msg ? `"${tok}"로 시작하는 명령이 여러 개예요: ${c.join(', ')}. 조금 더 쳐 보세요.` : (msg || '조금 더 길게 쳐 보세요.')), 'h');
  };

  function parseIf(tk) {
    const s = tk.join('');
    const m = s.match(/^([a-z-]+)(\d+\/\d+)$/i);
    if (!m) return null;
    const ty = pick(m[1], ['fastethernet', 'serial']);
    if (!ty || ty === '?amb') return null;
    const name = (ty === 'fastethernet' ? 'FastEthernet' : 'Serial') + m[2];
    return RS.st.ifs[name] ? name : '';
  }

  function rsExec(raw) {
    const st = RS.st;
    const p = prompt(st);
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
    out(p + raw, 'c');
    const line = raw.trim();
    if (!line) return;
    RS.hist.push(raw); if (RS.hist.length > 60) RS.hist.shift(); RS.hpos = -1;
    if (line.endsWith('?')) { rsHelp(line.slice(0, -1)); return; }
    const tk = line.split(/\s+/);
    runMode(st.mode, tk, raw, true);
  }
  function runMode(mode, tk, raw, top) {
    const st = RS.st;
    switch (mode) {
      case 'user': return cmdUser(tk, raw);
      case 'priv': return cmdPriv(tk, raw);
      case 'config': return cmdConfig(tk, raw);
      case 'if': return cmdSub(tk, raw, cmdIf);
      case 'line': return cmdSub(tk, raw, cmdLine);
      case 'dhcp': return cmdSub(tk, raw, cmdDhcp);
    }
    return top && st;
  }
  // 하위 모드에서 모르는 명령은 전역 설정 명령으로 실행합니다(IOS와 같음).
  function cmdSub(tk, raw, fn) {
    const st = RS.st;
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
    const hint = st.mode === 'if' ? '인터페이스 모드에서 쓸 수 있는 명령은 ? 로 확인하세요.' : st.mode === 'line' ? '라인 모드 명령: password, login, exec-timeout, transport input' : 'DHCP 모드 명령: network, default-router, dns-server';
    bad(raw, 0, configHint(tk) || hint);
  }
  function configHint(tk) {
    const w0 = (tk[0] || '').toLowerCase();
    if (/^(en|ena|enab|enabl|enable)$/.test(w0) && RS.st.mode !== 'user') return '이미 특권 모드 이상이에요.';
    if (/^(conf|confi|config|configu|configur|configure)$/.test(w0)) return 'configure terminal은 특권 모드(#)에서 칩니다. end로 나가세요.';
    if (/^(cop|copy)$/.test(w0) || /^(sh|sho|show)$/.test(w0) || /^(wr|wri|writ|write)$/.test(w0)) return '이 명령은 특권 모드(#)에서 쳐요. end로 나가거나 앞에 do를 붙이세요 (예: do show ip route).';
    if (/^(no)$/.test(w0) && /^shut/.test((tk[1] || '').toLowerCase())) return 'no shutdown은 인터페이스 모드에서 칩니다. 먼저 interface ...';
    if (/^(ip)$/.test(w0) && /^add/.test((tk[1] || '').toLowerCase())) return 'ip address는 인터페이스 모드에서 칩니다. 먼저 interface fastethernet 0/0 처럼 들어가세요.';
    if (/^(cl|clo|cloc|clock|ba|ban|band|bandw|bandwi|bandwid|bandwidt|bandwidth|desc|descr|descri|descrip|descript|descripti|descriptio|description|encap|encaps|encapsu|encapsul|encapsula|encapsulat|encapsulati|encapsulatio|encapsulation)$/.test(w0)) return '인터페이스 명령이에요. 먼저 interface serial 2/0 처럼 들어가세요.';
    if (/^(pass|passw|passwo|passwor|password|login|exec|exec-|exec-t|exec-ti|exec-tim|exec-time|exec-timeo|exec-timeou|exec-timeout|tran|trans|transp|transpo|transpor|transport)$/.test(w0)) return '라인 명령이에요. 먼저 line vty 0 4 또는 line console 0.';
    return '';
  }
  function cmdUser(tk, raw) {
    const st = RS.st;
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
    const st = RS.st;
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
    const st = RS.st;
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
          if (pick(tk[2], ['pool', 'excluded-address']) !== 'pool') { bad(raw, 2, 'ip dhcp pool 이름'); return false; }
          if (!tk[3]) { incomplete('ip dhcp pool 이름'); return false; }
          st.pools[tk[3]] = st.pools[tk[3]] || { net: '', mask: '', gw: '', dns: '' };
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
        bad(raw, 1, configHint(tk.slice(0)) || ''); return false;
      }
    }
    bad(raw, 0, configHint(tk) || '설정 모드 명령은 ? 로 확인하세요.');
    return false;
  }
  function cmdIf(tk, raw) {
    const st = RS.st, I = st.ifs[st.cur];
    const w = pick(tk[0], WORDS.if);
    if (w === '?amb') { amb(tk[0]); return; }
    switch (w) {
      case 'exit': st.mode = 'config'; st.cur = null; return;
      case 'end': st.mode = 'priv'; st.cur = null; return;
      case 'interface': { const before = st.cur; st.mode = 'config'; if (cmdConfig(tk, raw) === false) { st.mode = 'if'; st.cur = before; } return; }
      case 'shutdown': I.shut = true; return;
      case 'ip': {
        const g = pick(tk[1], ['route', 'default-gateway', 'default-network', 'dhcp']);
        if (g && g !== '?amb') return 'pass';
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
        if (!(n >= 16 && n <= 1007)) { tk[2] ? bad(raw, 2, 'DLCI는 16~1007') : incomplete(); return; }
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
    const st = RS.st, L = st.lines[st.line];
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
    const st = RS.st, P = st.pools[st.pool];
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
      case 'lease': if (!/^\d+$/.test(tk[1] || '')) { tk[1] ? bad(raw, 1) : incomplete(); return; } P.lease = +tk[1]; return;
    }
    return 'pass';
  }
  function doSave(direct) {
    const st = RS.st;
    if (!direct) out('Building configuration...');
    st.saved = snap(st);
    out('[OK]', 'ok');
    rsCheck(true);
  }
  function rsHelp(prefix) {
    const st = RS.st;
    const p = prefix.trim();
    const list = HELP[st.mode];
    const t0 = p.split(/\s+/);
    if (p && (pick(t0[0], ['show']) === 'show' || (pick(t0[0], ['do']) === 'do' && pick(t0[1], ['show']) === 'show'))) {
      out('show 다음에 올 수 있는 것:', 'h');
      [['running-config', '지금 설정 전체'], ['startup-config', '저장된 설정'], ['ip route', '라우팅 테이블'], ['ip interface brief', '인터페이스 요약'], ['interfaces', '인터페이스 자세히'], ['flash', '플래시 메모리'], ['users', '접속 사용자'], ['processes', '프로세스'], ['hosts', '호스트 표'], ['version', '버전']].forEach(([w, d]) => out(`  ${w.padEnd(20)} ${d}`, 'h'));
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
  // ───────── show 출력 (연습용 간단 화면) ─────────
  function doShow(tk, raw, base) {
    const st = RS.st;
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
    else if (w === 'history') out(RS.hist.slice(-10).map(h => '  ' + h).join('\n'));
    else if (w === 'clock') out('*09:20:00.000 KST Sun Dec 6 2026');
    st.shows.push(key);
  }
  function configText(c, saved) {
    const L = [];
    L.push('Building configuration...', '', `Current configuration : ${600 + JSON.stringify(c).length % 400} bytes`, '!', 'version 12.4', 'no service password-encryption', '!', `hostname ${c.host}`, '!');
    if (c.enSecret) L.push('enable secret 5 (암호화된 값)');
    if (c.enPass) L.push(`enable password ${c.enPass}`);
    for (const [n, p] of Object.entries(c.pools)) { L.push('!', `ip dhcp pool ${n}`); if (p.net) L.push(` network ${p.net} ${p.mask}`); if (p.gw) L.push(` default-router ${p.gw}`); if (p.dns) L.push(` dns-server ${p.dns}`); }
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
      .concat(Object.entries(c.ifs).map(([n, I]) => pad(n, 23) + pad(I.ip || 'unassigned', 16) + pad(I.ip ? 'YES' : 'YES', 4) + pad(I.ip ? 'manual' : 'unset', 7) + (I.shut ? pad('administratively down', 22) + 'down' : pad('up', 22) + 'up'))).join('\n');
  }
  function ifText(c, n) {
    const I = c.ifs[n];
    return `${n} is ${I.shut ? 'administratively down' : 'up'}, line protocol is ${I.shut ? 'down' : 'up'}\n  Hardware is ${I.serial ? 'PowerQUICC Serial' : 'Fast Ethernet'}${I.desc ? `\n  Description: ${I.desc}` : ''}\n  ${I.ip ? `Internet address is ${I.ip}/${prefixOf(I.mask)}` : 'Internet address is not set'}\n  MTU 1500 bytes, BW ${I.bw} Kbit/sec, DLY ${I.serial ? 20000 : 100} usec\n  Encapsulation ${I.serial ? I.encap.toUpperCase() : 'ARPA'}${I.serial && I.clock ? `\n  DCE, clock rate ${I.clock}` : ''}`;
  }
  function routeText(c) {
    const L = ['Codes: C - connected, S - static, R - RIP, O - OSPF, D - EIGRP', '       * - candidate default', '', c.gw && !c.routes.length ? 'Gateway of last resort is not set (ip default-gateway는 라우팅을 끈 장비용)' : 'Gateway of last resort is not set', ''];
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
  // ───────── 미션 채점 ─────────
  function rsCheck(auto) {
    const st = RS.st, m = D.MISSIONS.find(x => x.id === RS.mission);
    if (!m) return;
    if (!st.saved) { if (!auto) out('▶ 채점: 아직 저장하지 않았어요. 특권 모드(#)에서 copy r s → Enter.', 'h'); return; }
    let ok = false;
    try { ok = !!m.k(st.saved); } catch (e) { ok = false; }
    if (ok) {
      const first = mark('r:' + m.id) !== 1;
      if (first) setMark('r:' + m.id, 1);
      out(`★ 미션 성공! (${m.id.slice(1) * 1}번) 저장된 설정에서 정답을 확인했어요.`, 'ok');
    } else out('▶ 채점: 저장은 했지만 아직 정답이 아니에요. show running-config로 확인하고 다시 저장해 보세요. 막히면 [힌트].', 'e');
  }
  function rsStart(id) {
    RS.mission = id; RS.st = rsFresh(); RS.out = []; RS.hint = 0;
    const i = D.MISSIONS.findIndex(x => x.id === id);
    out(`── 미션 ${i + 1}/${D.MISSIONS.length} ──`, 'h');
    out(D.MISSIONS[i].t, 'h');
    out('새 라우터로 시작합니다. ? 를 치면 쓸 수 있는 명령이 나와요.', 'h');
    out('');
  }
  function paintRouter(el) {
    if (!RS.st) rsStart(RS.mission);
    const m = D.MISSIONS.find(x => x.id === RS.mission);
    const idx = D.MISSIONS.indexOf(m);
    const doneN = D.MISSIONS.filter(x => mark('r:' + x.id) === 1).length;
    el.innerHTML = `<div class="sg-router">
      <div class="sg-mlist" role="list">${D.MISSIONS.map((x, i) => `<button class="sg-mchip ${x.id === RS.mission ? 'on' : ''} ${mark('r:' + x.id) === 1 ? 'ok' : ''}" data-sg="rs-mission" data-v="${x.id}" title="${esc(x.t)}">${mark('r:' + x.id) === 1 ? '✓' : i + 1}</button>`).join('')}</div>
      <div class="sg-mbox"><small>미션 ${idx + 1}/${D.MISSIONS.length} · 성공 ${doneN}개${mark('r:' + m.id) === 1 ? ' · <b style="color:var(--ok-ink)">이 미션 성공</b>' : ''}</small><p>${esc(m.t)}</p>
        ${RS.hint >= 1 ? `<div class="sg-hint"><b>힌트</b> ${esc(missionHint(m.id))}</div>` : ''}
        ${RS.hint >= 2 ? `<pre class="sg-ans-cmd">${esc(D.MISSION_CMDS[m.id].join('\n'))}</pre>` : ''}
      </div>
      <div class="term" data-sg-term>
        <div class="term-out" aria-live="polite">${RS.out.map(([l, c]) => `<div class="${c}">${esc(l) || '&nbsp;'}</div>`).join('')}</div>
        <form class="term-in" data-sg-form="rs"><span class="pr">${esc(RS.st.wait === 'copy' ? 'Destination filename [startup-config]?' : prompt(RS.st))}</span><input aria-label="라우터 명령 입력" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="${RS.st.wait === 'copy' ? 'Enter (빈칸으로 확인)' : '명령 입력 후 Enter'}"></form>
      </div>
      <div class="term-keys">${['?', 'en', 'conf t', 'int fa0/0', 'int s2/0', 'line vty 0 4', 'line con 0', 'no shutdown', 'exit', 'end', 'copy r s'].map(k => `<button data-sg="rs-key" data-v="${esc(k)}">${esc(k)}</button>`).join('')}<button data-sg="rs-enter" class="enter">⏎ Enter</button></div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-sm btn-outline" data-sg="rs-check">채점</button>
        <button class="btn btn-sm btn-ghost" data-sg="rs-hint">${RS.hint === 0 ? '힌트' : RS.hint === 1 ? '정답 명령 보기' : '힌트 닫기'}</button>
        <button class="btn btn-sm btn-ghost" data-sg="rs-run">show running-config</button>
        <button class="btn btn-sm btn-ghost" data-sg="rs-reset">장비 초기화</button>
        ${idx < D.MISSIONS.length - 1 ? `<button class="btn btn-sm btn-primary" data-sg="rs-mission" data-v="${D.MISSIONS[idx + 1].id}" style="margin-left:auto">다음 미션 →</button>` : ''}
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:8px">연습창은 명령 순서를 익히는 간단한 흉내입니다. 출력 화면은 실제 장비·ICQA Router Emulator와 다를 수 있어요.</p>
    </div>`;
    const o = $('.term-out', el); o.scrollTop = o.scrollHeight;
    const inp = $('.term-in input', el);
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (!RS.hist.length) return; RS.hpos = RS.hpos < 0 ? RS.hist.length - 1 : Math.max(0, RS.hpos - 1); inp.value = RS.hist[RS.hpos]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (RS.hpos < 0) return; RS.hpos++; if (RS.hpos >= RS.hist.length) { RS.hpos = -1; inp.value = ''; } else inp.value = RS.hist[RS.hpos]; }
      else if (e.key === 'Tab') { e.preventDefault(); inp.value = tabComplete(inp.value); }
    });
  }
  function tabComplete(v) {
    const tk = v.split(' '); const last = tk[tk.length - 1];
    if (!last) return v;
    const words = tk.length === 1 ? WORDS[RS.st.mode] : ['terminal', 'running-config', 'startup-config', 'fastethernet', 'serial', 'address', 'secondary', 'console', 'vty', 'route', 'default-gateway', 'default-network', 'dhcp', 'pool', 'rate', 'memory', 'interfaces', 'flash:', 'users', 'processes', 'hosts', 'version', 'frame-relay', 'community', 'input', 'ssh', 'shutdown', 'login', 'password', 'brief'];
    const c = words.filter(w => w.startsWith(last.toLowerCase()));
    if (c.length === 1) tk[tk.length - 1] = c[0] + ' ';
    return tk.join(' ');
  }
  function missionHint(id) {
    const c = D.MISSION_CMDS[id] || [];
    const steps = c.filter(x => !/^(en|end|copy r s|\(Enter\)|conf t)$/.test(x));
    return `en → conf t → ${steps.map(s => s.replace(/\d+\.\d+\.\d+\.\d+/g, '…').replace(/ (ICQA|icqa|route5|network2|2048|72000|3 50)$/, ' …')).join(' → ')} → end → copy r s → Enter`;
  }
  function paintRouterAll() { $$('[data-sg-widget="router"]').forEach(paintRouter); const i = $('[data-sg-term] input'); if (i) i.focus({ preventScroll: true }); }

  // 라우터 기출 유형 카드 (명령을 연습창 엔진으로 돌려 프롬프트까지 보여 줍니다)
  function rtypesHTML() {
    const save = { st: RS.st, out: RS.out, hist: RS.hist };
    const groups = {};
    D.RTYPES.forEach(r => (groups[r.g] = groups[r.g] || []).push(r));
    let html = '';
    for (const [g, list] of Object.entries(groups)) {
      html += `<h3>${esc(g)}</h3><div class="sg-rtypes">`;
      for (const r of list) {
        RS.st = rsFresh(); RS.out = []; RS.hist = [];
        const lines = [];
        for (const c of r.c) {
          const isShow = /^show /.test(c);
          if (isShow && r.c.filter(x => /^show /.test(x)).length > 1 && RS.st.mode !== 'priv') RS.st.mode = 'priv';
          lines.push(prompt(RS.st) + c);
          rsExec(c);
          if (RS.st.wait === 'copy') { lines.push('Destination filename [startup-config]?  ← Enter'); RS.st.wait = null; }
        }
        html += `<div class="sg-rtype card"><b>${esc(r.t)}</b><pre>${esc(lines.join('\n'))}</pre><p class="muted">${esc(r.n)}</p></div>`;
      }
      html += '</div>';
    }
    RS.st = save.st; RS.out = save.out; RS.hist = save.hist;
    return html;
  }

  // ═════════════ BIOS 연습 화면 ═════════════
  const BS = { menu: null, vals: null, saved: null, pw: { su: '', us: '' }, savedPw: null, dlg: null, task: 'b01', hint: false, msg: '' };
  const allItems = () => D.BIOS.menus.flatMap(m => m.items || []);
  const defaults = () => Object.fromEntries(allItems().filter(i => i.opts).map(i => [i.id, i.def]));
  function biosInit() { if (!BS.vals) { BS.vals = defaults(); BS.saved = null; BS.pw = { su: '', us: '' }; BS.savedPw = null; } }
  function biosNamed(vals, pw) { const o = {}; allItems().filter(i => i.opts).forEach(i => { o[i.id] = i.opts[vals[i.id]]; }); o.supw = pw.su; o.uspw = pw.us; return o; }
  function paintBios(el) {
    biosInit();
    const t = D.BIOS.tasks.find(x => x.id === BS.task);
    const tIdx = D.BIOS.tasks.indexOf(t);
    const doneN = D.BIOS.tasks.filter(x => mark('b:' + x.id) === 1).length;
    let screen = '';
    if (!BS.menu) {
      const ms = D.BIOS.menus;
      const half = Math.ceil(ms.length / 2);
      const col = list => list.map(m => `<button class="bm" data-sg="bs-open" data-v="${m.id}">${m.act ? '' : '▶ '}${esc(m.name)}</button>`).join('');
      screen = `<div class="bios-cols"><div>${col(ms.slice(0, half))}</div><div>${col(ms.slice(half))}</div></div>`;
    } else {
      const m = D.BIOS.menus.find(x => x.id === BS.menu);
      screen = `<div class="bios-sub"><div class="bios-h">${esc(m.name)}</div>${m.items.map(i => i.ro
        ? `<div class="bi ro"><span>${esc(i.name)}</span><span class="v">${esc(i.ro)}</span></div>`
        : `<button class="bi" data-sg="bs-item" data-v="${i.id}"><span>${esc(i.name)}</span><span class="v">[${esc(i.opts[BS.vals[i.id]])}]</span></button>`).join('')}
        <button class="bm back" data-sg="bs-back">◀ Esc: 메인 메뉴로</button></div>`;
    }
    let dlg = '';
    if (BS.dlg) {
      const d = BS.dlg;
      if (d.type === 'opts') { const it = allItems().find(i => i.id === d.id); dlg = `<div class="bios-dlg"><div class="bios-h">${esc(it.name)}</div>${it.opts.map((o, k) => `<button class="bm ${BS.vals[it.id] === k ? 'cur' : ''}" data-sg="bs-set" data-v="${it.id}" data-i="${k}">${esc(o)}</button>`).join('')}<button class="bm back" data-sg="bs-close">취소</button></div>`; }
      else if (d.type === 'yn') dlg = `<div class="bios-dlg"><div class="bios-h">${esc(d.q)}</div><div class="row" style="justify-content:center"><button class="bm yn" data-sg="bs-yes">Y (예)</button><button class="bm yn" data-sg="bs-close">N (아니요)</button></div></div>`;
      else if (d.type === 'pw') dlg = `<div class="bios-dlg"><div class="bios-h">${d.which === 'su' ? 'Set Supervisor Password' : 'Set User Password'}</div><form data-sg-form="bs-pw"><label>Enter Password: <input type="password" id="bs-pw1" autocomplete="off" maxlength="8"></label><label>Confirm Password: <input type="password" id="bs-pw2" autocomplete="off" maxlength="8"></label><div class="row" style="justify-content:center;margin-top:8px"><button class="bm yn">확인</button><button type="button" class="bm yn" data-sg="bs-close">취소</button></div></form></div>`;
    }
    el.innerHTML = `<div class="sg-biosw">
      <div class="sg-mlist">${D.BIOS.tasks.map((x, i) => `<button class="sg-mchip ${x.id === BS.task ? 'on' : ''} ${mark('b:' + x.id) === 1 ? 'ok' : ''}" data-sg="bs-task" data-v="${x.id}" title="${esc(x.t)}">${mark('b:' + x.id) === 1 ? '✓' : i + 1}</button>`).join('')}</div>
      <div class="sg-mbox"><small>미션 ${tIdx + 1}/${D.BIOS.tasks.length} · 성공 ${doneN}개${mark('b:' + t.id) === 1 ? ' · <b style="color:var(--ok-ink)">이 미션 성공</b>' : ''}</small><p>${esc(t.t)}</p>${BS.hint ? `<div class="sg-hint"><b>정답 순서</b> ${esc(D.BIOS.hints[t.id])}</div>` : ''}${BS.msg ? `<div class="sg-hint ${BS.msg.startsWith('★') ? 'good' : ''}">${esc(BS.msg)}</div>` : ''}</div>
      <div class="bios">
        <div class="bios-top">CMOS Setup Utility <small>(연습용 화면)</small></div>
        ${screen}
        ${dlg}
        <div class="bios-foot"><span>↑↓→← : 선택</span><span>Enter : 들어가기</span><span>Esc : 뒤로</span><span>F10 : 저장 후 종료</span></div>
      </div>
      <div class="row" style="margin-top:10px"><button class="btn btn-sm btn-outline" data-sg="bs-f10">F10 저장 후 종료</button><button class="btn btn-sm btn-ghost" data-sg="bs-hint">${BS.hint ? '정답 닫기' : '정답 순서 보기'}</button><button class="btn btn-sm btn-ghost" data-sg="bs-reset">처음 상태로</button>${tIdx < D.BIOS.tasks.length - 1 ? `<button class="btn btn-sm btn-primary" data-sg="bs-task" data-v="${D.BIOS.tasks[tIdx + 1].id}" style="margin-left:auto">다음 미션 →</button>` : ''}</div>
      <p class="muted" style="font-size:12.5px;margin-top:8px">Award BIOS 메뉴 이름을 본뜬 연습 화면입니다. 시험 에뮬레이터의 메뉴 이름·위치는 다를 수 있어요.</p>
    </div>`;
    const p1 = $('#bs-pw1', el); if (p1) p1.focus();
  }
  function paintBiosAll() { $$('[data-sg-widget="bios"]').forEach(paintBios); }
  function biosSave() {
    BS.saved = Object.assign({}, BS.vals); BS.savedPw = Object.assign({}, BS.pw);
    const t = D.BIOS.tasks.find(x => x.id === BS.task);
    const ok = t.k(biosNamed(BS.saved, BS.savedPw));
    if (ok) { if (mark('b:' + t.id) !== 1) setMark('b:' + t.id, 1); BS.msg = '★ 저장 완료 · 미션 성공!'; }
    else BS.msg = '저장했지만 아직 정답이 아니에요. 메뉴를 다시 확인해 보세요.';
    BS.menu = null;
  }

  // ═════════════ 이벤트 ═════════════
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-sg]');
    if (!el || !el.closest('#app')) return;
    const act = el.dataset.sg, v = el.dataset.v;
    switch (act) {
      case 'switch': if (A().switchTrack) { A().switchTrack(v); A().go('/silgi'); } return;
      // 실전 문제
      case 'dr-cat': DR.cat = v; rerender(); return;
      case 'dr-mode': DR.mode = v; rerender(); return;
      case 'dr-start': { const pool = shuffle(drillPool()); const ids = (v === 'all' ? pool : pool.slice(0, 20)).map(q => q.id); if (!ids.length) return; DR.run = { tr: track(), ids, idx: 0, ans: {}, res: {}, pick: null }; rerender(() => window.scrollTo(0, 0)); return; }
      case 'dr-pick': answerDrill(+el.dataset.i); return;
      case 'dr-toggle': { const R = DR.run; const i = +el.dataset.i; R.pick = R.pick || []; R.pick = R.pick.includes(i) ? R.pick.filter(x => x !== i) : R.pick.concat(i); rerender(); return; }
      case 'dr-multi': answerDrill((DR.run.pick || []).slice()); return;
      case 'dr-next': DR.run.idx++; rerender(() => window.scrollTo(0, 0)); return;
      case 'dr-retry': { const R = DR.run; const ids = shuffle(R.ids.filter(id => !R.res[id])); DR.run = { tr: track(), ids, idx: 0, ans: {}, res: {}, pick: null }; rerender(() => window.scrollTo(0, 0)); return; }
      case 'dr-quit': DR.run = null; rerender(); return;
      // 체크
      case 'check': { const on = mark('c:' + v) === 1; setMark('c:' + v, on ? 2 : 1); $$('[data-sg-widget="check"]').forEach(paintCheck); return; }
      // 색 연습
      case 'ct-std': CT.std = v; CT.seq = []; CT.miss = 0; CT.deck = shuffle(Object.keys(WIRE)); $$('[data-sg-widget="colors"]').forEach(paintColors); return;
      case 'ct-pick': ctPick(v); return;
      case 'ct-reset': CT.seq = []; CT.miss = 0; CT.flash = ''; CT.deck = shuffle(Object.keys(WIRE)); $$('[data-sg-widget="colors"]').forEach(paintColors); return;
      // 짝 맞추기
      case 'mt-pick': mtPick(el.dataset.set, el.dataset.side, +el.dataset.i); return;
      case 'mt-new': newMatch(el.dataset.set); $$(`[data-sg-widget="match"][data-set="${el.dataset.set}"]`).forEach(paintMatch); return;
      // 라우터
      case 'rs-mission': rsStart(v); $$('[data-sg-widget="router"]').forEach(paintRouter); { const box = $('.sg-router'); if (box) box.scrollIntoView({ block: 'start', behavior: 'smooth' }); } return;
      case 'rs-key': { const i = $('[data-sg-term] input'); if (!i) return; if (v === '?') { rsExec(i.value + '?'); i.value = ''; paintRouterAll(); return; } i.value = (i.value && !/\s$/.test(i.value) ? i.value + ' ' : i.value) + v; i.focus(); return; }
      case 'rs-enter': { const i = $('[data-sg-term] input'); if (!i) return; rsExec(i.value); paintRouterAll(); return; }
      case 'rs-check': rsCheck(false); paintRouterAll(); return;
      case 'rs-hint': RS.hint = (RS.hint + 1) % 3; $$('[data-sg-widget="router"]').forEach(paintRouter); return;
      case 'rs-run': { const m = RS.st.mode; out(prompt(RS.st) + 'show running-config (버튼)', 'c'); const s = RS.st.shows.length; out(configText(RS.st, false)); RS.st.shows.length = s; RS.st.mode = m; paintRouterAll(); return; }
      case 'rs-reset': rsStart(RS.mission); paintRouterAll(); return;
      // BIOS
      case 'bs-task': BS.task = v; BS.hint = false; BS.msg = ''; BS.vals = null; BS.menu = null; BS.dlg = null; paintBiosAll(); return;
      case 'bs-open': {
        const m = D.BIOS.menus.find(x => x.id === v); BS.msg = '';
        if (!m.act) { BS.menu = v; paintBiosAll(); return; }
        if (m.act === 'defaults') BS.dlg = { type: 'yn', q: `${m.name} (Y/N)?`, then: 'defaults' };
        else if (m.act === 'save') BS.dlg = { type: 'yn', q: 'SAVE to CMOS and EXIT (Y/N)?', then: 'save' };
        else if (m.act === 'quit') BS.dlg = { type: 'yn', q: 'Quit Without Saving (Y/N)?', then: 'quit' };
        else BS.dlg = { type: 'pw', which: m.act === 'supw' ? 'su' : 'us' };
        paintBiosAll(); return;
      }
      case 'bs-item': BS.dlg = { type: 'opts', id: v }; paintBiosAll(); return;
      case 'bs-set': BS.vals[v] = +el.dataset.i; BS.dlg = null; paintBiosAll(); return;
      case 'bs-close': BS.dlg = null; paintBiosAll(); return;
      case 'bs-back': BS.menu = null; BS.dlg = null; paintBiosAll(); return;
      case 'bs-f10': BS.dlg = { type: 'yn', q: 'SAVE to CMOS and EXIT (Y/N)?', then: 'save' }; paintBiosAll(); return;
      case 'bs-yes': {
        const then = BS.dlg && BS.dlg.then; BS.dlg = null;
        if (then === 'defaults') { BS.vals = defaults(); BS.msg = '기본값을 불러왔어요 (아직 저장 전).'; }
        else if (then === 'save') biosSave();
        else if (then === 'quit') { BS.vals = BS.saved ? Object.assign({}, BS.saved) : defaults(); BS.pw = BS.savedPw ? Object.assign({}, BS.savedPw) : { su: '', us: '' }; BS.menu = null; BS.msg = '저장하지 않고 나갔어요. 바꾼 값은 사라졌어요.'; }
        paintBiosAll(); return;
      }
      case 'bs-hint': BS.hint = !BS.hint; paintBiosAll(); return;
      case 'bs-reset': BS.vals = null; BS.menu = null; BS.dlg = null; BS.msg = ''; paintBiosAll(); return;
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-sg-form]');
    if (!f) return;
    e.preventDefault();
    const k = f.dataset.sgForm;
    if (k === 'rs') { const i = $('input', f); const v = i.value; i.value = ''; rsExec(v); paintRouterAll(); }
    else if (k === 'dr-answer') { const i = $('input', f); answerDrill(i.value); }
    else if (k === 'bs-pw') {
      const a = $('#bs-pw1').value, b = $('#bs-pw2').value;
      if (a !== b) { toast('두 암호가 달라요'); return; }
      BS.pw[BS.dlg.which] = a; BS.dlg = null; BS.msg = a ? '암호를 정했어요 (아직 저장 전).' : '암호를 지웠어요 (아직 저장 전).'; paintBiosAll();
    }
  });
  document.addEventListener('keydown', e => {
    if (!location.hash.startsWith('#/silgi')) return;
    if (e.target.matches('input, textarea, select')) return;
    const R = DR.run;
    if (R && R.idx < R.ids.length && /^[1-6]$/.test(e.key)) {
      const q = T().drill.find(x => x.id === R.ids[R.idx]);
      if (q && q.type === 'choice' && !Object.prototype.hasOwnProperty.call(R.ans, q.id) && +e.key <= q.o.length) { answerDrill(+e.key - 1); e.preventDefault(); }
    }
  });

  // 홈 화면 안내 카드
  function homeCard(pos) {
    const n = daysLeft();
    if (n < 0) return '';
    return `<a class="card sg-homecard${pos === 'top' ? ' top' : ''}" href="#/silgi"><span class="ic">🛠️</span><div><strong>필기 합격 다음 단계 · 실기 ${esc(D.EXAM.dateLabel)} <span class="badge warn">${ddayText()}</span></strong><span>케이블·${track() === 'pc' ? 'CMOS·콘솔·레지스트리' : '윈도우 서버·라우터 연습창'}·실전 문제를 실기 메뉴에 모았어요.</span></div><span class="go">→</span></a>`;
  }

  // 필기 시험일이 지나면 상단 D-day 칩을 실기 D-day로 바꿉니다.
  function chip() { const n = daysLeft(); if (n < 0) return null; return { text: `실기 ${ddayText()}`, sub: D.EXAM.dateLabel }; }

  window.SILGI = { view, mount, homeCard, chip, _rs: RS, _exec: rsExec, _fresh: () => { RS.st = rsFresh(); RS.out = []; }, _judge: judge };
})();
