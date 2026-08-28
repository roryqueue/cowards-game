import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
  V138_LIVE_V8_MODES,
  V138_LIVE_V8_PATHS,
  V138_LIVE_V8_PROTECTED_BRANCHES,
  authenticateV138LiveV8ProtectedBranchForReview,
  authenticateV138LiveV8ProtectedHistory,
  checkV138LiveV8SyntheticCustodyForReview,
  computeV138LiveV8ReviewCarrierRoot,
  computeV138LiveV8ReviewPayloadRoot,
  computeV138LiveV8SupplementRoot,
  executeV138LiveV8Cli,
  type V138LiveV8ReviewBundle,
  type V138LiveV8Supplement,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v8.js"

const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT =
  "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT =
  "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT =
  "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const SOURCE_COMMIT = "1".repeat(40)
const SOURCE_TREE = "2".repeat(40)
const SOURCE_PARENT = "3".repeat(40)
const EXECUTION_ROOT = `sha256:${"4".repeat(64)}` as const
const REVIEW_ROOT = `sha256:${"5".repeat(64)}` as const
const repoRoot = path.resolve(import.meta.dirname, "..")
const sha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")
const canonicalPaths = [
  ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-93-PRESTART-INTEGRITY-STOP.md",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json",
] as const
const liveDestinations = [
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
] as const
const canonicalSnapshot = () =>
  Object.fromEntries(
    canonicalPaths.map((repoPath) => [
      repoPath,
      sha256(readFileSync(path.join(repoRoot, repoPath))),
    ]),
  )
const pathState = (repoPath: string): string => {
  const absolute = path.join(repoRoot, repoPath)
  if (!existsSync(absolute)) return "absent"
  const status = lstatSync(absolute)
  return status.isFile() ? `file:${sha256(readFileSync(absolute))}` : "non-file-present"
}
const effectSnapshot = () =>
  Object.fromEntries(
    [V138_LIVE_V8_PATHS.supplement, ...liveDestinations].map((repoPath) => [
      repoPath,
      pathState(repoPath),
    ]),
  )

const reviewBundle = (): V138LiveV8ReviewBundle => {
  const body = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-payload-v8" as const,
    reviewedSourceCommit: SOURCE_COMMIT,
    reviewedSourceTree: SOURCE_TREE,
    reviewedSourceParent: SOURCE_PARENT,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: EXECUTION_ROOT,
    findingCount: 0 as const,
    reviewStatus: "zero_findings" as const,
    actualModesPassed: 4 as const,
    syntheticProducerCalls: 1 as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    authorizesExecution: false as const,
    downstreamAuthority: "denied" as const,
  }
  const payload = {
    ...body,
    payloadRoot: computeV138LiveV8ReviewPayloadRoot(body),
  }
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-carrier-v1" as const,
    payloadRoot: payload.payloadRoot,
    reviewRoot: REVIEW_ROOT,
    payloadMode: "100644" as const,
    reviewMode: "100644" as const,
    carrierMode: "100644" as const,
    payloadSha256: `sha256:${"7".repeat(64)}` as const,
    reviewSha256: `sha256:${"8".repeat(64)}` as const,
    findingCount: 0 as const,
    authorizesExecution: false as const,
    downstreamAuthority: "denied" as const,
  }
  return {
    payload,
    review: {
      schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v1",
      payloadRoot: payload.payloadRoot,
      findingCount: 0,
      verdict: "zero_findings",
      reviewRoot: REVIEW_ROOT,
    },
    carrier: {
      ...carrierBody,
      carrierRoot: computeV138LiveV8ReviewCarrierRoot(carrierBody),
    },
  }
}

const supplement = (bundle = reviewBundle()): V138LiveV8Supplement => {
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v1" as const,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    envelopeStatus: "sealed_inactive" as const,
    counters: {
      routeStartsConsumed: 0 as const,
      preflightObservationsConsumed: 0 as const,
      calibrationIdentitiesCharged: 0 as const,
      reproductionIdentitiesCharged: 0 as const,
      acceptedCells: 0 as const,
    },
    assuranceClass: "single_operator_local_seal_v1" as const,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan93: {
      attempt: 1 as const,
      status: "pre_start_integrity_stop" as const,
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID" as const,
      liveEffectBoundaryCrossed: false as const,
      envelopeConsumed: false as const,
      routeStarts: 0 as const,
      preflightObservations: 0 as const,
      calibrationCharged: 0 as const,
      reproductionCharged: 0 as const,
      freshAccepted: 0 as const,
      terminalPresent: false as const,
      complete: false as const,
    },
    plan107: {
      sourceCommit: SOURCE_COMMIT,
      sourceTree: SOURCE_TREE,
      sourceParent: SOURCE_PARENT,
      checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
      executionClosureRoot: EXECUTION_ROOT,
    },
    plan108: {
      payloadRoot: bundle.payload.payloadRoot,
      reviewRoot: bundle.review.reviewRoot,
      carrierRoot: bundle.carrier.carrierRoot,
      findingCount: 0 as const,
      verdict: "zero_findings" as const,
    },
    supersessionScope: "executable_source_custody_only" as const,
    createsEnvelope: false as const,
    createsCapacity: false as const,
    resetsCounters: false as const,
    authorizesExecution: false as const,
    candidateSearchAuthorized: false as const,
    formationAuthorized: false as const,
    holdoutAuthorized: false as const,
    publicAuthorized: false as const,
    productAuthorized: false as const,
    productionAuthorized: false as const,
    countedPlayAuthorized: false as const,
    gameplayChangeAuthorized: false as const,
    archiveAuthorized: false as const,
    tagAuthorized: false as const,
    phase263Authorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  return { ...body, supplementRoot: computeV138LiveV8SupplementRoot(body) }
}

const syntheticCustody = () => {
  const bundle = reviewBundle()
  const sealed = supplement(bundle)
  return {
    stop: {
      attempt: 1 as const,
      status: "pre_start_integrity_stop" as const,
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID" as const,
      liveEffectBoundaryCrossed: false as const,
      envelopeConsumed: false as const,
      routeStarts: 0 as const,
      preflightObservations: 0 as const,
      calibrationCharged: 0 as const,
      reproductionCharged: 0 as const,
      freshAccepted: 0 as const,
      terminalPresent: false as const,
      complete: false as const,
    },
    pair: {
      pairCommit: PAIR_COMMIT,
      seal: {
        sealRoot: SEAL_ROOT,
        protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
        assuranceClass: "single_operator_local_seal_v1",
        productionAuthorized: false,
        downstreamAuthority: "denied",
      },
      envelope: {
        envelopeRoot: ENVELOPE_ROOT,
        sealRoot: SEAL_ROOT,
        protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
        status: "sealed_inactive",
        counters: sealed.counters,
        policy: {
          maximumRouteStarts: 3,
          maximumPreflightObservations: 12,
          envelopeLifetimeMilliseconds: 14_400_000,
          refusalSpacingMilliseconds: 300_000,
          calibrationFailureBackoffMilliseconds: 900_000,
          calibrationAttemptsPerRoute: 8,
          calibrationShardCount: 4,
          samplingMilliseconds: 200,
          minimumEffectiveAvailableBasisPoints: 2_500,
          maximumReproductionRuns: 1,
          reproductionCellCount: 540,
          assuranceClass: "single_operator_local_seal_v1",
          productionAuthorized: false,
          publicAuthorized: false,
          productAuthorized: false,
          gameplayChangeAuthorized: false,
          phase263PlanningAuthorized: false,
        },
      },
    },
    review: bundle,
    supplement: sealed,
    closure: {
      sourceCommit: SOURCE_COMMIT,
      sourceTree: SOURCE_TREE,
      sourceParent: SOURCE_PARENT,
      executionClosureRoot: EXECUTION_ROOT,
    },
  }
}

describe("Plan 262-107 reviewed live-v8 adapter", () => {
  it("exposes only the three closed successor modes", () => {
    expect(V138_LIVE_V8_MODES).toEqual([
      "--check-reviewed-live-ready",
      "--run-reviewed-bounded-live-envelope",
      "--check-post-run-custody",
    ])
  })

  it("authenticates the exact stopped history, pair, review, supplement, and closure", () => {
    const ready = checkV138LiveV8SyntheticCustodyForReview(syntheticCustody() as never)
    expect(ready).toMatchObject({
      pairCommit: PAIR_COMMIT,
      sealRoot: SEAL_ROOT,
      envelopeRoot: ENVELOPE_ROOT,
      executionClosureRoot: EXECUTION_ROOT,
      freshAccepted: 0,
      downstreamAuthority: "denied",
      producerWouldInvoke: true,
    })
  })

  it.each([
    ["pair", (input: any) => (input.pair.pairCommit = "0".repeat(40))],
    ["stop", (input: any) => {
      input.stop.complete = true
    }],
    ["review", (input: any) => {
      input.review.payload.findingCount = 1
    }],
    ["supplement", (input: any) => {
      input.supplement.createsCapacity = true
    }],
    ["closure", (input: any) => {
      input.closure.executionClosureRoot = `sha256:${"9".repeat(64)}`
    }],
  ])("rejects a %s mutation before reporting producer eligibility", (_name, mutate) => {
    const input = syntheticCustody() as any
    mutate(input)
    expect(() => checkV138LiveV8SyntheticCustodyForReview(input)).toThrow()
  })

  it("keeps the producer-incapable synthetic review byte-neutral", () => {
    const before = canonicalSnapshot()
    const effectsBefore = effectSnapshot()
    expect(checkV138LiveV8SyntheticCustodyForReview(syntheticCustody() as never)).toMatchObject({
      producerWouldInvoke: true,
      liveInvoked: false,
    })
    expect(canonicalSnapshot()).toEqual(before)
    expect(effectSnapshot()).toEqual(effectsBefore)
  })

  it("fails the real readiness path before effects while review and supplement are absent", async () => {
    if (
      existsSync(path.join(repoRoot, V138_LIVE_V8_PATHS.plan108Payload)) ||
      existsSync(path.join(repoRoot, V138_LIVE_V8_PATHS.supplement))
    )
      return
    const before = canonicalSnapshot()
    const effectsBefore = effectSnapshot()
    await expect(
      executeV138LiveV8Cli(["--check-reviewed-live-ready"], {
        repoRoot,
        writeOutput: () => undefined,
      }),
    ).rejects.toThrow()
    expect(canonicalSnapshot()).toEqual(before)
    expect(effectSnapshot()).toEqual(effectsBefore)
  }, 180_000)

  it("contains no source-only filesystem mutation primitive", () => {
    const source = readFileSync(
      path.join(repoRoot, V138_LIVE_V8_PATHS.sourceAdapter),
      "utf8",
    )
    expect(source).not.toMatch(/\b(?:writeFile|appendFile|mkdir|rm|unlink|rename|chmod|chown)Sync\b/u)
    expect(source).toContain("validateInputs: false")
    expect(source).toContain("checkPair: () =>")
    expect(source).toContain("V138_LIVE_V8_POST_RUN_CUSTODY_CHANGED")
  })

  it("does not export a substitutable production custody or effect seam", () => {
    const source = readFileSync(
      path.join(repoRoot, V138_LIVE_V8_PATHS.sourceAdapter),
      "utf8",
    )
    expect(source).not.toContain("export interface V138LiveV8Dependencies")
    expect(source).not.toMatch(
      /authenticateV138ReviewedLiveV8Ready[\s\S]{0,240}Partial<V138LiveV8Dependencies>/u,
    )
    expect(source).not.toMatch(
      /runV138ReviewedBoundedLiveEnvelope[\s\S]{0,240}Partial<V138LiveV8Dependencies>/u,
    )
    expect(source).not.toMatch(/dependencies:\s*Partial<V138LiveV8Dependencies>/u)
    expect(source).toContain("checkV138LiveV8SyntheticCustodyForReview")
    expect(source).toMatch(
      /await runV138V3ProductionLive\(repoRoot,\s*\{[\s\S]*validateInputs:\s*false/u,
    )
  })

  it("rejects dirty working bytes across every named protected branch", () => {
    expect(V138_LIVE_V8_PROTECTED_BRANCHES.map((branch) => branch.plan)).toEqual([
      90, 91, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
    ])
    const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-107-protected-"))
    const clone = path.join(owner, "repo")
    try {
      execFileSync(
        "/usr/bin/git",
        ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", repoRoot, clone],
        { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner } },
      )
      expect(authenticateV138LiveV8ProtectedHistory(clone)).toMatchObject({
        branchCount: 12,
        protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
      })
      for (const branch of V138_LIVE_V8_PROTECTED_BRANCHES) {
        const repoPath = branch.paths[0]!
        const target = path.join(clone, repoPath)
        writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("dirty\n")]))
        expect(
          () => authenticateV138LiveV8ProtectedBranchForReview(clone, branch.plan),
          `Plan ${branch.plan}`,
        ).toThrow(
          "V138_LIVE_V8_PROTECTED_CURRENT_BYTES_INVALID",
        )
        execFileSync("/usr/bin/git", ["checkout", "--", repoPath], { cwd: clone })
      }
    } finally {
      rmSync(owner, { recursive: true, force: true })
    }
  }, 180_000)
})
