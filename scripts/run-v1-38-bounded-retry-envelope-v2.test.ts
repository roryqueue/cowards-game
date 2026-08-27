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
import { tmpdir } from "node:os"
import path from "node:path"
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
