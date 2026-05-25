# Stack Research: v1.17 Python Strategy Runtime Pilot

**Project:** Coward's Game
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Researched:** 2026-05-24

## Stack Additions

- Keep the existing normal product stack: Next.js web frontend, Go backend, PostgreSQL, TypeScript spec/contracts, isolated runtime service, and existing JS/TS runtime implementation.
- Promote the existing Strategy Execution Service / Runtime Broker naming into concrete spec artifacts, registry metadata, health metadata, monitor checks, and runtime implementation selection.
- Use the existing `packages/runtime-python` spike as a starting point only. It currently proves method-level Python ABI execution but is not a full Match runtime-service path and is not a production sandbox.
- Keep Python self-contained source only. Do not add PyPI install support, dependency resolution, native module support, or package build/install steps.
- Use Python parse/compile checks where practical for submission validation. Official Python docs note that AST parsing and compilation are separate steps, so validation should not treat `ast.parse` alone as full executable validation.
- Use subprocess timeout and isolated/safe-path interpreter flags as defense-in-depth for the experimental host, while explicitly documenting that subprocess plus interpreter flags is not production hostile-code isolation.

## Stack Non-Additions

- No Python backend service.
- No Python persistence owner, route owner, job owner, scoring owner, public evidence owner, or fallback owner.
- No production sandbox promotion.
- No WASM/WASI/component-model promotion.
- No arbitrary package manager or PyPI support.
- No JS/TS runtime replacement.

## Integration Points

- `packages/spec/src/runtime.ts` for runtime registry, language metadata, eligibility, validation messages, and compatibility keys.
- `packages/spec/src/runtime-execution-service.ts` for broker contract, request/response schema metadata, failure taxonomy, authority policy, and health metadata.
- `apps/runtime-service/src/execute-match.ts` for moving from JS/TS-specific runtime construction to registry-selected runtime implementations.
- `packages/runtime-python` for experimental Python adapter/host hardening and full Strategy method coverage.
- `apps/go-backend/runtime_service_client.go` for schema and metadata validation without Python execution.
- Workshop routes and DTOs for experimental author/validate/submit proof, while keeping backend ownership boundaries explicit.
- `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` for registry, ABI, ownership, privacy, and topology gates.

## Recommended Stack Direction

Broker first. Define the runtime registry and contract before expanding Python execution. Then thread Python through artifact metadata, validation, runtime-service execution, Go non-counted MatchSet creation, and Workshop proof. This keeps the v1.16 boundary legible and gives monitors exact artifacts to police.
