import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { analyzeWorkerRetirement } from "./check-v1-37-worker-retirement.ts"

const tempRoots: string[] = []

const baseRunner = `
export class TypeScriptWorkerRetiredError extends Error {}
const throwTypeScriptWorkerRetired = (): never => {
  throw new TypeScriptWorkerRetiredError()
}
export const assertTypeScriptWorkerEntrypointAllowed = (): never =>
  throwTypeScriptWorkerRetired()
export const assertTypeScriptWorkerJobOwnershipAllowed = (): never =>
  throwTypeScriptWorkerRetired()
export const runWorkerOnce = async (_pool, _options, _dependencies) => {
  return assertTypeScriptWorkerEntrypointAllowed()
}
export const runWorkerLoop = async (_pool, _options, _dependencies) => {
  return assertTypeScriptWorkerEntrypointAllowed()
}
`

const baseIndex = `
import { assertTypeScriptWorkerEntrypointAllowed } from "./runner.js"
assertTypeScriptWorkerEntrypointAllowed(process.env)
`

const createRepo = (input: {
  runner?: string
  index?: string
  extra?: Readonly<Record<string, string>>
} = {}): string => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-worker-retired-"))
  tempRoots.push(repoRoot)
  const write = (repoPath: string, source: string) => {
    const absolutePath = path.join(repoRoot, repoPath)
    mkdirSync(path.dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, source)
  }
  write("apps/worker/src/runner.ts", input.runner ?? baseRunner)
  write("apps/worker/src/index.ts", input.index ?? baseIndex)
  for (const [repoPath, source] of Object.entries(input.extra ?? {})) {
    write(repoPath, source)
  }
  return repoRoot
}

const findingCodes = (repoRoot: string): string[] =>
  analyzeWorkerRetirement({ repoRoot }).findings.map((finding) => finding.code)

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("v1.37 direct TypeScript worker retirement sentinel", () => {
  it("passes a fatal first-operation retirement boundary", () => {
    const result = analyzeWorkerRetirement({ repoRoot: createRepo() })
    expect(result).toMatchObject({ findings: [], exitCode: 0 })
  })

  it("fails every former purpose allowlist independently", () => {
    for (const purpose of ["rollback", "test", "parity"]) {
      const runner = `${baseRunner}\nconst allowedPurpose = "${purpose}"\n`
      expect(findingCodes(createRepo({ runner }))).toContain(
        "PURPOSE_EXCEPTION_PRESENT",
      )
    }
  })

  it("fails an environment bypass before startup retirement", () => {
    const index = `
import { assertTypeScriptWorkerEntrypointAllowed } from "./runner.js"
if (process.env.COWARDS_TYPESCRIPT_WORKER_PURPOSE === "test") {
  console.log("ready")
} else {
  assertTypeScriptWorkerEntrypointAllowed(process.env)
}
`
    expect(findingCodes(createRepo({ index }))).toContain(
      "STARTUP_RETIREMENT_NOT_FIRST",
    )
  })

  it("fails retirement after a claim side effect", () => {
    const runner = baseRunner.replace(
      "return assertTypeScriptWorkerEntrypointAllowed()",
      "_dependencies.claimNextMatchJob()\n  return assertTypeScriptWorkerEntrypointAllowed()",
    )
    const codes = findingCodes(createRepo({ runner }))
    expect(codes).toContain("RUN_ONCE_RETIREMENT_NOT_FIRST")
    expect(codes).toContain("DIRECT_LIFECYCLE_CALL")
  })

  it("fails an alternate executable worker loop", () => {
    const runner = `${baseRunner}
export async function startEmergencyWorker() {
  while (true) await Promise.resolve()
}
`
    expect(findingCodes(createRepo({ runner }))).toContain(
      "ALTERNATE_WORKER_ENTRYPOINT",
    )
  })

  it("fails an executable default dependency injection path", () => {
    const runner = baseRunner.replace(
      "async (_pool, _options, _dependencies) =>",
      "async (_pool, _options, _dependencies = { claimNextMatchJob() {} }) =>",
    )
    expect(findingCodes(createRepo({ runner }))).toContain(
      "EXECUTABLE_DEPENDENCY_DEFAULT",
    )
  })

  it("fails a direct claim-to-completion route in another worker file", () => {
    const extra = {
      "apps/worker/src/emergency.ts": `
import { claimNextMatchJob, completeMatch } from "@cowards/persistence/quarantine-lifecycle"
export const executeEmergencyMatch = async () => {
  const claim = await claimNextMatchJob()
  return completeMatch(claim)
}
`,
    }
    const codes = findingCodes(createRepo({ extra }))
    expect(codes).toContain("FORBIDDEN_EXECUTION_IMPORT")
    expect(codes).toContain("DIRECT_LIFECYCLE_CALL")
    expect(codes).toContain("ALTERNATE_WORKER_ENTRYPOINT")
  })

  it("does not accept comments or identifier names as retirement proof", () => {
    const index = `
// assertTypeScriptWorkerEntrypointAllowed(process.env)
const assertTypeScriptWorkerEntrypointAllowed = "retired"
createDatabasePool()
`
    expect(findingCodes(createRepo({ index }))).toContain(
      "STARTUP_RETIREMENT_NOT_FIRST",
    )
  })

  it("passes the real repository", () => {
    expect(analyzeWorkerRetirement()).toMatchObject({
      findings: [],
      exitCode: 0,
    })
  })
})

