/* 라우터 명령 창 화면 (엔진은 core/router-engine.js)
 * 창 모양은 ICQA 에뮬레이터의 명령 창(CMDC: Windows 7 베이직 창틀, 검은 바탕, 흰 굴림체)을 따릅니다. */
(function (g) {
  'use strict';
  const h = g.W.h, esc = g.MD.esc;
  function mount(el, q) {
    const R = g.ROUTER.createRouter();
    let locked = false;
    const outEl = h('div', { class: 'term-out', 'aria-live': 'polite' });
    const pr = h('span', { class: 'pr' });
    const inp = h('input', { 'aria-label': '라우터 명령 입력', autocomplete: 'off', spellcheck: 'false' });
    const term = h('div', { class: 'term' }, outEl, h('form', { class: 'term-in' }, pr, inp));
    const win = h('div', { class: 'emu-con' },
      h('div', { class: 'ec-top' }, h('img', { class: 'ec-ic', src: 'img/emu/biosrt/cmd-icon.png', alt: '' }), h('span', { class: 'ec-t' }, 'Router Console'), h('img', { class: 'ec-x', src: 'img/emu/biosrt/close.png', alt: '' })),
      term);
    const hist = []; let hp = -1;
    R.out.push(['Router con0 is now available', ''], ['', ''], ['Press RETURN to get started.', ''], ['', ''], ['? 를 치면 지금 모드에서 쓸 수 있는 명령이 나옵니다. Tab은 자동 완성.', 'h'], ['', '']);
    function paint() {
      outEl.innerHTML = R.out.map(([l, c]) => `<div class="${c}">${esc(l) || '&nbsp;'}</div>`).join('');
      pr.textContent = R.st.wait === 'copy' ? 'Destination filename [startup-config]? ' : R.prompt();
      term.scrollTop = term.scrollHeight;
    }
    function run(v) { if (locked) return; R.exec(v); if (v.trim()) { hist.push(v); hp = -1; } paint(); }
    term.querySelector('form').addEventListener('submit', e => { e.preventDefault(); const v = inp.value; inp.value = ''; run(v); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (!hist.length) return; hp = hp < 0 ? hist.length - 1 : Math.max(0, hp - 1); inp.value = hist[hp]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hp < 0) return; hp++; if (hp >= hist.length) { hp = -1; inp.value = ''; } else inp.value = hist[hp]; }
      else if (e.key === 'Tab') { e.preventDefault(); inp.value = R.tabComplete(inp.value); }
      else if (e.key === '?' && !locked) { e.preventDefault(); const v = inp.value + '?'; R.exec(v); paint(); }
    });
    win.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
    const keys = h('div', { class: 'term-keys' }, ['en', 'conf t', 'int fa0/0', 'int s2/0', 'line vty 0 4', 'line con 0', 'no shutdown', 'exit', 'end', 'copy r s'].map(k => h('button', { type: 'button', onclick: () => { inp.value = (inp.value && !/\s$/.test(inp.value) ? inp.value + ' ' : inp.value) + k; inp.focus(); } }, k)),
      h('button', { type: 'button', onclick: () => { if (locked) return; R.out.push([R.prompt() + 'show running-config (버튼으로 보기 · 채점에는 안 들어감)', 'c']); R.configText(R.st, false).split('\n').forEach(l => R.out.push([l, ''])); paint(); } }, 'show running-config'),
      h('button', { type: 'button', style: { marginLeft: 'auto' }, onclick: () => { if (locked) return; R.reset(); R.out.push(['장비를 처음 상태로 되돌렸습니다.', 'h']); paint(); inp.focus(); } }, '장비 초기화'));
    el.append(h('div', { class: 'term-wrap emu-rt' }, h('div', { class: 'muted small' }, '에뮬레이터 명령 창 모양의 라우터 연습창입니다. 명령 순서와 저장(copy r s → Enter)을 익히세요. ? 도움말 · Tab 자동 완성 · ↑↓ 이전 명령'), win, keys));
    paint();
    setTimeout(() => inp.focus(), 0);
    return { flat: () => g.ROUTER.flatten(R.st.saved), saved: () => !!R.st.saved, lock: () => { locked = true; inp.disabled = true; }, engine: R };
  }
  g.ROUTERUI = { mount };
})(window);
