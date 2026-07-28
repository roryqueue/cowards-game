#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const candidateDirectory = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-conformance-corpus-candidates/v2",
)
const activeRoot = path.join(
  repoRoot,
  "packages/golden/src/fixtures/v1-37-conformance-corpus",
)
const activeDirectory = path.join(activeRoot, "v2")
const registryPath = path.join(activeRoot, "registry.json")
const pinPath = path.join(
  repoRoot,
  "packages/golden/src/v1-37-conformance-corpus-pin.ts",
)

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

export const promoteReviewedV137ConformanceCorpus = (): Readonly<{
  activeVersion: "v2"
  corpusRootSha256: `sha256:${string}`
  corpusFileSha256: `sha256:${string}`
  registryFileSha256: `sha256:${string}`
  independentReviewFileSha256: `sha256:${string}`
}> => {
  const corpusPath = path.join(candidateDirectory, "corpus.json")
  const diffPath = path.join(candidateDirectory, "semantic-diff.json")
  const reviewPath = path.join(candidateDirectory, "independent-review.json")
  const corpusBytes = readFileSync(corpusPath)
  const diffBytes = readFileSync(diffPath)
  const reviewBytes = readFileSync(reviewPath)
  const corpus = JSON.parse(corpusBytes.toString("utf8")) as {
    version: string
    corpusRootSha256: `sha256:${string}`
  }
  const diff = JSON.parse(diffBytes.toString("utf8")) as {
    sourceChanges: string[]
    caseChanges: string[]
  }
  const review = JSON.parse(reviewBytes.toString("utf8")) as {
    candidateVersion: string
    candidateCorpusRootSha256: string
    candidateCorpusFileSha256: string
    semanticDiffFileSha256: string
    sourceChanges: string[]
    caseChanges: string[]
    rust: {
      selectActivationsEquivalent: boolean
      soldierBrainEquivalent: boolean
    }
    zig: {
      selectActivationsEquivalent: boolean
      soldierBrainEquivalent: boolean
    }
    status: string
  }
  const corpusFileSha256 = sha256(corpusBytes)
  const diffFileSha256 = sha256(diffBytes)
  const independentReviewFileSha256 = sha256(reviewBytes)
  if (
    corpus.version !== "v2" ||
    review.candidateVersion !== "v2" ||
    review.candidateCorpusRootSha256 !== corpus.corpusRootSha256 ||
    review.candidateCorpusFileSha256 !== corpusFileSha256 ||
    review.semanticDiffFileSha256 !== diffFileSha256 ||
    JSON.stringify(diff.sourceChanges) !== JSON.stringify(["rust", "zig"]) ||
    JSON.stringify(review.sourceChanges) !==
      JSON.stringify(diff.sourceChanges) ||
    diff.caseChanges.length !== 0 ||
    review.caseChanges.length !== 0 ||
    review.status !== "behavior_preserving_toolchain_repair" ||
    !review.rust.selectActivationsEquivalent ||
    !review.rust.soldierBrainEquivalent ||
    !review.zig.selectActivationsEquivalent ||
    !review.zig.soldierBrainEquivalent
  ) {
    throw new TypeError("v1.37 conformance corpus review is invalid")
  }
  if (!existsSync(activeDirectory)) mkdirSync(activeDirectory)
  copyFileSync(corpusPath, path.join(activeDirectory, "corpus.json"))
  copyFileSync(diffPath, path.join(activeDirectory, "semantic-diff.json"))
  copyFileSync(
    reviewPath,
    path.join(activeDirectory, "independent-review.json"),
  )
  const registry = {
    schemaVersion: "v1.37-executable-conformance-registry-v1",
    activeVersion: "v2",
    corpusRootSha256: corpus.corpusRootSha256,
    corpusFileSha256,
    path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json",
  }
  const registryBytes = renderJson(registry)
  writeFileSync(registryPath, registryBytes)
  const registryFileSha256 = sha256(registryBytes)
  writeFileSync(
    pinPath,
    `export const V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN = Object.freeze({
  schemaVersion: "v1.37-executable-conformance-reviewed-pin-v1",
  reviewedUnder: "259-16-toolchain-revalidation",
  activeVersion: "v2",
  corpusRootSha256:
    "${corpus.corpusRootSha256}",
  corpusFileSha256:
    "${corpusFileSha256}",
  registryFileSha256:
    "${registryFileSha256}",
  independentReviewFileSha256:
    "${independentReviewFileSha256}",
  path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json",
  independentReviewPath:
    "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/independent-review.json",
  updatePolicy: "explicit-new-version-and-reviewed-pin-change",
} as const)
`,
  )
  return Object.freeze({
    activeVersion: "v2",
    corpusRootSha256: corpus.corpusRootSha256,
    corpusFileSha256,
    registryFileSha256,
    independentReviewFileSha256,
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(JSON.stringify(promoteReviewedV137ConformanceCorpus()))
}
