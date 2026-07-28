import { createHash } from "node:crypto"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const VERSION_TEXT = /^[A-Za-z0-9][A-Za-z0-9._+(): -]{0,255}$/u

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new TypeError("TypeScript runtime compiler identity is invalid")
  }
  return encoded.bytes
}

export const COUNTED_TYPESCRIPT_RUNTIME_V1_18 = Object.freeze({
  schemaVersion: "counted-runtime-lane-v1.18",
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  laneId: "typescript",
  selectorId: "typescript-native-supervised-v1.18",
  executionBoundary: "native-linux-cgroup-v2-supervisor",
  directExecutionAllowed: false,
  workerFallbackAllowed: false,
  containerOnlyFallbackAllowed: false,
  priorDiagnosticAbi: "strategy-runtime-abi-v1.17",
} as const)

export const createTypeScriptRuntimeCompilerIdentityV118 = (input: {
  readonly nodeExecutableSha256: `sha256:${string}`
  readonly nodeVersion: string
  readonly v8Version: string
}): `sha256:${string}` => {
  if (
    !SHA256.test(input.nodeExecutableSha256) ||
    !VERSION_TEXT.test(input.nodeVersion) ||
    !VERSION_TEXT.test(input.v8Version)
  ) {
    throw new TypeError("TypeScript runtime compiler identity is invalid")
  }
  return `sha256:${createHash("sha256")
    .update(
      canonicalBytes({
        identityDomain:
          "cowards-game:typescript-runtime-compiler-identity:v1.18",
        nodeExecutableSha256: input.nodeExecutableSha256,
        nodeVersion: input.nodeVersion,
        v8Version: input.v8Version,
      }),
    )
    .digest("hex")}`
}

export const createTypeScriptAdapterBuildIdentityV118 = (input: {
  readonly adapterModuleSha256: `sha256:${string}`
  readonly harnessSha256: `sha256:${string}`
}): `sha256:${string}` => {
  if (
    !SHA256.test(input.adapterModuleSha256) ||
    !SHA256.test(input.harnessSha256)
  ) {
    throw new TypeError("TypeScript adapter build identity is invalid")
  }
  return `sha256:${createHash("sha256")
    .update(
      canonicalBytes({
        identityDomain:
          "cowards-game:typescript-supervised-adapter-build:v1.18",
        adapterModuleSha256: input.adapterModuleSha256,
        harnessSha256: input.harnessSha256,
      }),
    )
    .digest("hex")}`
}
