// 화면 확인용: Electron을 띄워 여러 화면을 스크린샷으로 찍고, 콘솔 오류를 모읍니다.
// 사용: node test/ui/smoke.js [출력폴더] [#/경로 ...]
'use strict';
const { _electron: electron } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

(async () => {
  const outDir = process.argv[2] || path.join(os.tmpdir(), 'silgi-shots');
  const routes = process.argv.slice(3).length ? process.argv.slice(3) : ['#/'];
  fs.mkdirSync(outDir, { recursive: true });
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'silgi-ud-'));
  const env = { ...process.env, SILGI_USERDATA: userData };
  delete env.ELECTRON_RUN_AS_NODE; // VS Code 터미널이 넣는 값. 있으면 Electron이 창 없이 Node로 실행됩니다.
  const app = await electron.launch({ args: [path.join(__dirname, '..', '..')], env });
  const page = await app.firstWindow();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e.stack || e)));
  page.on('dialog', d => d.accept());
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.waitForSelector('#app .wrap, #app .run', { timeout: 15000 });
  let i = 0;
  for (const r of routes) {
    await page.evaluate(h => { location.hash = h; }, r);
    await page.waitForTimeout(900);
    const f = path.join(outDir, `${String(i++).padStart(2, '0')}-${r.replace(/[^\w-]+/g, '_')}.png`);
    await page.screenshot({ path: f });
    console.log('shot', f);
  }
  console.log('ERRORS:', errors.length ? errors.join('\n') : '(없음)');
  await app.close();
})().catch(e => { console.error(e); process.exit(1); });
