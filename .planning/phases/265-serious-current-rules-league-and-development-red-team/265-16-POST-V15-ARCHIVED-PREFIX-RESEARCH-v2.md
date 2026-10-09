# Phase 265 Plan 16 — approved successor-window source research

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-22:** Single cumulative 15,000,000,000-byte /28,800,000-ms /300-Match ledger across pilot, failed attempts and all profiles; no resets/refunds.
- **D-23:** Eight feasibility-only current pilot Matches select complete200/128matched tier before comparative outcomes; no formation before current freeze.
- **D-24:** Per arm two real cold-trained initial candidate attempts and one independent automated response attempt; identical64tactical/64teacher/64distillation/128response opportunity vector; model/human/external zero equally, one round.
- **D-25:** Compact all-slot accounting/results and preselected compressed/failure replay retention with new schema; old full readers untouched.
- **D-26:** Verified current baseline freeze before formation; identical cold workflow makes baseline edge arm, separately retrain other profiles with no learned cross-arm reuse.
- **D-27:** All populations/analysis/finalists/equality freeze before one sealed opening; honest partial/inconclusive on missing evidence/caps, no retry of consumed routes.
- **D-28:** Canonical rules/kernel and guest1000/host5000/Match600000 unchanged; all lab private, no promotion/counting/public/production; later-rules packet only.

### the agent's Discretion

None specified for this narrow source-accounting supplement; retain exact prior bounded-source scope and recommend only the minimum additive policy needed to reflect the approved timing window.

### Deferred Ideas (OUT OF SCOPE)

- Starting-formation materialization and production-unreachability proof begin only after a valid Phase 266 current-league freeze.
- Current-edge, inward, and bracket retraining belongs to Phase 268 and cannot borrow learned state from this league.
- Full ordinary product certification is reserved for exact eligible pre-formation current finalist hashes in Phase 269.
- Cycle-cap, MOVE/reversal, Backstab, scan-timing, arena, runtime, and combined-rule experiments require later separately approved work.

## Summary

The direct approval recorded in `265-16-POST-V15-TIMING-APPROVAL-20261009.md` extends the single continuous prospective window by exactly 28,800,000 ms from the actual ROOT resume at 2026-10-09T18:14:32Z. Its cumulative cap is 250,530,903 ms and absolute deadline is 2026-10-10T02:14:32Z, with the same 1,860,000 ms terminal reserve. [VERIFIED: phase approval record]

The checked archived-prefix v2 plan and v2 plan-check are still the governing source-contract scope; the check passed planning quality only, not implementation authorization. The timing approval now permits the bounded prospective source work contemplated by that plan. It explicitly requires retaining the consumed v15 policy as-is and adding a separately named successor envelope selected only for an actually new applicable ordinal. [VERIFIED: plan-check v2; phase approval record]

**Primary recommendation:** Make a minimal additive successor-envelope policy for v15-3, keep the old v15 constant and all consumed v15-2 interpretation byte/behavior-compatible, and route future policy lookup, cap admission, timing guards, and source identity through one exact mode-selected policy. Preserve the original 108,000,000 ms floor once; do not add the prior 221,730,903 ms elapsed as a new floor on top of it. v15-4/5 remain dormant and fail closed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Successor timing-policy definition and mode selection | API / Backend (source policy module) | — | `lean-experiment.ts` owns timebox extension types, policy admission, mode bindings, and cap selection. [VERIFIED: source grep] |
| Fresh-route deadline/reserve enforcement and source binding | API / Backend (supervisor CLI) | — | `run-v1-38-lean-correction.ts` consumes policy for setup, reservation, continuation, allocation, and source-manifest guards. [VERIFIED: source grep] |
| Archived refusal facts as non-authorizing cost input | API / Backend (custody reader) | — | `v1-38-lean-resource-window-v15.ts` is the existing reader/consumer boundary; v2 plan requires a distinct additive v15-3 custody path. [VERIFIED: source code; plan v2] |

## Standard Stack

No new packages or external dependencies. Use the existing TypeScript modules, immutable exact-key/schema and root helpers, and focused Vitest tests already used by this policy boundary. [VERIFIED: repository source/tests]

## Architecture Patterns and Concrete Source Seams

| Seam | Current responsibility | Successor-window planning implication |
|---|---|---|
| `packages/strategy-lab/src/league/lean-experiment.ts` — `resourceWindowBodyV15`, `LEAN_RESOURCE_WINDOW_V15_POLICY`, `LEAN_RESOURCE_WINDOW_V15_CAPS` | Defines the currently consumed v15 policy (36 prior charges, 223,171,903 ms cap, older start/deadline), its schema/root, and caps. [VERIFIED: source lines 1916–1928] | Freeze these exports unchanged. Define a distinct successor policy/schema/root and cap, with approval-root and plan-root bindings to the exact successor records. |
| `leanProspectiveBudgetBinding`, `admitLeanRetryTimeboxExtension`, `leanRetryExtensionCaps`, allocation mode reconstruction, `leanPreparationProtocolBinding` | Select/admit extension policy and return caps; current v15 family maps every ordinal 2–5 to one policy. [VERIFIED: source lines 143–177, 817–820; correction source lines 105, 443] | Keep v15-2 on old policy. Select successor only for v15-3; reject successor on v15-2 and dormant v15-4/5. Ensure each producer and consumer resolves the same exact selected object/root. |
| `validateLeanResourceWindowPredecessorV15`, allocation/continuation constructors | Validate predecessor floor against global v15 policy and compose capped allocation inputs. [VERIFIED: source lines 1947–1952, 1974 onward] | Avoid implicit global-policy reads where mode-specific predecessor/cap floors are required. Preserve 37 charges from archived cost-only prefix and original elapsed floor without double-counting elapsed already charged. |
| `scripts/lib/v1-38-lean-resource-window-v15.ts` / `scripts/run-v1-38-lean-correction.ts` | Existing v14-prefix reader and accepted join feed the current v15 request/continuation/reservation consumer. The correction code imports v15 constants and checks deadline/reserve in multiple entry points. [VERIFIED: source imports and source grep] | Add the archived refusal path to the checked v2 plan’s reader seam; thread the successor policy consistently through request/continuation, reservation, setup, and source-manifest identity. Do not invoke old v15-2 reader/authenticator. |
| `LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS` and source-manifest construction | Finite paths contribute to source identity and physical accounting; current constant contains previous v15 family reports. [VERIFIED: source lines 1964–1975; correction lines 284–286] | Add the new research-v2, plan-v3, check-v3, approval, and any generated reports as exact explicit paths. Exclude only named generated outputs from functional hashing while retaining physical debit; no glob or blanket version omission. |

The adjacent v2 plan already identifies the finite 11-record raw pin inventory, two focused tests, one exact v15-3 distinction (`fresh_synchronous_checkpoint_observation_v15`), exact v4 review receipt, and compatibility/dormant-mode matrix. This timing update does not reopen those design choices; planning v3 should apply the new envelope to them without broadening implementation scope. [VERIFIED: plan v2 and check v2]

For the existing 13-path inventory, planning v3 must make an exact additive inventory of four approved inputs: `265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v2.md`, its successor `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v3.md`, its independent `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v3.md`, and `265-16-POST-V15-TIMING-APPROVAL-20261009.md`. Include each in functional identity and physical debit. The selected v4 source review remains the one exact generated review exclusion only after its final source-root review; it remains physically debited. Any other output path must be reviewed and added before it is created.

## Timing and Resource Facts to Encode

| Fact | Required treatment |
|---|---|
| Continuous anchor / prior charge | Keep anchor `1791455941097` and the full 108,000,000 ms original floor. At actual resume, elapsed-to-resume is 113,730,903 ms, so prior elapsed total is 221,730,903 ms. [VERIFIED: approval arithmetic] |
| New cumulative ceiling | 250,530,903 ms = prior elapsed 221,730,903 + approved 28,800,000 ms. Use as the successor cap, not as an extra allowance stacked on the old cap. [VERIFIED: approval record] |
| Absolute stop | 2026-10-10T02:14:32Z (`1791598472000` ms), exactly actual resume + 28,800,000 ms. [VERIFIED: approval record] |
| Reserve | Keep 1,860,000 ms terminal reserve, plus the existing 600,000 ms maximum Match when checking whether entry/continuation can begin. [VERIFIED: approval record and current guards] |
| Charges and prior outputs | Existing 37 charges and file/survivor costs carry forward. The three unused ordinals are exactly 3–5; this is not a reset or renewed allowance. [VERIFIED: approval record] |
| Unchanged limits | RAM 3,000,000,000 B including external reserve 512,000,000 B and guard 335,544,320 B; scratch 2,000,000,000 B; retained 12,000,000,000 B; disk total 15,000,000,000 B; terminal disk 1,000,000,000 B; 300 Matches; guest 1,000 ms; host 5,000 ms; startup 2,500 ms; Match 600,000 ms; old-space 768 MiB; 250 ms sampling. [VERIFIED: approval record] |

Do not change the consumed v15 constant: doing so reinterprets the v15-2 allocation, source identity, and historical admission. Do not set `priorElapsedMs=221730903` while also computing `priorElapsedMs + actualResumeMs - startedAtMs`; that would count the elapsed interval twice. Keep the fixed original 108M floor and bound total elapsed to 250,530,903 ms. [VERIFIED: source formula in correction source lines 1995, 2033–2045; approval arithmetic]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Historical identity | New directory scan, wildcard path matcher, or mutable “latest” selector | Exact 11 path/size/raw digest/canonical pin-root inventory and embedded-root checks from PIN-INVENTORY-v1 | Existing plan forbids substituting history and requires fail-stop on mismatch. |
| Timing evidence | New system-time source or elapsed-time reset | Existing monotonic/all-wall accounting and exact approved absolute deadline; retain reserve checks at each real entry boundary | Approval preserves continuous charge and existing timing architecture. |
| Review/source closure | AST-derived semantic certificate or self-hashed review | Exact final source manifest/root plus selected fresh independent v4 raw-byte receipt | Plan v2 specifies reviewer-attested call-chain semantics and exact exclusion ordering. |
| Package/runtime surface | New dependency or alternate runner | Existing TypeScript/Vitest focused test surface | This is source-policy/custody work only; no package install is needed. |

## Common Pitfalls

1. **Mutating the consumed envelope.** A global v15 constant shift rewrites the meaning/root of already-consumed v15-2 history. Keep legacy v15 policy and introduce a separately named successor.
2. **Double-counting the elapsed floor.** `priorElapsedMs` participates with `actualResumeMs - startedAtMs`; preserve the original 108M floor and carry prior cumulative elapsed once, with the overall cap at 250,530,903 ms.
3. **Selecting by family instead of ordinal.** Current code treats v15-2 through v15-5 as one family. Explicitly gate successor to v15-3 and keep v15-4/5 closed until their own immediate-prefix contracts exist.
4. **Partial policy propagation.** A binding may select the successor while a separate guard, memory policy, setup witness, reservation, or source manifest still compares the old singleton. Test actual producers and consumers and reject a mismatched policy root at each join.
5. **Confusing timing approval with route authority.** The approval permits the bounded prospective source window; it does not create an allocation, preparation, request, route, capacity result, provider call, Strategy, or Match.
6. **Unbounded inventory exclusions.** New docs must be added by exact path before source work; generated report exclusions remain exact and still count in physical debit.

## Minimal Test/Verification Guidance

No package or framework installation. Preserve the two focused commands already named in plan v2:

- `node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000`
- `node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000`

Add precise policy-mode cases: old v15-2 policy bytes/root and cap unchanged; v15-3 resolves only the successor; v15-4/v15-5 do not inherit it; absolute deadline and cumulative cap are exact; old floor is counted once; reserve+maximum Match is refused at boundary; setup/reservation/continuation/manifest policy roots agree; old accepted v14-1 and legacy/default paths remain unchanged. Test with injected bytes where the plan specifies; do not run a route, provider, Strategy, or Match.

## Package Legitimacy Audit

Not applicable — no external packages are recommended or installed.

## Environment Availability

No new external dependencies. Existing repository-local Node/Vitest are the only test tools; confirm installed versions in the execution environment if implementation begins. [VERIFIED: package/test paths]

## Security Domain

No new security boundary or ASVS category is introduced. Security-critical properties are exact content identity, fail-closed schema/root joins, non-authorizing refusal history, and no route/provider execution from the research or source-policy change.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | The approved successor should apply only to v15-3, leaving v15-4/5 dormant, as specified by timing approval and plan v2. | Summary / source seams | Incorrect ordinal selection could consume authority or cap against an unreviewed predecessor. |
| A2 | Research-v2 and its successor plan/check/approval require exact source-manifest inclusion before implementation; generated outputs are exact exclusions only. | Source seams | Missing inventory inputs would make source roots incomplete or accounting inconsistent. |

## Questions resolved by PLAN-v3

1. RESOLVED: PLAN-v3 fixes schema and root domain to `lean-resource-window-successor-envelope-v15-3-v1`, exports `LEAN_RESOURCE_WINDOW_V15_SUCCESSOR_POLICY` and its caps, and preserves `elapsedMs`. The consumed old object is unchanged.
2. RESOLVED: PLAN-v3's finite inventory fixes seventeen exact paths: eleven noncyclic inputs included in functional identity and six exact generated outputs excluded; all seventeen remain physically charged. PLAN-CHECK-v3 closes before source edits.
3. RESOLVED: PLAN-v3 Tasks 2/3 require connected actual producer, allocation, ledger, memory, timer, publication, retained-exhaustion and source-review consumer fixtures, not only a policy predicate.

## Sources

- [VERIFIED: phase approval record] `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-TIMING-APPROVAL-20261009.md`
- [VERIFIED: plan-check v2] `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v2.md`
- [VERIFIED: plan v2] `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v2.md`
- [VERIFIED: source] `packages/strategy-lab/src/league/lean-experiment.ts`
- [VERIFIED: source] `scripts/run-v1-38-lean-correction.ts`
- [VERIFIED: source] `scripts/lib/v1-38-lean-resource-window-v15.ts`
- [VERIFIED: phase context] `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md`

**Confidence:** HIGH for recorded timing facts, current source seam locations and the now-explicit PLAN-v3 choices. Implementation and empirical feasibility remain unestablished pending their separate gates.
