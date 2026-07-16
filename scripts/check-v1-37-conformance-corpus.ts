#!/usr/bin/env -S pnpm exec tsx
import { pathToFileURL } from "node:url"

const missing = (): never => {
  throw new Error("[EXPECTED_RED:MISSING_V1_37_CORPUS_READ_ONLY_CHECKER]")
}

export const assertV137ConformanceCheckArgs = missing
export const checkCommittedV137ConformanceCorpus = missing

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    missing()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
