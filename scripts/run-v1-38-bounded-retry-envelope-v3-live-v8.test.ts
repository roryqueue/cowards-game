import { describe, expect, it } from "vitest"
import {
  V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
  V138_LIVE_V8_MODES,
  authenticateV138ReviewedLiveV8Ready,
  computeV138LiveV8ReviewPayloadRoot,
  computeV138LiveV8SupplementRoot,
  executeV138LiveV8Cli,
  runV138ReviewedBoundedLiveEnvelope,
  type V138LiveV8Dependencies,
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
const CARRIER_ROOT = `sha256:${"6".repeat(64)}` as const

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
      schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-carrier-v1",
      payloadRoot: payload.payloadRoot,
      reviewRoot: REVIEW_ROOT,
      payloadMode: "100644",
      reviewMode: "100644",
      carrierMode: "100644",
      carrierRoot: CARRIER_ROOT,
      findingCount: 0,
      authorizesExecution: false,
      downstreamAuthority: "denied",
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

const dependencies = () => {
  const calls = { pair: 0, producer: 0, closure: 0 }
  const bundle = reviewBundle()
  const sealed = supplement(bundle)
  const deps: V138LiveV8Dependencies = {
    checkPair: () => {
      calls.pair += 1
      return {
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
      } as never
    },
    authenticatePlan93Stop: () => ({
      attempt: 1,
      status: "pre_start_integrity_stop",
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
      liveEffectBoundaryCrossed: false,
      envelopeConsumed: false,
      routeStarts: 0,
      preflightObservations: 0,
      calibrationCharged: 0,
      reproductionCharged: 0,
      freshAccepted: 0,
      terminalPresent: false,
      complete: false,
    }),
    authenticateReviewBundle: () => bundle,
    authenticateSupplement: () => sealed,
    authenticateExecutionClosure: (_root, expected) => {
      calls.closure += 1
      expect(expected).toEqual({
        sourceCommit: SOURCE_COMMIT,
        checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
        executionClosureRoot: EXECUTION_ROOT,
      })
      return {
        sourceCommit: SOURCE_COMMIT,
        sourceTree: SOURCE_TREE,
        sourceParent: SOURCE_PARENT,
        executionClosureRoot: EXECUTION_ROOT,
      } as never
    },
    assertProtectedHistoryUnchanged: () => undefined,
    assertDestinationsAbsent: () => undefined,
    runProducer: async (_root, options) => {
      calls.producer += 1
      expect(options.validateInputs).toBe(false)
      expect(options.checkPair?.()).toMatchObject({ envelope: { status: "sealed_inactive" } })
    },
  }
  return { calls, deps, bundle, sealed }
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
    const { calls, deps } = dependencies()
    const ready = authenticateV138ReviewedLiveV8Ready("/synthetic", deps)
    expect(ready).toMatchObject({
      pairCommit: PAIR_COMMIT,
      sealRoot: SEAL_ROOT,
      envelopeRoot: ENVELOPE_ROOT,
      executionClosureRoot: EXECUTION_ROOT,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(calls).toMatchObject({ pair: 1, producer: 0, closure: 1 })
  })

  it("calls a synthetic producer exactly once and only after every gate", async () => {
    const { calls, deps } = dependencies()
    await runV138ReviewedBoundedLiveEnvelope("/synthetic", deps)
    expect(calls).toEqual({ pair: 1, producer: 1, closure: 2 })
  })

  it.each([
    ["pair", (deps: V138LiveV8Dependencies) => (deps.checkPair = () => ({ pairCommit: "0".repeat(40) }) as never)],
    ["stop", (deps: V138LiveV8Dependencies) => {
      const prior = deps.authenticatePlan93Stop
      deps.authenticatePlan93Stop = () => ({ ...prior(), complete: true })
    }],
    ["review", (deps: V138LiveV8Dependencies) => {
      const prior = deps.authenticateReviewBundle
      deps.authenticateReviewBundle = () => ({ ...prior(), payload: { ...prior().payload, findingCount: 1 } as never })
    }],
    ["supplement", (deps: V138LiveV8Dependencies) => {
      const prior = deps.authenticateSupplement
      deps.authenticateSupplement = () => ({ ...prior(), createsCapacity: true })
    }],
    ["closure", (deps: V138LiveV8Dependencies) => {
      deps.authenticateExecutionClosure = () => ({
        sourceCommit: SOURCE_COMMIT,
        sourceTree: SOURCE_TREE,
        sourceParent: SOURCE_PARENT,
        executionClosureRoot: `sha256:${"9".repeat(64)}`,
      } as never)
    }],
  ])("rejects a %s mutation before producer invocation", async (_name, mutate) => {
    const { calls, deps } = dependencies()
    mutate(deps)
    await expect(runV138ReviewedBoundedLiveEnvelope("/synthetic", deps)).rejects.toThrow()
    expect(calls.producer).toBe(0)
  })

  it("fails closed when custody changes after the synthetic effect", async () => {
    const { calls, deps } = dependencies()
    let closureCall = 0
    deps.authenticateExecutionClosure = () => ({
      sourceCommit: SOURCE_COMMIT,
      sourceTree: SOURCE_TREE,
      sourceParent: SOURCE_PARENT,
      executionClosureRoot:
        ++closureCall === 1 ? EXECUTION_ROOT : `sha256:${"9".repeat(64)}`,
    } as never)
    await expect(runV138ReviewedBoundedLiveEnvelope("/synthetic", deps)).rejects.toThrow(
      "V138_LIVE_V8_POST_RUN_CUSTODY_CHANGED",
    )
    expect(calls.producer).toBe(1)
  })

  it("keeps CLI dependency injection behind the same closed gates", async () => {
    const { calls, deps } = dependencies()
    const output: string[] = []
    await executeV138LiveV8Cli(["--check-reviewed-live-ready"], {
      repoRoot: "/synthetic",
      dependencies: deps,
      writeOutput: (value) => output.push(value),
    })
    expect(JSON.parse(output.join(""))).toMatchObject({
      status: "reviewed_live_ready",
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
    expect(calls.producer).toBe(0)
  })
})
