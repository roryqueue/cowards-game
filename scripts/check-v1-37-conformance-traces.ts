#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- repo-root checker binds the exact corpus authority.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- checker semantically admits every candidate trace.
import {
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
} from "../packages/golden/src/v1-37-conformance-trace.ts"
// eslint-disable-next-line no-restricted-imports -- use the existing canonical JSON codec.
import { encodeCanonicalJson, type JsonValue } from "../packages/spec/src/index.ts"
import {
  V137_CONFORMANCE_TRACE_BASELINE_VERSION,
  V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES,
  computeV137ConformanceTraceCandidateRoot,
  lockedV137CompatibilityCategoryRoots,
  type V137ConformanceTraceCandidateManifest,
  type V137ConformanceTraceProtectedCategory,
  type V137ConformanceTraceSemanticDiff,
} from "./generate-v1-37-conformance-traces.js"

export class V137ConformanceTraceCheckError extends Error {
  constructor(readonly code: string) {
    super(`Conformance trace check rejected: ${code}.`)
    this.name = "V137ConformanceTraceCheckError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceTraceCheckError(code)
}
const HASH = /^sha256:[0-9a-f]{64}$/u
const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`
const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonicalHash = (domain: string, value: JsonValue): string => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) return fail("CANONICAL_JSON_INVALID")
  return `sha256:${createHash("sha256")
    .update(`${domain}\0`, "utf8")
    .update(encoded.bytes)
    .digest("hex")}`
}
const readJson = <T>(filePath: string): T =>
  JSON.parse(readFileSync(filePath, "utf8")) as T
const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const keys = Object.keys(value)
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}

const expectedSemanticDiff = (
  manifest: V137ConformanceTraceCandidateManifest,
): V137ConformanceTraceSemanticDiff => {
  const baseline = lockedV137CompatibilityCategoryRoots()
  const candidate = manifest.compatibilityEvidence.protectedCategories
  const protectedCategories = Object.fromEntries(
    V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES.map((category) => [
      category,
      {
        baselineHash: baseline[category],
        candidateHash: candidate[category],
        changeCount: baseline[category] === candidate[category] ? 0 : 1,
      },
    ]),
  ) as V137ConformanceTraceSemanticDiff["protectedCategories"]
  const material = {
    schemaVersion: "v1.37-conformance-trace-semantic-diff-v1" as const,
    generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
    baselineVersion: V137_CONFORMANCE_TRACE_BASELINE_VERSION,
    candidateVersion: manifest.candidateVersion,
    corpusVersion: manifest.corpusVersion,
    corpusRootSha256: manifest.corpusRootSha256,
    candidateRootSha256: manifest.candidateRootSha256,
    caseDiffs: manifest.cases.map((entry) => ({
      ordinal: entry.ordinal,
      caseId: entry.caseId,
      baselineTraceRef: entry.traceRef,
      candidateTraceRoot: entry.traceRoot,
      resultClass: entry.resultClass,
    })),
    protectedCategories,
  }
  return {
    ...material,
    semanticDiffRootSha256: canonicalHash(
      "cowards-game:v1.37:conformance-trace-semantic-diff:v1",
      material as unknown as JsonValue,
    ),
  }
}

const manifestShapeValid = (
  manifest: V137ConformanceTraceCandidateManifest,
): boolean => {
  if (
    !exactKeys(manifest, [
      "schemaVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "generatedBy",
      "authoritySource",
      "recordingApi",
      "projectorApi",
      "policy",
      "caseCount",
      "cases",
      "compatibilityEvidence",
      "candidateRootSha256",
    ]) ||
    manifest.schemaVersion !== "v1.37-conformance-trace-candidate-v1" ||
    manifest.generatedBy !==
      "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.authoritySource !== "canonical-engine-kernel-recording" ||
    manifest.recordingApi !== "RecordedCanonicalTransitionV137" ||
    manifest.projectorApi !== "projectCanonicalConformanceTrace" ||
    manifest.policy !== "candidate-only-no-live-lane-oracle-no-promotion" ||
    !Array.isArray(manifest.cases) ||
    !HASH.test(manifest.candidateRootSha256)
  ) {
    return false
  }
  const evidence = manifest.compatibilityEvidence
  return (
    exactKeys(evidence, [
      "baselineVersion",
      "candidateCorpusVersion",
      "protectedCategories",
    ]) &&
    evidence.baselineVersion === V137_CONFORMANCE_TRACE_BASELINE_VERSION &&
    exactKeys(
      evidence.protectedCategories,
      V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES,
    ) &&
    V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES.every((category) =>
      HASH.test(evidence.protectedCategories[category]),
    )
  )
}

export const checkV137ConformanceTraceCandidate = ({
  candidateDirectory,
}: {
  readonly candidateDirectory: string
}): string[] => {
  const directory = path.resolve(candidateDirectory)
  const errors: string[] = []
  const manifestPath = path.join(directory, "manifest.json")
  const diffPath = path.join(directory, "semantic-diff.json")
  const tracesDirectory = path.join(directory, "traces")
  if (
    !existsSync(manifestPath) ||
    !existsSync(diffPath) ||
    !existsSync(tracesDirectory)
  ) {
    return ["candidate manifest, semantic diff, and traces directory are required"]
  }
  let manifest: V137ConformanceTraceCandidateManifest
  try {
    manifest = readJson(manifestPath)
  } catch {
    return ["candidate manifest is invalid JSON"]
  }
  if (
    readFileSync(manifestPath, "utf8") !== renderJson(manifest) ||
    !manifestShapeValid(manifest)
  ) {
    errors.push("candidate manifest shape or exact text is invalid")
    return errors
  }
  if (
    manifest.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    manifest.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length
  ) {
    errors.push("candidate corpus identity mismatch")
  }

  const expectedCaseIds = V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)
  const actualCaseIds = manifest.cases.map(({ caseId }) => caseId)
  if (JSON.stringify(actualCaseIds) !== JSON.stringify(expectedCaseIds)) {
    errors.push("candidate case inventory is missing, extra, or reordered")
  }
  const expectedTraceFiles = expectedCaseIds.map((caseId) => `${caseId}.json`)
  const actualTraceFiles = readdirSync(tracesDirectory).sort()
  if (JSON.stringify(actualTraceFiles) !== JSON.stringify(expectedTraceFiles)) {
    errors.push("candidate trace files are missing or extra")
  }

  for (const [ordinal, entry] of manifest.cases.entries()) {
    if (
      !exactKeys(entry, [
        "ordinal",
        "caseId",
        "traceRef",
        "resultClass",
        "tracePath",
        "traceFileSha256",
        "traceRoot",
      ]) ||
      entry.ordinal !== ordinal ||
      entry.caseId !== expectedCaseIds[ordinal] ||
      entry.tracePath !== path.posix.join("traces", `${entry.caseId}.json`) ||
      !HASH.test(entry.traceFileSha256) ||
      !HASH.test(entry.traceRoot)
    ) {
      errors.push(`candidate case ${ordinal} identity is invalid`)
      continue
    }
    const tracePath = path.join(directory, entry.tracePath)
    if (!existsSync(tracePath)) continue
    try {
      const trace = readJson<CanonicalConformanceTrace>(tracePath)
      const bytes = readFileSync(tracePath)
      if (bytes.toString("utf8") !== renderJson(trace)) {
        errors.push(`trace ${entry.caseId} exact text is invalid`)
      }
      if (
        sha256(bytes) !== entry.traceFileSha256 ||
        trace.traceRoot !== entry.traceRoot ||
        hashCanonicalConformanceTrace(trace) !== trace.traceRoot ||
        trace.caseId !== entry.caseId ||
        trace.corpusVersion !== manifest.corpusVersion ||
        trace.corpusRootSha256 !== manifest.corpusRootSha256 ||
        trace.semanticTupleId !== manifest.semanticTupleId ||
        trace.resultClass !== entry.resultClass ||
        compareCanonicalConformanceTrace({ expected: trace, actual: trace })
          .status !== "equal"
      ) {
        errors.push(`trace ${entry.caseId} identity or semantics mismatch`)
      }
    } catch {
      errors.push(`trace ${entry.caseId} is invalid`)
    }
  }
  if (
    computeV137ConformanceTraceCandidateRoot(manifest) !==
    manifest.candidateRootSha256
  ) {
    errors.push("candidate root mismatch")
  }

  try {
    const diff = readJson<V137ConformanceTraceSemanticDiff>(diffPath)
    if (
      readFileSync(diffPath, "utf8") !== renderJson(diff) ||
      !exactKeys(diff, [
        "schemaVersion",
        "generatedBy",
        "baselineVersion",
        "candidateVersion",
        "corpusVersion",
        "corpusRootSha256",
        "candidateRootSha256",
        "caseDiffs",
        "protectedCategories",
        "semanticDiffRootSha256",
      ]) ||
      Object.keys(diff).some((key) =>
        /status|review|approval|approved|compatible|disposition/iu.test(key),
      ) ||
      JSON.stringify(diff) !== JSON.stringify(expectedSemanticDiff(manifest))
    ) {
      errors.push("semantic diff mismatch or self-disposition")
    }
  } catch {
    errors.push("semantic diff is invalid")
  }
  return errors
}

export const assertV137ConformanceTraceCheckArgs = (
  args: readonly string[],
): { readonly candidateDirectory: string; readonly check: true } => {
  if (
    args.length !== 2 ||
    args[1] !== "--check" ||
    !args[0]?.startsWith("--candidate-dir=")
  ) {
    return fail("READ_ONLY_CHECK_ARGUMENTS")
  }
  const candidateDirectory = args[0].slice("--candidate-dir=".length)
  if (candidateDirectory.length === 0) return fail("READ_ONLY_CHECK_ARGUMENTS")
  return { candidateDirectory, check: true }
}

const main = (): void => {
  const args = assertV137ConformanceTraceCheckArgs(process.argv.slice(2))
  const errors = checkV137ConformanceTraceCandidate(args)
  if (errors.length > 0) throw new Error(errors.join("\n"))
  console.log(`v1.37 conformance trace candidate current: ${args.candidateDirectory}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
