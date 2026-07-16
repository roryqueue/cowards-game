import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export type RuntimeAbiTestStage =
  | "preactivation"
  | "activation"
  | "postactivation"

export type RuntimeAbiTestEntry = Readonly<{
  id: string
  stage: RuntimeAbiTestStage
  kind: "vitest" | "go" | "playwright" | "command"
  command: readonly [string, string, ...string[]]
  workingDirectory?: string
  namedResult: string
  expectedOutput: readonly string[]
  ownedFiles: readonly string[]
  database?: Readonly<{
    dsnEnvironmentVariable: string
    skipAllowed: false
  }>
}>

export type RuntimeAbiTestManifest = Readonly<{
  schemaVersion: "runtime-abi-v1.17-test-manifest-v1"
  activationPlan: "258-14"
  tests: readonly RuntimeAbiTestEntry[]
}>

export const RUNTIME_ABI_TEST_MANIFEST_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json" as const
export const RUNTIME_ABI_TEST_RECEIPT_PATH =
  "packages/spec/artifacts/runtime-abi-v1.17-test-receipt.json" as const

export interface RuntimeAbiTestReceiptResult {
  id: string
  stage: RuntimeAbiTestStage
  kind: RuntimeAbiTestEntry["kind"]
  namedResult: string
  ownedFiles: readonly string[]
  status: "PASS"
  passedCount: number
  skippedCount: 0
  databaseRequired: boolean
  databaseObserved: boolean
}

export interface RuntimeAbiTestReceipt {
  schemaVersion: "runtime-abi-v1.17-test-receipt-v1"
  activationPlan: "258-14"
  stage: RuntimeAbiTestStage
  testManifestSha256: `sha256:${string}`
  selectedCommandCount: number
  results: readonly RuntimeAbiTestReceiptResult[]
}

const stageRank: Readonly<Record<RuntimeAbiTestStage, number>> = {
  preactivation: 0,
  activation: 1,
  postactivation: 2,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const stages = new Set<RuntimeAbiTestStage>([
  "preactivation",
  "activation",
  "postactivation",
])

const sameStrings = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const assertExactRuntimeAbiTestCommand = (test: RuntimeAbiTestEntry): void => {
  switch (test.kind) {
    case "vitest": {
      const prefix = ["pnpm", "exec", "vitest", "run", "--reporter=verbose"]
      let fileIndex = prefix.length
      if (!sameStrings(test.command.slice(0, prefix.length), prefix)) {
        throw new TypeError(`Runtime ABI test lacks exact command: ${test.id}`)
      }
      if (test.command[fileIndex] === "--maxWorkers=1") fileIndex += 1
      if (
        test.workingDirectory !== undefined ||
        !sameStrings(test.command.slice(fileIndex), test.ownedFiles)
      ) {
        throw new TypeError(`Runtime ABI test lacks exact command: ${test.id}`)
      }
      return
    }
    case "go": {
      const expected = [
        "go",
        "test",
        ".",
        "-run",
        `^${test.namedResult}$`,
        "-v",
        "-count=1",
      ]
      if (
        test.workingDirectory !== "apps/go-backend" ||
        !sameStrings(test.command, expected)
      ) {
        throw new TypeError(`Runtime ABI test lacks exact command: ${test.id}`)
      }
      return
    }
    case "playwright": {
      if (
        test.workingDirectory !== undefined ||
        test.ownedFiles.length !== 1 ||
        !sameStrings(test.command, [
          "pnpm",
          "exec",
          "playwright",
          "test",
          test.ownedFiles[0]!,
          "--project=desktop",
        ])
      ) {
        throw new TypeError(`Runtime ABI test lacks exact command: ${test.id}`)
      }
      return
    }
    case "command":
      throw new TypeError(`Runtime ABI test lacks exact command: ${test.id}`)
  }
}

export const validateRuntimeAbiTestResult = (
  test: RuntimeAbiTestEntry,
  output: string,
): void => {
  if (/\b(no tests|0 tests|zero tests)\b/iu.test(output)) {
    throw new TypeError(`${test.id} reported zero tests.`)
  }
  if (test.kind !== "go") {
    for (const ownedFile of test.ownedFiles) {
      if (!output.includes(basename(ownedFile))) {
        throw new TypeError(`${test.id} omitted named file ${ownedFile}.`)
      }
    }
  }
  if (test.expectedOutput.some((marker) => !output.includes(marker))) {
    throw new TypeError(`${test.id} omitted an exact output marker.`)
  }
  switch (test.kind) {
    case "vitest": {
      const fileCount = test.ownedFiles.length
      const testFiles = new RegExp(
        `Test Files\\s+${String(fileCount)} passed \\(${String(fileCount)}\\)`,
        "u",
      )
      if (
        /(?:^|\n)\s*(?:Test Files|Tests)\s+.*\b(?:skipped|todo)\b/iu.test(
          output,
        )
      ) {
        throw new TypeError(`${test.id} reported a skipped required result.`)
      }
      if (
        !testFiles.test(output) ||
        !/Tests\s+[1-9][0-9]* passed \([1-9][0-9]*\)/u.test(output)
      ) {
        throw new TypeError(`${test.id} did not report structured Vitest PASS.`)
      }
      return
    }
    case "go":
      if (/--- SKIP:/u.test(output)) {
        throw new TypeError(`${test.id} reported a skipped required result.`)
      }
      if (
        !output.includes(`=== RUN   ${test.namedResult}`) ||
        !output.includes(`--- PASS: ${test.namedResult}`) ||
        !/(?:^|\n)PASS(?:\n|$)/u.test(output)
      ) {
        throw new TypeError(`${test.id} did not report structured Go PASS.`)
      }
      return
    case "playwright":
      if (/(?:^|\n)\s*[1-9][0-9]*\s+(?:skipped|did not run)\b/iu.test(output)) {
        throw new TypeError(`${test.id} reported a skipped required result.`)
      }
      if (!/\b[1-9][0-9]* passed\b/u.test(output)) {
        throw new TypeError(
          `${test.id} did not report structured Playwright PASS.`,
        )
      }
      return
    case "command":
      throw new TypeError(`${test.id} used an unsupported generic command.`)
  }
}

export const projectRuntimeAbiTestResult = (
  test: RuntimeAbiTestEntry,
  output: string,
  databaseObserved: boolean,
): RuntimeAbiTestReceiptResult => {
  validateRuntimeAbiTestResult(test, output)
  let passedCount: number
  switch (test.kind) {
    case "vitest": {
      const match =
        /(?:^|\n)\s*Tests\s+([1-9][0-9]*) passed \([1-9][0-9]*\)/u.exec(output)
      if (match?.[1] === undefined) {
        throw new TypeError(`${test.id} omitted the structured Vitest count.`)
      }
      passedCount = Number(match[1])
      break
    }
    case "go":
      passedCount = 1
      break
    case "playwright": {
      const match = /\b([1-9][0-9]*) passed\b/u.exec(output)
      if (match?.[1] === undefined) {
        throw new TypeError(
          `${test.id} omitted the structured Playwright count.`,
        )
      }
      passedCount = Number(match[1])
      break
    }
    case "command":
      throw new TypeError(`${test.id} used an unsupported generic command.`)
  }
  const databaseRequired = test.database !== undefined
  if (databaseObserved !== databaseRequired) {
    throw new TypeError(`${test.id} has inconsistent database observation.`)
  }
  return {
    id: test.id,
    stage: test.stage,
    kind: test.kind,
    namedResult: test.namedResult,
    ownedFiles: [...test.ownedFiles],
    status: "PASS",
    passedCount,
    skippedCount: 0,
    databaseRequired,
    databaseObserved,
  }
}

export const validateGoTestSourceOwnership = (
  test: RuntimeAbiTestEntry,
  repoRoot: string,
): void => {
  if (
    test.kind !== "go" ||
    test.workingDirectory === undefined ||
    test.ownedFiles.length !== 1
  ) {
    throw new TypeError(`${test.id} lacks exact owned Go source.`)
  }
  const checkerPath = fileURLToPath(
    new URL("./check-go-test-source-ownership.go", import.meta.url),
  )
  const result = spawnSync(
    "go",
    [
      "run",
      checkerPath,
      "--working-directory",
      resolve(repoRoot, test.workingDirectory),
      "--test",
      test.namedResult,
      "--owned-file",
      resolve(repoRoot, test.ownedFiles[0]!),
    ],
    {
      cwd: repoRoot,
      env: process.env,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    },
  )
  if (result.status !== 0) {
    const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim()
    throw new TypeError(
      `${test.id} lacks exact owned Go source${detail === "" ? "." : `: ${detail}`}`,
    )
  }
}

export const parseRuntimeAbiTestManifest = (
  value: unknown,
): RuntimeAbiTestManifest => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== "runtime-abi-v1.17-test-manifest-v1" ||
    value.activationPlan !== "258-14" ||
    !Array.isArray(value.tests) ||
    value.tests.length === 0
  ) {
    throw new TypeError("Runtime ABI test manifest is malformed.")
  }
  const tests = value.tests.map((raw): RuntimeAbiTestEntry => {
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      !/^[a-z0-9][a-z0-9._:-]+$/u.test(raw.id) ||
      typeof raw.stage !== "string" ||
      !stages.has(raw.stage as RuntimeAbiTestStage) ||
      (raw.kind !== "vitest" &&
        raw.kind !== "go" &&
        raw.kind !== "playwright" &&
        raw.kind !== "command") ||
      !Array.isArray(raw.command) ||
      raw.command.length < 3 ||
      raw.command.some(
        (part) => typeof part !== "string" || part.length === 0,
      ) ||
      typeof raw.namedResult !== "string" ||
      raw.namedResult.length === 0 ||
      !Array.isArray(raw.expectedOutput) ||
      raw.expectedOutput.length === 0 ||
      raw.expectedOutput.some((part) => typeof part !== "string") ||
      !Array.isArray(raw.ownedFiles) ||
      raw.ownedFiles.length === 0 ||
      raw.ownedFiles.some((path) => typeof path !== "string")
    ) {
      throw new TypeError("Runtime ABI test entry is malformed.")
    }
    const command = raw.command as [string, string, ...string[]]
    if (
      command.length <= 3 &&
      command.some((part) => part === "test" || part.endsWith(":test"))
    ) {
      throw new TypeError(
        `Generic package test command is forbidden: ${raw.id}`,
      )
    }
    let database: RuntimeAbiTestEntry["database"]
    if (raw.database !== undefined) {
      if (
        !isRecord(raw.database) ||
        typeof raw.database.dsnEnvironmentVariable !== "string" ||
        raw.database.skipAllowed !== false
      ) {
        throw new TypeError(`Database test may skip: ${raw.id}`)
      }
      database = {
        dsnEnvironmentVariable: raw.database.dsnEnvironmentVariable,
        skipAllowed: false,
      }
    }
    const test: RuntimeAbiTestEntry = {
      id: raw.id,
      stage: raw.stage as RuntimeAbiTestStage,
      kind: raw.kind,
      command,
      ...(typeof raw.workingDirectory === "string"
        ? { workingDirectory: raw.workingDirectory }
        : {}),
      namedResult: raw.namedResult,
      expectedOutput: raw.expectedOutput as string[],
      ownedFiles: raw.ownedFiles as string[],
      ...(database === undefined ? {} : { database }),
    }
    assertExactRuntimeAbiTestCommand(test)
    return test
  })
  if (new Set(tests.map(({ id }) => id)).size !== tests.length) {
    throw new TypeError("Runtime ABI test manifest has duplicate ids.")
  }
  for (const requiredStage of stages) {
    if (!tests.some(({ stage }) => stage === requiredStage)) {
      throw new TypeError(
        `Runtime ABI test manifest has no ${requiredStage} test.`,
      )
    }
  }
  return {
    schemaVersion: value.schemaVersion,
    activationPlan: value.activationPlan,
    tests,
  }
}

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  )
}

const manifestSha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const selectedRuntimeAbiTests = (
  manifest: RuntimeAbiTestManifest,
  stage: RuntimeAbiTestStage,
): readonly RuntimeAbiTestEntry[] =>
  manifest.tests.filter((test) => stageRank[test.stage] <= stageRank[stage])

export const createRuntimeAbiTestReceipt = (input: {
  stage: RuntimeAbiTestStage
  manifestBytes: Uint8Array
  manifest: RuntimeAbiTestManifest
  results: readonly RuntimeAbiTestReceiptResult[]
}): RuntimeAbiTestReceipt => {
  const selected = selectedRuntimeAbiTests(input.manifest, input.stage)
  if (selected.length === 0 || input.results.length !== selected.length) {
    throw new TypeError("Runtime ABI test receipt is partial.")
  }
  for (const [index, test] of selected.entries()) {
    const result = input.results[index]
    if (
      result === undefined ||
      result.id !== test.id ||
      result.stage !== test.stage ||
      result.kind !== test.kind ||
      result.namedResult !== test.namedResult ||
      !sameStrings(result.ownedFiles, test.ownedFiles) ||
      result.status !== "PASS" ||
      !Number.isSafeInteger(result.passedCount) ||
      result.passedCount <= 0 ||
      result.skippedCount !== 0 ||
      result.databaseRequired !== (test.database !== undefined) ||
      result.databaseObserved !== (test.database !== undefined)
    ) {
      throw new TypeError(
        `Runtime ABI test receipt result is invalid: ${test.id}`,
      )
    }
  }
  return {
    schemaVersion: "runtime-abi-v1.17-test-receipt-v1",
    activationPlan: "258-14",
    stage: input.stage,
    testManifestSha256: manifestSha256(input.manifestBytes),
    selectedCommandCount: selected.length,
    results: input.results.map((result) => ({
      ...result,
      ownedFiles: [...result.ownedFiles],
    })),
  }
}

export const parseRuntimeAbiTestReceipt = (
  value: unknown,
  options: {
    manifestBytes: Uint8Array
    manifest: RuntimeAbiTestManifest
    requiredStage: RuntimeAbiTestStage
  },
): RuntimeAbiTestReceipt => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "activationPlan",
      "results",
      "schemaVersion",
      "selectedCommandCount",
      "stage",
      "testManifestSha256",
    ]) ||
    value.schemaVersion !== "runtime-abi-v1.17-test-receipt-v1" ||
    value.activationPlan !== "258-14" ||
    value.stage !== options.requiredStage ||
    value.testManifestSha256 !== manifestSha256(options.manifestBytes) ||
    !Number.isSafeInteger(value.selectedCommandCount) ||
    !Array.isArray(value.results)
  ) {
    throw new TypeError("Runtime ABI test receipt is malformed or stale.")
  }
  const results = value.results.map((raw): RuntimeAbiTestReceiptResult => {
    if (
      !isRecord(raw) ||
      !exactKeys(raw, [
        "databaseObserved",
        "databaseRequired",
        "id",
        "kind",
        "namedResult",
        "ownedFiles",
        "passedCount",
        "skippedCount",
        "stage",
        "status",
      ]) ||
      typeof raw.id !== "string" ||
      !stages.has(raw.stage as RuntimeAbiTestStage) ||
      (raw.kind !== "vitest" &&
        raw.kind !== "go" &&
        raw.kind !== "playwright") ||
      typeof raw.namedResult !== "string" ||
      !Array.isArray(raw.ownedFiles) ||
      raw.ownedFiles.some((entry) => typeof entry !== "string") ||
      raw.status !== "PASS" ||
      !Number.isSafeInteger(raw.passedCount) ||
      Number(raw.passedCount) <= 0 ||
      raw.skippedCount !== 0 ||
      typeof raw.databaseRequired !== "boolean" ||
      typeof raw.databaseObserved !== "boolean"
    ) {
      throw new TypeError("Runtime ABI test receipt result is malformed.")
    }
    return {
      id: raw.id,
      stage: raw.stage as RuntimeAbiTestStage,
      kind: raw.kind,
      namedResult: raw.namedResult,
      ownedFiles: raw.ownedFiles as string[],
      status: "PASS",
      passedCount: Number(raw.passedCount),
      skippedCount: 0,
      databaseRequired: raw.databaseRequired,
      databaseObserved: raw.databaseObserved,
    }
  })
  if (value.selectedCommandCount !== results.length) {
    throw new TypeError("Runtime ABI test receipt count is partial.")
  }
  return createRuntimeAbiTestReceipt({
    stage: options.requiredStage,
    manifestBytes: options.manifestBytes,
    manifest: options.manifest,
    results,
  })
}

export const checkRuntimeAbiTestReceipt = (
  requiredStage: RuntimeAbiTestStage = "postactivation",
): RuntimeAbiTestReceipt => {
  const manifestBytes = readFileSync(RUNTIME_ABI_TEST_MANIFEST_PATH)
  const manifest = parseRuntimeAbiTestManifest(
    JSON.parse(manifestBytes.toString("utf8")) as unknown,
  )
  const receipt = JSON.parse(
    readFileSync(RUNTIME_ABI_TEST_RECEIPT_PATH, "utf8"),
  ) as unknown
  return parseRuntimeAbiTestReceipt(receipt, {
    manifestBytes,
    manifest,
    requiredStage,
  })
}

const writeRuntimeAbiTestReceipt = (receipt: RuntimeAbiTestReceipt): void => {
  const temporaryPath = `${RUNTIME_ABI_TEST_RECEIPT_PATH}.tmp-${String(process.pid)}`
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`, {
      flag: "wx",
    })
    renameSync(temporaryPath, RUNTIME_ABI_TEST_RECEIPT_PATH)
  } finally {
    rmSync(temporaryPath, { force: true })
  }
}

export const runRuntimeAbiTestManifest = (options: {
  stage: RuntimeAbiTestStage
  requireAll: boolean
  writeReceipt?: boolean | undefined
}): RuntimeAbiTestReceipt => {
  if (
    options.writeReceipt &&
    (!options.requireAll || options.stage !== "postactivation")
  ) {
    throw new TypeError(
      "Runtime ABI receipt writing requires postactivation --require-all.",
    )
  }
  const manifestBytes = readFileSync(RUNTIME_ABI_TEST_MANIFEST_PATH)
  const manifest = parseRuntimeAbiTestManifest(
    JSON.parse(manifestBytes.toString("utf8")) as unknown,
  )
  const selected = selectedRuntimeAbiTests(manifest, options.stage)
  if (selected.length === 0) throw new TypeError("Zero tests selected.")
  let completed = 0
  const receiptResults: RuntimeAbiTestReceiptResult[] = []
  for (const test of selected) {
    let databaseObserved = false
    if (test.database !== undefined) {
      const value = process.env[test.database.dsnEnvironmentVariable]
      if (value === undefined || value.trim() === "") {
        throw new TypeError(
          `${test.id} requires ${test.database.dsnEnvironmentVariable}.`,
        )
      }
      databaseObserved = true
    }
    if (test.kind === "go") {
      validateGoTestSourceOwnership(test, process.cwd())
    }
    const [executable, ...args] = test.command
    const result = spawnSync(executable, args, {
      cwd: test.workingDirectory ?? process.cwd(),
      env: process.env,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    })
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
    process.stdout.write(result.stdout ?? "")
    process.stderr.write(result.stderr ?? "")
    if (result.status !== 0) {
      throw new TypeError(
        `${test.id} failed with status ${String(result.status)}.`,
      )
    }
    receiptResults.push(
      projectRuntimeAbiTestResult(test, output, databaseObserved),
    )
    completed += 1
  }
  if (options.requireAll && completed !== selected.length) {
    throw new TypeError("Not every selected manifest test ran.")
  }
  console.log(
    `runtime-abi-v1.17 ${options.stage} test manifest: PASS (${selected.length} commands)`,
  )
  const receipt = createRuntimeAbiTestReceipt({
    stage: options.stage,
    manifestBytes,
    manifest,
    results: receiptResults,
  })
  if (options.writeReceipt) writeRuntimeAbiTestReceipt(receipt)
  return receipt
}

const stageArgument = process.argv.indexOf("--stage")
if (stageArgument >= 0) {
  const stage = process.argv[stageArgument + 1] as
    | RuntimeAbiTestStage
    | undefined
  if (stage === undefined || !stages.has(stage)) {
    throw new TypeError(
      "Expected --stage preactivation|activation|postactivation.",
    )
  }
  runRuntimeAbiTestManifest({
    stage,
    requireAll: process.argv.includes("--require-all"),
    writeReceipt: process.argv.includes("--write-receipt"),
  })
}
