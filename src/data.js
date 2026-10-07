// TTAR content. Plain data, plain words.
// st: ok = good · pend = needs confirmation · unk = unknown · no = blocked
// go: section id this answer sends you to (for the flow arrows)

export const SECTIONS = [
  {
    id: 'system', n: 1, title: 'The server', sub: 'Their CAD or RMS data sits in a database on a server. Find out which server, and whether it’s on-prem or in the cloud.',
    q: [
      { id: 'host', ask: 'Is the server on-prem or in the cloud?', a: [
        { id: 'onprem', l: 'On-prem (their own server)', st: 'pend', m: 'Our servers can’t reach theirs until a network link is set up: an {IPSec} tunnel or {Peregrine Connect}.', go: 'network' },
        { id: 'cloud', l: 'The vendor hosts it in their cloud', st: 'ok', m: 'No network link needed. The vendor is the one who can give us access.', go: 'approval' },
        { id: 'third', l: 'The county or another agency hosts it', st: 'unk', m: 'The people in this meeting don’t control the server. Find out who does and who can approve access.', go: 'approval' },
        { id: 'hybrid', l: 'Split across more than one place', st: 'pend', m: 'Each server is its own set of questions. Go through them one at a time.' },
      ] },
      { id: 'product', ask: 'What’s the software? Vendor, product, version. And is that the live system or a test copy?', a: [
        { id: 'prod', l: 'They name the product and version, and it’s live', st: 'ok', m: 'Good. Check the Vendor notes for that product.' },
        { id: 'brand', l: 'They only say the vendor name (“it’s Motorola”)', st: 'unk', m: 'Vendors sell many products. Ask which one, and which version.', say: 'Which product within that vendor, and which version?' },
        { id: 'legacy', l: 'An old system nobody updates anymore', st: 'pend', m: 'The data never changes. Use the Files & old data questions.', go: 'files' },
        { id: 'test', l: 'A test or training copy, not the real one', st: 'unk', m: 'Fake data. Ask how we get to the live database.', do: 'Agency IT: tell us how to reach the live database' },
        { id: 'home', l: 'They built it themselves', st: 'ok', m: 'No vendor to deal with. Ask who maintains it and who understands the data.' },
      ] },
    ],
  },
  {
    id: 'network', n: 2, title: 'Network link', sub: 'Only if the server is on-prem. How our servers will talk to theirs.',
    q: [
      { id: 'n_owner', ask: 'Who manages your firewall and network?', a: [
        { id: 'exp', l: 'Network person is here and has done it before', st: 'ok', m: 'Write down their name and how they did it last time.' },
        { id: 'new', l: 'Network person is here, never done it', st: 'pend', m: 'Fine. Our Networking team walks them through it.', say: 'Our Networking team can walk through it with you.' },
        { id: 'else', l: 'Someone not in the room manages the network', st: 'unk', m: 'Get that person’s name. Nothing is approved until they say so.', do: 'AE: introduce the network person' },
      ] },
      { id: 'n_method', ask: 'Two ways to set up the link. An {IPSec} tunnel on your firewall, or a small VM we provide called {Peregrine Connect}. Connect is lower touch and most agencies pick it, but it’s 100% your call. Which do you prefer?', a: [
        { id: 'ipsec', l: 'IPSec tunnel', st: 'pend', m: 'Their firewall team sets it up.', do: 'DS: send the IPSec questionnaire' },
        { id: 'connect', l: 'Peregrine Connect', st: 'pend', m: 'They run a small virtual machine ({VM}) we provide. Ask if they have somewhere to run a VM.', do: 'DS: send the Connect questionnaire' },
        { id: 'help', l: 'They don’t know which', st: 'pend', m: 'Neither is wrong. Our Networking team helps them pick.', say: 'No wrong answer. IPSec lives on your firewall; Connect is a small VM you host. Our Networking team can walk you through either.' },
        { id: 'other', l: 'They insist on their own VPN or Zscaler', st: 'unk', m: 'Write down the exact product name. Don’t promise we support it.', do: 'Networking: review the mandated method' },
        { id: 'none', l: 'No permanent network link allowed, period', st: 'no', m: 'Then the only option is them sending us files. That needs a feasibility review.', go: 'files' },
      ] },
      { id: 'n_run', ask: 'Who on your side would set it up and keep it running?', a: [
        { id: 'yes', l: 'Yes, and they name who', st: 'ok', m: 'Send them the questionnaire after the call.' },
        { id: 'custom', l: 'They have special encryption or routing rules', st: 'pend', m: 'Write the rules down. Networking reviews them.', do: 'Networking: review their encryption and routing rules' },
        { id: 'nobody', l: 'Nobody on their side can manage it', st: 'no', m: 'This method won’t work. Networking helps pick another.', do: 'Networking: help pick a method' },
        { id: 'ips', l: 'They ask for our IP addresses and settings now', st: 'ok', m: 'Those get generated during provisioning, after the call.', say: 'Those come out of provisioning. I’ll make sure you get them as a next step.' },
        { id: 'agents', l: 'They want to install their security software on the Connect VM', st: 'pend', m: 'Usually fine. We can give them an admin login for it. Networking confirms.', do: 'Networking: confirm their security software can run on the Connect VM' },
      ] },
      { id: 'n_reach', ask: 'Is the database server on that same network, or is it behind a county or 911 network?', a: [
        { id: 'same', l: 'Same network, network person confirms it reaches', st: 'ok', m: 'Good plan. Not tested until it’s built.' },
        { id: 'other', l: 'The server is on a different network', st: 'unk', m: 'Go back and ask these network questions again for that network.' },
        { id: 'vpn', l: '“The city already has a VPN to the county”', st: 'unk', m: 'Their VPN doesn’t let us in. The county has to approve us separately.', do: 'County IT: approve a route for us' },
        { id: 'unk', l: 'Restricted, or nobody knows', st: 'unk', m: 'Follow up with their network person and our Networking team.' },
      ] },
      { id: 'n_plan', ask: 'Who should I send the networking questionnaire to?', a: [
        { id: 'agreed', l: 'Named a person, agreed on the method', st: 'ok', m: 'Network plan is set.', do: 'Agency IT: return the networking questionnaire' },
        { id: 'pend', l: 'Named a person, still needs internal review', st: 'pend', m: 'Planned, not confirmed.' },
      ] },
    ],
  },
  {
    id: 'approval', n: 3, title: 'Who can give us a login', sub: 'The person who “owns the data” is often not the person who can create a database login.',
    q: [
      { id: 'owner', ask: 'Three quick ones: who owns the data, who runs the database server, and who could create a read-only login for us?', a: [
        { id: 'agency', l: 'All three are agency staff', st: 'ok', m: 'Get all three names.' },
        { id: 'outside', l: 'The county, a consortium or the vendor is one of them', st: 'pend', m: 'Get a name for each role.', do: 'AE: introduce the outside party' },
        { id: 'own', l: '“We own the data” but nobody knows who creates logins', st: 'unk', m: 'Owning data isn’t the same as being able to create a database login.', say: 'Who would actually create the login and approve it?' },
      ] },
      { id: 'auth', ask: 'Are you OK giving us a {read-only} login to the database?', a: [
        { id: 'yes', l: 'Yes, from whoever controls the database', st: 'ok', m: 'Write down who said it and any limits.' },
        { id: 'tent', l: '“Should be fine” from someone else', st: 'pend', m: 'That is not a yes. Only whoever controls the database can say yes.', do: 'AE: get a yes from whoever controls the database' },
        { id: 'none', l: 'Whoever controls the database isn’t in the meeting', st: 'unk', m: 'Get an intro.', do: 'AE: introduce whoever controls the database' },
        { id: 'deny', l: 'No', st: 'no', m: 'Ask what exactly is off-limits and whether there is another way in.', say: 'What exactly is off-limits, and is there another way we could get it?' },
      ] },
      { id: 'prec', ask: 'Has another vendor ever pulled data from this database before?', a: [
        { id: 'db', l: 'Yes, with a read-only database login', st: 'ok', m: 'Great. We’re asking for the same thing.' },
        { id: 'alt', l: 'Yes, through a copy, an API or file exports', st: 'ok', m: 'Write down which, and who set it up.' },
        { id: 'never', l: 'Never', st: 'pend', m: 'First time. Expect more questions. Not a problem.' },
        { id: 'vague', l: '“Other companies use it” but no details', st: 'unk', m: 'Ask what kind of access those companies have and what data they get.', say: 'What kind of access did they have, and what data did it include?' },
      ] },
    ],
  },
  {
    id: 'method', n: 4, title: 'How we get the data out', sub: 'The fork. Each answer opens a different set of questions below.',
    q: [
      { id: 'method', ask: 'How would you get the data to us? A read-only login to the live database, a copy of it, an API, or files?', a: [
        { id: 'prod', l: 'A read-only login to the live database ({Production})', st: 'pend', m: 'We query the live database directly.', go: 'database' },
        { id: 'rep', l: 'A login to a copy of the database ({Replica})', st: 'pend', m: 'We query the copy, not the live database. Check the copy exists and is complete.', go: 'database' },
        { id: 'api', l: 'An {API} from the vendor', st: 'pend', m: 'The vendor’s software hands us data on request. Check it gives us everything, not just one record at a time.', go: 'api' },
        { id: 'file', l: 'They send us files on a schedule ({SFTP})', st: 'pend', m: 'No network link. Files get dropped in a folder.', go: 'files' },
        { id: 'arch', l: 'A one-time dump of old data', st: 'pend', m: 'Data that will never change again.', go: 'files' },
        { id: 'multi', l: 'More than one of these', st: 'pend', m: 'Pick a main one and a backup. Ask the questions for the main one.' },
        { id: 'none', l: '“Ask the vendor”', st: 'unk', m: 'The agency can’t do it alone. Everything depends on the vendor.', go: 'vendor' },
        { id: 'ui', l: 'A username and password to their website', st: 'no', m: 'That lets a person click around. It is not a way to pull data.', go: 'vendor' },
      ] },
    ],
  },
  {
    id: 'database', n: 5, title: 'Database login', sub: 'Questions for their database administrator ({DBA}).',
    q: [
      { id: 'd_prod', ask: 'Are you comfortable with us querying the live database? Does the vendor need to sign off?', a: [
        { id: 'ok', l: 'Yes, nothing else needed', st: 'ok', m: 'Live database path is open.' },
        { id: 'cond', l: 'Yes, with conditions', st: 'pend', m: 'Write the conditions down. Nothing happens until they’re met.', do: 'Agency IT: meet the live-database conditions' },
        { id: 'rep', l: 'No, we must use a copy', st: 'pend', m: 'Skip to the copy questions below.' },
        { id: 'deny', l: 'No, and there is no copy', st: 'no', m: 'Database path is closed. Vendor or files.', go: 'vendor' },
      ] },
      { id: 'd_server', ask: 'How big is that server, and how much headroom does it have?', a: [
        { id: 'known', l: 'They know, and there’s room', st: 'ok', m: 'Write it down.' },
        { id: 'unk', l: 'They don’t know offhand', st: 'pend', m: 'DBA sends it after the call.', do: 'Agency DBA: send server specs' },
        { id: 'press', l: 'Server is already maxed out', st: 'pend', m: 'Our Engineering and their DBA agree how to query it safely, or use a copy.', do: 'Engineering: agree a safe way to query with their DBA' },
        { id: 'load', l: 'They ask “how much will you slow it down?”', st: 'pend', m: 'Depends on how much data and how often. Get Engineering to answer specifically.', say: 'It depends on your data and schedule. Let me get you a specific answer from our engineers.', do: 'Engineering: answer the load question' },
      ] },
      { id: 'd_rep', ask: 'Do you already have a copy of the database? Is it supported and licensed?', a: [
        { id: 'yes', l: 'Yes, and the vendor supports it', st: 'ok', m: 'Get the DBA’s name and where the copy runs.' },
        { id: 'yesr', l: 'Yes, not sure the vendor supports it', st: 'pend', m: 'Confirm with the vendor.' },
        { id: 'plan', l: 'No, but they have the license and a server for it', st: 'pend', m: 'Their DBA builds it.', do: 'Agency DBA: build the copy' },
        { id: 'lic', l: 'No, and they lack the license or a server', st: 'pend', m: 'Costs money. Needs a quote and someone to pay.', go: 'vendor' },
        { id: 'test', l: 'Only a test copy with fake data', st: 'unk', m: 'Useless to us. Need a copy of the live data.', do: 'Agency DBA: find a copy with live data' },
        { id: 'nobody', l: 'Nobody on their side can build one', st: 'no', m: 'Closed unless the vendor does it.', go: 'vendor' },
      ] },
      { id: 'd_fresh', ask: 'Does the copy have all the tables? How far behind the live database does it run?', a: [
        { id: 'full', l: 'All tables, updated often enough', st: 'ok', m: 'Good.' },
        { id: 'part', l: 'Missing some tables', st: 'unk', m: 'Find out exactly which.' },
        { id: 'late', l: 'Lags behind by hours or days', st: 'unk', m: 'Ask how far behind, and whether that’s OK for how they’ll use Peregrine.', do: 'Solutions: check the lag is OK for how they’ll use Peregrine' },
        { id: 'unk', l: 'They don’t know', st: 'unk', m: 'Open until the DBA checks.', do: 'Agency DBA: confirm which tables the copy has and how often it updates' },
        { id: 'custom', l: 'Someone wrote their own script to copy it', st: 'unk', m: 'Fragile. Engineering reviews it.', do: 'Engineering: review the home-made copy script' },
      ] },
      { id: 'd_creds', ask: 'Who would send us the server address, database names, and the login? Do you have a {schema}?', a: [
        { id: 'dba', l: 'Their DBA can', st: 'ok', m: 'Ask for the details and agree a secure way to share the password. Never over email.', do: 'Agency DBA: send server address and database names; agree how to share the password' },
        { id: 'vendor', l: 'Only the vendor can', st: 'unk', m: 'Vendor has to do it.', go: 'vendor' },
        { id: 'names', l: 'They can see the database names but can’t grant access', st: 'unk', m: 'Seeing isn’t reading. Someone has to grant read permission on each database.', do: 'Agency DBA: grant read permission on each database' },
        { id: 'noschema', l: 'No schema or data dictionary', st: 'pend', m: 'Find whoever understands what the tables mean.', do: 'Agency IT: name who understands the tables' },
        { id: 'engine', l: 'It’s not SQL Server, Oracle or Postgres', st: 'pend', m: 'Write down the exact product and version. “SQL” alone doesn’t tell us anything.', do: 'Engineering: confirm we can connect to that database type' },
      ] },
      { id: 'd_cover', ask: 'Does the database have the history and fields you’ll want in Peregrine? Anything in there you’re not allowed to share?', a: [
        { id: 'ok', l: 'Has what we need, nothing off-limits', st: 'ok', m: 'Good.' },
        { id: 'hist', l: 'Only a few years of history, or missing fields', st: 'unk', m: 'AE checks whether that’s enough.', do: 'AE: scope review' },
        { id: 'mixed', l: 'Other agencies’ records are in the same database', st: 'pend', m: 'The data owner decides which records we may see.', do: 'Agency data owner: say which records we may see' },
        { id: 'filter', l: '“Just take everything, we’ll filter later”', st: 'no', m: 'Stop. We only take what they’re allowed to share. Design that first.', do: 'Security: design what we’re allowed to take' },
      ] },
      { id: 'd_media', ask: 'Where do report narratives, mugshots and attachments live? Same database, or a separate file server?', a: [
        { id: 'same', l: 'Same database', st: 'ok', m: 'Covered by the same login.' },
        { id: 'sep', l: 'A separate file server', st: 'pend', m: 'That’s a second server. Ask the login questions again for it.', go: 'approval' },
        { id: 'na', l: 'They don’t need those in Peregrine', st: 'ok', m: 'Out of scope. Write that down.' },
        { id: 'prop', l: 'Stored in a locked or vendor-specific format', st: 'unk', m: 'Engineering checks if we can read it.', do: 'Engineering: check we can read that format' },
      ] },
      { id: 'd_updates', ask: 'When a record gets edited, deleted or {expunged}, how would we know?', a: [
        { id: 'known', l: 'They can explain how', st: 'ok', m: 'Write it down for Engineering.' },
        { id: 'unk', l: 'They don’t know', st: 'unk', m: 'Engineering figures it out.', do: 'Engineering: work out how we’ll see changes' },
        { id: 'rims', l: 'It’s Sun Ridge RIMS', st: 'pend', m: 'The vendor must turn on {change tracking}. See Vendor notes.', go: 'vendor' },
        { id: 'static', l: 'Data never changes (old system)', st: 'ok', m: 'Still need a way to hear about expungements. See Files & old data.', go: 'files' },
      ] },
    ],
  },
  {
    id: 'api', n: 6, title: 'Vendor API', sub: 'The vendor’s software hands us data on request. Only as good as what it hands over.',
    q: [
      { id: 'a_exists', ask: 'Does the vendor have a documented {API}, and will they let us use it?', a: [
        { id: 'yes', l: 'Yes, documented and open to third parties', st: 'ok', m: 'Check what it gives us next.' },
        { id: 'fees', l: 'Yes, but needs vendor approval or costs money', st: 'pend', m: 'Vendor has to say yes.', go: 'vendor' },
        { id: 'nodocs', l: 'Supposedly, but no documentation', st: 'unk', m: 'Not real until we see docs.', do: 'Vendor: send API docs and third-party terms' },
        { id: 'none', l: 'No API', st: 'no', m: 'Back to “How we get the data out”.', go: 'method' },
      ] },
      { id: 'a_cover', ask: 'Does the API return everything in {bulk}, or one record per search?', a: [
        { id: 'conf', l: 'Everything, and the docs prove it', st: 'ok', m: 'Good.' },
        { id: 'bulk', l: 'Everything, they say', st: 'pend', m: 'Get the docs to confirm.', do: 'Engineering: check the API docs' },
        { id: 'search', l: 'One record per search', st: 'no', m: 'We can’t load their data that way. Big problem for scope.', do: 'AE: scope review (API is search-only)' },
        { id: 'limits', l: 'Limited requests per day, or only recent records', st: 'unk', m: 'Write down the exact limits.', do: 'Engineering: review API limits' },
        { id: 'unk', l: 'They don’t know', st: 'unk', m: 'Vendor has to tell us.', do: 'Vendor: say what the API returns' },
      ] },
      { id: 'a_acct', ask: 'Who creates our API login, and does it cost anything?', a: [
        { id: 'clear', l: 'Named person, free', st: 'ok', m: 'Good.' },
        { id: 'feesp', l: 'Named person, costs money', st: 'pend', m: 'Go to Vendor for the money questions.', go: 'vendor' },
        { id: 'vendor', l: 'Only the vendor can', st: 'unk', m: 'Vendor has to do it.', go: 'vendor' },
        { id: 'have', l: 'A login already exists', st: 'pend', m: 'Check it’s for this agency and product, and what it can access. Never write the password down.' },
        { id: 'priv', l: 'The API is only reachable from inside their network', st: 'pend', m: 'Then we need a network link too.', go: 'network' },
      ] },
    ],
  },
  {
    id: 'files', n: 7, title: 'Files & old data', sub: 'They send us files instead of giving us a login. Or the data is from an old system.',
    q: [
      { id: 'f_type', ask: 'Is this a one-time export or an ongoing feed? And why files rather than a database login?', a: [
        { id: 'once', l: 'One dump of old data', st: 'pend', m: 'Use the old-data questions below.' },
        { id: 'recur', l: 'New files on a schedule', st: 'pend', m: 'Engineering has to confirm this works.' },
        { id: 'bridge', l: 'Files for now, database login later', st: 'pend', m: 'Get a date for the switch.' },
        { id: 'only', l: 'Files are the only thing they allow', st: 'pend', m: 'Engineering has to confirm this works. Not a yes or a no yet.' },
      ] },
      { id: 'f_build', ask: 'Who writes the export, who maintains it, and what’s in it?', a: [
        { id: 'ok', l: 'Their IT owns it and it has everything', st: 'ok', m: 'Write down the file format and the owner.' },
        { id: 'vendor', l: 'The vendor has to write it', st: 'unk', m: 'Vendor has to do it. Usually costs money.', go: 'vendor' },
        { id: 'noschema', l: 'Their IT can do it but doesn’t know what to include', st: 'pend', m: 'We tell them what we need.', do: 'DS: tell them what the export must include' },
        { id: 'partial', l: 'Someone clicks “export” in the software by hand', st: 'unk', m: 'Won’t last. Someone forgets, it stops.' },
      ] },
      { id: 'f_sched', ask: 'How often would files arrive? How would we learn a record was deleted? Who fixes it if a file doesn’t show up?', a: [
        { id: 'clear', l: 'They have answers for all three', st: 'pend', m: 'Engineering confirms it works for us.', do: 'Engineering: review feed design' },
        { id: 'manual', l: 'Whenever someone remembers', st: 'unk', m: 'Data will be stale.' },
        { id: 'nodel', l: 'No way to tell us about deletions', st: 'unk', m: 'Compliance problem. We’d keep records they removed.', do: 'Engineering: design how deletions reach us' },
        { id: 'noowner', l: 'No schedule and nobody owns it', st: 'no', m: 'Won’t work.' },
      ] },
      { id: 'l_where', ask: 'Where is the old data now, what format, and how many years?', a: [
        { id: 'ok', l: 'They can get to it and know what’s there', st: 'ok', m: 'Good.' },
        { id: 'rep', l: 'They can get to it, not sure what’s there', st: 'pend', m: 'Confirm what years and tables later.' },
        { id: 'prop', l: 'Locked in a vendor-specific format', st: 'unk', m: 'Engineering checks if we can read it.', do: 'Engineering: request a sample file through an approved channel' },
        { id: 'ui', l: 'Only reachable by logging into the old software', st: 'no', m: 'Not a way to pull data. Vendor has to export it.', go: 'vendor' },
        { id: 'backup', l: 'The old vendor will hand over a backup file', st: 'pend', m: 'Get format, who delivers it, and written permission.', do: 'Vendor: confirm backup format and delivery' },
      ] },
      { id: 'l_cutover', ask: 'When does the old system get switched off? Is the data moving into the new one?', a: [
        { id: 'kept', l: 'Old system stays on', st: 'ok', m: 'Note which is live and which is frozen.' },
        { id: 'date', l: 'Switch-off date is known', st: 'pend', m: 'Get the data out before that date.', do: 'Agency IT: export before the switch-off date' },
        { id: 'both', l: 'Both running, new one taking over', st: 'pend', m: 'The new one is a second server. Ask all the questions again for it.', do: 'AE: scope review for the replacement' },
        { id: 'done', l: '“Everything already moved to the new system”', st: 'unk', m: 'Something always gets left behind. Ask what.', say: 'Which fields, history or documents were not migrated?' },
      ] },
      { id: 'l_expunge', ask: 'Once that data is frozen, who tells us when a record gets expunged?', a: [
        { id: 'ok', l: 'They name a person and a process', st: 'ok', m: 'Write it down.' },
        { id: 'unk', l: 'Nobody has thought about it', st: 'pend', m: 'Agree a process before we load it.', do: 'Agency data owner: agree how expungements reach us' },
        { id: 'replace', l: 'They want Peregrine to be the official copy', st: 'no', m: 'Don’t agree to that.', do: 'Solutions: review system-of-record request' },
      ] },
    ],
  },
  {
    id: 'vendor', n: 8, title: 'Vendor', sub: 'When the software company (Southern Software, Motorola, etc.) has to do something.',
    q: [
      { id: 'v_what', ask: 'What exactly do you need the vendor to do?', a: [
        { id: 'acct', l: 'Just create a login for us', st: 'pend', m: 'Agency asks the vendor for exactly that, nothing more.', do: 'Agency: request the login from the vendor' },
        { id: 'build', l: 'Sell a license, build a database copy, or write an export', st: 'pend', m: 'Write down exactly what, and who maintains it after.' },
        { id: 'deny', l: 'Vendor says no to everything', st: 'no', m: 'Ask the agency to get the vendor’s policy in writing.', do: 'Agency: request written vendor policy and alternatives' },
        { id: 'prec', l: '“Another agency got it from them”', st: 'unk', m: 'Doesn’t carry over. Each agency’s contract is different.' },
      ] },
      { id: 'v_cost', ask: 'Does the vendor charge for that? Is there a written quote, and who pays?', a: [
        { id: 'ok', l: 'Written quote, and the agency will pay', st: 'ok', m: 'Write down the amount, one-time or yearly, and who pays.' },
        { id: 'est', l: 'A number from memory or an old quote', st: 'pend', m: 'Treat as a guess until there’s a written quote.', do: 'Agency: request a current written quote' },
        { id: 'unk', l: 'Nobody knows', st: 'unk', m: 'Agency has to ask the vendor.', do: 'Agency: confirm vendor fees' },
        { id: 'peregrine', l: 'They assume Peregrine pays', st: 'no', m: 'Don’t agree. AE and Deal Desk decide.', do: 'AE / Deal Desk: clarify who pays' },
        { id: 'rej', l: 'Agency won’t or can’t pay', st: 'no', m: 'Stuck.' },
      ] },
      { id: 'v_commit', ask: 'Has the vendor committed in writing, for the version you’re on today? What’s the lead time?', a: [
        { id: 'ok', l: 'Yes, in writing', st: 'ok', m: 'Save the email.' },
        { id: 'future', l: '“When the new version comes out”', st: 'pend', m: 'That’s not now. Ask what they can do on today’s version.', do: 'AE: track the vendor release' },
        { id: 'none', l: 'No answer yet', st: 'unk', m: 'Agency follows up.', do: 'Agency: get vendor commitment and lead time' },
        { id: 'refuse', l: 'Vendor refuses', st: 'no', m: 'Tell your AE right after the call.' },
      ] },
    ],
    notes: [
      ['CentralSquare', [
        ['Hosted in CentralSquare’s cloud', 'Known problem. Solutions / Deal Desk must check before anyone promises anything.'],
        ['Their own server, with a database copy', 'Check the copy has all tables and is current.'],
        ['Their own server, no copy, but they have a DBA and a spare server', 'Their DBA builds a copy.'],
        ['Their own server, no copy, no DBA', 'High risk. Likely stuck.'],
      ]],
      ['Spillman', [
        ['They have a database copy', 'Check it has all tables and is current.'],
        ['They own the “Flex Replication” add-on and a SQL server', 'Their DBA builds a copy.'],
        ['They don’t own the add-on', 'Needs a quote for it, plus a SQL server to run it on.'],
        ['Own the add-on, no server to run it on', 'The add-on alone does nothing.'],
      ]],
      ['Motorola', [
        ['They offer the “Data Exchange” API', 'Doesn’t give us everything. Not a substitute for a database login.'],
        ['“Peregrine is on Motorola’s approved vendor list”', 'That list is about writing data in, not reading it out. Doesn’t help here.'],
      ]],
      ['Mark43', [
        ['What we need', 'Three things: Data Lake SQL login, API login, and the “entity permissions” feed.'],
        ['Not requested yet', 'Agency opens a Mark43 support ticket and copies our DS.'],
        ['Mark43 is slow', 'We have an internal escalation path. Don’t tell the agency about it.'],
      ]],
      ['Sun Ridge RIMS', [
        ['What we need', 'Read-only login to three databases (RIMS, RIMS_IMAGES, RIMS_Sharing) with change tracking turned on.'],
        ['Have the login, change tracking is off', 'Agency asks Sun Ridge to turn it on.'],
        ['Have neither', 'Agency asks Sun Ridge for a quote.'],
      ]],
      ['Southern Software', [
        ['Agency hosts the SQL Server themselves', 'Their IT can create a read-only login. No vendor needed. We’ve done this before.'],
        ['Only Southern Software can touch the database', 'Vendor has to agree.'],
        ['“Wait for Nucleus”', 'Nucleus is their future product. Ask what works on the version they run today.'],
        ['“They charge $1,250 for integrations”', 'Only applies if the vendor does the work. A read-only login from agency IT avoids it.'],
      ]],
    ],
  },
  {
    id: 'security', n: 9, title: 'Security & CJIS', sub: 'Background checks and paperwork before our staff can touch their data.',
    q: [
      { id: 'c_steps', ask: 'What paperwork or approvals do you need from us before we get access?', a: [
        { id: 'defined', l: 'They list specific steps', st: 'ok', m: 'Write each one down with who handles it.' },
        { id: 'fl', l: 'They’re in Florida', st: 'pend', m: 'Florida has extra steps: {FDLE} cloud paperwork, a vendor questionnaire, and clearance for our people.', do: 'Florida team: submit FDLE cloud materials' },
        { id: 'state', l: 'California ({CLETS}), another state, or Canada', st: 'pend', m: 'Each has its own steps. Write down theirs. Don’t assume Florida’s.', do: 'Security: review that state’s steps' },
        { id: 'none', l: 'Nothing beyond the basics', st: 'ok', m: 'Standard {CJIS} rules still apply.' },
      ] },
      { id: 'c_contact', ask: 'Who’s your security or {CJIS} contact? Which approvals block us, and which can run in parallel?', a: [
        { id: 'clear', l: 'They name the person and the steps', st: 'ok', m: 'Write down what blocks what.' },
        { id: 'noowner', l: 'They want documents from us but nobody owns the process', st: 'unk', m: 'Find out who reviews them.', do: 'AE: find who reviews our security documents' },
        { id: 'cert', l: 'They ask security questions you can’t answer', st: 'pend', m: 'Don’t guess. Our Security team answers.', say: 'Let me confirm with our security team.', do: 'Security: answer their questions' },
        { id: 'block', l: '“Nothing happens until security approves”', st: 'pend', m: 'No access until then. Planning can continue.' },
      ] },
      { id: 'c_staff', ask: 'Do our people need fingerprinting, background checks or CJIS training? How do you verify it?', a: [
        { id: 'new', l: 'Yes, through their process', st: 'pend', m: 'Get the steps and the list of our people they need.', do: 'Agency security contact: send the fingerprint and training steps' },
        { id: 'reuse', l: 'Our existing prints or training might count', st: 'pend', m: '“Might” isn’t yes. Get it confirmed.', do: 'Agency security contact: confirm our existing prints and training count' },
        { id: 'unclear', l: 'Depends on the person', st: 'unk', m: 'Open until each person is cleared.' },
        { id: 'escort', l: 'Not needed if our staff are escorted or never see data', st: 'unk', m: 'Get the exact rule in writing.' },
      ] },
      { id: 'c_recip', ask: 'We’ve done CJIS training and fingerprints with other Florida agencies. Will you accept those?', a: [
        { id: 'yes', l: 'Yes', st: 'ok', m: 'Write down who checks them.' },
        { id: 'mou', l: 'Training yes, fingerprints need an {MOU} with the other county', st: 'pend', m: 'Pending until the MOU is signed.', do: 'Agency security contact: pursue the fingerprint MOU' },
        { id: 'no', l: 'No, redo everything', st: 'pend', m: 'Follow their process.' },
        { id: 'unk', l: 'They don’t know', st: 'unk', m: 'Their security contact decides.' },
      ] },
    ],
  },
  {
    id: 'signin', n: 10, title: 'User login', sub: 'How their officers and analysts will log in to Peregrine. Nothing to do with the database login.',
    q: [
      { id: 's_how', ask: 'How do your people log in today? Entra, Okta, ADFS, or on-prem Active Directory?', a: [
        { id: 'saml', l: 'Entra, Okta or ADFS', st: 'ok', m: 'Cloud login. Easy. No network link needed.' },
        { id: 'adsaml', l: '“Active Directory” that syncs to Microsoft cloud', st: 'ok', m: 'That counts as Entra. Easy. No network link needed.' },
        { id: 'adldap', l: '“Active Directory” on-prem only', st: 'pend', m: 'We need a network link to that server and a service login. Harder.' },
        { id: 'ldap', l: 'Some other LDAP directory', st: 'pend', m: 'We need a network link to that server and a service login. Harder.' },
        { id: 'none', l: 'Nothing, everyone has local passwords', st: 'unk', m: 'Peregrine can manage logins, if their security allows it. Confirm.' },
        { id: 'oidc', l: 'Something called {OIDC}', st: 'unk', m: 'We haven’t documented support. Confirm.', do: 'Collab: confirm OIDC support' },
      ] },
      { id: 's_who', ask: 'Who sets up single sign-on on your side? Do you require {MFA}? Any shared workstations?', a: [
        { id: 'clear', l: 'They name a person', st: 'ok', m: 'Hand off to Collab for setup later.', do: 'Collab: set up and test user login' },
        { id: 'roles', l: 'Not sure who decides access or about MFA', st: 'unk', m: 'Their login person and our Collab team sort it out.' },
        { id: 'shared', l: 'Officers share computers', st: 'pend', m: 'Flag {Force AuthN} so each person logs in fresh.' },
        { id: 'mgd', l: 'They want Peregrine to manage passwords', st: 'unk', m: 'Confirm their security allows it, and who administers it.' },
      ] },
    ],
  },
  {
    id: 'gis', n: 11, title: 'GIS', sub: 'Their maps: beats, districts, addresses.',
    q: [
      { id: 'g_who', ask: 'Who manages your GIS, and which layers would you want in Peregrine? Beats, districts, parcels?', a: [
        { id: 'yes', l: 'They name a person and the layers', st: 'ok', m: 'Ask how they’ll give them to us.' },
        { id: 'no', l: 'No maps needed', st: 'ok', m: 'Out of scope.' },
        { id: 'unsure', l: 'Not sure', st: 'unk', m: 'Ask for a GIS contact and a list of layers.', do: 'Agency: name a GIS contact and list the layers' },
      ] },
      { id: 'g_how', ask: 'Can you give us a read-only {ESRI} login, or would you send us the files?', a: [
        { id: 'esri', l: 'ESRI login', st: 'pend', m: 'Maps update automatically.', do: 'Agency GIS: create a read-only ESRI login' },
        { id: 'files', l: 'Map files', st: 'ok', m: 'Maps only update when they send new files.', do: 'Agency GIS: send the map files' },
        { id: 'priv', l: 'Map server is only reachable inside their network', st: 'pend', m: 'Then we need a network link too.', go: 'network' },
        { id: 'unk', l: 'Don’t know, or not allowed', st: 'unk', m: 'Follow up.' },
      ] },
    ],
  },
  {
    id: 'changes', n: 12, title: 'Changes coming', sub: 'Anything in the next year or so that would undo today’s answers.',
    q: [
      { id: 'x_changes', ask: 'Anything changing in the next year? New vendor, moving to the cloud, new network, new IT staff, new login system?', a: [
        { id: 'none', l: 'Nothing planned', st: 'ok', m: 'Done.' },
        { id: 'mig', l: 'New vendor or moving to the cloud', st: 'pend', m: 'The new software is a second server with its own questions. The old one becomes old data.', go: 'files' },
        { id: 'owner', l: 'New network, login system or IT staff', st: 'pend', m: 'Get names and dates. Today’s answers may change.', do: 'DS: recheck the answers that change' },
        { id: 'unsure', l: 'Not sure', st: 'unk', m: 'Ask whoever would know.', do: 'Agency IT: confirm upcoming changes' },
      ] },
    ],
  },
];

// Works for any question.
export const ANY = [
  { l: '“I don’t know”', m: 'Leave it unknown. Ask who would know and get an intro.', say: 'Who could confirm that? Could you introduce us?' },
  { l: '“Not my department”', m: 'Nothing is approved. Get the department and a name.', say: 'Which team handles that, and who specifically?' },
  { l: '“No”', m: 'Ask what exactly is off-limits and whether there is another way in.', say: 'What exactly is off-limits, and is there another way we could get it?' },
  { l: 'Two people disagree', m: 'Unsettled until someone with authority decides.', say: 'I’m hearing two answers. Who has the final say?' },
  { l: 'They ask you something you can’t answer', m: 'Don’t guess. Network questions go to Networking, data questions to Engineering, security questions to Security, contract questions to your AE.', say: 'Let me confirm with our team and follow up.' },
];

// What combinations mean. Each rule gets the answer map and returns text or null.
export const COMBOS = [
  { st: 'no', t: (a) => a.host === 'onprem' && a.n_method === 'none' && 'Server is on-prem but they won’t allow a permanent network link. Only option is them sending files, and Engineering has to confirm that works.' },
  { st: 'no', t: (a) => a.host === 'onprem' && a.n_run === 'nobody' && 'Server is on-prem and nobody can set up the network link. We can’t reach the database yet. Networking consult first.' },
  { st: 'pend', t: (a) => a.host === 'onprem' && a.n_method === 'ipsec' && 'IPSec means their firewall team does the work. Nothing moves until they name who.' },
  { st: 'pend', t: (a) => a.host === 'onprem' && a.n_method === 'connect' && 'Connect means they run our VM. Nothing moves until someone confirms they have a place to run it.' },
  { st: 'unk', t: (a) => a.host === 'cloud' && (a.method === 'none' || a.method === 'ui') && 'Vendor hosts the server and there’s no database login or API. Everything depends on the vendor.' },
  { st: 'no', t: (a) => a.method === 'prod' && a.d_prod === 'deny' && 'No login to the live database and no copy exists. Database path is closed. Vendor or files.' },
  { st: 'pend', t: (a) => a.d_rep === 'lic' && 'A database copy is required but they don’t have the license or server. Someone has to pay before anything moves.' },
  { st: 'unk', t: (a) => (a.d_fresh === 'part' || a.d_fresh === 'late') && 'The database copy is missing tables or lags behind. What we load may not match what officers see.' },
  { st: 'no', t: (a) => a.method === 'api' && a.a_cover === 'search' && 'The API only returns one record per search. We can’t load their data that way. Talk to the AE about scope.' },
  { st: 'no', t: (a) => a.f_type === 'recur' && a.f_sched === 'noowner' && 'Daily files but no schedule and nobody owns it. This will break.' },
  { st: 'no', t: (a) => (a.v_what || a.v_commit) && (a.v_cost === 'unk' || a.v_cost === 'peregrine' || a.v_cost === 'rej') && 'Vendor has to do work and nobody knows who pays. Stalled until that’s settled.' },
  { st: 'no', t: (a) => (a.v_commit === 'refuse' || a.auth === 'deny' || a.v_what === 'deny') && 'Someone said no to access. Tell your AE right after the call.' },
  { st: 'pend', t: (a) => (a.s_how === 'adldap' || a.s_how === 'ldap') && a.host !== 'onprem' && 'Their login server is on-prem but there’s no network link planned. User login needs one. Add the link or switch to cloud login.' },
  { st: 'pend', t: (a) => (a.s_how === 'adldap' || a.s_how === 'ldap') && a.host === 'onprem' && 'User login depends on the same network link as the database. If the link stalls, nobody can log in.' },
  { st: 'pend', t: (a) => a.c_contact === 'block' && 'Their security contact blocks everything until they approve. Plan the technical work, connect nothing yet.' },
  { st: 'pend', t: (a) => a.c_steps === 'fl' && 'Florida. FDLE paperwork and fingerprinting come before access. Start them now.' },
  { st: 'no', t: (a) => a.d_cover === 'filter' && '“Take everything, filter later” is a stop sign. We only take what they’re allowed to share. Design that first.' },
  { st: 'pend', t: (a) => a.d_media === 'sep' && 'Photos and PDFs are on a separate server. That’s a second server with its own login questions.' },
  { st: 'pend', t: (a) => a.auth === 'tent' && a.method && 'A way in is picked but the only approval is “should be fine”. Nothing is approved yet.' },
  { st: 'unk', t: (a) => a.product === 'test' && 'They only have a test copy. Whatever else is answered, it isn’t the live data.' },
  { st: 'unk', t: (a) => a.n_reach === 'vpn' && 'The city’s VPN to the county doesn’t let us in. The county has to approve us separately.' },
  { st: 'pend', t: (a) => a.auth === 'yes' && a.method && !a.d_creds && !a.a_acct && 'Approved and a way in is picked. Still need the name of who actually creates our login.' },
];

export const TERMS = {
  'DBA': 'Database administrator. The person at the agency who manages the database server and can create logins.',
  'IPSec': 'A permanent encrypted tunnel between their firewall and ours. Their firewall team sets it up. Nothing to install on a server.',
  'on-prem': 'On their own hardware, in their own building or data center. The opposite of the vendor hosting it in the cloud.',
  'Peregrine Connect': 'A small virtual machine we give them to run inside their network. It reaches out to us; nothing comes in. Alternative to IPSec.',
  'VM': 'Virtual machine. A computer that runs as software inside a bigger server. Most IT shops have somewhere to run one.',
  'read-only': 'A login that can read data but never change it. Still uses some of the server’s power.',
  'Production': 'The live database officers use every day. Querying it adds load to that server.',
  'Replica': 'An automatically updated copy of the live database, on a separate server. We query the copy so we never slow down the real one.',
  'API': 'A door the vendor’s software opens so other software can ask it for data. Only useful if it hands over everything, not one record per request.',
  'bulk': 'All records at once, and all changes after. The opposite is one record per search.',
  'SFTP': 'A secure shared folder. They drop files in, we pick them up. Fine once; fragile if it has to happen every day.',
  'schema': 'The list of tables and columns in the database and what each means. Without it we’re guessing.',
  'expunged': 'A court ordered the record erased. If they erase it, we have to erase our copy too.',
  'change tracking': 'A database setting that records which rows changed. Without it we can’t tell what’s new since yesterday.',
  'CJIS': 'FBI rules for handling criminal justice data. Fingerprints, training and background checks for anyone who touches it.',
  'FDLE': 'Florida Department of Law Enforcement. Florida agencies need FDLE paperwork before data can go to a cloud vendor like us.',
  'CLETS': 'California’s law-enforcement data network. California agencies have their own approval steps.',
  'MOU': 'Memorandum of understanding. A signed letter between two agencies, for one specific thing, like sharing fingerprint results.',
  'SAML': 'The standard behind cloud single sign-on (Entra, Okta, ADFS). Works over the internet, so no network link needed.',
  'LDAP': 'Older login system that runs on an on-prem server. We’d need a network link to it and a service login.',
  'OIDC': 'A newer single sign-on standard. We haven’t documented support for it.',
  'MFA': 'Multi-factor authentication. A code or app prompt after the password.',
  'Force AuthN': 'A setting that makes each person log in fresh instead of inheriting whoever used the computer last. Needed for shared computers.',
  'ESRI': 'The company that makes most police mapping software (ArcGIS). A read-only ESRI login lets us pull their map layers live.',
};
