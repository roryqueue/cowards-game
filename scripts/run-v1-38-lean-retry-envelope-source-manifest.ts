/** Inert source closure only. No allocation, admission, reader or provider. */
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { execFileSync } from "node:child_process"
import { leanCorrectionSourceManifest } from "./run-v1-38-lean-correction.js"
import { LEAN_RETRY_V8_TIMEBOX_EXTENSION, type LeanRetryOrdinal } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
export const leanRetryEnvelopeSourceManifest = (attemptOrdinal: LeanRetryOrdinal = 1) => leanCorrectionSourceManifest(`v8-${attemptOrdinal}`, LEAN_RETRY_V8_TIMEBOX_EXTENSION)
export const leanRetryTwentyHourSourceInventory = () => {
  const first = leanRetryEnvelopeSourceManifest()
  const body = {
    schemaVersion: "lean-retry-twenty-hour-source-inventory-v8-v1", privacy: "private_offline", scope: "source_only_review_fix_handoff", startupVersion: 7,
    sourceCommit: execFileSync("git", ["log", "-1", "--format=%H", "--", ...first.entries.map(entry => entry.path)], { encoding: "utf8", maxBuffer: 128 }).trim(),
    timeboxExtension: LEAN_RETRY_V8_TIMEBOX_EXTENSION,
    entryCount: first.entries.length,
    sourceRoots: ([1, 2, 3] as const).map(attemptOrdinal => ({ attemptOrdinal, sourceRoot: attemptOrdinal === 1 ? first.root : leanRetryEnvelopeSourceManifest(attemptOrdinal).root })),
    entries: first.entries,
    empiricalAuthority: false, routesStarted: false,
  }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new TypeError("LEAN_RETRY_MANIFEST_ARGUMENTS")
  process.stdout.write(JSON.stringify(leanRetryTwentyHourSourceInventory()) + "\n")
}
