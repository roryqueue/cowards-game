---
phase: 265
plan: 16
verified: 2026-10-07T06:07:48Z
status: passed_scoped_source_verification
score: 3/3 source truths verified
scope: v9_baseline_lineage_source_repair_only
source_commit: 51801d24d40fccf34b2dcb507cd3ffbb288dec9c
observed_head: 72191339aa4255e9c87cac7dd065201d17e35514
source_root: sha256:1334976f328d1ad6c442cc223659675b6cbc665ca4e956d14baff530de2c1e6e
source_entries: 905
extension_root: sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66
empirical_authority: false
whole_phase_verification: false
---

# V9 Baseline-Lineage Repair — Scoped Source Verification

**Scope:** The source-only repair for reauthenticating the already accepted v9-2 diagnostic while the same-ordinal baseline is in progress. This does not reopen the ended envelope or authorize another execution.

## Observable Source Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The accepted-diagnostic lineage exception is ephemeral, unforgeable through public inputs, issued only after finite accepted-check/actual FINAL/source/request joins, and revoked regardless of outcome. | VERIFIED | `authenticateLeanSupervisorDiagnosticCheck` verifies accepted check identity, route, allocation/source/HEAD/request byte roots, actual closed reader interval, and current functional source before issuing a frozen token in module-private `WeakMap`; its `finally` deletes that token (`v1-38-lean-correction-retained.ts:309-337`). The only lineage read resolves the token to a mode and forces the canonical diagnostic request path (`run-v1-38-lean-correction.ts:430-434`). No exported issuer or caller mode/bypass flag exists. |
| 2 | The exception only enables read-only reauthentication of that diagnostic's lineage; fresh diagnostic admission, unrelated/future destinations, and full baseline FINAL/source/HEAD/allocation/capacity guards remain strict. Accounting and exact report custody remain unchanged. | VERIFIED | The purpose-aware predecessor guard accepts the current ordinal baseline's lifecycle only in the accepted-lineage context; other ordinal baselines and future diagnostic destinations remain spent refusals (`run-v1-38-lean-correction.ts:739-760`). The composed regression drives own-baseline lifecycle markers through the real accepted-check → lineage request → predecessor chain, then stops at `ACCEPTED_CHARGE`; it confirms post-return token revocation, strict public request rejection, other/future destination rejection, and missing/forged check/FINAL/source cases (`v1-38-lean-remaining-budget.test.ts:253-289`). Baseline authority still requires the actual accepted check and FINAL closure plus committed allocation ancestry, source equality, and HEAD lineage (`v1-38-lean-baseline-retained.ts:25-52`). Full survivor row/debit/floor rules and exact physical-only report identities remain in `lean-experiment.ts:887-905`; source review v1 found zero issues and specifically confirms no legacy cap/policy/ordinary-reader changes. |
| 3 | The repair itself grants no execution or empirical authority; the prior diagnostic acceptance is historical under the old source, and the failed baseline preparation remains spent with no new charge. | VERIFIED | The source summary and MAIN validation explicitly mark the envelope ended, preserve 31 prior charges/costs, and prohibit further helper/prepare/allocation/reader/Match work. The prior v9-2 accepted diagnostic used source root `sha256:664f2da8…`; the current functional source root is different (`sha256:1334976f…`), and the repair's synthetic test deliberately stops before full acceptance/payload audit. No route/helper/ordinary reader/Match path was invoked for this verification. |

## Manifest and Existing Validation

- Recomputed only the pure `leanCorrectionSourceManifest(mode, LEAN_REMAINING_V9_EXTENSION)` observer. `v9-1`, `v9-2`, and `v9-3` each returned 905 entries, 0 missing paths, root `sha256:1334976f328d1ad6c442cc223659675b6cbc665ca4e956d14baff530de2c1e6e`; extension root `sha256:6b5895ee3fb61cb8ddb6dbca95a379bf2c5c3c0954677201b76a19d3c3275e66`.
- Independent `NEW265-16-V9-BASELINE-LINEAGE-SOURCE-REVIEW-v1.md` is clean with zero findings at the same source commit/root. MAIN validation records session 17512 closed 0, focused tests 24/24, configured typecheck, shell syntax, and diff checks passing. These tests/checks were not rerun here.
- This exact verification path is present in the enumerated physical-custody list (`lean-experiment.ts:894`) and is excluded from the functional source manifest; no wildcard report allowance was introduced.

## Limits

No historical request was reevaluated against new source; no capability issuer/authenticator, helper, preparation, allocation, store, ordinary reader, provider/Strategy/Match, or empirical path was invoked. The composed fixture is source-plumbing evidence only and is not a full accepted/empirical result. No full Phase 265, LEAG, freeze, formation, holdout, or public/counted/production completion is claimed. The ended baseline opportunity is not renewed; unused diagnostic capacity is not automatic authority.

---
_Verified: 2026-10-07T06:07:48Z_
_Verifier: the agent (scoped source verification)_
