#!/usr/bin/env -S pnpm exec tsx
import { spawn, type ChildProcess } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  readFileSync,
} from "node:fs"
import path from "node:path"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"

const CURRENT_SELECTION_ROOT =
  "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2" as const

export const V137_INTEGRATED_SERVICE_PROOF_CONTROL_PATH =
  "manifests/v1.37-integrated-service-proof.json" as const

export interface V137IntegratedServiceEnvironment {
  databaseUrl: string
  goDatabaseUrl: string
  signedConformanceDatabaseUrl: string
  restrictedRoot: string
}

export interface V137IntegratedServiceTopology {
  postgres: "healthy" | "unhealthy"
  redis: "healthy" | "unhealthy"
  goOwner: "ready" | "unavailable"
  runtimeServiceOwner: "ready" | "unavailable"
  databaseHead: {
    state: string
    revision: number
    activeSelectionRoot: string
    pendingIntent: boolean
    compensation: boolean
  }
}

export interface V137OwnedProcess {
  pid: number
  label: string
  owned: boolean
}

export interface V137CommandReceipt {
  id: string
  status: "passed"
  exitCode: 0
  stdoutSha256: `sha256:${string}`
  stderrSha256: `sha256:${string}`
}

export interface V137CommandSpec {
  id: string
  executable: string
  args: readonly string[]
  cwd: string
  environment: Record<string, string>
  timeoutMs: number
}

const fail = (code: string): never => {
  throw new TypeError(code)
}

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const isWithin = (parent: string, candidate: string): boolean =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const required = (
  environment: Record<string, string | undefined>,
  name: string,
  code: string,
): string => {
  const value = environment[name]?.trim()
  if (!value) fail(code)
  return value
}

export const validateV137IntegratedServiceEnvironment = (
  environment: Record<string, string | undefined>,
  repoRoot: string,
): V137IntegratedServiceEnvironment => {
  const databaseUrl = required(
    environment,
    "DATABASE_URL",
    "V137_SERVICE_PROOF_DATABASE_URL_REQUIRED",
  )
  const goDatabaseUrl = required(
    environment,
    "COWARDS_GO_BACKEND_TEST_DATABASE_URL",
    "V137_SERVICE_PROOF_GO_DATABASE_URL_REQUIRED",
  )
  const signedConformanceDatabaseUrl = required(
    environment,
    "COWARDS_V1_37_SIGNED_CONFORMANCE_TEST_DATABASE_URL",
    "V137_SERVICE_PROOF_SIGNED_DATABASE_URL_REQUIRED",
  )
  const restrictedRoot = path.resolve(
    required(
      environment,
      "COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT",
      "V137_SERVICE_PROOF_RESTRICTED_ROOT_REQUIRED",
    ),
  )
  if (
    databaseUrl !== goDatabaseUrl ||
    databaseUrl !== signedConformanceDatabaseUrl
  ) {
    fail("V137_SERVICE_PROOF_DSN_MISMATCH")
  }
  if (isWithin(path.resolve(repoRoot), restrictedRoot)) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ROOT_IN_REPOSITORY")
  }
  if (existsSync(restrictedRoot) && lstatSync(restrictedRoot).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_RESTRICTED_ROOT_SYMLINK")
  }
  return Object.freeze({
    databaseUrl,
    goDatabaseUrl,
    signedConformanceDatabaseUrl,
    restrictedRoot,
  })
}

export const assertV137IntegratedServiceTopology = (
  topology: V137IntegratedServiceTopology,
): V137IntegratedServiceTopology => {
  if (
    topology.postgres !== "healthy" ||
    topology.redis !== "healthy" ||
    topology.goOwner !== "ready" ||
    topology.runtimeServiceOwner !== "ready"
  ) {
    fail("V137_SERVICE_PROOF_TOPOLOGY_UNHEALTHY")
  }
  const { databaseHead } = topology
  if (
    databaseHead.state !== "active-v1.19-finalized" ||
    databaseHead.revision !== 2 ||
    databaseHead.activeSelectionRoot !== CURRENT_SELECTION_ROOT ||
    databaseHead.pendingIntent ||
    databaseHead.compensation
  ) {
    fail("V137_SERVICE_PROOF_DATABASE_HEAD_MISMATCH")
  }
  return Object.freeze(globalThis.structuredClone(topology))
}

export const cleanupV137OwnedProcesses = async (
  processes: readonly V137OwnedProcess[],
  signal: (pid: number, signal: "SIGTERM") => Promise<void>,
): Promise<void> => {
  for (const process of [...processes].reverse()) {
    if (!process.owned || !Number.isSafeInteger(process.pid) || process.pid < 2) {
      continue
    }
    await signal(process.pid, "SIGTERM")
  }
}

export const runV137Command = (
  command: V137CommandSpec,
  onSpawn?: (child: ChildProcess) => void,
): Promise<V137CommandReceipt> =>
  new Promise((resolve, reject) => {
    const child = spawn(command.executable, [...command.args], {
      cwd: command.cwd,
      env: command.environment,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })
    onSpawn?.(child)
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    const maxBytes = 64 * 1024 * 1024
    const append = (target: Buffer[], chunk: Buffer, current: number): number => {
      const next = current + chunk.byteLength
      if (next > maxBytes) {
        child.kill("SIGTERM")
        fail("V137_SERVICE_PROOF_COMMAND_OUTPUT_LIMIT")
      }
      target.push(chunk)
      return next
    }
    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBytes = append(stdout, Buffer.from(chunk), stdoutBytes)
    })
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBytes = append(stderr, Buffer.from(chunk), stderrBytes)
    })
    const timeout = setTimeout(() => child.kill("SIGTERM"), command.timeoutMs)
    child.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.once("close", (code, signal) => {
      clearTimeout(timeout)
      if (code !== 0 || signal !== null) {
        reject(new TypeError(`V137_SERVICE_PROOF_COMMAND_FAILED:${command.id}`))
        return
      }
      resolve(
        Object.freeze({
          id: command.id,
          status: "passed",
          exitCode: 0,
          stdoutSha256: sha256(Buffer.concat(stdout)),
          stderrSha256: sha256(Buffer.concat(stderr)),
        }),
      )
    })
  })

export const hashV137ServiceInput = (repoRoot: string, relativePath: string) => {
  const absolute = path.join(repoRoot, relativePath)
  if (!existsSync(absolute) || lstatSync(absolute).isSymbolicLink()) {
    fail("V137_SERVICE_PROOF_INPUT_MISSING")
  }
  return sha256(readFileSync(absolute))
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  process.stderr.write("V137_SERVICE_PROOF_NOT_IMPLEMENTED\n")
  process.exitCode = 1
}
