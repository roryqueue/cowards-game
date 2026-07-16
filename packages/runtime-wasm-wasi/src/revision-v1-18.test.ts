import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  COUNTED_WASM_WASI_RUNTIMES_V1_18,
  WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18,
  createWasmWasiAdapterBuildIdentityV118,
  createWasmWasiManifestRootV118,
  createWasmWasiRuntimeCompilerIdentityV118,
} from "./supervised-wasm-wasi-adapter.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const fileSha256 = (relative: string): string =>
  createHash("sha256")
    .update(readFileSync(new URL(relative, import.meta.url)))
    .digest("hex")

describe("Rust and Zig counted WASM/WASI v1.18 identities", () => {
  it("defines two distinct additive supervised selectors with no counted fallback", () => {
    expect(COUNTED_WASM_WASI_RUNTIMES_V1_18).toEqual([
      {
        schemaVersion: "counted-runtime-lane-v1.18",
        runtimeAbiVersion: "strategy-runtime-abi-v1.18",
        laneId: "rust",
        selectorId: "rust-wasmtime-native-supervised-v1.18",
        executionBoundary: "native-linux-cgroup-v2-supervisor",
        directExecutionAllowed: false,
        containerOnlyFallbackAllowed: false,
        priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
      },
      {
        schemaVersion: "counted-runtime-lane-v1.18",
        runtimeAbiVersion: "strategy-runtime-abi-v1.18",
        laneId: "zig",
        selectorId: "zig-wasmtime-native-supervised-v1.18",
        executionBoundary: "native-linux-cgroup-v2-supervisor",
        directExecutionAllowed: false,
        containerOnlyFallbackAllowed: false,
        priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
      },
    ])
    expect(Object.isFrozen(COUNTED_WASM_WASI_RUNTIMES_V1_18)).toBe(true)
    expect(Object.isFrozen(COUNTED_WASM_WASI_RUNTIMES_V1_18[0])).toBe(true)
  })

  it("keeps local Wasmtime limits explicitly separate from common cgroup units", () => {
    expect(WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18).toMatchObject({
      fuel: { unit: "wasmtime-fuel-units" },
      linearMemory: { unit: "wasm-linear-memory-bytes" },
      usedAsCommonQuantitativeMeter: false,
    })
    expect(WASM_WASI_LOCAL_DEFENSE_LIMITS_V1_18.fuel.maximum).not.toBe(
      100_000_000,
    )
  })

  it("binds compiler, target, flags, sysroot, Wasmtime, adapter, and artifact independently", () => {
    const rust = createWasmWasiRuntimeCompilerIdentityV118({
      languageId: "rust",
      compilerExecutableSha256: hash("1"),
      compilerVersion: "rustc 1.95.0",
      targetTriple: "wasm32-wasip1",
      flagsSha256: hash("2"),
      sysrootSha256: hash("3"),
      wasmtimeExecutableSha256: hash("4"),
      wasmtimeVersion: "wasmtime 45.0.0",
    })
    const zig = createWasmWasiRuntimeCompilerIdentityV118({
      languageId: "zig",
      compilerExecutableSha256: hash("5"),
      compilerVersion: "zig 0.16.0",
      targetTriple: "wasm32-wasi",
      flagsSha256: hash("6"),
      sysrootSha256: hash("7"),
      wasmtimeExecutableSha256: hash("4"),
      wasmtimeVersion: "wasmtime 45.0.0",
    })
    expect(rust).not.toBe(zig)
    expect(
      createWasmWasiRuntimeCompilerIdentityV118({
        languageId: "rust",
        compilerExecutableSha256: hash("1"),
        compilerVersion: "rustc 1.95.0",
        targetTriple: "wasm32-wasip1",
        flagsSha256: hash("8"),
        sysrootSha256: hash("3"),
        wasmtimeExecutableSha256: hash("4"),
        wasmtimeVersion: "wasmtime 45.0.0",
      }),
    ).not.toBe(rust)

    const adapter = createWasmWasiAdapterBuildIdentityV118({
      adapterModuleSha256: hash("9"),
      legacyAdapterSha256: hash("a"),
      supervisorContractSha256: hash("b"),
    })
    const manifest = createWasmWasiManifestRootV118({
      languageId: "rust",
      sourceOriginalSha256: hash("c"),
      sourceNormalizedSha256: hash("d"),
      runtimeCompilerSha256: rust,
      adapterBuildSha256: adapter,
      artifactSha256: hash("e"),
    })
    expect(manifest).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(() =>
      createWasmWasiManifestRootV118({
        languageId: "zig",
        sourceOriginalSha256: hash("c"),
        sourceNormalizedSha256: hash("d"),
        runtimeCompilerSha256: rust,
        adapterBuildSha256: adapter,
        artifactSha256: hash("e"),
      }),
    ).toThrow(/lane/u)
  })

  it("keeps all prior v1.17 implementation bytes immutable", () => {
    expect(fileSha256("./wasm-wasi-subprocess-adapter.ts")).toBe(
      "dcd07df12750f1e61309c752abf298a83c897cc7baf3ed989426c691d450aff8",
    )
    expect(fileSha256("./validation.ts")).toBe(
      "47969e9bd49dc5712e34f180ca2eede9b962ce78b2630b25edff3ea7f87d5c56",
    )
    expect(fileSha256("./metadata.ts")).toBe(
      "d67c81a956718968263f053955b74e46796998cc8e7730e35dbcd9ccfdfb76a6",
    )
  })
})
