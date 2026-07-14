import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import {
  admitPythonCandidateHostResponseV117,
  createPythonCandidateInvocationAdapterV117,
  createPythonRuntimeFromRevision,
  PYTHON_RUNTIME_ENVIRONMENT,
  pythonExperimentalRuntimeMetadata,
  pythonRuntimeHostArgs,
  runPythonStrategyMethod,
  runPythonStrategyMethodSync,
  runPythonCandidateHostV117,
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
  budget: { wallMilliseconds?: number; outputBytes?: number } = {},
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
        wallMilliseconds: budget.wallMilliseconds ?? 1_000,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes: budget.outputBytes ?? 262_144,
        processLimit: 1,
        matchCumulative: {
          accounting:
            "signed-monotonic-per-invocation-deltas-plus-cumulative-total",
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

    expect(identity.originalSourceSha256).not.toBe(
      identity.normalizedSourceSha256,
    )
    expect(Buffer.from(artifact.bytesBase64!, "base64").toString("utf8")).toBe(
      identity.normalizedSource,
    )
    expect(identity.lineEndings).toEqual({
      kind: "crlf",
      lf: 0,
      crlf: 13,
      cr: 0,
    })
    expect(identity.hasFinalNewline).toBe(true)
    expect(artifact.sourceIdentity).toEqual({
      identityVersion: identity.identityVersion,
      normalizationPolicy: identity.normalizationPolicy,
      originalSourceSha256: identity.originalSourceSha256,
      originalSourceBytes: Buffer.byteLength(source),
      normalizedSourceSha256: identity.normalizedSourceSha256,
      normalizedSourceBytes: Buffer.byteLength(identity.normalizedSource),
      lineEndings: identity.lineEndings,
      hasFinalNewline: true,
    })
  })

  it("executes CRLF source through the authenticated candidate envelope", () => {
    const source = pythonSource.trim().replace(/\n/gu, "\r\n") + "\r\n"
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.kind, JSON.stringify(host)).toBe("payload")
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision,
      identity: candidateIdentity,
    })

    const responseBytes = adapter(
      serializeRuntimeInvocationRequestV117(request),
    )
    const admitted = verifyRuntimeInvocationResponseV117(
      responseBytes,
      request,
      candidateIdentity,
    )

    expect(admitted.kind).toBe("success")
    if (admitted.kind === "success") {
      expect(
        admitted.value.outcome.kind,
        JSON.stringify(admitted.value.outcome),
      ).toBe("success")
      expect(admitted.value.outcome).toMatchObject({
        kind: "success",
        value: { activationOrders: [], strategyMemory: {} },
      })
    }
  })

  it.each([
    [
      "duplicate payload",
      Buffer.from(
        '{"activationOrders":[],"strategyMemory":{},"strategyMemory":[]}',
      ),
      "player_violation",
      "INVALID_OUTPUT",
    ],
    [
      "truncated payload",
      Buffer.from('{"activationOrders":['),
      "player_violation",
      "INVALID_OUTPUT",
    ],
    [
      "deep payload",
      Buffer.from(`${"[".repeat(80)}0${"]".repeat(80)}`),
      "player_violation",
      "INVALID_OUTPUT",
    ],
  ] as const)(
    "classifies %s as Strategy-owned invalid output",
    (_name, payloadBytes, kind, code) => {
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
    },
  )

  it.each([
    [
      "proven Strategy exception",
      { kind: "strategy_exception" } as const,
      "player_violation",
      "THROWN_EXCEPTION",
    ],
    [
      "host crash",
      { kind: "host_crash" } as const,
      "system_failure",
      "HOST_CRASH",
    ],
    [
      "transport ambiguity",
      { kind: "transport_crash" } as const,
      "system_failure",
      "TRANSPORT_CRASH",
    ],
    [
      "preflight unavailable",
      { kind: "preflight_unavailable" } as const,
      "system_failure",
      "AMBIGUOUS_ATTRIBUTION",
    ],
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

  it("owns stale artifact source metadata as no-penalty system failure", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const stale = {
      ...revision,
      metadata: {
        ...revision.metadata,
        sourceArtifact: {
          ...revision.metadata.sourceArtifact!,
          sourceHash: "0".repeat(64),
        },
      },
    }
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision: stale,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
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

  it("owns stale private normalization policy as no-penalty system failure", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const stale = {
      ...revision,
      metadata: {
        ...revision.metadata,
        sourceArtifact: {
          ...revision.metadata.sourceArtifact!,
          sourceIdentity: {
            ...revision.metadata.sourceArtifact!.sourceIdentity!,
            normalizationPolicy: "stale-policy" as never,
          },
        },
      },
    }
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision: stale,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
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

  it("owns malformed host base64 as transport failure without a player penalty", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const adapter = createPythonCandidateInvocationAdapterV117({
      revision,
      identity: candidateIdentity,
      hostRunner: () =>
        admitPythonCandidateHostResponseV117(
          Buffer.from('{"kind":"payload","payloadBase64":"!!!!"}'),
        ),
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
        failure: { code: "TRANSPORT_CRASH" },
      })
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it.each([
    '{"extra":0,"kind":"strategy_exception"}',
    '{"kind":"strategy_exception","payloadBase64":"e30="}',
    '{"kind":"invalid_output","payloadBase64":"e30="}',
    '{"kind":"payload","payloadBase64":"e30=","private":true}',
  ])(
    "rejects mixed or extra host envelope fields as transport failure: %s",
    (hostEnvelope) => {
      expect(
        admitPythonCandidateHostResponseV117(Buffer.from(hostEnvelope)),
      ).toEqual({ kind: "transport_crash" })
    },
  )

  it("fails a zero signed wall budget closed without launching the host", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision, { wallMilliseconds: 0 })
    let hostCalled = false
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
        hostRunner: () => {
          hostCalled = true
          return { kind: "host_crash" }
        },
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(hostCalled).toBe(false)
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it("applies the signed output budget to decoded raw payload bytes at N and N+1", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const prefix = '{"activationOrders":[],"strategyMemory":"'
    const suffix = '"}'
    const cap = 256
    const exact = Buffer.from(
      `${prefix}${"x".repeat(cap - prefix.length - suffix.length)}${suffix}`,
    )
    expect(exact.byteLength).toBe(cap)

    for (const [payloadBytes, code] of [
      [exact, "success"],
      [
        Buffer.concat([exact.subarray(0, -2), Buffer.from('x"}')]),
        "OVERSIZED_OUTPUT",
      ],
    ] as const) {
      const request = candidateRequest(revision, { outputBytes: cap })
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterV117({
          revision,
          identity: candidateIdentity,
          hostRunner: () => ({ kind: "payload", payloadBytes }),
        })(serializeRuntimeInvocationRequestV117(request)),
        request,
        candidateIdentity,
      )
      expect(response.kind).toBe("success")
      if (response.kind === "success") {
        expect(
          response.value.outcome.kind === "player_violation"
            ? response.value.outcome.violation.code
            : response.value.outcome.kind,
        ).toBe(code)
      }
    }
  })

  it("bounds real-host canonical output before transport and owns overflow", () => {
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": "x" * 70000}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision, { outputBytes: 256 })
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.kind).toBe("oversized_output")

    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "player_violation",
        violation: { code: "OVERSIZED_OUTPUT" },
      })
      expect(response.value.outcome).not.toHaveProperty("failure")
    }
  })

  it("starts the signed wall budget at guest entry and records unavailable meters", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision, { wallMilliseconds: 5 })
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(pythonSource).normalizedSource,
    )
    expect(host.kind, JSON.stringify(host)).toBe("payload")

    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome.trace.safeCodes).toEqual(
        expect.arrayContaining([
          "COMPUTE_METER_UNAVAILABLE",
          "MEMORY_METER_UNAVAILABLE",
        ]),
      )
    }
  })

  it("accepts a near-cap raw host payload without base64-envelope ENOBUFS drift", () => {
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": "x" * 249900}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.kind).toBe("payload")
    if (host.kind === "payload") {
      expect(host.payloadBytes.byteLength).toBeGreaterThan(249_900)
      expect(host.payloadBytes.byteLength).toBeLessThanOrEqual(
        request.budget.outputBytes,
      )
    }
  })

  it("classifies an actual-host non-serializable return as INVALID_OUTPUT", () => {
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": range(1)}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    expect(revision.validation.valid).toBe(true)
    const request = candidateRequest(revision)
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "player_violation",
        violation: { code: "INVALID_OUTPUT" },
      })
      expect(response.value.outcome).not.toHaveProperty("failure")
    }
  })

  it("canonicalizes actual-host finite floats before payload admission", () => {
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": {"whole": 1.0}}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    expect(revision.validation.valid).toBe(true)
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.kind).toBe("payload")
    if (host.kind === "payload") {
      expect(Buffer.from(host.payloadBytes).toString("utf8")).toBe(
        '{"activationOrders":[],"strategyMemory":{"whole":1}}',
      )
    }
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "success",
        value: { strategyMemory: { whole: 1 } },
      })
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
