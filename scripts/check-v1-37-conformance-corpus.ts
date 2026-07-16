#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- repo-root read-only checker consumes exact golden source contracts.
import {
  V1_37_CONFORMANCE_ACTIVE_REGISTRY,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  validateV137ConformanceCorpus,
  type V137ConformanceCorpus,
  type V137ConformanceRegistry,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const REGISTRY_PATH =
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json"
const GOLDEN_ROOT = "packages/golden/src/fixtures/v1-37-conformance-corpus"

export interface CheckCommittedV137ConformanceCorpusOptions {
  root?: string
  expectedCorpusRootSha256?: string
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
const sha256 = (bytes: Uint8Array): string =>
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
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion ||
    registry.path !== V1_37_CONFORMANCE_ACTIVE_REGISTRY.path
  ) {
    errors.push("active registry identity mismatch")
  }

  const corpusPath = path.join(root, registry.path)
  if (!existsSync(corpusPath)) {
    errors.push(`${registry.path} is missing`)
    return errors
  }
  let corpus: V137ConformanceCorpus
  try {
    corpus = readJson<V137ConformanceCorpus>(corpusPath)
    validateV137ConformanceCorpus(corpus)
  } catch (error) {
    errors.push(
      `${registry.path} failed validation: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return errors
  }
  const corpusBytes = readFileSync(corpusPath)
  if (sha256(corpusBytes) !== registry.corpusFileSha256) {
    errors.push(`${registry.path} exact committed bytes do not match registry`)
  }
  const expectedRoot =
    options.expectedCorpusRootSha256 ?? V1_37_CONFORMANCE_CORPUS_ROOT
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

  const activeDirectory = path.dirname(corpusPath)
  const unexpected = readdirSync(activeDirectory).filter(
    (filename) => filename !== "corpus.json",
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
    `v1.37 conformance corpus current: ${V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion} root=${V1_37_CONFORMANCE_CORPUS_ROOT}`,
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
