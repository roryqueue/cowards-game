---
phase: 265-serious-current-rules-league-and-development-red-team
verified: 2026-10-09T01:27:38Z
status: accepted_terminal_only
route: baseline
attempt_ordinal: 1
terminal_verification_command_exit: 0
terminal_verification_session: 38074
terminal_verification_root: sha256:065f3b437a4c0000e2977ba64cc1f1b7ef56fe400a2eeb96a2d35fcfc3ddd9fc
terminal_verification_bytes_root: sha256:9116153f759a6eea0b82d70834e508857ceb7a0fe468f2f46e58809a216cd9f3
carry_root: sha256:ed75f3956a950c59bd600ac51c166e3417cf40aefd3d4f07ff7230920f5776bc
closed_pair_root: sha256:3d6573193c9be86a94477ed1506a5a39b6f8d7adf3bc4c5303bb200b81df400d
source_root: sha256:6d986074c9b18530ee212984df21c135511f4a7fb8799be30e9d6552e80ba6a7
head: 7430c047d8ca51d0a70ed0916e6999e937bf39d3
allocation_root: sha256:2c824541ce02925d9e418ce7015d82c4dc9c56495b65fabf1b20e15550e48c28
request_root: sha256:da7f052eaa2bd57032289f7c228fe0c81f84a208200d4e0b4147783ad8ae8d6f
entry_root: sha256:5bf21ac84cf19391a4369e22ffc9754d6bf37d71c243ffd101a41c84224dc345
terminal_root: sha256:79119a111211c8b10354718d59847d6faa6fcff6d5d0358d73380055400f3e09
result_absent: true
check_absent: true
current_charges: 0
cumulative_charges: 36
cleanup_complete: true
---

# Post-v13 five-pair baseline v14-1 terminal-only verification

**Verified:** 2026-10-09T01:27:38Z  
**Terminal outcome:** `entered_without_result`; the unique terminal-only audit and its retained carry/closed-pair authentications passed. This is not a successful baseline.

## Actual command and authentication

Ran exactly once:

```sh
sh scripts/run-v1-38-lean-correction.sh verify-terminal-supervisor-baseline-v14-1 --request .strategy-lab/lean-correction-supervisor-baseline-request-20261008-v14-1.json
```

Tool session 38074 closed with exit code 0 after approximately 67 seconds. The result-absent terminal verification authenticated with `authenticateLeanPostV13TerminalVerificationV14("v14-1", "baseline")`; the saved baseline carry and v14 closed pair then authenticated with their corresponding v14 authenticators. That metadata-only authentication process exited 0 after approximately 10 seconds. No ordinary retained reader was invoked.

The authenticated terminal verification binds the actual entry HEAD `7430c047d8ca51d0a70ed0916e6999e937bf39d3`, source root, allocation, request, and terminal roots above. It records `accepted: false`, `finalReaderClose: false`, `resultAbsent: true`, `checkAbsent: true`, zero current charges, and 36 cumulative charges. The carry outcome is `entered_without_result`, non-authorizing, with 0 current and 36 cumulative charges. The closed pair records baseline as the last route, `endsEnvelope: false`, and no end reason.

## Safe outcome and limits

- The saved child terminal status is `child_failed` with `SIGKILL`; the recorded terminal classification is resource-threshold with uncertainty. The initiating cause and historical peak RSS/disk remain unknown. No causal/native-runtime conclusion is made.
- The result and accepted check are absent. No actual FINAL exists for this baseline. No charge was observed for the current route; cumulative charges remain 36 with no refund or recredit.
- Cleanup completed and the verifier/authenticator processes closed. The entry parent/child are absent. Git HEAD remains the held entry HEAD; the fixed source root remains unchanged.
- Resource limits remain unchanged: 165,600,000 ms, FULL 108,000,000 ms plus all wall time, 15 GB/300 Matches, 2 GB scratch, and 31-minute reserve through the existing deadline. No further route, rerun, or Match is authorized by this result.
- This is not accepted empirical success, a completed baseline, current-rules freeze, formation, holdout, public/counting/production, or Phase 265 completion. Existing source-only diagnosis authority remains separate; no new route is opened here.

## Closure

The exact terminal-only verifier, terminal/carry/closed-pair authentications, and process checks are closed. No source, STATE, allocation, canonical result, or historical record was changed; only this allowlisted report was added. No Strategy source, objective, memory, or runtime I/O is reproduced.

---

_Independent retained terminal verification; no source diagnosis, fix, or commit._
