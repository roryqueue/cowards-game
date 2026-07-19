/* eslint-disable no-restricted-imports -- Fixture-only service dispatch requires intentionally unexported runtime test seams. */
import type { CanonicalStrategyRuntime, StrategyRuntime } from "@cowards/engine"
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  VersionedRuntimeExecutionServiceRequestV117Schema,
} from "@cowards/spec"
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

export type CurrentMatchServiceTestOverrides = Omit<
  Partial<RuntimeExecutionServiceDependencies>,
  "adaptRuntimeForCurrentMatch" | "createRuntimeForRevision"
> & {
  createAdmittedRuntimeForRevision?:
    | RuntimeExecutionServiceDependencies["createRuntimeForRevision"]
    | undefined
}

const adaptRuntime = (runtime: StrategyRuntime): CanonicalStrategyRuntime =>
  adaptRuntimeForCurrentKernel(runtime)

/**
 * Selected-pointer test support for service tests that execute the canonical
 * Match. Legacy fixture runtimes stay unchanged while v1.17-current fixtures
 * are wrapped in the authenticated request/outcome contract required by the
 * kernel. Production modules must never import this helper.
 */
export const executeCurrentMatchServiceTestSupport = (
  rawRequest: unknown,
  runtimeConfig: RuntimeServiceConfig,
  dependencyOverrides: CurrentMatchServiceTestOverrides = {},
) => {
  const { createAdmittedRuntimeForRevision, ...guardedOverrides } =
    dependencyOverrides
  const versionedV117 =
    String(STRATEGY_RUNTIME_ABI_VERSION) !== "strategy-runtime-abi-v1.17" &&
    VersionedRuntimeExecutionServiceRequestV117Schema.safeParse(rawRequest)
      .success
  return executeNestedMatchServiceFixtureOnly(rawRequest, runtimeConfig, {
    ...guardedOverrides,
    adaptRuntimeForCurrentMatch: adaptRuntime,
    createRuntimeForRevision: (revision, config, limits) => {
      const admitted = validateNestedMatchRuntimeRevisionTestSupport(
        revision,
        config,
        limits,
        versionedV117 ? "strategy-runtime-abi-v1.17" : undefined,
      )
      if (!admitted.ok) return admitted
      if (createAdmittedRuntimeForRevision !== undefined) {
        const created = createAdmittedRuntimeForRevision(
          revision,
          config,
          limits,
        )
        return created
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
      const runtime =
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
              })
      return { ok: true, runtime }
    },
  })
}
