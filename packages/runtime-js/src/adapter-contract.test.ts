import type { SpawnSyncReturns } from "node:child_process"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import type { RuntimeResult } from "@cowards/engine"
import {
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  createAuthenticatedRuntimeInvocationRequestV117,
  serializeRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
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
    outputBytes: number
    input: StrategyInput
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
        artifactSha256: sha256(new TextEncoder().encode(transpiledSource())),
      },
      budget: {
        profileId: "runtime-budget-profile-v1.17-candidate",
        wallMilliseconds: 1_000,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes: overrides.outputBytes ?? 262_144,
        processLimit: 1,
        matchCumulative: {
          invocationCountMaximum: 260,
          wallMilliseconds: 13_000,
          computeFuel: 2_600_000_000,
          payloadBytes: 68_157_440,
          stdoutBytes: 68_157_440,
          stderrBytes: 17_039_360,
          memoryBytes: 67_108_864,
          accounting:
            "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
          overflow:
            "stop-before-next-invocation-and-classify-by-proven-cause",
        },
      },
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
  }): Uint8Array
}

const executeCandidate = (
  adapter: StrategyExecutionAdapter,
  request = candidateRequest(),
) => executeCandidateWith(adapter, request, transpiledSource())

const executeCandidateWith = (
  adapter: StrategyExecutionAdapter,
  request: AuthenticatedRuntimeInvocationRequestV117,
  executableSource: string,
) => {
  const responseBytes = (adapter as unknown as CandidateAdapter).executeV117({
    requestBytes: serializeRuntimeInvocationRequestV117(request),
    executableSource,
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
        adapter: createSubprocessStrategyExecutionAdapter(),
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

    it("produces one authenticated byte-identical success across every TypeScript path", () => {
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

      const mixed = executeCandidate(
        adapterFor("Iprivate legacy violation tail"),
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

      const exact = new TextEncoder().encode(canonicalPayload).byteLength
      const atCap = executeCandidate(
        adapterFor(`S${canonicalPayload}`),
        candidateRequest({ outputBytes: exact }),
      )
      const overCap = executeCandidate(
        adapterFor("O"),
        candidateRequest({ outputBytes: exact - 1 }),
      )
      expect(atCap).toMatchObject({
        kind: "success",
        value: { outcome: { kind: "success" } },
      })
      expect(overCap).toMatchObject({
        kind: "success",
        value: {
          outcome: {
            kind: "player_violation",
            violation: { code: "OVERSIZED_OUTPUT" },
          },
        },
      })
    })
  })
})
