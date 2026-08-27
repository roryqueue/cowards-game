import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { createHash } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V2_IDENTITIES,
  V138_BOUNDED_RETRY_V2_POLICY,
  V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY,
  appendV138RetryV2JournalRecord,
  checkV138InactiveRetryV2Envelope,
  checkV138ProtectedHistoryV2,
  createV138InactiveRetryV2Envelope,
  deriveV138RetryV2State,
  encodeV138RetryV2CanonicalJson,
  requireV138RetryV2DestinationAbsent,
  requireV138RetryV2ReproductionAbsent,
  V138_BOUNDED_RETRY_V2_PATHS,
  type V138RetryV2JournalRecord,
} from "./lib/v1-38-bounded-retry-envelope-v2.js"
import {
  V138_BOUNDED_RETRY_V2_PATHS as CONTROLLER_PATHS,
  acquireV138RetryV2OwnerLease,
  executeV138BoundedRetryV2Cli,
  publishV138RetryV2Outcome,
  runV138BoundedRetryV2Controller,
  runV138V2ProductionLive,
  type V138BoundedRetryV2ControllerEffects,
} from "./run-v1-38-bounded-retry-envelope-v2.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const envelope = () =>
  createV138InactiveRetryV2Envelope({
    sourceRoot: SHA_A,
    reviewRoot: SHA_B,
    sealRoot: SHA_A,
    protectedHistoryRoot: SHA_B,
    protectedHistoricalIdentities: [
      "preflight:v5:0",
      "calibration:v9:attempt:0",
      "reproduction:v12:cell:0",
      "route:v8",
    ],
  })

const append = (
  records: readonly V138RetryV2JournalRecord[],
  atMilliseconds: number,
  event: Parameters<typeof appendV138RetryV2JournalRecord>[1],
) =>
  appendV138RetryV2JournalRecord(
    records,
    event,
    atMilliseconds,
    envelope().envelopeRoot,
  )

describe("correction-aware protected history", () => {
  it("binds the exact separate source-base and authorization joins plus all v1 charges", () => {
    expect(V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY).toMatchObject({
      schemaVersion: "v1.38-bounded-retry-protected-history-v2",
      sourceBase: {
        commit: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
        tree: "98e633df3870c944adaa9c5dc553a6df367da354",
      },
      authorization: {
        commit: "453a33a10c247fb9c75e969ed4ab63646b16b488",
        tree: "32626e7f24b7262e461cb1e12c3efb691dbb5739",
        soleParent: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
      },
      correction: {
        root: "sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026",
        status: "integrity_non_pass",
        integrityPassed: false,
        historicalBytesMutated: false,
      },
      historical: {
        envelopeRoot: "sha256:229c1c3e33ee055448b4b8ac7dc2bb53efd84774416d51d984044b2a7f35f153",
        journalSha256: "sha256:14e66af5c9fc985ef01cbc83efae35ea2a1ae20f1c9b10de0cd2e732dd667a14",
        terminalSha256: "sha256:b79dc330212880f8e6b9d41bee701b380fbc92f2e82682159343e54ae8748ac3",
        receiptManifestRoot: "sha256:cbafd7aaedef7b8f8c9d596a79c914482df40300fc0142e912db2754fe39a4b7",
        sealRoot: "sha256:d5dc18c14d004f3bff8459974229b9af49b2e2a83732ead116cf84450fb46e63",
        dispositionRoot: "sha256:5fe2dbf967971c6d69d619e91e8d838f5e6495ded3cc23889cf98f0b42dcccdf",
        lifecycleRoot: "sha256:3b13e8656208643f4ce339bdab2f29bf56e38b00938afd49cfbc88164595a8b0",
        routeStartsCharged: 3,
        preflightObservationsCharged: 3,
        calibrationIdentitiesCharged: 24,
        reproductionIdentitiesCharged: 0,
        freshAccepted: 0,
      },
    })
    expect(V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities).toEqual(
      expect.arrayContaining([
        "retry-envelope:v1",
        "route:v1:0",
        "route:v1:2",
        "preflight:v1:0",
        "preflight:v1:2",
        "calibration:v1:0:0",
        "calibration:v1:2:7",
      ]),
    )
    expect(checkV138ProtectedHistoryV2(V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY)).toBe(
      V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY,
    )
  })

  it.each([
    ["source base commit", ["sourceBase", "commit"], "0".repeat(40)],
    ["source base tree", ["sourceBase", "tree"], "0".repeat(40)],
    ["authorization commit", ["authorization", "commit"], "0".repeat(40)],
    ["authorization tree", ["authorization", "tree"], "0".repeat(40)],
    ["authorization sole parent", ["authorization", "soleParent"], "0".repeat(40)],
    ["correction root", ["correction", "root"], `sha256:${"0".repeat(64)}`],
    ["correction status", ["correction", "status"], "pass"],
    ["correction integrity", ["correction", "integrityPassed"], true],
    ["historical byte custody", ["correction", "historicalBytesMutated"], true],
    ["envelope root", ["historical", "envelopeRoot"], `sha256:${"0".repeat(64)}`],
    ["journal digest", ["historical", "journalSha256"], `sha256:${"0".repeat(64)}`],
    ["terminal digest", ["historical", "terminalSha256"], `sha256:${"0".repeat(64)}`],
    ["receipt manifest", ["historical", "receiptManifestRoot"], `sha256:${"0".repeat(64)}`],
    ["seal root", ["historical", "sealRoot"], `sha256:${"0".repeat(64)}`],
    ["disposition root", ["historical", "dispositionRoot"], `sha256:${"0".repeat(64)}`],
    ["lifecycle root", ["historical", "lifecycleRoot"], `sha256:${"0".repeat(64)}`],
    ["route charges", ["historical", "routeStartsCharged"], 2],
    ["preflight charges", ["historical", "preflightObservationsCharged"], 2],
    ["calibration charges", ["historical", "calibrationIdentitiesCharged"], 23],
    ["reproduction charges", ["historical", "reproductionIdentitiesCharged"], 1],
    ["accepted history", ["historical", "freshAccepted"], 1],
  ] as const)("fails closed on %s mutation", (_label, keys, replacement) => {
    const mutated = structuredClone(V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY) as Record<
      string,
      unknown
    >
    const parent = mutated[keys[0]] as Record<string, unknown>
    parent[keys[1]] = replacement
    expect(() => checkV138ProtectedHistoryV2(mutated)).toThrow(
      "V138_RETRY_V2_PROTECTED_HISTORY_INVALID",
    )
  })

  it("fails closed when a charged historical identity is removed, duplicated, or relabeled v2", () => {
    for (const identities of [
      V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities.slice(1),
      [
        ...V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities,
        V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities[0]!,
      ],
      V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY.protectedIdentities.map((value, index) =>
        index === 0 ? "retry-envelope:v2" : value,
      ),
    ]) {
      expect(() =>
        checkV138ProtectedHistoryV2({
          ...V138_BOUNDED_RETRY_V2_PROTECTED_HISTORY,
          protectedIdentities: identities,
        }),
      ).toThrow("V138_RETRY_V2_PROTECTED_HISTORY_INVALID")
    }
  })
})

describe("ancestor-contained no-follow absence", () => {
  it("accepts only a contained missing final component", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-v2-contained-"))
    temporaryRoots.push(root)
    mkdirSync(path.join(root, "safe", "parent"), { recursive: true })
    expect(
      requireV138RetryV2DestinationAbsent(root, "safe/parent/missing.json"),
    ).toBe(true)
  })

  it.each(["parent-symlink", "dangling-leaf", "preexisting", "traversal"] as const)(
    "fails closed for %s",
    (kind) => {
      const root = mkdtempSync(path.join(tmpdir(), "v138-v2-unsafe-"))
      temporaryRoots.push(root)
      const outside = mkdtempSync(path.join(tmpdir(), "v138-v2-outside-"))
      temporaryRoots.push(outside)
      let target = "safe/parent/evidence.json"
      mkdirSync(path.join(root, "safe"), { recursive: true })
      if (kind === "parent-symlink") {
        symlinkSync(outside, path.join(root, "safe", "parent"))
      } else {
        mkdirSync(path.join(root, "safe", "parent"))
      }
      if (kind === "dangling-leaf") {
        symlinkSync(path.join(outside, "absent.json"), path.join(root, target))
      }
      if (kind === "preexisting") writeFileSync(path.join(root, target), "{}\n")
      if (kind === "traversal") target = "../escaped.json"
      expect(() => requireV138RetryV2DestinationAbsent(root, target)).toThrow(
        "V138_RETRY_V2_DESTINATION_UNSAFE",
      )
    },
  )
})

describe("published correction reproduction absence", () => {
  it("accepts only a missing reproduction path", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-correction-absence-"))
    temporaryRoots.push(root)
    mkdirSync(
      path.dirname(path.resolve(root, V138_BOUNDED_RETRY_V2_PATHS.reproduction)),
      { recursive: true },
    )
    expect(requireV138RetryV2ReproductionAbsent(root)).toBe(true)
  })

  it.each(["regular", "symlink", "directory"] as const)(
    "rejects a %s reproduction path",
    (kind) => {
      const root = mkdtempSync(path.join(tmpdir(), "v138-correction-inject-"))
      temporaryRoots.push(root)
      const target = path.resolve(root, V138_BOUNDED_RETRY_V2_PATHS.reproduction)
      mkdirSync(path.dirname(target), { recursive: true })
      if (kind === "regular") writeFileSync(target, "{}\n")
      if (kind === "directory") mkdirSync(target)
      if (kind === "symlink") {
        const linkTarget = path.join(root, "injected-reproduction.json")
        writeFileSync(linkTarget, "{}\n")
        symlinkSync(linkTarget, target)
      }
      expect(() => requireV138RetryV2ReproductionAbsent(root)).toThrow(
        "V138_RETRY_REPRODUCTION_ARTIFACT_INVALID",
      )
    },
  )
})

describe("retry-envelope:v2 finite state and cumulative journal", () => {
  it("freezes the exact identities and policy bounds", () => {
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.routes).toEqual([
      "route:v2:0",
      "route:v2:1",
      "route:v2:2",
    ])
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.preflights.at(-1)).toBe(
      "preflight:v2:11",
    )
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations).toHaveLength(24)
    expect(
      V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.filter((id) =>
        id.startsWith("calibration:v2:2:"),
      ),
    ).toHaveLength(8)
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction.at(-1)).toBe(
      "reproduction:v2:539",
    )
    expect(V138_BOUNDED_RETRY_V2_POLICY).toMatchObject({
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000,
      refusalSpacingMilliseconds: 5 * 60 * 1_000,
      calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
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
    expect(() => checkV138InactiveRetryV2Envelope(mutated)).toThrow(
      "V138_RETRY_ENVELOPE_INVALID",
    )
  })

  it.each(["routes", "preflights", "calibrations", "reproduction"] as const)(
    "keeps %s identity inventory immutable and complete",
    (field) => {
      expect(Object.isFrozen(V138_BOUNDED_RETRY_V2_IDENTITIES[field])).toBe(true)
      const identities = V138_BOUNDED_RETRY_V2_IDENTITIES[field]
      expect(new Set(identities).size).toBe(identities.length)
      expect(
        identities.every((identity) => !identity.includes(":v1:")),
      ).toBe(true)
    },
  )

  it("derives counters only from a previous-root-linked journal and charges reservations across crashes", () => {
    let records: readonly V138RetryV2JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
    })
    records = append(records, 1_001, {
      kind: "observe_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    records = append(records, 301_001, {
      kind: "reserve_preflight",
      identity: "preflight:v2:1",
      owner: "owner-a",
    })
    records = append(records, 301_002, {
      kind: "observe_preflight",
      identity: "preflight:v2:1",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_500,
    })
    records = append(records, 301_003, {
      kind: "reserve_route",
      identity: "route:v2:0",
      owner: "owner-a",
      preflightIdentity: "preflight:v2:1",
    })
    records = append(records, 301_004, {
      kind: "reserve_calibration",
      routeIdentity: "route:v2:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(0, 8),
    })

    const state = deriveV138RetryV2State(envelope(), records)
    expect(state).toMatchObject({
      preflightObservationsConsumed: 2,
      routeStartsConsumed: 1,
      calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      disposition: "active",
    })
    expect(state.nextPreflightIdentity).toBe("preflight:v2:2")
    expect(state.nextRouteIdentity).toBe("route:v2:1")
    expect(state.protectedHistoricalIdentityCount).toBe(4)
  })

  it("fails closed for duplicate or concurrent ownership, stale roots, mutation, over-bound time and early waits", () => {
    let records: readonly V138RetryV2JournalRecord[] = []
    records = append(records, 10, {
      kind: "reserve_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
    })
    expect(() =>
      append(records, 11, {
        kind: "reserve_preflight",
        identity: "preflight:v2:0",
        owner: "owner-b",
      }),
    ).toThrow("V138_RETRY_IDENTITY_ALREADY_CHARGED")
    records = append(records, 12, {
      kind: "observe_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    expect(() =>
      append(records, 12 + 5 * 60_000 - 1, {
        kind: "reserve_preflight",
        identity: "preflight:v2:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_REFUSAL_SPACING_REQUIRED")

    const mutated = records.map((record, index) =>
      index === 0 ? { ...record, owner: "mutated" } : record,
    )
    expect(() => deriveV138RetryV2State(envelope(), mutated)).toThrow(
      "V138_RETRY_JOURNAL_CHAIN_INVALID",
    )
    const changedEnvelope = createV138InactiveRetryV2Envelope({
      sourceRoot: SHA_B,
      reviewRoot: SHA_B,
      sealRoot: SHA_A,
      protectedHistoryRoot: SHA_B,
      protectedHistoricalIdentities: ["historical:changed"],
    })
    expect(() => deriveV138RetryV2State(changedEnvelope, records)).toThrow(
      "V138_RETRY_JOURNAL_CHAIN_INVALID",
    )
    expect(() =>
      append(records, 12 + 4 * 60 * 60_000 + 1, {
        kind: "reserve_preflight",
        identity: "preflight:v2:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_EXPIRED")
  })

  it("records inclusive time-window expiry once as an immutable exhausted journal fact", () => {
    let records: readonly V138RetryV2JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
    })
    records = append(records, 2_000, {
      kind: "observe_preflight",
      identity: "preflight:v2:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    const deadline =
      2_000 + V138_BOUNDED_RETRY_V2_POLICY.envelopeLifetimeMilliseconds

    expect(() =>
      append(records, deadline - 1, {
        kind: "time_window_expired",
        owner: "owner-a",
        reason: "time_window_expired",
      }),
    ).toThrow("V138_RETRY_TIME_WINDOW_ACTIVE")
    expect(() =>
      append(records, deadline, {
        kind: "reserve_preflight",
        identity: "preflight:v2:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_EXPIRED")

    const exactBoundary = append(records, deadline, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    expect(exactBoundary.at(-1)).toMatchObject({
      kind: "time_window_expired",
      reason: "time_window_expired",
      previousRoot: records.at(-1)?.recordRoot,
    })
    expect(deriveV138RetryV2State(envelope(), exactBoundary)).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
      remainingPreflightObservations: 0,
      remainingRouteStarts: 0,
      nextPreflightIdentity: null,
      nextRouteIdentity: null,
    })
    expect(() =>
      append(exactBoundary, deadline + 1, {
        kind: "time_window_expired",
        owner: "owner-a",
        reason: "time_window_expired",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")
    expect(() =>
      append(exactBoundary, deadline + 1, {
        kind: "reserve_preflight",
        identity: "preflight:v2:1",
        owner: "owner-b",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")

    const postBoundary = append(records, deadline + 1, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    expect(deriveV138RetryV2State(envelope(), postBoundary).stateRoot).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
  })

  it("closes on first exact success and makes every non-540 reproduction terminal", () => {
    const makeReproduction = (acceptedCells: number) => {
      let records: readonly V138RetryV2JournalRecord[] = []
      records = append(records, 0, {
        kind: "reserve_preflight",
        identity: "preflight:v2:0",
        owner: "owner-a",
      })
      records = append(records, 1, {
        kind: "observe_preflight",
        identity: "preflight:v2:0",
        owner: "owner-a",
        effectiveAvailableBasisPoints: 2_500,
      })
      records = append(records, 2, {
        kind: "reserve_route",
        identity: "route:v2:0",
        owner: "owner-a",
        preflightIdentity: "preflight:v2:0",
      })
      records = append(records, 3, {
        kind: "reserve_calibration",
        routeIdentity: "route:v2:0",
        owner: "owner-a",
        identities: V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(0, 8),
      })
      records = append(records, 4, {
        kind: "finish_calibration",
        routeIdentity: "route:v2:0",
        owner: "owner-a",
        status: "admitted",
        completeCleanup: true,
      })
      records = append(records, 5, {
        kind: "reserve_reproduction",
        routeIdentity: "route:v2:0",
        owner: "owner-a",
        identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
      })
      records = append(records, 6, {
        kind: "finish_reproduction",
        routeIdentity: "route:v2:0",
        owner: "owner-a",
        acceptedCells,
        completeCleanup: true,
        status: acceptedCells === 540 ? "passed_exact" : "system_failure",
      })
      return records
    }

    expect(
      deriveV138RetryV2State(envelope(), makeReproduction(540)).disposition,
    ).toBe("succeeded")
    expect(
      deriveV138RetryV2State(envelope(), makeReproduction(539)),
    ).toMatchObject({
      disposition: "terminal_failure",
      acceptedCells: 0,
      reproductionIdentitiesCharged: 540,
    })
    expect(() =>
      append(makeReproduction(540), 7, {
        kind: "reserve_preflight",
        identity: "preflight:v2:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")
  })

  it("requires fifteen-minute backoff after process-valid calibration failure and exhausts at three starts", () => {
    let records: readonly V138RetryV2JournalRecord[] = []
    for (let route = 0; route < 3; route += 1) {
      const base = route * (15 * 60_000 + 10)
      records = append(records, base, {
        kind: "reserve_preflight",
        identity: `preflight:v2:${route}` as never,
        owner: "owner-a",
      })
      records = append(records, base + 1, {
        kind: "observe_preflight",
        identity: `preflight:v2:${route}` as never,
        owner: "owner-a",
        effectiveAvailableBasisPoints: 2_500,
      })
      records = append(records, base + 2, {
        kind: "reserve_route",
        identity: `route:v2:${route}` as never,
        owner: "owner-a",
        preflightIdentity: `preflight:v2:${route}` as never,
      })
      const calibration = V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(
        route * 8,
        route * 8 + 8,
      )
      records = append(records, base + 3, {
        kind: "reserve_calibration",
        routeIdentity: `route:v2:${route}` as never,
        owner: "owner-a",
        identities: calibration,
      })
      records = append(records, base + 4, {
        kind: "finish_calibration",
        routeIdentity: `route:v2:${route}` as never,
        owner: "owner-a",
        status: "system_failure",
        completeCleanup: true,
      })
      if (route === 0) {
        expect(() =>
          append(records, base + 4 + 15 * 60_000 - 1, {
            kind: "reserve_preflight",
            identity: "preflight:v2:1",
            owner: "owner-a",
          }),
        ).toThrow("V138_RETRY_CALIBRATION_BACKOFF_REQUIRED")
      }
    }
    expect(deriveV138RetryV2State(envelope(), records).disposition).toBe(
      "exhausted",
    )
  })

  it("never treats protected D-24R history as successor capacity", () => {
    const state = deriveV138RetryV2State(envelope(), [])
    expect(state.remainingRouteStarts).toBe(3)
    expect(state.remainingPreflightObservations).toBe(12)
    expect(state.protectedHistoricalIdentityCount).toBe(4)
    expect(() =>
      append([], 0, {
        kind: "reserve_preflight",
        identity: "preflight:v5:0" as never,
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_IDENTITY_INVALID")
  })

  it("uses only temporary paths in synthetic fixtures", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-"))
    temporaryRoots.push(root)
    expect(root.startsWith(tmpdir())).toBe(true)
  })
})

describe("bounded retry v2 controller and crash-safe custody", () => {
  const fakeEffects = (input: {
    observations: number[]
    calibrations: Array<"admitted" | "system_failure">
    reproduction?: {
      status: "passed_exact" | "system_failure"
      acceptedCells: number
      completeCleanup: boolean
    }
    start?: number
  }) => {
    let now = input.start ?? 1_000
    const durable: V138RetryV2JournalRecord[] = []
    let reproductionRuns = 0
    const effects: V138BoundedRetryV2ControllerEffects = {
      monotonicMilliseconds: () => now,
      waitUntil: async (target) => {
        now = target
      },
      observePreflight: async () => ({
        available: true,
        effectiveAvailableBasisPoints: input.observations.shift() ?? 0,
      }),
      runCalibration: async () => ({
        status: input.calibrations.shift() ?? "system_failure",
        completeCleanup: true,
        supervisionRoot: SHA_A,
      }),
      runReproduction: async () => {
        reproductionRuns += 1
        const result = input.reproduction ?? {
          status: "passed_exact" as const,
          acceptedCells: 540,
          completeCleanup: true,
        }
        const artifact = {
          schemaVersion: "v1.38-current-matrix-reproduction-v16",
          status: result.status,
          acceptedCellCount: result.acceptedCells,
          uniqueExpectedCellCount: result.acceptedCells,
          completeCleanup: result.completeCleanup,
          receiptRoot: SHA_B,
          downstreamAuthority: "denied",
        }
        return { ...result, reproductionRoot: SHA_B, artifact }
      },
      appendDurableRecord: (record) => {
        durable.push(record)
      },
    }
    return { effects, durable, reproductionRuns: () => reproductionRuns }
  }

  it("keeps refused, admitted, failed-calibration, exact-540, and partial branches finite", async () => {
    const refused = fakeEffects({
      observations: Array.from({ length: 12 }, () => 2_499),
      calibrations: [],
    })
    const refusedResult = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: [],
      effects: refused.effects,
    })
    expect(refusedResult.state).toMatchObject({
      disposition: "exhausted",
      preflightObservationsConsumed: 12,
      routeStartsConsumed: 0,
      acceptedCells: 0,
    })

    const failed = fakeEffects({
      observations: [2_500, 2_500, 2_500],
      calibrations: ["system_failure", "system_failure", "system_failure"],
    })
    const failedResult = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: [],
      effects: failed.effects,
    })
    expect(failedResult.state).toMatchObject({
      disposition: "exhausted",
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      acceptedCells: 0,
    })

    const passed = fakeEffects({ observations: [2_500], calibrations: ["admitted"] })
    const passedResult = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: [],
      effects: passed.effects,
    })
    expect(passedResult.state).toMatchObject({
      disposition: "succeeded",
      reproductionIdentitiesCharged: 540,
      acceptedCells: 540,
      downstreamAuthority: false,
    })
    expect(passed.reproductionRuns()).toBe(1)

    const partial = fakeEffects({
      observations: [2_500],
      calibrations: ["admitted"],
      reproduction: {
        status: "system_failure",
        acceptedCells: 539,
        completeCleanup: true,
      },
    })
    const partialResult = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: [],
      effects: partial.effects,
    })
    expect(partialResult.state).toMatchObject({
      disposition: "terminal_failure",
      reproductionIdentitiesCharged: 540,
      acceptedCells: 0,
    })
  })

  it("makes cleanup uncertainty terminal and never reuses a reserved identity on restart", async () => {
    let records: readonly V138RetryV2JournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v2:0",
      owner: "owner",
    })
    const restarted = fakeEffects({ observations: [2_500], calibrations: ["admitted"] })
    const result = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records,
      effects: restarted.effects,
    })
    expect(result.records.filter(({ identity }) => identity === "preflight:v2:0")).toHaveLength(2)
    expect(result.records[1]).toMatchObject({
      kind: "observe_preflight",
      identity: "preflight:v2:0",
      effectiveAvailableBasisPoints: 0,
    })
    expect(result.state.nextPreflightIdentity).toBeNull()
    const reservations = result.records.filter(
      (record) => record.kind === "reserve_preflight",
    )
    expect(new Set(reservations.map(({ identity }) => identity)).size).toBe(
      reservations.length,
    )

    let cleanupRecords: readonly V138RetryV2JournalRecord[] = []
    cleanupRecords = append(cleanupRecords, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v2:0",
      owner: "owner",
    })
    cleanupRecords = append(cleanupRecords, 1_001, {
      kind: "observe_preflight",
      identity: "preflight:v2:0",
      owner: "owner",
      effectiveAvailableBasisPoints: 2_500,
    })
    cleanupRecords = append(cleanupRecords, 1_002, {
      kind: "reserve_route",
      identity: "route:v2:0",
      preflightIdentity: "preflight:v2:0",
      owner: "owner",
    })
    cleanupRecords = append(cleanupRecords, 1_003, {
      kind: "reserve_calibration",
      routeIdentity: "route:v2:0",
      owner: "owner",
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(0, 8),
    })
    const cleanup = fakeEffects({ observations: [], calibrations: [], start: 1_004 })
    const cleanupResult = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: cleanupRecords,
      effects: cleanup.effects,
    })
    expect(cleanupResult.state).toMatchObject({
      disposition: "terminal_failure",
      completeCleanup: false,
      remainingRouteStarts: 0,
    })
  })

  it("publishes reproduction before terminal and recovers each publication boundary idempotently", async () => {
    const passed = fakeEffects({ observations: [2_500], calibrations: ["admitted"] })
    const result = await runV138BoundedRetryV2Controller({
      envelope: envelope(),
      owner: "owner",
      records: [],
      effects: passed.effects,
    })
    for (const boundary of [
      "afterReproductionWrite",
      "afterReproductionParentFsync",
      "afterTerminalWrite",
      "afterTerminalParentFsync",
    ] as const) {
      const root = mkdtempSync(path.join(tmpdir(), `v138-v2-${boundary}-`))
      temporaryRoots.push(root)
      const reproductionTarget = path.join(root, "reproduction.json")
      const terminalTarget = path.join(root, "terminal.json")
      expect(() =>
        publishV138RetryV2Outcome({
          reproductionTarget,
          terminalTarget,
          result,
          hooks: { [boundary]: () => { throw new Error("crash") } },
        }),
      ).toThrow("crash")
      publishV138RetryV2Outcome({ reproductionTarget, terminalTarget, result })
      expect(JSON.parse(readFileSync(reproductionTarget, "utf8"))).toMatchObject({
        acceptedCellCount: 540,
        downstreamAuthority: "denied",
      })
      expect(JSON.parse(readFileSync(terminalTarget, "utf8"))).toMatchObject({
        disposition: "succeeded",
        productionAuthorized: false,
        downstreamAuthority: "denied",
      })
      expect(passed.reproductionRuns()).toBe(1)
    }
  })

  it("admits exactly one lock owner and kernel death releases ownership", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v2-lock-"))
    temporaryRoots.push(root)
    const lock = path.join(root, "owner.lock")
    const owner = await acquireV138RetryV2OwnerLease(lock)
    await expect(acquireV138RetryV2OwnerLease(lock)).rejects.toThrow(
      "V138_RETRY_OWNER_LOCK_ACTIVE",
    )
    process.kill(owner.pid, "SIGKILL")
    await owner.waitForExit()
    const restarted = await acquireV138RetryV2OwnerLease(lock)
    await restarted.release()
  })

  it.each([
    "lock_acquired",
    "journal_fsync",
    "receipt_fsync",
    "reproduction_write",
    "reproduction_fsync",
    "terminal_write",
    "terminal_fsync",
  ] as const)(
    "recovers a real SIGKILL at %s with one chain and no reserved identity reuse",
    async (stage) => {
      if (process.platform !== "darwin") return
      const root = mkdtempSync(path.join(tmpdir(), `v138-v2-process-${stage}-`))
      temporaryRoots.push(root)
      mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
      const moduleUrl = pathToFileURL(
        path.resolve("scripts/run-v1-38-bounded-retry-envelope-v2.ts"),
      ).href
      const childPath = path.join(root, "crash-child.mts")
      writeFileSync(
        childPath,
        `
          import { runV138V2ProductionLive } from ${JSON.stringify(moduleUrl)};
          const envelope = ${JSON.stringify(envelope())};
          const SHA_B = ${JSON.stringify(SHA_B)};
          const root = ${JSON.stringify(root)};
          const stage = ${JSON.stringify(stage)};
          let now = 1_000;
          await runV138V2ProductionLive(root, {
            checkPair: () => ({ seal: {}, envelope }),
            validateInputs: false,
            createEffects: (appendDurableRecord) => ({
              monotonicMilliseconds: () => now,
              waitUntil: async (target) => { now = target; },
              observePreflight: async () => ({ available: true, effectiveAvailableBasisPoints: 2_500 }),
              runCalibration: async () => ({ status: "admitted", completeCleanup: true }),
              runReproduction: async () => ({
                status: "passed_exact",
                acceptedCells: 540,
                completeCleanup: true,
                reproductionRoot: SHA_B,
                artifact: {
                  schemaVersion: "v1.38-current-matrix-reproduction-v16",
                  status: "passed_exact",
                  acceptedCellCount: 540,
                  uniqueExpectedCellCount: 540,
                  completeCleanup: true,
                  receiptRoot: SHA_B,
                  downstreamAuthority: "denied"
                }
              }),
              appendDurableRecord
            }),
            crashBoundary: (seen) => {
              if (seen === stage) process.kill(process.pid, "SIGKILL");
            }
          });
        `,
      )
      const killed = spawnSync(
        process.execPath,
        ["--import", "tsx", childPath],
        { cwd: process.cwd(), encoding: "utf8", timeout: 25_000 },
      )
      expect(
        killed.signal === "SIGKILL" || killed.status === 137,
        `${killed.stderr}\n${killed.stdout}`,
      ).toBe(true)

      let now = 1_000
      let reproductionLaunches = 0
      await runV138V2ProductionLive(root, {
        checkPair: () => ({ seal: {} as never, envelope: envelope() }),
        validateInputs: false,
        createEffects: (appendDurableRecord) => ({
          monotonicMilliseconds: () => now,
          waitUntil: async (target) => {
            now = target
          },
          observePreflight: async () => ({
            available: true,
            effectiveAvailableBasisPoints: 2_500,
          }),
          runCalibration: async () => ({
            status: "admitted",
            completeCleanup: true,
          }),
          runReproduction: async () => {
            reproductionLaunches += 1
            return {
              status: "passed_exact",
              acceptedCells: 540,
              completeCleanup: true,
              reproductionRoot: SHA_B,
              artifact: {
                schemaVersion: "v1.38-current-matrix-reproduction-v16",
                status: "passed_exact",
                acceptedCellCount: 540,
                uniqueExpectedCellCount: 540,
                completeCleanup: true,
                receiptRoot: SHA_B,
                downstreamAuthority: "denied",
              },
            }
          },
          appendDurableRecord,
        }),
      })
      const journalPath = path.resolve(root, CONTROLLER_PATHS.journal)
      const records = readFileSync(journalPath, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as V138RetryV2JournalRecord)
      const reservations = records
        .filter(({ kind }) => kind.startsWith("reserve_"))
        .flatMap((record) =>
          "identities" in record
            ? record.identities.map((identity) => `${record.kind}:${identity}`)
            : "identity" in record
              ? [`${record.kind}:${record.identity}`]
              : [`${record.kind}:${record.routeIdentity}`],
        )
      expect(new Set(reservations).size).toBe(reservations.length)
      expect(existsSync(path.resolve(root, CONTROLLER_PATHS.terminal))).toBe(true)
      if (stage.startsWith("reproduction_") || stage.startsWith("terminal_")) {
        expect(reproductionLaunches).toBe(0)
      }
    },
    60_000,
  )

  it("synchronizes two contenders so exactly one owns the kernel lock", async () => {
    if (process.platform !== "darwin") return
    const root = mkdtempSync(path.join(tmpdir(), "v138-v2-lock-race-"))
    temporaryRoots.push(root)
    const lock = path.join(root, "owner.lock")
    const resultPath = path.join(root, "results.txt")
    const moduleUrl = pathToFileURL(
      path.resolve("scripts/run-v1-38-bounded-retry-envelope-v2.ts"),
    ).href
    const childPath = path.join(root, "contender.mts")
    writeFileSync(
      childPath,
      `
        import { appendFileSync } from "node:fs";
        import { acquireV138RetryV2OwnerLease } from ${JSON.stringify(moduleUrl)};
        const [id, lock, resultPath] = process.argv.slice(2);
        process.stdout.write("ready\\n");
        await new Promise((resolve) => process.stdin.once("data", resolve));
        try {
          const owner = await acquireV138RetryV2OwnerLease(lock);
          appendFileSync(resultPath, id + ":acquired\\n");
          await new Promise((resolve) => setTimeout(resolve, 500));
          await owner.release();
        } catch {
          appendFileSync(resultPath, id + ":rejected\\n");
        }
      `,
    )
    const children = ["left", "right"].map((id) =>
      spawn(process.execPath, ["--import", "tsx", childPath, id, lock, resultPath], {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }),
    )
    await Promise.all(
      children.map(
        (child) =>
          new Promise<void>((resolve, reject) => {
            child.once("error", reject)
            child.stdout.once("data", () => resolve())
          }),
      ),
    )
    children.forEach((child) => child.stdin.end("go\n"))
    expect(
      await Promise.all(
        children.map(
          (child) =>
            new Promise<number | null>((resolve) => child.once("exit", resolve)),
        ),
      ),
    ).toEqual([0, 0])
    const outcomes = readFileSync(resultPath, "utf8").trim().split("\n")
    expect(outcomes.filter((value) => value.endsWith(":acquired"))).toHaveLength(1)
    expect(outcomes.filter((value) => value.endsWith(":rejected"))).toHaveLength(1)
  }, 30_000)

  it("strictly selects source-only mode and reports every downstream authority false", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-v2-cli-"))
    temporaryRoots.push(root)
    mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
    let liveInvoked = false
    const writes: string[] = []
    const originalWrite = process.stdout.write
    process.stdout.write = ((chunk: string | Uint8Array) => {
      writes.push(String(chunk))
      return true
    }) as typeof process.stdout.write
    try {
      await executeV138BoundedRetryV2Cli(["--check-source-only"], {
        repoRoot: root,
        runLive: async () => {
          liveInvoked = true
        },
      })
      await expect(
        executeV138BoundedRetryV2Cli([
          "--run-bounded-live-envelope",
          "--journal",
          CONTROLLER_PATHS.journal,
        ], {
          repoRoot: root,
          runLive: async () => {
            liveInvoked = true
          },
        }),
      ).rejects.toThrow("V138_RETRY_ARGUMENTS_INVALID")
    } finally {
      process.stdout.write = originalWrite
    }
    expect(liveInvoked).toBe(false)
    expect(JSON.parse(writes.join(""))).toMatchObject({
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      gameplayChangeAuthorized: false,
    })
    expect(CONTROLLER_PATHS).toMatchObject({
      sourceController: "scripts/run-v1-38-bounded-retry-envelope-v2.ts",
      sourceModel: "scripts/lib/v1-38-bounded-retry-envelope-v2.ts",
      journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
      terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
      privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v2",
      reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
    })
    expect(Object.isFrozen(CONTROLLER_PATHS)).toBe(true)
    for (const destination of Object.values(CONTROLLER_PATHS).filter((value) =>
      value.includes("journal-v2") || value.includes("terminal-v2") ||
      value.includes("private-v2") || value.includes("reproduction-v16"),
    )) expect(existsSync(path.resolve(root, destination))).toBe(false)
  })

  it("production entry uses injected fake effects and leaves runtime invocation outside the controller", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-v2-production-fake-"))
    temporaryRoots.push(root)
    mkdirSync(path.join(root, ".planning", "artifacts"), { recursive: true })
    const fake = fakeEffects({ observations: Array.from({ length: 12 }, () => 2_499), calibrations: [] })
    await runV138V2ProductionLive(root, {
      validateInputs: false,
      checkPair: () => ({ seal: {} as never, envelope: envelope() }),
      createEffects: (appendDurableRecord) => ({
        ...fake.effects,
        appendDurableRecord,
      }),
    })
    expect(existsSync(path.resolve(root, CONTROLLER_PATHS.terminal))).toBe(true)
    expect(existsSync(path.resolve(root, CONTROLLER_PATHS.reproduction))).toBe(false)
    expect(fake.reproductionRuns()).toBe(0)
  })
})
