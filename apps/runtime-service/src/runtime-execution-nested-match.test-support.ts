import { createNestedMatchShapeRuntimeFromRevisionTestSupport } from "../../../packages/runtime-js/src/executor.js"
import { createPythonNestedMatchShapeRuntimeTestSupport } from "../../../packages/runtime-python/src/python-subprocess-adapter.js"
import { createWasmWasiNestedMatchShapeRuntimeTestSupport } from "../../../packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.js"
import { adaptRuntimeForCurrentKernel } from "../../../packages/engine/src/test/current-kernel-runtime.js"
import {
  executeNestedMatchServiceFixtureOnly,
  validateNestedMatchRuntimeRevisionTestSupport,
  type RuntimeExecutionServiceDependencies,
} from "./execute-match.js"
import type { RuntimeServiceConfig } from "./runtime-config.js"

export type NestedMatchServiceTestOverrides = Omit<
  Partial<RuntimeExecutionServiceDependencies>,
  "adaptRuntimeForCurrentMatch" | "createRuntimeForRevision"
> & {
  createAdmittedRuntimeForRevision?:
    | RuntimeExecutionServiceDependencies["createRuntimeForRevision"]
    | undefined
}

/**
 * Selected-pointer test support for the nested Match-shaped executor carried
 * by the authenticated v1.17 service. This is not historical v1.14/v1.16
 * evidence and production modules must never import it.
 */
export const executeNestedMatchServiceTestSupport = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: NestedMatchServiceTestOverrides = {},
) => {
  const { createAdmittedRuntimeForRevision, ...guardedOverrides } =
    dependencyOverrides
  return executeNestedMatchServiceFixtureOnly(rawRequest, runtimeConfig, {
    ...guardedOverrides,
    adaptRuntimeForCurrentMatch: adaptRuntimeForCurrentKernel,
    createRuntimeForRevision: (revision, config, limits) => {
      const admitted = validateNestedMatchRuntimeRevisionTestSupport(
        revision,
        config,
        limits,
      )
      if (!admitted.ok) return admitted
      if (createAdmittedRuntimeForRevision !== undefined) {
        return createAdmittedRuntimeForRevision(revision, config, limits)
      }
      const timeoutMs = Math.min(
        limits.timeoutMs,
        revision.runtime.limits.timeoutMs,
      )
      const stdoutBytes = Math.min(
        limits.stdoutBytes,
        revision.runtime.limits.stdoutBytes,
      )
      const stderrBytes = Math.min(
        limits.stderrBytes,
        revision.runtime.limits.stderrBytes,
      )
      const language = revision.runtime.language.id
      return {
        ok: true,
        runtime:
          language === "python"
            ? createPythonNestedMatchShapeRuntimeTestSupport(revision, {
                timeoutMs,
                stdoutBytes,
                stderrBytes,
              })
            : language === "rust" || language === "zig"
              ? createWasmWasiNestedMatchShapeRuntimeTestSupport(revision, {
                  timeoutMs,
                  stdoutBytes,
                  stderrBytes,
                })
              : createNestedMatchShapeRuntimeFromRevisionTestSupport(revision, {
                  adapter: config.adapter,
                  timeoutMs,
                  outputByteLimit: stdoutBytes,
                }),
      }
    },
  })
}
