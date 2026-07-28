import { spawnSync } from "node:child_process"
import { Buffer } from "node:buffer"
import {
  SoldierBrainResultSchema,
  StrategyResultSchema,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyRevision,
  type StrategyResult,
} from "@cowards/spec"
import type { RuntimeResult, StrategyRuntime } from "@cowards/engine"

const IMAGE = /^[A-Za-z0-9._/:@-]+$/u

const HARNESS = String.raw`
import base64,json,sys
namespace={}
request=json.load(sys.stdin)
source=base64.b64decode(request["sourceBase64"]).decode("utf-8")
exec(compile(source,"<strategy>","exec"),namespace)
method=request["method"]
value=request["input"]
if method=="selectActivations":
    result=namespace["select_activations"](value)
else:
    result=namespace["soldier_brain"](value)
sys.stdout.write(json.dumps(result,separators=(",",":"),sort_keys=True))
`

const invoke = (
  revision: StrategyRevision,
  image: string,
  method: "selectActivations" | "soldierBrain",
  input: StrategyInput | SoldierBrainInput,
  timeoutMs: number,
  stdoutBytes: number,
) => {
  if (!IMAGE.test(image) || image.startsWith("-")) {
    throw new TypeError("Pinned Python image identity is invalid.")
  }
  if (revision.metadata.sourceArtifact?.bytesBase64 === undefined) {
    throw new TypeError("Pinned Python source artifact is unavailable.")
  }
  const source = Buffer.from(revision.source, "utf8")
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--interactive",
      "--network",
      "none",
      "--read-only",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--memory",
      "64m",
      "--cpus",
      "0.5",
      "--pids-limit",
      "16",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=16m",
      image,
      "python3",
      "-I",
      "-S",
      "-c",
      HARNESS,
    ],
    {
      input: JSON.stringify({ method, input, sourceBase64: source.toString("base64") }),
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "" },
      maxBuffer: stdoutBytes,
      shell: false,
      timeout: timeoutMs,
    },
  )
  if (result.error || result.status !== 0 || result.signal !== null) {
    throw new TypeError("Pinned Python contained invocation failed.")
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    return {
      ok: false as const,
      violation: {
        type: "INVALID_OUTPUT" as const,
        message: "Strategy output was not valid JSON",
      },
    }
  }
  const admitted =
    method === "selectActivations"
      ? StrategyResultSchema.safeParse(parsed)
      : SoldierBrainResultSchema.safeParse(parsed)
  return admitted.success
    ? { ok: true as const, value: admitted.data }
    : {
        ok: false as const,
        violation: {
          type: "INVALID_OUTPUT" as const,
          message: "Strategy output did not match the runtime ABI",
        },
      }
}

export const createPinnedPythonContainerRuntime = (input: {
  revision: StrategyRevision
  image: string
  timeoutMs: number
  stdoutBytes: number
}): StrategyRuntime => ({
  selectActivations: (value) =>
    invoke(
      input.revision,
      input.image,
      "selectActivations",
      value,
      input.timeoutMs,
      input.stdoutBytes,
    ) as RuntimeResult<StrategyResult>,
  runSoldierBrain: (value) =>
    invoke(
      input.revision,
      input.image,
      "soldierBrain",
      value,
      input.timeoutMs,
      input.stdoutBytes,
    ) as RuntimeResult<SoldierBrainResult>,
})
