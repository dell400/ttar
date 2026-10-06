# TTAR

A copilot for running a Technical Trust & Access Review.

**Ask → hear → understand → act → next question.**

Internal learning and meeting aid. Not an approval authority, compliance determination, or substitute for current Peregrine procedures. Research snapshot: 2026-10-06.

## Run

No build, no dependencies. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. Tests: http://localhost:8000/tests/.

## Modes

- **Prepare** — agency, sources, people, agenda.
- **Run** — one question at a time. Pick the answer; the right panel shows what it means, what to say, what to do, and the next question. Keys: `1–9` choose, `↵` continue, `←` back.
- **Learn** — glossary, every question and branch, source registry, known conflicts.
- **Review** — gate, proposed SFDC status, per-source assessment, actions, exports.

## Structure

```
src/data/nodes.js     Question catalog (all P/M/I/N/O/D/A/F/L/V/X/C/S/G/H/R/U nodes)
src/data/sources.js   Source registry S01–S17, conflicts, basis labels
src/data/glossary.js  Glossary and labels
src/engine.js         Rules engine — pure, deterministic, no UI
src/exports.js        Handoff, customer recap, drafts, JSON
src/app.js            UI
tests/                Graph validation, 12 worked examples, mechanics
```

Facts, actions, parked items, assessments, and the gate are **derived from answers**. Editing an answer marks later answers for that source stale and recomputes everything — no lingering green.

## Update content

Edit `src/data/nodes.js`. Each branch sets fact states (`f`), actions (`a`), and a transition (`next`, or `call` + `ret` for subflows). Open `/tests/` — graph validation catches broken IDs and unreachable nodes.

## Privacy

- Session lives in memory. Browser storage is opt-in, with a warning.
- Never enter passwords, API secrets, pre-shared keys, biometrics, or CJI.
- No analytics, no network calls, no live Notion/Salesforce/email actions. Buttons draft and copy only.
- Real customer data needs an approved storage/deployment decision. Fixtures are synthetic.

See [REVIEW.md](REVIEW.md) for the pre-production checklist and open documentation gaps.
