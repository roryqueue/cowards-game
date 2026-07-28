import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { describe, expect, it } from "vitest"
import { runCandidateProcessSync } from "./candidate-process-runner.js"

const limits = Object.freeze({ stdout: 64, stderr: 32 })
const candidateProcessRunnerModuleUrl = new URL(
  "./candidate-process-runner.ts",
  import.meta.url,
).href

describe("candidate process per-stream physical caps", () => {
  it.each([
    ["stdout", false],
    ["stdout", true],
    ["stderr", false],
    ["stderr", true],
  ] as const)("enforces the %s %s boundary", (stream, oneOver) => {
    const limit = limits[stream]
    const byteLength = limit + (oneOver ? 1 : 0)
    const result = runCandidateProcessSync({
      command: process.execPath,
      args: [
        "--input-type=module",
        "--eval",
        `import { ${stream} } from "node:process";
${stream}.write(Buffer.alloc(${byteLength}, 97), () => {
  ${oneOver ? "setInterval(() => {}, 1000)" : "process.exit(0)"}
})`,
      ],
      env: { NODE_ENV: "production" },
      input: "",
      killSignal: "SIGKILL",
      launchStartedNanoseconds: process.hrtime.bigint(),
      timeoutMilliseconds: 10_000,
      stdoutByteLimit: limits.stdout,
      stderrByteLimit: limits.stderr,
    })

    expect(Buffer.isBuffer(result.stdout)).toBe(true)
    expect(Buffer.isBuffer(result.stderr)).toBe(true)
    expect(result[`${stream}Overflow`]).toBe(oneOver)
    expect(result[stream]).toHaveLength(byteLength)
    if (oneOver) {
      expect(result.terminationRequested).toBe(true)
      if (result.terminationReceiptPresent) {
        expect(result.stdoutEof).toBe(true)
        expect(result.stderrEof).toBe(true)
      } else {
        expect(
          result.error && "code" in result.error ? result.error.code : null,
        ).toBe("NO_TERMINATION_RECEIPT")
      }
    } else {
      expect(result.status).toBe(0)
    }
  })

  it("does not fabricate close when process construction fails", () => {
    const result = runCandidateProcessSync({
      command: "/definitely/missing/cowards-runtime-command",
      args: [],
      env: { NODE_ENV: "production" },
      input: "",
      killSignal: "SIGKILL",
      launchStartedNanoseconds: process.hrtime.bigint(),
      timeoutMilliseconds: 10_000,
      stdoutByteLimit: limits.stdout,
      stderrByteLimit: limits.stderr,
    })

    expect(result.error).toBeInstanceOf(Error)
    expect(result.terminationReceiptPresent).toBe(false)
  })

  it("settles a container launch failure that never creates a CID", () => {
    const directory = mkdtempSync(join(tmpdir(), "cowards-runner-no-cid-"))
    const cidFilePath = join(directory, "container.cid")
    const script = `
import { runCandidateProcessSync } from ${JSON.stringify(candidateProcessRunnerModuleUrl)}
const result = runCandidateProcessSync({
  command: "/definitely/missing/cowards-container-runtime",
  args: ["run"],
  env: { NODE_ENV: "production" },
  input: "",
  killSignal: "SIGKILL",
  launchStartedNanoseconds: process.hrtime.bigint(),
  timeoutMilliseconds: 100,
  stdoutByteLimit: ${limits.stdout},
  stderrByteLimit: ${limits.stderr},
  containerCleanup: {
    runtimeCommand: "/definitely/missing/cowards-container-runtime",
    cidFilePath: ${JSON.stringify(cidFilePath)},
    cleanupDirectory: ${JSON.stringify(directory)},
  },
})
process.stdout.write(JSON.stringify({
  errorCode: result.error && "code" in result.error ? result.error.code : null,
  receiptPresent: result.terminationReceiptPresent,
}))
`

    try {
      const child = spawnSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "--eval", script],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "production" },
          shell: false,
          timeout: 2_000,
        },
      )

      expect(child.error).toBeUndefined()
      expect(child.status).toBe(0)
      expect(JSON.parse(child.stdout)).toEqual({
        errorCode: "ENOENT",
        receiptPresent: false,
      })
      expect(existsSync(directory)).toBe(false)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("settles a closed container runtime that never wrote its CID", () => {
    const directory = mkdtempSync(join(tmpdir(), "cowards-runner-no-cid-"))
    const cidFilePath = join(directory, "container.cid")
    const script = `
import { runCandidateProcessSync } from ${JSON.stringify(candidateProcessRunnerModuleUrl)}
const result = runCandidateProcessSync({
  command: ${JSON.stringify(process.execPath)},
  args: ["--eval", "process.exit(1)"],
  env: { NODE_ENV: "production" },
  input: "",
  killSignal: "SIGKILL",
  launchStartedNanoseconds: process.hrtime.bigint(),
  timeoutMilliseconds: 1_000,
  stdoutByteLimit: ${limits.stdout},
  stderrByteLimit: ${limits.stderr},
  containerCleanup: {
    runtimeCommand: ${JSON.stringify(process.execPath)},
    cidFilePath: ${JSON.stringify(cidFilePath)},
    cleanupDirectory: ${JSON.stringify(directory)},
  },
})
process.stdout.write(JSON.stringify({
  errorCode: result.error && "code" in result.error ? result.error.code : null,
  receiptPresent: result.terminationReceiptPresent,
}))
`

    try {
      const child = spawnSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "--eval", script],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "production" },
          shell: false,
          timeout: 2_000,
        },
      )

      expect(child.error).toBeUndefined()
      expect(child.status).toBe(0)
      expect(JSON.parse(child.stdout)).toEqual({
        errorCode: "NO_TERMINATION_RECEIPT",
        receiptPresent: false,
      })
      expect(existsSync(directory)).toBe(false)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("returns no receipt instead of fabricating close and keeps a process-group reaper", async () => {
    const directory = mkdtempSync(join(tmpdir(), "cowards-runner-stubborn-"))
    const parentPidPath = join(directory, "parent.pid")
    const childPidPath = join(directory, "child.pid")
    const source = `
const { spawn } = require("node:child_process")
const { writeFileSync } = require("node:fs")
writeFileSync(${JSON.stringify(parentPidPath)}, String(process.pid))
const child = spawn(process.execPath, ["-e", ${JSON.stringify(
      'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)',
    )}], { stdio: ["ignore", process.stdout, process.stderr] })
writeFileSync(${JSON.stringify(childPidPath)}, String(child.pid))
process.on("SIGTERM", () => {})
process.stdout.write(Buffer.alloc(65, 97))
setInterval(() => {}, 1000)
`
    let parentPid = 0
    let childPid = 0
    try {
      const result = runCandidateProcessSync({
        command: process.execPath,
        args: ["-e", source],
        env: { NODE_ENV: "production" },
        input: "",
        killSignal: "SIGTERM",
        launchStartedNanoseconds: process.hrtime.bigint(),
        timeoutMilliseconds: 10_000,
        stdoutByteLimit: limits.stdout,
        stderrByteLimit: limits.stderr,
      })
      parentPid = Number(readFileSync(parentPidPath, "utf8"))
      childPid = Number(readFileSync(childPidPath, "utf8"))

      expect(result.terminationReceiptPresent).toBe(false)
      expect(result.stdoutEof).toBe(false)
      expect(result.stderrEof).toBe(false)
      await waitUntil(() => !isAlive(parentPid) && !isAlive(childPid))
      expect(isAlive(parentPid)).toBe(false)
      expect(isAlive(childPid)).toBe(false)
    } finally {
      killIfAlive(parentPid)
      killIfAlive(childPid)
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("uses authoritative container identity cleanup before the background reaper exits", async () => {
    const directory = mkdtempSync(join(tmpdir(), "cowards-runner-container-"))
    const runtimePath = join(directory, "fake-container-runtime.cjs")
    const cidFilePath = join(directory, "container.cid")
    const statePath = join(directory, "state.json")
    const logPath = join(directory, "cleanup.log")
    const cliPidPath = join(directory, "cli.pid")
    const containerId = "a".repeat(64)
    writeFileSync(
      runtimePath,
      `#!/usr/bin/env node
const { appendFileSync, readFileSync, writeFileSync } = require("node:fs")
const { spawn } = require("node:child_process")
const [command, ...args] = process.argv.slice(2)
const log = (line) => appendFileSync(process.env.FAKE_RUNTIME_LOG, line + "\\n")
if (command === "run") {
  const cidIndex = args.indexOf("--cidfile")
  const daemon = spawn(process.execPath, ["-e", 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], {
    detached: true,
    stdio: ["ignore", process.stdout, process.stderr],
  })
  daemon.unref()
  writeFileSync(process.env.FAKE_RUNTIME_CLI_PID, String(process.pid))
  writeFileSync(process.env.FAKE_RUNTIME_STATE, JSON.stringify({ id: ${JSON.stringify(containerId)}, pid: daemon.pid }))
  writeFileSync(args[cidIndex + 1], ${JSON.stringify(containerId)})
  log("run:" + ${JSON.stringify(containerId)})
  process.on("SIGTERM", () => {})
  process.stdout.write(Buffer.alloc(65, 97))
  setInterval(() => {}, 1000)
} else {
  const state = JSON.parse(readFileSync(process.env.FAKE_RUNTIME_STATE, "utf8"))
  log(command + ":" + state.id)
  if (command === "kill" || command === "rm") {
    try { process.kill(state.pid, "SIGKILL") } catch {}
  }
}
`,
    )
    chmodSync(runtimePath, 0o755)
    let cliPid = 0
    let daemonPid = 0
    try {
      const result = runCandidateProcessSync({
        command: runtimePath,
        args: ["run", "--cidfile", cidFilePath],
        env: {
          NODE_ENV: "production",
          PATH: process.env.PATH ?? "",
          FAKE_RUNTIME_LOG: logPath,
          FAKE_RUNTIME_STATE: statePath,
          FAKE_RUNTIME_CLI_PID: cliPidPath,
        },
        input: "",
        killSignal: "SIGTERM",
        launchStartedNanoseconds: process.hrtime.bigint(),
        timeoutMilliseconds: 10_000,
        stdoutByteLimit: limits.stdout,
        stderrByteLimit: limits.stderr,
        containerCleanup: { runtimeCommand: runtimePath, cidFilePath },
      })
      cliPid = Number(readFileSync(cliPidPath, "utf8"))
      daemonPid = (
        JSON.parse(readFileSync(statePath, "utf8")) as { pid: number }
      ).pid

      expect(result.terminationReceiptPresent).toBe(false)
      await waitUntil(() => {
        try {
          return (
            /rm:[a-f0-9]{64}/u.test(readFileSync(logPath, "utf8")) &&
            !isAlive(cliPid) &&
            !isAlive(daemonPid)
          )
        } catch {
          return false
        }
      })
      expect(readFileSync(logPath, "utf8")).toMatch(
        /kill:[a-f0-9]{64}.*wait:[a-f0-9]{64}.*rm:[a-f0-9]{64}/su,
      )
      expect(isAlive(cliPid)).toBe(false)
      expect(isAlive(daemonPid)).toBe(false)
    } finally {
      killIfAlive(cliPid)
      killIfAlive(daemonPid)
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

const isAlive = (pid: number): boolean => {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const killIfAlive = (pid: number): void => {
  if (!isAlive(pid)) return
  try {
    process.kill(pid, "SIGKILL")
  } catch {
    // Best-effort RED cleanup only.
  }
}

const waitUntil = async (
  predicate: () => boolean,
  timeoutMilliseconds = 3_000,
): Promise<void> => {
  const deadline = Date.now() + timeoutMilliseconds
  while (!predicate() && Date.now() < deadline) await delay(25)
}
