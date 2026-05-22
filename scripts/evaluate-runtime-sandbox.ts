#!/usr/bin/env -S pnpm exec tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertRequiredSandboxCandidatesPassed,
  assertSandboxEvaluationPublicSafe,
  evaluateRuntimeSandboxes,
} from "../packages/runtime-js/src/sandbox-evaluation.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const artifactPath = path.join(
  repoRoot,
  ".planning/artifacts/runtime-sandbox-evaluation.json",
)
const staleMessage =
  "Runtime sandbox evaluation artifact is stale; run pnpm sandbox:evaluate"

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    )
  }
  return value
}

const serialize = (value: unknown): string =>
  `${JSON.stringify(stableValue(value), null, 2)}\n`

const report = evaluateRuntimeSandboxes()
assertSandboxEvaluationPublicSafe(report)

const checkMode = process.argv.includes("--check")
const requireContainer = process.argv.includes("--require-container")
const next = serialize(report)

if (requireContainer) {
  assertRequiredSandboxCandidatesPassed(report, ["container-subprocess"])
}

if (checkMode) {
  const current = readFileSync(artifactPath, "utf8")
  if (current !== next) {
    throw new Error(staleMessage)
  }
} else {
  mkdirSync(path.dirname(artifactPath), { recursive: true })
  writeFileSync(artifactPath, next)
}
