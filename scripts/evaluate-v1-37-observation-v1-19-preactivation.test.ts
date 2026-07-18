import { describe, expect, it } from "vitest"
import {
  buildV137ObservationV119PreactivationProof,
  validateV137ObservationV119PreactivationProof,
  type V137ObservationV119DatabaseInventory,
  type V137ObservationV119GateReceipt,
} from "./evaluate-v1-37-observation-v1-19-preactivation.js"

const GATE_IDS = [
  "spec",
  "engine",
  "generator",
  "persistence",
  "go",
  "runtime",
  "replay",
  "public-contract",
  "web",
  "privacy",
  "boundary",
  "certification",
  "revalidation",
  "protected-baseline",
] as const

const passingGates = (): V137ObservationV119GateReceipt[] =>
  GATE_IDS.map((id) => ({
    id,
    status: "passed",
    command: `test:${id}`,
    exitCode: 0,
    stdoutSha256: `sha256:${"1".repeat(64)}`,
    stderrSha256: `sha256:${"2".repeat(64)}`,
  }))

const passingDatabase = (): V137ObservationV119DatabaseInventory => ({
  phase259CurrentCandidateRows: 0,
  phase259CertificateRows: 4,
  inactiveV119CertificateRows: 4,
  inactiveV119RunRows: 12,
  arenaCatalogRows: 3,
  activeArenaRows: 2,
  historicalAliasRows: 1,
  setScenarioRows: 0,
  setConditionRows: 0,
  revisionRevalidationRows: 0,
  successorMatchRows: 0,
})

const passingProof = () =>
  buildV137ObservationV119PreactivationProof(
    process.cwd(),
    passingGates(),
    passingDatabase(),
  )

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("v1.37 observation-v1.19 preactivation proof", () => {
  it("builds a complete preactivation-only D-01..D-16 and STRAT/SET proof", () => {
    const proof = passingProof()

    expect(
      validateV137ObservationV119PreactivationProof(
        proof,
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
      ),
    ).toEqual([])
    expect(proof.lifecycle).toBe("preactivation-only")
    expect(proof.current).toBe(false)
    expect(proof.decisions).toHaveLength(16)
    expect(proof.requirements).toHaveLength(9)
    expect(proof.candidate.lanes).toHaveLength(4)
    expect(proof.candidate.lanes.flatMap((lane) => lane.runs)).toHaveLength(12)
    expect(proof.currentInventory.database).toEqual(passingDatabase())
    expect(proof.inputs.map(({ path }) => path)).toContain(
      "scripts/activate-v1-37-observation-v1-19.ts",
    )
    expect(proof.seamAudit).toEqual({
      status: "passed",
      findingCount: 0,
      autoFix: false,
      gateStatus: "passed",
      gateExitCode: 0,
      dependencyTreeUnchanged: true,
      stdoutNormalization: "vitest-stable-v1",
    })
  })

  it.each([
    [
      "candidate corpus version",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.corpus.version = "v2"
      },
    ],
    [
      "candidate corpus root",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.corpus.rootSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "candidate corpus pin",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.corpus.pinFileSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "active corpus registry",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.corpus.activeVersion = "v3"
      },
    ],
    [
      "active trace registry",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.trace.activeVersion =
          "v1.37-observation-trace-v4"
      },
    ],
    [
      "reviewed current pin",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.corpus.reviewedPinFileSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "Workshop default",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.workshop.contractVersion =
          "workshop-contract-v1.19"
      },
    ],
    [
      "TypeScript current selector",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.semantic.semanticAuthorityKey = "runtime-v1.19"
      },
    ],
    [
      "Go current selector",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.go.semanticAuthorityKey = "runtime-v1.19"
      },
    ],
    [
      "partial Set matrix",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.set.conditionCount = 3
      },
    ],
    [
      "alias counted as diversity",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.arena.aliasDiversityCount = 1
      },
    ],
    [
      "inferred revision eligibility",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.revisions.inferenceAllowed = true
      },
    ],
    [
      "reused Phase-259 evidence",
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.reusedPhase259RunCount = 1
      },
    ],
    [
      "premature database current row",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.database.phase259CurrentCandidateRows = 1
      },
    ],
    [
      "premature successor Match",
      (proof: ReturnType<typeof passingProof>) => {
        proof.currentInventory.database.successorMatchRows = 1
      },
    ],
    [
      "protected baseline drift",
      (proof: ReturnType<typeof passingProof>) => {
        proof.protectedBaseline.baselineSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "nonzero seam inventory",
      (proof: ReturnType<typeof passingProof>) => {
        ;(proof.seamAudit as { findingCount: number }).findingCount = 1
      },
    ],
  ] as const)("rejects %s", (_name, mutate) => {
    const proof = clone(passingProof())
    mutate(proof)
    expect(
      validateV137ObservationV119PreactivationProof(
        proof,
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
      ),
    ).not.toEqual([])
  })

  it("rejects private or operational data recursively", () => {
    const proof = clone(passingProof()) as unknown as Record<string, unknown>
    ;(proof.candidate as Record<string, unknown>).diagnostics = {
      source: "private Strategy source",
      hostPath: "/private/runtime/path",
    }

    expect(
      validateV137ObservationV119PreactivationProof(
        proof,
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
      ),
    ).toContain("proof shape")
  })

  it("rejects stale, duplicated, fallback, or synthetic real-lane evidence", () => {
    const mutations = [
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.lanes[0]!.runs[1]!.runId =
          proof.candidate.lanes[0]!.runs[0]!.runId
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.lanes[0]!.runs[0]!.fallbackUsed = true
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.lanes[0]!.runs[0]!.syntheticEvidence = true
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.candidate.lanes[0]!.runs[0]!.validUntil =
          "2026-07-16T00:00:00.000Z"
      },
    ]

    for (const mutate of mutations) {
      const proof = clone(passingProof())
      mutate(proof)
      expect(
        validateV137ObservationV119PreactivationProof(
          proof,
          process.cwd(),
          "2026-07-17T12:00:00.000Z",
        ),
      ).toContain("candidate lanes")
    }
  })
})
