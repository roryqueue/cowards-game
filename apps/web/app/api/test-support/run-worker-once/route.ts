import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface WorkerProcessResult {
  stdout: string
  stderr: string
}

type RouteEnv = Partial<Record<string, string | undefined>>
type WorkerFailureLayer = "worker_execution"

export interface RunWorkerOnceRouteDeps {
  env?: RouteEnv | undefined
  runWorkerProcess?:
    | ((env: RouteEnv) => Promise<WorkerProcessResult>)
    | undefined
}

export const isWorkerTestSupportEnabled = (
  env: RouteEnv = process.env,
): boolean => env.PLAYWRIGHT_TEST === "1" || env.NODE_ENV === "test"

const workerScript = `
  import { createDatabasePool } from "@cowards/persistence";
  import { runWorkerOnce } from "./src/runner.ts";

  const pool = createDatabasePool();
  const workerId = process.env.COWARDS_TEST_WORKER_ID ?? "worker:test-support";
  const maxJobs = Number.parseInt(process.env.COWARDS_TEST_WORKER_MAX_JOBS ?? "8", 10);
  const executed = [];

  void (async () => {
    try {
      for (let index = 0; index < maxJobs; index += 1) {
        const status = await runWorkerOnce(pool, {
          workerId,
          jobOwnership: {
            lifecycleOwner: "go",
            workerPurpose: "test",
          },
        });
        if (status === "idle") {
          break;
        }
        executed.push(status);
      }
      console.log(JSON.stringify({ status: "ok", workerId, executed }));
    } finally {
      await pool.end();
    }
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
`

const pnpmArgs = [
  "--filter",
  "@cowards/worker",
  "exec",
  "tsx",
  "-e",
  workerScript,
]

const createPnpmCommand = (
  env: RouteEnv,
): { command: string; args: string[] } => {
  const npmExecPath = env.npm_execpath
  if (npmExecPath?.endsWith(".cjs") || npmExecPath?.endsWith(".js")) {
    return { command: process.execPath, args: [npmExecPath, ...pnpmArgs] }
  }
  return { command: npmExecPath ?? "pnpm", args: pnpmArgs }
}

export const runWorkerOnceProcess = async (
  env: RouteEnv = process.env,
): Promise<WorkerProcessResult> => {
  const { command, args } = createPnpmCommand(env)
  return execFileAsync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      COWARDS_TEST_WORKER_ID:
        env.COWARDS_TEST_WORKER_ID ?? "worker:test-support",
      COWARDS_TYPESCRIPT_WORKER_PURPOSE:
        env.COWARDS_TYPESCRIPT_WORKER_PURPOSE ?? "test",
    },
    maxBuffer: 1024 * 1024,
    timeout: 60_000,
  })
}

const parseWorkerPayload = (
  stdout: string,
): Record<string, unknown> | undefined => {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of [...lines].reverse()) {
    try {
      const parsed = JSON.parse(line) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Ignore non-JSON worker logs and keep looking for the result payload.
    }
  }
  return undefined
}

const trimDiagnostic = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }
  const privateMarker =
    /stack|stderr|token|session|database_url|postgres:|postgresql:|strategy|memory|objective|owner.?debug|awareness|source|host path/i
  if (privateMarker.test(trimmed)) {
    return "redacted diagnostic omitted"
  }
  return trimmed.length > 2_000 ? `${trimmed.slice(0, 2_000)}...` : trimmed
}

const workerFailurePayload = (error: unknown): Record<string, unknown> => {
  const diagnostic = error as {
    stdout?: unknown
    stderr?: unknown
    code?: unknown
    signal?: unknown
  }
  return {
    error:
      error instanceof Error
        ? (trimDiagnostic(error.message) ??
          "Worker test-support execution failed.")
        : "Worker test-support execution failed.",
    layer: "worker_execution" satisfies WorkerFailureLayer,
    status: "service_unavailable",
    code:
      typeof diagnostic.code === "string" || typeof diagnostic.code === "number"
        ? diagnostic.code
        : undefined,
    signal:
      typeof diagnostic.signal === "string" ? diagnostic.signal : undefined,
    outputDiagnostic: trimDiagnostic(diagnostic.stdout),
    errorDiagnostic: trimDiagnostic(diagnostic.stderr),
  }
}

export const createRunWorkerOnceHandler =
  (deps: RunWorkerOnceRouteDeps = {}) =>
  async (): Promise<Response> => {
    const env = deps.env ?? process.env
    if (!isWorkerTestSupportEnabled(env)) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }

    try {
      const result = await (deps.runWorkerProcess ?? runWorkerOnceProcess)(env)
      const payload = parseWorkerPayload(result.stdout) ?? {
        status: "ok",
        executed: [],
      }
      return Response.json(payload)
    } catch (error) {
      return Response.json(workerFailurePayload(error), { status: 503 })
    }
  }

export const POST = createRunWorkerOnceHandler()
