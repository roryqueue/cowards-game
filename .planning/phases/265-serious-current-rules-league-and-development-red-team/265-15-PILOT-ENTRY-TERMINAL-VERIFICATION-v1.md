---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "15"
verified: 2026-10-03T14:51:59Z
scope: pilot-entry-terminal-only
status: feasibility_not_established
requirementsComplete: false
empirical_result: absent
terminal_witness: pid_closed_without_terminal_record
---

# Plan 265-15 pilot entry terminal verification

This is an independently bounded terminal-state check only. It is not retained
evidence verification, a pilot result, empirical failure classification, or a
whole-phase verification/pass.

## Bound local artifacts

| Item | Observed binding / digest |
| --- | --- |
| Current HEAD | `1da8d11393359ffb23b96e15cc87513e49a0fbea` |
| Entry PID | `66239` |
| Allocation custom content root | `sha256:8520a35eb4a6af3f2d7760d819ce72eef9d8dd764a0a925a19fa7554db327980` |
| Canonical allocation raw SHA-256 | `559c8c9d1a2f696f713c4ad9206cd66b6cbb7bd79f0fd56c468cbe7ada11b5a9` |
| Store allocation raw SHA-256 | `559c8c9d1a2f696f713c4ad9206cd66b6cbb7bd79f0fd56c468cbe7ada11b5a9` |
| Request raw SHA-256 | `667337207f3e172975ab0bde6217188e6555adcc20ddb87a65c52401467e413a` |
| Entry raw SHA-256 | `a281a0ab187a6e7d8247d81d403f99ed753a572f8e2bce6c81488b86f6b9ee2b` |
| Time ledger raw SHA-256 | `25ed9e4cbf8bcf1f8948fb17ad7472d1d7ab75d4d6312c991e84a0edeb8bb51c` |
| Charge ledger raw SHA-256 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

The canonical and private store allocation files are byte-identical. Their raw
file digest is distinct from the allocation's embedded canonical content root;
the embedded root matches the supplied allocation root. Request, allocation,
and entry all bind source root
`sha256:a37b17b1f58ae48e5cce5193716fe57199c8810f5a63797210bbe5f6bb6e6057`.
The allocation has eight slots and the unchanged envelope caps (28,800,000 ms,
300 matches, 12 GB retained, 2 GB scratch, 1 GB terminal, 15 GB total). The
entry binds the same allocation root and the current HEAD above. The inspected
entry-source files have no worktree diff from HEAD.

## Terminal witness and accounting

At verification time, `ps -p 66239` returned no process and
`pgrep -f '[r]un-v1-38-lean-experiment.ts'` found no matching entry dispatch.
Thus the recorded PID is closed and no matching dispatch was observed active.
This does not independently establish its exit code or the native heap
exhaustion cause reported by the initiating operator.

The immutable `entry.json` is mode `0600`; it contains only schema, PID, HEAD,
source root, and allocation root. It has no terminal/status field. The store
directory is mode `0700`; allocation, request, entry, time ledger, and charge
ledger files observed are mode `0600`.

The charge ledger is zero bytes / zero lines / zero charges. The time ledger is
57 bytes / one line: one `pilot-entry` `start` event at `1791038553541` ms
(`2026-10-03T14:42:33.541Z`); no close event is present. Neither
`.strategy-lab/lean-experiment-20261003/result.json`,
`entry-failure.json`, nor a terminal marker exists. No result status, charged
slot, terminal slot, or empirical success/failure count can therefore be
reported. The entry process had exited by this check, but its open time
interval was left untouched. Under the frozen conservative accounting rule,
the unclosed interval must not be reinterpreted as a measured elapsed duration;
the remaining global-time envelope is conservatively consumed.

Source-only control-flow inspection confirms the entry record is written before
candidate loading; candidate loading occurs before the slot loop, and slot
charging/provider construction occur only inside that loop after charging. This
is consistent with the observed zero charge rows and the supplied execution
observation that native heap exhaustion occurred in candidate loading before
the first retained charge. It does not prove that no transient candidate
materialization or other unrecorded observation occurred. No terminalizer,
retained reader, import/replay path, diagnostic learner, test, container start,
ledger repair, or interval close was run.

## Disposition

The only supportable disposition is `feasibility_not_established`,
`requirementsComplete: false`, with no LEAG, freeze, formation, or empirical
credit. The entry process is no longer active, but terminal accounting is not
cleanly closed because the time interval and durable terminal/result witness
are missing. This report does not certify the empirical failure cause and does
not claim Plan 265-15 or Phase 265 passed. No source, allocation, store, result,
authorization, or ledger state was changed.

---

_Scope: entry-terminal-only; no retained empirical verification performed._
