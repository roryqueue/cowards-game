import { Buffer } from "node:buffer"
import {
  chmodSync,
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
      timeoutMilliseconds: 2_000,
      stdoutByteLimit: limits.stdout,
      stderrByteLimit: limits.stderr,
    })

    expect(Buffer.isBuffer(result.stdout)).toBe(true)
    expect(Buffer.isBuffer(result.stderr)).toBe(true)
    expect(result[`${stream}Overflow`]).toBe(oneOver)
    expect(result[stream]).toHaveLength(byteLength)
    if (oneOver) {
      expect(result.signal).toBe("SIGKILL")
      expect(result.terminationReceiptPresent).toBe(true)
      expect(result.stdoutEof).toBe(true)
      expect(result.stderrEof).toBe(true)
    } else {
      expect(result.status).toBe(0)
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
        timeoutMilliseconds: 2_000,
        stdoutByteLimit: limits.stdout,
        stderrByteLimit: limits.stderr,
      })
      parentPid = Number(readFileSync(parentPidPath, "utf8"))
      childPid = Number(readFileSync(childPidPath, "utf8"))

      expect(result.terminationReceiptPresent).toBe(false)
      expect(result.stdoutEof).toBe(false)
      expect(result.stderrEof).toBe(false)
      await delay(500)
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
        timeoutMilliseconds: 2_000,
        stdoutByteLimit: limits.stdout,
        stderrByteLimit: limits.stderr,
        containerCleanup: { runtimeCommand: runtimePath, cidFilePath },
      })
      cliPid = Number(readFileSync(cliPidPath, "utf8"))
      daemonPid = (
        JSON.parse(readFileSync(statePath, "utf8")) as { pid: number }
      ).pid

      expect(result.terminationReceiptPresent).toBe(false)
      await delay(500)
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
