---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
scope: v13_entry_terminal_only
verified: 2026-10-03
terminal_verification: verified_closed_failure
empirical_completion: not_established
league_credit: false
freeze_credit: false
---

# Plan 265-07 — V13 ENTRY terminal verification

## Scope and disposition

This is an independent, bounded check of the unique V13 root-entry terminal.
It is not an ordinary retained empirical read, allocation/capacity admission,
or a claim that the Phase 265 league goal was achieved. The unique entry closed
with exit 1 and published no result. Its terminal failure is verified; empirical
completion is not established. Do not retry this entry or treat it as LEAG,
freeze, holdout, formation, public, counted, or production credit.

The failure marker's finite diagnostic code is
`LEAGUE_ALLOCATION_CAPACITY_MARGIN`. This is a safe code projection, not proof
of the underlying causal mechanism. No raw error text, stack, or payload is
reproduced here. V12's original cause remains UNKNOWN and is unchanged.

## Checked identity and terminal evidence

- Current HEAD is `e3df2cb2a13555ae302611a3e5dcfec87ea2c2ae`, the commit that
  records the V13 allocation before the unique entry. Its committed allocation
  is 24,680 bytes and hashes to
  `6a0b01fda4ef6d68e898f947f64476fb6722be96ae97bcd5751f28110612fca3`.
  The working canonical allocation and private prospective allocation match
  those committed bytes. Their declared allocation root is
  `sha256:3bb0abed1f3d835640ec605896ad0e05fecd62bdc72227bc81672dcf39caffc1`.
- The unique private `run-entry.json` records PID `50461`, start
  `2026-10-03T06:56:48.044Z`, and status
  `entry_started_static_validation_before_capacity`. Its raw SHA-256 is
  `99fa0baf865b3182f4b75bd9229aac811308dd6dee6a2f61352ccc59513a93b4`.
- The companion `run-entry-failure.json` records status `entry_failed`,
  `TypeError`, diagnostic code `LEAGUE_ALLOCATION_CAPACITY_MARGIN`, end
  `2026-10-03T07:11:33.239Z`, `resultPublished: false`, and `noRetry: true`.
  Its raw SHA-256 is
  `b9203fe2957fcd888f97000980377900851e34b328b8a0d87616ba50fcee0e42`.
  Both records bind the same allocation root and source-gate-complete root.
- PID `50461` is absent from the process table. No
  `run-entry-terminal.json` exists in the private V13 namespace. The reserved
  `.planning/artifacts/v1.38-phase-265-run-result-v13.json` remains exactly
  zero bytes. These checks establish the recorded closed failure and lack of
  a published result, not the absence of unrecorded observations or transient
  provider/native construction.
- The entry's source commit is `9ffde3ffafd23c6508766e15c05b5004c0fe030f`,
  with implementation root
  `sha256:552bba3d794cf902d12282ac453434fe74569a9d56870a655ba5b9a3e61a0aa8`
  and source root
  `sha256:defe5024690baceb2128cbd370f6c24f86e8301dcec2e816eff57d1eabea73e2`.
  The exact helper-review file hash bound by the entry is
  `sha256:1b6bbada0f39771419d6ae5125de1fe1cdf02844bc545dc2e214bc4c0b1065c6`.
  The reviewed `run-entry.ts` raw SHA-256 matches the independent V13 helper
  review: `40ccb2304f6bf37beec5d429af24c75fbdfac4fc5b9c37a6355e34960d270d0c`.
  The review records three helper files with zero findings; its scope was
  source-only, not execution authorization or empirical evidence.
- The V13 `league-evidence` directory is empty and has mode `0700`. This is
  record absence only; it does not prove that no unrecorded event occurred.

## Boundary and result

No retained reader, capacity receipt/check, allocation admission, helper mode,
provider/model/Match, Docker/Worker, history scan, or retry was run for this
terminal check. The advisory free-space snapshot supplied for this handoff
(`209641750528` bytes versus `210368502440` required; deficit `726751912`) is
not remeasured here. It is neither a failure-time capacity measurement nor
proof of this entry's causal failure. The finite diagnostic code above must not
be upgraded into either conclusion.

Existing guest (1000 ms), host receipt (5000 ms), Match (600000 ms), and other
frozen bounds are not changed by this verification. The current-rules freeze
still precedes formation; the private holdout remains unopened. No LEAG-01–09
completion, Phase 265 completion, or production authority is established.

**Terminal disposition:** verified closed exit-1 failure; no result published;
no retry; empirical/league completion not established.

---

_Verifier: independent V13 ENTRY terminal-only check; no commit created._
