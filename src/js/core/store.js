/* 진행 기록 저장 — Electron에서는 사용자 데이터 폴더의 progress.json, 그냥 브라우저로 열면 localStorage.
 * 기록 모양: { v, exam, attempts: {문제id: {n, ok, last, lastOk}}, wrong: {문제id: 시각}, mocks: [...], seen: {개념id: 시각}, cableBest } */
(function (g) {
  'use strict';
  const KEY = 'silgi.progress.v1';
  const blank = () => ({ v: 1, exam: 'net', attempts: {}, wrong: {}, mocks: [], seen: {}, cableBest: {} });
  let data = blank();
  let timer = null;
  const hasApi = () => typeof g.api === 'object' && g.api && typeof g.api.loadStore === 'function';

  async function load() {
    let raw = null;
    try { raw = hasApi() ? await g.api.loadStore() : JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { raw = null; }
    data = Object.assign(blank(), raw || {});
    return data;
  }
  function saveNow() {
    clearTimeout(timer); timer = null;
    try { if (hasApi()) return g.api.saveStore(data); localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.error('기록 저장 실패', e); }
  }
  function save() { clearTimeout(timer); timer = setTimeout(saveNow, 250); }

  // 채점 결과 기록. 틀리면 오답노트에 넣고, 맞히면 오답노트에서 뺍니다.
  function record(qid, ok) {
    const a = data.attempts[qid] || { n: 0, ok: 0 };
    a.n++; if (ok) a.ok++; a.last = Date.now(); a.lastOk = !!ok;
    data.attempts[qid] = a;
    if (ok) delete data.wrong[qid]; else data.wrong[qid] = Date.now();
    save();
  }
  g.STORE = { load, save, saveNow, record, get d() { return data; } };
  addEventListener('beforeunload', () => { if (timer) saveNow(); });
})(window);
