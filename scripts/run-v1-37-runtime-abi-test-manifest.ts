import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

export type RuntimeAbiTestStage =
  | "preactivation"
  | "activation"
  | "postactivation"

type TestEntry = Readonly<{
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

type TestManifest = Readonly<{
  schemaVersion: "runtime-abi-v1.17-test-manifest-v1"
  activationPlan: "258-14"
  tests: readonly TestEntry[]
}>

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

export const parseRuntimeAbiTestManifest = (value: unknown): TestManifest => {
  if (
    !isRecord(value) ||
    value.schemaVersion !== "runtime-abi-v1.17-test-manifest-v1" ||
    value.activationPlan !== "258-14" ||
    !Array.isArray(value.tests) ||
    value.tests.length === 0
  ) {
    throw new TypeError("Runtime ABI test manifest is malformed.")
  }
  const tests = value.tests.map((raw): TestEntry => {
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
      raw.command.some((part) => typeof part !== "string" || part.length === 0) ||
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
      throw new TypeError(`Generic package test command is forbidden: ${raw.id}`)
    }
    let database: TestEntry["database"]
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
    return {
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
  })
  if (new Set(tests.map(({ id }) => id)).size !== tests.length) {
    throw new TypeError("Runtime ABI test manifest has duplicate ids.")
  }
  return {
    schemaVersion: value.schemaVersion,
    activationPlan: value.activationPlan,
    tests,
  }
}

export const runRuntimeAbiTestManifest = (options: {
  stage: RuntimeAbiTestStage
  requireAll: boolean
}): void => {
  const manifest = parseRuntimeAbiTestManifest(
    JSON.parse(
      readFileSync(
        "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
        "utf8",
      ),
    ) as unknown,
  )
  const selected = manifest.tests.filter(
    ({ stage }) => stageRank[stage] <= stageRank[options.stage],
  )
  if (selected.length === 0) throw new TypeError("Zero tests selected.")
  for (const test of selected) {
    if (test.database !== undefined) {
      const value = process.env[test.database.dsnEnvironmentVariable]
      if (value === undefined || value.trim() === "") {
        throw new TypeError(
          `${test.id} requires ${test.database.dsnEnvironmentVariable}.`,
        )
      }
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
      throw new TypeError(`${test.id} failed with status ${String(result.status)}.`)
    }
    if (
      /\b(no tests|0 tests|zero tests)\b/iu.test(output) ||
      test.expectedOutput.some((marker) => !output.includes(marker))
    ) {
      throw new TypeError(`${test.id} did not report every named result.`)
    }
    if (
      test.database !== undefined &&
      (/\bskip(?:ped)?\b/iu.test(output) || /--- SKIP:/u.test(output))
    ) {
      throw new TypeError(`${test.id} skipped a required database result.`)
    }
  }
  if (options.requireAll && selected.length !== manifest.tests.filter(
    ({ stage }) => stageRank[stage] <= stageRank[options.stage],
  ).length) {
    throw new TypeError("Not every selected manifest test ran.")
  }
  console.log(
    `runtime-abi-v1.17 ${options.stage} test manifest: PASS (${selected.length} commands)`,
  )
}

const stageArgument = process.argv.indexOf("--stage")
if (stageArgument >= 0) {
  const stage = process.argv[stageArgument + 1] as RuntimeAbiTestStage | undefined
  if (stage === undefined || !stages.has(stage)) {
    throw new TypeError("Expected --stage preactivation|activation|postactivation.")
  }
  runRuntimeAbiTestManifest({
    stage,
    requireAll: process.argv.includes("--require-all"),
  })
}
