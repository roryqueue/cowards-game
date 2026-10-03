## ISSUES FOUND

**Phase:** 265 — Serious Current-Rules League and Development Red Team (approved prospective lean replacement)
**Plans checked:** 265-15, 265-16
**Issues:** 1 blocker, 1 warning

### Blockers (must fix)

**1. [work_vector / scope_sanity] The approved per-arm search/evaluation vector is arithmetically inconsistent, so the plans do not establish an executable equal-work cap.**
- Plans: 265-15, 265-16
- Evidence: the active contract says each arm receives 64 tactical evaluations + 64 teacher nodes + 64 distillation examples + 128 response nodes, while also declaring “exactly 256 counted search/evaluation units total.” Those listed channels sum to 320 if each is counted, and Task 16 asks for the four channel caps without defining a conversion or excluding distillation from the total. The active outline also requires equal structural accounting across arms.
- Fix: reconcile the approved vector in the executable plan before execution: state which activities count toward the total, provide a non-ambiguous per-channel and aggregate arithmetic, then update the training tests/acceptance criteria to assert that exact reconciled vector. Do not silently choose 256 or 320 in implementation.

### Warnings (should fix)

**1. [requirement_coverage] Plan 16 labels LEAG-06 and LEAG-08 as covered even though the approved replacement explicitly defers their original gates.**
- Plan: 265-16
- Evidence: frontmatter lists LEAG-01…09 as requirements, but the active disposition says LEAG-06’s original diversity/family gates and LEAG-08’s robust-finalist certification are deferred and replaced by small-pool/no-robust-claim reporting. The plan’s task action does preserve the “no robust pure” limitation, so this is a coverage/status mapping defect rather than a missing execution activity.
- Fix: make the plan’s requirement mapping distinguish retained exploratory criteria from superseded/deferred original gates; do not let plan completion or phase verification mark LEAG-06/08 green. Preserve the explicit LEAG-09 supersession and all other approved dispositions in the phase closeout.

### Structured Issues

```yaml
issues:
  - plan: "265-15, 265-16"
    dimension: "work_vector"
    severity: "blocker"
    description: "The active contract declares 256 total search/evaluation units per arm but specifies 64 + 64 + 64 + 128 units, which totals 320; the plans do not define how the total and channel caps reconcile."
    fix_hint: "Resolve the aggregate/channel arithmetic in the plan and assert the exact reconciled vector in tests before execution; do not infer whether 256 or 320 is intended."
  - plan: "265-16"
    dimension: "requirement_coverage"
    severity: "warning"
    description: "Frontmatter claims LEAG-06 and LEAG-08 coverage although the active approved dispositions defer their original diversity and robust-finalist gates; task prose correctly limits claims but mapping remains misleading."
    fix_hint: "Represent retained exploratory replacements separately from deferred original requirement gates and explicitly preserve non-green LEAG-06/08 status through closeout."
```

### Checks that passed

- Plan 265-15 depends on Plan 265-14, which is already complete; Plan 265-16 depends on 265-15. No forward or cyclic dependency found.
- Tasks include `read_first`, concrete actions, automated verification, acceptance criteria, and done conditions. Plan sizes are two tasks each.
- The plans preserve the new 15,000,000,000-byte / 28,800,000-ms / 300-Match shared envelope, pilot-first resource-only tier selection, 200/128 schedule, no-reset/failure charging, canonical supervised runtime, unchanged rules, private/no-public-counted-production boundary, baseline-before-formation, and one holdout opening only after population freezes.
- The baseline plan reserves its 8/4 holdout cells rather than opening the holdout during current-baseline work; it also allows an honest incomplete/inconclusive terminal and avoids certification/exploitability claims.
- Legacy full-scale work is not reopened by these plans: the active remaining-plan explicitly suspends 265-07 and existing 266-01…06, and Plan 16 refers to 266 replacement only after its actual dependency frontier.

### Recommendation

Resolve the one blocker in the work-vector contract and plan before execution. Preserve the warning’s deferred/non-green requirement mapping in the revised plan and closeout; no new approval or scope expansion is needed for these corrections.
