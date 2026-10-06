// Source registry (research snapshot 2026-10-06). Notion links are internal.
export const SNAPSHOT = '2026-10-06';

const P = 'https://app.notion.com/p/';
export const SOURCES = {
  S01: { title: 'TTAR Instructions + Customer IT Email', url: P + 'Technical-Trust-Access-Review-TTAR-Instructions-Customer-IT-Email-template-fa0d91242aaf43cc8b87e65f30f33e9d', note: 'Governs commercial gates and unresolved-access escalation.' },
  S02: { title: 'Deployment TTAR', url: P + 'Deployment-TTAR-1dd93d43caca80a6bc75f0cba8afb1f5' },
  S03: { title: 'Standard TTAR Question List', url: P + 'Standard-TTAR-Question-List-2f693d43caca80fe8920f8f35b17e8ae' },
  S04: { title: 'The Quick ‘Why’ & Best Practices', url: P + 'The-Quick-Why-Best-Practices-2f693d43caca80bdbbf4f67cd95363d0' },
  S05: { title: 'General Framing & Question Guidance', url: P + 'General-Framing-Question-Guidance-for-TTARs-2f693d43caca8083b05fed53e125aa2d' },
  S06: { title: 'Peregrine FAQs for IT leaders', url: P + 'Peregrine-FAQs-for-IT-leaders-6078d92ce6e94a58b8bf0a5890952c6c', note: 'Broad language never overrides S07/S08 vendor limits.' },
  S07: { title: 'Deal Desk: Challenging Data Vendors', url: P + 'Deal-Desk-Guidance-on-Challenging-Data-Vendors-2a793d43caca802dababf64774e41d03' },
  S08: { title: 'Vendor-specific access protocols', url: P + 'Vendor-specific-access-protocols-1e393d43caca80b984a4c7c459470dab' },
  S09: { title: 'FAQs: Customer Networking', url: P + 'FAQs-Customer-Networking-2a993d43caca801bb779deb376101690', note: 'VM storage figure contains an apparent typo — confirm with Networking.' },
  S10: { title: 'Setting up Peregrine-Connect', url: P + 'Setting-up-Peregrine-Connect-38993d43caca80b2ba83d2d1948a9fbb', note: 'Use the 2026-09-24 self-service workflow only.' },
  S11: { title: 'Setting Up IPSec Tunnel', url: P + 'Setting-Up-IPSec-Tunnel-8e3c6d9c93fb415f824c8676e7a7919f', note: 'Use the active questionnaire, not archived forms.' },
  S12: { title: 'User Authentication (AD, SSO)', url: P + 'User-Authentication-AD-SSO-a93706f5949b4838aeb14ac66d3274ba', note: 'Partly WIP.' },
  S13: { title: 'How Peregrine Supports System Transitions', url: P + 'How-Peregrine-Supports-System-Transitions-2e393d43caca8086ab5cc4b83cc4a46a' },
  S14: { title: 'Florida Pre-Deployment Resources', url: P + 'Florida-Pre-Deployment-Resources-6cfc9358398a4057aba727432eddcc08' },
  S15: { title: 'Southern Software RMS', url: P + 'Southern-Software-RMS-26b93d43caca807fb588cfa0c2a05ebd', note: 'Historical notes, not vendor policy.' },
  S16: { title: 'TTAR most common situations', url: P + 'TTAR-most-common-situations-1dd93d43caca80a0bb34dd4b75e13cdf', note: 'Contains TBDs — never fill with invented policy.' },
  S17: { title: 'TTAR resource index', url: P + 'Technology-Trust-Access-Review-TTAR-database-e5baee88c5734309bb5f683ba3802718' },
};

// Known conflicts — surfaced, never silently resolved.
export const CONFLICTS = [
  'N-DEx: S07 lists it as generally restricted; S14 describes a Florida-specific approved process. Confirm per state/source.',
  'LensLock: S08 has older negative language and a dated API-access update. Confirm the current method.',
  'S09 VM storage requirement has an apparent unit typo. Confirm with the current appliance README / Networking.',
  'Appliance internals (e.g. OpenVPN) are implementation details. Safe distinction: firewall IPSec vs customer-hosted appliance.',
  'S16 contains placeholders/TBDs. Treat as unknown.',
];

export const BASIS = {
  documented_policy: 'Documented policy',
  documented_guidance: 'Documented guidance',
  proposed_discovery_followup: 'Proposed follow-up',
  historical_precedent: 'Historical precedent',
};
