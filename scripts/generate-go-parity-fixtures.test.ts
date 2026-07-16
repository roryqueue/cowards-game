import type { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { createStrategyRevisionId } from "../packages/runtime-js/src/index.ts"
import {
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  COMPATIBILITY_VERSIONS,
  RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
  STRATEGY_RUNTIME_ABI_VERSION,
  StrategyRevisionSchema,
  StrategyRevisionV117Schema,
  SUCCESSOR_RUNTIME_LANE_PROFILE_DOMAIN_V117,
  SUCCESSOR_RUNTIME_LANE_PROFILE_FIELDS_V117,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  hashExecutableLaneIdentity,
  hashSuccessorRuntimeLaneProfileV117,
  runtimeCompatibilityKey,
  type ExecutableLaneIdentity,
  type StrategyRevisionV117,
  type SuccessorRuntimeIdentityTemplateV117,
} from "../packages/spec/src/index.ts"

const repoRoot = path.resolve(import.meta.dirname, "..")
const read = (relativePath: string): Buffer =>
  readFileSync(
    path.isAbsolute(relativePath)
      ? relativePath
      : path.join(repoRoot, relativePath),
  )
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const scriptPath = path.join(repoRoot, "scripts/generate-go-parity-fixtures.ts")
const generatedPath = path.join(
  repoRoot,
  "apps/go-backend/runtime_execution_contract_gen.go",
)
const v116RequestPath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
)
const v116ResponsePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
)
const candidateRequestRelative =
  "packages/spec/artifacts/runtime-invocation-request.v1.17.candidate.json"
const candidateResponseRelative =
  "packages/spec/artifacts/runtime-invocation-response.v1.17.candidate.wire.json"
const serviceRequestRelative =
  "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json"
const serviceResponseRelative =
  "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json"
const currentServiceRequestRelative =
  "packages/spec/artifacts/runtime-execution-service-request.v1.17.json"
const currentServiceResponseRelative =
  "packages/spec/artifacts/runtime-execution-service-response.v1.17.wire.json"
const successorAuthorityFixtureRelative =
  "packages/spec/artifacts/runtime-successor-authority-v1.17.fixture.json"
const generatedRelative = "apps/go-backend/runtime_execution_contract_gen.go"
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const makeVersionRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "go-parity-v117-"))
  temporaryRoots.push(root)
  for (const source of [
    v116RequestPath,
    v116ResponsePath,
    path.join(repoRoot, "packages/spec/src/runtime-execution-service.ts"),
    path.join(repoRoot, "apps/runtime-service/src/semantic-receipt.ts"),
    path.join(repoRoot, "apps/go-backend/runtime_semantic_receipt.go"),
    path.join(repoRoot, "apps/go-backend/runtime_service_client.go"),
    path.join(repoRoot, "apps/go-backend/runtime_service_client_test.go"),
    path.join(
      repoRoot,
      "packages/persistence/migrations/0017_runtime_semantic_receipts.sql",
    ),
  ]) {
    const relative = path.relative(repoRoot, source)
    const target = path.join(root, relative)
    mkdirSync(path.dirname(target), { recursive: true })
    cpSync(source, target)
  }
  return root
}

const runGenerator = (args: readonly string[]) =>
  spawnSync("pnpm", ["exec", "tsx", scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120_000,
  })

const listFiles = (root: string): string[] => {
  const results: string[] = []
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(absolute)
      else results.push(path.relative(root, absolute))
    }
  }
  visit(root)
  return results.sort()
}

describe("versioned TypeScript-to-Go parity generator", () => {
  it(
    "is pure on import and keeps all writes behind an explicit guarded main",
    () => {
      const source = read(scriptPath).toString("utf8")
      expect(source).toContain("pathToFileURL")
      expect(source).toMatch(/import\.meta\.url\s*===\s*pathToFileURL/)

      const watched = [generatedPath, v116RequestPath, v116ResponsePath]
      const before = watched.map((file) => statSync(file).mtimeMs)
      const imported = spawnSync(
        "pnpm",
        ["exec", "tsx", "-e", `void import(${JSON.stringify(scriptPath)})`],
        { cwd: repoRoot, encoding: "utf8", timeout: 120_000 },
      )
      expect(imported.status, imported.stderr).toBe(0)
      expect(watched.map((file) => statSync(file).mtimeMs)).toEqual(before)
    },
    20_000,
  )

  it("protects immutable v1.16 bytes and exposes only an explicit v1.17 writer", () => {
    const source = read("scripts/generate-go-parity-fixtures.ts").toString(
      "utf8",
    )
    expect(source).toContain('args.includes("--root")')
    expect(source).toContain('args.includes("--versions-only")')
    expect(source).toContain('args.includes("--write-v1.17-invocation")')
    expect(source).toContain('args.includes("--write-v1.17-service")')
    expect(source).toContain('"--write-v1.17-current-service"')
    expect(source).toContain('args.includes("--write-v1.16")')
    expect(source).toContain("Refusing to rewrite immutable v1.16")
    expect(source).not.toContain("writeFileSync(runtimeExecutionWireGoldenPath")

    expect(
      sha256(
        read(
          "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        ),
      ),
    ).toBe("5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5")
    expect(
      sha256(
        read(
          "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
        ),
      ),
    ).toBe("9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97")
  })

  it("refuses a v1.16 write before changing any byte", () => {
    const root = makeVersionRoot()
    const before = listFiles(root).map((relative) => [
      relative,
      sha256(readFileSync(path.join(root, relative))),
    ])
    const completed = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.16",
    ])
    expect(completed.status).toBe(1)
    expect(`${completed.stdout}\n${completed.stderr}`).toContain(
      "Refusing to rewrite immutable v1.16",
    )
    expect(
      listFiles(root).map((relative) => [
        relative,
        sha256(readFileSync(path.join(root, relative))),
      ]),
    ).toEqual(before)
  })

  it("recomputes and reports exact immutable v1.16 request and response bytes", () => {
    const root = makeVersionRoot()
    const completed = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--historical-v1.16-only",
      "--check",
    ])
    expect(completed.status, completed.stderr).toBe(0)
    expect(completed.stdout).toContain(
      "[GO_PARITY:v1.16] request=5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5 response=9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97 immutable=true",
    )
    expect(
      readFileSync(path.join(root, path.relative(repoRoot, v116RequestPath))),
    ).toEqual(readFileSync(v116RequestPath))
    expect(
      readFileSync(path.join(root, path.relative(repoRoot, v116ResponsePath))),
    ).toEqual(readFileSync(v116ResponsePath))
  })

  it("writes only the exact deterministic v1.17 fixture and version-table set", () => {
    const root = makeVersionRoot()
    const beforeFiles = listFiles(root)
    const first = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(first.status, first.stderr).toBe(0)

    const added = listFiles(root).filter(
      (relative) => !beforeFiles.includes(relative),
    )
    expect(added).toEqual(
      [
        candidateRequestRelative,
        candidateResponseRelative,
        generatedRelative,
      ].sort(),
    )
    expect(readFileSync(path.join(root, candidateRequestRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateRequestRelative)),
    )
    expect(readFileSync(path.join(root, candidateResponseRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateResponseRelative)),
    )

    const firstHashes = Object.fromEntries(
      added.map((relative) => [
        relative,
        sha256(readFileSync(path.join(root, relative))),
      ]),
    )
    const second = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(second.status, second.stderr).toBe(0)
    expect(
      Object.fromEntries(
        added.map((relative) => [
          relative,
          sha256(readFileSync(path.join(root, relative))),
        ]),
      ),
    ).toEqual(firstHashes)
  }, 30_000)

  it("binds candidate receipt bytes to the canonical success frame", () => {
    const response = JSON.parse(
      read(candidateResponseRelative).toString("utf8"),
    ) as {
      outcome: { value: unknown }
      payloadBinding: { canonicalByteLength: number }
      accounting: {
        receipt: {
          counters: Record<
            "payloadBytes" | "stdoutBytes" | "stderrBytes",
            { delta: number }
          >
        }
      }
    }
    const payloadBytes = Buffer.from(JSON.stringify(response.outcome.value))
    const observedFrameBytes = Buffer.concat([
      Buffer.from("S", "utf8"),
      payloadBytes,
    ])

    expect(response.payloadBinding.canonicalByteLength).toBe(
      payloadBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.payloadBytes.delta).toBe(
      payloadBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.stdoutBytes.delta).toBe(
      observedFrameBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.stderrBytes.delta).toBe(0)
  })

  it("keeps per-invocation and full-service candidate namespaces disjoint", () => {
    const root = makeVersionRoot()
    const invocation = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(invocation.status, invocation.stderr).toBe(0)
    expect(existsSync(path.join(root, candidateRequestRelative))).toBe(true)
    expect(existsSync(path.join(root, candidateResponseRelative))).toBe(true)
    expect(existsSync(path.join(root, serviceRequestRelative))).toBe(false)
    expect(existsSync(path.join(root, serviceResponseRelative))).toBe(false)
    expect(existsSync(path.join(root, successorAuthorityFixtureRelative))).toBe(
      false,
    )

    const service = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-service",
      "--check",
    ])
    expect(service.status, service.stderr).toBe(0)
    expect(existsSync(path.join(root, serviceRequestRelative))).toBe(true)
    expect(existsSync(path.join(root, serviceResponseRelative))).toBe(true)
    expect(existsSync(path.join(root, successorAuthorityFixtureRelative))).toBe(
      true,
    )
    expect(readFileSync(path.join(root, serviceRequestRelative))).not.toEqual(
      readFileSync(path.join(root, candidateRequestRelative)),
    )
    expect(readFileSync(path.join(root, serviceResponseRelative))).not.toEqual(
      readFileSync(path.join(root, candidateResponseRelative)),
    )
    expect(
      readFileSync(path.join(root, successorAuthorityFixtureRelative)),
    ).toEqual(
      readFileSync(path.join(repoRoot, successorAuthorityFixtureRelative)),
    )
    expect(
      JSON.parse(readFileSync(path.join(root, serviceRequestRelative), "utf8"))
        .compatibilityTupleId,
    ).toBe(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID)
  }, 30_000)

  it("writes only the exact canonical current service pair for activation", () => {
    const root = makeVersionRoot()
    const beforeFiles = listFiles(root)
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-current-service",
    ])
    expect(written.status, written.stderr).toBe(0)
    expect(
      listFiles(root).filter((relative) => !beforeFiles.includes(relative)),
    ).toEqual(
      [currentServiceRequestRelative, currentServiceResponseRelative].sort(),
    )
    const request = readFileSync(path.join(root, currentServiceRequestRelative))
    const response = readFileSync(
      path.join(root, currentServiceResponseRelative),
    )
    expect(request).toEqual(read(serviceRequestRelative))
    expect(response).toEqual(read(serviceResponseRelative))
    expect(request.at(-1)).toBe("}".charCodeAt(0))
    expect(response.at(-1)).toBe("}".charCodeAt(0))
  }, 30_000)

  it("fails check mode when either complete v1.17 fixture family is absent", () => {
    const empty = makeVersionRoot()
    const first = runGenerator(["--root", empty, "--versions-only", "--check"])
    expect(first.status).toBe(1)
    expect(`${first.stdout}\n${first.stderr}`).toMatch(/v1\.17|stale/iu)

    const root = makeVersionRoot()
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--write-v1.17-service",
      "--check",
    ])
    expect(written.status, written.stderr).toBe(0)
    rmSync(path.join(root, candidateRequestRelative))
    rmSync(path.join(root, candidateResponseRelative))
    const missingInvocation = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--check",
    ])
    expect(missingInvocation.status).toBe(1)

    const serviceOnly = makeVersionRoot()
    const serviceWritten = runGenerator([
      "--root",
      serviceOnly,
      "--versions-only",
      "--write-v1.17-service",
      "--check",
    ])
    expect(serviceWritten.status, serviceWritten.stderr).toBe(0)
    rmSync(path.join(serviceOnly, successorAuthorityFixtureRelative))
    const missingAuthority = runGenerator([
      "--root",
      serviceOnly,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(missingAuthority.status).toBe(1)
    expect(`${missingAuthority.stdout}\n${missingAuthority.stderr}`).toContain(
      "runtime-successor-authority-v1.17.fixture.json is stale",
    )
  }, 30_000)

  it("fails a stale generated table instead of silently regenerating it", () => {
    const root = makeVersionRoot()
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--write-v1.17-service",
      "--check",
    ])
    expect(written.status, written.stderr).toBe(0)
    const generated = path.join(root, generatedRelative)
    expect(existsSync(generated)).toBe(true)
    writeFileSync(generated, `${readFileSync(generated, "utf8")}stale\n`)

    const checked = runGenerator(["--root", root, "--versions-only", "--check"])
    expect(checked.status).toBe(1)
    expect(`${checked.stdout}\n${checked.stderr}`).toContain(
      "runtime_execution_contract_gen.go is stale",
    )
  }, 30_000)

  it("locks actual v1.17 revisions, deployed lanes, and the spec-owned tuple", () => {
    const fixture = JSON.parse(
      read(successorAuthorityFixtureRelative).toString("utf8"),
    ) as {
      semanticTupleId: string
      semanticTuple: typeof CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE
      template: SuccessorRuntimeIdentityTemplateV117
      installFixture: {
        payloadBytesBase64: string
        expected: {
          attestationIds: string[]
          certificateIds: string[]
        }
      }
      revisionVectors: Array<{
        strategyRevisionId: string
        laneIdentityHash: string
        revision: StrategyRevisionV117
        deployed: ExecutableLaneIdentity
      }>
    }
    expect(fixture.semanticTupleId).toBe(
      CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
    )
    expect(fixture.semanticTuple).toEqual(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE)
    const payload = JSON.parse(
      Buffer.from(fixture.installFixture.payloadBytesBase64, "base64").toString(
        "utf8",
      ),
    ) as {
      attestations: Array<{ attestationId: string }>
      certificates: Array<{
        certificateId: string
        certificateKind: "containment" | "conformance"
        attestationId: string
      }>
    }
    expect(payload.attestations).toHaveLength(4)
    expect(payload.certificates).toHaveLength(4)
    expect(
      new Set(payload.attestations.map(({ attestationId }) => attestationId))
        .size,
    ).toBe(4)
    expect(
      payload.certificates.map(({ certificateKind, attestationId }) => ({
        certificateKind,
        attestationId,
      })),
    ).toEqual([
      {
        certificateKind: "containment",
        attestationId: "attestation:successor-parity:bottom:containment:v1.17",
      },
      {
        certificateKind: "conformance",
        attestationId: "attestation:successor-parity:bottom:conformance:v1.17",
      },
      {
        certificateKind: "containment",
        attestationId: "attestation:successor-parity:top:containment:v1.17",
      },
      {
        certificateKind: "conformance",
        attestationId: "attestation:successor-parity:top:conformance:v1.17",
      },
    ])
    expect(fixture.installFixture.expected.attestationIds).toEqual(
      payload.attestations.map(({ attestationId }) => attestationId).sort(),
    )
    expect(fixture.installFixture.expected.certificateIds).toEqual(
      payload.certificates.map(({ certificateId }) => certificateId).sort(),
    )

    const revisionId = (input: {
      revision: StrategyRevisionV117
      source?: string
      abiVersion?: string
      artifactHash?: string
    }): string => {
      const source = input.source ?? input.revision.source
      const sourceHash = sha256(Buffer.from(source, "utf8"))
      const runtime = {
        ...input.revision.runtime,
        abiVersion: input.abiVersion ?? input.revision.runtime.abiVersion,
      }
      const artifactHash =
        input.artifactHash ?? input.revision.metadata.sourceArtifact!.hash
      return createStrategyRevisionId({
        sourceHash,
        runtimeVersion: runtime.adapter.version,
        specVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
        engineVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
        strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
        strategyId: input.revision.strategyId,
        runtimeCompatibility: runtimeCompatibilityKey({
          runtime,
          sourceHash,
          artifactHash,
          specVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.rules,
          engineVersion: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.engine,
        }),
      })
    }

    for (const vector of fixture.revisionVectors) {
      expect(vector.revision.id).toBe(vector.strategyRevisionId)
      expect(
        StrategyRevisionV117Schema.safeParse(vector.revision).success,
      ).toBe(true)
      expect(StrategyRevisionSchema.safeParse(vector.revision).success).toBe(
        String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.17",
      )
      expect(vector.revision.runtime.abiVersion).toBe(
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.runtimeAbi,
      )
      expect(vector.revision.metadata.sourceArtifact!.abiVersion).toBe(
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE.runtimeAbi,
      )
      expect(vector.deployed.semanticTupleId).toBe(
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      )
      expect(vector.deployed.semanticTuple).toEqual(
        CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
      )
      expect(vector.deployed.toolchainId).toBe(
        vector.revision.metadata.sourceArtifact!.toolchain.runtime,
      )
      expect(vector.deployed.toolchainVersion).toBe(
        vector.revision.metadata.sourceArtifact!.toolchain.runtimeVersion,
      )
      expect(vector.deployed.runtimeId).toBe("node")
      expect(vector.deployed.runtimeVersion).toBe("node-v26.0.0")
      expect(fixture.template.laneProfileSha256).toBe(
        hashSuccessorRuntimeLaneProfileV117({
          providerId: vector.deployed.providerId,
          languageId: vector.deployed.languageId,
          languageVersion: vector.revision.runtime.language.version,
          runtimeId: vector.deployed.runtimeId,
          runtimeVersion: vector.deployed.runtimeVersion,
          toolchainId: vector.deployed.toolchainId,
          toolchainVersion: vector.deployed.toolchainVersion,
          adapterId: vector.deployed.adapterId,
          adapterVersion: vector.deployed.adapterVersion,
          policyId: vector.deployed.policyId,
          policyVersion: vector.deployed.policyVersion,
          corpusId: vector.deployed.corpusId,
          corpusVersion: vector.deployed.corpusVersion,
          artifactKind: "source",
          artifactIdPrefix: "artifact:",
          implementationId: vector.deployed.implementationId,
          buildId: vector.deployed.buildId,
          semanticTupleId: vector.deployed.semanticTupleId,
          semanticTuple: { ...vector.deployed.semanticTuple },
        }),
      )
      expect(new Map(fixture.template.exactPins).get("reportedVersion")).toBe(
        vector.deployed.runtimeVersion,
      )
      expect(vector.revision.runtime.limits).toMatchObject({
        environment: "empty",
        filesystem: "none",
        network: "disabled",
        shell: "disabled",
        packagePolicy: "none",
      })
      expect(vector.revision.metadata.providerValidation).toMatchObject({
        providerId: vector.deployed.providerId,
        sourceHash: vector.revision.sourceHash,
        sourceBytes: vector.revision.sourceBytes,
        artifactHash: vector.revision.metadata.sourceArtifact.hash,
        artifactBytes: vector.revision.metadata.sourceArtifact.bytes,
        proof: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })
      expect(vector.laneIdentityHash).toBe(
        `sha256:${hashExecutableLaneIdentity(vector.deployed)}`,
      )
      expect(revisionId({ revision: vector.revision })).toBe(vector.revision.id)
      expect(
        revisionId({
          revision: vector.revision,
          abiVersion: "strategy-runtime-abi-v1.17-mutated",
        }),
      ).not.toBe(vector.revision.id)
      expect(
        StrategyRevisionV117Schema.safeParse({
          ...vector.revision,
          runtime: {
            ...vector.revision.runtime,
            limits: {
              ...vector.revision.runtime.limits,
              filesystem: "host",
            },
          },
        }).success,
      ).toBe(false)
      expect(
        StrategyRevisionV117Schema.safeParse({
          ...vector.revision,
          metadata: {
            ...vector.revision.metadata,
            providerValidation: {
              ...vector.revision.metadata.providerValidation,
              artifactHash: "0".repeat(64),
            },
          },
        }).success,
      ).toBe(false)
      expect(
        revisionId({ revision: vector.revision, artifactHash: "0".repeat(64) }),
      ).not.toBe(vector.revision.id)
      expect(
        revisionId({
          revision: vector.revision,
          source: `${vector.revision.source}// changed\n`,
        }),
      ).not.toBe(vector.revision.id)
    }
  })

  it("generates one marked closed version table with deny-by-default dispatch", () => {
    const generated = read(
      "apps/go-backend/runtime_execution_contract_gen.go",
    ).toString("utf8")
    expect(
      generated.match(
        /Code generated by scripts\/generate-go-parity-fixtures\.ts/g,
      ),
    ).toHaveLength(1)
    expect(generated).toContain('"runtime-execution-service-v1.16"')
    expect(generated).toContain('"runtime-invocation-v1.17"')
    expect(generated).toContain('"runtime-execution-service-v1.17"')
    expect(generated).toMatch(/Historical:\s+true/u)
    expect(generated).toMatch(/CanonicalJSON:\s+true/u)
    expect(generated).toContain("runtimeInvocationContractForVersion")
    expect(generated).toContain(
      `const runtimeSuccessorSemanticTupleIDV117 = ${JSON.stringify(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID)}`,
    )
    expect(generated).toContain(
      `const runtimeSuccessorSemanticTupleV117 = ${JSON.stringify(JSON.stringify(CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE))}`,
    )
    expect(generated).toContain(
      `const runtimeSuccessorSemanticTupleIdentityProfileV117 = ${JSON.stringify(VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.identityProfile)}`,
    )
    expect(generated).toContain(
      `const runtimeSuccessorSemanticTupleEncodingIDV117 = ${JSON.stringify(VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.encodingId)}`,
    )
    expect(generated).toContain(
      `const runtimeSuccessorLaneProfileDomainV117 = ${JSON.stringify(SUCCESSOR_RUNTIME_LANE_PROFILE_DOMAIN_V117)}`,
    )
    for (const field of SUCCESSOR_RUNTIME_LANE_PROFILE_FIELDS_V117) {
      expect(generated).toContain(`\t${JSON.stringify(field)},`)
    }
    const successorAuthorityFixture = read(successorAuthorityFixtureRelative)
    expect(generated).toContain(
      `const runtimeSuccessorAuthorityFixtureV117JSON = ${JSON.stringify(successorAuthorityFixture.toString("utf8"))}`,
    )
    expect(generated).toContain(
      `const runtimeSuccessorAuthorityFixtureV117SHA256 = ${JSON.stringify(sha256(successorAuthorityFixture))}`,
    )
    expect(generated).not.toMatch(
      /defaultRuntime|fallbackRuntime|return\s+runtimeInvocationContracts\[/,
    )

    const writers = [
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ].filter((relativePath) =>
      read(relativePath)
        .toString("utf8")
        .includes("runtime_execution_contract_gen.go"),
    )
    expect(writers).toEqual([
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ])
  })

  it("keeps the successor authority artifact under one explicit writer", () => {
    const owners = [
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ].filter((relativePath) =>
      read(relativePath)
        .toString("utf8")
        .includes("runtime-successor-authority-v1.17.fixture.json"),
    )
    expect(owners).toEqual([
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ])
    const source = read("scripts/generate-go-parity-fixtures.ts").toString(
      "utf8",
    )
    expect(source).toContain('args.includes("--write-v1.17-service")')
    expect(source).toContain("paths.v117SuccessorAuthorityFixture")
  })

  it("rejects unknown and cross-version aliases in the generated dispatch source", () => {
    const generated = read(generatedRelative).toString("utf8")
    expect(generated).toContain("switch version")
    expect(generated).toContain(
      "return runtimeInvocationContractDescriptor{}, false",
    )
    for (const forbidden of [
      '"strategy-runtime-abi-v1.14"',
      '"stdin-stdout-json"',
    ]) {
      expect(generated).not.toContain(forbidden)
    }
  })

  it("generates the exact complete TypeScript retryability matrix for Go consumers", () => {
    const generated = read(generatedRelative).toString("utf8")
    const entries = Object.fromEntries(
      [
        ...generated.matchAll(
          /\tcase "([A-Z0-9_]+)":\n\t\treturn (true|false), true/g,
        ),
      ].map((match) => [match[1], match[2] === "true"]),
    )
    expect(entries).toEqual(
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
    )

    const runtimeSource = read(
      "apps/go-backend/runtime_invocation_v1_17.go",
    ).toString("utf8")
    expect(runtimeSource).not.toContain(
      "var runtimeInvocationV117SystemFailureCodes = map[string]bool",
    )
    expect(runtimeSource).toContain(
      "runtimeInvocationV117SystemFailureRetryable(code)",
    )
  })

  it("emits no package-global mutable authority maps", () => {
    const generated = read(generatedRelative).toString("utf8")
    expect(generated).not.toContain(
      "var runtimeInvocationContracts = map[string]runtimeInvocationContractDescriptor",
    )
    expect(generated).not.toContain(
      "var runtimeInvocationV117SystemFailureRetryability = map[string]bool",
    )
    expect(generated).not.toContain(
      "var runtimeServiceContractFailureCodes = map[string]struct{}",
    )
    expect(generated).toContain("switch version")
    expect(generated).toContain("switch code")
    expect(generated).toContain("runtimeInvocationContractsSnapshot")
    expect(generated).toContain(
      "runtimeInvocationV117SystemFailureRetryabilitySnapshot",
    )
    expect(generated).toContain("runtimeServiceContractFailureCodeKnown")
    expect(generated).toContain("runtimeServiceContractFailureCodesSnapshot")
    expect(
      read("apps/go-backend/runtime_service_client.go").toString("utf8"),
    ).toContain("runtimeServiceContractFailureCodeKnown(code)")
  })
})
