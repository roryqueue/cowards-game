/** Inert source closure only. No allocation, admission, reader or provider. */
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { leanCorrectionSourceManifest } from "./run-v1-38-lean-correction.js"
export const leanRetryEnvelopeSourceManifest = () => leanCorrectionSourceManifest("v8-1")
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new TypeError("LEAN_RETRY_MANIFEST_ARGUMENTS")
  process.stdout.write(JSON.stringify(leanRetryEnvelopeSourceManifest()) + "\n")
}
