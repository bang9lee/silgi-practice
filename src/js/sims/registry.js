/* 가상 화면 등록소 + 공통 도우미
 * SIMS.def(이름, { title, mount(desk, q) → { state() → 평평한 상태, open() } })
 * 상태(st)는 창과 따로 살아 있어서, 창을 닫았다가 [다시 열기]해도 설정이 남습니다. 채점은 확인/적용/마침으로 반영된 상태만 봅니다. */
(function (g) {
  'use strict';
  const { h, W } = { h: g.W.h, W: g.W };
  const SIMS = { list: {} };
  SIMS.def = (name, def) => { SIMS.list[name] = def; };
  SIMS.get = name => SIMS.list[name];
  const clone = o => JSON.parse(JSON.stringify(o));
  SIMS.clone = clone;

  // 주 창을 닫으면 바탕에 [다시 열기] 상자를 띄웁니다.
  SIMS.closed = (desk, open, what) => {
    const box = h('div', { class: 'reopen' }, h('p', {}, `${what || '창'}을(를) 닫았습니다. 바꾼 설정은 그대로 남아 있습니다.`), W.btn('다시 열기', () => { box.remove(); open(); }, { def: true }));
    desk.el.append(box);
  };

  // MMC(관리 콘솔) 모양 창: 메뉴 줄, 도구 모음, 왼쪽 트리, 오른쪽 내용, 상태 표시줄
  // o: title, icon, w, h, nodes(), open[], sel, render(node, el), menu(node) → items, status(node), leftW, onClose
  SIMS.mmc = (desk, o) => {
    let tree;
    const cur = () => tree && tree.node(tree.sel);
    const win = new W.Win(desk, {
      title: o.title, icon: o.icon, w: o.w || 860, h: o.h || 600, status: '',
      menus: o.menus ? o.menus(() => api, () => win) : [
        { label: '파일(F)', items: () => [{ t: '끝내기(X)', on: () => win.close() }] },
        { label: '동작(A)', items: () => { const n = cur(); const it = n && o.menu ? o.menu(n) : null; return it && it.length ? it : [{ t: '도움말(H)', dis: true }]; } },
        { label: '보기(V)', items: () => [{ t: '새로 고침(F)', on: () => api.refresh() }] },
        { label: '도움말(H)', items: () => [{ t: '도움말 항목(H)', dis: true }] },
      ],
      toolbar: o.toolbar === undefined ? true : o.toolbar, onClose: o.onClose,
    });
    const left = h('div', { class: 'mmc-left', style: o.leftW ? { width: o.leftW + 'px' } : null });
    const right = h('div', { class: 'mmc-right' });
    win.body.append(h('div', { class: 'mmc' }, left, right));
    function ctx(items, e) { if (!items || !items.length) return; const d = desk.el.getBoundingClientRect(); W.menu(desk, e.clientX - d.left, e.clientY - d.top, items); }
    tree = W.tree({ nodes: o.nodes, open: o.open, onSelect: () => paintRight(), onContext: (n, e) => ctx(o.menu && o.menu(n), e) });
    left.append(tree.el);
    function paintRight() { right.innerHTML = ''; const n = cur(); if (n && o.render) o.render(n, right, api); win.setStatus(n && o.status ? o.status(n) : ''); }
    const api = { win, tree, right, ctx, refresh() { const s = tree.sel; tree.paint(); if (s && tree.node(s)) tree.sel = s; else tree.sel = null; tree.paint(); paintRight(); }, select(id) { tree.select(id); } };
    if (o.sel) tree.select(o.sel); else paintRight();
    return api;
  };

  // IP 유틸
  const IP = {
    ok: s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || '') && s.split('.').every(x => +x <= 255),
    toInt: s => s.split('.').reduce((a, x) => (a * 256) + (+x), 0) >>> 0,
    fromInt: n => [24, 16, 8, 0].map(k => (n >>> k) & 255).join('.'),
    maskOk: s => { if (!IP.ok(s)) return false; const b = s.split('.').map(x => (+x).toString(2).padStart(8, '0')).join(''); return /^1+0*$/.test(b); },
    prefix: m => m.split('.').map(x => (+x).toString(2).split('').filter(c => c === '1').length).reduce((a, b) => a + b, 0),
    maskOf: n => IP.fromInt(n ? (0xFFFFFFFF << (32 - n)) >>> 0 : 0),
    classMask: ip => { const a = +String(ip).split('.')[0]; return a < 128 ? '255.0.0.0' : a < 192 ? '255.255.0.0' : a < 224 ? '255.255.255.0' : ''; },
    net: (ip, m) => IP.fromInt((IP.toInt(ip) & IP.toInt(m)) >>> 0),
    bcast: (ip, m) => IP.fromInt((IP.toInt(ip) | (~IP.toInt(m) >>> 0)) >>> 0),
    same: (a, b, m) => IP.net(a, m) === IP.net(b, m),
  };
  SIMS.IP = IP;
  g.SIMS = SIMS;
})(window);
