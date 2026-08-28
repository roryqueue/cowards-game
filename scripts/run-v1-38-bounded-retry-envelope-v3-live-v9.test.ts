import { execFileSync } from "node:child_process"
import { chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
  V138_LIVE_V9_MODES,
  V138_LIVE_V9_PROTECTED_BRANCHES,
  authenticateV138LiveV9SourceOnly,
  checkV138LiveV9CorrectedPlan108ValuesForReview,
  computeV138LiveV9Plan108CarrierRoot,
  computeV138LiveV9Plan108PayloadRoot,
  runV138ReviewedBoundedLiveEnvelopeV9,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v9.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

const cloneRepo = (): { owner: string; root: string } => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-live-v9-task1-"))
  const root = path.join(owner, "repo")
  execFileSync("/usr/bin/git", ["clone", "--quiet", "--no-local", repoRoot, root], {
    env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner },
  })
  symlinkSync(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir")
  return { owner, root }
}

describe("Plan 262-111 live-v9 exact corrected-chain gate", () => {
  it("pins the only corrected publication and exposes no production CLI mode", () => {
    expect(V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT).toBe(
      "2639ff3b42e2a238919a3104c9fa8c785c69b93d",
    )
    expect(V138_LIVE_V9_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
    ])
    expect(runV138ReviewedBoundedLiveEnvelopeV9.length).toBe(1)
    expect(runV138ReviewedBoundedLiveEnvelopeV9.toString()).not.toContain("injected")
  })

  it("independently derives exact corrected semantics, pair, history, and zero state", () => {
    const result = authenticateV138LiveV9SourceOnly(repoRoot)
    expect(result).toMatchObject({
      correctedPublicationCommit: V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
      findingCount: 0,
      actualModesPassed: 4,
      syntheticProducerCalls: 1,
      plan109Eligible: true,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      pairCommit: "8080ff66a0880db25db227d23e7e7a0884a79b56",
      envelopeStatus: "sealed_inactive",
      downstreamAuthority: "denied",
    })
    expect(result.protectedBranchCount).toBe(12)
    expect(result.recursiveDependencyCount).toBeGreaterThan(5)
    expect(result.correctedPayloadRoot).toBe(
      "sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2",
    )
    expect(result.correctedReviewRoot).toBe(
      "sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db",
    )
    expect(result.correctedCarrierRoot).toBe(
      "sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5",
    )
  }, 180_000)

  it("rejects every corrected payload semantic even after self-consistent rerooting", () => {
    const exact = authenticateV138LiveV9SourceOnly(repoRoot)
    for (const [key, value] of Object.entries({
      reviewedSourceCommit: "a".repeat(40),
      recursiveDependencyRoot: `sha256:${"1".repeat(64)}`,
      protectedHistoryRoot: `sha256:${"2".repeat(64)}`,
      findingCount: 1,
      findingCodes: ["F-FORGED"],
      actualModesPassed: 3,
      syntheticProducerCalls: 0,
      liveInvoked: true,
      freshCharged: 1,
      freshAccepted: 1,
      plan109Eligible: false,
      authorizesExecution: true,
      downstreamAuthority: "granted",
    })) {
      const payloadBody = { ...exact.correctedPayload, [key]: value }
      delete (payloadBody as Record<string, unknown>).payloadRoot
      const payload = {
        ...payloadBody,
        payloadRoot: computeV138LiveV9Plan108PayloadRoot(payloadBody),
      }
      const carrierBody = {
        ...exact.correctedCarrier,
        payloadRoot: payload.payloadRoot,
        payloadSha256: exact.sha256Canonical(payload),
      }
      delete (carrierBody as Record<string, unknown>).carrierRoot
      const carrier = {
        ...carrierBody,
        carrierRoot: computeV138LiveV9Plan108CarrierRoot(carrierBody),
      }
      expect(
        () => checkV138LiveV9CorrectedPlan108ValuesForReview({
          source: exact.correctedSource,
          payload,
          reviewBytes: exact.correctedReviewBytes,
          carrier,
        }),
        key,
      ).toThrow()
    }
  }, 180_000)

  it("rejects dirty bytes, mode drift, and successor rewrites at the pinned publication", () => {
    const { owner, root } = cloneRepo()
    const payloadPath =
      ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json"
    try {
      const bytes = readFileSync(path.join(root, payloadPath))
      writeFileSync(path.join(root, payloadPath), Buffer.concat([bytes, Buffer.from("dirty\n")]))
      expect(() => authenticateV138LiveV9SourceOnly(root)).toThrow()
      writeFileSync(path.join(root, payloadPath), bytes)
      chmodSync(path.join(root, payloadPath), 0o755)
      expect(() => authenticateV138LiveV9SourceOnly(root)).toThrow()
      chmodSync(path.join(root, payloadPath), 0o644)
      writeFileSync(path.join(root, payloadPath), Buffer.concat([bytes, Buffer.from("rewrite\n")]))
      execFileSync("/usr/bin/git", ["add", "--", payloadPath], { cwd: root })
      execFileSync(
        "/usr/bin/git",
        ["-c", "user.name=Plan 111 Test", "-c", "user.email=plan111@example.invalid", "commit", "--quiet", "-m", "rewrite corrected payload"],
        { cwd: root },
      )
      expect(() => authenticateV138LiveV9SourceOnly(root)).toThrow()
    } finally {
      rmSync(owner, { recursive: true, force: true })
    }
  }, 180_000)

  it("owns all twelve protected branches independently", () => {
    expect(V138_LIVE_V9_PROTECTED_BRANCHES.map(({ plan }) => plan)).toEqual([
      90, 91, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
    ])
  })
})
