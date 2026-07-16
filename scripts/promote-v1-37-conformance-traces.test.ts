/// <reference types="node" />

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { generateV137ConformanceTraceCandidate } from "./generate-v1-37-conformance-traces.js"
import {
  checkActiveV137ConformanceTrace,
  promoteV137ConformanceTraceCandidate,
} from "./promote-v1-37-conformance-traces.js"
import { writeV137ConformanceTraceIndependentReview } from "./review-v1-37-conformance-trace-diff.js"

const roots: string[] = []
const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-promote-"))
  roots.push(root)
  return root
}
const render = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true })
  }
})

const reviewedCandidate = () => {
  const root = temporaryRoot()
  const repoRoot = path.join(root, "repo")
  const candidateDirectory = path.join(root, "candidate")
  const independentReviewPath = path.join(
    candidateDirectory,
    "independent-review.json",
  )
  generateV137ConformanceTraceCandidate({
    candidateVersion: "v1.37-conformance-trace-v999",
    candidateDirectory,
  })
  writeV137ConformanceTraceIndependentReview({
    candidateDirectory,
    outputPath: independentReviewPath,
  })
  return { repoRoot, candidateDirectory, independentReviewPath }
}

describe("v1.37 conformance trace promotion", () => {
  it("installs exact reviewed bytes before atomically advancing the active registry", () => {
    const input = reviewedCandidate()
    const registry = promoteV137ConformanceTraceCandidate(input)

    expect(registry).toMatchObject({
      schemaVersion: "v1.37-conformance-trace-registry-v1",
      activeVersion: "v1.37-conformance-trace-v999",
      caseCount: 16,
    })
    expect(checkActiveV137ConformanceTrace(input)).toEqual([])

    const activeDirectory = path.join(input.repoRoot, registry.activePath)
    expect(
      readFileSync(path.join(activeDirectory, "independent-review.json")),
    ).toEqual(readFileSync(input.independentReviewPath))
    expect(
      JSON.parse(
        readFileSync(
          path.join(activeDirectory, "compatibility-disposition.json"),
          "utf8",
        ),
      ),
    ).toMatchObject({
      status: "no_semantic_delta",
      approval: null,
      candidateRootSha256: registry.candidateRootSha256,
    })
  }, 120_000)

  it("rejects candidate changes after review and generic or forged review labels", () => {
    const changedCandidate = reviewedCandidate()
    const manifestPath = path.join(
      changedCandidate.candidateDirectory,
      "manifest.json",
    )
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    manifest.caseCount += 1
    writeFileSync(manifestPath, render(manifest))
    expect(() =>
      promoteV137ConformanceTraceCandidate(changedCandidate),
    ).toThrow(/CANDIDATE_CHECK_FAILED/u)

    const forgedReview = reviewedCandidate()
    const review = JSON.parse(
      readFileSync(forgedReview.independentReviewPath, "utf8"),
    )
    review.status = "approved"
    writeFileSync(forgedReview.independentReviewPath, render(review))
    expect(() => promoteV137ConformanceTraceCandidate(forgedReview)).toThrow(
      /INDEPENDENT_REVIEW_BINDING_MISMATCH/u,
    )
  }, 180_000)

  it("never overwrites an installed directory or registry and detects active tampering", () => {
    const input = reviewedCandidate()
    const registry = promoteV137ConformanceTraceCandidate(input)
    expect(() => promoteV137ConformanceTraceCandidate(input)).toThrow(
      /ACTIVE_EVIDENCE_IMMUTABLE/u,
    )

    const dispositionPath = path.join(
      input.repoRoot,
      registry.activePath,
      "compatibility-disposition.json",
    )
    const disposition = JSON.parse(readFileSync(dispositionPath, "utf8"))
    disposition.status = "reviewed"
    writeFileSync(dispositionPath, render(disposition))
    expect(checkActiveV137ConformanceTrace(input)).not.toEqual([])
  }, 120_000)
})
