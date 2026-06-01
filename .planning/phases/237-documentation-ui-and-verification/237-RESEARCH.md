# Phase 237 Research: Documentation, UI, and Verification

## Findings

- Supported language state is centralized in `packages/spec/src/runtime.ts`.
- Product labels flow through `apps/web/lib/runtime-labels.ts`.
- Public trust copy lives in Learn and MatchSet evidence surfaces.
- Workshop summaries needed metadata byte redaction for source-language artifacts.

## Decision

Use the central registry as the source of truth for artifact-proven source languages and immutable WASM/WASI languages. Update Learn, runtime cues, and evidence copy without adding TinyGo to production surfaces.
