# Plan 16: Prospective Private Startup Receipt — Narrow Research v1

**Researched:** 2026-10-11. **Domain:** source-only private diagnostic retention. **Confidence:** LOW from `query classify-confidence --provider codebase --verified`; source observations below are reproducible repository evidence, not externally documented framework claims. No new package is recommended.

## User Constraints

The parent assignment constrains this supplement to prospective diagnostic-only source work: preserve consumed routes, all 42 charges, existing artifacts, schemas and resource constants; no old route upgrade/rerun, allocation or execution authorization. Hardstop18:13:01UTC remains binding and all work counts. [VERIFIED: parent assignment]

Relevant locked CONTEXT decisions, copied verbatim:

> - **D-01:** All inputs and outputs are immutable and content-addressed. There is no mutable `latest`, implicit active population, or result selected by directory order.
> - **D-02:** Missing, stale, contaminated, incomplete, conflicting, or identity-mismatched evidence fails closed. A process-valid disappointing empirical result is preserved as a valid finding; a process or integrity failure blocks the phase gate.
> - **D-04:** Candidate source is hostile and runs only through the supervised provider/runtime boundary established by Phases 263–264. No source executes in the league coordinator, web, API, Go backend, or a direct `new Function`/dynamic-import path.
> - **D-05:** Every candidate attempt, retry, invalid output, rejection, clone decision, weak response, runtime or system failure, and unused allocation remains charged and represented in the evidence root. Reports cannot retain only successful attacks.
> - Stable internal reason-code names and filenames are flexible if schemas preserve the locked three-way failure semantics and all required evidence remains machine-verifiable.

[VERIFIED: 265-CONTEXT.md; other decisions remain binding, not superseded by these excerpts]

Deferred formation, retraining, product certification and rule/runtime experiments remain outside this supplement. [VERIFIED: 265-CONTEXT.md Deferred Ideas]

## Summary and Recommendation

The demonstrated gap is lost validated startup metadata, not a diagnosed physical failure. `composeLeanNativeMatch` installs the observer and computes active transport bindings only when `legacy.correction.observe` exists. Private V2 supplies neither; the session validates the V8 receipt, optionally observes it, then deletes it. [VERIFIED: scripts/lib/v1-38-lean-baseline-match.ts:162,171; scripts/lib/v1-38-lean-container-match-session.ts:589-597]

Close the observation gap through an additive authenticated private receipt accessor bound to the real composer return. Keep the existing V2 accessor, producer, validator, parser, terminal/result schemas and consumed reader behavior unchanged. Add a dormant new diagnostic-only receipt schema and pure producer/validator, with no new command, allocation version, Match mode, issuer, grant or execution route. This is an implementation recommendation within Task2's actual-origin-join requirement, not authority for another attempt. [VERIFIED: ONE-MATCH-DIAGNOSTIC-PLAN-v1 Task2; parent assignment]

A future durable receipt-bearing terminal/result/reader route requires an explicit prospective schema integration decision and separate execution authority; this source supplement must not silently make V2 accept a new field/version. [VERIFIED: runner exact diagnostic/evidence/failure keys and parent assignment]

## Architectural Responsibility Map

| Capability | Primary owner | Secondary | Rationale |
|---|---|---|---|
| Validate observed startup metadata | Existing container session | Composer | Host validates exact V8 fields against issued binding before callback. [VERIFIED: container-match-session.ts:589-595] |
| Authenticate failed invocation receipt | Trusted composer | Provider verifier | Only verified charged failed evidence selects receipt. [VERIFIED: baseline-match.ts:218-239] |
| Finite projection and independent joins | Private producer/validator | Dormant future persistence | Runner already independently projects and checks failed rows. [VERIFIED: run-v1-38-lean-private-matches.ts:393-419] |

## Standard Stack / Don't Hand-Roll

Reuse `validateLeanStartupOriginV8`, `leanCorrectionInvocationTransportBinding(..., "v8")`, `bindLeanCorrectionInvocation`, factory private diagnostic provenance and repository canonical roots/identity projection. Do not create another supervisor, process-error classifier, timing framework, authority or mutable global last-receipt cache. [VERIFIED: baseline-match.ts:78-110, factory-supervised-runtime.ts:16-18; container-match-session.ts:369-375]

No external installs or version upgrades. Package legitimacy audit and external environment audit are not applicable to this code-only supplement. [VERIFIED: assigned scope]

## Smallest Exact Change Surface

1. `scripts/lib/v1-38-lean-baseline-match.ts`: prospective private V2 observation using the existing startup observer option, separate bounded state per provider, actual request transport binding computed before native invoke, cleared in `finally`; actual trusted failed evidence must select the exact ordinal receipt after `provider.verify`. Add a separately named private WeakMap accessor keyed exclusively by the real returned composer object; old V2 diagnostic object stays byte/shape-identical. Existing native issuance, kernel, cleanup and output remain unchanged. [VERIFIED: current composition and existing WeakMap pattern; recommendation]
2. `scripts/run-v1-38-lean-private-matches.ts`: add a separate exact-version dormant finite startup receipt projection/validation API beside, not inside, V2 persistence. Require actual accessor provenance in producer; independently validate identity and joins against one charged system-failure accounting row. Do not wire existing metadata/prepare/entry/verify modes to it. [VERIFIED: runner V2 source and parent scope; recommendation]
3. `scripts/lib/v1-38-lean-baseline-match.test.ts` and `scripts/run-v1-38-lean-private-matches.test.ts`: inert connected composer-to-producer/validator fixtures and backwards-compatibility assertions. [VERIFIED: existing test seams; recommendation]

No session source change is demonstrated necessary: its existing observer already receives validated normal metadata and is restricted to startup authority. If implementation discovers a missing transport option, stop and document that exact necessity rather than broaden this file set. No authority, runtime supervisor or engine file changes. [VERIFIED: session.ts:522,590-595; recommendation]

## Architecture Patterns and Finite Schema

Flow: actual private composer → existing issued V8 request → existing host validation → private bounded observed receipt → verified failed provider/evidence → real-return WeakMap → separate finite projection → independent row joins. Missing receipt → explicit unavailable value, never caller-invented origin. [VERIFIED: existing source seams; recommendation]

Use a new literal diagnostic-only schema version (e.g. `lean-private-startup-receipt-v1`), not a V2 schema widening. Its exact keys should contain availability, finite validated V8 origin, exact invocation binding and projected runtime identity; unavailable must have null evidence fields. Preserve the existing 4096 UTF8 byte diagnostic ceiling, not a new resource constant. Validate byte size of final canonical projection with UTF8 byte measurement, exact keys, finite enums, safe integer ordinals and root formats; never spread arbitrary unknown metadata. [VERIFIED: existing V2 ceiling/validators; recommendation]

Required equalities: provider identity/source/executable/allocation/debit/harness roots; seat; invocationRoot; requestId; inputRoot; method; provider-local ordinal; receipt requestOrdinal = provider ordinal +1; requestRoot and payloadRoot bound to the actual encoded request. Reuse V8 validation against the actual issued binding, plus `bindLeanCorrectionInvocation`; reject duplicate failed rows and multiple matching receipt candidates. Independent producer validation must not accept a caller-created lookalike return or diagnostic object. [VERIFIED: bindLeanCorrectionInvocation, V2 verified-failure path, runner verifyDiagnosticV2]

Keep receipt state bounded to the current invocation and at most its failed observed receipt per provider; do not retain every successful startup or all inputs. Host-deadline before observation, malformed receipt and observer failure remain representable as unavailable; do not synthesize a startup branch. [VERIFIED: session host-deadline checks and failed-only observation; recommendation]

## Backwards Compatibility and Task2 Disposition

Task2 required authentic available-origin joins and narrowly prohibited unrelated legacy observers/frameworks. The proposed wiring uses the startup observer already selected by the existing V8 grant, not the legacy correction route or fabricated ledger. Therefore a checked additive source-only supplement can close the missing observation/accessor subgap without changing failure semantics, accounting, authority or resource policy. It cannot claim that the consumed V2 artifacts now contain a receipt, that old Task2 durable retention is retrospectively satisfied, or that another run is authorized. [VERIFIED: Task2 action, diagnosis-v2 and current source; recommendation]

Keep all existing V1/V2 exact discriminators and key lists unchanged; assert legacy parser/defaults and V2 producer/reader fixture output remain unchanged. New accessor should reject foreign and cloned composer returns. New dormant projection must not be reachable by CLI dispatch. No consumed artifact edits and no old actual reader invocation. [VERIFIED: runner exact schema predicates; parent scope; recommendation]

## Common Pitfalls / Cause Limits

- Generic `originAvailability=available` currently means the finite private diagnostic exists, not that startup metadata survived. Do not conflate them. [VERIFIED: baseline-match.ts:236; retained-verification-v2]
- `SUBPROCESS_EXIT` may result from synthetic status70 or host-deadline branches. It is not proof of OS process exit, timeout, OOM or Strategy fault. Actual native initiating cause remains UNKNOWN. [VERIFIED: diagnosis-v2; session.ts:345,577,592,603,616,630]
- Observer-authenticated metadata alone is insufficient without transport/evidence joins, and host-validated malformed/mismatched receipt must fail closed. [VERIFIED: bindLeanCorrectionInvocation and session validation]
- Hashes do not sanitize private data. Only finite whitelisted stage/branch/state/counter/duration-bucket fields may leave the private accessor; no source, memory, objectives/payloads, raw input/output, stdio, error strings/stacks or IO. [VERIFIED: parent scope and existing finite V8 whitelist]

## Validation Architecture

Nyquist is enabled in `.planning/config.json`. Installed Vitest source tests are the established infrastructure; this researcher ran none. [VERIFIED: config; test files and assigned prohibition]

| Behavior | Planned inert validation |
|---|---|
| Real composer observer wired | Mock existing native factory and kernel boundary; capture actual observer options, invoke finite host-style metadata, return authenticated failed evidence; inspect real-return accessor. |
| Exact source/request/invocation/input/method/provider-ordinal joins | Mutate each join independently; require refusal including off-by-one, wrong seat/harness/debit and duplicate failed rows. |
| Independent producer validation | Real-return accessor → real dormant producer → independent validator; reject foreign/cloned return, hand-authored receipt, extra keys, version mismatch, oversized UTF8 and private sentinels. |
| Unavailable path | Failure without callback, generic executor/unknown and host-deadline-before-observer remain unavailable without physical-cause inference. |
| Backwards compatibility | Existing V2 projection/accessor/schema output unchanged; legacy observer/transport behavior unchanged; no new CLI mode, authority or resource constant. |
| Privacy/boundedness | Exact finite whitelist and bounded one-request/per-provider state; no raw private data retained. |

[VERIFIED: existing connected fixture patterns and source seams; recommended test map]

Planned focused command: `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-baseline-match.test.ts scripts/run-v1-38-lean-private-matches.test.ts`. Independent review, scoped fixes, final source validation and distinct verification must precede any separately authorized empirical action. Preserve/report inherited strict diagnostics by identity, not counts. [VERIFIED: parent workflow and existing Plan verification]

## Security Domain

Applicable controls: private accessor provenance/access control; exact finite input validation; canonical commitment integrity; denial-of-service protection through bounded receipt state and existing limits. This is internal offline diagnostic code, not a new web authentication/session or cryptography implementation. No ASVS version/category certification claim is made by this source-only research. [VERIFIED: assigned scope/source architecture]

## Runtime State Inventory

Stored evidence: consumed canonical allocation/store/42 charges are immutable; no migration. Live service configuration: not changed; none audited beyond source scope. OS registrations: not changed or inspected. Secrets/env: no rename/new key; not read. Build artifacts: no rebuild/install or artifact migration. This is additive source work, not a rename; no absence claim about uninspected systems. [VERIFIED: assigned scope]

## Open Questions and Assumptions

Physical cause and whether a future receipt would identify the actual failure branch remain UNKNOWN. Future durable schema/terminal/result integration remains dormant and needs prospective authority. There are no proposed factual training-knowledge assumptions or new package claims. Exact new schema/accessor name is a planner choice within finite diagnostic discretion. [VERIFIED: diagnosis-v2, parent scope, CONTEXT discretion]

## Sources and Closure

Primary repository sources: `265-CONTEXT.md`; `265-16-ONE-MATCH-DIAGNOSTIC-PLAN-v1.md`; `265-16-ONE-MATCH-DIAGNOSTIC-FAILURE-DIAGNOSIS-v2.md`; `265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md`; source files and test seams cited above. No framework documentation or new packages required. Confidence seam returned LOW for codebase provider; direct-source claims are explicitly repository-provenance tagged, not registry claims.

Only this owned research file was created. No tests, native/runtime/container/provider/Strategy/probe/Match, allocation, old reader, source edit or commit occurred. No formal certification, game feasibility, fullChronicle, LEAG, Phase265 or milestone completion claim. All remaining work counts toward18:13:01UTC; all42 prior charges remain consumed. [VERIFIED: this research actions and parent assignment]
