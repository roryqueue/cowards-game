import { getSupportedStrategyLanguageBySourceFormat } from "@cowards/spec"
import type { WorkshopErrorResponse } from "../../../workshop/types.js"
import { workshopServer } from "../../../workshop/server.js"

const runtimeServiceValidateWasmWasi = async (
  sourceFormat: "rust" | "zig",
  source: string,
) => {
  const endpoint = process.env.COWARDS_RUNTIME_SERVICE_URL?.replace(/\/$/, "")
  const label =
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.label ??
    "WASM/WASI"
  if (!endpoint) {
    return {
      ok: false,
      validation: {
        valid: false,
        errors: [
          {
            code: "TRANSPILE_FAILED",
            severity: "error",
            message: `${label} WASM/WASI validation requires COWARDS_RUNTIME_SERVICE_URL.`,
          },
        ],
        warnings: [],
        sourceBytes: new TextEncoder().encode(source).length,
        forbiddenPatterns: [],
        sourceHash: "",
        runtimeVersion: "0.1.0-alpha",
        engineCompatibility: {
          spec: "cowards-rules-v1.4",
          engine: "engine-v1",
        },
      },
    }
  }
  const response = await fetch(`${endpoint}/validate-strategy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceFormat, source }),
  })
  return (await response.json()) as { validation?: unknown }
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.source !== "string") {
    return Response.json(
      { error: "source is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  if (
    body.sourceFormat !== undefined &&
    body.sourceFormat !== "typescript" &&
    body.sourceFormat !== "python" &&
    body.sourceFormat !== "rust" &&
    body.sourceFormat !== "zig"
  ) {
    return Response.json(
      { error: "unsupported sourceFormat" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  const sourceFormat = body.sourceFormat ?? "typescript"

  if (sourceFormat === "rust" || sourceFormat === "zig") {
    const result = await runtimeServiceValidateWasmWasi(
      sourceFormat,
      body.source,
    )
    return Response.json({ validation: result.validation })
  }

  return Response.json({
    validation: workshopServer.validateSource(body.source, sourceFormat),
  })
}
