import { Buffer } from "node:buffer"
import { describe, expect, it, vi } from "vitest"
import { SubprocessSystemFailure } from "../../packages/runtime-js/src/subprocess-ipc.js"
import {
  createLeanContainerMatchSession,
  type LeanContainerMatchTransport,
  type LeanContainerPersistentStream,
  type LeanContainerTransportResult,
} from "./v1-38-lean-container-match-session.js"

// Isolated process-local fixtures: no Worker, child process, provider, Strategy
// execution, real Docker, lab allocation or consumed empirical reader.
describe("native subprocess attribution across cleanup failure", () => {
  describe.each([
    "signal",
    "stream-error",
    "stale-frame",
    "explicit-close",
  ] as const)("primary %s", (failure) => {
    it.each(["stream-close", "remove", "absence-check", "all"] as const)(
      "should preserve primary attribution and fail-closed cleanup when %s throws",
      (fault) => {
        const name = "synthetic-signal-attribution"
        const label = "synthetic-owner"
        let exists = false
        let cleanup = false
        const calls: string[] = []
        const result = (stdout = ""): LeanContainerTransportResult => ({
          status: 0,
          signal: null,
          stdout: Buffer.from(stdout),
          stderr: Buffer.alloc(0),
        })
        const transport: LeanContainerMatchTransport = (_command, args) => {
          calls.push(args[0]!)
          if (args[0] === "inspect") {
            if (cleanup && (fault === "absence-check" || fault === "all"))
              throw new Error("synthetic cleanup failure")
            return exists
              ? result(`${label}\n`)
              : {
                  status: 1,
                  signal: null,
                  stdout: Buffer.alloc(0),
                  stderr: Buffer.from(`Error: No such object: ${name}\n`),
                }
          }
          if (args[0] === "create") {
            exists = true
            return result("synthetic-id\n")
          }
          if (args[0] === "rm") {
            cleanup = true
            if (fault === "remove" || fault === "all")
              throw new Error("synthetic cleanup failure")
            exists = false
          }
          return result()
        }
        const primary = new SubprocessSystemFailure(
          "SUBPROCESS_EXIT",
          "synthetic primary failure",
        )
        const exchange = vi.fn(() => {
          if (failure === "stream-error") throw primary
          return Buffer.from(
            `${JSON.stringify({
              requestId: failure === "stale-frame" ? 99 : 1,
              status: failure === "signal" ? null : 0,
              signal: failure === "signal" ? "SIGKILL" : null,
              stdoutBase64: "",
              stderrBase64: "",
            })}\n`,
          )
        })
        const close = vi.fn(() => {
          cleanup = true
          if (fault === "stream-close" || fault === "all")
            throw new Error("synthetic cleanup failure")
          return result()
        })
        const stream: LeanContainerPersistentStream = { exchange, close }
        const session = createLeanContainerMatchSession({
          matchId: "synthetic-attribution",
          containerName: name,
          ownershipLabel: label,
          image: "synthetic-image",
          transport,
          streamFactory: () => stream,
        })
        let captured: unknown
        if (failure !== "explicit-close") {
          try {
            session.adapter.execute({
              source: "inert synthetic bytes",
              methodName: "selectActivations",
              input: {},
              timeoutMs: 1000,
            })
          } catch (error) {
            captured = error
          }
        }
        // Match only finite classification; never print an error/stdio payload.
        expect(
          captured instanceof SubprocessSystemFailure ? captured.code : null,
        ).toBe(
          failure === "signal"
            ? "SUBPROCESS_SIGNAL"
            : failure === "stream-error"
              ? "SUBPROCESS_EXIT"
              : failure === "stale-frame"
                ? "MALFORMED_IPC"
                : null,
        )
        if (failure === "stream-error") {
          expect(captured === primary).toBe(true)
          expect(session.failureOrigin(captured)).toEqual({
            stage: "stream_exchange",
            reason: "unknown",
          })
        } else if (failure === "stale-frame") {
          expect(session.failureOrigin(captured)).toEqual({
            stage: "outer_frame",
            reason: "correlation_invalid",
          })
        } else expect(session.failureOrigin(captured)).toBeUndefined()
        expect(session.close()).toEqual({
          cleanupComplete: false,
          orphanedChild: true,
        })
        expect(session.state).toBe(
          failure === "explicit-close" ? "closed" : "poisoned",
        )
        expect(session.close()).toEqual({
          cleanupComplete: false,
          orphanedChild: true,
        })
        expect(close).toHaveBeenCalledOnce()
        expect(calls.filter((call) => call === "rm")).toHaveLength(1)
        expect(calls.filter((call) => call === "inspect")).toHaveLength(3)
        expect(() =>
          session.adapter.execute({
            source: "inert synthetic bytes",
            methodName: "selectActivations",
            input: {},
          }),
        ).toThrow(
          failure === "explicit-close" ? "SESSION_CLOSED" : "SESSION_POISONED",
        )
        expect(exchange).toHaveBeenCalledTimes(
          failure === "explicit-close" ? 0 : 1,
        )
      },
    )
  })
})
