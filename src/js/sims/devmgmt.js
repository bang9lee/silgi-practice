/* 가상 화면: 장치 관리자 — 디바이스 사용/사용 안 함, 디바이스 제거, 하드웨어 변경 사항 검색, 속성(일반·드라이버)
 * 채점 키: dev.<id>.enabled, dev.<id>.present */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const CATS = [
    ['dvd', 'DVD/CD-ROM 드라이브', 'cd', [['dvd', 'HL-DT-ST DVDRAM GH24NSD1']]],
    ['ide', 'IDE ATA/ATAPI 컨트롤러', 'chip', [['ahci', '표준 SATA AHCI 컨트롤러']]],
    ['net', '네트워크 어댑터', 'net', [['nic', 'Realtek PCIe GbE Family Controller'], ['wifi', 'Intel(R) Wi-Fi 6 AX201 160MHz']]],
    ['disk', '디스크 드라이브', 'disk', [['ssd', 'Samsung SSD 860 EVO 250GB'], ['hdd', 'ST1000DM010-2EP102']]],
    ['disp', '디스플레이 어댑터', 'monitor', [['gpu', 'Intel(R) UHD Graphics 730']]],
    ['mouse', '마우스 및 기타 포인팅 장치', 'mouse', [['mouse', 'HID 규격 마우스']]],
    ['mon', '모니터', 'monitor', [['mon', '일반 PnP 모니터']]],
    ['usb', '범용 직렬 버스 컨트롤러', 'usb', [['usbroot', 'USB 루트 허브(USB 3.0)'], ['usbstor', 'USB 대용량 저장 장치']]],
    ['sound', '사운드, 비디오 및 게임 컨트롤러', 'sound', [['audio', 'Realtek High Definition Audio']]],
    ['sys', '시스템 장치', 'chip', [['pci', 'PCI Express 루트 컴플렉스'], ['rtc', '시스템 CMOS/실시간 시계']]],
    ['pc', '컴퓨터', 'computer', [['acpi', 'ACPI x64 기반 PC']]],
    ['kbd', '키보드', 'kbd', [['kbd', 'HID 키보드 장치']]],
    ['port', '포트 (COM 및 LPT)', 'port', [['com1', '통신 포트(COM1)']]],
    ['cpu', '프로세서', 'chip', [['cpu0', 'Intel(R) Core(TM) i5-12400'], ['cpu1', 'Intel(R) Core(TM) i5-12400']]],
    ['fdc', '플로피 드라이브 컨트롤러', 'chip', [['fdc', '표준 플로피 디스크 컨트롤러']]],
  ];
  // 에뮬레이터에서 잘라 낸 분류 아이콘(img/emu/regdisk/dm-*.png)
  const EMU_IC = { dvd: 'dvd', ide: 'ide', net: 'net', disk: 'disk', disp: 'disp', mouse: 'mouse', mon: 'mon', usb: 'usb', sound: 'sound', sys: 'sys', pc: 'pc', kbd: 'kbd', port: 'port', cpu: 'cpu', fdc: 'fdc' };
  const ALL = CATS.flatMap(([c, , ic, list]) => list.map(([id, n]) => ({ id, n, c, ic })));
  const blank = () => Object.fromEntries(ALL.map(d => [d.id, { enabled: true, present: true }]));
  const flat = st => { const o = {}; for (const [k, v] of Object.entries(st)) { o[`dev.${k}.enabled`] = v.enabled; o[`dev.${k}.present`] = v.present; } return o; };
  const LABELS = {}; ALL.forEach(d => { LABELS[`dev.${d.id}.enabled`] = `${d.n} 사용 여부`; LABELS[`dev.${d.id}.present`] = `${d.n} 설치 여부`; });

  SIMS.def('devmgmt', {
    title: '장치 관리자', labels: LABELS, blank, flat,
    mount(desk, q) {
      const st = blank(); Object.entries((q && q.init) || {}).forEach(([k, v]) => Object.assign(st[k], v));
      let win, T;
      const nodes = () => [{ id: 'root', label: 'ICQAPC', icon: 'computer', kids: () => CATS.map(([c, n, ic, list]) => ({ id: 'c:' + c, label: n, icon: ic, kids: () => list.filter(([id]) => st[id].present).map(([id, nm]) => ({ id: 'd:' + id, label: nm, icon: st[id].enabled ? ic : 'devOff' })) })).filter(x => x.kids().length) }];
      const devOf = n => n && String(n.id).startsWith('d:') ? ALL.find(d => d.id === n.id.slice(2)) : null;
      async function disable(d) { const r = await W.msg(desk, { title: d.n, text: '이 디바이스를 사용하지 않도록 설정하면 작동이 중지됩니다. 사용하지 않도록 설정하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: win }); if (r === '예(Y)') { st[d.id].enabled = false; T.paint(); } }
      function enable(d) { st[d.id].enabled = true; T.paint(); }
      function uninstall(d) { let c; W.dialog(desk, { title: '디바이스 제거', w: 420, h: 210, owner: win, render: el => { c = W.chk('이 디바이스의 드라이버를 제거합니다.', false); el.append(h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }, html: g.icon(d.ic) + ` <b>${d.n}</b>` }), W.label('경고: 시스템에서 이 디바이스를 제거하려고 합니다.'), W.row(c)); }, buttons: [{ t: '제거', def: true, on: () => { st[d.id].present = false; T.sel = null; T.paint(); } }, { t: '취소', cancel: true }] }); }
      function scan() { Object.values(st).forEach(v => (v.present = true)); T.paint(); }
      function props(d) {
        const s = st[d.id]; let status, b1;
        W.dialog(desk, { title: `${d.n} 속성`, w: 420, h: 460, owner: win,
          render: el => {
            status = W.text(s.enabled ? '이 디바이스가 올바르게 작동하고 있습니다.' : '이 디바이스를 사용할 수 없습니다. (코드 22)\n\n{작업}\n[디바이스 사용]을 클릭하여 이 디바이스를 사용합니다.', { multi: true, rows: 5, ro: true });
            const gen = h('div', {}, h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }, html: g.icon(d.ic) + ` <b>${d.n}</b>` }), W.form([['장치 유형:', h('span', {}, CATS.find(c => c[0] === d.c)[1])], ['제조업체:', h('span', {}, /Realtek/.test(d.n) ? 'Realtek' : /Intel/.test(d.n) ? 'Intel Corporation' : '(표준 시스템 장치)')], ['위치:', h('span', {}, 'PCI 버스 0, 장치 28, 기능 0')]], { cols: '90px 1fr' }), W.group('장치 상태', status));
            b1 = W.btn(s.enabled ? '디바이스 사용 안 함(D)' : '디바이스 사용(E)', async () => { if (s.enabled) { await disable(d); } else enable(d); b1.textContent = st[d.id].enabled ? '디바이스 사용 안 함(D)' : '디바이스 사용(E)'; status.value = st[d.id].enabled ? '이 디바이스가 올바르게 작동하고 있습니다.' : '이 디바이스를 사용할 수 없습니다. (코드 22)'; });
            const drv = h('div', {}, h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }, html: g.icon(d.ic) + ` <b>${d.n}</b>` }), W.form([['드라이버 공급자:', h('span', {}, 'Microsoft')], ['드라이버 날짜:', h('span', {}, '2006-06-21')], ['드라이버 버전:', h('span', {}, '10.0.22621.1')], ['디지털 서명자:', h('span', {}, 'Microsoft Windows')]], { cols: '110px 1fr' }),
              W.row(W.btn('드라이버 자세히(I)', null, { dis: true })), W.row(W.btn('드라이버 업데이트(P)', () => W.msg(desk, { title: '드라이버 업데이트', text: '(연습창) 디바이스에 가장 적합한 드라이버가 이미 설치되어 있습니다.', icon: 'info' }))), W.row(W.btn('드라이버 롤백(R)', null, { dis: true })), W.row(b1), W.row(W.btn('디바이스 제거(U)', () => uninstall(d))));
            el.style.display = 'flex'; el.style.flexDirection = 'column'; el.append(W.tabs([{ t: '일반', el: gen }, { t: '드라이버', el: drv }, { t: '자세히', el: h('div', {}, W.label('이 연습 프로그램에서는 자세히 탭을 쓰지 않습니다.')) }, { t: '이벤트', el: h('div') }]).el);
          },
          buttons: [{ t: '확인', def: true }, { t: '취소', cancel: true }] });
      }
      function menu(n) {
        const d = devOf(n);
        if (!d) return [{ t: '하드웨어 변경 사항 검색(A)', on: scan }, { t: '레거시 하드웨어 추가(L)', dis: true }, '-', { t: '속성(R)', dis: true }];
        return [{ t: '드라이버 업데이트(P)', on: () => W.msg(desk, { title: '드라이버 업데이트', text: '(연습창) 디바이스에 가장 적합한 드라이버가 이미 설치되어 있습니다.', icon: 'info' }) }, st[d.id].enabled ? { t: '디바이스 사용 안 함(D)', on: () => disable(d) } : { t: '디바이스 사용(E)', on: () => enable(d) }, { t: '디바이스 제거(U)', on: () => uninstall(d) }, '-', { t: '하드웨어 변경 사항 검색(A)', on: scan }, '-', { t: '속성(R)', b: true, on: () => props(d) }];
      }
      function open() {
        const ctx = (items, e) => { const r = desk.el.getBoundingClientRect(); W.menu(desk, e.clientX - r.left, e.clientY - r.top, items); };
        win = new W.Win(desk, { title: '장치 관리자', icon: 'computer', w: 765, h: 574, status: '', toolbar: true,
          menus: [{ label: '파일(F)', items: () => [{ t: '끝내기(X)', on: () => win.close() }] }, { label: '동작(A)', items: () => menu(T.node(T.sel)) }, { label: '보기(V)', items: () => [{ t: '종류별 디바이스(E)', dis: true }] }, { label: '도움말(H)', items: () => [{ t: '도움말 항목(H)', dis: true }] }],
          onClose: () => SIMS.closed(desk, open, '장치 관리자') });
        T = W.tree({ nodes, open: ['root'], onContext: (n, e) => ctx(menu(n), e), onDbl: n => { const d = devOf(n); if (d) props(d); } });
        T.sel = 'root'; T.paint();
        const RD = SIMS.rdSkin;
        win.body.append(h('div', RD ? { class: 'dm-pane' } : { style: { flex: 1, margin: '4px', background: '#fff', border: '1px solid #828790', overflow: 'auto' } }, T.el));
        if (RD) {
          RD.win(win, 'rd-dev', 'dm-app');
          RD.tree(T.el, id => {
            if (id === 'root') return 'dm-root';
            if (id.startsWith('c:')) return 'dm-' + EMU_IC[id.slice(2)];
            const d = ALL.find(x => 'd:' + x.id === id); if (!d) return null;
            return 'dm-' + EMU_IC[d.c] + (st[d.id].enabled ? '' : ':off');
          });
        }
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
