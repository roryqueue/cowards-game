import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  assertV138Plan122PublishedLocalClosureForReview,
  executeV138Plan122DisposableModes,
  inspectV138Plan122BoundarySourceForReview,
  renderV138Plan122EvidenceForReview,
} from "./check-v1-38-plan-262-122-live-v13-custody-v3.js"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")

describe("Plan 262-122 independent live-v13 custody review v3", () => {
  it("rejects producer aliases, relocated calls, and injectable effect seams", () => {
    const source = readFileSync(path.join(ROOT,
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"), "utf8")
    expect(inspectV138Plan122BoundarySourceForReview(source)).toMatchObject({
      producerCallSites: 1,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
    })
    expect(() => inspectV138Plan122BoundarySourceForReview(
      source.replace("await runV138V3ProductionLive", "const alias = runV138V3ProductionLive; await alias"),
    )).toThrow("V138_PLAN122_PRODUCTION_BOUNDARY_INVALID")
    expect(() => inspectV138Plan122BoundarySourceForReview(
      source.replace("repoRoot: string", "repoRoot: string, injectedProducer?: unknown"),
    )).toThrow("V138_PLAN122_PRODUCTION_BOUNDARY_INVALID")
    for (const injected of [
      "const bypass = eval\n",
      "const bypass = Function('return 1')\n",
      "const bypass = require('node:module')\n",
      "const bypass = import('./run-v1-38-bounded-retry-envelope-v3.js')\n",
      "const bypass = 'runV138' + 'V3ProductionLive'\n",
      "const bypass = 'getBuiltin' + 'Module'\n",
    ]) expect(() => inspectV138Plan122BoundarySourceForReview(
      source.replace("type Sha =", `${injected}type Sha =`),
    )).toThrow("V138_PLAN122_PRODUCTION_BOUNDARY_INVALID")

    const withoutOwnerCall = source.replace(
      "runV138V3ProductionLive(repoRoot, {",
      "Promise.resolve({",
    )
    const movedCalls = [
      withoutOwnerCall.replace(
        'if (args[0] === "--check-source-only") {',
        'if (args[0] === "--check-source-only") { await runV138V3ProductionLive(root, {} as never)',
      ),
      withoutOwnerCall.replace(
        'if ((args[0] === "--check-prospective-custody"',
        'if ((await runV138V3ProductionLive(root, {} as never), args[0] === "--check-prospective-custody"',
      ),
      withoutOwnerCall.replace(
        'if (args[0] === "--check-post-run-custody") assertV138LiveV10PostRunForReview(root)',
        'if (args[0] === "--check-post-run-custody") { await runV138V3ProductionLive(root, {} as never); assertV138LiveV10PostRunForReview(root) }',
      ),
      withoutOwnerCall.replace(
        "const result = authenticateFutureCustody(root, args[0] ===",
        'if (args[0] === "--check-reviewed-live-ready") await runV138V3ProductionLive(root, {} as never)\n  const result = authenticateFutureCustody(root, args[0] ===',
      ),
    ]
    for (const moved of movedCalls)
      expect(() => inspectV138Plan122BoundarySourceForReview(moved)).toThrow(
        "V138_PLAN122_PRODUCTION_BOUNDARY_INVALID",
      )
  })

  it("executes exactly six producer-incapable observations and renders literal-zero eligibility", () => {
    const modes = executeV138Plan122DisposableModes(ROOT)
    expect(modes.modeNames).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-non-pass-value",
      "--check-bounded-success-value",
      "--check-exact-reproduction-v17-value",
    ])
    expect(modes).toMatchObject({
      actualModesPassed: 6,
      findings: [],
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      producerGuardCount: 0,
    })
    expect(modes.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(modes.observations.every((observation) => observation.producerGuardCount === 0)).toBe(true)
    expect(assertV138Plan122PublishedLocalClosureForReview({
      reviewedClosureRoot: modes.reviewedClosureRoot,
      canonicalLocalExecutionClosureRoot: modes.canonicalCustody.localExecutionClosureRoot,
      localInstalledClosureRoot: modes.canonicalCustody.localInstalledClosureRoot,
      localGitObjectRoot: modes.canonicalCustody.localGitObjectRoot,
      localNativeSourcesRoot: modes.canonicalCustody.localNativeSourcesRoot,
      observations: modes.observations,
      observationsRoot: modes.observationRoot,
      findingCount: 0,
      actualModesPassed: 6,
    }, modes)).toMatchObject({
      actualModesPassed: 6,
      producerGuardCount: 0,
      observationRoot: modes.observationRoot,
    })
    for (const reviewedCustody of [
      { ...modes.reviewedCustody, recursiveDependencyRoot: `sha256:${"1".repeat(64)}` },
      { ...modes.reviewedCustody, installedClosureRoot: `sha256:${"2".repeat(64)}` },
      { ...modes.reviewedCustody, pathStableNativeSourcesRoot: `sha256:${"3".repeat(64)}` },
      { ...modes.reviewedCustody, localExecutionClosureRoot: `sha256:${"4".repeat(64)}` },
    ]) expect(() => assertV138Plan122PublishedLocalClosureForReview({
      reviewedClosureRoot: modes.reviewedClosureRoot,
      canonicalLocalExecutionClosureRoot: modes.canonicalCustody.localExecutionClosureRoot,
      localInstalledClosureRoot: modes.canonicalCustody.localInstalledClosureRoot,
      localGitObjectRoot: modes.canonicalCustody.localGitObjectRoot,
      localNativeSourcesRoot: modes.canonicalCustody.localNativeSourcesRoot,
      observations: modes.observations,
      observationsRoot: modes.observationRoot,
      findingCount: 0,
      actualModesPassed: 6,
    }, { ...modes, reviewedCustody } as typeof modes)).toThrow()
    const evidence = renderV138Plan122EvidenceForReview(ROOT, modes.findings, modes)
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
  }, 240_000)

  it("blocks eligibility when a rooted subject finding exists", () => {
    const evidence = renderV138Plan122EvidenceForReview(ROOT, [{
      code: "SOURCE_CUSTODY_DRIFT",
      severity: "critical",
      subject: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
      detail: "mutation fixture",
    }])
    expect(evidence.payload).toMatchObject({
      reviewStatus: "blocked",
      findingCount: 1,
      actualModesPassed: 0,
      plan110Eligible: false,
      authorizesExecution: false,
    })
  }, 30_000)
})
