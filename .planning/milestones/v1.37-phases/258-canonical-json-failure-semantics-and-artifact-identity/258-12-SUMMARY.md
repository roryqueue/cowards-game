---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "12"
subsystem: runtime-ledgers-capability-and-preflight-authority
tags: [runtime-abi, ledgers, receipts, preflight, resource-accounting, fail-closed]
requires:
  - phase: 258-08
    provides: TypeScript successor runtime boundary
  - phase: 258-09
    provides: Python successor runtime and exact source identity
  - phase: 258-10
    provides: Rust/Zig host-owned ABI and toolchain identity
  - phase: 258-11
    provides: Go canonical retry and PostgreSQL rollback authority
provides:
  - One signed per-method and cumulative Match ledger with separate preflight accounting
  - Host-observed causal receipts across TypeScript, Python, Rust, Zig, and Go consumers
  - Machine-readable fail-closed cross-lane capability evidence
  - Authenticated privacy-safe operational preflight that cannot grant counted authority
affects: [258-13, 258-14, 259]
key-files:
  created:
    - packages/spec/src/runtime-budget-profile-v1-17.ts
    - packages/spec/src/runtime-preflight-v1-17.ts
    - packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json
    - packages/runtime-js/src/candidate-host-envelope.ts
    - packages/runtime-js/src/candidate-process-runner.ts
  modified:
    - packages/spec/src/runtime-abi-v1-17.ts
    - packages/spec/src/runtime-invocation-v1-17.ts
    - apps/runtime-service/src/execute-match.ts
    - packages/runtime-python/src/python-subprocess-adapter.ts
    - packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts
    - apps/go-backend/runtime_invocation_v1_17.go
    - scripts/preflight.ts
key-decisions:
  - "Method, cumulative Match, and preflight ledgers are signed and disjoint; retries reuse exact prestate and cannot refill or double-debit."
  - "Only positively proven Strategy-owned exhaustion is a player violation; host, accounting, unavailable meter, ambiguous attribution, and infrastructure failure are no-commit system failures."
  - "A success receipt binds canonical payload bytes, exact host S-framed stdout, zero stderr, and actual lifecycle completion rather than caller declarations."
  - "Toolchain discovery is bounded separately from every signed Strategy method budget and cannot create counted authority."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-05, RABI-07, RABI-08]
coverage:
  - id: D1
    description: "Every invocation and retry uses exact signed method and Match prestate/poststate while preflight remains a disjoint ledger."
    requirement: RABI-03
    verification:
      - kind: integration
        ref: packages/spec/src/runtime-abi-v1-17.test.ts
        status: pass
      - kind: integration
        ref: apps/runtime-service/src/execute-match.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "All supported language paths bind receipts to observed causal bytes and preserve exclusive success, player-violation, or no-commit system-failure ownership."
    requirement: RABI-02
    verification:
      - kind: integration
        ref: packages/runtime-js/src/candidate-process-runner.test.ts
        status: pass
      - kind: integration
        ref: packages/runtime-python/src/python-subprocess-adapter.test.ts
        status: pass
      - kind: integration
        ref: packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts
        status: pass
      - kind: integration
        ref: apps/go-backend/runtime_invocation_v1_17_test.go
        status: pass
    human_judgment: false
  - id: D3
    description: "Capability and preflight evidence names exact meters, boundaries, enforcement, identity pins, and unsupported dimensions while every production trusted-producer set stays empty."
    requirement: RABI-07
    verification:
      - kind: contract
        ref: packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json
        status: pass
      - kind: integration
        ref: scripts/preflight-v1-17.test.ts
        status: pass
    human_judgment: false
duration: 5h 05min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 12: Runtime Ledger and Capability Authority Summary

Every successor runtime invocation now carries exact signed method and cumulative Match accounting, retries preserve the original ledger, and authenticated preflight evidence can report only what the installed runtime/toolchain actually proves. Missing or incomparable evidence fails closed without gameplay mutation, player penalty, or counted promotion.

## Performance

- Duration: 5h 05min
- Started: 2026-07-14T15:20:56-04:00
- Completed: 2026-07-14T20:26:15-04:00
- Tasks: 2 TDD tasks plus repeated independent review/fix convergence
- Change range: 71 atomic commits, 61 implementation/test/artifact/planning files

## Accomplishments

- Added one pure spec-owned ledger for exact method, cumulative Match, retry, and separate preflight accounting. Signed prestate and poststate cannot be reset, merged, widened, refunded, or double-debited.
- Bound runtime-service consumption to authenticated accounting and exact canonical input/success bytes. Valid decoded Strategy output is distinct from infrastructure-owned malformed transport.
- Made TypeScript worker, subprocess, and container paths start the signed method wall at trusted GO, independently cap raw stdout/stderr, require a trusted host envelope, and mint no receipt until actual close, EOF, and authoritative cleanup.
- Bound Python and WASM receipts to host-observed execution. Rust/Zig guests retain raw canonical payload ABI while the host owns S framing and every exclusive result classification.
- Corrected Go retry capacity and receipt counters at exact and one-over boundaries for both methods, including independent payload/stdout/stderr binding and direct preflight origin validation before bearer-token use.
- Generated a machine-readable capability artifact whose rows name units, scopes, measurement boundaries, enforcement mechanisms, exact pins, and unsupported meters. Incomplete or incomparable lanes remain uncertified.
- Replaced unsigned preflight declarations with authenticated request/receipt pairs and a real no-commit ledger debit. Default output is redacted and no route, token, source, artifact, memory, objective, or host diagnostic is exposed.

## Verification

- Root pnpm test completed all 14 package tasks.
- pnpm typecheck, pnpm lint, and pnpm build passed.
- Runtime service passed 79/79; Runtime JS passed 240/240; WASM/WASI passed 51/51; Python passed 47/47.
- Full Go package passed with the PostgreSQL test DSN in 10.642 seconds.
- Capability regeneration check reported checked=true and wrote=false.
- Go parity check preserved immutable v1.16 request SHA-256 5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5 and response SHA-256 9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97.
- Deep final review returned ZERO actionable findings.
- Protected pre-existing edits to .planning/config.json and CowardsGameSpec_Full_Consolidated_v1.md were never staged or modified by this plan.

## Decisions Made

- Treat startup/tool discovery and the signed Strategy method wall as separate bounded operations. READY/GO is the causal method-entry boundary.
- Count exact canonical payload bytes and the host-owned S frame separately: success requires payload=N, stdout=N+1, and stderr=0.
- Never infer player blame from a timeout, trap, process death, missing receipt, unavailable meter, or ambiguous provenance. Positive Strategy ownership is required.
- Keep the operational preflight honest: an authenticated system-failure/no-commit result proves the failure path and ledger invariants, not lane conformance.
- Preserve current v1.14/v1.16 behavior and bytes. All v1.17 work remains additive and inactive until the Plan 14 atomic activation.

## Deviations and Surprises

1. Signed wall timing initially included module startup. READY/GO separated host startup from player-influenced method execution without changing the frozen method limit.
2. A parseable result was not proof of a causal receipt. Multiple review loops found declared byte counters, package-visible evidence seams, and guest-forgeable text controls; the final bridge uses host-observed bytes and a fixed binary host envelope.
3. Process cleanup mattered to evidence truth. A container failure before CID creation returned a correct no-receipt result but leaked a referenced reaper; missing and invalid identities now settle deterministically without fabricating cleanup.
4. The preflight path had drifted into an unsigned diagnostic. It now exercises the same authenticated contract and explicitly returns no-commit/uncertified when operational meters or identity are unavailable.
5. Full Turbo load found integration defects invisible to focused suites: stale one-byte engine/service receipts, a replay proof whose test timeout was too tight under load, redundant Zig builds, and a one-second toolchain discovery false-negative. None changed a gameplay or signed runtime budget.
6. Stronger success predicates exposed the one-byte difference between raw WASM guest payload and the host-owned S frame. The guest ABI stayed raw; host accounting now records the canonical frame.

## Residual Posture

No runtime lane becomes counted from this plan. Production trusted producers remain empty. Plan 13 must close the exact evidence DAG and successor full-service receipt; Plan 14 alone owns atomic default activation and the final service-backed proof.

## Self-Check: PASSED

- All plan must-haves are implemented and tested.
- The final review is clean.
- No protected historical or user-owned file was staged.
