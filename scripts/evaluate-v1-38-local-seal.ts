import { Buffer } from "node:buffer"
import { constants, existsSync, openSync, readFileSync, writeFileSync, closeSync, fsyncSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildV138LocalSealProtocolArtifact } from "./lib/v1-38-local-seal.js"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ARTIFACT_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-protocol-v1.json")

const source = (relative: string): Buffer => readFileSync(path.join(REPO_ROOT, relative))

const build = () => buildV138LocalSealProtocolArtifact({
  moduleSourceBytes: source("scripts/lib/v1-38-local-seal.ts"),
  testSourceBytes: source("scripts/evaluate-v1-38-local-seal.test.ts"),
  cliSourceBytes: source("scripts/evaluate-v1-38-local-seal.ts"),
  preSearchPolicyBytes: source(".planning/artifacts/v1.38-pre-search-policy-root.json"),
})

const expectedBytes = (): Buffer => Buffer.from(`${JSON.stringify(build())}\n`, "utf8")

const writeExclusive = (target: string, bytes: Uint8Array): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(
      target,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0),
      0o600,
    )
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

const main = (): void => {
  const [command, ...unexpected] = process.argv.slice(2)
  if (unexpected.length !== 0 || (command !== "--write" && command !== "--check")) {
    throw new TypeError("V138_LOCAL_SEAL_CLI_USAGE")
  }
  const expected = expectedBytes()
  if (command === "--write") {
    if (existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_EXISTS")
    writeExclusive(ARTIFACT_PATH, expected)
    process.stdout.write(`${JSON.stringify({ status: "written", protocolRoot: build().protocolRoot })}\n`)
    return
  }
  if (!existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISSING")
  const actual = readFileSync(ARTIFACT_PATH)
  if (!actual.equals(expected)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISMATCH")
  process.stdout.write(`${JSON.stringify({ status: "passed", protocolRoot: build().protocolRoot })}\n`)
}

main()
