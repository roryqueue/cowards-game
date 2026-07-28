---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "11"
subsystem: integrity-monitoring
tags: [typescript-ast, ownership, migration-gates, chronicle, activation]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: Wave-0 duplicate-authority and lifecycle RED contracts
provides:
  - Exact AST-aware ownership table for buildChronicleFromMatch and resolveActivation
  - Nine staged migration modes from baseline through current
  - Mutation proof for imports, aliases, properties, types, calls, definitions, comments, strings, and near names
affects: [257-10, 257-13, 257-14, 257-15, 257-16, 257-18, 257-19]
tech-stack:
  added: []
  patterns: [AST reference ownership, monotonic deletion gates, negative-monitor classification]
key-files:
  created:
    - scripts/check-v1-37-executable-reference-inventory.ts
    - scripts/check-v1-37-executable-reference-inventory.test.ts
  modified: []
key-decisions:
  - "Executable references are owned by exact path, symbol, AST role, and migration plan; prose, strings, near names, and negative monitors are separate evidence."
  - "Activation caller readiness constrains resolveActivation independently, so it cannot falsely claim completion for unfinished replay-builder groups."
  - "The current mode admits zero executable references; aliases and property/type positions cannot survive as hidden compatibility surfaces."
patterns-established:
  - "Migration stages remove explicit owner sets and become monotonically stricter."
  - "Baseline drift is grouped by exact path, symbol, AST role, owner, and occurrence count rather than substring totals."
requirements-completed: [KERN-01, KERN-02, KERN-07, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Every exact current executable reference has one migration owner and the repository baseline is frozen.
    requirement: KERN-01
    verification:
      - kind: contract
        ref: "pnpm exec tsx scripts/check-v1-37-executable-reference-inventory.ts --baseline"
        status: pass
    human_judgment: false
  - id: D2
    description: AST roles, aliases, comments, strings, near names, negative guards, and moved references are mutation-tested.
    requirement: KERN-07
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-executable-reference-inventory.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Staged modes are monotonic, Activation-specific, and end in zero-reference current state.
    requirement: KERN-02
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-executable-reference-inventory.test.ts#makes builder migration modes monotonically stricter"
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 11: Exact Executable-Reference Ownership Summary

**Every live `buildChronicleFromMatch` and `resolveActivation` executable reference now has one AST-level migration owner and a staged deletion gate.**

## Accomplishments

- Froze 69 exact executable references in 51 grouped path/symbol/role/owner records after the v1.4 compatibility corpus and semantic RED boundaries were present.
- Assigned recorder/fixture, replay-core, replay-fixture, runtime-service, persistence, Activation-caller, and final-definition surfaces to Plans 10, 13, 14, 15, 16, 18, and 19 respectively.
- Added baseline, recorder-migrated, replay-core-ready, replay-fixtures-ready, runtime-service-ready, persistence-ready, activation-callers-ready, activation-ready, and current modes.
- Kept comments, README-style prose strings, monitor literals, and near-name identifiers from satisfying or failing executable cleanup.
- Included the Plan 03 compatibility fixture and the persisted audit probe in Plan 18's caller-migration ownership.

## Task Commit

1. **Install exact reference inventory, staged modes, and mutation proof** — `a32a64c` (test)

Additional classification fix: `c39321d` explicitly records Markdown/README mentions as non-executable documentation evidence.

## Verification

- `pnpm exec vitest run scripts/check-v1-37-executable-reference-inventory.test.ts` — 12/12 passed.
- `pnpm exec tsx scripts/check-v1-37-executable-reference-inventory.ts --baseline` — passed with 69 exact references and 13 non-executable mentions.
- Prettier, ESLint, and `git diff --check` — passed.

## Deviations from Plan

### Auto-fixed Issue

- README/Markdown mentions were initially outside the TypeScript source walk. They are now explicitly classified as non-executable documentation evidence, with a focused mutation test. No production behavior changed.

## Protected Files

The pre-existing dirty `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained unstaged and unmodified by this plan.

## Next Phase Readiness

Plans 10, 13–16, 18, and the atomic Plan 19 activation can now prove their exact assigned reference reductions without editing this ownership table to hide debt.

## Self-Check: PASSED

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
