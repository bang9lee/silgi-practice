// 화면 자동 테스트: Electron 앱을 띄워 실제 화면을 조작하고 채점 결과를 확인합니다.
// 실행: npm run test:ui   (VS Code 터미널의 ELECTRON_RUN_AS_NODE 값은 이 스크립트가 지웁니다)
'use strict';
const { _electron: electron } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..', '..');
const SHOTS = process.env.SILGI_SHOTS || path.join(os.tmpdir(), 'silgi-e2e');
fs.mkdirSync(SHOTS, { recursive: true });

// 페이지 안에서 쓰는 조작 도우미
const HELP = `
window.T = {
  top() { const ws = [...document.querySelectorAll('.w7')]; return ws.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0]; },
  btn(t, root) { root = root || T.top(); const b = [...root.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(t) && !x.disabled); if (!b) throw new Error('버튼 없음: ' + t); b.click(); },
  md(el) { el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); },
  dbl(el) { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); },
  ctx(el) { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 10, clientY: r.top + 5 })); },
  tn(label) { const n = [...document.querySelectorAll('.tn')].find(x => x.querySelector('.lb').textContent.trim() === label); if (!n) throw new Error('트리 항목 없음: ' + label); return n; },
  row(t, root) { root = root || T.top(); const r = [...root.querySelectorAll('tr[data-id]')].find(x => x.textContent.includes(t)); if (!r) throw new Error('줄 없음: ' + t); return r; },
  rowx(t, root) { root = root || T.top(); const r = [...root.querySelectorAll('tr[data-id]')].find(x => x.querySelector('td').textContent.trim() === t); if (!r) throw new Error('줄 없음: ' + t); return r; },
  menu(t) { const m = [...document.querySelectorAll('.cm7 .mi')].find(x => x.textContent.trim().startsWith(t)); if (!m) throw new Error('메뉴 없음: ' + t); m.dispatchEvent(new MouseEvent('mouseenter')); m.click(); },
  hover(t) { const m = [...document.querySelectorAll('.cm7 .mi')].find(x => x.textContent.trim().startsWith(t)); m.dispatchEvent(new MouseEvent('mouseenter')); },
  radio(t, root) { root = root || T.top(); const l = [...root.querySelectorAll('label.rad7')].find(x => x.textContent.trim().startsWith(t)); if (!l) throw new Error('라디오 없음: ' + t); l.querySelector('input').click(); },
  chk(t, on, root) { root = root || T.top(); const l = [...root.querySelectorAll('label.chk7')].find(x => x.textContent.trim().startsWith(t)); if (!l) throw new Error('체크 없음: ' + t); const i = l.querySelector('input'); if (i.checked !== on) i.click(); },
  field(lbl, v, root) {
    root = root || T.top();
    const l = [...root.querySelectorAll('label.l, div.l, .form7 > label')].find(x => x.textContent.trim().startsWith(lbl));
    if (!l) throw new Error('칸 없음: ' + lbl);
    let c = l.nextElementSibling; if (c && c.classList.contains('row7')) c = c.firstElementChild;
    T.set(c, v);
  },
  set(c, v) {
    if (c.classList.contains('ip7')) { c.value = v; c.dispatchEvent(new Event('change')); return; }
    const inp = c.matches('input,select,textarea') ? c : c.querySelector('input,select,textarea');
    inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
  },
  nth(sel, i, root) { return [...(root || T.top()).querySelectorAll(sel)][i]; },
  key(el, k) { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); },
};`;

const results = [];
async function main() {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'silgi-e2e-ud-'));
  const env = { ...process.env, SILGI_USERDATA: userData }; delete env.ELECTRON_RUN_AS_NODE;
  let app = await electron.launch({ args: [ROOT], env });
  let page = await app.firstWindow();
  const errors = [];
  const watch = p => { p.on('pageerror', e => errors.push(String(e.stack || e))); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('dialog', d => d.accept()); };
  watch(page);
  await page.setViewportSize({ width: 1500, height: 920 });
  await page.waitForSelector('#app .wrap');
  await page.evaluate(HELP);
  const w = ms => page.waitForTimeout(ms || 120);
  const ev = async (fn, ...a) => { await page.evaluate(fn, ...a); await w(); };
  const open = async id => { await page.evaluate(() => { location.hash = '#/practice'; }); await w(150); await page.evaluate(h => { location.hash = h; }, '#/q/' + id); await w(500); await page.evaluate(() => { const c = document.querySelector('.concept-ov [data-close]'); if (c) c.click(); }); await w(150); };
  const grade = async () => { await page.click('#b-grade'); await w(250); return page.evaluate(() => { const r = document.querySelector('#res .result'); return r ? { ok: r.classList.contains('ok'), text: r.innerText.slice(0, 400) } : null; }); };
  async function check(name, id, steps, wantOk = true) {
    try {
      await open(id);
      await steps();
      const r = await grade();
      const pass = r && r.ok === wantOk;
      results.push([pass ? 'PASS' : 'FAIL', name, pass ? '' : JSON.stringify(r)]);
      if (!pass) await page.screenshot({ path: path.join(SHOTS, `fail-${id}.png`) });
    } catch (e) { results.push(['FAIL', name, String(e.message || e)]); await page.screenshot({ path: path.join(SHOTS, `err-${id}.png`) }); }
  }

  // 1) 네트워크 설정 (TCP/IPv4)
  await check('TCP/IPv4 정답 입력 → 정답', 'net-win-tcpip-01', async () => {
    await ev(() => { T.md(T.row('TCP/IP v4')); }); await ev(() => T.btn('속성(R)'));
    await ev(() => { T.radio('다음 IP 주소 사용'); T.field('IP 주소(I):', '200.100.10.14'); T.field('서브넷 마스크(U):', '255.255.255.240'); T.field('기본 게이트웨이(D):', '200.100.10.1'); T.field('기본 설정 DNS 서버(P):', '168.126.63.1'); T.field('보조 DNS 서버(A):', '168.126.63.2'); });
    await ev(() => T.btn('확인')); await w(300); await ev(() => T.btn('확인')); await w(200);
  });
  await check('TCP/IPv4 바깥 창 확인 안 누름 → 오답', 'net-win-tcpip-01', async () => {
    await ev(() => { T.md(T.row('TCP/IP v4')); }); await ev(() => T.btn('속성(R)'));
    await ev(() => { T.radio('다음 IP 주소 사용'); T.field('IP 주소(I):', '200.100.10.14'); T.field('서브넷 마스크(U):', '255.255.255.240'); T.field('기본 게이트웨이(D):', '200.100.10.1'); T.field('기본 설정 DNS 서버(P):', '168.126.63.1'); T.field('보조 DNS 서버(A):', '168.126.63.2'); });
    await ev(() => T.btn('확인')); await w(300);
  }, false);

  // 2) DHCP 새 범위 마법사 + 예약
  await check('DHCP 범위 + 예약 → 정답', 'net-win-dhcp-02', async () => {
    await ev(() => T.ctx(T.tn('IPv4'))); await ev(() => T.menu('새 범위'));
    await ev(() => T.btn('다음')); await ev(() => { T.field('이름(A):', 'net2'); }); await ev(() => T.btn('다음'));
    await ev(() => { const s = T.nth('.ip7', 0); s.value = '10.10.10.10'; s.dispatchEvent(new Event('leave')); T.nth('.ip7', 1).value = '10.10.10.200'; T.set(T.nth('input[type=number]', 0), 24); });
    await ev(() => T.btn('다음')); await ev(() => T.btn('다음'));
    await ev(() => { T.set(T.nth('input[type=number]', 0), 3); }); await ev(() => T.btn('다음'));
    await ev(() => T.btn('다음'));
    await ev(() => { T.nth('.ip7', 0).value = '10.10.10.1'; T.btn('추가(D)'); }); await ev(() => T.btn('다음'));
    await ev(() => { T.nth('.ip7', 0).value = '10.10.10.2'; T.btn('추가(D)'); }); await ev(() => T.btn('다음'));
    await ev(() => T.btn('다음'));
    await ev(() => T.radio('아니요')); await ev(() => T.btn('다음')); await ev(() => T.btn('마침'));
    await ev(() => T.ctx(T.tn('예약'))); await ev(() => T.menu('새 예약'));
    await ev(() => { T.field('예약 이름(R):', 'printer'); T.field('IP 주소(P):', '10.10.10.100'); T.field('MAC 주소(M):', '00-1A-2B-3C-4D-5E'); });
    await ev(() => T.btn('추가(A)')); await ev(() => T.btn('닫기'));
  });

  // 3) 라우터
  const typeCmds = async cmds => { for (const c of cmds) { await page.fill('.term-in input', c); await page.press('.term-in input', 'Enter'); } await w(); };
  await check('라우터 m05 줄임말 명령 → 정답', 'router-m05', () => typeCmds(['en', 'conf t', 'int s2/0', 'ip add 192.168.0.101 255.255.255.0', 'ip add 192.168.0.102 255.255.255.0 secondary', 'no sh', 'end', 'copy r s', '']));
  await check('라우터 저장 안 함 → 오답', 'router-m01', () => typeCmds(['en', 'conf t', 'int fa0/0', 'ip add 192.168.0.100 255.255.255.0', 'end']), false);

  // 4) BIOS (키보드만)
  await check('BIOS b01 부팅 순서 → 정답', 'bios-b01', async () => {
    const keys = ['ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'ArrowDown', 'Enter', 'ArrowDown', 'Enter', 'ArrowUp', 'Enter', 'F10', 'y', 'Enter'];
    // 메인 → Advanced BIOS Features → First Boot Device 목록(Floppy→CD-ROM: 아래 2번) → Second(Hard Disk 그대로가 아니라 기본이 Hard Disk)
    for (const k of keys.slice(0, 2)) await page.keyboard.press(k);
    await w();
    // First Boot Device까지 이동 (Virus, Cache, ECC, QPOST 다음)
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await page.keyboard.press('F10'); await page.keyboard.press('y'); await page.keyboard.press('Enter'); await w(200);
  });
  await check('BIOS 저장 안 하고 나감 → 오답', 'bios-b03', async () => { await page.keyboard.press('Escape'); await page.keyboard.press('y'); await page.keyboard.press('Enter'); }, false);

  // 5) 로컬 보안 정책 (제안 값 상자 포함)
  await check('로컬 보안 정책 → 정답', 'net-win-secpol-01', async () => {
    await ev(() => T.dbl(T.row('최대 암호 사용 기간'))); await ev(() => { T.set(T.nth('input[type=number]', 0), 20); T.btn('확인'); }); await w();
    await ev(() => T.dbl(T.row('최소 암호 사용 기간'))); await ev(() => { T.set(T.nth('input[type=number]', 0), 10); T.btn('확인'); }); await w();
    await ev(() => T.md(T.tn('계정 잠금 정책'))); await ev(() => T.dbl(T.row('계정 잠금 임계값'))); await ev(() => { T.set(T.nth('input[type=number]', 0), 3); T.btn('확인'); }); await w(200);
    await ev(() => T.btn('확인')); await w(200);
  });

  // 6) 서비스
  await check('서비스: 사용 안 함 + 중지 → 정답', 'net-win-svc-01', async () => {
    await ev(() => T.dbl(T.row('Print Spooler'))); await ev(() => { const s = T.nth('select', 0); T.set(s, '사용 안 함'); T.btn('중지(T)'); }); await ev(() => T.btn('확인'));
  });

  // 7) 레지스트리 (새 키·새 문자열 값·이름 바꾸기·값 수정)
  await check('레지스트리 새 키·값 → 정답', 'pc-reg-01', async () => {
    await ev(() => T.md(T.tn('컴퓨터'))); await ev(() => { T.tn('HKEY_CURRENT_USER').querySelector('.tg').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); });
    await ev(() => T.ctx(T.tn('Software'))); await ev(() => T.hover('새로 만들기')); await ev(() => T.menu('키(K)'));
    await page.keyboard.type('ICQA'); await page.keyboard.press('Enter'); await w(200);
    await ev(() => { const r = document.querySelector('.mmc-right > div'); r.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 900, clientY: 500 })); });
    await ev(() => T.hover('새로 만들기')); await ev(() => T.menu('문자열 값'));
    await page.keyboard.type('Exam'); await page.keyboard.press('Enter'); await w(200);
    await ev(() => T.dbl(T.row('Exam'))); await ev(() => { T.field('값 데이터(V):', 'PC2'); T.btn('확인'); });
  });

  // 8) 콘솔
  await check('콘솔 ipconfig /all → 정답', 'pc-con-01', async () => { await page.fill('.cmd7 input', 'ipconfig /all'); await page.press('.cmd7 input', 'Enter'); await w(); });
  await check('콘솔 다른 명령 → 오답', 'pc-con-02', async () => { await page.fill('.cmd7 input', 'ipconfig'); await page.press('.cmd7 input', 'Enter'); await w(); }, false);

  // 9) 단답·선택·다택
  await check('단답형 정답(대소문자 무시)', 'net-short-waf', async () => { await page.fill('.ans-pane input', '  waf '); });
  await check('단답형 오답', 'net-short-rip', async () => { await page.fill('.ans-pane input', 'OSPF'); }, false);
  await check('다택형 IPv6 정답', 'net-ipv6-multi', async () => { for (const i of [0, 2, 4, 5]) await page.click(`.opts .opt >> nth=${i}`); });
  await check('다택형 하나 빠짐 → 오답', 'net-ipv6-multi', async () => { for (const i of [0, 2, 4]) await page.click(`.opts .opt >> nth=${i}`); }, false);

  // 10) 폴더 옵션, 가상 메모리, 디스크 관리
  await check('폴더 옵션 → 정답', 'pc-folder-01', async () => { await ev(() => { T.radio('숨김 파일, 폴더 및 드라이브 표시'); T.chk('알려진 파일 형식', false); T.btn('확인'); }); });
  await check('가상 메모리 [설정] 누름 → 정답', 'pc-vmem-01', async () => {
    await ev(() => T.btn('설정(S)...')); await ev(() => T.btn('변경(C)...'));
    await ev(() => { T.chk('모든 드라이브에 대한', false); T.radio('사용자 지정 크기'); T.field('처음 크기(MB)(I):', '1024'); T.field('최대 크기(MB)(X):', '4096'); T.btn('설정(S)'); });
    await ev(() => T.btn('확인')); await w(200); await ev(() => T.btn('확인'));
  });
  await check('가상 메모리 [설정] 안 누름 → 오답', 'pc-vmem-01', async () => {
    await ev(() => T.btn('설정(S)...')); await ev(() => T.btn('변경(C)...'));
    await ev(() => { T.chk('모든 드라이브에 대한', false); T.radio('사용자 지정 크기'); T.field('처음 크기(MB)(I):', '1024'); T.field('최대 크기(MB)(X):', '4096'); });
    await ev(() => T.btn('확인')); await w(200);
  }, false);
  await check('디스크 관리 새 볼륨 → 정답', 'pc-disk-01', async () => {
    await ev(() => { const p = [...document.querySelectorAll('.dk-part')].find(x => x.textContent.includes('할당되지 않음')); T.md(p); T.ctx(p); }); await ev(() => T.menu('새 단순 볼륨'));
    await ev(() => T.btn('다음')); await ev(() => { T.set(T.nth('input.tb7', 0), '102400'); }); await ev(() => T.btn('다음'));
    await ev(() => { T.set(T.nth('select', 0), 'E'); }); await ev(() => T.btn('다음'));
    await ev(() => { T.field('볼륨 레이블(V):', 'DATA2'); }); await ev(() => T.btn('다음')); await ev(() => T.btn('마침'));
  });

  // 포맷 대화상자 → 경고 상자(확인) — 경고 상자가 컴퓨터 관리 창에 가려지지 않아야 한다
  await check('디스크 관리 포맷 → 정답', 'pc-disk-03', async () => {
    await ev(() => { const p = [...document.querySelectorAll('.dk-part')].find(x => x.textContent.includes('DATA (D:)')); T.md(p); T.ctx(p); }); await ev(() => T.menu('포맷'));
    await ev(() => { T.field('볼륨 레이블(V):', 'BACKUP'); T.set(T.nth('select', 0), 'NTFS'); T.chk('빠른 포맷', true); T.btn('확인'); });
    await ev(() => { if (!T.top().textContent.includes('모든 데이터가 지워집니다')) throw new Error('경고 상자가 맨 앞에 없음'); T.btn('확인'); });
  });

  // 11) 사용자 계정 + 그룹 (신유형)
  await check('계정 + 그룹 → 정답', 'net-win-users-01', async () => {
    await ev(() => T.ctx(T.tn('사용자'))); await ev(() => T.menu('새 사용자'));
    await ev(() => { T.field('사용자 이름(U):', 'ICQA'); T.field('전체 이름(F):', '정보통신'); T.field('암호(P):', 'Icqa!2026'); T.field('암호 확인(C):', 'Icqa!2026'); T.chk('다음 로그온할 때', false); T.chk('사용자가 암호를', true); T.chk('암호 사용 기간', true); T.btn('만들기'); });
    await ev(() => T.btn('닫기'));
    await ev(() => T.ctx(T.tn('그룹'))); await ev(() => T.menu('새 그룹'));
    await ev(() => { T.field('그룹 이름(G):', 'NetAdmin'); T.field('설명(D):', '네트워크 관리'); T.btn('만들기'); }); await ev(() => T.btn('닫기'));
    await ev(() => T.md(T.tn('사용자'))); await ev(() => T.dbl(T.rowx('ICQA'))); await w();
    await ev(() => { [...T.top().querySelectorAll('.tabs7-h span')].find(s => s.textContent === '소속 그룹').dispatchEvent(new MouseEvent('mousedown')); });
    for (const gname of ['NetAdmin', 'Administrators']) { await ev(() => T.btn('추가(D)...')); await ev(n => { T.set(T.top().querySelector('textarea'), n); T.btn('확인'); }, gname); }
    await ev(() => T.btn('확인'));
  });

  // 12) 모의고사: 시작 → 제출 → 결과 화면
  try {
    await page.evaluate(() => { location.hash = '#/mock'; }); await w(300);
    await page.click('[data-act=mock-start]'); await w(600);
    const n = await page.$$eval('.mock-nav button', b => b.length);
    await page.click('#m-next'); await w(300);
    await page.click('#m-submit'); await w(600);
    const ok = await page.evaluate(() => location.hash === '#/mock/result' && !!document.querySelector('.score-big'));
    results.push([ok && n === 18 ? 'PASS' : 'FAIL', `모의고사 18문항 시작·제출·결과 (문항 ${n})`, '']);
    await page.screenshot({ path: path.join(SHOTS, 'mock-result.png') });
  } catch (e) { results.push(['FAIL', '모의고사', String(e.message)]); }

  // 13) 기록 저장: 끄고 다시 켜도 오답노트가 남는가
  const wrongBefore = await page.evaluate(() => Object.keys(window.STORE.d.wrong).length);
  await page.evaluate(() => window.STORE.saveNow());
  await page.waitForTimeout(300);
  await app.close();
  app = await electron.launch({ args: [ROOT], env });
  page = await app.firstWindow(); watch(page);
  await page.waitForSelector('#app .wrap');
  const wrongAfter = await page.evaluate(() => Object.keys(window.STORE.d.wrong).length);
  const attempts = await page.evaluate(() => Object.keys(window.STORE.d.attempts).length);
  results.push([wrongBefore > 0 && wrongAfter === wrongBefore && attempts > 10 ? 'PASS' : 'FAIL', `다시 켜도 기록 유지 (오답 ${wrongBefore} → ${wrongAfter}, 푼 문제 ${attempts})`, '']);
  await page.screenshot({ path: path.join(SHOTS, 'home-after-restart.png') });
  await app.close();

  for (const [s, n, d] of results) console.log(`${s}  ${n}${d ? '  → ' + d : ''}`);
  console.log('화면 오류:', errors.length ? errors.join('\n') : '(없음)');
  const fails = results.filter(r => r[0] !== 'PASS').length + (errors.length ? 1 : 0);
  console.log(`\n${results.length - results.filter(r => r[0] !== 'PASS').length}/${results.length} 통과`);
  process.exit(fails ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
