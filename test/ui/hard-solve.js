// 심화 문제 몇 개를 사람이 푸는 것처럼 화면을 조작해 끝까지 풀고 채점까지 확인합니다.
// 사용: node test/ui/hard-solve.js
'use strict';
const { _electron: electron } = require('playwright-core');
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const SHOTS = process.env.SILGI_SHOTS || path.join(os.tmpdir(), 'silgi-hard-solve');
fs.mkdirSync(SHOTS, { recursive: true });

const HELP = `
window.T = {
  top() { const ws = [...document.querySelectorAll('.w7')]; return ws.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0]; },
  vis(el) { return el && el.getClientRects().length > 0; },
  btn(t, root) { root = root || T.top(); const b = [...root.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(t) && !x.disabled && T.vis(x)); if (!b) throw new Error('버튼 없음: ' + t); b.click(); },
  md(el) { el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); },
  dbl(el) { el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); },
  ctx(el) { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: r.left + 10, clientY: r.top + 5 })); },
  tn(label) { const n = [...document.querySelectorAll('.tn')].find(x => x.querySelector('.lb').textContent.trim() === label); if (!n) throw new Error('트리 항목 없음: ' + label); return n; },
  expand(label) { T.tn(label).querySelector('.tg').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); },
  row(t, root) { root = root || T.top(); const r = [...root.querySelectorAll('tr[data-id]')].find(x => x.textContent.includes(t)); if (!r) throw new Error('줄 없음: ' + t); return r; },
  menu(t) { const m = [...document.querySelectorAll('.cm7 .mi')].find(x => x.textContent.trim().startsWith(t)); if (!m) throw new Error('메뉴 없음: ' + t); m.dispatchEvent(new MouseEvent('mouseenter')); m.click(); },
  hover(t) { const m = [...document.querySelectorAll('.cm7 .mi')].find(x => x.textContent.trim().startsWith(t)); m.dispatchEvent(new MouseEvent('mouseenter')); },
  radio(t, root) { root = root || T.top(); const l = [...root.querySelectorAll('label.rad7')].find(x => x.textContent.trim().startsWith(t) && T.vis(x)); if (!l) throw new Error('라디오 없음: ' + t); l.querySelector('input').click(); },
  chk(t, on, root) { root = root || T.top(); const l = [...root.querySelectorAll('label.chk7')].find(x => x.textContent.trim().startsWith(t) && T.vis(x)); if (!l) throw new Error('체크 없음: ' + t); const i = l.querySelector('input'); if (i.checked !== on) i.click(); },
  field(lbl, v, root) {
    root = root || T.top();
    const l = [...root.querySelectorAll('label.l, div.l, .form7 > label')].find(x => x.textContent.trim().startsWith(lbl) && T.vis(x));
    if (!l) throw new Error('칸 없음: ' + lbl);
    let c = l.nextElementSibling; if (c && c.classList.contains('row7')) c = c.firstElementChild;
    T.set(c, v);
  },
  set(c, v) {
    if (c.classList.contains('ip7')) { c.value = v; c.dispatchEvent(new Event('change')); c.dispatchEvent(new Event('leave')); return; }
    const inp = c.matches('input,select,textarea') ? c : c.querySelector('input,select,textarea');
    inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
  },
  nth(sel, i, root) { return [...(root || T.top()).querySelectorAll(sel)].filter(T.vis)[i]; },
  tab(t, root) { root = root || T.top(); const s = [...root.querySelectorAll('.tabs7-h span')].find(x => x.textContent.trim() === t); if (!s) throw new Error('탭 없음: ' + t); s.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); },
  key(el, k) { el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); },
};`;

(async () => {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'silgi-solve-'));
  const env = { ...process.env, SILGI_USERDATA: ud }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: [ROOT], env });
  const page = await app.firstWindow();
  const errs = []; page.on('pageerror', e => errs.push(String(e.stack || e))); page.on('dialog', d => d.accept());
  await page.setViewportSize({ width: 1600, height: 940 });
  await page.waitForSelector('#app .wrap');
  await page.evaluate(HELP);
  const w = ms => page.waitForTimeout(ms || 150);
  const ev = async (fn, ...a) => { await page.evaluate(fn, ...a); await w(); };
  const results = [];
  async function check(name, id, steps) {
    try {
      await page.evaluate(() => { location.hash = '#/practice'; }); await w(150);
      await page.evaluate(h => { location.hash = h; }, '#/q/' + id); await w(600);
      await page.evaluate(() => { const c = document.querySelector('.concept-ov [data-close]'); if (c) c.click(); }); await w(200);
      await steps();
      await page.click('#b-grade'); await w(300);
      const r = await page.evaluate(() => { const x = document.querySelector('#res .result'); return x ? { ok: x.classList.contains('ok'), text: x.innerText.slice(0, 500) } : null; });
      results.push([r && r.ok ? 'PASS' : 'FAIL', name, r && r.ok ? '' : JSON.stringify(r)]);
      if (!r || !r.ok) await page.screenshot({ path: path.join(SHOTS, `fail-${id}.png`) });
    } catch (e) { results.push(['FAIL', name, String(e.message || e)]); await page.screenshot({ path: path.join(SHOTS, `err-${id}.png`) }); }
  }

  // 1) 디스크 관리: 디스크 0에 FAT32 32GB + 남은 공간 NTFS(압축)
  await check('디스크 볼륨 2개 (hp-disk-03)', 'hp-disk-03', async () => {
    const newVol = async (size, letter, fs, label, compress) => {
      await ev(() => { const p = [...document.querySelectorAll('.dk-part')].find(x => x.textContent.includes('할당되지 않음')); T.md(p); T.ctx(p); }); await ev(() => T.menu('새 단순 볼륨'));
      await ev(() => T.btn('다음'));
      if (size) await ev(s => T.set(T.nth('input.tb7', 0), s), size);
      await ev(() => T.btn('다음'));
      await ev(l => T.set(T.nth('select', 0), l), letter); await ev(() => T.btn('다음'));
      await ev(([f, lb, c]) => { T.set(T.nth('select', 0), f); T.field('볼륨 레이블(V):', lb); if (c) T.chk('파일 및 폴더 압축', true); }, [fs, label, compress]);
      await ev(() => T.btn('다음')); await ev(() => T.btn('마침'));
    };
    await newVol('32768', 'G', 'FAT32', 'OLD', false);
    await newVol(null, 'H', 'NTFS', 'NEW', true);
  });

  // 2) DNS: 정방향 + 역방향 영역, 연결된 PTR이 있는 A, A, MX
  await check('DNS 영역 2개 + PTR + MX (hn-dns-01)', 'hn-dns-01', async () => {
    await ev(() => T.ctx(T.tn('정방향 조회 영역'))); await ev(() => T.menu('새 영역'));
    await ev(() => T.btn('다음')); await ev(() => T.btn('다음'));
    await ev(() => T.field('영역 이름(Z):', 'icqa.or.kr')); await ev(() => T.btn('다음'));
    await ev(() => T.btn('다음')); await ev(() => T.btn('다음')); await ev(() => T.btn('마침'));
    await ev(() => T.ctx(T.tn('역방향 조회 영역'))); await ev(() => T.menu('새 영역'));
    await ev(() => T.btn('다음')); await ev(() => T.btn('다음')); await ev(() => T.btn('다음'));
    await ev(() => { const ins = [...T.top().querySelectorAll('span.ip7 input')].filter(T.vis); ['192', '168', '100'].forEach((v, i) => { ins[i].value = v; ins[i].dispatchEvent(new Event('input', { bubbles: true })); }); });
    await ev(() => T.btn('다음')); await ev(() => T.btn('다음')); await ev(() => T.btn('다음')); await ev(() => T.btn('마침'));
    const host = async (name, ip, ptr) => {
      await ev(n => { T.field('이름(입력하지 않으면', n); }, name);
      await ev(v => T.field('IP 주소(P):', v), ip);
      await ev(p => T.chk('연결된 PTR', p), ptr);
      await ev(() => T.btn('호스트 추가')); await ev(() => T.btn('확인'));
    };
    await ev(() => { T.md(T.tn('icqa.or.kr')); T.ctx(T.tn('icqa.or.kr')); }); await ev(() => T.menu('새 호스트'));
    await host('www', '192.168.100.20', true);
    await host('mail', '192.168.100.25', false);
    await ev(() => T.btn('완료'));
    await ev(() => T.ctx(T.tn('icqa.or.kr'))); await ev(() => T.menu('새 MX'));
    await ev(() => { T.field('메일 서버의 FQDN', 'mail.icqa.or.kr'); T.field('메일 서버 우선 순위', '10'); T.btn('확인'); });
  });

  // 3) 레지스트리: 키 이름 바꾸기 + 다중 문자열 값
  await check('레지스트리 이름 바꾸기 + 다중 문자열 (hp-reg-04)', 'hp-reg-04', async () => {
    await ev(() => T.md(T.tn('컴퓨터'))); await ev(() => T.expand('HKEY_CURRENT_USER')); await ev(() => T.expand('Software'));
    await ev(() => { T.md(T.tn('ICQA')); T.ctx(T.tn('ICQA')); }); await ev(() => T.menu('이름 바꾸기'));
    await ev(() => { const i = document.querySelector('.tn .lb input'); i.value = 'ICQA2026'; T.key(i, 'Enter'); });
    await ev(() => T.md(T.tn('ICQA2026')));
    await ev(() => { const r = document.querySelector('.mmc-right > div'); r.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 900, clientY: 600 })); });
    await ev(() => T.hover('새로 만들기')); await ev(() => T.menu('다중 문자열 값'));
    await page.keyboard.type('Subjects'); await page.keyboard.press('Enter'); await w(200);
    await ev(() => T.dbl(T.row('Subjects')));
    await ev(() => { T.set(T.top().querySelector('textarea'), '네트워크\nPC정비'); T.btn('확인'); });
  });

  // 4) TCP/IP 고급: IP 2개, 게이트웨이 2개, DNS 3개
  await check('TCP/IP 고급 설정 (hn-tcpip-02)', 'hn-tcpip-02', async () => {
    await ev(() => T.md(T.row('TCP/IP v4'))); await ev(() => T.btn('속성(R)'));
    await ev(() => { T.radio('다음 IP 주소 사용'); T.field('IP 주소(I):', '172.16.5.10'); T.field('서브넷 마스크(U):', '255.255.0.0'); T.field('기본 게이트웨이(D):', '172.16.0.1'); T.field('기본 설정 DNS 서버(P):', '8.8.8.8'); T.field('보조 DNS 서버(A):', '8.8.4.4'); });
    await ev(() => T.btn('고급(V)'));
    await ev(() => T.btn('추가(A)...')); await ev(() => { T.field('IP 주소(I):', '172.16.5.11'); T.field('서브넷 마스크(S):', '255.255.0.0'); T.btn('추가(A)'); });
    await ev(() => T.btn('추가(D)...')); await ev(() => { T.field('게이트웨이(G):', '172.16.0.254'); T.btn('추가(A)'); });
    await ev(() => T.tab('DNS')); await ev(() => T.btn('추가(A)...')); await ev(() => { T.field('DNS 서버(S):', '1.1.1.1'); T.btn('추가(A)'); });
    await ev(() => T.btn('확인')); await w(200); await ev(() => T.btn('확인')); await w(300); await ev(() => T.btn('확인')); await w(200);
  });

  for (const [s, n, d] of results) console.log(s.padEnd(5), n, d ? '← ' + d : '');
  console.log(`\n${results.filter(r => r[0] === 'PASS').length}/${results.length} 통과 · 화면 오류: ${errs.length ? errs.join('\n') : '없음'} · 실패 화면: ${SHOTS}`);
  await app.close();
  process.exit(results.every(r => r[0] === 'PASS') && !errs.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
