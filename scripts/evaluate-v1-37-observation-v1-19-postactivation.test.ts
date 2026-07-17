import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import {
  V1_37_OBSERVATION_V1_19_ACTIVATION_FILES,
  V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS,
  V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES,
  buildV137ObservationV119PostactivationProof,
  orchestrateV137ObservationV119Rollback,
  parseV137ObservationV119PostactivationArgs,
  validateV137ObservationV119PostactivationProof,
  type V137ObservationV119PostactivationBuildInput,
  type V137ObservationV119SnapshotMember,
} from "./evaluate-v1-37-observation-v1-19-postactivation.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const SHA_C = `sha256:${"c".repeat(64)}` as const
const HEAD = "1".repeat(40)
const TOKEN = "activation-transaction:phase-260-plan-14:test"
const NOW = "2026-07-17T12:00:00.000Z"

const files = (
  sha256: typeof SHA_A | typeof SHA_B,
  proofPresent: boolean,
): V137ObservationV119SnapshotMember[] =>
  V1_37_OBSERVATION_V1_19_ACTIVATION_FILES.map((id) => ({
    id,
    state:
      id.endsWith("activation-transaction-proof.json") && !proofPresent
        ? "absent"
        : "present",
    sha256:
      id.endsWith("activation-transaction-proof.json") && !proofPresent
        ? null
        : sha256,
  }))

const database = (
  sha256: typeof SHA_A | typeof SHA_B,
): V137ObservationV119SnapshotMember[] =>
  V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS.map((id) => ({
    id,
    state: "present",
    sha256,
  }))

const buildInput = (): V137ObservationV119PostactivationBuildInput => ({
  binding: {
    headSha: HEAD,
    dirtyWorktreeSha256: SHA_C,
    preactivationProofSha256: SHA_A,
    transactionToken: TOKEN,
    transactionIsolation: "serializable",
  },
  snapshots: {
    files: {
      preimage: files(SHA_A, false),
      activated: files(SHA_B, true),
      restored: files(SHA_A, false),
      reinstalled: files(SHA_B, true),
    },
    database: {
      preimage: database(SHA_A),
      activated: database(SHA_B),
      restored: database(SHA_A),
      reinstalled: database(SHA_B),
    },
  },
  gates: V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES.map((id) => ({
    id,
    status: "passed",
    exitCode: 0,
    command: `test:${id}`,
    stdoutSha256: SHA_A,
    stderrSha256: SHA_B,
    headSha: HEAD,
    dirtyWorktreeSha256: SHA_C,
    transactionToken: TOKEN,
    completedAt: NOW,
    validUntil: "2026-07-18T12:00:00.000Z",
    fresh: true,
    synthetic: false,
  })),
  revisionAdmission: {
    inventoryCount: 9,
    revalidatedCount: 0,
    nonCountedCount: 9,
    inferenceAllowed: false,
    allDispositionsExplicit: true,
    selectorActivated: true,
    incompleteRevisionCount: 9,
    countedRevisionCount: 0,
  },
  protectedBaseline: {
    status: "verified",
    protectedPathCount: 2,
    baselineSha256:
      "sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707",
  },
})

const passingProof = () => buildV137ObservationV119PostactivationProof(buildInput())
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("v1.37 observation-v1.19 postactivation proof", () => {
  it("accepts only the complete successor file, database, gate, and D-04 set", () => {
    const proof = passingProof()
    expect(validateV137ObservationV119PostactivationProof(proof, NOW)).toEqual(
      [],
    )
    expect(proof.current).toBe(true)
    expect(proof.lifecycle).toBe("postactivation-precommit")
    expect(proof.snapshots.files.activated).toHaveLength(9)
    expect(proof.snapshots.database.activated).toHaveLength(
      V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS.length,
    )
    expect(proof.gates).toHaveLength(
      V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES.length,
    )
  })

  it.each([
    ["semantic key", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.semanticAuthorityKey = "runtime-v1.18" as "runtime-v1.19")],
    ["tuple", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.tupleId = SHA_A)],
    ["runtime ABI", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.runtimeAbiVersion = "strategy-runtime-abi-v1.18" as "strategy-runtime-abi-v1.19")],
    ["certificate", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.certificateVersion = "runtime-conformance-certificate-v1.17" as "runtime-conformance-certificate-v1.19")],
    ["arena", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.arenaCatalogVersion = "wrong" as "canonical-arena-catalog-v1.37")],
    ["Set policy", (proof: ReturnType<typeof passingProof>) => (proof.selection.semantic.setPolicyVersion = "wrong" as "canonical-set-policy-v1.37-four-condition-v1")],
    ["corpus version", (proof: ReturnType<typeof passingProof>) => (proof.selection.corpus.version = "v2" as "v3")],
    ["corpus root", (proof: ReturnType<typeof passingProof>) => (proof.selection.corpus.rootSha256 = SHA_A)],
    ["reviewed corpus pin", (proof: ReturnType<typeof passingProof>) => (proof.selection.corpus.reviewedPinFileSha256 = SHA_A)],
    ["trace version", (proof: ReturnType<typeof passingProof>) => (proof.selection.trace.version = "v1.37-conformance-trace-v3" as "v1.37-observation-trace-v4")],
    ["trace root", (proof: ReturnType<typeof passingProof>) => (proof.selection.trace.rootSha256 = SHA_A)],
    ["Workshop default", (proof: ReturnType<typeof passingProof>) => (proof.selection.workshop.version = "workshop-contract-v1.17" as "workshop-contract-v1.19")],
    ["Workshop root", (proof: ReturnType<typeof passingProof>) => (proof.selection.workshop.rootSha256 = SHA_A)],
    ["Go selector", (proof: ReturnType<typeof passingProof>) => (proof.selection.go.semanticAuthorityKey = "runtime-v1.18" as "runtime-v1.19")],
    ["database selector", (proof: ReturnType<typeof passingProof>) => (proof.selection.database.semanticAuthorityKey = "runtime-v1.18" as "runtime-v1.19")],
  ] as const)("rejects a mixed successor %s", (_name, mutate) => {
    const proof = clone(passingProof())
    mutate(proof)
    expect(validateV137ObservationV119PostactivationProof(proof, NOW)).not.toEqual(
      [],
    )
  })

  it.each(V1_37_OBSERVATION_V1_19_ACTIVATION_FILES)(
    "rejects missing or partially restored file member %s",
    (id) => {
      const missing = clone(passingProof())
      missing.snapshots.files.activated =
        missing.snapshots.files.activated.filter((member) => member.id !== id)
      expect(validateV137ObservationV119PostactivationProof(missing, NOW)).toContain(
        "activated file snapshot",
      )

      const partial = clone(passingProof())
      const restored = partial.snapshots.files.restored.find(
        (member) => member.id === id,
      )!
      restored.state = "present"
      restored.sha256 = SHA_C
      expect(validateV137ObservationV119PostactivationProof(partial, NOW)).toContain(
        "file rollback",
      )
    },
  )

  it.each(V1_37_OBSERVATION_V1_19_DATABASE_SELECTORS)(
    "rejects missing or partially reinstalled database member %s",
    (id) => {
      const missing = clone(passingProof())
      missing.snapshots.database.activated =
        missing.snapshots.database.activated.filter((member) => member.id !== id)
      expect(validateV137ObservationV119PostactivationProof(missing, NOW)).toContain(
        "activated database snapshot",
      )

      const partial = clone(passingProof())
      partial.snapshots.database.reinstalled.find(
        (member) => member.id === id,
      )!.sha256 = SHA_C
      expect(validateV137ObservationV119PostactivationProof(partial, NOW)).toContain(
        "database reinstall",
      )
    },
  )

  it.each(V1_37_OBSERVATION_V1_19_POSTACTIVATION_GATES)(
    "requires exact gate %s",
    (id) => {
      const proof = clone(passingProof())
      proof.gates = proof.gates.filter((gate) => gate.id !== id)
      expect(validateV137ObservationV119PostactivationProof(proof, NOW)).toContain(
        "gates",
      )
    },
  )

  it("rejects stale, synthetic, recursive, or differently bound receipts", () => {
    const mutations = [
      (proof: ReturnType<typeof passingProof>) => {
        proof.gates[0]!.validUntil = "2026-07-16T12:00:00.000Z"
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.gates[0]!.synthetic = true
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.gates[0]!.command =
          "pnpm exec tsx scripts/evaluate-v1-37-observation-v1-19-postactivation.ts --write"
      },
      (proof: ReturnType<typeof passingProof>) => {
        proof.gates[0]!.dirtyWorktreeSha256 = SHA_A
      },
    ]
    for (const mutate of mutations) {
      const proof = clone(passingProof())
      mutate(proof)
      expect(validateV137ObservationV119PostactivationProof(proof, NOW)).toContain(
        "gates",
      )
    }
  })

  it("rejects inferred or incomplete D-04 admission", () => {
    const inferred = clone(passingProof())
    inferred.revisionAdmission.inferenceAllowed = true
    expect(validateV137ObservationV119PostactivationProof(inferred, NOW)).toContain(
      "revision admission",
    )

    const counted = clone(passingProof())
    counted.revisionAdmission.countedRevisionCount = 1
    expect(validateV137ObservationV119PostactivationProof(counted, NOW)).toContain(
      "revision admission",
    )
  })

  it("rejects protected baseline drift and recursively rejects private fields", () => {
    const drifted = clone(passingProof())
    drifted.protectedBaseline.baselineSha256 = SHA_A
    expect(validateV137ObservationV119PostactivationProof(drifted, NOW)).toContain(
      "protected baseline",
    )

    const privateProof = clone(passingProof()) as unknown as Record<
      string,
      unknown
    >
    ;(privateProof.selection as Record<string, unknown>).diagnostics = {
      source: "private Strategy source",
    }
    expect(
      validateV137ObservationV119PostactivationProof(privateProof, NOW),
    ).toContain("proof shape")
  })

  it("orchestrates full file/database restore, equality proof, then reinstall", async () => {
    const calls: string[] = []
    const input = buildInput()
    const adapter = {
      restoreFiles: vi.fn(async () => calls.push("restore-files")),
      restoreDatabase: vi.fn(async () => calls.push("restore-database")),
      captureFiles: vi
        .fn()
        .mockImplementationOnce(async () => {
          calls.push("capture-restored-files")
          return input.snapshots.files.preimage
        })
        .mockImplementationOnce(async () => {
          calls.push("capture-reinstalled-files")
          return input.snapshots.files.activated
        }),
      captureDatabase: vi
        .fn()
        .mockImplementationOnce(async () => {
          calls.push("capture-restored-database")
          return input.snapshots.database.preimage
        })
        .mockImplementationOnce(async () => {
          calls.push("capture-reinstalled-database")
          return input.snapshots.database.activated
        }),
      reinstallFiles: vi.fn(async () => calls.push("reinstall-files")),
      reinstallDatabase: vi.fn(async () => calls.push("reinstall-database")),
    }

    const receipt = await orchestrateV137ObservationV119Rollback(
      {
        transactionToken: TOKEN,
        filePreimage: input.snapshots.files.preimage,
        fileActivated: input.snapshots.files.activated,
        databasePreimage: input.snapshots.database.preimage,
        databaseActivated: input.snapshots.database.activated,
      },
      adapter,
    )

    expect(calls).toEqual([
      "restore-files",
      "restore-database",
      "capture-restored-files",
      "capture-restored-database",
      "reinstall-files",
      "reinstall-database",
      "capture-reinstalled-files",
      "capture-reinstalled-database",
    ])
    expect(receipt.restoredFiles).toEqual(input.snapshots.files.preimage)
    expect(receipt.reinstalledDatabase).toEqual(
      input.snapshots.database.activated,
    )
  })

  it("fails rollback before reinstall when any restored member differs", async () => {
    const input = buildInput()
    const partial = clone(input.snapshots.files.preimage)
    partial[0]!.sha256 = SHA_C
    const reinstallFiles = vi.fn()

    await expect(
      orchestrateV137ObservationV119Rollback(
        {
          transactionToken: TOKEN,
          filePreimage: input.snapshots.files.preimage,
          fileActivated: input.snapshots.files.activated,
          databasePreimage: input.snapshots.database.preimage,
          databaseActivated: input.snapshots.database.activated,
        },
        {
          restoreFiles: async () => undefined,
          restoreDatabase: async () => undefined,
          captureFiles: async () => partial,
          captureDatabase: async () => input.snapshots.database.preimage,
          reinstallFiles,
          reinstallDatabase: async () => undefined,
        },
      ),
    ).rejects.toThrow(/file rollback/u)
    expect(reinstallFiles).not.toHaveBeenCalled()
  })

  it("requires explicit transaction write mode and keeps check read-only", () => {
    expect(
      parseV137ObservationV119PostactivationArgs([
        "--write",
        "--activation-transaction",
      ]),
    ).toEqual({ mode: "write", activationTransaction: true })
    expect(parseV137ObservationV119PostactivationArgs(["--check"])).toEqual({
      mode: "check",
      activationTransaction: false,
    })
    expect(() =>
      parseV137ObservationV119PostactivationArgs(["--write"]),
    ).toThrow(/activation transaction/u)
    expect(() =>
      parseV137ObservationV119PostactivationArgs([
        "--check",
        "--activation-transaction",
      ]),
    ).toThrow(/read-only/u)
  })

  it("is distinct from the preactivation checker and has no old-current predicate", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "scripts/evaluate-v1-37-observation-v1-19-postactivation.ts",
      ),
      "utf8",
    )
    expect(source).not.toContain("validateV137ObservationV119PreactivationProof")
    expect(source).not.toContain('"runtime-v1.17"')
  })
})
