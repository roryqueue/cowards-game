import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  applyV138RestartableLifecycleTransaction,
  type V138LifecycleTransactionBoundary,
} from "./v1-38-restartable-lifecycle-successor-v1.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-lifecycle-successor-"))
  roots.push(root)
  const planning = path.join(root, "planning")
  mkdirSync(planning)
  const targets = [
    ["requirements", "ADMIT-03: pending\n", "ADMIT-03: complete\n"],
    ["roadmap", "phase262: incomplete\n", "phase262: complete\n"],
    [
      "state",
      "history:\n",
      "history:\n- Completed 262-89-PLAN.md\n",
    ],
    ["phase_complete", "status: active\n", "status: complete\n"],
  ] as const
  const steps = targets.map(([id, before, after]) => {
    const target = path.join(planning, `${id}.md`)
    writeFileSync(target, before, { mode: 0o600 })
    return { id, target, beforeSha256: sha256(before), afterBytes: after }
  })
  return {
    root,
    intentPath: path.join(root, ".lifecycle-intent.json"),
    lockPath: path.join(root, ".lifecycle.lock"),
    lifecycleTarget: path.join(root, "lifecycle-status-v3.json"),
    lifecycleBytes: "{\"status\":\"passed-synthetic\"}\n",
    steps,
  }
}

describe("CR-05 restartable pass-side lifecycle transaction", () => {
  it.each([
    "step:requirements:applied",
    "step:roadmap:applied",
    "step:state:applied",
    "step:phase_complete:applied",
    "lifecycle:published",
  ] as V138LifecycleTransactionBoundary[])(
    "converges from injected failure after %s with no duplicate history",
    (boundary) => {
      const input = fixture()
      expect(() =>
        applyV138RestartableLifecycleTransaction({
          transactionId: "phase262-pass-v3",
          intentPath: input.intentPath,
          lockPath: input.lockPath,
          steps: input.steps,
          lifecycle: {
            target: input.lifecycleTarget,
            bytes: input.lifecycleBytes,
          },
          crashBoundary: (current) => {
            if (current === boundary) throw new Error(`injected:${boundary}`)
          },
        }),
      ).toThrow(`injected:${boundary}`)

      const recovered = applyV138RestartableLifecycleTransaction({
        transactionId: "phase262-pass-v3",
        intentPath: input.intentPath,
        lockPath: input.lockPath,
        steps: input.steps,
        lifecycle: {
          target: input.lifecycleTarget,
          bytes: input.lifecycleBytes,
        },
      })
      expect(recovered).toMatchObject({ status: "complete", stepsApplied: 4 })
      for (const step of input.steps) {
        expect(readFileSync(step.target, "utf8")).toBe(step.afterBytes)
      }
      expect(
        readFileSync(input.steps[2]!.target, "utf8").match(
          /Completed 262-89-PLAN\.md/gu,
        ),
      ).toHaveLength(1)
      expect(readFileSync(input.lifecycleTarget, "utf8")).toBe(
        input.lifecycleBytes,
      )
      expect(existsSync(input.intentPath)).toBe(false)

      expect(
        applyV138RestartableLifecycleTransaction({
          transactionId: "phase262-pass-v3",
          intentPath: input.intentPath,
          lockPath: input.lockPath,
          steps: input.steps,
          lifecycle: {
            target: input.lifecycleTarget,
            bytes: input.lifecycleBytes,
          },
        }),
      ).toMatchObject({ status: "complete", stepsApplied: 4 })
      expect(
        readFileSync(input.steps[2]!.target, "utf8").match(
          /Completed 262-89-PLAN\.md/gu,
        ),
      ).toHaveLength(1)
    },
  )

  it("fails closed before later steps when a mutable target matches neither hash", () => {
    const input = fixture()
    writeFileSync(input.steps[1]!.target, "foreign\n")
    expect(() =>
      applyV138RestartableLifecycleTransaction({
        transactionId: "phase262-pass-v3",
        intentPath: input.intentPath,
        lockPath: input.lockPath,
        steps: input.steps,
        lifecycle: {
          target: input.lifecycleTarget,
          bytes: input.lifecycleBytes,
        },
      }),
    ).toThrow("V138_LIFECYCLE_STEP_STATE_INVALID")
    expect(readFileSync(input.steps[1]!.target, "utf8")).toBe("foreign\n")
    expect(readFileSync(input.steps[2]!.target, "utf8")).toBe("history:\n")
    expect(existsSync(input.lifecycleTarget)).toBe(false)
  })
})
