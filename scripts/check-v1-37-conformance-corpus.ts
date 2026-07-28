#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- repo-root read-only checker consumes exact golden source contracts.
import {
  validateV137ConformanceCorpus,
  type V137ConformanceCorpus,
  type V137ConformanceRegistry,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- the checker must use a literal reviewed pin independent of checked files.
import { V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN } from "../packages/golden/src/v1-37-conformance-corpus-pin.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const REGISTRY_PATH =
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json"
const GOLDEN_ROOT = "packages/golden/src/fixtures/v1-37-conformance-corpus"

export interface CheckCommittedV137ConformanceCorpusOptions {
  root?: string
}

export class V137ConformanceCheckError extends Error {
  constructor(readonly code: string) {
    super(`Conformance corpus check rejected: ${code}.`)
    this.name = "V137ConformanceCheckError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceCheckError(code)
}

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`
const sha256 = (bytes: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const readJson = <T>(absolutePath: string): T =>
  JSON.parse(readFileSync(absolutePath, "utf8")) as T

export const assertV137ConformanceCheckArgs = (
  args: readonly string[],
): { check: true } => {
  if (args.length !== 1 || args[0] !== "--check") {
    fail("READ_ONLY_CHECK_ARGUMENTS")
  }
  return { check: true }
}

export const checkCommittedV137ConformanceCorpus = (
  options: CheckCommittedV137ConformanceCorpusOptions = {},
): string[] => {
  const root = path.resolve(options.root ?? repoRoot)
  const errors: string[] = []
  const registryPath = path.join(root, REGISTRY_PATH)
  if (!existsSync(registryPath)) return [`${REGISTRY_PATH} is missing`]

  const registryBytes = readFileSync(registryPath)
  if (
    sha256(registryBytes) !==
    V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.registryFileSha256
  ) {
    errors.push("active registry exact bytes do not match reviewed pin")
  }
  let registry: V137ConformanceRegistry
  try {
    registry = readJson<V137ConformanceRegistry>(registryPath)
  } catch {
    return [`${REGISTRY_PATH} is invalid JSON`]
  }
  if (readFileSync(registryPath, "utf8") !== renderJson(registry)) {
    errors.push(`${REGISTRY_PATH} is not exact committed canonical text`)
  }
  if (
    registry.schemaVersion !== "v1.37-executable-conformance-registry-v1" ||
    registry.activeVersion !==
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.activeVersion ||
    registry.corpusRootSha256 !==
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusRootSha256 ||
    registry.corpusFileSha256 !==
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusFileSha256 ||
    registry.path !== V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.path
  ) {
    errors.push("active registry identity mismatch")
  }

  const corpusPath = path.join(root, V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.path)
  if (!existsSync(corpusPath)) {
    errors.push(`${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.path} is missing`)
    return errors
  }
  let corpus: V137ConformanceCorpus
  try {
    corpus = readJson<V137ConformanceCorpus>(corpusPath)
    validateV137ConformanceCorpus(corpus)
  } catch (error) {
    errors.push(
      `${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.path} failed validation: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return errors
  }
  const corpusBytes = readFileSync(corpusPath)
  if (
    sha256(corpusBytes) !==
    V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusFileSha256
  ) {
    errors.push("active corpus exact bytes do not match reviewed pin")
  }
  if (sha256(corpusBytes) !== registry.corpusFileSha256) {
    errors.push(
      `${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.path} exact committed bytes do not match registry`,
    )
  }
  const expectedRoot = V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusRootSha256
  if (corpus.corpusRootSha256 !== expectedRoot) {
    errors.push(
      `active corpus root mismatch: expected ${expectedRoot}, got ${corpus.corpusRootSha256}`,
    )
  }
  if (registry.corpusRootSha256 !== corpus.corpusRootSha256) {
    errors.push("active registry root does not match active corpus")
  }
  if (registry.activeVersion !== corpus.version) {
    errors.push("active registry version does not match active corpus")
  }
  const expectedPath = `${GOLDEN_ROOT}/${corpus.version}/corpus.json`
  if (registry.path !== expectedPath) {
    errors.push(`active registry path mismatch: expected ${expectedPath}`)
  }

  const reviewPath = path.join(
    root,
    V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.independentReviewPath,
  )
  if (!existsSync(reviewPath)) {
    errors.push(
      `${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.independentReviewPath} is missing`,
    )
  } else {
    const reviewBytes = readFileSync(reviewPath)
    const review = readJson<{
      candidateVersion: string
      candidateCorpusRootSha256: string
      caseChanges: unknown[]
      status: string
    }>(reviewPath)
    if (
      sha256(reviewBytes) !==
        V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.independentReviewFileSha256 ||
      review.candidateVersion !== corpus.version ||
      review.candidateCorpusRootSha256 !== corpus.corpusRootSha256 ||
      !Array.isArray(review.caseChanges) ||
      review.caseChanges.length !== 0 ||
      review.status !== "behavior_preserving_toolchain_repair"
    ) {
      errors.push("active independent review does not match reviewed pin")
    }
  }

  const activeDirectory = path.dirname(corpusPath)
  const unexpected = readdirSync(activeDirectory).filter(
    (filename) =>
      filename !== "corpus.json" &&
      filename !== "semantic-diff.json" &&
      filename !== "independent-review.json",
  )
  for (const filename of unexpected) {
    errors.push(
      `${path.posix.join(registry.path, "..", filename)} is unexpected`,
    )
  }
  return errors
}

const main = (): void => {
  assertV137ConformanceCheckArgs(process.argv.slice(2))
  const errors = checkCommittedV137ConformanceCorpus()
  if (errors.length > 0) {
    throw new Error(errors.join("\n"))
  }
  console.log(
    `v1.37 conformance corpus current: ${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.activeVersion} root=${V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusRootSha256}`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
