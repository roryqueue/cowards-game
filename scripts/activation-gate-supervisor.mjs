#!/usr/bin/env node
import { execFile, fork } from "node:child_process"
import { randomUUID } from "node:crypto"
import { access, readdir, rename, rm, rmdir, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { setTimeout } from "node:timers"
import { fileURLToPath, URL } from "node:url"

const LAUNCHER_PATH = fileURLToPath(
  new URL("./activation-gate-launcher.mjs", import.meta.url),
)
const TERMINATE_GRACE_MS = 2_000
const KILL_GRACE_MS = 8_000
const POLL_MS = 25

let configuration
let launcher
let launcherProcessGroupId
let launcherTerminal
let launcherStarted = false
let launcherExited = false
let resolveLauncherExit
const launcherExit = new Promise((resolve) => {
  resolveLauncherExit = resolve
})
let shuttingDown = false
let coordinatorGone = false
let coordinatorAcknowledged = false
const startupLeasePath = process.argv[2]
const startupLeaseDirectory = process.argv[3]
const launcherNonce = randomUUID()

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

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
    "leasePath",
    "leaseDirectory",
    "activationId",
    "workspace",
    "gateId",
    "coordinatorPid",
    "coordinatorNonce",
    "testBoundary",
    "testControlDirectory",
  ]) &&
  value.type === "start" &&
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
  value.leasePath === startupLeasePath &&
  value.leaseDirectory === startupLeaseDirectory &&
  typeof value.activationId === "string" &&
  typeof value.workspace === "string" &&
  typeof value.gateId === "string" &&
  Number.isSafeInteger(value.coordinatorPid) &&
  value.coordinatorPid > 0 &&
  typeof value.coordinatorNonce === "string" &&
  value.coordinatorNonce.length > 0 &&
  (value.testBoundary === null || typeof value.testBoundary === "string") &&
  (value.testControlDirectory === null ||
    typeof value.testControlDirectory === "string")

const processGroupHasLiveMembers = async (processGroupId) => {
  const result = await new Promise((resolve, reject) => {
    execFile(
      "ps",
      ["ax", "-o", "pgid=,state="],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
      (error, stdout) => (error === null ? resolve({ stdout }) : reject(error)),
    )
  })
  return result.stdout
    .split("\n")
    .map((line) => line.trim().split(/\s+/u))
    .some(
      ([pgid, state]) =>
        Number(pgid) === processGroupId &&
        state !== undefined &&
        !state.startsWith("Z"),
    )
}

const signalProcessGroup = async (processGroupId, signal) => {
  try {
    process.kill(-processGroupId, signal)
  } catch (error) {
    if (error?.code === "ESRCH") return
    if (
      error?.code === "EPERM" &&
      (await waitForProcessGroupExit(processGroupId, 250))
    ) {
      return
    }
    throw error
  }
}

const waitForProcessGroupExit = async (processGroupId, timeoutMs) => {
  const deadline = Date.now() + timeoutMs
  while (await processGroupHasLiveMembers(processGroupId)) {
    if (Date.now() >= deadline) return false
    await sleep(POLL_MS)
  }
  return true
}

const terminateLauncherProcessGroup = async () => {
  if (launcher === undefined) return
  if (launcherTerminal !== undefined && !launcherExited) {
    await Promise.race([launcherExit, sleep(1_500)])
    if (
      launcherExited &&
      !(await processGroupHasLiveMembers(
        launcherProcessGroupId ?? launcher.pid,
      ))
    ) {
      return
    }
  }
  if (!launcherStarted && !launcherExited) {
    if (launcher.connected) launcher.disconnect()
    await Promise.race([launcherExit, sleep(1_000)])
    if (launcherExited) return
  }
  const processGroupId = launcherProcessGroupId ?? launcher?.pid
  if (
    !Number.isSafeInteger(processGroupId) ||
    processGroupId <= 0 ||
    !(await processGroupHasLiveMembers(processGroupId))
  ) {
    return
  }
  await signalProcessGroup(processGroupId, "SIGTERM")
  if (await waitForProcessGroupExit(processGroupId, TERMINATE_GRACE_MS)) return
  await signalProcessGroup(processGroupId, "SIGKILL")
  if (!(await waitForProcessGroupExit(processGroupId, KILL_GRACE_MS))) {
    throw new Error(
      `Gate launcher process group ${processGroupId} did not terminate`,
    )
  }
}

const sendCoordinator = async (message) => {
  if (!process.connected || process.send === undefined) return
  await new Promise((resolve) => {
    process.send(message, () => resolve())
  })
}

const sendLauncher = async (message) => {
  if (!launcher?.connected || launcher.send === undefined) {
    throw new Error("Activation gate launcher IPC is unavailable")
  }
  await new Promise((resolve, reject) => {
    launcher.send(message, (error) =>
      error === null ? resolve() : reject(error),
    )
  })
}

const atomicWriteLease = async (value) => {
  const temporary = `${configuration.leasePath}.tmp-${process.pid}-${randomUUID()}`
  try {
    await writeFile(temporary, `${JSON.stringify(value)}\n`, {
      flag: "wx",
      mode: 0o600,
    })
    await rename(temporary, configuration.leasePath)
  } finally {
    await rm(temporary, { force: true })
  }
}

const removeLease = async () => {
  const leasePath = configuration?.leasePath ?? startupLeasePath
  const leaseDirectory = configuration?.leaseDirectory ?? startupLeaseDirectory
  if (leasePath === undefined || leaseDirectory === undefined) return
  const basename = path.basename(leasePath)
  let entries = []
  try {
    entries = await readdir(leaseDirectory)
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }
  await Promise.all(
    entries
      .filter(
        (entry) => entry === basename || entry.startsWith(`${basename}.tmp-`),
      )
      .map((entry) => rm(path.join(leaseDirectory, entry), { force: true })),
  )
  try {
    await rmdir(leaseDirectory)
  } catch (error) {
    if (!["ENOENT", "ENOTEMPTY"].includes(error?.code)) throw error
  }
}

const serializeError = (error) =>
  error instanceof Error ? error.message : String(error)

const pauseAtBoundary = async (boundary) => {
  if (
    configuration?.testBoundary !== boundary ||
    configuration.testControlDirectory === null
  ) {
    return
  }
  const reached = `${configuration.testControlDirectory}/${boundary}.reached`
  const release = `${configuration.testControlDirectory}/${boundary}.release`
  const temporary = `${reached}.tmp-${process.pid}-${randomUUID()}`
  try {
    await writeFile(
      temporary,
      `${JSON.stringify({
        boundary,
        supervisorPid: process.pid,
        launcherPid: launcher?.pid ?? null,
      })}\n`,
      { flag: "wx", mode: 0o600 },
    )
    await rename(temporary, reached)
  } finally {
    await rm(temporary, { force: true })
  }
  while (!coordinatorGone && process.connected) {
    try {
      await access(release)
      return
    } catch {
      await sleep(10)
    }
  }
}

const finish = async (outcome) => {
  if (shuttingDown) return
  shuttingDown = true
  try {
    await terminateLauncherProcessGroup()
    await removeLease()
    await sendCoordinator(outcome)
    if (process.connected) process.disconnect()
    process.exitCode = outcome.type === "result" ? 0 : 1
  } catch (error) {
    await sendCoordinator({ type: "error", message: serializeError(error) })
    if (process.connected) process.disconnect()
    process.exitCode = 1
  }
}

const coordinatorDisconnected = async () => {
  coordinatorGone = true
  if (shuttingDown) return
  shuttingDown = true
  try {
    if (launcher?.connected) launcher.disconnect()
    await terminateLauncherProcessGroup()
    await removeLease()
    if (configuration === undefined) {
      await sleep(100)
      await removeLease()
    }
    process.exitCode = 0
  } catch {
    // Preserve the lease when exact in-memory group absence cannot be proved.
    process.exitCode = 1
  }
}

const handleLauncherMessage = async (message) => {
  if (message === null || typeof message !== "object") return
  if (message.type === "registered") {
    if (
      launcherProcessGroupId !== undefined ||
      !Number.isSafeInteger(message.processGroupId) ||
      message.processGroupId <= 0 ||
      message.processGroupId !== launcher?.pid ||
      message.coordinatorNonce !== configuration.coordinatorNonce ||
      message.launcherNonce !== launcherNonce
    ) {
      await finish({ type: "error", message: "Invalid launcher registration" })
      return
    }
    launcherProcessGroupId = message.processGroupId
    await sendCoordinator({
      type: "launcher-registered",
      processGroupId: launcherProcessGroupId,
      coordinatorNonce: configuration.coordinatorNonce,
    })
    launcherStarted = true
    return
  }
  if (message.type === "started") {
    if (
      !coordinatorAcknowledged ||
      message.processGroupId !== launcherProcessGroupId ||
      !Number.isSafeInteger(message.commandPid) ||
      message.commandPid <= 0 ||
      message.coordinatorNonce !== configuration.coordinatorNonce ||
      message.launcherNonce !== launcherNonce
    ) {
      await finish({ type: "error", message: "Invalid launcher start" })
      return
    }
    await sendCoordinator({
      type: "started",
      processGroupId: launcherProcessGroupId,
      commandPid: message.commandPid,
    })
    return
  }
  if (message.type === "result" || message.type === "error") {
    if (launcherTerminal !== undefined) {
      await finish({ type: "error", message: "Duplicate launcher terminal" })
      return
    }
    launcherTerminal = message
    await finish(message)
  }
}

const acknowledgeCoordinator = async (message) => {
  if (
    configuration === undefined ||
    coordinatorAcknowledged ||
    launcherProcessGroupId === undefined ||
    !exactKeys(message, ["type", "coordinatorNonce", "processGroupId"]) ||
    message.type !== "ack-launcher" ||
    message.coordinatorNonce !== configuration.coordinatorNonce ||
    message.processGroupId !== launcherProcessGroupId
  ) {
    await finish({ type: "error", message: "Invalid coordinator launcher ACK" })
    return
  }
  coordinatorAcknowledged = true
  await pauseAtBoundary("after-coordinator-ack")
  if (coordinatorGone || shuttingDown) return
  await pauseAtBoundary("before-active-lease")
  if (coordinatorGone || shuttingDown) return
  await atomicWriteLease({
    version: 1,
    state: "active",
    activationId: configuration.activationId,
    workspace: configuration.workspace,
    gateId: configuration.gateId,
    coordinatorPid: configuration.coordinatorPid,
    coordinatorNonce: configuration.coordinatorNonce,
    supervisorPid: process.pid,
    gatePid: launcherProcessGroupId,
    processGroupId: launcherProcessGroupId,
  })
  await pauseAtBoundary("after-active-lease")
  if (coordinatorGone || shuttingDown) return
  await sendLauncher({
    type: "release",
    coordinatorNonce: configuration.coordinatorNonce,
    launcherNonce,
    processGroupId: launcherProcessGroupId,
  })
}

process.on("message", (message) => {
  void (async () => {
    if (configuration !== undefined) {
      await acknowledgeCoordinator(message)
      return
    }
    if (!validConfiguration(message)) {
      await sendCoordinator({
        type: "error",
        message: "Invalid activation gate supervisor configuration",
      })
      if (process.connected) process.disconnect()
      process.exitCode = 1
      return
    }
    configuration = message
    try {
      await pauseAtBoundary("before-launcher-spawn")
      if (coordinatorGone || shuttingDown) return
      launcher = fork(LAUNCHER_PATH, [], {
        detached: true,
        execArgv: [],
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      })
      if (launcher.pid === undefined || launcher.pid <= 0) {
        throw new Error("Activation gate launcher did not receive a PID")
      }
      launcher.on("message", (launcherMessage) => {
        void handleLauncherMessage(launcherMessage)
      })
      launcher.once("error", (error) => {
        void finish({ type: "error", message: serializeError(error) })
      })
      launcher.once("exit", (code, signal) => {
        void (async () => {
          launcherExited = true
          resolveLauncherExit()
          if (shuttingDown) return
          if (launcherTerminal === undefined) {
            await finish({
              type: "error",
              message: `Activation gate launcher exited unexpectedly (${String(code)}/${String(signal)})`,
            })
            return
          }
          await finish(launcherTerminal)
        })()
      })
      await pauseAtBoundary("after-launcher-spawn")
      if (coordinatorGone || shuttingDown) return
      await sendLauncher({
        type: "configure",
        command: configuration.command,
        args: configuration.args,
        cwd: configuration.cwd,
        environment: configuration.environment,
        databaseUrl: configuration.databaseUrl,
        advisoryLockKey: configuration.advisoryLockKey,
        coordinatorNonce: configuration.coordinatorNonce,
        launcherNonce,
      })
    } catch (error) {
      await finish({ type: "error", message: serializeError(error) })
    }
  })()
})

process.once("disconnect", () => {
  void coordinatorDisconnected()
})
