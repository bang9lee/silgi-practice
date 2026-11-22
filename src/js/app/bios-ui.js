/* CMOS Setup 연습 화면 — 키보드로만 조작합니다 (↑↓←→, Enter, Esc, PgUp/PgDn, +/-, F10, Y/N).
 * 채점은 저장(F10 또는 Save and Exit Setup → Y)한 값으로만 합니다. */
(function (g) {
  'use strict';
  const h = g.W.h, esc = g.MD.esc;

  function mount(el, q) {
    const B = q.biosDef;
    const items = Object.values(B.menus).flatMap(m => m.items || []);
    const defaults = () => { const v = {}; items.forEach(i => { if (i.opts) v[i.id] = i.def; else if (i.kind) v[i.id] = i.def; }); return v; };
    const S = { vals: defaults(), pw: { su: '', us: '' }, saved: null, savedPw: null, view: 'main', mi: 0, col: 0, si: 0, pop: null, dlg: null, locked: false, flash: '', busy: '' };

    // 화면 배치는 ICQA 에뮬레이터 BIOS 창과 같은 800×600 좌표(픽셀)를 씁니다.
    const COPY = 'CMOS Setup Utility - Copyright (c) 2015 Rainbow Korea Software';
    // 메인 화면 아래 도움말 줄: 에뮬레이터 문구 (없으면 자료의 help)
    const EMU_HELP = { std: 'Time, Date, Hard Disk Type ...', adv: 'Virus Protection, Boot Sequence ...', chip: 'AT clock, DRAM timings ...', per: 'Onboard IO, IRQ, DMA Assignment ...', pwr: 'Sleep timer, Suspend timer ...', pnp: 'IRQ Settings, Latency Timers ...', health: 'Display CPU/System Temperature, Fan speed', freq: "Change CPU's Clock and Voltage", save: 'Save Data to CMOS', quit: 'Abandon all Data' };
    const frame = h('div', { class: 'bios-frame' }, h('div', { class: 'bf-top' }, h('img', { class: 'bf-x', src: 'img/emu/biosrt/close.png', alt: '' })));
    const scr = h('div', { class: 'bios', tabindex: 0, 'aria-label': 'CMOS Setup 화면 (키보드로 조작)' });
    frame.append(scr);
    const ko = h('div', { class: 'bios-ko', html: '<b>용어 풀이</b> · ' + B.glossary });
    el.append(h('div', { class: 'bios-host' }, h('div', { class: 'bios-col' }, frame, ko)));

    const menuAt = () => (S.col === 0 ? B.main.left : B.main.right)[S.mi];
    const subItems = () => B.menus[S.view].items;
    const valText = i => (i.ro ? i.ro : i.kind ? S.vals[i.id] : i.opts[S.vals[i.id]]);
    // 에뮬레이터의 사각형·선(PowerPacks Shape)과 같은 좌표로 그립니다.
    const box = (x, y, w, hh) => `<i class="bx" style="left:${x}px;top:${y}px;width:${w + 1}px;height:${hh + 1}px"></i>`;
    const hl = (x1, x2, y) => `<i class="bl" style="left:${x1}px;top:${y}px;width:${x2 - x1 + 1}px;height:1px"></i>`;
    const vl = (x, y1, y2) => `<i class="bl" style="left:${x}px;top:${y1}px;width:1px;height:${y2 - y1 + 1}px"></i>`;
    const at = (x, y, w, hh) => `left:${x}px;top:${y}px;width:${w}px;height:${hh}px`;

    function paint() {
      let html = '';
      if (S.view === 'main') {
        html += `<div class="t1 mid" style="${at(0, 0, 800, 36)}">${COPY}</div>` + box(8, 43, 783, 541) + box(12, 48, 775, 531) + vl(400, 50, 444) + hl(12, 788, 445) + hl(12, 786, 496);
        const col = (ids, c) => ids.map((id, i) => `<div class="mi${S.col === c && S.mi === i ? ' on' : ''}" style="${at(c ? 426 : 36, 80 + 50 * i, 345, 22)}">${esc(B.menus[id].name)}</div>`).join('');
        html += col(B.main.left, 0) + col(B.main.right, 1);
        html += `<div class="keys" style="${at(36, 454, 726, 36)}">Esc   : Quit                                                ↑ ↓ → ←   : Select Item\nF10   : Save and Exit Setup</div>`;
        html += `<div class="help1 mid" style="${at(36, 501, 726, 71)}">${esc(S.flash || EMU_HELP[menuAt()] || B.menus[menuAt()].help || '')}</div>`;
      } else {
        const list = subItems();
        const cur = list[S.si];
        html += `<div class="t1 mid" style="${at(0, 0, 800, 57)}">${COPY}<br>${esc(B.menus[S.view].name)}</div>` + box(11, 62, 778, 497) + box(16, 67, 768, 487) + vl(562, 69, 553) + hl(562, 784, 119);
        html += list.map((i, k) => `<div class="it${i.ro ? ' ro' : ''}${k === S.si ? ' on' : ''}"><span class="k" style="${at(42, 72 + 24 * k, 224, 22)}">${esc(i.name)}</span><span class="v" style="${at(310, 72 + 24 * k, 239, 22)}">${esc(valText(i))}</span></div>`).join('');
        html += `<div class="ht mid" style="${at(572, 78, 205, 30)}">Item Help</div><div class="ml" style="${at(574, 129, 203, 36)}">Menu Level    ▶</div><div class="tx" style="${at(572, 165, 203, 373)}">${esc(S.flash || (cur && cur.help) || '')}</div>`;
        html += `<div class="foot mid" style="${at(36, 567, 726, 24)}">↑ ↓ → ← Move      Enter:Select     PU/PD:Value     F10:Save      ESC:Exit</div>`;
      }
      if (S.pop) {
        const it = items.find(i => i.id === S.pop.id);
        html += `<div class="pop">${box(4, 4, 492, 392)}${box(8, 8, 484, 384)}${hl(8, 492, 63)}${hl(8, 492, 337)}<div class="pt" style="${at(13, 15, 472, 42)}">${esc(it.name)}</div>`
          + `<div class="po" style="${at(19, 77, 466, 250)}">${it.opts.map((o, k) => `<div class="${k === S.pop.i ? 'on' : ''}" style="top:${10 + 35 * k}px"><span>${esc(o)}</span><b>... [${k === S.pop.i ? '■' : '　'}]</b></div>`).join('')}<div style="top:${10 + 35 * it.opts.length}px;height:10px"></div></div>`
          + `<div class="pf mid" style="${at(16, 340, 469, 42)}">↑ ↓ : Move   ENTER : Accept   ESC : Abort</div></div>`;
      }
      // 빨간 알림 상자 (Y/N, 암호, 날짜·시간 입력, Saving . . .)
      const msg = (t, c) => `<div class="yn">${box(7, 11, 380, 73)}<div class="ym${c ? ' ' + c : ''}" style="${at(17, 21, 360, 57)}">${t}</div></div>`;
      if (S.dlg) html += msg(`<span>${esc(S.dlg.q)}</span>${S.dlg.input ? `<input type="text" maxlength="${S.dlg.max || 10}" value="${esc(S.dlg.val || '')}" spellcheck="false" autocomplete="off">` : `<span>${esc(S.dlg.yn)}</span>`}`);
      else if (S.busy) html += msg(esc(S.busy), 'c');
      scr.innerHTML = html;
      const po = scr.querySelector('.pop .po'), on = po && po.querySelector('.on');
      if (on) { if (on.offsetTop + 35 > po.scrollTop + po.clientHeight) po.scrollTop = on.offsetTop + 35 - po.clientHeight; else if (on.offsetTop - 10 < po.scrollTop) po.scrollTop = Math.max(0, on.offsetTop - 10); }
      const inp = scr.querySelector('.yn input');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); inp.addEventListener('keydown', dlgInputKey); inp.addEventListener('input', () => (S.dlg.val = inp.value)); }
      else if (document.activeElement !== scr && el.isConnected) scr.focus({ preventScroll: true });
    }
    // "Saving . . ." 같은 짧은 알림 (키 입력은 막지 않음)
    let busyT = 0;
    const busy = t => { S.busy = t; clearTimeout(busyT); busyT = setTimeout(() => { S.busy = ''; if (el.isConnected) paint(); }, 700); };
    // Y/N 확인 상자
    const ask = (q2, def, then) => { S.dlg = { q: q2 + ' (Y/N)? ', yn: def, then }; paint(); };
    function dlgInputKey(e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); S.dlg = null; paint(); return; }
      if (e.key === 'Enter') { e.preventDefault(); const d = S.dlg; S.dlg = null; d.then(e.target.value); }
    }
    function act(a) {
      if (a === 'failsafe' || a === 'optimized') ask(a === 'failsafe' ? 'Load Fail-Safe Defaults' : 'Load Optimized Defaults', 'N', y => { if (y) { S.vals = defaults(); S.flash = 'Defaults loaded (아직 저장 전)'; busy('Loading . . .'); } paint(); });
      else if (a === 'save') ask('Save and Exit Setup', 'Y', y => { if (y) save(); else paint(); });
      else if (a === 'quit') ask('Exit Without Saving', 'Y', y => { if (y) { S.vals = S.saved ? { ...S.saved } : defaults(); S.pw = S.savedPw ? { ...S.savedPw } : { su: '', us: '' }; S.view = 'main'; S.flash = '저장하지 않고 나갔습니다. 바꾼 값은 사라졌습니다.'; } paint(); });
      else if (a === 'supw' || a === 'uspw') {
        const which = a === 'supw' ? 'su' : 'us';
        S.dlg = { q: 'Enter Password : ', input: true, pw: true, max: 8, then: p1 => {
          if (!p1) { S.pw[which] = ''; S.flash = 'PASSWORD DISABLED !!! (아직 저장 전)'; paint(); return; }
          S.dlg = { q: 'Confirm Password : ', input: true, pw: true, max: 8, then: p2 => { if (p1 === p2) { S.pw[which] = p1; S.flash = (which === 'su' ? 'Supervisor' : 'User') + ' Password set (아직 저장 전)'; } else S.flash = 'Passwords do not match (두 암호가 다릅니다)'; paint(); } };
          paint();
        } };
        paint();
      }
    }
    function save() {
      S.saved = { ...S.vals }; S.savedPw = { ...S.pw }; S.view = 'main'; S.flash = 'CMOS에 저장하고 다시 시작했습니다. (채점에 반영됨)';
      busy('Saving . . .'); paint();
    }
    function editKind(it) {
      const fmt = it.kind === 'date' ? 'mm/dd/yyyy' : 'hh:mm:ss';
      S.dlg = { q: `${it.kind === 'date' ? 'Date' : 'Time'} (${fmt}): `, input: true, max: 10, val: S.vals[it.id], then: v => {
        v = v.trim();
        const ok = it.kind === 'date' ? /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d\d$/.test(v) : /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v);
        if (ok) S.vals[it.id] = v; else S.flash = `형식이 틀렸습니다: ${fmt}`;
        paint();
      } };
      paint();
    }
    const nextEditable = (from, d) => { const L = subItems(); let i = from; for (let k = 0; k < L.length; k++) { i = (i + d + L.length) % L.length; if (!L[i].ro) return i; } return from; };

    scr.addEventListener('keydown', e => {
      if (S.locked) return;
      const k = e.key;
      if (S.busy) { S.busy = ''; clearTimeout(busyT); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'PageUp', 'PageDown', 'F10', '+', '-', 'y', 'Y', 'n', 'N', ' '].includes(k)) e.preventDefault();
      if (S.dlg && !S.dlg.input) {
        if (k === 'y' || k === 'Y') { S.dlg.yn = 'Y'; paint(); }
        else if (k === 'n' || k === 'N') { S.dlg.yn = 'N'; paint(); }
        else if (k === 'Enter') { const d = S.dlg; S.dlg = null; d.then(d.yn === 'Y'); }
        else if (k === 'Escape') { S.dlg = null; paint(); }
        return;
      }
      if (S.pop) {
        const it = items.find(i => i.id === S.pop.id);
        if (k === 'ArrowUp') S.pop.i = (S.pop.i - 1 + it.opts.length) % it.opts.length;
        else if (k === 'ArrowDown') S.pop.i = (S.pop.i + 1) % it.opts.length;
        else if (k === 'Enter') { S.vals[it.id] = S.pop.i; S.pop = null; }
        else if (k === 'Escape') S.pop = null;
        paint(); return;
      }
      S.flash = '';
      if (k === 'F10') { act('save'); return; }
      if (S.view === 'main') {
        const colLen = (S.col === 0 ? B.main.left : B.main.right).length;
        if (k === 'ArrowUp') S.mi = (S.mi - 1 + colLen) % colLen;
        else if (k === 'ArrowDown') S.mi = (S.mi + 1) % colLen;
        else if (k === 'ArrowLeft' || k === 'ArrowRight') { S.col = 1 - S.col; S.mi = Math.min(S.mi, (S.col === 0 ? B.main.left : B.main.right).length - 1); }
        else if (k === 'Enter') { const m = B.menus[menuAt()]; if (m.act) { act(m.act); return; } S.view = menuAt(); S.si = nextEditable(-1, 1); }
        else if (k === 'Escape') { act('quit'); return; }
        paint(); return;
      }
      const L = subItems(), it = L[S.si];
      if (k === 'ArrowUp' || k === 'ArrowLeft') S.si = nextEditable(S.si, -1);
      else if (k === 'ArrowDown' || k === 'ArrowRight') S.si = nextEditable(S.si, 1);
      else if (k === 'Escape') S.view = 'main';
      else if (k === 'Enter' && it) { if (it.kind) { editKind(it); return; } if (it.opts) S.pop = { id: it.id, i: S.vals[it.id] }; }
      else if ((k === 'PageUp' || k === '+') && it && it.opts) S.vals[it.id] = (S.vals[it.id] - 1 + it.opts.length) % it.opts.length;
      else if ((k === 'PageDown' || k === '-') && it && it.opts) S.vals[it.id] = (S.vals[it.id] + 1) % it.opts.length;
      paint();
    });
    scr.addEventListener('mousedown', e => { if (!e.target.matches('input')) { e.preventDefault(); scr.focus(); } });
    paint();
    setTimeout(() => scr.focus(), 0);

    function flat() {
      if (!S.saved) return { saved: false };
      const o = { saved: true };
      items.forEach(i => { if (i.opts) o[i.id] = i.opts[S.saved[i.id]]; else if (i.kind) o[i.id] = S.saved[i.id]; });
      o.supw = S.savedPw.su; o.uspw = S.savedPw.us;
      return o;
    }
    const labels = () => { const o = { supw: 'Set Supervisor Password (관리자 암호)', uspw: 'Set User Password (사용자 암호)', saved: '저장(F10 → Y)' }; items.forEach(i => (o[i.id] = i.name)); return o; };
    return { flat, labels, saved: () => !!S.saved, lock: () => { S.locked = true; }, _S: S, _key: k => scr.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })) };
  }
  g.BIOSUI = { mount };
})(window);
