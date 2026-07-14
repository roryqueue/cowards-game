import { spawnSync, type SpawnSyncReturns } from "node:child_process"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import type { RuntimeResult } from "@cowards/engine"
import {
  RUNTIME_ABI_V1_17,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  createAuthenticatedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  encodeCanonicalJson,
  serializeRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationSigningIdentityV117,
  type StrategyInput,
} from "@cowards/spec"
import type { StrategyExecutionAdapter } from "./adapter.js"
import {
  activeStrategyExecutionAdapter,
  getStrategyExecutionAdapterMetadata,
  workerThreadStrategyExecutionAdapterMetadata,
} from "./adapter.js"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { transpileStrategySource } from "./transpile.js"
import { createRuntimeFromRevision } from "./executor.js"
import { executeStrategyRuntimeAbiV114 } from "./abi-bridge.js"
import { buildStrategyRevision } from "./revision.js"
import { hashStrategySource } from "./hash.js"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"
import { createContainerSubprocessStrategyExecutionAdapter } from "./container-subprocess-adapter.js"
import { CANDIDATE_BOUNDED_CANONICAL_SOURCE } from "./candidate-bounded-canonical-source.js"

const validStrategySource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: { adapter: "worker-thread" },
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { cycle: input.cycleIndex },
    }
  },
}
`

const transpiledSource = (): string => {
  const transpiled = transpileStrategySource(validStrategySource)
  if (!transpiled.ok) {
    throw new Error(transpiled.message)
  }
  return transpiled.code
}

const transpileOrThrow = (source: string): string => {
  const transpiled = transpileStrategySource(source)
  if (!transpiled.ok) {
    throw new Error(transpiled.message)
  }
  return transpiled.code
}

const runtimeInput: StrategyInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [
      {
        id: "bottom-1",
        ownerPlayerId: "bottom",
        status: "ACTIVE",
        position: { x: 5, y: 10 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
    ],
    terrainStones: [],
  },
  mySoldiers: [
    {
      id: "bottom-1",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 5, y: 10 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  enemySoldiers: [],
  strategyMemory: {},
}

const candidateIdentity: RuntimeInvocationSigningIdentityV117 = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:runtime-js-v1.17:host-secret",
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const candidateRequest = (
  overrides: Partial<{
    input: StrategyInput
    artifactSource: string
  }> = {},
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:runtime-js:v1.17:0001",
      invocationId: "invocation:runtime-js:v1.17:0001",
      kernelRequestId: "kernel-request:runtime-js:v1.17:0001",
      method: "selectActivations",
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:runtime-js:v1.17:bottom",
        originalSourceSha256: sha256(new TextEncoder().encode(validStrategySource)),
        normalizedSourceSha256: sha256(
          new TextEncoder().encode(validStrategySource),
        ),
        artifactSha256: sha256(
          new TextEncoder().encode(
            overrides.artifactSource ?? transpiledSource(),
          ),
        ),
      },
      budget: createRuntimeInvocationBudgetV117("selectActivations"),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
      input: { value: (overrides.input ?? runtimeInput) as unknown as JsonValue },
      retry: {
        retryId: "retry:runtime-js:v1.17:0001",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    candidateIdentity,
  )

type CandidateAdapter = {
  executeV117(input: {
    requestBytes: Uint8Array
    executableSource: string
    signingIdentity: RuntimeInvocationSigningIdentityV117
    receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117
  }): Uint8Array
}

const completeCandidateEvidence = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  overrides: Partial<{
    attribution: RuntimeInvocationExecutionReceiptEvidenceV117["attribution"]
    wallMilliseconds: number
    computeFuel: number
    payloadBytes: number
    stdoutBytes: number
    stderrBytes: number
  }> = {},
): RuntimeInvocationExecutionReceiptEvidenceV117 => {
  const prestate = request.accounting.prestate
  const deltas = {
    wallMilliseconds: overrides.wallMilliseconds ?? 1,
    computeFuel: overrides.computeFuel ?? 1,
    payloadBytes: overrides.payloadBytes ?? 1,
    stdoutBytes: overrides.stdoutBytes ?? 1,
    stderrBytes: overrides.stderrBytes ?? 0,
  }
  const counters = Object.fromEntries(
    Object.entries(deltas).map(([counter, delta]) => [
      counter,
      {
        status: "measured" as const,
        delta,
        cumulative:
          prestate.cumulative[
            counter as keyof typeof prestate.cumulative
          ] + delta,
      },
    ]),
  ) as RuntimeInvocationExecutionReceiptEvidenceV117["counters"]
  return {
    attribution: overrides.attribution ?? "proven_strategy",
    counters,
    memory: {
      status: "measured",
      peakBytes: 1,
      cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
    },
    process: {
      status: "verified",
      processes: 1,
      threads: 1,
      children: 0,
    },
    capabilities: {
      status: "verified",
      filesystem: "none",
      network: "disabled",
      environment: "empty",
      shell: "disabled",
    },
    cancellation: {
      status: "verified",
      terminationRequired: false,
      receiptPresent: false,
      graceMilliseconds: 0,
    },
    accountingEvidence: {
      status: "verified",
      signatureVerified: true,
      monotonic: true,
    },
  }
}

const executeCandidate = (
  adapter: StrategyExecutionAdapter,
  request = candidateRequest(),
) => executeCandidateWith(adapter, request, transpiledSource())

const executeCandidateWith = (
  adapter: StrategyExecutionAdapter,
  request: AuthenticatedRuntimeInvocationRequestV117,
  executableSource: string,
  receiptEvidence: RuntimeInvocationExecutionReceiptEvidenceV117 | undefined =
    completeCandidateEvidence(request),
) => {
  const responseBytes = (adapter as unknown as CandidateAdapter).executeV117({
    requestBytes: serializeRuntimeInvocationRequestV117(request),
    executableSource,
    signingIdentity: candidateIdentity,
    ...(receiptEvidence === undefined ? {} : { receiptEvidence }),
  })
  return verifyRuntimeInvocationResponseV117(
    responseBytes,
    request,
    candidateIdentity,
  )
}

const executeCandidateWithoutEvidence = (
  adapter: StrategyExecutionAdapter,
  request = candidateRequest(),
) => {
  const responseBytes = (adapter as unknown as CandidateAdapter).executeV117({
    requestBytes: serializeRuntimeInvocationRequestV117(request),
    executableSource: transpiledSource(),
    signingIdentity: candidateIdentity,
  })
  return verifyRuntimeInvocationResponseV117(
    responseBytes,
    request,
    candidateIdentity,
  )
}

const invalidOutputStrategySource = `
export default {
  selectActivations() {
    return { activationOrders: "bad", strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const timeoutStrategySource = `
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const adapterFactories: readonly {
  label: string
  createAdapter: () => StrategyExecutionAdapter
}[] = [
  {
    label: "worker-thread",
    createAdapter: createWorkerThreadStrategyExecutionAdapter,
  },
  {
    label: "subprocess",
    createAdapter: createSubprocessStrategyExecutionAdapter,
  },
]

describe("StrategyExecutionAdapter contract", () => {
  it("exposes worker-thread default metadata and active adapter helpers", () => {
    expect(workerThreadStrategyExecutionAdapterMetadata).toMatchObject({
      id: "worker-thread",
      default: true,
      runtimeControls: {
        timeout: true,
        outputByteLimit: true,
        environment: "empty",
        execArgv: "empty",
      },
    })
    expect(workerThreadStrategyExecutionAdapterMetadata.label).toContain(
      "worker",
    )
    expect(
      workerThreadStrategyExecutionAdapterMetadata.isolationBoundary,
    ).toContain("Default compatibility containment")
    expect(activeStrategyExecutionAdapter).toBe(
      workerThreadStrategyExecutionAdapterMetadata,
    )
    expect(getStrategyExecutionAdapterMetadata()).toBe(
      workerThreadStrategyExecutionAdapterMetadata,
    )
  })

  it("exports active adapter metadata from the executable worker entrypoint", async () => {
    const workerEntrypoint = await import("./worker.js")

    expect(workerEntrypoint.activeStrategyExecutionAdapter.id).toBe(
      "worker-thread",
    )
    expect(workerEntrypoint.getStrategyExecutionAdapterMetadata().default).toBe(
      true,
    )
  })

  it("describes worker threads as containment, not the final sandbox", () => {
    const metadataText = [
      workerThreadStrategyExecutionAdapterMetadata.isolationBoundary,
      ...workerThreadStrategyExecutionAdapterMetadata.notes,
    ].join(" ")

    expect(metadataText).toMatch(/prototype boundary/i)
    expect(metadataText).toMatch(/not a final sandbox/i)
    expect(metadataText).not.toMatch(/is a final sandbox/i)
  })

  it("accepts source, methodName, input, timeout, and output cap options", () => {
    const adapter = {
      metadata: {
        id: "contract-test",
        label: "Contract test adapter",
        default: false,
        isolationBoundary: "In-memory test double.",
        notes: [],
        runtimeControls: {
          timeout: true,
          outputByteLimit: true,
          environment: "minimal",
          execArgv: "empty",
          resourceLimits: [],
        },
      },
      execute(request) {
        expect(request.source).toBe("source text")
        expect(request.methodName).toBe("soldierBrain")
        expect(request.input).toEqual({ cycleIndex: 1 })
        expect(request.timeoutMs).toBe(25)
        expect(request.outputByteLimit).toBe(512)
        return { ok: true, value: { accepted: true } }
      },
    } satisfies StrategyExecutionAdapter

    const result: RuntimeResult<unknown> = adapter.execute({
      source: "source text",
      methodName: "soldierBrain",
      input: { cycleIndex: 1 },
      timeoutMs: 25,
      outputByteLimit: 512,
    })

    expect(result).toEqual({ ok: true, value: { accepted: true } })
    expect(getStrategyExecutionAdapterMetadata(adapter)).toBe(adapter.metadata)
  })

  it("runs adapter calls through the v1.14 ABI conformance bridge", () => {
    const revision = buildStrategyRevision({ source: validStrategySource })
    const adapter = {
      metadata: workerThreadStrategyExecutionAdapterMetadata,
      execute(request) {
        expect(request.methodName).toBe("selectActivations")
        expect(request.input).toEqual(runtimeInput)
        expect(request.source).toBe(transpileOrThrow(validStrategySource))
        expect(hashStrategySource(revision.source)).toBe(revision.sourceHash)
        return {
          ok: true,
          value: { activationOrders: [], strategyMemory: {} },
        }
      },
    } satisfies StrategyExecutionAdapter

    expect(
      executeStrategyRuntimeAbiV114({
        adapter,
        revision,
        executableSource: transpileOrThrow(validStrategySource),
        methodName: "selectActivations",
        input: runtimeInput,
        timeoutMs: 25,
        outputByteLimit: 512,
      }),
    ).toEqual({ ok: true, value: { activationOrders: [], strategyMemory: {} } })
  })

  it("preserves system failure classification through the v1.14 ABI bridge", () => {
    const revision = buildStrategyRevision({ source: validStrategySource })
    const adapter = {
      metadata: workerThreadStrategyExecutionAdapterMetadata,
      execute: () => ({
        ok: false as const,
        violation: {
          type: "THROWN_EXCEPTION" as const,
          message: "Runtime system failure.",
        },
        systemFailure: {
          code: "MALFORMED_IPC",
          retryable: true,
        },
      }),
    } satisfies StrategyExecutionAdapter

    const result = executeStrategyRuntimeAbiV114({
      adapter,
      revision,
      executableSource: transpileOrThrow(validStrategySource),
      methodName: "selectActivations",
      input: runtimeInput,
      timeoutMs: 25,
      outputByteLimit: 512,
    })

    expect(result).toMatchObject({
      ok: false,
      systemFailure: { code: "MALFORMED_IPC", retryable: true },
    })
  })

  it("worker-thread adapter delegates valid calls to the worker bridge", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpiledSource(),
      methodName: "selectActivations",
      input: {
        activationCount: 1,
        mySoldiers: [{ id: "bottom-1" }],
      },
      timeoutMs: 1_000,
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toEqual({
      activationOrders: [
        { objective: { target: "bottom-1" }, soldierId: "bottom-1" },
      ],
      strategyMemory: { adapter: "worker-thread" },
    })
  })

  it("worker-thread adapter keeps timeout behavior mapped to TIMEOUT", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    while (true) {}
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("TIMEOUT")
  })

  it("worker-thread adapter enforces output byte caps before host normalization", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: "x".repeat(2048) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1_000,
      outputByteLimit: 128,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("OVERSIZED_OUTPUT")
  })

  it("worker-thread adapter rejects cloneable non-JSON output before posting to host", () => {
    const adapter = createWorkerThreadStrategyExecutionAdapter()

    const result = adapter.execute({
      source: transpileOrThrow(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: new ArrayBuffer(1024 * 1024) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
      methodName: "selectActivations",
      input: {},
      timeoutMs: 1_000,
      outputByteLimit: 128,
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
  })

  for (const adapterFactory of adapterFactories) {
    describe(`${adapterFactory.label} runtime contract`, () => {
      it.each([
        ["crypto.randomUUID()", "crypto.randomUUID()"],
        ["performance.now()", "performance.now()"],
        ["Buffer.from", 'Buffer.from("abc")'],
      ])(
        "blocks nondeterministic global %s at the adapter boundary",
        (_label, expression) => {
          const adapter = adapterFactory.createAdapter()

          const result = adapter.execute({
            source: transpileOrThrow(`
export default {
  selectActivations() {
    ${expression}
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`),
            methodName: "selectActivations",
            input: runtimeInput,
            timeoutMs: 1_000,
          })

          expect(result.ok).toBe(false)
          expect(!result.ok && result.violation.type).toBe(
            "FORBIDDEN_CAPABILITY",
          )
        },
      )

      it("returns schema-normalized valid Strategy output", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: validStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 1_000 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result).toEqual({
          ok: true,
          value: {
            activationOrders: [
              { soldierId: "bottom-1", objective: { target: "bottom-1" } },
            ],
            strategyMemory: { adapter: "worker-thread" },
          },
        })
      })

      it("returns player-caused invalid output as a RuntimeResult failure", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: invalidOutputStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 1_000 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result.ok).toBe(false)
        expect(!result.ok && result.violation.type).toBe("INVALID_OUTPUT")
      })

      it("returns player-caused timeout as a RuntimeResult failure", () => {
        const runtime = createRuntimeFromRevision(
          buildStrategyRevision({ source: timeoutStrategySource }),
          { adapter: adapterFactory.createAdapter(), timeoutMs: 10 },
        )

        const result = runtime.selectActivations(runtimeInput)

        expect(result.ok).toBe(false)
        expect(!result.ok && result.violation.type).toBe("TIMEOUT")
      })
    })
  }

  it("keeps subprocess infrastructure failures in the system-failure channel", () => {
    const adapter = createSubprocessStrategyExecutionAdapter({
      spawnSync: () =>
        ({
          pid: 123,
          output: ["", "not json", ""],
          stdout: "not json",
          stderr: "",
          status: 0,
          signal: null,
        }) as SpawnSyncReturns<string>,
    })
    const runtime = createRuntimeFromRevision(
      buildStrategyRevision({ source: validStrategySource }),
      { adapter, timeoutMs: 1_000 },
    )

    expect(() => runtime.selectActivations(runtimeInput)).toThrow(
      SubprocessSystemFailure,
    )
    try {
      runtime.selectActivations(runtimeInput)
    } catch (error) {
      expect((error as SubprocessSystemFailure).code).toBe("MALFORMED_IPC")
    }
  })

  describe("inactive v1.17 authenticated raw-byte contract", () => {
    const successFrame = `S${JSON.stringify({
      activationOrders: [
        { objective: { target: "bottom-1" }, soldierId: "bottom-1" },
      ],
      strategyMemory: { adapter: "worker-thread" },
    })}`

    const candidateAdapters = (): readonly {
      label: string
      adapter: StrategyExecutionAdapter
    }[] => [
      {
        label: "worker-thread",
        adapter: createWorkerThreadStrategyExecutionAdapter(),
      },
      {
        label: "subprocess",
        adapter: createSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", successFrame, ""],
              stdout: successFrame,
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      },
      {
        label: "container",
        adapter: createContainerSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", successFrame, ""],
              stdout: successFrame,
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      },
    ]

    it("fails closed without complete host-observed accounting on every TypeScript path", () => {
      const request = candidateRequest()
      for (const { label, adapter } of candidateAdapters()) {
        const result = executeCandidateWithoutEvidence(adapter, request)
        expect(result.kind, label).toBe("success")
        if (result.kind !== "success") continue
        expect(result.value.outcome, label).toMatchObject({
          kind: "system_failure",
          failure: {
            code: "AMBIGUOUS_ATTRIBUTION",
            publicMessage: "Runtime system failure.",
            retryable: false,
          },
        })
        expect(result.value.accounting.disposition, label).toBe("no_commit")
        expect(result.value.accounting.poststate, label).toEqual(
          request.accounting.prestate,
        )
      }
    })

    it.each(["ambiguous", "unavailable", "incomplete"] as const)(
      "observes the guest before failing closed for %s post-execution accounting evidence",
      (posture) => {
        const request = candidateRequest()
        const complete = completeCandidateEvidence(request)
        const receiptEvidence =
          posture === "ambiguous"
            ? { ...complete, attribution: "ambiguous" as const }
            : posture === "unavailable"
              ? {
                  ...complete,
                  counters: {
                    ...complete.counters,
                    computeFuel: { status: "unavailable" as const },
                  },
                }
              : ({
                  ...complete,
                  counters: {
                    wallMilliseconds: complete.counters.wallMilliseconds,
                  },
                } as unknown as RuntimeInvocationExecutionReceiptEvidenceV117)
        let calls = 0
        const adapter = createSubprocessStrategyExecutionAdapter({
          spawnSync: () => {
            calls += 1
            return {
              pid: 123,
              output: ["", successFrame, ""],
              stdout: successFrame,
              stderr: "",
              status: 0,
              signal: null,
            } as SpawnSyncReturns<string>
          },
        })
        const result = executeCandidateWith(
          adapter,
          request,
          transpiledSource(),
          receiptEvidence,
        )
        expect(result).toMatchObject({
          kind: "success",
          value: {
            outcome: {
              kind: "system_failure",
              failure: { code: "AMBIGUOUS_ATTRIBUTION", retryable: false },
            },
            accounting: {
              disposition: "no_commit",
              poststate: request.accounting.prestate,
            },
          },
        })
        expect(result.kind).toBe("success")
        if (result.kind === "success") {
          expect(result.value.outcome.trace.safeCodes).toEqual(
            expect.arrayContaining([
              "PAYLOAD_SCHEMA_VALID",
              "ACCOUNTING_EVIDENCE_REJECTED",
              "AMBIGUOUS_ATTRIBUTION",
            ]),
          )
        }
        expect(calls).toBe(1)
      },
    )

    it("produces one authenticated byte-identical success with complete host-observed evidence", () => {
      const results = candidateAdapters().map(({ label, adapter }) => ({
        label,
        result: executeCandidate(adapter),
      }))

      for (const { label, result } of results) {
        expect(result.kind, label).toBe("success")
        if (result.kind !== "success") continue
        expect(result.value.outcome, label).toEqual({
          kind: "success",
          value: {
            activationOrders: [
              {
                soldierId: "bottom-1",
                objective: { target: "bottom-1" },
              },
            ],
            strategyMemory: { adapter: "worker-thread" },
          },
          trace: expect.objectContaining({
            requestId: "request:runtime-js:v1.17:0001",
            method: "selectActivations",
            safeCodes: [
              "ADAPTER_AUTHENTICATED",
              "OUTER_BINDINGS_VERIFIED",
              "PAYLOAD_CANONICAL",
              "PAYLOAD_SCHEMA_VALID",
            ],
          }),
        })
        expect(Object.keys(result.value.outcome).sort(), label).toEqual([
          "kind",
          "trace",
          "value",
        ])
        expect(result.value.accounting.disposition, label).toBe("commit")
        expect(result.value.accounting.poststate.revision, label).toBe(1)
        expect(
          result.value.accounting.poststate.methodInvocations
            .selectActivations,
          label,
        ).toBe(1)
      }
      expect(
        results.map(({ result }) =>
          result.kind === "success"
            ? result.value.outcome.trace
            : result.trace,
        ),
      ).toEqual([
        results[0]?.result.kind === "success"
          ? results[0].result.value.outcome.trace
          : results[0]?.result.trace,
        results[0]?.result.kind === "success"
          ? results[0].result.value.outcome.trace
          : results[0]?.result.trace,
        results[0]?.result.kind === "success"
          ? results[0].result.value.outcome.trace
          : results[0]?.result.trace,
      ])
    })

    it("keeps the signing secret in the host bridge and out of both guest harnesses", async () => {
      const workerHarness = await import("./worker-harness.js")
      const subprocessHarness = await import("./subprocess-harness.js")
      const successorSources = [
        (workerHarness as Record<string, unknown>).WORKER_HARNESS_V117_SOURCE,
        (subprocessHarness as Record<string, unknown>)
          .SUBPROCESS_HARNESS_V117_SOURCE,
      ]

      expect(successorSources.every((source) => typeof source === "string")).toBe(
        true,
      )
      for (const source of successorSources) {
        expect(source).not.toContain(candidateIdentity.secret)
        expect(source).not.toMatch(/hmac|signingIdentity|signature/iu)
      }
    })

    it("binds the executable artifact and rejects mixed or over-cap guest frames", () => {
      const canonicalPayload = JSON.stringify({
        activationOrders: [],
        strategyMemory: null,
      })
      const calls: unknown[] = []
      const adapterFor = (stdout: string) =>
        createSubprocessStrategyExecutionAdapter({
          spawnSync: (...args) => {
            calls.push(args)
            return {
              pid: 123,
              output: ["", stdout, ""],
              stdout,
              stderr: "",
              status: 0,
              signal: null,
            } as SpawnSyncReturns<string>
          },
        })

      const wrongArtifact = executeCandidateWith(
        adapterFor(`S${canonicalPayload}`),
        candidateRequest(),
        "module.exports.default = { selectActivations() { return {} } }",
      )
      expect(calls).toHaveLength(0)
      expect(wrongArtifact).toMatchObject({
        kind: "success",
        value: {
          outcome: {
            kind: "system_failure",
            failure: { code: "OUTER_FRAME_WRONG_BINDING" },
          },
        },
      })

      const mixedRequest = candidateRequest()
      const mixed = executeCandidateWith(
        adapterFor("Iprivate legacy violation tail"),
        mixedRequest,
        transpiledSource(),
        completeCandidateEvidence(mixedRequest, { attribution: "host" }),
      )
      expect(mixed).toMatchObject({
        kind: "success",
        value: {
          outcome: {
            kind: "system_failure",
            failure: { code: "TRANSPORT_CRASH" },
          },
        },
      })

      const atCap = executeCandidate(
        adapterFor(`S${canonicalPayload}`),
      )
      const overCapRequest = candidateRequest()
      const overCap = executeCandidateWith(
        adapterFor("O"),
        overCapRequest,
        transpiledSource(),
        completeCandidateEvidence(overCapRequest, {
          payloadBytes:
            overCapRequest.budget.methodLimit.counters.payloadBytes.maximum +
            1,
        }),
      )
      expect(atCap).toMatchObject({
        kind: "success",
        value: { outcome: { kind: "success" } },
      })
      expect(overCap).toMatchObject({
        kind: "success",
        value: {
          accounting: { disposition: "commit" },
          outcome: {
            kind: "player_violation",
            violation: { code: "OVERSIZED_OUTPUT" },
          },
        },
      })
    })

    it("enforces the signed stdout frame cap independently from the payload cap", () => {
      const request = candidateRequest()
      const payloadBytes = new Uint8Array(
        request.budget.methodLimit.counters.payloadBytes.maximum,
      )
      payloadBytes.fill(" ".charCodeAt(0))
      const stdout = `S${new TextDecoder().decode(payloadBytes)}`
      const evidence = completeCandidateEvidence(request, {
        payloadBytes: payloadBytes.byteLength,
        stdoutBytes: payloadBytes.byteLength + 1,
      })
      const adapter = createSubprocessStrategyExecutionAdapter({
        spawnSync: () =>
          ({
            pid: 123,
            output: ["", stdout, ""],
            stdout,
            stderr: "",
            status: 0,
            signal: null,
          }) as SpawnSyncReturns<string>,
      })

      const result = executeCandidateWith(
        adapter,
        request,
        transpiledSource(),
        evidence,
      )

      expect(result).toMatchObject({
        kind: "success",
        value: {
          accounting: { disposition: "commit" },
          outcome: {
            kind: "player_violation",
            violation: { code: "OVERSIZED_OUTPUT" },
          },
        },
      })
    })

    it.each([
      ["globalThis.process", "globalThis.process.cwd()"],
      ["Math.random", "Math.random()"],
      [
        "Function constructor",
        '[]["filter"]["con" + "structor"]("return process")()',
      ],
    ])("keeps successor guest capability %s forbidden", (_label, expression) => {
      const source = transpileOrThrow(`
export default {
  selectActivations() {
    ${expression}
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`)
      const request = candidateRequest({ artifactSource: source })
      for (const adapter of [
        createWorkerThreadStrategyExecutionAdapter(),
        createSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", "F", ""],
              stdout: "F",
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      ]) {
        const result = executeCandidateWith(adapter, request, source)
        expect(result.kind, adapter.metadata.id).toBe("success")
        if (result.kind !== "success") continue
        expect(result.value.outcome, adapter.metadata.id).toMatchObject({
          kind: "player_violation",
          violation: {
            code: "FORBIDDEN_CAPABILITY",
            publicMessage: "Strategy attempted a forbidden capability.",
          },
        })
        expect(JSON.stringify(result.value.outcome)).not.toMatch(
          /cwd|process|constructor|stack|source/iu,
        )
      }
    })

    it("keeps successor serialization faults distinct from Strategy exceptions", () => {
      const invalidSource = transpileOrThrow(`
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: new ArrayBuffer(8) }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`)
      const thrownSource = transpileOrThrow(`
export default {
  selectActivations() {
    throw new Error("private Strategy exception detail")
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`)
      for (const [source, expectedCode] of [
        [invalidSource, "INVALID_OUTPUT"],
        [thrownSource, "THROWN_EXCEPTION"],
      ] as const) {
        const request = candidateRequest({ artifactSource: source })
        const tag = expectedCode === "INVALID_OUTPUT" ? "I" : "X"
        for (const adapter of [
          createWorkerThreadStrategyExecutionAdapter(),
          createSubprocessStrategyExecutionAdapter({
            spawnSync: () =>
              ({
                pid: 123,
                output: ["", tag, ""],
                stdout: tag,
                stderr: "",
                status: 0,
                signal: null,
              }) as SpawnSyncReturns<string>,
          }),
        ]) {
          const result = executeCandidateWith(adapter, request, source)
          expect(result.kind, adapter.metadata.id).toBe("success")
          if (result.kind !== "success") continue
          expect(result.value.outcome).toMatchObject({
            kind: "player_violation",
            violation: { code: expectedCode },
          })
          expect(JSON.stringify(result.value.outcome)).not.toMatch(
            /private Strategy|ArrayBuffer|stack|source/iu,
          )
        }
      }
    })

    it("separates the startup watchdog from the signed nested method limit", () => {
      const request = candidateRequest()
      let observedOptions: Record<string, unknown> | undefined
      const adapter = createSubprocessStrategyExecutionAdapter({
        spawnSync: (_command, _args, options) => {
          observedOptions = options as unknown as Record<string, unknown>
          return {
            pid: 123,
            output: ["", successFrame, ""],
            stdout: successFrame,
            stderr: "",
            status: 0,
            signal: null,
          } as SpawnSyncReturns<string>
        },
      })

      const result = executeCandidate(adapter, request)
      expect(result).toMatchObject({
        kind: "success",
        value: { outcome: { kind: "success" } },
      })
      expect(observedOptions?.timeout).toBe(
        RUNTIME_ABI_V1_17.budgets.preflight.profiles.artifactValidation
          .wallMilliseconds +
          request.budget.methodLimit.counters.wallMilliseconds.maximum +
          request.budget.methodLimit.cancellation
            .terminationGraceMilliseconds,
      )
      expect(JSON.parse(String(observedOptions?.input))).toMatchObject({
        methodWallMilliseconds:
          request.budget.methodLimit.counters.wallMilliseconds.maximum,
      })
      expect(observedOptions?.maxBuffer).toBe(
        request.budget.methodLimit.counters.payloadBytes.maximum + 1,
      )
    })

    it(
      "does not spend the signed method budget on valid module startup",
      () => {
        const source = transpileOrThrow(`
let startupAccumulator = 0
for (let index = 0; index < 100_000_000; index += 1) {
  startupAccumulator += index
}
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: startupAccumulator > 0 ? {} : null }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: null }
  },
}
`)
        const request = candidateRequest({ artifactSource: source })
        const result = executeCandidateWith(
          createWorkerThreadStrategyExecutionAdapter(),
          request,
          source,
        )

        expect(result).toMatchObject({
          kind: "success",
          value: {
            outcome: {
              kind: "success",
              value: { activationOrders: [], strategyMemory: {} },
            },
          },
        })
      },
      10_000,
    )

    it("commits a proven N+1 payload violation and never a host guess", () => {
      const source = transpileOrThrow(`
export default {
  selectActivations() {
    const strategyMemory = ["x".repeat(262145)]
    Object.defineProperty(strategyMemory, 1, {
      enumerable: true,
      get() { throw new Error("later value must remain unread") },
    })
    return { activationOrders: [], strategyMemory }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`)
      const request = candidateRequest({ artifactSource: source })
      const evidence = completeCandidateEvidence(request, {
        payloadBytes:
          request.budget.methodLimit.counters.payloadBytes.maximum + 1,
      })
      for (const adapter of [
        createSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", "O", ""],
              stdout: "O",
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
        createContainerSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", "O", ""],
              stdout: "O",
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      ]) {
        const result = executeCandidateWith(adapter, request, source, evidence)
        expect(result).toMatchObject({
          kind: "success",
          value: {
            outcome: {
              kind: "player_violation",
              violation: { code: "OVERSIZED_OUTPUT" },
            },
          },
        })
      }
    })

    it("bounds successor harness encoding and emits system IPC tags", async () => {
      const workerHarness = await import("./worker-harness.js")
      const subprocessHarness = await import("./subprocess-harness.js")
      const sources = [
        workerHarness.WORKER_HARNESS_V117_SOURCE,
        subprocessHarness.SUBPROCESS_HARNESS_V117_SOURCE,
      ]
      for (const source of sources) {
        expect(source).toContain("boundedCanonicalFrame")
        expect(source).not.toMatch(/\.map\(canonical\)|encode\(canonical/iu)
      }

      for (const malformed of ["{", "{}"] as const) {
        const result = spawnSync(
          process.execPath,
          [
            "--input-type=module",
            "--eval",
            subprocessHarness.SUBPROCESS_HARNESS_V117_SOURCE,
          ],
          {
            encoding: "utf8",
            env: { NODE_ENV: "production" },
            input: malformed,
            shell: false,
          },
        )
        expect(result.status).toBe(0)
        expect(result.stdout).toBe("T")
        expect(result.stderr).toBe("")
      }
    })

    it("emits bounded canonical Unicode, escapes, and numbers identically", () => {
      const source = transpileOrThrow(`
export default {
  selectActivations() {
    const strategyMemory = {}
    strategyMemory["𐀀"] = 2
    strategyMemory[""] = {
      escape: 'quote" slash\\\\ line\\n',
      exponent: 1e21,
      negativeZero: -0,
    }
    return { activationOrders: [], strategyMemory }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`)
      const request = candidateRequest({ artifactSource: source })
      const canonicalValue = {
        activationOrders: [],
        strategyMemory: {
          "": {
            escape: 'quote" slash\\ line\n',
            exponent: 1e21,
            negativeZero: 0,
          },
          "𐀀": 2,
        },
      }
      const encoded = encodeCanonicalJson(canonicalValue, {
        context: "decoded-strategy-payload",
      })
      if (!encoded.ok) throw new Error(encoded.error.code)
      const canonicalFrame = `S${new TextDecoder().decode(encoded.bytes)}`
      for (const adapter of [
        createWorkerThreadStrategyExecutionAdapter(),
        createSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", canonicalFrame, ""],
              stdout: canonicalFrame,
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      ]) {
        const result = executeCandidateWith(adapter, request, source)
        expect(result).toMatchObject({
          kind: "success",
          value: {
            outcome: {
              kind: "success",
              value: {
                activationOrders: [],
                strategyMemory: {
                  "": {
                    escape: 'quote" slash\\ line\n',
                    exponent: 1e21,
                    negativeZero: 0,
                  },
                  "𐀀": 2,
                },
              },
            },
          },
        })
      }
    })

    it("keeps pre-method artifact load failure system-owned", () => {
      const invalidArtifact = "this is not executable JavaScript {"
      const request = candidateRequest({ artifactSource: invalidArtifact })
      const evidence = completeCandidateEvidence(request, {
        attribution: "host",
      })
      for (const adapter of [
        createWorkerThreadStrategyExecutionAdapter(),
        createSubprocessStrategyExecutionAdapter({
          spawnSync: () =>
            ({
              pid: 123,
              output: ["", "R", ""],
              stdout: "R",
              stderr: "",
              status: 0,
              signal: null,
            }) as SpawnSyncReturns<string>,
        }),
      ]) {
        const result = executeCandidateWith(
          adapter,
          request,
          invalidArtifact,
          evidence,
        )
        expect(result).toMatchObject({
          kind: "success",
          value: {
            outcome: {
              kind: "system_failure",
              failure: { code: "RUNTIME_CRASH", retryable: true },
            },
          },
        })
      }
    })

    it.each([63, 64, 65] as const)(
      "matches shared canonical depth accounting at %i nested containers",
      async (containerDepth) => {
        let value: JsonValue = 0
        for (let depth = 0; depth < containerDepth; depth += 1) {
          value = [value]
        }
        const shared = encodeCanonicalJson(value, {
          context: "decoded-strategy-payload",
        })
        const source = `
const frame = (tag) => Uint8Array.of(tag.charCodeAt(0))
${CANDIDATE_BOUNDED_CANONICAL_SOURCE}
export { boundedCanonicalFrame }
`
        const module = (await import(
          new URL(
            `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`,
          ).href
        )) as {
          boundedCanonicalFrame(
            input: JsonValue,
            outputByteLimit: number,
          ): Uint8Array
        }

        if (shared.ok) {
          const frame = module.boundedCanonicalFrame(value, 262_144)
          expect(String.fromCharCode(frame[0] ?? 0)).toBe("S")
          expect(frame.subarray(1)).toEqual(shared.bytes)
        } else {
          expect(shared.error.code).toBe("MAX_DEPTH_EXCEEDED")
          expect(() =>
            module.boundedCanonicalFrame(value, 262_144),
          ).toThrow("INVALID_OUTPUT")
        }
      },
    )
  })
})
