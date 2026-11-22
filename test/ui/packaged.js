// 빌드된 실행 파일(dist/win-unpacked)을 띄워 화면이 뜨는지, 인터넷 요청이 없는지 확인합니다.
'use strict';
const { _electron: electron } = require('playwright-core');
const path = require('path'), fs = require('fs'), os = require('os');
(async () => {
  const exe = fs.readdirSync(path.join(__dirname, '../../dist/win-unpacked')).find(f => f.endsWith('.exe'));
  const env = { ...process.env, SILGI_USERDATA: fs.mkdtempSync(path.join(os.tmpdir(), 'silgi-pkg-')) }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: path.join(__dirname, '../../dist/win-unpacked', exe), env });
  const page = await app.firstWindow();
  const net = []; const errs = [];
  page.on('request', r => { if (!/^(file|data|devtools|chrome-extension):/.test(r.url())) net.push(r.url()); });
  page.on('pageerror', e => errs.push(e.message));
  await page.waitForSelector('#app .wrap', { timeout: 20000 });
  for (const h of ['#/', '#/q/net-win-dhcp-01', '#/q/pc-reg-01', '#/q/bios-b01', '#/q/router-m01', '#/concept/cable', '#/mock']) { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(500); }
  const font = await page.evaluate(() => document.fonts.check('16px "Pretendard Variable"'));
  const qn = await page.evaluate(() => window.APP.Q.length);
  console.log('문제 수', qn, '| Pretendard 글꼴', font ? '적용됨' : '없음', '| 인터넷 요청', net.length ? net : '없음', '| 화면 오류', errs.length ? errs : '없음');
  await app.close();
  process.exit(net.length || errs.length || !font ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
