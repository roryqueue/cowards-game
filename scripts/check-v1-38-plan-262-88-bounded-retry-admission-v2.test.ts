import { createHash } from "node:crypto"

import { describe, expect, it } from "vitest"

import {
  V138_PLAN_262_88_PATHS,
  checkV138Plan26288Artifacts,
  computeV138Plan26288ActivationRoot,
  computeV138Plan26288DispositionRoot,
  computeV138Plan26288ManifestRoot,
  deriveV138Plan26288NoPublish,
  evaluateV138Plan26288Evidence,
  loadV138Plan26288Evidence,
  reconstructV138Plan26288Journal,
} from "./check-v1-38-plan-262-88-bounded-retry-admission-v2.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const repoRoot = process.cwd()
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? (Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json)
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const rechain = (records: any[]): any[] => {
  let previousRoot = sha256("v138-bounded-retry-journal-genesis-v2")
  return records.map((record, ordinal) => {
    const body = {
      ...record,
      ordinal,
      previousRoot,
    }
    delete body.recordRoot
    const chained = {
      ...body,
      recordRoot: sha256(`v138-retry-journal-record-v2\0${canonical(body)}`),
    }
    previousRoot = chained.recordRoot
    return chained
  })
}

const syntheticPassEvidence = (): any => {
  const evidence = clone(loadV138Plan26288Evidence(repoRoot))
  const envelopeRoot = evidence.envelope.envelopeRoot
  const owner = "repository_operator"
  const calibrationIdentities = Array.from(
    { length: 8 },
    (_, index) => `calibration:v2:0:${index}`,
  )
  const reproductionIdentities = Array.from(
    { length: 540 },
    (_, index) => `reproduction:v2:${index}`,
  )
  const reproductionBody = {
    schemaVersion: "v1.38-current-matrix-reproduction-v16",
    status: "passed_exact",
    admittedCalibrationRoot: `sha256:${"1".repeat(64)}`,
    chargedAttemptCount: 540,
    acceptedCellCount: 540,
    completeCleanup: true,
    executionRoot: `sha256:${"2".repeat(64)}`,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
    samplingMilliseconds: 200,
    partialAcceptedEvidenceReusable: false,
    privacyProjection: {
      strategySourceIncluded: false,
      strategyMemoryIncluded: false,
      soldierMemoryIncluded: false,
      objectivePayloadIncluded: false,
      rawDiagnosticsIncluded: false,
    },
    phase263PlanningAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
  }
  const reproduction = {
    ...reproductionBody,
    receiptRoot: sha256(
      `v138-current-matrix-reproduction-v16\0${canonical(reproductionBody)}`,
    ),
  }
  const records = rechain([
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_000,
      envelopeRoot,
      kind: "reserve_preflight",
      owner,
      identity: "preflight:v2:0",
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_001,
      envelopeRoot,
      kind: "observe_preflight",
      owner,
      identity: "preflight:v2:0",
      effectiveAvailableBasisPoints: 2_500,
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_002,
      envelopeRoot,
      kind: "reserve_route",
      owner,
      identity: "route:v2:0",
      preflightIdentity: "preflight:v2:0",
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_003,
      envelopeRoot,
      kind: "reserve_calibration",
      owner,
      routeIdentity: "route:v2:0",
      identities: calibrationIdentities,
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_004,
      envelopeRoot,
      kind: "finish_calibration",
      owner,
      routeIdentity: "route:v2:0",
      status: "admitted",
      completeCleanup: true,
      supervisionRoot: `sha256:${"3".repeat(64)}`,
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_005,
      envelopeRoot,
      kind: "reserve_reproduction",
      owner,
      routeIdentity: "route:v2:0",
      identities: reproductionIdentities,
    },
    {
      schemaVersion: "v1.38-bounded-retry-journal-record-v2",
      atMilliseconds: 1_006,
      envelopeRoot,
      kind: "finish_reproduction",
      owner,
      routeIdentity: "route:v2:0",
      status: "passed_exact",
      acceptedCells: 540,
      completeCleanup: true,
      reproductionRoot: reproduction.receiptRoot,
    },
  ])
  const state = reconstructV138Plan26288Journal(evidence.envelope, records)
  evidence.journal = records
  evidence.journalBytes = records.map(canonical).join("")
  evidence.journalSha256 = sha256(evidence.journalBytes)
  evidence.privateReceipts = records.map((record, ordinal) => {
    const bytes = canonical(record)
    return {
      name: `journal-record-${String(ordinal).padStart(4, "0")}.json`,
      repoPath: `${V138_PLAN_262_88_PATHS.privateDir}/journal-record-${String(ordinal).padStart(4, "0")}.json`,
      bytes,
      byteLength: Buffer.byteLength(bytes),
      sha256: sha256(bytes),
      mode: 0o600,
      gitBlob: "fixture",
    }
  })
  evidence.privateDirMode = 0o700
  evidence.terminal = {
    schemaVersion: "v1.38-current-matrix-retry-terminal-v2",
    terminalReason: null,
    journalRoot: state.journalRoot,
    stateRoot: state.stateRoot,
    disposition: "succeeded",
    counters: state.counters,
    freshAccepted: 540,
    completeCleanup: true,
    downstreamAuthority: "denied",
    productionAuthorized: false,
  }
  evidence.terminalBytes = canonical(evidence.terminal)
  evidence.terminalSha256 = sha256(evidence.terminalBytes)
  evidence.reproductionStatus = "regular"
  evidence.reproduction = reproduction
  evidence.custody.livePathsExact = true
  evidence.custody.evidenceUnrewritten = true
  return evidence
}

describe("Plan 262-88 independent bounded-retry v2 adjudication", () => {
  it("reconstructs the committed exhaustion without trusting terminal narration", () => {
    const before = loadV138Plan26288Evidence(repoRoot).destinationStatus
    const result = deriveV138Plan26288NoPublish(repoRoot)
    const after = loadV138Plan26288Evidence(repoRoot).destinationStatus

    expect(result.disposition.status).toBe("non_pass")
    expect(result.disposition.terminalDisposition).toBe("exhausted")
    expect(result.disposition.assuranceStatus).toBe("clean")
    expect(result.disposition.correctionRequired).toBe(false)
    expect(result.disposition.counters).toEqual({
      preflightObservationsConsumed: 3,
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      reproductionIdentitiesCharged: 0,
      freshAccepted: 0,
      requiredAccepted: 540,
    })
    expect(result.disposition.reasonCodes).toEqual([
      "ENVELOPE_EXHAUSTED",
      "FRESH_ACCEPTED_NOT_540",
      "REPRODUCTION_EVIDENCE_ABSENT",
    ])
    expect(result.disposition.dispositionRoot).toBe(
      computeV138Plan26288DispositionRoot(result.disposition),
    )
    expect(result.manifest.manifestRoot).toBe(
      computeV138Plan26288ManifestRoot(result.manifest),
    )
    expect(result.manifest.generations).toHaveLength(2)
    expect(
      result.manifest.generations.map((item: any) => item.receiptCount),
    ).toEqual([15, 15])
    expect(
      result.manifest.generations.every((generation: any) =>
        generation.receipts.every((receipt: any) => !("bytes" in receipt)),
      ),
    ).toBe(true)
    expect(
      Object.values(result.manifest.privacyProjection).every((value) => !value),
    ).toBe(true)
    expect(after).toEqual(before)
  }, 30_000)

  it.each([
    [
      "journal root mutation",
      (evidence: any) => {
        evidence.journal[0].recordRoot = `sha256:${"0".repeat(64)}`
      },
      "JOURNAL_CHAIN_INVALID",
    ],
    [
      "noncanonical journal encoding",
      (evidence: any) => {
        evidence.journalCanonical = false
      },
      "JOURNAL_NONCANONICAL",
    ],
    [
      "identity aliasing",
      (evidence: any) => {
        evidence.journal[3].identities[0] = "calibration:v1:0:0"
        evidence.journal = rechain(evidence.journal)
      },
      "JOURNAL_SEMANTICS_INVALID",
    ],
    [
      "backoff breach",
      (evidence: any) => {
        evidence.journal[5].atMilliseconds =
          evidence.journal[4].atMilliseconds + 899_999
        evidence.journal = rechain(evidence.journal)
      },
      "JOURNAL_SEMANTICS_INVALID",
    ],
    [
      "terminal count forgery",
      (evidence: any) => {
        evidence.terminal.counters.acceptedCells = 540
        evidence.terminal.freshAccepted = 540
      },
      "TERMINAL_INVALID",
    ],
    [
      "policy expansion",
      (evidence: any) => {
        evidence.envelope.policy.maximumRouteStarts = 4
      },
      "FROZEN_POLICY_INVALID",
    ],
    [
      "seal substitution",
      (evidence: any) => {
        evidence.seal.sealRoot = `sha256:${"0".repeat(64)}`
      },
      "SEAL_INVALID",
    ],
    [
      "review finding injection",
      (evidence: any) => {
        evidence.review.findingCount = 1
      },
      "SOURCE_REVIEW_INVALID",
    ],
    [
      "historical correction rewrite",
      (evidence: any) => {
        evidence.correctionV2.effectiveAssurance.integrityPassed = true
      },
      "PROTECTED_V1_HISTORY_INVALID",
    ],
    [
      "source rewrite",
      (evidence: any) => {
        evidence.custody.sourceUnrewritten = false
      },
      "GIT_CUSTODY_INVALID",
    ],
    [
      "reviewed Git blob mismatch",
      (evidence: any) => {
        evidence.custody.reviewedBlobsExact = false
      },
      "GIT_CUSTODY_INVALID",
    ],
    [
      "receipt mode widening",
      (evidence: any) => {
        evidence.privateReceipts[0].mode = 0o644
      },
      "PRIVATE_RECEIPT_INVALID",
    ],
    [
      "receipt omission",
      (evidence: any) => {
        evidence.privateReceipts.pop()
      },
      "PRIVATE_RECEIPT_INVALID",
    ],
    [
      "runtime/kernel source drift",
      (evidence: any) => {
        evidence.sourceText.controller = ""
      },
      "RUNTIME_KERNEL_CONTRACT_INVALID",
    ],
    [
      "privacy marker",
      (evidence: any) => {
        evidence.unsafeProjectionKeys.push("strategySource")
      },
      "PRIVACY_PROJECTION_INVALID",
    ],
    [
      "unsafe reproduction path",
      (evidence: any) => {
        evidence.reproductionStatus = "unsafe"
      },
      "REPRODUCTION_PATH_UNSAFE",
    ],
    [
      "unexpected reproduction on exhaustion",
      (evidence: any) => {
        evidence.reproductionStatus = "regular"
        evidence.reproduction = { schemaVersion: "unexpected" }
      },
      "REPRODUCTION_BRANCH_MISMATCH",
    ],
  ])(
    "rejects %s",
    (_name, mutate, reason) => {
      const evidence = clone(loadV138Plan26288Evidence(repoRoot))
      mutate(evidence)
      const result = evaluateV138Plan26288Evidence(evidence)
      expect(result.disposition.status).toBe("non_pass")
      expect(result.disposition.assuranceDefects).toContain(reason)
      expect(result.disposition.correctionRequired).toBe(true)
      expect(
        Object.values(result.disposition.authority).every(
          (value) => value === false,
        ),
      ).toBe(true)
    },
    30_000,
  )

  it("requires exact 540/540, a clean seal/review, and clean evidence for pass", () => {
    const evidence = syntheticPassEvidence()
    const result = evaluateV138Plan26288Evidence(evidence)
    expect(result.disposition).toMatchObject({
      status: "pass",
      terminalDisposition: "succeeded",
      assuranceStatus: "clean",
      correctionRequired: false,
      reasonCodes: [],
      counters: {
        freshAccepted: 540,
        requiredAccepted: 540,
        reproductionIdentitiesCharged: 540,
      },
      authority: {
        foundationActivationAuthorized: true,
        phase263PlanningAuthorized: true,
      },
    })
    const activation = computeV138Plan26288ActivationRoot(result.disposition)
    expect(activation).toMatchObject({
      schemaVersion: "v1.38-foundation-activation-root-route10-v1",
      routeOrdinal: 10,
      phase263PlanningAuthorized: true,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      productionAuthorized: false,
    })

    evidence.privateReceipts[0].mode = 0o644
    const defective = evaluateV138Plan26288Evidence(evidence)
    expect(defective.disposition.status).toBe("non_pass")
    expect(() =>
      computeV138Plan26288ActivationRoot(defective.disposition),
    ).toThrow("V138_PLAN_262_88_ACTIVATION_NOT_AUTHORIZED")
  }, 30_000)

  it("verifies committed publications without exposing private receipt bytes", () => {
    const statuses = loadV138Plan26288Evidence(repoRoot).destinationStatus
    if (statuses.manifest === "regular" && statuses.disposition === "regular") {
      const checked = checkV138Plan26288Artifacts(repoRoot)
      expect(checked.disposition.status).toBe("non_pass")
      expect(checked.disposition.correctionRequired).toBe(false)
      expect(checked.correctionPresent).toBe(false)
      expect(checked.activationPresent).toBe(false)
    } else {
      expect(statuses.manifest).toBe("absent")
      expect(statuses.disposition).toBe("absent")
    }
  }, 30_000)
})
