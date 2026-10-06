// Engine tests. Run by opening tests/index.html (served over http).
import * as E from '../src/engine.js';
import { customerRecap, escalation } from '../src/exports.js';

export const results = [];
const test = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, msg: e.message }); } };
const ok = (c, m = 'assertion failed') => { if (!c) throw new Error(m); };
const eq = (a, b, m = '') => ok(JSON.stringify(a) === JSON.stringify(b), `${m} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

const EV = { ev: { speaker: 'Test Person', role: 'DBA' } };
function play(s, steps) {
  for (const [node, branch, input = {}] of steps) {
    if (s.cur.node !== node) throw new Error(`expected ${node} before "${branch}", at ${s.cur.node}${s.cur.via ? '←' + s.cur.via : ''} (src ${s.cur.src})`);
    s = E.choose(s, branch, input);
  }
  return s;
}
const src = (id, kind, vendor = '', critical = true) => ({ id, kind, name: id.toUpperCase(), vendor, critical, parent: null });
const session = (...sources) => E.createSession({ sources });
const fact = (s, ent, k) => E.facts(s)[ent]?.[k]?.state;

const OPEN = [['P01', 'late'], ['P02', 'yes'], ['P03', 'all'], ['P04', 'known'], ['M01', 'owners'], ['M02', 'yes'], ['M03', 'ok'], ['I01', 'ok']];
const NET = [['N01', 'exp'], ['N02', 'ipsec'], ['N03', 'ok'], ['N06', 'same', EV], ['N07', 'agreed']];
const DB = [['O01', 'agency'], ['O02', 'yes', EV], ['O03', 'db'], ['O04', 'prod'], ['D01', 'ok', EV], ['D02', 'known'], ['D05', 'dba'], ['D06', 'ok', EV], ['D07', 'same'], ['D08', 'known'], ['D09', 'ok']];
const onprem = (group, net = NET) => [['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group }], ...net, ...DB];
const cloudApi = [['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV], ['O03', 'alt'], ['O04', 'api'], ['A01', 'yes', EV], ['A02', 'conf', EV], ['A03', 'clear'], ['A04', 'ok'], ['D09', 'ok']];
const TAIL = [['X01', 'none'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new'], ['S01Q', 'saml'], ['S02Q', 'clear'], ['G01', 'no'], ['H01', 'no'], ['R01', 'ok'], ['R03', 'ok'], ['R04', 'done']];

// ── Graph ──────────────────────────────────────────────────────
test('graph: all catalog IDs, valid transitions, reachable', () => eq(E.validateGraph(), []));

// ── Worked examples ────────────────────────────────────────────
test('Ex1 on-prem SQL, prod supported → no unresolved issue, not "complete"', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ...onprem('new:City'), ...TAIL]);
  ok(s.done, 'meeting finished');
  eq(E.assess(s, 'cad').state, 'clear');
  eq(E.assess(s, 'cad').dims.account, 'pending_prerequisite', 'provisioning still pending');
  ok(E.gate(s).ok, 'gate conditions appear satisfied');
  ok(!/approved/i.test(E.gate(s).text), 'never says approved');
});

test('Ex2 county 911 runs CAD → actual owner required, gate unresolved', () => {
  let s = session(src('cad', 'CAD'), src('rms', 'RMS'));
  s = play(s, [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group: 'new:County' }],
    ['N01', 'else'], ['U02', 'named'], ['N02', 'ipsec'], ['N03', 'ok'], ['N06', 'vpn'], ['N07', 'pend'],
    ['O01', 'outside'], ['O02', 'none'], ['O03', 'never'], ['O04', 'prod'], ['D01', 'ok', EV], ['D02', 'known'], ['D05', 'dba'],
    ['D06', 'ok', EV], ['D07', 'same'], ['D08', 'known'], ['D09', 'wait'], ...cloudApi.slice(0, -1), ['D09', 'ok']]);
  eq(s.cur.node, 'X01');
  eq(fact(s, 'cad', 'auth'), 'unknown');
  eq(fact(s, 'cad', 'network'), 'unknown', 'no inherited county route');
  eq(E.assess(s, 'cad').state, 'candidate');
  ok(E.actions(s).some((a) => a.title === 'Introduce missing owner'), 'U02 introduction action');
  ok(E.parked(s).some((p) => p.target === 'O02'), 'O02 parked');
  s = play(s, [...TAIL.slice(0, 8), ['R01', 'unres'], ['R02', 'yes'], ['R03', 'ok'], ['R04', 'follow']]);
  ok(!E.gate(s).ok, 'gate unresolved despite enthusiasm');
});

test('Ex3 replica exists but no narratives → never green', () => {
  let s = play(session(src('rms', 'RMS')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV],
    ['O03', 'alt'], ['O04', 'rep'], ['D03', 'yes', EV], ['D04', 'part'], ['D06', 'narr'], ['D07', 'same'], ['D08', 'known'], ['D09', 'ok']]);
  eq(E.assess(s, 'rms').state, 'candidate');
  eq(fact(s, 'rms', 'coverage'), 'unknown');
});

test('Ex4 Spillman module licensed, no SQL infrastructure → resourcing dependency', () => {
  let s = play(session(src('cad', 'CAD', 'Spillman Flex')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'],
    ['O02', 'yes', EV], ['O03', 'never'], ['O04', 'none'], ['V01', 'prod'], ['V04', 'spnocap'], ['V02', 'est'], ['V03', 'none'], ['D09', 'wait']]);
  eq(E.assess(s, 'cad').state, 'candidate');
  eq(fact(s, 'cad', 'cost'), 'reported', 'estimate is not a quote');
  ok(E.actions(s).some((a) => a.title === 'Plan customer SQL infrastructure'));
});

test('Ex5 cloud API search-only → no full-ingestion path', () => {
  let s = play(session(src('rms', 'RMS')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV],
    ['O03', 'never'], ['O04', 'api'], ['A01', 'yes', EV], ['A02', 'search'], ['A03', 'clear'], ['A04', 'ok'], ['D09', 'ok']]);
  eq(E.assess(s, 'rms').state, 'none');
});

test('Ex6 Southern Software fixture → unresolved facts stay unresolved', () => {
  let s = play(session(src('rms', 'RMS', 'Southern Software RMS')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group: 'new:SO' }],
    ['N01', 'exp'], ['N02', 'help'], ['N05', 'pref'], ['N06', 'unk'], ['N07', 'pend'],
    ['O01', 'agency'], ['O02', 'tent'], ['O03', 'vague'], ['O04', 'none'], ['V01', 'prod'], ['V07', 'middle'],
    ['F02', 'vendor'], ['V01', 'build'], ['V02', 'est'], ['V03', 'future'], ['F03', 'nodel'], ['D09', 'wait'],
    ['X01', 'none'], ['C01', 'defined'], ['C02', 'clear'], ['C03', 'reuse']]);
  eq(E.assess(s, 'rms').state, 'candidate');
  eq(fact(s, 'rms', 'cost'), 'reported');
  eq(fact(s, 'rms', 'vendor'), 'pending_prerequisite', 'Nucleus ≠ present access');
  eq(fact(s, 'm', 'staff'), 'unknown', 'past prints not auto-accepted');
  ok(E.actions(s).some((a) => /acceptance of existing artifacts/.test(a.title)));
});

test('Ex7 Florida training vs cloud plan stay distinct', () => {
  let s = play(session(), [...OPEN, ['X01', 'none'], ['C01', 'fl'], ['C02', 'clear'], ['C03', 'new'], ['C04', 'sent'], ['C05', 'mou']]);
  eq(s.cur.node, 'S01Q');
  eq(fact(s, 'm', 'flcloud'), 'pending_prerequisite');
  eq(fact(s, 'm', 'staff'), 'pending_prerequisite');
});

test('Ex8 migration → new source alongside legacy, returns to compliance', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ...onprem('new:City'), ['X01', 'mig', { src: 'cad' }], ['L02', 'both'], ['L03', 'ok']]);
  eq(s.cur.node, 'C01');
  const n = s.sources.find((x) => x.id === 'cad-n');
  ok(n && !n.parent, 'replacement is its own top-level source');
  eq(E.assess(s, 'cad-n').state, 'unassessed');
  ok(!E.gate(s).ok);
});

test('Ex9 “AD” → SAML vs LDAP, no network dependency for cloud SAML', () => {
  let s = play(session(), [...OPEN, ['X01', 'none'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new'], ['S01Q', 'adsaml']]);
  eq(s.cur.node, 'S02Q');
  eq(s.groups.length, 0);
  let t = play(session(), [...OPEN, ['X01', 'none'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new'], ['S01Q', 'adldap']]);
  eq(t.cur.node, 'S03Q');
});

test('Ex10 wrong person in room → U02, no owner approval', () => {
  let s = play(session(src('cad', 'CAD')), [['P01', 'early'], ['P02', 'yes'], ['P03', 'champ'], ['P04', 'known'], ['M01', 'absent'], ['U02', 'named']]);
  eq(s.cur.node, 'M02');
  eq(s.maturity, 'exploratory');
  ok(E.parked(s).some((p) => p.target === 'M01'));
  ok(E.actions(s).some((a) => a.title === 'Plan a later validation TTAR'));
});

test('Ex11 answer changed after meeting → stale, recomputed, no lingering green', () => {
  let s = play(session(src('cad', 'CAD'), src('rms', 'RMS')), [...OPEN, ...onprem('new:City'), ...cloudApi, ...TAIL]);
  eq(E.assess(s, 'cad').state, 'clear');
  ok(E.gate(s).ok);
  s = E.goTo(s, 'O02@cad');
  s = E.choose(s, 'tent');
  ok(s.answers['D09@cad'].stale && s.answers['D06@cad'].stale, 'later CAD answers stale');
  ok(!s.answers['D09@rms'].stale, 'RMS untouched');
  eq(E.assess(s, 'cad').state, 'candidate');
  eq(E.assess(s, 'rms').state, 'clear');
  ok(!E.gate(s).ok, 'gate recomputed');
  ok(s.history.length > Object.keys(s.answers).length, 'history preserved');
});

test('Ex12 one source blocked, others actionable', () => {
  let s = play(session(src('cad', 'CAD'), src('rms', 'RMS')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'],
    ['O02', 'deny'], ['U03', 'all'], ['O03', 'never'], ['O04', 'prod'], ['D01', 'deny'], ['V01', 'deny'], ['V02', 'unk'], ['V03', 'refuse'],
    ['D05', 'dba'], ['D06', 'ok', EV], ['D07', 'same'], ['D08', 'known'], ['D09', 'none'], ...cloudApi,
    ['X01', 'none'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new'], ['S01Q', 'saml'], ['S02Q', 'clear'], ['G01', 'yes'], ['G02', 'files']]);
  eq(E.assess(s, 'cad').state, 'none');
  eq(E.assess(s, 'rms').state, 'clear');
  ok(!E.gate(s).ok);
  ok(E.actions(s).some((a) => a.title === 'Send GIS layer files'));
  eq(E.proposedStatus(s).status, 'Follow-ups needed');
});

// ── Mechanics ──────────────────────────────────────────────────
test('shared network: second source skips common questions, still checks endpoint', () => {
  let s = play(session(src('cad', 'CAD'), src('rms', 'RMS')), [...OPEN, ...onprem('new:City'), ['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group: 'g1' }]]);
  eq(s.cur.node, 'N06');
  s = E.choose(s, 'same', EV);
  eq(s.cur.node, 'O01', 'N07 already done for group → back to source');
  eq(s.groups.length, 1);
});

test('second network group is independent', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group: 'new:City' }],
    ['N01', 'exp'], ['N02', 'ipsec'], ['N03', 'ok'], ['N06', 'other', { group: 'new:County 911' }]]);
  eq(s.cur.node, 'N01');
  eq(s.cur.grp, 'g2');
  s = play(s, NET);
  eq(s.cur.node, 'N07');
  eq(s.cur.grp, 'g1', 'returns to original group checkpoint');
});

test('choosing IPSec sets no DB authorization or reachability', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'onprem', { group: 'new:City' }], ['N01', 'exp'], ['N02', 'ipsec'], ['N03', 'ok']]);
  eq(fact(s, 'cad', 'auth'), undefined);
  eq(fact(s, 'cad', 'network'), 'unknown');
});

test('confirmation requires evidence', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency']]);
  let threw = false;
  try { E.choose(s, 'yes'); } catch { threw = true; }
  ok(threw, 'O02 yes without evidence must throw');
});

test('universal unknown → parks, continues, resume resolves', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', '@U01'], ['U01', 'check']]);
  eq(s.cur.node, 'O03');
  eq(fact(s, 'cad', 'auth'), 'unknown');
  const p = E.parked(s).find((x) => x.target === 'O02');
  ok(p, 'parked');
  s = E.resume(s, p);
  eq(s.cur.node, 'O02');
  s = E.choose(s, 'yes', EV);
  ok(!E.parked(s).some((x) => x.target === 'O02'), 'resolved');
  eq(fact(s, 'cad', 'auth'), 'owner_confirmed');
});

test('conflicting answers → disputed', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', '@U04'], ['U04', 'owner']]);
  eq(fact(s, 'cad', 'auth'), 'disputed');
  eq(E.assess(s, 'cad').state === 'clear', false);
});

test('caller returns: M03 → compliance → I01; A04/G02 → network → caller', () => {
  let s = play(session(src('cad', 'CAD')), [['P01', 'late'], ['P02', 'yes'], ['P03', 'all'], ['P04', 'known'], ['M01', 'owners'], ['M02', 'yes'],
    ['M03', 'sec'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new']]);
  eq(s.cur.node, 'I01');
  s = play(s, [['I01', 'ok'], ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV], ['O03', 'alt'], ['O04', 'api'],
    ['A01', 'yes', EV], ['A02', 'bulk'], ['A03', 'clear'], ['A04', 'priv', { group: 'new:Vendor VPN' }], ...NET]);
  eq(s.cur.node, 'D09');
  s = play(s, [['D09', 'ok'], ['X01', 'none'], ['C01', 'none'], ['C02', 'clear'], ['C03', 'new'], ['S01Q', 'saml'], ['S02Q', 'clear'],
    ['G01', 'yes'], ['G02', 'priv', { group: 'new:GIS' }], ...NET]);
  eq(s.cur.node, 'H01');
});

test('linked media endpoint returns to parent D08', () => {
  let s = play(session(src('rms', 'RMS')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV], ['O03', 'db'],
    ['O04', 'prod'], ['D01', 'ok', EV], ['D02', 'known'], ['D05', 'dba'], ['D06', 'ok', EV], ['D07', 'sep']]);
  eq(s.cur.node, 'O01');
  eq(s.cur.src, 'rms-m');
  s = play(s, [['O01', 'agency'], ['O02', 'yes', EV], ['O03', 'alt'], ['O04', 'file'], ['F01', 'recur'], ['F02', 'ok'], ['F03', 'clear'], ['D09', 'ok']]);
  eq(s.cur.node, 'D08');
  eq(s.cur.src, 'rms');
});

test('vendor overlay runs once per source', () => {
  let s = play(session(src('cad', 'CAD', 'Mark43')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'yes', EV],
    ['O03', 'never'], ['O04', 'none'], ['V01', 'prod'], ['V06', 'not'], ['V02', 'unk'], ['V03', 'none']]);
  eq(s.cur.node, 'D09');
  s = E.goTo(s, 'V01@cad');
  s = E.choose(s, 'prod');
  eq(s.cur.node, 'V02', 'overlay not repeated');
});

test('action dedupe by title + entity', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'test'], ['I03', 'clear']]);
  s = E.goTo(s, 'I02@cad');
  s = E.choose(s, 'test');
  eq(E.actions(s).filter((a) => a.title === 'Identify route to operational data').length, 1);
});

test('exact SFDC statuses and exception is not a resolved path', () => {
  eq(E.STATUSES, ['Completed', 'Follow-ups needed', 'Unclear data access; no follow-ups']);
  let s = session();
  s.cur = { node: 'R02', src: null, grp: null, via: null };
  s = E.choose(s, 'exc', { exception: 'VP email 2026-10-01' });
  ok(!E.gate(s).ok && /requires validation/.test(E.gate(s).exception));
});

test('customer recap excludes internal escalation details', () => {
  let s = play(session(src('cad', 'CAD')), [...OPEN, ['I02', 'prod'], ['I03', 'clear'], ['I04', 'cloud'], ['O01', 'agency'], ['O02', 'none'], ['O03', 'never'],
    ['O04', 'prod'], ['D01', 'ok', EV], ['D02', 'known'], ['D05', 'dba'], ['D06', 'ok', EV], ['D07', 'same'], ['D08', 'known'], ['D09', 'none'],
    ...TAIL.slice(0, 8), ['R01', 'unres'], ['R02', 'yes']]);
  const r = customerRecap(s);
  ok(!/deal desk|chandler|rsm|commission/i.test(r), 'no internal terms');
  ok(/Chandler/.test(escalation(s)), 'escalation draft is internal');
});

test('early TTAR stays exploratory', () => {
  let s = play(session(src('cad', 'CAD')), [['P01', 'early']]);
  eq(s.maturity, 'exploratory');
});
