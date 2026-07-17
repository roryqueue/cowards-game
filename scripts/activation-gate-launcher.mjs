#!/usr/bin/env node
import { Buffer } from "node:buffer"
import { spawn } from "node:child_process"
import process from "node:process"
import { setTimeout } from "node:timers"

const MAX_OUTPUT_BYTES = 64 * 1024 * 1024

let configuration
let commandProcess
let released = false
let shuttingDown = false
let stdout = Buffer.alloc(0)
let stderr = Buffer.alloc(0)

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
    "coordinatorNonce",
    "launcherNonce",
  ]) &&
  value.type === "configure" &&
  typeof value.command === "string" &&
  value.command.length > 0 &&
  Array.isArray(value.args) &&
  value.args.every((argument) => typeof argument === "string") &&
  typeof value.cwd === "string" &&
  value.environment !== null &&
  typeof value.environment === "object" &&
  !Array.isArray(value.environment) &&
  Object.values(value.environment).every(
    (entry) => typeof entry === "string",
  ) &&
  typeof value.coordinatorNonce === "string" &&
  value.coordinatorNonce.length > 0 &&
  typeof value.launcherNonce === "string" &&
  value.launcherNonce.length > 0

const validRelease = (value) =>
  exactKeys(value, [
    "type",
    "coordinatorNonce",
    "launcherNonce",
    "processGroupId",
  ]) &&
  value.type === "release" &&
  configuration !== undefined &&
  value.coordinatorNonce === configuration.coordinatorNonce &&
  value.launcherNonce === configuration.launcherNonce &&
  Number.isSafeInteger(value.processGroupId) &&
  value.processGroupId === process.pid

const send = async (message) => {
  if (!process.connected || process.send === undefined) return
  await new Promise((resolve) => {
    process.send(message, () => resolve())
  })
}

const serializeError = (error) =>
  error instanceof Error ? error.message : String(error)

const appendOutput = (current, chunk) => {
  const next = Buffer.concat([current, Buffer.from(chunk)])
  if (next.byteLength > MAX_OUTPUT_BYTES) {
    throw new Error("Activation gate output exceeded 64 MiB")
  }
  return next
}

const fail = async (error) => {
  if (shuttingDown) return
  shuttingDown = true
  await send({ type: "error", message: serializeError(error) })
  if (process.connected) process.disconnect()
  if (commandProcess !== undefined) {
    beginOwnProcessGroupTermination()
    return
  }
  process.exitCode = 1
}

const beginOwnProcessGroupTermination = () => {
  process.on("SIGTERM", () => {})
  try {
    process.kill(-process.pid, "SIGTERM")
  } catch (error) {
    if (error?.code !== "ESRCH") throw error
  }
  setTimeout(() => {
    try {
      process.kill(-process.pid, "SIGKILL")
    } catch (error) {
      if (error?.code !== "ESRCH") throw error
    }
  }, 250)
}

const terminateOwnProcessGroup = () => {
  if (shuttingDown) return
  shuttingDown = true
  if (commandProcess === undefined) {
    process.exitCode = 0
    return
  }
  beginOwnProcessGroupTermination()
}

process.on("message", async (message) => {
  if (configuration === undefined) {
    if (!validConfiguration(message)) {
      await fail("Invalid activation gate launcher configuration")
      return
    }
    configuration = message
    await send({
      type: "registered",
      processGroupId: process.pid,
      coordinatorNonce: configuration.coordinatorNonce,
      launcherNonce: configuration.launcherNonce,
    })
    return
  }
  if (released || !validRelease(message)) {
    await fail("Invalid activation gate launcher release")
    return
  }
  released = true
  try {
    commandProcess = spawn(configuration.command, configuration.args, {
      cwd: configuration.cwd,
      env: configuration.environment,
      detached: false,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    })
    commandProcess.stdout.on("data", (chunk) => {
      try {
        stdout = appendOutput(stdout, chunk)
      } catch (error) {
        void fail(error)
      }
    })
    commandProcess.stderr.on("data", (chunk) => {
      try {
        stderr = appendOutput(stderr, chunk)
      } catch (error) {
        void fail(error)
      }
    })
    commandProcess.once("error", (error) => {
      void fail(error)
    })
    commandProcess.once("close", (exitCode, signal) => {
      if (shuttingDown) return
      shuttingDown = true
      void (async () => {
        await send({
          type: "result",
          exitCode,
          signal,
          stdout: stdout.toString("utf8"),
          stderr: stderr.toString("utf8"),
        })
        if (process.connected) process.disconnect()
        process.exitCode = 0
      })()
    })
    await send({
      type: "started",
      processGroupId: process.pid,
      commandPid: commandProcess.pid,
      coordinatorNonce: configuration.coordinatorNonce,
      launcherNonce: configuration.launcherNonce,
    })
  } catch (error) {
    await fail(error)
  }
})

process.once("disconnect", () => {
  terminateOwnProcessGroup()
})
