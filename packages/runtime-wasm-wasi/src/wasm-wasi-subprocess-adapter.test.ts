import { describe, expect, it } from "vitest"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  createAuthenticatedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  serializeRuntimeInvocationResponseV117,
  STRATEGY_WASM_ARTIFACT_BYTES,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type RuntimeAbiV117LedgerAttribution,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationSigningIdentityV117,
} from "@cowards/spec"
import {
  buildZigStrategyRevision,
  compileZigWasmArtifact,
  buildRustStrategyRevision,
  compileRustWasmArtifact,
  buildRustWasmCandidateRevisionV117,
  compileRustWasmArtifactV117,
  compileZigWasmArtifactV117,
  validateRustStrategySource,
  validateZigStrategySource,
  zigReadinessEvidence,
  collectWasmWasiCandidateIdentityV117,
  isWasmWasiSourceIdentityV117,
  resolveWasmWasiAdapterBuildFilesV117,
  type WasmWasiCandidateRevisionV117,
} from "./validation.js"
import { wasmWasiRuntimeMetadataV117 } from "./metadata.js"
import {
  WASM_WASI_V1_17_EXECUTION_SETTINGS,
  classifyWasmtimeProcessObservationV117,
  createWasmWasiRuntimeFromRevision,
  runWasmWasiStrategyMethodV117Sync,
  wasmWasiSharedCaptureBufferBytesV117,
  type WasmWasiGuestObservationV117,
} from "./wasm-wasi-subprocess-adapter.js"

const rustSource = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`

const candidateRustSource = `
fn main() {
    print!("{}", r#"{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}"#);
}
`

const candidateZigSource = `
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    writeAll("{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}");
}
`

const rustCompileProbe = compileRustWasmArtifact(rustSource)
const zigCompileProbe = compileZigWasmArtifact(zigSource)
const candidateRustCompileProbe =
  compileRustWasmArtifactV117(candidateRustSource)
const candidateZigCompileProbe = compileZigWasmArtifactV117(candidateZigSource)

const candidateSigningIdentity: RuntimeInvocationSigningIdentityV117 = {
  keyId: "fixture-only:wasm-wasi-adapter:v1.17",
  secret: "fixture-only-wasm-wasi-v1.17-secret",
}

const candidateRequest = (
  revision: Pick<
    WasmWasiCandidateRevisionV117,
    "id" | "sourceIdentity" | "metadata"
  >,
  artifactSha256 = revision.metadata.compiledArtifact?.hash,
): AuthenticatedRuntimeInvocationRequestV117 => {
  if (artifactSha256 === undefined) {
    throw new Error("Rust candidate fixture did not compile")
  }
  return createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "request:wasm-wasi:v1.17:1",
      invocationId: "invocation:wasm-wasi:v1.17:1",
      kernelRequestId: "kernel-request:wasm-wasi:v1.17:1",
      method: "soldierBrain",
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
        originalSourceSha256: revision.sourceIdentity.originalSourceSha256,
        normalizedSourceSha256: revision.sourceIdentity.normalizedSourceSha256,
        artifactSha256: `sha256:${artifactSha256}`,
      },
      budget: createRuntimeInvocationBudgetV117("soldierBrain"),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
      input: {
        value: {
          awarenessGrid: { cells: [] },
          cycleIndex: 0,
          hasAdvancedThisActivation: false,
          maxCycles: 12,
          self: {
            facing: "UP",
            id: "soldier:1",
            lastSuccessfulMoveDirection: null,
            ownerPlayerId: "player:1",
            position: { x: 0, y: 0 },
            status: "ACTIVE",
          },
          soldierMemory: null,
        },
      },
      retry: {
        retryId: "retry:wasm-wasi:v1.17:1",
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    candidateSigningIdentity,
  )
}

const completedObservation = (
  stdout: string,
): WasmWasiGuestObservationV117 => ({
  kind: "completed",
  status: 0,
  signal: null,
  stdout: new TextEncoder().encode(stdout),
  stderr: new Uint8Array(),
  attribution: "none",
  provenance: "none",
})

const accountingAttributionForObservation = (
  observation: WasmWasiGuestObservationV117,
): RuntimeAbiV117LedgerAttribution => {
  if (
    observation.stderr.byteLength >
      WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes ||
    observation.attribution === "host_crash" ||
    observation.attribution === "transport_crash"
  ) {
    return "host"
  }
  if (
    observation.attribution === "ambiguous_trap" ||
    observation.attribution === "accounting_unavailable" ||
    (observation.attribution === "proven_strategy_exception" &&
      observation.provenance !== "structured_host_strategy_exception") ||
    (observation.attribution === "proven_fuel_exhaustion" &&
      observation.provenance !== "structured_host_fuel_meter") ||
    (observation.attribution === "proven_memory_exhaustion" &&
      observation.provenance !== "structured_host_memory_meter")
  ) {
    return "ambiguous"
  }
  return "proven_strategy"
}

const completeExecutionEvidenceFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  observation = completedObservation(""),
  attribution = accountingAttributionForObservation(observation),
  canonicalSuccessFrame = false,
): RuntimeInvocationExecutionReceiptEvidenceV117 => {
  const prestate = request.accounting.prestate
  const limits = request.budget.methodLimit
  const deltas = {
    wallMilliseconds: 1,
    computeFuel:
      observation.attribution === "proven_fuel_exhaustion"
        ? limits.counters.computeFuel.maximum + 1
        : 1,
    payloadBytes: observation.stdout.byteLength,
    stdoutBytes:
      canonicalSuccessFrame
        ? observation.stdout.byteLength + 1
        : observation.stdout.byteLength,
    stderrBytes: observation.stderr.byteLength,
  } as const
  const counter = (name: keyof typeof deltas) => ({
    status: "measured" as const,
    delta: deltas[name],
    cumulative: prestate.cumulative[name] + deltas[name],
  })
  const memoryPeak =
    observation.attribution === "proven_memory_exhaustion"
      ? limits.memory.maximumBytes + 1
      : 1
  return {
    attribution,
    counters: {
      wallMilliseconds: counter("wallMilliseconds"),
      computeFuel: counter("computeFuel"),
      payloadBytes: counter("payloadBytes"),
      stdoutBytes: counter("stdoutBytes"),
      stderrBytes: counter("stderrBytes"),
    },
    memory: {
      status: "measured",
      peakBytes: memoryPeak,
      cumulativePeakBytes: Math.max(
        prestate.cumulative.memoryBytes,
        memoryPeak,
      ),
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

const encodeUnsignedLeb128 = (value: number): Buffer => {
  const bytes: number[] = []
  let remaining = value >>> 0
  do {
    let byte = remaining & 0x7f
    remaining >>>= 7
    if (remaining !== 0) byte |= 0x80
    bytes.push(byte)
  } while (remaining !== 0)
  return Buffer.from(bytes)
}

const appendWasmPaddingSection = (
  wasmBytes: Buffer,
  paddingBytes: number,
): Buffer => {
  const name = Buffer.from("candidate-limit-regression", "utf8")
  const payload = Buffer.concat([
    encodeUnsignedLeb128(name.byteLength),
    name,
    Buffer.alloc(paddingBytes),
  ])
  return Buffer.concat([
    wasmBytes,
    Buffer.from([0]),
    encodeUnsignedLeb128(payload.byteLength),
    payload,
  ])
}

const candidateIdentityCache = new Map<
  string,
  ReturnType<typeof collectWasmWasiCandidateIdentityV117>
>()

const candidateExecutionIdentity = (
  revision: WasmWasiCandidateRevisionV117,
) => {
  const artifact = revision.metadata.compiledArtifact
  if (artifact === undefined) throw new Error("Candidate artifact is missing")
  const cached = candidateIdentityCache.get(artifact.hash)
  if (cached !== undefined) return cached
  const identity = collectWasmWasiCandidateIdentityV117(
    revision.runtime.language.id,
    artifact,
  )
  candidateIdentityCache.set(artifact.hash, identity)
  return identity
}

const runCandidateObservation = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  revision: WasmWasiCandidateRevisionV117,
  observation: WasmWasiGuestObservationV117,
  canonicalSuccessFrame = false,
) =>
  runWasmWasiStrategyMethodV117Sync({
    request,
    revision,
    signingIdentity: candidateSigningIdentity,
    executionIdentity: candidateExecutionIdentity(revision),
    executeGuest: ({ stdin, settings }) => {
      expect(new TextDecoder().decode(stdin)).toBe(
        '{"input":' +
          JSON.stringify(request.input.value) +
          ',"method":"soldierBrain","runtimeAbi":"strategy-runtime-abi-v1.17"}',
      )
      expect(settings).toEqual(WASM_WASI_V1_17_EXECUTION_SETTINGS)
      return {
        observation,
        executionReceiptEvidence: completeExecutionEvidenceFor(
          request,
          observation,
          accountingAttributionForObservation(observation),
          canonicalSuccessFrame,
        ),
      }
    },
  })

describe("WASM/WASI runtime v1.17 candidate host authority", () => {
  const revision = buildRustWasmCandidateRevisionV117(candidateRustSource)

  it("requires the available Rust compiler instead of skipping candidate proof", () => {
    expect(revision.metadata.compiledArtifact).toBeDefined()
    expect(revision.metadata.compiledArtifact.abiVersion).toBe(
      "strategy-runtime-abi-v1.17",
    )
    expect(revision.metadata.compiledArtifact.abiEnvelope).toBe(
      "stdin-canonical-request-stdout-raw-canonical-payload",
    )
  })

  it("frames raw guest stdout as one canonical success frame before host authentication", () => {
    const request = candidateRequest(revision)
    const response = runCandidateObservation(
      request,
      revision,
      completedObservation(
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
      ),
      true,
    )
    const verified = verifyRuntimeInvocationResponseV117(
      serializeRuntimeInvocationResponseV117(response),
      request,
      candidateSigningIdentity,
    )

    expect(verified.kind).toBe("success")
    expect(response.outcome).toMatchObject({
      kind: "success",
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: null,
      },
    })
    expect(response.authentication.keyId).toBe(candidateSigningIdentity.keyId)
    expect(response.payloadBinding).toMatchObject({
      canonicalByteLength: 56,
      sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(response.accounting).toMatchObject({
      disposition: "commit",
      receipt: {
        counters: {
          payloadBytes: { status: "measured", delta: 56 },
          stdoutBytes: { status: "measured", delta: 57 },
          stderrBytes: { status: "measured", delta: 0 },
        },
      },
      poststate: {
        revision: request.accounting.prestate.revision + 1,
        methodInvocations: { selectActivations: 0, soldierBrain: 1 },
      },
    })
  })

  it("fails closed when the actual Rust/Zig host has no equivalent accounting evidence", () => {
    const request = candidateRequest(revision)
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => ({
        observation: completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
      }),
    })
    const verified = verifyRuntimeInvocationResponseV117(
      serializeRuntimeInvocationResponseV117(response),
      request,
      candidateSigningIdentity,
    )

    expect(verified.kind).toBe("success")
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      trace: {
        accountingIdentitySha256: request.accounting.identitySha256,
        idempotencyKeySha256: request.accounting.idempotencyKeySha256,
        safeCodes: expect.arrayContaining([
          "WASM_WASI_HOST_OUTER_AUTHORITY",
          "RAW_PAYLOAD_SCANNED",
          "PAYLOAD_CANONICAL",
          "WASM_WASI_EQUIVALENT_ACCOUNTING_UNAVAILABLE",
        ]),
      },
    })
    expect(response.accounting.disposition).toBe("no_commit")
    expect(response.accounting.poststate).toEqual(request.accounting.prestate)
  })

  it("never converts unmetered Strategy-like observations into player blame", () => {
    const seedRequest = candidateRequest(revision)
    const failedObservation = (
      attribution: WasmWasiGuestObservationV117["attribution"],
      provenance: WasmWasiGuestObservationV117["provenance"],
      stdout = new Uint8Array(),
    ): WasmWasiGuestObservationV117 => ({
      kind: "failed",
      status: 1,
      signal: null,
      stdout,
      stderr: new Uint8Array(),
      attribution,
      provenance,
    })
    const observations = [
      completedObservation("not-json"),
      failedObservation(
        "proven_strategy_exception",
        "structured_host_strategy_exception",
      ),
      failedObservation(
        "proven_fuel_exhaustion",
        "structured_host_fuel_meter",
      ),
      failedObservation(
        "proven_memory_exhaustion",
        "structured_host_memory_meter",
      ),
      failedObservation(
        "proven_output_exhaustion",
        "host_stdout_byte_meter",
        new Uint8Array(
          seedRequest.budget.methodLimit.counters.stdoutBytes.maximum + 1,
        ),
      ),
    ]

    for (const observation of observations) {
      const request = candidateRequest(revision)
      const response = runWasmWasiStrategyMethodV117Sync({
        request,
        revision,
        signingIdentity: candidateSigningIdentity,
        executionIdentity: candidateExecutionIdentity(revision),
        executeGuest: () => ({ observation }),
      })

      expect(response.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION", retryable: false },
      })
      expect(response.outcome).not.toHaveProperty("violation")
      expect(response.accounting.disposition).toBe("no_commit")
      expect(response.accounting.poststate).toEqual(
        request.accounting.prestate,
      )
    }
  })

  it("does not preserve a success when any injected accounting dimension is unavailable", () => {
    const request = candidateRequest(revision)
    const observation = completedObservation(
      '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
    )
    const completeEvidence = completeExecutionEvidenceFor(
      request,
      observation,
      accountingAttributionForObservation(observation),
      true,
    )
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => ({
        observation,
        executionReceiptEvidence: {
          ...completeEvidence,
          counters: {
            ...completeEvidence.counters,
            computeFuel: { status: "unavailable" },
          },
        },
      }),
    })

    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "AMBIGUOUS_ATTRIBUTION" },
    })
    expect(response.accounting.disposition).toBe("no_commit")
    expect(response.accounting.poststate).toEqual(request.accounting.prestate)
  })

  it("signs a no-commit system failure for structurally incomplete injected evidence", () => {
    const request = candidateRequest(revision)
    const observation = completedObservation(
      '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
    )
    const execute = () =>
      runWasmWasiStrategyMethodV117Sync({
        request,
        revision,
        signingIdentity: candidateSigningIdentity,
        executionIdentity: candidateExecutionIdentity(revision),
        executeGuest: () => ({
          observation,
          executionReceiptEvidence: {
            attribution: "proven_strategy",
          } as RuntimeInvocationExecutionReceiptEvidenceV117,
        }),
      })

    expect(execute).not.toThrow()
    const response = execute()
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "AMBIGUOUS_ATTRIBUTION", retryable: false },
      trace: {
        safeCodes: expect.arrayContaining([
          "RAW_PAYLOAD_SCANNED",
          "WASM_WASI_EQUIVALENT_ACCOUNTING_UNAVAILABLE",
        ]),
      },
    })
    expect(response.accounting.disposition).toBe("no_commit")
    expect(response.accounting.poststate).toEqual(request.accounting.prestate)
  })

  it.each([
    "payloadBytes",
    "stdoutBytes",
    "stderrBytes",
  ] as const)(
    "fails closed when signed %s accounting disagrees with the observed guest bytes",
    (counterName) => {
      const request = candidateRequest(revision)
      const observation = completedObservation(
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
      )
      observation.stderr = new TextEncoder().encode("fixture stderr")
      const evidence = completeExecutionEvidenceFor(
        request,
        observation,
        accountingAttributionForObservation(observation),
        true,
      )
      const counter = evidence.counters[counterName]
      if (counter.status !== "measured") {
        throw new Error("Fixture counter must be measured")
      }
      const response = runWasmWasiStrategyMethodV117Sync({
        request,
        revision,
        signingIdentity: candidateSigningIdentity,
        executionIdentity: candidateExecutionIdentity(revision),
        executeGuest: () => ({
          observation,
          executionReceiptEvidence: {
            ...evidence,
            counters: {
              ...evidence.counters,
              [counterName]: {
                ...counter,
                delta: counter.delta + 1,
                cumulative: counter.cumulative + 1,
              },
            },
          },
        }),
      })

      expect(response.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
        trace: {
          safeCodes: expect.arrayContaining([
            "RAW_PAYLOAD_SCANNED",
            "WASM_WASI_EQUIVALENT_ACCOUNTING_UNAVAILABLE",
          ]),
        },
      })
      expect(response.accounting.disposition).toBe("no_commit")
      expect(response.accounting.poststate).toEqual(
        request.accounting.prestate,
      )
    },
  )

  it("rejects parseable JSON whose raw bytes are not the admitted canonical bytes", () => {
    const response = runCandidateObservation(
      candidateRequest(revision),
      revision,
      completedObservation(
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":1.0}',
      ),
    )

    expect(response.outcome).toMatchObject({
      kind: "player_violation",
      violation: { code: "INVALID_OUTPUT" },
    })
  })

  it.each([
    {
      label: "guest-written outer envelope",
      stdout:
        '{"candidateStatus":"inactive-candidate","current":false,"envelopeKind":"runtime-invocation-response"}',
    },
    {
      label: "duplicate payload key",
      stdout:
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null,"soldierMemory":{}}',
    },
    {
      label: "non-canonical payload",
      stdout: '{"soldierMemory":null,"action":{"type":"TURN_TO_STONE"}}',
    },
    {
      label: "invalid UTF-8 payload",
      stdout: new Uint8Array([0x7b, 0xff, 0x7d]),
    },
  ])(
    "classifies $label as one authenticated player violation",
    ({ stdout }) => {
      const request = candidateRequest(revision)
      const observation = completedObservation("")
      observation.stdout =
        typeof stdout === "string" ? new TextEncoder().encode(stdout) : stdout
      const response = runCandidateObservation(request, revision, observation)

      expect(response.outcome).toEqual(
        expect.objectContaining({
          kind: "player_violation",
          violation: {
            code: "INVALID_OUTPUT",
            publicMessage: "Strategy returned an invalid payload.",
          },
        }),
      )
      expect(response.payloadBinding).toBeNull()
      expect("failure" in response.outcome).toBe(false)
    },
  )

  it.each([
    ["proven_strategy_exception", "player_violation", "THROWN_EXCEPTION"],
    ["proven_fuel_exhaustion", "player_violation", "TIMEOUT"],
    ["proven_memory_exhaustion", "player_violation", "TIMEOUT"],
    ["proven_output_exhaustion", "player_violation", "OVERSIZED_OUTPUT"],
    ["ambiguous_trap", "system_failure", "AMBIGUOUS_ATTRIBUTION"],
    ["accounting_unavailable", "system_failure", "AMBIGUOUS_ATTRIBUTION"],
    ["host_crash", "system_failure", "HOST_CRASH"],
    ["transport_crash", "system_failure", "TRANSPORT_CRASH"],
  ] as const)(
    "maps %s to exclusive %s/%s ownership",
    (attribution, kind, code) => {
      const request = candidateRequest(revision)
      const provenance =
        attribution === "proven_strategy_exception"
          ? "structured_host_strategy_exception"
          : attribution === "proven_fuel_exhaustion"
            ? "structured_host_fuel_meter"
            : attribution === "proven_memory_exhaustion"
              ? "structured_host_memory_meter"
              : attribution === "proven_output_exhaustion"
                ? "host_stdout_byte_meter"
                : "none"
      const response = runCandidateObservation(request, revision, {
        kind: "failed",
        status: null,
        signal: null,
        stdout:
          attribution === "proven_output_exhaustion"
            ? new Uint8Array(
                request.budget.methodLimit.counters.stdoutBytes.maximum + 1,
              )
            : new Uint8Array(),
        stderr: new Uint8Array(),
        attribution,
        provenance,
      })

      expect(response.outcome.kind).toBe(kind)
      expect(
        response.outcome.kind === "player_violation"
          ? response.outcome.violation.code
          : response.outcome.kind === "system_failure"
            ? response.outcome.failure.code
            : "success",
      ).toBe(code)
      expect(response.payloadBinding).toBeNull()
    },
  )

  it("fails stale artifact identity as an authenticated system failure before execution", () => {
    const request = candidateRequest(revision, "0".repeat(64))
    let executed = false
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => {
        executed = true
        return {
          observation: completedObservation(
            '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
          ),
        }
      },
    })

    expect(executed).toBe(false)
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "OUTER_FRAME_WRONG_BINDING",
        publicMessage: "Runtime system failure.",
        retryable: false,
      },
    })
  })

  it("fails stale runtime toolchain or settings identity before guest execution", () => {
    const request = candidateRequest(revision)
    const identity = candidateExecutionIdentity(revision)
    let executed = false
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: {
        ...identity,
        identitySha256: `sha256:${"0".repeat(64)}`,
      },
      executeGuest: () => {
        executed = true
        return {
          observation: completedObservation(
            '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
          ),
        }
      },
    })

    expect(executed).toBe(false)
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "OUTER_FRAME_WRONG_BINDING",
        publicMessage: "Runtime system failure.",
        retryable: false,
      },
      trace: {
        safeCodes: ["WASM_WASI_STALE_RUNTIME_TOOLCHAIN_OR_SETTINGS_IDENTITY"],
      },
    })
  })

  it("fails artifact toolchain metadata that does not match the observed compiler", () => {
    const request = candidateRequest(revision)
    const artifact = revision.metadata.compiledArtifact
    expect(artifact).toBeDefined()
    if (artifact === undefined) throw new Error("Candidate artifact is missing")
    const staleRevision = {
      ...revision,
      metadata: {
        ...revision.metadata,
        compiledArtifact: {
          ...artifact,
          toolchain: {
            ...artifact.toolchain,
            compilerVersion: "rustc stale-floating-toolchain",
          },
        },
      },
    } as typeof revision
    let executed = false
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: staleRevision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => {
        executed = true
        return {
          observation: completedObservation(
            '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
          ),
        }
      },
    })

    expect(executed).toBe(false)
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
      trace: { safeCodes: ["WASM_WASI_STALE_ARTIFACT_TOOLCHAIN_IDENTITY"] },
    })
  })

  it("never throws when artifact preflight or temp-directory setup fails", () => {
    const request = candidateRequest(revision)
    const base = {
      request,
      revision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => ({
        observation: completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
      }),
    }
    for (const hostOperations of [
      {
        validateImports: () => {
          throw new Error("preflight exploded")
        },
      },
      {
        makeTempDirectory: () => {
          throw new Error("mkdtemp exploded")
        },
      },
    ]) {
      expect(() =>
        runWasmWasiStrategyMethodV117Sync({
          ...base,
          hostOperations,
        }),
      ).not.toThrow()
      expect(
        runWasmWasiStrategyMethodV117Sync({
          ...base,
          hostOperations,
        }).outcome,
      ).toMatchObject({
        kind: "system_failure",
        failure: { code: "ADAPTER_CRASH" },
      })
    }
  })

  it("classifies malformed artifact import tables as system-owned preflight failure", () => {
    const artifact = revision.metadata.compiledArtifact
    expect(artifact).toBeDefined()
    if (artifact === undefined) throw new Error("Candidate artifact is missing")
    const malformedBytes = Buffer.from("not-a-wasm-module", "utf8")
    const malformedHash = createHash("sha256")
      .update(malformedBytes)
      .digest("hex")
    const malformedRevision = {
      ...revision,
      metadata: {
        ...revision.metadata,
        compiledArtifact: {
          ...artifact,
          bytes: malformedBytes.byteLength,
          bytesBase64: malformedBytes.toString("base64"),
          hash: malformedHash,
        },
      },
    } as typeof revision
    const request = candidateRequest(malformedRevision, malformedHash)
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: malformedRevision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: collectWasmWasiCandidateIdentityV117(
        "rust",
        malformedRevision.metadata.compiledArtifact!,
      ),
      executeGuest: () => {
        throw new Error("malformed artifact reached execution")
      },
    })

    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
    })
  })

  it("rejects an attested artifact above the canonical byte cap before execution", () => {
    const artifact = revision.metadata.compiledArtifact
    if (artifact.bytesBase64 === undefined) {
      throw new Error("Candidate artifact bytes are missing")
    }
    const originalBytes = Buffer.from(artifact.bytesBase64, "base64")
    const oversizedBytes = appendWasmPaddingSection(
      originalBytes,
      STRATEGY_WASM_ARTIFACT_BYTES - originalBytes.byteLength + 1,
    )
    const oversizedHash = createHash("sha256")
      .update(oversizedBytes)
      .digest("hex")
    const oversizedRevision = {
      ...revision,
      metadata: {
        compiledArtifact: {
          ...artifact,
          bytes: oversizedBytes.byteLength,
          bytesBase64: oversizedBytes.toString("base64"),
          hash: oversizedHash,
        },
      },
    } as typeof revision
    const request = candidateRequest(oversizedRevision, oversizedHash)
    let executed = false
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: oversizedRevision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: collectWasmWasiCandidateIdentityV117(
        "rust",
        oversizedRevision.metadata.compiledArtifact,
      ),
      executeGuest: () => {
        executed = true
        return {
          observation: completedObservation(
            '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
          ),
        }
      },
    })

    expect(oversizedBytes.byteLength).toBeGreaterThan(
      STRATEGY_WASM_ARTIFACT_BYTES,
    )
    expect(executed).toBe(false)
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
    })
  })

  it("rejects a legacy v1.14 artifact instead of relabeling it as v1.17", () => {
    const legacyRevision = buildRustStrategyRevision({ source: rustSource })
    const legacyCandidateRevision = {
      ...legacyRevision,
      sourceIdentity: revision.sourceIdentity,
    } as unknown as WasmWasiCandidateRevisionV117
    const request = candidateRequest(legacyCandidateRevision)
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: legacyCandidateRevision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () => ({
        observation: completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
      }),
    })

    expect(legacyRevision.metadata.compiledArtifact?.abiVersion).toBe(
      "strategy-runtime-abi-v1.14",
    )
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
    })
  })

  it("enforces stdout and unproven stderr ceilings with exclusive ownership", () => {
    const outputLimitedRequest = candidateRequest(revision)
    const stdoutMaximum =
      outputLimitedRequest.budget.methodLimit.counters.stdoutBytes.maximum
    const oversizedStdoutObservation = completedObservation("")
    oversizedStdoutObservation.stdout = new Uint8Array(stdoutMaximum + 1)
    const stdoutResponse = runCandidateObservation(
      outputLimitedRequest,
      revision,
      oversizedStdoutObservation,
    )
    const stderrObservation = completedObservation(
      '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
    )
    stderrObservation.stderr = new Uint8Array(
      WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes + 1,
    )
    const stderrResponse = runCandidateObservation(
      candidateRequest(revision),
      revision,
      stderrObservation,
    )
    const bothObservation = completedObservation(
      '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
    )
    bothObservation.stdout = new Uint8Array(stdoutMaximum + 1)
    bothObservation.stderr = new Uint8Array(
      WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes + 1,
    )
    const bothResponse = runCandidateObservation(
      outputLimitedRequest,
      revision,
      bothObservation,
    )

    expect(stdoutResponse.outcome).toMatchObject({
      kind: "player_violation",
      violation: { code: "OVERSIZED_OUTPUT" },
    })
    expect(stderrResponse.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "TRANSPORT_CRASH" },
    })
    expect(bothResponse.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "TRANSPORT_CRASH" },
    })
  })

  it("keeps ambiguous stderr overflow system-owned", () => {
    const observation: WasmWasiGuestObservationV117 = {
      kind: "failed",
      status: null,
      signal: null,
      stdout: new Uint8Array(),
      stderr: new Uint8Array(
        WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes + 1,
      ),
      attribution: "transport_crash",
      provenance: "none",
    }
    const response = runCandidateObservation(
      candidateRequest(revision),
      revision,
      observation,
    )

    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "TRANSPORT_CRASH" },
    })
  })

  it("does not infer player provenance from Wasmtime stderr text or exit status", () => {
    for (const stderr of [
      "panicked at guest-controlled text",
      "all fuel consumed",
      "failed to grow memory",
    ]) {
      const observation = classifyWasmtimeProcessObservationV117(
        {
          pid: 1,
          output: [null, Buffer.alloc(0), Buffer.from(stderr)],
          stdout: Buffer.alloc(0),
          stderr: Buffer.from(stderr),
          status: 1,
          signal: null,
        },
        262_144,
        WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes,
      )

      expect(observation).toMatchObject({
        kind: "failed",
        attribution: "ambiguous_trap",
      })
    }
  })

  it("requires structured host provenance before assigning exception or meter blame", () => {
    for (const attribution of [
      "proven_strategy_exception",
      "proven_fuel_exhaustion",
      "proven_memory_exhaustion",
    ] as const) {
      const response = runCandidateObservation(
        candidateRequest(revision),
        revision,
        {
          kind: "failed",
          status: 1,
          signal: null,
          stdout: new Uint8Array(),
          stderr: new TextEncoder().encode("guest-controlled diagnostic"),
          attribution,
          provenance: "none",
        },
      )

      expect(response.outcome).toMatchObject({
        kind: "system_failure",
        failure: { code: "AMBIGUOUS_ATTRIBUTION" },
      })
    }
  })

  it("keeps stderr capped below stdout without treating status zero as provenance", () => {
    expect(WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes).toBe(16_384)
    const stderr = Buffer.alloc(
      WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes + 1,
    )
    const observation = classifyWasmtimeProcessObservationV117(
      {
        pid: 1,
        output: [null, Buffer.alloc(0), stderr],
        stdout: Buffer.alloc(0),
        stderr,
        status: 0,
        signal: null,
      },
      262_144,
      WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes,
    )

    expect(observation).toMatchObject({
      kind: "failed",
      attribution: "transport_crash",
    })
  })
})

describe("WASM/WASI runtime v1.17 exact Rust/Zig identity", () => {
  it("attests typed source domains from actual source into artifact and execution identity", () => {
    const built = buildRustWasmCandidateRevisionV117(candidateRustSource)
    expect(built).toMatchObject({
      sourceIdentity: {
        identityVersion: "strategy-source-identity-v2",
        normalizationPolicy: "source-line-endings-lf-v1.17",
        originalSourceSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        normalizedSourceSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      },
      metadata: {
        compiledArtifact: {
          sourceIdentity: {
            identityVersion: "strategy-source-identity-v2",
          },
        },
      },
    })
    expect(candidateExecutionIdentity(built)).toMatchObject({
      sourceIdentity: (built as unknown as { sourceIdentity: unknown })
        .sourceIdentity,
    })
  })

  it("rejects canonical source attestations with unknown top-level or nested keys", () => {
    const identity =
      buildRustWasmCandidateRevisionV117(candidateRustSource).sourceIdentity
    expect(isWasmWasiSourceIdentityV117({ ...identity, extra: true })).toBe(
      false,
    )
    expect(
      isWasmWasiSourceIdentityV117({
        ...identity,
        lineEndings: { ...identity.lineEndings, extra: 1 },
      }),
    ).toBe(false)
  })

  it("rejects closed source attestations with impossible normalization semantics", () => {
    const identity =
      buildRustWasmCandidateRevisionV117(candidateRustSource).sourceIdentity
    expect(
      isWasmWasiSourceIdentityV117({
        ...identity,
        originalSourceBytes: 0,
        normalizedSourceBytes: 99,
        lineEndings: { kind: "none", lf: 0, crlf: 0, cr: 0 },
        hasFinalNewline: true,
      }),
    ).toBe(false)
    expect(
      isWasmWasiSourceIdentityV117({
        ...identity,
        originalSourceBytes: 10,
        normalizedSourceBytes: 10,
        lineEndings: { kind: "crlf", lf: 0, crlf: 1, cr: 0 },
        hasFinalNewline: false,
      }),
    ).toBe(false)
    expect(
      isWasmWasiSourceIdentityV117({
        ...identity,
        originalSourceBytes: 1,
        normalizedSourceBytes: 1,
        lineEndings: { kind: "lf", lf: 1, crlf: 0, cr: 0 },
        hasFinalNewline: false,
      }),
    ).toBe(false)
  })

  it("rejects coherent caller relabeling when artifact bytes retain the compiled source attestation", () => {
    const revision = buildRustWasmCandidateRevisionV117(candidateRustSource)
    const artifact = revision.metadata.compiledArtifact
    const tamperedHash = "f".repeat(64)
    const tamperedIdentity = {
      identityVersion: "strategy-source-identity-v2" as const,
      normalizationPolicy: "source-line-endings-lf-v1.17" as const,
      originalSourceSha256: `sha256:${tamperedHash}` as const,
      originalSourceBytes: candidateRustSource.length,
      normalizedSourceSha256: `sha256:${tamperedHash}` as const,
      normalizedSourceBytes: candidateRustSource.length,
      lineEndings: { kind: "lf" as const, lf: 3, crlf: 0, cr: 0 },
      hasFinalNewline: true,
    }
    const tamperedRevision = {
      ...revision,
      sourceIdentity: tamperedIdentity,
      metadata: {
        compiledArtifact: {
          ...artifact,
          sourceHash: tamperedIdentity.normalizedSourceSha256,
          sourceIdentity: tamperedIdentity,
        },
      },
    } as unknown as WasmWasiCandidateRevisionV117
    const request = candidateRequest(tamperedRevision)
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: tamperedRevision,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: collectWasmWasiCandidateIdentityV117(
        "rust",
        tamperedRevision.metadata.compiledArtifact,
      ),
      executeGuest: () => ({
        observation: completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
      }),
    })

    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING" },
    })
  })

  it("reports shared stderr capture as unsupported rather than independently metered", () => {
    const revision = buildRustWasmCandidateRevisionV117(candidateRustSource)
    const identity = candidateExecutionIdentity(revision)
    expect(
      wasmWasiSharedCaptureBufferBytesV117(
        262_144,
        WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes,
      ),
    ).toBeGreaterThan(WASM_WASI_V1_17_EXECUTION_SETTINGS.stderrBytes + 1)
    expect(identity.metering.supported).not.toContain(
      "host-stderr-byte-ceiling",
    )
    expect(identity.metering.unsupported).toContain(
      "independent-host-stderr-byte-ceiling",
    )
    expect(WASM_WASI_V1_17_EXECUTION_SETTINGS).toMatchObject({
      stderrCapture: "shared-max-buffer-post-capture-safety-only",
    })
  })

  it("resolves emitted JavaScript adapter-build inputs for built imports", () => {
    const directory = mkdtempSync(join(tmpdir(), "cowards-wasm-built-inputs-"))
    try {
      for (const name of [
        "metadata.js",
        "validation.js",
        "wasm-wasi-subprocess-adapter.js",
      ]) {
        writeFileSync(join(directory, name), "export {}\n", "utf8")
      }
      const files = resolveWasmWasiAdapterBuildFilesV117(
        pathToFileURL(join(directory, "validation.js")).href,
      )

      expect(files).toHaveLength(3)
      expect(files.every((file) => file.endsWith(".js"))).toBe(true)
      expect(files.every((file) => !file.endsWith(".ts"))).toBe(true)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it("binds resolved compiler runtime target flags adapter stdlib and settings", () => {
    expect(candidateRustCompileProbe.artifact).toBeDefined()
    expect(candidateZigCompileProbe.artifact).toBeDefined()
    if (
      candidateRustCompileProbe.artifact === undefined ||
      candidateZigCompileProbe.artifact === undefined
    ) {
      throw new Error("Rust and Zig candidate toolchains are required")
    }

    const rustIdentity = collectWasmWasiCandidateIdentityV117(
      "rust",
      candidateRustCompileProbe.artifact,
    )
    const zigIdentity = collectWasmWasiCandidateIdentityV117(
      "zig",
      candidateZigCompileProbe.artifact,
    )

    for (const identity of [rustIdentity, zigIdentity]) {
      expect(identity).toMatchObject({
        schemaVersion: "runtime-wasm-wasi-identity-v1.17",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        adapter: {
          buildSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
        compiler: {
          executableSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
          reportedVersion: expect.any(String),
          resolvedPathSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
          flags: expect.any(Array),
        },
        runtime: {
          executableSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
          reportedVersion: expect.stringContaining("wasmtime 45.0.0"),
          resolvedPathSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
        settings: {
          sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
          value: WASM_WASI_V1_17_EXECUTION_SETTINGS,
        },
        stdlibSysroot: {
          sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
        containment: {
          profileId: "wasm-wasi-preview1-empty-env-no-preopen-v1.17",
          sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
        countedCertification: "uncertified",
        productionTrustedProducers: [],
      })
      expect(identity.metering.unsupported).toEqual(
        WASM_WASI_V1_17_EXECUTION_SETTINGS.unsupportedMeters,
      )
      expect(identity.certificationReasons.length).toBeGreaterThan(0)
      expect(JSON.stringify(identity)).not.toContain("/Users/")
    }
    expect(rustIdentity.compiler.targetTriple).toBe("wasm32-wasip1")
    expect(zigIdentity.compiler.targetTriple).toBe("wasm32-wasi")
    const selectedRustc = spawnSync("rustup", ["which", "rustc"], {
      encoding: "utf8",
      shell: false,
    }).stdout.trim()
    expect(rustIdentity.compiler.executableSha256).toBe(
      `sha256:${createHash("sha256")
        .update(readFileSync(selectedRustc))
        .digest("hex")}`,
    )
    expect(rustIdentity.compiler).toMatchObject({
      invocationShim: {
        executableSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        resolvedPathSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      },
    })
    expect(rustIdentity.adapter).toMatchObject({
      dependencies: {
        engineSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        specSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      },
    })
    expect(rustIdentity.identitySha256).not.toBe(zigIdentity.identitySha256)
  }, 15_000)

  it("does not expose an unbound revision source byte count as authority", () => {
    expect(
      "sourceBytes" in buildRustWasmCandidateRevisionV117(candidateRustSource),
    ).toBe(false)
  })

  it("keeps candidate metadata inactive and counted authority unavailable", () => {
    for (const language of ["rust", "zig"] as const) {
      expect(wasmWasiRuntimeMetadataV117(language)).toMatchObject({
        abiVersion: "strategy-runtime-abi-v1.17",
        candidateStatus: "inactive-candidate",
        current: false,
        countedCertification: "uncertified",
        productionTrustedProducers: [],
      })
    }
  })

  it("commits schema-identical Rust and Zig guest envelopes with no trusted producer", () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL(
          "../../spec/artifacts/runtime-abi-v1.17-wasm-language-envelopes.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      schemaVersion: string
      candidateStatus: string
      current: boolean
      productionTrustedProducers: unknown[]
      languages: Array<Record<string, unknown>>
    }

    expect(fixture).toMatchObject({
      schemaVersion: "runtime-abi-v1.17-wasm-language-envelopes-v1",
      candidateStatus: "inactive-candidate",
      current: false,
      productionTrustedProducers: [],
    })
    expect(fixture.languages.map((lane) => lane.languageId)).toEqual([
      "rust",
      "zig",
    ])
    const [rust, zig] = fixture.languages
    for (const field of [
      "guestRequestFields",
      "guestPayloadFields",
      "resultKinds",
      "budgetFields",
    ]) {
      expect(rust?.[field]).toEqual(zig?.[field])
    }
    expect(rust?.countedCertification).toBe("uncertified")
    expect(zig?.countedCertification).toBe("uncertified")
  })
})

describe("WASM/WASI runtime alpha", () => {
  it.skipIf(!rustCompileProbe.ok)(
    "compiles Rust source to immutable WASM artifact metadata",
    () => {
      const compiled = compileRustWasmArtifact(rustSource)

      expect(compiled.ok).toBe(true)
      expect(compiled.artifact?.format).toBe("wasm")
      expect(compiled.artifact?.wasiProfile).toBe("preview1")
      expect(compiled.artifact?.abiEnvelope).toBe("stdin-stdout-json")
      expect(compiled.artifact?.bytesBase64).toBeTruthy()
    },
  )

  it.skipIf(!rustCompileProbe.ok)(
    "runs selectActivations and soldierBrain through Wasmtime",
    () => {
      const revision = buildRustStrategyRevision({ source: rustSource })
      const runtime = createWasmWasiRuntimeFromRevision(revision)

      expect(
        runtime.selectActivations({
          phaseNumber: 1,
          roundNumber: 1,
          activationCount: 1,
          board: {
            bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
            soldiers: [],
            terrainStones: [],
          },
          mySoldiers: [],
          enemySoldiers: [],
          strategyMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { activationOrders: [], strategyMemory: null },
      })
      expect(
        runtime.runSoldierBrain({
          self: {
            id: "soldier:1",
            ownerPlayerId: "player:1",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          awarenessGrid: { cells: [] },
          cycleIndex: 0,
          maxCycles: 12,
          soldierMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: null },
      })
    },
  )

  it.skipIf(!rustCompileProbe.ok)(
    "normalizes corrupt artifact identity as a retryable system failure",
    () => {
      const revision = buildRustStrategyRevision({ source: rustSource })
      const artifact = revision.metadata.compiledArtifact
      expect(artifact).toBeDefined()
      if (artifact?.bytesBase64 === undefined) return
      const corruptRevision = {
        ...revision,
        metadata: {
          ...revision.metadata,
          compiledArtifact: {
            ...artifact,
            bytesBase64: `${artifact.bytesBase64.startsWith("A") ? "B" : "A"}${artifact.bytesBase64.slice(1)}`,
          },
        },
      }

      const result = createWasmWasiRuntimeFromRevision(
        corruptRevision,
      ).runSoldierBrain({
        self: {
          id: "soldier:1",
          ownerPlayerId: "player:1",
          status: "ACTIVE",
          position: { x: 0, y: 0 },
          facing: "UP",
          lastSuccessfulMoveDirection: null,
        },
        awarenessGrid: { cells: [] },
        cycleIndex: 0,
        maxCycles: 12,
        soldierMemory: null,
      })

      expect(result).toMatchObject({
        ok: false,
        systemFailure: { code: "MALFORMED_IPC", retryable: true },
      })
    },
  )

  it.skipIf(!zigCompileProbe.ok)(
    "compiles and runs Zig through the same WASI JSON artifact contract",
    () => {
      const compiled = compileZigWasmArtifact(zigSource)
      expect(compiled.ok).toBe(true)
      expect(compiled.artifact?.format).toBe("wasm")
      expect(compiled.artifact?.targetTriple).toBe("wasm32-wasi")
      expect(compiled.artifact?.toolchain.language).toBe("zig")

      const revision = buildZigStrategyRevision({ source: zigSource })
      const runtime = createWasmWasiRuntimeFromRevision(revision)

      expect(
        runtime.runSoldierBrain({
          self: {
            id: "soldier:1",
            ownerPlayerId: "player:1",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          awarenessGrid: { cells: [] },
          cycleIndex: 0,
          maxCycles: 12,
          soldierMemory: null,
        }),
      ).toEqual({
        ok: true,
        value: { action: { type: "TURN_TO_STONE" }, soldierMemory: null },
      })
    },
    20_000,
  )

  it("fails validation for forbidden Rust host capabilities", () => {
    const validation = validateRustStrategySource(
      `${rustSource}\nfn bad() { let _ = std::fs::read_to_string("/etc/passwd"); }`,
    )

    expect(validation.valid).toBe(false)
    expect(validation.forbiddenPatterns).toContain("std::fs")
  })

  it("records Zig counted provider readiness evidence", () => {
    const evidence = zigReadinessEvidence()

    expect(evidence.target).toBe("wasm32-wasi")
    expect(evidence.message).toContain("Zig")
    expect(evidence.compileProof).toBe(evidence.ok)
    expect(evidence.runtimeProof).toBe(evidence.ok)
  }, 20_000)

  it("fails Zig validation for std-backed host capabilities", () => {
    const validation = validateZigStrategySource(
      `${zigSource}\nconst std = @import("std");`,
    )

    expect(validation.valid).toBe(false)
    expect(validation.forbiddenPatterns).toContain('@import("std")')
  })
})
