import { BY_ID, NODES, UNIVERSAL, PHASES } from './data/nodes.js';
import { SOURCES, CONFLICTS, BASIS, SNAPSHOT } from './data/sources.js';
import { GLOSSARY, EXAMPLE, FACT_LABELS, STATE_LABELS } from './data/glossary.js';
import * as E from './engine.js';
import { EXPORTS, json } from './exports.js';
import { FIXTURES } from './fixtures.js';

const KEY = 'ttar.session';
const store = {
  get on() { try { return localStorage.getItem('ttar.persist') === '1'; } catch { return false; } },
  set on(v) { try { v ? localStorage.setItem('ttar.persist', '1') : (localStorage.removeItem('ttar.persist'), localStorage.removeItem(KEY)); } catch {} },
  load() { try { return this.on && E.importSession(localStorage.getItem(KEY)); } catch { return null; } },
  save(s) { try { if (this.on) localStorage.setItem(KEY, JSON.stringify(s)); } catch {} },
};

let s = store.load() || E.createSession();
let mode = 'run', sel = null, draft = {}, err = '', lastKey = null, sheet = null, query = '';

const h = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const $ = (q) => document.querySelector(q);
const SYM = { clear: '✓', candidate: '◐', none: '✕', unassessed: '○' };
const set = (next) => { s = next; store.save(s); render(); };

// ── Header ─────────────────────────────────────────────────────
function header() {
  const g = E.gate(s);
  return `<header>
    <div class="brand">TTAR<small>${h(s.agency || 'Technical Trust & Access Review')}</small></div>
    <nav class="seg" aria-label="Mode">${['Prepare', 'Run', 'Learn', 'Review'].map((m) =>
      `<button data-act="mode" data-v="${m.toLowerCase()}" aria-pressed="${mode === m.toLowerCase()}">${m}</button>`).join('')}</nav>
    <div class="pill-wrap"><span class="pill ${g.ok ? 'ok' : 'warn'}">${g.ok ? '✓ Gate conditions appear met' : '⚠ Gate unresolved'}</span></div>
  </header>`;
}

// ── Run ────────────────────────────────────────────────────────
function sidebar() {
  const F = E.facts(s);
  const node = E.current(s);
  const comp = E.completeness(s);
  const park = E.parked(s);
  const hist = [...s.history].reverse().filter((x, i, a) => a.findIndex((y) => y.key === x.key) === i).slice(0, 14);
  return `<aside class="side" aria-label="Progress">
    <div><h3>Phases</h3><div class="phases">${comp.map((p) =>
      `<span class="${p.done ? 'done' : ''} ${node?.phase === p.id ? 'now' : ''}">${p.label}</span>`).join('')}</div></div>
    <div><h3>Sources</h3><ul>${s.sources.map((x) => {
      const a = E.assess(s, x.id, F);
      return `<li><button data-act="focus-src" data-v="${x.id}" class="${s.cur.src === x.id ? 'here' : ''}" title="${a.label}">
        <span class="sym s-${a.state}" aria-hidden="true">${SYM[a.state]}</span><span>${h(x.name)}${x.critical ? ' <span class="dim">· critical</span>' : ''}<br><span class="dim">${a.label}</span></span></button></li>`;
    }).join('') || '<li class="dim">Add sources in Prepare.</li>'}</ul></div>
    ${s.groups.length ? `<div><h3>Networks</h3><ul>${s.groups.map((g) =>
      `<li><button class="${s.cur.grp === g.id && BY_ID[s.cur.node].scope === 'group' ? 'here' : ''}">${h(g.name)}<span class="dim">· ${STATE_LABELS[F[g.id]?.gplan?.state || 'not_asked']}</span></button></li>`).join('')}</ul></div>` : ''}
    ${park.length ? `<div><h3>Parked · ${park.length}</h3><ul>${park.map((p, i) =>
      `<li><button data-act="resume" data-v="${i}"><span class="sym">↻</span><span>${p.target} · ${h(E.sourceName(s, p.ent))}<br><span class="dim">${h(p.why)}</span></span></button></li>`).join('')}</ul></div>` : ''}
    ${hist.length ? `<div><h3>History</h3><ul>${hist.map((x) => {
      const a = s.answers[x.key];
      return `<li><button data-act="edit" data-v="${h(x.key)}"><span class="sym">${a?.stale ? '!' : ''}</span><span>${a?.node}${a?.via ? ' ← ' + a.via : ''} <span class="dim">${h(x.label)}${a?.stale ? ' · stale' : ''}</span></span></button></li>`;
    }).join('')}</ul></div>` : ''}
  </aside>`;
}

function resolvedBranch(node) {
  if (!sel) return null;
  if (sel.startsWith('@')) {
    const u = UNIVERSAL.find((x) => x.id === sel.slice(1));
    const hn = BY_ID[u.id];
    return { id: sel, label: u.label, m: hn.why, s: hn.ask, handler: hn };
  }
  return node.b.find((b) => b.id === sel);
}

function fields(node, br) {
  if (!br) return '';
  const ev = draft.ev || {};
  const out = [];
  if (br.group) {
    out.push(`<label class="label" for="f-group">Network group</label>
      <select id="f-group" data-draft="group"><option value="">Choose…</option>
      ${s.groups.map((g) => `<option value="${g.id}" ${draft.group === g.id ? 'selected' : ''}>${h(g.name)}</option>`).join('')}
      <option value="new:" ${draft.group?.startsWith('new:') ? 'selected' : ''}>New group…</option></select>
      ${draft.group?.startsWith('new:') ? `<input data-draft="groupName" placeholder="Name, e.g. County 911 network" value="${h(draft.group.slice(4))}">` : ''}`);
  }
  if (br.pick) {
    out.push(`<label class="label" for="f-src">Affected source</label><select id="f-src" data-draft="src"><option value="">Choose…</option>
      ${s.sources.map((x) => `<option value="${x.id}" ${draft.src === x.id ? 'selected' : ''}>${h(x.name)}</option>`).join('')}</select>`);
  }
  if (br.input === 'exception') out.push(`<input data-draft="exception" placeholder="Written approval reference (who, date, scope)" value="${h(draft.exception || '')}">`);
  const evFields = `<div class="row"><input data-ev="speaker" placeholder="Who confirmed${br.confirm ? ' *' : ''}" value="${h(ev.speaker || '')}">
      <input data-ev="role" placeholder="Their role${br.confirm ? ' *' : ''}" value="${h(ev.role || '')}"></div>
    <div class="row"><select data-ev="channel">${['Meeting', 'Email', 'Call', 'Document'].map((c) => `<option ${ev.channel === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <input data-ev="reference" placeholder="Reference (link, email date)" value="${h(ev.reference || '')}"></div>
    <input data-ev="scope" placeholder="Exactly what was confirmed, and any restrictions" value="${h(ev.scope || '')}">`;
  out.push(br.confirm
    ? `<div class="req">Confirmation — record who said it.</div>${evFields}`
    : `<details ${ev.speaker ? 'open' : ''}><summary>Add evidence</summary><div class="fields">${evFields}</div></details>`);
  out.push(`<textarea data-draft="note" placeholder="Notes — no passwords, keys, or CJI" aria-label="Notes">${h(draft.note || '')}</textarea>`);
  return `<div class="fields">${out.join('')}</div>`;
}

function insight(node, br) {
  const refs = node.refs.map((r) => `<a href="${SOURCES[r].url}" target="_blank" rel="noopener" title="${h(SOURCES[r].title)}">${r}</a>`).join('');
  const basis = `<div class="basis">${BASIS[node.basis]} · ${refs || '—'} · ${SNAPSHOT}<br>Branch guidance is proposed decision-aid logic.</div>`;
  if (!br) return `<section class="insight" aria-live="polite"><p class="empty">Choose the customer’s answer to see what it means.</p>${basis}</section>`;
  const nxt = E.preview(s, br.id, draft);
  const nn = nxt && !nxt.done ? BY_ID[nxt.cur.node] : null;
  const acts = br.handler ? [] : br.a || [];
  return `<section class="insight" aria-live="polite">
    <div><div class="label">Means</div><p class="meaning">${h(br.m)}</p></div>
    ${br.s ? `<div><div class="label">Say</div><blockquote>“${h(br.s)}”</blockquote></div>` : ''}
    <div><div class="label">Do</div>${acts.length
      ? `<ul class="do">${acts.map(([t, r]) => `<li>${h(t)} <small>· ${h(r)}</small></li>`).join('')}</ul>`
      : `<p class="muted">${br.handler ? 'Ask the follow-up next.' : 'No action — record and continue.'}</p>`}</div>
    ${br.g ? `<p class="impact">⚠ ${h(br.g)}</p>` : ''}
    ${br.park ? '<p class="muted">Parked — stays visible until resolved.</p>' : ''}
    <div><div class="label">Next</div><p class="next">${nn ? `<b>${nn.id}</b> ${h(nn.ask.slice(0, 110))}${nn.ask.length > 110 ? '…' : ''}` : nxt?.done ? 'Finish' : '—'}</p></div>
    <div class="actions-row"><button class="primary" data-act="continue">Continue</button><span class="muted" style="font-size:12px">↵</span></div>
    ${err ? `<p class="err" role="alert">${h(err)}</p>` : ''}
    ${basis}
  </section>`;
}

function run() {
  if (s.done) {
    return `<main class="run">${sidebar()}<section class="card done">
      <h1>TTAR complete.</h1><p class="muted">Review the gate, actions, and recaps.</p><br>
      <div class="actions-row" style="justify-content:center"><button class="primary" data-act="mode" data-v="review">Review</button><button class="ghost" data-act="back">Back</button></div>
    </section><section></section></main>`;
  }
  const node = E.current(s);
  const key = E.keyOf(s.cur);
  if (key !== lastKey) {
    lastKey = key;
    const prev = s.answers[key];
    sel = prev?.branch || null;
    draft = prev ? { note: prev.note, ev: prev.ev || {} } : {};
    err = '';
  }
  const prev = s.answers[key];
  const br = resolvedBranch(node);
  const ctxName = s.cur.src || s.cur.grp ? E.sourceName(s, node.scope === 'group' ? s.cur.grp : s.cur.src || s.cur.grp) : '';
  const phase = PHASES.find(([p]) => p === node.phase)?.[1] || 'Follow-up';
  const blockers = s.sources.filter((x) => x.critical && E.assess(s, x.id).state === 'none');
  return `<main class="run">${sidebar()}
    <section class="card">
      ${blockers.length ? `<p class="blocker" role="status">✕ No established path: ${blockers.map((x) => h(x.name)).join(', ')}. Discovery can continue.</p><br>` : ''}
      <div class="eyebrow"><span>${phase}</span><span class="tag ${node.aud === 'internal' ? 'internal' : ''}">${node.id}${node.aud === 'internal' ? ' · internal' : ''}</span>${ctxName ? `<span>${h(ctxName)}</span>` : ''}${node.scope === 'inherit' ? `<span>follow-up to ${s.cur.via}</span>` : ''}</div>
      ${prev ? `<p class="prev ${prev.stale ? 'stale' : ''}">${prev.stale ? '! Earlier answer is stale — reconfirm.' : 'Previously answered — editing.'}</p>` : ''}
      <h1 class="q">${node.aud === 'internal' ? '' : '“'}${h(node.ask)}${node.aud === 'internal' ? '' : '”'}</h1>
      <p class="whom">Ask <b>${h(node.whom)}</b></p>
      <p class="why">${h(node.why)} ${h(node.plain)}</p>
      <div class="choices" role="group" aria-label="Answers">${node.b.map((b, i) =>
        `<button class="choice" data-act="sel" data-v="${b.id}" aria-pressed="${sel === b.id}"><span class="k">${i + 1}</span>${h(b.label)}</button>`).join('')}</div>
      ${node.scope !== 'inherit' ? `<div class="chips" role="group" aria-label="Other responses">${UNIVERSAL.map((u) =>
        `<button class="chip" data-act="sel" data-v="@${u.id}" aria-pressed="${sel === '@' + u.id}">${u.label}</button>`).join('')}</div>` : ''}
      ${fields(node, br)}
      <div class="actions-row" style="margin-top:20px"><button class="ghost" data-act="back">← Back</button></div>
    </section>
    ${insight(node, br)}
  </main>`;
}

// ── Prepare ────────────────────────────────────────────────────
function prepare() {
  return `<main class="page">
    <div><h1>Prepare</h1><p class="lede">Who, what, and which systems.</p></div>
    <div class="panel rows">
      <div class="grid3"><input data-meta="agency" placeholder="Agency" value="${h(s.agency)}">
        <input data-meta="jurisdiction" placeholder="State / jurisdiction" value="${h(s.jurisdiction)}">
        <input data-meta="date" type="date" value="${h(s.date)}"></div>
      <div class="btns"><select data-act="fixture" aria-label="Load example" style="width:auto"><option value="">Load example…</option>${FIXTURES.map((f, i) => `<option value="${i}">${h(f.name)}</option>`).join('')}</select>
        <button class="btn" data-act="reset">New session</button></div>
    </div>
    <div><h2>Sources</h2><div class="panel rows">
      ${s.sources.map((x, i) => `<div class="line l-src">
        <select data-src="${i}" data-k="kind" aria-label="Kind">${E.KINDS.map((k) => `<option ${x.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
        <input data-src="${i}" data-k="name" placeholder="Name" value="${h(x.name)}">
        <input data-src="${i}" data-k="vendor" placeholder="Vendor · product · version" value="${h(x.vendor)}">
        <label class="check"><input type="checkbox" data-src="${i}" data-k="critical" ${x.critical ? 'checked' : ''}>Critical</label>
        <button class="x" data-act="rm-src" data-v="${i}" aria-label="Remove ${h(x.name)}">×</button></div>`).join('')}
      <div><button class="ghost" data-act="add-src">+ Add source</button></div>
    </div></div>
    <div><h2>People</h2><div class="panel rows">
      ${s.contacts.map((c, i) => `<div class="line l-con">
        <input data-con="${i}" data-k="name" placeholder="Name" value="${h(c.name)}">
        <input data-con="${i}" data-k="role" placeholder="Role" value="${h(c.role)}">
        <input data-con="${i}" data-k="manages" placeholder="Manages" value="${h(c.manages)}">
        <button class="x" data-act="rm-con" data-v="${i}" aria-label="Remove">×</button></div>`).join('')}
      <div><button class="ghost" data-act="add-con">+ Add person</button></div>
    </div></div>
    <div><h2>Agenda</h2><div class="panel"><p>${h(BY_ID.M03.ask.split(' Does that')[0])}</p></div></div>
    <div><h2>Privacy</h2><div class="panel rows">
      <p class="muted">The session lives in memory. Never enter passwords, keys, pre-shared keys, biometrics, or CJI. Real customer data needs an approved storage decision.</p>
      <label class="check"><input type="checkbox" data-act="persist" ${store.on ? 'checked' : ''}>Remember this session in this browser</label>
    </div></div>
  </main>`;
}

// ── Learn ──────────────────────────────────────────────────────
function learn() {
  const q = query.toLowerCase();
  const match = (...xs) => !q || xs.join(' ').toLowerCase().includes(q);
  const gl = GLOSSARY.filter(([t, d]) => match(t, d));
  const nodes = NODES.filter((n) => match(n.id, n.ask, n.why, n.plain, ...n.b.map((b) => b.label + b.m)));
  return `<main class="page">
    <div><h1>Learn</h1><p class="lede">Terms, every question, every branch.</p></div>
    <input type="search" data-act="search" placeholder="Search" value="${h(query)}" aria-label="Search glossary and questions">
    <div><h2>Glossary</h2><div class="panel"><dl>${gl.map(([t, d]) => `<dt>${h(t)}</dt><dd>${h(d)}</dd>`).join('') || '<dd>No matches.</dd>'}</dl></div></div>
    ${!q ? `<div><h2>Weak vs strong</h2><div class="panel rows"><p class="muted">Weak</p><p>${h(EXAMPLE.weak)}</p><p class="muted">Strong</p><p>${h(EXAMPLE.strong)}</p><p class="muted">${h(EXAMPLE.note)}</p></div></div>` : ''}
    <div><h2>Questions · ${nodes.length}</h2><div class="panel">${nodes.map((n) => `<details class="node"><summary><b>${n.id}</b>${h(n.ask)}</summary>
      <ul>${n.b.map((b) => `<li><b>${h(b.label)}</b> — ${h(b.m)} <span class="muted">→ ${b.call ? `${b.call}, then ${b.ret}` : b.next}</span></li>`).join('')}</ul></details>`).join('')}</div></div>
    ${!q ? `<div><h2>Known conflicts</h2><div class="panel"><ul class="do">${CONFLICTS.map((c) => `<li>${h(c)}</li>`).join('')}</ul></div></div>
    <div><h2>Sources</h2><div class="panel"><dl>${Object.entries(SOURCES).map(([id, x]) => `<dt>${id}</dt><dd><a href="${x.url}" target="_blank" rel="noopener">${h(x.title)}</a>${x.note ? ` — ${h(x.note)}` : ''}</dd>`).join('')}</dl></div></div>` : ''}
  </main>`;
}

// ── Review ─────────────────────────────────────────────────────
function review() {
  const F = E.facts(s);
  const g = E.gate(s);
  const p = E.proposedStatus(s);
  const comp = E.completeness(s);
  const acts = E.actions(s);
  const park = E.parked(s);
  return `<main class="page">
    <div><h1>Review</h1><p class="lede">What’s known, what’s not, who owns what.</p></div>
    <div class="grid3">
      <div class="panel"><div class="label">Commercial gate</div><p class="big">${g.ok ? '✓' : '⚠'} ${h(g.text)}</p>
        <ul class="do" style="margin-top:8px">${g.reasons.map((r) => `<li>${h(r)}</li>`).join('')}</ul>${g.exception ? `<p class="impact">${h(g.exception)}</p>` : ''}</div>
      <div class="panel"><div class="label">Proposed SFDC status</div><p class="big">${h(p.status)}</p><p class="muted" style="font-size:13px">${h(p.why)} SE review required.</p>
        ${s.crm ? `<p style="font-size:13px;margin-top:8px">SE recorded: <b>${h(s.crm)}</b> · not synced</p>` : ''}</div>
      <div class="panel"><div class="label">Discovery</div><p class="big">${comp.filter((c) => c.done).length} of ${comp.length} phases</p><p class="muted" style="font-size:13px">${park.length} parked · ${s.maturity === 'exploratory' ? 'Exploratory — plan a validation TTAR.' : s.maturity.replace('_', '-')}</p></div>
    </div>
    <div><h2>Sources</h2><div class="rows">${s.sources.map((x) => {
      const a = E.assess(s, x.id, F);
      return `<div class="panel"><div class="actions-row"><span class="sym s-${a.state}" aria-hidden="true">${SYM[a.state]}</span><b>${h(x.name)}</b><span class="muted">${h(x.vendor)}${x.critical ? ' · critical' : ''}${x.parent ? ' · linked endpoint' : ''}</span></div>
        <p style="margin-top:4px">${a.label}</p>
        <div class="dims">${Object.entries(a.dims).map(([k, v]) => `<span class="${['owner_confirmed', 'verified', 'provisioned', 'not_applicable'].includes(v) ? 'good' : v === 'not_asked' ? '' : 'bad'}">${FACT_LABELS[k] || k}: ${STATE_LABELS[v]}</span>`).join('')}</div></div>`;
    }).join('') || '<p class="muted">No sources yet.</p>'}</div></div>
    ${park.length ? `<div><h2>Open items</h2><div class="panel rows">${park.map((x, i) => `<div class="actions-row"><button class="ghost" data-act="resume" data-v="${i}">↻ Resume</button><span><b>${x.target}</b> · ${h(E.sourceName(s, x.ent))} <span class="muted">— ${h(x.why)}</span></span></div>`).join('')}</div></div>` : ''}
    <div><h2>Actions · ${acts.filter((a) => !a.stale).length}</h2><div class="panel">${acts.map((a) => `<div class="line l-act" ${a.stale ? 'style="opacity:.5"' : ''}>
      <span><b>${h(a.title)}</b><br><span class="muted">${h(a.role)} · ${h(E.sourceName(s, a.ent))} · ${a.aud}${a.stale ? ' · stale' : ''}</span></span>
      <input data-action="${h(a.key)}" data-k="assignee" placeholder="Assignee" value="${h(a.assignee)}">
      <span><input type="date" data-action="${h(a.key)}" data-k="due" value="${h(a.due)}" aria-label="Due date"><label class="check"><input type="checkbox" data-action="${h(a.key)}" data-k="agreed" ${a.agreed ? 'checked' : ''}>Agreed</label></span>
      <select data-action="${h(a.key)}" data-k="status" aria-label="Status">${['suggested', 'agreed', 'request_sent', 'result_pending', 'resolved', 'cancelled'].map((x) => `<option value="${x}" ${a.status === x ? 'selected' : ''}>${x.replace('_', ' ')}</option>`).join('')}</select>
    </div>`).join('') || '<p class="muted">None yet.</p>'}</div></div>
    <div><h2>Export</h2><div class="btns">${EXPORTS.map(([name], i) => `<button class="btn" data-act="export" data-v="${i}">${name}</button>`).join('')}
      <button class="btn" data-act="save">Save session</button><button class="btn" data-act="open">Open session</button></div>
      <p class="muted" style="font-size:13px;margin-top:10px">Drafts only. Nothing is sent, submitted, or synced.</p></div>
  </main>`;
}

function modal() {
  if (!sheet) return '';
  return `<div class="modal" data-act="close"><div class="sheet" role="dialog" aria-label="${h(sheet.title)}">
    <header><div class="brand">${h(sheet.title)}</div><button class="x" data-act="close" aria-label="Close">×</button></header>
    <pre>${h(sheet.text)}</pre>
    <footer class="no-print"><button class="btn" data-act="print">Print</button><button class="btn" data-act="download">Download</button><button class="primary" data-act="copy">Copy</button></footer>
  </div></div>`;
}

function render() {
  const pages = { run, prepare, learn, review };
  $('#app').innerHTML = header() + pages[mode]() + modal();
  document.body.classList.toggle('modal-open', !!sheet);
}

// ── Events ─────────────────────────────────────────────────────
function advance() {
  if (!sel) return;
  const input = { ...draft };
  if (draft.group === 'new:') input.group = 'new:' + (draft.groupName || '');
  try { set(E.choose(s, sel, input)); } catch (e) { err = e.message; render(); }
}

const download = (name, text) => {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text])), download: name });
  a.click(); URL.revokeObjectURL(a.href);
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t || t.tagName === 'SELECT' || t.type === 'checkbox') return;
  const v = t.dataset.v;
  switch (t.dataset.act) {
    case 'mode': mode = v; render(); break;
    case 'sel': sel = v; err = ''; render(); break;
    case 'continue': advance(); break;
    case 'back': lastKey = null; set(E.back(s)); break;
    case 'edit': lastKey = null; mode = 'run'; set(E.goTo(s, v)); break;
    case 'resume': lastKey = null; mode = 'run'; set(E.resume(s, E.parked(s)[+v])); break;
    case 'focus-src': {
      const k = Object.keys(s.answers).filter((x) => x.endsWith('@' + v)).sort((a, b) => s.answers[b].seq - s.answers[a].seq)[0];
      if (k) { lastKey = null; set(E.goTo(s, k)); }
      break;
    }
    case 'add-src': s.sources.push({ id: 's' + Date.now().toString(36), kind: 'CAD', name: '', vendor: '', critical: true, parent: null }); set(s); break;
    case 'rm-src': if (confirm('Remove this source? Its answers stay in history.')) { s.sources.splice(+v, 1); set(s); } break;
    case 'add-con': s.contacts.push({ name: '', role: '', manages: '' }); set(s); break;
    case 'rm-con': s.contacts.splice(+v, 1); set(s); break;
    case 'reset': if (confirm('Start a new session? Unsaved work is lost.')) { lastKey = null; set(E.createSession()); } break;
    case 'export': { const [title, fn] = EXPORTS[+v]; sheet = { title, text: fn(s) }; render(); break; }
    case 'save': download(`ttar-${(s.agency || 'session').replace(/\W+/g, '-').toLowerCase()}-${s.date}.json`, json(s)); break;
    case 'open': {
      const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
      inp.onchange = async () => { try { lastKey = null; set(E.importSession(await inp.files[0].text())); } catch (x) { alert(x.message); } };
      inp.click(); break;
    }
    case 'close': if (e.target === t) { sheet = null; render(); } break;
    case 'copy': navigator.clipboard?.writeText(sheet.text); t.textContent = 'Copied'; break;
    case 'download': download(sheet.title.toLowerCase().replace(/\W+/g, '-') + '.md', sheet.text); break;
    case 'print': window.print(); break;
  }
});

document.addEventListener('input', (e) => {
  const d = e.target.dataset;
  if (d.draft) {
    if (d.draft === 'groupName') draft.groupName = e.target.value;
    else draft[d.draft] = e.target.value;
  } else if (d.ev) (draft.ev ||= {})[d.ev] = e.target.value;
  else if (d.meta) { s[d.meta] = e.target.value; store.save(s); }
  else if (d.src !== undefined && e.target.type !== 'checkbox') { s.sources[+d.src][d.k] = e.target.value; store.save(s); }
  else if (d.con !== undefined) { s.contacts[+d.con][d.k] = e.target.value; store.save(s); }
  else if (d.act === 'search') { query = e.target.value; render(); const i = $('[data-act="search"]'); i.focus(); i.setSelectionRange(query.length, query.length); }
});

document.addEventListener('change', (e) => {
  const d = e.target.dataset;
  if (d.draft === 'group') { draft.group = e.target.value; render(); }
  else if (d.src !== undefined) { const x = s.sources[+d.src]; x[d.k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; set(s); }
  else if (d.action) set(E.setAction(s, d.action, { [d.k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  else if (d.act === 'fixture' && e.target.value !== '') { lastKey = null; set(E.createSession(structuredClone(FIXTURES[+e.target.value].session))); }
  else if (d.act === 'persist') {
    if (e.target.checked && !confirm('Store this session in this browser? Only do this on an approved device. Never store secrets or CJI.')) { e.target.checked = false; return; }
    store.on = e.target.checked; store.save(s);
  } else if (d.meta) render();
});

document.addEventListener('keydown', (e) => {
  if (sheet && e.key === 'Escape') { sheet = null; render(); return; }
  if (mode !== 'run' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  const node = E.current(s);
  if (!node) return;
  if (/^[1-9]$/.test(e.key) && node.b[+e.key - 1]) { sel = node.b[+e.key - 1].id; err = ''; render(); }
  else if (e.key === 'Enter' && sel && !document.activeElement?.closest('button')) { e.preventDefault(); advance(); }
  else if (e.key === 'ArrowLeft') { lastKey = null; set(E.back(s)); }
});

const errs = E.validateGraph();
if (errs.length) console.error('Graph errors', errs);
render();
