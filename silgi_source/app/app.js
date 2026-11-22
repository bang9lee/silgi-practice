/* 2급 합격 노트(네트워크관리사·PC정비사) — 화면 로직
 * 외부 라이브러리 없이 동작합니다.
 * 데이터: 네트워크관리사 questions.js(NQ) · PC정비사 pc_questions.js(PQ), 해설 explanations.js(NX) · pc_ex_legacy.js(NXL), 요약 notes*.js(NN)
 * 기록은 이 브라우저의 localStorage('netadmin2.v1')에 두 시험을 함께 저장합니다. */
(() => {
  'use strict';

  // ───────── 데이터 준비 ─────────
  // 두 시험의 문제·회차·묶음 id는 서로 겹치지 않으므로(network-…, pc-…) 지도는 하나로 쓰고,
  // 과목·회차 목록·주제처럼 화면에 보이는 범위만 지금 고른 시험(TR)에 맞춰 useTrack()이 바꿉니다.
  const NX = window.NX || {};
  const NXL = window.NXL || {};
  const ALL_TOPICS = (window.NN && window.NN.topics) || [];
  const TRACKS = {
    net: {
      id: 'net', data: window.NQ, full: '네트워크관리사 2급', short: '네트워크', label: '네트워크관리사',
      counts: [17, 10, 18, 5], countsText: 'TCP/IP 17 · 네트워크 일반 10 · NOS 18 · 운용기기 5', range: '2022~2026년',
      passNote: '과목별 과락은 없고 전체 평균 60점 이상이면 합격입니다. 문항 수가 많은 TCP/IP(17)·NOS(18)가 점수를 좌우합니다.',
      notesHint: '포트 번호·서브넷·Linux 명령어처럼 외워야 점수가 나오는 내용을 정리했어요.',
      notesIntro: '기출 문제를 분석해 실제로 나오는 내용만 정리했습니다. 읽고 나서 바로 그 주제의 기출을 풀어 보세요.',
      search: '예: chmod, 443, OSPF, 서브넷', final: 'final', site: 'https://www.icqa.or.kr/cn/page/network',
      source: '기출 문제: 2022년 1회 ~ 2026년 4회 20회차 1000문항 (COMCBT 기출 PDF, 2026년 4회는 협회 문제지). 정답은 교사용 PDF 표시 기준이며, 2026년 3회 23·32·46번은 협회 최종 복수정답을 반영했고, 2026년 4회는 협회 가채점 답안 기준입니다. 해설과 핵심 요약은 이 사이트에서 작성했습니다.',
    },
    pc: {
      id: 'pc', data: window.PQ, full: 'PC정비사 2급', short: 'PC정비', label: 'PC정비사',
      counts: [15, 15, 15, 5], countsText: '운영체제 15 · 주변장치 15 · 유지보수 15 · 네트워크 5', range: '2021~2026년',
      passNote: '협회 안내 기준은 100점 만점에 60점 이상입니다. 운영체제·주변장치·유지보수가 15문항씩이라 세 과목을 고르게 챙겨야 해요.',
      notesHint: 'BIOS 설정·Windows 명령·부품 규격처럼 외워야 점수가 나오는 내용을 모았어요.',
      notesIntro: '주제별로 꼭 알아야 할 내용을 모았습니다. 읽고 나서 바로 그 주제의 기출을 풀어 보세요.',
      search: '예: CMOS, NTFS, msconfig, SATA', final: 'pc-final', site: 'https://www.icqa.or.kr/cn/page/pc',
      source: '기출 문제: 2021년 1회 ~ 2026년 4회 24회차 1200문항 (COMCBT 기출 PDF, 2026년 4회는 협회 문제지). 정답은 교사용 PDF 표시 기준이며, 2026년 3회는 협회 공개 가답안과 대조했고, 2026년 4회는 협회 가채점 답안 기준입니다.',
    },
  };
  for (const id of Object.keys(TRACKS)) if (!TRACKS[id].data) delete TRACKS[id];
  const EXAM_MIN = 50;
  const PASS = 60;
  const DEFAULT_EXAM_DATE = '2026-11-01';
  const DAY = 86400000;

  const Q = new Map(), SET = new Map(), SETQ = new Map(), GROUP = new Map(), setRank = new Map();
  for (const tk of Object.values(TRACKS)) {
    for (const s of tk.data.sets) { s.tr = tk.id; SET.set(s.id, s); SETQ.set(s.id, []); setRank.set(s.id, s.y * 10 + s.s); }
    for (const q of tk.data.questions) {
      q.tr = tk.id; Q.set(q.id, q); SETQ.get(q.set).push(q);
      if (!GROUP.has(q.g)) GROUP.set(q.g, []);
      GROUP.get(q.g).push(q);
    }
  }
  for (const list of SETQ.values()) list.sort((a, b) => a.n - b.n);
  for (const list of GROUP.values()) list.sort((a, b) => setRank.get(a.set) - setRank.get(b.set) || a.n - b.n);
  const latest = gid => { const m = GROUP.get(gid); return m[m.length - 1]; };
  for (const t of ALL_TOPICS) t.tr = t.track || 'net';
  const TOPIC = new Map(ALL_TOPICS.map(t => [t.id, t]));
  // 새로 쓴 해설(NX)이 있으면 그것을, 없으면 이전 사이트에서 옮긴 해설(NXL)을 씁니다.
  const exOf = gid => NX[gid] || NXL[gid] || null;
  const topicOf = gid => (exOf(gid) && exOf(gid).t) || '';
  const qTrack = id => (Q.get(id) || {}).tr || 'net';
  const gidTrack = g => (GROUP.has(g) ? GROUP.get(g)[0].tr : 'net');
  const topicTrack = id => (TOPIC.has(id) ? TOPIC.get(id).tr : 'net');
  const IDX = {};
  for (const tk of Object.values(TRACKS)) {
    const gids = [...new Set(tk.data.questions.map(q => q.g))];
    const topicCount = new Map();
    for (const g of gids) { const t = topicOf(g); if (t) topicCount.set(t, (topicCount.get(t) || 0) + 1); }
    IDX[tk.id] = {
      subjects: tk.data.subjects, gids, topicCount,
      setsDesc: tk.data.sets.slice().sort((a, b) => b.y - a.y || b.s - a.s),
      gidsBySub: [0, 1, 2, 3].map(s => gids.filter(g => latest(g).s === s)),
      topics: ALL_TOPICS.filter(t => t.tr === tk.id),
    };
  }
  // 지금 고른 시험 기준의 목록들
  let TR = 'net', TK = TRACKS.net, SUBJECTS, SUBJECT_COUNTS, SETS_DESC, GIDS, GIDS_BY_SUB, TOPICS, topicCount;
  function useTrack(id) {
    TR = TRACKS[id] ? id : 'net'; TK = TRACKS[TR];
    const x = IDX[TR];
    SUBJECTS = x.subjects; SUBJECT_COUNTS = TK.counts; SETS_DESC = x.setsDesc; GIDS = x.gids; GIDS_BY_SUB = x.gidsBySub; TOPICS = x.topics; topicCount = x.topicCount;
    document.documentElement.dataset.track = TR;
  }
  useTrack('net');

  // ───────── 공통 도구 ─────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const fmtDate = ts => { const d = new Date(ts); return `${d.getMonth() + 1}.${d.getDate()} (${WEEK[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtDur = sec => { const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m}분 ${s}초` : `${s}초`; };
  const startOfDay = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const sourceLabel = q => `${SET.get(q.set).title} ${q.n}번`;
  const isCorrect = (q, choice) => q.a.includes(choice);

  function svg(path) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`; }
  const I = {
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
    exam: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="m9 13 2 2 4-4"/>'),
    practice: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>'),
    review: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    notes: svg('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
    settings: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    flag: svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
    star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>'),
    left: svg('<path d="m15 18-6-6 6-6"/>'),
    right: svg('<path d="m9 18 6-6-6-6"/>'),
    down: svg('<path d="m6 9 6 6 6-6"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    flame: svg('<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-9-1 2-2 3-3 3 0-2-1-4-3-6 0 4-4 6-4 12 0 4.3 3 7 7 7z"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
    download: svg('<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>'),
    upload: svg('<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/>'),
    play: svg('<path d="M7 4v16l13-8z"/>'),
    shuffle: svg('<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>'),
    bulb: svg('<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
    list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
    external: svg('<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>'),
    tool: svg('<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8a2.8 2.8 0 0 1-4-4l8-8z" transform="translate(-1 -1)"/><path d="M6 6 3 3M8 4 4 8"/>'),
    repeat: svg('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  };

  // 해설·요약에 쓰는 짧은 서식: **굵게**, `코드`, "- " 목록
  function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>'); }
  function rich(text) {
    let html = '', list = false;
    for (const raw of String(text || '').split('\n')) {
      const line = raw.trim();
      if (/^[-•] /.test(line)) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(line.slice(2))}</li>`; continue; }
      if (list) { html += '</ul>'; list = false; }
      if (line) html += `<p>${inline(line)}</p>`;
    }
    return list ? html + '</ul>' : html;
  }

  // ───────── 저장 상태 ─────────
  const KEY = 'netadmin2.v1';
  const OLD_KEY = 'certificate-first-step-v3';
  // active·session·pf·ex는 지금 고른 시험(track)의 것이고, 다른 시험의 것은 tracks[시험]에 보관합니다(switchTrack).
  const fresh = () => ({
    v: 1, created: Date.now(), examDate: DEFAULT_EXAM_DATE, name: '', metaAt: 0, resetSeen: 0, track: 'net', tracks: {},
    prefs: { theme: 'auto', qsize: 1, layout: 'single' },
    qs: {}, stars: {}, read: {}, attempts: [], active: null, session: null,
    pf: { sub: -1, topic: '', scope: 'all', set: '', order: 'recent', q: '' },
    ex: { mode: 'random', timed: true },
  });
  function loadState() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    const base = fresh();
    if (saved && saved.v === 1) {
      return Object.assign(base, saved, {
        prefs: Object.assign(base.prefs, saved.prefs),
        pf: Object.assign(base.pf, saved.pf),
        ex: Object.assign(base.ex, saved.ex),
      });
    }
    migrateOld(base);
    return base;
  }
  // 이전 사이트(classic.html)의 기출 연습·모의시험 기록을 한 번 가져옵니다.
  function migrateOld(s) {
    let old = null;
    try { old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null'); } catch (e) { old = null; }
    if (!old) return;
    const qidOf = key => { const [setId, num] = String(key).split(':'); return `${setId}-q${pad(num)}`; };
    const rec = q => (s.qs[q.g] ||= { n: 0, c: 0 });
    for (const [key, r] of Object.entries(old.practice || {})) {
      const q = Q.get(qidOf(key));
      if (!q || !r || r.choice === undefined) continue;
      const x = rec(q);
      x.n += r.attempts || 1;
      if (r.correct) x.c += 1;
      x.last = r.correct ? 1 : 0; x.at = r.lastAt || Date.now(); x.ch = r.choice;
      if (!r.correct) { x.w = 1; x.box = 0; x.due = Date.now(); }
    }
    for (const [key, m] of Object.entries(old.examMistakes || {})) {
      const q = Q.get(qidOf(key));
      if (!q) continue;
      const x = rec(q);
      x.w = 1; x.box = 0; x.due = Date.now();
      if (!x.n) { x.n = 1; x.last = 0; x.at = (m && m.lastAt) || Date.now(); }
    }
    for (const [setId, es] of Object.entries(old.exams || {})) {
      if (!SET.has(setId) || !es || !es.submitted || !es.result) continue;
      const qs = SETQ.get(setId), ans = {};
      for (const q of qs) if (es.answers && es.answers[q.n] !== undefined) ans[q.id] = es.answers[q.n];
      const end = Date.parse(es.result.date) || Date.now();
      const att = grade({ kind: 'set', setId, title: SET.get(setId).title + ' 기출', qids: qs.map(q => q.id), ans, flags: {}, start: end - EXAM_MIN * 60000, deadline: end }, false, end);
      att.migrated = true;
      s.attempts.push(att);
    }
    s.attempts.sort((a, b) => a.end - b.end);
    s.migratedAt = Date.now();
  }
  const S = loadState();
  useTrack(S.track);
  S.track = TR;
  // 같은 문제로 합쳐진 묶음(데이터의 aliases)의 예전 기록을 새 묶음으로 옮깁니다. 더 최근 기록을 남깁니다.
  for (const tk of Object.values(TRACKS)) {
    for (const [from, to] of Object.entries(tk.data.aliases || {})) {
      const r = S.qs[from], v = S.stars[from];
      if (r) { if (!S.qs[to] || (r.at || 0) > (S.qs[to].at || 0)) S.qs[to] = r; delete S.qs[from]; }
      if (v) { if (Math.abs(v) > Math.abs(S.stars[to] || 0)) S.stars[to] = v; delete S.stars[from]; }
    }
  }
  let saveFailed = false;
  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; }
    catch (e) { if (!saveFailed && SYNC.state !== 'on') toast('브라우저 저장 공간에 기록하지 못했습니다'); saveFailed = true; }
  }
  function save() { saveLocal(); scheduleFlush(); }

  // ───────── 기기 간 동기화 ─────────
  // claude.ai 보관함(db 기능)이 있으면 같은 계정의 다른 기기와 기록을 맞춥니다. 보관함이 없는 환경
  // (로컬 파일 등)에서는 이 브라우저에만 저장합니다. 문제별 기록은 더 최근 것을 남기고, 모의고사 결과는 합칩니다.
  // 보관함 경로(시험마다 문서 하나, 문서 크기 한도 256KiB 때문에 나눔):
  //   네트워크관리사 data/users/<내 id>/study · PC정비사 data/users/<내 id>/study_pc
  //   모의고사 결과는 각 문서 아래 attempts/<id>. 시험일·이름(meta)은 네트워크관리사 문서에 둡니다.
  const SYNC = { state: 'off', uid: '', docs: {}, ready: false, timer: 0, busy: false, again: false, lastAt: 0, retry: 0, toasted: false, shadow: { qs: {}, stars: {}, read: {}, attempts: new Set(), meta: 0 } };
  const docFor = tr => SYNC.docs[tr] || SYNC.docs.net;
  const hasClaude = () => !!(window.claude && typeof window.claude.use === 'function');
  const hm = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const REC_OPT = ['last', 'ch', 'w', 'box', 'boxAt', 'due', 'miss', 'grad'];
  const packRec = r => { const o = { n: r.n || 0, c: r.c || 0, at: r.at || 0 }; for (const k of REC_OPT) o[k] = r[k] === undefined ? null : r[k]; return o; };
  const unpackRec = r => { const o = {}; for (const [k, v] of Object.entries(r)) if (v !== null && v !== undefined) o[k] = v; o.n = o.n || 0; o.c = o.c || 0; return o; };
  const packAttempt = a => { const { bySub, ...rest } = a; return JSON.parse(JSON.stringify({ ...rest, bs: (bySub || []).flat() })); };
  const unpackAttempt = d => { const { bs, ...rest } = d; const f = bs || []; return { ...rest, bySub: [0, 1, 2, 3].map(i => [f[2 * i] || 0, f[2 * i + 1] || 0]) }; };
  function wipeData() { S.qs = {}; S.stars = {}; S.read = {}; S.attempts = []; S.active = null; S.session = null; S.tracks = {}; }
  function resetShadow() { const sh = SYNC.shadow; sh.qs = {}; sh.stars = {}; sh.read = {}; sh.attempts = new Set(); sh.meta = 0; }

  // 원격(또는 가져온 백업) 기록을 이 기기 상태에 합칩니다. track이면 "원격이 이미 알고 있는 값"도 함께 기억합니다.
  function mergeData(d, track) {
    let changed = false;
    const sh = SYNC.shadow;
    const resetAt = d.resetAt || 0;
    if (resetAt > (S.resetSeen || 0)) { wipeData(); S.resetSeen = resetAt; changed = true; if (track) resetShadow(); }
    const floor = S.resetSeen || 0;
    for (const [g, rr] of Object.entries(d.qs || {})) {
      if (!GROUP.has(g) || !rr || (rr.at || 0) <= floor) continue;
      const at = rr.at || 0, lr = S.qs[g];
      if (!lr || at > (lr.at || 0)) { S.qs[g] = unpackRec(rr); changed = true; }
      if (track) sh.qs[g] = Math.max(sh.qs[g] || 0, at);
    }
    for (const [g, v] of Object.entries(d.stars || {})) {
      if (!GROUP.has(g) || typeof v !== 'number' || Math.abs(v) <= floor) continue;
      if (Math.abs(v) > Math.abs(S.stars[g] || 0)) { S.stars[g] = v; changed = true; }
      if (track && Math.abs(v) > Math.abs(sh.stars[g] || 0)) sh.stars[g] = v;
    }
    for (const [id, v] of Object.entries(d.read || {})) {
      if (typeof v !== 'number' || v <= floor) continue;
      if (v > (S.read[id] || 0)) { S.read[id] = v; changed = true; }
      if (track) sh.read[id] = Math.max(sh.read[id] || 0, v);
    }
    const metaAt = d.metaAt || 0;
    if (metaAt > (S.metaAt || 0)) {
      if (typeof d.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.examDate)) S.examDate = d.examDate;
      if (typeof d.name === 'string') S.name = d.name;
      S.metaAt = metaAt; changed = true;
    }
    if (track) sh.meta = Math.max(sh.meta, metaAt);
    return changed;
  }
  function mergeAttempts(list, track) {
    let changed = false;
    const have = new Set(S.attempts.map(a => a.id));
    for (const a of list) {
      if (!a || !a.id || (a.end || 0) <= (S.resetSeen || 0)) continue;
      if (track) SYNC.shadow.attempts.add(a.id);
      if (have.has(a.id)) continue;
      S.attempts.push(a); have.add(a.id); changed = true;
    }
    if (changed) S.attempts.sort((x, y) => x.end - y.end);
    return changed;
  }
  // 원격이 아직 모르는 이 기기의 변경분
  function pending() {
    const sh = SYNC.shadow, out = { qs: {}, stars: {}, read: {}, meta: null, attempts: [] };
    let n = 0;
    for (const [g, r] of Object.entries(S.qs)) if ((r.at || 0) > (sh.qs[g] || 0)) { out.qs[g] = packRec(r); n++; }
    for (const [g, v] of Object.entries(S.stars)) if (Math.abs(v) > Math.abs(sh.stars[g] || 0)) { out.stars[g] = v; n++; }
    for (const [id, v] of Object.entries(S.read)) if (v > (sh.read[id] || 0)) { out.read[id] = v; n++; }
    if ((S.metaAt || 0) > sh.meta) { out.meta = { examDate: S.examDate, name: S.name, metaAt: S.metaAt }; n++; }
    for (const a of S.attempts) if (!sh.attempts.has(a.id)) { out.attempts.push(a); n++; }
    return n ? out : null;
  }
  function scheduleFlush(delay) {
    if (!SYNC.ready || SYNC.state === 'error') return;
    clearTimeout(SYNC.timer);
    SYNC.timer = setTimeout(flush, delay === undefined ? 2000 : delay);
  }
  async function flush() {
    clearTimeout(SYNC.timer);
    if (!SYNC.ready || SYNC.state === 'error') return;
    if (SYNC.busy) { SYNC.again = true; return; }
    const p = pending();
    if (!p) { paintSync(); return; }
    SYNC.busy = true;
    try {
      const sh = SYNC.shadow, bodies = {};
      const body = tr => (bodies[SYNC.docs[tr] ? tr : 'net'] ||= { qs: {}, stars: {}, read: {} });
      for (const [g, r] of Object.entries(p.qs)) body(gidTrack(g)).qs[g] = r;
      for (const [g, v] of Object.entries(p.stars)) body(gidTrack(g)).stars[g] = v;
      for (const [id, v] of Object.entries(p.read)) body(topicTrack(id)).read[id] = v;
      if (p.meta) Object.assign(body('net'), p.meta);
      for (const [tr, b] of Object.entries(bodies)) {
        const d = docFor(tr), data = JSON.parse(JSON.stringify(b));
        if (d.exists) await d.study.update(data);
        else { await d.study.set({ v: 1, ...data }); d.exists = true; }
      }
      for (const [g, r] of Object.entries(p.qs)) sh.qs[g] = r.at;
      for (const [g, v] of Object.entries(p.stars)) sh.stars[g] = v;
      for (const [id, v] of Object.entries(p.read)) sh.read[id] = v;
      if (p.meta) sh.meta = p.meta.metaAt;
      for (const a of p.attempts) { await docFor(attTrack(a)).attempts.doc(a.id).set(packAttempt(a)); sh.attempts.add(a.id); }
      SYNC.lastAt = Date.now(); SYNC.state = 'on'; SYNC.retry = 0;
    } catch (e) { syncError(e); }
    SYNC.busy = false;
    if (SYNC.again) { SYNC.again = false; scheduleFlush(300); }
    paintSync();
  }
  function syncError(e) {
    const code = e && e.code;
    if (code === 'unavailable' || code === 'resource_exhausted') {
      SYNC.state = 'retry';
      clearTimeout(SYNC.timer);
      SYNC.timer = setTimeout(flush, Math.min(60000, 8000 * ++SYNC.retry));
      return;
    }
    SYNC.state = 'error';
    if (!SYNC.toasted) { SYNC.toasted = true; toast(code === 'quota_exceeded' ? '보관함이 가득 차 동기화를 멈췄어요' : '동기화에 실패해 이 기기에만 저장돼요'); }
  }
  // 다른 기기에서 온 변경으로 화면을 다시 그립니다. 시험·풀이 중이거나 입력 중이면 건드리지 않습니다.
  function refreshView() {
    const r = route();
    const running = r.a === 'run' && (r.name === 'exam' || r.name === 'practice');
    const ae = document.activeElement;
    const typing = ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName);
    if (running || typing) { renderChrome(r); return; }
    render();
  }
  function onRemoteStudy(d, snap) {
    if (!SYNC.ready || !snap.exists || snap.metadata.hasPendingWrites) return;
    d.exists = true;
    if (mergeData(snap.data() || {}, true)) { saveLocal(); refreshView(); }
  }
  function onRemoteAttempts(qsnap) {
    if (!SYNC.ready || qsnap.metadata.hasPendingWrites) return;
    const list = qsnap.docChanges().filter(c => c.type !== 'removed').map(c => unpackAttempt(c.doc.data() || {}));
    if (list.length && mergeAttempts(list, true)) { saveLocal(); refreshView(); }
  }
  async function initSync() {
    if (!hasClaude()) return;
    SYNC.state = 'connecting'; paintSync();
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const uid = db && user ? await user.id() : null;
      if (!uid) { SYNC.state = 'off'; paintSync(); return; }
      SYNC.uid = uid;
      for (const tr of Object.keys(TRACKS)) {
        const study = db.doc('data/users/' + uid + '/' + (tr === 'net' ? 'study' : 'study_' + tr));
        SYNC.docs[tr] = { study, attempts: study.collection('attempts'), exists: false };
      }
      const docs = Object.values(SYNC.docs);
      const snaps = await Promise.all(docs.map(d => Promise.all([d.study.get(), d.attempts.get()])));
      const hadRecords = Object.keys(S.qs).length + S.attempts.length;
      let changed = false;
      docs.forEach((d, i) => {
        const [snap, asnap] = snaps[i];
        d.exists = snap.exists;
        if (snap.exists) changed = mergeData(snap.data() || {}, true) || changed;
        changed = mergeAttempts(asnap.docs.map(x => unpackAttempt(x.data() || {})), true) || changed;
      });
      SYNC.ready = true; SYNC.state = 'on';
      if (changed) { saveLocal(); refreshView(); if (!hadRecords) toast('다른 기기의 기록을 불러왔어요'); }
      scheduleFlush(400);
      for (const d of docs) {
        d.study.onSnapshot(snap => onRemoteStudy(d, snap), syncError);
        d.attempts.onSnapshot(onRemoteAttempts, syncError);
      }
    } catch (e) { syncError(e); }
    paintSync();
  }
  function syncLabel() {
    switch (SYNC.state) {
      case 'connecting': return '연결 중…';
      case 'on': return SYNC.ready && pending() ? '동기화 켜짐 · 저장 대기 중' : `동기화 켜짐${SYNC.lastAt ? ' · 마지막 저장 ' + hm(SYNC.lastAt) : ''}`;
      case 'retry': return '연결이 불안정해 다시 시도하고 있어요';
      case 'error': return '동기화 오류 · 이 기기에만 저장 중';
      default: return '이 기기에만 저장 중';
    }
  }
  function paintSync() { const el = $('#sync-status'); if (el) el.textContent = syncLabel(); }
  async function resetAll() {
    closeModal();
    const at = Date.now();
    if (SYNC.ready) {
      try {
        for (const d of Object.values(SYNC.docs)) {
          await d.study.set({ v: 1, resetAt: at });
          d.exists = true;
          const snap = await d.attempts.get();
          for (const x of snap.docs) await d.attempts.doc(x.id).delete();
        }
      } catch (e) { toast('다른 기기와 맞춘 기록을 지우지 못했어요. 잠시 후 다시 시도해 주세요'); return; }
    }
    wipeData(); S.resetSeen = at; resetShadow();
    saveLocal(); render(); toast('모든 기록을 지웠어요');
  }

  // 문제를 풀 때마다 문제(같은 문제 묶음) 단위로 기록하고 오답노트를 갱신합니다.
  // 오답 → 오답노트 등록. 오답노트 문제를 다른 날 연속 2번 맞히면 졸업.
  function recordAnswer(q, choice) {
    if (choice === undefined || choice === null) return null;
    const ok = isCorrect(q, choice);
    const r = (S.qs[q.g] ||= { n: 0, c: 0 });
    const now = Date.now();
    r.n += 1; if (ok) r.c += 1;
    r.last = ok ? 1 : 0; r.at = now; r.ch = choice;
    if (!ok) { r.w = 1; r.box = 0; r.due = now; r.miss = (r.miss || 0) + 1; delete r.grad; }
    else if (r.w) {
      const sameDay = r.boxAt && startOfDay(r.boxAt) === startOfDay(now);
      if (!sameDay) { r.box = (r.box || 0) + 1; r.boxAt = now; }
      if (r.box >= 2) { r.w = 0; r.grad = now; delete r.due; }
      else r.due = startOfDay(now) + DAY;
    }
    return ok;
  }
  // 아래 목록·통계는 기본으로 지금 고른 시험 기준이고, tr을 주면 그 시험 기준입니다.
  const gidsOf = tr => (tr && IDX[tr] ? IDX[tr].gids : GIDS);
  const wrongGids = tr => gidsOf(tr).filter(g => S.qs[g] && S.qs[g].w);
  const dueGids = tr => { const now = Date.now(); return wrongGids(tr).filter(g => (S.qs[g].due || 0) <= now); };
  const starGids = () => GIDS.filter(g => S.stars[g] > 0);
  const gradGids = () => GIDS.filter(g => S.qs[g] && S.qs[g].grad && !S.qs[g].w);

  function stats(tr) {
    let seen = 0, n = 0, c = 0;
    const gids = gidsOf(tr);
    const sub = [0, 1, 2, 3].map(() => ({ seen: 0, n: 0, c: 0, total: 0 }));
    for (const g of gids) {
      const s = latest(g).s; sub[s].total++;
      const r = S.qs[g]; if (!r || !r.n) continue;
      seen++; n += r.n; c += r.c; sub[s].seen++; sub[s].n += r.n; sub[s].c += r.c;
    }
    return { seen, n, c, sub, total: gids.length };
  }
  function topicStats(id) {
    let total = 0, seen = 0, n = 0, c = 0;
    for (const g of GIDS) {
      if (topicOf(g) !== id) continue;
      total++;
      const r = S.qs[g]; if (!r || !r.n) continue;
      seen++; n += r.n; c += r.c;
    }
    return { total, seen, n, c };
  }
  const attTrack = a => a.tr || qTrack(a.qids && a.qids[0]);
  const doneAttempts = tr => S.attempts.filter(a => attTrack(a) === (tr || TR)).sort((a, b) => a.end - b.end);
  function predicted(tr) {
    const recent = doneAttempts(tr).filter(a => a.total >= 50).slice(-3);
    if (recent.length) return { score: Math.round(recent.reduce((t, a) => t + a.score, 0) / recent.length), basis: `최근 모의고사 ${recent.length}회 평균` };
    const st = stats(tr);
    if (st.n >= 20) return { score: pct(st.c, st.n), basis: `기출 풀이 정답률 ${st.n}회 기준` };
    return null;
  }

  // 시험 바꾸기: 지금 시험의 진행 중 모의고사·풀이·필터를 보관하고 다른 시험의 것을 꺼냅니다.
  function switchTrack(id) {
    if (!TRACKS[id] || id === TR) return;
    S.tracks = S.tracks || {};
    S.tracks[TR] = { active: S.active, session: S.session, pf: S.pf, ex: S.ex };
    const base = fresh(), kept = S.tracks[id] || {};
    S.active = kept.active || null; S.session = kept.session || null;
    S.pf = Object.assign(base.pf, kept.pf); S.ex = Object.assign(base.ex, kept.ex);
    delete S.tracks[id];
    S.track = id;
    useTrack(id);
    save();
    const r = route();
    lastRouteKey = '';
    go('/' + (['exam', 'practice', 'review', 'notes', 'settings', 'silgi'].includes(r.name) ? r.name : ''));
    toast(`${TK.full} 공부로 바꿨어요`);
  }

  // ───────── 시험일·테마 ─────────
  function daysLeft() {
    const [y, m, d] = (S.examDate || DEFAULT_EXAM_DATE).split('-').map(Number);
    return Math.round((new Date(y, m - 1, d).getTime() - startOfDay(Date.now())) / DAY);
  }
  const examDateLabel = () => { const [y, m, d] = (S.examDate || DEFAULT_EXAM_DATE).split('-').map(Number); return `${m}월 ${d}일(${WEEK[new Date(y, m - 1, d).getDay()]})`; };
  const ddayText = () => { const n = daysLeft(); return n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '시험 종료'; };
  // claude.ai가 화면 테마를 정해 둔 경우(index.html 맨 위 스크립트가 기억) 자동 모드에서는 그 테마를 따릅니다.
  const HOST_THEME = window.__hostTheme || '';
  function effectiveTheme() {
    if (S.prefs.theme === 'light' || S.prefs.theme === 'dark') return S.prefs.theme;
    if (HOST_THEME === 'light' || HOST_THEME === 'dark') return HOST_THEME;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyPrefs() {
    const root = document.documentElement;
    if (S.prefs.theme === 'auto') { if (HOST_THEME) root.dataset.theme = HOST_THEME; else delete root.dataset.theme; } else root.dataset.theme = S.prefs.theme;
    root.style.setProperty('--qfont', [15, 17, 19, 21][S.prefs.qsize] + 'px');
    $('#theme-btn').innerHTML = effectiveTheme() === 'dark' ? I.sun : I.moon;
  }

  // ───────── 토스트·모달 ─────────
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  let modalReturn = null;
  function modal(title, body, actions) {
    modalReturn = document.activeElement;
    $('#modal-root').innerHTML = `<div class="modal-backdrop" data-act="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${title}</h2><div class="body">${body}</div>
      <div class="actions">${actions.map(a => `<button class="btn ${a.cls || 'btn-outline'}" data-act="${a.act}"${a.data ? Object.entries(a.data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('') : ''}>${a.label}</button>`).join('')}</div></div></div>`;
    const first = $('#modal-root .modal .btn:last-child'); if (first) first.focus();
  }
  function closeModal() { $('#modal-root').innerHTML = ''; if (modalReturn && modalReturn.focus) modalReturn.focus(); modalReturn = null; }

  // ───────── 공통 문제 표시 ─────────
  function figureHTML(q, lazy) {
    if (!q.img || !q.img.length) return '';
    return `<div class="q-figure">${q.img.map((src, i) => `<img src="${esc(src)}" alt="${esc(sourceLabel(q))} 제시문${q.img.length > 1 ? ' ' + (i + 1) : ''}"${lazy ? ' loading="lazy"' : ''}>`).join('')}</div>`;
  }
  function freqBadge(q) {
    const n = GROUP.get(q.g).length;
    return n > 1 ? `<span class="freq" title="같은 문제가 ${n}번 출제됨">${I.flame.replace('<svg', '<svg width="13" height="13"')} ${n}회 출제</span>` : '';
  }
  function starBtn(q) {
    const on = S.stars[q.g] > 0;
    return `<button class="star-btn" data-act="star" data-g="${esc(q.g)}" aria-pressed="${on}" title="북마크">${I.star}<span>${on ? '북마크됨' : '북마크'}</span></button>`;
  }
  function optsHTML(q, { act, chosen, reveal, qi }) {
    return `<div class="opts">${q.o.map((o, j) => {
      let cls = '', res = '';
      if (reveal) {
        if (q.a.includes(j)) { cls = 'correct'; res = chosen === j ? '내 답 · 정답' : '정답'; }
        else if (chosen === j) { cls = 'wrong'; res = '내 답'; }
        else cls = 'dim';
      } else if (chosen === j) cls = 'selected';
      const attrs = reveal ? 'disabled' : `data-act="${act}" data-i="${j}"${qi !== undefined ? ` data-q="${qi}"` : ''}`;
      return `<button class="opt ${cls}" ${attrs} aria-pressed="${chosen === j}"><span class="mk">${j + 1}</span><span class="ot">${esc(o)}</span>${res ? `<span class="res">${res}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }
  function historyLine(q) {
    const members = GROUP.get(q.g);
    return members.map(m => `${SET.get(m.set).title} ${m.n}번`).join(' · ');
  }
  function explainHTML(q, chosen) {
    const x = exOf(q.g);
    const unchecked = !NX[q.g] && x && !x.r;
    const answered = chosen !== undefined && chosen !== null;
    const ok = answered && isCorrect(q, chosen);
    const ansText = q.a.map(i => `<b class="ansno">${i + 1}</b>${esc(q.o[i])}`).join(' <span class="muted">/</span> ');
    const head = !answered ? `<div class="ex-head neutral">정답 <span class="ans">${ansText}</span></div>`
      : ok ? `<div class="ex-head ok">${I.check.replace('<svg', '<svg width="18" height="18"')} 정답입니다 <span class="ans">${ansText}</span></div>`
        : `<div class="ex-head bad">${I.x.replace('<svg', '<svg width="18" height="18"')} ${chosen === -1 ? '정답 확인' : '오답입니다'} <span class="ans">정답 ${ansText}</span></div>`;
    const multi = q.a.length > 1 ? `<div class="note-warn">협회 최종 정답 발표에서 <strong>복수 정답</strong>으로 인정된 문항입니다. 표시된 정답 중 하나를 고르면 맞습니다.</div>` : '';
    const topic = x && x.t && TOPIC.get(x.t);
    return `<div class="explain">${head}
      <div class="ex-body">${x ? rich(x.e) : '<p>이 문제의 해설을 준비하고 있습니다. 정답 보기를 관련 핵심 요약과 비교해 보세요.</p>'}</div>
      ${x && x.k ? `<div class="key"><b>암기</b>${inline(x.k)}</div>` : ''}${multi}
      ${unchecked ? '<p class="ex-legacy">이전 사이트에서 옮긴 간단 해설입니다. 문제를 보며 새로 쓰고 있어요.</p>' : ''}
      <div class="ex-foot"><span>출제: ${esc(historyLine(q))}</span>${topic ? `<a href="#/notes/${esc(topic.id)}">핵심 요약 · ${esc(topic.title)} →</a>` : ''}<span class="spacer"></span>${starBtn(q)}</div>
    </div>`;
  }

  // ───────── 라우터 ─────────
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || 'home', a: parts[1], b: parts[2] };
  }
  const go = path => { if (location.hash === '#' + path) render(); else location.hash = '#' + path; };
  const NAV = [
    ['home', '홈', I.home, '#/'],
    ['silgi', '실기', I.tool, '#/silgi'],
    ['exam', '실전 모의고사', I.exam, '#/exam'],
    ['practice', '기출 풀이', I.practice, '#/practice'],
    ['review', '오답노트', I.review, '#/review'],
    ['notes', '핵심 요약', I.notes, '#/notes'],
  ];
  function renderChrome(r) {
    const due = dueGids().length;
    const ids = Object.keys(TRACKS);
    $('#track-switch').hidden = ids.length < 2;
    $('#track-switch').innerHTML = ids.map(id => `<button type="button" data-act="track" data-v="${id}" aria-pressed="${id === TR}"><span class="full">${TRACKS[id].label}</span><span class="short">${TRACKS[id].short}</span></button>`).join('');
    const link = (id, label, icon, href) => {
      const active = r.name === id;
      const count = id === 'review' && due ? `<span class="count">${due > 99 ? '99+' : due}</span>` : '';
      return `<a href="${href}" class="${active ? 'active' : ''}"${active ? ' aria-current="page"' : ''}>${icon}<span>${label}</span>${count}</a>`;
    };
    $('#mainnav').innerHTML = NAV.map(n => link(...n)).join('');
    $('#tabbar').innerHTML = NAV.map(([id, label, icon, href]) => link(id, id === 'exam' ? '모의고사' : label, icon, href)).join('');
    const n = daysLeft();
    const sg = n < 0 && window.SILGI && window.SILGI.chip ? window.SILGI.chip() : null;
    $('#dday-chip').innerHTML = sg ? `${sg.text} <small>${sg.sub}</small>` : `${ddayText()} <small>${n >= 0 ? examDateLabel() : '시험일 설정'}</small>`;
    $('#dday-chip').setAttribute('href', sg ? '#/silgi' : '#/settings');
    $('#dday-chip').title = sg ? '실기 메뉴' : '시험일 설정';
  }

  let lastRouteKey = '';
  function render() {
    const r = route();
    // 진행 중인 시험이 시간이 끝났으면 먼저 자동 제출합니다.
    if (S.active && S.active.deadline && Date.now() >= S.active.deadline) { finishExam(true); return; }
    const examMode = r.name === 'exam' && r.a === 'run';
    if (examMode && !S.active) { go('/exam'); return; }
    document.body.classList.toggle('exam-mode', examMode);
    document.documentElement.classList.toggle('exam-mode', examMode);
    if (!examMode) removeScrim();
    renderChrome(r);
    const omrScroll = $('.omr-list') ? $('.omr-list').scrollTop : 0;
    let html = '', title = '';
    switch (r.name) {
      case 'exam':
        if (r.a === 'run') { html = viewExamRun(); title = S.active.title; }
        else if (r.a === 'result') { html = viewResult(r.b); title = '시험 결과'; }
        else { html = viewExamList(); title = '실전 모의고사'; }
        break;
      case 'practice':
        if (r.a === 'run') { if (!S.session) { go('/practice'); return; } html = viewPracticeRun(); title = '기출 풀이'; }
        else { html = viewPracticeSetup(); title = '기출 풀이'; }
        break;
      case 'review': html = viewReview(r.a || 'due'); title = '오답노트'; break;
      case 'notes': {
        const t = r.a && TOPIC.get(r.a);
        if (t && t.tr !== TR) { go('/notes'); return; }
        html = t ? viewNote(r.a) : viewNotesIndex(); title = t ? t.title : '핵심 요약';
        break;
      }
      case 'settings': html = viewSettings(); title = '설정'; break;
      case 'silgi': html = window.SILGI ? window.SILGI.view(r) : '<div class="wrap"><div class="card empty"><strong>실기 메뉴를 불러오지 못했어요</strong>새로고침해 주세요.</div></div>'; title = '실기'; break;
      default: html = viewHome(); title = '홈';
    }
    const app = $('#app');
    app.innerHTML = html;
    document.title = `${title} | ${TK.full} 합격 노트`;
    const key = location.hash.split('?')[0];
    if (key !== lastRouteKey) {
      lastRouteKey = key;
      if (!examMode) window.scrollTo(0, 0);
      app.focus({ preventScroll: true });
    }
    if (examMode) afterExamRender(omrScroll);
    mountWidgets(app);
  }

  // ───────── 홈 ─────────
  function viewHome() {
    const st = stats();
    const pred = predicted();
    const n = daysLeft();
    const atts = doneAttempts();
    const best = atts.reduce((m, a) => Math.max(m, a.score), 0);
    const predScore = pred ? pred.score : 0;
    const heroTitle = n > 0 ? `시험까지 <span class="big">${n}일</span> 남았어요` : n === 0 ? '오늘이 시험일입니다. <span class="big">화이팅!</span>' : '시험일을 설정해 주세요';
    return `<div class="wrap">
      ${window.SILGI && n < 0 ? window.SILGI.homeCard('top') : ''}
      <section class="hero">
        <div style="position:relative;z-index:1">
          <span class="kicker"><span class="dot"></span>${TK.full} · ${S.examDate === DEFAULT_EXAM_DATE ? '2026년 제4회 · ' : ''}${esc(examDateLabel())} 필기</span>
          <h1>${heroTitle}</h1>
          <p class="lead">실제 시험은 <strong>50문항 · 50분</strong>, 100점 만점에 <strong>60점(30문제) 이상</strong>이면 합격입니다. 기출 문제가 반복해서 나오므로 기출을 정확히 이해하며 여러 번 푸는 것이 가장 빠른 길이에요.</p>
          <div class="actions">
            ${S.active ? `<a class="btn btn-white btn-lg" href="#/exam/run">${I.play} 진행 중인 시험 이어서</a>` : `<button class="btn btn-white btn-lg" data-act="exam-pick-start">${I.play} 실전 모의고사 시작</button>`}
            <a class="btn btn-glass btn-lg" href="#/practice">${I.practice} 기출 풀이</a>
          </div>
        </div>
        <div class="hero-panel">
          <div class="t">예상 점수</div>
          <div class="score">${pred ? pred.score : '—'}<small>${pred ? '점' : ''}</small></div>
          <div class="note">${pred ? esc(pred.basis) + (best ? ` · 최고 ${best}점` : '') : '모의고사를 1회 풀면 예상 점수를 보여 드려요'}</div>
          <div class="gauge" aria-hidden="true"><span style="width:${Math.min(100, predScore)}%"></span><i class="pass-line"></i></div>
          <div class="gauge-labels"><span>0</span><span>합격 60</span><span>100</span></div>
        </div>
      </section>
      ${window.SILGI && n >= 0 ? window.SILGI.homeCard() : ''}
      ${trackCards()}

      <div class="grid home-grid" style="margin-top:18px">
        <section class="card pad-lg">
          <div class="section-head"><h2>오늘 할 일</h2><span class="muted" style="font-size:13px">${esc(planPhase().title)}</span></div>
          <div class="todo">${todayTodos().map(t => `<a class="todo-item ${t.done ? 'done' : ''}" href="${t.href}"${t.act ? ` data-act="${t.act}"` : ''}><span class="ic ${t.tone || ''}">${t.icon}</span><span class="tx"><strong>${t.title}</strong><span>${t.desc}</span></span><span class="go">${t.done ? I.check : I.right}</span></a>`).join('')}</div>
        </section>
        <section class="card pad-lg">
          <div class="section-head"><h2>과목별 정답률</h2><a class="more" href="#/practice">약점 풀기 →</a></div>
          ${st.sub.map((x, i) => {
            const p = pct(x.c, x.n);
            return `<div class="subj-row"><div class="name">${esc(SUBJECTS[i])}<small>시험 ${SUBJECT_COUNTS[i]}문항</small></div><div class="bar ${x.n ? (p >= 70 ? 'ok' : p >= 60 ? '' : p >= 45 ? 'warn' : 'bad') : ''}"><span style="width:${x.n ? p : 0}%"></span></div><div class="val">${x.n ? p + '%' : '—'}<small>${x.seen}/${x.total}문제</small></div></div>`;
          }).join('')}
          <p class="muted" style="font-size:12.5px;margin-top:10px">${TK.passNote}</p>
        </section>
      </div>

      <div class="grid g4" style="margin-top:14px">
        <div class="card stat"><div class="label">풀어 본 기출</div><div class="value">${st.seen}<small>/ ${st.total}</small></div><div class="sub">중복을 뺀 고유 문제 기준</div></div>
        <div class="card stat"><div class="label">기출 정답률</div><div class="value">${st.n ? pct(st.c, st.n) : '—'}<small>${st.n ? '%' : ''}</small></div><div class="sub">총 ${st.n}회 풀이</div></div>
        <div class="card stat"><div class="label">모의고사</div><div class="value">${atts.length}<small>회</small></div><div class="sub">${atts.length ? `합격선 이상 ${atts.filter(a => a.score >= PASS).length}회` : '아직 응시 전'}</div></div>
        <a class="card stat" href="#/review"><div class="label">오답노트</div><div class="value">${wrongGids().length}<small>문제</small></div><div class="sub">오늘 복습 ${dueGids().length}문제</div></a>
      </div>

      <section class="section">
        <div class="section-head"><h2>${n > 0 ? n + '일 합격 플랜' : '합격 플랜'}</h2><span class="muted" style="font-size:13px">시험일에 맞춰 단계가 자동으로 바뀝니다</span></div>
        <div class="plan-steps">${PLAN.map((p, i) => `<div class="plan-step ${planPhase().i === i ? 'now' : ''}"><div class="when">${p.when}</div><h4>${p.title}</h4><p>${p.desc}</p></div>`).join('')}</div>
      </section>

      ${atts.length ? `<section class="section"><div class="section-head"><h2>모의고사 점수 추이</h2><a class="more" href="#/exam">전체 기록 →</a></div><div class="card pad">${scoreChart(atts.slice(-12))}</div></section>` : ''}

      <section class="section">
        <div class="section-head"><h2>자주 나오는 문제부터</h2><span class="muted" style="font-size:13px">같은 문제가 2번 이상 출제된 ${GIDS.filter(g => GROUP.get(g).length > 1).length}문제</span></div>
        <div class="grid g3">
          <button class="card pad" data-act="practice-preset" data-v="freq"><h3>${I.flame.replace('<svg', '<svg width="20" height="20" style="color:#e07b00;vertical-align:-4px;margin-right:6px"')}반복 출제 문제</h3><p class="desc">2회 이상 나온 문제를 출제 횟수 순서로 풉니다. 다시 나올 가능성이 가장 높아요.</p></button>
          <button class="card pad" data-act="practice-preset" data-v="new"><h3>${I.target.replace('<svg', '<svg width="20" height="20" style="color:var(--primary);vertical-align:-4px;margin-right:6px"')}아직 안 푼 문제</h3><p class="desc">${st.total - st.seen}문제 남았어요. 최신 기출부터 차례로 풉니다.</p></button>
          <a class="card pad" href="#/notes"><h3>${I.notes.replace('<svg', '<svg width="20" height="20" style="color:var(--ok);vertical-align:-4px;margin-right:6px"')}핵심 요약 ${TOPICS.length}개 주제</h3><p class="desc">${TK.notesHint}</p></a>
        </div>
      </section>
    </div>`;
  }
  // 같은 날 두 시험을 보므로 홈에서 두 시험의 진행 상황을 나란히 보여 주고 바로 바꿀 수 있게 합니다.
  function trackCards() {
    const ids = Object.keys(TRACKS);
    if (ids.length < 2) return '';
    return `<section class="track-cards" aria-label="시험별 진행 상황">${ids.map(id => {
      const tk = TRACKS[id], st = stats(id), pred = predicted(id), due = dueGids(id).length, on = id === TR;
      const running = on ? S.active : S.tracks && S.tracks[id] && S.tracks[id].active;
      return `<button type="button" class="card track-card${on ? ' on' : ''}" data-track="${id}"${on ? ' aria-current="true"' : ` data-act="track" data-v="${id}"`}>
        <span class="tc-name"><strong>${tk.full}</strong><span class="tc-go">${on ? '지금 공부 중' : '바꾸기 ' + I.right}</span></span>
        <span class="tc-stats"><span><b>${pred ? pred.score + '점' : '—'}</b>예상 점수</span><span><b>${st.seen}<small>/${st.total}</small></b>푼 문제</span><span><b>${due}</b>오늘 복습</span></span>
        ${running ? '<span class="badge warn">모의고사 진행 중</span>' : ''}
      </button>`;
    }).join('')}</section>`;
  }
  const PLAN = [
    { when: '~ D-12', title: '1단계 · 기출 1회독', desc: '하루 모의고사 1회 + 틀린 문제 해설 정독 + 핵심 요약 2~3개 주제.' },
    { when: 'D-11 ~ D-6', title: '2단계 · 약점 보강', desc: '정답률 낮은 과목·주제 기출을 몰아서 풀고, 오답노트를 매일 비웁니다.' },
    { when: 'D-5 ~ D-2', title: '3단계 · 실전 감각', desc: '랜덤 실전 모의고사를 하루 1~2회. 50분 안에 풀고 검토하는 연습.' },
    { when: 'D-1 ~ D-DAY', title: '4단계 · 마무리', desc: '오답노트 전체, 반복 출제 문제, 시험 직전 총정리만 빠르게 훑기.' },
  ];
  function planPhase() {
    const n = daysLeft();
    const i = n >= 12 ? 0 : n >= 6 ? 1 : n >= 2 ? 2 : 3;
    return { i, title: PLAN[i].title };
  }
  function todayTodos() {
    const items = [];
    const today = startOfDay(Date.now());
    const examToday = doneAttempts().some(a => a.end >= today);
    const due = dueGids().length;
    const phase = planPhase().i;
    if (S.active) items.push({ href: '#/exam/run', icon: I.clock, tone: 'warn', title: '진행 중인 모의고사 이어서 풀기', desc: `${S.active.title} · 시간은 계속 흐르고 있어요` });
    const nextSet = SETS_DESC.find(s => !S.attempts.some(a => a.setId === s.id));
    if (phase >= 2 || !nextSet) items.push({ href: '#/exam', act: 'exam-random-quick', icon: I.shuffle, title: '랜덤 실전 모의고사 1회', desc: `${GIDS.length}개 기출에서 실제 과목 비율로 50문제 · 50분`, done: examToday });
    else items.push({ href: '#/exam', act: 'exam-set-quick', icon: I.exam, title: `모의고사: ${nextSet.title} 기출`, desc: '50문항 · 50분 · 실제 시험과 같은 순서', done: examToday });
    items.push({ href: '#/review', icon: I.review, tone: due ? 'bad' : 'ok', title: due ? `오답 복습 ${due}문제` : '오늘 복습할 오답 없음', desc: due ? '틀린 문제를 다른 날 2번 연속 맞히면 졸업합니다' : '새로 틀린 문제는 자동으로 여기에 모여요', done: !due });
    const st = stats();
    const weak = st.sub.map((x, i) => ({ i, p: x.n >= 8 ? x.c / x.n : 2 })).sort((a, b) => a.p - b.p)[0];
    if (weak && weak.p < 2) items.push({ href: '#/practice', act: 'practice-subject', icon: I.target, tone: 'warn', title: `약점 과목 집중: ${SUBJECTS[weak.i]}`, desc: `현재 정답률 ${Math.round(weak.p * 100)}% · 이 과목 기출 20문제` });
    const finalNote = TOPIC.get(TK.final);
    if (phase === 3 && finalNote) items.unshift({ href: `#/notes/${TK.final}`, icon: I.flame, tone: 'warn', title: '시험 직전 총정리 읽기', desc: '3번 이상 반복 출제된 문제의 정답 포인트 한 페이지', done: !!(S.read[TK.final] && S.read[TK.final] >= today) });
    const unread = TOPICS.find(t => t.subject >= 0 && !S.read[t.id]);
    if (unread) items.push({ href: `#/notes/${unread.id}`, icon: I.notes, tone: 'ok', title: `핵심 요약: ${unread.title}`, desc: unread.desc || '읽고 바로 관련 기출 풀기' });
    return items.slice(0, 4);
  }
  function scoreChart(atts) {
    const W = 680, H = 210, L = 34, R = 14, T = 18, B = 30;
    const n = atts.length;
    const x = i => (n === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (n - 1));
    const y = v => T + (100 - v) * (H - T - B) / 100;
    const grid = [0, 20, 40, 60, 80, 100].map(v => `<line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
    const line = atts.map((a, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(a.score).toFixed(1)}`).join(' ');
    const dots = atts.map((a, i) => `<circle class="dot ${a.score >= PASS ? 'pass' : 'fail'}" cx="${x(i)}" cy="${y(a.score)}" r="5"><title>${esc(a.title)} ${a.score}점</title></circle><text class="val" x="${x(i)}" y="${y(a.score) - 10}" text-anchor="middle">${a.score}</text><text x="${x(i)}" y="${H - 8}" text-anchor="middle">${new Date(a.end).getMonth() + 1}.${new Date(a.end).getDate()}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="모의고사 점수 추이">${grid}<line class="pass-line" x1="${L}" x2="${W - R}" y1="${y(PASS)}" y2="${y(PASS)}"/><path class="line" d="${line}"/>${dots}</svg>`;
  }

  // ───────── 실전 모의고사 목록 ─────────
  function viewExamList() {
    const atts = doneAttempts();
    const st = stats();
    const A = S.active;
    const unseen = st.total - st.seen;
    const bySet = id => atts.filter(a => a.setId === id);
    const years = [...new Set(SETS_DESC.map(s => s.y))];
    return `<div class="wrap">
      <div class="page-head"><div><span class="eyebrow">MOCK EXAM</span><h1>실전 모의고사</h1><p>실제 시험과 같은 조건으로 풉니다. 시간이 끝나면 자동으로 제출돼요.</p></div></div>
      ${A ? `<div class="resume-banner"><div class="tx"><strong>진행 중인 시험이 있어요 · ${esc(A.title)}</strong><span>${Object.keys(A.ans).length}/${A.qids.length}문항 표기 · ${A.deadline ? '남은 시간 ' + timerText() : '시간 제한 없음'}</span></div><a class="btn btn-dark" href="#/exam/run">이어서 풀기</a><button class="btn btn-ghost" data-act="exam-abandon">포기하기</button></div>` : ''}
      <div class="rules">
        <div><strong>50</strong><span>문항 (4지 택일)</span></div>
        <div><strong>50분</strong><span>시험 시간</span></div>
        <div><strong>60점</strong><span>이상 합격 · 과락 없음</span></div>
        <div><span>과목 구성</span><strong style="font-size:15px">${TK.countsText}</strong></div>
      </div>

      <section class="section card pad-lg random-card">
        <div>
          <span class="eyebrow">추천</span>
          <h2 style="font-size:22px;font-weight:850">랜덤 실전 모의고사</h2>
          <p class="muted" style="margin-top:6px">${TK.range} 기출 ${st.total}문제(중복 제외)에서 실제 시험과 같은 과목 비율로 50문제를 뽑습니다. 회차 기출을 이미 풀었다면 이 모드로 실력을 점검하세요.</p>
          <div class="opt-group"><span class="lab">출제 방식</span><div class="chips" role="group" aria-label="출제 방식">
            ${[['random', '무작위'], ['new', `안 푼 문제 우선 <span class="n">${unseen}</span>`], ['weak', `약점 집중 <span class="n">${wrongGids().length}</span>`]].map(([v, l]) => `<button class="chip" data-act="ex-mode" data-v="${v}" aria-pressed="${S.ex.mode === v}">${l}</button>`).join('')}
          </div></div>
          <div class="opt-group"><span class="lab">시간</span><div class="chips" role="group" aria-label="시간">
            <button class="chip" data-act="ex-timed" data-v="1" aria-pressed="${S.ex.timed}">50분 (실전)</button>
            <button class="chip" data-act="ex-timed" data-v="0" aria-pressed="${!S.ex.timed}">시간 제한 없음</button>
          </div></div>
          <div class="row" style="margin-top:20px"><button class="btn btn-primary btn-lg" data-act="exam-start" data-kind="random">${I.play} 랜덤 모의고사 시작</button></div>
        </div>
        <div class="card pad" style="background:var(--surface-2);box-shadow:none">
          <h3 style="font-size:15px">출제 방식 안내</h3>
          <ul style="margin:10px 0 0;padding-left:18px;color:var(--text-2);font-size:14px;line-height:1.75">
            <li><strong>무작위</strong>: 전체 기출에서 골고루 뽑습니다.</li>
            <li><strong>안 푼 문제 우선</strong>: 한 번도 풀지 않은 문제를 먼저 뽑아 범위를 넓힙니다.</li>
            <li><strong>약점 집중</strong>: 오답노트 문제와 정답률이 낮은 문제를 먼저 뽑습니다.</li>
          </ul>
          <p class="muted" style="font-size:13px;margin-top:10px">시험 중에는 정답을 보여 주지 않습니다. 제출하면 점수·과목별 결과·문제별 해설을 확인하고 틀린 문제는 오답노트로 들어갑니다.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>회차별 기출 모의고사</h2><span class="muted" style="font-size:13px">원본 시험지와 같은 문제·순서 · 최신 회차부터 권장</span></div>
        ${years.map(y => `<div class="year-block"><h3>${y}년</h3><div class="grid g4">${SETS_DESC.filter(s => s.y === y).map(s => {
          const list = bySet(s.id), best = list.reduce((m, a) => Math.max(m, a.score), -1), last = list[list.length - 1];
          const running = A && A.setId === s.id;
          return `<button class="card set-card" data-act="exam-start" data-kind="set" data-set="${s.id}">
            <div class="top"><div><h4>${esc(s.title)}</h4><div class="date">${s.date.replace(/-/g, '.')} 시행</div></div>${running ? '<span class="badge warn">응시 중</span>' : best >= 0 ? `<span class="badge ${best >= PASS ? 'pass' : 'fail'}">최고 ${best}점</span>` : '<span class="badge gray">미응시</span>'}</div>
            ${best >= 0 ? `<div class="bar mini-bar ${best >= PASS ? 'ok' : 'bad'}"><span style="width:${best}%"></span></div>` : ''}
            <div class="foot"><span>50문항 · 50분${list.length ? ` · ${list.length}회 응시` : ''}</span><span class="best">${last ? `최근 ${last.score}점` : '풀기 →'}</span></div>
          </button>`;
        }).join('')}</div></div>`).join('')}
      </section>

      <section class="section">
        <div class="section-head"><h2>응시 기록</h2>${atts.length ? `<span class="muted" style="font-size:13px">행을 누르면 결과와 해설을 다시 봅니다</span>` : ''}</div>
        ${atts.length ? `<div class="card pad" style="margin-bottom:12px">${scoreChart(atts.slice(-12))}</div><div class="card" style="overflow:hidden"><table class="hist"><thead><tr><th>날짜</th><th>시험</th><th>점수</th><th>결과</th><th class="hide-sm">정답</th><th class="hide-sm">소요 시간</th></tr></thead><tbody>
          ${atts.slice().reverse().map(a => `<tr class="clickable" data-act="open-result" data-id="${a.id}" tabindex="0"><td class="nowrap">${fmtDate(a.end)}</td><td>${esc(a.title)}</td><td><strong>${a.score}</strong>점</td><td><span class="badge ${a.score >= PASS ? 'pass' : 'fail'}">${a.score >= PASS ? '합격' : '불합격'}</span></td><td class="hide-sm">${a.correct}/${a.total}</td><td class="hide-sm">${a.migrated ? '—' : fmtDur(a.used)}${a.auto ? ' (시간 종료)' : ''}</td></tr>`).join('')}
        </tbody></table></div>` : `<div class="card empty">${I.exam}<strong>아직 응시 기록이 없어요</strong>최신 회차 기출부터 50분 실전으로 풀어 보세요.</div>`}
      </section>
    </div>`;
  }

  function buildRandom(mode) {
    const qids = [];
    SUBJECT_COUNTS.forEach((count, s) => {
      const pool = shuffle(GIDS_BY_SUB[s].slice());
      if (mode === 'new') pool.sort((a, b) => (S.qs[a] && S.qs[a].n ? 1 : 0) - (S.qs[b] && S.qs[b].n ? 1 : 0));
      if (mode === 'weak') {
        const w = g => { const r = S.qs[g]; if (!r || !r.n) return 1; if (r.w) return 3; return 2 * (1 - r.c / r.n); };
        const score = new Map(pool.map(g => [g, w(g) + Math.random() * 0.3]));
        pool.sort((a, b) => score.get(b) - score.get(a));
      }
      const picked = pool.slice(0, count);
      shuffle(picked);
      for (const g of picked) qids.push(latest(g).id);
    });
    return qids;
  }
  function confirmStart(kind, setId) {
    const title = kind === 'set' ? `${SET.get(setId).title} 기출` : '랜덤 실전 모의고사';
    const timed = kind === 'set' ? true : S.ex.timed;
    const body = `<p><strong>${esc(title)}</strong> · 50문항 · ${timed ? '50분' : '시간 제한 없음'}</p><ul>
      <li>${timed ? '시작하면 타이머가 바로 흐르며, <strong>시간이 끝나면 자동으로 제출</strong>됩니다. 창을 닫아도 시간은 계속 흐릅니다.' : '시간 제한 없이 풀고, 걸린 시간만 기록합니다.'}</li>
      <li>제출 전까지 답을 바꿀 수 있어요. 헷갈리는 문제는 <strong>검토 표시</strong>를 해 두세요.</li>
      <li>오른쪽 <strong>답안 표기란</strong>에서 바로 답을 고르거나 문제로 이동할 수 있습니다.</li>
      <li>단축키: <kbd>1</kbd>~<kbd>4</kbd> 보기 선택, <kbd>←</kbd>/<kbd>→</kbd> 이동, <kbd>F</kbd> 검토 표시</li></ul>
      ${kind === 'set' ? `<div class="chips" style="margin-top:14px" role="group" aria-label="시간"><button class="chip" data-act="ex-timed-modal" data-v="1" aria-pressed="${S.ex.setTimed !== false}">50분 실전</button><button class="chip" data-act="ex-timed-modal" data-v="0" aria-pressed="${S.ex.setTimed === false}">시간 제한 없음</button></div>` : ''}
      ${S.active ? `<p style="margin-top:12px;color:var(--bad-ink);font-weight:700">진행 중인 시험(${esc(S.active.title)})은 포기 처리됩니다.</p>` : ''}`;
    modal('시험을 시작할까요?', body, [{ label: '취소', act: 'modal-close' }, { label: '시험 시작', cls: 'btn-primary', act: 'exam-begin', data: { kind, set: setId || '' } }]);
  }
  function beginExam(kind, setId) {
    let qids, title;
    if (kind === 'set') { qids = SETQ.get(setId).map(q => q.id); title = `${SET.get(setId).title} 기출`; }
    else { qids = buildRandom(S.ex.mode); title = `랜덤 실전 모의고사 (${{ random: '무작위', new: '안 푼 문제 우선', weak: '약점 집중' }[S.ex.mode]})`; }
    const timed = kind === 'set' ? S.ex.setTimed !== false : S.ex.timed;
    const now = Date.now();
    S.active = { id: 'x' + now.toString(36), tr: TR, kind, mode: kind === 'random' ? S.ex.mode : undefined, setId: kind === 'set' ? setId : undefined, title, qids, ans: {}, flags: {}, idx: 0, start: now, deadline: timed ? now + EXAM_MIN * 60000 : null, warned: {} };
    save();
    closeModal();
    go('/exam/run');
  }

  // ───────── 시험 진행 화면 ─────────
  function timerText() {
    const A = S.active; if (!A) return '00:00';
    const ms = A.deadline ? Math.max(0, A.deadline - Date.now()) : Date.now() - A.start;
    const t = A.deadline ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
    const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }
  function viewExamRun() {
    const A = S.active;
    const total = A.qids.length;
    const answered = A.qids.filter(id => A.ans[id] !== undefined).length;
    const layout = S.prefs.layout;
    return `<div class="exam-bar"><div class="exam-bar-inner">
        <button class="icon-btn" style="background:transparent;border-color:rgba(255,255,255,.22);color:#fff" data-act="exam-leave" aria-label="시험 화면 나가기" title="나가기 (시간은 계속 흐릅니다)">${I.x}</button>
        <div class="title"><strong>${esc(A.title)}</strong><span>${TK.full} 필기 · ${total}문항${S.name ? ' · 수험자 ' + esc(S.name) : ''}</span></div>
        <div class="tools">
          <div class="seg font-seg" role="group" aria-label="글자 크기">${['가-', '가', '가+', '가++'].map((l, i) => `<button data-act="qsize" data-v="${i}" aria-pressed="${S.prefs.qsize === i}" title="글자 크기 ${['작게', '보통', '크게', '아주 크게'][i]}">${l}</button>`).join('')}</div>
          <div class="seg layout-seg" role="group" aria-label="보기 방식"><button data-act="layout" data-v="single" aria-pressed="${layout === 'single'}">한 문제씩</button><button data-act="layout" data-v="all" aria-pressed="${layout === 'all'}">전체 보기</button></div>
          <div class="timer" id="timer">${I.clock}<small>${A.deadline ? '남은 시간' : '경과'}</small><span id="timer-text">${timerText()}</span></div>
          <button class="btn-submit" data-act="exam-submit"><span class="hide-xs">답안 </span>제출</button>
        </div>
      </div></div>
      <div class="exam-shell">
        <div class="exam-main" id="exam-main">${layout === 'all' ? paperHTML(A) : singleHTML(A, answered)}</div>
        ${omrHTML(A, answered)}
      </div>
      <div class="omr-toggle"><button class="btn btn-dark" data-act="omr-open">${I.grid} 답안표 <span id="omr-count">${answered}/${total}</span></button><button class="btn btn-primary" data-act="exam-submit">제출</button></div>`;
  }
  function examQuestionCard(A, i, paper) {
    const q = Q.get(A.qids[i]);
    const flagged = !!A.flags[q.id];
    return `<article class="card q-card exam-q ${flagged ? 'flagged' : ''}" id="q-${i}" data-qi="${i}">
      <div class="q-meta"><span class="subject-tag">${q.s + 1}과목 · ${esc(SUBJECTS[q.s])}</span>${paper ? `<span class="spacer"></span><button class="btn btn-sm btn-outline flag-btn" data-act="exam-flag" data-q="${i}" aria-pressed="${flagged}">${I.flag} 검토</button>` : flagged ? '<span class="badge warn">검토 표시</span>' : ''}</div>
      <div class="q-stem"><span class="qn">${i + 1}.</span>${esc(q.q)}</div>
      ${figureHTML(q, paper)}
      ${optsHTML(q, { act: 'exam-pick', chosen: A.ans[q.id], qi: i })}
    </article>`;
  }
  function singleHTML(A, answered) {
    const i = A.idx, total = A.qids.length, q = Q.get(A.qids[i]);
    return `<div class="exam-progress"><span>${i + 1} / ${total}번</span><div class="bar"><span id="exam-bar" style="width:${answered / total * 100}%"></span></div><span id="exam-answered">${answered}문항 표기</span></div>
      ${examQuestionCard(A, i, false)}
      <div class="exam-nav">
        <button class="btn btn-outline" data-act="exam-go" data-v="${i - 1}" ${i === 0 ? 'disabled' : ''}>${I.left} 이전</button>
        <button class="btn btn-outline flag-btn" data-act="exam-flag" data-q="${i}" aria-pressed="${!!A.flags[q.id]}">${I.flag} 검토 표시</button>
        <span class="spacer"></span>
        ${i < total - 1 ? `<button class="btn btn-dark" data-act="exam-go" data-v="${i + 1}">다음 ${I.right}</button>` : `<button class="btn btn-primary" data-act="exam-submit">답안 제출</button>`}
      </div>
      <p class="kbd-hint">단축키 <kbd>1</kbd>~<kbd>4</kbd> 보기 선택 · <kbd>←</kbd> <kbd>→</kbd> 이전/다음 · <kbd>F</kbd> 검토 표시</p>`;
  }
  function paperHTML(A) {
    let html = '', last = -1;
    A.qids.forEach((id, i) => {
      const q = Q.get(id);
      if (q.s !== last) { html += `<div class="subject-divider">${q.s + 1}과목 · ${esc(SUBJECTS[q.s])}</div>`; last = q.s; }
      html += examQuestionCard(A, i, true);
    });
    return `<div class="paper">${html}</div><div class="exam-nav"><span class="spacer"></span><button class="btn btn-primary btn-lg" data-act="exam-submit">답안 제출</button></div>`;
  }
  function omrHTML(A, answered) {
    const total = A.qids.length, flagged = A.qids.filter(id => A.flags[id]).length;
    let rows = '', last = -1;
    A.qids.forEach((id, i) => {
      const q = Q.get(id);
      if (q.s !== last) { rows += `<div class="omr-sub">${q.s + 1}과목 ${esc(SUBJECTS[q.s])}</div>`; last = q.s; }
      rows += `<div class="omr-row ${i === A.idx ? 'current' : ''} ${A.flags[id] ? 'flagged' : ''}" id="omr-${i}"><button class="no" data-act="exam-go" data-v="${i}" aria-label="${i + 1}번 문제로 이동">${i + 1}</button>${[0, 1, 2, 3].map(j => `<button class="omr-bubble" data-act="exam-pick" data-q="${i}" data-i="${j}" aria-pressed="${A.ans[id] === j}" aria-label="${i + 1}번 ${j + 1}번 보기">${j + 1}</button>`).join('')}</div>`;
    });
    return `<aside class="card omr" id="omr" aria-label="답안 표기란">
      <div class="omr-head"><h3>답안 표기란 <button class="icon-btn omr-close" data-act="omr-close" aria-label="답안표 닫기" style="width:30px;height:30px">${I.x}</button></h3>
        <div class="counts"><span>표기 <b id="omr-answered">${answered}</b>/${total}</span><span>안 푼 문제 <b id="omr-left">${total - answered}</b></span><span>검토 <b id="omr-flagged">${flagged}</b></span></div></div>
      <div class="omr-list">${rows}</div>
      <div class="omr-foot"><button class="btn btn-outline btn-sm" data-act="exam-next-empty">안 푼 문제로 이동</button><button class="btn btn-primary" data-act="exam-submit">답안 제출</button></div>
    </aside>`;
  }
  function afterExamRender(omrScroll) {
    const list = $('.omr-list');
    if (list) {
      list.scrollTop = omrScroll;
      const cur = $('#omr-' + S.active.idx);
      if (cur) { const top = cur.offsetTop - list.offsetTop, bottom = top + cur.offsetHeight; if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) list.scrollTop = top - list.clientHeight / 2; }
    }
    if (S.prefs.layout === 'all') watchPaper();
    tick();
  }
  // 전체 보기에서 스크롤 위치에 맞춰 답안표의 현재 문제를 표시합니다.
  let paperObserver = null;
  function watchPaper() {
    if (paperObserver) paperObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;
    paperObserver = new IntersectionObserver(entries => {
      const A = S.active; if (!A) return;
      const top = entries.filter(en => en.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!top) return;
      const i = +top.target.dataset.qi;
      if (i === A.idx) return;
      A.idx = i;
      $$('.omr-row.current').forEach(r => r.classList.remove('current'));
      const row = $('#omr-' + i); if (row) row.classList.add('current');
    }, { rootMargin: '-80px 0px -55% 0px' });
    $$('.paper .q-card').forEach(c => paperObserver.observe(c));
  }
  // 답 표기 후 전체를 다시 그리지 않고 해당 문제와 답안표만 갱신합니다.
  function syncExam(i) {
    const A = S.active, id = A.qids[i], chosen = A.ans[id];
    $$(`[data-act="exam-pick"][data-q="${i}"]`).forEach(b => {
      const on = +b.dataset.i === chosen;
      b.setAttribute('aria-pressed', on);
      if (b.classList.contains('opt')) b.classList.toggle('selected', on);
    });
    const answered = A.qids.filter(x => A.ans[x] !== undefined).length, total = A.qids.length;
    const set = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
    set('#omr-answered', answered); set('#omr-left', total - answered); set('#omr-count', `${answered}/${total}`);
    set('#exam-answered', `${answered}문항 표기`);
    const bar = $('#exam-bar'); if (bar) bar.style.width = answered / total * 100 + '%';
  }
  function examGo(i) {
    const A = S.active;
    A.idx = Math.max(0, Math.min(A.qids.length - 1, i));
    save();
    $('#omr') && $('#omr').classList.remove('open');
    removeScrim();
    if (S.prefs.layout === 'all') {
      $$('.omr-row.current').forEach(r => r.classList.remove('current'));
      const row = $('#omr-' + A.idx); if (row) row.classList.add('current');
      const card = $('#q-' + A.idx); if (card) card.scrollIntoView({ block: 'start' });
    } else {
      render();
      const main = $('#exam-main'); if (main && main.getBoundingClientRect().top < 0) window.scrollTo(0, 0);
    }
  }
  function removeScrim() { const s = $('.scrim'); if (s) s.remove(); }
  function submitExam() {
    const A = S.active, total = A.qids.length;
    const left = A.qids.filter(id => A.ans[id] === undefined);
    const flagged = A.qids.filter(id => A.flags[id]).length;
    const body = left.length
      ? `<p>아직 답을 고르지 않은 문제가 있어요.</p><div class="big-num">${left.length}문제</div><p class="muted" style="margin-top:4px">미응답: ${left.slice(0, 12).map(id => A.qids.indexOf(id) + 1).join(', ')}${left.length > 12 ? ' …' : ''}번</p>${flagged ? `<p style="margin-top:8px">검토 표시한 문제도 ${flagged}개 있어요.</p>` : ''}<p style="margin-top:10px">제출하면 답을 바꿀 수 없습니다.</p>`
      : `<p>${total}문항 모두 표기했어요.${flagged ? ` 검토 표시한 문제가 ${flagged}개 있습니다.` : ''}</p><p style="margin-top:8px">제출하면 바로 채점합니다.</p>`;
    modal('답안을 제출할까요?', body, [{ label: '계속 풀기', act: 'modal-close' }, { label: '제출하고 채점', cls: 'btn-primary', act: 'exam-finish' }]);
  }
  function grade(A, auto, endAt) {
    let correct = 0;
    const bySub = [[0, 0], [0, 0], [0, 0], [0, 0]];
    for (const id of A.qids) {
      const q = Q.get(id), ok = isCorrect(q, A.ans[id]);
      if (ok) correct++;
      bySub[q.s][1]++; if (ok) bySub[q.s][0]++;
    }
    const end = endAt || (auto && A.deadline ? A.deadline : Date.now());
    return {
      id: 'a' + end.toString(36) + Math.random().toString(36).slice(2, 5), tr: A.tr || qTrack(A.qids[0]), kind: A.kind, mode: A.mode, setId: A.setId, title: A.title,
      qids: A.qids, ans: A.ans, flags: A.flags, start: A.start, end, timed: !!A.deadline,
      used: Math.max(0, Math.round((end - A.start) / 1000)), correct, total: A.qids.length,
      score: Math.round(correct / A.qids.length * 100), bySub, auto: !!auto,
    };
  }
  function finishExam(auto) {
    const A = S.active; if (!A) return;
    const att = grade(A, auto);
    S.active = null;
    S.attempts.push(att);
    for (const id of att.qids) recordAnswer(Q.get(id), att.ans[id]);
    save();
    closeModal();
    viewResult.filter = 'wrong';
    go('/exam/result/' + att.id);
    if (auto) modal('시험 시간이 끝났어요', `<p>50분이 지나 답안을 자동으로 제출했습니다. 표기하지 않은 ${att.total - Object.keys(att.ans).length}문제는 틀린 것으로 채점했어요.</p>`, [{ label: '결과 보기', cls: 'btn-primary', act: 'modal-close' }]);
  }
  function tick() {
    const A = S.active; if (!A) return;
    if (A.deadline && Date.now() >= A.deadline) { finishExam(true); return; }
    const el = $('#timer-text'); if (!el) return;
    el.textContent = timerText();
    if (!A.deadline) return;
    const left = A.deadline - Date.now(), t = $('#timer');
    t.classList.toggle('warn', left <= 10 * 60000 && left > 5 * 60000);
    t.classList.toggle('danger', left <= 5 * 60000);
    for (const m of [10, 5, 1]) {
      const w = (A.warned ||= {});
      if (left <= m * 60000 && !w[m]) {
        w[m] = 1; save();
        if (left > (m - 1) * 60000) toast(`남은 시간 ${m}분입니다`);
      }
    }
  }

  // ───────── 결과 ─────────
  function viewResult(id) {
    const att = S.attempts.find(a => a.id === id);
    if (!att) return `<div class="wrap"><div class="card empty"><strong>결과를 찾을 수 없어요</strong><a href="#/exam">모의고사 목록으로</a></div></div>`;
    const pass = att.score >= PASS;
    const need = Math.ceil(att.total * PASS / 100) - att.correct;
    const filter = viewResult.filter || 'wrong';
    const prev = doneAttempts(attTrack(att)).filter(a => a.end < att.end && (att.setId ? a.setId === att.setId : a.kind === att.kind)).pop();
    const SUBJECTS = (IDX[attTrack(att)] || IDX[TR]).subjects;
    const items = att.qids.map((qid, i) => ({ i, q: Q.get(qid), ch: att.ans[qid] })).filter(x => x.q);
    const shown = items.filter(x => filter === 'all' || (filter === 'wrong' ? !isCorrect(x.q, x.ch) : filter === 'flag' ? att.flags[x.q.id] : isCorrect(x.q, x.ch)));
    const wrongCount = items.filter(x => !isCorrect(x.q, x.ch)).length;
    const flagCount = items.filter(x => att.flags[x.q.id]).length;
    const unanswered = items.filter(x => x.ch === undefined).length;
    return `<div class="wrap">
      <section class="result-hero ${pass ? 'pass' : 'fail'}">
        <div class="big">${att.score}<small>점</small></div>
        <div><h1>${pass ? '합격 기준을 넘었어요!' : `불합격 — ${need}문제만 더 맞히면 합격`}</h1>
          <p>${esc(att.title)} · ${att.total}문제 중 <strong>${att.correct}문제</strong> 정답${unanswered ? ` · 미응답 ${unanswered}` : ''} · ${att.migrated ? '' : `소요 ${fmtDur(att.used)}${att.timed ? ' / 50분' : ''} · `}${fmtDate(att.end)}</p>
          ${prev ? `<p>지난 응시 ${prev.score}점 → 이번 ${att.score}점 (${att.score - prev.score >= 0 ? '+' : ''}${att.score - prev.score})</p>` : ''}
        </div>
        <div class="stamp">${pass ? '합격' : '불합격'}</div>
      </section>
      <div class="grid g4" style="margin-top:14px">${att.bySub.map(([c, t], i) => t ? `<div class="card stat"><div class="label">${i + 1}과목 ${esc(SUBJECTS[i])}</div><div class="value">${c}<small>/ ${t}</small></div><div class="bar ${pct(c, t) >= 60 ? 'ok' : 'bad'}" style="margin-top:8px"><span style="width:${pct(c, t)}%"></span></div><div class="sub">정답률 ${pct(c, t)}%</div></div>` : '').join('')}</div>
      <section class="section card pad-lg">
        <div class="section-head"><h2>문항별 결과</h2><span class="muted" style="font-size:13px">번호를 누르면 해설로 이동 · 주황 점 = 검토 표시</span></div>
        <div class="ox-grid">${items.map(x => `<button class="${isCorrect(x.q, x.ch) ? 'o' : 'x'} ${att.flags[x.q.id] ? 'flag' : ''}" data-act="result-jump" data-v="${x.i}" aria-label="${x.i + 1}번 ${isCorrect(x.q, x.ch) ? '정답' : '오답'}">${x.i + 1}</button>`).join('')}</div>
        <div class="row" style="margin-top:18px">
          ${wrongCount ? `<button class="btn btn-primary" data-act="retry-wrong" data-id="${att.id}">${I.repeat} 틀린 ${wrongCount}문제 다시 풀기</button>` : ''}
          ${att.kind === 'set' ? `<button class="btn btn-outline" data-act="exam-start" data-kind="set" data-set="${att.setId}">같은 회차 다시 응시</button>` : `<button class="btn btn-outline" data-act="exam-start" data-kind="random">새 랜덤 모의고사</button>`}
          <a class="btn btn-ghost" href="#/exam">모의고사 목록</a>
        </div>
      </section>
      <section class="section">
        <div class="tabs" role="tablist">${[['wrong', '틀린 문제', wrongCount], ['all', '전체', att.total], ['flag', '검토 표시', flagCount], ['right', '맞은 문제', att.total - wrongCount]].map(([v, l, n]) => `<button role="tab" aria-selected="${filter === v}" data-act="result-filter" data-v="${v}">${l}<span class="n">${n}</span></button>`).join('')}</div>
        ${shown.length ? shown.map(x => `<div class="review-q ${isCorrect(x.q, x.ch) ? 'o' : 'x'}" id="r-${x.i}"><article class="card q-card">
          <div class="q-meta"><span class="subject-tag">${x.q.s + 1}과목 · ${esc(SUBJECTS[x.q.s])}</span><span>${esc(sourceLabel(x.q))}</span>${freqBadge(x.q)}${x.ch === undefined ? '<span class="badge fail">미응답</span>' : ''}${att.flags[x.q.id] ? '<span class="badge warn">검토 표시</span>' : ''}</div>
          <div class="q-stem"><span class="qn">${x.i + 1}.</span>${esc(x.q.q)}</div>${figureHTML(x.q, true)}
          ${optsHTML(x.q, { chosen: x.ch, reveal: true })}${explainHTML(x.q, x.ch)}</article></div>`).join('')
        : `<div class="card empty">${I.check}<strong>${filter === 'wrong' ? '틀린 문제가 없어요. 만점입니다!' : '해당하는 문제가 없어요'}</strong></div>`}
      </section>
    </div>`;
  }

  // ───────── 기출 풀이 ─────────
  function practicePool(pf) {
    const f = pf || S.pf;
    let qs;
    if (f.set) qs = SETQ.get(f.set).slice();
    else qs = GIDS.map(latest);
    if (f.sub >= 0) qs = qs.filter(q => q.s === f.sub);
    if (f.topic) qs = qs.filter(q => topicOf(q.g) === f.topic);
    if (f.scope === 'new') qs = qs.filter(q => !(S.qs[q.g] && S.qs[q.g].n));
    if (f.scope === 'wrong') qs = qs.filter(q => S.qs[q.g] && S.qs[q.g].w);
    if (f.scope === 'star') qs = qs.filter(q => S.stars[q.g] > 0);
    if (f.scope === 'freq') qs = qs.filter(q => GROUP.get(q.g).length > 1);
    if (f.q && f.q.trim()) {
      const words = f.q.trim().toLowerCase().split(/\s+/);
      qs = qs.filter(q => { const hay = (q.q + ' ' + q.o.join(' ') + ' ' + ((exOf(q.g) || {}).e || '')).toLowerCase(); return words.every(w => hay.includes(w)); });
    }
    if (f.scope === 'freq') qs.sort((a, b) => GROUP.get(b.g).length - GROUP.get(a.g).length || setRank.get(b.set) - setRank.get(a.set) || a.n - b.n);
    else if (f.set) qs.sort((a, b) => a.n - b.n);
    else qs.sort((a, b) => setRank.get(b.set) - setRank.get(a.set) || a.n - b.n);
    if (f.order === 'random') shuffle(qs);
    return qs;
  }
  function viewPracticeSetup() {
    const f = S.pf;
    const pool = practicePool();
    const P = S.session;
    const topicsHere = TOPICS.filter(t => f.sub < 0 || t.subject === f.sub).filter(t => topicCount.get(t.id));
    const chip = (act, v, label, on, n) => `<button class="chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}">${label}${n !== undefined ? ` <span class="n">${n}</span>` : ''}</button>`;
    const subCount = s => GIDS_BY_SUB[s].length;
    return `<div class="wrap">
      <div class="page-head"><div><span class="eyebrow">PRACTICE</span><h1>기출 풀이</h1><p>한 문제씩 풀고 바로 해설을 확인합니다. 같은 문제가 여러 회차에 나온 경우 한 번만 보여 줘요.</p></div></div>
      ${P && P.idx < P.qids.length ? `<div class="resume-banner" style="background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 30%,transparent)"><div class="tx"><strong style="color:var(--primary-ink)">이어서 풀기 · ${esc(P.title)}</strong><span>${P.idx}/${P.qids.length}문제 진행 · 정답 ${sessionCorrect(P)}개</span></div><a class="btn btn-primary" href="#/practice/run">이어서 풀기</a><button class="btn btn-ghost" data-act="session-drop">새로 시작</button></div>` : ''}
      <section class="card filter-card">
        <div class="filter-row"><div class="lab">과목</div><div class="chips">${chip('pf-sub', -1, '전체', f.sub < 0, GIDS.length)}${SUBJECTS.map((s, i) => chip('pf-sub', i, esc(s), f.sub === i, subCount(i))).join('')}</div></div>
        <div class="filter-row"><div class="lab">범위</div><div class="chips">${[['all', '전체'], ['new', '안 푼 문제'], ['wrong', '틀린 문제'], ['star', '북마크'], ['freq', '반복 출제']].map(([v, l]) => chip('pf-scope', v, l, f.scope === v)).join('')}</div></div>
        ${topicsHere.length ? `<div class="filter-row"><div class="lab">주제</div><div class="chips topic-chip-list">${chip('pf-topic', '', '전체 주제', !f.topic)}${topicsHere.map(t => chip('pf-topic', t.id, esc(t.title), f.topic === t.id, topicCount.get(t.id))).join('')}</div></div>` : ''}
        <div class="filter-row"><div class="lab">회차</div><div class="row"><select class="input" data-act="pf-set" aria-label="회차 선택"><option value="">전체 회차 (중복 제외)</option>${SETS_DESC.map(s => `<option value="${s.id}" ${f.set === s.id ? 'selected' : ''}>${s.title} (${s.date.replace(/-/g, '.')})</option>`).join('')}</select></div></div>
        <div class="filter-row"><div class="lab">검색</div><div class="row" style="width:100%"><input class="input" style="flex:1" type="search" data-act="pf-q" value="${esc(f.q)}" placeholder="${esc(TK.search)}" aria-label="문제 검색"></div></div>
        <div class="filter-row"><div class="lab">순서</div><div class="chips">${chip('pf-order', 'recent', f.scope === 'freq' ? '많이 나온 순' : f.set ? '문제 번호 순' : '최신 기출부터', f.order !== 'random')}${chip('pf-order', 'random', '무작위', f.order === 'random')}</div></div>
        <div class="start-bar"><div class="count">조건에 맞는 문제 <b id="pf-count">${pool.length}</b>개</div>
          <div class="row"><button class="btn btn-outline" data-act="pf-reset">조건 초기화</button><button class="btn btn-primary btn-lg" data-act="practice-start" ${pool.length ? '' : 'disabled'}>${I.play} ${Math.min(pool.length, 20)}문제 풀기</button><button class="btn btn-dark btn-lg" data-act="practice-start-all" ${pool.length > 20 ? '' : 'hidden'}>전체 ${pool.length}문제</button></div>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><h2>과목별 진행</h2></div>
        <div class="grid g4">${stats().sub.map((x, i) => `<button class="card stat" data-act="practice-subject" data-v="${i}" style="text-align:left"><div class="label">${i + 1}과목 ${esc(SUBJECTS[i])}</div><div class="value">${x.seen}<small>/ ${x.total}</small></div><div class="bar" style="margin-top:8px"><span style="width:${pct(x.seen, x.total)}%"></span></div><div class="sub">${x.n ? `정답률 ${pct(x.c, x.n)}%` : '아직 풀지 않음'}</div></button>`).join('')}</div>
      </section>
    </div>`;
  }
  const sessionCorrect = P => P.qids.filter(id => P.ans[id] !== undefined && isCorrect(Q.get(id), P.ans[id])).length;
  function startSession(title, qids, kind) {
    if (!qids.length) { toast('풀 문제가 없어요'); return; }
    S.session = { kind: kind || 'practice', title, qids, idx: 0, ans: {}, start: Date.now() };
    save();
    go('/practice/run');
  }
  function viewPracticeRun() {
    const P = S.session, total = P.qids.length;
    if (P.idx >= total) return viewPracticeDone();
    const q = Q.get(P.qids[P.idx]), chosen = P.ans[q.id], answered = chosen !== undefined;
    const done = Object.keys(P.ans).length, correct = sessionCorrect(P);
    return `<div class="wrap narrow">
      <div class="practice-top"><a class="btn btn-ghost btn-sm" href="#/${P.kind === 'review' ? 'review' : 'practice'}">${I.left} ${P.kind === 'review' ? '오답노트' : '기출 풀이'}</a><strong style="font-size:15px">${esc(P.title)}</strong><div class="bar"><span style="width:${(P.idx + (answered ? 1 : 0)) / total * 100}%"></span></div><span class="score">${P.idx + 1}/${total} · 정답 ${correct}/${done}</span></div>
      <article class="card q-card">
        <div class="q-meta"><span class="subject-tag">${q.s + 1}과목 · ${esc(SUBJECTS[q.s])}</span><span>${esc(sourceLabel(q))}</span>${freqBadge(q)}${S.qs[q.g] && S.qs[q.g].w ? '<span class="badge fail">오답노트</span>' : ''}</div>
        <div class="q-stem">${esc(q.q)}</div>
        ${figureHTML(q)}
        ${optsHTML(q, { act: 'pr-pick', chosen, reveal: answered })}
        ${answered ? explainHTML(q, chosen) : ''}
        <div class="practice-actions">
          ${answered ? `<button class="btn btn-primary btn-lg" data-act="pr-next" id="pr-next">${P.idx < total - 1 ? '다음 문제' : '결과 보기'} ${I.right}</button>`
          : `<button class="btn btn-ghost" data-act="pr-pick" data-i="-1">잘 모르겠어요 · 정답 보기</button>`}
        </div>
        <p class="kbd-hint">단축키 <kbd>1</kbd>~<kbd>4</kbd> 선택 · <kbd>Enter</kbd> 다음 문제</p>
      </article>
    </div>`;
  }
  function viewPracticeDone() {
    const P = S.session, total = P.qids.length;
    const correct = sessionCorrect(P), wrong = P.qids.filter(id => !isCorrect(Q.get(id), P.ans[id]));
    return `<div class="wrap narrow">
      <section class="card pad-lg" style="text-align:center">
        <div style="font-size:15px;color:var(--muted);font-weight:700">${esc(P.title)} 완료</div>
        <div style="font-size:52px;font-weight:900;letter-spacing:-.04em;margin-top:6px">${correct}<span style="font-size:22px;color:var(--muted)"> / ${total}</span></div>
        <div style="font-weight:800;color:${pct(correct, total) >= 60 ? 'var(--ok-ink)' : 'var(--bad-ink)'}">정답률 ${pct(correct, total)}%</div>
        <div class="row" style="justify-content:center;margin-top:20px">
          ${wrong.length ? `<button class="btn btn-primary" data-act="session-retry">${I.repeat} 틀린 ${wrong.length}문제 다시</button>` : ''}
          <a class="btn btn-outline" href="#/practice">다른 문제 풀기</a>
          <a class="btn btn-ghost" href="#/review">오답노트</a>
        </div>
      </section>
      ${wrong.length ? `<section class="section"><div class="section-head"><h2>틀린 문제</h2></div><div class="wlist">${wrong.map(id => wrongItem(Q.get(id), P.ans[id])).join('')}</div></section>` : ''}
    </div>`;
  }

  // ───────── 오답노트 ─────────
  function wrongItem(q, chosen) {
    const r = S.qs[q.g];
    const ch = chosen !== undefined ? chosen : r && r.ch;
    return `<details class="card witem"><summary><span class="t"><small>${q.s + 1}과목 ${esc(SUBJECTS[q.s])} · ${esc(sourceLabel(q))}${r && r.miss ? ` · ${r.miss}번 틀림` : ''}</small>${esc(q.q)}</span><span class="chev">${I.down}</span></summary>
      <div class="wbody"><div class="q-card">${figureHTML(q, true)}${optsHTML(q, { chosen: ch, reveal: true })}${explainHTML(q, ch)}
      ${r && r.w ? `<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn btn-sm btn-outline" data-act="graduate" data-g="${esc(q.g)}">${I.check} 이제 알아요 (졸업)</button></div>` : ''}</div></div></details>`;
  }
  function viewReview(tab) {
    const due = dueGids(), all = wrongGids(), stars = starGids(), grad = gradGids();
    const lists = { due, all, star: stars, done: grad };
    const list = (lists[tab] || due).map(latest).sort((a, b) => a.s - b.s || setRank.get(b.set) - setRank.get(a.set));
    const tabs = [['due', '오늘 복습', due.length], ['all', '전체 오답', all.length], ['star', '북마크', stars.length], ['done', '졸업한 문제', grad.length]];
    const emptyMsg = { due: ['오늘 복습할 문제가 없어요', '틀린 문제는 자동으로 여기에 모이고, 맞히면 다음 날 다시 확인합니다.'], all: ['오답노트가 비어 있어요', '기출 풀이나 모의고사에서 틀린 문제가 모입니다.'], star: ['북마크한 문제가 없어요', '해설 아래 ☆ 북마크를 누르면 여기에 모입니다.'], done: ['아직 졸업한 문제가 없어요', '오답노트 문제를 다른 날 2번 연속 맞히면 졸업합니다.'] }[tab] || ['', ''];
    return `<div class="wrap">
      <div class="page-head"><div><span class="eyebrow">MY NOTES</span><h1>오답노트</h1><p>틀린 문제를 다른 날 <strong>2번 연속</strong> 맞히면 졸업합니다. 맞힌 다음 날 다시 나와요.</p></div>
        <div class="row">${due.length ? `<button class="btn btn-primary" data-act="review-start" data-v="due">${I.play} 오늘 복습 ${due.length}문제</button>` : ''}${all.length ? `<button class="btn btn-outline" data-act="review-start" data-v="all">전체 오답 ${all.length}문제 풀기</button>` : ''}${stars.length ? `<button class="btn btn-ghost" data-act="review-start" data-v="star">북마크 풀기</button>` : ''}</div></div>
      <div class="tabs" role="tablist">${tabs.map(([v, l, n]) => `<button role="tab" aria-selected="${(lists[tab] ? tab : 'due') === v}" data-act="review-tab" data-v="${v}">${l}<span class="n">${n}</span></button>`).join('')}</div>
      ${list.length ? `<div class="wlist">${list.map(q => wrongItem(q)).join('')}</div>` : `<div class="card empty">${I.check}<strong>${emptyMsg[0]}</strong>${emptyMsg[1]}</div>`}
    </div>`;
  }

  // ───────── 핵심 요약 ─────────
  function viewNotesIndex() {
    const groups = [0, 1, 2, 3].map(s => ({ s, items: TOPICS.filter(t => t.subject === s) })).filter(g => g.items.length);
    const featured = TOPICS.filter(t => t.subject < 0);
    return `<div class="wrap">
      <div class="page-head"><div><span class="eyebrow">SUMMARY</span><h1>핵심 요약</h1><p>${TK.notesIntro}</p></div></div>
      ${featured.map(t => `<a class="card pad-lg featured-note" href="#/notes/${t.id}"><span class="n-ic" aria-hidden="true">${t.icon || ''}</span><div><h3>${esc(t.title)}</h3><p class="desc">${esc(t.desc || '')}</p></div><span class="go">${I.right}</span></a>`).join('')}
      ${groups.length ? groups.map(g => `<section class="section"><div class="section-head"><h2>${g.s + 1}과목 · ${esc(SUBJECTS[g.s])}</h2><span class="muted" style="font-size:13px">시험 ${SUBJECT_COUNTS[g.s]}문항</span></div>
        <div class="grid g3 notes-grid">${g.items.map(t => `<a class="card" href="#/notes/${t.id}"><span class="n-ic" aria-hidden="true">${t.icon || '📘'}</span><h3>${esc(t.title)}</h3><p class="desc">${esc(t.desc || '')}</p><div class="meta">${topicMeta(t.id)}${S.read[t.id] ? '<span class="badge gray">읽음</span>' : ''}</div></a>`).join('')}</div></section>`).join('')
      : `<div class="card empty">${I.notes}<strong>요약을 준비하고 있어요</strong></div>`}
    </div>`;
  }
  function topicMeta(id) {
    const st = topicStats(id);
    if (!st.total) return '';
    const p = pct(st.c, st.n);
    const tone = !st.n ? '' : p >= 70 ? 'pass' : p >= 50 ? 'warn' : 'fail';
    return `<span>관련 기출 ${st.total}문제</span>${st.n ? `<span class="badge ${tone}">정답률 ${p}%</span>` : ''}`;
  }
  function viewNote(id) {
    const t = TOPIC.get(id);
    if (!t) return viewNotesIndex();
    if (!S.read[id]) { S.read[id] = Date.now(); save(); }
    const idx = TOPICS.indexOf(t), prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
    const n = topicCount.get(id) || 0;
    let toc = '', last = -1;
    for (const x of TOPICS) {
      if (x.subject !== last) { toc += `<div class="grp">${x.subject < 0 ? '시험 직전' : `${x.subject + 1}과목 ${esc(SUBJECTS[x.subject])}`}</div>`; last = x.subject; }
      toc += `<a href="#/notes/${x.id}" class="${x.id === id ? 'active' : ''}">${esc(x.title)}</a>`;
    }
    return `<div class="wrap">
      <div class="note-layout">
        <nav class="card note-toc" aria-label="요약 목차">${toc}</nav>
        <div>
          <div class="page-head" style="margin-bottom:14px"><div><span class="eyebrow">${t.subject < 0 ? '과목 공통 · 시험 직전' : `${t.subject + 1}과목 · ${esc(SUBJECTS[t.subject])}`}</span><h1>${t.icon ? t.icon + ' ' : ''}${esc(t.title)}</h1>${t.desc ? `<p>${esc(t.desc)}</p>` : ''}</div></div>
          <article class="card note-body">${t.html}
            ${n ? `<div class="note-cta"><div><strong>이 주제 기출 ${n}문제</strong><div class="muted" style="font-size:13.5px">읽은 내용을 바로 문제에 적용해 보세요.</div></div><button class="btn btn-primary" data-act="topic-practice" data-v="${t.id}">${I.play} 기출 풀기</button></div>` : ''}
          </article>
          <div class="note-foot">${prev ? `<a class="btn btn-outline" href="#/notes/${prev.id}">${I.left} ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a class="btn btn-outline" href="#/notes/${next.id}">${esc(next.title)} ${I.right}</a>` : ''}</div>
        </div>
      </div>
    </div>`;
  }
  // 요약 안의 계산기 위젯
  function mountWidgets(root) {
    if (window.SILGI) window.SILGI.mount(root);
    $$('[data-widget="subnet"]', root).forEach(el => {
      el.innerHTML = `<div class="calc"><div class="row"><input class="input mono" value="192.168.10.77/26" aria-label="IP 주소/접두사" placeholder="예: 192.168.10.77/26 또는 172.16.5.9 255.255.240.0"><button class="btn btn-dark btn-sm" type="button">계산</button></div><div class="out"></div></div>`;
      const input = $('input', el), out = $('.out', el);
      const run = () => { out.innerHTML = subnetCalc(input.value); };
      input.addEventListener('input', run); $('button', el).addEventListener('click', run); run();
    });
    $$('[data-widget="ipv6"]', root).forEach(el => {
      el.innerHTML = `<div class="calc"><div class="row"><input class="input mono" style="flex:1;min-width:240px" value="2001:0db8:0000:0000:0000:ff00:0042:8329" aria-label="IPv6 주소"></div><div class="out"></div></div>`;
      const input = $('input', el), out = $('.out', el);
      const run = () => { out.innerHTML = ipv6Calc(input.value); };
      input.addEventListener('input', run); run();
    });
  }
  function subnetCalc(text) {
    const m = String(text).trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*(?:\/\s*(\d{1,2})|\s+(\d{1,3}(?:\.\d{1,3}){3}))?$/);
    const bad = msg => `<div style="grid-column:1/-1"><b>${msg}</b>예: 192.168.10.77/26</div>`;
    if (!m) return bad('형식을 확인해 주세요');
    const toInt = s => { const p = s.split('.').map(Number); return p.some(x => x > 255) ? null : ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; };
    const toIp = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
    const ip = toInt(m[1]); if (ip === null) return bad('각 숫자는 0~255여야 합니다');
    let prefix;
    if (m[2] !== undefined) prefix = +m[2];
    else if (m[3]) { const mk = toInt(m[3]); if (mk === null) return bad('마스크 숫자를 확인해 주세요'); const bin = mk.toString(2).padStart(32, '0'); if (!/^1*0*$/.test(bin)) return bad('연속된 1로 된 마스크가 아닙니다'); prefix = bin.indexOf('0') < 0 ? 32 : bin.indexOf('0'); }
    else { const f = ip >>> 24; prefix = f < 128 ? 8 : f < 192 ? 16 : 24; }
    if (prefix > 32) return bad('접두사는 0~32입니다');
    const mask = prefix ? (0xFFFFFFFF << (32 - prefix)) >>> 0 : 0;
    const net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
    const hosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : 2 ** (32 - prefix) - 2;
    const f = ip >>> 24, cls = f < 128 ? 'A' : f < 192 ? 'B' : f < 224 ? 'C' : f < 240 ? 'D (멀티캐스트)' : 'E (예약)';
    const priv = (f === 10) || (f === 172 && ((ip >>> 16) & 255) >= 16 && ((ip >>> 16) & 255) <= 31) || (f === 192 && ((ip >>> 16) & 255) === 168);
    const block = prefix > 24 ? 2 ** (32 - prefix) : prefix > 16 ? 2 ** (24 - prefix) : prefix > 8 ? 2 ** (16 - prefix) : 2 ** (8 - prefix);
    const cells = [['서브넷 마스크', `${toIp(mask)} (/${prefix})`], ['네트워크 주소', toIp(net)], ['브로드캐스트 주소', toIp(bc)],
      ['첫 번째 사용 가능 IP', prefix >= 31 ? '—' : toIp(net + 1)], ['마지막 사용 가능 IP', prefix >= 31 ? '—' : toIp(bc - 1)],
      ['호스트 수 (2ʰ − 2)', prefix >= 31 ? `${hosts}개 (특수 용도)` : `${hosts.toLocaleString()}개`],
      ['블록 크기 (간격)', `${block} · ${prefix > 24 ? '넷째' : prefix > 16 ? '셋째' : prefix > 8 ? '둘째' : '첫째'} 옥텟`], ['와일드카드', toIp(~mask >>> 0)], ['클래스', `${cls} 클래스${priv ? ' · 사설 IP' : ''}`]];
    return cells.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  }
  function ipv6Calc(text) {
    const s = String(text).trim().toLowerCase();
    const bad = msg => `<div style="grid-column:1/-1"><b>${msg}</b></div>`;
    if (!/^[0-9a-f:]+$/.test(s) || (s.match(/::/g) || []).length > 1) return bad('16진수와 콜론(:)만 쓰고, ::는 한 번만 쓸 수 있어요');
    let parts;
    if (s.includes('::')) {
      const [a, b] = s.split('::'), left = a ? a.split(':') : [], right = b ? b.split(':') : [];
      const fill = 8 - left.length - right.length; if (fill < 1) return bad('블록이 너무 많습니다');
      parts = [...left, ...Array(fill).fill('0'), ...right];
    } else parts = s.split(':');
    if (parts.length !== 8 || parts.some(p => !p || p.length > 4)) return bad('8개 블록(각 1~4자리)이어야 합니다');
    const full = parts.map(p => p.padStart(4, '0'));
    const short = parts.map(p => p.replace(/^0+(?=.)/, ''));
    let best = [-1, 0];
    for (let i = 0; i < 8;) { if (short[i] === '0') { let j = i; while (j < 8 && short[j] === '0') j++; if (j - i > best[1]) best = [i, j - i]; i = j; } else i++; }
    let comp = short.join(':');
    if (best[1] >= 2) comp = (short.slice(0, best[0]).join(':') + '::' + short.slice(best[0] + best[1]).join(':')).replace(/^:(?=:)|(?<=:):$/g, '');
    return `<div>전체 표기 (생략 없음)<b>${full.join(':')}</b></div><div>앞자리 0 생략<b>${short.join(':')}</b></div><div>최종 축약 (RFC 5952)<b>${comp}</b></div>`;
  }

  // ───────── 설정 ─────────
  function viewSettings() {
    const solved = Object.values(S.qs).reduce((t, r) => t + (r.n || 0), 0);
    const wrongAll = Object.values(S.qs).filter(r => r.w).length;
    return `<div class="wrap narrow">
      <div class="page-head"><div><span class="eyebrow">SETTINGS</span><h1>설정</h1><p>기록은 이 브라우저에 저장되고, claude.ai에서 열면 같은 계정의 다른 기기와 자동으로 맞춰집니다.</p></div></div>
      <section class="card pad-lg">
        <div class="setting"><div class="tx"><strong>시험일</strong><span>홈의 D-day와 학습 플랜 단계가 이 날짜를 기준으로 바뀝니다.</span></div><input class="input" type="date" data-act="set-date" value="${esc(S.examDate)}" style="min-width:0"></div>
        <div class="setting"><div class="tx"><strong>수험자 이름</strong><span>모의고사 화면 상단에 표시됩니다. (선택)</span></div><input class="input" data-act="set-name" value="${esc(S.name)}" maxlength="20" placeholder="이름" style="min-width:0;width:180px"></div>
        <div class="setting"><div class="tx"><strong>화면 테마</strong><span>자동은 기기 설정을 따릅니다.</span></div><div class="chips">${[['auto', '자동'], ['light', '라이트'], ['dark', '다크']].map(([v, l]) => `<button class="chip" data-act="set-theme" data-v="${v}" aria-pressed="${S.prefs.theme === v}">${l}</button>`).join('')}</div></div>
        <div class="setting"><div class="tx"><strong>문제 글자 크기</strong><span>모의고사·기출 풀이 문제에 적용됩니다.</span></div><div class="chips">${['작게', '보통', '크게', '아주 크게'].map((l, i) => `<button class="chip" data-act="qsize" data-v="${i}" aria-pressed="${S.prefs.qsize === i}">${l}</button>`).join('')}</div></div>
      </section>
      <section class="section card pad-lg">
        <div class="setting"><div class="tx"><strong>기기 간 동기화</strong><span id="sync-status">${esc(syncLabel())}</span><span class="muted" style="font-size:12.5px;margin-top:2px">${SYNC.state === 'off' ? '이 사이트를 claude.ai에서 열면 폰과 PC가 같은 기록을 공유해요.' : '풀이·오답노트·모의고사·북마크가 같은 계정의 다른 기기와 자동으로 맞춰져요.'}</span></div></div>
        <div class="setting"><div class="tx"><strong>기록 백업</strong><span>두 시험 합계 풀이 ${solved}회 · 모의고사 ${S.attempts.length}회 · 오답 ${wrongAll}문제. 가져오면 지금 기록과 합쳐져요.</span></div><div class="row"><button class="btn btn-outline btn-sm" data-act="export">${I.download} 내보내기</button><label class="btn btn-outline btn-sm" style="cursor:pointer">${I.upload} 가져오기<input type="file" accept="application/json,.json" data-act="import" hidden></label></div></div>
        <div class="setting"><div class="tx"><strong>모든 기록 지우기</strong><span>두 시험(${Object.values(TRACKS).map(t => t.label).join('·')})의 풀이·모의고사·오답노트·북마크를 모두 삭제합니다. 되돌릴 수 없어요.</span></div><button class="btn btn-danger btn-sm" data-act="reset-all">${I.trash} 기록 지우기</button></div>
      </section>
      <section class="section card pad-lg">
        <h3>자료 출처</h3>
        ${Object.values(TRACKS).map(t => `<p class="muted" style="margin-top:8px;font-size:14px"><strong>${t.full}</strong> · ${t.source}</p>`).join('')}
        <div class="row" style="margin-top:12px">${Object.values(TRACKS).map(t => `<a class="btn btn-ghost btn-sm" href="${t.site}" target="_blank" rel="noopener">협회 안내 · ${t.label} ${I.external}</a>`).join('')}<a class="btn btn-ghost btn-sm" href="https://www.comcbt.com/xe/jf" target="_blank" rel="noopener">COMCBT ${I.external}</a>${window.CLASSIC_URL ? `<a class="btn btn-ghost btn-sm" href="${esc(window.CLASSIC_URL)}">이전 버전 사이트 ${I.external}</a>` : ''}</div>
      </section>
    </div>`;
  }
  async function exportData() {
    const { active, session, tracks, ...rest } = S;
    const json = JSON.stringify(rest, null, 1);
    const d = new Date();
    const filename = `2급합격노트-기록-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
    if (hasClaude()) {
      const dl = await window.claude.use('downloads');
      if (!dl) { toast('이 화면에서는 파일 저장을 지원하지 않아요'); return; }
      try { await dl.save({ filename, data: json }); toast('기록 파일을 저장했어요'); }
      catch (e) { if (!e || e.code !== 'declined') toast('파일을 저장하지 못했어요'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('기록 파일을 저장했어요');
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || data.v !== 1 || typeof data.qs !== 'object') throw new Error('형식');
        const a = mergeData(data, false), b = mergeAttempts(Array.isArray(data.attempts) ? data.attempts : [], false);
        save(); render();
        toast(a || b ? '기록을 가져와 합쳤어요' : '새로 합칠 기록이 없었어요');
      } catch (e) { toast('이 사이트의 백업 파일이 아닙니다'); }
    };
    reader.readAsText(file);
  }

  // ───────── 이벤트 ─────────
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, v = el.dataset.v;
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
    switch (act) {
      case 'modal-bg': if (e.target === el) closeModal(); return;
      case 'modal-close': closeModal(); return;
      case 'track': switchTrack(v); return;
      // 홈
      case 'exam-pick-start': go('/exam'); return;
      case 'exam-random-quick': e.preventDefault(); S.ex.mode = 'random'; confirmStart('random'); return;
      case 'exam-set-quick': { e.preventDefault(); const next = SETS_DESC.find(s => !S.attempts.some(a => a.setId === s.id)); if (next) confirmStart('set', next.id); else confirmStart('random'); return; }
      case 'practice-preset': S.pf = Object.assign(fresh().pf, { scope: v, order: 'recent' }); save(); go('/practice'); return;
      case 'practice-subject': {
        e.preventDefault();
        const st = stats();
        const s = v !== undefined ? +v : st.sub.map((x, i) => ({ i, p: x.n >= 8 ? x.c / x.n : 2 })).sort((a, b) => a.p - b.p)[0].i;
        const pool = GIDS_BY_SUB[s].map(latest);
        const rank = q => { const r = S.qs[q.g]; return !r || !r.n ? 1 : r.w ? 3 : 2 * (1 - r.c / r.n); };
        const picked = shuffle(pool).sort((a, b) => rank(b) - rank(a)).slice(0, 20);
        startSession(`${SUBJECTS[s]} 집중 20문제`, picked.map(q => q.id));
        return;
      }
      // 모의고사
      case 'ex-mode': S.ex.mode = v; save(); render(); return;
      case 'ex-timed': S.ex.timed = v === '1'; save(); render(); return;
      case 'ex-timed-modal': S.ex.setTimed = v === '1'; save(); $$('[data-act="ex-timed-modal"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); return;
      case 'exam-start': confirmStart(el.dataset.kind, el.dataset.set); return;
      case 'exam-begin': beginExam(el.dataset.kind, el.dataset.set); return;
      case 'exam-abandon': modal('시험을 포기할까요?', '<p>지금까지 표기한 답은 채점하지 않고 삭제됩니다.</p>', [{ label: '취소', act: 'modal-close' }, { label: '포기하기', cls: 'btn-danger', act: 'exam-abandon-ok' }]); return;
      case 'exam-abandon-ok': S.active = null; save(); closeModal(); render(); toast('진행 중인 시험을 포기했어요'); return;
      case 'open-result': viewResult.filter = 'wrong'; go('/exam/result/' + el.dataset.id); return;
      // 시험 진행
      case 'exam-pick': {
        const A = S.active; if (!A) return;
        const i = +el.dataset.q, j = +el.dataset.i;
        A.ans[A.qids[i]] = j; save(); syncExam(i);
        return;
      }
      case 'exam-go': examGo(+v); return;
      case 'exam-flag': {
        const A = S.active, i = +el.dataset.q, id = A.qids[i];
        if (A.flags[id]) delete A.flags[id]; else A.flags[id] = 1;
        save();
        const on = !!A.flags[id];
        $$(`[data-act="exam-flag"][data-q="${i}"]`).forEach(b => b.setAttribute('aria-pressed', on));
        const row = $('#omr-' + i); if (row) row.classList.toggle('flagged', on);
        const card = $('#q-' + i); if (card) card.classList.toggle('flagged', on);
        const f = $('#omr-flagged'); if (f) f.textContent = A.qids.filter(x => A.flags[x]).length;
        if (S.prefs.layout !== 'all') render();
        return;
      }
      case 'exam-next-empty': {
        const A = S.active, n = A.qids.length;
        for (let k = 1; k <= n; k++) { const i = (A.idx + k) % n; if (A.ans[A.qids[i]] === undefined) { examGo(i); return; } }
        toast('모든 문제에 답을 표기했어요'); return;
      }
      case 'exam-submit': submitExam(); return;
      case 'exam-finish': finishExam(false); return;
      case 'exam-leave': modal('시험 화면에서 나갈까요?', '<p>답안은 저장되지만 <strong>시간은 계속 흐릅니다.</strong> 모의고사 메뉴에서 이어서 풀 수 있어요.</p>', [{ label: '계속 풀기', act: 'modal-close' }, { label: '나가기', cls: 'btn-dark', act: 'exam-leave-ok' }]); return;
      case 'exam-leave-ok': closeModal(); go('/exam'); return;
      case 'qsize': S.prefs.qsize = +v; save(); applyPrefs(); $$('[data-act="qsize"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); return;
      case 'layout': S.prefs.layout = v; save(); render(); if (v === 'all') { const c = $('#q-' + S.active.idx); if (c) c.scrollIntoView({ block: 'start' }); } else window.scrollTo(0, 0); return;
      case 'omr-open': { $('#omr').classList.add('open'); if (!$('.scrim')) { const s = document.createElement('div'); s.className = 'scrim'; s.dataset.act = 'omr-close'; document.body.appendChild(s); } const cur = $('#omr-' + S.active.idx); if (cur) cur.scrollIntoView({ block: 'center' }); return; }
      case 'omr-close': $('#omr') && $('#omr').classList.remove('open'); removeScrim(); return;
      // 결과
      case 'result-filter': viewResult.filter = v; render(); return;
      case 'result-jump': {
        const target = () => $('#r-' + v);
        if (!target()) { viewResult.filter = 'all'; render(); }
        const t = target(); if (t) t.scrollIntoView({ block: 'start' });
        return;
      }
      case 'retry-wrong': {
        const att = S.attempts.find(a => a.id === el.dataset.id);
        const ids = att.qids.filter(id => !isCorrect(Q.get(id), att.ans[id]));
        startSession(`${att.title} 틀린 문제`, ids, 'retry');
        return;
      }
      // 기출 풀이
      case 'pf-sub': S.pf.sub = +v; S.pf.topic = ''; save(); render(); return;
      case 'pf-scope': S.pf.scope = v; save(); render(); return;
      case 'pf-topic': S.pf.topic = v; save(); render(); return;
      case 'pf-order': S.pf.order = v; save(); render(); return;
      case 'pf-reset': S.pf = fresh().pf; save(); render(); return;
      case 'practice-start': case 'practice-start-all': {
        const pool = practicePool();
        const qs = act === 'practice-start' ? pool.slice(0, 20) : pool;
        const f = S.pf;
        const label = [f.sub >= 0 ? SUBJECTS[f.sub] : '', f.topic && TOPIC.get(f.topic) ? TOPIC.get(f.topic).title : '', f.set ? SET.get(f.set).title : '', { new: '안 푼 문제', wrong: '틀린 문제', star: '북마크', freq: '반복 출제' }[f.scope] || '', f.q ? `"${f.q}"` : ''].filter(Boolean).join(' · ') || '전체 기출';
        startSession(label, qs.map(q => q.id));
        return;
      }
      case 'session-drop': S.session = null; save(); render(); return;
      case 'pr-pick': {
        const P = S.session, q = Q.get(P.qids[P.idx]);
        if (P.ans[q.id] !== undefined) return;
        const j = +el.dataset.i;
        P.ans[q.id] = j;
        recordAnswer(q, j);
        save(); render();
        const nx = $('#pr-next'); if (nx) { nx.focus({ preventScroll: true }); }
        const ex = $('.explain'); if (ex && ex.getBoundingClientRect().top > innerHeight - 120) ex.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      case 'pr-next': S.session.idx++; save(); render(); window.scrollTo(0, 0); return;
      case 'session-retry': {
        const P = S.session;
        const ids = P.qids.filter(id => !isCorrect(Q.get(id), P.ans[id]));
        startSession(`${P.title.replace(/ 다시$/, '')} 다시`, ids, P.kind);
        return;
      }
      case 'topic-practice': {
        const qs = GIDS.filter(g => topicOf(g) === v).map(latest).sort((a, b) => setRank.get(b.set) - setRank.get(a.set));
        startSession(`${TOPIC.get(v).title} 기출`, qs.map(q => q.id), 'topic');
        return;
      }
      // 오답노트
      case 'review-tab': go('/review/' + v); return;
      case 'review-start': {
        const g = v === 'due' ? dueGids() : v === 'all' ? wrongGids() : starGids();
        startSession(v === 'due' ? '오늘 복습' : v === 'all' ? '전체 오답' : '북마크', shuffle(g.map(latest)).map(q => q.id), 'review');
        return;
      }
      case 'graduate': { const r = S.qs[el.dataset.g]; if (r) { r.w = 0; r.grad = r.at = Date.now(); delete r.due; } save(); render(); toast('졸업 처리했어요'); return; }
      case 'star': {
        const g = el.dataset.g;
        S.stars[g] = S.stars[g] > 0 ? -Date.now() : Date.now();
        save();
        const on = S.stars[g] > 0;
        $$(`.star-btn[data-g="${CSS.escape(g)}"]`).forEach(b => { b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? '북마크됨' : '북마크'; });
        toast(on ? '북마크에 추가했어요' : '북마크를 해제했어요');
        return;
      }
      // 설정
      case 'set-theme': S.prefs.theme = v; save(); applyPrefs(); render(); return;
      case 'export': exportData(); return;
      case 'reset-all': modal('모든 기록을 지울까요?', '<p>두 시험의 풀이 기록, 모의고사 결과, 오답노트, 북마크가 모두 삭제됩니다. 동기화가 켜져 있으면 <strong>다른 기기의 기록도 함께</strong> 지워져요. 필요하면 먼저 <strong>내보내기</strong>로 백업하세요.</p>', [{ label: '취소', act: 'modal-close' }, { label: '모두 지우기', cls: 'btn-danger', act: 'reset-ok' }]); return;
      case 'reset-ok': resetAll(); return;
    }
  });
  document.addEventListener('change', e => {
    const el = e.target, act = el.dataset && el.dataset.act;
    if (act === 'pf-set') { S.pf.set = el.value; save(); render(); }
    if (act === 'set-date' && el.value) { S.examDate = el.value; S.metaAt = Date.now(); save(); render(); toast('시험일을 바꿨어요'); }
    if (act === 'import' && el.files && el.files[0]) importData(el.files[0]);
  });
  let searchTimer = 0;
  document.addEventListener('input', e => {
    const el = e.target, act = el.dataset && el.dataset.act;
    if (act === 'set-name') { S.name = el.value.trim(); S.metaAt = Date.now(); save(); }
    if (act === 'pf-q') {
      S.pf.q = el.value; save();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const n = practicePool().length, c = $('#pf-count'); if (c) c.textContent = n;
        const start = $('[data-act="practice-start"]'), all = $('[data-act="practice-start-all"]');
        if (start) { start.disabled = !n; start.innerHTML = `${I.play} ${Math.min(n, 20)}문제 풀기`; }
        if (all) { all.hidden = n <= 20; all.textContent = `전체 ${n}문제`; }
      }, 150);
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#modal-root').innerHTML) { closeModal(); return; }
    if (e.target.matches('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('#modal-root').innerHTML) return;
    const r = route();
    if (e.key === 'Enter' && e.target.matches('tr[data-act]')) { e.target.click(); return; }
    if (r.name === 'exam' && r.a === 'run' && S.active) {
      const A = S.active;
      if (/^[1-4]$/.test(e.key) && S.prefs.layout !== 'all') { A.ans[A.qids[A.idx]] = +e.key - 1; save(); syncExam(A.idx); e.preventDefault(); }
      else if (e.key === 'ArrowRight' && S.prefs.layout !== 'all') { if (A.idx < A.qids.length - 1) examGo(A.idx + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && S.prefs.layout !== 'all') { if (A.idx > 0) examGo(A.idx - 1); e.preventDefault(); }
      else if (e.key.toLowerCase() === 'f' && S.prefs.layout !== 'all') { const b = $(`.exam-nav [data-act="exam-flag"]`); if (b) b.click(); }
      return;
    }
    if (r.name === 'practice' && r.a === 'run' && S.session) {
      const P = S.session; if (P.idx >= P.qids.length) return;
      const answered = P.ans[P.qids[P.idx]] !== undefined;
      if (/^[1-4]$/.test(e.key) && !answered) { const b = $(`.opt[data-i="${+e.key - 1}"]`); if (b) b.click(); e.preventDefault(); }
      else if (answered && (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.matches('button, a, summary')))) { $('#pr-next') && $('#pr-next').click(); e.preventDefault(); }
    }
  });
  $('#theme-btn').addEventListener('click', () => { S.prefs.theme = effectiveTheme() === 'dark' ? 'light' : 'dark'; save(); applyPrefs(); if (route().name === 'settings') render(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyPrefs);
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); else tick(); });
  window.addEventListener('pagehide', () => { flush(); });
  window.addEventListener('storage', e => { if (e.key === KEY) location.reload(); });
  setInterval(tick, 1000);

  // 실기 메뉴(silgi.js)가 쓰는 공통 기능
  window.APP = { S, save, toast, inline, rich, esc, I, go, render: () => render(), TR: () => TR, TRACKS, switchTrack, hasTopic: id => TOPIC.has(id) && TOPIC.get(id).tr === TR };

  applyPrefs();
  save();
  render();
  initSync();
})();
