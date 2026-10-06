# Before production use

## Sign-off

- [ ] **TTAR process owner** — question wording, branch meanings, SFDC statuses, gate text match current S01.
- [ ] **SE lead** — assessment rules (`assess` in `src/engine.js`) reflect how SEs judge an access path.
- [ ] **Networking** — N01–N07 wording; Connect/IPSec references point to active workflows only.
- [ ] **Compliance** — C01–C05, Florida overlay, reciprocity language.
- [ ] **Security** — hosting and storage decision for real customer data.

## Gaps and conflicts needing confirmation

Shown in the app under Learn → Known conflicts. Not resolved in code.

1. **N-DEx** — S07 lists it as generally restricted; S14 describes a Florida process.
2. **LensLock** — S08 has older negative language and a dated API update.
3. **VM storage** — S09 has an apparent unit typo.
4. **Appliance internals** — treated as implementation details.
5. **S16** — contains TBDs; treated as unknown.
6. **OIDC** — S12 does not document it; app routes to confirmation.
7. **Status definitions** — S01 names the three SFDC statuses but not edge-case definitions. The proposed status is a heuristic for SE review.
8. **Assessment heuristics** — “No unresolved feasibility issue” requires owner-confirmed owner, authorization, method, and coverage, plus a confirmed network plan where applicable. This is proposed logic, not Peregrine policy.
9. **Historical contacts** (V07, C04) — confirm they are current before relying on them.
