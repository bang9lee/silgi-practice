// 심화 가상 화면 문제 검사: 앱 안에서 문제마다 가상 화면을 띄워
//  ① 처음 상태에서는 오답인지(아무것도 안 해도 정답이 되면 안 됨)
//  ② 처음부터 있는 칸(서비스·보안 정책·폴더 옵션 등)의 채점 키가 실제 상태에 있는지
//  ③ 대상(target)·처음 설정(init)이 제대로 들어갔는지 확인합니다.
// 사용: node test/ui/hard-sims.js
'use strict';
const { _electron: electron } = require('playwright-core');
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.join(__dirname, '..', '..');

(async () => {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'silgi-hard-'));
  const env = { ...process.env, SILGI_USERDATA: ud }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: [ROOT], env });
  const page = await app.firstWindow();
  const errs = []; page.on('pageerror', e => errs.push(String(e.stack || e)));
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.waitForSelector('#app .wrap');
  if (process.argv.includes('--all')) await page.evaluate(() => { window.__ALL = true; });
  const res = await page.evaluate(() => {
    const STATIC = ['tcpip', 'secpol', 'services', 'sysprop', 'mstsc', 'folderopt', 'devmgmt'];
    const out = [];
    const qs = window.APP.Q.filter(q => (window.__ALL || /^심화/.test(q.label)) && q.type === 'sim' && q.sim !== 'console');
    for (const q of qs) {
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:800px;visibility:hidden';
      document.body.append(host);
      try {
        const desk = new window.W.Desk(host); desk.el.style.cssText += ';width:1200px;height:800px;position:relative';
        const H = window.SIMS.get(q.sim).mount(desk, q);
        const st = H.state();
        const r = window.GRADER.gradeState(q.answer, st);
        const problems = [];
        if (r.ok) problems.push('처음 상태에서 이미 정답');
        if (STATIC.includes(q.sim)) Object.keys(q.answer).forEach(k => { if (!(k in st)) problems.push('없는 채점 키 ' + k); });
        if (q.sim === 'printer') Object.keys(q.answer).filter(k => !/\.perm\.user1\./.test(k)).forEach(k => { if (!(k in st)) problems.push('없는 채점 키 ' + k); });
        if (q.target && !st['scope.exists'] && !st['site.exists']) problems.push('대상 ' + q.target + '을(를) 못 찾음');
        if (q.sim === 'dns' && q.init) q.init.zones.forEach(z => { if (!st[`zone|${z.name}|exists`]) problems.push('처음 영역 없음 ' + z.name); });
        if (q.sim === 'regedit' && q.init) Object.keys(q.init).forEach(p => { if (!st['key:' + p.toLowerCase()]) problems.push('처음 키 없음 ' + p); });
        out.push({ id: q.id, sim: q.sim, wrongAtStart: r.items.filter(i => !i.ok).length + '/' + r.items.length, problems });
      } catch (e) { out.push({ id: q.id, sim: q.sim, problems: ['띄우기 실패: ' + e.message] }); }
      host.remove();
    }
    return out;
  });
  let bad = 0;
  for (const r of res) { const ok = !r.problems.length; if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', r.id.padEnd(14), r.sim.padEnd(10), '처음 상태 오답 칸', r.wrongAtStart || '-', ok ? '' : '← ' + r.problems.join(' / ')); }
  console.log(`\n가상 화면 심화 문제 ${res.length}개 중 문제 있음 ${bad}개 · 화면 오류 ${errs.length ? errs.join('\n') : '없음'}`);
  await app.close();
  process.exit(bad || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
