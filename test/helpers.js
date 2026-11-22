// 테스트 도우미: data/*.json을 앱과 같은 방식으로 문제 목록으로 만들고, 가상 화면 모델(blank/flat)을 화면 없이 불러옵니다.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = {};
for (const f of fs.readdirSync(path.join(ROOT, 'data'))) if (f.endsWith('.json')) DATA[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

// src/js/app/app.js의 buildQuestions와 같은 규칙
function buildQuestions(D = DATA) {
  const list = [];
  (D['old-drill'] || []).forEach(q => list.push(q));
  (D['match-drag'] || []).forEach(q => list.push(q));
  (D.router || []).forEach(m => list.push({ id: 'router-' + m.id, exam: 'net', cat: 'router', type: 'router', label: m.label, source: m.source, question: m.title, check: m.check, cmds: m.cmds }));
  if (D['pc-bios']) D['pc-bios'].tasks.forEach(t => list.push({ id: 'bios-' + t.id, exam: 'pc', cat: 'bios', type: 'bios', label: t.label || '예상', source: 'x', question: t.title, answer: t.answer, biosDef: D['pc-bios'] }));
  for (const v of Object.values(D)) if (v && Array.isArray(v.questions)) v.questions.forEach(q => list.push(q));
  return list;
}

// 가상 화면 파일을 가짜 window에서 불러와 SIMS.list를 돌려줍니다(화면을 그리는 함수는 부르지 않음).
function loadSims() {
  const noop = () => ({});
  const ctx = { console };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.W = { h: noop };
  ctx.icon = () => '';
  ctx.ICONS = {};
  vm.createContext(ctx);
  const dir = path.join(ROOT, 'src', 'js', 'sims');
  const order = ['registry.js'].concat(fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'registry.js'));
  for (const f of order) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  return ctx.SIMS;
}

module.exports = { ROOT, DATA, buildQuestions, loadSims, GRADER: require('../src/js/core/grader.js'), ROUTER: require('../src/js/core/router-engine.js') };
