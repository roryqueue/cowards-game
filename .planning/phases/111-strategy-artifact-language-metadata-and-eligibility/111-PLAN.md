---
phase: 111-strategy-artifact-language-metadata-and-eligibility
plan: 1
type: execute
wave: 1
depends_on: [110]
files_modified:
  - packages/spec/src/types.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/runtime.ts
  - packages/spec/src/spec.test.ts
  - scripts/generate-strategy-artifact-manifest.ts
  - packages/spec/artifacts/strategy-artifacts.v1.14.json
autonomous: true
requirements: [ART-01, ART-02, ART-03, ART-04, ART-05]
---

<objective>
Represent Python Strategy artifacts through the existing language-neutral artifact model while preserving source privacy and counted eligibility gates.
</objective>

<tasks>

1. Extend `StrategyArtifactSourceFormat` and schemas with `python`.
2. Add artifact hash support to generated Strategy artifacts and include language/runtime/package/validation metadata in behavior-significant fields.
3. Ensure runtime metadata can represent Python with exact registry metadata and non-counted eligibility.
4. Update tests for Python artifact metadata, public summaries, hash coverage, and counted eligibility.
5. Regenerate the built-in artifact manifest without adding Python built-ins yet unless Phase 115 introduces a Python starter artifact.

</tasks>

<verification>

- `pnpm strategy-artifacts:generate`
- `pnpm strategy-artifacts:check`
- `pnpm --filter @cowards/spec test`

</verification>

