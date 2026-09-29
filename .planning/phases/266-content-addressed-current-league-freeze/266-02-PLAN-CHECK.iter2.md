# Phase 266 Plan 02 — independent revision check (iteration 2)

## ISSUES FOUND

**Scope:** Revised `266-02-PLAN.md` against `266-02-SOURCE-REVIEW-GAP.md`, Phase 266 Context/Validation, the isolated `codex/phase266-integration` source, and the downstream Plans 04–05. **Verdict:** 1 BLOCKER, 1 WARNING. This is a plan check, not a source acceptance, empirical result, or absence receipt.

The revision correctly names the two recorded defects: direct-root alternate-named opaque files must fail, and the old 512-artifact/32-MiB whole-store reader must be replaced with a streaming, authenticated, schema-complete DAG scan. Both tasks have files, specific actions, automated verification, and done criteria. FRZE-02 is present in frontmatter; two tasks/three files fit the plan-size gate. Plan 02's offline-private tier, no-Match boundary, and source-only/real-receipt distinction match Context D-10–D-12. The actual approved Phase 265 allocation allows up to 161,061,273,600 artifact bytes and 9,000,000 records, confirming that the isolated reader's 512/32-MiB aggregate caps cannot prove the retained store.

### BLOCKER — reviewed root-file admission has no executable authority handoff

Plan 02 Task 1 requires an *explicit reviewer-controlled* exact path/byte allowlist, bound to a separately authenticated Git commit/tree and dirty-state epoch, before any direct repository-root or `.planning`-root file can be admitted. It explicitly forbids the scanner from trusting current HEAD, a caller-authored manifest, a generic schema tag, or a successful hash. But Plan 02 lists no allowlist artifact or producer, and downstream Plan 04's CLI accepts only `--inputs` and the existing empirical/seal/store locators. Plan 05 Task 1 runs `--preflight` before it commits its report and fixes the final prepublication epoch; the separate private reviewer record is created only in Task 2, *after* successful preflight, and its declared fields are expected root, epoch, input roots, and derivation identity—not a reviewed file allowlist. The proposed positive source tests inject an epoch, but do not establish how a real invocation obtains or authenticates its allowlist without taking it from the caller or the commit being scanned.

This is not just an implementation detail: the actual direct roots include ordinary `package.json`, `pnpm-lock.yaml`, `AGENTS.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md`. They must be admitted as exact reviewed source/config/policy bytes without letting a committed or dirty `opaque.payload` inherit admission. With no independent allowlist authority, execution either blocks every real preflight or reintroduces the direct-root false-absence path. **Fix:** Add a specific non-authorizing reviewer-owned allowlist/epoch artifact and producer/checker, with its exact schema, source identity, no-replace provenance, and timing before each scan that needs it; wire Plan 04 CLI and Plan 05 preflight/write/check to pass and reauthenticate it. Distinguish a preliminary preflight epoch from the post-report publication epoch and regenerate/review exact path/byte admission at the latter. Test the positive real root source/config/policy set and negative committed/untracked/copied/changed neutral opaque files.

### WARNING — positive direct-root controls are narrower than the real checkout

Task 1 acceptance tests promise a reviewed-*policy prose* positive control but not ordinary root source/config formats such as `.gitignore`, `package.json`, `pnpm-lock.yaml`, and `tsconfig.json`, or `.planning` root status/config documents. The action says "source/policy" broadly but then says only "protocol/spec prose" is non-materialized; this leaves the handling of reviewed non-prose root files ambiguous. **Fix:** State explicitly which reviewed non-prose root file types are admissible at exact epoch/path/bytes and add a benign actual-root fixture that includes them. Keep the exception narrow: no extension-based or all-tracked-file exemption, and inspect formation identity in allowlisted content as applicable.

### Structured issues

```yaml
issues:
  - plan: "266-02"
    dimension: key_links_planned
    severity: BLOCKER
    description: "No independently produced/authenticated reviewer-controlled direct-root path/byte allowlist is wired into the real Plan 04/05 preflight/write/check path."
    task: 1
    fix_hint: "Define the allowlist authority artifact and preflight/publication epoch timing, then pass/reverify it through the CLI and publication lock."
  - plan: "266-02"
    dimension: verification_derivation
    severity: WARNING
    description: "Benign direct-root tests cover policy prose but not the ordinary source/config files present in the actual repository and .planning roots."
    task: 1
    fix_hint: "Add exact-epoch/path/byte positive controls for real root source/config files while rejecting neutral opaque additions."
```

**Other dimensions:** Task structure, dependency graph, scope, Context/AGENTS compliance, architectural tier, Nyquist automated verifies, pattern analogs, cross-plan carrier transformation, and no-empirical-authority boundary pass for this focused check. The unmerged source remains non-authorizing. Phase 265's process-invalid consumed route and the unidentified original unopened operator-local seal independently block any real freeze, regardless of this plan revision.
