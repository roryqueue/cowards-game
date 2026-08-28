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
  deriveV138LiveV9ProspectiveContractsForReview,
  runV138ReviewedBoundedLiveEnvelopeV9,
  settleV138LiveV9ProducerOutcomeForReview,
  checkV138LiveV9ProspectiveCustodyForReview,
  checkV138LiveV9PostRunOutputCustodyForReview,
  executeV138LiveV9Cli,
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
  it("pins the corrected publication and exposes only the exact Plan 110 selectors", () => {
    expect(V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT).toBe(
      "2639ff3b42e2a238919a3104c9fa8c785c69b93d",
    )
    expect(V138_LIVE_V9_MODES).toEqual([
      "--check-source-only",
      "--check-prospective-custody",
      "--check-post-run-custody",
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
    ])
    expect(runV138ReviewedBoundedLiveEnvelopeV9.length).toBe(1)
    expect(runV138ReviewedBoundedLiveEnvelopeV9.toString()).not.toContain("injected")
    expect(executeV138LiveV9Cli.toString()).toContain(
      "runV138ReviewedBoundedLiveEnvelopeV9(repoRoot)",
    )
    expect(executeV138LiveV9Cli.toString()).not.toContain("runLive")
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

describe("Plan 262-111 future review and post-effect contract", () => {
  const sha = (character: string) => `sha256:${character.repeat(64)}` as const
  const reviewedClosure = Object.freeze({
    sourceCommit: "1".repeat(40),
    sourceTree: "2".repeat(40),
    sourceParent: "3".repeat(40),
    checkoutPaths: [
      "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
      "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
      "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
      "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
    ],
    rawByteManifestRoot: sha("4"),
    recursiveDependencyRoot: sha("5"),
    recursiveDependencyCount: 11,
    installedClosureRoot: sha("6"),
    nodeSha256: sha("7"),
    pnpmDistributionSha256: sha("8"),
    nativeSourcesRoot: sha("9"),
    portableClosureRoot: sha("a"),
    executionClosureRoot: sha("b"),
    pathnameLaunchReplacementResistanceClaimed: false,
  })

  it("joins corrected v9, prospective Plan 112, and supplement-v2 through a producer-incapable seam", () => {
    const corrected = authenticateV138LiveV9SourceOnly(repoRoot)
    const prospective = deriveV138LiveV9ProspectiveContractsForReview({
      corrected,
      reviewedClosure,
      plan112PublicationCommit: "d".repeat(40),
    })
    expect(prospective.plan112.payload).toMatchObject({
      schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-payload-v1",
      findingCount: 0,
      findingCodes: [],
      plan109Eligible: true,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(prospective.supplement).toMatchObject({
      schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v2",
      sourceSealRoot: "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752",
      retryEnvelopeRoot: "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a",
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })
    expect(
      checkV138LiveV9ProspectiveCustodyForReview({
        corrected,
        reviewedClosure,
        plan112PublicationCommit: "d".repeat(40),
        plan112: prospective.plan112,
        supplement: prospective.supplement,
      }),
    ).toMatchObject({ producerWouldInvoke: true, liveInvoked: false })
    expect(runV138ReviewedBoundedLiveEnvelopeV9.toString()).toContain(
      "runV138V3ProductionLive",
    )
  }, 180_000)

  it("rejects future review and supplement mutations plus historical compatibility substitutions", () => {
    const corrected = authenticateV138LiveV9SourceOnly(repoRoot)
    const prospective = deriveV138LiveV9ProspectiveContractsForReview({
      corrected,
      reviewedClosure,
      plan112PublicationCommit: "d".repeat(40),
    })
    for (const mutation of [
      { plan112: { ...prospective.plan112, payload: { ...prospective.plan112.payload, findingCount: 1 } } },
      { plan112: { ...prospective.plan112, carrier: { ...prospective.plan112.carrier, payloadMode: "100755" } } },
      { supplement: { ...prospective.supplement, schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v1" } },
      { supplement: { ...prospective.supplement, correctedReviewRoot: sha("c") } },
      { supplement: { ...prospective.supplement, authorizesExecution: true } },
      { supplement: { ...prospective.supplement, freshAccepted: 1 } },
    ]) {
      expect(() =>
        checkV138LiveV9ProspectiveCustodyForReview({
          corrected,
          reviewedClosure,
          plan112PublicationCommit: "d".repeat(40),
          plan112: mutation.plan112 ?? prospective.plan112,
          supplement: mutation.supplement ?? prospective.supplement,
        }),
      ).toThrow()
    }
  }, 180_000)

  it("preserves producer failure and exposes simultaneous post-custody failure", () => {
    const producer = new Error("producer failed")
    const custody = new Error("custody failed")
    expect(() => settleV138LiveV9ProducerOutcomeForReview(producer, undefined)).toThrow(
      producer,
    )
    try {
      settleV138LiveV9ProducerOutcomeForReview(producer, custody)
      throw new Error("expected aggregate failure")
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError)
      expect((error as AggregateError).errors).toEqual([producer, custody])
      expect((error as AggregateError & { cause: unknown }).cause).toBe(producer)
    }
    expect(() => settleV138LiveV9ProducerOutcomeForReview(undefined, custody)).toThrow(
      custody,
    )
  })

  it("permits only a complete bounded terminal outcome after effects", () => {
    expect(checkV138LiveV9PostRunOutputCustodyForReview({
      journalPresent: false,
      privateDirectoryPresent: false,
      terminalPresent: false,
      lockPresent: false,
      reproductionPresent: false,
      adjudicationOrDownstreamPresent: false,
    })).toEqual({ status: "no_effects", downstreamAuthority: "denied" })
    expect(checkV138LiveV9PostRunOutputCustodyForReview({
      journalPresent: true,
      privateDirectoryPresent: true,
      terminalPresent: true,
      lockPresent: false,
      reproductionPresent: false,
      adjudicationOrDownstreamPresent: false,
      outcome: {
        completeCleanup: true,
        reproductionPresent: false,
        downstreamAuthority: "denied",
      },
    })).toEqual({ status: "bounded_terminal", downstreamAuthority: "denied" })
    for (const mutation of [
      { journalPresent: true },
      { privateDirectoryPresent: true },
      { terminalPresent: true },
      { lockPresent: true },
      { reproductionPresent: true },
      { adjudicationOrDownstreamPresent: true },
      {
        journalPresent: true,
        privateDirectoryPresent: true,
        terminalPresent: true,
        outcome: {
          completeCleanup: false,
          reproductionPresent: false,
          downstreamAuthority: "denied",
        },
      },
    ]) {
      expect(() => checkV138LiveV9PostRunOutputCustodyForReview({
        journalPresent: false,
        privateDirectoryPresent: false,
        terminalPresent: false,
        lockPresent: false,
        reproductionPresent: false,
        adjudicationOrDownstreamPresent: false,
        ...mutation,
      })).toThrow()
    }
  })
})
