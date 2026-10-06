import { SECTIONS, ANY, COMBOS, TERMS } from './data.js';

const KEY = 'ttar.v2';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch {} };

let A = load();            // answers: question id -> answer id
let showAll = false;       // show every meaning
let anySel = null;         // index into ANY

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const gloss = (s) => esc(s).replace(/\{([^}]+)\}/g, (_, t) => TERMS[t] ? `<span class="t" tabindex="0" data-term="${esc(t)}">${esc(t)}</span>` : esc(t));
const RANK = { no: 3, unk: 2, pend: 1, ok: 0 };
const worst = (sts) => sts.length ? sts.reduce((w, s) => (RANK[s] > RANK[w] ? s : w)) : null;
const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
const Q = Object.fromEntries(SECTIONS.flatMap((s) => s.q.map((q) => [q.id, q])));
const pick = (q) => q.a.find((x) => x.id === A[q.id]);

const secState = (sec) => worst(sec.q.map(pick).filter(Boolean).map((a) => a.st));
const relevant = (sec) => !(sec.id === 'network' && A.host && A.host !== 'onprem' && A.host !== 'hybrid' && !Object.values(A).includes('priv'));

function header() {
  return `<div class="top"><div class="wrap">
    <div class="titlebar"><h1>TTAR</h1><p>Pick what you hear. See what it means.</p>
      <div class="ctl"><button data-act="all" aria-pressed="${showAll}">Show all meanings</button><button data-act="reset">Reset</button></div></div>
    <nav class="map" aria-label="Sections">${SECTIONS.map((s) => `<button data-act="jump" data-v="${s.id}"><span class="dot ${secState(s) || ''}"></span>${esc(s.title)}</button>`).join('')}</nav>
  </div></div>`;
}

function answerPanel(a) {
  return `<div class="mean">
    <p>${gloss(a.m)}</p>
    ${a.say ? `<p class="say"><span class="lab">Say</span>“${esc(a.say)}”</p>` : ''}
    ${a.do ? `<p><span class="lab">After</span>${esc(a.do)}</p>` : ''}
    ${a.go ? `<p><button class="go" data-act="jump" data-v="${a.go}">Next: ${esc(byId[a.go].title)} →</button></p>` : ''}
  </div>`;
}

function question(q) {
  const sel = pick(q);
  return `<div class="q">
    <p class="ask">${gloss(q.ask)}</p>
    <div class="chips" role="group">${q.a.map((a) => `<button class="chip" data-act="pick" data-q="${q.id}" data-v="${a.id}" aria-pressed="${sel?.id === a.id}" title="${esc(a.m)}"><span class="dot ${a.st}"></span>${esc(a.l)}</button>`).join('')}</div>
    ${sel ? answerPanel(sel) : ''}
    ${showAll ? `<ul class="all">${q.a.map((a) => `<li><span class="dot ${a.st}"></span><span><b>${esc(a.l)}.</b> ${gloss(a.m)}${a.go ? ` <i>→ ${esc(byId[a.go].title)}</i>` : ''}</span></li>`).join('')}</ul>` : ''}
  </div>`;
}

function section(s) {
  const st = secState(s);
  return `<section class="sec ${relevant(s) ? '' : 'dim'}" id="s-${s.id}">
    <div class="num ${st || ''}">${s.n}</div>
    <h2>${esc(s.title)}</h2><p class="sub">${esc(s.sub)}</p>
    ${s.q.map(question).join('')}
    ${s.notes ? `<details class="notes"><summary>Vendor notes</summary>${s.notes.map(([v, rows]) => `<div class="vend">${esc(v)}</div><table>${rows.map(([k, m]) => `<tr><td>${esc(k)}</td><td>${esc(m)}</td></tr>`).join('')}</table>`).join('')}</details>` : ''}
  </section>`;
}

function rail() {
  const combos = COMBOS.map((c) => ({ st: c.st, t: c.t(A) })).filter((c) => c.t);
  const todo = SECTIONS.flatMap((s) => s.q.map(pick)).filter((a) => a?.do).map((a) => a.do);
  const any = anySel != null ? ANY[anySel] : null;
  return `<aside class="rail">
    <div class="panel"><h3>What it adds up to</h3>
      ${combos.length ? `<ul>${combos.map((c) => `<li><span class="dot ${c.st}"></span><span>${esc(c.t)}</span></li>`).join('')}</ul>` : '<p class="empty">Pick answers and the combinations show up here.</p>'}
    </div>
    <div class="panel"><h3>After the call</h3>
      ${todo.length ? `<ul>${todo.map((t) => `<li><span class="dot pend"></span><span>${esc(t)}</span></li>`).join('')}</ul>` : '<p class="empty">Nothing yet.</p>'}
    </div>
    <div class="panel any"><h3>If they say…</h3>
      <div class="chips">${ANY.map((x, i) => `<button class="chip" data-act="any" data-v="${i}" aria-pressed="${anySel === i}">${esc(x.l)}</button>`).join('')}</div>
      ${any ? `<div class="mean"><p>${esc(any.m)}</p><p class="say"><span class="lab">Say</span>“${esc(any.say)}”</p></div>` : ''}
    </div>
    <div class="panel aux"><h3>Legend</h3>
      <ul><li><span class="dot ok"></span>Good</li><li><span class="dot pend"></span>Needs confirmation</li><li><span class="dot unk"></span>Unknown</li><li><span class="dot no"></span>Blocked</li></ul>
    </div>
    <div class="panel aux"><h3>Terms</h3>
      <div class="terms">${Object.entries(TERMS).map(([k, v]) => `<div><b>${esc(k)}</b> <span>${esc(v)}</span></div>`).join('')}</div>
    </div>
  </aside>`;
}

function render() {
  const y = window.scrollY;
  document.getElementById('app').innerHTML = `${header()}<div class="wrap"><div class="body"><div class="flow">${SECTIONS.map(section).join('')}</div>${rail()}</div></div>`;
  window.scrollTo(0, y);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) { const t = e.target.closest('.t'); if (t) { pop ? hidePop() : showPop(t); return; } if (!e.target.closest('.pop')) hidePop(); return; }
  const v = b.dataset.v;
  switch (b.dataset.act) {
    case 'pick': A[b.dataset.q] === v ? delete A[b.dataset.q] : (A[b.dataset.q] = v); save(); render(); break;
    case 'any': anySel = anySel === +v ? null : +v; render(); break;
    case 'all': showAll = !showAll; render(); break;
    case 'reset': if (Object.keys(A).length === 0 || confirm('Clear all answers?')) { A = {}; anySel = null; save(); render(); } break;
    case 'jump': document.getElementById('s-' + v)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
  }
});

// Term popovers
let pop = null;
const hidePop = () => { pop?.remove(); pop = null; };
function showPop(el) {
  hidePop();
  const t = el.dataset.term; if (!TERMS[t]) return;
  pop = document.createElement('div'); pop.className = 'pop'; pop.setAttribute('role', 'tooltip');
  pop.innerHTML = `<b>${esc(t)}</b>${esc(TERMS[t])}`;
  document.body.appendChild(pop);
  const r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
  let y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = r.top - h - 8;
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}
document.addEventListener('mouseover', (e) => { const t = e.target.closest('.t'); if (t) showPop(t); });
document.addEventListener('mouseout', (e) => { if (e.target.closest('.t') && !e.relatedTarget?.closest?.('.pop')) hidePop(); });
document.addEventListener('focusin', (e) => { const t = e.target.closest('.t'); if (t) showPop(t); });
document.addEventListener('focusout', hidePop);
document.addEventListener('scroll', hidePop, { passive: true });

render();
