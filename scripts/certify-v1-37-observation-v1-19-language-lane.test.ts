import { createHash } from "node:crypto"
import path from "node:path"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  type RuntimeConformanceIdentityBindingsV117,
} from "@cowards/spec"
import { describe, expect, it, vi } from "vitest"
// Candidate pins are intentionally not exported through current package selectors.
// eslint-disable-next-line no-restricted-imports
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.js"
import {
  V137_OBSERVATION_V119_CASE_INVENTORY_SHA256,
  certifyObservationLanguageLaneV119,
  exactObservationV119CandidateBindings,
  type V137ObservationV119FreshLanguageRun,
  type V137ObservationV119LanguageChildInvocation,
} from "./certify-v1-37-observation-v1-19-language-lane.js"

const repoRoot = path.resolve(import.meta.dirname, "..")
const hash = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const identity = (
  languageId: "typescript" | "python" | "rust" | "zig",
): RuntimeConformanceIdentityBindingsV117 => ({
  languageId,
  laneId: `${languageId}-candidate-native-supervised-v1.19`,
  corpusRootSha256:
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256,
  caseInventorySha256: V137_OBSERVATION_V119_CASE_INVENTORY_SHA256,
  fixtureSourceSha256:
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.sourceRoots.find(
      (source) => source.languageId === languageId,
    )!.sourceSha256,
  artifactSha256: hash(`${languageId}:artifact`),
  adapterBuildSha256: hash(`${languageId}:adapter`),
  runtimeExecutableSha256: hash(`${languageId}:runtime`),
  toolchainSha256: hash(`${languageId}:toolchain`),
  sysrootStdlibSha256: hash(`${languageId}:sysroot`),
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  canonicalJsonProfileId: "canonical-json-v1.1",
  budgetPolicySha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  containmentPolicySha256: hash("containment"),
  semanticTupleSha256: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId,
  identityManifestRoot: hash(`${languageId}:manifest`),
  evidenceGraphRoot: hash(`${languageId}:graph`),
  behaviorSettingsSha256: hash("behavior"),
})

const freshRun = (
  invocation: V137ObservationV119LanguageChildInvocation,
): V137ObservationV119FreshLanguageRun => ({
  schemaVersion: "v1.37-observation-v1.19-fresh-language-run-v1",
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
  caseCount: V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.length,
  caseInventorySha256: V137_OBSERVATION_V119_CASE_INVENTORY_SHA256,
  startedAt: "2026-07-17T12:00:00.000Z",
  completedAt: "2026-07-17T12:01:00.000Z",
  validUntil: "2026-08-01T00:00:00.000Z",
  identity: identity(invocation.languageId),
  resultRootSha256: hash(`${invocation.languageId}:result`),
  evidenceRootSha256: hash(`${invocation.languageId}:evidence`),
  candidateBindings: invocation.candidateBindings,
})

const certify = (
  childRunner: (invocation: V137ObservationV119LanguageChildInvocation) => unknown,
  candidateBindings = exactObservationV119CandidateBindings(repoRoot),
) =>
  certifyObservationLanguageLaneV119({
    languageId: "typescript",
    repoRoot,
    runs: 3,
    candidateBindings,
    childRunner,
    issuedAt: "2026-07-17T12:02:00.000Z",
    requestedValidUntil: "2026-08-01T00:00:00.000Z",
    registryGeneration: "candidate-0",
    producerId: "producer:v1.37:observation-v1.19",
    producerKeyId: "producer-key:v1.37:observation-v1.19",
  })

describe("v1.37 observation-v1.19 candidate lane certifier", () => {
  it("requires exact explicit candidate versions, roots, and pin bytes for three fresh real runs", () => {
    const childRunner = vi.fn(freshRun)
    const result = certify(childRunner)
    expect(result).toMatchObject({
      schemaVersion:
        "v1.37-observation-v1.19-reviewed-language-candidate-v1",
      status: "reviewed_unsigned_candidate",
      languageId: "typescript",
      candidateBindings: {
        corpus: { version: "v3", current: false },
        trace: {
          version: "v1.37-observation-trace-v4",
          current: false,
        },
        workshop: {
          version: "workshop-contract-v1.19",
          current: false,
        },
        semanticTuple: {
          runtimeAbiVersion: "strategy-runtime-abi-v1.19",
          tupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_RECORD.tupleId,
        },
      },
    })
    if (result.status !== "reviewed_unsigned_candidate") {
      throw new Error(result.code)
    }
    expect(result.candidatePayload.runs).toHaveLength(3)
    expect(
      new Set(result.candidatePayload.runs.map((run) => run.workspaceId)).size,
    ).toBe(3)
    expect(
      new Set(result.candidatePayload.runs.map((run) => run.processId)).size,
    ).toBe(3)
    expect(childRunner).toHaveBeenCalledTimes(3)
  })

  it("rejects old, current, missing, implicit, or substituted candidate authority", () => {
    const exact = exactObservationV119CandidateBindings(repoRoot)
    const mutations: unknown[] = [
      null,
      { ...exact, corpus: { ...exact.corpus, version: "v2" } },
      { ...exact, corpus: { ...exact.corpus, current: true } },
      { ...exact, trace: { ...exact.trace, rootSha256: hash("active-trace") } },
      {
        ...exact,
        workshop: { ...exact.workshop, pinFileSha256: hash("substituted-pin") },
      },
      {
        ...exact,
        semanticTuple: {
          ...exact.semanticTuple,
          runtimeAbiVersion: "strategy-runtime-abi-v1.18",
        },
      },
    ]
    for (const candidateBindings of mutations) {
      expect(() =>
        certify(freshRun, candidateBindings as typeof exact),
      ).toThrow(/candidate binding/iu)
    }
  })

  it("fails closed on skip, fallback, synthetic evidence, mixed identity, or Phase-259 child substitution", () => {
    const mutations = [
      (value: V137ObservationV119FreshLanguageRun) => ({
        ...value,
        skippedCaseCount: 1,
      }),
      (value: V137ObservationV119FreshLanguageRun) => ({
        ...value,
        fallbackUsed: true,
      }),
      (value: V137ObservationV119FreshLanguageRun) => ({
        ...value,
        syntheticEvidence: true,
      }),
      (value: V137ObservationV119FreshLanguageRun) => ({
        ...value,
        identity: {
          ...value.identity,
          runtimeAbiVersion: "strategy-runtime-abi-v1.18",
        },
      }),
      (value: V137ObservationV119FreshLanguageRun) => ({
        ...value,
        candidateBindings: {
          ...value.candidateBindings,
          corpus: { ...value.candidateBindings.corpus, version: "v2" },
        },
      }),
    ]
    for (const mutate of mutations) {
      let ordinal = 0
      const result = certify((invocation) => {
        const value = freshRun(invocation)
        const output = ordinal === 2 ? mutate(value) : value
        ordinal += 1
        return output
      })
      expect(result).toMatchObject({
        status: "system_failure",
        candidatePayload: null,
      })
    }
  })

  it("keeps system failures public-safe and never emits current artifact references", () => {
    const result = certify(() => {
      throw new Error("source memory objective diagnostics stderr host path")
    })
    expect(JSON.stringify(result)).not.toMatch(
      /source memory|objective|diagnostics|stderr|host path/iu,
    )
    expect(JSON.stringify(exactObservationV119CandidateBindings(repoRoot))).not.toMatch(
      /registry\.json|v1\.37-language-conformance-/u,
    )
  })
})
