import { chmodSync, lstatSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  PLAN_114_REVIEWED_SOURCE_COMMIT,
  authenticateV138Plan114PublishedReview,
  executeV138Plan114DisposableModes,
  observeV138Plan114FoundationForReview,
  renderV138Plan114EvidenceForReview,
  type V138Plan114Finding,
} from "./check-v1-38-plan-262-114-live-v10-custody-v1.js"
import {
  computeV138Plan114IndependentReproductionRoot,
  deriveV138Plan114IndependentPostSemantics,
} from "./lib/v1-38-plan-262-114-independent-semantics-v2.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("Plan 262-114 independent live-v10 custody review", () => {
  it("owns source-separated custody without Plan-113 derivation or root helpers", () => {
    const source = readFileSync(path.join(
      repoRoot,
      "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts",
    ), "utf8")
    expect(source).not.toMatch(/import\s*\{[^}]*deriveV138PathStableCustody/)
    expect(source).not.toMatch(/deriveV138PathStableCustody\s*\(/)
    expect(source).not.toContain("computeV138PathStable")
  })

  it("derives complete value semantics without subject acceptance or root helpers", () => {
    expect(deriveV138Plan114IndependentPostSemantics({
      journalPresent: true,
      privateDirectoryPresent: true,
      terminalPresent: true,
      lockPresent: false,
      reproductionPresent: false,
      adjudicationOrDownstreamPresent: false,
      outcome: {
        disposition: "exhausted",
        completeCleanup: true,
        reproductionPresent: false,
        downstreamAuthority: "denied",
      },
    })).toEqual({ status: "bounded_terminal", downstreamAuthority: "denied" })
    const body = { privacyProjection: { strategySourceIncluded: false }, productionAuthorized: false }
    expect(computeV138Plan114IndependentReproductionRoot(body)).not.toBe(
      computeV138Plan114IndependentReproductionRoot({
        ...body,
        privacyProjection: { strategySourceIncluded: true },
      }),
    )
    const source = readFileSync(path.join(
      repoRoot,
      "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts",
    ), "utf8")
    expect(source).not.toMatch(/subject\.computeV138LiveV10/)
  })

  it("pins the final Plan-113 closure and executes all six real disposable modes", () => {
    expect(PLAN_114_REVIEWED_SOURCE_COMMIT).toBe(
      "ba1f8ddb4d701762d5d443f41edcbb691bb0eda5",
    )
    const result = executeV138Plan114DisposableModes(repoRoot)
    expect(result.modeNames).toEqual([
      "source_only_cli",
      "prospective_custody_cli",
      "post_no_effect_cli",
      "post_non_pass_value",
      "post_success_value",
      "exact_reproduction_value",
    ])
    expect(result.actualModesPassed).toBe(6)
    expect(result.findings).toEqual([])
    expect(result.producerCalls).toBe(0)
    expect(result.readinessInvoked).toBe(false)
    expect(result.liveInvoked).toBe(false)
    expect(result.freshCharged).toBe(0)
    expect(result.freshAccepted).toBe(0)
    expect(result.observationRoot).toMatch(/^sha256:[0-9a-f]{64}$/)
  }, 180_000)

  it("renders deterministic blocked evidence and grants eligibility only to literal zero", () => {
    const findings: readonly V138Plan114Finding[] = [
      { code: "PAIR_COUNTER_DRIFT", severity: "critical", detail: "counter changed" },
      { code: "PATH_STABLE_ROOT_DRIFT", severity: "critical", detail: "root changed" },
    ]
    const first = renderV138Plan114EvidenceForReview(repoRoot, findings)
    const second = renderV138Plan114EvidenceForReview(repoRoot, [...findings].reverse())
    expect(first.payload).toEqual(second.payload)
    expect(first.reviewBytes.equals(second.reviewBytes)).toBe(true)
    expect(first.carrier).toEqual(second.carrier)
    expect(first.payload).toMatchObject({
      reviewStatus: "blocked",
      findingCount: 2,
      actualModesPassed: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(first.plan109Eligible).toBe(false)
    expect(first.reviewBytes.toString("utf8")).toContain("BLOCKED")
    expect(() => renderV138Plan114EvidenceForReview(repoRoot, [])).toThrow(
      "V138_PLAN114_ZERO_REQUIRES_EXECUTED_MODES",
    )
  }, 180_000)

  it("turns real current-byte and mode mutations into deterministic blocked evidence", () => {
    const repoPath = "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts"
    const absolute = path.join(repoRoot, repoPath)
    const bytes = readFileSync(absolute)
    try {
      chmodSync(absolute, 0o755)
      const mode = observeV138Plan114FoundationForReview(repoRoot)
      expect(mode.findings.map(({ code }) => code)).toEqual(["RAW_MODE_DRIFT"])
      chmodSync(absolute, 0o644)

      writeFileSync(absolute, Buffer.concat([bytes, Buffer.from("\n// real Plan114 mutation\n")]))
      const changed = observeV138Plan114FoundationForReview(repoRoot)
      expect(changed.findings.map(({ code }) => code)).toEqual(["RAW_BYTES_DRIFT"])
      writeFileSync(absolute, bytes)

      const first = renderV138Plan114EvidenceForReview(repoRoot, [...mode.findings, ...changed.findings])
      const second = renderV138Plan114EvidenceForReview(repoRoot, [...changed.findings, ...mode.findings])
      expect(first.payload).toEqual(second.payload)
      expect(first.reviewBytes.equals(second.reviewBytes)).toBe(true)
      expect(first.plan109Eligible).toBe(false)
    } finally {
      writeFileSync(absolute, bytes)
      chmodSync(absolute, 0o644)
    }
  }, 180_000)

  it("roots every custody, mode, history, counter, privacy, and authority mutation as blocked", () => {
    const mutationCodes = [
      "SOURCE_COMMIT_DRIFT",
      "SOURCE_TREE_DRIFT",
      "SOURCE_PARENT_DRIFT",
      "RAW_MODE_DRIFT",
      "RAW_BLOB_DRIFT",
      "RAW_BYTES_DRIFT",
      "RECURSIVE_IMPORT_DRIFT",
      "INSTALLED_TOOLCHAIN_DRIFT",
      "PATH_STABLE_NATIVE_DRIFT",
      "REVIEWED_CLOSURE_DRIFT",
      "LOCAL_EXECUTION_CONTEXT_DRIFT",
      "PLAN108_HISTORY_DRIFT",
      "PLAN111_HISTORY_DRIFT",
      "PLAN112_V1_HISTORY_DRIFT",
      "PLAN112_V2_HISTORY_DRIFT",
      "PAIR_DRIFT",
      "PLAN93_STOP_DRIFT",
      "PROTECTED_HISTORY_DRIFT",
      "PAIR_COUNTER_DRIFT",
      "PRIVACY_DRIFT",
      "AUTHORITY_DRIFT",
      "PLAN114_TRIO_DRIFT",
      "SUPPLEMENT_V3_DRIFT",
      "MODE_SOURCE_ONLY_FAILED",
      "MODE_PROSPECTIVE_FAILED",
      "MODE_POST_NO_EFFECT_FAILED",
      "MODE_NON_PASS_FAILED",
      "MODE_SUCCESS_FAILED",
      "MODE_EXACT_REPRODUCTION_FAILED",
      "READINESS_SELECTOR_INVOKED",
      "PRODUCTION_SELECTOR_INVOKED",
    ]
    for (const code of mutationCodes) {
      const rendered = renderV138Plan114EvidenceForReview(repoRoot, [{
        code,
        severity: "critical",
        detail: "mutation detected",
      }])
      expect(rendered.payload.findingCodes).toEqual([code])
      expect(rendered.plan109Eligible).toBe(false)
      expect(rendered.payload.authorizesExecution).toBe(false)
    }
  }, 180_000)

  it("authenticates only the committed trio and preserves every no-effect sentinel", () => {
    const payloadPath = path.join(
      repoRoot,
      ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json",
    )
    try { lstatSync(payloadPath) }
    catch {
      expect(() => authenticateV138Plan114PublishedReview(repoRoot)).toThrow(
        "V138_PLAN114_PUBLICATION_ABSENT",
      )
      return
    }
    const checked = authenticateV138Plan114PublishedReview(repoRoot)
    expect(checked).toMatchObject({
      findingCount: 0,
      actualModesPassed: 6,
      plan109Eligible: true,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    for (const repoPath of checked.forbiddenDestinations) {
      expect(() => lstatSync(path.join(repoRoot, repoPath))).toThrow()
    }
  }, 180_000)
})
