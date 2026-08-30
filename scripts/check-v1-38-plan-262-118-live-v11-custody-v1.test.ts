import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  executeV138Plan118DisposableModes,
  inspectV138Plan118BoundarySourceForReview,
  renderV138Plan118EvidenceForReview,
} from "./check-v1-38-plan-262-118-live-v11-custody-v1.js"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")

describe("Plan 262-118 independent live-v11 custody review", () => {
  it("rejects producer aliases and injectable effect seams", () => {
    const source = readFileSync(path.join(ROOT,
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts"), "utf8")
    expect(inspectV138Plan118BoundarySourceForReview(source)).toMatchObject({
      producerCallSites: 1,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
    })
    expect(() => inspectV138Plan118BoundarySourceForReview(
      source.replace("await runV138V3ProductionLive", "const alias = runV138V3ProductionLive; await alias"),
    )).toThrow("V138_PLAN118_PRODUCTION_BOUNDARY_INVALID")
    expect(() => inspectV138Plan118BoundarySourceForReview(
      source.replace("repoRoot: string", "repoRoot: string, injectedProducer?: unknown"),
    )).toThrow("V138_PLAN118_PRODUCTION_BOUNDARY_INVALID")
  })

  it("executes exactly six producer-incapable observations and renders literal-zero eligibility", () => {
    const modes = executeV138Plan118DisposableModes(ROOT)
    expect(modes.modeNames).toEqual([
      "source_only_cli",
      "prospective_custody_cli",
      "post_no_effect_cli",
      "post_non_pass_value",
      "post_success_value",
      "exact_reproduction_value",
    ])
    expect(modes).toMatchObject({
      actualModesPassed: 6,
      findings: [],
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    })
    const evidence = renderV138Plan118EvidenceForReview(ROOT, modes.findings, modes)
    expect(evidence.payload).toMatchObject({
      findingCount: 0,
      actualModesPassed: 6,
      plan110Eligible: true,
      authorizesExecution: false,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
    expect(evidence.carrier).toMatchObject({
      findingCount: 0,
      actualModesPassed: 6,
      plan110Eligible: true,
      authorizesExecution: false,
    })
  }, 180_000)

  it("blocks eligibility when a rooted subject finding exists", () => {
    const evidence = renderV138Plan118EvidenceForReview(ROOT, [{
      code: "SOURCE_CUSTODY_DRIFT",
      severity: "critical",
      subject: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
      detail: "mutation fixture",
    }])
    expect(evidence.payload).toMatchObject({
      reviewStatus: "blocked",
      findingCount: 1,
      actualModesPassed: 0,
      plan110Eligible: false,
      authorizesExecution: false,
    })
  })
})
