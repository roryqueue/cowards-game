import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  COUNTED_TYPESCRIPT_RUNTIME_V1_18,
  createTypeScriptRuntimeCompilerIdentityV118,
} from "./revision-v1-18.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const fileSha256 = (relative: string): string =>
  createHash("sha256")
    .update(readFileSync(new URL(relative, import.meta.url)))
    .digest("hex")

describe("TypeScript counted runtime v1.18 identity", () => {
  it("defines one additive supervised counted selector", () => {
    expect(COUNTED_TYPESCRIPT_RUNTIME_V1_18).toEqual({
      schemaVersion: "counted-runtime-lane-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      laneId: "typescript",
      selectorId: "typescript-native-supervised-v1.18",
      executionBoundary: "native-linux-cgroup-v2-supervisor",
      directExecutionAllowed: false,
      workerFallbackAllowed: false,
      containerOnlyFallbackAllowed: false,
      priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
    })
    expect(Object.isFrozen(COUNTED_TYPESCRIPT_RUNTIME_V1_18)).toBe(true)
  })

  it("binds the exact Node executable and version into one runtime compiler identity", () => {
    const first = createTypeScriptRuntimeCompilerIdentityV118({
      nodeExecutableSha256: hash("a"),
      nodeVersion: "v24.4.1",
      v8Version: "13.6.233.10-node.17",
    })
    expect(first).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(
      createTypeScriptRuntimeCompilerIdentityV118({
        nodeExecutableSha256: hash("b"),
        nodeVersion: "v24.4.1",
        v8Version: "13.6.233.10-node.17",
      }),
    ).not.toBe(first)
    expect(
      createTypeScriptRuntimeCompilerIdentityV118({
        nodeExecutableSha256: hash("a"),
        nodeVersion: "v24.4.2",
        v8Version: "13.6.233.10-node.17",
      }),
    ).not.toBe(first)
  })

  it("rejects unbounded or noncanonical runtime identity input", () => {
    expect(() =>
      createTypeScriptRuntimeCompilerIdentityV118({
        nodeExecutableSha256: "latest" as `sha256:${string}`,
        nodeVersion: "v24.4.1",
        v8Version: "13.6.233.10-node.17",
      }),
    ).toThrow(/identity/u)
    expect(() =>
      createTypeScriptRuntimeCompilerIdentityV118({
        nodeExecutableSha256: hash("a"),
        nodeVersion: "",
        v8Version: "13.6.233.10-node.17",
      }),
    ).toThrow(/identity/u)
  })

  it("keeps every prior v1.17 execution byte immutable", () => {
    expect(fileSha256("./revision-v1-17.ts")).toBe(
      "fa95e1e5c5ce43eaba6719545e2f1f1fb25da8026bd7048f75ba17f6d14aceda",
    )
    expect(fileSha256("./subprocess-adapter.ts")).toBe(
      "53b4826f74c5e08c5e5fa14bee433f1d5c57a3a043d18d068586fda5f8ec5751",
    )
    expect(fileSha256("./container-subprocess-adapter.ts")).toBe(
      "42f62d93f766079146e3ec7d8d11afb08ebf263369b8da2f7317f4e80addd9de",
    )
  })
})
