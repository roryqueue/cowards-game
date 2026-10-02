# Phase 265 v10 source-only IPC diagnosis

Disposition: INVESTIGATION INCONCLUSIVE for the initiating transport/runtime
failure. Diagnostic loss is confirmed in source; it is not proof of which
underlying exception occurred. No implementation, tests, probes, runtime,
provider, Match, retry, or consumed-artifact mutation was performed.

Source examined: bb98878e and its ordinary current descendants containing
planning-only updates. Source hold remains the root's responsibility through
the single retained verifier28015/PID11915; this diagnosis does not release it.

## Actual saved evidence

The genuine original and admitted invocation payload is e138c60f49cf14d9ccead78ef6fbee188998d88086acbeb7d1624e402ac7cb26
(18974 bytes). Both branches contain:

- ordinal=0, method=selectActivations, charged=true;
- completed=false, outputBytes=0;
- result.ok=false, violation.type=INVALID_OUTPUT;
- systemFailure exactly `{code:"MALFORMED_IPC",retryable:false}`;
- local-tactical TypeScript lane, runtime ABI v1.19, family=null.

No exception class, cause, stage, message, stack, stream state, child exit,
transport frame, or duration is retained in that failure object. Only safe
metadata/shape projections were emitted; private source, input contents,
objectives, memory, and credentials were not emitted.

Actual cell payload cf2a6d2565d1748cd9d64a25b6e7414c402821ae6abb497546793cae6e65e00d
(9837 bytes) has one accounting row, zero transitions, and
execution.failure.code=LAB_SUPERVISOR_FAILURE. Failure payload
59487fca1d2655cc85354dee2dff01bd13112c4f16e4a94f837910f1402f9792
(1261 bytes) has cell/start/failure fields, not missing transport details.
These are the actual consumed route, not rerun/old-route authority.

## Source-confirmed mechanism

`scripts/lib/v1-38-planner-supervised-runtime.ts:127` creates and charges an
incomplete, zero-byte evidence object before the executor call. Lines130–133
assign its result, completion, and serialized output bytes only after the
executor returns. Lines136–138 catch an exception, preserve an allowlisted
`SubprocessSystemFailure.code` when that actual class is present, otherwise
substitute MALFORMED_IPC, and retain neither original details nor safe origin.
The genuine zero-byte/incomplete shape therefore supports an exception before
executor return, rather than a normally returned invalid guest output.

Several independent paths can produce precisely this saved shape:

| Source boundary | Possible initiating exception | Saved code |
| --- | --- | --- |
| Lean stream transact, lines177–179 | ETIMEDOUT Error; STREAM_FAILURE TypeError | MALFORMED_IPC fallback |
| Lean outer frame, lines246–250 | framing, JSON, object-shape, correlation/base64 rejection | typed MALFORMED_IPC |
| Lean inner strict response, line201 | inner JSON/object/surplus-field/schema rejection | typed MALFORMED_IPC |
| ABI/executor parsing before return | thrown schema/validation or other host exception | MALFORMED_IPC fallback |

Broker worker receipt/lifecycle failures (`v1-38-lean-container-match-session.ts:82–116`)
can exit the broker without emitting a result frame; the stream surfaces child
failure as a TypeError. This is another candidate, not an observed broker exit.
The host exchange uses 1000ms from the planner executor configuration, separately
from the 600000ms whole-provider lifetime. No saved duration proves either
timeout occurred; do not label this a 1000ms or 600000ms timeout.

`packages/strategy-lab/src/runtime-bridge.ts:57–61` first appends returned
accounting and then rejects `!e.completed`; its catch at line77 produces
LAB_SUPERVISOR_FAILURE. Thus the cell code follows the incomplete accounting;
it does not establish a second independent transport cause.

## Eliminated or narrowed hypotheses

- Probe projection introduced the error: eliminated. Family is null, and the
  error is already present in original provider evidence.
- A normal returned guest INVALID_OUTPUT or returned selected-ABI mismatch
  alone caused this exact evidence: eliminated. Those return through the
  executor; planner serializes them to positive outputBytes. Actual outputBytes
  is zero. An exception during ABI/schema processing remains possible.
- Failure before planner invocation charge: eliminated as the explanation for
  this saved row. The row is charged, ordinal zero, and returned/retained by
  the provider path. Constructor/authority denial alone would not create it.
- Prior v9 FACTORY_RUNTIME_LIFETIME_EXHAUSTED: not the observed failure.
  Factory checks before/after invocation would throw outside this evidence
  return. No basis exists to substitute the old cause for current evidence.
- Prior v7 exact initiating cause: not established here. Existing typed-code
  preservation remains present; its generic-error fallback still loses origin.

Genuine malformed frame/correlation/inner output, broker lifecycle/child failure,
host exchange timeout, and other executor exceptions remain unresolved.

## Prospective wiring review

The bounded a98b5c2b→bb98878e source/test delta contains the actual thirteen
files: allocation source/test; factory supervisor source/test; prospective
lifetime authority; response runtime source/test; tactical corpus source/test;
planner supervisor source/test; serious-league runner source/test.

In the current source, the ordinary cell host issues prospective authority at
`scripts/run-v1-38-serious-league.ts:480–482`; factory lifetime admission claims
600000, then passes the same authority/MS options through runtimeOptions to
planner construction. Planner admission claims the nested 600000 authority
before session construction. Response construction similarly passes exact
prospective options at `v1-38-league-response-runtime.ts:199–205`.
The IPC frame/parser/broker/executor path was not changed by that prospective
delta. Invocation evidence shows construction and charge succeeded; no saved
evidence ties the new lifetime to the initiating exception.

Existing source tests intentionally assert that request-correlation, inner
surplus/invalid output, unknown Error, forged code/name, and unknown typed code
can yield identical incomplete MALFORMED_IPC evidence
(`v1-38-planner-supervised-runtime.test.ts:87–100`). Lean session tests also
mock ETIMEDOUT and poison/cleanup without fallback (lines259–266). These are
source-read observations, not new test executions or real-runtime proof.

## Minimal source-only next work and ownership

After the root releases the source hold, assign one TypeScript source owner to
`scripts/lib/v1-38-lean-container-match-session.ts` and
`scripts/lib/v1-38-planner-supervised-runtime.ts`, with their corresponding
mock test files. First extend existing injected-stream tests, without running
guest code or a broker, to cover an actual ETIMEDOUT-shaped Error, a stream
TypeError, wrong correlated request ID, malformed outer JSON, and inner invalid
JSON/shape. Assert current identical charged/incomplete zero-byte evidence,
one dispatch, stop-after-failure, owned cleanup, and no leaked payload text.
This reproduces diagnostic ambiguity, not the original v10 runtime trigger.

The smallest justified repair is safe diagnostic preservation, not changing
deadlines/resources/worker behavior. Preserve trusted finite failure-stage/reason
enums and bounded numeric stream/exit observations at their host creation sites;
expose an exact-object-issued private diagnostic bound to the invocation, so
the existing private retention wrapper can persist it for future NEW evidence.
Do not trust arbitrary error.message/name/code/details, copy raw stdout/stderr,
stack/source/input/memory/objective fields, or expand public failure output.
Keep classification, charging, no-fallback, completion, cleanup, both approved
600000 clocks, per-method limits, engine rules, and consumed evidence unchanged.

The root owns any small future wiring in the existing private
`wrapLeagueProbeProvider` retention path (`v1-38-league-response-runtime.ts`),
including compatibility with retained verification. Source-only mocks should
then distinguish trusted stream timeout, stream/child failure, outer framing,
correlation, inner schema, and unknown exception origins while preserving
redaction and the existing failure disposition. A source-only mock cannot
recover the omitted v10 exception or certify a live repair. No transport repair
should be selected merely from the shared MALFORMED_IPC label.

No new numbered plan, custody exercise, route, holdout access, formation work,
public/counting/production authority, or human technical checkpoint is required
by this report. Current-rules league/freeze remain incomplete and every consumed
route stays immutable.
