---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: calibration-corpus-helper
checked: 2026-09-14
status: passed
focused_test: 3/3 passed
open_gaps: 0
---

# Phase 264 Calibration Corpus Review

This is a bounded mechanics review of `packages/strategy-lab/src/factory/calibration-corpus.ts` and its focused test. The corpus is explicitly development-only fixture evidence: no supplied source is imported or executed, and no observation is marked independent or empirical.

## Evidence checked

Focused command:
`./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/calibration-corpus.test.ts` — **3 tests passed** in 1.77 seconds.

| Check | Result | Evidence |
|---|---|---|
| Concrete paired fixtures, not labels/arbitrary roots | PASS (mechanics) | Six cases contain paired source text, lineage values, dependency source text, and four paired sample records with condition, side/coordinate, decision, behavior, and response. Case/dimension roots are derived from those immutable fixture values. |
| Source and six dimensions are rederived | PASS (mechanics) | `sourceStructure` calls the shared TypeScript AST structure-root derivation; lineage, dependency, legal decision, Chronicle behavior, and matchup response roots are independently domain-separated from fixture projections. Each observation exposes all six equality/root pairs. |
| Agreement/classification is data-derived | PASS (mechanics) | Per-sample decision, behavior, and matchup agreement counts are computed from paired records; classification uses dimension equality and behavior agreement, then is checked against each declared expected relation. The focused test covers correlated, distinct, borderline, cosmetic, shared-selector, symmetry/opaque-ID, and latent-divergence fixtures. |
| Caller/fixture masquerade resistance | PASS (mechanics) | Corpus and observations are recursively frozen; observations are issued through a local `WeakSet`; copied, reordered, partial, and caller-root-shaped records are rejected. Every observation remains `evidenceClass: "mechanics_only"` and `independence: "unresolved"`. |
| Privacy/execution boundary | PASS | Only bounded synthetic strings and aggregate sample fields are stored. The helper imports contracts and the source-structure root function; it does not import providers, runtimes, Match code, or dynamic execution facilities. |

## Limits

The fixtures prove projection, equality, ordering, and quarantine mechanics only. They are not real candidate source, runtime traces, provider/model/human evidence, gameplay outcomes, or an empirical calibration threshold. The report intentionally makes no claim beyond those mechanics.

_Independent bounded corpus review; no source edits or commit performed._
