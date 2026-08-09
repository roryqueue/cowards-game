import { Buffer } from "node:buffer"
import { writeSync } from "node:fs"
import {
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
  encodeV138CurrentMatrixChildProtocolV2Ready,
  encodeV138CurrentMatrixChildProtocolV2Terminal,
} from "../lib/v1-38-current-matrix-child-protocol.js"

const controlDescriptor = 3
const writeControl = (bytes: Uint8Array): void => {
  writeSync(controlDescriptor, bytes)
}
const ready = (): void => {
  writeControl(encodeV138CurrentMatrixChildProtocolV2Ready())
}
const terminal = (
  outcome:
    | "success"
    | "RUNTIME_EXECUTION_FAILED"
    | "SHARD_COORDINATION_FAILED",
): void => {
  writeControl(encodeV138CurrentMatrixChildProtocolV2Terminal(outcome))
}
const raw = (value: string | Uint8Array): void => {
  writeControl(typeof value === "string" ? Buffer.from(value, "utf8") : value)
}
const result = (classification: "success" | "system_failure"): void => {
  process.stdout.write(`${JSON.stringify(
    classification === "success"
      ? { classification, outcome: "draw" }
      : { classification, code: "EXECUTION_CAPTURE_MISSING", retryable: false },
  )}\n`)
}

switch (process.argv[2]) {
  case "success":
    ready()
    result("success")
    terminal("success")
    break
  case "expected-runtime-failure":
    ready()
    result("system_failure")
    terminal("success")
    break
  case "runtime-failure":
    ready()
    terminal("RUNTIME_EXECUTION_FAILED")
    break
  case "shard-failure":
    ready()
    terminal("SHARD_COORDINATION_FAILED")
    break
  case "no-ready":
    break
  case "ready-only":
    ready()
    break
  case "duplicate-ready":
    ready()
    ready()
    terminal("success")
    break
  case "terminal-before-ready":
    terminal("success")
    ready()
    break
  case "duplicate-terminal":
    ready()
    terminal("success")
    terminal("success")
    break
  case "conflicting-terminal":
    ready()
    terminal("RUNTIME_EXECUTION_FAILED")
    terminal("SHARD_COORDINATION_FAILED")
    break
  case "unknown-frame":
    ready()
    raw(`{"frame":"unknown","schemaVersion":"${V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA}"}\n`)
    break
  case "extra-key":
    ready()
    raw(`{"extra":true,"frame":"terminal","outcome":"success","schemaVersion":"${V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA}"}\n`)
    break
  case "unknown-family":
    ready()
    raw(`{"failureFamily":"UNKNOWN","frame":"terminal","outcome":"integrity_failure","schemaVersion":"${V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA}"}\n`)
    break
  case "noncanonical":
    raw(`{"schemaVersion":"${V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA}","frame":"ready"}\n`)
    terminal("success")
    break
  case "malformed-json":
    raw("{\n")
    break
  case "invalid-utf8":
    raw(Buffer.from([0xc3, 0x28, 0x0a]))
    break
  case "oversize":
    raw(Buffer.alloc(V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES + 1, 0x78))
    break
  case "stderr":
    ready()
    terminal("success")
    process.stderr.write("x")
    break
  default:
    process.exitCode = 64
}
