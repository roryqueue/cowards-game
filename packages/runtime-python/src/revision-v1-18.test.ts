import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  COUNTED_PYTHON_RUNTIME_V1_18,
  createPythonAdapterBuildIdentityV118,
  createPythonRuntimeCompilerIdentityV118,
} from "./python-supervised-subprocess-adapter.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const historicalBlobSha256 = (commit: string, relative: string): string =>
  createHash("sha256")
    .update(
      execFileSync("git", [
        "show",
        `${commit}:packages/runtime-python/src/${relative}`,
      ]),
    )
    .digest("hex")

describe("Python counted runtime v1.18 identity", () => {
  it("defines one additive real-host supervised selector", () => {
    expect(COUNTED_PYTHON_RUNTIME_V1_18).toEqual({
      schemaVersion: "counted-runtime-lane-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      laneId: "python",
      selectorId: "python-native-supervised-v1.18",
      executionBoundary: "native-linux-cgroup-v2-supervisor",
      isolatedInterpreter: true,
      directSpawnAllowed: false,
      diagnosticFallbackAllowed: false,
      priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
    })
    expect(Object.isFrozen(COUNTED_PYTHON_RUNTIME_V1_18)).toBe(true)
  })

  it("binds executable, version, and stdlib into the runtime compiler identity", () => {
    const identity = createPythonRuntimeCompilerIdentityV118({
      pythonExecutableSha256: hash("a"),
      pythonVersion: "Python 3.13.5",
      stdlibSha256: hash("b"),
    })
    expect(identity).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(
      createPythonRuntimeCompilerIdentityV118({
        pythonExecutableSha256: hash("a"),
        pythonVersion: "Python 3.13.5",
        stdlibSha256: hash("c"),
      }),
    ).not.toBe(identity)
  })

  it("binds both the TypeScript adapter and Python host bytes into one adapter build", () => {
    const identity = createPythonAdapterBuildIdentityV118({
      adapterModuleSha256: hash("d"),
      pythonHostSha256: hash("e"),
    })
    expect(identity).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(
      createPythonAdapterBuildIdentityV118({
        adapterModuleSha256: hash("f"),
        pythonHostSha256: hash("e"),
      }),
    ).not.toBe(identity)
  })

  it("rejects missing, relabeled, or noncanonical exact identity input", () => {
    expect(() =>
      createPythonRuntimeCompilerIdentityV118({
        pythonExecutableSha256: "python3" as `sha256:${string}`,
        pythonVersion: "Python 3.13.5",
        stdlibSha256: hash("b"),
      }),
    ).toThrow(/identity/u)
    expect(() =>
      createPythonAdapterBuildIdentityV118({
        adapterModuleSha256: hash("d"),
        pythonHostSha256: "" as `sha256:${string}`,
      }),
    ).toThrow(/identity/u)
  })

  it("keeps archived Python v1.17 host and protocol blobs immutable while current code evolves", () => {
    expect(
      historicalBlobSha256(
        "c4a16e98b2610d943e3b04acc43b39c388f15376",
        "python-subprocess-adapter.ts",
      ),
    ).toBe(
      "b73b6d5860fdaa3ab6f066b7ca76e709d0f77631d602cfd4014e3c49a7443384",
    )
    expect(
      historicalBlobSha256(
        "be3a004071680c94b3fedb059e36a60007c19994",
        "revision-v1-17.test.ts",
      ),
    ).toBe(
      "8359841a6ad4809cdf76b5c9b400f100f5bfff10d4403d0f310ef6f6e4c4c235",
    )
    expect(
      historicalBlobSha256(
        "52f64a10a1fa70c0773993bb24c9b4b2c7a6b1a5",
        "python_runtime_host.py",
      ),
    ).toBe(
      "334bb2cb839738a35c5346b378daa4b8e36343e949994460e9a911b92f969a96",
    )
  })
})
