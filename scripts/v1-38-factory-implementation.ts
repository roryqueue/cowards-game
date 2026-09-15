import { createHash } from "node:crypto"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { loadLabBoundaryFiles } from "./check-v1-38-lab-boundaries.js"
/** Conservative local source snapshot using the existing boundary inventory.
 * Includes admission/identity/ledger dependencies and configuration. Inventory
 * excludes .planning, .strategy-lab, dependencies and generated output; this
 * never opens private experimental evidence or asks for external attestation.
 */
export const factoryAssessmentImplementationManifest = (inventoryRoot = resolve(dirname(fileURLToPath(import.meta.url)),"..")) => {
  const files=loadLabBoundaryFiles(inventoryRoot)
  const entries=Object.keys(files).filter(path=>!/(?:\.test|\.spec)\.[cm]?[jt]sx?$/u.test(path)&&!/(?:^|\/)(?:test|__tests__|testdata)\//u.test(path)&&!path.startsWith("scripts/fixtures/")).sort().map(path=>({path,root:`sha256:${createHash("sha256").update(files[path]!).digest("hex")}`}))
  return {entries,root:labRoot("factory-reviewed-implementation-v2",entries)}
}
export const factoryAssessmentImplementationRoot = ():LabRoot => factoryAssessmentImplementationManifest().root
