#!/usr/bin/env -S pnpm exec tsx
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

export const EXPECTED_TS_SENTINEL =
  "[EXPECTED_RED:MISSING_CANONICAL_JSON_TS_CODEC]" as const
export const EXPECTED_GO_SENTINEL =
  "[EXPECTED_RED:MISSING_CANONICAL_JSON_GO_CODEC]" as const

export type RedStage = "both-missing" | "go-missing" | "green"
type ConsumerLanguage = "TS" | "GO"
type ConsumerMode = "missing" | "green"

export interface ConsumerCommandResult {
  command: string
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
}

interface EvaluationInput {
  stage: RedStage
  vectorCount: number
  vectorRootSha256: string
  ts: ConsumerCommandResult
  go: ConsumerCommandResult
}

interface ReceiptConsumer {
  language: ConsumerLanguage
  command: string
  exitCode: number
  result: "expected-red" | "green"
  sentinel: typeof EXPECTED_TS_SENTINEL | typeof EXPECTED_GO_SENTINEL | null
  vectorCount: number
  vectorRootSha256: string
  enumerationSha256: string
}

export interface CanonicalJsonV11RedReceipt {
  schemaVersion: "canonical-json-v1.1-red-receipt-v1"
  profile: "canonical-json-v1"
  stage: RedStage
  vectorCount: number
  vectorRootSha256: string
  ownerPlans: {
    typescriptCodec: "258-03"
    goCodec: "258-04"
    greenRetirement: "258-11"
  }
  consumers: readonly ReceiptConsumer[]
}

interface CorpusIdentity {
  vectorCount: number
  vectorRootSha256: string
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const CANONICAL_JSON_RED_RECEIPT_PATH =
  ".planning/artifacts/v1.37-canonical-json-red.json" as const

const enumerationPattern =
  /\[CANONICAL_JSON_CORPUS:(TS|GO)\] count=(\d+) root=([a-f0-9]{64}) enumeration=([a-f0-9]{64})/g
const expectedRedPattern = /\[EXPECTED_RED:[A-Z0-9_]+\]/g
const infrastructureFailurePattern =
  /no test files|no tests found|cannot find module|failed to load|compile error|type error|configuration error|timed out|timeout|transform failed|syntaxerror|referenceerror/i
const forbiddenEmptyTestPattern = /passWithNoTests|\.skip\b|\.todo\b|\bpending\b/i

const expectedMode = (stage: RedStage, language: ConsumerLanguage): ConsumerMode => {
  if (stage === "both-missing") return "missing"
  if (stage === "go-missing") return language === "TS" ? "green" : "missing"
  return "green"
}

const parseEnumeration = (
  language: ConsumerLanguage,
  output: string,
): { count: number; root: string; enumeration: string; index: number } => {
  const matches = [...output.matchAll(enumerationPattern)].filter(
    (match) => match[1] === language,
  )
  if (matches.length !== 1) {
    throw new Error(`${language} must emit exactly one corpus enumeration; got ${matches.length}`)
  }
  const match = matches[0]!
  return {
    count: Number(match[2]),
    root: match[3]!,
    enumeration: match[4]!,
    index: match.index ?? -1,
  }
}

const validateConsumer = (
  language: ConsumerLanguage,
  mode: ConsumerMode,
  result: ConsumerCommandResult,
  identity: CorpusIdentity,
): ReceiptConsumer => {
  const output = `${result.stdout}\n${result.stderr}`
  if (result.timedOut) throw new Error(`${language} consumer timed out`)
  if (result.exitCode === null) throw new Error(`${language} consumer did not report an exit code`)
  if (infrastructureFailurePattern.test(output)) {
    throw new Error(`${language} consumer reported an infrastructure failure`)
  }
  if (forbiddenEmptyTestPattern.test(output)) {
    throw new Error(`${language} consumer used a forbidden empty-test mode`)
  }

  const enumeration = parseEnumeration(language, output)
  if (enumeration.count !== identity.vectorCount || enumeration.count === 0) {
    throw new Error(
      `${language} enumeration count mismatch: expected ${identity.vectorCount}, got ${enumeration.count}`,
    )
  }
  if (enumeration.root !== identity.vectorRootSha256) {
    throw new Error(`${language} enumeration root mismatch`)
  }

  const expectedSentinel =
    language === "TS" ? EXPECTED_TS_SENTINEL : EXPECTED_GO_SENTINEL
  const sentinels = output.match(expectedRedPattern) ?? []
  if (mode === "missing") {
    if (result.exitCode !== 1) {
      throw new Error(`${language} expected RED must exit exactly 1, got ${result.exitCode}`)
    }
    if (sentinels.length === 0 || sentinels.some((value) => value !== expectedSentinel)) {
      throw new Error(`${language} did not emit only its exact missing-codec sentinel`)
    }
    if (enumeration.index > output.indexOf(expectedSentinel)) {
      throw new Error(`${language} emitted its sentinel before full corpus enumeration`)
    }
  } else {
    if (result.exitCode !== 0) {
      throw new Error(`${language} green consumer exited ${result.exitCode}`)
    }
    if (sentinels.length > 0) {
      throw new Error(`${language} green consumer retained an expected-RED sentinel`)
    }
  }

  return {
    language,
    command: result.command,
    exitCode: result.exitCode,
    result: mode === "missing" ? "expected-red" : "green",
    sentinel: mode === "missing" ? expectedSentinel : null,
    vectorCount: enumeration.count,
    vectorRootSha256: enumeration.root,
    enumerationSha256: enumeration.enumeration,
  }
}

export const evaluateCanonicalJsonV11Red = (
  input: EvaluationInput,
): CanonicalJsonV11RedReceipt => {
  const identity = {
    vectorCount: input.vectorCount,
    vectorRootSha256: input.vectorRootSha256,
  }
  const ts = validateConsumer("TS", expectedMode(input.stage, "TS"), input.ts, identity)
  const go = validateConsumer("GO", expectedMode(input.stage, "GO"), input.go, identity)
  if (ts.enumerationSha256 !== go.enumerationSha256) {
    throw new Error("TS and Go corpus enumeration hashes differ")
  }
  return {
    schemaVersion: "canonical-json-v1.1-red-receipt-v1",
    profile: "canonical-json-v1",
    stage: input.stage,
    vectorCount: input.vectorCount,
    vectorRootSha256: input.vectorRootSha256,
    ownerPlans: {
      typescriptCodec: "258-03",
      goCodec: "258-04",
      greenRetirement: "258-11",
    },
    consumers: [ts, go],
  }
}

export const createCanonicalJsonV11RedReceipt = evaluateCanonicalJsonV11Red

const renderReceipt = (receipt: CanonicalJsonV11RedReceipt): string =>
  `${JSON.stringify(receipt, null, 2)}\n`

export const writeCanonicalJsonV11RedReceipt = (
  receipt: CanonicalJsonV11RedReceipt,
  receiptPath: string = path.join(repoRoot, CANONICAL_JSON_RED_RECEIPT_PATH),
): void => {
  mkdirSync(path.dirname(receiptPath), { recursive: true })
  writeFileSync(receiptPath, renderReceipt(receipt))
}

export const checkCanonicalJsonV11RedReceipt = (
  receipt: CanonicalJsonV11RedReceipt,
  receiptPath: string = path.join(repoRoot, CANONICAL_JSON_RED_RECEIPT_PATH),
): string[] => {
  if (!existsSync(receiptPath)) return [`${receiptPath} is missing`]
  return readFileSync(receiptPath, "utf8") === renderReceipt(receipt)
    ? []
    : [`${receiptPath} is stale`]
}

const run = (
  command: string,
  args: readonly string[],
  cwd: string,
): ConsumerCommandResult => {
  const completed = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 128 * 1024 * 1024,
  })
  return {
    command: [command, ...args].join(" "),
    exitCode: completed.status,
    stdout: completed.stdout ?? "",
    stderr: completed.stderr ?? "",
    timedOut: completed.error?.name === "ETIMEDOUT",
  }
}

const loadCorpusIdentity = (): CorpusIdentity => {
  const index = JSON.parse(
    readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json",
      ),
      "utf8",
    ),
  ) as CorpusIdentity
  if (
    !Number.isInteger(index.vectorCount) ||
    index.vectorCount <= 0 ||
    !/^[a-f0-9]{64}$/.test(index.vectorRootSha256)
  ) {
    throw new Error("canonical JSON corpus identity is invalid")
  }
  return index
}

const runCurrentConsumers = (stage: RedStage): CanonicalJsonV11RedReceipt => {
  const identity = loadCorpusIdentity()
  return evaluateCanonicalJsonV11Red({
    stage,
    ...identity,
    ts: run(
      "pnpm",
      ["exec", "vitest", "run", "packages/spec/src/canonical-json-corpus.test.ts"],
      repoRoot,
    ),
    go: run(
      "go",
      ["test", "-run", "^TestCanonicalJSONV11SharedCorpus$", "-count=1", "-v", "."],
      path.join(repoRoot, "apps/go-backend"),
    ),
  })
}

const parseStage = (args: readonly string[]): RedStage => {
  const position = args.indexOf("--stage")
  const stage = position >= 0 ? args[position + 1] : undefined
  if (stage !== "both-missing" && stage !== "go-missing" && stage !== "green") {
    throw new Error("--stage must be one of both-missing, go-missing, or green")
  }
  return stage
}

const main = (): void => {
  const args = process.argv.slice(2)
  const stage = parseStage(args)
  const receipt = runCurrentConsumers(stage)
  if (args.includes("--write")) writeCanonicalJsonV11RedReceipt(receipt)
  if (args.includes("--check")) {
    const errors = checkCanonicalJsonV11RedReceipt(receipt)
    if (errors.length > 0) throw new Error(errors.join("\n"))
  }
  console.log(
    `canonical JSON v1.1 stage ${stage}: ${receipt.vectorCount} vectors root=${receipt.vectorRootSha256}`,
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
