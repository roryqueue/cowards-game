import { createHash } from "node:crypto"
import { EventEmitter } from "node:events"
import {
  appendFileSync,
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import {
  execFileSync,
  type ChildProcessWithoutNullStreams,
} from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { PassThrough } from "node:stream"
import { fileURLToPath } from "node:url"
import { beforeAll, describe, expect, it } from "vitest"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"
import { runV137AuditReproductionGate } from "./check-v1-37-audit-reproduction.js"
import {
  MEMORY_PRESSURE_Q_REQUEST,
  observeDarwinHeadroom,
  observeDarwinHeadroomOwned,
  parseMemoryPressureQ,
} from "./lib/v1-38-darwin-headroom.js"
import {
  buildV138Plan26215Authorization,
  buildV138Plan26218AuthorizationV2,
  buildV138SuccessorSourceSeal,
  buildV138SuccessorSourceSealV2,
  checkV138Plan26218ArtifactBranch,
  checkV138Plan26218AuthorizationV2,
  checkV138ReviewedSourceA2,
  checkV138CanonicalParentChain,
  checkV138ReplacementMetricContract,
  checkV138SuccessorSourceSeal,
  checkV138SuccessorSourceSealV2,
  checkSelectedRouteClosureAtCommit,
  checkSelectedRouteEdgeInventory,
  checkPlan26215ArtifactBranch,
  checkV138SuccessorSealCommit,
  checkV138SuccessorSealCommitV2,
  deriveV138ProtectedHistoryV2,
  deriveFormationAbsence,
  deriveSelectedRouteClosureAtCommit,
  deriveV138StaticSourceEdgesFromSnapshot,
  inspectSourceCustody,
  validateV138CanonicalParentChain,
  V138_PLAN_262_18_CANONICAL_PATHS,
  V138_PLAN_262_18_TERMINAL_SCHEMA,
  V138_PLAN_262_19_FRESH_DESTINATIONS,
  v138Plan26215AuthorizationLiteral,
  v138Plan26218AuthorizationLiteral,
  writePlan26215Terminal,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_FOUNDATION_LIVE_SOURCE_PATHS,
  evaluateV138FoundationAdmission,
  renderV138FoundationAdmissionReceipt,
  resolveV138FoundationAdmissionInput,
  type V138FoundationAdmissionInput,
} from "./lib/v1-38-foundation-admission.js"
import {
  V138ParallelCalibrationPolicySchema,
  PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
  PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
  buildV138AuthoritativeMatrixV5Receipt,
  buildV138AuthoritativeMatrixV7Receipt,
  buildV138AuthoritativeMatrixV4Receipt,
  buildV138ExecutionContextV4Receipt,
  buildV138HostHeadroomPreflightV4Receipt,
  buildV138HostHeadroomPreflightV3Receipt,
  buildV138HostHeadroomPreflightV5Receipt,
  buildV138HostHeadroomPreflightV6Receipt,
  buildV138ExecutionContextV5Receipt,
  buildV138ExecutionContextV6Receipt,
  buildV138Plan26219TerminalV2,
  buildV138ParallelCalibrationV5PreflightTerminal,
  buildV138ParallelCalibrationV5Receipt,
  buildV138ParallelCalibrationV6Receipt,
  buildV138ParallelCalibrationV4Receipt,
  buildV138ParallelCalibrationV3Receipt,
  buildV138AuthoritativeMatrixV3Receipt,
  buildV138ParallelCalibrationV2SuccessorReceipt,
  buildV138ParallelCalibrationSuccessorReceipt,
  calibrateV138ParallelMatrix,
  checkV138ExecutionContextV4Receipt,
  checkV138ExecutionContextV5Receipt,
  checkV138ExecutionContextV6Receipt,
  checkV138HostHeadroomPreflightV5Receipt,
  checkV138HostHeadroomPreflightV6Receipt,
  checkV138HistoricalFoundationAdmission,
  checkV138ParallelCalibrationV5Receipt,
  checkV138ParallelCalibrationV6Receipt,
  checkV138AuthoritativeMatrixV6Receipt,
  checkV138AuthoritativeMatrixV7Receipt,
  checkV138Plan26216TerminalBranch,
  checkV138Plan26219TerminalV2,
  checkV138SuccessorV4V5Branch,
  checkV138MatrixDiagnosticV2Receipt,
  checkV138ParallelCalibrationSuccessorReceipt,
  createV138SubprocessShardRunner,
  dispatchV138CurrentMatrixDirectEntry,
  deriveV138CalibrationAttemptMappings,
  deriveV138ParallelCalibrationPolicy,
  deriveV138HistoricalMatrixExpectation,
  enumerateV138CurrentMatrix,
  evaluateV138HistoricalMatrixPredicate,
  executeV138ParallelMatrix,
  isV138ParallelProjectedTotalAdmitted,
  loadV138HistoricalMatrixExpectation,
  mapV138CalibrationTerminalOutcomes,
  planV138MatrixShards,
  parseV138SamplerAuthorization,
  parseV138Plan26213ExecutionAuthorization,
  parseV138Plan26212ExecutionAuthorization,
  projectV138ParallelMatrix,
  reduceV138ParallelMatrixAccounting,
  reduceV138CurrentMatrix,
  renderV138CurrentMatrixReceipt,
  sampleV138ChildRss,
  validateV138HistoricalMatrixExpectation,
  v138SuccessorRoot,
  writeV138AuthoritativeMatrixV5Receipt,
  writeV138ExecutionContextV4Receipt,
  writeV138AuthoritativeMatrixV6Receipt,
  writeV138HostHeadroomPreflightV5Receipt,
  writeV138HostHeadroomPreflightV4Receipt,
  writeV138ImmutableReceipt,
  writeV138MatrixDiagnosticV2Receipt,
  writeV138ParallelCalibrationV4Receipt,
  writeV138ParallelCalibrationV5Receipt,
  writeV138Plan26216Terminal,
  type V138CurrentMatrixAttempt,
  type V138CurrentMatrixAttemptOutcome,
  type V138HistoricalMatrixObservedAggregate,
  type V138ParallelShardRunner,
  type V138RssCommandAdapter,
  type V138ShardProcessFactory,
  type V138ProducingGitObjectContract,
  type V138HistoricalAdmissionGitObjects,
  type V138V4V5BranchVerificationContract,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const V138_REVIEWED_SOURCE_A_FIXTURE =
  "da4390513c48e795581a9b98069dcfa11d097cd0"
const cleanPlan26215Review = (): string =>
  `---
files_reviewed: 4
files_reviewed_list:
  - scripts/lib/v1-38-darwin-headroom.ts
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/evaluate-v1-38-foundation-contract.test.ts
source_base: 30c0949692017f425795213972482568cdd73f64
source_a: ${V138_REVIEWED_SOURCE_A_FIXTURE}
findings:
  critical: 0
  warning: 0
status: clean
---
# Clean review
`

const V138_PLAN_262_18_REPAIR_START =
  "a9770d3f7fe29dca042ed2068c4905a0338463ae"
const V138_PLAN_262_18_SOURCE_BASE =
  "95395308a5eeea68766613e6e72524792046e73a"
const currentPlan26218SourceA2 = (): string =>
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim()
const cleanPlan26218Review = (
  sourceA2: string,
  overrides: Partial<{
    repairStartHead2: string
    sourceBase2: string
    sourceA2: string
  }> = {},
): string =>
  `---
plan: 18
depth: deep
status: clean
files_reviewed: 3
files_reviewed_list:
  - scripts/evaluate-v1-38-foundation-contract.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
repair_start_head2: ${overrides.repairStartHead2 ?? V138_PLAN_262_18_REPAIR_START}
source_base2: ${overrides.sourceBase2 ?? V138_PLAN_262_18_SOURCE_BASE}
source_a2: ${overrides.sourceA2 ?? sourceA2}
fixes_applied: false
---
# Clean Plan 262-18 review
`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const canonicalManifest = (value: unknown): string => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("test canonical manifest invalid")
  return `${Buffer.from(encoded.bytes).toString("utf8")}\n`
}

const currentMatrixArtifactHashes = (): Readonly<Record<string, string>> =>
  Object.freeze(Object.fromEntries(
    readdirSync(path.resolve(repoRoot, ".planning/artifacts"))
      .filter((name) =>
        /^v1\.38-current-matrix-.*\.json$/u.test(name))
      .sort()
      .map((name) => {
        const artifactPath = path.resolve(
          repoRoot,
          ".planning/artifacts",
          name,
        )
        return [
          name,
          createHash("sha256")
            .update(readFileSync(artifactPath))
            .digest("hex"),
        ]
      }),
  ))

const producingGitObjects = (): V138ProducingGitObjectContract => ({
  resolveCommitPath: ({ producingCommit, sourcePath }) => ({
    blob: execFileSync(
      "git",
      ["rev-parse", `${producingCommit}:${sourcePath}`],
      { cwd: repoRoot, encoding: "utf8" },
    ).trim(),
    content: execFileSync(
      "git",
      ["show", `${producingCommit}:${sourcePath}`],
      { cwd: repoRoot },
    ),
  }),
})

const legacyStoppedMatrixReceipt = () =>
  Object.freeze(JSON.parse(
    execFileSync(
      "git",
      [
        "show",
        "724388c3:.planning/artifacts/v1.38-current-matrix-reproduction.json",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    ),
  ))

const mutate = (
  input: V138FoundationAdmissionInput,
  change: (draft: Record<string, unknown>) => void,
): unknown => {
  const draft = clone(input) as unknown as Record<string, unknown>
  change(draft)
  return draft
}

const nested = (
  draft: Record<string, unknown>,
  key: string,
): Record<string, unknown> => draft[key] as Record<string, unknown>

describe("v1.38 darwin headroom", () => {
  const stdout = (percentage: number): Buffer =>
    Buffer.from(
      `The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: ${percentage}%\n`,
      "utf8",
    )

  it.each([
    [24, 2_400, "preflight_refused"],
    [25, 2_500, "preflight_admitted"],
    [26, 2_600, "preflight_admitted"],
  ] as const)("darwin headroom maps %i percent without inventing precision", async (
    percentage,
    observedBasisPoints,
    disposition,
  ) => {
    let invocationCount = 0
    const result = await observeDarwinHeadroom(async (request) => {
      invocationCount += 1
      expect(request).toEqual(MEMORY_PRESSURE_Q_REQUEST)
      return {
        stdout: stdout(percentage),
        stderr: Buffer.alloc(0),
        exitCode: 0,
        signal: null,
        timedOut: false,
      }
    })
    expect(invocationCount).toBe(1)
    expect(result).toEqual({
      ok: true,
      observation: {
        metricId: "darwin-memorystatus-effective-available-basis-points-v1",
        providerId: "apple-memory-pressure-q-v1",
        parserId: "apple-memory-pressure-q-c-locale-parser-v1",
        stdoutByteLength: stdout(percentage).byteLength,
        stdoutSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        totalBytes: 4096,
        pageCount: 1,
        pageSizeBytes: 4096,
        percentage,
        observedBasisPoints,
        disposition,
      },
    })
    expect(JSON.stringify(result)).not.toContain(stdout(percentage).toString("utf8"))
  })

  it.each([
    ["CRLF", (value: Buffer) => Buffer.from(value.toString("utf8").replaceAll("\n", "\r\n"))],
    ["missing final LF", (value: Buffer) => value.subarray(0, value.length - 1)],
    ["extra line", (value: Buffer) => Buffer.concat([value, Buffer.from("warning\n")])],
    ["decimal", (value: Buffer) => Buffer.from(value.toString("utf8").replace("25%", "25.0%"))],
    ["NUL", (value: Buffer) => Buffer.concat([value, Buffer.from([0])])],
    ["invalid UTF-8", (value: Buffer) => Buffer.concat([value, Buffer.from([0xff])])],
  ])("darwin headroom rejects %s output", (_label, mutateBytes) => {
    expect(parseMemoryPressureQ({
      stdout: mutateBytes(stdout(25)),
      stderr: Buffer.alloc(0),
      exitCode: 0,
      signal: null,
      timedOut: false,
    })).toEqual({
      ok: false,
      reason: "resource_measurement_unavailable",
    })
  })

  it.each([
    ["nonzero exit", { exitCode: 1 }],
    ["signal", { signal: "SIGTERM" as const }],
    ["stderr", { stderr: Buffer.from("warning\n") }],
    ["timeout", { timedOut: true }],
    ["oversize", { stdout: Buffer.alloc(4_097, 0x41) }],
    [
      "page relation",
      {
        stdout: Buffer.from(
          "The system has 4096 (2 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
        ),
      },
    ],
    [
      "page relation below exact product",
      {
        stdout: Buffer.from(
          "The system has 4095 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
        ),
      },
    ],
    [
      "page relation above exact product",
      {
        stdout: Buffer.from(
          "The system has 4097 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
        ),
      },
    ],
    [
      "unsafe page product",
      {
        stdout: Buffer.from(
          "The system has 9007199254740991 (9007199254740991 pages with a page size of 2).\nSystem-wide memory free percentage: 25%\n",
        ),
      },
    ],
    [
      "out-of-range percentage",
      {
        stdout: Buffer.from(
          "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 101%\n",
        ),
      },
    ],
  ])("darwin headroom rejects %s process contract", (_label, change) => {
    expect(parseMemoryPressureQ({
      stdout: stdout(25),
      stderr: Buffer.alloc(0),
      exitCode: 0,
      signal: null,
      timedOut: false,
      ...change,
    })).toEqual({
      ok: false,
      reason: "resource_measurement_unavailable",
    })
  })
})

describe("v1.38 selected route closure and source custody", () => {
  it("selected route closure is derived from A and includes the semantic issuer", () => {
    const sourceA = V138_REVIEWED_SOURCE_A_FIXTURE
    const closure = deriveSelectedRouteClosureAtCommit(repoRoot, sourceA)
    expect(() => deriveSelectedRouteClosureAtCommit(repoRoot, "HEAD")).toThrow(
      "V138_SOURCE_COMMIT_INVALID",
    )
    expect(() =>
      deriveSelectedRouteClosureAtCommit(repoRoot, sourceA.slice(0, 12)),
    ).toThrow("V138_SOURCE_COMMIT_INVALID")
    expect(closure.roots).toEqual([
      "apps/runtime-service/src/execute-match.ts",
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
    ])
    expect(closure.paths).toContain(
      "apps/runtime-service/src/semantic-receipt-v1-18-issuer.ts",
    )
    expect(closure.paths).toEqual([...closure.paths].sort())
    expect(closure.closureRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(closure.resolverMetadata.map(({ path: repoPath }) => repoPath)).toContain(
      "tsconfig.base.json",
    )
    expect(
      closure.resolverMetadata.map(({ path: repoPath }) => repoPath),
    ).toContain("apps/runtime-service/tsconfig.json")
    const sourceByPath = new Map(
      closure.paths
        .filter((repoPath) => /\.(?:ts|tsx)$/u.test(repoPath))
        .map((repoPath) => [
          repoPath,
          execFileSync("git", ["show", `${sourceA}:${repoPath}`], {
            cwd: repoRoot,
            encoding: "utf8",
          }),
        ]),
    )
    const targetByEdge = new Map(
      closure.edges.map((edge) => [`${edge.from}\0${edge.specifier}`, edge.to]),
    )
    for (const [index, edge] of closure.edges.entries()) {
      const source = sourceByPath.get(edge.from)!
      const marker = `./__v138_unresolved_edge_${index}.js`
      const escaped = edge.specifier.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
      const mutated = source.replace(
        new RegExp(`([\"'])${escaped}\\1`, "u"),
        (_match, quote: string) => `${quote}${marker}${quote}`,
      )
      expect(mutated).not.toBe(source)
      const resolver = (from: string, specifier: string): string | undefined => {
        if (specifier === marker) return undefined
        return targetByEdge.get(`${from}\0${specifier}`) ?? `external:${specifier}`
      }
      const removed = source.replace(
        new RegExp(`([\"'])${escaped}\\1`, "u"),
        "0",
      )
      expect(() =>
        deriveV138StaticSourceEdgesFromSnapshot(edge.from, removed, resolver),
      ).toThrow("V138_SELECTED_ROUTE_NONLITERAL_STATIC_EDGE")
      expect(() =>
        checkSelectedRouteEdgeInventory(
          closure,
          closure.edges.filter((candidate) => candidate !== edge),
        ),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_INVENTORY_MISMATCH")
      const substitute = `./__v138_substitute_edge_${index}.js`
      const substituteTarget = closure.paths.find(
        (repoPath) => repoPath !== edge.to,
      )!
      const substituted = source.replace(
        new RegExp(`([\"'])${escaped}\\1`, "u"),
        (_match, quote: string) => `${quote}${substitute}${quote}`,
      )
      const substitutedEdges = deriveV138StaticSourceEdgesFromSnapshot(
        edge.from,
        substituted,
        (from, specifier) =>
          specifier === substitute
            ? substituteTarget
            : resolver(from, specifier),
      )
      expect(
        substitutedEdges.some(
          (candidate) =>
            candidate.specifier === substitute &&
            candidate.to !== edge.to,
        ),
      ).toBe(true)
      expect(() =>
        checkSelectedRouteEdgeInventory(
          closure,
          closure.edges.map((candidate) =>
            candidate === edge
              ? substitutedEdges.find(
                  (replacement) => replacement.specifier === substitute,
                )!
              : candidate,
          ),
        ),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_INVENTORY_MISMATCH")
      expect(() =>
        deriveV138StaticSourceEdgesFromSnapshot(edge.from, mutated, resolver),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_UNRESOLVED")
      expect(() =>
        deriveV138StaticSourceEdgesFromSnapshot(
          edge.from,
          source,
          (from, specifier) =>
            from === edge.from && specifier === edge.specifier
              ? undefined
              : resolver(from, specifier),
        ),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_UNRESOLVED")
    }
  }, 180_000)

  it("source custody uses the aggregate sourceBase..A four-path delta", () => {
    const sourceA = V138_REVIEWED_SOURCE_A_FIXTURE
    const custody = inspectSourceCustody({
      repoRoot,
      sourceBase: "30c0949692017f425795213972482568cdd73f64",
      sourceA,
    })
    expect(custody.sourceBase).toBe(
      "30c0949692017f425795213972482568cdd73f64",
    )
    expect(custody.aggregateChangedPaths).toEqual([
      "scripts/evaluate-v1-38-foundation-contract.test.ts",
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-darwin-headroom.ts",
      "scripts/lib/v1-38-successor-source-seal.ts",
    ])
  })

  it("production Git closure rejects committed edge and resolver mutations", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-v138-closure-git-"))
    try {
      execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
      execFileSync("git", ["config", "user.name", "v1.38 B test"], { cwd: root })
      execFileSync("git", ["config", "user.email", "b@test.invalid"], { cwd: root })
      execFileSync("git", ["checkout", "--quiet", V138_REVIEWED_SOURCE_A_FIXTURE], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.name", "v1.38 closure test"], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.email", "closure@test.invalid"], {
        cwd: root,
      })
      const baseline = deriveSelectedRouteClosureAtCommit(
        root,
        V138_REVIEWED_SOURCE_A_FIXTURE,
      )
      const commitMutation = (message: string): string => {
        execFileSync("git", ["add", "-A"], { cwd: root })
        execFileSync("git", ["commit", "--quiet", "-m", message], { cwd: root })
        return execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: root,
          encoding: "utf8",
        }).trim()
      }
      const reset = (): void => {
        execFileSync("git", ["reset", "--hard", V138_REVIEWED_SOURCE_A_FIXTURE], {
          cwd: root,
          stdio: "ignore",
        })
      }
      const first = baseline.edges.find(
        (edge) =>
          baseline.edges.filter((candidate) => candidate.from === edge.from)
            .length > 1,
      )!
      const firstPath = path.resolve(root, first.from)
      const firstSource = readFileSync(firstPath, "utf8")
      const firstEscaped = first.specifier.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
      writeFileSync(
        firstPath,
        firstSource.replace(
          new RegExp(`([\"'])${firstEscaped}\\1`, "u"),
          "$1./__committed_unresolved_v138.js$1",
        ),
      )
      const unresolvedCommit = commitMutation("test: unresolved closure edge")
      expect(() =>
        deriveSelectedRouteClosureAtCommit(root, unresolvedCommit),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_UNRESOLVED")

      reset()
      const sameSourceEdges = baseline.edges.filter(
        (candidate) =>
          candidate.from === first.from &&
          candidate.specifier !== first.specifier,
      )
      const substitute = sameSourceEdges[0]!
      writeFileSync(
        firstPath,
        firstSource.replace(
          new RegExp(`([\"'])${firstEscaped}\\1`, "u"),
          (_match, quote: string) => `${quote}${substitute.specifier}${quote}`,
        ),
      )
      const substituteCommit = commitMutation("test: substituted closure edge")
      const substitutedClosure = deriveSelectedRouteClosureAtCommit(
        root,
        substituteCommit,
      )
      expect(() =>
        checkSelectedRouteClosureAtCommit(root, substituteCommit, baseline),
      ).toThrow("V138_SELECTED_ROUTE_CLOSURE_MISMATCH")
      expect(substitutedClosure.closureRoot).not.toBe(baseline.closureRoot)

      reset()
      appendFileSync(path.resolve(root, "tsconfig.base.json"), "\n")
      const metadataCommit = commitMutation("test: resolver metadata drift")
      const metadataClosure = deriveSelectedRouteClosureAtCommit(
        root,
        metadataCommit,
      )
      expect(metadataClosure.paths).toEqual(baseline.paths)
      expect(metadataClosure.closureRoot).not.toBe(baseline.closureRoot)
      expect(() =>
        checkSelectedRouteClosureAtCommit(root, metadataCommit, baseline),
      ).toThrow("V138_SELECTED_ROUTE_CLOSURE_MISMATCH")

      reset()
      writeFileSync(
        path.resolve(root, "apps/runtime-service/tsconfig.json"),
        readFileSync(path.resolve(root, "apps/runtime-service/tsconfig.json"), "utf8")
          .replace("../../tsconfig.base.json", "../../missing-base.json"),
      )
      const missingExtendsCommit = commitMutation("test: missing tsconfig extends")
      expect(() =>
        deriveSelectedRouteClosureAtCommit(root, missingExtendsCommit),
      ).toThrow("V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_UNPROVEN")

      reset()
      appendFileSync(path.resolve(root, "pnpm-lock.yaml"), "\npackages:\n")
      const malformedLockCommit = commitMutation("test: duplicate lock mapping")
      expect(() =>
        deriveSelectedRouteClosureAtCommit(root, malformedLockCommit),
      ).toThrow("V138_SELECTED_ROUTE_LOCKFILE_INVALID")

      reset()
      mkdirSync(path.resolve(root, "config"), { recursive: true })
      mkdirSync(path.resolve(root, "configs/nested"), { recursive: true })
      mkdirSync(path.resolve(root, "configs/packages/spec/src"), {
        recursive: true,
      })
      writeFileSync(
        path.resolve(root, "config/tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            baseUrl: "..",
            paths: { "@cowards/spec": ["packages/spec/src/index.ts"] },
          },
        }),
      )
      writeFileSync(
        path.resolve(root, "configs/nested/tsconfig.json"),
        JSON.stringify({
          extends: "../../config/tsconfig.json",
          compilerOptions: { baseUrl: ".." },
          references: [{ path: "../../packages/spec" }],
        }),
      )
      writeFileSync(
        path.resolve(root, "configs/packages/spec/src/index.ts"),
        "export const shadow = true\n",
      )
      writeFileSync(
        path.resolve(root, "apps/runtime-service/tsconfig.json"),
        readFileSync(path.resolve(root, "apps/runtime-service/tsconfig.json"), "utf8")
          .replace("../../tsconfig.base.json", "../../configs/nested/tsconfig.json"),
      )
      const recursiveConfigCommit = commitMutation("test: recursive config provenance")
      const recursiveClosure = deriveSelectedRouteClosureAtCommit(
        root,
        recursiveConfigCommit,
      )
      expect(
        recursiveClosure.edges
          .filter(({ specifier }) => specifier === "@cowards/spec")
          .every(({ to }) => to === "packages/spec/src/index.ts"),
      ).toBe(true)
      expect(recursiveClosure.paths).not.toContain(
        "configs/packages/spec/src/index.ts",
      )

      reset()
      mkdirSync(path.resolve(root, "config"), { recursive: true })
      mkdirSync(path.resolve(root, "configs/nested"), { recursive: true })
      mkdirSync(path.resolve(root, "configs/nested/packages/spec/src"), {
        recursive: true,
      })
      writeFileSync(
        path.resolve(root, "config/tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            module: "NodeNext",
            moduleResolution: "NodeNext",
            baseUrl: "..",
          },
        }),
      )
      writeFileSync(
        path.resolve(root, "configs/nested/tsconfig.json"),
        JSON.stringify({
          extends: "../../config/tsconfig.json",
          compilerOptions: {
            paths: { "@cowards/spec": ["packages/spec/src/index.ts"] },
          },
          references: [{ path: "../../packages/spec" }],
        }),
      )
      writeFileSync(
        path.resolve(root, "configs/nested/packages/spec/src/index.ts"),
        "export const shadow = true\n",
      )
      writeFileSync(
        path.resolve(root, "apps/runtime-service/tsconfig.json"),
        readFileSync(path.resolve(root, "apps/runtime-service/tsconfig.json"), "utf8")
          .replace("../../tsconfig.base.json", "../../configs/nested/tsconfig.json"),
      )
      const inheritedBaseCommit = commitMutation(
        "test: child paths inherit parent baseUrl origin",
      )
      const inheritedBaseClosure = deriveSelectedRouteClosureAtCommit(
        root,
        inheritedBaseCommit,
      )
      expect(
        inheritedBaseClosure.edges
          .filter(({ specifier }) => specifier === "@cowards/spec")
          .every(({ to }) => to === "packages/spec/src/index.ts"),
      ).toBe(true)
      expect(inheritedBaseClosure.paths).not.toContain(
        "configs/nested/packages/spec/src/index.ts",
      )

      reset()
      mkdirSync(path.resolve(root, "config"), { recursive: true })
      mkdirSync(path.resolve(root, "configs/nested"), { recursive: true })
      writeFileSync(
        path.resolve(root, "config/tsconfig.json"),
        JSON.stringify({ extends: "../configs/nested/tsconfig.json" }),
      )
      writeFileSync(
        path.resolve(root, "configs/nested/tsconfig.json"),
        JSON.stringify({ extends: "../../config/tsconfig.json" }),
      )
      writeFileSync(
        path.resolve(root, "apps/runtime-service/tsconfig.json"),
        readFileSync(path.resolve(root, "apps/runtime-service/tsconfig.json"), "utf8")
          .replace("../../tsconfig.base.json", "../../configs/nested/tsconfig.json"),
      )
      const cycleCommit = commitMutation("test: recursive config cycle")
      expect(() =>
        deriveSelectedRouteClosureAtCommit(root, cycleCommit),
      ).toThrow("V138_SELECTED_ROUTE_TSCONFIG_EXTENDS_CYCLE")

      reset()
      const ambiguous = baseline.edges.find((edge) => {
        if (!edge.specifier.startsWith(".") || !edge.to.endsWith(".ts")) {
          return false
        }
        const alternate = `${edge.to.slice(0, -3)}.tsx`
        return !existsSync(path.resolve(root, alternate))
      })!
      const alternate = `${ambiguous.to.slice(0, -3)}.tsx`
      mkdirSync(path.dirname(path.resolve(root, alternate)), { recursive: true })
      writeFileSync(path.resolve(root, alternate), "export {}\n")
      const ambiguousCommit = commitMutation("test: ambiguous closure edge")
      expect(() =>
        deriveSelectedRouteClosureAtCommit(root, ambiguousCommit),
      ).toThrow("V138_SELECTED_ROUTE_EDGE_AMBIGUOUS")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 300_000)

  it("formation absence seals the actual inventory and rejects namespaces and executable state", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-v138-formation-git-"))
    try {
      execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
      execFileSync("git", ["checkout", "--quiet", V138_REVIEWED_SOURCE_A_FIXTURE], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.name", "v1.38 formation test"], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.email", "formation@test.invalid"], {
        cwd: root,
      })
      const baseline = deriveFormationAbsence(root, V138_REVIEWED_SOURCE_A_FIXTURE)
      expect(baseline).toMatchObject({
        absent: true,
        forbiddenPathCount: 0,
        forbiddenContentCount: 0,
        scannedRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })
      const commit = (message: string): string => {
        execFileSync("git", ["add", "-A"], { cwd: root })
        execFileSync("git", ["commit", "--quiet", "-m", message], { cwd: root })
        return execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: root,
          encoding: "utf8",
        }).trim()
      }
      mkdirSync(path.resolve(root, ".planning/artifacts/formation-profiles"), {
        recursive: true,
      })
      writeFileSync(
        path.resolve(root, ".planning/artifacts/formation-profiles/candidate.json"),
        "{}\n",
      )
      expect(() =>
        deriveFormationAbsence(root, commit("test: forbidden formation namespace")),
      ).toThrow("V138_SUCCESSOR_SEAL_FORMATION_PRESENT")

      execFileSync("git", ["reset", "--hard", V138_REVIEWED_SOURCE_A_FIXTURE], {
        cwd: root,
        stdio: "ignore",
      })
      rmSync(path.resolve(root, ".planning/artifacts/formation-profiles"), {
        recursive: true,
        force: true,
      })
      writeFileSync(
        path.resolve(root, ".planning/artifacts/v1.38-innocent.json"),
        "{\"adapter\":\"materializeFormation\",\"state\":\"GameState\"}\n",
      )
      expect(() =>
        deriveFormationAbsence(root, commit("test: executable formation state")),
      ).toThrow("V138_SUCCESSOR_SEAL_FORMATION_PRESENT")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180_000)

  it("successor B is one exact two-artifact commit and matches checked working bytes", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-v138-source-b-"))
    const authorizationPath =
      ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json"
    const sealPath =
      ".planning/artifacts/v1.38-successor-source-seal-v1.json"
    const terminalPath =
      ".planning/artifacts/v1.38-plan-262-15-terminal-v1.json"
    try {
      execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
      execFileSync("git", ["checkout", "--quiet", V138_REVIEWED_SOURCE_A_FIXTURE], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.name", "v1.38 source B test"], {
        cwd: root,
      })
      execFileSync("git", ["config", "user.email", "source-b@test.invalid"], {
        cwd: root,
      })
      const reviewPath =
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW.md"
      mkdirSync(path.dirname(path.resolve(root, reviewPath)), { recursive: true })
      writeFileSync(path.resolve(root, reviewPath), cleanPlan26215Review())
      const sourceA = V138_REVIEWED_SOURCE_A_FIXTURE
      const authorization = buildV138Plan26215Authorization(
        root,
        sourceA,
        Buffer.from(v138Plan26215AuthorizationLiteral(sourceA), "utf8"),
      )
      const seal = buildV138SuccessorSourceSeal({
        repoRoot: root,
        sourceBase: "30c0949692017f425795213972482568cdd73f64",
        sourceA,
        authorization,
        reviewRoots: [],
        protectedEvidencePaths: [],
        frozenPolicy: { schemaVersion: "v1.38-frozen-policy-v1" },
        toolIdentity: { schemaVersion: "v1.38-tool-identity-v1" },
        hostIdentity: { schemaVersion: "v1.38-host-identity-v1" },
        formationAbsence: {
          schemaVersion: "v1.38-formation-absence-v1",
          absent: true,
        },
      })
      const reset = (): void => {
        execFileSync("git", ["reset", "--hard", sourceA], {
          cwd: root,
          stdio: "ignore",
        })
      }
      const commitB = (
        mutate?: (paths: { authorization: string; seal: string }) => void,
        extraPaths: readonly string[] = [],
      ): string => {
        reset()
        writeFileSync(path.resolve(root, authorizationPath), canonicalManifest(authorization))
        writeFileSync(path.resolve(root, sealPath), canonicalManifest(seal))
        mutate?.({ authorization: authorizationPath, seal: sealPath })
        execFileSync("git", ["add", authorizationPath, sealPath, ...extraPaths], {
          cwd: root,
        })
        execFileSync("git", ["commit", "--quiet", "-m", "test: source B"], {
          cwd: root,
        })
        return execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: root,
          encoding: "utf8",
        }).trim()
      }
      const validB = commitB()
      const custody = checkV138SuccessorSealCommit({
        repoRoot: root,
        sourceA,
        sourceB: validB,
      })
      expect(custody).toMatchObject({
        sourceA,
        sourceB: validB,
        sourceBParent: sourceA,
        changedPaths: [authorizationPath, sealPath],
      })
      expect(custody.blobs).toHaveLength(2)
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: "0".repeat(40) })
      ).toThrow()

      writeFileSync(path.resolve(root, sealPath), "{}\n")
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: validB })
      ).toThrow("V138_SUCCESSOR_SEAL_B_WORKTREE_DRIFT")

      reset()
      writeFileSync(path.resolve(root, authorizationPath), canonicalManifest(authorization))
      execFileSync("git", ["add", authorizationPath], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "test: missing seal"], {
        cwd: root,
      })
      const missingSealB = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: missingSealB })
      ).toThrow("V138_SUCCESSOR_SEAL_B_DELTA_INVALID")

      execFileSync("git", ["checkout", "--quiet", `${sourceA}^`], { cwd: root })
      writeFileSync(path.resolve(root, authorizationPath), canonicalManifest(authorization))
      writeFileSync(path.resolve(root, sealPath), canonicalManifest(seal))
      execFileSync("git", ["add", authorizationPath, sealPath], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "test: wrong parent B"], {
        cwd: root,
      })
      const wrongParentB = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: wrongParentB })
      ).toThrow("V138_SUCCESSOR_SEAL_B_PARENT_INVALID")

      reset()
      writeFileSync(path.resolve(root, ".planning/artifacts/v1.38-merge-side.json"), "{}\n")
      execFileSync("git", ["add", ".planning/artifacts/v1.38-merge-side.json"], {
        cwd: root,
      })
      execFileSync("git", ["commit", "--quiet", "-m", "test: merge side"], {
        cwd: root,
      })
      const sideCommit = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      execFileSync("git", ["checkout", "--quiet", validB], { cwd: root })
      execFileSync("git", ["merge", "--quiet", "--no-ff", sideCommit, "-m", "test: merge B"], {
        cwd: root,
      })
      const mergeB = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: mergeB })
      ).toThrow("V138_SUCCESSOR_SEAL_B_PARENT_INVALID")

      const extraPath = ".planning/artifacts/v1.38-source-b-extra.json"
      const extraB = commitB((_paths) => {
        writeFileSync(path.resolve(root, extraPath), "{}\n")
      }, [extraPath])
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: extraB })
      ).toThrow("V138_SUCCESSOR_SEAL_B_DELTA_INVALID")

      const mutatedB = commitB(({ authorization: target }) => {
        writeFileSync(path.resolve(root, target), "{}\n")
      })
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: mutatedB })
      ).toThrow()

      const terminalB = commitB((_paths) => {
        writeFileSync(path.resolve(root, terminalPath), "{}\n")
      }, [terminalPath])
      expect(() =>
        checkV138SuccessorSealCommit({ repoRoot: root, sourceA, sourceB: terminalB })
      ).toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 300_000)
})

describe("v1.38 plan 262-15 terminal artifact presence", () => {
  const paths = {
    authorization: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
    seal: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
    terminal: ".planning/artifacts/v1.38-plan-262-15-terminal-v1.json",
    review: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW.md",
    reviewFix: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW-FIX.md",
  } as const

  it.each(["seal_refused", "seal_failed", "sealed"] as const)(
    "plan 262-15 terminal enforces %s artifact presence",
    (disposition) => {
      const root = mkdtempSync(path.join(tmpdir(), "cowards-262-15-terminal-"))
      const originalHead = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
      })
      const originalStatus = execFileSync("git", ["status", "--porcelain"], {
        cwd: repoRoot,
        encoding: "utf8",
      })
      try {
        execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
        execFileSync("git", ["checkout", "--quiet", V138_REVIEWED_SOURCE_A_FIXTURE], {
          cwd: root,
        })
        mkdirSync(path.dirname(path.resolve(root, paths.authorization)), { recursive: true })
        mkdirSync(path.dirname(path.resolve(root, paths.review)), { recursive: true })
        writeFileSync(
          path.resolve(root, paths.review),
          cleanPlan26215Review(),
        )
        const sourceA = V138_REVIEWED_SOURCE_A_FIXTURE
        const authorization = buildV138Plan26215Authorization(
          root,
          sourceA,
          Buffer.from(v138Plan26215AuthorizationLiteral(sourceA), "utf8"),
        )
        if (disposition !== "seal_refused") {
          writeFileSync(
            path.resolve(root, paths.authorization),
            `${JSON.stringify(authorization)}\n`,
          )
        }
        if (disposition === "sealed") {
          const reviewBytes = readFileSync(path.resolve(root, paths.review))
          const seal = buildV138SuccessorSourceSeal({
            repoRoot: root,
            sourceBase: "30c0949692017f425795213972482568cdd73f64",
            sourceA,
            authorization,
            reviewRoots: [{
              path: paths.review,
              sha256: `sha256:${createHash("sha256").update(reviewBytes).digest("hex")}`,
            }],
            protectedEvidencePaths: [],
            frozenPolicy: { schemaVersion: "v1.38-frozen-policy-v1" },
            toolIdentity: { schemaVersion: "v1.38-tool-identity-v1" },
            hostIdentity: { schemaVersion: "v1.38-host-identity-v1" },
            formationAbsence: {
              schemaVersion: "v1.38-formation-absence-v1",
              absent: true,
            },
          })
          expect(seal.reviewRoots).toHaveLength(1)
          expect(seal.protectedEvidence.length).toBeGreaterThan(0)
          const metricMutations: ReadonlyArray<
            readonly [string, string, unknown]
          > = [
            ["command", "executable", "/usr/bin/memory_pressurf"],
            ["command", "argv", ["-P"]],
            ["command", "environment", { LC_ALL: "C", LANG: "C", PATH: "/usr/bin:/bin:/usr/sbin:/sbim" }],
            ["command", "stdin", "pipe"],
            ["command", "shell", true],
            ["command", "timeoutMilliseconds", 201],
            ["command", "maximumOutputBytes", 4_095],
            ["metric", "metricId", "darwin-memorystatus-effective-available-basis-points-v2"],
            ["provider", "providerId", "apple-memory-pressure-q-v2"],
            ["parser", "parserId", "apple-memory-pressure-q-c-locale-parser-v2"],
            ["threshold", "requiredBasisPoints", 2_499],
            ["domains", "commandRoot", `sha256:${"1".repeat(64)}`],
          ]
          for (const [section, field, replacement] of metricMutations) {
            const forged = clone(seal.replacementMetricContract) as Record<string, unknown>
            ;(forged[section] as Record<string, unknown>)[field] = replacement
            expect(() =>
              checkV138ReplacementMetricContract(root, sourceA, forged),
            ).toThrow("V138_REPLACEMENT_METRIC_CONTRACT_INVALID")
          }
          const forgedReference = clone(seal.replacementMetricContract) as Record<string, unknown>
          ;(forgedReference.semanticReferences as Array<Record<string, unknown>>)[0]!.commit =
            "408bba7453608006b89772db185defbac8fe2fd0e"
          expect(() =>
            checkV138ReplacementMetricContract(root, sourceA, forgedReference),
          ).toThrow("V138_REPLACEMENT_METRIC_CONTRACT_INVALID")
          for (const mutateSeal of [
            (draft: Record<string, unknown>) => {
              draft.reviewRoots = []
            },
            (draft: Record<string, unknown>) => {
              draft.protectedEvidence = []
            },
            (draft: Record<string, unknown>) => {
              draft.frozenPolicy = { schemaVersion: "forged-policy" }
            },
            (draft: Record<string, unknown>) => {
              draft.toolIdentity = { schemaVersion: "forged-tool" }
            },
            (draft: Record<string, unknown>) => {
              draft.hostIdentity = { schemaVersion: "forged-host" }
            },
            (draft: Record<string, unknown>) => {
              draft.formationAbsence = {
                schemaVersion: "v1.38-formation-absence-v1",
                absent: true,
              }
            },
            (draft: Record<string, unknown>) => {
              draft.replacementMetricContract = { schemaVersion: "forged" }
            },
          ]) {
            const forged = clone(seal) as unknown as Record<string, unknown>
            mutateSeal(forged)
            const { sealRoot: _ignored, ...body } = forged
            forged.sealRoot = v138SuccessorRoot(
              "containmentPolicy",
              String(forged.schemaVersion),
              body,
            )
            expect(() =>
              checkV138SuccessorSourceSeal(root, forged, authorization),
            ).toThrow()
          }
          writeFileSync(path.resolve(root, paths.seal), `${JSON.stringify(seal)}\n`)
        } else {
          writePlan26215Terminal(root, paths.terminal, disposition, paths)
        }
        expect(checkPlan26215ArtifactBranch(root, paths)).toBe(disposition)
        const required =
          disposition === "sealed" ? paths.seal : paths.terminal
        const requiredBytes = readFileSync(path.resolve(root, required))
        unlinkSync(path.resolve(root, required))
        expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow()
        writeFileSync(path.resolve(root, required), requiredBytes)
        const forbidden =
          disposition === "seal_refused"
            ? paths.authorization
            : disposition === "seal_failed"
              ? paths.seal
              : paths.terminal
        writeFileSync(path.resolve(root, forbidden), "{}\n")
        expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow()

        if (disposition === "seal_refused") {
          unlinkSync(path.resolve(root, forbidden))
          const reviewTarget = path.resolve(root, paths.review)
          const reviewBytes = readFileSync(reviewTarget)
          unlinkSync(reviewTarget)
          symlinkSync(path.resolve(root, "outside-review"), reviewTarget)
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow(
            "V138_PLAN_262_15_ARTIFACT_TYPE_INVALID",
          )
          unlinkSync(reviewTarget)
          mkdirSync(reviewTarget)
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow(
            "V138_PLAN_262_15_ARTIFACT_TYPE_INVALID",
          )
          rmSync(reviewTarget, { recursive: true })
          writeFileSync(reviewTarget, reviewBytes)
          expect(() =>
            checkPlan26215ArtifactBranch(root, {
              ...paths,
              review: "../outside-review.md",
            }),
          ).toThrow("V138_PLAN_262_15_CANONICAL_PATH_REQUIRED")
          writeFileSync(
            reviewTarget,
            reviewBytes.toString("utf8").replace(
              "status: clean",
              "fixes_applied: true\nstatus: clean",
            ),
          )
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow(
            "V138_PLAN_262_15_ARTIFACT_REQUIRED",
          )
          writeFileSync(
            path.resolve(root, paths.reviewFix),
            `---
source_base: 30c0949692017f425795213972482568cdd73f64
final_source_a: ${V138_REVIEWED_SOURCE_A_FIXTURE}
fixed: 1
skipped: 0
status: all_fixed
---
# Fix report
`,
          )
          expect(checkPlan26215ArtifactBranch(root, paths)).toBe(disposition)
          writeFileSync(
            reviewTarget,
            "---\nfindings:\n  critical: 0\n  warning: 0\nstatus: issues_found\nnote: status: clean\n---\n# Spoof\n",
          )
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow()
          writeFileSync(reviewTarget, reviewBytes)
          writeFileSync(
            reviewTarget,
            "---\nfindings:\n  critical: 0\n  warning: 0\nstatus: clean\nstatus: clean\n---\n# Duplicate\n",
          )
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow(
            "V138_PLAN_262_15_REVIEW_SCHEMA_INVALID",
          )
          writeFileSync(reviewTarget, reviewBytes)
          chmodSync(reviewTarget, 0o000)
          expect(() => checkPlan26215ArtifactBranch(root, paths)).toThrow()
          chmodSync(reviewTarget, 0o600)
        }
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
      expect(execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toBe(originalHead)
      expect(execFileSync("git", ["status", "--porcelain"], {
        cwd: repoRoot,
        encoding: "utf8",
      })).toBe(originalStatus)
    },
    120_000,
  )
})

describe("v1.38 plan 262-16 hostile receipt validation", () => {
  const reRoot = (
    receipt: Record<string, unknown>,
    domain: "canonicalJsonProfile" | "budgetProfile" | "evidenceBundle",
  ): Record<string, unknown> => {
    const { receiptRoot: _ignored, ...body } = receipt
    return {
      ...body,
      receiptRoot: v138SuccessorRoot(
        domain,
        String(body.schemaVersion),
        body,
      ),
    }
  }

  it("rejects self-hashed negative and wrong-identity preflight claims", () => {
    const valid = buildV138HostHeadroomPreflightV5Receipt(
      parseMemoryPressureQ({
        stdout: Buffer.from(
          "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
        ),
        stderr: Buffer.alloc(0),
        exitCode: 0,
        signal: null,
        timedOut: false,
      }),
    )
    for (const mutateReceipt of [
      (draft: Record<string, unknown>) => {
        draft.chargedIdentityId = "preflight:v5:forged"
      },
      (draft: Record<string, unknown>) => {
        ;(draft.observation as Record<string, unknown>).percentage = -999
        ;(draft.observation as Record<string, unknown>).observedBasisPoints =
          -99_900
      },
      (draft: Record<string, unknown>) => {
        draft.disposition = "invented_status"
      },
      (draft: Record<string, unknown>) => {
        ;(draft.observation as Record<string, unknown>).totalBytes = 0
        draft.status = "preflight_unavailable"
        draft.disposition = "preflight_unavailable"
      },
      (draft: Record<string, unknown>) => {
        ;(draft.observation as Record<string, unknown>).totalBytes = 4_095
      },
      (draft: Record<string, unknown>) => {
        ;(draft.observation as Record<string, unknown>).totalBytes = 4_097
      },
      (draft: Record<string, unknown>) => {
        ;(draft.observation as Record<string, unknown>).totalBytes =
          Number.MAX_SAFE_INTEGER
        ;(draft.observation as Record<string, unknown>).pageCount =
          Number.MAX_SAFE_INTEGER
        ;(draft.observation as Record<string, unknown>).pageSizeBytes = 2
      },
    ]) {
      const forged = clone(valid) as unknown as Record<string, unknown>
      mutateReceipt(forged)
      expect(() =>
        checkV138HostHeadroomPreflightV5Receipt(
          reRoot(forged, "canonicalJsonProfile"),
        ),
      ).toThrow("MATRIX_PREFLIGHT_V5_INVALID")
    }
  })

  it("rejects self-hashed one-shard, nonsense, tickless, and invented-count calibration", () => {
    const preflight = buildV138HostHeadroomPreflightV5Receipt({
      ok: false,
      reason: "resource_measurement_unavailable",
    })
    const valid = buildV138ParallelCalibrationV5PreflightTerminal(preflight)
    for (const mutateReceipt of [
      (draft: Record<string, unknown>) => {
        draft.shardCount = 1
      },
      (draft: Record<string, unknown>) => {
        ;(draft.chargedAttempts as Array<Record<string, unknown>>)[0]!.outcome =
          "nonsense"
      },
      (draft: Record<string, unknown>) => {
        draft.status = "admitted"
        draft.acceptedCellCount = 8
        draft.childLaunchCount = 8
        for (const attempt of draft.chargedAttempts as Array<Record<string, unknown>>) {
          attempt.outcome = "accepted"
          attempt.accepted = true
          attempt.childLaunched = true
        }
        draft.sharedObservationTicks = []
      },
      (draft: Record<string, unknown>) => {
        draft.childLaunchCount = 999
      },
      (draft: Record<string, unknown>) => {
        draft.executionContextRoot = "garbage"
      },
      (draft: Record<string, unknown>) => {
        draft.authorizationRoot = `sha256:${"1".repeat(64)}`
      },
      (draft: Record<string, unknown>) => {
        draft.sealRoot = `sha256:${"2".repeat(64)}`
      },
    ]) {
      const forged = clone(valid) as unknown as Record<string, unknown>
      mutateReceipt(forged)
      expect(() =>
        checkV138ParallelCalibrationV5Receipt(
          reRoot(forged, "budgetProfile"),
        ),
      ).toThrow("MATRIX_CALIBRATION_V5_INVALID")
    }
  })

  it("rejects self-hashed invented status and non-hash reproduction roots", () => {
    const body = {
      schemaVersion: "v1.38-current-matrix-reproduction-v6",
      executionContextRoot: `sha256:${"1".repeat(64)}`,
      calibrationRoot: `sha256:${"2".repeat(64)}`,
      status: "stopped_process_failure",
      chargedAttemptCount: 540,
      acceptedCellCount: 0,
      attemptLedgerRoot: `sha256:${"3".repeat(64)}`,
      acceptedCellRoot: null,
      runtimeRoute: "v1.18/v1.19/MATCH_KERNEL",
      partialAcceptedEvidenceReusable: false,
      noRetry: true,
    }
    const valid = reRoot(body, "evidenceBundle")
    expect(() => checkV138AuthoritativeMatrixV6Receipt(valid)).toThrow(
      "MATRIX_REPRODUCTION_V6_INVALID",
    )
    for (const mutateReceipt of [
      (draft: Record<string, unknown>) => {
        draft.status = "invented_status"
      },
      (draft: Record<string, unknown>) => {
        draft.attemptLedgerRoot = "not-a-hash"
      },
    ]) {
      const forged = clone(valid)
      mutateReceipt(forged)
      expect(() =>
        checkV138AuthoritativeMatrixV6Receipt(
          reRoot(forged, "evidenceBundle"),
        ),
      ).toThrow("MATRIX_REPRODUCTION_V6_INVALID")
    }
  })

  it("zeroes the exact owned command buffers before returning", async () => {
    const stdout = Buffer.from(
      "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
    )
    const stderr = Buffer.alloc(3, 7)
    await observeDarwinHeadroomOwned(async () => ({
      stdout,
      stderr,
      exitCode: 1,
      signal: null,
      timedOut: false,
    }))
    expect([...stdout]).toEqual(new Array(stdout.length).fill(0))
    expect([...stderr]).toEqual([0, 0, 0])
  })

  it("fails closed for missing and unknown receipt CLI commands", () => {
    const script = path.resolve(
      repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
    )
    for (const args of [
      [],
      ["--unknown-plan-262-16-command"],
      ["--write-execution-context-v5-receipt"],
      ["--write-headroom-preflight-v5-receipt"],
      ["--calibrate-parallel-v5-receipt"],
      ["--write-authoritative-v6-receipt"],
    ]) {
      expect(() =>
        execFileSync(
          process.execPath,
          ["--import", "tsx", script, ...args],
          { cwd: repoRoot, stdio: "pipe" },
        ),
      ).toThrow()
    }
  }, 40_000)
})

describe("v1.38 plan 262-16 terminal artifact presence", () => {
  it("plan 262-16 terminal validates the preflight-refused charged branch", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-262-16-terminal-"))
    const originalHead = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    })
    const originalStatus = execFileSync("git", ["status", "--porcelain"], {
      cwd: repoRoot,
      encoding: "utf8",
    })
    const paths = {
      authorization: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
      seal: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
      context: ".planning/artifacts/v1.38-current-matrix-execution-context-v5.json",
      preflight: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v5.json",
      calibration: ".planning/artifacts/v1.38-current-matrix-calibration-v5.json",
      reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v6.json",
      terminal: ".planning/artifacts/v1.38-plan-262-16-terminal-v1.json",
    } as const
    try {
      execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
      execFileSync("git", ["checkout", "--quiet", V138_REVIEWED_SOURCE_A_FIXTURE], {
        cwd: root,
      })
      mkdirSync(path.resolve(root, ".planning/artifacts"), { recursive: true })
      const reviewPath =
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-15-REVIEW.md"
      mkdirSync(path.dirname(path.resolve(root, reviewPath)), { recursive: true })
      writeFileSync(
        path.resolve(root, reviewPath),
        cleanPlan26215Review(),
      )
      const sourceA = V138_REVIEWED_SOURCE_A_FIXTURE
      const authorization = buildV138Plan26215Authorization(
        root,
        sourceA,
        Buffer.from(v138Plan26215AuthorizationLiteral(sourceA), "utf8"),
      )
      const seal = buildV138SuccessorSourceSeal({
        repoRoot: root,
        sourceBase: "30c0949692017f425795213972482568cdd73f64",
        sourceA,
        authorization,
        reviewRoots: [],
        protectedEvidencePaths: [],
        frozenPolicy: { schemaVersion: "v1.38-frozen-policy-v1" },
        toolIdentity: { schemaVersion: "v1.38-tool-identity-v1" },
        hostIdentity: { schemaVersion: "v1.38-host-identity-v1" },
        formationAbsence: {
          schemaVersion: "v1.38-formation-absence-v1",
          absent: true,
        },
      })
      for (const [repoPath, value] of [
        [paths.authorization, authorization],
        [paths.seal, seal],
      ] as const) {
        writeFileSync(path.resolve(root, repoPath), canonicalManifest(value))
      }
      execFileSync("git", ["add", paths.authorization, paths.seal], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "chore: seal B"], {
        cwd: root,
      })
      const sourceB = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      const sourceBCustody = checkV138SuccessorSealCommit({
        repoRoot: root,
        sourceA,
        sourceB,
      })
      const context = buildV138ExecutionContextV5Receipt({
        repoRoot: root,
        authorization,
        seal,
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        terminalAgentRegistry: {
          schemaVersion: "v1.38-plan-262-16-terminal-agent-registry-v1",
          activeExecutorCount: 0,
          agents: [],
        },
        sourceBCustody,
      })
      for (const field of ["sourceB", "sourceBTree", "sourceBParent"] as const) {
        const forged = clone(context) as unknown as Record<string, unknown>
        const forgedCustody = forged.sourceBCustody as Record<string, unknown>
        const original = String(forgedCustody[field])
        forgedCustody[field] =
          `${original.slice(0, -1)}${original.endsWith("0") ? "1" : "0"}`
        if (field === "sourceB") forged.sourceB = forgedCustody[field]
        const { custodyRoot: _oldCustody, ...custodyBody } = forgedCustody
        forgedCustody.custodyRoot = v138SuccessorRoot(
          "containmentPolicy",
          String(forgedCustody.schemaVersion),
          custodyBody,
        )
        forged.sourceBCustodyRoot = forgedCustody.custodyRoot
        const { receiptRoot: _oldReceipt, ...contextBody } = forged
        forged.receiptRoot = v138SuccessorRoot(
          "evidenceBundle",
          String(forged.schemaVersion),
          contextBody,
        )
        expect(() =>
          checkV138ExecutionContextV5Receipt(forged, sourceBCustody),
        ).toThrow("MATRIX_EXECUTION_CONTEXT_V5_INVALID")
      }
      writeFileSync(
        path.resolve(root, paths.context),
        `${JSON.stringify(context)}\n`,
      )
      expect(() =>
        Buffer.from(sourceBCustody as unknown as Uint8Array),
      ).toThrow(/Received an instance of Object/u)
      let injectedObservationCount = 0
      const injectedResult = parseMemoryPressureQ({
        stdout: Buffer.from(
          "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 24%\n",
        ),
        stderr: Buffer.alloc(0),
        exitCode: 0,
        signal: null,
        timedOut: false,
      })
      writeFileSync(path.resolve(root, paths.preflight), "{}\n")
      let occupiedPreflightObservationCount = 0
      await expect(
        writeV138HostHeadroomPreflightV5Receipt(
          root,
          paths.preflight,
          paths.context,
          paths.authorization,
          paths.seal,
          sourceA,
          sourceB,
          async () => {
            occupiedPreflightObservationCount += 1
            return injectedResult
          },
        ),
      ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
      expect(occupiedPreflightObservationCount).toBe(0)
      unlinkSync(path.resolve(root, paths.preflight))
      const preflight = await writeV138HostHeadroomPreflightV5Receipt(
        root,
        paths.preflight,
        paths.context,
        paths.authorization,
        paths.seal,
        sourceA,
        sourceB,
        async () => {
          injectedObservationCount += 1
          return injectedResult
        },
      )
      expect(injectedObservationCount).toBe(1)
      expect(preflight).toMatchObject({
        sourceB,
        sourceBCustodyRoot: sourceBCustody.custodyRoot,
        disposition: "preflight_refused",
      })
      let invalidBObservationCount = 0
      await expect(
        writeV138HostHeadroomPreflightV5Receipt(
          root,
          paths.preflight,
          paths.context,
          paths.authorization,
          paths.seal,
          sourceA,
          "0".repeat(40),
          async () => {
            invalidBObservationCount += 1
            return injectedResult
          },
        ),
      ).rejects.toThrow()
      expect(invalidBObservationCount).toBe(0)
      writeFileSync(path.resolve(root, paths.calibration), "{}\n")
      let occupiedCalibrationRunCount = 0
      await expect(
        writeV138ParallelCalibrationV5Receipt(
          root,
          paths.calibration,
          paths.preflight,
          paths.context,
          sourceA,
          sourceB,
          async () => {
            occupiedCalibrationRunCount += 1
            throw new TypeError("INJECTED_CALIBRATION_MUST_NOT_RUN")
          },
        ),
      ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
      expect(occupiedCalibrationRunCount).toBe(0)
      unlinkSync(path.resolve(root, paths.calibration))
      writeFileSync(path.resolve(root, paths.reproduction), "{}\n")
      let occupiedReproductionRunCount = 0
      await expect(
        writeV138AuthoritativeMatrixV6Receipt(
          root,
          paths.reproduction,
          paths.calibration,
          paths.context,
          sourceA,
          sourceB,
          async () => {
            occupiedReproductionRunCount += 1
            throw new TypeError("INJECTED_REPRODUCTION_MUST_NOT_RUN")
          },
        ),
      ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
      expect(occupiedReproductionRunCount).toBe(0)
      unlinkSync(path.resolve(root, paths.reproduction))
      const calibration = buildV138ParallelCalibrationV5PreflightTerminal(preflight)
      const artifacts: ReadonlyArray<readonly [string, unknown]> = [
        [paths.calibration, calibration],
      ]
      for (const [repoPath, value] of artifacts) {
        writeFileSync(path.resolve(root, repoPath), `${JSON.stringify(value)}\n`)
      }
      expect(
        writeV138Plan26216Terminal(
          root,
          paths,
          "preflight_refused",
          sourceA,
          sourceB,
        ).disposition,
      ).toBe("preflight_refused")
      const inspectionOrder: string[] = []
      expect(
        checkV138Plan26216TerminalBranch(
          root,
          paths,
          sourceA,
          sourceB,
          {
            onInspection: (event) => {
              inspectionOrder.push(
                event.kind === "sourceB"
                  ? "sourceB"
                  : path.basename(event.target),
              )
            },
          },
        ),
      ).toBe("preflight_refused")
      expect(inspectionOrder.slice(0, 2)).toEqual([
        path.basename(paths.terminal),
        "sourceB",
      ])
      expect(inspectionOrder.indexOf(path.basename(paths.authorization))).toBeGreaterThan(
        inspectionOrder.indexOf("sourceB"),
      )
      const validTerminalBytes = readFileSync(path.resolve(root, paths.terminal))
      for (const mutateArtifactRoots of [
        (terminal: Record<string, unknown>) => {
          terminal.artifactRoots = null
        },
        (terminal: Record<string, unknown>) => {
          ;(terminal.artifactRoots as Record<string, unknown>).unexpected =
            `sha256:${createHash("sha256").update("unexpected").digest("hex")}`
        },
        (terminal: Record<string, unknown>) => {
          delete (terminal.artifactRoots as Record<string, unknown>).context
        },
        (terminal: Record<string, unknown>) => {
          ;(terminal.artifactRoots as Record<string, unknown>).authorization =
            "not-a-hash"
        },
        (terminal: Record<string, unknown>) => {
          ;(terminal.artifactRoots as Record<string, unknown>).reproduction =
            `sha256:${createHash("sha256").update("forged-reproduction").digest("hex")}`
        },
      ]) {
        const malformed = JSON.parse(
          validTerminalBytes.toString("utf8"),
        ) as Record<string, unknown>
        mutateArtifactRoots(malformed)
        const { terminalRoot: _oldTerminalRoot, ...terminalBody } = malformed
        malformed.terminalRoot = v138SuccessorRoot(
          "canonicalJsonProfile",
          String(malformed.schemaVersion),
          terminalBody,
        )
        writeFileSync(
          path.resolve(root, paths.terminal),
          `${JSON.stringify(malformed)}\n`,
        )
        let malformedBCheckCount = 0
        let malformedNonTerminalReadCount = 0
        expect(() =>
          checkV138Plan26216TerminalBranch(
            root,
            paths,
            sourceA,
            sourceB,
            {
              checkSourceB: () => {
                malformedBCheckCount += 1
                throw new TypeError("INJECTED_B_MUST_NOT_BE_CHECKED")
              },
              onInspection: (event) => {
                if (
                  event.kind === "artifact" &&
                  event.target !== path.resolve(root, paths.terminal)
                ) {
                  malformedNonTerminalReadCount += 1
                }
              },
            },
          ),
        ).toThrow("MATRIX_PLAN_262_16_TERMINAL_ROOTS_INVALID")
        expect(malformedBCheckCount).toBe(0)
        expect(malformedNonTerminalReadCount).toBe(0)
      }
      writeFileSync(path.resolve(root, paths.terminal), validTerminalBytes)
      writeFileSync(path.resolve(root, paths.reproduction), "{}\n")
      expect(() =>
        checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)
      ).toThrow(
        "MATRIX_PLAN_262_16_ARTIFACT_MUST_BE_ABSENT",
      )
      unlinkSync(path.resolve(root, paths.reproduction))

      const artifactRoot = (repoPath: string): `sha256:${string}` =>
        `sha256:${createHash("sha256")
          .update(readFileSync(path.resolve(root, repoPath)))
          .digest("hex")}`
      const publish = (repoPath: string, value: unknown): void => {
        writeFileSync(path.resolve(root, repoPath), `${JSON.stringify(value)}\n`)
      }
      const removeIfPresent = (repoPath: string): void => {
        try {
          unlinkSync(path.resolve(root, repoPath))
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
        }
      }
      const publishTerminal = (
        disposition:
          | "tool_identity_failed"
          | "protected_history_failed"
          | "formation_absence_failed"
          | "pattern_c_ownership_failed"
          | "preflight_unavailable"
          | "preflight_refused"
          | "calibration_stopped"
          | "reproduction_stopped"
          | "reproduction_passed",
        required: {
          context: boolean
          preflight: boolean
          calibration: boolean
          reproduction: boolean
        },
      ): void => {
        const body = {
          schemaVersion: "v1.38-plan-262-16-terminal-v1" as const,
          disposition,
          sourceB,
          sourceBCustodyRoot: sourceBCustody.custodyRoot,
          authorityExpired: true as const,
          noRetry: true as const,
          artifactRoots: {
            authorization: artifactRoot(paths.authorization),
            seal: artifactRoot(paths.seal),
            context: required.context ? artifactRoot(paths.context) : null,
            preflight: required.preflight ? artifactRoot(paths.preflight) : null,
            calibration: required.calibration
              ? artifactRoot(paths.calibration)
              : null,
            reproduction: required.reproduction
              ? artifactRoot(paths.reproduction)
              : null,
          },
        }
        publish(paths.terminal, {
          ...body,
          terminalRoot: v138SuccessorRoot(
            "canonicalJsonProfile",
            body.schemaVersion,
            body,
          ),
        })
      }

      for (const identityField of [
        "selectedRouteClosureRoot",
        "frozenPolicyRoot",
        "toolIdentityRoot",
        "hostIdentityRoot",
      ] as const) {
        const forgedContext = clone(context) as unknown as Record<
          string,
          unknown
        >
        forgedContext[identityField] =
          `sha256:${createHash("sha256").update(`forged:${identityField}`).digest("hex")}`
        const { receiptRoot: _contextRoot, ...contextBody } = forgedContext
        forgedContext.receiptRoot = v138SuccessorRoot(
          "evidenceBundle",
          String(forgedContext.schemaVersion),
          contextBody,
        )
        const forgedPreflight = clone(preflight) as unknown as Record<
          string,
          unknown
        >
        forgedPreflight.executionContextRoot = forgedContext.receiptRoot
        const { receiptRoot: _preflightRoot, ...preflightBody } =
          forgedPreflight
        forgedPreflight.receiptRoot = v138SuccessorRoot(
          "canonicalJsonProfile",
          String(forgedPreflight.schemaVersion),
          preflightBody,
        )
        const forgedCalibration = clone(calibration) as unknown as Record<
          string,
          unknown
        >
        forgedCalibration.executionContextRoot = forgedContext.receiptRoot
        forgedCalibration.preflightRoot = forgedPreflight.receiptRoot
        const { receiptRoot: _calibrationRoot, ...calibrationBody } =
          forgedCalibration
        forgedCalibration.receiptRoot = v138SuccessorRoot(
          "budgetProfile",
          String(forgedCalibration.schemaVersion),
          calibrationBody,
        )
        publish(paths.context, forgedContext)
        removeIfPresent(paths.preflight)
        let forgedPreflightObserverCount = 0
        await expect(
          writeV138HostHeadroomPreflightV5Receipt(
            root,
            paths.preflight,
            paths.context,
            paths.authorization,
            paths.seal,
            sourceA,
            sourceB,
            async () => {
              forgedPreflightObserverCount += 1
              return injectedResult
            },
          ),
        ).rejects.toThrow("MATRIX_PREFLIGHT_V5_CONTEXT_JOIN_INVALID")
        expect(forgedPreflightObserverCount).toBe(0)
        publish(paths.preflight, forgedPreflight)
        removeIfPresent(paths.calibration)
        let forgedCalibrationRunCount = 0
        await expect(
          writeV138ParallelCalibrationV5Receipt(
            root,
            paths.calibration,
            paths.preflight,
            paths.context,
            sourceA,
            sourceB,
            async () => {
              forgedCalibrationRunCount += 1
              throw new TypeError("INJECTED_CALIBRATION_MUST_NOT_RUN")
            },
          ),
        ).rejects.toThrow("MATRIX_CALIBRATION_V5_CONTEXT_JOIN_INVALID")
        expect(forgedCalibrationRunCount).toBe(0)
        publish(paths.calibration, forgedCalibration)
        removeIfPresent(paths.reproduction)
        let forgedReproductionRunCount = 0
        await expect(
          writeV138AuthoritativeMatrixV6Receipt(
            root,
            paths.reproduction,
            paths.calibration,
            paths.context,
            sourceA,
            sourceB,
            async () => {
              forgedReproductionRunCount += 1
              throw new TypeError("INJECTED_REPRODUCTION_MUST_NOT_RUN")
            },
          ),
        ).rejects.toThrow("MATRIX_REPRODUCTION_V6_CONTEXT_JOIN_INVALID")
        expect(forgedReproductionRunCount).toBe(0)
        removeIfPresent(paths.terminal)
        publishTerminal("preflight_refused", {
          context: true,
          preflight: true,
          calibration: true,
          reproduction: false,
        })
        expect(() =>
          checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB),
        ).toThrow("MATRIX_PLAN_262_16_CONTEXT_JOIN_INVALID")
      }

      publish(paths.context, context)
      const liveAdmittedPreflight = buildV138HostHeadroomPreflightV5Receipt({
        executionContext: context,
        result: parseMemoryPressureQ({
          stdout: Buffer.from(
            "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
          ),
          stderr: Buffer.alloc(0),
          exitCode: 0,
          signal: null,
          timedOut: false,
        }),
      })
      for (const preflightField of [
        "authorizationRoot",
        "sealRoot",
        "executionContextRoot",
        "sourceB",
        "sourceBCustodyRoot",
      ] as const) {
        const forged = clone(liveAdmittedPreflight) as unknown as Record<
          string,
          unknown
        >
        forged[preflightField] =
          preflightField === "sourceB"
            ? "0".repeat(40)
            : `sha256:${createHash("sha256")
                .update(`forged-preflight:${preflightField}`)
                .digest("hex")}`
        const { receiptRoot: _oldRoot, ...body } = forged
        forged.receiptRoot = v138SuccessorRoot(
          "canonicalJsonProfile",
          String(forged.schemaVersion),
          body,
        )
        publish(paths.preflight, forged)
        removeIfPresent(paths.calibration)
        let runCount = 0
        await expect(
          writeV138ParallelCalibrationV5Receipt(
            root,
            paths.calibration,
            paths.preflight,
            paths.context,
            sourceA,
            sourceB,
            async () => {
              runCount += 1
              throw new TypeError("INJECTED_CALIBRATION_MUST_NOT_RUN")
            },
          ),
        ).rejects.toThrow("MATRIX_CALIBRATION_V5_CONTEXT_JOIN_INVALID")
        expect(runCount).toBe(0)
      }

      publish(paths.preflight, liveAdmittedPreflight)
      removeIfPresent(paths.calibration)
      const liveAdmittedCalibration =
        await writeV138ParallelCalibrationV5Receipt(
          root,
          paths.calibration,
          paths.preflight,
          paths.context,
          sourceA,
          sourceB,
          async () =>
            admittedInjectedCalibration(enumerateV138CurrentMatrix(root)),
        )
      for (const preflightField of [
        "authorizationRoot",
        "sealRoot",
        "executionContextRoot",
        "sourceB",
        "sourceBCustodyRoot",
      ] as const) {
        const forged = clone(liveAdmittedPreflight) as unknown as Record<
          string,
          unknown
        >
        forged[preflightField] =
          preflightField === "sourceB"
            ? "0".repeat(40)
            : `sha256:${createHash("sha256")
                .update(`forged-reproduction-preflight:${preflightField}`)
                .digest("hex")}`
        const { receiptRoot: _oldRoot, ...body } = forged
        forged.receiptRoot = v138SuccessorRoot(
          "canonicalJsonProfile",
          String(forged.schemaVersion),
          body,
        )
        publish(paths.preflight, forged)
        publish(paths.calibration, liveAdmittedCalibration)
        removeIfPresent(paths.reproduction)
        let runCount = 0
        await expect(
          writeV138AuthoritativeMatrixV6Receipt(
            root,
            paths.reproduction,
            paths.calibration,
            paths.context,
            sourceA,
            sourceB,
            async () => {
              runCount += 1
              throw new TypeError("INJECTED_REPRODUCTION_MUST_NOT_RUN")
            },
          ),
        ).rejects.toThrow("MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED")
        expect(runCount).toBe(0)
      }

      publish(paths.preflight, liveAdmittedPreflight)
      for (const calibrationField of [
        "preflightRoot",
        "executionContextRoot",
        "sourceB",
        "sourceBCustodyRoot",
      ] as const) {
        const forged = clone(liveAdmittedCalibration) as unknown as Record<
          string,
          unknown
        >
        forged[calibrationField] =
          calibrationField === "sourceB"
            ? "0".repeat(40)
            : `sha256:${createHash("sha256")
                .update(`forged-calibration:${calibrationField}`)
                .digest("hex")}`
        const { receiptRoot: _oldRoot, ...body } = forged
        forged.receiptRoot = v138SuccessorRoot(
          "budgetProfile",
          String(forged.schemaVersion),
          body,
        )
        publish(paths.calibration, forged)
        removeIfPresent(paths.reproduction)
        let runCount = 0
        await expect(
          writeV138AuthoritativeMatrixV6Receipt(
            root,
            paths.reproduction,
            paths.calibration,
            paths.context,
            sourceA,
            sourceB,
            async () => {
              runCount += 1
              throw new TypeError("INJECTED_REPRODUCTION_MUST_NOT_RUN")
            },
          ),
        ).rejects.toThrow("MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED")
        expect(runCount).toBe(0)
      }
      const stoppedPriorCalibration = buildV138ParallelCalibrationV5Receipt({
        preflight: liveAdmittedPreflight,
        attempts: Array.from({ length: 8 }, (_, index) => ({
          attemptId: `calibration:v5:${index}`,
          shardId: `calibration-shard:${index % 4}`,
          outcome: index === 0
            ? "system_failure" as const
            : "accepted" as const,
          childLaunched: true,
          accepted: index !== 0,
        })),
        sharedObservationTicks: [],
      })
      publish(paths.calibration, stoppedPriorCalibration)
      removeIfPresent(paths.reproduction)
      let stoppedPriorRunCount = 0
      await expect(
        writeV138AuthoritativeMatrixV6Receipt(
          root,
          paths.reproduction,
          paths.calibration,
          paths.context,
          sourceA,
          sourceB,
          async () => {
            stoppedPriorRunCount += 1
            throw new TypeError("INJECTED_REPRODUCTION_MUST_NOT_RUN")
          },
        ),
      ).rejects.toThrow("MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED")
      expect(stoppedPriorRunCount).toBe(0)

      publish(paths.context, context)
      publish(paths.preflight, preflight)
      publish(paths.calibration, calibration)
      removeIfPresent(paths.terminal)
      publishTerminal("preflight_refused", {
        context: true,
        preflight: true,
        calibration: true,
        reproduction: false,
      })

      // Every before-observation disposition has the same exact absence row
      // but a distinct terminal reason that the production checker must accept.
      for (const disposition of [
        "tool_identity_failed",
        "protected_history_failed",
        "formation_absence_failed",
        "pattern_c_ownership_failed",
      ] as const) {
        for (const repoPath of [
          paths.context,
          paths.preflight,
          paths.calibration,
          paths.reproduction,
          paths.terminal,
        ]) removeIfPresent(repoPath)
        publishTerminal(disposition, {
          context: false,
          preflight: false,
          calibration: false,
          reproduction: false,
        })
        expect(
          checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB),
        ).toBe(disposition)
      }

      publish(paths.context, context)
      const unavailablePreflight = buildV138HostHeadroomPreflightV5Receipt({
        executionContext: context,
        result: { ok: false, reason: "resource_measurement_unavailable" },
      })
      const unavailableCalibration =
        buildV138ParallelCalibrationV5PreflightTerminal(unavailablePreflight)
      publish(paths.preflight, unavailablePreflight)
      publish(paths.calibration, unavailableCalibration)
      removeIfPresent(paths.terminal)
      publishTerminal("preflight_unavailable", {
        context: true,
        preflight: true,
        calibration: true,
        reproduction: false,
      })
      expect(checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)).toBe(
        "preflight_unavailable",
      )

      const admittedPreflight = buildV138HostHeadroomPreflightV5Receipt({
        executionContext: context,
        result: parseMemoryPressureQ({
          stdout: Buffer.from(
            "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
          ),
          stderr: Buffer.alloc(0),
          exitCode: 0,
          signal: null,
          timedOut: false,
        }),
      })
      const attempts = Array.from({ length: 8 }, (_, index) => ({
        attemptId: `calibration:v5:${index}`,
        shardId: `calibration-shard:${index % 4}`,
        outcome: "accepted" as const,
        childLaunched: true,
        accepted: true,
      }))
      const stoppedCalibration = buildV138ParallelCalibrationV5Receipt({
        preflight: admittedPreflight,
        attempts: attempts.map((attempt, index) =>
          index === 0
            ? { ...attempt, outcome: "system_failure" as const, accepted: false }
            : attempt,
        ),
        sharedObservationTicks: [],
      })
      publish(paths.preflight, admittedPreflight)
      publish(paths.calibration, stoppedCalibration)
      removeIfPresent(paths.terminal)
      publishTerminal("calibration_stopped", {
        context: true,
        preflight: true,
        calibration: true,
        reproduction: false,
      })
      expect(checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)).toBe(
        "calibration_stopped",
      )

      const terminalBytes = readFileSync(path.resolve(root, paths.terminal))
      const terminalValue = JSON.parse(terminalBytes.toString("utf8")) as Record<
        string,
        unknown
      >
      publish(paths.terminal, { ...terminalValue, unexpected: true })
      expect(() =>
        checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)
      ).toThrow(
        "MATRIX_PLAN_262_16_TERMINAL_INVALID",
      )
      writeFileSync(path.resolve(root, paths.terminal), terminalBytes)
      expect(() =>
        checkV138Plan26216TerminalBranch(
          root,
          { ...paths, terminal: "../outside-terminal.json" },
          sourceA,
          sourceB,
        ),
      ).toThrow("MATRIX_PLAN_262_16_CANONICAL_PATH_REQUIRED")
      const reproductionPath = path.resolve(root, paths.calibration)
      const reproductionBytes = readFileSync(reproductionPath)
      unlinkSync(reproductionPath)
      symlinkSync(path.resolve(root, "outside-calibration"), reproductionPath)
      expect(() =>
        checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)
      ).toThrow(
        "MATRIX_PLAN_262_16_ARTIFACT_TYPE_INVALID",
      )
      unlinkSync(reproductionPath)
      mkdirSync(reproductionPath)
      expect(() =>
        checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)
      ).toThrow(
        "MATRIX_PLAN_262_16_ARTIFACT_TYPE_INVALID",
      )
      rmSync(reproductionPath, { recursive: true })
      writeFileSync(reproductionPath, reproductionBytes)
      const preflightPath = path.resolve(root, paths.preflight)
      chmodSync(preflightPath, 0o000)
      expect(() =>
        checkV138Plan26216TerminalBranch(root, paths, sourceA, sourceB)
      ).toThrow()
      chmodSync(preflightPath, 0o600)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
    expect(execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    })).toBe(originalHead)
    expect(execFileSync("git", ["status", "--porcelain"], {
      cwd: repoRoot,
      encoding: "utf8",
    })).toBe(originalStatus)
  }, 600_000)
})

describe("v1.38 foundation admission", () => {
  let exactInput: V138FoundationAdmissionInput

  beforeAll(() => {
    exactInput = resolveV138FoundationAdmissionInput(repoRoot)
  }, 60_000)

  it("admission accepts only the resolved immutable v1.37 authority", () => {
    const result = evaluateV138FoundationAdmission(exactInput, exactInput)

    expect(result).toMatchObject({
      schemaVersion: "v1.38-foundation-admission-v1",
      status: "passed_exact",
      archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
      annotatedTagObject: "44d7bb03c175ec3ee2557193c6b190aa44001244",
      semanticAuthorityKey: "runtime-v1.19",
      semanticTupleId:
        "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
      postTagProof08: true,
      laterCorrectionChangesGameplay: false,
      auditReproductionRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      runtimeAuthorityRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      sourceBindingsRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      correctionLineageRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      admissionRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(Object.isFrozen(result)).toBe(true)
    expect(JSON.stringify(result)).not.toMatch(
      /Users|StrategyMemory|SoldierMemory|objective|DATABASE_URL|stack|diagnostic/iu,
    )
  })

  it("admission is deterministic and renders a byte-stable public receipt", () => {
    const first = evaluateV138FoundationAdmission(exactInput, exactInput)
    const second = evaluateV138FoundationAdmission(
      clone(exactInput),
      exactInput,
    )

    expect(second).toEqual(first)
    expect(renderV138FoundationAdmissionReceipt(first)).toBe(
      renderV138FoundationAdmissionReceipt(second),
    )
    expect(renderV138FoundationAdmissionReceipt(first)).toMatch(/\n$/u)
  })

  it("admission audit reproduction does not depend on the tsx CLI IPC server", () => {
    const originalPath = process.env.PATH
    try {
      process.env.PATH = "/v1.38-admission-no-cli-path"
      expect(runV137AuditReproductionGate(repoRoot)).toMatchObject({
        schemaVersion: "v1.37-audit-reproduction-receipt-v1",
        status: "passed-exact",
        hashes: {
          joinSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        },
      })
    } finally {
      process.env.PATH = originalPath
    }
  })

  it("admission audit reproduction excludes hostile Node bootstrap hooks", () => {
    const originalNodeOptions = process.env.NODE_OPTIONS
    try {
      process.env.NODE_OPTIONS =
        "--require /v1.38-hostile-preload-must-not-execute.cjs"
      expect(runV137AuditReproductionGate(repoRoot)).toMatchObject({
        schemaVersion: "v1.37-audit-reproduction-receipt-v1",
        status: "passed-exact",
      })
    } finally {
      if (originalNodeOptions === undefined) {
        delete process.env.NODE_OPTIONS
      } else {
        process.env.NODE_OPTIONS = originalNodeOptions
      }
    }
  })

  it("admission stops for missing or extra-keyed authority inputs", () => {
    const { release: _release, ...missing } = exactInput
    const stoppedMissing = evaluateV138FoundationAdmission(missing, exactInput)
    const stoppedExtra = evaluateV138FoundationAdmission({
      ...exactInput,
      override: true,
    }, exactInput)

    expect(stoppedMissing).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_SCHEMA_INVALID",
    })
    expect(stoppedExtra).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_SCHEMA_INVALID",
    })
  })

  it.each([
    [
      "audit reproduction drift",
      "AUDIT_REPRODUCTION_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "audit").joinSha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "archive mismatch",
      "ARCHIVE_MISMATCH",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").archiveCommit = "0".repeat(40)
      },
    ],
    [
      "stale annotated tag",
      "TAG_OBJECT_MISMATCH",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").tagObject = "0".repeat(40)
      },
    ],
    [
      "stale release-readiness evidence",
      "RELEASE_READINESS_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").releaseReadinessSha256 =
          `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "non-annotated tag",
      "TAG_NOT_ANNOTATED",
      (draft: Record<string, unknown>) => {
        nested(draft, "release").tagObjectType = "commit"
      },
    ],
    [
      "missing post-tag result",
      "POST_TAG_CHECK_FAILED",
      (draft: Record<string, unknown>) => {
        nested(nested(draft, "release"), "postTag").proof08 = false
      },
    ],
    [
      "semantic tuple drift",
      "SEMANTIC_TUPLE_DRIFT",
      (draft: Record<string, unknown>) => {
        nested(draft, "semanticAuthority").tupleId = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "runtime authority drift",
      "RUNTIME_AUTHORITY_STALE",
      (draft: Record<string, unknown>) => {
        nested(draft, "runtimeAuthority").runtimeServiceVersion =
          "runtime-execution-service-v0"
      },
    ],
    [
      "source binding drift",
      "SOURCE_BINDING_DRIFT",
      (draft: Record<string, unknown>) => {
        const bindings = nested(draft, "sources").bindings as Array<
          Record<string, unknown>
        >
        bindings[0]!.sha256 = `sha256:${"0".repeat(64)}`
      },
    ],
    [
      "unexplained correction lineage",
      "CORRECTION_LINEAGE_UNEXPLAINED",
      (draft: Record<string, unknown>) => {
        nested(draft, "correctionLineage").implementationCommit = "0".repeat(40)
      },
    ],
  ] as const)("admission stops for %s", (_label, reason, applyMutation) => {
    const result = evaluateV138FoundationAdmission(
      mutate(exactInput, applyMutation),
      exactInput,
    )

    expect(result).toMatchObject({
      status: "stopped_integrity_foundation",
      reason,
    })
  })

  it.each([
    [
      "audit actual and resolved hashes",
      (draft: Record<string, unknown>) => {
        const audit = nested(draft, "audit")
        audit.joinSha256 = `sha256:${"1".repeat(64)}`
        audit.resolvedJoinSha256 = audit.joinSha256
      },
    ],
    [
      "annotated tag actual and resolved objects",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        release.tagObject = "1".repeat(40)
        release.resolvedTagObject = release.tagObject
      },
    ],
    [
      "release-readiness actual and resolved hashes",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        release.releaseReadinessSha256 = `sha256:${"1".repeat(64)}`
        release.resolvedReleaseReadinessSha256 =
          release.releaseReadinessSha256
      },
    ],
    [
      "archive and correction lineage join",
      (draft: Record<string, unknown>) => {
        const release = nested(draft, "release")
        const correction = nested(draft, "correctionLineage")
        release.archiveCommit = "1".repeat(40)
        release.resolvedTagTarget = release.archiveCommit
        correction.baseArchiveCommit = release.archiveCommit
        correction.implementationParent = release.archiveCommit
      },
    ],
    [
      "source actual and expected hashes",
      (draft: Record<string, unknown>) => {
        const bindings = nested(draft, "sources").bindings as Array<
          Record<string, unknown>
        >
        bindings[0]!.sha256 = `sha256:${"1".repeat(64)}`
        bindings[0]!.expectedSha256 = bindings[0]!.sha256
      },
    ],
    [
      "correction record actual and committed hashes",
      (draft: Record<string, unknown>) => {
        const correction = nested(draft, "correctionLineage")
        correction.recordSha256 = `sha256:${"1".repeat(64)}`
        correction.committedRecordSha256 = correction.recordSha256
      },
    ],
  ] as const)(
    "admission rejects paired forgery of %s",
    (_label, applyMutation) => {
      expect(
        evaluateV138FoundationAdmission(
          mutate(exactInput, applyMutation),
          exactInput,
        ),
      ).toMatchObject({
        status: "stopped_integrity_foundation",
        reason: "SOURCE_BINDING_DRIFT",
      })
    },
  )

  it("admission rejects copied labels, boolean gates, and nested override keys", () => {
    const copiedTuple = {
      semanticAuthorityKey: "runtime-v1.19",
      tupleId:
        "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    }
    const mutations = [
      mutate(exactInput, (draft) => {
        draft.semanticAuthority = copiedTuple
      }),
      mutate(exactInput, (draft) => {
        draft.semanticAuthority = true
      }),
      mutate(exactInput, (draft) => {
        nested(draft, "release").waiver = "approved"
      }),
      mutate(exactInput, (draft) => {
        nested(draft, "correctionLineage").repair = true
      }),
    ]

    for (const mutation of mutations) {
      expect(
        evaluateV138FoundationAdmission(mutation, exactInput),
      ).toMatchObject({
        status: "stopped_integrity_foundation",
        reason: "INPUT_SCHEMA_INVALID",
      })
    }
  })

  it("admission rejects inputs beyond the canonical bounded envelope", () => {
    expect(
      evaluateV138FoundationAdmission({
        ...exactInput,
        oversized: "x".repeat(600 * 1024),
      }, exactInput),
    ).toMatchObject({
      status: "stopped_integrity_foundation",
      reason: "INPUT_BOUNDS_INVALID",
    })
  })

  it("admission stopped results expose no waiver, repair, tag mutation, or root", () => {
    const stopped = evaluateV138FoundationAdmission(
      mutate(exactInput, (draft) => {
        nested(nested(draft, "release"), "postTag").findings = [
          { code: "TAG_TARGET_NOT_EXPECTED_ARCHIVE" },
        ]
      }),
      exactInput,
    )
    const serialized = JSON.stringify(stopped)

    expect(stopped).toEqual({
      schemaVersion: "v1.38-foundation-admission-v1",
      status: "stopped_integrity_foundation",
      reason: "POST_TAG_CHECK_FAILED",
      repairAuthorized: false,
      inputDigest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(serialized).not.toMatch(
      /waiver|override|acceptAnyway|repairCallback|moveTag|admissionRoot|authoritativeRoot/iu,
    )
  }, 120_000)
})

describe("v1.38 current matrix reproduction", () => {
  let attempts: readonly V138CurrentMatrixAttempt[]

  beforeAll(() => {
    attempts = enumerateV138CurrentMatrix(repoRoot).attempts
  })

  it("uses the immutable historical admission Git object while current A advances", () => {
    const admission = checkV138HistoricalFoundationAdmission(repoRoot)
    expect(admission.admissionRoot).toBe(
      "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c",
    )
    expect(enumerateV138CurrentMatrix(repoRoot).attempts).toHaveLength(540)
    for (const kind of ["blob", "content"] as const) {
      const corrupt: V138HistoricalAdmissionGitObjects = {
        resolveCommitPath(input) {
          const resolved = producingGitObjects().resolveCommitPath(input)
          return {
            blob:
              kind === "blob"
                ? "0000000000000000000000000000000000000000"
                : resolved.blob,
            content:
              kind === "content"
                ? Buffer.from("mutated historical admission", "utf8")
                : resolved.content,
          }
        },
      }
      expect(() =>
        checkV138HistoricalFoundationAdmission(repoRoot, corrupt),
      ).toThrow("MATRIX_HISTORICAL_ADMISSION_INVALID")
    }
  })

  it("matrix admission rechecks protected inputs after a prior pass", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-admission-drift-"),
    )
    const checkout = path.join(temporaryRoot, "checkout")
    execFileSync(
      "git",
      ["worktree", "add", "--detach", checkout, "HEAD"],
      { cwd: repoRoot },
    )
    try {
      symlinkSync(
        path.resolve(repoRoot, "node_modules"),
        path.resolve(checkout, "node_modules"),
        "dir",
      )
      expect(enumerateV138CurrentMatrix(checkout).attempts).toHaveLength(540)

      appendFileSync(
        path.resolve(
          checkout,
          "packages/engine/src/compatibility-fixtures.test.ts",
        ),
        "\n// Deliberate protected-input drift for admission-cache regression.\n",
      )

      expect(() => enumerateV138CurrentMatrix(checkout)).toThrow(
        "MATRIX_ADMISSION_INVALID",
      )
    } finally {
      execFileSync("git", ["worktree", "remove", "--force", checkout], {
        cwd: repoRoot,
      })
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }, 120_000)

  it("admission and matrix enumeration reject every dirty live gate source", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-live-gate-drift-"),
    )
    const checkout = path.join(temporaryRoot, "checkout")
    execFileSync(
      "git",
      ["worktree", "add", "--detach", checkout, "HEAD"],
      { cwd: repoRoot },
    )
    try {
      symlinkSync(
        path.resolve(repoRoot, "node_modules"),
        path.resolve(checkout, "node_modules"),
        "dir",
      )
      for (const sourcePath of V138_FOUNDATION_LIVE_SOURCE_PATHS) {
        appendFileSync(
          path.resolve(checkout, sourcePath),
          "\n// Deliberate live-source drift for admission authentication.\n",
        )
        expect(() =>
          resolveV138FoundationAdmissionInput(checkout),
        ).toThrow("V138_ADMISSION_LIVE_SOURCE_DRIFT")
        expect(() => enumerateV138CurrentMatrix(checkout)).toThrow(
          "MATRIX_ADMISSION_INVALID",
        )
        execFileSync("git", ["checkout", "--", sourcePath], {
          cwd: checkout,
        })
      }
    } finally {
      execFileSync("git", ["worktree", "remove", "--force", checkout], {
        cwd: repoRoot,
      })
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  }, 120_000)

  it("matrix freezes the exact historical inventory without collapsing duplicate geometry", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const unorderedPairs = new Set(
      attempts.map(
        ({ leftDefinitionId, rightDefinitionId }) =>
          `${leftDefinitionId}\0${rightDefinitionId}`,
      ),
    )

    expect(inventory.schemaVersion).toBe("v1.38-current-matrix-inventory-v1")
    expect(inventory.fixturePurpose).toBe("regression_throughput_only")
    expect(inventory.definitions).toHaveLength(10)
    expect(unorderedPairs).toHaveLength(45)
    expect(
      inventory.arenas.map(({ historicalLabel }) => historicalLabel),
    ).toEqual(["Smoke", "Standard Cross", "Open Field"])
    expect(inventory.arenas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          historicalLabel: "Smoke",
          duplicateGeometryGroup: "empty-v1",
        }),
        expect.objectContaining({
          historicalLabel: "Open Field",
          duplicateGeometryGroup: "empty-v1",
        }),
      ]),
    )
    expect(
      new Set(
        inventory.arenas.map(
          ({ semanticGeometryHash }) => semanticGeometryHash,
        ),
      ),
    ).toHaveLength(2)
    expect(new Set(attempts.map(({ seedLabel }) => seedLabel))).toEqual(
      new Set(["meta-even", "meta-odd"]),
    )
    expect(new Set(attempts.map(({ mirrored }) => mirrored))).toEqual(
      new Set([false, true]),
    )
    expect(attempts).toHaveLength(540)
    expect(new Set(attempts.map(({ attemptId }) => attemptId))).toHaveLength(
      540,
    )
    expect(Object.isFrozen(inventory)).toBe(true)
  })

  it("matrix builds immutable Advanced requests with explicit entrant initiative and selected authority", () => {
    for (const attempt of attempts) {
      expect(attempt.fixturePurpose).toBe("regression_throughput_only")
      expect(attempt.initialInitiativeEntrantId).toBe(
        attempt.seedLabel === "meta-even"
          ? attempt.bottomEntrantId
          : attempt.topEntrantId,
      )
      expect(attempt.request).toMatchObject({
        contractVersion: "runtime-execution-service-v1.18",
        kind: "executeMatch",
        semanticTuple: {
          tupleId:
            "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
          components: {
            engine: "engine-kernel-v1.37-candidate-1",
            runtimeAbi: "strategy-runtime-abi-v1.19",
          },
        },
        match: {
          match: {
            initialInitiativePlayerId: attempt.initialInitiativePlayerId,
            candidateMatch: {
              semanticAuthorityKey: "runtime-v1.19",
              initialInitiativeEntrantKey: attempt.initialInitiativeEntrantId,
            },
          },
          strategies: {
            bottom: {
              metadata: {
                tags: expect.arrayContaining(["regression_throughput_only"]),
              },
            },
            top: {
              metadata: {
                tags: expect.arrayContaining(["regression_throughput_only"]),
              },
            },
          },
        },
      })
      expect(Object.isFrozen(attempt)).toBe(true)
    }
  })

  it("matrix source contains no historical loader or alternate transition authority", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )

    expect(source).toContain("executePreparedRuntimeServiceRequestV118")
    expect(source).toContain("createPreparedRuntimeServiceDependenciesV118")
    expect(source).not.toMatch(/\bnew\s+Function\b/u)
    expect(source).not.toMatch(/node:vm|from\s+["'][^"']*engine[^"']*["']/u)
    expect(source).not.toMatch(/\brunMatch\s*\(/u)
  })

  it("matrix keeps every failed attempt charged and excludes it from accepted cells", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const outcomes: V138CurrentMatrixAttemptOutcome[] = inventory.attempts.map(
      ({ attemptId }, index) => ({
        attemptId,
        classification:
          index === 0
            ? "player_violation"
            : index === 1
              ? "system_failure"
              : "success",
        ...(index === 0
          ? { code: "INVALID_OUTPUT" }
          : index === 1
            ? { code: "EXECUTION_EXCEPTION", retryable: true }
            : { outcome: "draw" as const }),
      }),
    )

    expect(() => reduceV138CurrentMatrix(inventory, outcomes)).toThrow(
      "MATRIX_REPRODUCTION_MISMATCH",
    )
  })

  it.each([
    [
      "missing cell",
      (rows: V138CurrentMatrixAttemptOutcome[]) => rows.slice(1),
    ],
    [
      "duplicate cell",
      (rows: V138CurrentMatrixAttemptOutcome[]) => [...rows, rows[0]!],
    ],
    [
      "conflicting duplicate",
      (rows: V138CurrentMatrixAttemptOutcome[]) => [
        ...rows,
        { ...rows[0]!, outcome: "bottom_win" as const },
      ],
    ],
  ])("matrix rejects %s before sealing a receipt", (_label, mutateRows) => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const allDraws: V138CurrentMatrixAttemptOutcome[] = inventory.attempts.map(
      ({ attemptId }) => ({
        attemptId,
        classification: "success",
        outcome: "draw",
      }),
    )
    expect(() =>
      reduceV138CurrentMatrix(inventory, mutateRows(allDraws)),
    ).toThrow("MATRIX_REPRODUCTION_MISMATCH")
  })

  it("matrix calibrates supervised execution and fails closed when the total resource budget is unsafe", () => {
    const receipt = legacyStoppedMatrixReceipt()
    const rendered = renderV138CurrentMatrixReceipt(receipt)

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v1",
      status: "stopped_process_failure",
      fixturePurpose: "regression_throughput_only",
      reason: "system_failure_resource_pressure",
      declaredAttemptCount: 540,
      acceptedCellCount: 0,
      partialAcceptedEvidenceReusable: false,
      priorFailedRun: {
        classification: "system_failure_resource_pressure",
        hostFreeMemoryPercentAtTermination: 9,
        partialResultsDiscarded: true,
        completedAttemptCount: "unknown",
      },
      resourcePolicy: {
        calibrationAttemptCount: 1,
        maxShardAttempts: 4,
        partialAcceptedEvidenceReusable: false,
      },
      calibration: {
        attemptCount: 1,
        withinTotalRunBudget: false,
        withinShardMemoryBudget: true,
        outcomeClassification: "success",
      },
      chargedAttemptLedgerRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      acceptedCellLedgerRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      receiptRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    expect(Object.isFrozen(receipt)).toBe(true)
    expect(rendered).toMatch(/\n$/u)
    expect(rendered).not.toMatch(
      /StrategyMemory|SoldierMemory|objectivePayload|strategySource|diagnostic|Users|DATABASE_URL/iu,
    )
  }, 600_000)

  it("matrix resource policy uses bounded subprocess shards and publishes no partial accepted cells", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )
    expect(source).toContain("process.execPath")
    expect(source).toContain('"--import"')
    expect(source).toContain('"tsx"')
    expect(source).toContain("maxShardAttempts: 4")
    expect(source).toContain("maxShardRssKilobytes")
    expect(source).toContain("acceptedCellsPublished: 0")
    expect(source).toContain("partialAcceptedEvidenceReusable: false")
    expect(source).not.toMatch(/\bnew\s+Function\b|node:vm|\brunMatch\s*\(/u)
  })
})

describe("v1.38 immutable receipt publication", () => {
  const capturePublicationFailure = (operation: () => void): unknown => {
    try {
      operation()
    } catch (error) {
      return error
    }
    throw new Error("EXPECTED_PUBLICATION_FAILURE")
  }

  it("rejects a partial temporary writer that returns normally", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-short-write-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: (fileDescriptor, bytes) => {
              writeSync(
                fileDescriptor,
                bytes,
                0,
                Math.max(1, Math.floor(bytes.byteLength / 2)),
              )
            },
          },
        ),
      ).toThrow("MATRIX_SUCCESSOR_TEMPORARY_WRITE_INCOMPLETE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("keeps the canonical target absent after a partial temporary write fails", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: (fileDescriptor, bytes) => {
              writeSync(
                fileDescriptor,
                bytes,
                0,
                Math.max(1, Math.floor(bytes.byteLength / 2)),
              )
              expect(existsSync(target)).toBe(false)
              throw new Error("INJECTED_PARTIAL_TEMPORARY_WRITE_FAILURE")
            },
          },
        ),
      ).toThrow("INJECTED_PARTIAL_TEMPORARY_WRITE_FAILURE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("allows exactly one complete receipt to win competing publication", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-race-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const first = { schemaVersion: "test-receipt-v1", writer: "first" }
    const second = { schemaVersion: "test-receipt-v1", writer: "second" }
    try {
      writeV138ImmutableReceipt(target, first)
      expect(() => writeV138ImmutableReceipt(target, second)).toThrow(
        "MATRIX_SUCCESSOR_TARGET_NOT_FRESH",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(first)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("cleans and durably records a publication link failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-link-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            linkTemporaryFile: () => {
              throw new Error("INJECTED_PUBLICATION_LINK_FAILURE")
            },
            fsyncDirectory: (directoryDescriptor, phase) => {
              fsyncPhases.push(phase)
              fsyncSync(directoryDescriptor)
            },
          },
        ),
      ).toThrow("INJECTED_PUBLICATION_LINK_FAILURE")
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
      expect(fsyncPhases).toEqual(["cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("preserves the canonical link when publication fsync is indeterminate", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const receipt = {
      schemaVersion: "test-receipt-v1",
      status: "complete",
    }
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(target, receipt, {
          fsyncDirectory: (directoryDescriptor, phase) => {
            fsyncPhases.push(phase)
            if (phase === "publication") {
              throw new Error("INJECTED_PUBLICATION_FSYNC_FAILURE")
            }
            fsyncSync(directoryDescriptor)
          },
        }),
      ).toThrow(
        "MATRIX_SUCCESSOR_PUBLICATION_DURABILITY_INDETERMINATE",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(receipt)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
      expect(fsyncPhases).toEqual(["publication", "cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("preserves the canonical link and reports temporary unlink failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-publication-unlink-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            fsyncDirectory: (directoryDescriptor, phase) => {
              fsyncPhases.push(phase)
              fsyncSync(directoryDescriptor)
            },
            unlinkTemporaryFile: () => {
              throw new Error("INJECTED_TEMPORARY_UNLINK_FAILURE")
            },
          },
        ),
      ).toThrow("MATRIX_SUCCESSOR_TEMPORARY_CLEANUP_FAILED")
      expect(existsSync(target)).toBe(true)
      expect(readdirSync(temporaryRoot)).toHaveLength(2)
      expect(fsyncPhases).toEqual(["publication"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports cleanup-fsync failure without removing the canonical link", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-cleanup-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const receipt = {
      schemaVersion: "test-receipt-v1",
      status: "complete",
    }
    const fsyncPhases: string[] = []
    try {
      expect(() =>
        writeV138ImmutableReceipt(target, receipt, {
          fsyncDirectory: (directoryDescriptor, phase) => {
            fsyncPhases.push(phase)
            if (phase === "cleanup") {
              throw new Error("INJECTED_CLEANUP_FSYNC_FAILURE")
            }
            fsyncSync(directoryDescriptor)
          },
        }),
      ).toThrow(
        "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
      )
      expect(JSON.parse(readFileSync(target, "utf8"))).toEqual(receipt)
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
      expect(fsyncPhases).toEqual(["publication", "cleanup"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports unlink cleanup failure alongside a primary link failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-link-unlink-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const primaryFailure = new Error("INJECTED_PUBLICATION_LINK_FAILURE")
    const cleanupFailure = new Error("INJECTED_TEMPORARY_UNLINK_FAILURE")
    try {
      const error = capturePublicationFailure(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            linkTemporaryFile: () => {
              throw primaryFailure
            },
            unlinkTemporaryFile: () => {
              throw cleanupFailure
            },
          },
        ),
      )
      expect(error).toBeInstanceOf(AggregateError)
      expect(error).toMatchObject({
        message: "MATRIX_SUCCESSOR_TEMPORARY_CLEANUP_FAILED",
      })
      const errors = (error as AggregateError).errors
      expect(errors).toHaveLength(2)
      expect(errors[0]).toBe(primaryFailure)
      expect(errors[1]).toMatchObject({
        message: "MATRIX_SUCCESSOR_TEMPORARY_CLEANUP_FAILED",
        cause: cleanupFailure,
      })
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toHaveLength(1)
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports cleanup durability uncertainty alongside a short write", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-short-cleanup-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const cleanupFailure = new Error("INJECTED_CLEANUP_FSYNC_FAILURE")
    try {
      const error = capturePublicationFailure(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: (fileDescriptor, bytes) => {
              writeSync(
                fileDescriptor,
                bytes,
                0,
                Math.max(1, Math.floor(bytes.byteLength / 2)),
              )
            },
            fsyncDirectory: (_directoryDescriptor, phase) => {
              if (phase === "cleanup") {
                throw cleanupFailure
              }
            },
          },
        ),
      )
      expect(error).toBeInstanceOf(AggregateError)
      expect(error).toMatchObject({
        message:
          "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
      })
      const errors = (error as AggregateError).errors
      expect(errors).toHaveLength(2)
      expect(errors[0]).toMatchObject({
        message: "MATRIX_SUCCESSOR_TEMPORARY_WRITE_INCOMPLETE",
      })
      expect(errors[1]).toMatchObject({
        message:
          "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
        cause: cleanupFailure,
      })
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports cleanup durability uncertainty alongside target contention", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-exists-cleanup-fsync-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    writeFileSync(target, "{}\n")
    const cleanupFailure = new Error("INJECTED_CLEANUP_FSYNC_FAILURE")
    try {
      const error = capturePublicationFailure(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            fsyncDirectory: (_directoryDescriptor, phase) => {
              if (phase === "cleanup") {
                throw cleanupFailure
              }
            },
          },
        ),
      )
      expect(error).toBeInstanceOf(AggregateError)
      expect(error).toMatchObject({
        message:
          "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
      })
      const errors = (error as AggregateError).errors
      expect(errors).toHaveLength(2)
      expect(errors[0]).toMatchObject({
        message: "MATRIX_SUCCESSOR_TARGET_NOT_FRESH",
      })
      expect(errors[1]).toMatchObject({
        message:
          "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
        cause: cleanupFailure,
      })
      expect(readFileSync(target, "utf8")).toBe("{}\n")
      expect(readdirSync(temporaryRoot)).toEqual(["receipt.json"])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })

  it("reports descriptor cleanup failure alongside a primary write failure", () => {
    const temporaryRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v138-write-close-fault-"),
    )
    const target = path.join(temporaryRoot, "receipt.json")
    const primaryFailure = new Error("INJECTED_TEMPORARY_WRITE_FAILURE")
    const cleanupFailure = new Error("INJECTED_DESCRIPTOR_CLOSE_FAILURE")
    try {
      const error = capturePublicationFailure(() =>
        writeV138ImmutableReceipt(
          target,
          { schemaVersion: "test-receipt-v1", status: "complete" },
          {
            writeTemporaryFile: () => {
              throw primaryFailure
            },
            closeTemporaryFile: (fileDescriptor) => {
              closeSync(fileDescriptor)
              throw cleanupFailure
            },
          },
        ),
      )
      expect(error).toBeInstanceOf(AggregateError)
      expect(error).toMatchObject({
        message: "MATRIX_SUCCESSOR_DESCRIPTOR_CLEANUP_FAILED",
      })
      const errors = (error as AggregateError).errors
      expect(errors).toHaveLength(2)
      expect(errors[0]).toBe(primaryFailure)
      expect(errors[1]).toMatchObject({
        message: "MATRIX_SUCCESSOR_DESCRIPTOR_CLEANUP_FAILED",
        cause: cleanupFailure,
      })
      expect(existsSync(target)).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true })
    }
  })
})

describe("v1.38 matrix calibration policy", () => {
  it("matrix calibration policy precommits the exact eight-attempt four-shard inventory", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)

    expect(policy).toMatchObject({
      schemaVersion: "v1.38-parallel-calibration-policy-v1",
      sampleAttemptCount: 8,
      sampleShardCount: 4,
      attemptsPerShard: 2,
      concurrency: 4,
      authoritativeAttemptDenominator: 540,
      marginBasisPoints: 750,
      fixedOverheadMilliseconds: 60_000,
      maxProjectedTotalMilliseconds: 5_400_000,
      aggregationRules: {
        calibrationBatchWall:
          "ceil_parent_monotonic_first_spawn_through_cleanup_barrier_ms",
        perChildRss: "maximum_sample_per_child_kilobytes",
        aggregateChildRss:
          "maximum_tick_sum_of_all_active_children_kilobytes",
        hostHeadroom:
          "minimum_floor_free_over_total_basis_points_across_ticks",
      },
      roundingRules: {
        observedBatchWall: "ceil_integer_milliseconds",
        baseProjection: "ceil_integer_milliseconds",
        margin: "ceil_integer_milliseconds",
        hostHeadroom: "floor_integer_basis_points",
      },
      admissionComparator: "inclusive_less_than_or_equal",
    })
    expect(policy.inventory.attempts).toEqual(
      inventory.attempts.slice(0, 8).map((attempt, index) => ({
        calibrationAttemptId: `calibration:v1:${index}:${attempt.attemptId}`,
        templateAttemptId: attempt.attemptId,
        shardId: `calibration-shard:${Math.floor(index / 2)}`,
        laneId: `lane:${Math.floor(index / 2)}`,
        ordinalInShard: index % 2,
        requestSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
      })),
    )
    expect(
      policy.inventory.attempts.map(({ calibrationAttemptId }) =>
        inventory.attempts.some(
          ({ attemptId }) => attemptId === calibrationAttemptId,
        ),
      ),
    ).toEqual(Array(8).fill(false))
    expect(policy.inventory.shards).toEqual([
      {
        shardId: "calibration-shard:0",
        laneId: "lane:0",
        attemptIds: [
          `calibration:v1:0:${inventory.attempts[0]!.attemptId}`,
          `calibration:v1:1:${inventory.attempts[1]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:1",
        laneId: "lane:1",
        attemptIds: [
          `calibration:v1:2:${inventory.attempts[2]!.attemptId}`,
          `calibration:v1:3:${inventory.attempts[3]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:2",
        laneId: "lane:2",
        attemptIds: [
          `calibration:v1:4:${inventory.attempts[4]!.attemptId}`,
          `calibration:v1:5:${inventory.attempts[5]!.attemptId}`,
        ],
      },
      {
        shardId: "calibration-shard:3",
        laneId: "lane:3",
        attemptIds: [
          `calibration:v1:6:${inventory.attempts[6]!.attemptId}`,
          `calibration:v1:7:${inventory.attempts[7]!.attemptId}`,
        ],
      },
    ])
    expect(V138ParallelCalibrationPolicySchema.parse(clone(policy))).toEqual(
      policy,
    )
    expect(Object.isFrozen(policy)).toBe(true)
  })

  it.each([
    ["inventory ID", (draft: any) => (draft.inventory.attempts[0].calibrationAttemptId += ":mutated")],
    ["inventory order", (draft: any) => draft.inventory.attempts.reverse()],
    ["inventory count", (draft: any) => draft.inventory.attempts.pop()],
    ["shard assignment", (draft: any) => (draft.inventory.attempts[0].shardId = "calibration-shard:1")],
    ["concurrency", (draft: any) => (draft.concurrency = 3)],
    ["denominator", (draft: any) => (draft.authoritativeAttemptDenominator = 539)],
    ["margin", (draft: any) => (draft.marginBasisPoints = 749)],
    ["fixed overhead", (draft: any) => (draft.fixedOverheadMilliseconds = 59_999)],
    ["projection source", (draft: any) => (draft.projectionSourceRoot = `sha256:${"0".repeat(64)}`)],
    ["aggregation rule", (draft: any) => (draft.aggregationRules.perChildRss = "last_sample")],
    ["rounding rule", (draft: any) => (draft.roundingRules.margin = "floor_integer_milliseconds")],
    ["comparator", (draft: any) => (draft.admissionComparator = "strict_less_than")],
    ["policy root", (draft: any) => (draft.policyRoot = `sha256:${"0".repeat(64)}`)],
  ])("matrix calibration policy rejects mutated %s", (_label, change) => {
    const policy = clone(
      deriveV138ParallelCalibrationPolicy(
        enumerateV138CurrentMatrix(repoRoot),
      ),
    ) as any
    change(policy)
    expect(() => V138ParallelCalibrationPolicySchema.parse(policy)).toThrow(
      "MATRIX_PARALLEL_CALIBRATION_POLICY_INVALID",
    )
  })

  it("matrix calibration policy uses exact integer projection and inclusive admission", () => {
    const policy = deriveV138ParallelCalibrationPolicy(
      enumerateV138CurrentMatrix(repoRoot),
    )
    const projection = projectV138ParallelMatrix(policy, {
      calibrationBatchWallMilliseconds: 10_001,
      childMaxRssKilobytes: [100, 200, 300, 400],
      aggregateChildRssKilobytes: 850,
      minimumHostHeadroomBasisPoints: 2_500,
    })

    expect(projection).toMatchObject({
      calibrationBatchWallMilliseconds: 10_001,
      baseProjectedMilliseconds: 675_068,
      marginMilliseconds: 50_631,
      projectedTotalMilliseconds: 785_699,
      admittedByTime: true,
    })
    expect(isV138ParallelProjectedTotalAdmitted(5_400_000)).toBe(true)
    expect(isV138ParallelProjectedTotalAdmitted(5_400_001)).toBe(false)
  })
})

describe("v1.38 matrix scheduler", () => {
  it("matrix scheduler preallocates stable four-attempt shards without changing requests", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const requestBytesBefore = inventory.attempts.map(({ request }) =>
      JSON.stringify(request),
    )
    const plan = planV138MatrixShards(inventory)

    expect(plan.schemaVersion).toBe("v1.38-parallel-matrix-plan-v1")
    expect(plan.maxConcurrentShards).toBe(4)
    expect(plan.shards).toHaveLength(135)
    expect(plan.shards.every(({ attemptIds }) => attemptIds.length === 4)).toBe(
      true,
    )
    expect(plan.shards.flatMap(({ attemptIds }) => attemptIds)).toEqual(
      inventory.attempts.map(({ attemptId }) => attemptId),
    )
    expect(new Set(plan.shards.map(({ shardId }) => shardId))).toHaveLength(135)
    expect(new Set(plan.shards.map(({ laneId }) => laneId))).toEqual(
      new Set(["lane:0", "lane:1", "lane:2", "lane:3"]),
    )
    expect(
      inventory.attempts.map(({ request }) => JSON.stringify(request)),
    ).toEqual(requestBytesBefore)
    expect(Object.isFrozen(plan)).toBe(true)
  })
})

describe("v1.38 matrix accounting", () => {
  const successTerminals = () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const plan = planV138MatrixShards(inventory)
    return {
      inventory,
      plan,
      terminals: plan.shards.map((shard) => ({
        shardId: shard.shardId,
        laneId: shard.laneId,
        classification: "success" as const,
        elapsedMilliseconds: 100,
        maxRssKilobytes: 200,
        cleanup: {
          gracefulTerminationSent: false,
          forceTerminationSent: false,
          exitAwaited: true,
          orphanProcessIds: [] as number[],
        },
        outcomes: [...shard.attemptIds].reverse().map((attemptId) => ({
          attemptId,
          classification: "success" as const,
          outcome: "draw" as const,
        })),
      })),
    }
  }

  it("matrix accounting is invariant to valid terminal completion order", () => {
    const { inventory, plan, terminals } = successTerminals()
    const forward = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals,
    })
    const reversed = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals: [...terminals].reverse(),
    })

    expect(reversed).toEqual(forward)
    expect(forward).toMatchObject({
      declaredAttemptCount: 540,
      launchedAttemptCount: 540,
      terminalAttemptCount: 540,
      successfulButUnacceptedCount: 540,
      failedAttemptCount: 0,
      cancelledAttemptCount: 0,
      unlaunchedAttemptCount: 0,
      acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false,
    })
    expect(forward.progressReceipts).toHaveLength(135)
    expect(
      forward.progressReceipts.every(
        ({ acceptedCellsPublished }) => acceptedCellsPublished === 0,
      ),
    ).toBe(true)
  })

  it.each([
    ["missing", (rows: any[]) => rows.slice(1)],
    ["duplicate", (rows: any[]) => [...rows, rows[0]]],
    ["conflicting", (rows: any[]) => [
      ...rows,
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            classification: "system_failure",
            code: "CONFLICT",
            retryable: false,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
    ]],
    ["unknown", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          { ...rows[0].outcomes[0], attemptId: "matrix:unknown" },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["calibration alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `calibration:v1:0:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["prior partial alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `prior-partial:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
    ["retry alias", (rows: any[]) => [
      {
        ...rows[0],
        outcomes: [
          {
            ...rows[0].outcomes[0],
            attemptId: `retry:1:${rows[0].outcomes[0].attemptId}`,
          },
          ...rows[0].outcomes.slice(1),
        ],
      },
      ...rows.slice(1),
    ]],
  ])("matrix accounting rejects %s terminal identities", (_label, change) => {
    const { inventory, plan, terminals } = successTerminals()
    expect(() =>
      reduceV138ParallelMatrixAccounting({
        inventory,
        plan,
        terminals: change(clone(terminals)),
      }),
    ).toThrow("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  })

  it("matrix accounting charges every failure class and publishes no partial evidence", () => {
    const { inventory, plan, terminals } = successTerminals()
    const mutated = clone(terminals)
    mutated[0] = {
      ...mutated[0]!,
      classification: "failed",
      outcomes: [
        {
          attemptId: mutated[0]!.outcomes[0]!.attemptId,
          classification: "player_violation",
          code: "INVALID_OUTPUT",
        },
        {
          attemptId: mutated[0]!.outcomes[1]!.attemptId,
          classification: "system_failure",
          code: "EXECUTION_EXCEPTION",
          retryable: true,
        },
        {
          attemptId: mutated[0]!.outcomes[2]!.attemptId,
          classification: "timeout",
          code: "RESOURCE_POLICY_SHARD_TIMEOUT",
        },
        {
          attemptId: mutated[0]!.outcomes[3]!.attemptId,
          classification: "cancelled",
          code: "CANCELLED_AFTER_HARD_FAILURE",
        },
      ],
    }
    const accounting = reduceV138ParallelMatrixAccounting({
      inventory,
      plan,
      terminals: mutated,
    })

    expect(accounting).toMatchObject({
      successfulButUnacceptedCount: 536,
      failedAttemptCount: 3,
      cancelledAttemptCount: 1,
      acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false,
    })
    expect(accounting.acceptedCellLedgerRoot).toBe(
      "sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    )
  })

  it("matrix accounting rejects reordered or mutated allocation plans", () => {
    const { inventory, plan, terminals } = successTerminals()
    const mutatedPlan = clone(plan)
    mutatedPlan.shards.reverse()

    expect(() =>
      reduceV138ParallelMatrixAccounting({
        inventory,
        plan: mutatedPlan,
        terminals,
      }),
    ).toThrow("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  })
})

const successfulInjectedRunner = (input?: {
  childRssKilobytes?: number
  childRssByOrdinal?: readonly number[]
  aggregateSamples?: readonly number[]
  hostHeadroomBasisPoints?: number
  elapsedMilliseconds?: number
  onLaunch?: ((active: number) => void) | undefined
  onExit?: ((active: number) => void) | undefined
}): V138ParallelShardRunner => {
  let active = 0
  return {
    async run(shard, control) {
      control.onLaunch({
        event: "child_launched",
        shardId: shard.shardId,
        laneId: shard.laneId,
        executionAttemptIds: shard.attempts.map(
          ({ executionAttemptId }) => executionAttemptId,
        ),
      })
      const childRssKilobytes =
        input?.childRssByOrdinal?.[shard.ordinal] ??
        input?.childRssKilobytes ??
        100
      active += 1
      input?.onLaunch?.(active)
      await Promise.resolve()
      control.onResourceSample({
        childId: `child:${shard.shardId}`,
        childRssKilobytes,
        hostTotalMemoryKilobytes: 10_000,
        hostFreeMemoryKilobytes: Math.floor(
          ((input?.hostHeadroomBasisPoints ?? 5_000) * 10_000) / 10_000,
        ),
      })
      for (const sample of input?.aggregateSamples ?? []) {
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: sample,
          hostTotalMemoryKilobytes: 10_000,
          hostFreeMemoryKilobytes: Math.floor(
            ((input?.hostHeadroomBasisPoints ?? 5_000) * 10_000) / 10_000,
          ),
        })
      }
      await Promise.resolve()
      const cancelled = control.signal.aborted
      active -= 1
      input?.onExit?.(active)
      return {
        shardId: shard.shardId,
        laneId: shard.laneId,
        classification: cancelled ? ("cancelled" as const) : ("success" as const),
        elapsedMilliseconds: input?.elapsedMilliseconds ?? 100,
        maxRssKilobytes: childRssKilobytes,
        cleanup: {
          gracefulTerminationSent: cancelled,
          forceTerminationSent: false,
          exitAwaited: true,
          orphanProcessIds: [],
        },
        outcomes: shard.attempts.map(({ executionAttemptId }) =>
          cancelled
            ? {
                attemptId: executionAttemptId,
                classification: "cancelled" as const,
                code: "CANCELLED_AFTER_HARD_FAILURE",
              }
            : {
                attemptId: executionAttemptId,
                classification: "success" as const,
                outcome: "draw" as const,
              },
        ),
      }
    },
  }
}

const admittedInjectedHeadroom = async () =>
  parseMemoryPressureQ({
    stdout: Buffer.from(
      "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
    ),
    stderr: Buffer.alloc(0),
    exitCode: 0,
    signal: null,
    timedOut: false,
  })

const admittedInjectedCalibration = (
  inventory: ReturnType<typeof enumerateV138CurrentMatrix>,
) =>
  calibrateV138ParallelMatrix({
    inventory,
    policy: deriveV138ParallelCalibrationPolicy(inventory),
    runner: successfulInjectedRunner(),
    hardwareIdentity: {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    },
  })

describe("v1.38 plan 262-18 attempt identity and CLI dispatch", () => {
  it("derives stable public identities with full scheduler identities and inventory-owned shards", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const mappings = deriveV138CalibrationAttemptMappings(inventory, "v6")

    expect(mappings.map(({ publicAttemptId }) => publicAttemptId)).toEqual(
      Array.from({ length: 8 }, (_, index) => `calibration:v6:${index}`),
    )
    expect(mappings.map(({ shardId }) => shardId)).toEqual([
      "calibration-shard:0",
      "calibration-shard:0",
      "calibration-shard:1",
      "calibration-shard:1",
      "calibration-shard:2",
      "calibration-shard:2",
      "calibration-shard:3",
      "calibration-shard:3",
    ])
    expect(new Set(mappings.map(({ executionAttemptId }) => executionAttemptId)).size)
      .toBe(8)
    for (const [index, mapping] of mappings.entries()) {
      expect(mapping).toMatchObject({
        inventoryOrdinal: index,
        templateAttemptId: inventory.attempts[index]!.attemptId,
      })
      expect(mapping.executionAttemptId).toBe(
        `${mapping.publicAttemptId}:${mapping.templateAttemptId}`,
      )
      expect(Object.isFrozen(mapping)).toBe(true)
    }
  })

  it("joins each full scheduler identity exactly once and copies inventory shard ownership", () => {
    const mappings = deriveV138CalibrationAttemptMappings(
      enumerateV138CurrentMatrix(repoRoot),
      "v6",
    )
    const terminals = Array.from({ length: 4 }, (_, shardOrdinal) => ({
      shardId: `calibration-shard:${shardOrdinal}`,
      laneId: `lane:${shardOrdinal}`,
      classification: "success" as const,
      elapsedMilliseconds: 1,
      maxRssKilobytes: 1,
      cleanup: {
        gracefulTerminationSent: false,
        forceTerminationSent: false,
        exitAwaited: true,
        orphanProcessIds: [],
      },
      outcomes: mappings
        .filter(({ shardId }) => shardId === `calibration-shard:${shardOrdinal}`)
        .map(({ executionAttemptId }) => ({
          attemptId: executionAttemptId,
          classification: "success" as const,
          outcome: "draw" as const,
        })),
    }))

    const launchEvents = terminals.map((terminal) => ({
      event: "child_launched" as const,
      shardId: terminal.shardId,
      laneId: terminal.laneId,
      executionAttemptIds: terminal.outcomes.map(({ attemptId }) => attemptId),
    }))
    const projected = mapV138CalibrationTerminalOutcomes({
      mappings,
      terminals,
      launchEvents,
    })
    expect(projected).toHaveLength(8)
    expect(projected.every(({ childLaunched }) => childLaunched)).toBe(true)
    expect(projected.every(({ terminalObserved }) => terminalObserved)).toBe(true)
    expect(projected.map(({ shardId }) => shardId)).toEqual(
      mappings.map(({ shardId }) => shardId),
    )

    const duplicated = structuredClone(terminals)
    duplicated[0]!.outcomes.push(duplicated[0]!.outcomes[0]!)
    expect(() =>
      mapV138CalibrationTerminalOutcomes({ mappings, terminals: duplicated }),
    ).toThrow("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")

    const missing = structuredClone(terminals)
    missing[0]!.outcomes.pop()
    expect(() =>
      mapV138CalibrationTerminalOutcomes({ mappings, terminals: missing }),
    ).toThrow("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")

    const foreign = structuredClone(terminals)
    foreign[0]!.outcomes[0]!.attemptId = "calibration:v6:foreign"
    expect(() =>
      mapV138CalibrationTerminalOutcomes({ mappings, terminals: foreign }),
    ).toThrow("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")

    const wrongShard = structuredClone(terminals)
    wrongShard[0]!.shardId = "calibration-shard:3"
    expect(() =>
      mapV138CalibrationTerminalOutcomes({ mappings, terminals: wrongShard }),
    ).toThrow("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")

    for (const invalidTerminals of [
      terminals.slice(0, 3),
      [...terminals, {
        ...terminals[0]!,
        shardId: "calibration-shard:foreign",
        laneId: "lane:foreign",
        outcomes: [],
      }],
      [
        terminals[0]!,
        { ...terminals[1]!, shardId: terminals[0]!.shardId },
        terminals[2]!,
        terminals[3]!,
      ],
      [...terminals, { ...terminals[0]!, outcomes: [] }],
    ]) {
      expect(() =>
        mapV138CalibrationTerminalOutcomes({
          mappings,
          terminals: invalidTerminals,
          launchEvents,
        }),
      ).toThrow("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
    }
  })

  it("builds admitted and stopped v6 receipts from exact injected terminal mappings", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const identity = {
      sourceB2: "1".repeat(40),
      sourceB2CustodyRoot: `sha256:${"2".repeat(64)}` as const,
      executionContextRoot: `sha256:${"3".repeat(64)}` as const,
      preflightRoot: `sha256:${"4".repeat(64)}` as const,
    }
    const hardwareIdentity = {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    }
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity,
      executionIdentityVersion: "v6",
      sharedHeadroomObserver: admittedInjectedHeadroom,
    })
    const admitted = buildV138ParallelCalibrationV6Receipt({
      inventory,
      ...identity,
      preflightDisposition: "preflight_admitted",
      calibration,
    })
    expect(admitted).toMatchObject({
      status: "admitted",
      chargedAttemptCount: 8,
      childLaunchCount: 8,
      terminalOutcomeCount: 8,
      acceptedCellCount: 8,
      publicStopReason: null,
      noRetry: true,
      partialAcceptedEvidenceReusable: false,
    })
    expect(admitted.supervisedCalibration).not.toBeNull()
    expect(
      checkV138ParallelCalibrationV6Receipt(inventory, structuredClone(admitted)),
    ).toEqual(admitted)

    const stoppedCalibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: {
        async run(shard, control) {
          control.onLaunch({
            event: "child_launched",
            shardId: shard.shardId,
            laneId: shard.laneId,
            executionAttemptIds: shard.attempts.map(
              ({ executionAttemptId }) => executionAttemptId,
            ),
          })
          return {
            shardId: shard.shardId,
            laneId: shard.laneId,
            classification: "failed",
            elapsedMilliseconds: 1,
            maxRssKilobytes: 1,
            cleanup: {
              gracefulTerminationSent: false,
              forceTerminationSent: false,
              exitAwaited: true,
              orphanProcessIds: [],
            },
            outcomes: shard.attempts.map(({ executionAttemptId }) => ({
              attemptId: executionAttemptId,
              classification: "system_failure" as const,
              code: "INJECTED_SYSTEM_FAILURE",
              retryable: false,
            })),
          }
        },
      },
      hardwareIdentity,
      executionIdentityVersion: "v6",
      sharedHeadroomObserver: admittedInjectedHeadroom,
    })
    const stopped = buildV138ParallelCalibrationV6Receipt({
      inventory,
      ...identity,
      preflightDisposition: "preflight_admitted",
      calibration: stoppedCalibration,
    })
    expect(stopped).toMatchObject({
      status: "stopped_process_failure",
      childLaunchCount: 8,
      terminalOutcomeCount: 8,
      acceptedCellCount: 0,
      publicStopReason: "SHARD_EXECUTION_FAILED",
      noRetry: true,
    })
    expect(
      stopped.chargedAttempts.every(
        (attempt) => attempt.state === "terminal_system_failure",
      ),
    ).toBe(true)

    const preflightStopped = buildV138ParallelCalibrationV6Receipt({
      inventory,
      ...identity,
      preflightDisposition: "preflight_refused",
    })
    expect(preflightStopped).toMatchObject({
      status: "preflight_refused",
      childLaunchCount: 0,
      terminalOutcomeCount: 0,
      acceptedCellCount: 0,
      supervisedCalibration: null,
    })
    expect(
      preflightStopped.chargedAttempts.every(
        (attempt) => attempt.state === "not_launched_preflight_refused",
      ),
    ).toBe(true)
  })

  it("derives v6 launch counts only from typed launch events and rejects shared-tick drift", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const hardwareIdentity = {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    }
    const identity = {
      sourceB2: "1".repeat(40),
      sourceB2CustodyRoot: `sha256:${"2".repeat(64)}` as const,
      executionContextRoot: `sha256:${"3".repeat(64)}` as const,
      preflightRoot: `sha256:${"4".repeat(64)}` as const,
    }
    for (const [emitLaunch, expectedLaunchCount] of [
      [false, 0],
      [true, 8],
    ] as const) {
      const supervised = await calibrateV138ParallelMatrix({
        inventory,
        runner: {
          async run(shard, control) {
            if (emitLaunch) {
              control.onLaunch({
                event: "child_launched",
                shardId: shard.shardId,
                laneId: shard.laneId,
                executionAttemptIds: shard.attempts.map(
                  ({ executionAttemptId }) => executionAttemptId,
                ),
              })
            }
            throw new Error("injected runner failure")
          },
        },
        hardwareIdentity,
        sharedHeadroomObserver: admittedInjectedHeadroom,
        executionIdentityVersion: "v6",
      })
      const receipt = buildV138ParallelCalibrationV6Receipt({
        inventory,
        ...identity,
        preflightDisposition: "preflight_admitted",
        calibration: supervised,
      })
      expect(receipt).toMatchObject({
        status: "stopped_process_failure",
        childLaunchCount: expectedLaunchCount,
        terminalOutcomeCount: 8,
        acceptedCellCount: 0,
      })
      expect(
        receipt.chargedAttempts.every(
          ({ childLaunched }) => childLaunched === emitLaunch,
        ),
      ).toBe(true)
    }

    const supervised = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity,
      sharedHeadroomObserver: admittedInjectedHeadroom,
      executionIdentityVersion: "v6",
    })
    const drifted = clone(supervised)
    drifted.sharedObservationTicks![0]!.fanout[0]!.observationRoot =
      `sha256:${"f".repeat(64)}`
    const { calibrationRoot: _oldRoot, ...body } = drifted
    drifted.calibrationRoot =
      `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`
    expect(() =>
      buildV138ParallelCalibrationV6Receipt({
        inventory,
        ...identity,
        preflightDisposition: "preflight_admitted",
        calibration: drifted,
      }),
    ).toThrow("MATRIX_CALIBRATION_RECEIPT_INVALID")
  })

  it.each([
    ["--execute-shard", 1, 0, "shard"],
    ["--check-calibration-receipt", 0, 1, "receipt"],
    ["--write-execution-context-v6-receipt", 0, 1, "receipt"],
    ["--write-headroom-preflight-v6-receipt", 0, 1, "receipt"],
    ["--calibrate-parallel-v6-receipt", 0, 1, "receipt"],
    ["--write-authoritative-v7-receipt", 0, 1, "receipt"],
    ["--write-plan-262-19-terminal-v2", 0, 1, "receipt"],
    ["--check-plan-262-19-terminal-v2", 0, 1, "receipt"],
  ] as const)(
    "CLI dispatch gives %s exactly one handler owner",
    async (command, expectedShardCalls, expectedReceiptCalls, expectedResult) => {
      let shardCalls = 0
      let receiptCalls = 0
      const result = await dispatchV138CurrentMatrixDirectEntry(command, {
        runShard: async () => {
          shardCalls += 1
          return "shard"
        },
        runReceipt: async () => {
          receiptCalls += 1
          return "receipt"
        },
      })

      expect(result).toBe(expectedResult)
      expect(shardCalls).toBe(expectedShardCalls)
      expect(receiptCalls).toBe(expectedReceiptCalls)
    },
  )

  it.each([undefined, "", "--unknown", "--execute-shard-again"])(
    "CLI dispatch rejects unknown command %j before either handler",
    async (command) => {
      let shardCalls = 0
      let receiptCalls = 0
      await expect(
        dispatchV138CurrentMatrixDirectEntry(command, {
          runShard: async () => {
            shardCalls += 1
          },
          runReceipt: async () => {
            receiptCalls += 1
          },
        }),
      ).rejects.toThrow("MATRIX_RECEIPT_CLI_COMMAND_INVALID")
      expect(shardCalls).toBe(0)
      expect(receiptCalls).toBe(0)
    },
  )
})

describe("v1.38 plan 262-18 authorization v2 and seal v2", () => {
  const prepare = () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-262-18-seal-v2-"))
    const sourceA2 = currentPlan26218SourceA2()
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, root])
    execFileSync("git", ["checkout", "--quiet", sourceA2], { cwd: root })
    execFileSync("git", ["config", "user.name", "plan 262-18 test"], {
      cwd: root,
    })
    execFileSync("git", ["config", "user.email", "plan-262-18@test.invalid"], {
      cwd: root,
    })
    mkdirSync(
      path.dirname(
        path.resolve(root, V138_PLAN_262_18_CANONICAL_PATHS.review),
      ),
      { recursive: true },
    )
    writeFileSync(
      path.resolve(root, V138_PLAN_262_18_CANONICAL_PATHS.review),
      cleanPlan26218Review(sourceA2),
    )
    const literal = Buffer.from(
      v138Plan26218AuthorizationLiteral(root, sourceA2),
      "utf8",
    )
    return { root, sourceA2, literal }
  }

  const branchInput = (
    root: string,
    sourceA2: string,
    sourceB2?: string,
  ) => ({
    repoRoot: root,
    authorizationPath: V138_PLAN_262_18_CANONICAL_PATHS.authorization,
    sealPath: V138_PLAN_262_18_CANONICAL_PATHS.seal,
    terminalPath: V138_PLAN_262_18_CANONICAL_PATHS.terminal,
    reviewPath: V138_PLAN_262_18_CANONICAL_PATHS.review,
    reviewFixPath: V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
    oldAuthorizationPath: V138_PLAN_262_18_CANONICAL_PATHS.oldAuthorization,
    oldSealPath: V138_PLAN_262_18_CANONICAL_PATHS.oldSeal,
    oldContextPath: V138_PLAN_262_18_CANONICAL_PATHS.oldContext,
    oldPreflightPath: V138_PLAN_262_18_CANONICAL_PATHS.oldPreflight,
    oldCalibrationPath: V138_PLAN_262_18_CANONICAL_PATHS.oldCalibration,
    oldTerminalPath: V138_PLAN_262_18_CANONICAL_PATHS.oldTerminal,
    sourceA2,
    ...(sourceB2 === undefined ? {} : { sourceB2 }),
  })

  const terminal = (
    sourceA2: string,
    disposition: "seal_refused" | "seal_failed",
  ) => {
    const body = {
      schemaVersion: V138_PLAN_262_18_TERMINAL_SCHEMA,
      disposition,
      sourceA2,
      authorityExpired: true as const,
      acceptedCellCount: 0 as const,
    }
    return {
      ...body,
      terminalRoot: v138SuccessorRoot(
        "canonicalJsonProfile",
        body.schemaVersion,
        body,
      ),
    }
  }

  it("rejects symlinked or replaced canonical parent chains before any leaf creation", () => {
    const root = mkdtempSync(path.join(tmpdir(), "cowards-262-18-parent-chain-"))
    const target = path.resolve(
      root,
      ".planning/artifacts/v1.38-plan-262-18-authorization-v2.json",
    )
    try {
      mkdirSync(path.resolve(root, "planning-real/artifacts"), {
        recursive: true,
      })
      symlinkSync("planning-real", path.resolve(root, ".planning"), "dir")
      expect(() =>
        validateV138CanonicalParentChain(root, target),
      ).toThrow("V138_CANONICAL_PARENT_CHAIN_INVALID")
      expect(existsSync(target)).toBe(false)

      unlinkSync(path.resolve(root, ".planning"))
      mkdirSync(path.dirname(target), { recursive: true })
      const chain = validateV138CanonicalParentChain(root, target)
      rmSync(path.dirname(target), { recursive: true, force: true })
      mkdirSync(path.dirname(target), { recursive: true })
      expect(() => checkV138CanonicalParentChain(chain)).toThrow(
        "V138_CANONICAL_PARENT_CHAIN_REPLACED",
      )
      expect(existsSync(target)).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it("binds exact authorization keys, reviewed source, protected history, fresh targets, and selected-route closure", () => {
    const { root, sourceA2, literal } = prepare()
    try {
      const reviewed = checkV138ReviewedSourceA2({
        repoRoot: root,
        repairStartHead2: V138_PLAN_262_18_REPAIR_START,
        sourceBase2: V138_PLAN_262_18_SOURCE_BASE,
        sourceA2,
        reviewPath: V138_PLAN_262_18_CANONICAL_PATHS.review,
        reviewFixPath: V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
      })
      expect(reviewed).toMatchObject({
        repairStartHead2: V138_PLAN_262_18_REPAIR_START,
        sourceBase2: V138_PLAN_262_18_SOURCE_BASE,
        sourceA2,
      })
      const reviewPath = path.resolve(
        root,
        V138_PLAN_262_18_CANONICAL_PATHS.review,
      )
      const cleanReview = cleanPlan26218Review(sourceA2)
      for (const invalidReview of [
        cleanReview.replace("depth: deep\n", ""),
        cleanReview.replace(
          "scripts/lib/v1-38-current-matrix-reproduction.ts",
          "scripts/lib/v1-38-foundation-admission.ts",
        ),
        cleanReview.replace("  info: 0", "  info: 1"),
        cleanReview.replace("  total: 0", "  total: 1"),
        cleanReview.replace("fixes_applied: false\n", ""),
      ]) {
        writeFileSync(reviewPath, invalidReview)
        expect(() =>
          checkV138ReviewedSourceA2({
            repoRoot: root,
            repairStartHead2: V138_PLAN_262_18_REPAIR_START,
            sourceBase2: V138_PLAN_262_18_SOURCE_BASE,
            sourceA2,
            reviewPath: V138_PLAN_262_18_CANONICAL_PATHS.review,
            reviewFixPath: V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
          }),
        ).toThrow("V138_PLAN_262_18_REVIEW_NOT_CLEAN")
      }
      writeFileSync(reviewPath, cleanReview)

      const history = deriveV138ProtectedHistoryV2(root, sourceA2)
      expect(history).toMatchObject({
        predecessorSourceA: "61d1c470e9a77ffa1f70538cb0c5173f6a792bfa",
        predecessorSourceB: "1bfb413192f113ac7949cde676d7b55aea77f4fe",
        predecessorRoots: {
          authorizationRoot:
            "sha256:870e317f662d5f869c39c0257dd8e702dd0c8f3c30316bc8fd4c9c0534cc6a00",
          contextRoot:
            "sha256:4a3006c0cd389011f6d7676668bed4cd2b2655958a6dd34901bd79db52dafa2c",
          preflightRoot:
            "sha256:8b949daede99588f5f3d6bd4cb78147bc19cc3a3d1dc0998ac7308b6fccbdde8",
          calibrationRoot:
            "sha256:3c37ae3ef54318de78d2a014bd26b5574ad0bdc530bcccf60456ef70481c1d44",
          terminalRoot:
            "sha256:9fa253ddd5ee40d0ef464706172b99425f7ee2dfafd2fe071845daa9bc0a824c",
        },
        chargedPublicAttemptIds: Array.from(
          { length: 8 },
          (_, index) => `calibration:v5:${index}`,
        ),
        acceptedEvidenceCount: 0,
        oldReproductionV6Absent: true,
      })

      const authorization = buildV138Plan26218AuthorizationV2(
        root,
        sourceA2,
        literal,
      )
      expect(checkV138Plan26218AuthorizationV2(root, clone(authorization))).toEqual(
        authorization,
      )
      for (const mutation of [
        (value: Record<string, unknown>) => {
          value.unexpected = true
        },
        (value: Record<string, unknown>) => {
          delete value.noRetry
        },
      ]) {
        const mutated = clone(authorization) as unknown as Record<string, unknown>
        mutation(mutated)
        expect(() =>
          checkV138Plan26218AuthorizationV2(root, mutated),
        ).toThrow("V138_PLAN_262_18_AUTHORIZATION_SCHEMA_INVALID")
      }
      for (const rejectedLiteral of [
        Buffer.from(literal.toString("utf8").replace(sourceA2, "0".repeat(40))),
        Buffer.from(v138Plan26215AuthorizationLiteral(sourceA2), "utf8"),
      ]) {
        expect(() =>
          buildV138Plan26218AuthorizationV2(
            root,
            sourceA2,
            rejectedLiteral,
          ),
        ).toThrow("V138_PLAN_262_18_AUTHORIZATION_LITERAL_INVALID")
      }

      for (const overrides of [
        { repairStartHead2: "0".repeat(40) },
        { sourceBase2: "0".repeat(40) },
        { sourceA2: "0".repeat(40) },
      ]) {
        writeFileSync(
          reviewPath,
          cleanPlan26218Review(sourceA2, overrides),
        )
        expect(() =>
          checkV138ReviewedSourceA2({
            repoRoot: root,
            repairStartHead2: V138_PLAN_262_18_REPAIR_START,
            sourceBase2: V138_PLAN_262_18_SOURCE_BASE,
            sourceA2,
            reviewPath: V138_PLAN_262_18_CANONICAL_PATHS.review,
            reviewFixPath: V138_PLAN_262_18_CANONICAL_PATHS.reviewFix,
          }),
        ).toThrow("V138_PLAN_262_18_REVIEW_SOURCE_JOIN_INVALID")
      }
      writeFileSync(reviewPath, cleanPlan26218Review(sourceA2))

      const freshTarget = path.resolve(
        root,
        V138_PLAN_262_19_FRESH_DESTINATIONS[0],
      )
      mkdirSync(path.dirname(freshTarget), { recursive: true })
      for (const occupy of [
        () => writeFileSync(freshTarget, "{}\n"),
        () => symlinkSync("missing-target", freshTarget),
        () => mkdirSync(freshTarget),
      ]) {
        occupy()
        expect(() =>
          buildV138Plan26218AuthorizationV2(root, sourceA2, literal),
        ).toThrow()
        rmSync(freshTarget, { recursive: true, force: true })
      }

      writeFileSync(
        path.resolve(root, V138_PLAN_262_18_CANONICAL_PATHS.authorization),
        canonicalManifest(authorization),
      )
      const seal = buildV138SuccessorSourceSealV2({
        repoRoot: root,
        authorization,
      })
      expect(
        checkSelectedRouteClosureAtCommit(
          root,
          sourceA2,
          seal.selectedRouteClosure,
        ),
      ).toEqual(seal.selectedRouteClosure)
      expect(
        checkV138SuccessorSourceSealV2(root, clone(seal), authorization),
      ).toEqual(seal)
      const wrongClosure = clone(seal)
      wrongClosure.selectedRouteClosure.closureRoot =
        `sha256:${"0".repeat(64)}`
      expect(() =>
        checkV138SuccessorSourceSealV2(root, wrongClosure, authorization),
      ).toThrow("V138_SUCCESSOR_SEAL_V2_INVALID")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 180_000)

  it("enforces sealed/refused/failed presence and rejects invalid B2 parent, delta, and working blobs", () => {
    const { root, sourceA2, literal } = prepare()
    const authorizationPath =
      V138_PLAN_262_18_CANONICAL_PATHS.authorization
    const sealPath = V138_PLAN_262_18_CANONICAL_PATHS.seal
    const terminalPath = V138_PLAN_262_18_CANONICAL_PATHS.terminal
    try {
      const authorization = buildV138Plan26218AuthorizationV2(
        root,
        sourceA2,
        literal,
      )
      const authorizationBytes = canonicalManifest(authorization)
      writeFileSync(path.resolve(root, authorizationPath), authorizationBytes)
      const seal = buildV138SuccessorSourceSealV2({
        repoRoot: root,
        authorization,
      })
      const sealBytes = canonicalManifest(seal)
      writeFileSync(path.resolve(root, sealPath), sealBytes)
      execFileSync("git", ["add", authorizationPath, sealPath], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "test: source B2"], {
        cwd: root,
      })
      const validB2 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(
        checkV138SuccessorSealCommitV2({
          repoRoot: root,
          sourceA2,
          sourceB2: validB2,
        }),
      ).toMatchObject({
        sourceA2,
        sourceB2: validB2,
        sourceB2Parent: sourceA2,
        changedPaths: [authorizationPath, sealPath],
      })
      expect(
        checkV138Plan26218ArtifactBranch(
          branchInput(root, sourceA2, validB2),
        ),
      ).toBe("sealed")

      writeFileSync(path.resolve(root, sealPath), "{}\n")
      expect(() =>
        checkV138SuccessorSealCommitV2({
          repoRoot: root,
          sourceA2,
          sourceB2: validB2,
        }),
      ).toThrow("V138_SUCCESSOR_SEAL_B2_WORKTREE_DRIFT")

      const resetA2 = () => {
        execFileSync("git", ["reset", "--hard", sourceA2], {
          cwd: root,
          stdio: "ignore",
        })
        rmSync(path.resolve(root, terminalPath), { force: true })
      }
      resetA2()
      writeFileSync(
        path.resolve(root, terminalPath),
        canonicalManifest(terminal(sourceA2, "seal_refused")),
      )
      expect(checkV138Plan26218ArtifactBranch(branchInput(root, sourceA2))).toBe(
        "seal_refused",
      )
      writeFileSync(path.resolve(root, authorizationPath), authorizationBytes)
      expect(() =>
        checkV138Plan26218ArtifactBranch(branchInput(root, sourceA2)),
      ).toThrow()

      resetA2()
      writeFileSync(path.resolve(root, authorizationPath), authorizationBytes)
      writeFileSync(
        path.resolve(root, terminalPath),
        canonicalManifest(terminal(sourceA2, "seal_failed")),
      )
      expect(checkV138Plan26218ArtifactBranch(branchInput(root, sourceA2))).toBe(
        "seal_failed",
      )
      unlinkSync(path.resolve(root, authorizationPath))
      expect(() =>
        checkV138Plan26218ArtifactBranch(branchInput(root, sourceA2)),
      ).toThrow()

      resetA2()
      writeFileSync(path.resolve(root, authorizationPath), authorizationBytes)
      writeFileSync(path.resolve(root, sealPath), sealBytes)
      const extraPath = ".planning/artifacts/v1.38-source-b2-extra.json"
      writeFileSync(path.resolve(root, extraPath), "{}\n")
      execFileSync("git", ["add", authorizationPath, sealPath, extraPath], {
        cwd: root,
      })
      execFileSync("git", ["commit", "--quiet", "-m", "test: extra B2 path"], {
        cwd: root,
      })
      const extraB2 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(() =>
        checkV138SuccessorSealCommitV2({
          repoRoot: root,
          sourceA2,
          sourceB2: extraB2,
        }),
      ).toThrow("V138_SUCCESSOR_SEAL_B2_DELTA_INVALID")

      execFileSync("git", ["checkout", "--quiet", `${sourceA2}^`], {
        cwd: root,
      })
      writeFileSync(path.resolve(root, authorizationPath), authorizationBytes)
      writeFileSync(path.resolve(root, sealPath), sealBytes)
      execFileSync("git", ["add", authorizationPath, sealPath], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "test: wrong-parent B2"], {
        cwd: root,
      })
      const wrongParentB2 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      expect(() =>
        checkV138SuccessorSealCommitV2({
          repoRoot: root,
          sourceA2,
          sourceB2: wrongParentB2,
        }),
      ).toThrow("V138_SUCCESSOR_SEAL_B2_PARENT_INVALID")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 300_000)

  it("builds the injected Plan 262-19 passed route with exact A2/B2 joins and terminal expiry", async () => {
    const { root, sourceA2, literal } = prepare()
    const authorizationPath =
      V138_PLAN_262_18_CANONICAL_PATHS.authorization
    const sealPath = V138_PLAN_262_18_CANONICAL_PATHS.seal
    try {
      const authorization = buildV138Plan26218AuthorizationV2(
        root,
        sourceA2,
        literal,
      )
      writeFileSync(
        path.resolve(root, authorizationPath),
        canonicalManifest(authorization),
      )
      const seal = buildV138SuccessorSourceSealV2({
        repoRoot: root,
        authorization,
      })
      writeFileSync(path.resolve(root, sealPath), canonicalManifest(seal))
      execFileSync("git", ["add", authorizationPath, sealPath], { cwd: root })
      execFileSync("git", ["commit", "--quiet", "-m", "test: source B2"], {
        cwd: root,
      })
      const sourceB2 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim()
      const sourceB2Custody = checkV138SuccessorSealCommitV2({
        repoRoot: root,
        sourceA2,
        sourceB2,
      })
      const context = buildV138ExecutionContextV6Receipt({
        repoRoot: root,
        authorization,
        seal,
        sourceB2Custody,
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        terminalAgentRegistry: {
          schemaVersion: "v1.38-plan-262-19-terminal-agent-registry-v2",
          activeExecutorCount: 0,
          agents: [{ id: "test:terminal", status: "completed" }],
        },
      })
      expect(
        checkV138ExecutionContextV6Receipt(clone(context), {
          repoRoot: root,
          authorization,
          seal,
          sourceB2Custody,
        }),
      ).toEqual(context)
      const preflight = buildV138HostHeadroomPreflightV6Receipt({
        result: await admittedInjectedHeadroom(),
        executionContext: context,
      })
      expect(
        checkV138HostHeadroomPreflightV6Receipt(clone(preflight), context),
      ).toEqual(preflight)

      const inventory = enumerateV138CurrentMatrix(root)
      const supervised = await calibrateV138ParallelMatrix({
        inventory,
        runner: successfulInjectedRunner(),
        sharedHeadroomObserver: admittedInjectedHeadroom,
        hardwareIdentity: {
          operatingSystem: "test-os",
          architecture: "test-arch",
          nodeVersion: "test-node",
          cpuIdentity: "test-cpu",
        },
        executionIdentityVersion: "v6",
      })
      const calibration = buildV138ParallelCalibrationV6Receipt({
        inventory,
        sourceB2,
        sourceB2CustodyRoot: context.sourceB2CustodyRoot,
        executionContextRoot: context.receiptRoot,
        preflightRoot: preflight.receiptRoot,
        preflightDisposition: "preflight_admitted",
        calibration: supervised,
      })
      const execution = await executeV138ParallelMatrix({
        inventory,
        calibration: supervised,
        runner: {
          async run(shard, control) {
            control.onLaunch({
              event: "child_launched",
              shardId: shard.shardId,
              laneId: shard.laneId,
              executionAttemptIds: shard.attempts.map(
                ({ executionAttemptId }) => executionAttemptId,
              ),
            })
            return {
              shardId: shard.shardId,
              laneId: shard.laneId,
              classification: "failed",
              elapsedMilliseconds: 1,
              maxRssKilobytes: 1,
              cleanup: {
                gracefulTerminationSent: false,
                forceTerminationSent: false,
                exitAwaited: true,
                orphanProcessIds: [],
              },
              outcomes: shard.attempts.map(({ executionAttemptId }) => ({
                attemptId: executionAttemptId,
                classification: "system_failure" as const,
                code: "INJECTED_REPRODUCTION_FAILURE",
                retryable: false,
              })),
            }
          },
        },
        executionIdentityVersion: "v6",
      })
      const reproduction = buildV138AuthoritativeMatrixV7Receipt({
        repoRoot: root,
        executionContext: context,
        preflight,
        calibration,
        execution,
      })
      expect(reproduction).toMatchObject({
        status: "stopped_process_failure",
        chargedAttemptCount: 540,
        acceptedCellCount: 0,
        completeCleanup: true,
        partialAcceptedEvidenceReusable: false,
        noRetry: true,
      })
      expect(
        checkV138AuthoritativeMatrixV7Receipt(clone(reproduction), {
          repoRoot: root,
          executionContext: context,
          preflight,
          calibration,
        }),
      ).toEqual(reproduction)
      const terminal = buildV138Plan26219TerminalV2({
        disposition: "reproduction_stopped",
        authorization,
        seal,
        sourceA2,
        sourceB2,
        context,
        preflight,
        calibration,
        reproduction,
      })
      expect(checkV138Plan26219TerminalV2(clone(terminal))).toEqual(terminal)
      expect(terminal).toMatchObject({
        chargedCalibrationAttemptCount: 8,
        chargedReproductionAttemptCount: 540,
        acceptedCellCount: 0,
        completeCleanup: true,
        authorityExpired: true,
        noRetry: true,
      })
      expect(
        buildV138Plan26219TerminalV2({
          disposition: "tool_identity_failed",
          authorization,
          seal,
          sourceA2,
          sourceB2,
        }),
      ).toMatchObject({
        executionContextRoot: null,
        preflightRoot: null,
        calibrationRoot: null,
        reproductionRoot: null,
        acceptedCellCount: 0,
        authorityExpired: true,
      })
      expect(() =>
        buildV138Plan26219TerminalV2({
          disposition: "reproduction_passed",
          authorization,
          seal,
          sourceA2,
          sourceB2,
          context,
          preflight,
          calibration,
        }),
      ).toThrow("MATRIX_PLAN_262_19_PRESENCE_INVALID")
      const invalidAccepted = clone(reproduction)
      invalidAccepted.acceptedCellCount = 1 as never
      expect(() =>
        checkV138AuthoritativeMatrixV7Receipt(invalidAccepted, {
          repoRoot: root,
          executionContext: context,
          preflight,
          calibration,
        }),
      ).toThrow("MATRIX_REPRODUCTION_V7_INVALID")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 300_000)
})

describe("v1.38 shared Darwin scheduler observation", () => {
  it("observes once for one tick and fans the immutable observation to all four active shards", async () => {
    const inventory = {
      schemaVersion: "test-inventory",
      fixturePurpose: "test-fixture",
      historicalSourceSha256: `sha256:${"a".repeat(64)}`,
      admissionRoot: `sha256:${"b".repeat(64)}`,
      definitions: [],
      arenas: [],
      attempts: Array.from({ length: 540 }, (_, index) => ({
        attemptId: `test-attempt:${index}`,
        request: {},
      })),
    } as unknown as ReturnType<typeof enumerateV138CurrentMatrix>
    let providerCalls = 0
    let legacySamplerCalls = 0
    const calibration = await calibrateV138ParallelMatrix({
        inventory,
        policy: deriveV138ParallelCalibrationPolicy(inventory),
        runner: successfulInjectedRunner(),
        hardwareIdentity: {
          operatingSystem: "test-darwin",
          architecture: "test-arch",
          nodeVersion: "test-node",
          cpuIdentity: "test-cpu",
        },
        executionIdentityVersion: "v5",
        sharedHeadroomObserver: async () => {
          providerCalls += 1
          return parseMemoryPressureQ({
            stdout: Buffer.from(
              "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
            ),
            stderr: Buffer.alloc(0),
            exitCode: 0,
            signal: null,
            timedOut: false,
          })
        },
    })
    const ticks = calibration.sharedObservationTicks ?? []
    expect(providerCalls).toBe(1)
    expect(legacySamplerCalls).toBe(0)
    expect(ticks).toHaveLength(1)
    expect(ticks[0]!.shardIds).toEqual([
      "calibration-shard:0",
      "calibration-shard:1",
      "calibration-shard:2",
      "calibration-shard:3",
    ])
    expect(new Set(ticks[0]!.fanout.map(({ observationRoot }) => observationRoot))).toEqual(
      new Set([ticks[0]!.observationRoot]),
    )
    expect(Object.isFrozen(ticks[0])).toBe(true)
    void legacySamplerCalls
  })

  it("runs direct A inventory through injected v5 calibration and v6 execution without live observation", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const observe = async () =>
      parseMemoryPressureQ({
        stdout: Buffer.from(
          "The system has 4096 (1 pages with a page size of 4096).\nSystem-wide memory free percentage: 25%\n",
        ),
        stderr: Buffer.alloc(0),
        exitCode: 0,
        signal: null,
        timedOut: false,
      })
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy: deriveV138ParallelCalibrationPolicy(inventory),
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-darwin",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v5",
      sharedHeadroomObserver: observe,
    })
    expect(calibration.status).toBe("admitted")
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: successfulInjectedRunner(),
      executionIdentityVersion: "v5",
      sharedHeadroomObserver: observe,
    })
    expect(execution).toMatchObject({
      status: "complete_pending_publication",
      accounting: {
        terminalAttemptCount: 540,
        successfulButUnacceptedCount: 540,
        acceptedCellsPublished: 0,
      },
    })
  })
})

describe("v1.38 matrix real process boundary", () => {
  const adapter = (
    invoke: V138RssCommandAdapter["execFile"],
  ): V138RssCommandAdapter => ({
    adapterId: "test-rss-command-adapter-v1",
    command: "ps",
    args: ["-o", "rss=", "-p", "{pid}"],
    units: "kilobytes",
    execFile: invoke,
  })

  const injectedShardProcessFactory = (
    mutateResult: (
      result: Record<string, unknown>,
    ) => Record<string, unknown>,
  ): V138ShardProcessFactory => ({
    spawn: (_command, args) => {
      const encodedPayload = args.at(-1)
      if (encodedPayload === undefined) {
        throw new TypeError("missing injected shard payload")
      }
      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64").toString("utf8"),
      ) as { attemptIds: string[] }
      const child = new EventEmitter() as ChildProcessWithoutNullStreams
      const stdout = new PassThrough()
      const stderr = new PassThrough()
      const stdin = new PassThrough()
      Object.assign(child, {
        stdin,
        stdout,
        stderr,
        kill: () => true,
      })
      const result = mutateResult({
        outcomes: payload.attemptIds.map((attemptId) => ({
          attemptId,
          classification: "success",
          outcome: "draw",
        })),
        maxRssKilobytes: 100,
      })
      setImmediate(() => {
        stdout.end(JSON.stringify(result))
        stderr.end()
        child.emit("close", 0, null)
      })
      return child
    },
  })

  it("shared-observer runner mode never calls the legacy host-memory sampler", async () => {
    let legacySamplerCalls = 0
    const runner = createV138SubprocessShardRunner(repoRoot, {
      useLegacyHostMemory: false,
      legacyHostMemorySampler: () => {
        legacySamplerCalls += 1
        return { totalKilobytes: 10_000, freeKilobytes: 5_000 }
      },
      rssCommandAdapter: adapter((_command, _args, _options, callback) => {
        callback(null, "100\n", "")
        return new EventEmitter() as ReturnType<V138RssCommandAdapter["execFile"]>
      }),
      shardProcessFactory: injectedShardProcessFactory((value) => value),
    })
    await runner.run(
      {
        kind: "calibration",
        shardId: "calibration-shard:test",
        laneId: "lane:0",
        ordinal: 0,
        attempts: [{
          executionAttemptId: "calibration:test",
          templateAttemptId: "template:test",
          request: {},
        }],
      },
      {
        signal: new AbortController().signal,
        onResourceSample: () => undefined,
      },
    )
    expect(legacySamplerCalls).toBe(0)
  })

  it.each([
    [
      "success missing outcome",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        delete outcomes[0]!.outcome
        return result
      },
    ],
    [
      "success with invalid outcome enum",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0]!.outcome = "invented"
        return result
      },
    ],
    [
      "success with a private field",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0]!.strategyMemory = { secret: true }
        return result
      },
    ],
    [
      "player violation with an empty code",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0] = {
          attemptId: outcomes[0]!.attemptId,
          classification: "player_violation",
          code: "",
        }
        return result
      },
    ],
    [
      "player violation with an extra field",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0] = {
          attemptId: outcomes[0]!.attemptId,
          classification: "player_violation",
          code: "INVALID_OUTPUT",
          retryable: false,
        }
        return result
      },
    ],
    [
      "system failure with a non-boolean retryable field",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0] = {
          attemptId: outcomes[0]!.attemptId,
          classification: "system_failure",
          code: "EXECUTION_EXCEPTION",
          retryable: "false",
        }
        return result
      },
    ],
    [
      "system failure with an empty code",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0] = {
          attemptId: outcomes[0]!.attemptId,
          classification: "system_failure",
          code: "",
          retryable: false,
        }
        return result
      },
    ],
    [
      "system failure with an extra field",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes[0] = {
          attemptId: outcomes[0]!.attemptId,
          classification: "system_failure",
          code: "EXECUTION_EXCEPTION",
          retryable: false,
          diagnostic: "private",
        }
        return result
      },
    ],
    [
      "out-of-order attempt IDs",
      (result: Record<string, unknown>) => {
        const outcomes = result.outcomes as Record<string, unknown>[]
        outcomes.reverse()
        return result
      },
    ],
    [
      "extra top-level field",
      (result: Record<string, unknown>) => ({
        ...result,
        diagnostic: "private",
      }),
    ],
  ] as const)(
    "matrix parent boundary rejects %s without run admission",
    async (_label, mutateResult) => {
      const runner = createV138SubprocessShardRunner(repoRoot, {
        shardProcessFactory: injectedShardProcessFactory(mutateResult),
      })
      const terminal = await runner.run(
        {
          kind: "calibration",
          shardId: "injected-parent-boundary-shard",
          laneId: "injected-parent-boundary-lane",
          ordinal: 0,
          attempts: [0, 1].map((index) => ({
            executionAttemptId: `injected:execution:${index}`,
            templateAttemptId: `injected:template:${index}`,
            request: {} as V138CurrentMatrixAttempt["request"],
          })),
        },
        {
          signal: new AbortController().signal,
          onResourceSample: () => undefined,
        },
      )
      const disposition =
        terminal.classification === "success"
          ? "calibration_admitted"
          : "stopped_process_failure"
      const acceptedCellCount = terminal.outcomes.filter(
        ({ classification }) => classification === "success",
      ).length

      expect(disposition).toBe("stopped_process_failure")
      expect(acceptedCellCount).toBe(0)
      expect(terminal.outcomes).toHaveLength(2)
      expect(
        terminal.classification === "failed" &&
          terminal.outcomes.every(
            (outcome) =>
              outcome.classification === "system_failure" &&
              outcome.code === "RESOURCE_POLICY_SHARD_OUTPUT_INVALID" &&
              outcome.retryable === false,
          ),
      ).toBe(true)
      expect(
        terminal.outcomes.map(({ attemptId }) => attemptId),
      ).toEqual(
        ["injected:execution:0", "injected:execution:1"],
      )
      expect(
        terminal.outcomes.every(
          ({ classification }) => classification !== "success",
        ),
      ).toBe(true)
    },
  )

  it("matrix sampler denial classifies synchronous and callback permission denial", async () => {
    const denied = Object.assign(new Error("denied"), { code: "EPERM" })
    const synchronous = adapter(() => {
      throw denied
    })
    const callback = adapter((_command, _args, _options, done) => {
      done(denied, "", "")
    })

    await expect(sampleV138ChildRss(123, synchronous)).resolves.toEqual({
      status: "unavailable",
      code: "RESOURCE_SAMPLER_SPAWN_DENIED",
    })
    await expect(sampleV138ChildRss(123, callback)).resolves.toEqual({
      status: "unavailable",
      code: "RESOURCE_SAMPLER_SPAWN_DENIED",
    })
  })

  it.each(["", "0", "-1", "12 13", "12.5", "unknown"])(
    "matrix sampler denial rejects ambiguous RSS output %j",
    async (stdout) => {
      const ambiguous = adapter((_command, _args, _options, done) => {
        done(null, stdout, "")
      })
      await expect(sampleV138ChildRss(123, ambiguous)).resolves.toEqual({
        status: "unavailable",
        code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
      })
    },
  )

  it("matrix real cleanup proof terminates a spawned shard after sampler denial", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const attempt = inventory.attempts[0]!
    const denied = Object.assign(new Error("denied"), { code: "EPERM" })
    const runner = createV138SubprocessShardRunner(repoRoot, {
      rssCommandAdapter: adapter(() => {
        throw denied
      }),
    })
    const terminal = await runner.run(
      {
        kind: "calibration",
        shardId: "diagnostic-test-shard:denied",
        laneId: "diagnostic-test-lane:0",
        ordinal: 0,
        attempts: [{
          executionAttemptId: `diagnostic_test:v2:denied:${attempt.attemptId}`,
          templateAttemptId: attempt.attemptId,
          request: attempt.request,
        }],
      },
      {
        signal: new AbortController().signal,
        onResourceSample: () => undefined,
      },
    )

    expect(terminal).toMatchObject({
      classification: "failed",
      cleanup: {
        exitAwaited: true,
        orphanProcessIds: [],
      },
      outcomes: [{
        classification: "system_failure",
        code: "RESOURCE_SAMPLER_SPAWN_DENIED",
      }],
    })
  }, 60_000)

  it("matrix diagnostic v2 receipt seals exact charged real-boundary evidence", async () => {
    const target = path.resolve(
      "/tmp",
      `v1.38-current-matrix-diagnostic-v2-${process.pid}.json`,
    )
    const receipt = await writeV138MatrixDiagnosticV2Receipt(repoRoot, target)
    expect(checkV138MatrixDiagnosticV2Receipt(repoRoot, clone(receipt))).toEqual(
      receipt,
    )
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-diagnostic-v2",
      acceptedCellCount: 0,
      partialAcceptedEvidenceReusable: false,
      predecessor: {
        fileSha256:
          "sha256:ac890d84767a09265265b21d80852ff6c63615ea9d4a0cc9fbf549f520f5aeec",
        gitBlob: "166fbe91525623fa99fc7035462c76301f98785d",
        producingCommit: "c5665b756f7e9f3ec1e8c57e5c64ad6f2a136c66",
        receiptRoot:
          "sha256:99187d35b9a14e263be6cc35a6335bdd3957d5fede647345326c8e015891b280",
      },
    })
    const mutated = clone(receipt) as any
    mutated.executedIdentityIds.reverse()
    expect(() =>
      checkV138MatrixDiagnosticV2Receipt(repoRoot, mutated),
    ).toThrow("MATRIX_DIAGNOSTIC_V2_RECEIPT_INVALID")
  }, 180_000)
})

describe("v1.38 matrix sampler authorization", () => {
  it("matrix sampler authorization accepts only the explicit approved policy", () => {
    expect(parseV138SamplerAuthorization("authorized-unsandboxed-ps")).toMatchObject({
      selection: "authorized-unsandboxed-ps",
      permissionBoundary:
        "exact-read-only-ps-rss-and-process-group-orphan-probe",
      policyRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    for (const invalid of [
      "",
      "default",
      "approved",
      "previously-approved",
      "approved-equivalent-sampler",
    ]) {
      expect(() => parseV138SamplerAuthorization(invalid)).toThrow(
        "MATRIX_SAMPLER_AUTHORIZATION_REQUIRED",
      )
    }
  })
})

const terminalPlan26213Snapshot = () => ({
  planId: "262-13" as const,
  agents: [
    {
      agentId: "task-1-helper",
      taskName: "implement_262_13_task1",
      agentType: "worker",
      status: "completed",
    },
  ],
  activePlan26213AgentCount: 0 as const,
  activePlan26213GsdExecutorCount: 0 as const,
  claimScope: "plan_scoped_orchestrator_registry_not_os_global" as const,
})

describe("v1.38 matrix inline execution context v4", () => {
  it("matrix inline execution context v4 binds lean main ownership and terminal plan agents", () => {
    const receipt = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-execution-context-v4",
      mode: "gsd-pattern-c-inline-main",
      executionOwner: "lean-main-orchestrator",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      claimScope: "plan_scoped_orchestrator_registry_not_os_global",
      implementationSource: {
        path: "scripts/lib/v1-38-current-matrix-reproduction.ts",
        currentSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        predecessorSha256:
          "sha256:e9f0bd91000dd4d089e627d9c6b7d93249ba58bd62724fbc413c450ca5c2ae84",
        predecessorGitBlob: "3eb530a64fc899810237d3fdf1b65202e6891627",
        predecessorProducingCommit:
          "02e25166652263fd6187937a1e02d81fb59a590d",
      },
      testSource: {
        path: "scripts/evaluate-v1-38-foundation-contract.test.ts",
        currentSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
        predecessorSha256:
          "sha256:dcbe73205d4d49cf5ea7e223a379bf0c64865d4069929499798700a5fc184352",
        predecessorGitBlob: "e76cd133de615d6b7bf89ff91103f76699ee2849",
        predecessorProducingCommit:
          "f27f3165083f8c2cdc7c45b441ec1386191234ac",
      },
      planAgentSnapshot: {
        activePlan26213AgentCount: 0,
        activePlan26213GsdExecutorCount: 0,
      },
    })
    expect(receipt.commandFamily).toEqual([
      "--write-execution-context-v4-receipt",
      "--check-execution-context-v4-receipt",
      "--write-headroom-preflight-v4-receipt",
      "--check-headroom-preflight-v4-receipt",
      "--calibrate-parallel-v4-receipt",
      "--check-calibration-v4-receipt",
      "--write-authoritative-v5-receipt",
      "--check-successor-v4-v5-branch",
    ])
    const sealedReceipt = JSON.parse(readFileSync(
      path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
      ),
      "utf8",
    ))
    expect(
      checkV138ExecutionContextV4Receipt(repoRoot, sealedReceipt),
    ).toEqual(sealedReceipt)

    for (const mutation of [
      { mode: "resident-executor" },
      { executionOwner: "gsd-executor" },
      { cwd: "/tmp/cowards-game" },
      { commandFamily: receipt.commandFamily.slice(1) },
      {
        implementationSource: {
          ...receipt.implementationSource,
          currentSha256: `sha256:${"0".repeat(64)}`,
        },
      },
      { claimScope: "os_global_process_absence" },
      {
        planAgentSnapshot: {
          ...terminalPlan26213Snapshot(),
          activePlan26213AgentCount: 1,
          agents: [
            {
              ...terminalPlan26213Snapshot().agents[0],
              status: "running",
            },
          ],
        },
      },
      {
        planAgentSnapshot: {
          ...terminalPlan26213Snapshot(),
          activePlan26213GsdExecutorCount: 1,
        },
      },
    ]) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(repoRoot, {
          ...sealedReceipt,
          ...mutation,
        }),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }
  })
})

describe("v1.38 matrix historical execution context source evolution", () => {
  it("matrix historical execution context source evolution verifies sealed producing objects after HEAD changes", () => {
    const artifactHashesBefore = currentMatrixArtifactHashes()
    const receipt = JSON.parse(readFileSync(
      path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
      ),
      "utf8",
    ))
    const successorTestBytes = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/evaluate-v1-38-foundation-contract.test.ts",
      ),
    )
    expect(
      `sha256:${createHash("sha256").update(successorTestBytes).digest("hex")}`,
    ).not.toBe(receipt.testSource.currentSha256)

    expect(
      checkV138ExecutionContextV4Receipt(
        repoRoot,
        receipt,
        producingGitObjects(),
      ),
    ).toEqual(receipt)

    const invalidReceiptMutations = [
      {
        implementationSource: {
          ...receipt.implementationSource,
          path: "scripts/lib/not-the-producing-path.ts",
        },
      },
      {
        implementationSource: {
          ...receipt.implementationSource,
          currentSha256: `sha256:${"0".repeat(64)}`,
        },
      },
      {
        testSource: {
          ...receipt.testSource,
          currentSha256: `sha256:${"f".repeat(64)}`,
        },
      },
      { receiptRoot: `sha256:${"1".repeat(64)}` },
    ]
    for (const mutation of invalidReceiptMutations) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(
          repoRoot,
          { ...receipt, ...mutation },
          producingGitObjects(),
        ),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }

    const corruptingResolver = (
      kind: "commit" | "path" | "blob" | "content",
    ): V138ProducingGitObjectContract => ({
      resolveCommitPath: ({ producingCommit, sourcePath }) => {
        const wrongCommit =
          kind === "commit"
            ? "743bce2f"
            : producingCommit
        const wrongPath =
          kind === "path" &&
          sourcePath ===
            "scripts/lib/v1-38-current-matrix-reproduction.ts"
            ? "scripts/evaluate-v1-38-foundation-contract.test.ts"
            : sourcePath
        const resolved = producingGitObjects().resolveCommitPath({
          producingCommit: wrongCommit,
          sourcePath: wrongPath,
        })
        return {
          blob:
            kind === "blob"
              ? "0000000000000000000000000000000000000000"
              : resolved.blob,
          content:
            kind === "content"
              ? Buffer.from("mutated producing content", "utf8")
              : resolved.content,
        }
      },
    })
    for (const kind of ["commit", "path", "blob", "content"] as const) {
      expect(() =>
        checkV138ExecutionContextV4Receipt(
          repoRoot,
          receipt,
          corruptingResolver(kind),
        ),
      ).toThrow("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
    }
    expect(currentMatrixArtifactHashes()).toEqual(artifactHashesBefore)
  })
})

describe("v1.38 matrix retry authorization v4", () => {
  it("matrix retry authorization v4 accepts only the exact unused single-use lean grant", () => {
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    expect(authorization).toMatchObject({
      planId: "262-13",
      leanOrchestratorOnly: true,
      headroomPreflightCount: 1,
      calibrationSetCount: 1,
      calibrationAttemptCount: 8,
      reproductionMaximumCount: 1,
      reproductionCellCount: 540,
      reproductionConditionalOnCalibrationAdmission: true,
      singleUse: true,
      expiresAtFirstTerminalOutcome: true,
      consumed: false,
      terminalOutcome: null,
    })
    expect(authorization.executionAuthorizationRoot).not.toBe(
      authorization.samplerPolicyRoot,
    )
    expect(authorization.executionAuthorizationRoot).not.toBe(
      "sha256:a903e1e58315aec0751db4e5df99ce8cf31a4b4e92536d0291a25aa31ce484c4",
    )
    for (const invalid of [
      "",
      "default",
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL.replace(
        "at most one",
        "two",
      ),
      `${PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL} Retry if needed.`,
    ]) {
      expect(() =>
        parseV138Plan26213ExecutionAuthorization(invalid),
      ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_REQUIRED")
    }
    expect(() =>
      parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
        { consumed: true, terminalOutcome: null },
      ),
    ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_CONSUMED")
    expect(() =>
      parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
        {
          consumed: true,
          terminalOutcome: "stopped_process_failure",
        },
      ),
    ).toThrow("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_EXPIRED")
  })
})

describe("v1.38 matrix headroom preflight v4", () => {
  it.each([
    [4_000, 1_000, 2_500, "preflight_admitted"],
    [4_001, 1_000, 2_499, "preflight_refused"],
  ] as const)(
    "matrix headroom preflight v4 preserves exact KiB floor semantics and predecessor custody",
    (total, free, basisPoints, disposition) => {
      const context = buildV138ExecutionContextV4Receipt({
        repoRoot,
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        planAgentSnapshot: terminalPlan26213Snapshot(),
      })
      const authorization = parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
      )
      const receipt = buildV138HostHeadroomPreflightV4Receipt({
        repoRoot,
        executionContext: context,
        executionAuthorization: authorization,
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
      })
      expect(receipt).toMatchObject({
        schemaVersion: "v1.38-current-matrix-headroom-preflight-v4",
        chargedIdentityId: "preflight:v4:0",
        hostHeadroomBasisPoints: basisPoints,
        requiredHostHeadroomBasisPoints: 2_500,
        disposition,
        executionContextV4ReceiptRoot: context.receiptRoot,
        predecessorRoots: {
          plan26212Preflight: {
            fileSha256:
              "sha256:b432f5640bb23f6ce66d3705f292151fdff8ff09c961b5693e30c25fc5f5420f",
            receiptRoot:
              "sha256:4e52cccbc6384cda9bef1c26c9e4f36d666e26506f760f749b4f0195677cb20d",
            chargedRoot:
              "sha256:8703f882e659a24d29b4e51e6e45a172afc35389b955038d6da83d304ca22de7",
          },
          plan26212Calibration: {
            fileSha256:
              "sha256:29a406e67f7163152c99c07c0f75ed5a0af8840b6c34372668265f2df10bc79d",
            receiptRoot:
              "sha256:911a6bbc700036f9d3916ac9b171b246a676b2b7dd33f24c8b85a8c4dbdb3ffd",
            chargedRoot:
              "sha256:2103fbb3bbc98427fdd81b8435f42e7d8c13ee2d2a995be4da463e02efcb4e35",
          },
        },
      })
    },
  )
})

describe("v1.38 matrix calibration v4 lineage", () => {
  it("matrix calibration v4 lineage charges all eight identities without children below gate", () => {
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const receipt = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-calibration-v4",
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_HOST_HEADROOM",
      calibration: null,
      terminals: [],
      chargedCalibrationAttemptCount: 8,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(receipt.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(receipt.declaredCalibrationIdentityIds[0]).toMatch(
      /^calibration:v4:0:/u,
    )
    expect(receipt.chargedDispositions).toHaveLength(8)
    expect(receipt.chargedDispositions.every(
      ({ disposition }) =>
        disposition === "unfilled_resource_preflight_refusal",
    )).toBe(true)

    const reorderedPredecessor = clone(preflight)
    reorderedPredecessor.predecessorRoots.orderedChargedLineage.reverse()
    expect(() =>
      buildV138ParallelCalibrationV4Receipt({
        repoRoot,
        executionContext: context,
        preflight: reorderedPredecessor,
        executionAuthorization: authorization,
      }),
    ).toThrow("MATRIX_PREFLIGHT_V4_RECEIPT_INVALID")

    expect(() =>
      buildV138ParallelCalibrationV4Receipt({
        repoRoot,
        executionContext: context,
        preflight,
        executionAuthorization: authorization,
        calibration: {} as never,
      }),
    ).toThrow("MATRIX_CALIBRATION_V4_BRANCH_INVALID")
  })
})

describe("v1.38 matrix authoritative v5 branches", () => {
  it("matrix authoritative v5 branches forbid v5 after a stopped calibration", () => {
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        {},
      ),
    ).toThrow("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
  }, 20_000)

  it("matrix authoritative v5 branches verify admitted-preflight calibration failure custody", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_CALIBRATION_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const calibrationEvidence = await calibrateV138ParallelMatrix({
      inventory,
      runner: failedRunner,
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v4",
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
      calibration: calibrationEvidence,
    })

    expect(calibration).toMatchObject({
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: false,
      partialAcceptedEvidenceReusable: false,
      executionAuthorization: {
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(calibration.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(calibration.chargedDispositions).toHaveLength(8)
    expect(
      calibration.chargedDispositions.every(
        ({ disposition }) =>
          disposition === "terminal_calibration_outcome",
      ),
    ).toBe(true)
    expect(
      calibration.terminals.flatMap(({ outcomes }) => outcomes),
    ).toHaveLength(8)
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })
  }, 20_000)

  it("matrix authoritative v5 branches use fresh identities and atomic zero publication on failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibrationEvidence = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v4",
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
      calibration: calibrationEvidence,
    })
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        undefined,
      ),
    ).toThrow("MATRIX_ADMITTED_CALIBRATION_V5_REQUIRED")
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration: calibrationEvidence,
      runner: successfulInjectedRunner({ hostHeadroomBasisPoints: 1_000 }),
      executionIdentityVersion: "v5",
    })
    const reproduction = buildV138AuthoritativeMatrixV5Receipt({
      repoRoot,
      executionContext: context,
      calibrationV4: calibration,
      execution,
    })
    expect(reproduction).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v5",
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: true,
      executionAuthorizationExpired: true,
      calibrationV4ReceiptRoot: calibration.receiptRoot,
    })
    expect(
      reproduction.execution.terminals.flatMap(({ outcomes }) => outcomes)
        .every(({ attemptId }) => attemptId.startsWith("reproduction:v5:")),
    ).toBe(true)
    const duplicateExecution = clone(execution)
    duplicateExecution.terminals[0]!.outcomes[1]!.attemptId =
      duplicateExecution.terminals[0]!.outcomes[0]!.attemptId
    expect(() =>
      buildV138AuthoritativeMatrixV5Receipt({
        repoRoot,
        executionContext: context,
        calibrationV4: calibration,
        execution: duplicateExecution,
      }),
    ).toThrow()
    expect(() =>
      checkV138SuccessorV4V5Branch(
        repoRoot,
        { branchSource: "supplied", executionContext: context, preflight },
        calibration,
        reproduction,
      ),
    ).toThrow("MATRIX_AUTHORITATIVE_V5_NOT_PASSED_EXACT")
  }, 30_000)

  it("matrix authoritative v5 branches reject every predecessor artifact path", async () => {
    expect(() =>
      writeV138ExecutionContextV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
        ),
        "gsd-pattern-c-inline-main",
        "/Users/roryquinlan/runtime/cowards-game",
        terminalPlan26213Snapshot(),
      ),
    ).toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    expect(() =>
      writeV138HostHeadroomPreflightV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
        ),
        "/not-read",
        "authorize-plan-262-13-lean-single-run",
      ),
    ).toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    await expect(
      writeV138ParallelCalibrationV4Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
        ),
        "/not-read",
        "/not-read",
      ),
    ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
    await expect(
      writeV138AuthoritativeMatrixV5Receipt(
        repoRoot,
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-reproduction.json",
        ),
        "/not-read",
        "/not-read",
      ),
    ).rejects.toThrow("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
  })
})

describe("v1.38 matrix authoritative v5 ambient isolation", () => {
  it("matrix authoritative v5 ambient isolation requires explicit persisted or supplied evidence", () => {
    const artifactHashesBefore = currentMatrixArtifactHashes()
    const context = buildV138ExecutionContextV4Receipt({
      repoRoot,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      planAgentSnapshot: terminalPlan26213Snapshot(),
    })
    const authorization = parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: authorization,
    })
    const suppliedBranch: V138V4V5BranchVerificationContract = {
      branchSource: "supplied",
      executionContext: context,
      preflight,
    }
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        suppliedBranch,
        calibration,
        undefined,
      ),
    ).toEqual({ calibration, reproduction: null })

    const persistedContextPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
    )
    const persistedPreflightPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
    )
    const persistedCalibrationPath = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
    )
    const persistedV5Path = path.resolve(
      repoRoot,
      ".planning/artifacts/v1.38-current-matrix-reproduction-v5.json",
    )
    const persistedCalibration = JSON.parse(
      readFileSync(persistedCalibrationPath, "utf8"),
    )
    const persistedBranch: V138V4V5BranchVerificationContract = {
      branchSource: "persisted",
      executionContextPath: persistedContextPath,
      preflightPath: persistedPreflightPath,
      calibrationPath: persistedCalibrationPath,
      reproductionV5Path: persistedV5Path,
    }
    expect(
      checkV138SuccessorV4V5Branch(
        repoRoot,
        persistedBranch,
        persistedCalibration,
        undefined,
      ),
    ).toEqual({ calibration: persistedCalibration, reproduction: null })

    for (const invalidContract of [
      {
        ...suppliedBranch,
        branchSource: "ambient",
      },
      {
        ...suppliedBranch,
        preflight: JSON.parse(readFileSync(persistedPreflightPath, "utf8")),
      },
      {
        ...persistedBranch,
        calibrationPath: path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
        ),
      },
    ]) {
      expect(() =>
        checkV138SuccessorV4V5Branch(
          repoRoot,
          invalidContract as V138V4V5BranchVerificationContract,
          calibration,
          undefined,
        ),
      ).toThrow()
    }
    expect(currentMatrixArtifactHashes()).toEqual(artifactHashesBefore)
  }, 20_000)
})

describe("v1.38 matrix retry authorization v3", () => {
  it("matrix retry authorization v3 accepts only the exact unused single-use grant", () => {
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    expect(authorization).toMatchObject({
      planId: "262-12",
      headroomPreflightCount: 1,
      calibrationSetCount: 1,
      calibrationAttemptCount: 8,
      reproductionCount: 1,
      reproductionCellCount: 540,
      reproductionConditionalOnCalibrationAdmission: true,
      singleUse: true,
      expiresAtFirstTerminalOutcome: true,
      consumed: false,
      terminalOutcome: null,
      samplerPolicyRoot:
        "sha256:cf3104a41dc7e34ec698a2f187fa0f3785d402549af28fdb60d091b2600339d9",
      executionAuthorizationRoot: expect.stringMatching(
        /^sha256:[0-9a-f]{64}$/u,
      ),
    })
    expect(authorization.executionAuthorizationRoot).not.toBe(
      authorization.samplerPolicyRoot,
    )
    for (const invalid of [
      "",
      "authorized",
      "default",
      "previously authorized",
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL.replace("one 540-cell", "two 540-cell"),
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL.replace("Plan 262-12", "Plan 262-11"),
      `${PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL} Retry if needed.`,
    ]) {
      expect(() =>
        parseV138Plan26212ExecutionAuthorization(invalid),
      ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_REQUIRED")
    }
    expect(() =>
      parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
        { consumed: true, terminalOutcome: null },
      ),
    ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_CONSUMED")
    expect(() =>
      parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
        {
          consumed: true,
          terminalOutcome: "stopped_process_failure",
        },
      ),
    ).toThrow("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_EXPIRED")
  })
})

describe("v1.38 matrix headroom preflight v3", () => {
  it.each([
    [4_000, 1_000, 2_500, "preflight_admitted"],
    [4_001, 1_000, 2_499, "preflight_refused"],
  ] as const)(
    "matrix headroom preflight v3 applies exact floor semantics",
    (total, free, basisPoints, disposition) => {
      const authorization = parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      )
      const receipt = buildV138HostHeadroomPreflightV3Receipt({
        repoRoot,
        executionAuthorization: authorization,
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
      })
      expect(receipt).toMatchObject({
        schemaVersion: "v1.38-current-matrix-headroom-preflight-v3",
        chargedIdentityId: "preflight:v3:0",
        hostTotalMemoryKilobytes: total,
        hostFreeMemoryKilobytes: free,
        hostHeadroomBasisPoints: basisPoints,
        requiredHostHeadroomBasisPoints: 2_500,
        disposition,
        samplerPolicyRoot: authorization.samplerPolicyRoot,
        executionAuthorizationRoot:
          authorization.executionAuthorizationRoot,
        resourcePolicyRoot:
          "sha256:ba5ea05c5067be4aaf996d3fe67cc7f8d13931b7a19301cc1429f185e72747a7",
      })
    },
  )
})

describe("v1.38 matrix calibration v3 lineage", () => {
  it("matrix calibration v3 lineage charges an admitted eight-attempt successor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v3",
    })
    const receipt = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
      calibration,
    })
    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-calibration-v3",
      status: "calibration_admitted",
      preflightV3ReceiptRoot: preflight.receiptRoot,
      chargedCalibrationAttemptCount: 8,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: false,
        terminalOutcome: null,
      },
    })
    expect(receipt.declaredCalibrationIdentityIds).toHaveLength(8)
    expect(
      receipt.declaredCalibrationIdentityIds.every((id) =>
        id.startsWith("calibration:v3:"),
      ),
    ).toBe(true)
  })

  it("matrix calibration v3 lineage refuses below threshold without children", () => {
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_001,
      hostFreeMemoryKilobytes: 1_000,
    })
    const receipt = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
    })
    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_HOST_HEADROOM",
      calibration: null,
      terminals: [],
      acceptedCellCount: 0,
      fullRunLaunched: false,
      executionAuthorization: {
        consumed: true,
        expired: true,
        terminalOutcome: "stopped_process_failure",
      },
    })
    expect(receipt.chargedDispositions).toHaveLength(8)
    expect(
      receipt.chargedDispositions.every(
        ({ disposition }) =>
          disposition === "unfilled_resource_preflight_refusal",
      ),
    ).toBe(true)
  })
})

describe("v1.38 matrix authoritative v4 branches", () => {
  it("matrix authoritative v4 branches require admitted calibration and fresh v4 identities", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const authorization = parseV138Plan26212ExecutionAuthorization(
      PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    )
    const preflight = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: authorization,
      hostTotalMemoryKilobytes: 4_000,
      hostFreeMemoryKilobytes: 1_000,
    })
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v3",
    })
    const calibrationV3 = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: authorization,
      calibration,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: failedRunner,
      executionIdentityVersion: "v4",
    })
    const v4 = buildV138AuthoritativeMatrixV4Receipt({
      repoRoot,
      calibrationV3,
      execution,
    })
    expect(v4).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v4",
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      fullRunLaunched: true,
      calibrationV3ReceiptRoot: calibrationV3.receiptRoot,
      executionAuthorizationExpired: true,
    })
    expect(
      v4.execution.terminals.flatMap(({ outcomes }) => outcomes).every(
        ({ attemptId }) => attemptId.startsWith("reproduction:v4:"),
      ),
    ).toBe(true)
    expect(calibrationV3.status).toBe("calibration_admitted")
    expect(v4.executionAuthorizationExpired).toBe(true)
  }, 30_000)
})

describe("v1.38 matrix successor lineage", () => {
  it("matrix calibration v2 branches bind diagnostic, authorization, and predecessor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const diagnostic = checkV138MatrixDiagnosticV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy: deriveV138ParallelCalibrationPolicy(inventory),
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v2",
    })
    const receipt = buildV138ParallelCalibrationV2SuccessorReceipt({
      repoRoot,
      diagnostic,
      authorization: parseV138SamplerAuthorization(
        "authorized-unsandboxed-ps",
      ),
      calibration,
    })

    expect(receipt).toMatchObject({
      status: "calibration_admitted",
      diagnosticV2ReceiptRoot: diagnostic.receiptRoot,
      predecessor: {
        receiptRoot:
          "sha256:99187d35b9a14e263be6cc35a6335bdd3957d5fede647345326c8e015891b280",
      },
      acceptedCellCount: 0,
      fullRunLaunched: false,
    })
    expect(
      receipt.calibration.terminals.flatMap(({ outcomes }) =>
        outcomes.map(({ attemptId }) => attemptId),
      ).every((id) => id.startsWith("calibration:v2:")),
    ).toBe(true)
  })

  it("matrix authoritative v3 receipt preserves zero publication on full-run failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const diagnostic = checkV138MatrixDiagnosticV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      runner: successfulInjectedRunner(),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
      executionIdentityVersion: "v2",
    })
    const calibrationV2 = buildV138ParallelCalibrationV2SuccessorReceipt({
      repoRoot,
      diagnostic,
      authorization: parseV138SamplerAuthorization(
        "authorized-unsandboxed-ps",
      ),
      calibration,
    })
    const failedRunner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "INJECTED_FAILURE",
            retryable: false,
          })),
        }
      },
    }
    const execution = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: failedRunner,
      executionIdentityVersion: "v3",
    })
    const receipt = buildV138AuthoritativeMatrixV3Receipt({
      repoRoot,
      calibrationV2,
      execution,
    })

    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      acceptedCellCount: 0,
      historicalPredicateMatched: false,
      canonicalReceipt: null,
    })
    expect(receipt.execution.canonicalOutcomes).toHaveLength(16)
  }, 30_000)
})

describe("v1.38 matrix calibration receipt branches", () => {
  it("matrix supervised parallel calibration seals an admitted zero-cell successor", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const predecessor = legacyStoppedMatrixReceipt()
    const calibration = await admittedInjectedCalibration(inventory)
    const receipt = buildV138ParallelCalibrationSuccessorReceipt({
      repoRoot,
      inventory,
      predecessor,
      calibration,
    })

    expect(receipt).toMatchObject({
      schemaVersion: "v1.38-current-matrix-reproduction-v2",
      status: "calibration_admitted",
      stage: "parallel_calibration",
      predecessorReceiptRoot: predecessor.receiptRoot,
      acceptedCellCount: 0,
      fullRunLaunched: false,
      partialAcceptedEvidenceReusable: false,
      calibration: {
        status: "admitted",
        attemptCount: 8,
        terminalShardCount: 4,
      },
    })
    expect(
      checkV138ParallelCalibrationSuccessorReceipt(
        repoRoot,
        clone(receipt),
      ),
    ).toEqual(receipt)
  })

  it("matrix calibration receipt branches preserve a stopped calibration with all attempts charged", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const predecessor = legacyStoppedMatrixReceipt()
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy: deriveV138ParallelCalibrationPolicy(inventory),
      runner: successfulInjectedRunner({
        hostHeadroomBasisPoints: 2_499,
      }),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
    })
    const receipt = buildV138ParallelCalibrationSuccessorReceipt({
      repoRoot,
      inventory,
      predecessor,
      calibration,
    })

    expect(receipt).toMatchObject({
      status: "stopped_process_failure",
      stage: "parallel_calibration",
      acceptedCellCount: 0,
      fullRunLaunched: false,
      chargedCalibrationAttemptCount: 8,
      calibration: {
        status: "stopped_process_failure",
      },
    })
    const mutated = clone(receipt) as any
    mutated.calibration.projection.projectedTotalMilliseconds += 1
    expect(() =>
      checkV138ParallelCalibrationSuccessorReceipt(repoRoot, mutated),
    ).toThrow("MATRIX_CALIBRATION_RECEIPT_INVALID")
  })
})

describe("v1.38 matrix resources", () => {
  it("matrix resources calibrate exactly four concurrent two-attempt shards", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)
    let maximumActive = 0
    const calibration = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: successfulInjectedRunner({
        onLaunch: (active) => {
          maximumActive = Math.max(maximumActive, active)
        },
      }),
      hardwareIdentity: {
        operatingSystem: "test-os",
        architecture: "test-arch",
        nodeVersion: "test-node",
        cpuIdentity: "test-cpu",
      },
    })

    expect(maximumActive).toBe(4)
    expect(calibration.policyRoot).toBe(policy.policyRoot)
    expect(calibration.terminalShardCount).toBe(4)
    expect(calibration.attemptCount).toBe(8)
    expect(calibration.projection.admittedByTime).toBe(true)
    expect(calibration.acceptedCellsPublished).toBe(0)
    expect(calibration.partialAcceptedEvidenceReusable).toBe(false)
    expect(
      calibration.terminals.every(({ outcomes }) => outcomes.length === 2),
    ).toBe(true)
  })

  it("matrix resources produce byte-identical calibration roots across completion orders", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const policy = deriveV138ParallelCalibrationPolicy(inventory)
    const clock = { monotonicMilliseconds: () => 100 }
    const orderedRunner = (reverse: boolean): V138ParallelShardRunner => ({
      async run(shard, control) {
        const waits = reverse ? shard.ordinal : 3 - shard.ordinal
        for (let index = 0; index < waits; index += 1) {
          await Promise.resolve()
        }
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: 100 + shard.ordinal,
          hostTotalMemoryKilobytes: 10_000,
          hostFreeMemoryKilobytes: 5_000,
        })
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "success",
          elapsedMilliseconds: 10,
          maxRssKilobytes: 100 + shard.ordinal,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "success" as const,
            outcome: "draw" as const,
          })),
        }
      },
    })
    const hardwareIdentity = {
      operatingSystem: "test-os",
      architecture: "test-arch",
      nodeVersion: "test-node",
      cpuIdentity: "test-cpu",
    }
    const forward = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: orderedRunner(false),
      hardwareIdentity,
      clock,
    })
    const reverse = await calibrateV138ParallelMatrix({
      inventory,
      policy,
      runner: orderedRunner(true),
      hardwareIdentity,
      clock,
    })

    expect(reverse).toEqual(forward)
    expect(reverse.calibrationRoot).toBe(forward.calibrationRoot)
  })

  it.each([
    ["per-child exact", [2_097_152, 0, 0, 0], 2_500, "complete_pending_publication"],
    ["per-child one over", [2_097_153, 0, 0, 0], 2_500, "stopped_process_failure"],
    ["aggregate exact", [1_048_576, 1_048_576, 1_048_576, 1_048_576], 2_500, "complete_pending_publication"],
    ["aggregate one over", [1_048_577, 1_048_577, 1_048_577, 1_048_577], 2_500, "stopped_process_failure"],
    ["headroom exact", [100, 100, 100, 100], 2_500, "complete_pending_publication"],
    ["headroom one below", [100, 100, 100, 100], 2_499, "stopped_process_failure"],
  ] as const)(
    "matrix resources enforce %s",
    async (_label, childRssByOrdinal, headroom, expectedStatus) => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const calibration = await admittedInjectedCalibration(inventory)
      const result = await executeV138ParallelMatrix({
        inventory,
        calibration,
        runner: successfulInjectedRunner({
          childRssByOrdinal,
          hostHeadroomBasisPoints: headroom,
        }),
      })

      expect(result.status).toBe(expectedStatus)
      expect(result.accounting.acceptedCellsPublished).toBe(0)
    },
  )

  it("matrix resources stop on shard and total time limits", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const shardTimeout = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: successfulInjectedRunner({ elapsedMilliseconds: 600_001 }),
    })
    let now = 0
    const totalTimeout = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner: successfulInjectedRunner(),
      clock: {
        monotonicMilliseconds: () => {
          now += 5_400_001
          return now
        },
      },
    })

    expect(shardTimeout).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_SHARD_TIMEOUT",
    })
    expect(totalTimeout).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_TOTAL_TIMEOUT",
    })
  })

  it("matrix resources refuse unavailable measurements", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const runner: V138ParallelShardRunner = {
      async run(shard, control) {
        control.onResourceSample({
          childId: `child:${shard.shardId}`,
          childRssKilobytes: -1,
          hostTotalMemoryKilobytes: 0,
          hostFreeMemoryKilobytes: 0,
        })
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "cancelled",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 0,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "cancelled" as const,
            code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
          })),
        }
      },
    }
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "RESOURCE_MEASUREMENT_UNAVAILABLE",
      accounting: { acceptedCellsPublished: 0 },
    })
  })
})

describe("v1.38 matrix cleanup", () => {
  it("matrix cleanup cancels active shards, awaits exits, and leaves later shards unlaunched", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    let launched = 0
    let exited = 0
    const runner: V138ParallelShardRunner = {
      async run(shard, control) {
        launched += 1
        await Promise.resolve()
        if (shard.ordinal === 0) {
          return {
            shardId: shard.shardId,
            laneId: shard.laneId,
            classification: "failed",
            elapsedMilliseconds: 10,
            maxRssKilobytes: 100,
            cleanup: {
              gracefulTerminationSent: false,
              forceTerminationSent: false,
              exitAwaited: true,
              orphanProcessIds: [],
            },
            outcomes: shard.attempts.map(({ executionAttemptId }, index) =>
              index === 0
                ? {
                    attemptId: executionAttemptId,
                    classification: "system_failure" as const,
                    code: "SPAWN_FAILED",
                    retryable: false,
                  }
                : {
                    attemptId: executionAttemptId,
                    classification: "cancelled" as const,
                    code: "CANCELLED_AFTER_HARD_FAILURE",
                  },
            ),
          }
        }
        while (!control.signal.aborted) await Promise.resolve()
        exited += 1
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "cancelled",
          elapsedMilliseconds: 10,
          maxRssKilobytes: 100,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: true,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "cancelled" as const,
            code: "CANCELLED_AFTER_HARD_FAILURE",
          })),
        }
      },
    }
    const calibration = await admittedInjectedCalibration(inventory)
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "SHARD_EXECUTION_FAILED",
      accounting: {
        launchedAttemptCount: 16,
        terminalAttemptCount: 16,
        cancelledAttemptCount: 15,
        unlaunchedAttemptCount: 524,
        acceptedCellsPublished: 0,
      },
    })
    expect(launched).toBe(4)
    expect(exited).toBe(3)
    expect(
      result.terminals.every(
        ({ cleanup }) =>
          cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
      ),
    ).toBe(true)
  })

  it("matrix cleanup fails closed when any orphan or missing exit proof remains", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = await admittedInjectedCalibration(inventory)
    const runner: V138ParallelShardRunner = {
      async run(shard) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "failed",
          elapsedMilliseconds: 1,
          maxRssKilobytes: 1,
          cleanup: {
            gracefulTerminationSent: true,
            forceTerminationSent: true,
            exitAwaited: false,
            orphanProcessIds: [999_999],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "system_failure" as const,
            code: "CLEANUP_PROOF_FAILED",
            retryable: false,
          })),
        }
      },
    }
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "CLEANUP_PROOF_FAILED",
      accounting: {
        acceptedCellsPublished: 0,
        unlaunchedAttemptCount: 524,
      },
    })
  })
})

describe("v1.38 matrix cancellation", () => {
  it.each(["parent_exception", "parent_interrupt"] as const)(
    "matrix cancellation handles %s with the same fail-closed cleanup",
    async (reason) => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const parent = new AbortController()
      let launched = 0
      const runner: V138ParallelShardRunner = {
        async run(shard, control) {
          launched += 1
          if (launched === 4) parent.abort(reason)
          while (!control.signal.aborted) await Promise.resolve()
          return {
            shardId: shard.shardId,
            laneId: shard.laneId,
            classification: "cancelled",
            elapsedMilliseconds: 1,
            maxRssKilobytes: 1,
            cleanup: {
              gracefulTerminationSent: true,
              forceTerminationSent: false,
              exitAwaited: true,
              orphanProcessIds: [],
            },
            outcomes: shard.attempts.map(({ executionAttemptId }) => ({
              attemptId: executionAttemptId,
              classification: "cancelled" as const,
              code:
                reason === "parent_interrupt"
                  ? "PARENT_INTERRUPT"
                  : "PARENT_EXCEPTION",
            })),
          }
        },
      }
      const calibration = await admittedInjectedCalibration(inventory)
      const result = await executeV138ParallelMatrix({
        inventory,
        calibration,
        runner,
        parentSignal: parent.signal,
      })

      expect(result.status).toBe("stopped_process_failure")
      expect(result.reason).toBe(
        reason === "parent_interrupt" ? "PARENT_INTERRUPT" : "PARENT_EXCEPTION",
      )
      expect(result.accounting.acceptedCellsPublished).toBe(0)
      expect(result.accounting.launchedAttemptCount).toBe(16)
      expect(result.accounting.unlaunchedAttemptCount).toBe(524)
    },
  )

  it("matrix cancellation converts runner exceptions to charged system failure", async () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const runner: V138ParallelShardRunner = {
      async run() {
        throw new Error("untrusted child output failed to parse")
      },
    }
    const calibration = await admittedInjectedCalibration(inventory)
    const result = await executeV138ParallelMatrix({
      inventory,
      calibration,
      runner,
    })

    expect(result).toMatchObject({
      status: "stopped_process_failure",
      reason: "SHARD_RUNNER_EXCEPTION",
      accounting: {
        failedAttemptCount: 16,
        unlaunchedAttemptCount: 524,
        acceptedCellsPublished: 0,
      },
    })
  })
})

describe("v1.38 matrix expectation", () => {
  it("matrix expectation is reproduced only from immutable v1.37 Git evidence", () => {
    const persisted = loadV138HistoricalMatrixExpectation(repoRoot)
    const derived = deriveV138HistoricalMatrixExpectation(repoRoot)

    expect(derived).toEqual(persisted)
    expect(persisted).toMatchObject({
      schemaVersion: "v1.38-historical-matrix-expectation-v1",
      predicateVersion: "v1.38-historical-matrix-predicate-v1",
      provenance: {
        archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
        sourceBlobOid: "ab5c9feae17f28bd4eb8aeff90516a05c9633363",
        sourceSha256:
          "sha256:0313904594dab8b874292a6876e2d7500ed0e362dd6086333282c489b0a21d1d",
        runnerBlobOid: "3de4aa6f2397925d1d0de012cd8e749554455a06",
        runnerSourceSha256:
          "sha256:5eee4d3b9171749ccdcf0faa6378c3aa4442a5f0e17ffb92ff97ded7622ca243",
        derivationSourceRoot: expect.stringMatching(
          /^sha256:(?!0{64})[0-9a-f]{64}$/u,
        ),
      },
      declaredResults: {
        definitionCount: 10,
        unorderedPairCount: 45,
        configuredArenaCount: 3,
        seedParityCount: 2,
        mirroredSides: true,
        totalMatchCount: 540,
        leaders: [
          {
            strategyId: "advanced:stonewall-shear",
            wins: 62,
            losses: 44,
            draws: 2,
          },
          {
            strategyId: "advanced:vanguard-pressure",
            wins: 62,
            losses: 44,
            draws: 2,
          },
        ],
        thirdPlace: {
          strategyId: "advanced:rear-guard-sentinel",
          wins: 57,
          losses: 51,
          draws: 0,
        },
        majorityEdgeCycleCount: 9,
        arenaRecordEquality: {
          leftArenaLabel: "Smoke",
          rightArenaLabel: "Open Field",
          scope: "per_strategy_wins_losses_draws",
        },
      },
      historicalExpectationRoot: expect.stringMatching(
        /^sha256:(?!0{64})[0-9a-f]{64}$/u,
      ),
    })
    expect(Object.isFrozen(persisted)).toBe(true)
  })

  it.each([
    ["source commit", (draft: any) => (draft.provenance.archiveCommit = "0".repeat(40))],
    ["source blob", (draft: any) => (draft.provenance.sourceBlobOid = "0".repeat(40))],
    ["source bytes", (draft: any) => (draft.provenance.sourceSha256 = `sha256:${"0".repeat(64)}`)],
    ["runner blob", (draft: any) => (draft.provenance.runnerBlobOid = "0".repeat(40))],
    ["runner bytes", (draft: any) => (draft.provenance.runnerSourceSha256 = `sha256:${"0".repeat(64)}`)],
    ["derivation code", (draft: any) => (draft.provenance.derivationSourceRoot = `sha256:${"0".repeat(64)}`)],
    ["declared leader", (draft: any) => (draft.declaredResults.leaders[0].wins = 61)],
    ["record denominator", (draft: any) => (draft.declaredResults.thirdPlace.losses = 50)],
    ["cycle count", (draft: any) => (draft.declaredResults.majorityEdgeCycleCount = 8)],
    ["arena equality", (draft: any) => (draft.declaredResults.arenaRecordEquality.rightArenaLabel = "Standard Cross")],
    ["expectation root", (draft: any) => (draft.historicalExpectationRoot = `sha256:${"0".repeat(64)}`)],
    ["extra key", (draft: any) => (draft.observedAggregateRoot = `sha256:${"f".repeat(64)}`)],
    ["missing key", (draft: any) => delete draft.declaredResults.totalMatchCount],
    ["duplicate leader", (draft: any) => draft.declaredResults.leaders.push(draft.declaredResults.leaders[0])],
  ])("matrix expectation rejects mutated %s", (_label, change) => {
    const mutated = clone(loadV138HistoricalMatrixExpectation(repoRoot)) as any
    change(mutated)
    expect(() =>
      validateV138HistoricalMatrixExpectation(repoRoot, mutated),
    ).toThrow("MATRIX_EXPECTATION_INVALID")
  })
})

describe("v1.38 matrix reduction", () => {
  const exactAggregate = (): V138HistoricalMatrixObservedAggregate => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const records = new Map([
      ["advanced:stonewall-shear", [62, 44, 2]],
      ["advanced:vanguard-pressure", [62, 44, 2]],
      ["advanced:rear-guard-sentinel", [57, 51, 0]],
    ])
    return {
      standings: inventory.definitions
        .map(({ id }) => {
          const [wins, losses, draws] = records.get(id) ?? [51, 57, 0]
          const smoke =
            draws === 2
              ? { wins: 21, losses: 14, draws: 1 }
              : {
                  wins: wins / 3,
                  losses: losses / 3,
                  draws: 0,
                }
          const open = { ...smoke }
          const standard = {
            wins: wins - smoke.wins - open.wins,
            losses: losses - smoke.losses - open.losses,
            draws: draws - smoke.draws - open.draws,
          }
          return {
            id,
            wins,
            losses,
            draws,
            winRateBasisPoints: Math.round((wins * 10_000) / 108),
            byHistoricalArena: {
              Smoke: smoke,
              "Standard Cross": standard,
              "Open Field": open,
            },
          }
        })
        .sort(
          (left, right) =>
            right.winRateBasisPoints - left.winRateBasisPoints ||
            left.id.localeCompare(right.id),
        ),
      nonTransitiveCycleCount: 9,
    }
  }

  it("matrix reduction evaluates the complete aggregate against the independent predicate", () => {
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const aggregate = exactAggregate()
    const result = evaluateV138HistoricalMatrixPredicate(
      repoRoot,
      inventory,
      aggregate,
    )

    expect(result).toEqual({
      matched: true,
      predicateVersion: "v1.38-historical-matrix-predicate-v1",
      historicalExpectationRoot:
        "sha256:758c31a37318edfb1c94cb1d9715ae3cfe49cabdff13d906f155f00cc71abdce",
      sourceBindings: {
        archiveCommit: "e704590df599b49d84745b0e828d5ab0f1d335ad",
        sourceBlobOid: "ab5c9feae17f28bd4eb8aeff90516a05c9633363",
        runnerBlobOid: "3de4aa6f2397925d1d0de012cd8e749554455a06",
        derivationSourceRoot:
          "sha256:a3d0cd5c66f9b8f60b0a2a03e543d0cb602fc359abd45f6dcbcacb71172c88d3",
      },
    })
  })

  it.each([
    ["leader record", (draft: any) => (draft.standings[0].wins = 61)],
    ["record total", (draft: any) => (draft.standings[2].losses = 50)],
    ["cycle count", (draft: any) => (draft.nonTransitiveCycleCount = 8)],
    [
      "Smoke/Open Field equality",
      (draft: any) => (draft.standings[0].byHistoricalArena.Smoke.wins += 1),
    ],
    ["extra standing", (draft: any) => draft.standings.push(draft.standings[0])],
    ["missing standing", (draft: any) => draft.standings.pop()],
    ["extra aggregate key", (draft: any) => (draft.expected = draft)],
  ])("matrix reduction rejects mutated %s", (_label, change) => {
    const aggregate = clone(exactAggregate()) as any
    change(aggregate)
    expect(() =>
      evaluateV138HistoricalMatrixPredicate(
        repoRoot,
        enumerateV138CurrentMatrix(repoRoot),
        aggregate,
      ),
    ).toThrow("MATRIX_REPRODUCTION_MISMATCH")
  })

  it("matrix reduction keeps observed roots separate from the expectation", () => {
    const source = readFileSync(
      path.resolve(
        repoRoot,
        "scripts/lib/v1-38-current-matrix-reproduction.ts",
      ),
      "utf8",
    )
    expect(source).toContain("observedAggregateRoot")
    expect(source).toContain("historicalExpectationRoot")
    expect(source).not.toContain("HISTORICAL_EXPECTED_AGGREGATE_ROOT")
    expect(source).not.toContain(`sha256:${"0".repeat(64)}`)
  })
})
