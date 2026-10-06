// TTAR content. Plain data, plain words.
// st: ok = good · pend = needs confirmation · unk = unknown · no = blocked
// go: section id this answer sends you to (for the flow arrows)

export const SECTIONS = [
  {
    id: 'system', n: 1, title: 'The system', sub: 'What it is and where it lives.',
    q: [
      { id: 'host', ask: 'Where does this system live?', a: [
        { id: 'onprem', l: 'On their own network', st: 'pend', m: 'We need a network link to reach it: an {IPSec} tunnel or {Peregrine Connect}.', go: 'network' },
        { id: 'cloud', l: 'In the vendor’s cloud', st: 'ok', m: 'No network setup. Access comes from the vendor.', go: 'approval' },
        { id: 'third', l: 'County or another agency runs it', st: 'unk', m: 'Someone outside this IT team controls it. Find out who can approve access.', go: 'approval' },
        { id: 'hybrid', l: 'Some of each', st: 'pend', m: 'Treat each part as its own system.' },
      ] },
      { id: 'product', ask: 'What exactly is it? Product, version, live or test?', a: [
        { id: 'prod', l: 'Named product, live', st: 'ok', m: 'Good. The vendor playbook applies.' },
        { id: 'brand', l: 'Just a brand name', st: 'unk', m: 'Ask which product and which version.', say: 'Which product within that vendor, and which version?' },
        { id: 'legacy', l: 'Old archive, no longer updated', st: 'pend', m: 'Static data. Handle it under Old data.', go: 'files' },
        { id: 'test', l: 'Test or training copy only', st: 'unk', m: 'Not the real data. Find the route to the live data.', do: 'Agency IT: identify the route to operational data' },
        { id: 'home', l: 'Built in-house', st: 'ok', m: 'No vendor. Ask who maintains it and who knows the data.' },
      ] },
    ],
  },
  {
    id: 'network', n: 2, title: 'Network', sub: 'Only if it lives on their network.',
    q: [
      { id: 'n_owner', ask: 'Who runs the network? Have they connected an outside vendor before?', a: [
        { id: 'exp', l: 'Owner here, done it before', st: 'ok', m: 'Write down the owner and how they did it last time.' },
        { id: 'new', l: 'Owner here, first time', st: 'pend', m: 'Fine. Our Networking team walks them through it.', say: 'Our Networking team can walk through it with you.' },
        { id: 'else', l: 'Someone else runs it', st: 'unk', m: 'Get the name. Nothing is approved yet.', do: 'AE: introduce the network owner' },
      ] },
      { id: 'n_method', ask: 'IPSec tunnel or Peregrine Connect?', a: [
        { id: 'ipsec', l: 'IPSec', st: 'pend', m: 'Runs on their firewall. Ask who manages the firewall.', do: 'DS: send the IPSec questionnaire' },
        { id: 'connect', l: 'Peregrine Connect', st: 'pend', m: 'They host a small {VM} for us. Ask if they can run a VM.', do: 'DS: send the Connect questionnaire' },
        { id: 'help', l: 'They don’t know', st: 'pend', m: 'Neither is wrong. Networking helps them pick.', say: 'IPSec lives on your firewall. Connect is a small VM you host. Our Networking team can help you choose.' },
        { id: 'other', l: 'Must use their own VPN or Zscaler', st: 'unk', m: 'Write down the exact product. Don’t promise support.', do: 'Networking: review the mandated method' },
        { id: 'none', l: 'No permanent connection allowed', st: 'no', m: 'Files may be the only path. That needs a feasibility review.', go: 'files' },
      ] },
      { id: 'n_run', ask: 'Can they set it up and keep it running?', a: [
        { id: 'yes', l: 'Yes, owner named', st: 'ok', m: 'Send the questionnaire after the call.' },
        { id: 'custom', l: 'Special encryption or routing rules', st: 'pend', m: 'Collect the rules. Networking reviews them.', do: 'Networking: review custom requirements' },
        { id: 'nobody', l: 'Nobody can manage it', st: 'no', m: 'Pick a different method with Networking.', do: 'Networking: consult on method' },
        { id: 'ips', l: 'They want our IPs and config now', st: 'ok', m: 'Those come from provisioning after the call.', say: 'Those come out of provisioning. I’ll make sure you get them as a next step.' },
        { id: 'agents', l: 'They want security agents on the Connect VM', st: 'pend', m: 'Usually fine with an admin account. Networking confirms.', do: 'Networking: confirm security-agent compatibility' },
      ] },
      { id: 'n_reach', ask: 'Would that link actually reach this system? Any county or 911 network in between?', a: [
        { id: 'same', l: 'Same network, owner confirms', st: 'ok', m: 'Planned route. Not tested yet.' },
        { id: 'other', l: 'A different network', st: 'unk', m: 'Repeat these network questions for that network.' },
        { id: 'vpn', l: 'Existing city–county VPN', st: 'unk', m: 'Doesn’t carry over to us. The county must confirm.', do: 'County IT: confirm a third-party route' },
        { id: 'unk', l: 'Restricted or nobody knows', st: 'unk', m: 'Follow up with the owner and Networking.' },
      ] },
      { id: 'n_plan', ask: 'Who finishes the networking intake?', a: [
        { id: 'agreed', l: 'Owner named, plan agreed', st: 'ok', m: 'Method is planned.', do: 'Agency IT: complete the networking intake' },
        { id: 'pend', l: 'Owner named, review pending', st: 'pend', m: 'Planned, not confirmed.' },
        { id: 'none', l: 'No route works', st: 'no', m: 'Every system on this network is stuck until there is one.' },
      ] },
    ],
  },
  {
    id: 'approval', n: 3, title: 'Who approves access', sub: 'Owning the data is not the same as creating our account.',
    q: [
      { id: 'owner', ask: 'Who owns the data, who runs the system, and who can create our account?', a: [
        { id: 'agency', l: 'Agency controls all of it', st: 'ok', m: 'Get names.' },
        { id: 'outside', l: 'County, consortium or vendor controls a piece', st: 'pend', m: 'Get a name for each piece.', do: 'AE: introduce the system owner' },
        { id: 'own', l: '“We own the data” but no one knows who approves', st: 'unk', m: 'Owning data isn’t the power to create accounts.', say: 'Who would actually create the account and approve it?' },
      ] },
      { id: 'auth', ask: 'Can the system owner confirm {read-only} access is allowed?', a: [
        { id: 'yes', l: 'Owner confirms', st: 'ok', m: 'Record who, how, and any limits.' },
        { id: 'tent', l: '“Should be fine”', st: 'pend', m: 'That is not a yes.', do: 'AE: get the owner’s confirmation' },
        { id: 'none', l: 'Owner not here', st: 'unk', m: 'Arrange an intro.', do: 'AE: introduce the owner' },
        { id: 'deny', l: 'Denied', st: 'no', m: 'Ask what exactly is restricted and whether there is a supported alternative.', say: 'What exactly is restricted, and is there a supported alternative?' },
      ] },
      { id: 'prec', ask: 'Has an outside vendor connected to this before?', a: [
        { id: 'db', l: 'Yes, direct read-only database', st: 'ok', m: 'Great precedent.' },
        { id: 'alt', l: 'Yes, via replica, API or export', st: 'ok', m: 'Write down how, and who set it up.' },
        { id: 'never', l: 'Never', st: 'pend', m: 'Expect more digging. Not a problem.' },
        { id: 'vague', l: '“Others use it” with no details', st: 'unk', m: 'Ask what kind of access and what data.', say: 'What kind of access did they have, and what data did it include?' },
      ] },
    ],
  },
  {
    id: 'method', n: 4, title: 'Access method', sub: 'The fork. Each answer opens a different path.',
    q: [
      { id: 'method', ask: 'How can we get the data?', a: [
        { id: 'prod', l: '{Production} database', st: 'pend', m: 'Direct read-only on the live system.', go: 'database' },
        { id: 'rep', l: '{Replica} or reporting copy', st: 'pend', m: 'A copy of the data. Check it exists and is complete.', go: 'database' },
        { id: 'api', l: '{API}', st: 'pend', m: 'Check it is documented and gives bulk data, not just search.', go: 'api' },
        { id: 'file', l: 'Scheduled export or {SFTP}', st: 'pend', m: 'Files instead of a live link.', go: 'files' },
        { id: 'arch', l: 'Old archive', st: 'pend', m: 'Data that won’t change.', go: 'files' },
        { id: 'multi', l: 'Several options', st: 'pend', m: 'Pick a main path and a fallback. Walk the main one.' },
        { id: 'none', l: 'Vendor decides', st: 'unk', m: 'Everything depends on the vendor.', go: 'vendor' },
        { id: 'ui', l: 'Browser login only', st: 'no', m: 'That is not data access.', go: 'vendor' },
      ] },
    ],
  },
  {
    id: 'database', n: 5, title: 'Database', sub: 'Production or replica.',
    q: [
      { id: 'd_prod', ask: 'Is read-only on production OK? Does the vendor require anything first?', a: [
        { id: 'ok', l: 'Allowed, nothing needed', st: 'ok', m: 'Production path is open.' },
        { id: 'cond', l: 'Allowed with conditions', st: 'pend', m: 'The condition is a dependency.', do: 'Agency IT: resolve the production-access condition' },
        { id: 'rep', l: 'Replica required', st: 'pend', m: 'Switch to the replica questions below.' },
        { id: 'deny', l: 'Denied, no replica known', st: 'no', m: 'Vendor or another method.', go: 'vendor' },
      ] },
      { id: 'd_server', ask: 'Server CPU, memory, disk, and how much is free?', a: [
        { id: 'known', l: 'Known, no concern', st: 'ok', m: 'Record it.' },
        { id: 'unk', l: 'Unknown', st: 'pend', m: 'DBA sends it after the call.', do: 'Agency DBA: provide server specs' },
        { id: 'press', l: 'Server is already strained', st: 'pend', m: 'Engineering and the DBA agree a safe approach, or use a replica.', do: 'Engineering: review load approach with the DBA' },
        { id: 'load', l: '“How much load will you add?”', st: 'pend', m: 'Depends on their data and schedule. Get a specific answer.', say: 'It depends on your data and schedule. Let me get you a specific answer from our engineers.', do: 'Engineering: answer the load question' },
      ] },
      { id: 'd_rep', ask: 'Does a replica exist? Is it supported and licensed?', a: [
        { id: 'yes', l: 'Exists and supported', st: 'ok', m: 'Get the DBA and environment.' },
        { id: 'yesr', l: 'Exists, support unconfirmed', st: 'pend', m: 'Confirm support.' },
        { id: 'plan', l: 'Not built yet, but licensed and resourced', st: 'pend', m: 'Planned replica.', do: 'Agency DBA: provision the replica' },
        { id: 'lic', l: 'License or server missing', st: 'pend', m: 'Needs a quote and agency funding.', go: 'vendor' },
        { id: 'test', l: 'Only a test copy', st: 'unk', m: 'Not the real data.', do: 'Agency DBA: identify an operational replica' },
        { id: 'nobody', l: 'Nobody can build it', st: 'no', m: 'Path is closed without the vendor.', go: 'vendor' },
      ] },
      { id: 'd_fresh', ask: 'Is the replica complete and fresh? Who watches it?', a: [
        { id: 'full', l: 'Complete and fresh enough', st: 'ok', m: 'Meets the need.' },
        { id: 'part', l: 'Partial', st: 'unk', m: 'Coverage gap. Find out what is missing.' },
        { id: 'late', l: 'Delayed', st: 'unk', m: 'Compare the delay to what the workflow needs.', do: 'Solutions: compare refresh delay to workflow needs' },
        { id: 'unk', l: 'Unknown', st: 'unk', m: 'Open until confirmed.', do: 'Agency DBA: confirm completeness and refresh' },
        { id: 'custom', l: 'Home-made replication script', st: 'unk', m: 'Not production-ready by default.', do: 'Engineering: review the custom replication' },
      ] },
      { id: 'd_creds', ask: 'Who gives host, port, database names and a read-only account? Is there a {schema}?', a: [
        { id: 'dba', l: 'Agency DBA can', st: 'ok', m: 'Request the details and an approved way to hand over the credential.', do: 'Agency DBA: provide endpoint details and arrange credential handoff' },
        { id: 'vendor', l: 'Only the vendor can', st: 'unk', m: 'Vendor dependency.', go: 'vendor' },
        { id: 'names', l: 'Can only see database names', st: 'unk', m: 'Seeing is not reading. Need read permission per database.', do: 'Agency DBA: grant per-database read permissions' },
        { id: 'noschema', l: 'No schema', st: 'pend', m: 'Find who understands the data model.', do: 'Agency IT: identify a data-model expert' },
        { id: 'engine', l: 'Unusual database technology', st: 'pend', m: 'Record engine and version. “SQL” does not mean SQL Server.', do: 'Engineering: validate the connector' },
      ] },
      { id: 'd_cover', ask: 'Does it include everything we need, and only what they may share?', a: [
        { id: 'ok', l: 'Yes', st: 'ok', m: 'Covered.' },
        { id: 'narr', l: 'Narratives or media missing', st: 'unk', m: 'Coverage gap.', do: 'Agency IT: find a supported path to narratives and media' },
        { id: 'hist', l: 'Limited history or fields', st: 'unk', m: 'AE reviews scope.', do: 'AE: scope review' },
        { id: 'mixed', l: 'Other agencies’ data mixed in', st: 'pend', m: 'The owner draws the line on what we may see.', do: 'Agency owner: define the authorized data boundary' },
        { id: 'filter', l: '“Take it all, filter later”', st: 'no', m: 'Stop. Authorized-access design comes first.', do: 'Solutions / Security: authorized-access design review' },
      ] },
      { id: 'd_media', ask: 'Where do mugshots, reports and attachments live?', a: [
        { id: 'same', l: 'Same database', st: 'ok', m: 'Covered.' },
        { id: 'sep', l: 'Separate file server or API', st: 'pend', m: 'Treat it as its own system with its own approvals.', go: 'approval' },
        { id: 'na', l: 'Not needed', st: 'ok', m: 'Confirmed out of scope.' },
        { id: 'prop', l: 'Proprietary or encrypted', st: 'unk', m: 'Engineering checks feasibility.', do: 'Engineering: media format feasibility' },
      ] },
      { id: 'd_updates', ask: 'How will we see updates, deletions and {expungements}?', a: [
        { id: 'known', l: 'Known mechanism', st: 'ok', m: 'Write it down for the integration team.' },
        { id: 'unk', l: 'Unknown', st: 'unk', m: 'Engineering reviews.', do: 'Engineering: review incremental update approach' },
        { id: 'rims', l: 'Sun Ridge RIMS', st: 'pend', m: 'Needs {change tracking} turned on by the vendor. See Vendor notes.', go: 'vendor' },
        { id: 'static', l: 'Static archive', st: 'ok', m: 'Needs an expungement process. See Old data.', go: 'files' },
      ] },
    ],
  },
  {
    id: 'api', n: 6, title: 'API', sub: 'Documented, bulk, and someone to grant it.',
    q: [
      { id: 'a_exists', ask: 'Is there a documented API, and can the agency get third-party access?', a: [
        { id: 'yes', l: 'Documented and available', st: 'ok', m: 'Check coverage next.' },
        { id: 'fees', l: 'Exists, approval or fees pending', st: 'pend', m: 'Vendor dependency.', go: 'vendor' },
        { id: 'nodocs', l: 'Exists, no docs or terms', st: 'unk', m: 'Access unconfirmed.', do: 'Vendor: provide API docs and third-party terms' },
        { id: 'none', l: 'No API', st: 'no', m: 'Back to Access method.', go: 'method' },
      ] },
      { id: 'a_cover', ask: 'Does it give history, fields, narratives and updates in {bulk}, or one search at a time?', a: [
        { id: 'conf', l: 'Bulk plus updates, in the docs', st: 'ok', m: 'Coverage is evidenced.' },
        { id: 'bulk', l: 'Bulk plus updates, claimed', st: 'pend', m: 'Get the docs.', do: 'Solutions / Engineering: validate API docs' },
        { id: 'search', l: 'Search-only or metadata-only', st: 'no', m: 'Lookups are not the full data. Scope risk.', do: 'Solutions / AE: review API limits' },
        { id: 'limits', l: 'Rate limits or short history', st: 'unk', m: 'Capture the exact terms.', do: 'Engineering: review API limits' },
        { id: 'unk', l: 'Unknown', st: 'unk', m: 'Vendor provides details.', do: 'Vendor: provide API coverage details' },
      ] },
      { id: 'a_acct', ask: 'Who creates the API account? Any fees?', a: [
        { id: 'clear', l: 'Clear person, no fees', st: 'ok', m: 'Account plan recorded.' },
        { id: 'feesp', l: 'Clear person, fees apply', st: 'pend', m: 'Review costs.', go: 'vendor' },
        { id: 'vendor', l: 'Vendor required', st: 'unk', m: 'Vendor dependency.', go: 'vendor' },
        { id: 'have', l: 'Credentials already exist', st: 'pend', m: 'Verify agency, product and scopes. Never paste secrets anywhere.' },
        { id: 'priv', l: 'Endpoint is on a private network', st: 'pend', m: 'Needs the network questions.', go: 'network' },
      ] },
    ],
  },
  {
    id: 'files', n: 7, title: 'Files & old data', sub: 'Exports, feeds, and archives that no longer change.',
    q: [
      { id: 'f_type', ask: 'One-time export or a recurring feed? Why files instead of a direct link?', a: [
        { id: 'once', l: 'One-time archive', st: 'pend', m: 'Old-data questions below.' },
        { id: 'recur', l: 'Recurring feed', st: 'pend', m: 'Needs a feasibility review.' },
        { id: 'bridge', l: 'Temporary bridge', st: 'pend', m: 'Track the deadline for switching.' },
        { id: 'only', l: 'Only method allowed', st: 'pend', m: 'Feasibility review. Not approved or rejected yet.' },
      ] },
      { id: 'f_build', ask: 'Who builds and maintains the export, and what is in it?', a: [
        { id: 'ok', l: 'Maintained and complete', st: 'ok', m: 'Record format and owner.' },
        { id: 'vendor', l: 'Vendor must write it', st: 'unk', m: 'Vendor dependency.', go: 'vendor' },
        { id: 'noschema', l: 'IT can export, no schema', st: 'pend', m: 'Define requirements together.', do: 'DS / Engineering: define export requirements' },
        { id: 'partial', l: 'Partial or a manual report from the UI', st: 'unk', m: 'Won’t hold up over time.' },
      ] },
      { id: 'f_sched', ask: 'How often do files arrive? How are deletions handled? Who fixes a missed transfer?', a: [
        { id: 'clear', l: 'Clear design', st: 'pend', m: 'Engineering reviews fit.', do: 'Engineering: review feed design' },
        { id: 'manual', l: 'Manual or irregular', st: 'unk', m: 'Not live data.' },
        { id: 'nodel', l: 'No deletion handling', st: 'unk', m: 'Compliance issue. Needs a design.', do: 'Engineering / Compliance: design deletion handling' },
        { id: 'noowner', l: 'No schedule or owner', st: 'no', m: 'Unsustainable.' },
      ] },
      { id: 'l_where', ask: 'Where does the old data live, in what format, and how much is there?', a: [
        { id: 'ok', l: 'Accessible, owner confirms', st: 'ok', m: 'Confirmed.' },
        { id: 'rep', l: 'Accessible, unconfirmed', st: 'pend', m: 'Confirm the history later.' },
        { id: 'prop', l: 'Proprietary or encrypted', st: 'unk', m: 'Feasibility review.', do: 'Engineering: request schema or sample via approved channel' },
        { id: 'ui', l: 'Browser login only', st: 'no', m: 'Not data access.', go: 'vendor' },
        { id: 'backup', l: 'Vendor will hand over a backup', st: 'pend', m: 'Get format, owner, delivery and authorization.', do: 'Vendor: confirm backup format and delivery' },
      ] },
      { id: 'l_cutover', ask: 'When does the old system shut off? Does anything migrate?', a: [
        { id: 'kept', l: 'Old system stays', st: 'ok', m: 'Note static vs active.' },
        { id: 'date', l: 'Shut-off date known', st: 'pend', m: 'Export before it goes.', do: 'Agency IT: plan export before decommission' },
        { id: 'both', l: 'Both active, new one replacing it', st: 'pend', m: 'The new system is its own system.', do: 'AE: scope review for the replacement' },
        { id: 'done', l: '“Migration is done”', st: 'unk', m: 'Ask what was left out.', say: 'Which fields, history or documents were not migrated?' },
      ] },
      { id: 'l_expunge', ask: 'Once data stops updating, who tells us about expungements?', a: [
        { id: 'ok', l: 'Process agreed', st: 'ok', m: 'Write it down for handoff.' },
        { id: 'unk', l: 'Unknown', st: 'pend', m: 'Agree a process.', do: 'Agency records owner: agree an expungement process' },
        { id: 'replace', l: 'They want Peregrine as system of record', st: 'no', m: 'Don’t promise that.', do: 'Solutions: review system-of-record request' },
      ] },
    ],
  },
  {
    id: 'vendor', n: 8, title: 'Vendor', sub: 'When the software company has to do something.',
    q: [
      { id: 'v_what', ask: 'What exactly must the vendor do?', a: [
        { id: 'acct', l: 'Create a database or API account', st: 'pend', m: 'Agency requests exactly that.', do: 'Agency: request the account from the vendor' },
        { id: 'build', l: 'License, replica or export work', st: 'pend', m: 'Write down the deliverable and who maintains it.' },
        { id: 'deny', l: 'Vendor denies all usable access', st: 'no', m: 'Ask for the written policy and alternatives.', do: 'Agency: request written vendor policy and alternatives' },
        { id: 'prec', l: '“Another agency got it”', st: 'unk', m: 'Another agency’s deal does not carry over.' },
      ] },
      { id: 'v_cost', ask: 'Fees? Written quote? Who pays?', a: [
        { id: 'ok', l: 'Quote and funding confirmed', st: 'ok', m: 'Record amount, one-time vs recurring, payer.' },
        { id: 'est', l: 'Estimate or an old number', st: 'pend', m: 'Estimate only.', do: 'Agency: request a current written quote' },
        { id: 'unk', l: 'Unknown', st: 'unk', m: 'Open.', do: 'Agency: confirm vendor fees' },
        { id: 'peregrine', l: 'They assume Peregrine pays', st: 'no', m: 'Clarify now.', do: 'AE / Deal Desk: clarify who pays' },
        { id: 'rej', l: 'Rejected or unfunded', st: 'no', m: 'Stalled.' },
      ] },
      { id: 'v_commit', ask: 'Has the vendor committed, on the agency’s current version? Lead time?', a: [
        { id: 'ok', l: 'Written commitment', st: 'ok', m: 'Record it.' },
        { id: 'future', l: 'Future release only', st: 'pend', m: 'Not available until released.', do: 'AE: track the vendor release' },
        { id: 'none', l: 'No commitment or date', st: 'unk', m: 'Follow up.', do: 'Agency: get vendor commitment and lead time' },
        { id: 'refuse', l: 'Vendor refuses', st: 'no', m: 'Tell your AE. Needs escalation.' },
      ] },
    ],
    notes: [
      ['CentralSquare', [
        ['Cloud', 'Flagged as real risk. Needs current-case validation from Solutions / Deal Desk.'],
        ['On-prem with a replica', 'Check replica completeness and freshness.'],
        ['On-prem, no replica, has DBA and resources', 'Plan a replica.'],
        ['On-prem, no replica, no DBA', 'High risk.'],
      ]],
      ['Spillman', [
        ['Has a replica', 'Check completeness and freshness.'],
        ['Flex Replication module plus SQL resources', 'Plan a replica.'],
        ['Module not licensed', 'Needs a current quote plus a SQL server plan.'],
        ['Module but no SQL capacity', 'The module alone does not solve access.'],
      ]],
      ['Motorola', [
        ['Data Exchange API suggested', 'Not the bulk alternative we need.'],
        ['“You’re on the approved vendor list”', 'That list is for write-back, not read-only.'],
      ]],
      ['Mark43', [
        ['Need', 'Data Lake SQL access, API access, and the entity permissions feed.'],
        ['Not requested yet', 'Agency files a Mark43 support request with DS copied.'],
        ['Delayed', 'Follow the internal escalation. Keep it internal.'],
      ]],
      ['Sun Ridge RIMS', [
        ['Need', 'Read-only on RIMS, RIMS_IMAGES and RIMS_Sharing with change tracking on.'],
        ['Login but no change tracking', 'Agency asks the vendor to enable it.'],
        ['Neither', 'Agency gets a quote.'],
      ]],
      ['Southern Software', [
        ['Agency can provision', 'Direct database path. Precedent is a per-database datareader.'],
        ['Vendor-only control', 'Needs vendor commitment.'],
        ['“Wait for Nucleus”', 'A future release is not access today. Ask about the current version.'],
        ['$1,250 charge mentioned', 'Treat as an estimate.'],
      ]],
    ],
  },
  {
    id: 'security', n: 9, title: 'Security & CJIS', sub: 'What has to happen before anyone touches data.',
    q: [
      { id: 'c_steps', ask: 'What security or compliance steps come before access?', a: [
        { id: 'defined', l: 'Defined requirements', st: 'ok', m: 'Record each one with an owner and trigger.' },
        { id: 'fl', l: 'Florida', st: 'pend', m: '{FDLE} cloud plan, vendor questionnaire and personnel clearance come first.', do: 'Florida team: submit FDLE cloud materials' },
        { id: 'state', l: '{CLETS}, another state, or Canada', st: 'pend', m: 'Capture the exact process. Don’t apply Florida rules.', do: 'Security / Compliance: review the jurisdiction' },
        { id: 'none', l: 'No extra process', st: 'ok', m: 'Baseline {CJIS} obligations still apply.' },
      ] },
      { id: 'c_contact', ask: 'Who is the CJIS or security contact? What approvals, and what can run in parallel?', a: [
        { id: 'clear', l: 'Clear', st: 'ok', m: 'Map approvals and dependencies.' },
        { id: 'noowner', l: 'Documents requested, no owner', st: 'unk', m: 'Find the owner.', do: 'AE: identify the compliance document owner' },
        { id: 'cert', l: 'Wants assurances beyond our FAQ', st: 'pend', m: 'Don’t improvise.', say: 'Let me confirm with our security team.', do: 'Security / Compliance: respond' },
        { id: 'block', l: 'Nothing until approval', st: 'pend', m: 'No access until approved. Planning can continue.' },
      ] },
      { id: 'c_staff', ask: 'Fingerprints, background checks, training for our staff?', a: [
        { id: 'new', l: 'New checks required', st: 'pend', m: 'Get the process and roster needs.', do: 'Agency compliance POC: provide backgrounding process' },
        { id: 'reuse', l: 'Existing prints may count', st: 'pend', m: 'Never assume waived. Get explicit acceptance.', do: 'Agency compliance POC: confirm acceptance of existing artifacts' },
        { id: 'unclear', l: 'Unclear per person', st: 'unk', m: 'Stays open per person.' },
        { id: 'escort', l: 'Escort or no-access exception', st: 'unk', m: 'Agency confirms the exact boundary.' },
      ] },
      { id: 'c_recip', ask: 'Will they accept CJIS training and prints from another agency?', a: [
        { id: 'yes', l: 'Yes', st: 'ok', m: 'Record who verifies.' },
        { id: 'mou', l: 'Fingerprint {MOU} possible', st: 'pend', m: 'Pending until signed.', do: 'Agency compliance POC: pursue fingerprint MOU' },
        { id: 'no', l: 'No', st: 'pend', m: 'Follow their requirements.' },
        { id: 'unk', l: 'Unknown', st: 'unk', m: 'Agency decides.' },
      ] },
    ],
  },
  {
    id: 'signin', n: 10, title: 'Sign-in', sub: 'How their people will log in to Peregrine.',
    q: [
      { id: 's_how', ask: 'How do users sign in today? {SAML} (Entra, Okta, ADFS), {LDAP}, or something else?', a: [
        { id: 'saml', l: 'SAML provider', st: 'ok', m: 'Cloud sign-in. No network needed.' },
        { id: 'adsaml', l: '“AD”, confirmed hybrid or federated', st: 'ok', m: 'That is SAML. No network needed.' },
        { id: 'adldap', l: '“AD”, on-prem LDAP only', st: 'pend', m: 'Needs a reachable server and a service account.' },
        { id: 'ldap', l: 'Pure LDAP', st: 'pend', m: 'Needs a reachable server and a service account.' },
        { id: 'none', l: 'No provider', st: 'unk', m: 'Approved fallback only. Don’t mix with system accounts.' },
        { id: 'oidc', l: '{OIDC} only', st: 'unk', m: 'Not in our docs. Confirm support.', do: 'Collab / Solutions: confirm OIDC support' },
      ] },
      { id: 's_who', ask: 'Who configures sign-in and approves roles? {MFA} or shared workstations?', a: [
        { id: 'clear', l: 'Clear owner', st: 'ok', m: 'Hand off for setup later.', do: 'Collab: SSO setup and test' },
        { id: 'roles', l: 'Roles or MFA unclear', st: 'unk', m: 'Owner and Collab review.' },
        { id: 'shared', l: 'Shared workstations', st: 'pend', m: 'Flag {Force AuthN} for implementation.' },
        { id: 'mgd', l: 'Wants Peregrine-managed logins', st: 'unk', m: 'Confirm it is permitted, plus MFA and admin.' },
      ] },
    ],
  },
  {
    id: 'gis', n: 11, title: 'GIS', sub: 'Maps and layers.',
    q: [
      { id: 'g_who', ask: 'Who manages GIS, and which layers would help?', a: [
        { id: 'yes', l: 'Owner and layers known', st: 'ok', m: 'Pick a delivery method.' },
        { id: 'no', l: 'No GIS', st: 'ok', m: 'Out of scope.' },
        { id: 'unsure', l: 'Not sure', st: 'unk', m: 'Ask for a contact and layer list.', do: 'Agency: provide GIS contact and layer inventory' },
      ] },
      { id: 'g_how', ask: 'Read-only {ESRI} account, or static files?', a: [
        { id: 'esri', l: 'Read-only ESRI', st: 'pend', m: 'Live layers.', do: 'GIS owner: provision read-only ESRI account' },
        { id: 'files', l: 'Static files', st: 'ok', m: 'Updates only when they send new files.', do: 'GIS owner: send layer files' },
        { id: 'priv', l: 'GIS is on a private network', st: 'pend', m: 'Needs the network questions.', go: 'network' },
        { id: 'unk', l: 'Unknown or restricted', st: 'unk', m: 'Follow up.' },
      ] },
    ],
  },
  {
    id: 'sharing', n: 12, title: 'Sharing', sub: 'Letting other agencies see their data.',
    q: [
      { id: 'h_scope', ask: 'Is sharing with other agencies in scope? Who approves?', a: [
        { id: 'yes', l: 'Yes', st: 'pend', m: 'Capture the agreement.' },
        { id: 'no', l: 'No', st: 'ok', m: 'Recorded.' },
        { id: 'maybe', l: 'Interested, undecided', st: 'unk', m: 'Not enabled.', do: 'CA / AE: sharing follow-up' },
        { id: 'third', l: 'Includes third-party data', st: 'unk', m: 'The owner of that data must authorize it.' },
      ] },
      { id: 'h_agree', ask: 'What agreement is needed, and what can be shared?', a: [
        { id: 'fl', l: 'Florida', st: 'pend', m: 'CA manages sharing. {3PA} preferred.', do: 'CA: confirm sharing process' },
        { id: 'other', l: 'Other jurisdiction', st: 'pend', m: 'Route the current legal process.', do: 'CA / Legal: route sharing agreement' },
        { id: 'exec', l: 'Agreement already signed', st: 'ok', m: 'Verify scope and parties.' },
        { id: 'pend', l: 'Pending or denied', st: 'unk', m: 'No sharing yet.' },
      ] },
    ],
  },
  {
    id: 'changes', n: 13, title: 'Changes coming', sub: 'Next 12 to 18 months.',
    q: [
      { id: 'x_changes', ask: 'Any changes to vendors, hosting, networks, owners or sign-in coming?', a: [
        { id: 'none', l: 'None known', st: 'ok', m: 'Recorded.' },
        { id: 'mig', l: 'Vendor or hosting migration', st: 'pend', m: 'Treat the new system separately. See Old data for the cutover.', go: 'files' },
        { id: 'owner', l: 'Network, identity or owner change', st: 'pend', m: 'Get the new owner and timing. Recheck affected answers.', do: 'DS / SE: revalidate affected facts' },
        { id: 'unsure', l: 'Not sure', st: 'unk', m: 'Ask the relevant owner.', do: 'Agency IT: confirm upcoming changes' },
      ] },
    ],
  },
];

// Works for any question.
export const ANY = [
  { l: 'Unknown', m: 'Stays unknown. Ask who could confirm and get an intro.', say: 'Who could confirm that? Could you introduce us?' },
  { l: 'Not their area', m: 'Nothing is approved. Get the team and the person.', say: 'Which team handles that, and who specifically?' },
  { l: 'Denied', m: 'Ask what exactly is restricted and whether a supported alternative exists.', say: 'What exactly is restricted, and is there a supported alternative?' },
  { l: 'Two different answers', m: 'Disputed until someone with authority settles it.', say: 'I’m hearing two answers. Who has the final say?' },
  { l: 'I don’t know', m: 'Don’t guess. Route it: network → Networking, connectors → Solutions / Engineering, compliance → Security, contracts → AE / Legal.', say: 'Let me confirm with our team and follow up.' },
];

// What combinations mean. Each rule gets the answer map and returns text or null.
export const COMBOS = [
  { st: 'no', t: (a) => a.host === 'onprem' && a.n_method === 'none' && 'On their network, but no permanent connection allowed. Files are the only path, and files need a feasibility review.' },
  { st: 'no', t: (a) => a.host === 'onprem' && (a.n_run === 'nobody' || a.n_plan === 'none') && 'On their network and nobody can run the link. This system can’t be reached yet. Networking consult first.' },
  { st: 'pend', t: (a) => a.host === 'onprem' && a.n_method === 'ipsec' && 'IPSec means their firewall team does the work. Nothing moves until a firewall owner is named.' },
  { st: 'pend', t: (a) => a.host === 'onprem' && a.n_method === 'connect' && 'Connect means they host a VM for us. Nothing moves until someone confirms they can run it.' },
  { st: 'unk', t: (a) => a.host === 'cloud' && (a.method === 'none' || a.method === 'ui') && 'Cloud system with no database or API. Everything depends on the vendor.' },
  { st: 'no', t: (a) => a.method === 'prod' && a.d_prod === 'deny' && 'Production denied and no replica. The database path is closed. Vendor or another method.' },
  { st: 'pend', t: (a) => a.d_rep === 'lic' && 'Replica needed but not licensed. Cost and funding before anything moves.' },
  { st: 'unk', t: (a) => (a.d_fresh === 'part' || a.d_fresh === 'late') && 'Replica exists but is incomplete or delayed. The data may not match what the workflows need.' },
  { st: 'no', t: (a) => a.method === 'api' && a.a_cover === 'search' && 'API is search-only. That is lookups, not the data. Scope conversation with the AE.' },
  { st: 'no', t: (a) => a.f_type === 'recur' && a.f_sched === 'noowner' && 'Recurring files with no owner or schedule. This will not hold up.' },
  { st: 'no', t: (a) => (a.v_what || a.v_commit) && (a.v_cost === 'unk' || a.v_cost === 'peregrine' || a.v_cost === 'rej') && 'Vendor has to do work and money is unclear. Stalled until cost and payer are settled.' },
  { st: 'no', t: (a) => (a.v_commit === 'refuse' || a.auth === 'deny' || a.v_what === 'deny') && 'Access is denied somewhere. Tell your AE right after the call. It needs escalation.' },
  { st: 'pend', t: (a) => (a.s_how === 'adldap' || a.s_how === 'ldap') && a.host !== 'onprem' && 'LDAP sign-in but no network plan. LDAP needs a link to their directory. Add a network path or switch to SAML.' },
  { st: 'pend', t: (a) => (a.s_how === 'adldap' || a.s_how === 'ldap') && a.host === 'onprem' && 'LDAP sign-in rides on the same network link. If the network stalls, sign-in stalls.' },
  { st: 'pend', t: (a) => a.c_contact === 'block' && 'Security blocks everything until approval. Plan the technical work, connect nothing yet.' },
  { st: 'pend', t: (a) => a.c_steps === 'fl' && 'Florida. FDLE paperwork and clearance come before access. Start them now.' },
  { st: 'no', t: (a) => a.d_cover === 'filter' && '“Filter later” is a stop sign. Authorized-access design before any ingestion.' },
  { st: 'pend', t: (a) => a.d_media === 'sep' && 'Media on a separate server is a second system with its own approvals.' },
  { st: 'pend', t: (a) => a.auth === 'tent' && a.method && 'A method is picked but approval is only “should be fine”. Nothing is approved yet.' },
  { st: 'unk', t: (a) => a.product === 'test' && 'Only a test copy. Whatever else is answered, it is not the real data.' },
  { st: 'unk', t: (a) => a.n_reach === 'vpn' && 'An existing city–county VPN does not carry over to us. The county has to confirm separately.' },
  { st: 'pend', t: (a) => a.auth === 'yes' && a.method && !a.d_creds && !a.a_acct && 'Approved and a method picked. Still need to know who actually creates the account.' },
];

export const TERMS = {
  'IPSec': 'A secure tunnel from their firewall to us. Their firewall team sets it up and keeps it running.',
  'Peregrine Connect': 'A small virtual machine they host. We manage the software on it. It pulls data out; nothing is pushed in.',
  'VM': 'Virtual machine. A computer that runs inside another computer. Their virtualization team owns it.',
  'read-only': 'Can look, cannot change. Still uses the server’s resources.',
  'Production': 'The live system people use every day. Read-only queries still add load.',
  'Replica': 'A copy of the data. Check it is complete, fresh, supported and paid for.',
  'API': 'A way for software to ask a system for data. Must be documented and give bulk data, not just one record at a time.',
  'bulk': 'Everything, on an ongoing basis. The opposite is one search at a time.',
  'SFTP': 'Secure file transfer. A folder files get dropped into. One-time is easy; recurring needs an owner.',
  'schema': 'The map of the tables and fields. Without it, nobody knows what the data means.',
  'expungements': 'Court-ordered removal of records. We must be able to remove them too.',
  'change tracking': 'A signal that says which records changed. Without it we cannot see updates.',
  'CJIS': 'FBI security rules for criminal justice data. Governs who can touch it and how.',
  'FDLE': 'Florida Department of Law Enforcement. Florida’s extra approvals for cloud and people.',
  'CLETS': 'California’s law-enforcement telecom system. Has its own rules.',
  'MOU': 'Memorandum of understanding. A signed agreement for one specific purpose.',
  '3PA': 'Third-party agreement for sharing data with another agency.',
  'SAML': 'Cloud single sign-on. Entra, Okta, ADFS. No network link needed.',
  'LDAP': 'Older directory sign-in. Needs a network link to their server and a service account.',
  'OIDC': 'Another sign-in standard. Not in our docs yet.',
  'MFA': 'Multi-factor authentication. A second step at login.',
  'Force AuthN': 'Make people log in every time. Needed on shared workstations.',
  'ESRI': 'The main GIS software company. A read-only ESRI account gives us live map layers.',
};
