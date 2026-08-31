import { describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V4_IDENTITIES,
  V138_BOUNDED_RETRY_V4_PATHS,
  V138_BOUNDED_RETRY_V4_POLICY,
  appendV138RetryV4JournalRecord,
  checkV138InactiveRetryV4Envelope,
  createV138InactiveRetryV4Envelope,
  deriveV138RetryV4State,
  encodeV138RetryV4CanonicalJson,
} from "./v1-38-bounded-retry-envelope-v4.js"

const SHA = `sha256:${"a".repeat(64)}` as const
const envelope = () => createV138InactiveRetryV4Envelope({
  sourceRoot: SHA,
  reviewRoot: `sha256:${"b".repeat(64)}`,
  sealRoot: `sha256:${"c".repeat(64)}`,
  protectedHistoryRoot: `sha256:${"d".repeat(64)}`,
  protectedHistoricalIdentities: [],
})

describe("bounded retry envelope v4 frozen model", () => {
  it("retains every scientific and resource bound under fresh identities", () => {
    expect(V138_BOUNDED_RETRY_V4_POLICY).toMatchObject({
      schemaVersion: "retry-envelope:v4", maximumRouteStarts: 3,
      maximumPreflightObservations: 12, envelopeLifetimeMilliseconds: 14_400_000,
      refusalSpacingMilliseconds: 300_000, calibrationFailureBackoffMilliseconds: 900_000,
      calibrationAttemptsPerRoute: 8, calibrationShardCount: 4, samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2500, reproductionCellCount: 540,
      maximumReproductionRuns: 1, assuranceClass: "single_operator_local_seal_v1",
      publicAuthorized: false, productionAuthorized: false,
    })
    expect(V138_BOUNDED_RETRY_V4_IDENTITIES.routes).toEqual(["route:v4:0", "route:v4:1", "route:v4:2"])
    expect(V138_BOUNDED_RETRY_V4_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_V4_IDENTITIES.calibrations).toHaveLength(24)
    expect(V138_BOUNDED_RETRY_V4_IDENTITIES.reproduction).toHaveLength(540)
    expect(new Set(Object.values(V138_BOUNDED_RETRY_V4_IDENTITIES).flat()).size).toBe(579)
  })
  it("uses only the fresh journal/private/terminal/reproduction-v18 and Route12 destinations", () => {
    expect(V138_BOUNDED_RETRY_V4_PATHS).toMatchObject({
      journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl",
      lock: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl.lock",
      privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v4",
      terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json",
      reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json",
      seal: ".planning/artifacts/v1.38-successor-source-seal-v14.json",
      envelope: ".planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json",
      correction: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v12.json",
      activation: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
    })
    expect(encodeV138RetryV4CanonicalJson(V138_BOUNDED_RETRY_V4_PATHS)).not.toContain("journal-v3")
  })
  it("round-trips an inactive envelope and rejects extension fields", () => {
    const value = envelope()
    expect(checkV138InactiveRetryV4Envelope(value)).toEqual(value)
    expect(() => checkV138InactiveRetryV4Envelope({ ...value, extension: false })).toThrow()
  })
  it("charges an observation before later work and preserves cumulative counters", () => {
    const value = envelope()
    let records = appendV138RetryV4JournalRecord([], { kind: "reserve_preflight", identity: "preflight:v4:0", owner: "fixture" }, 0, value.envelopeRoot)
    records = appendV138RetryV4JournalRecord(records, { kind: "observe_preflight", identity: "preflight:v4:0",
      owner: "fixture", effectiveAvailableBasisPoints: 2499 }, 1, value.envelopeRoot)
    const state = deriveV138RetryV4State(value, records)
    expect(state).toMatchObject({ routeStartsConsumed: 0, preflightObservationsConsumed: 1, calibrationIdentitiesCharged: 0,
      reproductionIdentitiesCharged: 0, acceptedCells: 0, disposition: "active" })
  })
  it("does not mutate canonical input and returns deeply frozen contracts", () => {
    const value = envelope(), before = encodeV138RetryV4CanonicalJson(value)
    expect(Object.isFrozen(value)).toBe(true)
    expect(() => (value as any).authorizesExecution = true).toThrow()
    expect(encodeV138RetryV4CanonicalJson(value)).toBe(before)
  })
})
