---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-post-v13-five-pair-adapter
reviewed: 2026-10-09T00:23:00Z
depth: standard
status: issues_found
source_only: true
independently_reviewed: true
empirical_authorizing: false
author_agent: /root/execute_post_v13_five_pair_adapter
reviewer_agent: /root/review_post_v13_five_pair_source
source_commit: 0815c2f969d2d54fa5c015eca56c46656a689eb1
observed_head: 1a3367f79fbe41be5963ca4ad7aa0e42c0ab0648
diff_base: 6dcdbbb70e91264981b70ee6a58c42227733cfaf
source_root: sha256:770d9460e109fee0824690f6e3fa918cb41a568441cddd3526c76aaa525d9490
source_entries: 940
files_reviewed: 13
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-owned-reuse-host-fixture.ts
  - scripts/lib/v1-38-lean-post-v13-five-pair.ts
  - scripts/lib/v1-38-lean-post-v13-five-pair.test.ts
  - scripts/lib/v1-38-lean-post-v13-five-pair-custody.test.ts
  - scripts/lib/v1-38-lean-precharge-owned-reuse.test.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-post-v13-five-pair.test.ts
  - scripts/run-v1-38-lean-correction.sh
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
---

# Phase 265 Plan 16: Five-pair source review v1

## Narrative Findings (AI reviewer)

### CR-01: BLOCKER — Byte changes stand in for a justified fresh attempt

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:1746-1755`

**Affected calls:** `readLeanPostV13RequestV14` → `readLeanPreparationContinuationRequestWithPurposeV13` → `validateLeanPostV13ContinuationV14`; generic review consumption at lines 1881-1883 → `authenticateLeanCorrectionReview` at lines 433-443. Pure distinction construction is at lines 1741-1744.

**Issue:** The admitted distinction is only `{kind,evidenceRoot,reviewRoot}`. A prospective diagnostic distinction binds `evidenceRoot` to the current helper's raw hash and checks that it differs from the immediately preceding helper hash. The repair branch similarly requires only a different functional source hash. Neither branch authenticates an independently reviewed actionable repair or a meaningful diagnostic distinction from the preceding failed route. The associated source/data/helper reviews are consumed with `diagnosisRoot=null`; the parser checks clean/source/request/actor metadata but no actionable or distinction-approval field. Changing only a helper comment, an ordinal/path literal, or another non-executed byte therefore satisfies the new distinction predicate without changing the known-failing execution. Re-rooting those otherwise honestly source/request-bound records does not remedy the missing prerequisite.

This is an introduced prospective-authority gap, not a claim that an actual invalid route was dispatched. The approval expressly prohibits unchanged known-failing reruns and the checked plan explicitly says mere identity renaming is insufficient. Ordinary accepted-result checks, capacity guards, and valid independent review identities are still required; none explicitly authenticate this additional prerequisite.

**Proof:** Lines 1750 and 1753 exhaust the evidence comparisons: equality to the current raw source/helper hash, followed by inequality to the preceding raw source/helper hash. Line 1755 only prevents copying the identical three-field distinction. There is no previous-failure binding or distinct justification record in the constructor's exact key set. Existing tests exercise a fabricated `identity_rename` kind rejection, but not identity-only edits labeled with the two allowed kinds.

**Fix:** Require a separate exact, independently reviewed continuation-distinction record bound to the immediately preceding closed failure, current semantic execution inputs, and current request. For a repair require actual actionable/verified repair approval; for a diagnostic distinction require explicit independent justification. The selected consumer must authenticate that approval, not infer it from a byte inequality or generic `status: clean`. If a safe semantic diagnostic comparison cannot be established, fail closed the optional diagnostic-distinction path rather than invent permissive acceptance. The initial v14 attempt can bind the concretely tested immutable-graph repair through an actual independent attestation. Add actual consumer regressions rejecting comment-only and fresh-ordinal/path-only edits under both allowed labels, while retaining refusal if complete authentic request custody cannot be constructed. Do not weaken accepted-result audits or fabricate successful authority to test this.

### WR-01: WARNING — Always-running custody tests require ignored operator files

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-post-v13-five-pair-custody.test.ts:25-26`

**Also:** lines 115-122; repository `.gitignore` excludes `/.strategy-lab/`, and `vitest.config.ts` includes this test with no exclusion.

**Issue:** Two source tests read the actual three failed-v13 metadata files from the operator checkout before constructing temporary fixtures. These required files are ignored, not checked-in source fixtures, and no provisioning contract exists in the test. A clean checkout running the included source test fails with `ENOENT` rather than exercising custody logic. The successful local run below depends on the explicitly permitted ROOT-observed files and is not a portable regression result.

**Fix:** Separate the explicitly operator-bound finite-history integration check from the always-running source suite. Supply sanitized checked-in non-authorizing fixture metadata to the source contract/writer tests with fixture-specific expected pins, while keeping the production historical-pins authenticator unchanged. Alternatively provide an explicit separately selected integration runner with required input provisioning and truthful unavailable reporting; do not silently skip the planned source regressions or label substituted metadata as real historical authority.

## Source scope and evidence

Reviewed the exact 13-file source/test diff `6dcdbbb7..0815c2f969d2d54fa5c015eca56c46656a689eb1`, new contracts/tests, surrounding CLI/request/setup/predecessor dispatch, owned admission/publication/close seams, strict parent discriminator, ordinary accepted-diagnostic audit dispatch, terminal carry/hold/pair writers and successor consumption. Project AGENTS, current planning context, checked adapter plan/check, decision/approval, and SOURCE-SUMMARY-v2 informed the contractual review. No structural pre-pass was supplied.

An inert source-manifest export independently returned the exact functional root above and 940 entries. The new exact review path is excluded from that functional hash but included in the allowed physical report accounting. Actual parser fields were inspected: this report intentionally has `status: issues_found`, so `authenticateLeanPostV13SourceReviewV14` → `authenticateLeanCorrectionReview` must reject it. It is not clean source acceptance.

## Bounded checks actually executed

- `NODE_OPTIONS=--max-old-space-size=768 pnpm exec vitest run scripts/lib/v1-38-lean-post-v13-five-pair.test.ts scripts/run-v1-38-lean-post-v13-five-pair.test.ts --maxWorkers=1 --no-file-parallelism --testTimeout=10000`: 10/10, zero skipped, exit 0, 12.63 seconds. Temporary empty-directory Git stderr was expected refusal evidence.
- `NODE_OPTIONS=--max-old-space-size=768 pnpm exec vitest run scripts/lib/v1-38-lean-post-v13-five-pair-custody.test.ts --maxWorkers=1 --no-file-parallelism --testTimeout=10000`: 5/5, zero skipped, exit 0, 39.12 seconds. Only the three exact finite failed-v13 metadata files were permitted/read from actual private history; remaining private payload fixtures were opaque bytes in a temporary checkout. No old ordinary reader or actual Strategy payload/trace was read.
- `sh -n scripts/run-v1-38-lean-correction.sh` and `git diff --check 6dcdbbb7..0815c2f969d2d54fa5c015eca56c46656a689eb1`: exit 0.
- Inert `leanCorrectionSourceManifest("v14-1", LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION)` export: exact `sha256:770d9460e109fee0824690f6e3fa918cb41a568441cddd3526c76aaa525d9490`, 940 entries.

These passing source checks do not disprove CR-01. They do not exercise a fully admitted successor with an identity-only distinction.

## Proof limits and boundaries

Successful v14 DATA/HELPER admission, successful full accepted diagnostic/baseline custody, all seven accepted source publications, positive complete-36/Git-tamper custody and parent-disconnect disposal remain UNESTABLISHED. The HOST parent fixtures mock fork/OS outcomes, use real temporary Git/ledger/reason publication, and do not demonstrate a real child admission. The owned test calls the real admitted selection and ownership APIs but ends at rejecting full custody; it is not a successful real `runLeanCorrectionChildBody` authority path. The custody test's explicit HOST clean review text is a source-parser fixture, not an independently issued empirical review. No successful allocation-admission/accepted-audit authentication stub was counted as positive evidence.

The executor's legacy 35/35 and configured typecheck results were reported in SOURCE-SUMMARY-v2, not rerun here. Its strict affected-script check remains NOT PASS: six inherited diagnostics in feasibility-protocol.ts and planner/missions.ts were recorded, not erased or reclassified. This review does not claim a strict check pass.

No empirical route, provider, native Strategy/Match, capacity admission, old ordinary reader, allocation, helper/request, source repair, STATE mutation, or commit was performed. No cause of the old SIGKILL, native/RSS cure, full36 fit, accepted-audit cost, Phase265/LEAG/freeze, formation/holdout/public/counted/production success is established. The same cumulative time/resources, historical 35 charges, no-refund custody and absolute stop remain unchanged.

## Ownership closure

All reviewer-started commands completed and both temporary test fixtures cleaned up. Only this assigned report was created. Source ownership is released to ROOT; review outcome is issues_found and blocks clean source-gate acceptance pending a bounded fix and genuinely new independent re-review.
