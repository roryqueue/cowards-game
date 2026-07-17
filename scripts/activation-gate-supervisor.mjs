#!/usr/bin/env node
import { Buffer } from "node:buffer"
import { spawn } from "node:child_process"
import { rm, rmdir, writeFile } from "node:fs/promises"
import process from "node:process"
import { setTimeout } from "node:timers"

const MAX_OUTPUT_BYTES = 64 * 1024 * 1024
const TERMINATE_GRACE_MS = 2_000
const KILL_GRACE_MS = 8_000
const POLL_MS = 25

let configuration
let gate
let leaseReady = Promise.resolve()
let shuttingDown = false
let coordinatorGone = false
let stdout = Buffer.alloc(0)
let stderr = Buffer.alloc(0)
const startupLeasePath = process.argv[2]
const startupLeaseDirectory = process.argv[3]

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const processGroupExists = (processGroupId) => {
  try {
    process.kill(-processGroupId, 0)
    return true
  } catch (error) {
    if (error?.code === "ESRCH") return false
    throw error
  }
}

const signalProcessGroup = (processGroupId, signal) => {
  try {
    process.kill(-processGroupId, signal)
  } catch (error) {
    if (error?.code !== "ESRCH") throw error
  }
}

const waitForProcessGroupExit = async (processGroupId, timeoutMs) => {
  const deadline = Date.now() + timeoutMs
  while (processGroupExists(processGroupId)) {
    if (Date.now() >= deadline) return false
    await sleep(POLL_MS)
  }
  return true
}

const terminateProcessGroup = async () => {
  if (gate?.pid === undefined || !processGroupExists(gate.pid)) return
  signalProcessGroup(gate.pid, "SIGTERM")
  if (await waitForProcessGroupExit(gate.pid, TERMINATE_GRACE_MS)) return
  signalProcessGroup(gate.pid, "SIGKILL")
  if (!(await waitForProcessGroupExit(gate.pid, KILL_GRACE_MS))) {
    throw new Error(`Gate process group ${gate.pid} did not terminate`)
  }
}

const send = async (message) => {
  if (!process.connected || process.send === undefined) return
  await new Promise((resolve) => {
    process.send(message, () => resolve())
  })
}

const removeLease = async () => {
  const leasePath = configuration?.leasePath ?? startupLeasePath
  const leaseDirectory = configuration?.leaseDirectory ?? startupLeaseDirectory
  if (leasePath === undefined || leaseDirectory === undefined) return
  await rm(leasePath, { force: true })
  try {
    await rmdir(leaseDirectory)
  } catch (error) {
    if (!["ENOENT", "ENOTEMPTY"].includes(error?.code)) throw error
  }
}

const serializeError = (error) =>
  error instanceof Error ? error.message : String(error)

const finish = async (outcome) => {
  if (shuttingDown) return
  shuttingDown = true
  try {
    await leaseReady
    await terminateProcessGroup()
    await removeLease()
    await send(outcome)
    if (process.connected) process.disconnect()
    process.exitCode = outcome.type === "result" ? 0 : 1
  } catch (error) {
    await send({ type: "error", message: serializeError(error) })
    if (process.connected) process.disconnect()
    process.exitCode = 1
  }
}

const coordinatorDisconnected = async () => {
  coordinatorGone = true
  if (shuttingDown) return
  shuttingDown = true
  try {
    await leaseReady
    await terminateProcessGroup()
    await removeLease()
    if (configuration === undefined) {
      await sleep(100)
      await removeLease()
    }
    process.exitCode = 0
  } catch {
    // Preserve the lease when absence cannot be proved. Recovery fails closed.
    process.exitCode = 1
  }
}

const exactKeys = (value, keys) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  )
}

const validConfiguration = (value) =>
  exactKeys(value, [
    "type",
    "command",
    "args",
    "cwd",
    "environment",
    "leasePath",
    "leaseDirectory",
    "activationId",
    "workspace",
    "gateId",
    "coordinatorPid",
    "coordinatorNonce",
  ]) &&
  value.type === "start" &&
  typeof value.command === "string" &&
  value.command.length > 0 &&
  Array.isArray(value.args) &&
  value.args.every((argument) => typeof argument === "string") &&
  typeof value.cwd === "string" &&
  typeof value.leasePath === "string" &&
  value.leasePath === startupLeasePath &&
  typeof value.leaseDirectory === "string" &&
  value.leaseDirectory === startupLeaseDirectory &&
  typeof value.activationId === "string" &&
  typeof value.workspace === "string" &&
  typeof value.gateId === "string" &&
  Number.isSafeInteger(value.coordinatorPid) &&
  value.coordinatorPid > 0 &&
  typeof value.coordinatorNonce === "string" &&
  value.coordinatorNonce.length > 0 &&
  value.environment !== null &&
  typeof value.environment === "object" &&
  !Array.isArray(value.environment) &&
  Object.values(value.environment).every((entry) => typeof entry === "string")

const appendOutput = (current, chunk) => {
  const next = Buffer.concat([current, Buffer.from(chunk)])
  if (next.byteLength > MAX_OUTPUT_BYTES) {
    throw new Error("Activation gate output exceeded 64 MiB")
  }
  return next
}

process.once("message", async (message) => {
  if (!validConfiguration(message)) {
    await send({
      type: "error",
      message: "Invalid activation gate supervisor configuration",
    })
    process.disconnect()
    process.exitCode = 1
    return
  }
  configuration = message
  try {
    if (!process.connected || coordinatorGone || shuttingDown) {
      await removeLease()
      process.exitCode = 0
      return
    }
    gate = spawn(configuration.command, configuration.args, {
      cwd: configuration.cwd,
      env: configuration.environment,
      detached: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })
    leaseReady = writeFile(
      configuration.leasePath,
      `${JSON.stringify({
        version: 1,
        state: "active",
        activationId: configuration.activationId,
        workspace: configuration.workspace,
        gateId: configuration.gateId,
        coordinatorPid: configuration.coordinatorPid,
        coordinatorNonce: configuration.coordinatorNonce,
        supervisorPid: process.pid,
        gatePid: gate.pid,
        processGroupId: gate.pid,
      })}\n`,
      { mode: 0o600 },
    )
    gate.stdout.on("data", (chunk) => {
      try {
        stdout = appendOutput(stdout, chunk)
      } catch (error) {
        void finish({ type: "error", message: serializeError(error) })
      }
    })
    gate.stderr.on("data", (chunk) => {
      try {
        stderr = appendOutput(stderr, chunk)
      } catch (error) {
        void finish({ type: "error", message: serializeError(error) })
      }
    })
    gate.once("error", (error) => {
      void finish({ type: "error", message: serializeError(error) })
    })
    gate.once("close", (exitCode, signal) => {
      void finish({
        type: "result",
        exitCode,
        signal,
        stdout: stdout.toString("utf8"),
        stderr: stderr.toString("utf8"),
      })
    })
    await leaseReady
    if (!shuttingDown) {
      await send({ type: "started", gatePid: gate.pid })
    }
  } catch (error) {
    await finish({ type: "error", message: serializeError(error) })
  }
})

process.once("disconnect", () => {
  void coordinatorDisconnected()
})
