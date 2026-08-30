import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  assertV138Plan130ExactB331ScopeForReview,
  executeV138Plan130DisposableCustodyForReview,
  assertV138Plan130StrictLaterHeadForReview,
  authenticateV138Plan130V3InvalidationForReview,
  inspectV138Plan130BoundarySourceForReview,
  computeV138Plan130RootRelativeNativeCustodyForReview,
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
      expect(observation.disposableLocalNativeSourcesRoot)
        .not.toBe(result.canonicalBefore.localNativeSourcesRoot)
      expect(observation.disposableLocalNativeSourcePaths.every((entry) =>
        entry.includes("/v138-plan130-mode-") && !entry.startsWith(`${ROOT}/`))).toBe(true)
      expect(observation.disposableLocalExecutionClosureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(observation.producerGuardCount).toBe(0)
    }
  }, 180_000)

  it("binds local native custody to the supplied execution root", () => {
    const owner = mkdtempSync(path.join(tmpdir(), "v138-plan130-native-root-"))
    try {
      for (const repoPath of [
        "scripts/native/v1-38-successor-transaction-helper-v6.c",
        "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
      ]) {
        const destination = path.join(owner, repoPath)
        mkdirSync(path.dirname(destination), { recursive: true })
        copyFileSync(path.join(ROOT, repoPath), destination)
      }
      const canonical = computeV138Plan130RootRelativeNativeCustodyForReview(ROOT)
      const disposable = computeV138Plan130RootRelativeNativeCustodyForReview(owner)
      expect(canonical.paths.every((entry) => entry.startsWith(`${ROOT}/`))).toBe(true)
      expect(disposable.paths.every((entry) => entry.startsWith(`${owner}/`))).toBe(true)
      expect(disposable.root).not.toBe(canonical.root)
    } finally {
      rmSync(owner, { recursive: true, force: true })
    }
  })

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
      'const k = "constructor"; globalThis[k][k]("return 1")()\n',
      'const k = "eval"; globalThis[k]("1")\n',
      'const k = "getBuiltinModule"; process[k]("node:module")\n',
      'const k = ["con", "structor"].join(""); globalThis[k][k]("return process.getBuiltinModule(\\"module\\").createRequire(import.meta.url)(\\"./run-v1-38-bounded-retry-envelope-v3.js\\").runV138V3ProductionLive")()\n',
      'const g = globalThis; const k = "constructor"; const recovered = g[k][k]\n',
      'const p = process; const k = process.argv[0]; const recovered = p[k]("node:module")\n',
      'const { constructor: recovered } = globalThis\n',
      'const recovered = Reflect.get(globalThis, "constructor")\n',
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
