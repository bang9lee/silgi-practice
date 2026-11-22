/* 가상 화면: 폴더 옵션 (파일 탐색기 옵션) — 일반·보기·검색 탭
 * 채점 키: fo.browse(same/new), fo.click(double/single), fo.navAll, fo.navExpand, fo.hidden(hide/show), fo.<보기 항목 id>, fo.sysDirs, fo.zip, fo.contents */
(function (g) {
  'use strict';
  const { W, SIMS } = g; const { h } = W;
  const VIEW = [
    ['alwaysIcons', '아이콘은 항상 표시하고 미리 보기는 표시 안 함', false],
    ['alwaysMenus', '메뉴 항상 표시', false],
    ['showFullPath', '제목 표시줄에 전체 경로 표시', false],
    ['hideEmpty', '빈 드라이브 숨기기', true],
    ['hideExt', '알려진 파일 형식의 파일 확장명 숨기기', true],
    ['hideProtected', '보호된 운영 체제 파일 숨기기(권장)', true],
    ['sepProcess', '별도의 프로세스에서 폴더 창 실행', false],
    ['restorePrev', '로그온할 때 이전 폴더 창 복원', false],
    ['colorNtfs', '암호화되거나 압축된 NTFS 파일을 컬러로 표시', false],
    ['statusBar', '상태 표시줄 표시', true],
    ['checkboxes', '확인란을 사용하여 항목 선택', false],
    ['sharingWizard', '공유 마법사 사용(권장)', true],
  ];
  const blank = () => { const s = { browse: 'same', click: 'double', navAll: false, navExpand: false, hidden: 'hide', sysDirs: true, zip: false, contents: false }; VIEW.forEach(([k, , d]) => (s[k] = d)); return s; };
  const flat = st => Object.fromEntries(Object.entries(st).map(([k, v]) => ['fo.' + k, v]));
  const LABELS = { 'fo.browse': '폴더 찾아보기', 'fo.click': '마우스 클릭', 'fo.navAll': '탐색 창: 모든 폴더 표시', 'fo.navExpand': '탐색 창: 자동으로 현재 폴더 확장', 'fo.hidden': '숨김 파일 및 폴더', 'fo.sysDirs': '검색: 시스템 디렉터리 포함', 'fo.zip': '검색: 압축 파일 포함', 'fo.contents': '검색: 항상 파일 이름 및 내용 검색' };
  VIEW.forEach(([k, t]) => (LABELS['fo.' + k] = '보기 → ' + t));

  SIMS.def('folderopt', {
    title: '폴더 옵션', labels: LABELS, blank, flat,
    mount(desk, q) {
      const st = Object.assign(blank(), (q && q.init) || {});
      function open() {
        const w = SIMS.clone(st);
        let rB, rC, cA, cE, rH, viewChecks = {}, cS, cZ, cN;
        const read = () => { Object.assign(w, { browse: rB.value, click: rC.value, navAll: cA.checked, navExpand: cE.checked, hidden: rH.value, sysDirs: cS.checked, zip: cZ.checked, contents: cN.checked }); VIEW.forEach(([k]) => (w[k] = viewChecks[k].checked)); };
        const apply = () => { read(); Object.assign(st, SIMS.clone(w)); };
        let applyBtn = null;
        const dirty = () => { if (applyBtn) applyBtn.disabled = false; };
        const main = W.dialog(desk, { title: '폴더 옵션', w: 459, h: 499,
          render: el => {
            rB = W.radios([['same', '같은 창에서 폴더 열기(M)'], ['new', '새 창에서 폴더 열기(W)']], w.browse);
            rC = W.radios([['single', '한 번 클릭해서 열기(가리키면 선택됨)(S)'], ['double', '두 번 클릭해서 열기(한 번 클릭하면 선택됨)(D)']], w.click);
            cA = W.chk('모든 폴더 표시(F)', w.navAll); cE = W.chk('자동으로 현재 폴더 확장(X)', w.navExpand);
            // 에뮬레이터처럼 모둠 왼쪽에 그림(img/emu/regdisk/fo-*.png)을 둡니다.
            const pic = n => h('img', { src: `img/emu/regdisk/${n}.png`, alt: '', draggable: 'false' });
            const ul = W.radios([['a', '아이콘 이름에 항상 밑줄 표시(B)'], ['b', '아이콘을 가리킬 때만 아이콘 이름에 밑줄 표시(P)']], 'b');
            const syncUl = () => ['a', 'b'].forEach(v => ul.setDisabled(v, rC.value !== 'single')); rC.onChange(syncUl); syncUl();
            const gen = h('div', {},
              W.group('폴더 찾아보기', h('div', { class: 'fo-g' }, pic('fo-browse'), h('div', {}, W.row(rB.els[0]), W.row(rB.els[1])))),
              W.group('마우스 클릭', h('div', { class: 'fo-g' }, pic('fo-click'), h('div', {}, W.row(rC.els[0]), h('div', { class: 'fo-sub' }, W.row(ul.els[0]), W.row(ul.els[1])), W.row(rC.els[1])))),
              W.group('탐색 창', h('div', { class: 'fo-g' }, pic('fo-nav'), h('div', {}, W.row(cA), W.row(cE)))),
              h('div', { class: 'fo-right' }, W.btn('기본값 복원(R)', () => { rB.value = 'same'; rC.value = 'double'; cA.checked = false; cE.checked = false; syncUl(); dirty(); })));
            rH = W.radios([['hide', '숨김 파일, 폴더 또는 드라이브 표시 안 함'], ['show', '숨김 파일, 폴더 및 드라이브 표시']], w.hidden);
            const box = h('div', { class: 'fo-box' }, W.label('파일 및 폴더', { cls: 'l' }));
            const items = VIEW.map(([k, t]) => { const c = W.chk(t, w[k]); viewChecks[k] = c; return c; });
            items.slice(0, 4).forEach(c => box.append(W.row(c)));
            box.append(W.label('숨김 파일 및 폴더', { cls: 'l' }), h('div', { style: { paddingLeft: '18px' } }, W.row(rH.els[0]), W.row(rH.els[1])));
            items.slice(4).forEach(c => box.append(W.row(c)));
            viewChecks.hideProtected.onToggle(async () => {
              if (viewChecks.hideProtected.checked) return;
              const r = await W.msg(desk, { title: '경고', text: '보호된 운영 체제 파일(시스템 및 숨김으로 표시된 파일)을 표시하도록 선택했습니다. 이 파일들은 컴퓨터를 시작하고 실행하는 데 필요합니다. 이 파일을 삭제하거나 편집하면 컴퓨터가 작동하지 않을 수 있습니다.\n이 파일들을 표시하시겠습니까?', icon: 'warn', buttons: ['예(Y)', '아니요(N)'], owner: main });
              if (r !== '예(Y)') viewChecks.hideProtected.checked = true;
            });
            const view = h('div', {}, W.group('폴더 보기', W.label('이 폴더에 사용 중인 보기(예: 자세히 또는 아이콘)를 이 형식의 모든 폴더에 적용할 수 있습니다.'), W.row(W.btn('폴더에 적용(L)', null, { dis: true }), W.btn('폴더 초기화(R)', null, { dis: true }))), W.label('고급 설정:', { cls: 'l' }), box, h('div', { class: 'fo-right', style: { marginTop: '8px' } }, W.btn('기본값 복원(D)', () => { const b = blank(); VIEW.forEach(([k]) => (viewChecks[k].checked = b[k])); rH.value = 'hide'; dirty(); })));
            cS = W.chk('시스템 디렉터리 포함(Y)', w.sysDirs); cZ = W.chk('압축 파일 포함(ZIP, CAB 등)(C)', w.zip); cN = W.chk('항상 파일 이름 및 내용 검색(시간이 걸릴 수 있음)(F)', w.contents);
            const search = h('div', {}, W.group('색인되지 않은 위치를 검색할 때', W.row(cS), W.row(cZ), W.row(cN)), h('div', { class: 'fo-right' }, W.btn('기본값 복원(D)', () => { cS.checked = true; cZ.checked = false; cN.checked = false; dirty(); })));
            el.style.display = 'flex'; el.style.flexDirection = 'column';
            el.append(W.tabs([{ t: '일반', el: gen }, { t: '보기', el: view }, { t: '검색', el: search }], { start: q && q.start === 'view' ? 1 : 0 }).el);
            // [적용]은 무언가 바꿨을 때만 누를 수 있습니다(에뮬레이터·Windows와 같음).
            el.addEventListener('change', dirty);
          },
          buttons: [{ t: '확인', def: true, on: () => { apply(); setTimeout(() => SIMS.closed(desk, open, '폴더 옵션'), 0); } }, { t: '취소', cancel: true }, { t: '적용(A)', dis: true, on: () => { apply(); applyBtn.disabled = true; return false; } }],
          onCancelled: () => SIMS.closed(desk, open, '폴더 옵션') });
        main.el.classList.add('emu-rd', 'rd-fo');
        applyBtn = main.btn('적용(A)');
      }
      open();
      return { state: () => flat(st), open, st };
    },
  });
})(window);
