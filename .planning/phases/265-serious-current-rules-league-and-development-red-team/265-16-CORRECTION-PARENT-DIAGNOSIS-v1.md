---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
status: source_diagnosis_inconclusive
date: 2026-10-04
scope: finite_parent_terminal_source_trace
head: ff4f9c8fac907f7bc691c73ae5f0cb39de7eb505
actual_origin_rows: 0
additional_diagnostic_authority: none
---

# Plan 265-16 parent-terminal diagnosis v1

**Disposition: no source defect is established as the cause of the actual
`child_failed` terminal. No narrow repair is justified from this evidence.**
The unique authorized diagnostic is spent; the ordinary retained reader refused
before audit. The separate finite terminal-custody check observed no origin rows. This is a finite causal report, not a
new diagnostic, baseline admission, or phase-completion claim.

## Known facts

- The actual child terminal records `status: child_failed`, `exitCode: 0`, and
  `signal: null`. The child produced a result; the origin envelope is empty.
  The ordinary retained reader refused on terminal status before its audit.
- In current held source `ff4f9c8f`, `runLeanBoundedParent` derives
  `child_exited` only when exit code is zero, `uncertain` is false, and no
  bounded child-failure receipt was received
  (`scripts/run-v1-38-lean-baseline.ts:247-250,273-285`). Thus the terminal
  demonstrates at least one parent-side uncertainty/failure condition, but
  does not identify which one.
- The uncertainty latch has several independent setters: child `error` or
  malformed/duplicate IPC (`:247-250`), sampled RSS/time excess or an exception
  from the periodic RSS/resource check (`:265-272`), and final HEAD/manifest/
  request drift or a throw while checking them (`:275`). Failure-receipt
  publication can also set it (`:277-281`). Timeout is a separate setter.
- A normal child action exception is caught by
  `resolveLeanChildCliTerminal`, which emits only bounded failure metadata,
  sets exit code 1, then disconnects IPC
  (`scripts/lib/v1-38-lean-child-cli-terminal.ts:88-102`). The successful
  result plus actual zero/null exit makes this ordinary failure path a poor fit,
  but cannot identify the parent uncertainty branch.
- In the correction body the `disconnect` listener is removed in `finally`
  before the CLI terminal helper disconnects IPC
  (`scripts/run-v1-38-lean-correction.ts:292-323`); source does not establish
  the suspected self-disconnect cause.

## Hypothesis disposition

| Candidate | Result | Evidence / limit |
|---|---|---|
| A cleanup exception masked the original child failure | Not supported by retained observations, not conclusively excluded | Earlier bounded source repair tested this branch; actual compact record says cleanup complete, and child exit was 0/null. Neither the repair nor compact metadata proves every unobserved cleanup event or this terminal's cause. |
| Ordinary child action threw and its CLI converted it to failure | Not supported | CLI catch sets exit code 1; actual terminal is 0/null and a result exists. No ordinary reader accepted a causal child receipt. |
| Parent RSS/time sample or sampling exception latched `uncertain` as the child exited | Plausible, unproven | The source has this path. Actual RSS observations fit configured caps but do not establish every sample or historical peak. No sample exception/trace is retained. |
| IPC error, malformed/duplicate message, final identity drift/check throw, timeout, or failure-receipt publication uncertainty | Unresolved alternatives | Each can affect disposition in the source, but no branch-specific actual observation survives. The actual run is closed and cannot be replayed. |
| Child's final IPC disconnect itself caused this failure | Not established | Correction removes its disconnect listener before CLI disconnect; no actual event trace proves otherwise. |

## Conclusion and boundary

Source establishes a **branch ambiguity**, not a defect: parent terminalization
intentionally collapses several uncertainty paths into `child_failed`, and the
actual record contains no branch-specific evidence. The RSS-exit sampling race
is a candidate only; asserting it or changing source to mask it would be
speculative. Do not repair or retest against the consumed route, reread with the
ordinary reader, infer acceptance from the successful Match record, refund a
charge, or claim the baseline.

The human-only residual is a prospective authorization decision if anyone wants
to change the already approved terminal stop or request another empirical
opportunity. No such change is implied here. Under the current approved rule,
inadequate custody/unknown cause ends inconclusively: no second diagnostic and
no baseline. Preserve source and HEAD; phase 265 remains incomplete.
