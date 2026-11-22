/* 가상 화면: 컴퓨터 관리 → 디스크 관리 — 새 단순 볼륨 마법사, 드라이브 문자 변경, 포맷, 볼륨 삭제
 * 채점 키: vol.<문자>.exists / fs / label / sizeMB / quick(마지막 포맷이 빠른 포맷이었는지) / compress,  disk<n>.unallocMB,  letters[]  */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  // 파티션: {letter, label, fs, size(MB), sys, type: 'primary'|'free'}
  const blank = () => ({ disks: [
    { n: 0, size: 1024000, parts: [{ letter: 'C', label: '', fs: 'NTFS', size: 256000, sys: '정상(부팅, 페이지 파일, 크래시 덤프, 주 파티션)', type: 'primary' }, { type: 'free', size: 768000 }] },
    { n: 1, size: 512000, parts: [{ letter: 'D', label: 'DATA', fs: 'FAT32', size: 30720, sys: '정상(주 파티션)', type: 'primary' }, { type: 'free', size: 481280 }] },
  ] });
  const gb = mb => (mb / 1024).toFixed(2) + 'GB'; // 에뮬레이터 표기: 250.00GB
  function flat(st) {
    const o = { letters: [] };
    st.disks.forEach(d => {
      o[`disk${d.n}.unallocMB`] = d.parts.filter(p => p.type === 'free').reduce((a, p) => a + p.size, 0);
      d.parts.filter(p => p.type === 'primary' && p.letter).forEach(p => { o.letters.push(p.letter); Object.assign(o, { [`vol.${p.letter}.exists`]: true, [`vol.${p.letter}.fs`]: p.fs || 'RAW', [`vol.${p.letter}.label`]: p.label, [`vol.${p.letter}.sizeMB`]: p.size, [`vol.${p.letter}.quick`]: !!p.quick, [`vol.${p.letter}.compress`]: !!p.compress, [`vol.${p.letter}.disk`]: d.n }); });
    });
    return o;
  }
  function label(k) {
    const m = k.match(/^vol\.(\w)\.(\w+)$/); if (m) return `${m[1]}: 볼륨 ${({ exists: '있음', fs: '파일 시스템', label: '볼륨 레이블', sizeMB: '크기(MB)', quick: '빠른 포맷', compress: '파일 및 폴더 압축', disk: '디스크 번호' })[m[2]] || m[2]}`;
    const d = k.match(/^disk(\d)\.unallocMB$/); if (d) return `디스크 ${d[1]} 할당되지 않은 공간(MB)`;
    return k === 'letters' ? '사용 중인 드라이브 문자' : k;
  }
  const merge = d => { const out = []; d.parts.forEach(p => { const last = out[out.length - 1]; if (p.type === 'free' && last && last.type === 'free') last.size += p.size; else out.push(p); }); d.parts = out; };

  SIMS.def('diskmgmt', {
    title: '디스크 관리', label, blank, flat,
    mount(desk, q) {
      const st = blank();
      if (q && q.init && q.init.disks) st.disks = SIMS.clone(q.init.disks);
      let M, sel = null; // sel = [디스크 번호, 파티션 번호]
      const used = () => st.disks.flatMap(d => d.parts.map(p => p.letter)).filter(Boolean);
      const freeLetters = (keep) => 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => !used().includes(l) || l === keep);
      const RD = () => SIMS.rdSkin;
      const volName = p => (p.letter ? `${p.label || '새 볼륨'} (${p.letter}:)` : p.label || '(이름 없음)');
      function render(n, el) {
        if (n.id !== 'dm') { el.append(h('div', { class: 'feat-body', style: { paddingTop: '20px' } }, h('p', {}, '이 연습 프로그램에서는 [디스크 관리]만 다룹니다.'))); return; }
        el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.background = '#f0f0f0';
        const vols = st.disks.flatMap(d => d.parts.map((p, i) => ({ d, p, i }))).filter(x => x.p.type === 'primary');
        // 에뮬레이터 목록: [아이콘] 볼륨 | (문자) | 레이아웃 | 형식 | 파일 시스템 | 상태 | 용량 | 사용 가능한 공간
        const L = W.list({ cols: [{ t: '', w: 45 }, { t: '볼륨', w: 100 }, { t: '', w: 40 }, { t: '레이아웃', w: 100 }, { t: '형식', w: 80 }, { t: '파일 시스템', w: 100 }, { t: '상태', w: 305 }, { t: '용량', w: 90 }, { t: '사용 가능한 공간', w: 110 }],
          rows: vols.map(({ d, p, i }) => ({ id: `${d.n}:${i}`, cells: [h('img', { src: RD().src('dk-vol'), alt: '', draggable: 'false' }), p.letter ? p.label || '새 볼륨' : p.label || '(이름 없음)', p.letter ? `(${p.letter}:)` : '', '단순', '기본', p.fs || 'RAW', p.sys, gb(p.size), gb(Math.round(p.size * .6))] })),
          onSelect: r => { sel = r.id.split(':').map(Number); paint(); }, onContext: (r, e) => { sel = r.id.split(':').map(Number); paint(); ctx(e); } });
        const mark = () => L.el.querySelectorAll('tbody tr').forEach(tr => tr.firstElementChild && tr.firstElementChild.classList.add('vi'));
        new MutationObserver(mark).observe(L.el, { childList: true }); mark();
        // 처음에는 에뮬레이터처럼 첫 볼륨 줄이 선택된 모양
        if (!sel && vols.length) { L.sel = `${vols[0].d.n}:${vols[0].i}`; L.paint(); }
        const top = h('div', { class: 'dk-top' }, L.el);
        const bottom = h('div', { class: 'dk-bottom' });
        function paint() {
          bottom.innerHTML = '';
          st.disks.forEach(d => {
            const parts = h('div', { class: 'dk-parts' });
            d.parts.forEach((p, i) => {
              const isSel = sel && sel[0] === d.n && sel[1] === i;
              const pe = h('div', { class: 'dk-part' + (isSel ? ' sel' : ''), style: { flex: `${Math.max(p.size, d.size * .12)} 1 0` } },
                h('div', { class: 'bar', style: { background: p.type === 'free' ? '#000' : '#000080' } }),
                h('div', { class: 'tx' }, ...(p.type === 'free' ? [h('div', { html: '&nbsp;' }), h('div', {}, gb(p.size)), h('div', {}, '할당되지 않음')] : [h('div', {}, volName(p)), h('div', {}, `${gb(p.size)} ${p.fs || 'RAW'}`), h('div', {}, p.sys)])));
              pe.addEventListener('mousedown', () => { sel = [d.n, i]; paint(); });
              pe.addEventListener('contextmenu', e => { e.preventDefault(); sel = [d.n, i]; paint(); ctx(e); });
              parts.append(pe);
            });
            bottom.append(h('div', { class: 'dk-row' }, h('div', { class: 'dk-info' }, h('div', { class: 'dname' }, h('img', { src: RD().src('dk-disk'), alt: '', draggable: 'false' }), `디스크 ${d.n}`), h('div', {}, '기본'), h('div', {}, gb(d.size)), h('div', {}, '온라인')), parts));
          });
          const leg = [['#000', '할당되지 않음'], ['#000080', '주 파티션'], ['#008000', '확장 파티션'], ['#00ff00', '사용 가능한 공간'], ['#0000ff', '논리 드라이브']];
          bottom.append(h('div', { class: 'dk-legend' }, leg.map(([c, t]) => h('span', {}, h('i', { style: { background: c } }), t))));
        }
        paint();
        el.append(top, bottom);
      }
      const cur = () => sel && st.disks[sel[0]] && st.disks[sel[0]].parts[sel[1]];
      function ctx(e) {
        const p = cur(); if (!p) return;
        if (p.type === 'free') M.ctx([{ t: '새 단순 볼륨(I)...', on: () => newVolume() }, { t: '새 스팬 볼륨(N)...', dis: true }, { t: '새 스트라이프 볼륨(T)...', dis: true }, { t: '새 미러 볼륨(R)...', dis: true }, { t: '새 RAID-5 볼륨(W)...', dis: true }, '-', { t: '속성(P)', dis: true }, '-', { t: '도움말(H)', dis: true }], e);
        else {
          const sys = p.letter === 'C' || !p.letter;
          M.ctx([{ t: '열기(O)', dis: true }, { t: '탐색(E)', dis: true }, '-', { t: '파티션을 활성 파티션으로 표시(M)', dis: true }, { t: '드라이브 문자 및 경로 변경(C)...', dis: sys && p.letter === 'C', on: () => letterDlg(p) }, { t: '포맷(F)...', dis: sys, on: () => formatDlg(p) }, '-', { t: '볼륨 확장(X)...', dis: true }, { t: '볼륨 축소(H)...', dis: true }, { t: '미러 추가(A)...', dis: true }, { t: '볼륨 삭제(D)...', dis: sys, on: () => delVol() }, '-', { t: '속성(P)', dis: true }, '-', { t: '도움말(H)', dis: true }], e);
        }
      }
      function newVolume() {
        const d = st.disks[sel[0]], idx = sel[1], free = d.parts[idx];
        const c = { size: free.size, letter: freeLetters()[0], assign: 'letter', fmt: true, fs: 'NTFS', unit: '기본값', label: '새 볼륨', quick: true, compress: false };
        let fS, fL, rA, rF, fFs, fU, fLb, cQ, cC;
        W.wizard(desk, { title: '단순 볼륨 만들기 마법사', owner: M.win, w: 540, h: 450, icon: 'disk', ctx: c, pages: [
          { welcome: { title: '단순 볼륨 만들기 마법사 시작', text: ['이 마법사를 사용하면 디스크에 단순 볼륨을 만들 수 있습니다.', '단순 볼륨은 단일 디스크에만 있을 수 있습니다.', '계속하려면 [다음]을 클릭하십시오.'] } },
          { head: '볼륨 크기 지정', sub: '최대 및 최소 크기 사이에서 볼륨 크기를 선택하십시오.', render: el => { fS = W.text(String(free.size), { w: 100 }); el.append(W.form([['최대 디스크 공간(MB):', h('span', {}, String(free.size))], ['최소 디스크 공간(MB):', h('span', {}, '8')], ['단순 볼륨 크기(MB)(S):', fS]], { cols: '170px auto' })); },
            next: () => { const v = +fS.value; if (!/^\d+$/.test(fS.value.trim()) || v < 8 || v > free.size) return `볼륨 크기는 8MB 이상 ${free.size}MB 이하로 입력하십시오.`; c.size = v; return true; } },
          { head: '드라이브 문자 또는 경로 할당', sub: '쉽게 액세스할 수 있도록 파티션에 드라이브 문자 또는 드라이브 경로를 할당할 수 있습니다.', render: el => { fL = W.select(freeLetters(), c.letter, { w: 60 }); rA = W.radios([['letter', '다음 드라이브 문자 할당(A):'], ['folder', '다음 빈 NTFS 폴더에 탑재(M):'], ['none', '드라이브 문자 또는 드라이브 경로 할당 안 함(D)']], 'letter'); el.append(W.row(rA.els[0], fL), W.row(rA.els[1]), h('div', { style: { paddingLeft: '22px' } }, W.row(W.text('', { w: 220, dis: true }), W.btn('찾아보기(R)...', null, { dis: true }))), W.row(rA.els[2])); },
            next: () => { c.assign = rA.value; c.letter = rA.value === 'letter' ? fL.value : ''; if (rA.value === 'folder') return '이 연습 프로그램에서는 폴더 탑재를 지원하지 않습니다.'; return true; } },
          { head: '파티션 포맷', sub: '이 파티션에 데이터를 저장하려면 먼저 포맷해야 합니다.', render: el => {
            rF = W.radios([['no', '이 볼륨을 포맷하지 않음(D)'], ['yes', '다음 설정으로 이 볼륨 포맷(O):']], 'yes');
            fFs = W.select(['NTFS', 'FAT32', 'exFAT'], 'NTFS', { w: 140 }); fU = W.select(['기본값', '512', '1024', '2048', '4096', '8192', '16K', '32K', '64K'], '기본값', { w: 140 }); fLb = W.text('새 볼륨', { w: 160 }); cQ = W.chk('빠른 포맷 실행(P)', true); cC = W.chk('파일 및 폴더 압축 사용(E)', false);
            const sync = () => { const on = rF.value === 'yes'; [fFs, fU, fLb].forEach(x => (x.disabled = !on)); cQ.setDisabled(!on); cC.setDisabled(!on || fFs.value !== 'NTFS'); }; rF.onChange(sync); fFs.addEventListener('change', sync); sync();
            el.append(W.label('이 볼륨을 포맷할지 선택하십시오. 포맷하려는 경우 사용할 설정을 선택하십시오.'), W.row(rF.els[0]), W.row(rF.els[1]), h('div', { style: { paddingLeft: '22px' } }, W.form([['파일 시스템(F):', fFs], ['할당 단위 크기(A):', fU], ['볼륨 레이블(V):', fLb]], { cols: '130px auto' }), W.row(cQ), W.row(cC)));
          }, next: () => { c.fmt = rF.value === 'yes'; Object.assign(c, { fs: fFs.value, unit: fU.value, label: fLb.value.trim(), quick: cQ.checked, compress: cC.checked && fFs.value === 'NTFS' }); if (c.fmt && c.fs === 'FAT32' && c.size > 32768) return 'Windows 디스크 관리에서는 32GB(32768MB)보다 큰 볼륨을 FAT32로 포맷할 수 없습니다. 크기를 줄이거나 NTFS를 선택하십시오.'; if (c.fmt && c.label.length > 32) return '볼륨 레이블이 너무 깁니다.'; return true; } },
          { final: { title: '단순 볼륨 만들기 마법사 완료', text: ['단순 볼륨 만들기 마법사를 완료했습니다.', '다음 설정을 선택했습니다.'] }, render: el => el.append(h('div', { style: { border: '1px solid #ccc', padding: '8px', whiteSpace: 'pre-wrap', background: '#fafafa' } }, `볼륨 형식: 단순 볼륨\n선택한 디스크: 디스크 ${d.n}\n볼륨 크기: ${c.size}MB\n드라이브 문자 또는 경로: ${c.letter ? c.letter + ':' : '없음'}\n파일 시스템: ${c.fmt ? c.fs : '포맷 안 함'}\n할당 단위 크기: ${c.unit}\n볼륨 레이블: ${c.fmt ? c.label : ''}\n빠른 포맷: ${c.fmt && c.quick ? '예' : '아니요'}`), h('p', {}, '마법사를 닫으려면 [마침]을 클릭하십시오.')) },
        ], onFinish: () => {
          const np = { letter: c.letter, label: c.fmt ? c.label : '', fs: c.fmt ? c.fs : '', size: c.size, sys: c.fmt ? '정상(주 파티션)' : '정상(주 파티션) - RAW', type: 'primary', quick: c.fmt && c.quick, compress: c.compress };
          const rest = free.size - c.size;
          d.parts.splice(idx, 1, ...(rest > 0 ? [np, { type: 'free', size: rest }] : [np]));
          sel = [d.n, idx]; M.refresh();
        } });
      }
      function letterDlg(p) {
        let L;
        W.dialog(desk, { title: `${p.letter ? p.letter + ': ' : ''}(${p.label || '새 볼륨'})에 대한 드라이브 문자 및 경로 변경`, w: 430, h: 300, owner: M.win,
          render: el => { L = W.list({ cols: [{ t: '', w: 300 }], rows: p.letter ? [{ id: p.letter, cells: [p.letter + ':'], icon: 'disk' }] : [] }); const th = L.el.querySelector('thead'); if (th) th.style.display = 'none';
            el.append(W.label('이 볼륨에 액세스할 때 사용할 드라이브 문자와 경로를 지정하십시오(D):'), h('div', { style: { height: '120px', border: '1px solid #828790', background: '#fff' } }, L.el), W.row(W.btn('추가(A)...', () => change(true), { dis: !!p.letter }), W.btn('변경(C)...', () => change(false), { dis: !p.letter }), W.btn('제거(R)', async () => { const r = await W.msg(desk, { title: '디스크 관리', text: '드라이브 문자를 사용하는 일부 프로그램이 제대로 실행되지 않을 수 있습니다. 이 드라이브 문자를 제거하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'] }); if (r === '예(Y)') { p.letter = ''; M.refresh(); } }, { dis: !p.letter }))); },
          buttons: [{ t: '확인', def: true }, { t: '취소', cancel: true }] });
        function change(add) {
          let s;
          W.dialog(desk, { title: add ? '드라이브 문자 또는 경로 추가' : '드라이브 문자 또는 경로 변경', w: 380, h: 200, owner: null, render: el => { s = W.select(freeLetters(p.letter), freeLetters()[0], { w: 60 }); el.append(W.label('이 볼륨에 대해 새 드라이브 문자나 경로를 입력하십시오.'), W.row(W.radios([['a', '다음 드라이브 문자 할당(A):']], 'a').els[0], s)); },
            buttons: [{ t: '확인', def: true, on: async dw => { if (!add) { const r = await W.msg(desk, { title: '디스크 관리', text: '드라이브 문자를 사용하는 일부 프로그램이 제대로 실행되지 않을 수 있습니다. 계속하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: dw }); if (r !== '예(Y)') return false; } p.letter = s.value; M.refresh(); } }, { t: '취소', cancel: true }] });
        }
      }
      function formatDlg(p) {
        let fLb, fFs, fU, cQ, cC;
        W.dialog(desk, { title: `포맷 ${p.letter ? p.letter + ':' : ''}`, w: 360, h: 300, owner: M.win,
          render: el => { fLb = W.text(p.label, { w: 180 }); fFs = W.select(['NTFS', 'FAT32', 'exFAT'], p.fs || 'NTFS', { w: 120 }); fU = W.select(['기본값', '4096', '8192', '16K', '32K', '64K'], '기본값', { w: 120 }); cQ = W.chk('빠른 포맷 실행(P)', true); cC = W.chk('파일 및 폴더 압축 사용(E)', false);
            el.append(W.form([['볼륨 레이블(V):', fLb], ['파일 시스템(F):', fFs], ['할당 단위 크기(A):', fU]], { cols: '120px auto' }), W.row(cQ), W.row(cC)); },
          buttons: [{ t: '확인', def: true, on: async dw => {
            if (fFs.value === 'FAT32' && p.size > 32768) { await W.msg(desk, { title: '디스크 관리', text: '32GB보다 큰 볼륨은 FAT32로 포맷할 수 없습니다.', icon: 'error', owner: dw }); return false; }
            const r = await W.msg(desk, { title: '포맷', text: '이 볼륨을 포맷하면 볼륨의 모든 데이터가 지워집니다. 포맷하기 전에 보관하려는 데이터를 백업하십시오. 계속하시겠습니까?', icon: 'warn', buttons: ['확인', '취소'], owner: dw });
            if (r !== '확인') return false;
            Object.assign(p, { label: fLb.value.trim(), fs: fFs.value, quick: cQ.checked, compress: cC.checked && fFs.value === 'NTFS', sys: '정상(주 파티션)' }); M.refresh();
          } }, { t: '취소', cancel: true }] });
      }
      async function delVol() {
        const r = await W.msg(desk, { title: '단순 볼륨 삭제', text: '볼륨을 삭제하면 볼륨에 있는 모든 데이터가 지워집니다. 삭제하기 전에 보관하려는 데이터를 백업하십시오. 계속하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win });
        if (r !== '예(Y)') return;
        const d = st.disks[sel[0]]; d.parts[sel[1]] = { type: 'free', size: d.parts[sel[1]].size }; merge(d); sel = null; M.refresh();
      }
      function open() {
        M = SIMS.mmc(desk, { title: '컴퓨터 관리', icon: 'computer', w: 967, h: 727, leftW: 182, nodes: () => [{ id: 'root', label: '컴퓨터 관리(로컬)', icon: 'computer', kids: [{ id: 'stor', label: '저장소', icon: 'storage', kids: [{ id: 'dm', label: '디스크 관리', icon: 'disk' }] }] }], open: ['root', 'stor'], sel: 'dm', render, menu: () => (cur() ? null : null), onClose: () => SIMS.closed(desk, open, '디스크 관리') });
        if (RD()) { RD().win(M.win, 'rd-disk', 'cm-app'); RD().tree(M.tree.el, id => ({ root: 'cm-root', stor: 'cm-storage', dm: 'cm-diskmgmt' })[id]); }
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
