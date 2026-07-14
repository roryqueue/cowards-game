import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { describe, expect, it } from "vitest"
import type * as SubjectModule from "./runtime-abi-v1-17.ts"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const subjectPath = path.join(import.meta.dirname, "runtime-abi-v1-17.ts")

type Subject = typeof SubjectModule

const subject = async (): Promise<Subject> => {
  expect(
    existsSync(subjectPath),
    "the immutable v1.17 registry must exist after the RED gate",
  ).toBe(true)
  return import(pathToFileURL(subjectPath).href) as Promise<Subject>
}

const fileHash = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

const protectedV116Files = {
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
    "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "apps/go-backend/runtime_service_client.go":
    "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
  "apps/go-backend/runtime_service_client_test.go":
    "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
} as const

type ExecutionCounterName =
  | "wallMilliseconds"
  | "computeFuel"
  | "payloadBytes"
  | "stdoutBytes"
  | "stderrBytes"

interface ExecutionLedgerView {
  readonly revision: number
  readonly cumulative: Readonly<
    Record<ExecutionCounterName, number> & { memoryBytes: number }
  >
}

const ledgerHash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const cloneLedgerValue = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T

const executionReceipt = (
  ledger: ExecutionLedgerView,
  input: Readonly<{
    invocationId?: string
    requestIdentity?: `sha256:${string}`
    evidenceIdentity?: `sha256:${string}`
    method?: "selectActivations" | "soldierBrain"
    attribution?: "proven_strategy" | "host" | "ambiguous"
    deltas?: Partial<Record<ExecutionCounterName, number>>
    memoryBytes?: number
  }> = {},
) => {
  const delta = {
    wallMilliseconds: 0,
    computeFuel: 0,
    payloadBytes: 0,
    stdoutBytes: 0,
    stderrBytes: 0,
    ...input.deltas,
  }
  return {
    domain: "execution" as const,
    prestateRevision: ledger.revision,
    invocationId: input.invocationId ?? `invocation:${ledger.revision}`,
    requestIdentity: input.requestIdentity ?? ledgerHash("a"),
    evidenceIdentity: input.evidenceIdentity ?? ledgerHash("b"),
    method: input.method ?? ("selectActivations" as const),
    attribution: input.attribution ?? ("proven_strategy" as const),
    counters: {
      wallMilliseconds: {
        status: "measured" as const,
        delta: delta.wallMilliseconds,
        cumulative: ledger.cumulative.wallMilliseconds + delta.wallMilliseconds,
      },
      computeFuel: {
        status: "measured" as const,
        delta: delta.computeFuel,
        cumulative: ledger.cumulative.computeFuel + delta.computeFuel,
      },
      payloadBytes: {
        status: "measured" as const,
        delta: delta.payloadBytes,
        cumulative: ledger.cumulative.payloadBytes + delta.payloadBytes,
      },
      stdoutBytes: {
        status: "measured" as const,
        delta: delta.stdoutBytes,
        cumulative: ledger.cumulative.stdoutBytes + delta.stdoutBytes,
      },
      stderrBytes: {
        status: "measured" as const,
        delta: delta.stderrBytes,
        cumulative: ledger.cumulative.stderrBytes + delta.stderrBytes,
      },
    },
    memory: {
      status: "measured" as const,
      peakBytes: input.memoryBytes ?? 0,
      cumulativePeakBytes: Math.max(
        ledger.cumulative.memoryBytes,
        input.memoryBytes ?? 0,
      ),
    },
    process: {
      status: "verified" as const,
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified" as const,
      filesystem: "none" as const,
      network: "disabled" as const,
      environment: "empty" as const,
      shell: "disabled" as const,
    },
    cancellation: {
      status: "verified" as const,
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified" as const,
      signatureVerified: true,
      monotonic: true,
    },
  }
}

type PreflightCounterName =
  | "wallMilliseconds"
  | "computeFuel"
  | "inputBytes"
  | "outputBytes"
  | "stderrBytes"

interface PreflightLedgerView {
  readonly revision: number
  readonly profile:
    | "sourceValidation"
    | "compilation"
    | "artifactValidation"
    | "conformance"
  readonly cumulative: Readonly<
    Record<PreflightCounterName, number> & { memoryBytes: number }
  >
}

const preflightReceipt = (
  ledger: PreflightLedgerView,
  input: Readonly<{
    operationId?: string
    attribution?: "proven_strategy" | "host" | "ambiguous"
    deltas?: Partial<Record<PreflightCounterName, number>>
    memoryBytes?: number
  }> = {},
) => {
  const delta = {
    wallMilliseconds: 0,
    computeFuel: 0,
    inputBytes: 0,
    outputBytes: 0,
    stderrBytes: 0,
    ...input.deltas,
  }
  const profilePolicy = {
    sourceValidation: { threads: 1, filesystem: "none" },
    compilation: {
      threads: 8,
      filesystem: "isolated-read-write-build-root-only",
    },
    artifactValidation: { threads: 1, filesystem: "artifact-read-only" },
    conformance: { threads: 1, filesystem: "closed-corpus-read-only" },
  } as const
  const policy = profilePolicy[ledger.profile]
  return {
    domain: "preflight" as const,
    profile: ledger.profile,
    prestateRevision: ledger.revision,
    operationId: input.operationId ?? `preflight:${ledger.revision}`,
    requestIdentity: ledgerHash("c"),
    evidenceIdentity: ledgerHash("d"),
    attribution: input.attribution ?? ("proven_strategy" as const),
    counters: {
      wallMilliseconds: {
        status: "measured" as const,
        delta: delta.wallMilliseconds,
        cumulative: ledger.cumulative.wallMilliseconds + delta.wallMilliseconds,
      },
      computeFuel: {
        status: "measured" as const,
        delta: delta.computeFuel,
        cumulative: ledger.cumulative.computeFuel + delta.computeFuel,
      },
      inputBytes: {
        status: "measured" as const,
        delta: delta.inputBytes,
        cumulative: ledger.cumulative.inputBytes + delta.inputBytes,
      },
      outputBytes: {
        status: "measured" as const,
        delta: delta.outputBytes,
        cumulative: ledger.cumulative.outputBytes + delta.outputBytes,
      },
      stderrBytes: {
        status: "measured" as const,
        delta: delta.stderrBytes,
        cumulative: ledger.cumulative.stderrBytes + delta.stderrBytes,
      },
    },
    memory: {
      status: "measured" as const,
      peakBytes: input.memoryBytes ?? 0,
      cumulativePeakBytes: Math.max(
        ledger.cumulative.memoryBytes,
        input.memoryBytes ?? 0,
      ),
    },
    process: {
      status: "verified" as const,
      processes: 1,
      threads: policy.threads,
      children: 0,
    },
    capabilities: {
      status: "verified" as const,
      network: "disabled" as const,
      filesystem: policy.filesystem,
    },
    accountingEvidence: {
      status: "verified" as const,
      signatureVerified: true,
      monotonic: true,
    },
  }
}

describe("runtime ABI v1.17 frozen successor registry", () => {
  it("mints a separate atomic successor without activating or rewriting v1.16", async () => {
    const runtimeAbi = await subject()
    const contract = runtimeAbi.RUNTIME_ABI_V1_17

    expect(contract.versions).toEqual({
      runtimeAbi: "strategy-runtime-abi-v1.17",
      runtimeService: "runtime-execution-service-v1.17",
      semanticReceipt: "runtime-semantic-receipt-v1.17",
      canonicalJson: "canonical-json-v1",
      budget: "runtime-budget-v1",
      identity: "runtime-identity-v1",
    })
    expect(contract.lifecycle).toEqual({
      status: "candidate-only",
      active: false,
      currentRuntimeAbi: "strategy-runtime-abi-v1.14",
      currentRuntimeService: "runtime-execution-service-v1.16",
      currentSemanticReceipt: "runtime-semantic-receipt-v1",
      activationOwner: "Phase-258-Plan-14",
    })
    expect(contract.migration.v116ReadDispatchRetained).toBe(true)
    expect(contract.migration.v116InsertionOrderedWireBytesRetained).toBe(true)
    expect(contract.migration.migration0017RewriteAllowed).toBe(false)
  })

  it("freezes the D-01 through D-04 canonical JSON profile and exact calibrated limits", async () => {
    const { RUNTIME_ABI_V1_17: contract } = await subject()

    expect(contract.canonicalJson).toMatchObject({
      admission: "raw-bytes-before-host-conversion",
      duplicateKeys: "reject-escaped-equivalent-before-object-conversion",
      numbers: {
        model: "finite-ieee-754-binary64",
        safeIntegerMinimum: -9_007_199_254_740_991,
        safeIntegerMaximum: 9_007_199_254_740_991,
        negativeZero: "encode-as-0",
        encoding: "shortest-round-trip-decimal",
      },
      unicode: {
        input: "valid-utf8-and-unicode-scalars",
        normalization: "preserve-no-nfc-or-nfd",
        objectKeyOrder: "lexicographic-unsigned-utf8-bytes",
      },
      ceilings: {
        rawUtf8Bytes: 8_388_608,
        depth: 64,
        nodes: 262_144,
        decodedStringUtf8Bytes: 6_291_456,
        arrayEntries: 65_536,
        objectEntries: 65_536,
      },
    })
    expect(contract.fieldCaps.strategyMemory).toEqual({
      value: 32_768,
      unit: "canonical-payload-bytes",
    })
    expect(contract.fieldCaps.soldierMemory.value).toBe(2_048)
    expect(contract.fieldCaps.objectivePayload.value).toBe(1_024)
  })

  it("makes success, player violation, and system failure mutually exclusive", async () => {
    const runtimeAbi = await subject()

    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "success",
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
        trace: { requestId: "request:1" },
      }),
    ).toBe(true)
    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "player_violation",
        violation: { code: "NON_CANONICAL_PAYLOAD" },
        failure: { code: "HOST_FAILURE" },
        trace: { requestId: "request:1" },
      }),
    ).toBe(false)
    expect(
      runtimeAbi.isRuntimeAbiV117InvocationResult({
        kind: "system_failure",
        failure: { code: "HOST_FAILURE" },
        value: {},
        trace: { requestId: "request:1" },
      }),
    ).toBe(false)
  })

  it("freezes per-method, cumulative Match, and separate preflight budget vectors", async () => {
    const { RUNTIME_ABI_V1_17: contract } = await subject()
    const budgets = contract.budgets

    expect(budgets.signedRequestBindings).toEqual([
      "selectActivations",
      "soldierBrain",
      "matchCumulative",
      "preflightProfile",
      "budgetProfileSha256",
    ])
    expect(budgets.selectActivations.invocationCountMaximum).toBe(20)
    expect(budgets.soldierBrain.invocationCountMaximum).toBe(240)
    expect(budgets.matchCumulative).toMatchObject({
      invocationCountMaximum: 260,
      wallMilliseconds: 13_000,
      computeFuel: 2_600_000_000,
      payloadBytes: 68_157_440,
    })
    for (const method of [budgets.selectActivations, budgets.soldierBrain]) {
      expect(method.vector).toMatchObject({
        wall: { value: 50, unit: "milliseconds" },
        compute: { value: 10_000_000, unit: "instruction-fuel" },
        memory: { value: 67_108_864, unit: "bytes" },
        payload: { value: 262_144, unit: "canonical-payload-bytes" },
        stdout: { value: 262_144, unit: "transport-frame-bytes" },
        stderr: { value: 65_536, unit: "raw-utf8-bytes" },
        process: { processes: 1, threads: 1, children: 0 },
        capabilities: {
          filesystem: "none",
          network: "disabled",
          environment: "empty",
          shell: "disabled",
        },
      })
    }
    expect(budgets.preflight.consumesMatchBudget).toBe(false)
    expect(Object.keys(budgets.preflight.profiles)).toEqual([
      "sourceValidation",
      "compilation",
      "artifactValidation",
      "conformance",
    ])
    expect(budgets.preflight.profiles).toMatchObject({
      sourceValidation: { stderrBytes: 0, threads: 1, children: 0 },
      compilation: { stderrBytes: 65_536, threads: 8, children: 0 },
      artifactValidation: { stderrBytes: 0, threads: 1, children: 0 },
      conformance: { stderrBytes: 0, threads: 1, children: 0 },
    })
  })

  it("fails counted certification closed when any equivalent meter or identity pin is missing", async () => {
    const runtimeAbi = await subject()
    const complete = Object.fromEntries(
      runtimeAbi.RUNTIME_ABI_V1_17.budgets.requiredEquivalentMeters.map(
        (meter) => [meter, true],
      ),
    )
    const exactIdentity = Object.fromEntries(
      runtimeAbi.RUNTIME_ABI_V1_17.identity.requiredExecutablePins.map(
        (pin) => [pin, `sha256:${"a".repeat(64)}`],
      ),
    )

    expect(
      runtimeAbi.assessRuntimeAbiV117Certification(complete, exactIdentity),
    ).toEqual({
      status: "certifiable",
      missingMeters: [],
      missingIdentityPins: [],
    })
    expect(
      runtimeAbi.assessRuntimeAbiV117Certification(
        { ...complete, compute: false },
        { ...exactIdentity, compilerFlags: "" },
      ),
    ).toEqual({
      status: "uncertified",
      missingMeters: ["compute"],
      missingIdentityPins: ["compilerFlags"],
    })
    expect(
      Object.values(runtimeAbi.RUNTIME_ABI_V1_17.lanePosture).every(
        (lane) => lane.countedCertification === "uncertified",
      ),
    ).toBe(true)
  })

  it("freezes fixed domain tags, length framing, and the public/private identity split", async () => {
    const runtimeAbi = await subject()
    const identity = runtimeAbi.RUNTIME_ABI_V1_17.identity

    expect(Object.keys(identity.domains)).toEqual([
      "originalSource",
      "normalizedSource",
      "normalizationPolicy",
      "artifact",
      "artifactManifest",
      "runtimeExecutable",
      "compilerExecutable",
      "sysrootStdlib",
      "adapterBuild",
      "semanticTuple",
      "containmentPolicy",
      "conformanceCorpus",
      "budgetProfile",
      "canonicalJsonProfile",
      "evidenceBundle",
    ])
    expect(identity.framing).toEqual({
      algorithm: "sha256",
      prefix: "cowards-game:runtime-identity:v1",
      segmentLength: "unsigned-64-bit-big-endian",
      order: "domain-tag-then-ordered-segments",
    })
    expect(
      runtimeAbi.hashRuntimeAbiV117Identity("originalSource", [
        new TextEncoder().encode("abc"),
      ]),
    ).toBe(
      "sha256:3163bf2a551ff5b16867f88fea678eb09891ede5978a24aea2ef122ebe8d4985",
    )
    expect(identity.publicSafeFields).toEqual([
      "sourceRevisionId",
      "normalizedSourceId",
      "artifactId",
      "manifestId",
      "runtimeLaneId",
      "semanticTupleId",
      "policyId",
      "corpusId",
      "evidenceBundleId",
    ])
    expect(identity.privateFields).toContain("originalSourceBytes")
    expect(identity.privateFields).toContain("compilerFlags")
    expect(identity.privateFields).toContain("hostPaths")
  })

  it("covers every locked decision and preserves all protected v1.16 bytes during generation", async () => {
    const before = Object.fromEntries(
      Object.keys(protectedV116Files).map((file) => [file, fileHash(file)]),
    )
    expect(before).toEqual(protectedV116Files)
    const runtimeAbi = await subject()
    const rendered = runtimeAbi.renderRuntimeAbiV117ContractJson()
    const parsed = JSON.parse(rendered)
    const after = Object.fromEntries(
      Object.keys(protectedV116Files).map((file) => [file, fileHash(file)]),
    )

    expect(after).toEqual(before)
    expect(parsed.decisionMap.map((row: { id: string }) => row.id)).toEqual(
      Array.from(
        { length: 16 },
        (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
      ),
    )
    expect(parsed.historicalV116.protectedFiles).toEqual(protectedV116Files)
    expect(runtimeAbi.validateRuntimeAbiV117Contract()).toEqual([])
  })
})

describe("runtime ABI v1.17 pure budget ledger", () => {
  it("creates closed immutable execution and preflight domains", async () => {
    const runtimeAbi = await subject()
    const execution = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const preflight =
      runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")

    expect(execution).toMatchObject({
      schemaVersion: "runtime-budget-ledger-v1",
      domain: "execution",
      revision: 0,
      methodInvocations: { selectActivations: 0, soldierBrain: 0 },
      cumulative: {
        invocationCount: 0,
        wallMilliseconds: 0,
        computeFuel: 0,
        payloadBytes: 0,
        stdoutBytes: 0,
        stderrBytes: 0,
        memoryBytes: 0,
      },
      commitments: [],
    })
    expect(preflight).toMatchObject({
      schemaVersion: "runtime-budget-ledger-v1",
      domain: "preflight",
      profile: "compilation",
      revision: 0,
      cumulative: {
        operationCount: 0,
        wallMilliseconds: 0,
        computeFuel: 0,
        inputBytes: 0,
        outputBytes: 0,
        stderrBytes: 0,
        memoryBytes: 0,
      },
      commitments: [],
    })
    expect(Object.isFrozen(execution)).toBe(true)
    expect(Object.isFrozen(execution.cumulative)).toBe(true)
    expect(Object.isFrozen(execution.commitments)).toBe(true)
    expect(Object.isFrozen(preflight)).toBe(true)
  })

  it.each([
    ["wallMilliseconds", 50, "invocation.wall"],
    ["computeFuel", 10_000_000, "invocation.compute"],
    ["payloadBytes", 262_144, "invocation.payload"],
    ["stdoutBytes", 262_144, "invocation.stdout"],
    ["stderrBytes", 65_536, "invocation.stderr"],
  ] as const)(
    "accepts exact %s and commits positively proven one-over once",
    async (counter, maximum, dimension) => {
      const runtimeAbi = await subject()
      const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
      const exact = runtimeAbi.debitRuntimeAbiV117Ledger(
        initial,
        executionReceipt(initial, { deltas: { [counter]: maximum } }),
      )
      expect(exact).toMatchObject({
        kind: "success",
        committed: true,
        replayed: false,
      })
      expect(exact.ledger.cumulative[counter]).toBe(maximum)

      const over = runtimeAbi.debitRuntimeAbiV117Ledger(
        initial,
        executionReceipt(initial, { deltas: { [counter]: maximum + 1 } }),
      )
      expect(over).toMatchObject({
        kind: "player_violation",
        committed: true,
        replayed: false,
        violation: { code: "RUNTIME_BUDGET_EXCEEDED" },
      })
      if (over.kind === "player_violation") {
        expect(over.violation.dimensions).toContain(dimension)
      }
      expect(over.ledger.cumulative[counter]).toBe(maximum + 1)
    },
  )

  it("uses max for memory peaks and never sums them", async () => {
    const runtimeAbi = await subject()
    const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const first = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      executionReceipt(initial, {
        invocationId: "invocation:memory:1",
        memoryBytes: 64 * 1024 * 1024,
      }),
    )
    expect(first.kind).toBe("success")
    expect(first.ledger.cumulative.memoryBytes).toBe(64 * 1024 * 1024)

    const lower = runtimeAbi.debitRuntimeAbiV117Ledger(
      first.ledger,
      executionReceipt(first.ledger, {
        invocationId: "invocation:memory:2",
        requestIdentity: ledgerHash("e"),
        evidenceIdentity: ledgerHash("f"),
        memoryBytes: 32 * 1024 * 1024,
      }),
    )
    expect(lower.kind).toBe("success")
    expect(lower.ledger.cumulative.memoryBytes).toBe(64 * 1024 * 1024)

    const over = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      executionReceipt(initial, { memoryBytes: 64 * 1024 * 1024 + 1 }),
    )
    expect(over).toMatchObject({
      kind: "player_violation",
      violation: { dimensions: ["invocation.memory", "match.memory"] },
    })
  })

  it("commits proven execution process excess but keeps host excess no-commit", async () => {
    const runtimeAbi = await subject()
    const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const exactReceipt = executionReceipt(initial)

    expect(
      runtimeAbi.debitRuntimeAbiV117Ledger(initial, exactReceipt),
    ).toMatchObject({ kind: "success", committed: true })

    for (const process of [
      { ...exactReceipt.process, processes: 2 },
      { ...exactReceipt.process, threads: 2 },
      { ...exactReceipt.process, children: 1 },
    ]) {
      const proven = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        process,
      })
      expect(proven).toMatchObject({
        kind: "player_violation",
        committed: true,
        violation: { dimensions: ["invocation.process"] },
        ledger: { revision: 1 },
      })
      const host = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        attribution: "host",
        process,
      })
      expect(host).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: {
          code: "HOST_RESOURCE_EXCESS",
          dimension: "invocation.process",
        },
      })
      expect(host.ledger).toBe(initial)
      const ambiguous = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        attribution: "ambiguous",
        process,
      })
      expect(ambiguous).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: "METER_EVIDENCE_AMBIGUOUS" },
      })
      expect(ambiguous.ledger).toBe(initial)
    }
  })

  it("treats capability, cancellation and accounting predicate drift as host enforcement failure", async () => {
    const runtimeAbi = await subject()
    const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const exactReceipt = executionReceipt(initial)
    const exact = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
      ...exactReceipt,
      cancellation: {
        status: "verified",
        terminationRequired: true,
        receiptPresent: true,
        graceMilliseconds: 100,
      },
    })
    expect(exact.kind).toBe("success")

    for (const [dimension, receipt] of [
      [
        "invocation.capabilities",
        {
          ...exactReceipt,
          capabilities: {
            ...exactReceipt.capabilities,
            filesystem: "read-only",
          },
        },
      ],
      [
        "invocation.capabilities",
        {
          ...exactReceipt,
          capabilities: {
            ...exactReceipt.capabilities,
            network: "inherited",
          },
        },
      ],
      [
        "invocation.capabilities",
        {
          ...exactReceipt,
          capabilities: {
            ...exactReceipt.capabilities,
            environment: "minimal",
          },
        },
      ],
      [
        "invocation.capabilities",
        {
          ...exactReceipt,
          capabilities: { ...exactReceipt.capabilities, shell: "enabled" },
        },
      ],
    ] as const) {
      const result = runtimeAbi.debitRuntimeAbiV117Ledger(initial, receipt)
      expect(result, dimension).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { dimension },
      })
      expect(result.ledger).toBe(initial)
    }

    for (const receipt of [
      {
        ...exactReceipt,
        cancellation: {
          status: "verified" as const,
          terminationRequired: true,
          receiptPresent: true,
          graceMilliseconds: 101,
        },
      },
      {
        ...exactReceipt,
        accountingEvidence: {
          status: "verified" as const,
          signatureVerified: false,
          monotonic: true,
        },
      },
    ]) {
      const result = runtimeAbi.debitRuntimeAbiV117Ledger(initial, receipt)
      expect(result).toMatchObject({
        kind: "system_failure",
        committed: false,
      })
      expect(result.ledger).toBe(initial)
    }
  })

  it("reaches exact method and Match maxima then stops before scheduling the next debit", async () => {
    const runtimeAbi = await subject()
    let ledger = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const maxima = {
      wallMilliseconds: 50,
      computeFuel: 10_000_000,
      payloadBytes: 262_144,
      stdoutBytes: 262_144,
      stderrBytes: 65_536,
    } as const

    for (let index = 0; index < 260; index += 1) {
      const result = runtimeAbi.debitRuntimeAbiV117Ledger(
        ledger,
        executionReceipt(ledger, {
          invocationId: `invocation:maximum:${index}`,
          requestIdentity: `sha256:${index.toString(16).padStart(64, "0")}`,
          evidenceIdentity: `sha256:${(index + 300).toString(16).padStart(64, "0")}`,
          method: index < 20 ? "selectActivations" : "soldierBrain",
          deltas: maxima,
          memoryBytes: 64 * 1024 * 1024,
        }),
      )
      expect(result.kind, String(index)).toBe("success")
      ledger = result.ledger
    }

    expect(ledger.methodInvocations).toEqual({
      selectActivations: 20,
      soldierBrain: 240,
    })
    expect(ledger.cumulative).toEqual({
      invocationCount: 260,
      wallMilliseconds: 13_000,
      computeFuel: 2_600_000_000,
      payloadBytes: 68_157_440,
      stdoutBytes: 68_157_440,
      stderrBytes: 17_039_360,
      memoryBytes: 67_108_864,
    })

    const over = runtimeAbi.debitRuntimeAbiV117Ledger(
      ledger,
      executionReceipt(ledger, {
        invocationId: "invocation:maximum:260",
        requestIdentity: ledgerHash("7"),
        evidenceIdentity: ledgerHash("8"),
        method: "soldierBrain",
        deltas: {
          wallMilliseconds: 1,
          computeFuel: 1,
          payloadBytes: 1,
          stdoutBytes: 1,
          stderrBytes: 1,
        },
      }),
    )
    expect(over).toMatchObject({
      kind: "system_failure",
      committed: false,
      replayed: false,
      failure: {
        code: "LEDGER_CAPACITY_EXHAUSTED",
        dimension: "method.soldierBrain.invocationCount",
      },
    })
    expect(over.ledger).toBe(ledger)
  })

  it("fails missing, unavailable, ambiguous, decreasing and host-owned evidence without mutation", async () => {
    const runtimeAbi = await subject()
    const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const valid = executionReceipt(initial)
    const { computeFuel: _missing, ...missingCounters } = valid.counters
    const cases = [
      {
        name: "missing",
        receipt: { ...valid, counters: missingCounters },
        code: "METER_EVIDENCE_MISSING",
      },
      {
        name: "unavailable",
        receipt: {
          ...valid,
          counters: {
            ...valid.counters,
            computeFuel: { status: "unavailable" as const },
          },
        },
        code: "METER_EVIDENCE_UNAVAILABLE",
      },
      {
        name: "ambiguous",
        receipt: { ...valid, attribution: "ambiguous" as const },
        code: "METER_EVIDENCE_AMBIGUOUS",
      },
      {
        name: "host-owned excess",
        receipt: executionReceipt(initial, {
          attribution: "host",
          deltas: { wallMilliseconds: 51 },
        }),
        code: "HOST_RESOURCE_EXCESS",
      },
    ] as const
    for (const testCase of cases) {
      const result = runtimeAbi.debitRuntimeAbiV117Ledger(
        initial,
        testCase.receipt,
      )
      expect(result, testCase.name).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: testCase.code },
      })
      expect(result.ledger, testCase.name).toBe(initial)
    }

    const first = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      executionReceipt(initial, {
        invocationId: "invocation:decreasing:1",
        deltas: { wallMilliseconds: 10 },
      }),
    )
    const decreasing = executionReceipt(first.ledger, {
      invocationId: "invocation:decreasing:2",
      requestIdentity: ledgerHash("9"),
      evidenceIdentity: ledgerHash("0"),
    })
    const result = runtimeAbi.debitRuntimeAbiV117Ledger(first.ledger, {
      ...decreasing,
      counters: {
        ...decreasing.counters,
        wallMilliseconds: {
          status: "measured",
          delta: 0,
          cumulative: 9,
        },
      },
    })
    expect(result).toMatchObject({
      kind: "system_failure",
      failure: { code: "METER_ACCOUNTING_DECREASING" },
      committed: false,
    })
    expect(result.ledger).toBe(first.ledger)
  })

  it("commits success and proven violation once by invocation identity", async () => {
    const runtimeAbi = await subject()
    const initial = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const successReceipt = executionReceipt(initial, {
      invocationId: "invocation:idempotent:success",
      deltas: { wallMilliseconds: 1 },
    })
    const success = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      successReceipt,
    )
    const successRetry = runtimeAbi.debitRuntimeAbiV117Ledger(
      success.ledger,
      successReceipt,
    )
    expect(successRetry).toMatchObject({
      kind: "success",
      committed: false,
      replayed: true,
    })
    expect(successRetry.ledger).toBe(success.ledger)

    const violationReceipt = executionReceipt(initial, {
      invocationId: "invocation:idempotent:violation",
      deltas: { wallMilliseconds: 51 },
    })
    const violation = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      violationReceipt,
    )
    const violationRetry = runtimeAbi.debitRuntimeAbiV117Ledger(
      violation.ledger,
      violationReceipt,
    )
    expect(violationRetry).toMatchObject({
      kind: "player_violation",
      committed: false,
      replayed: true,
    })
    expect(violationRetry.ledger).toBe(violation.ledger)

    const conflict = runtimeAbi.debitRuntimeAbiV117Ledger(success.ledger, {
      ...successReceipt,
      requestIdentity: ledgerHash("f"),
    })
    expect(conflict).toMatchObject({
      kind: "system_failure",
      committed: false,
      failure: { code: "LEDGER_IDENTITY_CONFLICT" },
    })
    expect(conflict.ledger).toBe(success.ledger)

    const stale = runtimeAbi.debitRuntimeAbiV117Ledger(
      success.ledger,
      executionReceipt(initial, {
        invocationId: "invocation:stale",
        requestIdentity: ledgerHash("1"),
        evidenceIdentity: ledgerHash("2"),
      }),
    )
    expect(stale).toMatchObject({
      kind: "system_failure",
      failure: { code: "LEDGER_PRESTATE_MISMATCH" },
    })
  })

  it.each([
    ["wallMilliseconds", 90_000, "preflight.compilation.wall"],
    ["computeFuel", 2_000_000_000, "preflight.compilation.compute"],
    ["inputBytes", 262_144, "preflight.compilation.input"],
    ["outputBytes", 4_194_304, "preflight.compilation.output"],
    ["stderrBytes", 65_536, "preflight.compilation.stderr"],
  ] as const)(
    "enforces exact separate preflight %s without touching execution",
    async (counter, maximum, dimension) => {
      const runtimeAbi = await subject()
      const execution = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
      const preflight =
        runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")
      const exact = runtimeAbi.debitRuntimeAbiV117Ledger(
        preflight,
        preflightReceipt(preflight, { deltas: { [counter]: maximum } }),
      )
      expect(exact.kind).toBe("success")
      expect(exact.ledger.cumulative[counter]).toBe(maximum)
      expect(execution.cumulative.invocationCount).toBe(0)

      const over = runtimeAbi.debitRuntimeAbiV117Ledger(
        preflight,
        preflightReceipt(preflight, { deltas: { [counter]: maximum + 1 } }),
      )
      expect(over.kind).toBe("player_violation")
      if (over.kind === "player_violation") {
        expect(over.violation.dimensions).toContain(dimension)
      }
    },
  )

  it("enforces preflight memory but treats containment drift as a system failure", async () => {
    const runtimeAbi = await subject()
    const initial =
      runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")
    const exactReceipt = preflightReceipt(initial, {
      memoryBytes: 512 * 1024 * 1024,
    })
    expect(
      runtimeAbi.debitRuntimeAbiV117Ledger(initial, exactReceipt).kind,
    ).toBe("success")

    const memoryOver = runtimeAbi.debitRuntimeAbiV117Ledger(
      initial,
      preflightReceipt(initial, { memoryBytes: 512 * 1024 * 1024 + 1 }),
    )
    expect(memoryOver).toMatchObject({
      kind: "player_violation",
      violation: { dimensions: ["preflight.compilation.memory"] },
    })

    for (const [dimension, receipt] of [
      [
        "preflight.compilation.capabilities",
        {
          ...exactReceipt,
          capabilities: { ...exactReceipt.capabilities, network: "inherited" },
        },
      ],
      [
        "preflight.compilation.capabilities",
        {
          ...exactReceipt,
          capabilities: {
            ...exactReceipt.capabilities,
            filesystem: "host",
          },
        },
      ],
    ] as const) {
      const result = runtimeAbi.debitRuntimeAbiV117Ledger(initial, receipt)
      expect(result, dimension).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { dimension },
      })
      expect(result.ledger).toBe(initial)
    }
  })

  it("commits proven preflight process excess but keeps host excess no-commit", async () => {
    const runtimeAbi = await subject()
    const initial =
      runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")
    const exactReceipt = preflightReceipt(initial)
    expect(
      runtimeAbi.debitRuntimeAbiV117Ledger(initial, exactReceipt),
    ).toMatchObject({ kind: "success", committed: true })

    for (const process of [
      { ...exactReceipt.process, processes: 2 },
      { ...exactReceipt.process, threads: 9 },
      { ...exactReceipt.process, children: 1 },
    ]) {
      const proven = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        process,
      })
      expect(proven).toMatchObject({
        kind: "player_violation",
        committed: true,
        violation: { dimensions: ["preflight.compilation.process"] },
        ledger: { revision: 1 },
      })
      const host = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        attribution: "host",
        process,
      })
      expect(host).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: {
          code: "HOST_RESOURCE_EXCESS",
          dimension: "preflight.compilation.process",
        },
      })
      expect(host.ledger).toBe(initial)
      const ambiguous = runtimeAbi.debitRuntimeAbiV117Ledger(initial, {
        ...exactReceipt,
        attribution: "ambiguous",
        process,
      })
      expect(ambiguous).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: "METER_EVIDENCE_AMBIGUOUS" },
      })
      expect(ambiguous.ledger).toBe(initial)
    }
  })

  it("runtime-validates closed ledger and receipt shapes without throwing", async () => {
    const runtimeAbi = await subject()
    const validLedger = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const validReceipt = executionReceipt(validLedger)

    const malformedLedgers = [
      { ...cloneLedgerValue(validLedger), unexpected: true },
      {
        ...cloneLedgerValue(validLedger),
        revision: Number.MAX_SAFE_INTEGER,
      },
      {
        ...cloneLedgerValue(validLedger),
        cumulative: {
          ...validLedger.cumulative,
          invocationCount: Number.MAX_SAFE_INTEGER,
        },
      },
      {
        ...cloneLedgerValue(validLedger),
        revision: 2,
        methodInvocations: { selectActivations: 2, soldierBrain: 0 },
        cumulative: {
          ...validLedger.cumulative,
          invocationCount: 2,
        },
        commitments: [
          {
            identity: "duplicate",
            requestIdentity: ledgerHash("1"),
            evidenceIdentity: ledgerHash("2"),
            prestateRevision: 0,
            scope: "selectActivations",
            outcome: "success",
            dimensions: [],
          },
          {
            identity: "duplicate",
            requestIdentity: ledgerHash("3"),
            evidenceIdentity: ledgerHash("4"),
            prestateRevision: 1,
            scope: "selectActivations",
            outcome: "success",
            dimensions: [],
          },
        ],
      },
      {
        ...cloneLedgerValue(validLedger),
        revision: 1,
        methodInvocations: { selectActivations: 1, soldierBrain: 0 },
        cumulative: {
          ...validLedger.cumulative,
          invocationCount: 1,
        },
        commitments: [
          {
            identity: "malformed",
            requestIdentity: ledgerHash("5"),
            evidenceIdentity: ledgerHash("6"),
            prestateRevision: 0,
            scope: "selectActivations",
            outcome: "success",
            dimensions: [],
            unexpected: true,
          },
        ],
      },
    ]
    for (const ledger of malformedLedgers) {
      let result: ReturnType<typeof runtimeAbi.debitRuntimeAbiV117Ledger>
      expect(() => {
        result = runtimeAbi.debitRuntimeAbiV117Ledger(
          ledger as never,
          validReceipt,
        )
      }).not.toThrow()
      expect(result!).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: "LEDGER_SCHEMA_INVALID" },
      })
      expect(result!.ledger).toBe(ledger)
    }

    const malformedReceipts = [
      { ...validReceipt, method: "unknownMethod" },
      { ...validReceipt, attribution: "unknownAttribution" },
      { ...validReceipt, unexpected: true },
      {
        ...validReceipt,
        counters: {
          ...validReceipt.counters,
          wallMilliseconds: {
            status: "measured",
            delta: Number.MAX_SAFE_INTEGER + 1,
            cumulative: Number.MAX_SAFE_INTEGER + 1,
          },
        },
      },
    ]
    for (const receipt of malformedReceipts) {
      let result: ReturnType<typeof runtimeAbi.debitRuntimeAbiV117Ledger>
      expect(() => {
        result = runtimeAbi.debitRuntimeAbiV117Ledger(
          validLedger,
          receipt as never,
        )
      }).not.toThrow()
      expect(result!).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: "RECEIPT_SCHEMA_INVALID" },
      })
      expect(result!.ledger).toBe(validLedger)
    }

    const preflight =
      runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")
    const unknownProfile = {
      ...preflightReceipt(preflight),
      profile: "unknownProfile",
    }
    expect(() =>
      runtimeAbi.debitRuntimeAbiV117Ledger(preflight, unknownProfile as never),
    ).not.toThrow()
    expect(
      runtimeAbi.debitRuntimeAbiV117Ledger(preflight, unknownProfile as never),
    ).toMatchObject({
      kind: "system_failure",
      committed: false,
      failure: { code: "RECEIPT_SCHEMA_INVALID" },
    })
  })

  it("covers explicit fixed limits for every preflight profile", async () => {
    const runtimeAbi = await subject()
    for (const profile of [
      "sourceValidation",
      "compilation",
      "artifactValidation",
      "conformance",
    ] as const) {
      const ledger = runtimeAbi.createRuntimeAbiV117PreflightLedger(profile)
      expect(ledger.profile).toBe(profile)
      expect(ledger.cumulative.stderrBytes).toBe(0)
      expect(ledger.cumulative.operationCount).toBe(0)
      const debit = runtimeAbi.debitRuntimeAbiV117Ledger(
        ledger,
        preflightReceipt(ledger),
      )
      expect(debit.kind, profile).toBe("success")
    }
  })

  it("rejects cross-domain, profile drift and preflight refill attempts", async () => {
    const runtimeAbi = await subject()
    const execution = runtimeAbi.createRuntimeAbiV117ExecutionLedger()
    const preflight =
      runtimeAbi.createRuntimeAbiV117PreflightLedger("compilation")
    const crossToExecution = runtimeAbi.debitRuntimeAbiV117Ledger(
      execution,
      preflightReceipt(preflight),
    )
    const crossToPreflight = runtimeAbi.debitRuntimeAbiV117Ledger(
      preflight,
      executionReceipt(execution),
    )
    for (const [state, result] of [
      [execution, crossToExecution],
      [preflight, crossToPreflight],
    ] as const) {
      expect(result).toMatchObject({
        kind: "system_failure",
        committed: false,
        failure: { code: "LEDGER_DOMAIN_MISMATCH" },
      })
      expect(result.ledger).toBe(state)
    }

    const profileDrift = runtimeAbi.debitRuntimeAbiV117Ledger(preflight, {
      ...preflightReceipt(preflight),
      profile: "conformance",
    })
    expect(profileDrift).toMatchObject({
      kind: "system_failure",
      failure: { code: "LEDGER_DOMAIN_MISMATCH" },
    })

    const committed = runtimeAbi.debitRuntimeAbiV117Ledger(
      preflight,
      preflightReceipt(preflight, { operationId: "preflight:committed" }),
    )
    const stale = runtimeAbi.debitRuntimeAbiV117Ledger(
      committed.ledger,
      preflightReceipt(preflight, { operationId: "preflight:stale" }),
    )
    expect(stale).toMatchObject({
      kind: "system_failure",
      failure: { code: "LEDGER_PRESTATE_MISMATCH" },
    })
    expect(stale.ledger).toBe(committed.ledger)
  })
})
