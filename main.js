// 실기 연습 프로그램 — Electron 메인 프로세스
// 하는 일: 창 만들기, data/*.json 읽어 주기, 진행 기록을 사용자 데이터 폴더의 JSON 파일로 저장하기.
'use strict';
const { app, BrowserWindow, ipcMain, shell, Menu, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// 자동 테스트가 기록 폴더를 따로 쓰게 합니다 (실제 기록을 건드리지 않도록).
if (process.env.SILGI_USERDATA) app.setPath('userData', process.env.SILGI_USERDATA);

const DATA_DIR = path.join(__dirname, 'data');
const storeFile = () => path.join(app.getPath('userData'), 'progress.json');

function loadData() {
  const out = {};
  for (const f of fs.readdirSync(DATA_DIR)) {
    if (!f.endsWith('.json')) continue;
    out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
  }
  return out;
}

function loadStore() {
  try { return JSON.parse(fs.readFileSync(storeFile(), 'utf8')); } catch (e) { return null; }
}

function saveStore(obj) {
  const file = storeFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj), 'utf8');
  fs.renameSync(tmp, file); // 쓰는 도중 꺼져도 기존 기록이 깨지지 않게 바꿔치기
  return true;
}

// ───────── AI 선생님 (OpenAI 방식 API) ─────────
// 키는 코드에 넣지 않고 사용자 데이터 폴더의 ai.json에만 둡니다. 화면(렌더러)에는 키 앞뒤 몇 글자만 보냅니다.
const aiFile = () => path.join(app.getPath('userData'), 'ai.json');
const AI_DEFAULT = { baseURL: 'https://100milionseek.top/v1', model: 'deepseek-v4.1-flash-free', apiKey: '' };
function aiLoad() { try { return { ...AI_DEFAULT, ...JSON.parse(fs.readFileSync(aiFile(), 'utf8')) }; } catch (e) { return { ...AI_DEFAULT }; } }
function aiSave(c) { fs.mkdirSync(path.dirname(aiFile()), { recursive: true }); fs.writeFileSync(aiFile(), JSON.stringify(c, null, 2), 'utf8'); }
const keyHint = k => (k ? `${k.slice(0, 6)}…${k.slice(-4)}` : '');
const aiPublic = c => ({ baseURL: c.baseURL, model: c.model, hasKey: !!c.apiKey, keyHint: keyHint(c.apiKey) });
const apiUrl = (c, p) => c.baseURL.replace(/\/+$/, '') + p;

ipcMain.handle('ai:config', () => aiPublic(aiLoad()));
ipcMain.handle('ai:config:set', (e, patch) => {
  const c = aiLoad();
  if (typeof patch.baseURL === 'string' && /^https?:\/\//.test(patch.baseURL.trim())) c.baseURL = patch.baseURL.trim();
  if (typeof patch.model === 'string' && patch.model.trim()) c.model = patch.model.trim();
  if (typeof patch.apiKey === 'string' && patch.apiKey.trim()) c.apiKey = patch.apiKey.trim();
  aiSave(c);
  return aiPublic(c);
});
ipcMain.handle('ai:models', async () => {
  const c = aiLoad();
  if (!c.apiKey) return { ok: false, error: 'API 키가 없습니다.' };
  try {
    const r = await fetch(apiUrl(c, '/models'), { headers: { Authorization: `Bearer ${c.apiKey}` }, signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (j.error && j.error.message) || `HTTP ${r.status}` };
    // 일반 대화 주소(/chat/completions)로 부를 수 있는 모델만
    return { ok: true, models: (j.data || []).filter(m => !m.endpoint).map(m => m.id) };
  } catch (err) { return { ok: false, error: String(err.message || err) }; }
});

// 대화: 조각(delta)이 올 때마다 화면으로 보냅니다.
// 무료 서버는 자주 붐벼서(503) 실패하거나 한참 응답이 없습니다. 글자가 오기 전에 실패하면 간격을 늘려 가며 세 번까지 다시 보내고,
// 다시 보낼 때마다 이유를 화면에 알려 줍니다.
const aiRuns = new Map();
let noEffort = false; // reasoning_effort를 모르는 서비스면 다음부터 빼고 보냅니다
const AI_TRIES = 4, AI_WAIT = [0, 1500, 3000, 5000];
const HEAD_TIMEOUT = 45000, IDLE_TIMEOUT = 40000; // 응답 시작까지 45초, 글자 사이 40초를 넘기면 끊고 다시
ipcMain.handle('ai:abort', (e, id) => { const r = aiRuns.get(id); if (r) r.abort(); return true; });
ipcMain.handle('ai:chat', async (e, { id, messages, maxTokens }) => {
  const c = aiLoad();
  const send = (type, data) => { if (!e.sender.isDestroyed()) e.sender.send('ai:ev', { id, type, ...data }); };
  if (!c.apiKey) { send('error', { error: 'API 키가 없습니다. 오른쪽 위 ⚙ 설정에서 키를 넣어 주세요.', fatal: true }); return; }
  const ctl = new AbortController(); aiRuns.set(id, ctl);
  let started = false, reason = '';
  const why = s => (s === 429 ? '요청이 몰림(429)' : s >= 500 ? `서버 혼잡(${s})` : `오류(${s})`);
  try {
    for (let attempt = 0; attempt < AI_TRIES; attempt++) {
      if (attempt) { send('retry', { attempt, max: AI_TRIES - 1, reason }); await new Promise(r => setTimeout(r, AI_WAIT[attempt] || 5000)); }
      if (ctl.signal.aborted) break;
      const last = attempt === AI_TRIES - 1;
      // 응답 시작 전·글자 사이에 너무 오래 조용하면 끊습니다(시간마다 다시 맞춤).
      const quiet = new AbortController(); let quietWhy = '';
      let timer = setTimeout(() => { quietWhy = '45초 동안 응답 없음'; quiet.abort(); }, HEAD_TIMEOUT);
      const bump = () => { clearTimeout(timer); timer = setTimeout(() => { quietWhy = '40초 동안 글자가 안 옴'; quiet.abort(); }, IDLE_TIMEOUT); };
      let res;
      try {
        res = await fetch(apiUrl(c, '/chat/completions'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${c.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: c.model, stream: true, messages, max_tokens: maxTokens || 4096, temperature: 0.4, ...(noEffort ? {} : { reasoning_effort: 'low' }) }), // 생각 단계를 줄여 답이 빨리 나오게
          signal: AbortSignal.any([ctl.signal, quiet.signal]),
        });
      } catch (err) { clearTimeout(timer); if (ctl.signal.aborted) break; reason = quietWhy || '연결 끊김'; if (!last) continue; throw new Error(reason); }
      if (!res.ok) {
        clearTimeout(timer);
        const body = await res.text().catch(() => '');
        let msg = body; try { const j = JSON.parse(body); msg = (j.error && j.error.message) || body; } catch (x) { /* 글자 그대로 */ }
        if (res.status === 400 && !noEffort && /reasoning/i.test(msg)) { noEffort = true; attempt--; continue; }
        if (res.status === 401 || res.status === 403) { send('error', { error: `키가 거부되었습니다 (${res.status}). 설정에서 키를 확인해 주세요.`, fatal: true }); return; }
        if (res.status === 429 && /daily|quota|allowance/i.test(msg)) { send('error', { error: '오늘 쓸 수 있는 토큰을 다 썼습니다. 오전 9시(한국 시간)에 다시 채워집니다.', fatal: true }); return; }
        reason = why(res.status);
        if (!last) continue;
        throw new Error(`${reason} ${String(msg).slice(0, 160)}`);
      }
      send('head', {}); // 서버가 응답을 시작함 (대기 끝)
      bump();
      const dec = new TextDecoder();
      let buf = '';
      try {
        for await (const chunk of res.body) {
          bump();
          buf += dec.decode(chunk, { stream: true });
          let nl;
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;
            let j; try { j = JSON.parse(data); } catch (x) { continue; }
            const d = j.choices && j.choices[0] && j.choices[0].delta;
            if (!d) continue;
            if (d.reasoning_content) send('think', { text: d.reasoning_content });
            if (d.content) { started = true; send('delta', { text: d.content }); }
          }
        }
      } catch (err) { clearTimeout(timer); if (ctl.signal.aborted) break; reason = quietWhy || '연결 끊김'; if (!started && !last) continue; throw new Error(reason); }
      clearTimeout(timer);
      if (!started && !last) { reason = '빈 답'; continue; } // 빈 답이면 다시
      break;
    }
    send('done', { aborted: ctl.signal.aborted, empty: !started });
  } catch (err) {
    send('error', { error: `무료 AI 서버가 지금 너무 붐벼서 답을 받지 못했어요 (${String(err.message || err).slice(0, 160)}). 잠시 뒤 [다시 시도]를 누르거나, [Claude에서 묻기]로 물어보세요.`, partial: started });
  } finally { aiRuns.delete(id); }
});

// 창 단추 (macOS 모양 신호등 단추)
ipcMain.on('win:ctl', (e, a) => {
  const w = BrowserWindow.fromWebContents(e.sender); if (!w) return;
  if (a === 'min') w.minimize();
  else if (a === 'max') { if (w.isMaximized()) w.unmaximize(); else w.maximize(); }
  else if (a === 'close') w.close();
});

ipcMain.handle('data:load', () => loadData());
ipcMain.handle('store:load', () => loadStore());
ipcMain.handle('store:save', (e, obj) => saveStore(obj));
ipcMain.handle('store:path', () => storeFile());
ipcMain.handle('link:open', (e, url) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); });
// ICQA 실습용 에뮬레이터(설치돼 있으면) 실행 — 정해진 프로그램 이름만 허용
const EMU_DIR = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'ICQA', 'icqaControl');
const EMU_OK = /^(nt|pc)[A-Za-z]+C$|^CMDC$/;
ipcMain.handle('emu:list', () => { try { return fs.readdirSync(EMU_DIR).filter(f => f.endsWith('.exe')).map(f => f.slice(0, -4)); } catch (e) { return []; } });
ipcMain.handle('emu:open', (e, name) => {
  if (!EMU_OK.test(String(name))) return false;
  const exe = path.join(EMU_DIR, name + '.exe'); if (!fs.existsSync(exe)) return false;
  require('child_process').spawn(exe, [], { cwd: EMU_DIR, detached: true, stdio: 'ignore' }).unref();
  return true;
});
ipcMain.handle('clip:write', (e, t) => { clipboard.writeText(String(t || '')); return true; }); // 'Claude에서 묻기' 단추가 질문을 복사할 때

function createWindow() {
  const win = new BrowserWindow({
    width: 1366, height: 900, minWidth: 1100, minHeight: 720,
    title: '실기 연습 — 네트워크관리사 2급 · PC정비사 2급',
    backgroundColor: '#f5f5f7',
    titleBarStyle: 'hidden', // 제목 줄은 화면에서 직접 그립니다 (macOS 느낌의 통합 도구 막대)
    show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  const sendMax = () => { if (!win.isDestroyed()) win.webContents.send('win:max', win.isMaximized()); };
  win.on('maximize', sendMax); win.on('unmaximize', sendMax);
  // 프로그램 안에서는 다른 웹 페이지로 이동하지 않습니다. 출처 링크는 기본 브라우저로 엽니다.
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => app.quit());
