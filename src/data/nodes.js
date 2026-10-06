// TTAR question catalog. Pure data — the engine interprets it.
//
// Node:   { id, phase, scope: meeting|source|group|inherit, aud, ask, whom, why, plain,
//           basis, refs, fact, cont, b: Branch[] }
// Branch: { id, label, m: meaning, s: say, a: [[title, role, 'c'?]], g: gate impact,
//           f: {factKey: state}, next | call+ret, drop, rc, confirm, park, queue,
//           group: 'pick', pick: 'source', spawn, meta, input }
// Targets: node id | RETURN | NEXT_SOURCE | END_SOURCE | OVERLAY | END

const POL = 'documented_policy', GUI = 'documented_guidance', PRO = 'proposed_discovery_followup', HIS = 'historical_precedent';
const UNK = 'unknown', DIS = 'disputed', REP = 'reported', OK = 'owner_confirmed', PEND = 'pending_prerequisite', DEN = 'denied', NA = 'not_applicable';

const n = (id, phase, scope, o) => ({ id, phase, scope, aud: 'customer', basis: PRO, refs: [], ...o });
const b = (id, label, o = {}) => ({ id, label, ...o });

export const NODES = [
  // ── A. Preparation ───────────────────────────────────────────
  n('P01', 'prepare', 'meeting', {
    aud: 'internal', whom: 'AE', basis: GUI, refs: ['S01', 'S04'], fact: 'maturity', cont: 'P02',
    ask: 'Is this exploratory discovery or late-stage validation, and what are the proposed scope, customer outcomes, and expected timing?',
    why: 'Discovery is not final feasibility validation.',
    plain: 'Know whether you are exploring or confirming.',
    b: [
      b('late', 'Late-stage, defined scope', { m: 'Validation meeting. Record scope version and critical sources.', meta: { maturity: 'late_stage' }, f: { maturity: REP }, next: 'P02' }),
      b('early', 'Early or fuzzy', { m: 'Exploratory. This will not be the final TTAR.', meta: { maturity: 'exploratory' }, f: { maturity: REP }, a: [['Plan a later validation TTAR', 'AE']], next: 'P02' }),
      b('none', 'AE context missing', { m: 'Preparation gap. Do not invent scope.', park: true, a: [['Send deal context and current source list', 'AE']], next: 'P02' }),
    ],
  }),
  n('P02', 'prepare', 'meeting', {
    aud: 'internal', whom: 'Internal', basis: GUI, refs: ['S02', 'S05'], cont: 'P03',
    ask: 'Do we have the agency’s TTAR page, prepopulated data sources, IT contacts, and prior technical notes?',
    why: 'Start from what is already known.',
    plain: 'Check the existing record before the call.',
    b: [
      b('yes', 'Yes, complete', { m: 'Link and review it.', next: 'P03' }),
      b('missing', 'Missing or incomplete', { m: 'AE owns creating or completing it.', a: [['Create or complete the TTAR page', 'AE']], next: 'P03' }),
      b('old', 'An older TTAR exists', { m: 'Revalidate changed or unconfirmed items. No blind carryover.', a: [['Mark changed scope since the prior TTAR', 'DS/SE']], next: 'P03' }),
    ],
  }),
  n('P03', 'prepare', 'meeting', {
    aud: 'internal', whom: 'AE / champion', basis: GUI, refs: ['S01', 'S04', 'S05'], cont: 'P04',
    ask: 'Who can answer networking, database/application access, vendor management, and compliance questions—and can they attend?',
    why: 'Access is validated by the people who control it.',
    plain: 'Get the real owners in the room.',
    b: [
      b('all', 'All roles covered', { m: 'Record people and responsibilities.', next: 'P04' }),
      b('outside', 'Some systems controlled elsewhere', { m: 'County, 911, consortium, or vendor owners must attend or confirm later.', a: [['Invite outside system owners', 'AE / champion']], next: 'P04' }),
      b('champ', 'Only an operational champion', { m: 'Useful discovery is possible. Validation needs technical owners.', a: [['Identify technical owners for follow-up', 'AE']], next: 'P04' }),
    ],
  }),
  n('P04', 'prepare', 'meeting', {
    aud: 'internal', whom: 'Internal', basis: GUI, refs: ['S05', 'S07', 'S08'], cont: 'M01',
    ask: 'For each exact product/version/hosting model, what do the Master Data Source list, challenging-vendor guidance, access protocols, and prior deployments say?',
    why: 'Know the vendor landscape before the customer does.',
    plain: 'A precedent is a hypothesis, not this customer’s access.',
    b: [
      b('known', 'Known supported pattern', { m: 'Record as a hypothesis to confirm.', next: 'M01' }),
      b('hard', 'Challenging or restricted', { m: 'Queue the vendor overlay and flag commercial risk.', a: [['Flag vendor risk to AE / Deal Desk', 'DS/SE']], next: 'M01' }),
      b('new', 'New or undocumented', { m: 'Plan deeper questions.', a: [['Request vendor documentation', 'DS/SE']], next: 'M01' }),
      b('conflict', 'Conflicting references', { m: 'Get an authoritative review.', a: [['Request authoritative vendor review', 'Solutions']], next: 'M01' }),
    ],
  }),

  // ── Opening ──────────────────────────────────────────────────
  n('M01', 'opening', 'meeting', {
    whom: 'All attendees', basis: GUI, refs: ['S05'], cont: 'M02',
    ask: 'Could each of you introduce yourself and say which systems, networks, or approvals you manage?',
    why: 'Builds the responsibility map.',
    plain: 'Who owns what?',
    b: [
      b('owners', 'Owners are present', { m: 'Fill in the responsibility map.', s: 'Thank you — that helps me direct questions.', next: 'M02' }),
      b('absent', 'Some roles absent', { m: 'Find the missing owners.', call: 'U02', ret: 'M02' }),
      b('none', 'No technical owner present', { m: 'Stay in discovery mode.', s: 'We can still learn a lot today and confirm details with system owners later.', f: { maturity: REP }, a: [['Arrange follow-up with technical owners', 'AE']], next: 'M02' }),
    ],
  }),
  n('M02', 'opening', 'meeting', {
    whom: 'All attendees', basis: GUI, refs: ['S05'], cont: 'M03',
    ask: 'Has everyone seen Peregrine and understood why we’re meeting today?',
    why: 'Context makes technical questions land.',
    plain: 'Make sure nobody is cold.',
    b: [
      b('yes', 'Yes', { m: 'Give a brief objective.', next: 'M03' }),
      b('cold', 'No — coming in cold', { m: 'AE gives context; offer a ~5 minute demo with demo data.', next: 'M03' }),
      b('demo', 'Wants a full demo', { m: 'Offer a separate session so access questions are not displaced.', a: [['Schedule a separate demo', 'AE']], next: 'M03' }),
    ],
  }),
  n('M03', 'opening', 'meeting', {
    whom: 'All attendees', basis: GUI, refs: ['S04', 'S05'], cont: 'I01',
    ask: 'Today I want to validate the proposed technical scope, understand how we could access each source, surface any security or compliance steps, and leave with clear next steps. We do not need to configure the integration on this call. Does that match what you expected, and are there other technical concerns we should cover?',
    why: 'Sets expectations and surfaces objections early.',
    plain: 'Agree on the agenda.',
    b: [
      b('ok', 'Aligned', { m: 'Note concerns for Q&A.', next: 'I01' }),
      b('mis', 'Misaligned', { m: 'AE clarifies scope; keep the technical topics.', next: 'I01' }),
      b('sec', 'Immediate security objection', { m: 'Address it now in compliance, then return.', s: 'Let’s cover that first.', call: 'C01', ret: 'I01' }),
    ],
  }),

  // ── B. Inventory ─────────────────────────────────────────────
  n('I01', 'inventory', 'meeting', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S05'], cont: 'NEXT_SOURCE',
    ask: 'Here is the source list from our AE. Are these the right systems, and are we missing any CAD, RMS, JMS, LPR, GIS, identity, or historical sources?',
    why: 'Every later answer hangs off this list.',
    plain: 'Edit sources in Prepare if anything changes.',
    b: [
      b('ok', 'Correct', { m: 'Sources confirmed.', next: 'NEXT_SOURCE' }),
      b('add', 'Missing sources', { m: 'Add them in Prepare; AE reviews scope.', a: [['Review added sources for scope', 'AE']], next: 'NEXT_SOURCE' }),
      b('extra', 'Some included by mistake', { m: 'Keep the audit trail. AE confirms removal.', a: [['Confirm source removal', 'AE']], next: 'NEXT_SOURCE' }),
    ],
  }),
  n('I02', 'inventory', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S05', 'S07'], fact: 'scope', cont: 'I03',
    ask: 'What is the exact vendor, product, version, and module? Is this current/live data, a legacy archive, or a test/training environment?',
    why: 'Access patterns differ by exact product and hosting.',
    plain: '“Tyler” is a company, not a product.',
    b: [
      b('prod', 'Specific production product', { m: 'Capture details; vendor guidance applies.', f: { scope: REP }, next: 'I03' }),
      b('brand', 'Brand only', { m: 'Product match unconfirmed.', s: 'Which product within that vendor, and which version?', f: { scope: UNK }, park: true, next: 'I03' }),
      b('legacy', 'Legacy archive', { m: 'Static data. Legacy review queued.', f: { scope: REP }, queue: 'L01', next: 'I03' }),
      b('test', 'Test / training only', { m: 'Not equivalent to production.', f: { scope: UNK }, a: [['Identify route to operational data', 'Customer IT', 'c']], next: 'I03' }),
      b('home', 'Homegrown', { m: 'Record technology, schema owner, maintainer. No branded mapping.', f: { scope: REP }, next: 'I03' }),
    ],
  }),
  n('I03', 'inventory', 'source', {
    whom: 'AE / operational owner', basis: GUI, refs: ['S05', 'S13'], fact: 'crit', cont: 'I04',
    ask: 'Which workflows depend on this source? What history, narratives/media, and update frequency are needed for those workflows?',
    why: 'Coverage and freshness are judged against this.',
    plain: 'What does “good enough” mean here?',
    b: [
      b('clear', 'Clear requirements', { m: 'Record required coverage and freshness.', f: { crit: REP }, next: 'I04' }),
      b('unclear', 'Not clear', { m: 'Keep criticality unresolved — never auto-label optional.', f: { crit: UNK }, a: [['Clarify workflow requirements', 'AE / operational owner']], next: 'I04' }),
      b('static', 'Static historical search', { m: 'Static requirement, not a live feed.', f: { crit: REP }, next: 'I04' }),
      b('all', '“All data” / “real time”', { m: 'Get concrete examples and acceptable delay.', s: 'Can you give an example, and how much delay is acceptable?', f: { crit: UNK }, next: 'I04' }),
    ],
  }),
  n('I04', 'inventory', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S05'], fact: 'host', cont: 'O01',
    ask: 'For each source, where does it live: agency on-prem, city/county network, a third party/consortium, vendor cloud, or something else?',
    why: 'Hosting decides who must be involved.',
    plain: 'Location is not ownership, permission, or reachability.',
    b: [
      b('onprem', 'On-prem / private network', { m: 'Needs a network group. Common network questions are asked once per group.', f: { host: REP, network: UNK }, group: 'pick', call: 'N01', ret: 'O01' }),
      b('cloud', 'Public vendor cloud', { m: 'No private network path expected.', f: { host: REP, network: NA }, next: 'O01' }),
      b('third', 'Third party / consortium', { m: 'Do not assume customer IT can authorize.', f: { host: REP, network: UNK }, next: 'O01' }),
      b('hybrid', 'Hybrid', { m: 'Treat each environment separately.', f: { host: REP, network: UNK }, a: [['Add each environment as its own source entry', 'DS/SE']], next: 'O01' }),
    ],
  }),

  // ── C. Network ───────────────────────────────────────────────
  n('N01', 'network', 'group', {
    whom: 'Network owner', basis: GUI, refs: ['S02', 'S05', 'S09'], fact: 'gnet', cont: 'N02',
    ask: 'Who manages the network where this source lives, and have you supported persistent third-party connections before?',
    why: 'Network owner ≠ database owner.',
    plain: 'Asked once for this network group.',
    b: [
      b('exp', 'Owner present, experienced', { m: 'Record owner and existing patterns.', next: 'N02' }),
      b('new', 'Owner present, inexperienced', { m: 'No disqualification — Networking can help.', s: 'Our Networking team can walk through it with you.', next: 'N02' }),
      b('else', 'Network managed elsewhere', { m: 'No authorization assumed.', call: 'U02', ret: 'N02' }),
    ],
  }),
  n('N02', 'network', 'group', {
    whom: 'Network owner', basis: GUI, refs: ['S05', 'S09'], fact: 'gnet', cont: 'N05',
    ask: 'Do you prefer a firewall-level IPSec tunnel or hosting a Peregrine Connect virtual appliance, or do you need help choosing?',
    why: 'Both support persistent pull access.',
    plain: 'Choosing a method is not database approval.',
    b: [
      b('ipsec', 'IPSec tunnel', { m: 'Customer-managed firewall tunnel.', next: 'N03' }),
      b('connect', 'Peregrine Connect', { m: 'Customer-hosted VM appliance.', next: 'N04' }),
      b('help', 'Needs help choosing', { m: 'No universal winner. Compare, then discuss with Networking.', s: 'IPSec lives on your firewall; Connect is a small VM you host. Networking can help you choose.', next: 'N05' }),
      b('other', 'Mandated other method (VPN, Zscaler…)', { m: 'Capture exact product. No generic support promise.', f: { gnet: UNK }, next: 'N05' }),
      b('none', 'No persistent connectivity allowed', { m: 'Files may be an alternative — needs feasibility review.', f: { gnet: DEN }, call: 'U03', ret: 'N07' }),
    ],
  }),
  n('N03', 'network', 'group', {
    whom: 'Firewall owner', basis: GUI, refs: ['S09', 'S11'], fact: 'gnet', cont: 'N06',
    ask: 'Who can configure and maintain your firewall side of the tunnel, and are there any policies or compatibility requirements we should flag?',
    why: 'Someone must own the customer side.',
    plain: 'A configured tunnel is not database permission.',
    b: [
      b('ok', 'Supported, owner named', { m: 'Send the current IPSec questionnaire after the call.', a: [['Send current IPSec questionnaire (S11)', 'DS']], next: 'N06' }),
      b('custom', 'Custom crypto / routing needs', { m: 'Collect the requirement. No invented defaults.', a: [['Networking review of custom requirements', 'Networking']], next: 'N06' }),
      b('none', 'No one can manage the firewall', { m: 'Revisit method with Networking.', park: true, a: [['Networking consultation on method', 'Networking']], next: 'N06' }),
      b('ips', 'Wants Peregrine IPs/config now', { m: 'Config is deployment-specific and comes from provisioning.', s: 'Those come out of provisioning — I’ll make sure you get them as a next step.', next: 'N06' }),
    ],
  }),
  n('N04', 'network', 'group', {
    whom: 'Virtualization / network owner', basis: GUI, refs: ['S09', 'S10'], fact: 'gnet', cont: 'N06',
    ask: 'Can your team host and maintain the availability of a VM appliance, and who can confirm the hypervisor, network configuration, and outbound access?',
    why: 'The customer hosts the appliance.',
    plain: 'Final configuration comes from the active form.',
    b: [
      b('yes', 'Yes, owner identified', { m: 'Send the current Connect questionnaire.', a: [['Send current Connect questionnaire (S10)', 'DS']], next: 'N06' }),
      b('unsure', 'Not sure', { m: 'Virtualization owner confirms.', a: [['Confirm hypervisor and outbound access', 'Customer IT', 'c']], next: 'N06' }),
      b('no', 'No VM capacity / not permitted', { m: 'Revisit method with Networking.', f: { gnet: UNK }, a: [['Networking consultation on method', 'Networking']], next: 'N06' }),
      b('agents', 'Wants security agents on it', { m: 'S09: an admin account can be supplied for tools. Networking confirms.', a: [['Confirm security-agent compatibility', 'Networking']], next: 'N06' }),
    ],
  }),
  n('N05', 'network', 'group', {
    whom: 'Network owner', basis: GUI, refs: ['S05', 'S09'], fact: 'gnet', cont: 'N06',
    ask: 'What requirement makes the standard options difficult, and who should join us to confirm a supported design?',
    why: 'Non-standard needs require a real design review.',
    plain: 'A meeting is not a solution.',
    b: [
      b('req', 'Exact requirement + owner', { m: 'Draft a Networking request.', a: [['Networking design review', 'Networking']], next: 'N06' }),
      b('pref', 'Preference only', { m: 'Send comparison; customer chooses later.', a: [['Send IPSec vs Connect comparison', 'DS', 'c']], next: 'N06' }),
      b('unsup', 'Unsupported or undetermined', { m: 'Network feasibility stays unresolved.', f: { gnet: UNK }, park: true, next: 'N06' }),
    ],
  }),
  n('N06', 'network', 'source', {
    whom: 'Network owner', basis: GUI, refs: ['S02'], fact: 'network', cont: 'N07',
    ask: 'Would that connection actually reach this source’s database/API/file endpoints, including any county or separate 911 network? Who approves that route?',
    why: 'A tunnel to one network may not reach another.',
    plain: 'Checked per endpoint, even on a shared network.',
    b: [
      b('same', 'Same network, owner confirms route', { m: 'Confirmed plan — not a tested connection.', f: { network: OK }, confirm: true, next: 'N07' }),
      b('other', 'Another network', { m: 'Add a network group and discover it.', f: { network: UNK }, group: 'new', call: 'N01', ret: 'N07' }),
      b('vpn', 'Existing city–county VPN', { m: 'No automatic inheritance. County must confirm.', f: { network: UNK }, a: [['County owner confirms third-party route', 'County IT', 'c']], next: 'N07' }),
      b('unk', 'Restricted or route unknown', { m: 'Follow up with owner and Networking.', f: { network: UNK }, park: true, next: 'N07' }),
    ],
  }),
  n('N07', 'network', 'group', {
    whom: 'Network owner', basis: GUI, refs: ['S02', 'S10', 'S11'], fact: 'gplan', cont: 'RETURN',
    ask: 'Can we agree on who will complete the networking intake and how we will resolve any remaining design questions?',
    why: 'Turns intent into an owned plan.',
    plain: 'Planned is not provisioned.',
    b: [
      b('agreed', 'Owner named, plan agreed', { m: 'Planned method recorded.', f: { gplan: OK }, a: [['Complete networking intake', 'Customer IT', 'c']], next: 'RETURN' }),
      b('pend', 'Owner named, review pending', { m: 'Planned, unconfirmed.', f: { gplan: PEND }, next: 'RETURN' }),
      b('none', 'No viable route', { m: 'Unresolved. Look for an authorized alternative.', f: { gplan: DEN }, g: 'Critical sources on this network stay unresolved.', next: 'RETURN' }),
    ],
  }),

  // ── D. Ownership & method ────────────────────────────────────
  n('O01', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S02'], fact: 'owner', cont: 'O02',
    ask: 'Who owns this data, who hosts and administers the system, and who can authorize and provision access for Peregrine?',
    why: 'Ownership, hosting, admin, and authorization are different roles.',
    plain: 'Owning records ≠ permission to connect.',
    b: [
      b('agency', 'Agency controls all roles', { m: 'Capture names.', f: { owner: REP }, next: 'O02' }),
      b('outside', 'County / consortium / vendor controls a role', { m: 'Capture each role separately.', f: { owner: REP }, a: [['Introduce the actual system owner', 'AE / champion']], next: 'O02' }),
      b('own', '“We own the data” — approver unknown', { m: 'Ownership is not provisioning authority.', s: 'Who would actually create the account and approve it?', f: { owner: UNK }, call: 'U01', ret: 'O02' }),
    ],
  }),
  n('O02', 'access', 'source', {
    whom: 'Actual system owner', basis: POL, refs: ['S01', 'S02'], fact: 'auth', cont: 'O03',
    ask: 'Do you understand the requested third-party read-only access, and can you explicitly confirm an authorized access path for this source?',
    why: 'Only the actual owner can confirm access.',
    plain: '“It should be fine” is not a yes.',
    b: [
      b('yes', 'Actual owner confirms', { m: 'Record who, how, and restrictions.', f: { auth: OK, owner: OK }, confirm: true, next: 'O03' }),
      b('tent', '“Should be fine” / someone else says yes', { m: 'Tentative — not confirmed.', f: { auth: REP }, a: [['Get actual owner confirmation', 'AE / champion']], next: 'O03' }),
      b('none', 'Owner not contacted', { m: 'Arrange introduction and confirmation.', f: { auth: UNK }, park: true, a: [['Introduce actual owner for confirmation', 'AE / champion']], next: 'O03' }),
      b('deny', 'Denied', { m: 'Investigate supported alternatives.', f: { auth: DEN }, call: 'U03', ret: 'O03' }),
    ],
  }),
  n('O03', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S03'], cont: 'O04',
    ask: 'Has this exact system integrated with an outside vendor before? How did that vendor get access, and who set it up?',
    why: 'Precedent reveals the realistic path.',
    plain: 'Useful lead, not permission.',
    b: [
      b('db', 'Direct read-only DB', { m: 'Useful precedent.', next: 'O04' }),
      b('alt', 'Replica / API / export', { m: 'Record method and owner.', next: 'O04' }),
      b('never', 'Never', { m: 'Deeper discovery — not failure.', next: 'O04' }),
      b('vague', '“Others use it” — no details', { m: 'Ask what kind of access, fields, freshness.', s: 'What kind of access did they have, and what data did it include?', next: 'O04' }),
    ],
  }),
  n('O04', 'access', 'source', {
    whom: 'Customer IT / owner', basis: GUI, refs: ['S02', 'S05', 'S06'], fact: 'method', cont: 'D09',
    ask: 'What method can actually provide the required data: read-only SQL/database access, a replica, a documented API, scheduled files, or a static archive?',
    why: 'Picks the access path to explore.',
    plain: 'Never pick by lowest effort alone.',
    b: [
      b('prod', 'Production database', { m: 'Explore the database path.', f: { method: REP }, next: 'D01' }),
      b('rep', 'Replica / reporting DB', { m: 'Explore the replica path.', f: { method: REP }, next: 'D03' }),
      b('api', 'API / cloud data access', { m: 'Explore the API path.', f: { method: REP }, next: 'A01' }),
      b('file', 'Scheduled export / SFTP', { m: 'Explore the file path.', f: { method: REP }, next: 'F01' }),
      b('arch', 'Static archive', { m: 'Explore the legacy path.', f: { method: REP }, next: 'L01' }),
      b('multi', 'Several options', { m: 'Keep a preferred path and a fallback. Exploring the first; resume the other later.', f: { method: REP }, queue: 'O04', next: 'D01' }),
      b('none', 'None / vendor decides', { m: 'Vendor dependency.', f: { method: UNK, vendor: UNK }, call: 'V01', ret: 'D09' }),
      b('ui', 'Browser / UI access only', { m: 'Not database or API access.', f: { method: UNK, vendor: UNK }, call: 'V01', ret: 'D09' }),
    ],
  }),

  // ── E. Database ──────────────────────────────────────────────
  n('D01', 'access', 'source', {
    whom: 'Customer IT / DBA', basis: GUI, refs: ['S02', 'S05'], fact: 'method', cont: 'D02',
    ask: 'Is your IT team comfortable with read-only access to production? Does the vendor require a replica, controlled syncs, testing, or other approval first?',
    why: 'Production access carries conditions.',
    plain: 'Read-only queries still use server resources.',
    b: [
      b('ok', 'Allowed, no prerequisites', { m: 'Production path supported.', f: { method: OK }, confirm: true, next: 'D02' }),
      b('cond', 'Allowed with conditions', { m: 'Condition stays a dependency.', f: { method: PEND }, a: [['Resolve production access condition', 'Customer IT', 'c']], next: 'D02' }),
      b('rep', 'Replica required', { m: 'Move to the replica path.', f: { method: REP }, next: 'D03' }),
      b('deny', 'Denied, no replica known', { m: 'Vendor or alternative needed.', f: { method: DEN, vendor: UNK }, call: 'V01', ret: 'D05' }),
    ],
  }),
  n('D02', 'access', 'source', {
    whom: 'Customer IT / DBA', basis: GUI, refs: ['S02', 'S03', 'S08'], cont: 'D05',
    ask: 'What are the server CPU, memory, and disk capacity, and how much is currently available versus used? Are there load constraints or test requirements?',
    why: 'Engineering needs this to plan a safe approach.',
    plain: 'There is no universal pass score.',
    b: [
      b('known', 'Specs known, no concern', { m: 'Record. No pass score invented.', next: 'D05' }),
      b('unk', 'Specs unknown', { m: 'DBA provides after the call.', a: [['Provide server specs', 'Customer DBA', 'c']], next: 'D05' }),
      b('press', 'Resource pressure / tests required', { m: 'Engineering + DBA review safe approach or replica.', a: [['Review load approach with DBA', 'Solutions / Engineering']], next: 'D05' }),
      b('load', '“How much load will you create?”', { m: 'Workload-specific — no universal guarantee.', s: 'It depends on your data and schedule — let me get you a specific answer from our engineers.', a: [['Answer load question for this workload', 'Engineering']], next: 'D05' }),
    ],
  }),
  n('D03', 'access', 'source', {
    whom: 'Customer DBA / vendor', basis: GUI, refs: ['S02', 'S05', 'S07'], fact: 'method', cont: 'D04',
    ask: 'Does the replica already exist, is it supported, and is it paid/licensed? If not, who can create it and what infrastructure is needed?',
    why: 'Replicas cost money and need maintainers.',
    plain: 'A replica existing proves little on its own.',
    b: [
      b('yes', 'Exists and supported', { m: 'Capture DBA and environment.', f: { method: OK }, confirm: true, next: 'D04' }),
      b('yesr', 'Exists — support unconfirmed', { m: 'Supported status unknown.', f: { method: REP }, next: 'D04' }),
      b('plan', 'Not created, licensed and resourced', { m: 'Planned replica.', f: { method: PEND }, a: [['Provision replica', 'Customer DBA', 'c']], next: 'D04' }),
      b('lic', 'License or server missing', { m: 'Quote and customer resourcing needed.', f: { method: PEND, cost: UNK }, call: 'V02', ret: 'D04' }),
      b('test', 'Only a test/training copy', { m: 'Environment concern.', f: { method: UNK }, a: [['Identify operational replica', 'Customer DBA', 'c']], next: 'D04' }),
      b('nobody', 'Nobody can create it', { m: 'Unresolved path.', f: { method: DEN, vendor: UNK }, call: 'V01', ret: 'D05' }),
    ],
  }),
  n('D04', 'access', 'source', {
    whom: 'Customer DBA', basis: GUI, refs: ['S05'], fact: 'coverage', cont: 'D05',
    ask: 'Is this a full replica? What history, tables, narratives, attachments, and fields are missing? How often does it refresh, and who monitors it?',
    why: 'Compare against I03 requirements.',
    plain: 'No universal refresh rule exists.',
    b: [
      b('full', 'Coverage and freshness match', { m: 'Requirements met.', f: { coverage: OK, fresh: OK }, confirm: true, next: 'D05' }),
      b('part', 'Partial', { m: 'Coverage gap.', f: { coverage: UNK }, next: 'D06' }),
      b('late', 'Delayed', { m: 'Compare actual delay with the workflow need.', f: { fresh: UNK }, a: [['Compare refresh delay to workflow needs', 'Solutions']], next: 'D06' }),
      b('unk', 'Unknown', { m: 'Limitations unresolved.', f: { coverage: UNK, fresh: UNK }, a: [['Confirm replica completeness and refresh', 'Customer DBA / vendor', 'c']], next: 'D05' }),
      b('custom', 'Custom replication script', { m: 'Not production-ready by default.', f: { coverage: UNK }, a: [['Engineering review of custom replication', 'Engineering']], next: 'D05' }),
    ],
  }),
  n('D05', 'access', 'source', {
    whom: 'Customer DBA', basis: GUI, refs: ['S05', 'S06'], fact: 'account', cont: 'D06',
    ask: 'Who can provide the host/IP, port, database names, and a read-only account with the necessary database/table permissions? Is schema or a data dictionary available?',
    why: 'Someone must provision the account.',
    plain: 'Knowing an IP grants nothing. Never put credentials here.',
    b: [
      b('dba', 'Agency DBA can provide', { m: 'Request non-secret details and an approved credential handoff.', f: { account: PEND }, a: [['Provide endpoint details; arrange approved credential handoff', 'Customer DBA', 'c']], next: 'D06' }),
      b('vendor', 'Only the vendor can provide', { m: 'Vendor dependency.', f: { account: UNK, vendor: UNK }, call: 'V01', ret: 'D06' }),
      b('names', 'Can see names only', { m: 'Visibility ≠ read permission.', f: { account: UNK }, a: [['Grant per-database read permissions', 'Customer DBA', 'c']], next: 'D06' }),
      b('noschema', 'No schema available', { m: 'Find who understands the data model.', f: { account: PEND }, a: [['Identify data-model expert', 'Customer IT', 'c']], next: 'D06' }),
      b('engine', 'Nonstandard DB technology', { m: 'Record engine/version; connector validation needed. “SQL” ≠ SQL Server.', f: { account: PEND }, a: [['Validate connector for DB engine', 'Engineering']], next: 'D06' }),
    ],
  }),
  n('D06', 'access', 'source', {
    whom: 'Customer IT / owner', basis: GUI, refs: ['S05', 'S06'], fact: 'coverage', cont: 'D07',
    ask: 'Does this method include everything needed for our scoped workflows, including narratives, documents, full history, and only the agencies/data you are authorized to provide?',
    why: 'Coverage and authorized boundary.',
    plain: 'Only authorized data, all needed data.',
    b: [
      b('ok', 'Adequate and authorized', { m: 'Coverage confirmed.', f: { coverage: OK }, confirm: true, next: 'D07' }),
      b('narr', 'Narratives / media missing', { m: 'Coverage gap.', f: { coverage: UNK }, a: [['Find supported path to narratives/media', 'Customer IT', 'c']], next: 'D07' }),
      b('hist', 'Limited history or fields', { m: 'Document impact; AE reviews scope.', f: { coverage: UNK }, a: [['Scope review for limited coverage', 'AE']], next: 'D07' }),
      b('mixed', 'Mixed agencies / restricted tables', { m: 'Owner defines the authorized boundary.', f: { coverage: PEND }, a: [['Define authorized data boundary', 'Agency owner', 'c']], next: 'D07' }),
      b('filter', '“Filter later” after broad ingestion', { m: 'Escalate authorized-access design before ingestion.', f: { coverage: DIS }, a: [['Authorized-access design review', 'Solutions / Security']], next: 'D07' }),
    ],
  }),
  n('D07', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S05', 'S13'], fact: 'media', cont: 'D08',
    ask: 'Where do mugshots, reports, scanned documents, and other attachments live, and does the same access path reach them?',
    why: 'Media often lives elsewhere.',
    plain: 'Separate store = separate access check.',
    b: [
      b('same', 'Same DB, accessible', { m: 'Covered.', f: { media: REP }, next: 'D08' }),
      b('sep', 'Separate file server / API', { m: 'Linked endpoint created. Review its access, then return.', f: { media: UNK }, spawn: 'media', call: 'O01', ret: 'D08' }),
      b('na', 'Not required for scope', { m: 'Confirmed not applicable.', f: { media: NA }, next: 'D08' }),
      b('prop', 'Proprietary / encrypted', { m: 'Feasibility review.', f: { media: UNK }, a: [['Media format feasibility review', 'Engineering']], next: 'D08' }),
    ],
  }),
  n('D08', 'access', 'source', {
    whom: 'Customer DBA', basis: GUI, refs: ['S08', 'S13'], fact: 'updates', cont: 'D09',
    ask: 'How will records change over time, and what mechanism lets us see updates, deletions, or expungements? Are there change-tracking requirements?',
    why: 'Updates and expungements must flow through.',
    plain: 'No promise of heavy polling on production.',
    b: [
      b('known', 'Known mechanism', { m: 'Document for integration team.', f: { updates: REP }, next: 'D09' }),
      b('unk', 'Unknown / no change signal', { m: 'Connector review.', f: { updates: UNK }, a: [['Review incremental update approach', 'Engineering']], next: 'D09' }),
      b('rims', 'RIMS', { m: 'Vendor-specific change tracking.', f: { updates: UNK }, call: 'V05', ret: 'D09' }),
      b('static', 'Static archive', { m: 'Needs an expungement process.', f: { updates: NA }, call: 'L03', ret: 'D09' }),
    ],
  }),
  n('D09', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S04'], fact: 'path', cont: 'END_SOURCE',
    ask: 'Let me confirm what I heard: [product/environment], [owner], [authorized method], [network if needed], [coverage/freshness], and [remaining dependencies]. Is that accurate, and who owns each outstanding item?',
    why: 'Locks in the per-source picture.',
    plain: 'Read back the summary on the right.',
    b: [
      b('ok', 'Accurate', { m: 'Source summary stored.', next: 'END_SOURCE' }),
      b('fix', 'Corrections needed', { m: 'Edit the affected answer from History; later answers become stale.', next: 'END_SOURCE' }),
      b('wait', 'Awaiting confirmations', { m: 'Dependencies stay open with owners.', park: true, next: 'END_SOURCE' }),
      b('none', 'No viable path', { m: 'Visible source blocker.', f: { path: DEN }, g: 'Escalation queued (R02) if critical.', next: 'END_SOURCE' }),
    ],
  }),

  // ── F. API ───────────────────────────────────────────────────
  n('A01', 'access', 'source', {
    whom: 'Customer IT / vendor', basis: GUI, refs: ['S02', 'S06', 'S07'], fact: 'method', cont: 'A02',
    ask: 'Is there a documented API or other supported data-access interface for this exact product and hosting model, and can your agency obtain third-party access to it?',
    why: 'Marketing claims are not access.',
    plain: 'An API existing proves nothing about coverage.',
    b: [
      b('yes', 'Documented and available', { m: 'Check coverage next.', f: { method: OK }, confirm: true, next: 'A02' }),
      b('fees', 'Exists, approval/fees pending', { m: 'Vendor dependency.', f: { method: PEND, vendor: UNK }, call: 'V01', ret: 'A02' }),
      b('nodocs', 'Exists, no docs or terms', { m: 'Access unconfirmed.', f: { method: UNK }, a: [['Provide API docs and third-party terms', 'Vendor', 'c']], next: 'A02' }),
      b('none', 'No API', { m: 'Look for another method.', f: { method: DEN }, next: 'O04' }),
    ],
  }),
  n('A02', 'access', 'source', {
    whom: 'Vendor API owner', basis: GUI, refs: ['S05', 'S07', 'S08'], fact: 'coverage', cont: 'A03',
    ask: 'Does it expose the history, fields, narratives/media, and update cadence we need? Does it support bulk extraction and ongoing updates, or only individual searches?',
    why: 'Search APIs are not ingestion.',
    plain: 'Bulk + updates vs. one-at-a-time lookup.',
    b: [
      b('conf', 'Bulk + updates, confirmed in docs', { m: 'Coverage evidenced for the scoped workflows.', f: { coverage: OK }, confirm: true, next: 'A03' }),
      b('bulk', 'Bulk + updates claimed', { m: 'Collect docs for validation.', f: { coverage: REP }, a: [['Validate API docs', 'Solutions / Engineering']], next: 'A03' }),
      b('search', 'Search-only / metadata-only', { m: 'Not equivalent to full ingestion.', f: { coverage: DEN }, g: 'Scope/access risk.', a: [['Technical/commercial review of API limits', 'Solutions / AE']], next: 'A03' }),
      b('limits', 'Rate limits / short history', { m: 'Capture exact terms.', f: { coverage: UNK }, a: [['Review API limits', 'Engineering']], next: 'A03' }),
      b('unk', 'Unknown', { m: 'Vendor provides details.', f: { coverage: UNK }, a: [['Provide API coverage details', 'Vendor', 'c']], next: 'A03' }),
    ],
  }),
  n('A03', 'access', 'source', {
    whom: 'Customer IT / vendor', basis: GUI, refs: ['S06', 'S08'], fact: 'account', cont: 'A04',
    ask: 'Who creates the API user/client, enables scopes, grants access, and handles any allowlisting or approval? Are there setup or recurring fees?',
    why: 'Someone must provision API access.',
    plain: 'Never paste secrets here.',
    b: [
      b('clear', 'Clear provisioner, no fees', { m: 'Account plan recorded.', f: { account: PEND }, next: 'A04' }),
      b('feesp', 'Clear provisioner, fees apply', { m: 'Review costs.', f: { account: PEND, cost: UNK }, call: 'V02', ret: 'A04' }),
      b('vendor', 'Vendor required', { m: 'Vendor dependency.', f: { account: UNK, vendor: UNK }, call: 'V01', ret: 'A04' }),
      b('have', 'Credentials already exist', { m: 'Record a secure-storage reference only. Verify agency, product, scopes.', f: { account: PEND }, next: 'A04' }),
      b('unclear', 'Unclear scopes / terms', { m: 'Specific follow-up.', f: { account: UNK }, a: [['Clarify API scopes and allowlisting', 'Customer IT', 'c']], next: 'A04' }),
    ],
  }),
  n('A04', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S04'], cont: 'D09',
    ask: 'Which parts of API access are confirmed, and which still need vendor or technical validation?',
    why: 'Separates confirmed from pending.',
    plain: 'Cloud does not always mean public.',
    b: [
      b('ok', 'Confirmed with evidence', { m: 'Recap the source.', next: 'D09' }),
      b('pend', 'Pending review/cost/access', { m: 'Open issue carried to recap.', park: true, next: 'D09' }),
      b('priv', 'Privately networked endpoint', { m: 'Needs network discovery.', f: { network: UNK }, group: 'pick', call: 'N01', ret: 'D09' }),
    ],
  }),

  // ── G. Files & legacy ────────────────────────────────────────
  n('F01', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S06', 'S09', 'S13'], fact: 'method', cont: 'F02',
    ask: 'Is this a one-time historical export or a proposed recurring feed? Why is it preferred over a persistent database/API connection?',
    why: 'SFTP is preferred for one-time transfer, not as a blanket feed.',
    plain: 'One-time vs recurring changes everything.',
    b: [
      b('once', 'One-time archive', { m: 'Legacy path.', f: { method: REP }, next: 'L01' }),
      b('recur', 'Recurring feed', { m: 'Needs feasibility review.', f: { method: PEND }, next: 'F02' }),
      b('bridge', 'Temporary bridge', { m: 'Track the transition deadline.', f: { method: PEND }, queue: 'L02', next: 'F02' }),
      b('only', 'Only method permitted', { m: 'Feasibility review — not auto-approved or rejected.', f: { method: PEND }, next: 'F02' }),
    ],
  }),
  n('F02', 'access', 'source', {
    whom: 'Customer IT', basis: PRO, refs: ['S06', 'S13'], fact: 'coverage', cont: 'F03',
    ask: 'Who writes and maintains the export, what files and fields does it include, and can it provide the required history, narratives, and attachments?',
    why: 'Exports need an owner and a defined shape.',
    plain: 'Share format examples — never CJI.',
    b: [
      b('ok', 'Maintained, complete', { m: 'Record format and owner.', f: { coverage: REP }, next: 'F03' }),
      b('vendor', 'Vendor must write it', { m: 'Vendor dependency.', f: { vendor: UNK }, call: 'V01', ret: 'F03' }),
      b('noschema', 'IT can export, no schema', { m: 'Define requirements together.', f: { coverage: UNK }, a: [['Define export requirements', 'DS / Engineering']], next: 'F03' }),
      b('partial', 'Partial or manual UI report', { m: 'Coverage and sustainability concern.', f: { coverage: UNK }, next: 'F03' }),
    ],
  }),
  n('F03', 'access', 'source', {
    whom: 'Customer IT', basis: PRO, refs: ['S09', 'S13'], fact: 'updates', cont: 'D09',
    ask: 'How often will files arrive, are they full snapshots or changes, how are updates/deletions handled, and who detects or fixes a missed transfer?',
    why: 'Feeds fail silently without an owner.',
    plain: 'A file drop is not a live integration.',
    b: [
      b('clear', 'Clear design', { m: 'Engineering reviews fit.', f: { updates: PEND }, a: [['Review recurring feed design', 'Engineering']], next: 'D09' }),
      b('manual', 'Manual / irregular', { m: 'Operational limitation — not live.', f: { updates: UNK }, next: 'D09' }),
      b('nodel', 'No deletion handling', { m: 'Compliance and design follow-up.', f: { updates: UNK }, a: [['Design deletion/expungement handling', 'Engineering / Compliance']], next: 'D09' }),
      b('noowner', 'No schedule / owner', { m: 'Unsustainable path.', f: { updates: DEN }, next: 'D09' }),
    ],
  }),
  n('L01', 'access', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S13'], fact: 'coverage', cont: 'L02',
    ask: 'Where does legacy data live, in what format, how much history is there, and are documents/media included?',
    why: 'Legacy data has a shape and an end date.',
    plain: 'Static data still needs authorized access.',
    b: [
      b('ok', 'Accessible, owner confirms history', { m: 'Authorized method and history confirmed.', f: { coverage: OK, method: OK }, confirm: true, next: 'L02' }),
      b('rep', 'Accessible — unconfirmed', { m: 'Record method; confirm history later.', f: { coverage: REP }, next: 'L02' }),
      b('prop', 'Proprietary / encrypted', { m: 'Feasibility review via approved channels.', f: { coverage: UNK }, a: [['Request schema/sample via approved channel', 'Engineering']], next: 'L02' }),
      b('ui', 'UI access only', { m: 'Not data access.', f: { coverage: UNK, vendor: UNK }, call: 'V01', ret: 'L02' }),
      b('backup', 'Vendor will provide backup', { m: 'Get format, owner, delivery terms, authorization.', f: { coverage: PEND }, a: [['Confirm backup format and delivery', 'Vendor', 'c']], next: 'L02' }),
    ],
  }),
  n('L02', 'access', 'source', {
    whom: 'Customer IT / AE', basis: GUI, refs: ['S05', 'S13'], fact: 'migration', cont: 'L03',
    ask: 'When does the old system stop being available, what will the new vendor migrate, and do we need access to both old and new systems?',
    why: 'Deadlines and scope shift with migrations.',
    plain: 'A new vendor may not keep all old fields.',
    b: [
      b('kept', 'Old system retained', { m: 'Document static vs active.', f: { migration: REP }, next: 'L03' }),
      b('date', 'Decommission date known', { m: 'Time-sensitive export plan.', f: { migration: PEND }, a: [['Plan export before decommission', 'Customer IT', 'c']], next: 'L03' }),
      b('both', 'Both active / new replacement', { m: 'New source added separately. AE reviews scope and cost.', f: { migration: PEND }, spawn: 'new', a: [['Scope review for replacement system', 'AE']], next: 'L03' }),
      b('done', 'Migration assumed complete', { m: 'Ask what was excluded.', s: 'Which fields, history, or documents were not migrated?', f: { migration: UNK }, next: 'L03' }),
    ],
  }),
  n('L03', 'access', 'source', {
    whom: 'Records / compliance owner', basis: GUI, refs: ['S13'], fact: 'updates', cont: 'D09',
    ask: 'For data that will no longer update from a live source, who notifies Peregrine about removals or expungements, and what retention obligations apply?',
    why: 'Static archives cannot self-expunge.',
    plain: 'Someone must tell us about removals.',
    b: [
      b('ok', 'Process agreed', { m: 'Document for handoff.', f: { updates: REP }, rc: true, next: 'D09' }),
      b('unk', 'Unknown', { m: 'Agree a process.', f: { updates: UNK }, a: [['Agree expungement notification process', 'Agency records owner', 'c']], rc: true, next: 'D09' }),
      b('replace', 'Wants Peregrine as system of record', { m: 'Do not promise that role.', a: [['Solutions review of records-of-record request', 'Solutions']], rc: true, next: 'D09' }),
    ],
  }),

  // ── H. Vendor ────────────────────────────────────────────────
  n('V01', 'vendor', 'source', {
    whom: 'Customer IT / vendor manager', basis: GUI, refs: ['S02', 'S06', 'S08', 'S16'], fact: 'vendor', cont: 'V02',
    ask: 'What exactly must the vendor do: create an account, authorize third-party access, enable an API, license/create a replica, build an export/query, or approve something else?',
    why: 'Vague vendor dependencies stall deals.',
    plain: 'Name the exact deliverable.',
    b: [
      b('acct', 'Create DB/API account only', { m: 'Customer requests exact access.', f: { vendor: PEND }, a: [['Request account from vendor', 'Customer', 'c']], next: 'V02' }),
      b('build', 'License / replica / export work', { m: 'Document the deliverable and maintainer.', f: { vendor: PEND }, next: 'V02' }),
      b('deny', 'Vendor denies all usable access', { m: 'Ask for alternative and written policy.', f: { vendor: DEN }, a: [['Request written vendor policy and alternatives', 'Customer', 'c']], next: 'V02' }),
      b('prec', 'Precedent elsewhere differs', { m: 'Customer-specific control applies. Don’t call the vendor unnecessary.', f: { vendor: UNK }, next: 'V02' }),
      b('prod', 'Product-specific issue', { m: 'Run the vendor overlay.', next: 'OVERLAY' }),
    ],
  }),
  n('V02', 'vendor', 'source', {
    whom: 'Customer / vendor', basis: GUI, refs: ['S02', 'S03', 'S07'], fact: 'cost', cont: 'V03',
    ask: 'Are there setup, licensing, hosting, support, API, or recurring integration fees? Do we have a written quote, who pays, and has that cost been approved?',
    why: 'Estimate ≠ quote ≠ approval.',
    plain: 'Never assume who pays.',
    b: [
      b('ok', 'Quote + funding confirmed', { m: 'Record amount, one-time vs recurring, payer.', f: { cost: OK }, confirm: true, next: 'V03' }),
      b('est', 'Estimate or old fee', { m: 'Estimate only.', f: { cost: REP }, a: [['Request current written quote', 'Customer', 'c']], next: 'V03' }),
      b('unk', 'Unknown', { m: 'Confirm cost and scope.', f: { cost: UNK }, a: [['Confirm vendor fees', 'Customer', 'c']], next: 'V03' }),
      b('peregrine', 'Assumes Peregrine pays', { m: 'Clarify commercial responsibility.', f: { cost: DIS }, a: [['Clarify fee responsibility', 'AE / Deal Desk']], next: 'V03' }),
      b('rej', 'Rejected / unfunded', { m: 'Unresolved dependency.', f: { cost: DEN }, next: 'V03' }),
    ],
  }),
  n('V03', 'vendor', 'source', {
    whom: 'Customer / vendor', basis: GUI, refs: ['S01', 'S02', 'S07'], fact: 'vendor', cont: 'RETURN',
    ask: 'Has the vendor committed to this access method on your current version, and what are the prerequisites, lead time, and contact for getting it done?',
    why: 'Future releases are not present access.',
    plain: 'Written commitment on the current version.',
    b: [
      b('ok', 'Written commitment', { m: 'Record evidence and plan.', f: { vendor: OK }, confirm: true, next: 'RETURN' }),
      b('future', 'Future release only', { m: 'Unavailable until supported.', f: { vendor: PEND, migration: PEND }, a: [['Track vendor release dependency', 'AE']], next: 'RETURN' }),
      b('none', 'No commitment / ETA', { m: 'Vendor follow-up.', f: { vendor: UNK }, a: [['Get vendor commitment and lead time', 'Customer', 'c']], next: 'RETURN' }),
      b('refuse', 'Vendor refuses', { m: 'Unresolved critical access.', f: { vendor: DEN }, g: 'Escalation queued (R02) if critical.', next: 'RETURN' }),
    ],
  }),
  n('V04', 'vendor', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S07'], fact: 'method', cont: 'V02',
    ask: 'Which exact product and hosting model is this, and is there already a usable SQL replica?',
    why: 'CentralSquare / Spillman carry known risk (S07).',
    plain: 'Risk guidance — not identical for every version.',
    b: [
      b('cscloud', 'CentralSquare cloud', { m: 'S07 flags meaningful risk.', f: { method: UNK }, a: [['Current-case validation', 'Solutions / Deal Desk']], next: 'V02' }),
      b('csrep', 'CentralSquare on-prem + replica', { m: 'Check replica quality.', f: { method: REP }, drop: true, next: 'D04' }),
      b('csyes', 'CS on-prem, no replica — DBA + resources', { m: 'Planned replica.', f: { method: PEND }, drop: true, next: 'D03' }),
      b('csno', 'CS on-prem, no replica — lacks DBA or resources', { m: 'High-risk path.', f: { method: UNK }, next: 'V02' }),
      b('sprep', 'Spillman + replica', { m: 'Check replica quality.', f: { method: REP }, drop: true, next: 'D04' }),
      b('spyes', 'Spillman, Flex Replication + SQL resources', { m: 'Planned replica.', f: { method: PEND }, drop: true, next: 'D03' }),
      b('spnomod', 'Spillman, module not licensed', { m: 'Current quote plus SQL/server plan.', f: { method: PEND, cost: UNK }, next: 'V02' }),
      b('spnocap', 'Spillman, module but no SQL capacity', { m: 'Module alone does not resolve access.', f: { method: UNK }, a: [['Plan customer SQL infrastructure', 'Customer IT', 'c']], next: 'V02' }),
      b('mde', 'Motorola Data Exchange API suggested', { m: 'S07: not the required bulk alternative.', f: { method: UNK }, next: 'V02' }),
      b('avl', 'Approved-vendor-list claim', { m: 'S07: list applies to write-back, not read-only.', next: 'V02' }),
    ],
  }),
  n('V05', 'vendor', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S08'], fact: 'updates', cont: 'V02',
    ask: 'Has Sun Ridge provisioned read-only access to the RIMS, RIMS_IMAGES, and RIMS_Sharing databases and enabled the required change-tracking tables?',
    why: 'RIMS needs vendor-enabled change tracking.',
    plain: 'IT usually cannot enable this alone.',
    b: [
      b('both', 'Both available', { m: 'Ready for review.', f: { updates: REP }, next: 'V02' }),
      b('login', 'Login exists, no change tracking', { m: 'Customer requests vendor setup.', f: { updates: UNK }, a: [['Request change-tracking setup', 'Customer', 'c']], next: 'V02' }),
      b('neither', 'Neither', { m: 'Customer engages vendor for quote.', f: { updates: UNK, account: UNK }, a: [['Request RIMS access and change-tracking quote', 'Customer', 'c']], next: 'V02' }),
      b('scope', 'Scope differs', { m: 'Confirm required tables.', a: [['Confirm required RIMS tables', 'Solutions']], next: 'V02' }),
    ],
  }),
  n('V06', 'vendor', 'source', {
    whom: 'Customer IT', basis: GUI, refs: ['S08'], fact: 'account', cont: 'V02',
    ask: 'Have you requested the Data Lake SQL access, API access, and the entity permissions feed needed for the scoped integration?',
    why: 'Mark43 has specific request items.',
    plain: 'Use current forms; DS copied.',
    b: [
      b('done', 'Requested / provided', { m: 'Record which items and restrictions.', f: { account: PEND }, next: 'RETURN' }),
      b('not', 'Not requested', { m: 'Agency files vendor request.', f: { account: UNK }, a: [['File Mark43 support request (DS copied)', 'Customer', 'c']], next: 'V02' }),
      b('unclear', 'Unclear what’s needed', { m: 'Confirm required items.', a: [['Confirm Mark43 requirements', 'Solutions / DS']], next: 'V02' }),
      b('delay', 'Delayed', { m: 'Follow internal protocol. Keep escalation internal.', a: [['Follow internal Mark43 escalation', 'DS']], next: 'V02' }),
    ],
  }),
  n('V07', 'vendor', 'source', {
    whom: 'Customer IT', basis: HIS, refs: ['S15', 'S02', 'S06'], fact: 'method', cont: 'V02',
    ask: 'Do you control the on-prem database and read-only permissions yourselves, or does Southern Software need to authorize/provision access or build a query/export? Will they support this on your current system?',
    why: 'Southern precedent varies by agency.',
    plain: 'Historical contacts: Nikhil Pampati, Juan Bermudez (Lee County AL SO); Stephen Hei (fees). Confirm — not assignments.',
    b: [
      b('agency', 'Agency can provision', { m: 'Direct DB path. Precedent: per-database datareader. Verify here.', f: { method: REP }, drop: true, next: 'D01' }),
      b('vendor', 'Vendor-only control', { m: 'Vendor commitment needed.', f: { vendor: PEND }, next: 'V02' }),
      b('middle', 'Middleman server export', { m: 'Vendor query dependency remains.', f: { method: PEND }, drop: true, next: 'F02' }),
      b('nucleus', 'Defers until Nucleus', { m: 'Future release ≠ present access.', f: { vendor: PEND, migration: PEND }, a: [['Ask current-version alternative and Nucleus timing', 'Customer', 'c']], next: 'V03' }),
      b('fee', 'Reported $1,250 charge', { m: 'Customer-reported estimate only.', f: { cost: REP }, next: 'V02' }),
    ],
  }),
  n('V08', 'vendor', 'source', {
    whom: 'Internal', aud: 'internal', basis: GUI, refs: ['S07', 'S08'], fact: 'method', cont: 'V02',
    ask: 'Does current Peregrine guidance identify restrictions for this exact product/hosting model, and has an exception or usable path been confirmed for this case?',
    why: 'Known restrictions shape scope and pricing.',
    plain: 'Never promise ingest for restricted sources.',
    b: [
      b('restr', 'Generally restricted', { m: 'AE/Deal Desk review before commitments.', f: { method: UNK }, a: [['Deal Desk review of restricted source', 'AE']], next: 'V02' }),
      b('path', 'Challenging, potential path', { m: 'Capture prerequisites.', next: 'V02' }),
      b('imc', 'IMC / Pervasive SQL', { m: 'String conversion and incremental-sync concerns.', a: [['Engineering review of Pervasive SQL', 'Engineering']], next: 'V02' }),
      b('cloud', 'Cloud Tyler / Versaterm', { m: 'Docs, access, fee investigation.', a: [['Solutions review of cloud vendor', 'Solutions']], next: 'V02' }),
      b('one', 'OneSolution warm standby', { m: 'Confirm daily refresh and fit. Not free by default.', drop: true, next: 'D04' }),
      b('new', 'New vendor / conflicting guidance', { m: 'Authoritative review.', a: [['Authoritative vendor review', 'Solutions / Deal Desk']], next: 'V02' }),
    ],
  }),

  // ── I. Cross-cutting ─────────────────────────────────────────
  n('X01', 'changes', 'meeting', {
    whom: 'Customer IT', basis: GUI, refs: ['S02', 'S03', 'S05'], fact: 'changes', cont: 'C01',
    ask: 'Over the next roughly 12–18 months, do you expect changes to vendors, hosting, networks, IT owners, identity, or system retirement?',
    why: 'Changes invalidate today’s answers.',
    plain: 'Catch migrations before they surprise you.',
    b: [
      b('none', 'None known', { m: 'Recorded.', f: { changes: REP }, next: 'C01' }),
      b('mig', 'Vendor / hosting migration', { m: 'Review the affected source’s transition.', f: { changes: PEND }, pick: 'source', call: 'L02', ret: 'C01' }),
      b('owner', 'Network / identity / owner change', { m: 'Get new owner and timing; revalidate.', f: { changes: PEND }, a: [['Revalidate facts affected by change', 'DS/SE']], next: 'C01' }),
      b('unsure', 'Not sure', { m: 'Ask the relevant owner.', f: { changes: UNK }, a: [['Confirm upcoming changes', 'Customer IT', 'c']], next: 'C01' }),
    ],
  }),
  n('C01', 'compliance', 'meeting', {
    whom: 'Compliance / security POC', basis: GUI, refs: ['S02', 'S03', 'S06'], fact: 'compliance', cont: 'C02',
    ask: 'What agency, state, national, or local security/compliance processes must be completed before cloud hosting, network access, data access, or individual staff access?',
    why: 'Compliance runs in parallel and can block.',
    plain: 'Different jurisdictions, different rules.',
    b: [
      b('defined', 'Defined requirements', { m: 'Record each by type, owner, trigger.', f: { compliance: REP }, next: 'C02' }),
      b('fl', 'Florida', { m: 'Florida overlay applies after staff access.', f: { compliance: REP }, meta: { florida: true }, next: 'C02' }),
      b('state', 'CLETS / other state / Canada', { m: 'Capture authority and exact process. Don’t import Florida rules.', f: { compliance: REP }, a: [['Security/Compliance review of jurisdiction', 'Security / Compliance']], next: 'C02' }),
      b('none', 'No extra process', { m: 'Baseline obligations still apply.', f: { compliance: REP }, next: 'C02' }),
    ],
  }),
  n('C02', 'compliance', 'meeting', {
    whom: 'Compliance / security POC', basis: GUI, refs: ['S02'], fact: 'compliance', cont: 'C03',
    ask: 'Who is your CJIS/security/backgrounding contact, what documents or approvals are needed, and what can happen in parallel versus only after approval?',
    why: 'Sequence approvals and parallel work.',
    plain: 'What blocks what?',
    b: [
      b('clear', 'Clear', { m: 'Map approvals and dependencies.', next: 'C03' }),
      b('noowner', 'Documents requested, no owner', { m: 'Identify owner.', f: { compliance: UNK }, a: [['Identify compliance document owner', 'AE']], next: 'C03' }),
      b('cert', 'Wants assurances beyond FAQ', { m: 'Don’t improvise.', s: 'Let me confirm with our security team.', a: [['Security/Compliance response', 'Security / Compliance']], next: 'C03' }),
      b('block', 'Blocks all work until approval', { m: 'No restricted access until approved.', f: { compliance: PEND }, next: 'C03' }),
    ],
  }),
  n('C03', 'compliance', 'meeting', {
    whom: 'Compliance POC', basis: GUI, refs: ['S02', 'S06'], fact: 'staff', cont: 'S01Q',
    ask: 'For Peregrine employees who may access your data or servers, what fingerprinting, backgrounding, training, and agency authorization are required, and how do you verify completion?',
    why: 'Per-person access is its own dependency.',
    plain: 'Submitted ≠ accepted ≠ authorized.',
    b: [
      b('new', 'New checks required', { m: 'Get process, roster needs, verification.', f: { staff: PEND }, a: [['Provide backgrounding process and roster requirements', 'Agency compliance POC', 'c']], next: 'FLORIDA' }),
      b('reuse', 'Existing prints may be reusable', { m: 'Never mark waived. Get explicit acceptance.', f: { staff: UNK }, a: [['Confirm acceptance of existing artifacts', 'Agency compliance POC', 'c']], next: 'FLORIDA' }),
      b('unclear', 'Individual approval unclear', { m: 'Per-person dependency stays.', f: { staff: UNK }, next: 'FLORIDA' }),
      b('escort', 'Escort / non-accessing exception', { m: 'Agency confirms exact boundary.', f: { staff: UNK }, next: 'FLORIDA' }),
    ],
  }),
  n('C04', 'compliance', 'meeting', {
    whom: 'Agency / Florida team', basis: GUI, refs: ['S14'], fact: 'flcloud', cont: 'C05',
    ask: 'What is the status of the FDLE Cloud Implementation Plan, Vendor Questionnaire, architecture/audit documentation, and agency confirmation of applicable personnel clearance?',
    why: 'Florida cloud review is separate from training.',
    plain: 'Sent → received → notice → authorized.',
    b: [
      b('pre', 'Submissions needed (pre-TTAR)', { m: 'S14 names Ross Brummett — confirm availability.', f: { flcloud: PEND }, a: [['Submit FDLE cloud materials', 'Florida team']], next: 'C05' }),
      b('post', 'Past TTAR, missing', { m: 'S14 routes to CAs — confirm assigned CA.', f: { flcloud: PEND }, a: [['Submit FDLE cloud materials', 'Assigned CA']], next: 'C05' }),
      b('sent', 'Submission sent', { m: 'Track sent / received / notice / authorized separately.', f: { flcloud: PEND }, next: 'C05' }),
      b('prints', 'Agency has own print/training rule', { m: 'Document it even if staff prints were submitted.', f: { staff: UNK }, next: 'C05' }),
      b('ndex', 'Asks N-DEx approval', { m: 'Separate scope item. Conflicts with S07 — confirm.', a: [['Confirm N-DEx applicability (S07 vs S14)', 'Solutions / Compliance']], next: 'C05' }),
    ],
  }),
  n('C05', 'compliance', 'meeting', {
    whom: 'Agency compliance POC', basis: PRO, refs: ['S02', 'S14'], fact: 'staff', cont: 'S01Q',
    ask: 'Will you accept existing CJIS Online training certificates and fingerprint arrangements from another agency, and what confirmation or interagency agreement is required?',
    why: 'Reciprocity is customer-specific.',
    plain: 'Not a universal policy.',
    b: [
      b('yes', 'Accepts training proof', { m: 'Record verifier and people.', f: { staff: OK }, confirm: true, rc: true, next: 'S01Q' }),
      b('mou', 'Fingerprint MOU possible', { m: 'Pending until confirmed.', f: { staff: PEND }, a: [['Pursue fingerprint MOU', 'Agency compliance POC', 'c']], rc: true, next: 'S01Q' }),
      b('no', 'No reciprocity', { m: 'Follow agency requirements.', f: { staff: PEND }, rc: true, next: 'S01Q' }),
      b('unk', 'Unknown', { m: 'Agency decides.', f: { staff: UNK }, rc: true, next: 'S01Q' }),
    ],
  }),
  n('S01Q', 'identity', 'meeting', {
    whom: 'Identity owner', basis: GUI, refs: ['S02', 'S05', 'S12'], fact: 'idp', cont: 'S02Q',
    ask: 'How do users sign in today? Do you use a SAML 2.0 identity provider such as Entra/Azure, Okta, or ADFS, legacy AD/LDAP, or something else?',
    why: 'End-user login is separate from data access.',
    plain: '“AD” can mean Entra SAML or legacy LDAP.',
    b: [
      b('saml', 'SAML provider', { m: 'SAML path.', f: { idp: REP }, next: 'S02Q' }),
      b('adsaml', '“AD” — confirmed hybrid/federated SAML', { m: 'SAML path. No network dependency for cloud SAML.', f: { idp: REP }, next: 'S02Q' }),
      b('adldap', '“AD” — confirmed on-prem LDAP only', { m: 'Legacy path.', f: { idp: REP }, next: 'S03Q' }),
      b('ldap', 'Pure legacy LDAP', { m: 'Legacy path.', f: { idp: REP }, next: 'S03Q' }),
      b('none', 'No provider', { m: 'Review approved fallback. Don’t mix with source credentials.', f: { idp: UNK }, next: 'S03Q' }),
      b('oidc', 'OIDC only', { m: 'S12 does not document OIDC. Confirm support.', f: { idp: UNK }, a: [['Confirm OIDC support', 'Collab / Solutions']], next: 'S03Q' }),
    ],
  }),
  n('S02Q', 'identity', 'meeting', {
    whom: 'Identity owner', basis: GUI, refs: ['S12', 'S06'], fact: 'idp', cont: 'G01',
    ask: 'Who can configure the identity application and approve user groups/roles, and are there login, MFA, shared-workstation, or provisioning requirements to flag?',
    why: 'Setup happens later; capture owner now.',
    plain: 'Not configured during TTAR.',
    b: [
      b('clear', 'Clear owner', { m: 'Hand off for later setup.', f: { idp: OK }, a: [['SSO setup and test handoff', 'Collab']], next: 'G01' }),
      b('roles', 'Roles / MFA unclear', { m: 'Owner + Collab review.', f: { idp: UNK }, next: 'G01' }),
      b('shared', 'Shared workstations', { m: 'Flag Force AuthN for implementation.', next: 'G01' }),
      b('outside', 'Outside documented support', { m: 'Technical review.', f: { idp: UNK }, a: [['Identity technical review', 'Collab / Solutions']], next: 'G01' }),
    ],
  }),
  n('S03Q', 'identity', 'meeting', {
    whom: 'Directory owner', basis: GUI, refs: ['S12'], fact: 'idp', cont: 'G01',
    ask: 'Who owns the directory/login configuration, and can we confirm a supported authentication plan before setup?',
    why: 'LDAP needs a reachable auth server.',
    plain: 'Identity work is not SQL access.',
    b: [
      b('ldap', 'Pure LDAP', { m: 'Needs reachable server + service account. Secrets only in approved vault.', f: { idp: PEND }, a: [['LDAP networking + Collab handoff', 'Networking / Collab']], next: 'G01' }),
      b('saml', 'Hybrid SAML possible', { m: 'Switch to SAML path.', next: 'S02Q' }),
      b('mgd', 'Peregrine-managed fallback', { m: 'Confirm permitted approach, MFA, admin.', f: { idp: UNK }, next: 'G01' }),
      b('unk', 'Undetermined', { m: 'Identity follow-up.', f: { idp: UNK }, a: [['Confirm authentication plan', 'Identity owner', 'c']], next: 'G01' }),
    ],
  }),
  n('G01', 'gis', 'meeting', {
    whom: 'GIS owner', basis: GUI, refs: ['S02', 'S05'], fact: 'gis', cont: 'G02',
    ask: 'Who manages GIS, and which layers would be useful—beats, jurisdiction boundaries, districts, or other layers?',
    why: 'Maps power many workflows.',
    plain: 'Layers and their owner.',
    b: [
      b('yes', 'Owner and layers identified', { m: 'Pick delivery method.', f: { gis: REP }, next: 'G02' }),
      b('no', 'No GIS in scope', { m: 'Confirmed exclusion.', f: { gis: NA }, next: 'H01' }),
      b('unsure', 'Not sure', { m: 'Request GIS contact and layers.', f: { gis: UNK }, a: [['Provide GIS contact and layer inventory', 'Customer', 'c']], next: 'G02' }),
    ],
  }),
  n('G02', 'gis', 'meeting', {
    whom: 'GIS owner', basis: GUI, refs: ['S05'], fact: 'gis', cont: 'H01',
    ask: 'Can you provision a read-only ESRI account for the required layers, or should we start with static shapefiles/CSVs?',
    why: 'Live vs static layers.',
    plain: 'Static files go stale.',
    b: [
      b('esri', 'Read-only ESRI', { m: 'Capture owner and layers.', f: { gis: PEND }, a: [['Provision read-only ESRI account', 'GIS owner', 'c']], next: 'H01' }),
      b('files', 'Static files', { m: 'Static-update limitation.', f: { gis: REP }, a: [['Send GIS layer files', 'GIS owner', 'c']], next: 'H01' }),
      b('priv', 'Private GIS network', { m: 'Needs network discovery.', f: { gis: UNK }, group: 'pick', call: 'N01', ret: 'H01' }),
      b('unk', 'Unknown / restricted', { m: 'Follow up.', f: { gis: UNK }, next: 'H01' }),
    ],
  }),
  n('H01', 'sharing', 'meeting', {
    whom: 'Agency leadership / CA', basis: GUI, refs: ['S02', 'S03', 'S06', 'S14'], fact: 'sharing', cont: 'R01',
    ask: 'Is interagency sharing part of the intended scope, and who can approve what data is shared with whom?',
    why: 'Sharing needs its own authority.',
    plain: 'Separate from backgrounding and source access.',
    b: [
      b('yes', 'Yes', { m: 'Capture agreement.', f: { sharing: REP }, next: 'H02' }),
      b('no', 'No', { m: 'Recorded.', f: { sharing: NA }, next: 'R01' }),
      b('maybe', 'Interested, undecided', { m: 'Not enabled.', f: { sharing: UNK }, a: [['Sharing follow-up', 'CA / AE']], next: 'H02' }),
      b('third', 'Includes third-party data', { m: 'Verify authority from actual owner.', f: { sharing: UNK }, next: 'H02' }),
    ],
  }),
  n('H02', 'sharing', 'meeting', {
    whom: 'Agency / CA', basis: GUI, refs: ['S02', 'S14'], fact: 'sharing', cont: 'R01',
    ask: 'What agreement or authorization is required, what data can be shared, and are there any restrictions we should capture?',
    why: 'MOU/3PA ≠ fingerprint MOU ≠ vendor agreement ≠ contract.',
    plain: 'Each agreement has its own purpose and owner.',
    b: [
      b('fl', 'Florida', { m: 'S14: CA manages sharing; 3PA preferred. Confirm.', f: { sharing: PEND }, a: [['Confirm sharing process', 'CA']], next: 'R01' }),
      b('other', 'Other jurisdiction', { m: 'Route current legal/CA process.', f: { sharing: PEND }, a: [['Route sharing agreement', 'CA / Legal']], next: 'R01' }),
      b('exec', 'Agreement executed', { m: 'Verify scope and parties.', f: { sharing: REP }, next: 'R01' }),
      b('pend', 'Pending / refused', { m: 'No sharing activation.', f: { sharing: UNK }, next: 'R01' }),
    ],
  }),

  // ── J. Closeout ──────────────────────────────────────────────
  n('R01', 'closeout', 'meeting', {
    whom: 'All attendees', basis: GUI, refs: ['S01', 'S02', 'S04'], cont: 'R03',
    ask: 'For each critical source, do we have a named owner, an authorized supported method, adequate scope/freshness, and a clear plan for remaining prerequisites? What is still unconfirmed?',
    why: 'The access test, out loud.',
    plain: 'Compare with the source assessments.',
    b: [
      b('ok', 'Critical path confirmed', { m: 'Move to action ownership.', next: 'R03' }),
      b('unres', 'Unresolved critical access', { m: 'Escalation required.', g: 'Gate unresolved.', next: 'R02' }),
      b('follow', 'Follow-ups only', { m: 'Not the same as provisioned.', next: 'R03' }),
      b('dis', 'Disagreement', { m: 'Resolve who decides.', call: 'U04', ret: 'R02' }),
    ],
  }),
  n('R02', 'closeout', 'meeting', {
    aud: 'internal', whom: 'Internal', basis: POL, refs: ['S01'], cont: 'R03',
    ask: 'Is the access path to critical CAD/RMS still unclear, denied, or dependent on an unconfirmed third party/vendor?',
    why: 'S01: unresolved access must be escalated.',
    plain: 'Don’t hand DS an avoidable access problem.',
    b: [
      b('yes', 'Yes — escalate', { m: 'Contract gate applies.', g: 'Gate remains unresolved.', a: [['Flag Deal Desk, RSM, and Matt Chandler', 'AE'], ['Raise risk in Deal Desk thread', 'SE']], next: 'R03' }),
      b('exc', 'Exception proposed', { m: 'Needs explicit written approval from authorized Sales/CDO leadership. This app cannot grant it. Exception deals are not fully booked/commissionable until access is resolved.', input: 'exception', g: 'Exception reference requires validation.', next: 'R03' }),
      b('res', 'Owner resolved the path', { m: 'Re-run the affected source questions.', next: 'R01' }),
      b('cont', 'Continue despite blocker', { m: 'Warning stays visible.', park: true, next: 'R03' }),
    ],
  }),
  n('R03', 'closeout', 'meeting', {
    whom: 'All attendees', basis: GUI, refs: ['S01', 'S04'], cont: 'R04',
    ask: 'Can we confirm each next step, who owns it, what it depends on, and the date we agree to follow up?',
    why: 'Leave with owned actions.',
    plain: 'Set owners and dates in Review.',
    b: [
      b('ok', 'Owners and dates named', { m: 'Fill the action register.', next: 'R04' }),
      b('noowner', 'Owner missing', { m: 'AE/champion assigns.', a: [['Assign owners to open actions', 'AE / champion']], next: 'R04' }),
      b('nodate', 'Dates unknown', { m: 'Mark “not agreed”. Don’t invent timelines.', next: 'R04' }),
      b('q', 'Customer has questions', { m: 'Answer what you can; confirm the rest.', next: 'R04' }),
    ],
  }),
  n('R04', 'closeout', 'meeting', {
    aud: 'internal', whom: 'Responsible SE', basis: POL, refs: ['S01', 'S02', 'S04'], cont: 'END',
    ask: 'What has actually been learned, what remains unclear, and what status should the responsible SE record?',
    why: 'S01: Stage 4 requires one of these statuses.',
    plain: 'Recorded here only. Update Salesforce yourself.',
    b: [
      b('done', 'Completed', { m: 'Status does not by itself permit a contract.', meta: { crm: 'Completed' }, next: 'END' }),
      b('follow', 'Follow-ups needed', { m: 'Does not grant contract permission.', meta: { crm: 'Follow-ups needed' }, next: 'END' }),
      b('unclear', 'Unclear data access; no follow-ups', { m: 'Gate remains unresolved.', meta: { crm: 'Unclear data access; no follow-ups' }, next: 'END' }),
    ],
  }),

  // ── Universal handlers ───────────────────────────────────────
  n('U01', 'handler', 'inherit', {
    whom: 'Current attendee', ask: 'Who would be the best person to confirm that, and can we get an introduction or a response from them?',
    why: 'Unknowns need an owner, not a guess.', plain: 'A promise to check is not an answer.',
    b: [
      b('named', 'Named person or team', { m: 'Owner recorded. Parked.', park: true, a: [['Confirm open item', 'Named owner', 'c']], next: 'RETURN' }),
      b('nobody', 'Nobody knows', { m: 'Fact stays unknown.', park: true, a: [['Identify the actual owner', 'AE / champion']], next: 'RETURN' }),
      b('decl', 'Known owner declines', { m: 'Treat as a restriction.', next: 'U03' }),
      b('check', 'Customer will check', { m: 'Pending — success not assumed.', park: true, a: [['Follow up on pending answer', 'Customer', 'c']], next: 'RETURN' }),
    ],
  }),
  n('U02', 'handler', 'inherit', {
    whom: 'Current attendee', ask: 'Does another team manage the database, network, vendor relationship, or access approval? Which team, and who specifically?',
    why: 'Map the missing role to the fact.', plain: 'Command staff are not automatically sysadmins.',
    b: [
      b('named', 'Team / person named', { m: 'Introduction requested. Continue what this attendee can answer.', park: true, a: [['Introduce missing owner', 'AE / champion']], next: 'RETURN' }),
      b('unk', 'Unknown', { m: 'Unresolved-access warning stays.', park: true, a: [['Identify the responsible team', 'AE / champion']], next: 'RETURN' }),
    ],
  }),
  n('U03', 'handler', 'inherit', {
    whom: 'Current attendee', ask: 'Is the restriction on direct production access, all external access, the network method, data scope, or something else? Is there a supported alternative?',
    why: 'Find the exact boundary.', plain: 'Never bypass the owner or a security control.',
    b: [
      b('prod', 'Production only', { m: 'Explore a replica.', drop: true, srcOnly: true, next: 'D03' }),
      b('net', 'Network method only', { m: 'Networking consultation.', park: true, a: [['Networking consultation on alternative method', 'Networking']], next: 'RETURN' }),
      b('data', 'Specific data only', { m: 'Authorized scope review.', drop: true, srcOnly: true, next: 'D06' }),
      b('all', 'All external access', { m: 'Ask the owner for a supported alternative.', g: 'Unresolved critical source → R02.', park: true, next: 'RETURN' }),
      b('unclear', 'Reason unclear', { m: 'Capture exact words; request written clarification.', park: true, a: [['Request written policy clarification', 'Customer', 'c']], next: 'RETURN' }),
    ],
  }),
  n('U04', 'handler', 'inherit', {
    whom: 'Current attendees', ask: 'I’m hearing two different answers. Who has final responsibility for confirming this, and what would establish the answer?',
    why: 'Newest claim doesn’t win.', plain: 'Record both claims in notes.',
    b: [
      b('owner', 'Authority named', { m: 'Disputed until resolved.', park: true, a: [['Resolve disputed answer', 'Named authority', 'c']], next: 'RETURN' }),
      b('none', 'No authority yet', { m: 'Disputed.', park: true, a: [['Identify authority for disputed answer', 'AE']], next: 'RETURN' }),
    ],
  }),
  n('U05', 'handler', 'inherit', {
    whom: 'You', ask: 'I want to make sure I give you the right answer—let me confirm with our appropriate team.',
    why: 'Never fabricate to keep things moving.', plain: 'Say this, then route it.',
    b: [
      b('net', 'Network question', { m: 'Route to Networking.', park: true, a: [['Answer customer network question', 'Networking']], next: 'RETURN' }),
      b('conn', 'Connector / integration', { m: 'Route to Solutions / Engineering.', park: true, a: [['Answer integration question', 'Solutions / Engineering']], next: 'RETURN' }),
      b('comp', 'Compliance', { m: 'Route to Security / Compliance.', park: true, a: [['Answer compliance question', 'Security / Compliance']], next: 'RETURN' }),
      b('legal', 'Contract / sharing', { m: 'Route to AE / Legal / CA.', park: true, a: [['Answer contract/sharing question', 'AE / Legal / CA']], next: 'RETURN' }),
    ],
  }),
];

// Chips shown on every node → handler and the fact state they record.
export const UNIVERSAL = [
  { id: 'U01', label: 'Unknown / pending', state: UNK },
  { id: 'U02', label: 'Not their area', state: UNK },
  { id: 'U03', label: 'Refused', state: DEN },
  { id: 'U04', label: 'Conflicting', state: DIS },
  { id: 'U05', label: 'I’m not sure', state: null },
];

export const PHASES = [
  ['prepare', 'Prepare'], ['opening', 'Opening'], ['inventory', 'Inventory'], ['network', 'Network'],
  ['access', 'Access'], ['vendor', 'Vendor'], ['changes', 'Changes'], ['compliance', 'Compliance'],
  ['identity', 'Identity'], ['gis', 'GIS'], ['sharing', 'Sharing'], ['closeout', 'Closeout'],
];

export const BY_ID = Object.fromEntries(NODES.map((x) => [x.id, x]));
