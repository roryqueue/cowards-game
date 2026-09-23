import { closeSync, constants, fsyncSync, openSync, realpathSync, writeSync } from "node:fs"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { seriousLeagueMain } from "../../scripts/run-v1-38-serious-league.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_RUN_WRAPPER_${code}`) }

/** Exact once-only `run --capacity-input` wrapper that retains its returned
 * result canonically; it does not synthesize a result if the CLI fails. */
export const phase265RunArguments = (args: readonly string[]) => {
  const outputIndex = args.indexOf("--result-output")
  if (args[0] !== "run" || outputIndex < 0 || outputIndex + 1 >= args.length || args.filter((value) => value === "--result-output").length !== 1) return fail("ARGUMENTS")
  const outputPath = args[outputIndex + 1]!
  const forwarded = [...args.slice(0, outputIndex), ...args.slice(outputIndex + 2)]
  const flags = forwarded.filter((_, index) => index % 2 === 1)
  if (forwarded.length % 2 !== 1 || flags.length !== new Set(flags).size || !flags.includes("--capacity-input") || flags.includes("--capacity-receipt") || !flags.includes("--allocation") || !flags.includes("--allocation-root") || !flags.includes("--repository") || !flags.includes("--factory-repository") || !flags.includes("--response-factory-repository")) return fail("ARGUMENTS")
  return { outputPath: resolve(outputPath), forwarded }
}

/** Reserve the final path before any provider, preflight or Match call. The
 * zero-byte reservation is intentionally left in place if the run throws: it
 * is not a result and must not be interpreted as one or retried. */
export const runPhase265Once = async (args: readonly string[], run: (args: readonly string[]) => Promise<string> = seriousLeagueMain) => {
  const { outputPath, forwarded } = phase265RunArguments(args)
  const flags = new Map<string, string>()
  for (let index = 1; index < forwarded.length; index += 2) flags.set(forwarded[index]!, resolve(forwarded[index + 1]!))
  if (["--allocation", "--capacity-input"].some((key) => flags.get(key) === outputPath)) return fail("RESULT_ALIASES_INPUT")
  const directory = realpathSync(dirname(outputPath))
  if (directory !== dirname(outputPath)) return fail("RESULT_PARENT_ALIAS")
  for (const key of ["--repository", "--factory-repository", "--response-factory-repository"]) {
    const repositoryDirectory = realpathSync(flags.get(key)!)
    const child = relative(repositoryDirectory, outputPath)
    if (child === "" || child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child)) return fail("RESULT_INSIDE_REPOSITORY")
  }
  const descriptor = openSync(outputPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try {
    const directoryFd = openSync(directory, constants.O_RDONLY)
    try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
    const result = await run(forwarded)
    const parsed: unknown = JSON.parse(result)
    const admitted = admitCanonicalJsonValue(parsed, { profile: "canonical-manifest" })
    if (!admitted.ok || admitted.canonicalByteLength > 262_144) return fail("RESULT_NOT_CANONICAL")
    const bytes = admitted.canonicalBytes
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset, bytes.length - offset)
    fsyncSync(descriptor)
    return { resultPath: outputPath, result: parsed }
  } finally { closeSync(descriptor) }
}

const main = async () => {
  const result = await runPhase265Once(process.argv.slice(2))
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 })
}
