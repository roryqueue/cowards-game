#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/index.ts"
import {
  analyzeV137Phase257CoreRulesResult,
  assertV137IntegrityPublicPayload,
  checkV137Phase257CoreRulesResult,
  renderV137Phase257CoreRulesResultJson,
  renderV137Phase257CoreRulesResultMarkdown,
} from "./check-v1-37-integrity-boundaries.ts"

export const v137BrowserPlaywrightArtifactPath =
  ".planning/artifacts/v1.37-phase-257-browser-playwright.json" as const
export const v137KernelIntegrityArtifactPaths = {
  json: ".planning/artifacts/v1.37-kernel-integrity-proof.json",
  markdown: ".planning/artifacts/v1.37-kernel-integrity-proof.md",
} as const

export const requiredV137KernelRequirements = [
  "KERN-01",
  "KERN-02",
  "KERN-03",
  "KERN-04",
  "KERN-05",
  "KERN-06",
  "KERN-07",
  "KERN-08",
  "KERN-09",
  "KERN-10",
  "KERN-11",
] as const
export const requiredV137DecisionIds = [
  "D-01",
  "D-02",
  "D-03",
  "D-04",
  "D-05",
  "D-06",
  "D-07",
  "D-08",
  "D-09",
  "D-10",
  "D-11",
  "D-12",
  "D-13",
  "D-14",
  "D-15",
  "D-16",
] as const
export const requiredV137GateIds = [
  "workspace-build",
  "workspace-unit",
  "persistence-postgresql",
  "go-backend-postgresql",
  "v1.36-historical-proof",
  "v1.37-integrity-authority",
  "v1.37-current-event-coverage",
  "v1.37-executable-reference-inventory",
  "v1.37-integrity-boundaries",
  "web-unit",
  "phase257-browser-playwright",
  "default-boundary-monitors",
] as const

const targetFile = "apps/web/e2e/v1-37-rules-integrity-proof.spec.ts"
const targetTitle =
  "result, APIs, and replay share one realistic public-safe terminal receipt"
const targetBasename = path.basename(targetFile)
const requiredProjects = ["desktop", "mobile", "tablet"] as const
const sha256Pattern = /^[a-f0-9]{64}$/u
const phase19ActivationCommit = "3642493db803a8f68e3863777cc66dd6609ee93d"
const promotedTupleId =
  "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae"
const limitations = [
  "phase258-canonical-json-not-proved",
  "phase259-four-language-conformance-not-proved",
  "phase261-live-service-topology-not-proved",
  "cycle-start-backstab-simplification-deferred",
  "post-advance-hold-simplification-deferred",
] as const

interface BrowserTestReceipt {
  project: string
  file: string
  title: string
  status: "passed"
  durationMs: number
}

export interface V137BrowserPlaywrightReceipt {
  schemaVersion: "v1.37-phase-257-browser-playwright-v1"
  run: {
    commandId: "phase257-root-playwright-one-worker"
    ci: true
    workers: 1
    exitCode: 0
    reportSha256: string
    startedAt: string
    durationMs: number
    expected: number
    skipped: 0
    unexpected: 0
    flaky: 0
  }
  tests: BrowserTestReceipt[]
}

export interface V137WorkingCopyReceipt {
  schemaVersion: string
  protectedFiles: Array<{
    path: string
    beforeBytesSha256: string
    afterBytesSha256: string
    beforeBinaryDiffSha256: string
    afterBinaryDiffSha256: string
    preserved: boolean
  }>
  generatedFile: {
    path: string
    beforeBytesSha256: string
    afterRestoreBytesSha256: string
    preserved: boolean
  }
}

interface HashedFile {
  id?: string
  path: string
  sha256: string
}

export interface V137KernelIntegrityProof {
  schemaVersion: "v1.37-kernel-integrity-proof-v1"
  scope: {
    phase: 257
    posture: "service-contract-backed fixture"
  }
  activation: {
    commit: string
    tupleId: string
  }
  coverage: {
    requirements: Array<{ id: string; status: "proved" }>
    decisions: Array<{ id: string; status: "proved" }>
  }
  inputs: { files: Array<Required<HashedFile>> }
  sourceManifest: { files: HashedFile[] }
  browser: { path: typeof v137BrowserPlaywrightArtifactPath; sha256: string }
  workingCopy: V137WorkingCopyReceipt
  gates: Array<{ id: string; status: "passed"; inputSha256s: string[] }>
  limitations: string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const exactKeys = (
  value: unknown,
  keys: readonly string[],
  label: string,
): string[] => {
  if (!isRecord(value)) return [`${label} must be an object`]
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
    ? []
    : [`${label} keys must be exactly ${expected.join(", ")}`]
}

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0

const comparePaths = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0

export const parseV137KernelIntegrityArgs = (
  args: readonly string[],
): { mode: "write" | "check"; runBrowser: boolean } => {
  if (
    args.length === 2 &&
    args[0] === "--write" &&
    args[1] === "--run-browser"
  ) {
    return { mode: "write", runBrowser: true }
  }
  if (args.length === 1 && args[0] === "--check") {
    return { mode: "check", runBrowser: false }
  }
  throw new Error("usage: --write --run-browser | --check")
}

const collectRawTests = (
  report: Record<string, unknown>,
): Array<Record<string, unknown>> => {
  const collected: Array<Record<string, unknown>> = []
  const visitSuite = (suite: unknown): void => {
    if (!isRecord(suite)) throw new Error("Playwright suite must be an object")
    const specs = suite.specs ?? []
    const childSuites = suite.suites ?? []
    if (!Array.isArray(specs) || !Array.isArray(childSuites)) {
      throw new Error("Playwright suite shape is invalid")
    }
    for (const spec of specs) {
      const specFile =
        isRecord(spec) && typeof spec.file === "string"
          ? spec.file.replaceAll("\\", "/")
          : ""
      const targetPathMatch =
        specFile === targetFile ||
        specFile === targetBasename ||
        specFile.endsWith(`/${targetFile}`)
      if (
        !isRecord(spec) ||
        !targetPathMatch ||
        spec.title !== targetTitle ||
        !Array.isArray(spec.tests)
      ) {
        throw new Error("Playwright report contains a wrong file or test")
      }
      for (const test of spec.tests) {
        if (!isRecord(test))
          throw new Error("Playwright test must be an object")
        collected.push(test)
      }
    }
    for (const child of childSuites) visitSuite(child)
  }
  if (!Array.isArray(report.suites) || report.suites.length === 0) {
    throw new Error("Playwright report has an empty suite")
  }
  for (const suite of report.suites) visitSuite(suite)
  return collected
}

export const projectV137BrowserPlaywrightReceipt = (
  reportValue: unknown,
  input: { exitCode: number; reportSha256: string },
): V137BrowserPlaywrightReceipt => {
  if (input.exitCode !== 0)
    throw new Error(`Playwright exit code ${input.exitCode}`)
  if (!sha256Pattern.test(input.reportSha256))
    throw new Error("invalid report SHA-256")
  if (!isRecord(reportValue) || !isRecord(reportValue.stats)) {
    throw new Error("Playwright report shape is invalid")
  }
  const report = reportValue
  const statsValue = report.stats
  if (!isRecord(statsValue)) throw new Error("Playwright stats are invalid")
  const stats = statsValue
  if (!Array.isArray(report.errors) || report.errors.length !== 0) {
    throw new Error("Playwright global errors are forbidden")
  }
  for (const key of ["skipped", "unexpected", "flaky"] as const) {
    if (stats[key] !== 0)
      throw new Error(`Playwright ${key} count must be zero`)
  }
  if (
    stats.expected !== requiredProjects.length ||
    typeof stats.startTime !== "string" ||
    !isNonNegativeNumber(stats.duration)
  ) {
    throw new Error("Playwright stats are invalid")
  }

  const tests = collectRawTests(report)
    .map((test): BrowserTestReceipt => {
      if (
        test.expectedStatus !== "passed" ||
        typeof test.projectName !== "string" ||
        !requiredProjects.includes(
          test.projectName as (typeof requiredProjects)[number],
        ) ||
        !Array.isArray(test.results) ||
        test.results.length !== 1
      ) {
        throw new Error(
          "Playwright test status, project, or result count is invalid",
        )
      }
      const result = test.results[0]
      if (
        !isRecord(result) ||
        result.status !== "passed" ||
        result.retry !== 0 ||
        result.error !== undefined ||
        !Array.isArray(result.errors) ||
        result.errors.length !== 0 ||
        !Array.isArray(result.stdout) ||
        result.stdout.length !== 0 ||
        !Array.isArray(result.stderr) ||
        result.stderr.length !== 0 ||
        !Array.isArray(result.attachments) ||
        result.attachments.length !== 0 ||
        !isNonNegativeNumber(result.duration)
      ) {
        throw new Error(
          "Playwright retry, error, output, attachment, or duration is invalid",
        )
      }
      return {
        project: test.projectName,
        file: targetFile,
        title: targetTitle,
        status: "passed",
        durationMs: result.duration,
      }
    })
    .sort((left, right) => left.project.localeCompare(right.project))

  if (
    tests.length !== requiredProjects.length ||
    tests.some((test, index) => test.project !== requiredProjects[index])
  ) {
    throw new Error(
      "Playwright evidence must contain exactly desktop, mobile, and tablet",
    )
  }

  const receipt: V137BrowserPlaywrightReceipt = {
    schemaVersion: "v1.37-phase-257-browser-playwright-v1",
    run: {
      commandId: "phase257-root-playwright-one-worker",
      ci: true,
      workers: 1,
      exitCode: 0,
      reportSha256: input.reportSha256,
      startedAt: stats.startTime,
      durationMs: stats.duration,
      expected: stats.expected as number,
      skipped: 0,
      unexpected: 0,
      flaky: 0,
    },
    tests,
  }
  const findings = validateV137BrowserPlaywrightReceipt(receipt)
  if (findings.length > 0) throw new Error(findings.join("; "))
  return receipt
}

export const validateV137BrowserPlaywrightReceipt = (
  receipt: unknown,
): string[] => {
  const findings = exactKeys(
    receipt,
    ["schemaVersion", "run", "tests"],
    "browser receipt",
  )
  if (!isRecord(receipt)) return findings
  if (receipt.schemaVersion !== "v1.37-phase-257-browser-playwright-v1")
    findings.push("browser schemaVersion is invalid")
  findings.push(
    ...exactKeys(
      receipt.run,
      [
        "commandId",
        "ci",
        "workers",
        "exitCode",
        "reportSha256",
        "startedAt",
        "durationMs",
        "expected",
        "skipped",
        "unexpected",
        "flaky",
      ],
      "browser run",
    ),
  )
  if (!isRecord(receipt.run)) return findings
  if (
    receipt.run.commandId !== "phase257-root-playwright-one-worker" ||
    receipt.run.ci !== true ||
    receipt.run.workers !== 1 ||
    receipt.run.exitCode !== 0
  )
    findings.push("browser command contract is invalid")
  if (!sha256Pattern.test(String(receipt.run.reportSha256)))
    findings.push("browser report hash is invalid")
  if (
    typeof receipt.run.startedAt !== "string" ||
    !Number.isFinite(Date.parse(receipt.run.startedAt)) ||
    !isNonNegativeNumber(receipt.run.durationMs) ||
    receipt.run.expected !== requiredProjects.length ||
    receipt.run.skipped !== 0 ||
    receipt.run.unexpected !== 0 ||
    receipt.run.flaky !== 0
  )
    findings.push("browser run counts or timing are invalid")
  if (!Array.isArray(receipt.tests) || receipt.tests.length !== 3)
    return [...findings, "browser tests must contain exactly three rows"]
  receipt.tests.forEach((test, index) => {
    findings.push(
      ...exactKeys(
        test,
        ["project", "file", "title", "status", "durationMs"],
        `browser test ${index}`,
      ),
    )
    if (
      !isRecord(test) ||
      test.project !== requiredProjects[index] ||
      test.file !== targetFile ||
      test.title !== targetTitle ||
      test.status !== "passed" ||
      !isNonNegativeNumber(test.durationMs)
    )
      findings.push(`browser test ${index} is invalid`)
  })
  return findings
}

export const createV137KernelIntegrityProof = (input: {
  browserReceipt: V137BrowserPlaywrightReceipt
  browserReceiptSha256: string
  workingCopyReceipt: V137WorkingCopyReceipt
  inputFiles: Array<Required<HashedFile>>
  manifestFiles: HashedFile[]
}): V137KernelIntegrityProof => ({
  schemaVersion: "v1.37-kernel-integrity-proof-v1",
  scope: { phase: 257, posture: "service-contract-backed fixture" },
  activation: {
    commit: phase19ActivationCommit,
    tupleId: promotedTupleId,
  },
  coverage: {
    requirements: requiredV137KernelRequirements.map((id) => ({
      id,
      status: "proved",
    })),
    decisions: requiredV137DecisionIds.map((id) => ({ id, status: "proved" })),
  },
  inputs: {
    files: [...input.inputFiles].sort((a, b) => comparePaths(a.path, b.path)),
  },
  sourceManifest: {
    files: [...input.manifestFiles].sort((a, b) =>
      comparePaths(a.path, b.path),
    ),
  },
  browser: {
    path: v137BrowserPlaywrightArtifactPath,
    sha256: input.browserReceiptSha256,
  },
  workingCopy: input.workingCopyReceipt,
  gates: requiredV137GateIds.map((id) => ({
    id,
    status: "passed",
    inputSha256s:
      id === "phase257-browser-playwright"
        ? [input.browserReceiptSha256]
        : input.inputFiles.map(({ sha256 }) => sha256).sort(),
  })),
  limitations: [...limitations],
})

const validateHashedFiles = (
  files: unknown,
  label: string,
  withId: boolean,
): string[] => {
  if (!Array.isArray(files) || files.length === 0)
    return [`${label} must be a non-empty array`]
  const findings: string[] = []
  let previous = ""
  files.forEach((file, index) => {
    findings.push(
      ...exactKeys(
        file,
        withId ? ["id", "path", "sha256"] : ["path", "sha256"],
        `${label} ${index}`,
      ),
    )
    if (
      !isRecord(file) ||
      typeof file.path !== "string" ||
      file.path.length === 0 ||
      !sha256Pattern.test(String(file.sha256))
    )
      findings.push(`${label} ${index} is invalid`)
    if (
      isRecord(file) &&
      withId &&
      (typeof file.id !== "string" || file.id.length === 0)
    )
      findings.push(`${label} ${index} id is invalid`)
    if (isRecord(file) && typeof file.path === "string" && file.path < previous)
      findings.push(`${label} must be sorted by path`)
    if (isRecord(file) && typeof file.path === "string") previous = file.path
  })
  return findings
}

export const validateV137KernelIntegrityProof = (proof: unknown): string[] => {
  const findings = exactKeys(
    proof,
    [
      "schemaVersion",
      "scope",
      "activation",
      "coverage",
      "inputs",
      "sourceManifest",
      "browser",
      "workingCopy",
      "gates",
      "limitations",
    ],
    "proof",
  )
  if (!isRecord(proof)) return findings
  if (proof.schemaVersion !== "v1.37-kernel-integrity-proof-v1")
    findings.push("proof schemaVersion is invalid")
  findings.push(
    ...exactKeys(proof.scope, ["phase", "posture"], "scope"),
    ...exactKeys(proof.activation, ["commit", "tupleId"], "activation"),
    ...exactKeys(proof.coverage, ["requirements", "decisions"], "coverage"),
    ...exactKeys(proof.inputs, ["files"], "inputs"),
    ...exactKeys(proof.sourceManifest, ["files"], "sourceManifest"),
    ...exactKeys(proof.browser, ["path", "sha256"], "browser"),
    ...exactKeys(
      proof.workingCopy,
      ["schemaVersion", "protectedFiles", "generatedFile"],
      "workingCopy",
    ),
  )
  if (
    !isRecord(proof.scope) ||
    proof.scope.phase !== 257 ||
    proof.scope.posture !== "service-contract-backed fixture"
  )
    findings.push("proof scope is invalid")
  if (
    !isRecord(proof.activation) ||
    proof.activation.commit !== phase19ActivationCommit ||
    proof.activation.tupleId !== promotedTupleId
  )
    findings.push("activation identity is invalid")
  if (
    !isRecord(proof.coverage) ||
    !Array.isArray(proof.coverage.requirements) ||
    !Array.isArray(proof.coverage.decisions)
  )
    return [...findings, "coverage rows are invalid"]
  const checkCoverage = (
    rows: unknown[],
    expected: readonly string[],
    label: string,
  ): void => {
    if (
      rows.length !== expected.length ||
      rows.some(
        (row, index) =>
          !isRecord(row) ||
          Object.keys(row).sort().join() !== "id,status" ||
          row.id !== expected[index] ||
          row.status !== "proved",
      )
    )
      findings.push(`${label} coverage must be exact`)
  }
  checkCoverage(
    proof.coverage.requirements,
    requiredV137KernelRequirements,
    "requirement",
  )
  checkCoverage(proof.coverage.decisions, requiredV137DecisionIds, "decision")
  if (!isRecord(proof.inputs) || !isRecord(proof.sourceManifest))
    return [...findings, "input manifests are invalid"]
  findings.push(
    ...validateHashedFiles(proof.inputs.files, "input file", true),
    ...validateHashedFiles(proof.sourceManifest.files, "source file", false),
  )
  if (isRecord(proof.inputs) && Array.isArray(proof.inputs.files)) {
    const ids = proof.inputs.files
      .filter(isRecord)
      .map((file) => String(file.id))
    if (new Set(ids).size !== ids.length)
      findings.push("input file ids must be unique")
  }
  if (
    isRecord(proof.sourceManifest) &&
    Array.isArray(proof.sourceManifest.files)
  ) {
    const paths = proof.sourceManifest.files
      .filter(isRecord)
      .map((file) => String(file.path))
    if (
      new Set(paths).size !== paths.length ||
      paths.some(
        (repoPath) =>
          repoPath === v137BrowserPlaywrightArtifactPath ||
          Object.values(v137KernelIntegrityArtifactPaths).includes(
            repoPath as (typeof v137KernelIntegrityArtifactPaths)[keyof typeof v137KernelIntegrityArtifactPaths],
          ),
      )
    )
      findings.push("source manifest must be unique and exclude proof outputs")
  }
  if (
    !isRecord(proof.browser) ||
    proof.browser.path !== v137BrowserPlaywrightArtifactPath ||
    !sha256Pattern.test(String(proof.browser.sha256))
  )
    findings.push("browser reference is invalid")
  if (
    !Array.isArray(proof.gates) ||
    proof.gates.length !== requiredV137GateIds.length ||
    proof.gates.some(
      (row, index) =>
        !isRecord(row) ||
        Object.keys(row).sort().join() !== "id,inputSha256s,status" ||
        row.id !== requiredV137GateIds[index] ||
        row.status !== "passed" ||
        !Array.isArray(row.inputSha256s) ||
        row.inputSha256s.length === 0 ||
        row.inputSha256s.some(
          (hash) => typeof hash !== "string" || !sha256Pattern.test(hash),
        ),
    )
  )
    findings.push("gate rows must be exact")
  if (
    !Array.isArray(proof.limitations) ||
    JSON.stringify(proof.limitations) !== JSON.stringify(limitations)
  )
    findings.push("limitations must be exact")
  if (isRecord(proof.workingCopy)) {
    if (
      proof.workingCopy.schemaVersion !== "v1.37-working-copy-preservation-v1"
    )
      findings.push("workingCopy schemaVersion is invalid")
    const protectedFiles = proof.workingCopy.protectedFiles
    if (!Array.isArray(protectedFiles) || protectedFiles.length !== 2)
      findings.push("workingCopy protected files are invalid")
    else
      protectedFiles.forEach((file, index) => {
        findings.push(
          ...exactKeys(
            file,
            [
              "path",
              "beforeBytesSha256",
              "afterBytesSha256",
              "beforeBinaryDiffSha256",
              "afterBinaryDiffSha256",
              "preserved",
            ],
            `protected file ${index}`,
          ),
        )
        if (
          !isRecord(file) ||
          file.path !== protectedPaths[index] ||
          file.preserved !== true ||
          !sha256Pattern.test(String(file.beforeBytesSha256)) ||
          !sha256Pattern.test(String(file.beforeBinaryDiffSha256)) ||
          file.beforeBytesSha256 !== file.afterBytesSha256 ||
          file.beforeBinaryDiffSha256 !== file.afterBinaryDiffSha256
        )
          findings.push(`protected file ${index} was not preserved`)
      })
    const generated = proof.workingCopy.generatedFile
    findings.push(
      ...exactKeys(
        generated,
        ["path", "beforeBytesSha256", "afterRestoreBytesSha256", "preserved"],
        "generated file",
      ),
    )
    if (
      !isRecord(generated) ||
      generated.path !== "apps/web/next-env.d.ts" ||
      generated.preserved !== true ||
      !sha256Pattern.test(String(generated.beforeBytesSha256)) ||
      generated.beforeBytesSha256 !== generated.afterRestoreBytesSha256
    )
      findings.push("next-env bytes were not preserved")
  }
  return findings
}

export const renderV137KernelIntegrityProofJson = (proof: unknown): string =>
  `${JSON.stringify(proof, null, 2)}\n`

export const renderV137KernelIntegrityProofMarkdown = (
  proofValue: unknown,
): string => {
  const proof = proofValue as V137KernelIntegrityProof
  const requirementIds = proof.coverage.requirements
    .map(({ id }) => id)
    .join(", ")
  const decisionIds = proof.coverage.decisions.map(({ id }) => id).join(", ")
  const inputs = proof.inputs.files
    .map(
      ({ id, path: repoPath, sha256 }) =>
        `- \`${id}\`: \`${repoPath}\` (\`${sha256}\`)`,
    )
    .join("\n")
  const manifest = proof.sourceManifest.files
    .map(({ path: repoPath, sha256 }) => `- \`${repoPath}\` (\`${sha256}\`)`)
    .join("\n")
  const gates = proof.gates
    .map(
      ({ id, inputSha256s }) =>
        `- \`${id}\`: passed (${inputSha256s.length} hashed input${inputSha256s.length === 1 ? "" : "s"})`,
    )
    .join("\n")
  const preserved = proof.workingCopy.protectedFiles
    .map(
      ({ path: repoPath, preserved }) =>
        `- \`${repoPath}\`: ${preserved ? "preserved" : "changed"}`,
    )
    .join("\n")
  return (
    `# v1.37 Phase 257 Kernel Integrity Proof\n\n` +
    `This proof covers the service-contract-backed fixture used by Phase 257.\n\n` +
    `- Activation commit: \`${proof.activation.commit}\`\n` +
    `- Promoted tuple: \`${proof.activation.tupleId}\`\n` +
    `- Requirements: ${requirementIds}\n` +
    `- Decisions: ${decisionIds}\n` +
    `- Browser receipt: \`${proof.browser.path}\` (\`${proof.browser.sha256}\`)\n\n` +
    `## Hashed inputs\n\n${inputs}\n\n` +
    `## Bounded source manifest\n\n${manifest}\n\n` +
    `## Executable gates\n\n${gates}\n\n` +
    `## Working-copy preservation\n\n${preserved}\n` +
    `- \`${proof.workingCopy.generatedFile.path}\`: ${proof.workingCopy.generatedFile.preserved ? "preserved" : "changed"}\n\n` +
    `## Explicit limitations\n\n` +
    `Phase 258 canonical JSON, Phase 259 four-language conformance, and Phase 261 live service topology are not proved here. ` +
    `Cycle-start Backstab and post-advance HOLD simplifications remain deferred.\n`
  )
}

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const coreResultJsonPath =
  ".planning/artifacts/v1.37-phase-257-core-rules-result.json"
const coreResultMarkdownPath =
  ".planning/artifacts/v1.37-phase-257-core-rules-result.md"
const protectedPaths = [
  ".planning/config.json",
  "CowardsGameSpec_Full_Consolidated_v1.md",
] as const
const generatedPath = "apps/web/next-env.d.ts"
const boundedManifestPaths = [
  "apps/go-backend/runtime_semantic_receipt.go",
  "apps/go-backend/semantic_integrity.go",
  "apps/go-backend/semantic_integrity_test.go",
  "apps/runtime-service/src/execute-match.ts",
  "apps/runtime-service/src/semantic-receipt.ts",
  "apps/web/e2e/v1-37-rules-integrity-proof.spec.ts",
  "apps/web/lib/match-execution-fixture-adapter.ts",
  "packages/engine/src/compatibility-fixtures.test.ts",
  "packages/engine/src/kernel/lifecycle-repairs.test.ts",
  "packages/engine/src/kernel/step.ts",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql",
  "packages/replay/src/project.ts",
  "packages/service/src/index.ts",
  "packages/spec/src/match-execution-contract.ts",
  "packages/spec/src/runtime-execution-service.ts",
  "scripts/check-v1-37-executable-reference-inventory.ts",
  "scripts/check-v1-37-integrity-boundaries.ts",
  "scripts/generate-v1-37-event-coverage.ts",
].sort()

const hashBytes = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

const readRepoBytes = (repoRoot: string, repoPath: string): Buffer =>
  readFileSync(path.join(repoRoot, repoPath))

const hashedFile = (
  repoRoot: string,
  repoPath: string,
  id?: string,
): HashedFile => ({
  ...(id === undefined ? {} : { id }),
  path: repoPath,
  sha256: hashBytes(readRepoBytes(repoRoot, repoPath)),
})

const loadProofInputs = (
  repoRoot: string,
): {
  inputFiles: Array<Required<HashedFile>>
  manifestFiles: HashedFile[]
} => {
  const coreJson = readFileSync(path.join(repoRoot, coreResultJsonPath), "utf8")
  const coreMarkdown = readFileSync(
    path.join(repoRoot, coreResultMarkdownPath),
    "utf8",
  )
  const coreResult = JSON.parse(coreJson) as unknown
  if (!isRecord(coreResult)) throw new Error("Phase 257 core result is invalid")
  const coreAnalysis = analyzeV137Phase257CoreRulesResult({
    result: coreResult,
    expected: coreResult,
    markdown: coreMarkdown,
  })
  if (
    coreAnalysis.findings.length > 0 ||
    coreJson !== renderV137Phase257CoreRulesResultJson(coreResult) ||
    coreMarkdown !== renderV137Phase257CoreRulesResultMarkdown(coreResult)
  ) {
    throw new Error("Phase 257 core result failed its exported exact validator")
  }
  const activation = coreResult.activation
  if (
    !isRecord(activation) ||
    activation.commit !== phase19ActivationCommit ||
    activation.tupleId !== promotedTupleId ||
    !Array.isArray(coreResult.evidence)
  ) {
    throw new Error("Phase 257 activation identity or evidence is invalid")
  }
  const evidence = coreResult.evidence.map(
    (row, index): Required<HashedFile> => {
      if (
        !isRecord(row) ||
        typeof row.id !== "string" ||
        typeof row.path !== "string" ||
        !sha256Pattern.test(String(row.sha256))
      ) {
        throw new Error(`Phase 257 evidence ${index} is invalid`)
      }
      const current = hashedFile(
        repoRoot,
        row.path,
        row.id,
      ) as Required<HashedFile>
      if (current.sha256 !== row.sha256) {
        throw new Error(`Phase 257 evidence drifted: ${row.path}`)
      }
      return current
    },
  )
  const inputFiles = [
    hashedFile(repoRoot, coreResultJsonPath, "phase257-core-result"),
    hashedFile(
      repoRoot,
      coreResultMarkdownPath,
      "phase257-core-result-markdown",
    ),
    ...evidence,
  ] as Array<Required<HashedFile>>
  const uniqueInputs = [
    ...new Map(inputFiles.map((row) => [row.path, row])).values(),
  ].sort((left, right) => comparePaths(left.path, right.path))
  return {
    inputFiles: uniqueInputs,
    manifestFiles: boundedManifestPaths.map((repoPath) =>
      hashedFile(repoRoot, repoPath),
    ),
  }
}

const binaryDiffHash = (repoRoot: string, repoPath: string): string => {
  const result = spawnSync("git", ["diff", "--binary", "--", repoPath], {
    cwd: repoRoot,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.status !== 0)
    throw new Error(`unable to hash binary diff for ${repoPath}`)
  return hashBytes(result.stdout)
}

interface WorkingCopyPrestate {
  protectedFiles: Array<{
    path: string
    bytesSha256: string
    binaryDiffSha256: string
  }>
  generatedBytes: Buffer
  generatedBytesSha256: string
}

const captureWorkingCopyPrestate = (repoRoot: string): WorkingCopyPrestate => {
  if (!existsSync(path.join(repoRoot, generatedPath))) {
    throw new Error(`${generatedPath} must exist before browser proof`)
  }
  const generatedBytes = readRepoBytes(repoRoot, generatedPath)
  return {
    protectedFiles: protectedPaths.map((repoPath) => ({
      path: repoPath,
      bytesSha256: hashBytes(readRepoBytes(repoRoot, repoPath)),
      binaryDiffSha256: binaryDiffHash(repoRoot, repoPath),
    })),
    generatedBytes,
    generatedBytesSha256: hashBytes(generatedBytes),
  }
}

const finishWorkingCopyReceipt = (
  repoRoot: string,
  before: WorkingCopyPrestate,
): V137WorkingCopyReceipt => {
  const protectedFiles = before.protectedFiles.map((entry) => {
    const afterBytesSha256 = hashBytes(readRepoBytes(repoRoot, entry.path))
    const afterBinaryDiffSha256 = binaryDiffHash(repoRoot, entry.path)
    return {
      path: entry.path,
      beforeBytesSha256: entry.bytesSha256,
      afterBytesSha256,
      beforeBinaryDiffSha256: entry.binaryDiffSha256,
      afterBinaryDiffSha256,
      preserved:
        entry.bytesSha256 === afterBytesSha256 &&
        entry.binaryDiffSha256 === afterBinaryDiffSha256,
    }
  })
  const afterRestoreBytesSha256 = hashBytes(
    readRepoBytes(repoRoot, generatedPath),
  )
  const receipt: V137WorkingCopyReceipt = {
    schemaVersion: "v1.37-working-copy-preservation-v1",
    protectedFiles,
    generatedFile: {
      path: generatedPath,
      beforeBytesSha256: before.generatedBytesSha256,
      afterRestoreBytesSha256,
      preserved: before.generatedBytesSha256 === afterRestoreBytesSha256,
    },
  }
  if (
    protectedFiles.some(({ preserved }) => !preserved) ||
    !receipt.generatedFile.preserved
  ) {
    throw new Error(
      "browser proof changed protected working-copy bytes or diffs",
    )
  }
  return receipt
}

export interface V137BrowserCommandContract {
  command: "pnpm"
  args: readonly string[]
  ci: true
  workers: 1
  testFile: typeof targetFile
}

export const v137BrowserCommandContract: V137BrowserCommandContract = {
  command: "pnpm",
  args: [
    "exec",
    "playwright",
    "test",
    "--config=playwright.config.ts",
    "--workers=1",
    targetFile,
    "--reporter=json",
  ],
  ci: true,
  workers: 1,
  testFile: targetFile,
}

const runFreshBrowserProof = (
  repoRoot: string,
): {
  browserReceipt: V137BrowserPlaywrightReceipt
  workingCopyReceipt: V137WorkingCopyReceipt
} => {
  const before = captureWorkingCopyPrestate(repoRoot)
  const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-v137-phase257-"))
  const rawReportPath = path.join(tempRoot, "playwright-report.json")
  let browserReceipt: V137BrowserPlaywrightReceipt | undefined
  try {
    const result = spawnSync(
      v137BrowserCommandContract.command,
      [...v137BrowserCommandContract.args],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          CI: "1",
          PLAYWRIGHT_JSON_OUTPUT_FILE: rawReportPath,
        },
        encoding: "buffer",
        stdio: ["ignore", "ignore", "ignore"],
        timeout: 180_000,
      },
    )
    const exitCode = result.status ?? 1
    if (!existsSync(rawReportPath)) {
      throw new Error(`Playwright exit ${exitCode} produced no JSON report`)
    }
    const rawBytes = readFileSync(rawReportPath)
    const rawReport = JSON.parse(rawBytes.toString("utf8")) as unknown
    browserReceipt = projectV137BrowserPlaywrightReceipt(rawReport, {
      exitCode,
      reportSha256: hashBytes(rawBytes),
    })
    assertV137IntegrityPublicPayload(browserReceipt)
    assertPublicOutputLeakSafe(browserReceipt, "Phase 257 browser receipt")
  } finally {
    writeFileSync(path.join(repoRoot, generatedPath), before.generatedBytes)
    rmSync(tempRoot, { recursive: true, force: true })
  }
  if (!browserReceipt) throw new Error("Playwright receipt was not produced")
  return {
    browserReceipt,
    workingCopyReceipt: finishWorkingCopyReceipt(repoRoot, before),
  }
}

const canonicalJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`

export const checkV137KernelIntegrityArtifacts = (
  repoRoot = defaultRepoRoot,
): string[] => {
  const findings: string[] = []
  try {
    const browserText = readFileSync(
      path.join(repoRoot, v137BrowserPlaywrightArtifactPath),
      "utf8",
    )
    const browserReceipt = JSON.parse(
      browserText,
    ) as V137BrowserPlaywrightReceipt
    findings.push(...validateV137BrowserPlaywrightReceipt(browserReceipt))
    if (browserText !== canonicalJson(browserReceipt)) {
      findings.push("browser receipt JSON is not canonical")
    }
    const proofJson = readFileSync(
      path.join(repoRoot, v137KernelIntegrityArtifactPaths.json),
      "utf8",
    )
    const proof = JSON.parse(proofJson) as V137KernelIntegrityProof
    const { inputFiles, manifestFiles } = loadProofInputs(repoRoot)
    const expected = createV137KernelIntegrityProof({
      browserReceipt,
      browserReceiptSha256: hashBytes(browserText),
      workingCopyReceipt: proof.workingCopy,
      inputFiles,
      manifestFiles,
    })
    findings.push(...validateV137KernelIntegrityProof(proof))
    const expectedJson = renderV137KernelIntegrityProofJson(expected)
    const expectedMarkdown = renderV137KernelIntegrityProofMarkdown(expected)
    if (proofJson !== expectedJson)
      findings.push("kernel proof JSON is stale or noncanonical")
    const markdown = readFileSync(
      path.join(repoRoot, v137KernelIntegrityArtifactPaths.markdown),
      "utf8",
    )
    if (markdown !== expectedMarkdown)
      findings.push("kernel proof Markdown is stale")
    assertV137IntegrityPublicPayload(browserReceipt)
    assertV137IntegrityPublicPayload(proof)
    assertV137IntegrityPublicPayload({ markdown })
    assertPublicOutputLeakSafe(browserReceipt, "Phase 257 browser receipt")
    assertPublicOutputLeakSafe(proof, "Phase 257 kernel proof")
  } catch (error) {
    findings.push(error instanceof Error ? error.message : String(error))
  }
  return findings
}

export const writeV137KernelIntegrityArtifacts = (
  repoRoot = defaultRepoRoot,
): void => {
  const exactCoreResult = checkV137Phase257CoreRulesResult(repoRoot)
  if (exactCoreResult.findings.length > 0) {
    throw new Error(
      `Phase 257 core result exact validation failed: ${exactCoreResult.findings
        .map(({ code }) => code)
        .join(", ")}`,
    )
  }
  const { inputFiles, manifestFiles } = loadProofInputs(repoRoot)
  const { browserReceipt, workingCopyReceipt } = runFreshBrowserProof(repoRoot)
  const browserText = canonicalJson(browserReceipt)
  writeFileSync(
    path.join(repoRoot, v137BrowserPlaywrightArtifactPath),
    browserText,
    "utf8",
  )
  const proof = createV137KernelIntegrityProof({
    browserReceipt,
    browserReceiptSha256: hashBytes(browserText),
    workingCopyReceipt,
    inputFiles,
    manifestFiles,
  })
  const proofFindings = validateV137KernelIntegrityProof(proof)
  if (proofFindings.length > 0) throw new Error(proofFindings.join("; "))
  const json = renderV137KernelIntegrityProofJson(proof)
  const markdown = renderV137KernelIntegrityProofMarkdown(proof)
  assertV137IntegrityPublicPayload(proof)
  assertV137IntegrityPublicPayload({ markdown })
  assertPublicOutputLeakSafe(proof, "Phase 257 kernel proof")
  writeFileSync(
    path.join(repoRoot, v137KernelIntegrityArtifactPaths.json),
    json,
    "utf8",
  )
  writeFileSync(
    path.join(repoRoot, v137KernelIntegrityArtifactPaths.markdown),
    markdown,
    "utf8",
  )
  const findings = checkV137KernelIntegrityArtifacts(repoRoot)
  if (findings.length > 0) throw new Error(findings.join("; "))
}

export interface V137KernelIntegrityCliRuntime {
  write: () => void
  check: () => readonly string[]
}

export const runV137KernelIntegrityCli = (
  args: readonly string[],
  runtime: V137KernelIntegrityCliRuntime = {
    write: () => writeV137KernelIntegrityArtifacts(),
    check: () => checkV137KernelIntegrityArtifacts(),
  },
): number => {
  const parsed = parseV137KernelIntegrityArgs(args)
  if (parsed.mode === "write") runtime.write()
  const findings = runtime.check()
  if (findings.length > 0) throw new Error(findings.join("\n"))
  return 0
}

const isDirectExecution = (): boolean =>
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution()) {
  try {
    runV137KernelIntegrityCli(process.argv.slice(2))
    console.log("v1.37 Phase 257 kernel integrity proof: PASS")
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
