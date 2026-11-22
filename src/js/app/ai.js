/* AI 튜터 채팅 패널 (오른쪽 인스펙터)
 * 질문마다 [현재 화면](screen.js)을 붙여 보내므로, AI가 지금 푸는 문제와 내 설정을 보고 답합니다.
 * 대화 기록은 이 PC의 localStorage에만 남습니다. 키는 메인 프로세스(ai.json)에만 있습니다. */
(function (g) {
  'use strict';
  const { esc } = g.MD;
  const $ = (s, r = document) => r.querySelector(s);
  const LS_CHAT = 'silgi.ai.chat.v1', LS_W = 'silgi.ai.width', LS_OPEN = 'silgi.ai.open', LS_EYE = 'silgi.ai.eye';
  const API = g.api && g.api.ai;
  const panel = $('#ai');
  let msgs = load();            // [{role:'user'|'assistant'|'divider'|'error', text, ctx, at}]
  let busy = null;              // { id, el, text, think }
  let cfg = null;
  let view = 'chat';
  let eye = localStorage.getItem(LS_EYE) !== '0';

  function load() { try { return JSON.parse(localStorage.getItem(LS_CHAT) || '[]'); } catch (e) { return []; } }
  function save() { try { localStorage.setItem(LS_CHAT, JSON.stringify(msgs.slice(-80))); } catch (e) { /* 꽉 참 */ } }

  // ───────── 아주 작은 마크다운 (먼저 모두 이스케이프) ─────────
  const inl = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, '$1<em>$2</em>');
  function md(src) {
    const out = [];
    const parts = String(src || '').split(/```/);
    parts.forEach((part, pi) => {
      if (pi % 2 === 1) { const body = part.replace(/^[\w+-]*\n/, ''); out.push(`<pre><code>${esc(body.replace(/\n$/, ''))}</code></pre>`); return; }
      const lines = part.split('\n');
      let i = 0, para = [];
      const flush = () => { if (para.length) { out.push(`<p>${para.map(inl).join('<br>')}</p>`); para = []; } };
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) { flush(); i++; continue; }
        let m;
        if ((m = l.match(/^\s{0,3}(#{1,4})\s+(.*)$/))) { flush(); out.push(`<h4>${inl(m[2])}</h4>`); i++; continue; }
        if (/^\s*\|.*\|\s*$/.test(l) && lines[i + 1] && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
          flush();
          const row = s => s.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
          const head = row(l); i += 2; const body = [];
          while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) body.push(row(lines[i++]));
          out.push(`<div class="md-tbl"><table><thead><tr>${head.map(c => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
          continue;
        }
        if (/^\s*([-*•]|\d+[.)])\s+/.test(l)) {
          flush();
          const ordered = /^\s*\d+[.)]/.test(l);
          const items = [];
          while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
            let t = lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, ''); i++;
            while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) t += '\n' + lines[i++].trim();
            items.push(t);
          }
          out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(t => `<li>${t.split('\n').map(inl).join('<br>')}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
          continue;
        }
        if (/^\s*>\s?/.test(l)) { flush(); const q = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, '')); out.push(`<blockquote>${q.map(inl).join('<br>')}</blockquote>`); continue; }
        para.push(l); i++;
      }
      flush();
    });
    return out.join('');
  }

  // ───────── 아이콘 ─────────
  const I = {
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  };

  // ───────── 뼈대 ─────────
  panel.innerHTML = `
    <div class="ai-resize" title="끌어서 너비 조절"></div>
    <div class="ai-head">
      <div class="ai-title"><span class="ai-logo">${I.spark}</span><div><b>AI 튜터</b><small id="ai-status">준비됨</small></div></div>
      <div class="ai-tools">
        <button class="icon-btn" id="ai-new" title="새 대화">${I.plus}</button>
        <button class="icon-btn" id="ai-gear" title="설정">${I.gear}</button>
        <button class="icon-btn" id="ai-close" title="닫기 (Ctrl+J)">${I.x}</button>
      </div>
    </div>
    <div class="ai-body" id="ai-body"></div>
    <div class="ai-dock" id="ai-dock">
      <div class="ai-ctx" id="ai-ctx"></div>
      <div class="ai-chips" id="ai-chips"></div>
      <div class="ai-input">
        <textarea id="ai-in" rows="1" placeholder="무엇이든 물어보세요" title="Enter 보내기 · Shift+Enter 줄바꿈"></textarea>
        <button class="ai-send" id="ai-send" title="보내기">${I.up}</button>
      </div>
    </div>`;
  const body = $('#ai-body', panel), input = $('#ai-in', panel), sendBtn = $('#ai-send', panel), chips = $('#ai-chips', panel), ctxBar = $('#ai-ctx', panel), dock = $('#ai-dock', panel), status = $('#ai-status', panel);

  // 너비 조절
  const setW = w => { w = Math.max(320, Math.min(640, w)); document.documentElement.style.setProperty('--ai-w', w + 'px'); return w; };
  setW(+localStorage.getItem(LS_W) || Math.round(Math.min(520, Math.max(360, innerWidth * .24))));
  $('.ai-resize', panel).addEventListener('mousedown', e => {
    e.preventDefault(); const sx = e.clientX, sw = panel.offsetWidth; document.body.classList.add('resizing');
    const mv = ev => setW(sw + (sx - ev.clientX));
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('resizing'); localStorage.setItem(LS_W, panel.offsetWidth); };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });

  // ───────── 열고 닫기 ─────────
  const isOpen = () => document.body.classList.contains('ai-open');
  function open() { document.body.classList.add('ai-open'); localStorage.setItem(LS_OPEN, '1'); refreshCtx(); paint(); setTimeout(() => input.focus(), 60); syncBtn(); }
  function close() { document.body.classList.remove('ai-open'); localStorage.setItem(LS_OPEN, '0'); syncBtn(); }
  function toggle() { if (isOpen()) close(); else open(); }
  function syncBtn() { const b = $('#ai-toggle'); if (b) b.setAttribute('aria-pressed', String(isOpen())); }
  $('#ai-close', panel).addEventListener('click', close);
  $('#ai-new', panel).addEventListener('click', () => { if (busy) stop(); msgs = []; save(); view = 'chat'; paint(); input.focus(); });
  $('#ai-gear', panel).addEventListener('click', () => { view = view === 'settings' ? 'chat' : 'settings'; paint(); });
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); toggle(); } });

  // ───────── 지금 화면 정보 ─────────
  function ctxNow() { return g.APP && g.APP.aiCtx ? g.APP.aiCtx() : { page: '시작 중', examName: '' }; }
  function refreshCtx() {
    if (!isOpen()) return;
    const c = ctxNow();
    ctxBar.innerHTML = `<button class="eye ${eye ? 'on' : ''}" id="ai-eye" title="${eye ? '화면 보기 켜짐: 질문할 때 지금 화면을 같이 보냅니다' : '화면 보기 꺼짐'}">${eye ? I.eye : I.eyeOff}<span>${eye ? '화면 보는 중' : '화면 안 봄'}</span></button><span class="where" title="${esc(c.page)}">${esc(c.label || c.page)}</span><span class="ext" title="지금 화면 정보와 질문을 복사하고 사이트를 엽니다. 붙여넣기(Ctrl+V)만 하면 돼요.">${EXT_BTNS}</span>`;
    $('#ai-eye', ctxBar).addEventListener('click', () => { eye = !eye; localStorage.setItem(LS_EYE, eye ? '1' : '0'); refreshCtx(); });
    const asks = g.TUTOR.quickAsks(c);
    chips.innerHTML = asks.map(a => `<button class="chip-q" data-q="${esc(a)}">${esc(a)}</button>`).join('');
    chips.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => ask(b.dataset.q)));
  }

  // ───────── 그리기 ─────────
  function paint() {
    if (view === 'settings') { paintSettings(); dock.style.display = 'none'; return; }
    dock.style.display = '';
    if (!API) { body.innerHTML = `<div class="ai-empty"><div class="ai-hello">${I.spark}</div><h3>프로그램에서만 쓸 수 있어요</h3><p>AI 튜터은 실기 연습 프로그램(Electron) 안에서 동작합니다.</p></div>`; return; }
    if (!msgs.length) {
      const c = ctxNow();
      body.innerHTML = `<div class="ai-empty"><div class="ai-hello">${I.spark}</div><h3>무엇이든 물어보세요</h3>
        <p>지금 보고 있는 문제, 내가 넣은 설정, 채점 결과를 AI가 <b>같이 보고</b> 답해요.<br>이해될 때까지 몇 번이고 다시 물어봐도 됩니다.</p>
        <ul class="ai-tips"><li><b>“이거 왜 틀렸어?”</b> — 틀린 칸을 콕 집어 설명</li><li><b>“더 쉽게”</b> — 비유로 다시 설명</li><li><b>“비슷한 문제 내 줘”</b> — 바로 연습</li></ul>
        ${cfg && !cfg.hasKey ? '<p class="warn">API 키가 아직 없어요. 오른쪽 위 ⚙ 설정에서 넣어 주세요.</p>' : ''}</div>`;
      void c; return;
    }
    body.innerHTML = '';
    msgs.forEach((m, i) => body.append(msgEl(m, i)));
    if (busy) { busy.el = pendingEl(); body.append(busy.el); paintBusy(); }
    scrollEnd(true);
  }
  function msgEl(m, i) {
    const d = document.createElement('div');
    if (m.role === 'divider') { d.className = 'ai-div'; d.innerHTML = `<span>${esc(m.text)}</span>`; return d; }
    if (m.role === 'error') { d.className = 'ai-err'; d.innerHTML = `<p>${esc(m.text)}</p>${i === msgs.length - 1 ? `<div class="row"><button class="btn sm" data-retry>다시 시도</button>${EXT_BTNS}</div>` : ''}`; const r = d.querySelector('[data-retry]'); if (r) r.addEventListener('click', retry); return d; }
    d.className = 'ai-msg ' + m.role;
    d.innerHTML = m.role === 'user' ? `<div class="bubble">${esc(m.text).replace(/\n/g, '<br>')}</div>` : `<div class="md">${md(m.text)}</div>`;
    return d;
  }
  // 기다리는 동안: 대기 상태만 보여 주고, 8초 넘게 걸리면 Claude·ChatGPT로 물어볼 수 있는 단추를 띄웁니다.
  // (예전에 먼저 띄우던 '관련 내용' 카드는 답처럼 보여 헷갈린다는 의견으로 뺐습니다.)
  const SLOW_SEC = 8;
  function pendingEl() {
    const d = document.createElement('div'); d.className = 'ai-msg assistant pending';
    d.innerHTML = `<div class="md"></div><div class="ai-think"><span class="dots"><i></i><i></i><i></i></span><span class="lab">무료 서버 대기 중</span></div>
      <div class="ai-wait" style="display:none"><div class="aw-alt"><span>답이 느리면</span>${EXT_BTNS}</div></div>`;
    return d;
  }
  let raf = 0;
  function paintBusy() {
    if (!busy || !busy.el) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!busy || !busy.el) return;
      busy.el.querySelector('.md').innerHTML = md(busy.text);
      const th = busy.el.querySelector('.ai-think'), wait = busy.el.querySelector('.ai-wait');
      th.style.display = busy.text ? 'none' : '';
      const sec = Math.round((Date.now() - busy.t0) / 1000);
      if (wait) wait.style.display = !busy.text && sec >= SLOW_SEC ? '' : 'none';
      th.querySelector('.lab').textContent =
        busy.retry ? `서버가 바빠서 다시 보내는 중 (${busy.retry}/${busy.max}) · ${busy.reason || '혼잡'} · ${sec}초`
        : busy.think ? `생각하는 중 · ${sec}초`
        : busy.head ? `답을 쓰기 시작하는 중 · ${sec}초`
        : sec < 12 ? `무료 서버 대기 중 · ${sec}초` : `무료 서버가 붐벼서 줄 서는 중 · ${sec}초`;
      scrollEnd();
    });
  }
  // 바깥 AI(Claude·ChatGPT)에 물어보기: 지금 화면·참고 자료·질문을 통째로 복사하고 사이트를 엽니다.
  const EXT = { claude: ['Claude', 'https://claude.ai/new'], chatgpt: ['ChatGPT', 'https://chatgpt.com/'] };
  const EXT_BTNS = Object.entries(EXT).map(([k, [n]]) => `<button class="ext-btn" data-ext="${k}" type="button"><span>${n}</span><span class="t">에서 묻기</span> ↗</button>`).join('');
  function extText(meta) {
    return [`나는 ICQA ${meta.examName || '실기'} 실기(2026년 12월 6일)를 준비하는 초보 수험생이에요. 아래 [현재 화면]과 [참고 자료]를 보고 [질문]에 한국어로 쉽게, 결론부터 답해 주세요. 정답을 직접 묻지 않았다면 힌트 위주로 알려 주세요.`,
      meta.screen, meta.refs, `[질문]\n${meta.question}`].filter(Boolean).join('\n\n');
  }
  async function askElsewhere(where) {
    let meta = busy && busy.meta;
    if (!meta) { // 보내는 중이 아니면: 입력 칸의 글, 없으면 마지막 질문
      const q = input.value.trim() || ([...msgs].reverse().find(m => m.role === 'user') || {}).text || '';
      if (!q) { (g.APP && g.APP.toast || alert)('먼저 질문을 입력하세요.'); input.focus(); return; }
      meta = buildMeta(q);
    }
    const [name, url] = EXT[where];
    try { if (g.api && g.api.copy) await g.api.copy(extText(meta)); else await navigator.clipboard.writeText(extText(meta)); } catch (e) { console.error(e); }
    if (g.api && g.api.openLink) g.api.openLink(url); else window.open(url);
    if (g.APP && g.APP.toast) g.APP.toast(`질문과 화면 정보를 복사했어요. ${name} 입력 칸에 붙여넣기(Ctrl+V) 하세요.`);
  }
  panel.addEventListener('click', e => { const b = e.target.closest('[data-ext]'); if (b) { e.preventDefault(); askElsewhere(b.dataset.ext); } });
  function scrollEnd(force) { const nearEnd = body.scrollHeight - body.scrollTop - body.clientHeight < 140; if (force || nearEnd) body.scrollTop = body.scrollHeight; }

  // ───────── 설정 ─────────
  async function paintSettings() {
    body.innerHTML = `<div class="ai-set"><button class="btn sm ghost" id="set-back">${I.back} 대화로</button><h3>AI 연결 설정</h3>
      <p class="muted small">OpenAI 방식 API라면 어느 서비스든 됩니다. 키는 이 PC의 설정 파일에만 저장됩니다.</p>
      <label>서버 주소 (Base URL)<input class="input" id="set-url" spellcheck="false"></label>
      <label>API 키<input class="input" id="set-key" type="password" spellcheck="false" autocomplete="off"></label>
      <label>모델<div class="row"><select class="input" id="set-model" style="flex:1"></select><button class="btn sm" id="set-load">목록 불러오기</button></div></label>
      <div class="row" style="margin-top:6px"><button class="btn pri" id="set-save">저장</button><span class="small" id="set-msg"></span></div></div>`;
    $('#set-back', body).addEventListener('click', () => { view = 'chat'; paint(); });
    if (!API) return;
    cfg = await API.config();
    $('#set-url', body).value = cfg.baseURL;
    $('#set-key', body).placeholder = cfg.hasKey ? `저장된 키: ${cfg.keyHint} (바꿀 때만 입력)` : 'API 키를 붙여넣으세요';
    const sel = $('#set-model', body);
    const fill = list => { sel.innerHTML = [...new Set([cfg.model, ...list])].map(m => `<option${m === cfg.model ? ' selected' : ''}>${esc(m)}</option>`).join(''); };
    fill([]);
    const msg = (t, ok) => { const e = $('#set-msg', body); e.textContent = t; e.style.color = ok ? 'var(--ok)' : 'var(--bad)'; };
    $('#set-load', body).addEventListener('click', async () => { msg('불러오는 중…', true); const r = await API.models(); if (r.ok) { fill(r.models); msg(`연결 확인 · 모델 ${r.models.length}개`, true); } else msg(r.error); });
    $('#set-save', body).addEventListener('click', async () => {
      cfg = await API.setConfig({ baseURL: $('#set-url', body).value, apiKey: $('#set-key', body).value, model: sel.value });
      $('#set-key', body).value = ''; $('#set-key', body).placeholder = `저장된 키: ${cfg.keyHint}`;
      msg('저장했습니다', true); setStatus();
    });
  }
  async function setStatus() {
    if (!API) { status.textContent = '사용할 수 없음'; return; }
    try { cfg = await API.config(); } catch (e) { cfg = null; }
    status.textContent = busy ? '답하는 중…' : cfg && cfg.hasKey ? '준비됨' : 'API 키 필요';
    status.className = busy ? 'busy' : cfg && cfg.hasKey ? 'ok' : 'warn';
  }

  // ───────── 보내기 ─────────
  function history(screen, refs, question) {
    const c = ctxNow();
    const sys = g.TUTOR.systemPrompt({ exam: c.exam, examDate: c.examDate, dday: c.dday });
    const conv = msgs.filter(m => m.role === 'user' || m.role === 'assistant').slice(-20, -1)
      .map(m => ({ role: m.role, content: m.role === 'user' && m.ctx ? `(그때 보던 화면: ${m.ctx})\n${m.text}` : m.text }));
    const last = [screen, refs, (screen || refs) ? `[학생 질문]\n${question}` : question].filter(Boolean).join('\n\n');
    return [{ role: 'system', content: sys }, ...conv, { role: 'user', content: last }];
  }
  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy || !API) return;
    if (!isOpen()) open();
    view = 'chat';
    const c = ctxNow();
    const label = c.label || c.page;
    const lastLabel = [...msgs].reverse().find(m => m.role === 'user');
    if (msgs.length && lastLabel && lastLabel.ctx !== label) msgs.push({ role: 'divider', text: label });
    msgs.push({ role: 'user', text, ctx: label, at: Date.now() });
    save();
    const meta = buildMeta(text, c);
    run(history(meta.screen, meta.refs, text), meta);
  }
  // 질문 하나에 붙일 정보: 지금 화면(화면 보기가 켜져 있을 때) + 참고 자료(목록과 글)
  function buildMeta(question, c) {
    c = c || ctxNow();
    const meta = { question, examName: c.examName, screen: '', refs: '', items: [] };
    if (eye) { try { meta.screen = g.SCREEN.build(c); } catch (e) { console.error(e); } }
    try { meta.items = g.SCREEN.refItems(c, question); meta.refs = g.SCREEN.refs(c, question, meta.items); } catch (e) { console.error(e); }
    return meta;
  }
  function retry() {
    if (busy) return;
    while (msgs.length && msgs[msgs.length - 1].role !== 'user') msgs.pop();
    const u = msgs[msgs.length - 1]; if (!u) return;
    msgs.pop(); save(); ask(u.text);
  }
  function run(messages, meta) {
    const id = 'r' + Date.now() + Math.random().toString(36).slice(2, 6);
    busy = { id, text: '', think: false, head: false, t0: Date.now(), retry: 0, max: 3, reason: '', meta };
    input.value = ''; autosize();
    paint(); setSend(); setStatus();
    busy.tick = setInterval(paintBusy, 1000);
    API.chat({ id, messages }).catch(err => onEv({ id, type: 'error', error: String(err.message || err) }));
  }
  function finish() { if (!busy) return; clearInterval(busy.tick); busy = null; save(); paint(); setSend(); setStatus(); refreshCtx(); }
  function onEv(ev) {
    if (!busy || ev.id !== busy.id) return;
    if (ev.type === 'think') { busy.think = true; paintBusy(); }
    else if (ev.type === 'head') { busy.head = true; paintBusy(); }
    else if (ev.type === 'retry') { busy.retry = ev.attempt; busy.max = ev.max || 3; busy.reason = ev.reason || ''; busy.head = false; busy.think = false; busy.text = ''; paintBusy(); }
    else if (ev.type === 'delta') { busy.retry = 0; busy.text += ev.text; paintBusy(); }
    else if (ev.type === 'done') {
      if (busy.text.trim()) msgs.push({ role: 'assistant', text: busy.text + (ev.aborted ? '\n\n*(여기서 멈췄어요)*' : ''), at: Date.now() });
      else if (!ev.aborted) msgs.push({ role: 'error', text: 'AI가 빈 답을 보냈어요. 다시 시도해 주세요.' });
      finish();
    } else if (ev.type === 'error') {
      if (busy.text.trim()) msgs.push({ role: 'assistant', text: busy.text, at: Date.now() });
      msgs.push({ role: 'error', text: ev.error });
      finish();
    }
  }
  if (API) API.onEvent(onEv);
  function stop() { if (busy && API) API.abort(busy.id); }
  function setSend() { sendBtn.innerHTML = busy ? I.stop : I.up; sendBtn.title = busy ? '멈추기' : '보내기'; sendBtn.classList.toggle('stop', !!busy); }
  sendBtn.addEventListener('click', () => { if (busy) stop(); else ask(input.value); });
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(160, input.scrollHeight) + 'px'; };
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy) ask(input.value); } });

  // 화면 어디서든 data-ai-ask 단추를 누르면 바로 질문
  document.addEventListener('click', e => { const b = e.target.closest('[data-ai-ask]'); if (b) { e.preventDefault(); ask(b.dataset.aiAsk); } });

  g.AI = { open, close, toggle, ask, refresh: refreshCtx, md };
  setStatus();
  if (localStorage.getItem(LS_OPEN) === '1') open();
})(window);
