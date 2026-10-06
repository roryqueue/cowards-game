---
phase: 265-serious-current-rules-league-and-development-red-team
scope: NEWv6BASELINE-entry-terminal-only
status: gaps_found
verified: 2026-10-06T02:07:25Z
baseline_accepted: false
phase_complete: false
issued: false
ordinary_reader_invoked: false
overrides_applied: 0
gaps:
  - truth: "The new v6 baseline completes and supplies eligible result evidence."
    status: failed
    reason: "Child failed with exit code 1; result absent; third charged slot has no terminal record."
    missing:
      - "Complete eligible baseline evidence; this ended envelope supplies no automatic fresh route."
---

# NEW v6 baseline — independent terminal-only verification

**Disposition: FAILED baseline; finite terminal custody VERIFIED.** Whole Phase 265 and LEAG-01–09 remain incomplete/uncredited. This is one independent ENTRY-terminal-only check, not an ordinary empirical/full reader, phase-wide re-verification, or causal diagnosis.

## Independently authenticated identity

Inert source-manifest computation and current Git readback matched the held source and HEAD. Production finite allocation, entry, terminal and ledger/time readers completed successfully. The finite reason schema/root validator passed and its identity/entry/exit/signal joins matched; its successful-result-only retained join was deliberately not invoked.

| Identity | Observed value |
|---|---|
| HEAD | `6b9336f1200b2617b7c7bd8d166f43d6a0253e08` |
| Source | `sha256:67263fe477e884ffabb74c09f562d0091e2a86ec8ae29cf7c812ed64d31430aa` |
| Allocation root | `sha256:df4c4e9046bc0dab740b5b69d44a45a0285629c07868a2c3ece1abd874c1e9a6` |
| Allocation raw bytes | `sha256:500dc17163bd4d0d1b7523d4dae41c75bfb7bd79bc72a61bedf6523acfc02904` |
| Request raw bytes | `sha256:de8be0f989891530dcb1a4e597e9148c311f10c08a2bc6f2292949ff10e6e4db` |
| Entry raw bytes | `sha256:9761b57704a6a87fc833931201e7e6bccade8e84a43b119047fed0be0fc19ca9` |
| Terminal raw bytes | `sha256:97b17e4daa84b1aa3152adcfe33228bff4e1d8728c0ea0ac6591820d3bf13d77` |
| Supervisor reason raw bytes | `sha256:e6dbaabd63442af4c90690f12cd3b6f25015d88e9962cccebc34ce92afe917d2` |
| Time ledger raw bytes | `sha256:f338c44b8d32911849e8817d0ecabb76999c246e9833d7455eb617a004a3d669` |
| Match ledger raw bytes | `sha256:3c3adc922c3d4ebaad3ba2eb2b569ab96c079db14218331fe371ccde028d2a4a` |

## Finite terminal and counter findings

| Check | Status | Direct evidence |
|---|---|---|
| Entry → terminal allocation/source/HEAD/PID custody | VERIFIED | Production finite readers and finite reason identity joins matched. Parent PID 12390; child PID 12462. |
| Child completed successfully | FAILED / BLOCKER | `child_failed`, exitCode **1**, signal **null**, elapsedUpperBoundMs **1,236,340**. |
| Eligible result | FAILED / BLOCKER | `result.json` absent. No result, result-root, completed 36-Match baseline, or ordinary-reader acceptance fabricated. |
| Charged-prefix accounting | VERIFIED | **3 current charges**, **2 current terminal records**, predecessor **25 spent**, cumulative **28 spent**. |
| Two finite terminal records | VERIFIED, finite fields only | Ordinals 0 and 1 both `classification=success`, `code=OK`, `cleanupComplete=true`; elapsed 261,349 and 331,532 ms. This is not replay/full-evidence acceptance or league credit. |
| Third charge | FAILED / BLOCKER | Charged ordinal 2 has no terminal record. It remains spent, nonterminal and uncredited; no classification/outcome was invented for this slot. |
| Stop prefix | VERIFIED observation | **No stop event** in the authenticated finite journal. Closed parent process/clock must not be relabeled a stopped ledger. |
| Parent cleanup observation | VERIFIED narrowly | Reason reports `cleanup=child_exit_observed`; it does not prove every provider/resource was cleanly closed. |
| Actual named process closure | VERIFIED | `ps` returned no rows; independent signal-0 checks yielded ESRCH for both PIDs at 1791252391697. No kill was performed. |

Finite `entry-failure.json` satisfied the exact whitelisted four-field wire schema: **UNKNOWN_INTERNAL_FAILURE**, stage **unknown**. Reason `initiatingCause=unknown`, `failureReceipt=published`, `terminalization=unobserved`, final identity matched and resource sampling observed. No narrower cause is established. Empty reason-code list / `uncertain=false` does not override the failed exit or prove successful terminalization. No raw exception, stack, Strategy source, objective, memory, or runtime I/O was disclosed.

## Conservative time and resource observation

`openLeanLedger` / `readLeanTimeAccounting` were used; **verifyLeanEvidence was not invoked**. All three current intervals were closed, active=false:

| Interval | Start ms | Effective close ms | Charged ms |
|---|---:|---:|---:|
| correction-preparation | 1791250964209 | 1791250988189 | 23,980 |
| pilot-entry | 1791250988189 | 1791252224529 | 1,236,340 |
| correction-run-finalization | 1791252224529 | 1791252224672 | 143 |

Predecessor elapsed **40,082,213 ms** + current closed intervals **1,260,463 ms** = **41,342,676 ms**. Terminal wall delta is 1,236,307 ms, while ceil(monotonic delta) is **1,236,340 ms**: the ledger uses the conservative latter value. The run admission-close receipt carries elapsedUpperBoundMs **1,236,483**, importedMs **1,236,340**, finalization close **1791252224672**. Raw wall-close timestamp must not replace the effective ledger close.

At the independent process-closure observation **1791252391697**, effective cumulative elapsed was **41,509,701 ms**, including all 167,025 post-close milliseconds; nominal remaining was **1,690,299 ms** of the unchanged **43,200,000 ms** cap. For every subsequent report/admin/source-hold millisecond through actual MAIN closure, continue charging **41,342,676 + max(0, closureAtMs − 1791252224672)**; this report does not reset, freeze, refund or grant that remainder. MAIN must bind its later actual closure, not reuse the earlier observation as final elapsed.

Finite terminal resource observations: physicalBytes **12,894,208**; parentRssBytes **394,838,016**; observed child RSS **631,169,024**; freeBytes **205,682,925,568**. These are observations, not whole-tree RSS or native/complete-baseline feasibility certification. Existing finite resource journal passed its production shape/cap reader, without reading payloads or recomputing replay evidence.

## Boundary and escalation

No provider, Match, empirical helper, preparation, native/regression command, ordinary/full reader, historical reader, source edit, commit or older artifact mutation occurred. No replay gzip/source/observation/pair payload was opened. Only this newly owned report was written. Project verification instructions and finite production contracts were used; no project-local skills were found.

**Envelope ended; no automatic fresh route.** Failure/absent-result/nonterminal charge prevent acceptance. No holdout, formation, public, counted, production, downstream or LEAG credit. Causal diagnosis and a replacement envelope require an explicit developer decision; this check authorizes neither. Source/HEAD hold remains in force through the verifier's actual return and is then released to MAIN.

Final independent source/HEAD readback at **1791252445551** again matched both held identities. Effective elapsed through this verifier's closure observation: **41,563,555 ms**, nominal remaining **1,636,445 ms**. The tiny subsequent report-write/return tail and MAIN's later actual closure still count under the exact continuation formula above; no automatic work is authorized by the remainder.
