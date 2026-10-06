// Synthetic demonstration data only. Fabricated agencies and people.
export const FIXTURES = [
  {
    name: 'Example — Southern Software, on-prem SQL',
    session: {
      agency: 'Harbor Pines Sheriff’s Office', jurisdiction: 'AL', maturity: 'late_stage',
      contacts: [
        { name: 'J. Rivera', role: 'IT Director', manages: 'Servers, SQL' },
        { name: 'Lt. M. Okafor', role: 'Champion', manages: 'Operations' },
      ],
      sources: [
        { id: 'cad', kind: 'CAD', name: 'CAD', vendor: 'Southern Software CAD', critical: true, parent: null },
        { id: 'rms', kind: 'RMS', name: 'RMS', vendor: 'Southern Software RMS', critical: true, parent: null },
        { id: 'gis', kind: 'GIS', name: 'GIS', vendor: 'Esri', critical: false, parent: null },
      ],
    },
  },
  {
    name: 'Example — County 911 runs CAD',
    session: {
      agency: 'Millbrook Police Department', jurisdiction: 'OH',
      contacts: [{ name: 'Chief A. Lindqvist', role: 'Chief', manages: 'Agency' }],
      sources: [
        { id: 'cad', kind: 'CAD', name: 'CAD', vendor: 'CentralSquare (county-hosted)', critical: true, parent: null },
        { id: 'rms', kind: 'RMS', name: 'RMS', vendor: 'Mark43', critical: true, parent: null },
      ],
    },
  },
  {
    name: 'Example — Spillman, Florida',
    session: {
      agency: 'Gulf Shore Police Department', jurisdiction: 'FL',
      sources: [
        { id: 'cad', kind: 'CAD', name: 'CAD', vendor: 'Spillman Flex', critical: true, parent: null },
        { id: 'rms', kind: 'RMS', name: 'RMS', vendor: 'Spillman Flex', critical: true, parent: null },
        { id: 'lpr', kind: 'LPR', name: 'LPR', vendor: 'Flock', critical: false, parent: null },
      ],
    },
  },
];
