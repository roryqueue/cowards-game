import { Buffer } from "node:buffer"
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
    if (oneOver) expect(result.signal).toBe("SIGKILL")
    else expect(result.status).toBe(0)
  })
})
