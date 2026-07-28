#!/usr/bin/env -S pnpm exec tsx
import { once } from "node:events"
import type { AddressInfo } from "node:net"
import { writeFileSync } from "node:fs"
import {
  WORKSHOP_CHECKER_CONTRACT_VERSION,
  type WorkshopCheckerResponse,
  type WorkshopCheckerSourceFormat,
} from "../packages/spec/src/index.ts"
import { createRuntimeServiceConfig } from "../apps/runtime-service/src/runtime-config.ts"
import { createRuntimeExecutionHttpServer } from "../apps/runtime-service/src/server.ts"
import { POST as validateWorkshopSource } from "../apps/web/app/api/workshop/validate/route.ts"

const ARTIFACT_PATH = ".planning/artifacts/v1.34-workshop-checker-proof.md"

const typeScriptSource = `
export default {
  selectActivations(input) {
    return { activationOrders: [], strategyMemory: input.strategyMemory }
  },
  soldierBrain(input) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
  },
}
`

const pythonSource = `
def select_activations(input):
    return {"activationOrders": [], "strategyMemory": input["strategyMemory"]}

def soldier_brain(input):
    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
`

const rustSource = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`

const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn contains(haystack: []const u8, needle: []const u8) bool {
    if (needle.len == 0) return true;
    if (haystack.len < needle.len) return false;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return true;
    }
    return false;
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (contains(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN_TO_STONE\\"},\\"soldierMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`

const sources: Record<WorkshopCheckerSourceFormat, string> = {
  typescript: typeScriptSource,
  python: pythonSource,
  rust: rustSource,
  zig: zigSource,
}

interface CheckerProofResult {
  sourceFormat: WorkshopCheckerSourceFormat
  status: WorkshopCheckerResponse["status"]
  providerId: string
  artifactState: string
  runtimeServiceAvailability: string
  toolchainAvailability: string
  diagnosticCategories: string[]
}

const request = (sourceFormat: WorkshopCheckerSourceFormat, source: string) =>
  new Request("http://test.local/api/workshop/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceFormat, source }),
  })

const startRuntimeService = async (): Promise<{
  url: string
  close: () => Promise<void>
}> => {
  process.env.COWARDS_PROVIDER_VALIDATION_SECRET ||=
    "cowards-v1-34-workshop-checker-proof-secret"
  const server = createRuntimeExecutionHttpServer({
    runtimeConfig: createRuntimeServiceConfig({
      strategyExecutionAdapter: "worker-thread",
      allowLocalWorkerThreadFallback: true,
    }),
    bodyLimitBytes: 256 * 1024,
  })
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const address = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      }),
  }
}

const scanCheckerPrivacy = (
  checker: WorkshopCheckerResponse,
  source: string,
): void => {
  const text = JSON.stringify(checker)
  for (const forbidden of [
    "bytesBase64",
    "artifactBytesBase64",
    "hmac-sha256",
    "Traceback",
    'File "',
    "/Users/",
    "DATABASE_URL",
    "postgres://",
    "Bearer ",
    "StrategyMemory",
    "SoldierMemory",
    "objectivePayload",
    source.trim().slice(0, 32),
  ]) {
    if (forbidden.length > 0 && text.includes(forbidden)) {
      throw new Error(
        `${checker.sourceFormat} checker proof leaked forbidden marker ${forbidden}`,
      )
    }
  }
}

export const evaluateV134WorkshopChecker = async (): Promise<{
  results: CheckerProofResult[]
  unavailableProbe: WorkshopCheckerResponse
}> => {
  const previousUrl = process.env.COWARDS_RUNTIME_SERVICE_URL
  const service = await startRuntimeService()
  try {
    process.env.COWARDS_RUNTIME_SERVICE_URL = service.url
    const results: CheckerProofResult[] = []
    for (const sourceFormat of [
      "typescript",
      "python",
      "rust",
      "zig",
    ] as const) {
      const response = await validateWorkshopSource(
        request(sourceFormat, sources[sourceFormat]),
      )
      const body = (await response.json()) as {
        checker?: WorkshopCheckerResponse
      }
      if (!body.checker) {
        throw new Error(`${sourceFormat} checker response missing envelope`)
      }
      if (body.checker.contractVersion !== WORKSHOP_CHECKER_CONTRACT_VERSION) {
        throw new Error(`${sourceFormat} checker contract version mismatch`)
      }
      if (
        body.checker.status !== "ready" &&
        body.checker.status !== "toolchain_unavailable"
      ) {
        throw new Error(
          `${sourceFormat} checker returned unexpected status ${body.checker.status}`,
        )
      }
      scanCheckerPrivacy(body.checker, sources[sourceFormat])
      results.push({
        sourceFormat,
        status: body.checker.status,
        providerId: body.checker.language.providerId,
        artifactState: body.checker.artifact.state,
        runtimeServiceAvailability: body.checker.runtimeService.availability,
        toolchainAvailability: body.checker.toolchain.availability,
        diagnosticCategories: body.checker.diagnostics.map(
          (diagnostic) => diagnostic.category,
        ),
      })
    }

    delete process.env.COWARDS_RUNTIME_SERVICE_URL
    const unavailableProbeSource = `${rustSource}\n// unavailable probe\n`
    const unavailableResponse = await validateWorkshopSource(
      request("rust", unavailableProbeSource),
    )
    const unavailableBody = (await unavailableResponse.json()) as {
      checker?: WorkshopCheckerResponse
    }
    if (unavailableBody.checker?.status !== "runtime_service_unavailable") {
      throw new Error("runtime-service unavailable probe did not fail calmly")
    }
    scanCheckerPrivacy(unavailableBody.checker, unavailableProbeSource)
    return {
      results,
      unavailableProbe: unavailableBody.checker,
    }
  } finally {
    if (previousUrl === undefined) {
      delete process.env.COWARDS_RUNTIME_SERVICE_URL
    } else {
      process.env.COWARDS_RUNTIME_SERVICE_URL = previousUrl
    }
    await service.close()
  }
}

const artifactMarkdown = (input: {
  results: CheckerProofResult[]
  unavailableProbe: WorkshopCheckerResponse
}): string => `# v1.34 Workshop Checker Proof

**Generated:** ${new Date().toISOString()}
**Contract:** ${WORKSHOP_CHECKER_CONTRACT_VERSION}

## Service-Backed Paths

| Language | Status | Provider | Artifact | Runtime Service | Toolchain | Diagnostics |
| --- | --- | --- | --- | --- | --- | --- |
${input.results
  .map(
    (result) =>
      `| ${result.sourceFormat} | ${result.status} | ${result.providerId} | ${result.artifactState} | ${result.runtimeServiceAvailability} | ${result.toolchainAvailability} | ${result.diagnosticCategories.join(", ") || "none"} |`,
  )
  .join("\n")}

## Negative Probe

- Runtime-service unavailable probe status: \`${input.unavailableProbe.status}\`
- Public reason: ${input.unavailableProbe.runtimeService.publicReason ?? "n/a"}

## Privacy

Checker proof scanned for source text, raw diagnostics, artifact bytes/base64, provider proofs, host paths, env/token/database markers, StrategyMemory, SoldierMemory, and objective payload markers.

## Boundary Notes

- Workshop route returned app-owned \`workshop-checker-v1.34\` envelopes.
- Runtime-service stayed the provider validation/build/proof boundary.
- TypeScript/Python artifacts remain provenance evidence only.
- Rust/Zig remain WASM/WASI Preview 1 artifact-backed when toolchains are available.
- TinyGo is not part of this production checker proof.
`

const run = async (): Promise<number> => {
  const checkOnly = process.argv.includes("--check")
  const proof = await evaluateV134WorkshopChecker()
  const markdown = artifactMarkdown(proof)
  if (!checkOnly) {
    writeFileSync(ARTIFACT_PATH, markdown, "utf8")
  }
  console.log(markdown)
  return 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}
