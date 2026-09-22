# Tactical-adaptation Task 2 plan check

**Scope:** the new tactical-adaptation repair in Plan 265-07 Task 2 only. This
does not reopen the already-reviewed allocation/run pipeline.

**Verdict:** **BLOCKED — six small, concrete repairs are required.** The repair
correctly keeps the work to tactical development jobs 0/3/6, prohibits extra
Matches/provider/source execution, requires a behavior-changing profiled
emitter, preserves the zero-argument legacy path, and retains the conditional
capacity/no-dispatch boundary. Those safeguards do not yet make the selection
objective or retained corpus executable and meaningful.

## Blockers

1. **[goal_realism] The profile objective is circular rather than an explicit,
   target-dependent quality function.**
   
   Task 2 says to add the profile's own posture/action coefficients to existing
   soft ranks and target summary counts, but it never defines how an observed
   target action changes the value of a chosen candidate mission/action
   (265-07-PLAN.md:95). A maximising implementation can therefore select the
   largest compatible coefficients because they make its own score larger,
   regardless of the target. The claimed target-conditioned adaptation would be
   only metadata-conditioned self-reward.
   
   **Repair:** define a canonical `nodeValue` and profile-selection aggregate
   in the task: a profile first selects one legal activation/action from the
   retained reachable request; the evaluation then uses a profile-independent,
   target-dependent value. It may use the existing neutral mission/action rank
   plus an explicit table against the retained target action summary, or one
   admitted `MATCH_KERNEL` transition and a stated neutral state value. State
   the exact lexicographic fields/aggregation and add a fixture proving that a
   changed target summary changes the selected profile while coefficients alone
   cannot raise the evaluation. It remains one unit per profile/observation and
   makes no Match, provider, or source call.

2. **[context_compliance] Mixture-first truncation can omit both named pure
   targets required by D-14.**
   
   The task orders all positive mixture members before strongest and vulnerable,
   then deduplicates and takes the first four (265-07-PLAN.md:93). A support of
   four or more eligible mixture observations means neither named strongest nor
   named vulnerable is ever represented. Naming them in a target set is not
   targeting them; D-14 requires both the frozen distribution and named pure
   policies.
   
   **Repair:** retain four distinct cell observations with an explicit role
   coverage rule: reserve/reselect an eligible observation for each distinct
   named strongest and vulnerable candidate, then fill remaining positions from
   the canonically ordered mixture support (with documented deterministic
   handling when a named pure candidate overlaps support). Fail charged before
   ingestion if this coverage cannot be achieved. Test a support with at least
   four earlier mixture rows and prove both named roles still survive.

3. **[key_links_planned] The compact corpus has roots and a summary, but no
   specified rehydration/provenance contract for the legal input it scores.**
   
   Task 2 stores `request/input` roots and a normalized output summary
   (265-07-PLAN.md:91), then asks the pure helper to rank missions/actions and
   retained readers to rederive them (lines 95 and 97). It does not say whether
   the corpus carries the canonical legal request input or exactly how the
   reader resolves it, nor does it bind the cell-result to match root,
   execution root, accounting/invocation ordinal, and reconstructed-input root.
   Thus a roots-only record can be accepted without enough reachable data to
   score or independently rederive; it also lacks a concrete size limit for the
   new corpus/selection/envelope records.
   
   **Repair:** choose one bounded form and name it in the schema: retain the
   canonical, private legal input itself, or retain all canonical source
   pointers plus a deterministic `MATCH_KERNEL` rehydrator which verifies the
   reconstructed input root before calling the scorer. Each observation must
   bind cell-result, match, execution, target candidate/role/weight,
   invocation/accounting position, request/input root, and normalized target
   output. Enforce the existing canonical record limit (or a smaller explicit
   bound) for corpus, selection, and derived envelope; test oversized,
   root-only, mismatched replay, and stale-pointer rejection.

4. **[verification_derivation] The asserted 100 units can still hide the
   existing tactical beam search.**
   
   “One bounded legal ranking” and a final count of 100 (265-07-PLAN.md:95) do
   not identify the permitted scorer. Existing `selectTacticalSearchNode()`
   invokes `expandTacticalSearch()` with up to 32 expansions, so importing it
   per row would be 100 recorded rows but far more than 100 tactical search
   nodes. The plan prohibits this outcome but does not make the implementation
   or proof distinguish it.
   
   **Repair:** state that `deriveTacticalAdaptationProfile()` may call direct
   `scoreTacticalMission`/`scoreTacticalAction` (or the one declared kernel
   transition) only and must not import/call `expandTacticalSearch` or
   `selectTacticalSearchNode`. Make the retained 100-row artifact contain one
   canonical action/missions result per row, and add a test seam that rejects a
   nested expansion/callback. This preserves the approved 100-node meaning.

5. **[task_completeness] Task 2’s declared file ownership omits the new repair
   and does not specify the current admission seam that will reject its new
   emitter.**
   
   Its `<files>` field lists only allocation/run/amendment files
   (265-07-PLAN.md:79), while its action requires new tactical adaptation and
   profiled-emission modules plus changes to tactical exports/tests, ingestion
   and reload tests, authoring/rederivation tests, and fingerprint checks
   (line 97). Further, the present
   `assertProspectiveLeagueProducerRequest` accepts tactical identity only as
   `emitTacticalFactoryPacket` (allocation.ts:178-182), while the plan introduces
   `emitProfiledTacticalFactoryPacket`. Without an explicit narrow mapping the
   new branch will either fail prospective authoring or be accepted too broadly.
   
   **Repair:** list every Task 2 file, including the new adaptation/template/
   profiled-emission modules and all ingest/authoring/fingerprint test files,
   in `<files>`. Explicitly revise the admission assertion: only a prospective
   tactical development job at ordinals 0/3/6 may use the profiled identity and
   its complete derived envelope; legacy tactical requests retain the existing
   identity and exact bytes, while teacher/model and independent jobs reject the
   tactical envelope.

6. **[context_compliance] Teacher acceptance wording would regress the
   unchanged teacher development path, and the capacity baseline is factually
   stale.**
   
   The action correctly says teacher authoring stays unchanged, but `<done>`
   requires “teacher/independent target denial” (265-07-PLAN.md:97,104). Current
   development teacher authoring legitimately receives a target artifact and
   only independent jobs reject it; denying it would change the existing D-14
   path. Separately, the amended capacity contract calls 114.632 GiB/about
   7.156m the “current” accounting (265-LEAN-AMENDMENT.md:192-200), but the
   live data-only witness is 118.804587 GiB and 7,237,110 records
   (265-LEAN-CAPACITY-WITNESSES.md:54-59). It remains a non-receipt, but the
   task must not preserve an obsolete current measurement while reconciling the
   added retention.
   
   **Repair:** replace the test/done wording with: teacher development retains
   its existing target presence/binding unchanged; only tactical profile/envelope
   input is denied to teacher, and both independent jobs remain target-free.
   Replace the stale baseline with 118.804587 GiB / 7,237,110 records and retain
   the required final-rooted reconciliation before receipt/dispatch.

## Structured issues

```yaml
issues:
  - plan: "265-07"
    dimension: goal_realism
    severity: blocker
    task: 2
    description: "The profile score has no explicit target-dependent node-value formula, so it can maximize its own coefficients rather than select a meaningful target-conditioned response."
    fix_hint: "Specify profile-independent target-dependent node value and aggregate; prove changed target behavior can change the profile."
  - plan: "265-07"
    dimension: context_compliance
    severity: blocker
    task: 2
    description: "Taking the first four mixture-first observations can omit named strongest and vulnerable pure targets required by D-14."
    fix_hint: "Reserve deterministic coverage for each distinct named pure role before filling remaining observations."
  - plan: "265-07"
    dimension: key_links_planned
    severity: blocker
    task: 2
    description: "Corpus schema does not specify rehydratable legal inputs, full replay provenance, or a bounded-record contract."
    fix_hint: "Retain canonical input or verified pointers/replay procedure and bind all roots, ordinals, and size limits."
  - plan: "265-07"
    dimension: verification_derivation
    severity: blocker
    task: 2
    description: "The 100-row count does not prevent nested calls to the existing 32-expansion tactical beam search."
    fix_hint: "Forbid beam-search imports/calls and test direct one-ranking-or-one-transition accounting per row."
  - plan: "265-07"
    dimension: task_completeness
    severity: blocker
    task: 2
    description: "Task files omit the introduced modules and supporting integration files; the exact prospective producer-identity admission change is unspecified."
    fix_hint: "Expand Task 2 files and explicitly gate profiled identity/envelope to tactical development ordinals 0/3/6."
  - plan: "265-07"
    dimension: context_compliance
    severity: blocker
    task: 2
    description: "Teacher target-denial wording contradicts unchanged development teacher target binding, and the amendment retains an obsolete current capacity number."
    fix_hint: "Preserve teacher development target binding, deny only tactical profile/envelope and independent targets, and replace the baseline with 118.804587 GiB / 7,237,110 records."
```

No empirical action, allocation, receipt, or run was performed during this
check.
