export const GLOSSARY = [
  ['TTAR', 'Trust, scope, and access discovery before implementation and commercial commitments.'],
  ['On-prem vs cloud', 'Location. Not ownership, permission, or reachability.'],
  ['Production', 'The live system. Read-only queries still use its resources.'],
  ['Replica', 'A copy of system data. Verify completeness, freshness, support, and cost.'],
  ['DBA', 'The person or team who administers databases and grants access.'],
  ['Read-only credentials', 'Permission to read authorized data. Never stored in this app.'],
  ['Host/IP and port', 'Where the service lives. Knowing it grants nothing.'],
  ['Schema / data dictionary', 'What the tables and fields mean.'],
  ['API', 'A programmatic interface. Verify documented coverage and permitted use, not just existence.'],
  ['Bulk vs federated search', 'Full ongoing ingestion vs one-at-a-time lookup.'],
  ['IPSec', 'A customer-managed firewall tunnel.'],
  ['Peregrine Connect', 'A customer-hosted VM appliance with Peregrine-managed software. Pulls data; not a push feed.'],
  ['SFTP', 'Secure file transfer. One-time archive ≠ recurring feed.'],
  ['SSO / SAML vs LDAP', 'End-user login methods. Separate from database accounts.'],
  ['Change tracking', 'Signals for changed records. Varies by connector.'],
  ['Expungement / retention', 'Rules for removing records. Static archives need an explicit process.'],
  ['MOU / 3PA', 'An agreement with a specific purpose. Not a substitute for unrelated approvals.'],
  ['Resolved vs provisioned vs complete', 'Three different milestones. Don’t blur them.'],
];

export const EXAMPLE = {
  weak: '“IT should be able to do it.”',
  strong: '“The county DBA confirms this database can be made available through a read-only replica, subject to quarterly review, and will own provisioning.”',
  note: 'Strong doesn’t mean every other dependency is resolved.',
};

export const FACT_LABELS = {
  scope: 'Product', crit: 'Requirements', host: 'Hosting', owner: 'Owner', auth: 'Authorization',
  method: 'Method', network: 'Network', account: 'Account', coverage: 'Coverage', fresh: 'Freshness',
  media: 'Media', updates: 'Updates', vendor: 'Vendor', cost: 'Cost', migration: 'Migration', path: 'Path',
};

export const STATE_LABELS = {
  not_asked: 'Not asked', unknown: 'Unknown', disputed: 'Disputed', reported: 'Customer-reported',
  owner_confirmed: 'Owner-confirmed', pending_prerequisite: 'Pending', provisioned: 'Provisioned',
  verified: 'Verified', denied: 'Denied', not_applicable: 'N/A',
};
