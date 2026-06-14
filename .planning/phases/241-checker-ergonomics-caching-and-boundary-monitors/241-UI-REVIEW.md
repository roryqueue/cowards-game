---
phase: 241
slug: checker-ergonomics-caching-and-boundary-monitors
reviewed: 2026-06-14
baseline:
  - .planning/phases/240-language-diagnostic-ux-and-availability-states/240-UI-SPEC.md
  - .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-UI-SPEC.md
screenshots: not captured
screenshot_reason: no dev server on localhost:3000, localhost:5173, or localhost:8080
overall_score: 15
max_score: 24
scores:
  copywriting: 2
  visuals: 3
  color: 3
  typography: 3
  spacing: 3
  experience_design: 1
---

# Phase 241 - UI Review

**Audited:** 2026-06-14  
**Baseline:** Phase 240 and Phase 241 UI-SPEC.md contracts  
**Screenshots:** not captured. No dev server responded on localhost:3000, localhost:5173, or localhost:8080, so this is a code-only audit.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | WARNING: stale, ready, checking, and unavailable copy diverges from the Phase 241 contract. |
| 2. Visuals | 3/4 | WARNING: UI remains operational and panel-based, but stale/checking evidence is visually under-specified. |
| 3. Color | 3/4 | WARNING: warning blocks do not receive warning styling, and success green is used beyond ready/checked-valid state. |
| 4. Typography | 3/4 | WARNING: Workshop typography is mostly restrained, but new diagnostic code uses heavier weights than the contract. |
| 5. Spacing | 3/4 | WARNING: spacing mostly follows the existing 4px scale, but long diagnostic identifiers lack explicit row-level wrapping. |
| 6. Experience Design | 1/4 | BLOCKER: submit/save readiness is not gated by current checker `ready` status or full cache identity. |

**Overall: 15/24**

---

## Top 3 Priority Fixes

1. **Gate submit/save on current checker readiness and cache identity** - stale or unavailable checker envelopes can still be treated as submit-ready through a valid legacy validation report - update `canSubmitRevision` and callers so only `currentChecker.status === "ready"` with matching cache identity enables submit/save.
2. **Replace stale/checking/ready copy with the Phase 241 contract strings** - current copy says "Validation is stale", "Valid draft", and "No validation issues" instead of the required current-check language - align helper labels and panel copy with `Checking source...`, `Previous check is stale...`, and `Ready to submit...`.
3. **Make warning/unavailable states visually distinct and non-destructive** - `.validation-empty.warning` is rendered but has no CSS rule, so unavailable/stale states look like neutral empty panels - add warning color/border treatment using existing `--warning`.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- WARNING: Phase 241 requires checking copy `Checking source...`, but `getDraftStatusLabel("checking")` returns `Checking...` in `apps/web/app/workshop/workshop-client-state.ts:28-29`, and the test locks that older copy in `apps/web/app/workshop/workshop-client.test.tsx:60-63`.
- WARNING: Phase 241 requires stale copy `Previous check is stale. Validate this draft before submitting.`, but the panel renders `Validation is stale` plus `These diagnostics belong to the previous source or language. Refresh validation before submitting.` in `apps/web/app/workshop/workshop-client.tsx:905-911`, and blocked submit copy returns `Refresh validation before submitting.` in `apps/web/app/workshop/workshop-client-state.ts:195-196`.
- WARNING: Phase 241 requires ready copy `Ready to submit. Submit and save will revalidate this source.`, but the UI presents `Valid draft` and `No validation issues` with older Strategy API language in `apps/web/app/workshop/workshop-client-state.ts:30-31` and `apps/web/app/workshop/workshop-client.tsx:930-936`.
- WARNING: Language-specific unavailable bodies can pass through `runtimeService.publicReason` and `toolchain.publicReason`, but headings stay generic `Checker unavailable` and `Toolchain unavailable` in `apps/web/app/workshop/workshop-client.tsx:914-927`; the Phase 241 toolchain template requires `{Language} toolchain is unavailable...`.
- PASS: Diagnostic rows avoid raw compiler output in React and render normalized `Constraint:`, `Next:`, and `Reference:` fields in `apps/web/app/workshop/workshop-client.tsx:952-969` and `apps/web/app/workshop/workshop-client.tsx:989-1005`.

### Pillar 2: Visuals (3/4)

- PASS: The Workshop remains an operational tool surface, not a marketing page. It uses the existing three-column Workshop panels in `apps/web/app/workshop/workshop-client.tsx:547-1266` and existing grid/panel classes in `apps/web/app/globals.css:127-150`.
- WARNING: The stale banner is present, but the visible state text can still read `Checking...` while stale diagnostics are shown because `validationStateFromChecker` returns checking before stale in `apps/web/app/workshop/workshop-client-state.ts:122-131`; Phase 241 asked for checking plus an explicit `Previous check is stale` line.
- WARNING: Diagnostic headings display severity/category only, not the stable public diagnostic code as visible text. `formatCheckerDiagnosticHeading` returns `ERROR / CATEGORY` in `apps/web/app/workshop/workshop-client-state.ts:56-59`; the code is only placed in a `data-validation-code` attribute in `apps/web/app/workshop/workshop-client.tsx:945-953`.
- PASS: TinyGo is not exposed in the production Workshop language selector. `WORKSHOP_EDITOR_SOURCE_FORMATS` is exactly TypeScript, Python, Rust, and Zig in `apps/web/lib/runtime-labels.ts:12-17`, and the selector maps only that list in `apps/web/app/workshop/workshop-client.tsx:862-872`.

### Pillar 3: Color (3/4)

- PASS: Core Workshop CSS uses the declared variables for background, borders, accent, success, warning, and destructive colors in `apps/web/app/globals.css:140-145`, `apps/web/app/globals.css:200-209`, and `apps/web/app/globals.css:267-291`.
- WARNING: `.validation-empty.warning` is rendered for stale/runtime/toolchain unavailable states in `apps/web/app/workshop/workshop-client.tsx:905-928`, but `apps/web/app/globals.css:288-291` defines only neutral `.validation-empty`. There is no warning border/text treatment for those unavailable states.
- WARNING: Phase 241 reserves success for ready/checked-valid chips only, but general library tag chips use `workshop-chip valid` in `apps/web/app/workshop/workshop-client.tsx:594-598`, `apps/web/app/workshop/workshop-client.tsx:654-658`, and `apps/web/app/workshop/workshop-client.tsx:738-742`.

### Pillar 4: Typography (3/4)

- PASS: Workshop typography stays compact and operational: body is 14px in `apps/web/app/globals.css:43`, page title is 22px in `apps/web/app/globals.css:160-164`, headings are 18px in `apps/web/app/globals.css:167-171`, and chips/meta are 12px in `apps/web/app/globals.css:174-197`.
- WARNING: The Phase 241 contract specifies panel/page heading weight 650, but Workshop headings use 700/750 in `apps/web/app/globals.css:160-170`.
- WARNING: Diagnostic code/chip typography is specified as 12px/650, but `.validation-code` uses 12px/700 in `apps/web/app/globals.css:277-281`.
- PASS: No viewport-scaled font sizing was found in the audited Workshop client or helper files.

### Pillar 5: Spacing (3/4)

- PASS: Workshop panel, stack, row, list, validation row, and details spacing primarily use the declared 4px scale: 16px panels/gaps in `apps/web/app/globals.css:140-150`, 8px rows/lists in `apps/web/app/globals.css:153-157` and `apps/web/app/globals.css:258-269`, and 4px/12px details gaps in `apps/web/app/globals.css:294-301`.
- PASS: Responsive ordering matches the contract at mobile: editor order 3, validation order 4, submit order 5, and full-width buttons in `apps/web/app/globals.css:1806-1867`.
- WARNING: Diagnostic row text does not get explicit `overflow-wrap: anywhere`; only `.details-grid` has it in `apps/web/app/globals.css:294-301`. Long diagnostic codes/references rendered in `apps/web/app/workshop/workshop-client.tsx:952-969` can still pose mobile readability risk.
- WARNING: Screenshots were unavailable, so exact desktop/tablet/mobile wrapping could not be visually confirmed.

### Pillar 6: Experience Design (1/4)

- BLOCKER: `canSubmitRevision` ignores checker status, cache identity, and the `checking` flag. It returns true for any valid validation report when not submitting in `apps/web/app/workshop/workshop-client-state.ts:176-181`, which violates Phase 241's rule that only current `checker.status === "ready"` with identity match may enable Submit revision or Save to account.
- BLOCKER: The client tracks stale state only by `validationSource` and `validationSourceFormat` in `apps/web/app/workshop/workshop-client.tsx:160-168`; it does not compare provider id, source bytes/hash, artifact identity, provider contract version, runtime ABI, validation policy, or toolchain key from `checker.cacheIdentity`.
- WARNING: The test suite explicitly preserves submit readiness while checking an already-valid source in `apps/web/app/workshop/workshop-client.test.tsx:259-272`, which conflicts with Phase 241's checker-state table where `checking` is not submit/save ready.
- WARNING: `formatCheckerDiagnosticGuidance` carries `actionability` in `apps/web/app/workshop/workshop-client-state.ts:95-103`, but the React diagnostic row never renders an actionability label in `apps/web/app/workshop/workshop-client.tsx:952-969`.
- WARNING: Structured `line` and `column` fields are present in test diagnostic fixtures in `apps/web/app/workshop/workshop-client.test.tsx:77-90`, but the Workshop diagnostic rows do not render safe `Line/column:` output.
- PASS: Advanced details do not show `forbiddenPatterns`, raw compiler text, source snippets, artifact bytes, host paths, env values, StrategyMemory, SoldierMemory, or objective payloads. The visible advanced fields are limited to source bytes/hash, runtime/engine compatibility, checker status, provider id, and artifact state in `apps/web/app/workshop/workshop-client.tsx:1013-1038`.
- PASS: Boundary monitor evidence was not added as a new production panel, which matches the Phase 241 contract. No registry audit was required because `components.json` is absent and the UI spec lists no third-party blocks.

---

## Files Audited

- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-UI-SPEC.md`
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-UI-SPEC.md`
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-01-PLAN.md`
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md`
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-01-PLAN.md`
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md`
- `apps/web/app/workshop/workshop-client.tsx`
- `apps/web/app/workshop/workshop-client-state.ts`
- `apps/web/app/workshop/workshop-client.test.tsx`
- `apps/web/app/globals.css`
- `apps/web/lib/runtime-labels.ts`
