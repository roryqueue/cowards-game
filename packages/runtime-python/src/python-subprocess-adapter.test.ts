import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  admitPythonCandidateHostResponseV117,
  createPythonCandidateInvocationAdapterFixtureV117,
  createPythonCandidateInvocationAdapterV117,
  createPythonRuntimeFromRevision,
  PYTHON_RUNTIME_ENVIRONMENT,
  pythonExperimentalRuntimeMetadata,
  pythonRuntimeHostArgs,
  runPythonStrategyMethod,
  runPythonStrategyMethodSync,
  runPythonCandidateHostV117,
  type PythonCandidateHostResultV117,
} from "./python-subprocess-adapter.js"
import {
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  createAuthenticatedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  serializeRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
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
      budget: createRuntimeInvocationBudgetV117("selectActivations"),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
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

const trustedEvidenceFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  deltas: Readonly<{
    wallMilliseconds?: number
    computeFuel?: number
    payloadBytes?: number
    stdoutBytes?: number
    stderrBytes?: number
    memoryBytes?: number
  }> = {},
): RuntimeInvocationExecutionReceiptEvidenceV117 => {
  const prestate = request.accounting.prestate
  const counter = (
    name:
      | "wallMilliseconds"
      | "computeFuel"
      | "payloadBytes"
      | "stdoutBytes"
      | "stderrBytes",
    delta: number,
  ) => ({
    status: "measured" as const,
    delta,
    cumulative: prestate.cumulative[name] + delta,
  })
  const memoryBytes = deltas.memoryBytes ?? 1
  return {
    attribution: "proven_strategy",
    counters: {
      wallMilliseconds: counter(
        "wallMilliseconds",
        deltas.wallMilliseconds ?? 1,
      ),
      computeFuel: counter("computeFuel", deltas.computeFuel ?? 1),
      payloadBytes: counter("payloadBytes", deltas.payloadBytes ?? 1),
      stdoutBytes: counter("stdoutBytes", deltas.stdoutBytes ?? 1),
      stderrBytes: counter("stderrBytes", deltas.stderrBytes ?? 0),
    },
    memory: {
      status: "measured",
      peakBytes: memoryBytes,
      cumulativePeakBytes: Math.max(
        prestate.cumulative.memoryBytes,
        memoryBytes,
      ),
    },
    process: { status: "verified", processes: 1, threads: 1, children: 0 },
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

const fixtureExecution = (
  observation: PythonCandidateHostResultV117["observation"],
  receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117,
): PythonCandidateHostResultV117 => ({ observation, receiptEvidence })

const measuredDelta = (
  counter: RuntimeInvocationExecutionReceiptEvidenceV117["counters"]["stdoutBytes"],
): number => {
  if (counter.status !== "measured") {
    throw new TypeError("fixture counter must be measured")
  }
  return counter.delta
}

describe("Python subprocess Strategy provider ABI", () => {
  it("keeps fixture-only accounting injection outside the production package API", async () => {
    const packageApi = (await import("./index.js")) as Record<string, unknown>

    expect(packageApi).not.toHaveProperty(
      "createPythonCandidateInvocationAdapterFixtureV117",
    )
  })

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

  it("preserves a CRLF payload observation but fails closed without complete meters", () => {
    const source = pythonSource.trim().replace(/\n/gu, "\r\n") + "\r\n"
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.observation.kind, JSON.stringify(host)).toBe("payload")
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
      expect(admitted.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION", retryable: false },
        trace: {
          safeCodes: expect.arrayContaining([
            "RAW_PAYLOAD_OBSERVED",
            "COMPUTE_METER_UNAVAILABLE",
            "MEMORY_METER_UNAVAILABLE",
          ]),
        },
      })
      expect(admitted.value.accounting.disposition).toBe("no_commit")
      expect(admitted.value.accounting.poststate).toEqual(
        request.accounting.prestate,
      )
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
      const evidence = trustedEvidenceFor(request, {
        payloadBytes: payloadBytes.byteLength,
      })
      const adapter = createPythonCandidateInvocationAdapterFixtureV117({
        revision,
        identity: candidateIdentity,
        fixtureOnlyObservedExecution: () =>
          fixtureExecution(
            {
              kind: "payload",
              payloadBytes,
              stdoutBytes: measuredDelta(evidence.counters.stdoutBytes),
              stderrBytes: measuredDelta(evidence.counters.stderrBytes),
            },
            evidence,
          ),
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
      true,
    ],
    [
      "proven Strategy timeout",
      { kind: "strategy_timeout" } as const,
      "system_failure",
      "TIMEOUT",
      "timeout",
    ],
    [
      "host crash",
      { kind: "host_crash" } as const,
      "system_failure",
      "AMBIGUOUS_ATTRIBUTION",
      false,
    ],
    [
      "transport ambiguity",
      { kind: "transport_crash" } as const,
      "system_failure",
      "AMBIGUOUS_ATTRIBUTION",
      false,
    ],
    [
      "preflight unavailable",
      { kind: "preflight_unavailable" } as const,
      "system_failure",
      "AMBIGUOUS_ATTRIBUTION",
      false,
    ],
  ])("keeps %s in its exclusive owner", (_name, hostResult, kind, code, trusted) => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const evidence = trusted
      ? trustedEvidenceFor(
          request,
          trusted === "timeout"
            ? {
                wallMilliseconds:
                  request.budget.methodLimit.counters.wallMilliseconds.maximum +
                  1,
                payloadBytes: 0,
              }
            : { payloadBytes: 0 },
        )
      : undefined
    const adapter = createPythonCandidateInvocationAdapterFixtureV117({
      revision,
      identity: candidateIdentity,
      fixtureOnlyObservedExecution: () =>
        fixtureExecution(
          {
            ...hostResult,
            stdoutBytes:
              evidence === undefined
                ? 0
                : measuredDelta(evidence.counters.stdoutBytes),
            stderrBytes:
              evidence === undefined
                ? 0
                : measuredDelta(evidence.counters.stderrBytes),
          },
          evidence,
        ),
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

  it("rejects lossy or non-canonical artifact bytes before host invocation", () => {
    const source = `${pythonSource}\n# replacement: \ufffd\n`
    const revision = buildPythonStrategyRevision({ source })
    const artifact = revision.metadata.sourceArtifact!
    const validBytes = Buffer.from(artifact.bytesBase64!, "base64")
    const replacement = Buffer.from("\ufffd", "utf8")
    const offset = validBytes.indexOf(replacement)
    expect(offset).toBeGreaterThanOrEqual(0)
    const invalidBytes = Buffer.concat([
      validBytes.subarray(0, offset),
      Buffer.from([0xff]),
      validBytes.subarray(offset + replacement.byteLength),
    ])
    const invalidUtf8 = {
      ...revision,
      metadata: {
        ...revision.metadata,
        sourceArtifact: {
          ...artifact,
          hash: createHash("sha256").update(invalidBytes).digest("hex"),
          bytes: invalidBytes.byteLength,
          bytesBase64: invalidBytes.toString("base64"),
        },
      },
    }
    const nonCanonicalBase64 = {
      ...revision,
      metadata: {
        ...revision.metadata,
        sourceArtifact: {
          ...artifact,
          bytesBase64: `${artifact.bytesBase64!}\n`,
        },
      },
    }

    for (const forged of [invalidUtf8, nonCanonicalBase64]) {
      const request = candidateRequest(forged)
      let hostCalled = false
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterFixtureV117({
          revision: forged,
          identity: candidateIdentity,
          fixtureOnlyObservedExecution: () => {
            hostCalled = true
            return fixtureExecution({
              kind: "host_crash",
              stdoutBytes: 0,
              stderrBytes: 0,
            })
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
          failure: {
            code: "OUTER_FRAME_WRONG_BINDING",
            retryable: false,
          },
        })
      }
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
        failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
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
    const adapter = createPythonCandidateInvocationAdapterFixtureV117({
      revision,
      identity: candidateIdentity,
      fixtureOnlyObservedExecution: () =>
        fixtureExecution(
          admitPythonCandidateHostResponseV117(
            Buffer.from('{"kind":"payload","payloadBase64":"!!!!"}'),
          ),
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
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
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
      ).toMatchObject({ kind: "transport_crash" })
    },
  )

  it("admits the closed host-failure envelope as host-owned failure", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const observation = admitPythonCandidateHostResponseV117(
      Buffer.from('{"kind":"host_failure"}'),
    )
    expect(observation).toMatchObject({ kind: "host_crash" })
    const evidence = {
      ...trustedEvidenceFor(request, {
        payloadBytes: 0,
        stdoutBytes: observation.stdoutBytes,
        stderrBytes: observation.stderrBytes,
      }),
      attribution: "host" as const,
    }
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterFixtureV117({
        revision,
        identity: candidateIdentity,
        fixtureOnlyObservedExecution: () =>
          fixtureExecution(observation, evidence),
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )

    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "HOST_CRASH" },
        trace: { safeCodes: expect.arrayContaining(["RAW_HOST_CRASH_OBSERVED"]) },
      })
      expect(response.value.accounting.disposition).toBe("no_commit")
    }
  })

  it("passes the exact nested v1.17 method limit to the Python host", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    expect(request.budget).not.toHaveProperty("outputBytes")
    expect(request.budget.methodLimit).toEqual(
      createRuntimeInvocationBudgetV117("selectActivations").methodLimit,
    )
    expect(
      runPythonCandidateHostV117(
        request,
        buildPythonSourceIdentityV117(pythonSource).normalizedSource,
      ).observation.kind,
    ).toBe("payload")
  })

  it("fails incomplete injected accounting closed without signing player blame", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterFixtureV117({
        revision,
        identity: candidateIdentity,
        fixtureOnlyObservedExecution: () => ({
          observation: {
            kind: "strategy_exception",
            stdoutBytes: 1,
            stderrBytes: 0,
          },
          receiptEvidence: {
            attribution: "proven_strategy",
          } as RuntimeInvocationExecutionReceiptEvidenceV117,
        }),
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION", retryable: false },
      })
      expect(response.value.accounting.disposition).toBe("no_commit")
      expect(response.value.accounting.poststate).toEqual(
        request.accounting.prestate,
      )
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it.each(["payloadBytes", "stdoutBytes", "stderrBytes"] as const)(
    "rejects signed evidence whose %s delta predates direct observation",
    (dimension) => {
      const revision = buildPythonStrategyRevision({ source: pythonSource })
      const request = candidateRequest(revision)
      const payloadBytes = Buffer.from(
        '{"activationOrders":[],"strategyMemory":null}',
      )
      const observed = {
        payloadBytes: payloadBytes.byteLength,
        stdoutBytes: 91,
        stderrBytes: 7,
      }
      const evidence = trustedEvidenceFor(request, {
        ...observed,
        [dimension]: observed[dimension] - 1,
      })
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterFixtureV117({
          revision,
          identity: candidateIdentity,
          fixtureOnlyObservedExecution: () =>
            fixtureExecution(
              {
                kind: "payload",
                payloadBytes,
                stdoutBytes: observed.stdoutBytes,
                stderrBytes: observed.stderrBytes,
              },
              evidence,
            ),
        })(serializeRuntimeInvocationRequestV117(request)),
        request,
        candidateIdentity,
      )

      expect(response.kind).toBe("success")
      if (response.kind === "success") {
        expect(response.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: { code: "AMBIGUOUS_ATTRIBUTION" },
          trace: {
            safeCodes: expect.arrayContaining([
              "RAW_PAYLOAD_OBSERVED",
              "ACCOUNTING_EVIDENCE_REJECTED",
            ]),
          },
        })
        expect(response.value.accounting.disposition).toBe("no_commit")
        expect(response.value.accounting.poststate).toEqual(
          request.accounting.prestate,
        )
      }
    },
  )

  it("applies the signed output budget to decoded raw payload bytes at N and N+1", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const prefix = '{"activationOrders":[],"strategyMemory":"'
    const suffix = '"}'
    const cap =
      createRuntimeInvocationBudgetV117("selectActivations").methodLimit
        .counters.payloadBytes.maximum
    const exact = Buffer.from(
      `${prefix}${"x".repeat(cap - prefix.length - suffix.length)}${suffix}`,
    )
    expect(exact.byteLength).toBe(cap)

    for (const [payloadBytes, code] of [
      // The decoded payload is within the transport cap but independently
      // violates StrategyMemory's semantic field cap.
      [exact, "INVALID_OUTPUT"],
      [
        Buffer.concat([exact.subarray(0, -2), Buffer.from('x"}')]),
        "OVERSIZED_OUTPUT",
      ],
    ] as const) {
      const request = candidateRequest(revision)
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterFixtureV117({
          revision,
          identity: candidateIdentity,
          fixtureOnlyObservedExecution: () => {
            const evidence = trustedEvidenceFor(request, {
              payloadBytes: payloadBytes.byteLength,
            })
            return fixtureExecution(
              {
                kind: "payload",
                payloadBytes,
                stdoutBytes: measuredDelta(evidence.counters.stdoutBytes),
                stderrBytes: measuredDelta(evidence.counters.stderrBytes),
              },
              evidence,
            )
          },
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
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": "x" * 300000}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.observation.kind).toBe("oversized_output")

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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome.trace.safeCodes).toContain(
        "RAW_OVERSIZED_OUTPUT_OBSERVED",
      )
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it("starts the signed wall budget at guest entry and records unavailable meters", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(pythonSource).normalizedSource,
    )
    expect(host.observation.kind, JSON.stringify(host)).toBe("payload")

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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.accounting.disposition).toBe("no_commit")
      expect(response.value.outcome.trace.safeCodes).toEqual(
        expect.arrayContaining([
          "COMPUTE_METER_UNAVAILABLE",
          "MEMORY_METER_UNAVAILABLE",
        ]),
      )
    }
  })

  it("keeps a real guest-entry wall overrun as a no-commit system TIMEOUT", () => {
    const source = `def select_activations(input):\n    while True:\n        pass\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.observation.kind).toBe("strategy_timeout")

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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome.trace.safeCodes).toContain(
        "RAW_STRATEGY_TIMEOUT_OBSERVED",
      )
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it(
    "cannot catch the host-owned guest deadline with bare except",
    () => {
      const source = `def select_activations(input):\n    while True:\n        try:\n            while True:\n                pass\n        except:\n            pass\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
      const revision = buildPythonStrategyRevision({ source })
      const request = candidateRequest(revision)
      const started = Date.now()
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterV117({
          revision,
          identity: candidateIdentity,
        })(serializeRuntimeInvocationRequestV117(request)),
        request,
        candidateIdentity,
      )
      const elapsedMilliseconds = Date.now() - started

      expect(elapsedMilliseconds).toBeLessThan(1_000)
      expect(response.kind).toBe("success")
      if (response.kind === "success") {
        expect(response.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: { code: "AMBIGUOUS_ATTRIBUTION" },
        })
        expect(response.value.outcome).not.toHaveProperty("violation")
      }
    },
    35_000,
  )

  it(
    "keeps top-level Strategy initialization outside the signed method wall under a bounded preflight watchdog",
    () => {
      const source = `while True:\n    pass\n\ndef select_activations(input):\n    return {"activationOrders": [], "strategyMemory": None}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
      const revision = buildPythonStrategyRevision({ source })
      const request = candidateRequest(revision)
      const started = Date.now()
      const response = verifyRuntimeInvocationResponseV117(
        createPythonCandidateInvocationAdapterV117({
          revision,
          identity: candidateIdentity,
        })(serializeRuntimeInvocationRequestV117(request)),
        request,
        candidateIdentity,
      )
      const elapsedMilliseconds = Date.now() - started

      expect(elapsedMilliseconds).toBeLessThan(2_500)
      expect(response.kind).toBe("success")
      if (response.kind === "success") {
        expect(response.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: { code: "AMBIGUOUS_ATTRIBUTION" },
        })
        expect(response.value.outcome.trace.safeCodes).toContain(
          "RAW_PRE_METHOD_HOST_FAILURE_OBSERVED",
        )
        expect(response.value.outcome).not.toHaveProperty("violation")
      }
    },
    35_000,
  )

  it("owns top-level exceptions as distinct pre-method host failures", () => {
    const source = `1 / 0\n\ndef select_activations(input):\n    return {"activationOrders": [], "strategyMemory": None}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterV117({
        revision,
        identity: candidateIdentity,
      })(serializeRuntimeInvocationRequestV117(request)),
      request,
      candidateIdentity,
    )

    expect(host.observation.kind).toBe("pre_method_host_failure")
    expect(response.kind).toBe("success")
    if (response.kind === "success") {
      expect(response.value.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome.trace.safeCodes).toContain(
        "RAW_PRE_METHOD_HOST_FAILURE_OBSERVED",
      )
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it("keeps serialization and complete-envelope observation inside the guest-entry wall", () => {
    const source = `payload = [0] * 60000\n\ndef select_activations(input):\n    return {"activationOrders": [], "strategyMemory": payload}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome).not.toHaveProperty("violation")
    }
  })

  it("enforces signed stdout transport bytes independently of decoded payload bytes", () => {
    const source = `def select_activations(input):\n    return {"activationOrders": [], "strategyMemory": "x" * 249900}\n\ndef soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )
    expect(host.observation.kind).toBe("oversized_output")
    expect(host.observation.stdoutBytes).toBeGreaterThan(
      request.budget.methodLimit.counters.stdoutBytes.maximum,
    )
    if (
      host.observation.kind === "oversized_output" &&
      host.observation.payloadBytes !== undefined
    ) {
      expect(host.observation.payloadBytes.byteLength).toBeGreaterThan(249_900)
      expect(host.observation.payloadBytes.byteLength).toBeLessThanOrEqual(
        request.budget.methodLimit.counters.payloadBytes.maximum,
      )
    }
  })

  it("attributes complete base64 transport exhaustion to stdout in the signed receipt", () => {
    const revision = buildPythonStrategyRevision({ source: pythonSource })
    const request = candidateRequest(revision)
    const payloadBytes = Buffer.from(
      '{"activationOrders":[],"strategyMemory":null}',
    )
    const stdoutBytes =
      request.budget.methodLimit.counters.stdoutBytes.maximum + 1
    const evidence = trustedEvidenceFor(request, {
      payloadBytes: payloadBytes.byteLength,
      stdoutBytes,
      stderrBytes: 0,
    })
    const response = verifyRuntimeInvocationResponseV117(
      createPythonCandidateInvocationAdapterFixtureV117({
        revision,
        identity: candidateIdentity,
        fixtureOnlyObservedExecution: () =>
          fixtureExecution(
            {
              kind: "oversized_output",
              payloadBytes,
              stdoutBytes,
              stderrBytes: 0,
            },
            evidence,
          ),
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
      expect(response.value.accounting.disposition).toBe("commit")
      expect(response.value.accounting.receipt.counters).toMatchObject({
        payloadBytes: { status: "measured", delta: payloadBytes.byteLength },
        stdoutBytes: { status: "measured", delta: stdoutBytes },
        stderrBytes: { status: "measured", delta: 0 },
      })
      expect(response.value.accounting.poststate.cumulative.stdoutBytes).toBe(
        stdoutBytes,
      )
    }
  })

  it("owns missing method lookup as a distinct pre-method host failure", () => {
    const source = `def soldier_brain(input):\n    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": None}\n`
    const revision = buildPythonStrategyRevision({ source })
    const request = candidateRequest(revision)
    const host = runPythonCandidateHostV117(
      request,
      buildPythonSourceIdentityV117(source).normalizedSource,
    )

    expect(host.observation.kind).toBe("pre_method_host_failure")
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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
      expect(response.value.outcome.trace.safeCodes).toContain(
        "RAW_INVALID_OUTPUT_OBSERVED",
      )
      expect(response.value.outcome).not.toHaveProperty("violation")
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
    expect(host.observation.kind).toBe("payload")
    if (host.observation.kind === "payload") {
      expect(Buffer.from(host.observation.payloadBytes).toString("utf8")).toBe(
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
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
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
