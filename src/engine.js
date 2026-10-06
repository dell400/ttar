// Deterministic rules engine. Pure functions over a plain session object.
// Facts, actions, parked items, assessments, and the gate are all derived
// from answers — so an edited answer can never leave a stale green state.
import { NODES, BY_ID, UNIVERSAL, PHASES } from './data/nodes.js';

export const KINDS = ['CAD', 'RMS', 'JMS', 'LPR', 'GIS', 'Identity', 'Legacy', 'Other'];
const LOOP = ['CAD', 'RMS', 'JMS', 'LPR', 'Legacy', 'Other'];
const TOKENS = ['RETURN', 'NEXT_SOURCE', 'END_SOURCE', 'OVERLAY', 'FLORIDA', 'END'];
const OK = ['owner_confirmed', 'verified', 'provisioned', 'not_applicable'];
const BLOCKING = ['auth', 'method', 'network', 'coverage', 'vendor', 'cost', 'path'];

export const ASSESS = {
  clear: 'No unresolved feasibility issue identified',
  candidate: 'Candidate path; confirmation needed',
  none: 'No established path',
  unassessed: 'Not assessed',
};
export const STATUSES = ['Completed', 'Follow-ups needed', 'Unclear data access; no follow-ups'];

const clone = (x) => structuredClone(x);
const today = () => new Date().toISOString().slice(0, 10);

export function createSession(init = {}) {
  return {
    v: 1, agency: '', jurisdiction: '', date: today(), maturity: 'unknown', florida: false,
    crm: '', exception: '', contacts: [], sources: [], groups: [],
    cur: { node: 'P01', src: null, grp: null, via: null }, stack: [],
    answers: {}, seq: 0, history: [], actionStatus: {}, done: false, ...init,
  };
}

// ── Keys & lookups ─────────────────────────────────────────────
function entOf(node, cur) {
  if (node.scope === 'inherit') return entOf(BY_ID[cur.via] || { scope: 'meeting' }, cur);
  if (node.scope === 'source') return cur.src || cur.grp || 'm';
  if (node.scope === 'group') return cur.grp || 'm';
  return 'm';
}
export const keyOf = (cur) => `${cur.node}${cur.via ? ':' + cur.via : ''}@${entOf(BY_ID[cur.node], cur)}`;
export const current = (s) => (s.done ? null : BY_ID[s.cur.node]);
const answered = (s, key) => s.answers[key] && !s.answers[key].stale;
const sorted = (s) => Object.values(s.answers).sort((a, b) => a.seq - b.seq);

export function branchOf(a) {
  if (a.branch.startsWith('@')) {
    const u = UNIVERSAL.find((x) => x.id === a.branch.slice(1));
    const node = BY_ID[a.node];
    return { id: a.branch, label: u.label, uni: true, f: u.state && node.fact ? { [node.fact]: u.state } : {} };
  }
  return BY_ID[a.node].b.find((x) => x.id === a.branch);
}

export const sourceName = (s, id) => s.sources.find((x) => x.id === id)?.name
  || s.groups.find((x) => x.id === id)?.name || 'Meeting';

// ── Answering & navigation ─────────────────────────────────────
export function choose(s0, branchId, input = {}) {
  const s = clone(s0);
  const node = BY_ID[s.cur.node];
  let br;
  if (branchId.startsWith('@')) {
    const u = UNIVERSAL.find((x) => x.id === branchId.slice(1));
    br = { id: branchId, label: u.label, call: u.id, ret: node.cont };
  } else {
    br = node.b.find((x) => x.id === branchId);
  }
  if (!br) throw new Error(`Unknown branch ${branchId} on ${node.id}`);
  if (!input.preview) {
    if (br.confirm && !(input.ev?.speaker && input.ev?.role)) throw new Error('Confirmation needs who confirmed and their role.');
    if (br.group && !input.group) throw new Error('Choose a network group.');
    if (br.pick && !input.src) throw new Error('Choose the affected source.');
  }

  // Record (history keeps every version).
  const key = keyOf(s.cur);
  const ent = entOf(node, s.cur);
  const prev = s.answers[key];
  const seq = ++s.seq;
  if (prev && prev.branch !== br.id) {
    for (const a of Object.values(s.answers)) {
      if (a.key !== key && a.ent === ent && a.seq > prev.seq && (ent !== 'm' || BY_ID[a.node].phase === node.phase)) a.stale = true;
    }
  }
  s.answers[key] = {
    key, node: node.id, via: s.cur.via, ent, branch: br.id, seq, stale: false,
    note: input.note || '', ev: input.ev || null,
    ctx: { cur: { ...s.cur }, stack: clone(s.stack) },
  };
  if (!input.preview) s.history.push({ seq, key, label: br.label, at: new Date().toISOString() });

  // Side effects on session metadata.
  if (br.meta?.maturity) s.maturity = br.meta.maturity;
  if (br.meta?.florida) s.florida = true;
  if (br.meta?.crm) s.crm = br.meta.crm;
  if (br.input === 'exception' && input.exception) s.exception = input.exception;

  let gid = null;
  if (br.group) {
    gid = input.group || 'g?';
    if (gid.startsWith('new:')) {
      const name = gid.slice(4) || `Network ${s.groups.length + 1}`;
      gid = 'g' + (s.groups.length + 1);
      s.groups.push({ id: gid, name });
    }
    const src = s.sources.find((x) => x.id === s.cur.src);
    if (src) {
      if (br.group === 'pick') src.group = gid;
      else src.extra = [...new Set([...(src.extra || []), gid])];
    }
  }
  let spawned = null;
  if (br.spawn && s.cur.src) {
    const parent = s.sources.find((x) => x.id === s.cur.src);
    const media = br.spawn === 'media';
    spawned = `${parent.id}-${media ? 'm' : 'n'}`;
    if (!s.sources.some((x) => x.id === spawned)) {
      s.sources.push(media
        ? { id: spawned, kind: 'Other', name: `${parent.name} media`, vendor: '', critical: false, parent: parent.id }
        : { id: spawned, kind: parent.kind, name: `New ${parent.name}`, vendor: '', critical: parent.critical, parent: null });
    }
  }

  // Navigate.
  const cur = s.cur;
  if (br.call) {
    s.stack.push({ node: br.ret, src: cur.src, grp: cur.grp, via: cur.via });
    const ctx = { src: cur.src, grp: cur.grp, via: BY_ID[br.call].scope === 'inherit' ? (node.scope === 'inherit' ? cur.via : node.id) : null };
    if (gid) ctx.grp = gid;
    if (br.spawn === 'media') ctx.src = spawned;
    if (br.pick) ctx.src = input.src;
    return resolve(s, br.call, ctx);
  }
  if (br.next === 'RETURN') return ret(s, node.cont);
  if (br.drop) s.stack.pop();
  if (br.rc && s.stack.length) return ret(s);
  if (br.srcOnly && !cur.src) return ret(s);
  return resolve(s, br.next, { src: cur.src, grp: cur.grp, via: cur.via });
}

function ret(s, fallback) {
  const f = s.stack.pop();
  if (f) return resolve(s, f.node, { src: f.src, grp: f.grp, via: f.via || null });
  const t = fallback && fallback !== 'RETURN' ? fallback : s.cur.src ? 'O01' : 'NEXT_SOURCE';
  return resolve(s, t, { src: s.cur.src, grp: s.cur.grp, via: null });
}

export function nextSource(s) {
  return s.sources.find((x) => !x.parent && LOOP.includes(x.kind) && !answered(s, `D09@${x.id}`));
}

export function overlayFor(vendor = '') {
  const v = vendor.toLowerCase();
  if (/centralsquare|spillman/.test(v)) return 'V04';
  if (/rims|sun ridge/.test(v)) return 'V05';
  if (/mark43/.test(v)) return 'V06';
  if (/southern/.test(v)) return 'V07';
  return 'V08';
}

function resolve(s, target, ctx) {
  switch (target) {
    case 'RETURN': return ret(s);
    case 'END': s.done = true; s.cur = { node: 'R04', src: null, grp: null, via: null }; return s;
    case 'END_SOURCE': if (s.stack.length) return ret(s); // linked/child subflow → parent
    // falls through
    case 'NEXT_SOURCE': {
      const n = nextSource(s);
      return resolve(s, n ? 'I02' : 'X01', { src: n?.id || null, grp: null, via: null });
    }
    case 'OVERLAY': {
      const src = s.sources.find((x) => x.id === ctx.src);
      const o = overlayFor(src?.vendor);
      return resolve(s, answered(s, `${o}@${ctx.src}`) ? 'V02' : o, ctx);
    }
    case 'FLORIDA':
      if (s.florida) return resolve(s, 'C04', ctx);
      if (s.stack.length) return ret(s);
      return resolve(s, 'S01Q', ctx);
  }
  const node = BY_ID[target];
  if (!node) throw new Error(`Unknown target ${target}`);
  const c = { node: target, src: ctx.src, grp: ctx.grp, via: node.scope === 'inherit' ? ctx.via : null };
  // Shared network groups: common questions once, endpoint check per source.
  if (target === 'N01' && answered(s, `N07@${c.grp}`)) c.node = 'N06';
  if (target === 'N07' && answered(s, `N07@${c.grp}`)) { s.cur = c; return ret(s); }
  s.cur = c;
  return s;
}

export function preview(s, branchId, input = {}) {
  try { return choose(s, branchId, { ...input, preview: true }); } catch { return null; }
}

// Jump to a previous answer to edit it.
export function goTo(s0, key) {
  const s = clone(s0);
  const a = s.answers[key];
  if (!a) return s;
  s.cur = { ...a.ctx.cur };
  s.stack = clone(a.ctx.stack);
  s.done = false;
  return s;
}

export function back(s) {
  const k = keyOf(s.cur);
  const prev = [...s.history].reverse().find((h) => h.key !== k && s.answers[h.key]);
  return prev ? goTo(s, prev.key) : s;
}

// Resume a parked/queued item; returns here afterward.
export function resume(s0, item) {
  const s = clone(s0);
  if (!s.done) s.stack.push({ ...s.cur });
  s.done = false;
  s.cur = { node: item.target, src: item.src, grp: item.grp, via: null };
  return s;
}

// ── Derived state ──────────────────────────────────────────────
export function facts(s) {
  const F = {};
  for (const a of sorted(s)) {
    const br = branchOf(a);
    for (const [k, state] of Object.entries(br?.f || {})) {
      (F[a.ent] ||= {})[k] = { state, stale: a.stale, node: a.node, seq: a.seq };
    }
  }
  return F;
}

const stateOf = (x) => (!x ? 'not_asked' : x.stale ? 'unknown' : x.state);

export function assess(s, srcId, F = facts(s)) {
  const f = F[srcId] || {};
  const st = (k) => stateOf(f[k]);
  const src = s.sources.find((x) => x.id === srcId) || {};
  const groups = [src.group, ...(src.extra || [])].filter(Boolean);
  const plans = groups.map((g) => stateOf(F[g]?.gplan));

  let network = st('network');
  if (network !== 'not_applicable' && network !== 'not_asked') {
    if (plans.includes('denied')) network = 'denied';
    else if (OK.includes(network) && !(plans.length && plans.every((p) => OK.includes(p)))) network = 'pending_prerequisite';
  }
  const dims = { owner: st('owner'), auth: st('auth'), method: st('method'), coverage: st('coverage'), network, account: st('account') };
  for (const k of ['vendor', 'cost', 'fresh', 'path']) if (f[k]) dims[k] = st(k);

  let state;
  if (dims.auth === 'not_asked' || dims.method === 'not_asked') state = 'unassessed';
  else if (BLOCKING.some((k) => dims[k] === 'denied')) state = 'none';
  else {
    const core = ['owner', 'auth', 'method', 'coverage'].every((k) => OK.includes(dims[k]));
    const net = network === 'not_asked' || OK.includes(network);
    const acct = !['unknown', 'disputed', 'denied'].includes(dims.account);
    const cond = ['vendor', 'cost', 'fresh'].every((k) => !dims[k] || OK.includes(dims[k]));
    state = core && net && acct && cond ? 'clear' : 'candidate';
  }
  if (state === 'unassessed' && answered(s, `D09@${srcId}`)) state = 'candidate';
  const gaps = Object.entries(dims).filter(([k, v]) => !OK.includes(v) && !(k === 'account' && v === 'pending_prerequisite') && !(k === 'network' && v === 'not_asked')).map(([k]) => k);
  return { state, label: ASSESS[state], dims, gaps };
}

export function parked(s) {
  const out = [];
  for (const a of sorted(s)) {
    const br = branchOf(a);
    const node = BY_ID[a.node];
    const ctx = a.ctx.cur;
    if (node.scope === 'inherit') {
      const caller = s.answers[`${a.via}@${a.ent}`];
      if (caller && caller.seq > a.seq && !branchOf(caller).uni && !branchOf(caller).park) continue;
      if (br.park) out.push({ id: a.key, target: a.via, src: ctx.src, grp: ctx.grp, ent: a.ent, why: br.label, stale: a.stale });
    } else if (br.park) {
      out.push({ id: a.key, target: a.node, src: ctx.src, grp: ctx.grp, ent: a.ent, why: br.label, stale: a.stale });
    }
    if (br.queue) {
      const later = s.answers[`${br.queue}@${a.ent}`];
      if (!(later && later.seq > a.seq)) out.push({ id: a.key + '>' + br.queue, target: br.queue, src: ctx.src, grp: ctx.grp, ent: a.ent, why: 'Queued: ' + br.label, stale: a.stale });
    }
  }
  return out;
}

export function actions(s) {
  const map = new Map();
  for (const a of sorted(s)) {
    const node = BY_ID[a.node];
    for (const [title, role, c] of branchOf(a)?.a || []) {
      const key = `${title}|${a.ent}`;
      map.set(key, {
        key, title, role, aud: c ? 'customer' : 'internal', ent: a.ent, node: a.node,
        basis: node.basis, refs: node.refs, stale: a.stale,
        status: 'suggested', assignee: '', due: '', agreed: false, ...s.actionStatus[key],
      });
    }
  }
  return [...map.values()];
}

export function setAction(s0, key, patch) {
  const s = clone(s0);
  s.actionStatus[key] = { ...s.actionStatus[key], ...patch };
  return s;
}

export function gate(s) {
  const F = facts(s);
  const crit = s.sources.filter((x) => x.critical && !x.parent);
  const reasons = [];
  if (!crit.length) reasons.push('No critical sources marked.');
  for (const x of crit) {
    const a = assess(s, x.id, F);
    if (a.state !== 'clear') reasons.push(`${x.name}: ${a.label.toLowerCase()}.`);
  }
  if (!answered(s, 'R04@m')) reasons.push('TTAR not yet completed.');
  const ok = !reasons.length;
  return {
    ok, reasons,
    text: ok ? 'Documented gate conditions appear satisfied — responsible SE/Deal Desk confirmation required' : 'Gate remains unresolved',
    exception: s.exception ? `Exception reference “${s.exception}” recorded — requires validation; not a resolved access path.` : '',
  };
}

export function proposedStatus(s) {
  const F = facts(s);
  const crit = s.sources.filter((x) => x.critical && !x.parent).map((x) => assess(s, x.id, F).state);
  const open = parked(s).length + actions(s).filter((a) => !a.stale && !['resolved', 'cancelled'].includes(a.status)).length;
  let status, why;
  if (crit.length && crit.every((x) => x === 'clear') && !parked(s).length) {
    status = STATUSES[0]; why = 'Every critical source has an evidenced access path and nothing is parked. Provisioning may still be outstanding.';
  } else if (crit.some((x) => x === 'none' || x === 'unassessed') && !open) {
    status = STATUSES[2];
    why = crit.includes('none') ? 'A critical source has no established path and no follow-ups are recorded.' : 'Critical sources not yet assessed.';
  } else {
    status = STATUSES[1]; why = `${open} open item(s). Follow-ups do not grant contract permission.`;
  }
  return { status, why };
}

export function completeness(s) {
  const touched = new Set(sorted(s).map((a) => BY_ID[a.node].phase));
  return PHASES.map(([id, label]) => ({ id, label, done: touched.has(id) }));
}

// ── Graph validation ───────────────────────────────────────────
export const REQUIRED_IDS = [
  'P01', 'P02', 'P03', 'P04', 'M01', 'M02', 'M03', 'I01', 'I02', 'I03', 'I04',
  'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'O01', 'O02', 'O03', 'O04',
  'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'A01', 'A02', 'A03', 'A04',
  'F01', 'F02', 'F03', 'L01', 'L02', 'L03', 'V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08',
  'X01', 'C01', 'C02', 'C03', 'C04', 'C05', 'S01Q', 'S02Q', 'S03Q', 'G01', 'G02', 'H01', 'H02',
  'R01', 'R02', 'R03', 'R04', 'U01', 'U02', 'U03', 'U04', 'U05',
];

export function validateGraph(nodes = NODES) {
  const errors = [];
  const ids = new Set();
  for (const n of nodes) {
    if (ids.has(n.id)) errors.push(`Duplicate id ${n.id}`);
    ids.add(n.id);
  }
  const valid = (t) => TOKENS.includes(t) || ids.has(t);
  const expand = { NEXT_SOURCE: ['I02', 'X01'], END_SOURCE: ['I02', 'X01'], OVERLAY: ['V04', 'V05', 'V06', 'V07', 'V08', 'V02'], FLORIDA: ['C04', 'S01Q'] };
  const edges = {};
  for (const n of nodes) {
    if (!n.ask || !n.whom || !n.why || !n.plain || !n.basis) errors.push(`${n.id} missing content`);
    if (!n.b?.length) errors.push(`${n.id} has no branches`);
    if (n.cont && !valid(n.cont)) errors.push(`${n.id} cont → ${n.cont}`);
    const out = new Set(UNIVERSAL.map((u) => u.id));
    for (const b of n.b) {
      if (!b.m) errors.push(`${n.id}.${b.id} has no meaning`);
      for (const t of [b.next, b.call, b.ret, b.queue].filter(Boolean)) {
        if (!valid(t)) errors.push(`${n.id}.${b.id} → ${t}`);
        (expand[t] || [t]).forEach((x) => out.add(x));
      }
      if (!b.next && !b.call) errors.push(`${n.id}.${b.id} has no transition`);
      if (b.call && !b.ret) errors.push(`${n.id}.${b.id} call without return`);
    }
    if (n.cont) (expand[n.cont] || [n.cont]).forEach((x) => out.add(x));
    edges[n.id] = out;
  }
  for (const id of REQUIRED_IDS) if (!ids.has(id)) errors.push(`Missing node ${id}`);
  const seen = new Set(['P01']);
  const q = ['P01'];
  while (q.length) for (const t of edges[q.shift()] || []) if (ids.has(t) && !seen.has(t)) { seen.add(t); q.push(t); }
  for (const id of ids) if (!seen.has(id)) errors.push(`Unreachable ${id}`);
  return errors;
}

export function importSession(json) {
  const s = JSON.parse(json);
  if (s.v !== 1 || !s.answers || !s.cur) throw new Error('Not a TTAR session file.');
  return s;
}
