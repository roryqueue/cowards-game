import { describe, expect, it } from "vitest"
import {
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  type CompiledStrategyRevisionV117,
} from "@cowards/spec"
import {
  buildRustStrategyRevisionV117,
  buildZigStrategyRevisionV117,
} from "@cowards/runtime-wasm-wasi/validation"
import {
  DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
  createDeploymentLaneIdentityResolver,
  type DeploymentLaneProfile,
  type DeploymentLaneRegistry,
} from "./deployment-lane-registry.js"

const rustSource = `fn main() {
    print!("{}", r#"{"action":{"type":"TURN_TO_STONE"},"soldierMemory":null}"#);
}
`

const zigSource = `const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;
export fn _start() void {
    const bytes = "{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}";
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}
`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const registryFor = (
  revision: CompiledStrategyRevisionV117,
): DeploymentLaneRegistry => {
  const artifact = revision.metadata.compiledArtifact
  const profile: DeploymentLaneProfile = {
    providerId: revision.metadata.providerValidation.providerId,
    languageId: revision.runtime.language.id,
    languageVersion: revision.runtime.language.version,
    runtimeId: "wasmtime",
    runtimeVersion: "v1.17-fixture",
    toolchainId: artifact.toolchain.compiler,
    toolchainVersion: artifact.toolchain.compilerVersion,
    adapterId: revision.runtime.adapter.id,
    adapterVersion: revision.runtime.adapter.version,
    policyId: "fixture.containment.package-none.v1.17",
    policyVersion: "v1.17",
    corpusId: "fixture.full-state-conformance.v1.17",
    corpusVersion: "v1.17",
    artifactKind: "compiled",
    artifactIdPrefix: "artifact:",
    implementationId: "runtime-service-v1.17-fixture",
    buildId: "runtime-service-v1.17-fixture-build",
    semanticTupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
    semanticTuple: { ...CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE },
  }
  return {
    schemaVersion: DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
    registryId: "fixture:compiled-v1.17",
    lanes: [profile],
  }
}

describe("v1.17 compiled deployment-lane resolution", () => {
  it.each([
    ["rust", () => buildRustStrategyRevisionV117({ source: rustSource })],
    ["zig", () => buildZigStrategyRevisionV117({ source: zigSource })],
  ])("resolves persisted standard-shape %s revisions", (_language, build) => {
    const revision = clone(build())
    const resolved = createDeploymentLaneIdentityResolver(
      registryFor(revision),
    )(revision)
    expect(resolved).toMatchObject({
      providerId: revision.metadata.providerValidation.providerId,
      languageId: revision.runtime.language.id,
      artifactSha256: revision.metadata.compiledArtifact.hash,
      semanticTupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
    })
  }, 30_000)

  it("rejects raw-source substitution and mixed artifact kinds", () => {
    const revision = clone(buildRustStrategyRevisionV117({ source: rustSource }))
    const resolve = createDeploymentLaneIdentityResolver(registryFor(revision))
    const rawSourceSubstitution = clone(revision)
    rawSourceSubstitution.metadata.compiledArtifact.sourceHash =
      rawSourceSubstitution.sourceHash
    expect(resolve(rawSourceSubstitution)).toBeUndefined()

    const mixedArtifacts = clone(revision) as unknown as {
      metadata: Record<string, unknown>
    }
    mixedArtifacts.metadata.sourceArtifact = {
      ...(mixedArtifacts.metadata.compiledArtifact as Record<string, unknown>),
      format: "transpiled-javascript",
    }
    expect(
      resolve(mixedArtifacts as unknown as CompiledStrategyRevisionV117),
    ).toBeUndefined()
  }, 30_000)
})
