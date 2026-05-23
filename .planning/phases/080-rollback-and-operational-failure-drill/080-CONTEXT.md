# Phase 80: Rollback and Operational Failure Drill - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 80 proves that the selected route can be operated safely through forward switch, no-fallback failure, bad Go behavior, and rollback. If Phase 78 ended in `promote-none-yet`, Phase 80 still proves disabled/no-go path honesty and failure semantics. It must not broaden route ownership, introduce code-revert rollback as the normal path, expose private diagnostics, or let Go-selected mode silently fall back to TypeScript.

</domain>

<decisions>
## Implementation Decisions

### Rollback Lever
- **D-01:** Rollback must be one explicit config/owner switch back to TypeScript.
- **D-02:** Rollback must not require a code revert, Go manifest edit, broad backend disable, or database/schema migration.
- **D-03:** The rollback lever should be the same route-specific ownership/switch mechanism established in prior phases.

### Required Drills
- **D-04:** Require a forward cutover drill.
- **D-05:** Require a stopped-Go failure drill.
- **D-06:** Require timeout behavior drill.
- **D-07:** Require non-JSON or bad body drill.
- **D-08:** Require schema-invalid response drill.
- **D-09:** Require privacy-violation response drill.
- **D-10:** Require divergence/status-mismatch drill.
- **D-11:** Require rollback-to-TypeScript drill.

### Evidence Format
- **D-12:** Produce a single operational evidence artifact summarizing the drills.
- **D-13:** Machine-readable drill result JSON is allowed and recommended if useful for later verification.
- **D-14:** Both human-readable and machine-readable evidence artifacts must be privacy-scanned.
- **D-15:** Evidence may include selected route id, owner mode, failure class, public status, duration bucket, pass/fail, sanitized origin, and artifact links.
- **D-16:** Evidence must not include tokens, sessions, raw URLs with secrets, host paths, database DSNs, stack traces, stderr, response body excerpts, Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, or private runtime internals.

### Pass Condition
- **D-17:** A drill passes only if Go-selected mode fails closed without fallback.
- **D-18:** A drill passes only if public behavior is safe and canonical.
- **D-19:** A drill passes only if diagnostics are sanitized.
- **D-20:** Rollback passes only if the explicit switch restores TypeScript-owned behavior for the selected route.
- **D-21:** If any drill fails, the final decision must be `promote-none-yet` unless a later approved fix reruns and passes the failed drill.

### the agent's Discretion
Planner may decide exact drill implementation mechanics and artifact filenames, provided every required drill is represented and privacy-scanned.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/076-scope-lock-and-route-ownership-manifest/076-CONTEXT.md` — Decision record and blocker format.
- `.planning/phases/077-production-read-switch-contract/077-CONTEXT.md` — Route-specific switch, no-fallback, failure mapping, and diagnostics contract.
- `.planning/phases/078-conditional-public-strategy-go-read-path/078-CONTEXT.md` — Live-data threshold and public page behavior.
- `.planning/phases/079-privacy-parity-and-boundary-drift-gate/079-CONTEXT.md` — Privacy scanning, manifest, and boundary gate decisions.

### Active Milestone
- `.planning/PROJECT.md` — Current v1.12 milestone posture and non-goals.
- `.planning/REQUIREMENTS.md` — OPS requirements and traceability.
- `.planning/ROADMAP.md` — Phase 80 scope and dependencies.
- `.planning/research/SUMMARY.md` — Rollback and operational failure recommendations.

### Prior Evidence and Code
- `.planning/artifacts/v1.11-live-go-readiness-evidence.md` — Existing positive/negative live Go evidence pattern.
- `scripts/check-local-topology.ts` — Existing required-Go behavior and diagnostic sanitization.
- `scripts/check-boundary-monitors.ts` — Existing monitor output and public artifact patterns.
- `apps/web/lib/public-service-adapter.ts` — Route ownership/switch integration point.
- `apps/web/lib/public-go-read-client.ts` — Expected typed Go client if created by Phase 77.
- `packages/spec/src/service.ts` — Canonical public service route and error metadata.
- `packages/spec/src/schemas.ts` — Canonical service error schema.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/artifacts/v1.11-live-go-readiness-evidence.md`: useful model for documenting passing live Go and stopped-Go no-fallback evidence.
- `check-local-topology.ts`: already models required checks, required failures, JSON output, URL sanitization, and private marker stripping.
- Phase 77 diagnostics decisions: provide failure classes and sanitized evidence fields for drill output.

### Established Patterns
- Required live Go checks should fail loudly when Go is unavailable; this is an explicit feature, not a test flake.
- Evidence artifacts should describe operations enough to audit without exposing runtime/private payloads.
- Rollback for this milestone is ownership/config-based, not a source-control or migration rollback.

### Integration Points
- Phase 80 consumes any route switch, typed Go client, no-go blocker, and monitor outputs produced by Phases 77-79.
- Phase 80 produces the operational evidence Phase 81 needs to make the final `promote-one-route` or `promote-none-yet` decision.

</code_context>

<specifics>
## Specific Ideas

The rollback drill should prove TypeScript-owned behavior is restored through the exact selected route, not merely that Go is stopped.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 80-Rollback and Operational Failure Drill*
*Context gathered: 2026-05-23*
