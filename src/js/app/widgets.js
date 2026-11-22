/* 개념 글 안의 그림·계산기 (예전 웹 버전 silgi.js에서 옮김)
 * pins(T568A/B 핀 그림), steps(케이블 만드는 순서 그림), bin2dec(2진수 변환기), chmod(권한 계산기), rtypes(라우터 기출 유형 명령) */
(function (g) {
  'use strict';
  const esc = g.MD.esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const WIRE = {
    wo: { n: '흰주', c: '#f28c28', s: 1 }, o: { n: '주', c: '#f28c28' }, wg: { n: '흰초', c: '#2e9d4a', s: 1 }, g: { n: '초', c: '#2e9d4a' },
    wb: { n: '흰파', c: '#2f6fde', s: 1 }, b: { n: '파', c: '#2f6fde' }, wbr: { n: '흰갈', c: '#8b5a2b', s: 1 }, br: { n: '갈', c: '#8b5a2b' },
  };
  const ORDER = { B: ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'], A: ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'] };
  const wireBg = k => (WIRE[k].s ? `repeating-linear-gradient(135deg,#fff 0 5px,${WIRE[k].c} 5px 9px)` : WIRE[k].c);
  let seq = 0;
  const stripeDefs = id => `<defs>${Object.entries(WIRE).filter(([, w]) => w.s).map(([k, w]) => `<pattern id="${id}-${k}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="#fff"/><rect width="3.4" height="8" fill="${w.c}"/></pattern>`).join('')}</defs>`;
  const fillOf = (id, k) => (WIRE[k].s ? `url(#${id}-${k})` : WIRE[k].c);

  function connectorSVG(std) {
    const id = 'sgw' + (++seq), ord = ORDER[std];
    const wires = ord.map((k, i) => { const x = 28 + i * 30; return `<rect x="${x}" y="40" width="20" height="150" rx="4" fill="${fillOf(id, k)}" stroke="#55606f"/><rect x="${x + 2}" y="44" width="16" height="14" rx="2" fill="#d6a531" stroke="#8a6a1c" stroke-width=".8"/><text x="${x + 10}" y="32" text-anchor="middle" class="pin-n">${i + 1}</text><text x="${x + 10}" y="210" text-anchor="middle" class="pin-l">${WIRE[k].n}</text>`; }).join('');
    return `<svg viewBox="0 0 280 222" role="img" aria-label="T568${std} 배열: ${ord.map((k, i) => `${i + 1}번 ${WIRE[k].n}`).join(', ')}" class="sg-pinsvg">${stripeDefs(id)}<rect x="14" y="36" width="252" height="130" rx="10" fill="rgba(180,200,230,.18)" stroke="#888"/>${wires}<rect x="14" y="166" width="252" height="10" fill="rgba(120,130,150,.35)"/></svg>`;
  }
  const pinsHTML = () => `<div class="sg-pins"><figure><figcaption><b>T568B</b> · 다이렉트 기본</figcaption>${connectorSVG('B')}</figure><figure><figcaption><b>T568A</b> · 크로스의 반대쪽</figcaption>${connectorSVG('A')}</figure></div><p class="sg-cap">커넥터를 <strong>클립(걸쇠)이 아래</strong>, 금색 핀이 위로 보이게 들었을 때 모습입니다. 왼쪽이 1번. 줄무늬 선 = 흰색 바탕에 색 줄.</p>`;

  function stepSVG(i) {
    const id = 'sgs' + (++seq), ord = ORDER.B;
    const jacket = (x, w) => `<rect x="${x}" y="56" width="${w}" height="28" rx="12" fill="#c9ced8" stroke="#8e96a6"/>`;
    const fan = (x1, sp) => ord.map((k, j) => { const y = 70 + (j - 3.5) * sp; return `<path d="M${x1} 70 C ${x1 + 30} 70, ${x1 + 40} ${y}, ${x1 + 80} ${y}" stroke="${WIRE[k].c}" stroke-width="5" fill="none" ${WIRE[k].s ? 'stroke-dasharray="4 3"' : ''}/>`; }).join('');
    const flat = (x1, len) => ord.map((k, j) => `<rect x="${x1}" y="${52 + j * 4.6}" width="${len}" height="4.2" fill="${fillOf(id, k)}" stroke="#5d6676" stroke-width=".3"/>`).join('');
    const ar = `<marker id="${id}-ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#2457c5"/></marker>`;
    const arrow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#2457c5" stroke-width="2.5" marker-end="url(#${id}-ar)"/>`;
    const lab = (x, y, t) => `<text x="${x}" y="${y}" class="st-l" text-anchor="middle">${t}</text>`;
    let gg = '';
    switch (i) {
      case 0: gg = `${jacket(10, 150)}<rect x="160" y="60" width="70" height="20" rx="6" fill="#e3e6ec" stroke="#9aa2b1" stroke-dasharray="3 3"/><path d="M150 40 v60" stroke="#c8382b" stroke-width="2" stroke-dasharray="4 3"/><rect x="128" y="24" width="44" height="18" rx="5" fill="#333a48"/>${lab(150, 18, '탈피기를 한 바퀴')}<path d="M160 108 h70" stroke="#2457c5" stroke-width="1.5"/>${lab(195, 126, '약 2.5~3cm')}`; break;
      case 1: gg = `${jacket(10, 100)}${fan(110, 9)}${lab(200, 126, '꼬임을 풀어 곧게 편다')}`; break;
      case 2: gg = `${jacket(10, 100)}${flat(110, 110)}${lab(165, 126, '흰주·주·흰초·파·흰파·초·흰갈·갈')}`; break;
      case 3: gg = `${jacket(10, 100)}${flat(110, 70)}<path d="M180 40 v60" stroke="#c8382b" stroke-width="2.5"/>${lab(180, 34, '✂ 일자로')}<path d="M110 108 h70" stroke="#2457c5" stroke-width="1.5"/>${lab(145, 126, '1.2~1.5cm 남김')}`; break;
      case 4: gg = `${jacket(10, 120)}${flat(130, 62)}<rect x="118" y="40" width="96" height="62" rx="6" fill="rgba(170,200,240,.25)" stroke="#8aa0c0"/><rect x="186" y="44" width="24" height="54" fill="#d6a531" opacity=".55"/>${lab(166, 120, '선 끝이 맨 앞까지 · 겉피복도 안으로')}${arrow(40, 30, 105, 30)}${lab(70, 22, '밀어 넣기')}`; break;
      case 5: gg = `${jacket(10, 110)}<rect x="120" y="44" width="70" height="52" rx="6" fill="rgba(170,200,240,.35)" stroke="#8aa0c0"/><path d="M110 18 L200 18 L210 40 L100 40 z" fill="#2e3646"/><path d="M110 122 L200 122 L210 100 L100 100 z" fill="#2e3646"/>${arrow(155, 4, 155, 16)}${arrow(155, 136, 155, 124)}${lab(250, 74, '꽉! 2번')}`; break;
      case 6: gg = `<rect x="14" y="30" width="110" height="80" rx="10" fill="#f4f6fa" stroke="#9aa2b1"/><rect x="156" y="30" width="110" height="80" rx="10" fill="#f4f6fa" stroke="#9aa2b1"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(j => `<circle cx="${30 + j * 11.5}" cy="58" r="4" fill="#2bd46b"/><circle cx="${172 + j * 11.5}" cy="58" r="4" fill="#2bd46b"/>`).join('')}${lab(69, 98, 'MASTER')}${lab(211, 98, 'REMOTE')}${lab(140, 128, '다이렉트: 1-1 … 8-8 차례로 켜짐')}`; break;
    }
    return `<svg viewBox="0 0 280 140" class="sg-stepsvg" aria-hidden="true"><defs>${ar}</defs>${stripeDefs(id)}${gg}</svg>`;
  }
  const stepsHTML = steps => `<div class="sg-steps">${steps.map((s, i) => `<div class="sg-step"><div class="sg-step-n">${i + 1}</div><div><h3>${esc(s.t)}</h3>${stepSVG(i)}<p>${s.d}</p></div></div>`).join('')}</div>`;

  function mountBin(el) {
    el.innerHTML = `<div class="calc"><input class="input mono" value="10101100.00010000.10010110.01110011" aria-label="2진수 IP" style="width:100%"><div class="out"></div></div>`;
    const input = $('input', el), out = $('.out', el);
    const run = () => {
      const s = input.value.trim(), parts = s.split('.');
      if (parts.length === 4 && parts.every(p => /^[01]{1,8}$/.test(p))) { const dec = parts.map(p => parseInt(p, 2)); out.innerHTML = `<div>10진수 IP<b>${dec.join('.')}</b></div>${parts.map((p, i) => `<div>${i + 1}번째 옥텟<b>${p.padStart(8, '0')} = ${dec[i]}</b></div>`).join('')}`; }
      else if (parts.length === 4 && parts.every(p => /^\d{1,3}$/.test(p) && +p <= 255)) out.innerHTML = `<div>2진수 IP<b>${parts.map(p => (+p).toString(2).padStart(8, '0')).join('.')}</b></div>`;
      else if (/^\/?\d{1,2}$/.test(s) && +s.replace('/', '') <= 32) { const n = +s.replace('/', ''); const m = n ? (0xFFFFFFFF << (32 - n)) >>> 0 : 0; out.innerHTML = `<div>/${n} 마스크<b>${[24, 16, 8, 0].map(k => (m >>> k) & 255).join('.')}</b></div><div>호스트 수<b>${n >= 31 ? '-' : 2 ** (32 - n) - 2}개</b></div><div>블록 크기<b>${2 ** ((32 - n) % 8 || 8)}</b></div>`; }
      else out.innerHTML = '<div style="grid-column:1/-1"><b>2진수 IP(점 4개), 10진수 IP, 또는 /27 같은 비트 수를 넣어 보세요</b></div>';
    };
    input.addEventListener('input', run); run();
  }
  function mountChmod(el) {
    const v = [7, 5, 5], who = ['소유자(u)', '그룹(g)', '기타(o)'], bits = [['r', 4, '읽기'], ['w', 2, '쓰기'], ['x', 1, '실행']];
    const paint = () => {
      const sym = v.map(n => bits.map(([c, b]) => (n & b ? c : '-')).join('')).join('');
      el.innerHTML = `<div class="calc"><div class="sg-chgrid">${who.map((w, i) => `<div class="sg-chrow"><span>${w}</span>${bits.map(([c, b, l]) => `<button class="chip" data-i="${i}" data-b="${b}" aria-pressed="${!!(v[i] & b)}">${c} ${l}</button>`).join('')}<b>${v[i]}</b></div>`).join('')}</div><div class="out"><div>숫자<b>${v.join('')}</b></div><div>기호<b>${sym}</b></div><div>명령<b>chmod ${v.join('')} 파일</b></div></div></div>`;
      $$('.chip', el).forEach(b => b.addEventListener('click', () => { v[+b.dataset.i] ^= +b.dataset.b; paint(); }));
    };
    paint();
  }
  function rtypesHTML(list) {
    const groups = {};
    list.forEach(r => (groups[r.g] = groups[r.g] || []).push(r));
    let html = '';
    for (const [gname, items] of Object.entries(groups)) {
      html += `<h3>${esc(gname)}</h3><div class="sg-rtypes">`;
      for (const r of items) {
        const R = g.ROUTER.createRouter(); const lines = [];
        for (const c of r.c) {
          if (/^show /.test(c) && R.st.mode !== 'priv' && r.c.filter(x => /^show /.test(x)).length > 1) R.st.mode = 'priv';
          lines.push(R.prompt() + c); R.exec(c);
          if (R.st.wait === 'copy') { lines.push('Destination filename [startup-config]?  ← Enter'); R.st.wait = null; }
        }
        html += `<div class="sg-rtype card"><b>${esc(r.t)}</b><pre>${esc(lines.join('\n'))}</pre><p class="muted small">${esc(r.n)}</p></div>`;
      }
      html += '</div>';
    }
    return html;
  }
  // 개념 글 HTML 안의 [data-sg-widget] 자리에 그림을 넣습니다.
  function mount(root, info) {
    $$('[data-sg-widget]', root).forEach(el => {
      const w = el.dataset.sgWidget;
      try {
        if (w === 'pins') el.innerHTML = pinsHTML();
        else if (w === 'steps') el.innerHTML = stepsHTML(info.steps || []);
        else if (w === 'bin2dec') mountBin(el);
        else if (w === 'chmod') mountChmod(el);
        else if (w === 'rtypes') el.innerHTML = rtypesHTML(info.rtypes || []);
      } catch (e) { el.innerHTML = '<p class="muted">이 그림을 불러오지 못했어요.</p>'; console.error(e); }
    });
    // 바깥 링크는 기본 브라우저로 엽니다.
    $$('a[href^="http"]', root).forEach(a => a.addEventListener('click', e => { e.preventDefault(); if (g.api) g.api.openLink(a.href); else window.open(a.href); }));
  }
  g.WIDGETS = { mount, WIRE, ORDER, wireBg };
})(window);
