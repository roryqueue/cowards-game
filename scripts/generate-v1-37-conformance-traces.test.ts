/// <reference types="node" />

import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// eslint-disable-next-line no-restricted-imports -- repo-root governance test exercises the exact golden source contract.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
  generateV137ConformanceTraceCandidate,
  parseV137ConformanceTraceReviewedHistory,
  parseV137ConformanceTraceCandidateArgs,
  readV137ConformanceTraceReviewedHistory,
  type V137ConformanceTraceReviewedHistory,
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
      candidateVersion: "v1.37-conformance-trace-v2",
      candidateDirectory,
    })
    const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8"))
    const traceNames = readdirSync(path.join(candidateDirectory, "traces"))

    expect(manifest).toMatchObject({
      schemaVersion: "v1.37-conformance-trace-candidate-v1",
      candidateVersion: "v1.37-conformance-trace-v2",
      corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      generatedBy: "scripts/generate-v1-37-conformance-traces.ts",
      authoritySource: "canonical-engine-kernel-recording",
      recordingApi: "RecordedCanonicalTransitionV137",
      policy: "candidate-only-no-live-lane-oracle-no-promotion",
      caseCount: V1_37_CONFORMANCE_CORPUS.cases.length,
    })
    expect(
      manifest.cases.map(({ caseId }: { caseId: string }) => caseId),
    ).toEqual(V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id))
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
  }, 30_000)

  it("generates each success from its exact execution mode and case seed", () => {
    const candidateDirectory = path.join(temporaryRoot(), "candidate")
    generateV137ConformanceTraceCandidate({
      candidateVersion: "v1.37-conformance-trace-v2",
      candidateDirectory,
    })
    const trace = (caseId: string) =>
      JSON.parse(
        readFileSync(
          path.join(candidateDirectory, "traces", `${caseId}.json`),
          "utf8",
        ),
      )
    const negativeZero = trace("boundary-numeric-negative-zero")
    const unicode = trace("boundary-unicode-scalar")
    const normative = trace("normative-first-active-turn-to-stone")
    const seeded = trace("property-seeded-selection-seed-003")

    expect(negativeZero.transitions).toEqual([])
    expect(unicode.transitions).toEqual([])
    expect(
      [...negativeZero.invocations, ...unicode.invocations].every(
        ({ gameplayMutation }: { gameplayMutation: boolean }) =>
          gameplayMutation === false,
      ),
    ).toBe(true)
    expect(normative.transitions.length).toBeGreaterThan(0)
    expect(seeded.transitions.length).toBeGreaterThan(0)
    expect(normative.traceRoot).not.toBe(seeded.traceRoot)
  }, 30_000)

  it("refuses active paths, version reuse, existing candidates, and live-lane arguments", () => {
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v2",
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
      candidateVersion: "v1.37-conformance-trace-v2",
      candidateDirectory,
    })
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v2",
        candidateDirectory,
      }),
    ).toThrow("CANDIDATE_DIRECTORY_EXISTS")
    const reviewedVersionDirectory = path.join(
      temporaryRoot(),
      "reviewed-version",
    )
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v1",
        candidateDirectory: reviewedVersionDirectory,
      }),
    ).toThrow("REVIEWED_VERSION_ROOT_MISMATCH")
    expect(existsSync(reviewedVersionDirectory)).toBe(false)
    expect(
      readdirSync(path.dirname(reviewedVersionDirectory)).some((entry) =>
        entry.includes(".reviewed-version.staging-"),
      ),
    ).toBe(false)
    expect(() =>
      parseV137ConformanceTraceCandidateArgs([
        "--candidate-version=v2",
        "--candidate-dir=.planning/tmp/v2",
        "--lane=typescript",
      ]),
    ).toThrow("CANDIDATE_ARGUMENTS")
  }, 30_000)

  it("rejects disallowed and symlinked candidate parents before writing", () => {
    const root = temporaryRoot()
    const realParent = path.join(root, "real-parent")
    const linkedParent = path.join(root, "linked-parent")
    mkdirSync(realParent)
    symlinkSync(realParent, linkedParent)

    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v3",
        candidateDirectory: path.join(linkedParent, "candidate"),
      }),
    ).toThrow("CANDIDATE_PARENT_SYMLINK_FORBIDDEN")
    expect(readdirSync(realParent)).toEqual([])

    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v3",
        candidateDirectory: path.join(process.cwd(), "candidate-forbidden"),
      }),
    ).toThrow("CANDIDATE_PARENT_FORBIDDEN")
  })

  it("loads strict append-only reviewed version history", () => {
    const history = readV137ConformanceTraceReviewedHistory()
    expect(
      history.entries.map(({ candidateVersion }) => candidateVersion),
    ).toEqual(["v1.37-conformance-trace-v1", "v1.37-conformance-trace-v2"])
    expect(
      parseV137ConformanceTraceReviewedHistory(
        globalThis.structuredClone(history),
      ),
    ).toEqual(history)

    type MutableHistory = Omit<
      V137ConformanceTraceReviewedHistory,
      "entries"
    > & {
      entries: Array<{
        ordinal: number
        candidateVersion: string
        computedCandidateRootSha256: string
        status: "no_semantic_delta" | "suspended_pending_approval"
      }>
    }
    const duplicate = globalThis.structuredClone(history) as MutableHistory
    duplicate.entries.push({ ...duplicate.entries[0]! })
    expect(() => parseV137ConformanceTraceReviewedHistory(duplicate)).toThrow(
      "REVIEW_HISTORY_INVALID",
    )

    const changedRoot = globalThis.structuredClone(history) as MutableHistory
    changedRoot.entries[0]!.computedCandidateRootSha256 = `sha256:${"f".repeat(64)}`
    expect(() => parseV137ConformanceTraceReviewedHistory(changedRoot)).toThrow(
      "REVIEW_HISTORY_INVALID",
    )
  })

  it("changes candidate identity when the bound corpus identity changes", () => {
    const changedCorpus = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
    changedCorpus.cases[0]!.expectation.reasonCode = "CHANGED_EXPECTATION"
    expect(() =>
      generateV137ConformanceTraceCandidate({
        candidateVersion: "v1.37-conformance-trace-v2",
        candidateDirectory: path.join(temporaryRoot(), "candidate"),
        corpus: changedCorpus,
      }),
    ).toThrow("ACTIVE_CORPUS_IDENTITY_REQUIRED")
  })
})
