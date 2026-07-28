#!/usr/bin/env node
import { Buffer } from "node:buffer"
import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import process from "node:process"
import { setTimeout } from "node:timers"
import { URL } from "node:url"

const MAX_OUTPUT_BYTES = 64 * 1024 * 1024

let configuration
let commandProcess
let livenessClient
let released = false
let shuttingDown = false
let terminalReported = false
let stdout = Buffer.alloc(0)
let stderr = Buffer.alloc(0)

const requireFromPersistence = createRequire(
  new URL("../packages/persistence/package.json", import.meta.url),
)
const { Client } = requireFromPersistence("pg")

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
    "databaseUrl",
    "advisoryLockKey",
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
  typeof value.databaseUrl === "string" &&
  value.databaseUrl.length > 0 &&
  typeof value.advisoryLockKey === "string" &&
  /^-?(?:0|[1-9][0-9]*)$/.test(value.advisoryLockKey) &&
  BigInt(value.advisoryLockKey) >= -(1n << 63n) &&
  BigInt(value.advisoryLockKey) < 1n << 63n &&
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
  if (shuttingDown || terminalReported) return
  terminalReported = true
  await send({ type: "error", message: serializeError(error) })
  if (!process.connected) terminateOwnProcessGroup()
  setTimeout(() => terminateOwnProcessGroup(), 1_000)
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
    void (async () => {
      try {
        await livenessClient?.end()
      } finally {
        process.exitCode = 0
      }
    })()
    return
  }
  beginOwnProcessGroupTermination()
}

const acquireLivenessLock = async () => {
  const client = new Client({
    connectionString: configuration.databaseUrl,
    connectionTimeoutMillis: 5_000,
    application_name: `cowards-activation-gate:${process.pid}`,
  })
  livenessClient = client
  client.on("error", (error) => {
    void fail(
      new Error(
        `Activation gate liveness session failed: ${serializeError(error)}`,
      ),
    )
  })
  await client.connect()
  const result = await client.query(
    "select pg_try_advisory_lock($1::bigint) as acquired",
    [configuration.advisoryLockKey],
  )
  if (result.rows.length !== 1 || result.rows[0]?.acquired !== true) {
    await client.end()
    livenessClient = undefined
    throw new Error("Activation gate liveness lock is already held")
  }
}

process.on("message", async (message) => {
  if (configuration === undefined) {
    if (!validConfiguration(message)) {
      await fail("Invalid activation gate launcher configuration")
      return
    }
    configuration = message
    try {
      await acquireLivenessLock()
    } catch (error) {
      await fail(error)
      return
    }
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
      if (shuttingDown || terminalReported) return
      terminalReported = true
      void (async () => {
        await send({
          type: "result",
          exitCode,
          signal,
          stdout: stdout.toString("utf8"),
          stderr: stderr.toString("utf8"),
        })
        if (!process.connected) terminateOwnProcessGroup()
        setTimeout(() => terminateOwnProcessGroup(), 1_000)
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
