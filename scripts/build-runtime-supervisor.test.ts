import { describe, expect, it } from "vitest"
import {
  PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE,
  buildRuntimeSupervisorManifest,
  inspectSupervisorElfIdentity,
  supervisorBuildDockerArgs,
} from "./build-runtime-supervisor.js"

describe("runtime supervisor locked build", () => {
  it("uses one immutable offline-disabled Linux builder invocation", () => {
    expect(PINNED_RUNTIME_SUPERVISOR_BUILDER_IMAGE).toBe(
      "rust:1.95.0-alpine@sha256:e98196986adced5602f6e21c54babdbf2a8700400c7a78868324a3630e0c5d15",
    )
    const args = supervisorBuildDockerArgs("/repo")
    expect(args).toEqual(
      expect.arrayContaining([
        "--platform",
        "linux/amd64",
        "--network",
        "none",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--read-only",
      ]),
    )
    expect(args.join("\n")).toContain("--target x86_64-unknown-linux-musl")
    expect(args.join("\n")).toContain('test "$(uname -m)" = x86_64')
  })

  it("changes the manifest for any source lock seccomp or binary byte", () => {
    const first = buildRuntimeSupervisorManifest({
      sourceBytes: new Uint8Array([1]),
      cargoLockBytes: new Uint8Array([2]),
      seccompProfileBytes: new Uint8Array([3]),
      binaryBytes: new Uint8Array([4]),
      rustcVersion: "rustc 1.95.0 (59807616e 2026-04-14)",
      cargoVersion: "cargo 1.95.0 (f2d3ce0bd 2026-03-21)",
    })
    for (const key of [
      "sourceBytes",
      "cargoLockBytes",
      "seccompProfileBytes",
      "binaryBytes",
    ] as const) {
      const changed = buildRuntimeSupervisorManifest({
        sourceBytes: new Uint8Array([1]),
        cargoLockBytes: new Uint8Array([2]),
        seccompProfileBytes: new Uint8Array([3]),
        binaryBytes: new Uint8Array([4]),
        rustcVersion: first.rustcVersion,
        cargoVersion: first.cargoVersion,
        [key]: new Uint8Array([9]),
      })
      expect(changed).not.toEqual(first)
    }
  })

  it("pins independently observed controller and supervisor identity fields", () => {
    const built = buildRuntimeSupervisorManifest({
      sourceBytes: new Uint8Array([1]),
      cargoLockBytes: new Uint8Array([2]),
      seccompProfileBytes: new Uint8Array([3]),
      binaryBytes: new Uint8Array([4]),
      rustcVersion: "rustc 1.95.0 (59807616e 2026-04-14)",
      cargoVersion: "cargo 1.95.0 (f2d3ce0bd 2026-03-21)",
    })
    expect(built).toMatchObject({
      operatingSystem: "linux",
      cgroupVersion: 2,
      cgroupDriver: "cgroupfs",
      supervisorHostUid: 65532,
      guestNamespaceUid: 65534,
    })
    expect(built.supervisorToolchainSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
  })

  it("rejects any non-x86-64 or dynamically linked supervisor artifact", () => {
    expect(
      inspectSupervisorElfIdentity(
        Buffer.from(
          "ELF 64-bit LSB pie executable, x86-64, statically linked, stripped",
        ),
      ),
    ).toEqual({
      architecture: "x86_64",
      libc: "musl-static",
    })
    for (const output of [
      "ELF 64-bit LSB pie executable, ARM aarch64, statically linked",
      "ELF 64-bit LSB pie executable, x86-64, dynamically linked",
    ]) {
      expect(() => inspectSupervisorElfIdentity(Buffer.from(output))).toThrow(
        /ELF|target|musl|static/iu,
      )
    }
  })
})
