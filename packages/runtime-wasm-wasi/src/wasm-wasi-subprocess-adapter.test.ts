import { describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  createAuthenticatedRuntimeInvocationRequestV117,
  serializeRuntimeInvocationResponseV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
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
  resolveWasmWasiAdapterBuildFilesV117,
  type WasmWasiCandidateRevisionV117,
} from "./validation.js"
import { wasmWasiRuntimeMetadataV117 } from "./metadata.js"
import {
  WASM_WASI_V1_17_EXECUTION_SETTINGS,
  createWasmWasiRuntimeFromRevision,
  runWasmWasiStrategyMethodV117Sync,
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
    "id" | "sourceHash" | "metadata"
  >,
  artifactSha256 = revision.metadata.compiledArtifact?.hash,
  outputBytes = 262_144,
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
        originalSourceSha256: `sha256:${revision.sourceHash}`,
        normalizedSourceSha256: `sha256:${revision.sourceHash}`,
        artifactSha256: `sha256:${artifactSha256}`,
      },
      budget: {
        profileId: "runtime-budget-profile-v1.17-candidate",
        wallMilliseconds: 50,
        computeFuel: 10_000_000,
        memoryBytes: 67_108_864,
        outputBytes,
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
          overflow: "stop-before-next-invocation-and-classify-by-proven-cause",
        },
      },
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
})

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
      return observation
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

  it("treats guest stdout as raw Strategy payload and host-authenticates the outer response", () => {
    const request = candidateRequest(revision)
    const response = runCandidateObservation(
      request,
      revision,
      completedObservation(
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
      ),
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
      const response = runCandidateObservation(request, revision, {
        kind: "failed",
        status: null,
        signal: null,
        stdout: new Uint8Array(),
        stderr: new Uint8Array(),
        attribution,
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
        return completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        )
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
        return completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        )
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
        return completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        )
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
      executeGuest: () =>
        completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
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

  it("rejects a legacy v1.14 artifact instead of relabeling it as v1.17", () => {
    const legacyRevision = buildRustStrategyRevision({ source: rustSource })
    const request = candidateRequest(
      legacyRevision as unknown as WasmWasiCandidateRevisionV117,
    )
    const response = runWasmWasiStrategyMethodV117Sync({
      request,
      revision: legacyRevision as unknown as WasmWasiCandidateRevisionV117,
      signingIdentity: candidateSigningIdentity,
      executionIdentity: candidateExecutionIdentity(revision),
      executeGuest: () =>
        completedObservation(
          '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
        ),
    })

    expect(legacyRevision.metadata.compiledArtifact?.abiVersion).toBe(
      "strategy-runtime-abi-v1.14",
    )
    expect(response.outcome).toMatchObject({
      kind: "system_failure",
      failure: { code: "OUTER_FRAME_WRONG_BINDING", retryable: false },
    })
  })

  it("enforces stdout and proven guest stderr ceilings independently", () => {
    const outputLimitedRequest = candidateRequest(
      revision,
      revision.metadata.compiledArtifact?.hash,
      32,
    )
    const stdoutResponse = runCandidateObservation(
      outputLimitedRequest,
      revision,
      completedObservation(
        '{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}',
      ),
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

    for (const response of [stdoutResponse, stderrResponse]) {
      expect(response.outcome).toMatchObject({
        kind: "player_violation",
        violation: { code: "OVERSIZED_OUTPUT" },
      })
    }
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
})

describe("WASM/WASI runtime v1.17 exact Rust/Zig identity", () => {
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
    expect(rustIdentity.identitySha256).not.toBe(zigIdentity.identitySha256)
  }, 15_000)

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
