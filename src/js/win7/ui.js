/* 가상 Windows 창 부품 모음 (창, 대화 상자, 마법사, 트리, 목록, 오른쪽 메뉴, 입력 칸)
 * 모든 가상 화면(DHCP, DNS, IIS …)이 이 부품으로 만들어집니다. */
(function (g) {
  'use strict';
  const icon = g.icon;

  // ───────── DOM 도우미 ─────────
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const c of kids.flat(9)) { if (c == null || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
    return el;
  }
  const frag = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  // ───────── 바탕(데스크톱) ─────────
  class Desk {
    constructor(container) {
      this.el = h('div', { class: 'desk' });
      container.append(this.el);
      this.z = 10; this.wins = [];
      this.el.addEventListener('mousedown', e => { if (!e.target.closest('.cm7')) closeMenus(this); });
      this.el.addEventListener('contextmenu', e => e.preventDefault());
      // 바탕 크기가 바뀌면(AI 패널을 열고 닫을 때 등) 창이 밖으로 잘리지 않게 줄이고 옮깁니다. 넓어지면 원래 크기까지 되돌립니다.
      if (typeof ResizeObserver === 'function') new ResizeObserver(() => this.fit()).observe(this.el);
    }
    fit() {
      const { w: dw, h: dh } = this.size(); if (!dw || !dh) return;
      this.wins.forEach(win => {
        const s = win.el.style;
        const W_ = win.maxed ? dw : Math.min(win.o.w || 600, dw - 10), H_ = win.maxed ? dh : Math.min(win.o.h || 400, dh - 10);
        if (Math.abs(win.el.offsetWidth - W_) > 1) s.width = W_ + 'px';
        if (Math.abs(win.el.offsetHeight - H_) > 1) s.height = H_ + 'px';
        s.left = Math.max(0, Math.min(win.el.offsetLeft, dw - W_)) + 'px';
        s.top = Math.max(0, Math.min(win.el.offsetTop, dh - H_)) + 'px';
      });
    }
    size() { return { w: this.el.clientWidth, h: this.el.clientHeight }; }
    front(win) {
      win.el.style.zIndex = ++this.z;
      this.wins.forEach(w => w.el.classList.toggle('inactive', w !== win));
    }
    remove(win) { this.wins = this.wins.filter(w => w !== win); const top = this.wins.filter(w => !w.blocked).pop(); if (top) this.front(top); }
    clear() { this.wins.slice().forEach(w => w.close(true)); this.el.innerHTML = ''; this.wins = []; }
  }

  // ───────── 창 ─────────
  // opts: title, icon, w, h, x, y, menus[{label, items()}], toolbar, status, closeOnly, dialog, owner, onClose()
  class Win {
    constructor(desk, o) {
      this.desk = desk; this.o = o; this.blocked = false; this.children = [];
      const ctl = o.closeOnly ? [h('span', { class: 'x only', title: '닫기', onclick: () => this.tryClose() }, '✕')]
        : [h('span', { title: '최소화' }, '▁'), h('span', { title: '최대화', onclick: () => this.toggleMax() }, '▢'), h('span', { class: 'x', title: '닫기', onclick: () => this.tryClose() }, '✕')];
      this.titleEl = h('div', { class: 'w7-title' }, o.icon ? frag(icon(o.icon)) : null, h('span', { class: 't' }, o.title), h('div', { class: 'w7-ctl' }, ctl));
      this.inner = h('div', { class: 'w7-inner' });
      this.el = h('div', { class: 'w7' + (o.dialog ? ' dlg' : ''), role: o.dialog ? 'dialog' : 'application', 'aria-label': o.title }, this.titleEl, this.inner);
      if (o.menus) {
        this.menubar = h('div', { class: 'w7-menubar' }, o.menus.map(m => {
          const sp = h('span', {}, m.label);
          sp.addEventListener('mousedown', e => { e.stopPropagation(); const r = sp.getBoundingClientRect(), d = desk.el.getBoundingClientRect(); const items = typeof m.items === 'function' ? m.items() : m.items; menu(desk, r.left - d.left, r.bottom - d.top, items || [{ t: '(이 연습 프로그램에서는 쓰지 않는 메뉴)', dis: true }]); });
          return sp;
        }));
        this.inner.append(this.menubar);
      }
      if (o.toolbar) { this.toolbar = h('div', { class: 'w7-toolbar' }, h('span', { class: 'grip' }), o.toolbar === true ? h('span', { class: 'tb', title: '콘솔 트리 표시/숨기기', html: icon('mmc') }) : o.toolbar); this.inner.append(this.toolbar); }
      this.body = h('div', { style: { flex: '1', display: 'flex', flexDirection: 'column', minHeight: '0' } });
      this.inner.append(this.body);
      if (o.status !== undefined) { this.statusEl = h('div', { class: 'w7-status' }, o.status || ''); this.inner.append(this.statusEl); }
      const { w: dw, h: dh } = desk.size();
      const W_ = Math.min(o.w || 600, dw - 10), H_ = Math.min(o.h || 400, dh - 10);
      let x = o.x, y = o.y;
      if (x == null) { if (o.owner) { const r = o.owner.el; x = r.offsetLeft + Math.max(20, (r.offsetWidth - W_) / 2); y = r.offsetTop + Math.max(30, (r.offsetHeight - H_) / 3); } else { x = (dw - W_) / 2; y = Math.max(5, (dh - H_) / 2); } }
      x = Math.max(0, Math.min(x, dw - W_)); y = Math.max(0, Math.min(y, dh - H_));
      Object.assign(this.el.style, { left: x + 'px', top: y + 'px', width: W_ + 'px', height: H_ + 'px' });
      desk.el.append(this.el); desk.wins.push(this); desk.front(this);
      this.el.addEventListener('mousedown', () => { if (!this.blocked) desk.front(this); });
      drag(this.titleEl, this.el, desk);
      this.titleEl.addEventListener('dblclick', e => { if (!e.target.closest('.w7-ctl')) this.toggleMax(); });
      this.el.addEventListener('keydown', e => this.key(e));
    }
    key(e) {
      if (this.blocked) return;
      if (e.key === 'Escape' && this.o.onEsc) { e.preventDefault(); e.stopPropagation(); this.o.onEsc(); }
      if (e.key === 'Enter' && this.o.onEnter && !(e.target.tagName === 'TEXTAREA') && !(e.target.tagName === 'BUTTON')) { e.preventDefault(); e.stopPropagation(); this.o.onEnter(); }
    }
    // 최대화: 바탕을 꽉 채우기 ↔ 원래 크기 (주 창만, 대화상자는 제외)
    toggleMax() {
      if (this.o.dialog || this.blocked) return;
      const s = this.el.style;
      if (!this.maxed) { this.restore = { left: s.left, top: s.top }; this.maxed = true; s.left = '0px'; s.top = '0px'; }
      else { this.maxed = false; Object.assign(s, this.restore || {}); }
      this.desk.fit();
    }
    setStatus(t) { if (this.statusEl) this.statusEl.textContent = t; }
    setTitle(t) { this.titleEl.querySelector('.t').textContent = t; }
    tryClose() { if (this.blocked) return; if (this.o.onCancel) this.o.onCancel(); else this.close(); }
    close(silent) {
      this.children.slice().forEach(c => c.close(true));
      this.el.remove(); this.desk.remove(this);
      if (this.shield) this.shield.remove();
      if (this.o.owner) { this.o.owner.children = this.o.owner.children.filter(c => c !== this); this.o.owner.blocked = false; this.desk.front(this.o.owner); }
      if (!silent && this.o.onClose) this.o.onClose();
      if (this.closed) return; this.closed = true;
    }
  }
  function drag(handle, box, desk) {
    handle.addEventListener('mousedown', e => {
      if (e.target.closest('.w7-ctl')) return;
      const sx = e.clientX, sy = e.clientY, ox = box.offsetLeft, oy = box.offsetTop;
      const mv = ev => { const { w, h: hh } = desk.size(); box.style.left = Math.max(-box.offsetWidth + 60, Math.min(w - 60, ox + ev.clientX - sx)) + 'px'; box.style.top = Math.max(0, Math.min(hh - 30, oy + ev.clientY - sy)) + 'px'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
    });
  }

  // ───────── 대화 상자 (모달) ─────────
  // buttons: [{t, def, on(): false면 안 닫힘, cancel, dis, id}]
  function dialog(desk, o) {
    const owner = o.owner;
    const win = new Win(desk, { ...o, dialog: true, closeOnly: true, onEsc: () => cancel(), onEnter: () => { const d = btns.find(b => b.def && !b.el.disabled); if (d) d.el.click(); } });
    if (owner) { owner.blocked = true; owner.children.push(win); win.shield = h('div', { class: 'w7-shield' }); owner.el.append(win.shield); win.shield.style.zIndex = 99; }
    const body = h('div', { class: o.bodyClass || 'dlg-body' });
    win.body.append(body);
    const btns = (o.buttons || []).map(b => { const el = h('button', { class: 'btn7' + (b.def ? ' def' : '') + (b.left ? ' left' : ''), type: 'button', disabled: !!b.dis }, b.t); return { ...b, el }; });
    const bar = h('div', { class: 'dlg-btns' }, btns.map(b => b.el));
    if (btns.length) win.body.append(bar);
    // on()이 Promise(async)를 돌려주면 끝날 때까지 기다렸다가 닫는다 — 먼저 닫으면 owner 창이 앞으로 와서 그 사이 띄운 확인 상자를 덮어 버린다
    const done = (b, r) => { if (r !== false && (b.close !== false)) win.close(true); if (r !== false && b.cancel && o.onCancelled) o.onCancelled(); };
    btns.forEach(b => b.el.addEventListener('click', () => { if (b.el.disabled) return; const r = b.on ? b.on(win) : undefined; if (r && typeof r.then === 'function') r.then(v => done(b, v)); else done(b, r); }));
    function cancel() { const c = btns.find(b => b.cancel); if (c) c.el.click(); else { win.close(true); if (o.onCancelled) o.onCancelled(); } }
    win.o.onCancel = cancel;
    win.dbody = body; win.btn = id => (btns.find(b => b.id === id || b.t === id) || {}).el;
    if (o.render) o.render(body, win);
    setTimeout(() => { const f = body.querySelector('input:not([disabled]):not([readonly]), select:not([disabled]), textarea'); if (f && o.autofocus !== false) f.focus(); }, 0);
    return win;
  }

  // 메시지 상자 → Promise(누른 버튼 글자)
  function msg(desk, o) {
    return new Promise(res => {
      const lines = String(o.text).split('\n');
      const w = Math.max(320, Math.min(520, 120 + Math.max(...lines.map(l => l.length)) * 9));
      const win = dialog(desk, {
        title: o.title || '', w, h: 150 + Math.max(0, lines.length - 2) * 18, owner: o.owner, bodyClass: 'mb7-wrap', autofocus: false,
        render: (b) => { b.style.cssText = 'flex:1;display:flex;flex-direction:column'; b.append(h('div', { class: 'mb7-body' }, frag(icon(o.icon || 'info')), h('div', {}, lines.map(l => h('div', {}, l))))); },
        buttons: (o.buttons || ['확인']).map((t, i) => ({ t, def: i === 0, on: () => res(t), cancel: i === (o.buttons || ['확인']).length - 1 })),
      });
      setTimeout(() => { const b = win.el.querySelector('.btn7.def'); if (b) b.focus(); }, 0);
    });
  }

  // ───────── 오른쪽 클릭 메뉴 ─────────
  function closeMenus(desk) { desk.el.querySelectorAll('.cm7').forEach(m => m.remove()); }
  // items: [{t, on, dis, b, sub:[...]}, '-']
  function menu(desk, x, y, items, level = 0) {
    if (!level) closeMenus(desk);
    const m = h('div', { class: 'cm7', role: 'menu' });
    items.forEach(it => {
      if (it === '-') { m.append(h('div', { class: 'sep' })); return; }
      const mi = h('div', { class: 'mi' + (it.dis ? ' dis' : ''), role: 'menuitem' }, it.b ? h('b', {}, it.t) : it.t, it.sub ? h('span', { class: 'arr' }, '▶') : null);
      if (it.sub && !it.dis) mi.addEventListener('mouseenter', () => { m.querySelectorAll(':scope ~ .cm7.lv' + (level + 1)).forEach(x => x.remove()); desk.el.querySelectorAll('.cm7').forEach(c => { if (+c.dataset.level > level) c.remove(); }); const r = mi.getBoundingClientRect(), d = desk.el.getBoundingClientRect(); menu(desk, r.right - d.left - 3, r.top - d.top - 3, it.sub, level + 1); });
      else mi.addEventListener('mouseenter', () => desk.el.querySelectorAll('.cm7').forEach(c => { if (+c.dataset.level > level) c.remove(); }));
      mi.addEventListener('mousedown', e => e.stopPropagation());
      mi.addEventListener('click', e => { e.stopPropagation(); if (it.dis || it.sub) return; closeMenus(desk); if (it.on) setTimeout(() => it.on(), 0); });
      m.append(mi);
    });
    m.dataset.level = level;
    desk.el.append(m);
    const { w, h: hh } = desk.size();
    m.style.left = Math.min(x, w - m.offsetWidth - 2) + 'px'; m.style.top = Math.min(y, hh - m.offsetHeight - 2) + 'px';
    return m;
  }

  // ───────── 트리 ─────────
  // nodes: [{id, label, icon, open, kids: [] | () => [], noExpand}] — kids 함수면 그릴 때마다 새로 만듭니다.
  function tree(o) {
    const el = h('div', { class: 'tree', tabindex: 0 });
    const t = { el, sel: null, open: new Set(o.open || []), byId: new Map() };
    const kidsOf = n => (typeof n.kids === 'function' ? n.kids() : n.kids) || [];
    function paint() {
      el.innerHTML = ''; t.byId.clear();
      const walk = (list, depth, parent) => list.forEach(n => {
        n.parent = parent; t.byId.set(n.id, n);
        const kids = kidsOf(n); const has = kids.length > 0 || n.lazy;
        const isOpen = t.open.has(n.id);
        const tg = h('span', { class: 'tg' + (has ? '' : ' none') }, isOpen ? '−' : '+');
        // +/− 단추: 누르는 즉시 펼치기/접기 (줄 선택보다 먼저 처리 — 선택하면 트리가 다시 그려져 click이 사라짐)
        tg.addEventListener('mousedown', e => { if (e.button !== 0 || !has) return; e.stopPropagation(); e.preventDefault(); toggle(n.id); });
        tg.addEventListener('click', e => e.stopPropagation());
        tg.addEventListener('dblclick', e => e.stopPropagation());
        const lb = h('span', { class: 'lb' }, n.label);
        const row = h('div', { class: 'tn' + (t.sel === n.id ? ' sel' : ''), style: { paddingLeft: depth * 19 + 'px' }, dataset: { id: n.id } }, tg, frag(icon(n.icon || 'folder')), lb);
        row.addEventListener('mousedown', e => { if (e.button === 0 || e.button === 2) select(n.id); });
        row.addEventListener('dblclick', () => { if (has) toggle(n.id); if (o.onDbl) o.onDbl(n); });
        row.addEventListener('contextmenu', e => { e.preventDefault(); select(n.id); if (o.onContext) o.onContext(n, e); });
        el.append(row);
        if (isOpen) walk(kids, depth + 1, n);
      });
      walk(typeof o.nodes === 'function' ? o.nodes() : o.nodes, 0, null);
    }
    function toggle(id) { if (t.open.has(id)) t.open.delete(id); else t.open.add(id); paint(); }
    function select(id, silent) {
      // 부모를 모두 펼칩니다.
      let n = t.byId.get(id); let p = n && n.parent; while (p) { t.open.add(p.id); p = p.parent; }
      t.sel = id; paint();
      if (!silent && o.onSelect) o.onSelect(t.byId.get(id));
    }
    el.addEventListener('keydown', e => {
      const rows = [...el.querySelectorAll('.tn')]; const i = rows.findIndex(r => r.classList.contains('sel'));
      if (e.key === 'ArrowDown' && i < rows.length - 1) { e.preventDefault(); select(rows[i + 1].dataset.id); }
      else if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); select(rows[i - 1].dataset.id); }
      else if (e.key === 'ArrowRight' && t.sel) { t.open.add(t.sel); paint(); }
      else if (e.key === 'ArrowLeft' && t.sel) { t.open.delete(t.sel); paint(); }
    });
    t.paint = paint; t.select = select; t.toggle = toggle; t.node = id => t.byId.get(id);
    t.expand = id => { t.open.add(id); paint(); };
    paint();
    return t;
  }

  // ───────── 목록 (자세히 보기) ─────────
  // cols: [{t, w}], rows: [{id, cells: [], icon, dis}]
  function list(o) {
    const el = h('div', { style: { minHeight: '100%' }, tabindex: 0 });
    const L = { el, sel: null, rows: [] };
    function paint() {
      el.innerHTML = '';
      const tb = h('table', { class: 'lv' }, h('colgroup', {}, o.cols.map(c => h('col', { style: { width: (c.w || 120) + 'px' } }))),
        h('thead', {}, h('tr', {}, o.cols.map(c => h('th', {}, c.t)))));
      const body = h('tbody');
      L.rows.forEach(r => {
        const tr = h('tr', { class: (L.sel === r.id ? 'sel' : '') + (r.dis ? ' dis' : ''), dataset: { id: r.id } }, r.cells.map((c, i) => h('td', { title: typeof c === 'string' ? c : '' }, i === 0 && r.icon ? frag(icon(r.icon)) : null, c instanceof Node ? c : String(c ?? ''))));
        tr.addEventListener('mousedown', () => { L.sel = r.id; paint(); if (o.onSelect) o.onSelect(r); });
        tr.addEventListener('dblclick', () => o.onDbl && o.onDbl(r));
        tr.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); L.sel = r.id; paint(); if (o.onContext) o.onContext(r, e); });
        body.append(tr);
      });
      tb.append(body); el.append(tb);
      if (!L.rows.length && o.empty) el.append(h('div', { class: 'lv-empty' }, o.empty));
    }
    el.addEventListener('contextmenu', e => { if (e.target.closest('tr[data-id]')) return; e.preventDefault(); L.sel = null; paint(); if (o.onBlank) o.onBlank(e); });
    el.addEventListener('keydown', e => {
      const i = L.rows.findIndex(r => r.id === L.sel);
      if (e.key === 'ArrowDown' && i < L.rows.length - 1) { e.preventDefault(); L.sel = L.rows[i + 1].id; paint(); o.onSelect && o.onSelect(L.rows[i + 1]); }
      if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); L.sel = L.rows[i - 1].id; paint(); o.onSelect && o.onSelect(L.rows[i - 1]); }
      if (e.key === 'Enter' && i >= 0 && o.onDbl) { e.preventDefault(); o.onDbl(L.rows[i]); }
      if (e.key === 'Delete' && i >= 0 && o.onDelete) { e.preventDefault(); o.onDelete(L.rows[i]); }
    });
    L.set = rows => { L.rows = rows; if (!rows.some(r => r.id === L.sel)) L.sel = null; paint(); };
    L.paint = paint; L.selected = () => L.rows.find(r => r.id === L.sel);
    L.set(o.rows || []);
    return L;
  }

  // ───────── 입력 부품 ─────────
  function text(v = '', o = {}) {
    const el = h(o.multi ? 'textarea' : 'input', { class: 'tb7', type: o.pw ? 'password' : 'text', value: o.multi ? null : v, readonly: !!o.ro, disabled: !!o.dis, maxlength: o.max, rows: o.rows, spellcheck: 'false', autocomplete: 'off', style: { width: o.w ? (typeof o.w === 'number' ? o.w + 'px' : o.w) : '100%' } });
    if (o.multi) el.value = v;
    return el;
  }
  // Windows IP 주소 칸: 숫자 4칸, 점(.)이나 3자리를 치면 다음 칸으로.
  function ip(v = '', o = {}) {
    const wrap = h('span', { class: 'ip7' + (o.dis ? ' dis' : '') });
    const parts = [0, 1, 2, 3].map(i => h('input', { maxlength: 3, inputmode: 'numeric', disabled: !!o.dis, 'aria-label': `IP ${i + 1}번째 칸` }));
    parts.forEach((p, i) => {
      wrap.append(p); if (i < 3) wrap.append(h('i', {}, '.'));
      p.addEventListener('keydown', e => {
        if (e.key === '.' || e.key === ' ' || e.key === 'Decimal') { e.preventDefault(); if (p.value && parts[i + 1]) { parts[i + 1].focus(); parts[i + 1].select(); } }
        else if (e.key === 'Backspace' && !p.value && i > 0) { e.preventDefault(); parts[i - 1].focus(); }
        else if (e.key === 'ArrowRight' && p.selectionStart === p.value.length && parts[i + 1]) { e.preventDefault(); parts[i + 1].focus(); }
        else if (e.key === 'ArrowLeft' && p.selectionStart === 0 && i > 0) { e.preventDefault(); parts[i - 1].focus(); }
        else if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey) e.preventDefault();
      });
      p.addEventListener('input', () => {
        p.value = p.value.replace(/\D/g, '');
        if (+p.value > 255) { p.value = '255'; }
        if (p.value.length === 3 && parts[i + 1]) { parts[i + 1].focus(); parts[i + 1].select(); }
        wrap.dispatchEvent(new Event('change'));
      });
      p.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').trim(); if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) { e.preventDefault(); set(t); wrap.dispatchEvent(new Event('change')); } });
      p.addEventListener('blur', () => setTimeout(() => { if (!wrap.contains(document.activeElement)) wrap.dispatchEvent(new Event('leave')); }, 0));
    });
    function get() { const v = parts.map(p => p.value); return v.every(x => x === '') ? '' : v.map(x => (x === '' ? '0' : String(+x))).join('.'); }
    function set(v) { const a = String(v || '').split('.'); parts.forEach((p, i) => (p.value = a[i] != null && v ? a[i] : '')); }
    set(v);
    Object.defineProperty(wrap, 'value', { get, set });
    wrap.setDisabled = d => { wrap.classList.toggle('dis', d); parts.forEach(p => (p.disabled = d)); };
    wrap.focusFirst = () => parts[0].focus();
    return wrap;
  }
  function chk(label, on = false, o = {}) {
    const inp = h('input', { type: 'checkbox', disabled: !!o.dis }); inp.checked = !!on;
    const el = h('label', { class: 'chk7' + (o.dis ? ' dis' : '') }, inp, label);
    el.input = inp;
    Object.defineProperty(el, 'checked', { get: () => inp.checked, set: v => (inp.checked = v) });
    el.setDisabled = d => { inp.disabled = d; el.classList.toggle('dis', d); };
    el.onToggle = fn => inp.addEventListener('change', fn);
    return el;
  }
  let radSeq = 0;
  function radios(items, value, o = {}) { // items: [[value, label]]
    const name = 'r' + (++radSeq);
    const els = items.map(([v, l]) => { const inp = h('input', { type: 'radio', name, value: v }); inp.checked = v === value; const lab = h('label', { class: 'rad7' }, inp, l); lab.input = inp; return lab; });
    const grp = { els, get value() { const c = els.find(e => e.input.checked); return c ? c.input.value : null; }, set value(v) { els.forEach(e => (e.input.checked = e.input.value === v)); }, onChange(fn) { els.forEach(e => e.input.addEventListener('change', fn)); }, setDisabled(v, d) { const e = els.find(x => x.input.value === v); if (e) { e.input.disabled = d; e.classList.toggle('dis', d); } } };
    return grp;
  }
  function select(opts, value, o = {}) { // opts: [value] 또는 [[value,label]]
    const el = h('select', { class: 'tb7', disabled: !!o.dis, style: { width: o.w ? o.w + 'px' : '100%' } }, opts.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; const op = h('option', { value: v }, l); if (v === value) op.selected = true; return op; }));
    return el;
  }
  // 글자를 직접 칠 수도 있는 콤보 상자
  let dlSeq = 0;
  function combo(opts, value = '', o = {}) {
    const id = 'dl' + (++dlSeq);
    const inp = h('input', { class: 'tb7', list: id, value, spellcheck: 'false', autocomplete: 'off', style: { width: o.w ? o.w + 'px' : '100%' } });
    const dl = h('datalist', { id }, opts.map(v => h('option', { value: v })));
    const w = h('span', { style: { display: 'inline-block', width: o.w ? o.w + 'px' : '100%' } }, inp, dl);
    Object.defineProperty(w, 'value', { get: () => inp.value, set: v => (inp.value = v) });
    w.input = inp;
    return w;
  }
  function num(v = 0, o = {}) {
    const el = h('input', { class: 'tb7', type: 'number', min: o.min ?? 0, max: o.max, value: v, style: { width: (o.w || 60) + 'px' }, disabled: !!o.dis });
    return el;
  }
  function btn(t, on, o = {}) { const b = h('button', { class: 'btn7' + (o.sm ? ' sm' : '') + (o.def ? ' def' : ''), type: 'button', disabled: !!o.dis, style: o.w ? { minWidth: o.w + 'px' } : null }, t); if (on) b.addEventListener('click', on); return b; }
  function group(title, ...kids) { return h('div', { class: 'grp7' }, title ? h('span', { class: 'gt' }, title) : null, kids); }
  function row(...kids) { return h('div', { class: 'row7' }, kids); }
  function form(pairs, o = {}) { return h('div', { class: 'form7', style: o.cols ? { gridTemplateColumns: o.cols } : null }, pairs.flatMap(([l, c]) => [h('label', { class: 'l' }, l), c])); }
  function label(t, o = {}) { return h('div', { class: o.cls || 'hint7' }, t); }

  // ───────── 탭 ─────────
  function tabs(list, o = {}) {
    const head = h('div', { class: 'tabs7-h' });
    const body = h('div', { class: 'tabs7-b' });
    const T = { el: h('div', { class: 'tabs7' }, head, body), cur: 0 };
    list.forEach((t, i) => { const sp = h('span', {}, t.t); sp.addEventListener('mousedown', () => show(i)); head.append(sp); body.append(t.el); t.el.style.display = 'none'; });
    function show(i) { T.cur = i; [...head.children].forEach((s, k) => s.classList.toggle('on', k === i)); list.forEach((t, k) => (t.el.style.display = k === i ? '' : 'none')); if (o.onShow) o.onShow(i); }
    show(o.start || 0);
    T.show = show;
    return T;
  }

  // ───────── 마법사 ─────────
  // pages: [{welcome: {title, text[]}, final: {title, text[]}} 또는 {head, sub, render(el, ctx), next(ctx): true|문자열(오류)|'skip:n'}]
  function wizard(desk, o) {
    const ctx = o.ctx || {};
    let i = 0;
    const hist = [];
    const win = dialog(desk, { title: o.title, w: o.w || 520, h: o.h || 430, owner: o.owner, bodyClass: 'wiz-wrap', autofocus: false, buttons: [] });
    win.dbody.style.cssText = 'flex:1;display:flex;flex-direction:column;min-height:0';
    const bBack = btn('< 뒤로(B)', () => go(-1)), bNext = btn('다음(N) >', () => go(1), { def: true }), bCancel = btn('취소', () => cancel());
    const bar = h('div', { class: 'dlg-btns' }, bBack, bNext, h('span', { style: { width: '8px' } }), bCancel);
    const sep = h('div', { class: 'wiz-sep' });
    win.body.append(sep, bar);
    win.o.onEnter = () => bNext.click(); win.o.onCancel = () => cancel(); win.o.onEsc = () => cancel();
    const els = o.pages.map(() => null);
    function render() {
      const p = o.pages[i];
      win.dbody.innerHTML = '';
      if (p.welcome || p.final) {
        const W_ = p.welcome || p.final;
        const main = h('div', { class: 'main' }, h('h3', {}, W_.title), (W_.text || []).map(t => h('p', {}, t)));
        if (p.render) p.render(main, ctx);
        win.dbody.append(h('div', { class: 'wiz-welcome' }, h('div', { class: 'side' }), main));
      } else {
        if (!els[i]) { els[i] = h('div', { class: 'wiz-body' }); p.render(els[i], ctx); }
        else if (p.refresh) p.refresh(els[i], ctx);
        win.dbody.append(h('div', { class: 'wiz-head' }, h('div', { class: 'tx' }, h('b', {}, p.head), h('span', {}, p.sub || '')), frag(icon(o.icon || 'wizard'))), els[i]);
      }
      bBack.disabled = hist.length === 0;
      bNext.textContent = p.final || p.finish ? '마침' : '다음(N) >';
      setTimeout(() => { const f = win.dbody.querySelector('input:not([disabled]):not([type=radio]):not([type=checkbox]), select:not([disabled])'); if (f) f.focus(); else bNext.focus(); }, 0);
    }
    async function go(d) {
      if (d < 0) { if (hist.length) { i = hist.pop(); render(); } return; }
      const p = o.pages[i];
      if (p.final) { if (o.onFinish) o.onFinish(ctx); win.close(true); return; }
      if (p.next) {
        const r = await p.next(ctx, els[i]);
        if (r === false) return;
        if (typeof r === 'string' && !r.startsWith('skip:')) { await msg(desk, { title: o.title, text: r, icon: 'warn', owner: win }); return; }
        if (p.finish) { if (o.onFinish) o.onFinish(ctx); win.close(true); return; }
        hist.push(i);
        i = typeof r === 'string' ? +r.slice(5) : i + 1;
      } else { hist.push(i); i++; }
      render();
    }
    function cancel() { win.close(true); if (o.onCancel) o.onCancel(); }
    render();
    win.go = go; win.ctx = ctx;
    return win;
  }

  // 사용자/그룹 고르기 대화 상자 ("사용자 또는 그룹 선택" 모양)
  function pickPrincipal(desk, o) {
    // o: {owner, title, kind: '그룹'|'사용자'|'사용자 또는 그룹', names: () => [{name, type}], onOk(names[])}
    let area;
    return dialog(desk, {
      title: o.title || (o.kind === '그룹' ? '그룹 선택' : '사용자 선택'), w: 460, h: 250, owner: o.owner,
      render: b => {
        area = text('', { multi: true, rows: 3 });
        b.append(label('이 개체 유형 선택(S):', { cls: 'l' }), row(text(o.kind === '그룹' ? '그룹' : '사용자, 그룹 또는 기본 제공 보안 주체', { ro: true }), btn('개체 유형(O)...', null, { dis: true })),
          label('찾을 위치(F):', { cls: 'l' }), row(text(o.loc || 'ICQASERVER', { ro: true }), btn('위치(L)...', null, { dis: true })),
          label('선택할 개체 이름을 입력하십시오(예)(E):', { cls: 'l' }), row(area, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, btn('이름 확인(C)', () => check()), btn('고급(A)...', () => adv()))));
      },
      buttons: [{ t: '확인', def: true, on: () => { const r = check(); if (r === false) return false; o.onOk(r); } }, { t: '취소', cancel: true }],
    });
    function all() { return o.names(); }
    function check() {
      const want = area.value.split(/[;\n]/).map(s => s.trim()).filter(Boolean);
      if (!want.length) return [];
      const out = [];
      for (const w of want) {
        const bare = w.replace(/^.*\\/, '');
        const hit = all().find(x => x.name.toLowerCase() === bare.toLowerCase());
        if (!hit) { msg(desk, { title: '이름을 찾을 수 없음', text: `"${w}" 이름을 가진 개체를 찾을 수 없습니다.\n입력한 개체 이름이 맞는지 확인하십시오.`, icon: 'warn' }); return false; }
        out.push(hit.name);
      }
      area.value = out.map(n => `${o.loc || 'ICQASERVER'}\\${n}`).join('; ');
      return out;
    }
    function adv() {
      let L;
      dialog(desk, {
        title: o.title || '선택', w: 480, h: 360, owner: null,
        render: b => {
          L = list({ cols: [{ t: '이름', w: 200 }, { t: '설명', w: 220 }], rows: [] });
          const box = h('div', { style: { height: '170px', border: '1px solid #828790', background: '#fff', overflow: 'auto', marginTop: '6px' } }, L.el);
          b.append(row(btn('지금 찾기(N)', () => L.set(all().map(x => ({ id: x.name, cells: [x.name, x.desc || ''], icon: x.type === 'group' ? 'group' : 'user' }))))), label('검색 결과(U):', { cls: 'l' }), box);
        },
        buttons: [{ t: '확인', def: true, on: () => { const s = L.selected(); if (s) area.value = (area.value ? area.value + '; ' : '') + s.id; } }, { t: '취소', cancel: true }],
      });
    }
  }

  g.W = { h, frag, Desk, Win, dialog, msg, menu, closeMenus, tree, list, text, ip, chk, radios, select, combo, num, btn, group, row, form, label, tabs, wizard, pickPrincipal };
})(window);
