# Plan 265-16: Prospective private startup integration — research v1

## User Constraints

This is a supplement to existing Plan16, not new phase-wide research or a new numbered plan. The complete `265-CONTEXT.md` remains binding; the following operative excerpts are verbatim, with source material fenced as data. [VERIFIED: 265-CONTEXT.md]

DATA_H8K4P2R7_START
- **D-01:** All inputs and outputs are immutable and content-addressed. There is no mutable `latest`, implicit active population, or result selected by directory order.
- **D-02:** Missing, stale, contaminated, incomplete, conflicting, or identity-mismatched evidence fails closed. A process-valid disappointing empirical result is preserved as a valid finding; a process or integrity failure blocks the phase gate.
- **D-03:** Every Match advances through the exact admitted `MATCH_KERNEL`. The league may orchestrate work around the kernel but may not copy rules, introduce an alternate legality or transition loop, or use the historical direct-source matrix runner as an execution boundary.
- **D-04:** Candidate source is hostile and runs only through the supervised provider/runtime boundary established by Phases 263–264. No source executes in the league coordinator, web, API, Go backend, or a direct `new Function`/dynamic-import path.
- **D-05:** Every candidate attempt, retry, invalid output, rejection, clone decision, weak response, runtime or system failure, and unused allocation remains charged and represented in the evidence root. Reports cannot retain only successful attacks.
- **D-06:** Cycle cap, MOVE and reversal behavior, Backstab geometry and timing, activation counts, arena geometry, runtime rules, and every other production rule remain fixed. No formation namespace, state, candidate, prompt, cache, trace, replay, or result may exist in this phase.
- **D-25:** Compact all-slot accounting/results and preselected compressed/failure replay retention with new schema; old full readers untouched.
- **D-27:** All populations/analysis/finalists/equality freeze before one sealed opening; honest partial/inconclusive on missing evidence/caps, no retry of consumed routes.
- **D-28:** Canonical rules/kernel and guest1000/host5000/Match600000 unchanged; all lab private, no promotion/counting/public/production; later-rules packet only.
DATA_H8K4P2R7_END

### the agent's Discretion — verbatim operative excerpt

DATA_V6T1M9C3_START
- Stable internal reason-code names and filenames are flexible if schemas preserve the locked three-way failure semantics and all required evidence remains machine-verifiable.
DATA_V6T1M9C3_END

### Deferred Ideas — verbatim

DATA_Q5N8B2W4_START
- Starting-formation materialization and production-unreachability proof begin only after a valid Phase 266 current-league freeze.
- Current-edge, inward, and bracket retraining belongs to Phase 268 and cannot borrow learned state from this league.
- Full ordinary product certification is reserved for exact eligible pre-formation current finalist hashes in Phase 269.
- Cycle-cap, MOVE/reversal, Backstab, scan-timing, arena, runtime, and combined-rule experiments require later separately approved work.
DATA_Q5N8B2W4_END

The fresh approved envelope is anchor1791747362000 /19:36:02UTC, hardstop1791752762000 /21:06:02UTC, carry399420903ms/cap404820903ms. Existing1860000ms closure reserve plus600000ms Match makes latest entry1791750302000 /20:25:02UTC. All elapsed work/idle/wait counts. Exactly ONE new private full current-rules game, zero probes/retries/second games; historical42 becomes cumulative43 if charged. All old consumed objects/readers/constants remain immutable. Guest1000/startup2500/host5000/Match600000ms, RAM3GB/scratch2GB/retained12GB/total15GB/300Matches stay unchanged. [VERIFIED: 265-16-PRIVATE-STARTUP-INTEGRATION-APPROVAL-v1.md]

## Project Constraints (from AGENTS.md)

Keep the engine pure, deterministic, serializable and side-effect free; no game rules in React or Strategy execution in web/API, no engine random/time/filesystem/network/database, and no Node vm security boundary. Treat source as hostile; schema-validate runtime boundaries; preserve canonical terminology and immutable submitted Revisions; public replay excludes source/memories/objectives. Read the five planning authorities before implementation; follow roadmap order. Engine needs focused/property tests; replay needs reconstruction/integrity and board realism/browser validation when changed; runtime needs invalid-output/timeout/capability/limits/schema tests; worker failure classifications must distinguish Strategy from system failure; end-to-end coverage spans edit→submit→MatchSet→execute→replay. Keep updated planning documents committed, with commits owned by ROOT in this delegation. [VERIFIED: AGENTS.md; ROOT task ownership]

## Summary

Use a new V3 private lane with its own literal allocation/window/context/opaque handles/CLI/terminal/result/reader. Preserve the shipped V1/V2 surfaces. The existing dormant receipt validates genuine failed evidence, but its available branch needs an exact transient `trustedRequest`; current entry never receives one. Existing finite receipts and compact accounting contain commitments, not the preimage. The old validator additionally insists on a V2 allocation, so calling it directly with V3 is not valid. [VERIFIED: scripts/run-v1-38-lean-private-matches.ts:406–444,545–580]

Recommendation: capture one V3-only failed request preimage behind genuine-return provenance, consume it once in the V3 live producer, validate using a V3 full-preimage equivalent, immediately delete the preimage, and persist a finite witnessed receipt. The separate retained V3 validator must check all available schema/accounting/admission/commitment joins and explicitly disclose that raw transport re-encoding is unavailable. This is source-authenticated live capture plus retained integrity, not an independent reconstruction of raw source/input from hashes. ROOT explicitly accepted this boundary; do not weaken `verifyLeanPrivateStartupReceiptV1`. [VERIFIED: source inspection and ROOT research direction]

No repair to startup timing, native runtime, supervisor, canonical rules or assumed physical cause is researched or recommended. The initiating failure remains UNKNOWN. [VERIFIED: 265-16-ONE-MATCH-DIAGNOSIS-RESULT-v2.md; approval-v1]

## Architectural Responsibility Map

| Capability | Owner | Boundary |
|---|---|---|
| Admission, carry, capacity and charge | Trusted private host authority | New V3 opaque handles; before any provider dispatch |
| Actual request/observed startup joins | Trusted native composer | Current invocation only; native.verify and exact identity |
| Live preimage validation/finite publication | Private runner | Consume genuine V3 return once; no raw serialization |
| Retained integrity | Separate V3 reader | Disk/source/allocation/accounting/commitment joins; no native invocation |
| All game transitions | Existing MATCH_KERNEL | No new rule implementation |

Ownership map is derived from inspected existing seams. [VERIFIED: authority.ts:659–678,806–841; baseline-match.ts:122–273; runner.ts:545–624]

## Standard Stack / Don't Hand-Roll

Reuse repository canonical JSON, `labRoot`, `leanBytesRoot`, exact-key validation, existing secure exclusive file primitives, `encodeSubprocessIpcRequest`, `leanCorrectionInvocationTransportBinding`, `validateLeanStartupOriginV8`, `bindLeanCorrectionInvocation`, canonical kernel and supervised native providers. No new package, signing system, custody service, guest instrumentation or general-purpose event log. Existing package.json declares vitest^4.1.6/tsx^4.22.0/typescript^6.0.3; these are declared ranges, not freshly probed installed versions. No install or registry audit is needed. [VERIFIED: inspected source imports/functions; package.json:142–145]

## Minimal Ownership and Version Seams

Exactly seven source/test paths are recommended; this is a design recommendation derived from the following verified seams, not permission to edit extra files. [VERIFIED: inspected source boundaries]

| Owned path | Minimal required responsibility |
|---|---|
| scripts/lib/v1-38-lean-experiment-authority.ts | Add V3 literals/types/maps/carry/window/allocation/resources/commit authentication/admission/debit/context/issuer/checkpoint/close; never change V1/V2 constants or validator acceptance |
| scripts/lib/v1-38-lean-experiment-authority.test.ts | Inert own-version/forged-handle/fresh-capacity/carry/window/single-charge tests |
| scripts/lib/v1-38-lean-baseline-match.ts | Add authenticated route.version3/runLeanPrivateFeasibilityMatchV3; select V3 context/checkpoint/issuer; separate genuine-return receipt and one-shot preimage provenance |
| scripts/lib/v1-38-lean-baseline-match.test.ts | Genuine V3 context → actual native option/request observer → failed evidence → finite capture; success/throw/absence cleanup; V1/V2 unchanged |
| scripts/run-v1-38-lean-private-matches.ts | Own V3 metadata/prepare/entry/verify dispatch, finite live and retained validators, exact V3 evidence/terminal/result schema and closure |
| scripts/run-v1-38-lean-private-matches.test.ts | Connected inert composer→entry producer→durable fixture→reader; tamper/privacy/compatibility/closure regressions |
| scripts/lib/v1-38-lean-container-match-session.ts | Add ONLY bounded readLeanPrivateMatchGitV3 metadata API; preserve V1/V2 argv predicates and native session/supervisor/harness |

Critical issuer trap: `issuePrivateMatchSeat` currently treats every non-V1 allocation as V2 for commit authentication. Add an explicit V3 branch and strict V3 context, not a shape-cast V2 handle. Continue issuing the unchanged V8 startup grant, the same startup policy/harness, source/runtime binding and bottom-then-top minting order. Existing shared low-level file/identity helpers can be reused if their acceptance does not expand old route contracts. [VERIFIED: authority.ts:659–678]

Add V3 `readLeanPrivateMatchGitV3`, rather than repurposing V2. Own command parser accepts only `metadata-v3`, `prepare-v3`, `entry-v3`, `verify-v3`, exact bounded flags, `.planning/artifacts/v1.38-phase-265-private-match-allocation-v3.json` and `.strategy-lab/lean-private-matches-v3/<allocation-hash>`. Use distinct domain-separated V3 request/slot/pair/debit/entry/terminal/result/window roots. Preserve old parser default/dispatch/readers. [VERIFIED: session.ts:43–57; runner.ts:502–534,624–628; design recommendation]

Recommended exact exports: `parseLeanPrivateMatchesArgsV3`, `prepareLeanPrivateMatchesV3`, `enterLeanPrivateMatchesV3`, `verifyLeanPrivateMatchesStoreV3`, `runLeanPrivateFeasibilityMatchV3`, `readLeanPrivateMatchGitV3`; each existing allocation/resources/capacity/commit/admission/debit/context/issuer/checkpoint/close authority name with suffixV3. Receipt exports: `produceLeanPrivateStartupReceiptV2`, `verifyLeanPrivateStartupReceiptV2` (live full-preimage), `verifyLeanPrivateStartupReceiptRetainedV2` (retained commitment-only). Metadata flags remain exactly `--source-store`; prepare flags `--source-store --source-head --candidate-raw-root --opponent-raw-root`; entry/verify flags `--allocation-commit --allocation-path --store`, with no caller receipt/preimage flags. [VERIFIED: existing V2 names/flag shapes; design recommendation]

## Live Preimage Pattern

1. Before actual V3 `native.invoke`, create the exact ordered request object `{ source: executableSource, methodName: request.kind, input: request.input, outputByteLimit:262144, requestOrdinal }`. Compute V8 transport commitment with the existing encoder. The transport uses JSON.stringify of the ordered raw request payload; canonical re-encoding is not interchangeable. Existing session caps payload at524288 bytes and enclosing frame at1048576 bytes; enforce the same limit for any retained transient copy, not an arbitrary new cap. [VERIFIED: baseline-match.ts:82–89,188–189; subprocess-ipc.ts:159–167; session.ts:166,562–574]
2. One current candidate per provider; validated V8 callback only. Require exact observer requestRoot/source/executable/input/method/requestOrdinal/seat/allocation/debit/harness/policy join. After genuine native return require `native.verify`, charged unique system failure, exact identity and factory-private diagnostic joins; successes discard state. [VERIFIED: baseline-match.ts:164–211,258–273]
3. Keep at most ONE failed request across the real V3 composition, keyed privately to the exact failed evidence and then the genuine result. A one-shot accessor/consumer may expose the transient request only to the trusted entry producer; no public result field, receipt override, caller observer, cloned-return acceptance, arbitrary supplied request or global last-request variable. Prefer a consumer callback that deletes its WeakMap entry in finally, with inaccessible request material once callback ends. Native provider closures already retain executable source while active; do not accumulate success inputs or duplicate provider histories. [VERIFIED: existing composer provenance/closure pattern; design recommendation]
4. New V3 full-preimage validator independently recomputes V8 transport and all joins equivalent to old dormant validator, with V3 allocation authentication. Do not relax or rename V1 into a generic acceptance mode. The live V3 producer uses genuine return provenance internally and consumes/deletes request in finally even on projection, guard, serialization, publication or validation throw. Composer error/finally clears active candidates; failure without usable callback/preimage yields exact unavailable/null, never invented metadata. [VERIFIED: runner.ts:406–444 and composer cleanup; design recommendation]

## Finite Durable Schema and Independent Reader

Add a new exact finite `lean-private-startup-receipt-v2` schema, with the existing whitelist of identity/origin/invocationBinding plus a literal finite validation-scope field such as `validationScope:"live_preimage_retained_commitments"`; available means live producer completed full validation. Unavailable has all three evidence fields null and scope `unavailable`. Preserve4096UTF8byte ceiling and finite V8 enums/ordinal limits; do not add raw request, executable/source/input/output, errors, stdio or memory. Names are implementation discretion, semantics are mandatory. [VERIFIED: old exact schema/4096byte gate at runner.ts:395–444; ROOT accepted boundary; design recommendation]

Persist this one finite value inside a new V3 evidence envelope, so the existing terminal raw anchor binds it without an extra storage file. Version success/failure evidence, terminal and result explicitly; no field inserted into V1/V2. Preserve existing stream/accounting validators by extracting version-neutral logic only if old wrapper behavior is unchanged. The V3 terminal/resource/close reader must accept both ordinary successful resources and the own-version finalization envelope for failure; exclusive publication must never be retried after it begins. [VERIFIED: runner.ts:479–498,545–624; design recommendation]

Independent V3 retained validation requires exact keys/byte ceiling/V8 validation, authenticated allocation/debit/slot/provider set, unique charged failed row, admitted seat/source/executable/runtime/image/harness identity, requestId/invocationRoot/inputRoot/method/provider-local ordinal and requestOrdinal=ordinal+1. Independently reconstruct the invocation binding using retained commitment fields and authenticated accounting; verify equal origin/request commitments and all terminal/result raw roots/inventory/resources. Reject extra/duplicate/wrong-version/self-consistent identity substitutions. No old empirical reader is called. [VERIFIED: existing validators and full-identity checks; design recommendation]

The retained reader cannot recompute payloadRoot/requestRoot from only inputRoot/executableRoot. Expose `requestPreimageRecomputed:false` (or equivalent finite explicit scope) and state that the request commitment witness was validated in the held reviewed source before raw preimage deletion. A self-consistent substitution of requestRoot+payloadRoot+origin can defeat commitment-only algebra unless independently anchored observed terminal/result bytes are also held fixed; do not claim the reader alone proves origin issuance. ROOT's actual fixed result/terminal byte anchors, source+HEAD hold and genuine-return live witness define the provenance boundary. Without that boundary, available-origin authentication is unavailable, not upgraded by a caller assertion. No signing/attestation system is necessary or recommended. [VERIFIED: source encoder and validator dependency; ROOT explicit scope direction]

## Actual V2 Carry — Pin, Do Not Re-Read Empirically

The closed current V2 retained report supplies the following exact custody inventory. Its actual reader73167 is already CLOSED; these values are historical evidence pins, never authority to rerun it. [VERIFIED: 265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md]

- Allocation root: `sha256:8ddf0092116ac00397e500ddf897ee14f2038256e7e064f97053859c7cb47f6a`.
- Allocation commit: `30d61b7df02f594f4fda226bffcaeb101cae64dc`; sourceHead `165cead9cd236452bc49b6cc45ca19fcd7b8da99`.
- Result root: `sha256:b7a87f9a24a6b3918b45e5c424ce345fba4fafea15f502e73b81331258d67ac8`.
- Terminal root: `sha256:2be5fc99bd89aadabcd1060d7feb3616bc688b71d6af83ffd8ef88f695c4a8e3`.
- Actual eight-file store352256 allocatedB + canonical allocation24576B =376832 allocatedB; cumulative42, one failed ordinal0, no unused slot. Historical peaks unknown. Prior aggregate29970432B + probe65536B + V1route360448B remain separate carry; committed old source-prefix1830912B remains disclosed and must not disappear/refund. [VERIFIED: actual report/result-v2]
- Reader-report byte root observed by this research: `sha256:ba61aeb6128c3db230738157d70cfdd261b3d77de7dd87005a04275a7acedec0`. [VERIFIED: shasum of selected report only]

| File | Exact SHA256 bytes pin |
|---|---|
| canonical V2 allocation; store allocation.json | a67980a982c801d36e490a1305457cf7c2c5b5cb63a09c73c44dd6b3c15708db |
| entry.json | b3a2a06ef68a4153ada490d2390035fe7cf345be05872314a107073c08f54769 |
| ledger.ndjson | 1cd50a2df25633f3e88792186e35415da65ed0d006621674dc142547b3e9b8fd |
| pair-0.json | ab7d8722ab998a2dd46ecc0c1826551061243938ca935bd77f2ee10190ecc7f8 |
| debit-0.json | 06fdd8501a82ef78a692b7cf7f9efab536f1413b483e8b6a718c56bf5b27d9c4 |
| terminal-0.json | b161e5e670fa31f121b7ff6815fafa0edd0483cb1158ac6dc7f3e8a7dedbdb2c |
| replay-0.ndjson | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| result.json | 2244c3ce896c77c357e97e6de471df6d59ebe22a0f3b577f692e68c2eedba436 |

Every table cell above is report-verified, not a new actual-store inspection. [VERIFIED: selected retained report]

V3 carry authentication should reopen only the pinned eight bounded regular0600 single-link files, real0700 directory, canonical0644 allocation and selected report bytes; compare exact inventory/raw roots/logical joins and allocation commit parent/sourceHead without requiring historical commit=currentHEAD. Reuse old V1 carry authentication for prior360448B if unchanged; add a separately literal V3 carry binding actual V2 pins and historical42. Do not invoke V2 store reader, authenticate old allocation via its currentHEAD entry gate, or inspect its old sourcePrefix against now-modified live files. Authenticate old prefix commitment against committed old bytes/pinned allocation; current source prefix gets its own fresh V3 root and physical observation. Prevent overlapping live source files from being silently dropped or incorrectly double counted; retain a conservative disclosed carry if needed. [VERIFIED: V2 carry/commit/prefix behavior at authority.ts:702–749,789–803; design recommendation]

## Admission and Serial Gates

The additive plan should have three serial tasks: (1) V3 authority/context/carry/Git seams and inert tests; (2) V3 composer/live finite capture/persistence/reader and connected inert tests; (3) ROOT actual one-game procedure after source gates. Use exclusive author ownership across the seven paths, independent review/fix, ROOT focused validation/scoped strict comparison, distinct source verification. Reuse unchanged dormant source proof only, not V3 integration readiness. [VERIFIED: approval-v1; design recommendation]

ROOT fixes reviewed source, authenticates fresh metadata once, prepares ONE empty fresh store/allocation, commits allocation as direct child of fixed sourceHead, holds source+HEAD, starts ONE entry, samples fresh same-process capacity before charge, durably charges ordinal0/cumulative43 before providers, then executes canonical full Match. No source dispatch may occur after20:25:02UTC. After actual terminal/result closure ONE distinct actual V3 retained verifier reads at the actual held HEAD; if no actual result/head exists use terminal-only reporting, never fabricated inputs. Close all commands/roles before handoff; no competing heavy work or repeated actual readers. All elapsed costs continue to21:06:02UTC. [VERIFIED: approval-v1]

## Validation Architecture

Nyquist is enabled in config. Research ran no tests, runtime, probes, actual readers or package installs; implementation tests must use existing inert provider/kernel/authority seams. [VERIFIED: .planning/config.json; research command scope]

| Requirement | Support / tests | Existing file |
|---|---|---|
| LEAG-02: failed/missing/invalid cells block meta-solving; no imputation | V3 exact classification/carry/charge/finite failed row; no success from cleanupStop | authority/runner/baseline tests exist |
| LEAG-05: inspect evidence qualified by populations/conditions/oracles/budgets | finite source-authenticated lifecycle witness plus explicit retained limitations | runner/baseline tests exist |
| LEAG-09: preserve failed attacks and exclude runtime artifacts from leading claims | source/runtime identity joins, exact historical42→43, no empirical phase credit | all three focused test files exist |

Requirement descriptions are summarized from REQUIREMENTS.md; no requirement becomes completed by this supplement. [VERIFIED: REQUIREMENTS.md:117–125]

Quick task run: affected owned Vitest test file. Full focused command: `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-baseline-match.test.ts scripts/run-v1-38-lean-private-matches.test.ts`. Keep the scoped strict baseline identities (13 inherited, zero new; not globally green), configured runtime project type check and existing factory boundary check. ROOT chooses affected validation once, not redundant unchanged historical/native certification. [VERIFIED: existing source plan/STATE; design recommendation]

Wave0 additions: genuine V3 handles versus forged/opposite-version; fresh source/allocation direct-child metadata; exact pinned V2 carry/no old reader call; clocks/latest-entry/reserve/full physical carry; one charge before dispatch; connected actual observer/request capture; stale/duplicate/malformed callbacks; one-shot preimage cleanup on every failure; clone/foreign return refusal; full live requestRoot/payload/input/executable mutation; retained join mutation and honest commitment-only limits; terminal raw anchors and no exclusive-write retry; raw sentinel/multibyte4096UTF8byte privacy; V1/V2 fixture compatibility. Successful fixture board evidence must be canonical and within arena bounds; local browser realism is an actual replay gate if replay/Match creation changes are exercised. [VERIFIED: source gaps and AGENTS testing expectations; design recommendation]

## Security Domain

The project config does not disable security enforcement. This private offline change uses opaque admitted capabilities rather than new authentication/session features. Access control and input validation apply at handle/seat/debit/request/persistence boundaries; cryptography uses existing hash/canonical primitives, not a hand-built signing system. No account auth/session redesign is in scope. Exact ASVS numeric-category version is not established by this source-only research; do not claim formal ASVS certification. [VERIFIED: config/source scope; ASSUMED: category-label applicability pending exact ASVS edition]

Primary threats: forged/cloned genuine return; opposite-version handle reuse; stale/duplicate observer callbacks; self-consistent substituted commitment witness; raw private preimage leak; unbounded history; symlink/file replacement; charge refund/old reader revival; terminal rewrite after partial exclusive publication. Mitigations are the exact provenance/joins/finite whitelists/finally deletion/secure publication/held raw anchors/own-version admission and historical carry already specified. [VERIFIED: inspected seams and existing source plan threat model]

## Runtime State Inventory / Environment Availability

This is additive prospective integration, not rename/migration. Stored state: all42 consumed charges/V1/V2 allocations/results/reports immutable; new V3 store only. Live service configuration and OS registrations: no change proposed or probed. Secrets/env: no change proposed or inspected. Build artifacts: no install/rebuild/package rename proposed. None of these unprobed external categories is claimed exhaustively absent. Actual Docker/provider availability/capacity is deferred to ROOT's one fresh admitted route; research intentionally did not probe or launch them. [VERIFIED: task scope and source plan]

## Open Questions / Assumptions

1. Actual initiating native physical cause and whether another game succeeds remain UNKNOWN; finite capture can record observed lifecycle fields, not guess OS exit/status70/OOM/timeout. [VERIFIED: result-v2]
2. Exact final source-prefix inventory/allocated bytes and live same-process capacity are not research outputs; obtain freshly at V3 preparation/admission. The V2 report is enough to pin376832B route carry, not historical peaks. [VERIFIED: report/source inspector]
3. Formal ASVS edition/category mappings were not fetched; they are not needed for this bounded private experimental task. [ASSUMED: applicability labels only]
4. Bounded transient one-failed-request capture and source-authenticated-live/retained-commitment scope are ROOT-accepted implementation direction, not an unapproved rule/resource decision. No new human choice is identified inside this exact scope. [VERIFIED: ROOT direction; approval-v1]

## Sources / Confidence / Research Scope

Primary sources inspected: selected top STATE and research SUMMARY; operative REQUIREMENTS/PROJECT/ROADMAP/CONTEXT; current integration approval; dormant receipt plan; actual diagnostic result-v2 and retained report-v2; the seven proposed source/test paths as needed; existing subprocess encoder and package.json. No broad history scan, consumed empirical reader, source edit, test/native execution, graph/provider fetch, package install or commit occurred. Only this research file is written. No project-defined skill index was found by the scoped skill-path inventory. [VERIFIED: research commands]

The classify-confidence seam is callable: `query classify-confidence --provider codebase --verified` returns LOW because its provider classifier does not recognize repository-source inspection as curated documentation. Keep that mechanical classification LOW rather than invent a provider tier; concrete source facts above are nevertheless individually tagged with their actual inspected source. No external library/API recommendation required a docs fetch or registry check. No claim of executed V3 behavior is made. Validity ends on relevant source/approval change; prospective V3 behavior requires the listed gates. [VERIFIED: seam output and research scope]
