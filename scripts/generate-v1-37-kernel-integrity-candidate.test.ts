/* eslint-disable no-restricted-imports -- The candidate is intentionally absent from the public spec barrel. */
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  CURRENT_AUTHORITY_BYTE_BASELINE,
  assertInactiveV137KernelIntegrityCandidate,
} from "../packages/spec/src/integrity-authority-candidate-v1-37.js"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  encodeCanonicalCompatibilityTuple,
  hashCanonicalCompatibilityTuple,
  resolveCanonicalCompatibilityTuple,
} from "../packages/spec/src/integrity-authority.js"
import {
  candidateArtifactPath,
  candidateHashVectorsArtifactPath,
  buildV137KernelIntegrityCandidateArtifact,
  buildV137KernelIntegrityCandidateHashVectors,
  renderV137KernelIntegrityCandidateArtifact,
  renderV137KernelIntegrityCandidateHashVectors,
} from "./generate-v1-37-kernel-integrity-candidate.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const sha256File = (relativePath: string): string =>
  createHash("sha256")
    .update(readFileSync(path.join(repoRoot, relativePath)))
    .digest("hex")

describe("v1.37 kernel integrity candidate generator", () => {
  it("renders byte-identical inactive candidate artifacts", () => {
    const artifact = buildV137KernelIntegrityCandidateArtifact()
    const vectors = buildV137KernelIntegrityCandidateHashVectors()
    const renderedArtifact = renderV137KernelIntegrityCandidateArtifact()
    const renderedVectors = renderV137KernelIntegrityCandidateHashVectors()

    expect(renderV137KernelIntegrityCandidateArtifact(artifact)).toBe(
      renderedArtifact,
    )
    expect(renderV137KernelIntegrityCandidateHashVectors(vectors)).toBe(
      renderedVectors,
    )
    expect(
      readFileSync(path.join(repoRoot, candidateArtifactPath), "utf8"),
    ).toBe(renderedArtifact)
    expect(
      readFileSync(
        path.join(repoRoot, candidateHashVectorsArtifactPath),
        "utf8",
      ),
    ).toBe(renderedVectors)
    expect(artifact).toMatchObject({
      status: "inactive-candidate",
      trustState: "untrusted-non-publishable",
      publicationAllowed: false,
      countedExecutionAllowed: false,
    })
    expect(
      assertInactiveV137KernelIntegrityCandidate(artifact.candidate),
    ).toBeDefined()
  })

  it("publishes exact valid, mixed, partial, and old-current vectors", () => {
    const artifact = buildV137KernelIntegrityCandidateHashVectors()
    expect(artifact.vectors.map(({ name }) => name)).toEqual([
      "valid-inactive-candidate",
      "mixed-candidate-current-chronicle",
      "partial-candidate-missing-arena",
      "old-current-registered",
    ])

    const valid = artifact.vectors[0]!
    expect(valid.candidateAcceptance).toBe("accept-inactive-only")
    expect(valid.currentAcceptance).toBe("reject")
    expect(resolveCanonicalCompatibilityTuple(valid.selector)).toBeUndefined()
    expect(valid.sha256).toBe(
      hashCanonicalCompatibilityTuple(valid.selector.tuple),
    )
    expect(valid.encodedBytesHex).toBe(
      Buffer.from(
        encodeCanonicalCompatibilityTuple(valid.selector.tuple),
      ).toString("hex"),
    )

    const mixed = artifact.vectors[1]!
    expect(mixed.candidateAcceptance).toBe("reject-mixed")
    expect(mixed.currentAcceptance).toBe("reject")
    expect(resolveCanonicalCompatibilityTuple(mixed.selector)).toBeUndefined()

    const partial = artifact.vectors[2]!
    expect(partial.candidateAcceptance).toBe("reject-partial")
    expect(partial.currentAcceptance).toBe("reject")
    expect(partial.encodedBytesHex).toBeNull()
    expect(partial.sha256).toBeNull()

    const current = artifact.vectors[3]!
    expect(current.candidateAcceptance).toBe("reject-current")
    expect(current.currentAcceptance).toBe("accept-current-only")
    expect(resolveCanonicalCompatibilityTuple(current.selector)).toEqual(
      CANONICAL_COMPATIBILITY_TUPLES[0],
    )
  })

  it("keeps every current authority byte invariant and check mode clean", () => {
    expect(
      Object.fromEntries(
        Object.keys(CURRENT_AUTHORITY_BYTE_BASELINE).map((relativePath) => [
          relativePath,
          sha256File(relativePath),
        ]),
      ),
    ).toEqual(CURRENT_AUTHORITY_BYTE_BASELINE)

    const publicBarrel = readFileSync(
      path.join(repoRoot, "packages/spec/src/index.ts"),
      "utf8",
    )
    expect(publicBarrel).not.toContain(
      "integrity-authority-candidate-v1-37",
    )
    expect(publicBarrel).not.toContain(
      "INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE",
    )
    expect(publicBarrel).not.toContain(
      "V1_37_KERNEL_CANDIDATE_EVENT_VOCABULARY",
    )

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
  })
})
