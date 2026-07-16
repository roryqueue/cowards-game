#!/usr/bin/env -S pnpm exec tsx
import { pathToFileURL } from "node:url"
import type { V137ConformanceCorpus } from "../packages/golden/src/v1-37-conformance-corpus.js"

export interface WriteV137ConformanceCandidateInput {
  destinationRoot: string
  nextVersion: string
  candidateCorpus?: V137ConformanceCorpus
}

const missing = (): never => {
  throw new Error("[EXPECTED_RED:MISSING_V1_37_CORPUS_CANDIDATE_GENERATOR]")
}

export const writeV137ConformanceCandidate = missing
export const parseV137ConformanceCandidateArgs = missing

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    missing()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
