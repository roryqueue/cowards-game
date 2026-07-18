import { describe, expect, it } from "vitest"
import {
  buildV137ObservationV119PreactivationProof,
  sealV137ObservationV119GateReceipt,
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

const GATE_COMMANDS = [
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/spec/src/strategy-observation-abi-v1-19.test.ts packages/spec/src/arena-catalog-v1-37.test.ts packages/spec/src/set-condition-policy-v1-37.test.ts packages/spec/src/integrity-authority.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/engine/src/test/strategy-observations-v1-19.test.ts packages/engine/src/test/compatibility-v1-4.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/generate-v1-37-arena-set-authority.test.ts scripts/generate-v1-37-conformance-corpus.test.ts scripts/generate-v1-37-conformance-traces.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/persistence/src/migrations.test.ts packages/persistence/src/matchset-service.test.ts packages/persistence/src/complete-match.test.ts packages/persistence/src/matchset-status.test.ts packages/persistence/src/scoring.test.ts packages/persistence/src/workshop-contract-v1-19-candidate.test.ts",
  "go test ./... -count=1 -run ArenaSetAuthority|Candidate|Cartesian",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/runtime-js/src/revision-v1-19.test.ts packages/runtime-python/src/revision-v1-19.test.ts packages/runtime-wasm-wasi/src/revision-v1-19.test.ts apps/runtime-service/src/execute-match-v1-19.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/replay/src/record.test.ts packages/replay/src/validate.test.ts packages/replay/src/historical-v1-4.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism packages/spec/src/match-execution-contract.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism apps/web/app/matches/replay-fixture.test.ts apps/web/app/matchsets/result-view-model.test.ts",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts packages/spec/src/match-execution-contract.test.ts",
  "pnpm boundary:imports",
  "pnpm exec vitest run --maxWorkers=1 --no-file-parallelism scripts/certify-v1-37-observation-v1-19-language-lane.test.ts scripts/sign-import-v1-37-observation-v1-19-certificates.test.ts",
  "pnpm exec tsx scripts/revalidate-v1-37-strategy-revisions-v1-19.ts --check",
  "pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check",
] as const

const passingGates = (): V137ObservationV119GateReceipt[] =>
  GATE_IDS.map((id, index) =>
    sealV137ObservationV119GateReceipt({
      id,
      status: "passed",
      command: GATE_COMMANDS[index],
      exitCode: 0,
      outputNormalization: "gate-stable-v1",
      stdoutSha256: `sha256:${"1".repeat(64)}`,
      stderrSha256: `sha256:${"2".repeat(64)}`,
    }),
  )

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
        passingGates(),
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
    expect(proof.inputs.map(({ path }) => path)).toContain(
      "packages/persistence/src/semantic-authority-selection-head.ts",
    )
    expect(proof.inputs.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        "packages/golden/src/v1-37-conformance-corpus.test.ts",
        "scripts/generate-v1-37-conformance-corpus.test.ts",
        "packages/replay/src/record.test.ts",
        "apps/web/app/matchsets/result-view-model.test.ts",
      ]),
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
        passingGates(),
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
        passingGates(),
      ),
    ).toContain("proof shape")
  })

  it.each([
    [
      "gate command",
      (gate: V137ObservationV119GateReceipt) => {
        gate.command = "true"
      },
    ],
    [
      "gate stdout digest",
      (gate: V137ObservationV119GateReceipt) => {
        gate.stdoutSha256 = `sha256:${"3".repeat(64)}`
      },
    ],
    [
      "gate stderr digest",
      (gate: V137ObservationV119GateReceipt) => {
        gate.stderrSha256 = `sha256:${"4".repeat(64)}`
      },
    ],
    [
      "gate receipt digest",
      (gate: V137ObservationV119GateReceipt) => {
        gate.receiptSha256 = `sha256:${"5".repeat(64)}`
      },
    ],
  ] as const)("rejects tampered %s", (_name, mutate) => {
    const proof = clone(passingProof())
    mutate(proof.gates[0]!)
    expect(
      validateV137ObservationV119PreactivationProof(
        proof,
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
        passingGates(),
      ),
    ).toContain("gates")
  })

  it("rejects coordinated output tampering even when the receipt is resealed", () => {
    const proof = clone(passingProof())
    const { receiptSha256: _receiptSha256, ...unsealed } = proof.gates[0]!
    proof.gates[0] = sealV137ObservationV119GateReceipt({
      ...unsealed,
      stdoutSha256: `sha256:${"6".repeat(64)}`,
      stderrSha256: `sha256:${"7".repeat(64)}`,
    })

    expect(
      validateV137ObservationV119PreactivationProof(
        proof,
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
        passingGates(),
      ),
    ).toContain("independent gate execution")
  })

  it("rejects validation without an independently executed gate set", () => {
    expect(
      validateV137ObservationV119PreactivationProof(
        passingProof(),
        process.cwd(),
        "2026-07-17T12:00:00.000Z",
      ),
    ).toContain("independent gate execution")
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
          passingGates(),
        ),
      ).toContain("candidate lanes")
    }
  })
})
