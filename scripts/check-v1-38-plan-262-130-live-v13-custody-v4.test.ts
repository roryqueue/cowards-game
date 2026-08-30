import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  assertV138Plan130ExactB331ScopeForReview,
  executeV138Plan130DisposableCustodyForReview,
  assertV138Plan130StrictLaterHeadForReview,
  authenticateV138Plan130V3InvalidationForReview,
  inspectV138Plan130BoundarySourceForReview,
  V138_PLAN130_B331_SCOPE,
} from "./check-v1-38-plan-262-130-live-v13-custody-v4.js"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")

describe("Plan 262-130 authentic disposable custody v4", () => {
  it("rejects missing, extra, and status-changed b331 paths", () => {
    expect(assertV138Plan130ExactB331ScopeForReview(V138_PLAN130_B331_SCOPE))
      .toEqual(V138_PLAN130_B331_SCOPE)
    expect(() => assertV138Plan130ExactB331ScopeForReview(V138_PLAN130_B331_SCOPE.slice(1)))
      .toThrow("V138_PLAN130_B331_SCOPE_INVALID")
    expect(() => assertV138Plan130ExactB331ScopeForReview([
      ...V138_PLAN130_B331_SCOPE,
      "A\textra-path",
    ])).toThrow("V138_PLAN130_B331_SCOPE_INVALID")
    expect(() => assertV138Plan130ExactB331ScopeForReview([
      V138_PLAN130_B331_SCOPE[0]!.replace(/^A/u, "M"),
      ...V138_PLAN130_B331_SCOPE.slice(1),
    ])).toThrow("V138_PLAN130_B331_SCOPE_INVALID")
  })

  it("derives each observation inside its disposable worktree without mode salting", () => {
    const result = executeV138Plan130DisposableCustodyForReview(ROOT)
    expect(result).toMatchObject({
      actualModesPassed: 6,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      findings: [],
    })
    expect(result.observations).toHaveLength(6)
    expect(result.canonicalBefore).toEqual(result.canonicalAfter)
    for (const observation of result.observations) {
      expect(observation.disposableReviewedClosureRoot).toBe(result.canonicalBefore.reviewedClosureRoot)
      expect(observation.disposableLocalInstalledClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.disposableLocalGitObjectRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.disposableLocalNativeSourcesRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.disposableLocalExecutionClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.producerGuardCount).toBe(0)
    }
  }, 180_000)

  it("rejects constructor, loader, assembled-name, namespace, and recovered-export paths", () => {
    const source = readFileSync(path.join(ROOT,
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts"), "utf8")
    expect(inspectV138Plan130BoundarySourceForReview(source)).toMatchObject({
      producerCallSites: 1,
      producerCalls: 0,
      readinessInvoked: false,
      liveInvoked: false,
    })
    for (const injected of [
      'globalThis.constructor.constructor("return import(\\"./run-v1-38-bounded-retry-envelope-v3.js\\").then(m => m.runV138V3ProductionLive)")()\n',
      'globalThis["con" + "structor"][`con${"struc"}tor`]("return 1")()\n',
      'const alias = Function; alias("return 1")()\n',
      'const indirect = eval; (0, indirect)("1")\n',
      'process.mainModule?.["re" + "quire"]("node:module")\n',
      'import("./run-v1-38-bounded-retry-envelope-v3.js")\n',
      'const name = "runV138" + "V3ProductionLive"\n',
      'const mod = `./run-v1-38-${"bounded-retry"}-envelope-v3.js`\n',
      'import * as producerNamespace from "./run-v1-38-bounded-retry-envelope-v3.js"\n',
      'const recovered = producerNamespace["runV138" + "V3ProductionLive"]\n',
    ]) expect(() => inspectV138Plan130BoundarySourceForReview(
      source.replace("type Sha =", `${injected}type Sha =`),
    )).toThrow("V138_PLAN130_PRODUCTION_BOUNDARY_INVALID")
  })

  it("requires a strict later HEAD and fixes v3 current eligibility false", () => {
    expect(() => assertV138Plan130StrictLaterHeadForReview("a".repeat(40), "a".repeat(40), true))
      .toThrow("V138_PLAN130_PUBLICATION_NOT_STRICT_ANCESTOR")
    expect(() => assertV138Plan130StrictLaterHeadForReview("a".repeat(40), "b".repeat(40), false))
      .toThrow("V138_PLAN130_PUBLICATION_NOT_STRICT_ANCESTOR")
    expect(assertV138Plan130StrictLaterHeadForReview("a".repeat(40), "b".repeat(40), true)).toBe(true)
    expect(authenticateV138Plan130V3InvalidationForReview(ROOT)).toMatchObject({
      publicationCommit: "65a7a246627a411c45ced95bfb3c0296f0f8e4eb",
      storedPlan110Eligible: true,
      currentPlan110Eligible: false,
      disposition: "process_invalid_false_clean_custody",
    })
  })
})
