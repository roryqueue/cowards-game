import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
// Fixed review inventory, never a caller-selected set of files or evidence paths.
export const FACTORY_REVIEWED_IMPLEMENTATION_FILES = [
  "assess-v1-38-factory-independence.ts", "v1-38-factory-implementation.ts", "v1-38-factory-execution-evidence.ts",
  "v1-38-factory-source-audit.ts", "v1-38-factory-observations.ts", "v1-38-factory-fresh-evidence.ts",
  "v1-38-factory-allocation.ts", "v1-38-factory-controls.ts", "run-v1-38-factory-calibration.ts",
  "prepare-v1-38-factory-calibration.ts", "ingest-v1-38-factory-packet.ts", "author-v1-38-factory-model-source.ts",
  "v1-38-factory-app-server-transport.ts", "lib/v1-38-factory-supervised-runtime.ts",
  "../packages/strategy-lab/src/factory/numeric-calibration.ts", "../packages/strategy-lab/src/factory/fingerprint.ts",
  "../packages/strategy-lab/src/factory/calibration.ts", "../packages/strategy-lab/src/factory/admission.ts",
  "../packages/strategy-lab/src/factory/supervision-artifacts.ts", "../packages/strategy-lab/src/factory/repository.ts",
  "../packages/strategy-oracle-model/src/bundle.ts", "../packages/strategy-oracle-model/src/emit.ts",
  "../packages/strategy-oracle-tactical/src/emit.ts", "../packages/strategy-oracle-tactical/src/selector.ts",
  "../packages/strategy-oracle-tactical/src/scoring.ts", "../packages/strategy-oracle-tactical/src/search.ts",
  "../packages/strategy-oracle-teacher/src/emit.ts", "../packages/strategy-oracle-teacher/src/controller.ts",
  "../packages/strategy-oracle-teacher/src/teacher.ts", "../packages/strategy-oracle-teacher/src/distill.ts",
] as const
export const factoryAssessmentImplementationRoot = ():LabRoot => labRoot("factory-reviewed-implementation-v1",FACTORY_REVIEWED_IMPLEMENTATION_FILES.map((path) => ({path,root:`sha256:${createHash("sha256").update(readFileSync(new URL(path,import.meta.url))).digest("hex")}`})))
