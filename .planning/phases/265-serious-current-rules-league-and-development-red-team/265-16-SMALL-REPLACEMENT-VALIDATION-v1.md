---
phase: 265
plan: 16-small-replacement
source_head: 6a7d2e8c7f071a6acc4c2b55e38866d05da7a813
status: scoped_validation_complete_with_inherited_failures
runtime_admission: false
---

# Smaller replacement: ROOT validation

Actual ROOT checks on 2026-10-10, after source author/fixer and independent review closed:

| Check | Actual result |
|---|---|
| Five focused Vitest files | exit1; 268 PASS / 1 inherited cleanup-throws planner failure; session60319 CLOSED. Exact failure independently reproduced on unchanged base by source executor; remains NOTPASS/unwaived. |
| Configured project tsc build | exit0; session76650 CLOSED. This reference build does not establish strict script coverage. |
| Explicit ten-file strict TypeScript | exit2; session21622 CLOSED; 11 diagnostics in existing imported/legacy locations, none in the new runner/authority tests or new authority declarations. Author/fixer reported 13 inherited diagnostics under their earlier graph; ROOT observed 11, not 13. This discrepancy is disclosed; no exact root baseline equality is claimed. |
| Whitespace | git diff --check exit0. |
| Factory boundary monitor | First83947 and second75839 CLOSED exit1, two new loader violations. Removing perf_hooks alone did not close the gate. Final83766 CLOSED exit0,1439 files/zero violations after6a4b747c moved only allowlisted bounded Git metadata to the existing reviewed session host-process owner; no scanner allowlist expansion. |
| Final two focused files after boundary fix |41532 CLOSED exit0,14/14 PASS. Earlier51480 CLOSED exit0,14/14 PASS after clock-import removal alone; not a monitor pass. |

The explicit strict command used --ignoreConfig, --noEmit, --types node, ES2022, NodeNext/moduleResolution NodeNext, --strict, --noUncheckedIndexedAccess, --exactOptionalPropertyTypes, --skipLibCheck and all ten owned paths. Existing diagnostics concern assess-factory-independence optional callbacks; factory nullable prospective-host fixtures; league-response optional parent roots; session SourceFile.parseDiagnostics typing; baseline/experiment optional environment/role fields; serious-league optional callbacks. No global green claim.

Inert author/fixer tests and source review are not runtime evidence. The real temporary Git/filesystem fixture exercises committed allocation, ordered claims, durable prefix corruption and permanent invalidation. Full retained-store tamper/default-constructor fixture coverage remains disclosed WR01. No prepare/allocation/entry/container/provider/Strategy/Match/retained verification has occurred. Separate independent source verification, current same-process capacity and immutable allocation still precede any actual invocation.

Final source6a4b747c received independent source re-review with zero blockers/one coverage warning. The13:27:52UTC source/admission frontier arrived before independent source verification and empirical admission. No new allocation or invocation was started; passing scoped checks do not waive the expired reserve boundary or incomplete empirical work. Hardstop13:58:52UTC remains binding for closure. Final clock/Git changes received focused tests and monitor, not another global strict/project build; prior outcomes apply to their explicitly recorded heads only.

Terminal closure check after the independent source/closure verifier CLOSED: ROOT reran the same explicit ten-file no-emit strict command at final6a4b747c (session71064 CLOSED exit2). It retained exactly the same11 diagnostics/locations/messages seen by ROOT in21622, with no new diagnostics from the final metadata wrapper or clock change. No project-build pass is claimed at this later head. This read-only check did not renew source/admission authority or invoke runtime work.
