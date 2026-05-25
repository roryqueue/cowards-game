# Phase 130: Signed-In End-to-End Proof and JS/TS Regression Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 130-signed-in-end-to-end-proof-and-js-ts-regression-gate
**Areas discussed:** Signed-in proof, Evidence cues, Python samples

---

## Signed-In Proof

| Option | Description | Selected |
|--------|-------------|----------|
| JS plus two Python | Create one JS/TS and two Python revisions, covering Python-vs-JS/TS and Python-vs-Python where supported. | ✓ |
| Minimal proof | Repeat v1.18-style one JS/TS plus one Python exhibition. | |
| Probe-heavy proof | Add invalid/violating Python revisions to the signed-in browser proof. | |

**User's choice:** JS plus two Python.
**Notes:** This is the stronger v1.19 proof target.

---

## Evidence Cues

| Option | Description | Selected |
|--------|-------------|----------|
| Evidence panel | Add compact public-safe facts: non-counted status, language/runtime labels, broker path, and privacy exclusion cues. | ✓ |
| Provenance only | Put details under existing provenance/details sections. | |
| Inline everywhere | Repeat runtime/counting/privacy cues throughout standings, entrant cards, match rows, and replay header. | |

**User's choice:** Evidence panel.
**Notes:** The signed-in proof should assert the evidence panel exists.

---

## Python Samples

| Option | Description | Selected |
|--------|-------------|----------|
| Credible safe set | Add 2-3 tactical examples that feel real while using only safe Strategy input data. | ✓ |
| One canonical | Use a single polished Python starter. | |
| Didactic set | Add more examples focused on teaching validation rules. | |

**User's choice:** Credible safe set.
**Notes:** Proof may use the credible safe sample set.

## the agent's Discretion

- Exact proof account suffixes, labels, and safe sample Strategy selection are left to the implementer.

## Deferred Ideas

- Probe-heavy invalid Strategy browser flow.
- Python counted proof.
