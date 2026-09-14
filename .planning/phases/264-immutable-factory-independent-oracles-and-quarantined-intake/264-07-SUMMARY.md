---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
plan: "07"
subsystem: private-model-factory-route
tags: [private, immutable-provenance, source-only, app-server, calibration-controls]
status: complete
source_review: relevant_source_findings_resolved
dependency_graph:
  requires: [264-05, 264-06]
  provides: [truthful-v2-model-provenance, frozen-authoring-allocation, source-backed-preparation]
  affects: [264-08]
tech_stack:
  added: []
  patterns: [unavailable-serving-snapshot, rooted-protocol-capture, calibration-only-source-transforms]
key_files:
  created:
    - scripts/author-v1-38-factory-model-source.ts
    - scripts/v1-38-factory-app-server-transport.ts
    - scripts/v1-38-factory-controls.ts
  modified:
    - packages/strategy-oracle-model/src/bundle.ts
    - packages/strategy-lab/src/factory/calibration.ts
    - packages/strategy-lab/src/factory/fingerprint.ts
    - scripts/ingest-v1-38-factory-packet.ts
    - scripts/prepare-v1-38-factory-calibration.ts
    - scripts/run-v1-38-factory-calibration.ts
decisions:
  - "Keep undisclosed serving snapshots explicitly unavailable; bind actual reported provider/model and usage to retained protocol records."
  - "Use the installed authenticated app-server protocol for pre-charge effective-setting checks and raw capture."
  - "Move the prescribed source-control materializer forward from Plan08 Task1 so preparation can actually enforce its graph."
---

# Phase 264 Plan 07: Fresh Route Source Summary

The approved authoring, capture and source-preparation path is implemented and independently rechecked at source commit `d1cbfa984fd60dc399a4d0fe856a2704448bf1d3`, with zero relevant Plan07 source findings. No live app-server handshake, model generation, guest execution, empirical workload or Match has run for this route. Earlier premature source-complete claims were corrected and are retained in git history.

## Delivered source behavior

- V2 model bundles retain exact request/raw-response/source bytes, requested and reported identities, client/settings, actual usage and an explicit unavailable snapshot. Reopening parses the protocol and rejects source, usage or provider substitutions even when their hashes are coherently recomputed. V1 history is unchanged.
- One immutable four-attempt/30-minute authoring envelope stops at the first valid output or terminal failure. Actual child deadlines, charge-first records, invocation reuse rejection, sequential correction slots and native authenticated CLI capture are implemented. No live operational success is claimed from fake-process tests.
- Pre-charge negotiation verifies effective model/provider, approval policy, sandbox and instruction sources. The callable route uses a canonical executable and sanitized environment, an internally-created non-repository disclosed directory, and a fresh config/state directory with native-auth binding; credential contents are not copied, read or reported by this workflow.
- Cleanup waits for process exit, escalates when required, and retains a supplemental success/failure record. A missing or failed cleanup prevents bundle admission.
- Fresh preparation accepts only the exact twelve-slot/48-cell input. S01/S03/S05 reopen through the tactical, teacher and model emitters. Every other slot rederives its exact prescribed source transform and true base provenance. Controls use a local transform identity and `calibration_only` ingestion, never a fabricated independent producer.
- The 48 workloads form 24 two-member opposite-initiative groups, retaining both fixed geometry/side blocks and unchanged 256-invocation/120000-ms limits. The generic historical preparer is explicitly separate and unavailable through the fresh CLI.

## Commits

Initial task implementation: `db1149cf`, `37160246`, `51743784`.

Review repairs: `bdcd3525`, `3db551ac`, `6f338c12`, `a60347fd`, `4b36e1c0`, `c1833d50`, `9a45f1a7`, `5966860a`, `32a7eb19`, `4eda4d27`, `d1cbfa98`. Research correction: `4fd93007`.

## Verification

- At `4eda4d27`, ten focused source/fake-process suites passed **52/52** tests, including model, packet contracts, calibration, fingerprints, author/transport, ingestion, preparation, controls and runner regressions.
- Strict standalone TypeScript checks of all changed operational scripts passed; builds of the lab and all three oracle packages passed.
- Private-boundary monitor passed with **1,277 files and zero violations**.
- The final cleanup/executable correction passed the fixer's **30/30** focused tests and strict TypeScript check; independent final recheck passed **38/38**, and main's final author/transport/control recheck passed **18/18**. Both independent review reports record zero unresolved relevant source findings.

## Deviations and lessons

The ordinary CLI JSON completion stream lacked documented reported-model identity, so implementation uses the installed app-server schema. This is a technical transport correction within the approved access and budget. Source-only control materialization moved forward from Plan08 because labels alone could not enforce preparation. No new numbered plan, retry envelope, product decision or assurance system was introduced.

Independent review exposed real integration gaps despite passing tests: disconnected fresh preparation, incorrect initiative grouping, unbound raw metadata, reference-based identity comparison, and unobserved process cleanup. Added regressions cover those concrete cases. This source work does not certify model quality or competitive independence.

## Remaining work

Plan08 still must implement source/receipt-backed numeric calibration, the affirmative-or-unresolved D-19 assessor, exact fresh runner authority and first-valid model linkage, the 90-minute workload guard, and read-only retained-result reopening. After independent review of that complete implementation, main alone may consume the already approved envelope. Human/external intake remains unused; league, holdout, formation, counted/public/production play and rule changes remain unavailable here.

## Self-check

Source artifacts and atomic commits exist. Plan07 source is independently complete; Phase264 empirical readiness and its remaining requirements are **not** passed. Continue Plan08 automatically under the standing approval.
