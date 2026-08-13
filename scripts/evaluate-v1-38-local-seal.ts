import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { constants, existsSync, openSync, readFileSync, writeFileSync, closeSync, fsyncSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildV138LocalSealProtocolArtifactV2,
} from "./lib/v1-38-local-seal.js"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ARTIFACT_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-protocol-v1.json")
const ARTIFACT_V2_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-protocol-v2.json")
const FROZEN_V1_SHA256 = "0db2b18d7e09894d52856478415889748802b745f1a36ca0d1bc1fcb39ecec5e"
const FROZEN_V1_PROTOCOL_ROOT = "sha256:0d7f7ec3edd89638226105b7ae035330265f19634bb7acfc58fb204dba157e62"

const source = (relative: string): Buffer => readFileSync(path.join(REPO_ROOT, relative))

const buildV2 = () => buildV138LocalSealProtocolArtifactV2({
  moduleSourceBytes: source("scripts/lib/v1-38-local-seal.ts"),
  testSourceBytes: source("scripts/evaluate-v1-38-local-seal.test.ts"),
  cliSourceBytes: source("scripts/evaluate-v1-38-local-seal.ts"),
  preSearchPolicyBytes: source(".planning/artifacts/v1.38-pre-search-policy-root.json"),
})

const expectedV2Bytes = (): Buffer => Buffer.from(`${JSON.stringify(buildV2())}\n`, "utf8")

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
  if (unexpected.length !== 0 || !["--write", "--check", "--write-v2", "--check-v2"].includes(command ?? "")) {
    throw new TypeError("V138_LOCAL_SEAL_CLI_USAGE")
  }
  if (command === "--check") {
    if (!existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISSING")
    const actual = readFileSync(ARTIFACT_PATH)
    const digest = createHash("sha256").update(actual).digest("hex")
    let parsed: unknown
    try { parsed = JSON.parse(actual.toString("utf8")) } catch { throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISMATCH") }
    if (digest !== FROZEN_V1_SHA256 || parsed === null || typeof parsed !== "object" ||
      (parsed as { protocolRoot?: unknown }).protocolRoot !== FROZEN_V1_PROTOCOL_ROOT) {
      throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISMATCH")
    }
    process.stdout.write(`${JSON.stringify({ status: "passed_frozen_v1", protocolRoot: FROZEN_V1_PROTOCOL_ROOT })}\n`)
    return
  }
  if (command === "--write") {
    if (existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_EXISTS")
    throw new TypeError("V138_LOCAL_SEAL_V1_FROZEN")
  }
  const expected = expectedV2Bytes()
  if (command === "--write-v2") {
    if (existsSync(ARTIFACT_V2_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_EXISTS")
    writeExclusive(ARTIFACT_V2_PATH, expected)
    process.stdout.write(`${JSON.stringify({ status: "written", protocolRoot: buildV2().protocolRoot })}\n`)
    return
  }
  if (!existsSync(ARTIFACT_V2_PATH)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISSING")
  const actual = readFileSync(ARTIFACT_V2_PATH)
  if (!actual.equals(expected)) throw new TypeError("V138_LOCAL_SEAL_ARTIFACT_MISMATCH")
  process.stdout.write(`${JSON.stringify({ status: "passed", protocolRoot: buildV2().protocolRoot })}\n`)
}

main()
