import { createHash } from "node:crypto"
import { lstatSync, readFileSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes } from "@cowards/spec"
import { admitLeagueCapacityPlanInput, admitProspectiveLeagueExecutionAllocation, LEAGUE_CAPACITY_CATEGORIES, type LeagueCapacityPlanInput, type ProspectiveLeagueExecutionAllocation } from "../../packages/strategy-lab/src/league/allocation.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, readFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { createLeagueRepository, readLeagueArtifact } from "../../packages/strategy-lab/src/league/repository.js"
import { readRetainedFactoryLedger } from "../../scripts/assess-v1-38-factory-independence.js"
import { leagueCurrentSourceIdentity } from "../../scripts/run-v1-38-serious-league.js"
import { writePhase265PacketSummaryExclusive } from "./prepare-phase-265-packets.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_CAPACITY_${code}`) }
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const tracePath = resolve(repositoryRoot, ".strategy-lab/phase263-feasibility-calibration-1/lab-matches/trace-7d31687cbc7b681ed7dee3bc8e167aaeac44d6f8448525f2995661926835da02.bin")
const diagnosticDirectory = "/private/var/folders/y0/jbhcmp0j0d3gvpc40xtm0r3w0000gn/T/league-265-storage-kxn1ay"
const historicalFactoryDirectory = resolve(repositoryRoot, ".strategy-lab/factory-264-fresh-20260914-approved-two")
const traceRoot: LabRoot = "sha256:7d31687cbc7b681ed7dee3bc8e167aaeac44d6f8448525f2995661926835da02"
const diagnosticRoot: LabRoot = "sha256:38139037bde20dc49d060bd15a771dacb01302a3d0e33262d03b8c83a9dc8647"
const inventoryRoot: LabRoot = "sha256:bf42aef97fabcb571d46a1612692e2d49a3147ae8f8943f1dabf425574b9f575"
const witnessRows = [
  ["invocation", 3_950_112, 1_251, 4_632, [traceRoot, diagnosticRoot]],
  ["execution", 12_183_083, 190, 4_632, [traceRoot, diagnosticRoot]],
  ["factory_supervision", 12_915_715, 101, 3_744, [inventoryRoot, diagnosticRoot]],
  ["descriptor", 4_493_023_080, 178_776, 1, [inventoryRoot, traceRoot]],
  ["journal", 3_812_082, 5_542, 1, [inventoryRoot, diagnosticRoot]],
  ["filesystem", 39_836_598_118, 0, 1, [diagnosticRoot, inventoryRoot]],
] as const

/** Recheck the retained representative bytes. This is deliberately not a host
 * measurement or a claim that the historical trace bounds current Matches. */
export const verifyPhase265CapacityWitnesses = (): void => {
  const trace = readFileSync(tracePath)
  if (trace.byteLength !== 11_981_860 || `sha256:${createHash("sha256").update(trace).digest("hex")}` !== traceRoot) fail("TRACE_WITNESS")
  const repository = createLeagueRepository(diagnosticDirectory)
  const files = readdirSync(diagnosticDirectory)
  if (files.length !== 190 || files.some((name) => !/^league-artifact-[0-9a-f]{64}\.bin$/u.test(name))) fail("STREAM_INVENTORY")
  let bytes = 0
  for (const name of files) bytes += readLeagueArtifact(repository, `sha256:${name.slice("league-artifact-".length, -".bin".length)}`).byteLength
  if (bytes !== 12_183_083 || !files.includes(`league-artifact-${diagnosticRoot.slice(7)}.bin`)) fail("STREAM_WITNESS")
  readLeagueArtifact(repository, diagnosticRoot)
  const factory = createFactoryRepository(historicalFactoryDirectory)
  const historical = readRetainedFactoryLedger(factory)
  if (historical.ledgerRoot !== inventoryRoot) fail("FACTORY_INVENTORY")
  const factoryFiles = readdirSync(historicalFactoryDirectory)
  if (factoryFiles.length !== 1_875 || factoryFiles.filter((name) => name.startsWith("factory-artifact-")).length !== 1_779) fail("FACTORY_FILE_COUNT")
  let factoryBytes = 0
  for (const name of factoryFiles) {
    if (name.startsWith("factory-artifact-")) factoryBytes += readFactoryArtifact(factory, `sha256:${name.slice("factory-artifact-".length, -".bin".length)}`).byteLength
    else {
      const stat = lstatSync(resolve(historicalFactoryDirectory, name))
      if (!stat.isFile()) fail("FACTORY_FILE")
      factoryBytes += stat.size
    }
  }
  if (factoryBytes !== 164_632_160) fail("FACTORY_BYTE_COUNT")
}

/** The six rows are conservative data-only projections from the cited retained
 * witness and source-bounded tactical reserve. Fresh host values are supplied
 * only later, by the run process after every static check. */
export const buildPhase265CapacityPlan = (allocationValue: unknown): LeagueCapacityPlanInput => {
  const allocation: ProspectiveLeagueExecutionAllocation = admitProspectiveLeagueExecutionAllocation(allocationValue)
  const identity = leagueCurrentSourceIdentity()
  if (allocation.implementationRoot !== identity.implementationRoot || allocation.amendment.sourceRoot !== identity.sourceRoot) fail("SOURCE_DRIFT")
  verifyPhase265CapacityWitnesses()
  const sourceRoot = identity.sourceRoot
  const costs = witnessRows.map(([category, measuredBytes, measuredRecords, projectedUnits, witnessRoots], index) => {
    if (category !== LEAGUE_CAPACITY_CATEGORIES[index]) fail("CATEGORY_ORDER")
    const measurement = { sourceRoot, witnessRoots: [...witnessRoots], sampleUnits: 1, measuredBytes, measuredRecords, projectedUnits }
    return { category, projectedBytes: measuredBytes * projectedUnits, projectedRecords: measuredRecords * projectedUnits, measurementRoot: labRoot("league-data-only-capacity-measurement-v1", { category, ...measurement }), measurement }
  })
  const plan = {
    allocationRoot: allocation.root,
    amendmentRoot: allocation.amendment.root,
    implementationRoot: identity.implementationRoot,
    sourceRoot,
    historicalAssessmentRoot: allocation.amendment.historicalAssessment.assessmentRoot,
    processHeadroomBytes: 1_073_741_824,
    scale: { matrixMatches: 960, probeMatches: 1800, responseMatches: 1872, responseExecutionCopies: 2 },
    costs,
    assumptions: [
      "Representative Phase 263 trace used maxPhases=100; future Phase 265 Match duration is not assumed equal.",
      "The retained 190-artifact stream-format witness measures format overhead, not current-round Match results.",
      "Factory supervision is projected at two retained copies per response Match using the historical aggregate envelope.",
      "Descriptor and filesystem rows include the source-bounded three-job tactical adaptation reserve: 16,777,216 logical bytes, 64 records, and 1,048,576 extra physical bytes.",
      "Filesystem row is extra physical allocation only and adds no logical artifact records.",
      "The run process must revalidate static inputs and make a fresh same-process host observation; this plan is not a receipt or execution authority.",
    ],
  }
  return admitLeagueCapacityPlanInput(plan, allocation)
}

const main = () => {
  const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
  const allocationPath = arg("--allocation"), outputPath = arg("--output")
  if (!allocationPath || !outputPath) return fail("USAGE: --allocation <rooted-canonical-json> --output <new-path>")
  const parsed = admitCanonicalJsonBytes(readFileSync(resolve(allocationPath)), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("ALLOCATION_NOT_CANONICAL")
  const plan = buildPhase265CapacityPlan(parsed.value)
  writePhase265PacketSummaryExclusive(outputPath, plan)
  process.stdout.write(`${JSON.stringify({ allocationRoot: plan.allocationRoot, outputPath: resolve(outputPath) })}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
