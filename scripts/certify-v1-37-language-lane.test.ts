import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import {
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  type RuntimeConformanceIdentityBindingsV117,
} from "@cowards/spec"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "@cowards/golden"
import { describe, expect, it, vi } from "vitest"
import {
  V137_CONFORMANCE_CASE_INVENTORY_SHA256,
  certifyLanguageLaneV137,
  type V137FreshLanguageRunResult,
  type V137LanguageChildInvocation,
} from "./certify-v1-37-language-lane.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const hash = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const identity = (
  languageId: "typescript" | "python" | "rust" | "zig",
): RuntimeConformanceIdentityBindingsV117 => ({
  languageId,
  laneId: `${languageId}-native-supervised-v1.18`,
  corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
  caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
  fixtureSourceSha256: hash(`${languageId}:source`),
  artifactSha256: hash(`${languageId}:artifact`),
  adapterBuildSha256: hash(`${languageId}:adapter`),
  runtimeExecutableSha256: hash(`${languageId}:runtime`),
  toolchainSha256: hash(`${languageId}:toolchain`),
  sysrootStdlibSha256: hash(`${languageId}:sysroot`),
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  canonicalJsonProfileId: "canonical-json-v1.1",
  budgetPolicySha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  containmentPolicySha256: hash("containment"),
  semanticTupleSha256: hash("semantic-tuple"),
  identityManifestRoot: hash(`${languageId}:manifest`),
  evidenceGraphRoot: hash(`${languageId}:graph`),
  behaviorSettingsSha256: hash("behavior"),
})

const run = (
  invocation: V137LanguageChildInvocation,
): V137FreshLanguageRunResult => ({
  schemaVersion: "v1.37-fresh-language-run-v1",
  languageId: invocation.languageId,
  runId: invocation.runId,
  workspaceId: invocation.workspaceId,
  processId: `process:${invocation.runId.slice(-16)}`,
  status: "passed",
  complete: true,
  freshWorkspace: true,
  freshProcess: true,
  skippedCaseCount: 0,
  unsupportedCaseCount: 0,
  fallbackUsed: false,
  syntheticEvidence: false,
  caseCount: V1_37_CONFORMANCE_CORPUS.cases.length,
  caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
  startedAt: "2026-07-16T12:00:00.000Z",
  completedAt: "2026-07-16T12:01:00.000Z",
  validUntil: "2026-08-01T00:00:00.000Z",
  identity: identity(invocation.languageId),
  resultRootSha256: hash(`${invocation.languageId}:result`),
  evidenceRootSha256: hash(`${invocation.languageId}:evidence`),
})

const certify = (
  childRunner: (invocation: V137LanguageChildInvocation) => unknown,
) =>
  certifyLanguageLaneV137({
    languageId: "typescript",
    repoRoot,
    runs: 3,
    childRunner,
    issuedAt: "2026-07-16T12:02:00.000Z",
    requestedValidUntil: "2026-08-01T00:00:00.000Z",
    registryGeneration: "23",
    producerId: "producer:v1.37",
    producerKeyId: "producer-key:v1.37",
  })

describe("v1.37 fresh-process language certifier", () => {
  it("requires three distinct complete identical runs and emits unsigned exact bytes", () => {
    const childRunner = vi.fn(run)
    const result = certify(childRunner)
    expect(result).toMatchObject({
      status: "reviewed_unsigned_candidate",
      languageId: "typescript",
      expectedRunBinding: {
        caseInventorySha256: V137_CONFORMANCE_CASE_INVENTORY_SHA256,
        requiredCaseCount: V1_37_CONFORMANCE_CORPUS.cases.length,
        resultRootSha256: hash("typescript:result"),
      },
    })
    if (result.status !== "reviewed_unsigned_candidate") {
      throw new Error(result.code)
    }
    expect(result.candidatePayload.runs).toHaveLength(3)
    expect(
      new Set(
        result.candidatePayload.runs.map(({ workspaceId }) => workspaceId),
      ).size,
    ).toBe(3)
    expect(
      new Set(result.candidatePayload.runs.map(({ processId }) => processId))
        .size,
    ).toBe(3)
    expect(result.candidatePayloadSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(childRunner).toHaveBeenCalledTimes(3)
    for (const call of childRunner.mock.calls) {
      expect(call[0]!.workspacePath).not.toBe(repoRoot)
    }
  })

  it("fails closed on skip, unsupported, fallback, synthetic, partial, identity, and root drift", () => {
    const mutations = [
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        skippedCaseCount: 1,
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        unsupportedCaseCount: 1,
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        fallbackUsed: true,
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        syntheticEvidence: true,
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        caseCount: value.caseCount - 1,
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        identity: {
          ...value.identity,
          runtimeExecutableSha256: hash("substituted-runtime"),
        },
      }),
      (value: V137FreshLanguageRunResult) => ({
        ...value,
        resultRootSha256: hash("drifted-result"),
      }),
    ]
    for (const mutate of mutations) {
      let ordinal = 0
      const result = certify((invocation) => {
        const value = run(invocation)
        const output = ordinal === 2 ? mutate(value) : value
        ordinal += 1
        return output
      })
      expect(result.status).toBe("system_failure")
      expect(result.candidatePayload).toBeNull()
    }
  })

  it("fails on child errors, extra fields, stale execution, and golden mutation", () => {
    expect(
      certify(() => {
        throw new Error("private-host-poison")
      }),
    ).toMatchObject({
      status: "system_failure",
      code: "LANE_RUN_FAILED",
    })

    expect(
      certify((invocation) => ({
        ...run(invocation),
        diagnostics: "private-host-poison",
      })),
    ).toMatchObject({
      status: "system_failure",
      code: "LANE_RUN_INVALID",
    })

    expect(
      certify((invocation) => ({
        ...run(invocation),
        completedAt: "2026-05-01T00:00:00.000Z",
        validUntil: "2026-05-02T00:00:00.000Z",
      })),
    ).toMatchObject({
      status: "system_failure",
    })

    const registryPath = path.join(
      repoRoot,
      "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
    )
    const original = readFileSync(registryPath)
    let calls = 0
    try {
      const result = certify((invocation) => {
        calls += 1
        if (calls === 3) writeFileSync(registryPath, `${original}\n`)
        return run(invocation)
      })
      expect(result).toMatchObject({
        status: "system_failure",
        code: "GOLDEN_MUTATION",
      })
    } finally {
      writeFileSync(registryPath, original)
    }
  })

  it("emits only safe failure records and cleans temporary workspaces", () => {
    const workspaces: string[] = []
    const result = certify((invocation) => {
      workspaces.push(invocation.workspacePath)
      throw new Error(
        "source artifact memory objective diagnostics stderr host",
      )
    })
    expect(JSON.stringify(result)).not.toMatch(
      /source artifact|memory|objective|diagnostics|stderr|host/iu,
    )
    for (const workspace of workspaces) {
      expect(() => readFileSync(workspace)).toThrow()
    }
  })
})
