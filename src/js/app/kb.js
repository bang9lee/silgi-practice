/* AI 튜터의 참고 자료 검색 — 이 프로그램의 개념 정리와 문제 해설에서 질문과 관련된 부분을 찾아 줍니다.
 * 화면 요소(DOM)를 쓰지 않아서 브라우저와 Node(자동 시험) 양쪽에서 돌아갑니다.
 * 검색 방식: 영문·숫자 단어 + 한글 두 글자 조각으로 나눈 뒤 BM25 점수로 고릅니다. */
(function (g) {
  'use strict';

  const strip = html => String(html || '')
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/li|\/tr|\/h\d|\/div|\/table|\/ul|\/ol)[^>]*>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
  const plain = md => String(md || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

  // 낱말 나누기: 영문·숫자 덩어리(t568b, 255.255.255.0, fa0/0) + 한글 두 글자 조각
  function tokens(s) {
    s = String(s || '').toLowerCase();
    const out = [];
    for (const m of s.matchAll(/[a-z0-9][a-z0-9.\-/:]*[a-z0-9]|[a-z0-9]/g)) {
      out.push(m[0]);
      if (/[./:-]/.test(m[0])) m[0].split(/[./:-]+/).filter(x => x.length > 1).forEach(x => out.push(x)); // 192.168 → 192, 168 도
    }
    for (const m of s.matchAll(/[가-힣]+/g)) {
      const w = m[0];
      if (w.length === 1) { out.push(w); continue; }
      for (let i = 0; i < w.length - 1; i++) out.push(w.slice(i, i + 2));
    }
    return out;
  }

  // 문제 하나의 정답을 글로
  function answerOf(q) {
    const a = q.answer || {};
    try {
      switch (q.type) {
        case 'short': return '정답: ' + (a.accept || []).join(' 또는 ');
        case 'choice': return `정답: ${q.options[a.index]}`;
        case 'multi': return '정답: ' + (a.indexes || []).map(i => q.options[i]).join(' / ');
        case 'drag': return '정답: ' + q.slots.map(s => `${s.label} → ${(q.items.find(i => i.id === [].concat(a.slots[s.id])[0]) || {}).label}`).join(' / ');
        case 'cable-order': return `정답: T568${a.std} 배열`;
        case 'router': return '정답 명령: ' + (q.cmds || []).join(' → ');
        case 'sim': if (q.sim === 'console') return '정답 명령: ' + (a.accept || []).join(' 또는 ');
      }
    } catch (e) { /* 형식이 다른 문제 */ }
    return '';
  }

  function build({ concepts = {}, questions = [], conceptExam = () => 'both', principles = null }) {
    const docs = [];
    for (const [id, c] of Object.entries(concepts)) {
      const parts = String(c.html || '').split(/(?=<h2[\s>])/i);
      parts.forEach((p, i) => {
        const h2 = (p.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
        const text = strip(p);
        if (text.length < 40) return;
        docs.push({ kind: 'concept', id: `${id}#${i}`, cid: id, exam: conceptExam(id), title: `개념 · ${c.title}${h2 ? ' — ' + strip(h2) : ''}`, text });
      });
    }
    // 원리 카드: 왜 그런지·문장 단서·변형 대처 (이해 중심 설명의 근거)
    if (principles && principles.cards) for (const [key, c] of Object.entries(principles.cards)) {
      const text = [c.idea, ...(c.why || []).map(x => '· ' + x), (c.clues || []).length ? '문제 문장 읽는 법: ' + c.clues.join(' / ') : '', (c.variants || []).length ? '이렇게 바뀌어 나와도: ' + c.variants.join(' / ') : ''].filter(Boolean).map(plain).join('\n');
      docs.push({ kind: 'principle', id: 'principle:' + key, cid: 'principle:' + key, exam: 'both', title: `원리 카드 · ${c.title}`, text });
    }
    for (const q of questions) {
      const text = [q.question, q.box, q.options && q.type !== 'short' ? '보기: ' + q.options.join(' / ') : '', answerOf(q), q.explain ? '해설: ' + plain(q.explain) : ''].filter(Boolean).join('\n');
      docs.push({ kind: 'question', id: q.id, cid: q.conceptRef || q.cat, exam: q.exam, title: `문제 해설 · ${String(q.question).slice(0, 70)}`, text });
    }
    // BM25 색인
    const df = new Map();
    docs.forEach(d => {
      const tf = new Map();
      tokens(d.title + ' ' + d.text).forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
      d.tf = tf; d.len = [...tf.values()].reduce((a, b) => a + b, 0);
      tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1));
    });
    const N = docs.length, avg = docs.reduce((a, d) => a + d.len, 0) / Math.max(1, N);
    const idf = t => { const n = df.get(t) || 0; return Math.log(1 + (N - n + 0.5) / (n + 0.5)); };

    function search(query, o = {}) {
      const qt = [...new Set(tokens(query))];
      if (!qt.length) return [];
      const k1 = 1.2, b = 0.75;
      const scored = [];
      for (const d of docs) {
        if (o.exam && d.exam !== o.exam && d.exam !== 'both') continue;
        if (o.exclude && o.exclude.includes(d.id)) continue;
        if (o.excludeCid && d.kind === 'concept' && d.cid === o.excludeCid) continue;
        let s = 0;
        for (const t of qt) { const f = d.tf.get(t); if (f) s += idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg)); }
        if (s > 0) scored.push([s, d]);
      }
      scored.sort((x, y) => y[0] - x[0]);
      const best = scored.length ? scored[0][0] : 0;
      const out = []; let used = 0;
      const max = o.maxChars || 2600, per = o.perDoc || 900;
      for (const [s, d] of scored) {
        if (out.length >= (o.k || 4)) break;
        if (s < best * (o.minRatio || 0.45)) break; // 너무 동떨어진 자료는 빼기
        const text = d.text.length > per ? d.text.slice(0, per) + ' …' : d.text;
        if (used + text.length > max && out.length) break;
        out.push({ title: d.title, text, kind: d.kind, id: d.id, score: +s.toFixed(2) });
        used += text.length;
      }
      return out;
    }
    return { search, size: N };
  }

  g.KB = { build, strip, tokens };
})(typeof window !== 'undefined' ? window : globalThis);
