import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  buildV138PreSearchPolicyRoot,
  generateV138PreSearchPolicyRoot,
  renderV138PreSearchPolicyRoot,
  validateV138PreSearchSupersession,
  validateV138PreSearchPolicyRoot,
} from "./evaluate-v1-38-pre-search-policy.js"
import { buildV138PlanSupersessionManifest } from "./check-v1-38-dependency-revision-boundaries.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const clone = <T>(value: T): T => globalThis.structuredClone(value)

describe("Phase 262 pre-search policy root", () => {
  it("joins the exact policy components under a capability-specific non-authorizing root", () => {
    const result = generateV138PreSearchPolicyRoot(repoRoot)

    expect(result.schemaVersion).toBe("v1.38-pre-search-policy-root-v1")
    expect(result.rootKind).toBe("pre_search_policy_root")
    expect(result.identityDomain).toBe("cowards-game:v1.38:pre-search-policy-root:v1")
    expect(result.policyStatus).toBe("ready")
    expect(result.matrixAdmissionStatus).toBe("blocked")
    expect(result.custodyStatus).toBe("unavailable")
    expect(result.downstreamAuthority).toBe("denied")
    expect(result.phaseStatus).toEqual({ execution: "in_progress", verification: "gaps_found" })
    expect(result.requirementReadiness).toEqual({
      meas01Through10: "ready",
      deci02: "ready",
      admit03: "blocked",
      seal01: "unavailable",
    })
    expect(result.denials).toEqual({
      satisfiesAdmit03: false,
      satisfiesSeal01: false,
      candidateSearchAuthorized: false,
      phase263Authorized: false,
      formationMaterializationAuthorized: false,
      productionAuthorized: false,
    })
    expect(Object.keys(result.denials)).toHaveLength(6)
    expect(result.components.map(({ id, root }) => [id, root])).toEqual([
      ["study_policy", "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17"],
      ["measurement_policy", "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95"],
      ["protocol_policy", "sha256:34cec9aa1efc317cf07a33b6ff6cc31dd9bcc112625b0ff8fc1961fdda823cf3"],
      ["containment_policy", "sha256:4bdc3e87dc91ed67cc946be448eabd6d2a0bd08e0ec2f73f55b265ce6b9ad504"],
      ["synthetic_custody_mechanics", "sha256:5615979933dfcf3aa0a65556084565adeaf5a0cfb7cc590b4126e0a02e295890"],
    ])
    expect(result.predecessor).toMatchObject({
      joinStatus: "passed_exact",
      matrixAdmissionStatus: "blocked",
      routeTerminal: "calibration_stopped",
      freshCharged: 0,
      freshAccepted: 0,
      authorityExpired: true,
      noRetry: true,
    })
    expect(result.tooling_dependency).toBe("frozen_replay_commit_unreachable")
    expect(result.policyRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("binds exact component bytes, generator/checker bytes, predecessor authority, and supersession", () => {
    const result = generateV138PreSearchPolicyRoot(repoRoot)
    expect(result.components.every(({ artifactSha256 }) => /^sha256:[0-9a-f]{64}$/u.test(artifactSha256))).toBe(true)
    expect(result.sourceBindings).toEqual(expect.objectContaining({
      generatorCheckerPath: "scripts/evaluate-v1-38-pre-search-policy.ts",
      testPath: "scripts/evaluate-v1-38-pre-search-policy.test.ts",
      authorityPath: "scripts/lib/v1-38-policy-authority.ts",
      supersessionPath: ".planning/artifacts/v1.38-phase-262-plan-supersession.json",
      selectedPredecessorAdmissionRoot: "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c",
      supersessionManifestRoot: buildV138PlanSupersessionManifest().manifestRoot,
      replayTestPath: "packages/replay/src/historical-v1-4.test.ts",
      replayManifestPath: "packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json",
      frozenReplayCommit: "4fab0afc058232f37ba11506b5d04a1d59b2f4e0",
    }))
    for (const key of [
      "generatorCheckerSha256",
      "testSha256",
      "authoritySha256",
      "supersessionArtifactSha256",
      "replayTestSha256",
      "replayManifestSha256",
    ] as const) expect(result.sourceBindings[key]).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("authenticates the current canonical supersession without pinning a stale manifest root", () => {
    const current = buildV138PlanSupersessionManifest()
    expect(validateV138PreSearchSupersession(current)).toBe(current.manifestRoot)

    const forged = clone(current) as unknown as Record<string, unknown>
    forged.manifestRoot = `sha256:${"0".repeat(64)}`
    expect(() => validateV138PreSearchSupersession(forged)).toThrow(
      "V138_PRE_SEARCH_POLICY_SUPERSESSION_INVALID",
    )
  })

  it("rejects every missing, extra, or flipped denial before a root can validate", () => {
    const exact = generateV138PreSearchPolicyRoot(repoRoot)
    for (const key of Object.keys(exact.denials) as Array<keyof typeof exact.denials>) {
      const missing = clone(exact) as unknown as Record<string, unknown>
      delete (missing.denials as Record<string, unknown>)[key]
      expect(() => validateV138PreSearchPolicyRoot(missing)).toThrow("V138_PRE_SEARCH_POLICY_DENIALS_INVALID")

      const flipped = clone(exact)
      ;(flipped.denials as Record<string, boolean>)[key] = true
      expect(() => validateV138PreSearchPolicyRoot(flipped)).toThrow("V138_PRE_SEARCH_POLICY_DENIALS_INVALID")
    }
    const extra = clone(exact) as unknown as Record<string, unknown>
    ;(extra.denials as Record<string, unknown>).liveWorkAuthorized = false
    expect(() => validateV138PreSearchPolicyRoot(extra)).toThrow("V138_PRE_SEARCH_POLICY_DENIALS_INVALID")
  })

  it("rejects generic activation naming and all historical, live, candidate, holdout, and formation admission inputs", () => {
    const exact = generateV138PreSearchPolicyRoot(repoRoot)
    for (const [field, value] of [
      ["rootKind", "foundation_activation_root"],
      ["identityDomain", "cowards-game:v1.38:foundation-root:v1"],
      ["matrixAdmissionStatus", "passed"],
      ["custodyStatus", "authorized"],
      ["downstreamAuthority", "granted"],
    ] as const) {
      const mutation = { ...clone(exact), [field]: value }
      expect(() => validateV138PreSearchPolicyRoot(mutation)).toThrow()
    }

    const input = {
      components: exact.components,
      sourceBindings: exact.sourceBindings,
      tooling_dependency: exact.tooling_dependency,
    }
    for (const forbidden of [
      { route5Admission: true },
      { a6Admission: true },
      { historicalEvidenceAdmission: true },
      { liveWriter: "reproduction" },
      { candidateInput: "candidate-1" },
      { holdoutInput: "sealed" },
      { formationInput: "bracket" },
      { providerInput: "provider" },
      { databaseInput: "database" },
    ]) expect(() => buildV138PreSearchPolicyRoot({ ...input, ...forbidden } as never)).toThrow("V138_PRE_SEARCH_POLICY_INPUT_INVALID")
  })

  it("is deterministic, public-safe, and changes identity for any joined-byte mutation", () => {
    const first = generateV138PreSearchPolicyRoot(repoRoot)
    const second = generateV138PreSearchPolicyRoot(repoRoot)
    expect(renderV138PreSearchPolicyRoot(first)).toBe(renderV138PreSearchPolicyRoot(second))

    const mutated = clone(first.components) as Array<(typeof first.components)[number]>
    mutated[0] = { ...mutated[0]!, artifactSha256: `sha256:${"0".repeat(64)}` }
    const changed = buildV138PreSearchPolicyRoot({
      components: mutated,
      sourceBindings: first.sourceBindings,
      tooling_dependency: first.tooling_dependency,
    })
    expect(changed.policyRoot).not.toBe(first.policyRoot)

    expect(JSON.stringify(first)).not.toMatch(/StrategyMemory|SoldierMemory|objective payload|DATABASE_URL|\/Users\/|private path|holdout preimage/iu)
  })

  it("matches the committed artifact exactly and check mode rejects prerequisite drift", () => {
    const expected = renderV138PreSearchPolicyRoot(generateV138PreSearchPolicyRoot(repoRoot))
    const artifactPath = path.join(repoRoot, ".planning/artifacts/v1.38-pre-search-policy-root.json")
    expect(readFileSync(artifactPath, "utf8")).toBe(expected)
    expect(expected.endsWith("\n")).toBe(true)
  })
})
