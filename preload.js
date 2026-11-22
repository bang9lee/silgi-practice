// 화면(렌더러)에 꼭 필요한 기능만 열어 줍니다.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  loadStore: () => ipcRenderer.invoke('store:load'),
  saveStore: obj => ipcRenderer.invoke('store:save', obj),
  storePath: () => ipcRenderer.invoke('store:path'),
  openLink: url => ipcRenderer.invoke('link:open', url),
  copy: text => ipcRenderer.invoke('clip:write', text),
  emu: { list: () => ipcRenderer.invoke('emu:list'), open: name => ipcRenderer.invoke('emu:open', name) }, // ICQA 에뮬레이터 실행
  // 창 단추
  win: a => ipcRenderer.send('win:ctl', a),
  onMax: fn => ipcRenderer.on('win:max', (e, v) => fn(v)),
  // AI 선생님: 키는 메인 프로세스에만 있습니다.
  ai: {
    config: () => ipcRenderer.invoke('ai:config'),
    setConfig: patch => ipcRenderer.invoke('ai:config:set', patch),
    models: () => ipcRenderer.invoke('ai:models'),
    chat: req => ipcRenderer.invoke('ai:chat', req),
    abort: id => ipcRenderer.invoke('ai:abort', id),
    onEvent: fn => ipcRenderer.on('ai:ev', (e, ev) => fn(ev)),
  },
});
