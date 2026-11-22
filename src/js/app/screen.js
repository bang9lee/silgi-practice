/* AI 튜터의 "눈": 지금 화면을 글로 바꿔 [현재 화면]을 만듭니다.
 * 문제·<보기>·정답 키·학생이 반영한 값(채점기와 같은 계산)·열린 창과 입력값·라우터 출력·채점 결과·개념 글. */
(function (g) {
  'use strict';
  const clip = (s, n) => { s = String(s ?? ''); return s.length > n ? s.slice(0, n) + ' …(생략)' : s; };
  const oneLine = s => String(s ?? '').replace(/\s+/g, ' ').trim();
  const stripHTML = html => { const d = document.createElement('div'); d.innerHTML = html; d.querySelectorAll('script,style,svg').forEach(x => x.remove()); d.querySelectorAll('br,p,div,li,tr,h1,h2,h3,h4').forEach(x => x.append('\n')); return d.textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim(); };

  // ───────── 화면 요소 → 글 ─────────
  // 입력 칸은 [값], 체크는 [✓]/[ ], 라디오는 (●)/( ), 단추는 <글자>, 선택된 줄·트리는 ▶ 로 적습니다.
  function domText(root, limit) {
    const out = [];
    const visible = e => e.getClientRects().length > 0;
    (function walk(el) {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' '); if (t.trim()) out.push(t.trim()); continue; }
        if (n.nodeType !== 1) continue;
        const e = n, tag = e.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'svg' || tag === 'SVG' || tag === 'DATALIST') continue;
        if (!visible(e)) continue;
        if (e.classList.contains('w7-ctl') || e.classList.contains('w7-shield') || e.classList.contains('none')) continue;
        if (e.classList.contains('ip7')) { out.push(`[${e.value || '   .   .   .   '}]${e.classList.contains('dis') ? '(비활성)' : ''}`); continue; }
        if (tag === 'INPUT') {
          if (e.type === 'checkbox') out.push(e.checked ? '[✓]' : '[ ]');
          else if (e.type === 'radio') out.push(e.checked ? '(●)' : '( )');
          else out.push(`[${e.type === 'password' ? '●'.repeat(e.value.length) : e.value}]`);
          if (e.disabled) out.push('(비활성)');
          continue;
        }
        if (tag === 'SELECT') { const o = e.options[e.selectedIndex]; out.push(`[▾ ${o ? o.textContent : ''}]${e.disabled ? '(비활성)' : ''}`); continue; }
        if (tag === 'TEXTAREA') { out.push(`[${e.value}]`); continue; }
        if (tag === 'BUTTON') { out.push(`<${oneLine(e.textContent)}${e.disabled ? ' (비활성)' : ''}>`); continue; }
        const block = /^(DIV|P|TR|LI|UL|OL|TABLE|THEAD|TBODY|H\d|FIELDSET|LEGEND|SECTION|LABEL)$/.test(tag) && !(tag === 'LABEL' && e.closest('.row7'));
        if (block) out.push('\n');
        if (e.classList.contains('sel') || e.classList.contains('on') && e.parentElement && e.parentElement.classList.contains('tabs7-h')) out.push('▶');
        walk(e);
        if (tag === 'TD' || tag === 'TH') out.push('|');
        if (block) out.push('\n');
      }
    })(root);
    const txt = out.join(' ').replace(/ *\n[\n ]*/g, '\n').replace(/[ ]{2,}/g, ' ').replace(/\| *\n/g, '\n').trim();
    return clip(txt, limit);
  }

  // 가상 Windows 바탕: 위에 있는 창부터
  function windowsText(pane) {
    const desk = pane && pane.querySelector('.desk');
    if (!desk) return '';
    const wins = [...desk.querySelectorAll(':scope > .w7')].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
    const lines = [];
    if (!wins.length) { const re = desk.querySelector('.reopen'); lines.push(re ? '열린 창 없음 (주 창을 닫은 상태 — [다시 열기] 상자가 떠 있음)' : '열린 창 없음'); }
    wins.slice(0, 3).forEach((w, i) => {
      const t = oneLine((w.querySelector('.w7-title .t') || {}).textContent);
      lines.push(`${i === 0 ? '■ 맨 앞 창' : `■ 뒤 창 ${i}`}: "${t}"${w.querySelector(':scope > .w7-shield') ? ' (위에 대화상자가 떠 있어 잠김)' : ''}`);
      if (i < 2) lines.push(domText(w.querySelector('.w7-inner') || w, i === 0 ? 2600 : 900));
    });
    const menu = desk.querySelector('.cm7');
    if (menu) lines.push('■ 열린 오른쪽 클릭 메뉴: ' + [...menu.children].map(x => oneLine(x.textContent)).filter(Boolean).join(' / '));
    return lines.join('\n');
  }

  // ───────── 정답 키 · 학생 답 ─────────
  function answerKey(q, items) {
    switch (q.type) {
      case 'short': return '정답(인정 표기): ' + q.answer.accept.join(' 또는 ') + (q.cs ? ' (대소문자 구분)' : '');
      case 'choice': return `정답: ${q.answer.index + 1}번 ${q.options[q.answer.index]}`;
      case 'multi': return '정답(모두): ' + q.answer.indexes.map(i => `${i + 1}번 ${q.options[i]}`).join(' / ');
      case 'drag': return '정답 배치: ' + q.slots.map(s => `${s.label} → ${(q.items.find(i => i.id === [].concat(q.answer.slots[s.id])[0]) || {}).label}`).join(' / ');
      case 'cable-order': { const W = g.WIDGETS; return `정답: T568${q.answer.std} 순서 ` + W.ORDER[q.answer.std].map((k, i) => `${i + 1}:${W.WIRE[k].n}`).join(' '); }
      case 'router': return '정답 명령 순서: ' + (q.cmds || []).join(' → ');
      case 'sim': if (q.sim === 'console') return '정답 명령: ' + q.answer.accept.join(' 또는 ');
    }
    if (items && items.length) return '정답 값: ' + items.map(i => `${i.label} = ${i.expected}`).join(' / ');
    return '';
  }
  function studentNow(q, r) {
    if (!r) return '';
    const items = r.items || [];
    const L = [];
    switch (q.type) {
      case 'short': L.push(`입력한 답: ${r.given ? `"${r.given}"` : '(비어 있음)'}`); break;
      case 'choice': L.push(`고른 보기: ${r.given == null ? '(아직 안 고름)' : `${r.given + 1}번 ${q.options[r.given]}`}`); break;
      case 'multi': L.push(`고른 보기: ${r.given && r.given.length ? r.given.map(i => `${i + 1}번`).join(', ') : '(아직 안 고름)'}`); break;
      case 'sim': if (q.sim === 'console') L.push(`입력한 명령: ${r.given && r.given.length ? r.given.slice(-8).join(' ; ') : '(없음)'}`); break;
    }
    if (q.type === 'router' && r.saved === false) L.push('저장(copy r s) 안 함');
    if (q.type === 'bios' && r.saved === false) L.push('F10 저장 안 함');
    if (items.length) L.push('항목별 (✓ 맞음 / ✗ 다름) — 가상 화면은 [확인]/[적용]으로 반영된 값만:\n' + items.map(i => `${i.ok ? '✓' : '✗'} ${i.label}: 학생 = ${i.got} / 정답 = ${i.expected}`).join('\n'));
    return L.join('\n');
  }
  function studentNowNoAnswer(q, r) { // 모의고사용: 정답 없이 학생 값만
    if (!r || !r.items || !r.items.length) return '';
    return r.items.map(i => `${i.label}: ${i.got}`).join('\n');
  }
  function routerText(pane) {
    const t = pane && pane.querySelector('.term-out');
    if (!t) return '';
    const lines = t.innerText.split('\n').filter(l => l.trim());
    const pr = pane.querySelector('.term-in .pr');
    return lines.slice(-28).join('\n') + (pr ? `\n${pr.textContent}█ (지금 프롬프트)` : '');
  }
  function biosText(pane) { const b = pane && pane.querySelector('.bios'); return b ? clip(b.innerText.replace(/\n{2,}/g, '\n'), 1800) : ''; }

  // ───────── [현재 화면] 만들기 ─────────
  function build(ctx) {
    const A = g.APP;
    const P = [];
    P.push(`[현재 화면] (학생은 이걸 직접 보고 있음 · 자동으로 붙는 정보)`);
    P.push(`시험: ${ctx.examName} · 페이지: ${ctx.page}`);
    const q = ctx.q;
    if (q) {
      P.push(`\n## 문제${ctx.pos ? ` (${ctx.pos})` : ''} · 유형: ${A.catName(q.cat)} / ${g.QT.TYPE_NAME[q.type] || q.type} · [${q.label}]`);
      P.push(oneLine(q.question));
      if (q.box) P.push('<보기>\n' + String(q.box).trim());
      if (q.options && q.type !== 'short') P.push('보기 목록: ' + q.options.map((o, i) => `${i + 1}) ${o}`).join(' / '));
      if (q.slots && q.items) P.push('끌어 놓을 칸: ' + q.slots.map(s => s.label).join(' / ') + '\n보기 카드: ' + q.items.map(i => i.label).join(' / '));
      if (q.note) P.push('참고: ' + q.note);
      let r = null;
      try { r = ctx.H && ctx.H.grade ? ctx.H.grade() : null; } catch (e) { r = null; }
      if (ctx.mock) {
        P.push('\n## 상태: 모의고사 진행 중 (정답·힌트 금지)');
        const s = studentNowNoAnswer(q, r); if (s) P.push('학생이 지금까지 넣은 값:\n' + s);
      } else {
        P.push(`\n## 상태: ${ctx.graded ? (ctx.ok ? '채점 끝 — 정답' : '채점 끝 — 오답') : '아직 채점 전'}`);
        const key = answerKey(q, r && r.items);
        if (key) P.push(key + (ctx.graded ? '' : '  ← 채점 전이므로 학생이 원할 때만 공개'));
        const s = studentNow(q, ctx.graded && ctx.result ? ctx.result : r); if (s) P.push('학생의 현재 답/설정:\n' + s);
        if (q.explain) P.push('해설(프로그램에 적힌 것): ' + clip(q.explain, 1400));
        if (q.why) P.push('칸별 틀리기 쉬운 이유: ' + Object.entries(q.why).map(([k, v]) => `${k}: ${v}`).join(' / '));
      }
      if (q.type === 'sim' && q.sim !== 'console') { const w = windowsText(ctx.pane); if (w) P.push('\n## 가상 Windows 화면 (지금 보이는 그대로)\n' + w); }
      if (q.type === 'sim' && q.sim === 'console') { const c = ctx.pane && ctx.pane.querySelector('.cmd7'); if (c) P.push('\n## 명령 프롬프트 화면 (최근)\n' + c.innerText.split('\n').filter(l => l.trim()).slice(-20).join('\n')); }
      if (q.type === 'router') { const t = routerText(ctx.pane); if (t) P.push('\n## 라우터 터미널 (최근 출력)\n' + t); }
      if (q.type === 'bios') { const t = biosText(ctx.pane); if (t) P.push('\n## CMOS Setup 화면\n' + t); }
    } else if (ctx.concept) {
      P.push(`\n## 개념 글: ${ctx.concept.title}\n` + clip(stripHTML(ctx.concept.html), 5000));
    } else if (ctx.mockResult) {
      P.push('\n## 모의고사 결과\n' + ctx.mockResult);
    }
    if (ctx.weak) P.push('\n## 학생 기록\n' + ctx.weak);
    return P.join('\n');
  }

  // ───────── [참고 자료]: 지금 문제 유형의 개념 정리 + 질문으로 찾은 개념·문제 해설 ─────────
  // 화면 보기를 꺼도 붙입니다(프로그램에 들어 있는 검증된 자료라서).
  // 목록으로: [{title, text, kind}] — 기다리는 동안 채팅창에 바로 보여 주는 데도 씁니다.
  function refItems(ctx, ask) {
    const A = g.APP || {};
    const C = A.CONCEPTS || {};
    const q = ctx.q;
    const cid = q ? (q.conceptRef || q.cat) : ctx.conceptId || null;
    const out = [];
    if (A.kb && ask) {
      const query = [ask, q ? `${A.catName(q.cat)} ${q.question}` : '', ctx.concept ? ctx.concept.title : ''].join(' ');
      A.kb.search(query, { exam: ctx.exam, k: 4, maxChars: 2600, exclude: q ? [q.id] : [], excludeCid: cid })
        .forEach(r => out.push({ title: r.title, text: r.text, kind: r.kind }));
    }
    if (q && C[cid]) out.push({ title: `개념 정리 · ${C[cid].title}`, text: clip(g.KB.strip(C[cid].html), 2200), kind: 'concept-type' });
    // 지금 문제 유형의 원리 카드(왜 그런지·문장 단서·변형 대처) — 이해 중심 설명의 뼈대
    const card = q && g.QT && g.QT.principleFor ? g.QT.principleFor(q) : null;
    if (card) {
      const t = `원리 카드 · ${card.title}`;
      const text = [card.idea, ...(card.why || []).map(x => '· ' + x), (card.clues || []).length ? '문제 문장 읽는 법: ' + card.clues.join(' / ') : '', (card.variants || []).length ? '이렇게 바뀌어 나와도: ' + card.variants.join(' / ') : ''].filter(Boolean).join('\n').replace(/\*\*([^*]+)\*\*/g, '$1');
      for (let i = out.length - 1; i >= 0; i--) if (out[i].title === t) out.splice(i, 1);
      out.push({ title: t, text, kind: 'principle-type' });
    }
    return out;
  }
  function refs(ctx, ask, items) {
    const list = items || refItems(ctx, ask);
    // 지금 문제 유형의 원리 카드 → 개념 정리 → 검색 결과 순서
    const rank = x => (x.kind === 'principle-type' ? 0 : x.kind === 'concept-type' ? 1 : 2);
    const ordered = list.slice().sort((a, b) => rank(a) - rank(b));
    return ordered.length ? '[참고 자료] (이 프로그램에 정리해 둔 검증된 내용 · 질문과 관련 있을 때만 사용)\n\n' + ordered.map(r => `### ${r.title}\n${r.text}`).join('\n\n') : '';
  }

  g.SCREEN = { build, refs, refItems, domText, windowsText };
})(window);
