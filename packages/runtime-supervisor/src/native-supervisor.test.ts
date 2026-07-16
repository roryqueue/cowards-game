import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  createRuntimeInvocationRequestV118,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
} from "@cowards/spec"
import {
  createSupervisorInvocationRequestV118,
  deriveSupervisorExecutionIdentityV118,
} from "./supervisor-contract.js"
import {
  NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118,
  runPinnedNativeSupervisorV118,
  verifyNativeSupervisorManifestV118,
  type NativeSupervisorBuildManifestV118,
} from "./native-supervisor.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const manifest = (): NativeSupervisorBuildManifestV118 => ({
  schemaVersion: NATIVE_SUPERVISOR_MANIFEST_SCHEMA_V118,
  sourceSha256: hash("1"),
  cargoLockSha256: hash("2"),
  seccompProfileSha256: hash("3"),
  builderImage:
    "rust:1.95.0-alpine@sha256:e98196986adced5602f6e21c54babdbf2a8700400c7a78868324a3630e0c5d15",
  rustcVersion: "rustc 1.95.0 (59807616e 2026-04-14)",
  cargoVersion: "cargo 1.95.0 (f2d3ce0bd 2026-03-21)",
  target: "x86_64-unknown-linux-musl",
  operatingSystem: "linux",
  guestNamespaceUid: 65534,
  delegatedControllers: ["cpu", "memory", "pids"],
  binarySha256: hash("4"),
})

const request = (supervisorBinarySha256: `sha256:${string}` = hash("4")) => {
  const execution = {
    executablePath: "/usr/bin/node",
    executableBytesSha256: hash("a"),
    argv: ["--input-type=module"],
    environment: [{ name: "LANG", value: "C.UTF-8" }],
  } as const
  const invocation = createRuntimeInvocationRequestV118({
    requestId: "request:native:test:0001",
    invocationId: "invocation:native:test:0001",
    method: "soldierBrain",
    hostNonce: "native-nonce-000000000000000000000001",
    monotonicDeadlineNanoseconds: 9_000_000_000,
    executable: deriveSupervisorExecutionIdentityV118(execution),
    expectedIdentity: {
      supervisorBinarySha256,
      supervisorToolchainSha256: hash("5"),
      linuxKernelSha256: hash("6"),
      dockerEngineSha256: hash("7"),
      dockerImageDigest: hash("8"),
      cgroupDelegationSha256: hash("9"),
      adapterBuildSha256: hash("b"),
      runtimeCompilerSha256: hash("c"),
      artifactSha256: hash("d"),
    },
  })
  return createSupervisorInvocationRequestV118({
    invocation,
    inputBytes: Buffer.from('{"input":true}'),
    execution,
    cancellationChannel: {
      channelId: "cancel:native:test",
      channelNonce: "cancel-nonce-00000000000000000000001",
    },
  })
}

describe("native runtime supervisor", () => {
  it("binds source lock seccomp toolchain target UID controllers and binary", () => {
    expect(
      verifyNativeSupervisorManifestV118(manifest(), {
        sourceSha256: hash("1"),
        cargoLockSha256: hash("2"),
        seccompProfileSha256: hash("3"),
        binarySha256: hash("4"),
      }),
    ).toEqual(manifest())
    for (const key of [
      "sourceSha256",
      "cargoLockSha256",
      "seccompProfileSha256",
      "binarySha256",
    ] as const) {
      expect(() =>
        verifyNativeSupervisorManifestV118(
          { ...manifest(), [key]: hash("0") },
          {
            sourceSha256: hash("1"),
            cargoLockSha256: hash("2"),
            seccompProfileSha256: hash("3"),
            binarySha256: hash("4"),
          },
        ),
      ).toThrow(/manifest|identity/iu)
    }
  })

  it("rejects native non-Linux counted launch before spawn", () => {
    let launched = false
    expect(
      runPinnedNativeSupervisorV118({
        platform: "darwin",
        manifest: manifest(),
        expectedHashes: {
          sourceSha256: hash("1"),
          cargoLockSha256: hash("2"),
          seccompProfileSha256: hash("3"),
          binarySha256: hash("4"),
        },
        request: request(),
        binaryPath: "/private/native-supervisor",
        cgroupRoot: "/private/cgroup",
        spawnSync: () => {
          launched = true
          throw new Error("must not launch")
        },
      }),
    ).toEqual({
      ok: false,
      gameplayDisposition: "no_mutation",
      code: "COUNTED_PLATFORM_UNAVAILABLE",
    })
    expect(launched).toBe(false)
  })

  it("maps one exact native receipt through the shared verifier", () => {
    const binaryBytes = Buffer.from("pinned-native-binary")
    const binarySha256 =
      `sha256:${createHash("sha256").update(binaryBytes).digest("hex")}` as const
    const current = request(binarySha256)
    const currentManifest = { ...manifest(), binarySha256 }
    const payload = Buffer.from('{"action":{"type":"MOVE"}}')
    const receipt = {
      schemaVersion: "cowards-native-supervisor-receipt-v1",
      requestSha256: current.invocation.requestSha256,
      processGroupIdentitySha256: current.expectedProcessGroupIdentitySha256,
      guestNamespaceUid: 65534,
      supervisorHostUid: 65532,
      wallElapsedNanoseconds: 1_000_000,
      cpuUsageBeforeMicroseconds: 100,
      cpuUsageAfterMicroseconds: 200,
      memoryPeakBytes: current.invocation.limits.memoryMaxBytes,
      memoryEventsBefore: {
        low: 0,
        high: 0,
        max: 0,
        oom: 0,
        oom_kill: 0,
        oom_group_kill: 0,
        sock_throttled: 0,
      },
      memoryEventsAfter: {
        low: 0,
        high: 0,
        max: 0,
        oom: 0,
        oom_kill: 0,
        oom_group_kill: 0,
        sock_throttled: 0,
      },
      pidsEventsBefore: { max: 0 },
      pidsEventsAfter: { max: 0 },
      pidsPeak: 1,
      exitCode: 0,
      signal: null,
      timedOut: false,
      stdoutBase64: payload.toString("base64"),
      stderrBase64: "",
      stdoutTruncated: false,
      stderrTruncated: false,
      payloadTruncated: false,
      cgroupEmpty: true,
    }
    const result = runPinnedNativeSupervisorV118({
      platform: "linux",
      manifest: currentManifest,
      expectedHashes: {
        sourceSha256: hash("1"),
        cargoLockSha256: hash("2"),
        seccompProfileSha256: hash("3"),
        binarySha256,
      },
      request: current,
      binaryPath: "/private/native-supervisor",
      cgroupRoot: "/private/cgroup",
      readBinary: () => binaryBytes,
      spawnSync: () => ({
        pid: 123,
        status: 0,
        signal: null,
        stdout: Buffer.from(JSON.stringify(receipt)),
        stderr: Buffer.alloc(0),
        output: [null, Buffer.from(JSON.stringify(receipt)), Buffer.alloc(0)],
        error: undefined,
      }),
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.result.kind).toBe("success")
      expect(result.value.observed.payloadBytes).toBe(payload.byteLength)
      expect(result.value.result).toMatchObject({
        evidence: {
          budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
        },
      })
    }
  })
})
