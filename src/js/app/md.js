/* 해설 글의 아주 작은 서식: **굵게**, `코드`, 줄바꿈. HTML은 모두 이스케이프한 뒤 서식만 다시 입힙니다. */
(function (g) {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const rich = s => String(s ?? '').split(/\n{2,}/).map(p => `<p>${p.split('\n').map(inline).join('<br>')}</p>`).join('');
  g.MD = { esc, inline, rich };
})(window);
