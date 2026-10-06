// Text exports. Internal and customer audiences are kept strictly separate.
import { BY_ID } from './data/nodes.js';
import { SOURCES } from './data/sources.js';
import { FACT_LABELS, STATE_LABELS } from './data/glossary.js';
import { assess, actions, parked, gate, proposedStatus, facts, sourceName, branchOf } from './engine.js';

const list = (xs, f = (x) => x) => (xs.length ? xs.map((x) => `- ${f(x)}`).join('\n') : '- None');

export function handoff(s) {
  const F = facts(s);
  const g = gate(s);
  const p = proposedStatus(s);
  const acts = actions(s).filter((a) => !a.stale);
  const src = s.sources.map((x) => {
    const a = assess(s, x.id, F);
    const dims = Object.entries(a.dims).map(([k, v]) => `${FACT_LABELS[k] || k}: ${STATE_LABELS[v]}`).join(' · ');
    const notes = Object.values(s.answers).filter((ans) => ans.ent === x.id && ans.note).map((ans) => `${ans.node}: ${ans.note}`);
    const ev = Object.values(s.answers).filter((ans) => ans.ent === x.id && ans.ev).map((ans) => `${ans.node}: ${ans.ev.speaker} (${ans.ev.role}) via ${ans.ev.channel || '—'} — ${ans.ev.scope || branchOf(ans).label}`);
    return `### ${x.name} — ${x.kind}${x.critical ? ' · critical' : ''}${x.parent ? ' · linked endpoint' : ''}
${x.vendor || 'Product not recorded'}
**${a.label}**
${dims}
${ev.length ? '\nConfirmations\n' + list(ev) : ''}${notes.length ? '\nNotes\n' + list(notes) : ''}`;
  }).join('\n\n');

  return `# TTAR handoff — ${s.agency || 'Agency'}
${s.date} · ${s.jurisdiction || 'Jurisdiction n/a'} · ${s.maturity.replace('_', '-')}

## Gate
${g.text}
${list(g.reasons)}
${g.exception}

## Proposed SFDC status (SE review required)
${p.status} — ${p.why}
${s.crm ? `SE-recorded: ${s.crm} (not synced)` : ''}

## Contacts
${list(s.contacts, (c) => `${c.name} — ${c.role}${c.manages ? ` · ${c.manages}` : ''}`)}

## Sources
${src || 'None'}

## Network groups
${list(s.groups, (x) => `${x.name}: ${STATE_LABELS[F[x.id]?.gplan?.state || 'not_asked']}`)}

## Open items
${list(parked(s), (x) => `${x.target} · ${sourceName(s, x.ent)} — ${x.why}`)}

## Actions
${list(acts, (a) => `[${a.status}] ${a.title} — ${a.assignee || a.role}${a.due ? ` · ${a.due}${a.agreed ? '' : ' (proposed)'}` : ''} · ${sourceName(s, a.ent)}`)}

## References
${list([...new Set(acts.flatMap((a) => a.refs))].sort(), (r) => `${r} ${SOURCES[r].title} — ${SOURCES[r].url}`)}
`;
}

export function customerRecap(s) {
  const F = facts(s);
  const scoped = s.sources.filter((x) => !x.parent).map((x) => {
    const a = assess(s, x.id, F).state;
    return `${x.name} (${a === 'clear' ? 'access path identified, provisioning to follow' : 'access path still being confirmed'})`;
  });
  const cust = actions(s).filter((a) => !a.stale && a.aud === 'customer');
  const ours = actions(s).filter((a) => !a.stale && a.aud === 'internal' && /networking|engineering|solutions|security|ds\b|^ds/i.test(a.role) && !/deal desk|chandler|rsm|commission/i.test(a.title));
  const open = parked(s).map((x) => BY_ID[x.target]?.ask).filter(Boolean).slice(0, 5);
  return `Thank you for the technical review.

My understanding is: ${scoped.join('; ') || '[scoped sources]'}.

Before we can finalize the access plan, we need:
${list(open, (q) => q.replace(/^(.{140}).+$/, '$1…'))}

Your team will:
${list(cust, (a) => `${a.title} (${a.assignee || a.role})`)}

Peregrine will:
${list(ours, (a) => a.title)}

We will follow up [agreed timing]. Please correct any misunderstanding, especially around authorization, coverage, or hosting.`;
}

export function questionsByContact(s) {
  const by = {};
  for (const x of parked(s)) {
    const n = BY_ID[x.target];
    (by[n.whom] ||= []).push(`${sourceName(s, x.ent)}: “${n.ask}”`);
  }
  for (const a of actions(s).filter((a) => !a.stale && a.aud === 'customer' && a.status !== 'resolved')) {
    (by[a.assignee || a.role] ||= []).push(`${sourceName(s, a.ent)}: ${a.title}`);
  }
  return Object.entries(by).map(([who, qs]) => `## ${who}\n${list(qs)}`).join('\n\n') || 'No open questions.';
}

export function escalation(s) {
  const g = gate(s);
  return `Unresolved data access — ${s.agency || 'Agency'}

Flagging per TTAR policy (S01) for Deal Desk / RSM / Matt Chandler.

${list(g.reasons)}

Open items:
${list(parked(s), (x) => `${sourceName(s, x.ent)} — ${BY_ID[x.target].id}: ${x.why}`)}

No scope/pricing contract should be sent or countersigned until access is resolved or an explicit written leadership exception exists.`;
}

export function vendorInquiry(s) {
  const vs = s.sources.filter((x) => x.vendor && !x.parent);
  return vs.map((x) => `To: ${x.vendor} (via ${s.agency || 'agency'})
Re: third-party read-only data access — ${x.name}

1. Exact product and current version in use:
2. Supported read-only method (database, replica, API, export) on this version:
3. Coverage: history, narratives, attachments, update/deletion signals:
4. Written quote — one-time vs recurring, and who is invoiced:
5. Prerequisites, lead time, and contact:`).join('\n\n---\n\n') || 'No vendors recorded.';
}

export function networkingConsult(s) {
  const F = facts(s);
  return `Networking consult — ${s.agency || 'Agency'}

${s.groups.map((g) => {
    const members = s.sources.filter((x) => x.group === g.id || x.extra?.includes(g.id)).map((x) => x.name);
    const notes = Object.values(s.answers).filter((a) => a.ent === g.id && a.note).map((a) => `${a.node}: ${a.note}`);
    return `## ${g.name}
Plan: ${STATE_LABELS[F[g.id]?.gplan?.state || 'not_asked']}
Endpoints: ${members.join(', ') || '—'}
${list(notes)}`;
  }).join('\n\n') || 'No network groups.'}

Questions for Networking:
- Supported design for the constraints above?
- Endpoint routes across any county / 911 boundaries?`;
}

export function json(s) {
  return JSON.stringify({ _warning: 'Contains agency notes. Do not store secrets or CJI. Share only via approved storage.', ...s }, null, 2);
}

export const EXPORTS = [
  ['Internal handoff', handoff],
  ['Customer recap', customerRecap],
  ['Questions by contact', questionsByContact],
  ['Escalation draft', escalation],
  ['Vendor inquiry', vendorInquiry],
  ['Networking consult', networkingConsult],
];
