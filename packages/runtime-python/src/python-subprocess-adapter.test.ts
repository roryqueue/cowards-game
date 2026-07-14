import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import {
  createPythonCandidateInvocationAdapterV117,
  createPythonRuntimeFromRevision,
  PYTHON_RUNTIME_ENVIRONMENT,
  pythonExperimentalRuntimeMetadata,
  pythonRuntimeHostArgs,
  runPythonStrategyMethod,
  runPythonStrategyMethodSync,
} from "./python-subprocess-adapter.js"
import {
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  createAuthenticatedRuntimeInvocationRequestV117,
  serializeRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
} from "@cowards/spec"
import {
  buildPythonSourceIdentityV117,
  buildPythonStrategyRevision,
  validatePythonStrategySource,
} from "./validation.js"

const pythonSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"]} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }

def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": input["soldierMemory"],
    }
`

const candidateIdentity = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:python-candidate-v1.17",
} as const

const candidateRequest = (
  revision = buildPythonStrategyRevision({ source: pythonSource }),
): AuthenticatedRuntimeInvocationRequestV117 => {
  const identity = buildPythonSourceIdentityV117(revision.source)
  const artifact = revision.metadata.sourceArtifact!
  return createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:python:v1.17:1",
      invocationId: "invocation:python:v1.17:1",
      kernelRequestId: "kernel-request:python:v1.17:1",
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
        strategyRevisionId: revision.id,
        originalSourceSha256: identity.originalSourceSha256,
        normalizedSourceSha256: identity.normalizedSourceSha256,
        artifactSha256: `sha256:${artifact.hash}`,
      },
      budget: {
        profileId: "runtime-budget-profile-v1.17-candidate",
        wallMilliseconds: 50,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes: 262_144,
        processLimit: 1,
        matchCumulative: {
          accounting: "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
          computeFuel: 2_600_000_000,
          invocationCountMaximum: 260,
          memoryBytes: 67_108_864,
          overflow: "stop-before-next-invocation-and-classify-by-proven-cause",
          payloadBytes: 68_157_440,
          stderrBytes: 17_039_360,
          stdoutBytes: 68_157_440,
          wallMilliseconds: 13_000,
        },
      },
      input: {
        value: {
          activationCount: 0,
          mySoldiers: [],
          strategyMemory: {},
        },
      },
      retry: {
        retryId: "retry:python:v1.17:1",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    candidateIdentity,
  )
}

describe("Python subprocess Strategy provider ABI", () => {
  it("binds original CRLF bytes separately from the normalized executable artifact", () => {
    const source = `${pythonSource.trim().replace(/\n/gu, "\r\n")}\r\n# exact CRLF\r\n`
    const identity = buildPythonSourceIdentityV117(source)
    const revision = buildPythonStrategyRevision({ source })
    const artifact = revision.metadata.sourceArtifact!

    expect(identity.originalSourceSha256).not.toBe(identity.normalizedSourceSha256)
    expect(Buffer.from(artifact.bytesBase64!, "base64").toString("utf8")).toBe(
      identity.normalizedSource,
    )
    expect(identity.lineEndings).toEqual({ kind: "crlf", lf: 0, crlf: 13, cr: 0 })
    expect(identity.hasFinalNewline).toBe(true)
  })

  it("executes CRLF source through the authenticated candidate envelope", () => {
    const source = pythonSource.trim().replace(/\n/gu, "\r\n") + "\r\n"
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision,
      identity: candidateIdentity,
    })

    const responseBytes = adapter(serializeRuntimeInvocationRequestV117(request))
    const admitted = verifyRuntimeInvocationResponseV117(
      responseBytes,
      request,
      candidateIdentity,
    )

    expect(admitted.kind).toBe("success")
    if (admitted.kind === "success") {
      expect(admitted.value.outcome).toMatchObject({
        kind: "success",
        value: { activationOrders: [], strategyMemory: {} },
      })
    }
  })

  it.each([
    ["duplicate payload", Buffer.from('{"activationOrders":[],"strategyMemory":{},"strategyMemory":[]}'), "player_violation", "INVALID_OUTPUT"],
    ["truncated payload", Buffer.from('{"activationOrders":['), "player_violation", "INVALID_OUTPUT"],
    ["deep payload", Buffer.from(`${"[".repeat(80)}0${"]".repeat(80)}`), "player_violation", "INVALID_OUTPUT"],
  ] as const)("classifies %s as Strategy-owned invalid output", (_name, payloadBytes, kind, code) => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision,
      identity: candidateIdentity,
      hostRunner: () => ({ kind: "payload", payloadBytes }),
    })
    const response = verifyRuntimeInvocationResponseV117(
      adapter(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome.kind).toBe(kind)
      expect(
        response.value.outcome.kind === "player_violation"
          ? response.value.outcome.violation.code
          : undefined,
      ).toBe(code)
    }
  })

  it.each([
    ["proven Strategy exception", { kind: "strategy_exception" } as const, "player_violation", "THROWN_EXCEPTION"],
    ["host crash", { kind: "host_crash" } as const, "system_failure", "HOST_CRASH"],
    ["transport ambiguity", { kind: "transport_crash" } as const, "system_failure", "TRANSPORT_CRASH"],
    ["preflight unavailable", { kind: "preflight_unavailable" } as const, "system_failure", "AMBIGUOUS_ATTRIBUTION"],
  ])("keeps %s in its exclusive owner", (_name, hostResult, kind, code) => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision,
      identity: candidateIdentity,
      hostRunner: () => hostResult,
    })
    const response = verifyRuntimeInvocationResponseV117(
      adapter(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome.kind).toBe(kind)
      expect(
        response.value.outcome.kind === "player_violation"
          ? response.value.outcome.violation.code
          : response.value.outcome.kind === "system_failure"
            ? response.value.outcome.failure.code
            : undefined,
      ).toBe(code)
      expect(response.value.outcome).not.toHaveProperty(
        kind === "system_failure" ? "violation" : "failure",
      )
    }
  })

  it("owns stale normalized artifact identity as no-penalty system failure", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const stale = {
      ...revision,
      metadata: {
        ...revision.metadata,
        sourceArtifact: {
          ...revision.metadata.sourceArtifact!,
          bytesBase64: Buffer.from("stale", "utf8").toString("base64"),
        },
      },
    }
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision: stale,
      identity: candidateIdentity,
    })
    const response = verifyRuntimeInvocationResponseV117(
      adapter(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "OUTER_FRAME_WRONG_BINDING" },
      })
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })
  it("runs selectActivations through the v1.7 JSON ABI", async () => {
    const response = await runPythonStrategyMethod({
      sourceText: pythonSource,
      methodName: "selectActivations",
      timeoutMs: 3_000,
      input: {
        phaseNumber: 1,
        roundNumber: 1,
        activationCount: 1,
        board: {
          bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 },
          soldiers: [],
          terrainStones: [],
        },
        mySoldiers: [
          {
            id: "soldier:1",
            ownerPlayerId: "player:bottom",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
        ],
        enemySoldiers: [],
        strategyMemory: {},
      },
    })

    expect(response.ok).toBe(true)
    expect(response.ok ? response.value : undefined).toEqual({
      activationOrders: [{ soldierId: "soldier:1" }],
      strategyMemory: {},
    })
  })

  it("uses constrained provider metadata for counted Python", () => {
    const metadata = pythonExperimentalRuntimeMetadata()

    expect(metadata.language.id).toBe("python")
    expect(metadata.adapter.id).toBe("runtime-python-subprocess-experimental")
    expect(metadata.limits.network).toBe("disabled")
    expect(metadata.limits.filesystem).toBe("none")
    expect(metadata.package.mode).toBe("none")
  })

  it("launches Python with isolated-mode host args and an empty environment", () => {
    expect(pythonRuntimeHostArgs()).toEqual(
      expect.arrayContaining([
        "-I",
        expect.stringContaining("python_runtime_host.py"),
      ]),
    )
    expect(PYTHON_RUNTIME_ENVIRONMENT).toEqual({})
  })

  it("validates Python source without accepting imports or missing methods", () => {
    const invalid = validatePythonStrategySource("import os\n")

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "IMPORT_NOT_ALLOWED",
    )
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "MISSING_SELECT_ACTIVATIONS",
    )
    expect(JSON.stringify(invalid)).not.toContain("Traceback")
  })

  it("uses AST/compile validation with public-safe diagnostics", () => {
    const invalid = validatePythonStrategySource(
      'def select_activations(input):\n    return {"activationOrders": [}\n',
    )

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.map((issue) => issue.code)).toContain(
      "TRANSPILE_FAILED",
    )
    expect(JSON.stringify(invalid)).not.toContain("return {")
    expect(JSON.stringify(invalid)).not.toContain("Traceback")
    expect(JSON.stringify(invalid)).not.toContain("python_validation_host.py")
  })

  it("runs synchronously for the runtime-service broker adapter", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const runtime = createPythonRuntimeFromRevision(revision, {
      timeoutMs: 1_000,
      stdoutBytes: 32 * 1024,
      stderrBytes: 4 * 1024,
    })
    const result = runtime.runSoldierBrain({
      self: {
        id: "soldier:1",
        ownerPlayerId: "player:bottom",
        status: "ACTIVE",
        position: { x: 0, y: 0 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
      awarenessGrid: { cells: [] },
      cycleIndex: 0,
      maxCycles: 12,
      soldierMemory: {},
    })

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value.action : undefined).toEqual({
      type: "TURN_TO_STONE",
    })
  })

  it("maps timeout to a runtime violation", () => {
    const source = `${pythonSource}\ndef soldier_brain(input):\n    while True:\n        pass\n`
    const revision = buildPythonStrategyRevision({ source })
    const response = runPythonStrategyMethodSync({
      sourceText: revision.source,
      sourceHash: revision.sourceHash,
      methodName: "soldierBrain",
      input: {
        self: {
          id: "soldier:1",
          ownerPlayerId: "player:bottom",
          status: "ACTIVE",
          position: { x: 0, y: 0 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        awarenessGrid: { cells: [] },
        cycleIndex: 0,
        maxCycles: 12,
        soldierMemory: {},
      },
      timeoutMs: 10,
    })

    expect(response.ok).toBe(false)
    expect(response.ok ? undefined : response.failureKind).toBe(
      "runtimeViolation",
    )
  })

  it("maps stdio flood to a deterministic system failure", () => {
    const source = `${pythonSource}\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": {"flood": "x" * 200000}}\n`
    const revision = buildPythonStrategyRevision({ source })
    const response = runPythonStrategyMethodSync({
      sourceText: revision.source,
      sourceHash: revision.sourceHash,
      methodName: "soldierBrain",
      input: {
        self: {
          id: "soldier:1",
          ownerPlayerId: "player:bottom",
          status: "ACTIVE",
          position: { x: 0, y: 0 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        awarenessGrid: { cells: [] },
        cycleIndex: 0,
        maxCycles: 12,
        soldierMemory: {},
      },
      stdoutBytes: 64,
    })

    expect(response.ok).toBe(false)
    expect(response.ok ? undefined : response.failureKind).toBe("systemFailure")
    expect(
      response.ok || response.failureKind !== "systemFailure"
        ? undefined
        : response.systemFailure.code,
    ).toBe("STDIO_CAP_EXCEEDED")

    const runtime = createPythonRuntimeFromRevision(revision, {
      stdoutBytes: 64,
    })
    const normalized = runtime.runSoldierBrain({
      self: {
        id: "soldier:1",
        ownerPlayerId: "player:bottom",
        status: "ACTIVE",
        position: { x: 0, y: 0 },
        facing: "UP",
        lastSuccessfulMoveDirection: null,
      },
      awarenessGrid: { cells: [] },
      cycleIndex: 0,
      maxCycles: 12,
      soldierMemory: {},
    })
    expect(normalized).toMatchObject({
      ok: false,
      systemFailure: { code: "STDIO_CAP_EXCEEDED", retryable: true },
    })
  })
})
