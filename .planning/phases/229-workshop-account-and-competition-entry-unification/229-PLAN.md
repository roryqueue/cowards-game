# Phase 229 Plan: Workshop, Account, and Competition Entry Unification

## Objective

Move authoring, saved revision, and entry surfaces onto shared provider-derived language labels and eligibility without redesigning the UI.

## Tasks

1. Make web runtime labels registry-derived.
   - Keep `runtime-labels.ts` as a thin wrapper over the supported-language registry.
   - Return public provider labels for all counted source formats.
   - Export the Workshop editor source-format list from the shared helper.

2. Unify Workshop labels.
   - Render language controls from the shared source-format list.
   - Use provider labels for template chips and revision rows.
   - Use provider labels in Workshop server validation/submission errors.

3. Unify account and public result labels.
   - Derive Workshop summary source formats from the provider registry.
   - Derive account not-counted downgrade labels from the provider registry.
   - Remove direct language label switches from MatchSet result runtime labels.

4. Verify entry consistency.
   - Run Workshop, account adapter, runtime-label, evidence, result-view-model, and persistence Workshop tests.

## Non-Goals

- No new competition formats, ratings, filters, governance, or search.
- No marketing redesign.

