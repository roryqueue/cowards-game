# Twenty-hour baseline terminal verification — v1

**Disposition: CLOSED — terminal custody verified; baseline failed; no empirical credit.**

This is the independent entry-terminal-only check for the conditional v8-1 baseline. It is not an ordinary retained-data reader, does not validate a result, and does not certify baseline requirements as complete.

## Evidence checked

- Prepared allocation: `allocation.json` is present, 57,299 bytes, raw SHA-256 `0e5c9a9ae8ed11b60139c87896028b6ba88af7b984bdd002ddffae1df5e4d8d5`; it declares 36 slots and the reviewed request root `sha256:77f41d3db3986281c6b7920ca23a6cad53457ed41bf2407112a28bfafd30e470` and source root `sha256:9ba555e78f094004ea29229672d587f7d08a3ace06974d26219d61727a1441a6`.
- Actual entry: `entry.json` binds allocation root `sha256:851e13373686f825be17db4fdba70c52b3a6c586bf9822daeee14ded4757e16c`, the same request/source roots, and HEAD `1b5f59d62704cf6672b4ba2953925ddede8a9957`; it records parent PID 97464 and child PID 97547.
- Actual child terminal: `child-terminal.json` matches those allocation/source/HEAD identities and PIDs. It records `status: child_failed`, `signal: SIGKILL`, `exitCode: null`, elapsed upper bound 128,431 ms, and observation time 1791330306049 ms.
- Supervisor reasons: `parent-supervisor-reasons.json` reports `resource_threshold`, but also `uncertain: true`, `initiatingCause: unknown`, `failureReceipt: absent`, and `terminalization: unobserved`. Therefore the recorded supervisor reason does not establish which initiating threshold predicate fired or prove a guest-timeout cause.
- Closure ledger: `time.ndjson` has exactly three starts and three closes (preparation, pilot entry, finalization); the final close is 1791330306250 ms. The pilot-entry close is 1791330306049 ms, matching the child terminal observation.
- Accounting/result boundary: `ledger.ndjson` is zero bytes (no new charge recorded). The run directory contains no result artifact. The only live-run evidence is the entry and failure terminal metadata, alongside allocation, empty ledger, supervisor reasons, seal metadata, cold-reuse metadata, and time journal. No empirical result or accepted retained check exists.
- Identity/process check: repository HEAD currently remains `1b5f59d62704cf6672b4ba2953925ddede8a9957`, matching entry and terminal. A process-table check found no process for PIDs 97464 or 97547 and no matching run process. Allocation raw bytes and empty ledger were hashed read-only; no historical artifact was modified.

## Verification result

| Check | Status | Evidence |
| --- | --- | --- |
| Unique entry and allocation identity join | VERIFIED | Entry binds the approved allocation, request, source and HEAD roots; 36-slot allocation is present. |
| Finite terminal/closure custody | VERIFIED | Matching child-terminal record; three start/close pairs; finalization closed; parent and child PIDs absent at inspection. |
| Successful baseline result | FAILED | Terminal status is `child_failed` with SIGKILL and null exit code; no result artifact exists. |
| Charge/credit boundary | VERIFIED (no new charge) | Ledger is empty; no result or accepted check supports empirical credit. Thirty predecessor charges remain historical and are not reversed or reinterpreted here. |
| Initiating resource predicate | UNCERTAIN | Supervisor records `resource_threshold`, but explicitly leaves initiating cause unknown and failure receipt absent. Do not infer a specific threshold or guest timeout. |
| Phase/requirements completion | NOT COMPLETE | Preparation records `requirements_complete: false`; this failed baseline establishes no empirical credit and does not complete Phase 265. |

No result was reconstructed, no ordinary reader was run, no new run or test was started, and no allocation, ledger, route, result, or historical time record was edited. This report does not authorize a retry, replacement baseline, or new charge.
