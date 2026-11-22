/* 가상 화면: 레지스트리 편집기 (regedit) — 키 탐색, 새로 만들기(키·문자열·DWORD·QWORD·다중 문자열·확장 가능한 문자열), 이름 바꾸기, 수정, 삭제
 * 채점 키(경로는 소문자, 루트 키는 전체 이름): key:<경로> = true,  val:<경로>\<값 이름> = 데이터,  type:<경로>\<값 이름> = REG_SZ 등
 *   예) key:hkey_current_user\software\icqa,  val:hkey_current_user\control panel\desktop\menushowdelay = "200"
 *   DWORD·QWORD 데이터는 10진수 숫자로 비교합니다. */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const K = (vals = {}, kids = {}) => ({ v: vals, k: kids });
  const SZ = d => ({ t: 'REG_SZ', d }), DW = d => ({ t: 'REG_DWORD', d }), EX = d => ({ t: 'REG_EXPAND_SZ', d });
  function blank() {
    return {
      HKEY_CLASSES_ROOT: K({}, { '.bat': K({ '': SZ('batfile') }), '.txt': K({ '': SZ('txtfile'), 'Content Type': SZ('text/plain') }), txtfile: K({ '': SZ('텍스트 문서') }, { shell: K({}, { open: K({}, { command: K({ '': EX('%SystemRoot%\\system32\\NOTEPAD.EXE %1') }) }) }) }) }),
      HKEY_CURRENT_USER: K({}, {
        'AppEvents': K(), 'Console': K({ FontSize: DW(1048576) }),
        'Control Panel': K({}, { Desktop: K({ Wallpaper: SZ('C:\\Windows\\web\\wallpaper\\Windows\\img0.jpg'), MenuShowDelay: SZ('400'), ScreenSaveActive: SZ('1'), ScreenSaveTimeOut: SZ('600'), WheelScrollLines: SZ('3') }), Mouse: K({ DoubleClickSpeed: SZ('500'), MouseSpeed: SZ('1') }), Keyboard: K({ KeyboardDelay: SZ('1'), KeyboardSpeed: SZ('31') }) }),
        Environment: K({ TEMP: EX('%USERPROFILE%\\AppData\\Local\\Temp'), TMP: EX('%USERPROFILE%\\AppData\\Local\\Temp') }),
        Software: K({}, { Microsoft: K({}, { Windows: K({}, { CurrentVersion: K({}, { Run: K({ OneDrive: SZ('"C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe" /background') }), Explorer: K({}, { Advanced: K({ Hidden: DW(2), HideFileExt: DW(1), ShowSuperHidden: DW(0), TaskbarAl: DW(1) }) }), Policies: K({}, { Explorer: K() }) }) }) }) }),
      }),
      HKEY_LOCAL_MACHINE: K({}, {
        HARDWARE: K({}, { DESCRIPTION: K({}, { System: K({}, { CentralProcessor: K({}, { 0: K({ ProcessorNameString: SZ('Intel(R) Core(TM) i5-12400 CPU @ 2.50GHz'), '~MHz': DW(2496) }) }) }) }) }),
        SAM: K(), SECURITY: K(),
        SOFTWARE: K({}, { Microsoft: K({}, { Windows: K({}, { CurrentVersion: K({}, { Run: K({ SecurityHealth: EX('%windir%\\system32\\SecurityHealthSystray.exe') }), RunOnce: K() }) }), 'Windows NT': K({}, { CurrentVersion: K({ ProductName: SZ('Windows 11 Pro'), RegisteredOwner: SZ('ICQA'), CurrentBuild: SZ('22631') }) }) }), Policies: K({}, { Microsoft: K({}, { Windows: K() }) }) }),
        SYSTEM: K({}, { CurrentControlSet: K({}, { Control: K({}, { ComputerName: K({}, { ComputerName: K({ ComputerName: SZ('ICQAPC') }) }), 'Terminal Server': K({ fDenyTSConnections: DW(1) }) }), Services: K({}, { Tcpip: K({}, { Parameters: K({ Hostname: SZ('ICQAPC') }) }), USBSTOR: K({ Start: DW(3) }) }) }) }),
      }),
      HKEY_USERS: K({}, { '.DEFAULT': K(), 'S-1-5-18': K(), 'S-1-5-19': K(), 'S-1-5-20': K() }),
      HKEY_CURRENT_CONFIG: K({}, { Software: K(), System: K() }),
    };
  }
  // ───────── ICQA 에뮬레이터 모양 (레지스트리·디스크 관리·장치 관리자·폴더 옵션이 같이 씀) ─────────
  // 아이콘은 에뮬레이터 화면에서 잘라 낸 그림(img/emu/regdisk/*.png)입니다.
  // tree(): W.tree가 다시 그릴 때마다 아이콘을 그림으로 바꾸고, +/− 단추 모양과 점선 연결선을 붙입니다.
  const RD = {
    src: n => `img/emu/regdisk/${n}.png`,
    img: n => `<img src="img/emu/regdisk/${n}.png" alt="" draggable="false">`,
    // 창 꾸미기: 범위 class + 제목 표시줄 아이콘 + 도구 모음 단추 그림
    win(win, cls, titleIcon) {
      win.el.classList.add('emu-rd', cls);
      const ic = win.titleEl.querySelector('.ic');
      if (titleIcon) { if (ic) ic.innerHTML = RD.img(titleIcon); } else if (ic) ic.remove();
      const tb = win.toolbar && win.toolbar.querySelector('.tb'); if (tb) tb.innerHTML = RD.img('mmc-tb');
    },
    tree(el, pick) {
      const IND = 19;
      const run = () => {
        const rows = [...el.children].filter(r => r.classList.contains('tn'));
        const D = rows.map(r => Math.round((parseFloat(r.style.paddingLeft) || 0) / IND));
        const nextSib = (i, k) => { for (let j = i + 1; j < rows.length; j++) { if (D[j] < k) return false; if (D[j] === k) return true; } return false; };
        rows.forEach((r, i) => {
          const d = D[i];
          const ic = r.querySelector('.ic'); const p = pick(r.dataset.id);
          if (ic && p) ic.innerHTML = RD.img(String(p).replace(/:off$/, '')) + (/:off$/.test(p) ? '<i class="dn"></i>' : '');
          const tg = r.querySelector('.tg'); const open = !!tg && !tg.classList.contains('none') && tg.textContent === '−';
          if (tg) tg.classList.toggle('open', open);
          const x = k => k * IND + 4;
          let html = '';
          for (let k = 1; k < d; k++) if (nextSib(i, k)) html += `<i class="ln v" style="left:${x(k)}px"></i>`;
          if (d > 0) html += `<i class="ln v${nextSib(i, d) ? '' : ' top'}" style="left:${x(d)}px"></i>`;
          html += `<i class="ln h" style="left:${x(d)}px"></i>`;
          if (open && D[i + 1] === d + 1) html += `<i class="ln v bot" style="left:${x(d + 1)}px"></i>`;
          r.querySelectorAll(':scope > .ln').forEach(n => n.remove());
          r.insertAdjacentHTML('beforeend', html);
        });
      };
      new MutationObserver(run).observe(el, { childList: true });
      run();
    },
  };
  SIMS.rdSkin = RD;
  const ROOTS = ['HKEY_CLASSES_ROOT', 'HKEY_CURRENT_USER', 'HKEY_LOCAL_MACHINE', 'HKEY_USERS', 'HKEY_CURRENT_CONFIG'];
  const TYPE_NAME = { REG_SZ: '문자열 값', REG_BINARY: '이진 값', REG_DWORD: 'DWORD(32비트) 값', REG_QWORD: 'QWORD(64비트) 값', REG_MULTI_SZ: '다중 문자열 값', REG_EXPAND_SZ: '확장 가능한 문자열 값' };
  const findKid = (node, name) => Object.keys(node.k).find(x => x.toLowerCase() === String(name).toLowerCase());
  function flat(st) {
    const o = {};
    const walk = (node, path) => {
      o['key:' + path.toLowerCase()] = true;
      for (const [n, v] of Object.entries(node.v)) { const p = (path + '\\' + n).toLowerCase(); o['val:' + p] = v.d; o['type:' + p] = v.t; }
      for (const [n, kid] of Object.entries(node.k)) walk(kid, path + '\\' + n);
    };
    ROOTS.forEach(r => walk(st[r], r));
    return o;
  }
  // ───────── 채점 결과에 보여 줄 이름 ─────────
  // 채점 키는 소문자(hkey_local_machine\software\…)라서 그대로 보여 주면 읽기 어렵습니다.
  // 기본 트리에 있는 키·값은 원래 대소문자로, 새로 만드는 이름은 문제 글에 쓰인 대로 되돌립니다.
  const ROOT_FULL = { hkey_classes_root: 'HKEY_CLASSES_ROOT', hkey_current_user: 'HKEY_CURRENT_USER', hkey_local_machine: 'HKEY_LOCAL_MACHINE', hkey_users: 'HKEY_USERS', hkey_current_config: 'HKEY_CURRENT_CONFIG' };
  let BLANK = null;
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function nice(lowPath, q, lastIsValue) {
    BLANK = BLANK || blank();
    const parts = String(lowPath).split('\\');
    const root = ROOT_FULL[parts.shift()] || '';
    const text = q ? `${q.question || ''} ${q.box || ''}` : '';
    // 문제 글에서 같은 낱말을 찾되, 대문자가 섞인 표기(예: 경로 속 icqa보다 값 이름 ICQA)를 먼저 씁니다.
    const fromText = seg => {
      if (!seg) return seg;
      const all = [...text.matchAll(new RegExp(`(^|[^A-Za-z0-9_])(${reEsc(seg)})(?![A-Za-z0-9_])`, 'gi'))].map(m => m[2]);
      return all.find(x => /[A-Z]/.test(x)) || all[0] || seg;
    };
    let node = BLANK[root]; const out = [root];
    parts.forEach((p, i) => {
      if (lastIsValue && i === parts.length - 1) { const v = node && Object.keys(node.v).find(x => x.toLowerCase() === p); out.push(v !== undefined ? v : fromText(p)); return; }
      const f = node && findKid(node, p); out.push(f || fromText(p)); node = f ? node.k[f] : null;
    });
    return out;
  }
  // "제목\n위치: …" — 결과 카드에서 첫 줄은 굵게, 둘째 줄은 작게 보입니다.
  function label(k, q) {
    const m = k.match(/^(key|val|type):(.*)$/); if (!m) return k;
    const parts = nice(m[2], q, m[1] !== 'key');
    const name = parts.pop();
    if (m[1] === 'key') return `키 만들기 · ${name}\n위치: ${parts.join('\\')}`;
    return `${m[1] === 'val' ? '값 데이터' : '값 종류'} · ${name === '' ? '(기본값)' : name}\n위치: ${parts.join('\\')}`;
  }
  const TYPE_KO = { REG_SZ: '문자열 값', REG_BINARY: '이진 값', REG_DWORD: 'DWORD(32비트) 값', REG_QWORD: 'QWORD(64비트) 값', REG_MULTI_SZ: '다중 문자열 값', REG_EXPAND_SZ: '확장 가능한 문자열 값' };
  function pretty(k, v) {
    if (v === '(비어 있음)') return '(없음)';
    if (k.startsWith('type:') && TYPE_KO[v]) return `${TYPE_KO[v]} (${v})`;
    if (k.startsWith('key:')) return v === '예(켬)' ? '있음' : v === '아니요(끔)' ? '없음' : v;
    return v;
  }
  const dispData = v => {
    if (v.t === 'REG_DWORD') return `0x${(v.d >>> 0).toString(16).padStart(8, '0')} (${v.d})`;
    if (v.t === 'REG_QWORD') return `0x${Number(v.d).toString(16).padStart(16, '0')} (${v.d})`;
    if (v.t === 'REG_MULTI_SZ') return (v.d || []).join(' ');
    if (v.t === 'REG_BINARY') return v.d || '(길이가 0인 이진 값)';
    return v.d === undefined ? '(값 설정 안 됨)' : v.d;
  };

  SIMS.def('regedit', {
    title: '레지스트리 편집기', label, pretty, nice, blank, flat,
    mount(desk, q) {
      const st = blank();
      // init: { "HKEY_CURRENT_USER\\Software\\ICQA": { "값": {t, d} } } 처럼 미리 만들 키·값
      Object.entries((q && q.init) || {}).forEach(([path, vals]) => { const n = ensure(path); Object.assign(n.v, vals); });
      function ensure(path) { const [r, ...rest] = path.split('\\'); let n = st[r]; rest.forEach(p => { const f = findKid(n, p); if (f) n = n.k[f]; else { n.k[p] = K(); n = n.k[p]; } }); return n; }
      const nodeAt = id => { const parts = id.split('\\'); if (parts[0] === '컴퓨터') parts.shift(); if (!parts.length) return null; let n = st[parts[0]]; for (const p of parts.slice(1)) { if (!n || !n.k[p]) return null; n = n.k[p]; } return n; };
      let M, L;
      const kidsOf = (node, path) => Object.keys(node.k).sort((a, b) => a.localeCompare(b)).map(nm => { const id = path + '\\' + nm; return { id, label: nm, icon: 'regKey', kids: () => kidsOf(node.k[nm], id), lazy: Object.keys(node.k[nm].k).length > 0 }; });
      const nodes = () => [{ id: '컴퓨터', label: '컴퓨터', icon: 'computer', kids: () => ROOTS.map(r => ({ id: '컴퓨터\\' + r, label: r, icon: 'regKey', kids: () => kidsOf(st[r], '컴퓨터\\' + r), lazy: true })) }];
      const curId = () => M.tree.sel;
      const newMenu = id => [{ t: '키(K)', on: () => newKey(id) }, '-', ...Object.entries(TYPE_NAME).map(([t, n]) => ({ t: n + `(${({ REG_SZ: 'S', REG_BINARY: 'B', REG_DWORD: 'D', REG_QWORD: 'Q', REG_MULTI_SZ: 'M', REG_EXPAND_SZ: 'E' })[t]})`, dis: t === 'REG_BINARY', on: () => newValue(id, t) }))];
      function keyMenu(n) {
        const isRoot = n.id === '컴퓨터' || ROOTS.some(r => n.id === '컴퓨터\\' + r);
        if (n.id === '컴퓨터') return [{ t: '확장', on: () => M.tree.expand(n.id) }];
        return [{ t: M.tree.open.has(n.id) ? '축소' : '확장', on: () => M.tree.toggle(n.id) }, { t: '새로 만들기(N)', sub: newMenu(n.id) }, { t: '찾기(F)...', dis: true }, '-', { t: '삭제(D)', dis: isRoot, on: () => delKey(n.id) }, { t: '이름 바꾸기(R)', dis: isRoot, on: () => renameKey(n.id) }, '-', { t: '내보내기(E)', dis: true }, { t: '권한(P)...', dis: true }, '-', { t: '키 이름 복사(C)', dis: true }];
      }
      const COLS = [{ t: '이름', w: 150 }, { t: '종류', w: 100 }, { t: '데이터', w: 250 }];
      function render(n, el) {
        const node = nodeAt(n.id);
        if (!node) { el.append(W.list({ cols: COLS }).el); return; }
        const rows = [{ id: '', cells: ['(기본값)', 'REG_SZ', node.v[''] ? dispData(node.v['']) : '(값 설정 안 됨)'], icon: 'regSz' }]
          .concat(Object.entries(node.v).filter(([nm]) => nm !== '').sort((a, b) => a[0].localeCompare(b[0])).map(([nm, v]) => ({ id: nm, cells: [nm, v.t, dispData(v)], icon: /SZ$/.test(v.t) ? 'regSz' : 'regBin' })));
        L = W.list({ cols: COLS, rows, onDbl: r => editValue(n.id, r.id),
          onContext: (r, e) => M.ctx([{ t: '수정(M)...', b: true, on: () => editValue(n.id, r.id) }, { t: '이진 데이터 수정(B)...', dis: true }, '-', { t: '삭제(D)', dis: r.id === '' && !node.v[''], on: () => delValue(n.id, r.id) }, { t: '이름 바꾸기(R)', dis: r.id === '', on: () => renameValue(n.id, r.id) }], e),
          onBlank: e => M.ctx([{ t: '새로 만들기(N)', sub: newMenu(n.id) }], e), onDelete: r => delValue(n.id, r.id) });
        el.append(L.el);
      }
      const uniq = (taken, base) => { let i = 1; while (taken.some(x => x.toLowerCase() === `${base} #${i}`.toLowerCase())) i++; return `${base} #${i}`; };
      function inlineEdit(cell, init, done) {
        const inp = h('input', { value: init, spellcheck: 'false' });
        cell.textContent = ''; cell.append(inp); inp.focus(); inp.select();
        let fin = false;
        const end = ok => { if (fin) return; fin = true; done(ok ? inp.value.trim() : init); };
        inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true); } if (e.key === 'Escape') { e.preventDefault(); end(false); } });
        inp.addEventListener('blur', () => end(true));
        inp.addEventListener('mousedown', e => e.stopPropagation());
      }
      function newKey(id) {
        const node = nodeAt(id); if (!node) return;
        const name = uniq(Object.keys(node.k), '새 키');
        node.k[name] = K(); M.tree.open.add(id); M.refresh();
        renameKey(id + '\\' + name, true);
      }
      function renameKey(id, fresh) {
        M.tree.select(id, true);
        const row = M.tree.el.querySelector(`.tn[data-id="${CSS.escape(id)}"] .lb`); if (!row) return;
        const parts = id.split('\\'); const old = parts.pop(); const parentId = parts.join('\\'); const parent = nodeAt(parentId);
        inlineEdit(row, old, nv => {
          if (!nv || nv === old) { M.refresh(); M.select(id); return; }
          if (nv.includes('\\')) { W.msg(desk, { title: '키 이름 바꾸기 오류', text: '키 이름에 \\ 문자를 쓸 수 없습니다.', icon: 'error', owner: M.win }).then(() => renameKey(id)); return; }
          if (findKid(parent, nv) && findKid(parent, nv) !== old) { W.msg(desk, { title: '키 이름 바꾸기 오류', text: `${old}의 이름을 바꿀 수 없습니다. 지정한 키 이름이 이미 있습니다. 다른 이름을 입력하고 다시 시도하십시오.`, icon: 'error', owner: M.win }).then(() => renameKey(id)); return; }
          parent.k[nv] = parent.k[old]; delete parent.k[old];
          const nid = parentId + '\\' + nv; M.refresh(); M.select(nid);
        });
      }
      function delKey(id) {
        W.msg(desk, { title: '키 삭제 확인', text: '이 키와 모든 하위 키를 영구적으로 삭제하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win }).then(r => {
          if (r !== '예(Y)') return;
          const parts = id.split('\\'); const nm = parts.pop(); const pid = parts.join('\\');
          delete nodeAt(pid).k[nm]; M.tree.sel = pid; M.refresh();
        });
      }
      function newValue(id, t) {
        const node = nodeAt(id); if (!node) return;
        if (M.tree.sel !== id) M.select(id);
        const name = uniq(Object.keys(node.v), '새 값');
        node.v[name] = { t, d: t === 'REG_DWORD' || t === 'REG_QWORD' ? 0 : t === 'REG_MULTI_SZ' ? [] : '' };
        M.refresh();
        renameValue(id, name, true);
      }
      function renameValue(id, nm) {
        const tr = L && L.el.querySelector(`tr[data-id="${CSS.escape(nm)}"] td`); if (!tr) return;
        const node = nodeAt(id);
        inlineEdit(tr, nm, nv => {
          if (!nv || nv === nm) { M.refresh(); return; }
          if (Object.keys(node.v).some(x => x.toLowerCase() === nv.toLowerCase() && x !== nm)) { W.msg(desk, { title: '값 이름 바꾸기 오류', text: `${nm}의 이름을 바꿀 수 없습니다. 지정한 값 이름이 이미 있습니다. 다른 이름을 입력하고 다시 시도하십시오.`, icon: 'error', owner: M.win }).then(() => { M.refresh(); renameValue(id, nm); }); return; }
          node.v[nv] = node.v[nm]; delete node.v[nm]; M.refresh();
        });
      }
      function delValue(id, nm) {
        W.msg(desk, { title: '값 삭제 확인', text: '특정 레지스트리 값을 삭제하면 시스템이 불안정해질 수 있습니다. 이 값을 영구적으로 삭제하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: M.win }).then(r => { if (r === '예(Y)') { delete nodeAt(id).v[nm]; M.refresh(); } });
      }
      function editValue(id, nm) {
        const node = nodeAt(id); const v = node.v[nm] || { t: 'REG_SZ', d: undefined };
        const shown = nm === '' ? '(기본값)' : nm;
        if (v.t === 'REG_DWORD' || v.t === 'REG_QWORD') {
          let f, r;
          W.dialog(desk, { title: v.t === 'REG_DWORD' ? 'DWORD(32비트) 값 편집' : 'QWORD(64비트) 값 편집', w: 400, h: 240, owner: M.win,
            render: el => { f = W.text(Number(v.d).toString(16)); r = W.radios([['16', '16진수(H)'], ['10', '10진수(D)']], '16');
              r.onChange(() => { const cur = parseInt(f.value || '0', r.value === '16' ? 10 : 16); f.value = r.value === '16' ? cur.toString(16) : String(cur); });
              el.append(W.label('값 이름(N):', { cls: 'l' }), W.text(shown, { ro: true }), h('div', { style: { display: 'flex', gap: '14px', marginTop: '8px' } }, h('div', { style: { flex: 1 } }, W.label('값 데이터(V):', { cls: 'l' }), f), W.group('단위', W.row(r.els[0]), W.row(r.els[1])))); },
            buttons: [{ t: '확인', def: true, on: () => { const raw = f.value.trim() || '0'; const ok = r.value === '16' ? /^[0-9a-f]+$/i.test(raw) : /^\d+$/.test(raw); if (!ok) { W.msg(desk, { title: '값 편집', text: r.value === '16' ? '16진수(0~9, A~F)만 입력할 수 있습니다.' : '숫자만 입력할 수 있습니다.', icon: 'error' }); return false; } const n = parseInt(raw, r.value === '16' ? 16 : 10); if (v.t === 'REG_DWORD' && n > 0xFFFFFFFF) { W.msg(desk, { title: '값 편집', text: 'DWORD 값은 0xFFFFFFFF(4294967295)를 넘을 수 없습니다.', icon: 'error' }); return false; } node.v[nm] = { t: v.t, d: n }; M.refresh(); } }, { t: '취소', cancel: true }] });
          return;
        }
        if (v.t === 'REG_MULTI_SZ') {
          let f;
          W.dialog(desk, { title: '다중 문자열 편집', w: 400, h: 330, owner: M.win, render: el => { f = W.text((v.d || []).join('\n'), { multi: true, rows: 8 }); el.append(W.label('값 이름(N):', { cls: 'l' }), W.text(shown, { ro: true }), W.label('값 데이터(V):', { cls: 'l' }), f); },
            buttons: [{ t: '확인', def: true, on: () => { node.v[nm] = { t: v.t, d: f.value.split('\n').filter(Boolean) }; M.refresh(); } }, { t: '취소', cancel: true }] });
          return;
        }
        let f;
        W.dialog(desk, { title: '문자열 편집', w: 400, h: 210, owner: M.win, render: el => { f = W.text(v.d === undefined ? '' : v.d); el.append(W.label('값 이름(N):', { cls: 'l' }), W.text(shown, { ro: true }), W.label('값 데이터(V):', { cls: 'l' }), f); setTimeout(() => f.select(), 0); },
          buttons: [{ t: '확인', def: true, on: () => { node.v[nm] = { t: v.t, d: f.value }; M.refresh(); } }, { t: '취소', cancel: true }] });
      }
      function open() {
        M = SIMS.mmc(desk, {
          title: '레지스트리 편집기', icon: 'reg', w: 740, h: 524, nodes, open: ['컴퓨터'], sel: '컴퓨터', render, menu: keyMenu, leftW: 174, toolbar: false,
          status: n => (n ? n.id : ''),
          menus: (api) => [
            { label: '파일(F)', items: () => [{ t: '가져오기(I)...', dis: true }, { t: '내보내기(E)...', dis: true }, '-', { t: '끝내기(X)', on: () => M.win.close() }] },
            { label: '편집(E)', items: () => { const n = M.tree.node(curId()); return n && nodeAt(n.id) ? [{ t: '새로 만들기(N)', sub: newMenu(n.id) }, '-', { t: '삭제(D)', dis: ROOTS.some(r => n.id === '컴퓨터\\' + r), on: () => delKey(n.id) }, { t: '이름 바꾸기(R)', dis: ROOTS.some(r => n.id === '컴퓨터\\' + r), on: () => renameKey(n.id) }] : [{ t: '새로 만들기(N)', dis: true }]; } },
            { label: '보기(V)', items: () => [{ t: '새로 고침(F)', on: () => M.refresh() }] },
            { label: '즐겨찾기(A)', items: () => [{ t: '즐겨찾기에 추가(A)...', dis: true }] },
            { label: '도움말(H)', items: () => [{ t: '도움말 항목(H)', dis: true }] },
          ],
          onClose: () => SIMS.closed(desk, open, '레지스트리 편집기'),
        });
        RD.win(M.win, 'rd-reg', 'reg-app');
        RD.tree(M.tree.el, id => (id === '컴퓨터' ? 'reg-computer' : 'reg-folder'));
        // 상태 표시줄에 현재 키 경로
        const upd = () => M.win.setStatus(M.tree.sel || '');
        M.tree.el.addEventListener('mousedown', () => setTimeout(upd, 0)); upd();
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
