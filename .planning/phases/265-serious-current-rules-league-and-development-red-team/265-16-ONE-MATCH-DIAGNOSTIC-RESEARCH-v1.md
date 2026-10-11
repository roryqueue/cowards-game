# One-Match Diagnostic Repair — Source Research

**Scope:** source-only finite failure-capture recommendation; no execution or authority.
**Approval boundary:** exactly one newly authorized private current-rules full Match, latest entry 14:58:43 UTC, hard stop 15:39:43 UTC (2026-10-11). The approved 14:09:43 UTC anchor and accounting carry are in `265-16-ONE-MATCH-DIAGNOSTIC-APPROVAL-v1.md`. This research does not extend that window.

## Finding

The failed two-Match artifact proves only that its final accounting row was `soldierBrain`, provider-local ordinal 82, charged and incomplete, with a compact `system_failure`; the initiating cause remains unknown. Do not relabel it timeout/native/container/resource failure. The diagnostic must be produced prospectively on the new v2 route; never repair, reinterpret, or reuse the closed v1 allocation/result/reader.

The smallest useful capture already exists in the runtime stack: `getFactoryPrivateDiagnostic(provider, evidence)` yields an identity-preserving private object only for evidence issued by that provider; its factory wrapper verifies the underlying evidence. `deriveLeanSupervisorDiagnostic(chargeRoot, execution, observed?)` already projects stage/reason/code/method/ordinal into a bounded diagnostic. The private producer currently omits this object and the failed row's native `systemFailure.code`, retaining only accounting classification and opaque roots. Therefore current retained evidence cannot distinguish caught transport/native refusal branches that collapse to the same incomplete row.

## Recommended v2 diagnostic schema

Use an exact-key, bounded schema (no strings from exception text):

```ts
type OneMatchFailureDiagnosticV2 = {
  schemaVersion: "lean-private-match-diagnostic-v2";
  availability: "available" | "unavailable";
  stage: "stream_exchange" | "outer_frame" | "inner_response" | "executor" | "system_failure" | "unknown";
  reason: /* existing finite LeanPrivateFailureOrigin reason whitelist */ | "system_failure" | "unknown";
  code: /* existing SUBPROCESS_SYSTEM_FAILURE_CODES */ | "UNKNOWN";
  method: "selectActivations" | "soldierBrain" | null;
  ordinal: number | null;
  invocationRoot: LabRoot | null;
  requestId: string | null;
  inputRoot: LabRoot | null;
};
```

Availability must distinguish authenticated failed-evidence code from an unavailable private origin: absence of origin must not discard an actual allowlisted `systemFailure.code`. The planner must make that partial-availability distinction exact; the sketch above is provisional. Do not fabricate a stage when no issued private origin exists (for example failure before provider evidence, or private observer/origin not enabled). `systemFailure.code` is copied only from the actual failed evidence and allowlisted; otherwise `UNKNOWN`. For an available diagnostic, require exact equality of identity, invocationRoot, requestId, method, inputRoot and ordinal against exactly one actual charged failed accounting row, then bind that diagnostic into terminal evidence/result roots before any privacy projection. If those joins fail, fail closed as diagnostic-unavailable/failure, never success. Keep source, raw errors, stdout/stderr, Strategy/objective/memory/input/output absent.

## Minimal ownership and integration

1. `scripts/run-v1-38-lean-private-matches.ts`: add producer helper/schema and exact verifier; obtain a diagnostic only through the existing producer-side private accessor while provider/evidence identity is still available. Include it in v2 failure evidence and its existing terminal/result commitment chain. Retained reader checks finite schema, whitelist, and joins to the single incomplete charged row. The currently separate `verifyFailure` path is the likely seam; successful evidence remains unchanged.
2. `scripts/run-v1-38-lean-experiment.ts`: expose only the route-local getter or a narrowly typed diagnostic projection from its existing WeakMap-backed `leanDiagnosticReaders`; preserve `deriveLeanSupervisorDiagnostic` legacy behavior and v1 `readLeanDiagnostics` semantics.
3. `scripts/lib/v1-38-lean-baseline-match.ts`: this is where native factory providers are created and current authority/close/finally lifecycle lives; thread a private diagnostic getter alongside actual result without exposing provider internals or changing runtime limits/session behavior.
4. `scripts/lib/v1-38-factory-supervised-runtime.ts` and `scripts/lib/v1-38-planner-supervised-runtime.ts`: reuse existing authenticated private WeakMap accessors. Extend only the diagnostic value if needed to include allowlisted native failure code; do not add a public/caller-supplied diagnostic injection API.
5. `scripts/lib/v1-38-lean-container-match-session.ts`: existing finite stage/reason origin whitelist is the authority for stage/reason values; do not widen it absent a demonstrated missing branch.
6. Add focused producer/reader tests in `scripts/run-v1-38-lean-private-matches.test.ts` for available joined diagnostic, unavailable diagnostic, unknown-origin, wrong invocation/method/ordinal/root, nonallowlisted code, tamper, and privacy rejection.

Avoid broad changes to the old V1 runner/reader or its allocation/window/count authority. New prospective allocation-v2/store-v2 must carry the 41 prior Match charges, 360448 allocated bytes, and all historical costs as immutable carry-forward, with one new charge maximum and a distinct canonical store-v2 identity. Never synthesize a V1 ledger, close an old interval, reclaim a charge, reinterpret an expired window, or use V1 evidence semantics as V2 authority. Preserve guest 1000ms, startup 2500ms, host 5000ms and Match 600000ms limits; this is observability repair, not runtime-limit repair.

## Planner gates and risks

- Keep the approved sequence: checked existing Plan16 supplement → source implementation → independent review/fix → ROOT validation → distinct source verification → immutable metadata/allocation committed before unique entry → fresh passing same-process capacity check → at most one Match → one appropriate retained verification.
- All research, planning, implementation, review, tests, preparation, wait, run and closure time count against the same approved 90-minute window and continuous carry. Source-gate completion14:45 UTC is a target, not an additional expiry; no dispatch after the binding14:58:43 UTC frontier or with missing source gates/custody. No gate removal.
- No standalone probe, retry, second Match, actual CLI/metadata/preparation/entry/provider/Strategy/Match during source-only work, monitor/allowlist widening, dynamic loader, raw diagnostic text, old artifact mutation, commits or pushes by this research task.
- A recorded native code/stage identifies only what the existing observer actually saw; it does not itself prove physical root cause. If observer evidence is absent, outcome stays explicitly unknown. A one-Match failure is accepted as failure, not empirical baseline/LEAG completion.

## Source basis

- `265-16-ONE-MATCH-DIAGNOSTIC-APPROVAL-v1.md` — approved limits, anchor, carries and stopping conditions.
- `265-16-TWO-MATCH-FAILURE-DIAGNOSIS-v1.md` — retained evidence and explicitly unknown initiating cause.
- `scripts/run-v1-38-lean-private-matches.ts` — `produceLeanPrivateMatchEvidenceV1`, `createLeanPrivateMatchFailureV1`, `verifyFailure`; current omission and finite evidence path.
- `scripts/run-v1-38-lean-experiment.ts` — `deriveLeanSupervisorDiagnostic`, private WeakMap-backed native diagnostic readers, legacy diagnostic reader.
- `scripts/lib/v1-38-factory-supervised-runtime.ts`, `scripts/lib/v1-38-planner-supervised-runtime.ts`, `scripts/lib/v1-38-lean-container-match-session.ts` — authenticated identity-bound accessors and finite stage/reason origin whitelist.
- `scripts/lib/v1-38-lean-baseline-match.ts` — current private provider construction and call/close lifecycle.

**Confidence:** HIGH for the omitted diagnostic seam and retained-row limitation (direct source/artifact inspection); MEDIUM for exact file ownership until implementation traces the current one-Match v2 branch. No test or runtime command was run.
