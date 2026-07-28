/* eslint-disable no-restricted-imports -- Retained candidate provenance is intentionally outside the public barrel. */
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD } from "../packages/spec/src/integrity-authority.js"
import {
  RETAINED_V1_37_CANDIDATE_HASHES,
  candidateArtifactPath,
  candidateHashVectorsArtifactPath,
  checkV137KernelIntegrityCandidateArtifacts,
} from "./generate-v1-37-kernel-integrity-candidate.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const sha256File = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

describe("retained v1.37 kernel candidate provenance", () => {
  it("pins the immutable preactivation artifact and vectors byte-for-byte", () => {
    expect(checkV137KernelIntegrityCandidateArtifacts()).toEqual([])
    expect(
      Object.fromEntries(
        Object.keys(RETAINED_V1_37_CANDIDATE_HASHES).map((relativePath) => [
          relativePath,
          sha256File(relativePath),
        ]),
      ),
    ).toEqual(RETAINED_V1_37_CANDIDATE_HASHES)
  })

  it("keeps retained candidate status and historical tuple inactive", () => {
    const artifact = JSON.parse(
      readFileSync(path.join(repoRoot, candidateArtifactPath), "utf8"),
    ) as {
      status: string
      publicationAllowed: boolean
      countedExecutionAllowed: boolean
      candidate: {
        candidateTupleId: string
        activation: Record<string, boolean>
      }
    }
    expect(artifact).toMatchObject({
      status: "inactive-candidate",
      publicationAllowed: false,
      countedExecutionAllowed: false,
    })
    expect(artifact.candidate.candidateTupleId).toBe(
      HISTORICAL_RUNTIME_V114_SEMANTIC_TUPLE_RECORD.tupleId,
    )
    expect(
      Object.values(artifact.candidate.activation).every((value) => !value),
    ).toBe(true)
    expect(
      readFileSync(path.join(repoRoot, "packages/spec/src/index.ts"), "utf8"),
    ).not.toContain("integrity-authority-candidate-v1-37")
    expect(sha256File(candidateHashVectorsArtifactPath)).toBe(
      RETAINED_V1_37_CANDIDATE_HASHES[candidateHashVectorsArtifactPath],
    )
  })

  it("checks provenance and refuses candidate regeneration", () => {
    const checked = spawnSync(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/generate-v1-37-kernel-integrity-candidate.ts",
        "--check",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    )
    expect(checked.status, checked.stderr).toBe(0)
    const writeAttempt = spawnSync(
      "pnpm",
      [
        "exec",
        "tsx",
        "scripts/generate-v1-37-kernel-integrity-candidate.ts",
        "--write",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    )
    expect(writeAttempt.status).not.toBe(0)
    expect(writeAttempt.stderr).toContain("immutable")
  })
})
