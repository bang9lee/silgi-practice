/* 창 틀: macOS 모양 신호등 단추, 사이드바 접기, AI 단추 */
(function (g) {
  'use strict';
  const $ = s => document.querySelector(s);
  const B = document.body;
  if (g.api && g.api.win) {
    $('#traffic').addEventListener('click', e => { const b = e.target.closest('[data-win]'); if (b) g.api.win(b.dataset.win); });
    g.api.onMax(v => B.classList.toggle('maximized', v));
  } else {
    B.classList.add('no-frame'); // 브라우저로 열면 창 단추가 필요 없습니다
  }
  // 사이드바: 문제 풀이 화면에서는 기본으로 접고, 직접 누르면 그 화면에서는 그대로 둡니다.
  const LS = 'silgi.sb.hidden';
  let manual = null;
  function apply() {
    const work = B.classList.contains('work-mode');
    const hide = manual != null ? manual : work ? true : localStorage.getItem(LS) === '1';
    B.classList.toggle('sb-hidden', hide);
  }
  $('#sb-toggle').addEventListener('click', () => {
    const now = !B.classList.contains('sb-hidden');
    manual = now;
    if (!B.classList.contains('work-mode')) { localStorage.setItem(LS, now ? '1' : '0'); manual = null; }
    apply();
  });
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === '\\') { e.preventDefault(); $('#sb-toggle').click(); } });
  $('#ai-toggle').addEventListener('click', () => g.AI && g.AI.toggle());
  g.SHELL = { route(work) { const was = B.classList.contains('work-mode'); B.classList.toggle('work-mode', !!work); if (was !== !!work) manual = null; apply(); } };
  apply();
})(window);
