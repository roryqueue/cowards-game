import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_PATHS,
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  appendV138RetryV3JournalRecord,
  checkV138InactiveRetryV3Envelope,
  checkV138ProtectedHistoryV3,
  createV138InactiveRetryV3Envelope,
  deriveV138RetryV3State,
  encodeV138RetryV3CanonicalJson,
  requireV138RetryV3DestinationAbsent,
  requireV138RetryV3ReproductionAbsent,
  type V138RetryV3JournalRecord,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  V138_BOUNDED_RETRY_V3_CUSTODY,
  V138_BOUNDED_RETRY_V3_PATHS as CONTROLLER_PATHS,
  V138_BOUNDED_RETRY_V3_PRODUCTION_MODES,
  acquireV138RetryV3OwnerLease,
  executeV138BoundedRetryV3Cli,
  runV138BoundedRetryV3Controller,
  type V138BoundedRetryV3ControllerEffects,
} from "./run-v1-38-bounded-retry-envelope-v3.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const roots: string[] = []

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const envelope = () =>
  createV138InactiveRetryV3Envelope({
    sourceRoot: SHA_A,
    reviewRoot: SHA_B,
    sealRoot: SHA_A,
    protectedHistoryRoot:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedHistoryRoot,
    protectedHistoricalIdentities:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedIdentities,
  })

const append = (
  records: readonly V138RetryV3JournalRecord[],
  atMilliseconds: number,
  event: Parameters<typeof appendV138RetryV3JournalRecord>[1],
) =>
  appendV138RetryV3JournalRecord(
    records,
    event,
    atMilliseconds,
    envelope().envelopeRoot,
  )

describe("bounded retry envelope v3 contract", () => {
  it("owns a fresh finite identity namespace and correction-aware history", () => {
    expect(V138_BOUNDED_RETRY_V3_POLICY).toMatchObject({
      schemaVersion: "retry-envelope:v3",
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 14_400_000,
      refusalSpacingMilliseconds: 300_000,
      calibrationFailureBackoffMilliseconds: 900_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
      rulesAuthority: "MATCH_KERNEL",
    })
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.routes).toEqual([
      "route:v3:0",
      "route:v3:1",
      "route:v3:2",
    ])
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations).toHaveLength(24)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY).toMatchObject({
      preResearchBaselineCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0",
      researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15",
      correctionV10Root:
        "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3",
      dispositionV2Root:
        "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f",
      lifecycleV2Root:
        "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6",
    })
  })

  it.each([
    ["maximumRouteStarts", 4],
    ["maximumPreflightObservations", 13],
    ["envelopeLifetimeMilliseconds", 14_400_001],
    ["refusalSpacingMilliseconds", 299_999],
    ["calibrationFailureBackoffMilliseconds", 899_999],
    ["calibrationAttemptsPerRoute", 9],
    ["calibrationShardCount", 5],
    ["samplingMilliseconds", 201],
    ["minimumEffectiveAvailableBasisPoints", 2_499],
    ["reproductionCellCount", 539],
    ["maximumReproductionRuns", 2],
    ["rulesAuthority", "COPIED_KERNEL"],
    ["supervisedRuntimeOnly", false],
    ["assuranceClass", "independent_custody"],
    ["partialAcceptedEvidenceReusable", true],
    ["phase263PlanningAuthorized", true],
    ["candidateSearchAuthorized", true],
    ["formationMaterializationAuthorized", true],
    ["holdoutOpeningAuthorized", true],
    ["publicAuthorized", true],
    ["productAuthorized", true],
    ["productionAuthorized", true],
    ["gameplayChangeAuthorized", true],
  ] as const)("rejects mutation of frozen policy field %s", (field, value) => {
    const mutated = structuredClone(envelope()) as Record<string, unknown>
    ;(mutated.policy as Record<string, unknown>)[field] = value
    expect(() => checkV138InactiveRetryV3Envelope(mutated)).toThrow(
      "V138_RETRY_ENVELOPE_INVALID",
    )
  })

  it.each([
    ["preResearchBaselineCommit", "0".repeat(40)],
    ["researchCommit", "0".repeat(40)],
    ["correctionV10Root", `sha256:${"0".repeat(64)}`],
    ["dispositionV2Root", `sha256:${"0".repeat(64)}`],
    ["lifecycleV2Root", `sha256:${"0".repeat(64)}`],
    ["authorizationScope", "reclaimed_v2_capacity"],
  ] as const)("rejects protected-history %s mutation", (field, value) => {
    const mutated = structuredClone(
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
    ) as Record<string, unknown>
    mutated[field] = value
    expect(() => checkV138ProtectedHistoryV3(mutated)).toThrow(
      "V138_RETRY_V3_PROTECTED_HISTORY_INVALID",
    )
  })

  it("charges durable reservations, enforces exact threshold and spacing, and never reclaims history", () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
    })
    records = append(records, 1_001, {
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    expect(() =>
      append(records, 301_000, {
        kind: "reserve_preflight",
        identity: "preflight:v3:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_REFUSAL_SPACING_REQUIRED")
    records = append(records, 301_001, {
      kind: "reserve_preflight",
      identity: "preflight:v3:1",
      owner: "owner-a",
    })
    records = append(records, 301_002, {
      kind: "observe_preflight",
      identity: "preflight:v3:1",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_500,
    })
    records = append(records, 301_003, {
      kind: "reserve_route",
      identity: "route:v3:0",
      owner: "owner-a",
      preflightIdentity: "preflight:v3:1",
    })
    records = append(records, 301_004, {
      kind: "reserve_calibration",
      routeIdentity: "route:v3:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.slice(0, 8),
    })
    expect(deriveV138RetryV3State(envelope(), records)).toMatchObject({
      preflightObservationsConsumed: 2,
      routeStartsConsumed: 1,
      calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      disposition: "active",
      downstreamAuthority: false,
    })
    expect(() =>
      append(records, 301_005, {
        kind: "reserve_preflight",
        identity: "preflight:v3:0",
        owner: "owner-b",
      }),
    ).toThrow()
  })

  it("terminalizes the inclusive four-hour boundary and binds canonical roots", () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
    })
    records = append(records, 2_000, {
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    const deadline = 2_000 + V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds
    expect(() => append(records, deadline - 1, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })).toThrow("V138_RETRY_TIME_WINDOW_ACTIVE")
    records = append(records, deadline, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    const state = deriveV138RetryV3State(envelope(), records)
    expect(state).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
      nextPreflightIdentity: null,
      nextRouteIdentity: null,
    })
    expect(encodeV138RetryV3CanonicalJson(state).endsWith("\n")).toBe(true)
    expect(state.stateRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("requires every reserved canonical destination to remain absent", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-absence-"))
    roots.push(root)
    mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
    for (const destination of Object.values(V138_BOUNDED_RETRY_V3_PATHS)) {
      expect(requireV138RetryV3DestinationAbsent(root, destination)).toBe(true)
    }
    expect(requireV138RetryV3ReproductionAbsent(root)).toBe(true)
    writeFileSync(
      path.join(root, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
      "{}\n",
    )
    expect(() => requireV138RetryV3ReproductionAbsent(root)).toThrow(
      "V138_RETRY_REPRODUCTION_ARTIFACT_INVALID",
    )
  })
})

describe("synthetic-only hardened v3 controller", () => {
  it("binds native coherent custody before any future live effect", () => {
    expect(V138_BOUNDED_RETRY_V3_CUSTODY).toMatchObject({
      coherentRequiredLeafAndAbsenceBatch: true,
      exactBoundedLeafReads: true,
      postReadLeafGenerationCheck: true,
      postReadParentGenerationCheck: true,
      retainedRootInodeLock: true,
      gitHooksDisabled: true,
      gitReplacementObjectsDisabled: true,
      installedRuntimeClosureAuthenticated: true,
      executedCheckoutBytesBoundToGitBlobs: true,
      nativePublication: true,
      rulesAuthority: "MATCH_KERNEL",
      liveInvoked: false,
      downstreamAuthority: "denied",
    })
    expect(V138_BOUNDED_RETRY_V3_PRODUCTION_MODES).toContain(
      "--check-source-only",
    )
    expect(CONTROLLER_PATHS).toMatchObject({
      seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
      envelope:
        ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
      reproduction:
        ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
      activation:
        ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
    })
  })

  const effects = (input: {
    preflight: readonly number[]
    start?: number
    calibration?: V138BoundedRetryV3ControllerEffects["runCalibration"]
    reproduction?: V138BoundedRetryV3ControllerEffects["runReproduction"]
  }): V138BoundedRetryV3ControllerEffects => {
    let now = input.start ?? 0
    let observation = 0
    return {
      monotonicMilliseconds: () => now++,
      waitUntil: async (target) => {
        now = target
      },
      observePreflight: async () => ({
        available: true,
        effectiveAvailableBasisPoints: input.preflight[observation++] ?? 0,
      }),
      runCalibration:
        input.calibration ??
        (async () => ({ status: "system_failure", completeCleanup: true })),
      runReproduction:
        input.reproduction ??
        (async () => ({
          status: "system_failure",
          acceptedCells: 0,
          completeCleanup: true,
        })),
      appendDurableRecord: () => undefined,
    }
  }

  it("exhausts twelve synthetic refusals with durable unique reservations", async () => {
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({ preflight: Array.from({ length: 12 }, () => 2_499) }),
    })
    expect(result.state).toMatchObject({
      disposition: "exhausted",
      preflightObservationsConsumed: 12,
      routeStartsConsumed: 0,
      acceptedCells: 0,
      downstreamAuthority: false,
    })
    expect(new Set(result.records.map(({ recordRoot }) => recordRoot)).size).toBe(
      result.records.length,
    )
  })

  it("exhausts three admitted clean calibration failures after exact backoff", async () => {
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({ preflight: [2_500, 2_500, 2_500] }),
    })
    expect(result.state).toMatchObject({
      disposition: "exhausted",
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      completeCleanup: true,
    })
  })

  it("accepts exactly one fresh 540-cell synthetic reproduction but grants no authority", async () => {
    const root = `sha256:${"c".repeat(64)}` as const
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: effects({
        preflight: [2_500],
        calibration: async () => ({
          status: "admitted",
          completeCleanup: true,
          supervisionRoot: root,
        }),
        reproduction: async () => ({
          status: "passed_exact",
          acceptedCells: 540,
          completeCleanup: true,
          reproductionRoot: root,
          artifact: { synthetic: true },
        }),
      }),
    })
    expect(result.state).toMatchObject({
      disposition: "succeeded",
      reproductionIdentitiesCharged: 540,
      acceptedCells: 540,
      completeCleanup: true,
      downstreamAuthority: false,
    })
  })

  it("source-only CLI never derives, publishes, or invokes live work", async () => {
    let forbiddenCalls = 0
    await executeV138BoundedRetryV3Cli(["--check-source-only"], {
      repoRoot: process.cwd(),
      deriveArtifacts: () => {
        forbiddenCalls += 1
        throw new Error("must not derive")
      },
      runLive: async () => {
        forbiddenCalls += 1
      },
      checkOutcome: () => {
        forbiddenCalls += 1
        throw new Error("must not check live outcome")
      },
    })
    expect(forbiddenCalls).toBe(0)
  })

  it("reconciles a durable reservation after crash without rerunning its identity", async () => {
    let records: readonly V138RetryV3JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v3:0",
      owner: "crashed-owner",
    })
    const synthetic = effects({ preflight: [2_500], start: 1_001 })
    const result = await runV138BoundedRetryV3Controller({
      envelope: envelope(),
      owner: "recovery-owner",
      records,
      effects: {
        ...synthetic,
        observePreflight: async () => {
          return { available: true, effectiveAvailableBasisPoints: 2_500 }
        },
      },
    })
    expect(result.records[1]).toMatchObject({
      kind: "observe_preflight",
      identity: "preflight:v3:0",
      effectiveAvailableBasisPoints: 0,
    })
    expect(
      new Set(
        result.records
          .filter(({ kind }) => kind === "reserve_preflight")
          .map(({ identity }) => identity),
      ).size,
    ).toBe(
      result.records.filter(({ kind }) => kind === "reserve_preflight").length,
    )
  })

  it("admits one kernel lock owner and releases ownership after owner death", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v3-lock-"))
    roots.push(root)
    const lock = path.join(root, "owner.lock")
    const owner = await acquireV138RetryV3OwnerLease(lock)
    await expect(acquireV138RetryV3OwnerLease(lock)).rejects.toThrow(
      "V138_RETRY_OWNER_LOCK_ACTIVE",
    )
    process.kill(owner.pid, "SIGKILL")
    await owner.waitForExit()
    const restarted = await acquireV138RetryV3OwnerLease(lock)
    await restarted.release()
  })
})
