# Phase 89: Boundary Baseline and Scope Lock - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 89 - Boundary Baseline and Scope Lock

## Discussion Summary

The user requested sequential `$gsd-discuss-phase` for all v1.14 phases and approved carrying similar recommended decisions forward after confirmation. Phase 89 discussion focused on what the baseline should contain, how broad the drift inventory should be, how non-goals should be enforced, and what evidence shape downstream phases need.

The user selected all Phase 89 gray areas, then approved the recommended decisions.

## Decisions

### 1. Baseline Artifacts

Options discussed:

- Single Markdown baseline.
- Machine-readable manifest only.
- Recommended: bundle with manifest JSON, human matrix/summary Markdown, and evidence Markdown.

Decision: use the recommended bundle.

Rationale: v1.14 needs both automation-friendly ownership facts and human-readable reasoning before implementation begins.

### 2. Drift Inventory

Options discussed:

- Minimal drift list focused only on fork deferral.
- Runtime-only drift list.
- Recommended: full drift list across fork deferral, lineage, validation, ABI shape, adapter IDs, limits, failure taxonomy, privacy, topology, replay realism, and import baseline.

Decision: use the full drift inventory.

Rationale: the milestone goal crosses artifact, runtime, Go, privacy, and replay boundaries; a narrow inventory would hide risks that later phases must own.

### 3. Non-Goal Enforcement

Options discussed:

- Documentation-only non-goals.
- Immediate code enforcement for every non-goal.
- Recommended: document every non-goal and add or identify monitor/test hooks where practical, assigning later phase ownership for gaps.

Decision: use the recommended enforcement approach.

Rationale: Phase 89 is a scope-lock phase, but non-goals should still be traceable to concrete enforcement where practical.

### 4. Evidence Style

Options discussed:

- Human-readable Markdown only.
- Machine-readable JSON only.
- Recommended: both JSON and Markdown evidence.

Decision: use both evidence styles.

Rationale: JSON supports monitors and topology comparisons; Markdown captures rationale, caveats, and downstream planning notes.

## Carry-Forward Guidance

For later v1.14 phase discussions, recommended decisions that preserve privacy, deterministic engine boundaries, schema validation, hostile Strategy isolation, and TypeScript-as-oracle/Go-as-future-backend direction may be confirmed compactly rather than reopened with full option lists.

## Deferred Ideas

None.
