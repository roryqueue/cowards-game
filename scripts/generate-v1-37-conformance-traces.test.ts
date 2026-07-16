/// <reference types="node" />

import { createHash } from "node:crypto"
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
  generateV137ConformanceTraceCandidate,
  parseV137ConformanceTraceCandidateArgs,
} from "./generate-v1-37-conformance-traces.js"

const roots: string[] = []
const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-trace-"))
  roots.push(root)
  return root
}
const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true })
  }
})

describe("v1.37 conformance trace candidate generation", () => {
  it("writes one new exact kernel-recorded trace per ordered corpus case", () => {
    const candidateDirectory = path.join(
      temporaryRoot(),
      "v1.37-conformance-trace-v1",
    )
    const result = generateV137ConformanceTraceCandidate({
      candidateVersion: "v1.37-conformance-trace-v1",
      candidateDirectory,
    })
    const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8"))
    const traceNames = readdirSync(path.join(candidateDirectory, "traces"))

    expect(manifest).toMatchObject({
      schemaVersion: "v1.37-conformance-trace-candidate-v1",
      candidateVersion: "v1.37-conformance-trace-v1",
      corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      generatedBy: "scripts/generate-v1-37-conformance-traces.ts",
      authoritySource: "canonical-engine-kernel-recording",
      recordingApi: "RecordedCanonicalTransitionV137",
      policy: "candidate-only-no-live-lane-oracle-no-promotion",
      caseCount: V1_37_CONFORMANCE_CORPUS.cases.length,
    })
    expect(manifest.cases.map(({ caseId }: { caseId: string }) => caseId)).toEqual(
      V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id),
    )
    expect(traceNames).toEqual(
      V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => `${id}.json`),
    )
    expect(result.candidateRootSha256).toBe(manifest.candidateRootSha256)
    expect(result.manifestFileSha256).toBe(
      sha256(readFileSync(result.manifestPath)),
    )
    expect(JSON.stringify(manifest)).not.toMatch(
      /laneOutput|typescriptOracle|approval|approved|disposition/iu,
    )
  })

  it("refuses active paths, version reuse, existing candidates, and live-lane arguments", () => {
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v1",
        candidateDirectory: ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
      }),
    ).toThrow("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.4-locked-compatibility-v1",
        candidateDirectory: path.join(temporaryRoot(), "candidate"),
      }),
    ).toThrow("BASELINE_VERSION_REUSE_FORBIDDEN")

    const candidateDirectory = path.join(temporaryRoot(), "candidate")
    generateV137ConformanceTraceCandidate({
      candidateVersion: "v1.37-conformance-trace-v1",
      candidateDirectory,
    })
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v1",
        candidateDirectory,
      }),
    ).toThrow("CANDIDATE_DIRECTORY_EXISTS")
    expect(() =>
      parseV137ConformanceTraceCandidateArgs([
        "--candidate-version=v2",
        "--candidate-dir=.planning/tmp/v2",
        "--lane=typescript",
      ]),
    ).toThrow("CANDIDATE_ARGUMENTS")
  })

  it("changes candidate identity when the bound corpus identity changes", () => {
    const changedCorpus = globalThis.structuredClone(
      V1_37_CONFORMANCE_CORPUS,
    )
    changedCorpus.cases[0]!.expectation.reasonCode = "CHANGED_EXPECTATION"
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v1",
        candidateDirectory: path.join(temporaryRoot(), "candidate"),
        corpus: changedCorpus,
      }),
    ).toThrow("ACTIVE_CORPUS_IDENTITY_REQUIRED")
  })
})
