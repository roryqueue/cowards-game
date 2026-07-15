import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { basename } from "node:path"

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

type TestManifest = Readonly<{
  schemaVersion: "runtime-abi-v1.17-test-manifest-v1"
  activationPlan: "258-14"
  tests: readonly RuntimeAbiTestEntry[]
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

const sameStrings = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const assertExactRuntimeAbiTestCommand = (
  test: RuntimeAbiTestEntry,
): void => {
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
  for (const ownedFile of test.ownedFiles) {
    if (!output.includes(basename(ownedFile))) {
      throw new TypeError(`${test.id} omitted named file ${ownedFile}.`)
    }
  }
  if (test.expectedOutput.some((marker) => !output.includes(marker))) {
    throw new TypeError(`${test.id} omitted an exact output marker.`)
  }
  if (/\b(skip|skipped|todo)\b/iu.test(output) || /--- SKIP:/u.test(output)) {
    throw new TypeError(`${test.id} reported a skipped required result.`)
  }
  switch (test.kind) {
    case "vitest": {
      const fileCount = test.ownedFiles.length
      const testFiles = new RegExp(
        `Test Files\\s+${String(fileCount)} passed \\(${String(fileCount)}\\)`,
        "u",
      )
      if (!testFiles.test(output) || !/Tests\s+[1-9][0-9]* passed \([1-9][0-9]*\)/u.test(output)) {
        throw new TypeError(`${test.id} did not report structured Vitest PASS.`)
      }
      return
    }
    case "go":
      if (
        !output.includes(`=== RUN   ${test.namedResult}`) ||
        !output.includes(`--- PASS: ${test.namedResult}`) ||
        !/(?:^|\n)PASS(?:\n|$)/u.test(output)
      ) {
        throw new TypeError(`${test.id} did not report structured Go PASS.`)
      }
      return
    case "playwright":
      if (!/\b[1-9][0-9]* passed\b/u.test(output)) {
        throw new TypeError(`${test.id} did not report structured Playwright PASS.`)
      }
      return
    case "command":
      throw new TypeError(`${test.id} used an unsupported generic command.`)
  }
}

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
    validateRuntimeAbiTestResult(test, output)
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
