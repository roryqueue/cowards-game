---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-archived-prefix-v1
type: execute
wave: 14
depends_on: [265-16-POST-V15-CHECKPOINT-REPAIR]
execution_owner: source_only_ROOT_scheduled
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
files_modified:
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
must_haves:
  truths:
    - Exact source-controlled RAW pins produce only an immutable cost predecessor for the refused v15-2 prefix: current 1, cumulative 37, original elapsed/debit/survivors, refused outcome, and separate operator-error hold-refusal.
    - No v15-2 closure, ordinary-reader refusal, publisher refusal, or cost predecessor is accepted evidence, successful final reader close, hold authenticator, or authorization.
    - v15-3 requires a concrete distinction bound to the actual repaired checkpoint call chain, current source root, and exact fresh independent review; source identity drift alone never suffices.
    - v15-4/5 and all old/default paths remain fail-closed or unchanged; no provider, Strategy, Match, setup, allocation, or entry path is enabled.
  artifacts:
    - path: scripts/lib/v1-38-lean-resource-window-v15.ts
      provides: separate exact-pin failed-prefix cost authenticator and explicit non-authorizing result type
    - path: scripts/run-v1-38-lean-resource-window-v15.test.ts
      provides: portable adversarial fixtures for pins, cost monotonicity, refusal semantics, distinction, and dormant later modes
    - path: scripts/run-v1-38-lean-correction.ts
      provides: v15-3-only producer/consumer join from authenticated raw cost prefix to concrete reviewed call-chain distinction
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: finite explicit report inventory for this supplement and physical debit without wildcard exclusions
  key_links:
    - from: exact v15-2 archived RAW pin set
      to: non-authorizing historical-cost predecessor
      via: new additive schema/root and independent survivor/elapsed/byte monotonicity validation
    - from: actual repaired v15 checkpoint call chain
      to: v15-3 continuation/request validator
      via: concrete semantic distinction bound to fresh source root and exact current independent review
    - from: report inventory
      to: no-refund physical accounting and strict source closure
      via: finite named reports, distinct cyclic hash exclusions, all files physically debited
---

<objective>
Add the separately typed, finite RAW-pinned historical-cost contract needed to represent refused v15-2 as a cost-only predecessor for v15-3, and bind that predecessor to a concrete repaired-call-chain distinction. Preserve every old artifact and accepted-path contract.

Purpose: Close the documented source dependency without converting failure/refusal into acceptance or authorizing a route.
Output: Additive cost-only authenticator, exact producer/consumer join, portable adversarial tests, and finite report accounting. No empirical activity.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-CHECKPOINT-REPAIR-PLAN-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-CHECKPOINT-REPAIR-SOURCE-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md
@scripts/lib/v1-38-lean-resource-window-v15.ts
@scripts/run-v1-38-lean-correction.ts
</context>

<fixed_constraints>
The v15-2 diagnostic is refused and immutable: ROOT 73583 closed 0; ordinary reader 58084 closed 1/refused; current 1/cumulative 37. The separate duplicate-publisher 7008 operator-error hold-refusal remains immutable. Preserve all 37 charges, survivor and elapsed/debit costs, refusal semantics, and exact archived RAW pins; do not rerun old readers/authenticators or infer the original throw. Never use the hold refusal as a hold authenticator. The current exact review is `265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md`; source verification is source-only and does not establish route readiness.

Budget is the original continuous window: hard stop 2026-10-09T18:38:33Z; cap 223171903 ms; reserve 1860000 ms; anchor 1791455941097 plus fixed 108000000 ms floor. RAM 3000000000 bytes separate from scratch 2000000000, retained 12000000000, total 15000000000, terminal 1000000000; 300 Matches maximum; Match 600000 ms; guest 1000 ms; host 5000 ms; startup 2500 ms; oldspace 768 MiB; sample interval 250 ms. Every planning/test/review/cleanup minute is charged. No new experiment can start after 17:57:33 UTC per supplied current time. Do not promise execution before the deadline; stop source work when the reserve/deadline gate is reached and report no-entry/inconclusive. ROOT's `265-16-POST-V15-TIMING-DECISION-v1.md` is pending and unapproved: include that exact file in finite physical accounting, but do not use its proposed extra time or inconclusive option as authority absent direct approval. No route or preparation is enabled.
</fixed_constraints>

<tasks>
<task type="auto" tdd="true">
  <name>Task 1: Define and adversarially test immutable failed-prefix cost custody</name>
  <files>scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
  <behavior>
    - Exact pinned RAW set composes a cost-only v15-2 predecessor with current 1 and cumulative 37 while retaining refused/non-authorizing outcome and unknown peak metrics.
    - Any missing, extra, reordered, altered, malformed, or incorrectly rooted pin/record refuses; byte hash and canonical root are independently checked.
    - Elapsed time, allocated byte floor, and each survivor identity/allocation are monotonic; 37 charges cannot shrink or be relabeled as accepted.
    - ROOT closure, ordinary reader refusal, and separate operator-error hold-refusal cannot substitute for one another; forged accepted/final-reader-close/hold-authentication fields refuse.
    - Historical accepted v14-1 path remains unchanged and the synthetic test has no provider, Match, allocation, or old-reader side effects.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, add a new explicit cost-only result/schema and a dedicated authenticator alongside—not by weakening or repurposing—`authenticateLeanResourceWindowPriorPairV15`. Pin every required archived v15-2 RAW byte digest and canonical root in a finite source-controlled table, and reject missing/extra/duplicate inputs, unknown records, schema/key drift, or noncanonical bytes. Bind the refused diagnostic outcome/current charge/cumulative 37, elapsed and physical costs, survivors, ordinary-reader refusal, ROOT closure, and extra publisher hold-refusal according to their distinct roles. Derive a new immutable cost-prefix root with unknown historical peak fields retained as unknown. The return type must not expose acceptance or final-reader-close authority. Do not rewrite old bytes, rerun any historical reader/authenticator, change accepted-join logic, invoke data/helper review, or create a route/setup/allocation/entry. Tests must use inert synthetic raw bytes and the actual exported authenticator; record exact adversarial cases in the source summary.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <done>The new cost-only authenticator accepts only the exact pinned failed prefix and monotonic historical costs; every refusal/authority negative fixture fails, and existing accepted-prefix semantics remain unchanged.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Join v15-3 to the concrete repaired-call-chain distinction and debit reports</name>
  <files>scripts/run-v1-38-lean-correction.ts, packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts</files>
  <behavior>
    - v15-3 continuation/request consumes the new cost-only predecessor only with the exact concrete distinction bound to actual repaired call chain, current source root, and exact fresh independent review receipt.
    - Changed source identity alone; missing/stale review; generic repair label; wrong mode/call-chain proof; or a nonmonotonic/forged cost join refuses before admission.
    - v15-4/5 remain dormant without their own concrete checked distinctions and full immediate prefixes; v15-2/default/accepted v14-1 paths remain unchanged.
    - New finite report paths are physically accounted, with no broad scan, wildcard, or unmeasured exclusion.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, add the smallest explicit v15-3 producer/consumer join at the existing continuation seam: validate the cost-only predecessor separately from accepted joins, then require a concrete semantic distinction tied to the repaired checkpoint observer/guard composition and bound to the current exact source root plus the newly selected fresh independent review. Reject identity-only drift; do not remove the `mode !== v15-2` refusal as a shortcut, reinterpret the old v15-2 continuation as a valid accepted prefix, or enable v15-4/5. Add exact finite report paths for this supplement and the exact pending `265-16-POST-V15-TIMING-DECISION-v1.md` to `LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS`; the timing decision is an inventoried historical input only, not authority. Preserve physical no-refund debit and separate named cyclic hash exclusions. Add portable tests at the actual request/continuation consumer proving source/review/cost joins and dormant-mode refusal. Do not write or request data/helper review, attestation, authorization, setup, allocation, provider, Match, or route artifacts. Do not change STATE, ROADMAP, source history, or commit policy.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <done>Only the new v15-3 source contract can consume the refused 37-charge prefix as cost-only history, and it still cannot authorize execution; every other later ordinal remains fail-closed.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries
| Boundary | Description |
|---|---|
| Archived RAW evidence → source authenticator | Historical files are untrusted until exact raw and canonical roots match fixed pins. |
| Cost predecessor → continuation/request | Cost-only history must not cross into accepted evidence or execution authority. |
| Current source/review → distinction join | Source identity and reviewer receipt must refer to the actual repaired call chain. |

## STRIDE Threat Register
| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-AP-01 | Tampering | Raw pin table/authenticator | high | mitigate | Exact finite RAW and canonical roots, strict keys, extra/missing/mutated adversarial fixtures. |
| T-265-AP-02 | Repudiation | Refused history → cost prefix | high | mitigate | Preserve explicit refusal/operator-error outcomes and 37 charges; typed cost-only root cannot represent acceptance. |
| T-265-AP-03 | Elevation of privilege | Continuation/request join | critical | mitigate | Concrete reviewed call-chain distinction; no identity-only authorization; v15-4/5 stay closed. |
| T-265-AP-04 | Denial of service | Cost monotonicity | medium | mitigate | Reject shrinking elapsed, bytes, charges, or survivor floor before admission. |
| T-265-AP-SC | Supply-chain tampering | Package installs | low | accept | No package installs or new dependencies. |
</threat_model>

<verification>
Run only the two focused Vitest commands in the tasks, configured TypeScript checks for changed modules, `sh -n scripts/run-v1-38-lean-correction.sh`, `git diff --check`, exact manifest derivation, strict fresh review-consumer validation, and independent source verification. Keep each receipt distinct and attributable. No full suite, native/provider run, Match, empirical timing, or old reader rerun is authorized or implied. If the exact time/reserve gate prevents these source checks from closing, preserve source-only partial status and report inconclusive without an entry.
</verification>

<success_criteria>
The immutable refused v15-2 prefix is representable only as exact-pinned, monotonic, non-authorizing cost history; the v15-3 call-chain distinction is source- and review-bound; accepted evidence semantics and all dormant ordinals remain unchanged; focused source gates pass or the result is explicitly incomplete at the fixed stop. No empirical, phase, league, freeze, formation, holdout, public, counted, or production credit is created.
</success_criteria>

<output>
Create only exact source-contract reports under the ROOT-scheduled finite inventory: `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v1.md`, `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-SUMMARY-v1.md`, `265-16-POST-V15-ARCHIVED-PREFIX-REVIEW-FIX-v1.md`, `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-REVIEW-v1.md`, `265-16-POST-V15-ARCHIVED-PREFIX-VALIDATION-v1.md`, and `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-VERIFICATION-v1.md`. Use a new exact inventory addition before creating any necessary extra version. No helper/setup/allocation/route/provider/Match evidence, no STATE/ROADMAP/history changes, and no new numbered plan.
</output>
