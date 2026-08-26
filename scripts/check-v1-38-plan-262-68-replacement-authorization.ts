#!/usr/bin/env -S pnpm exec tsx
import { lstatSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createV138Plan26268ReplacementAuthorization, PLAN_262_67_CHECKPOINT_ROOT } from "./lib/v1-38-plan-262-68-replacement-authorization.js"

const forbidden = [
  ".planning/artifacts/v1.38-plan-262-62-source-completeness-review-v3.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
] as const
const present = (root: string, repoPath: string) => { try { lstatSync(path.resolve(root, repoPath)); return true } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error } }

export const checkV138Plan26268ReplacementAuthorization = (root: string, candidate = createV138Plan26268ReplacementAuthorization()) => {
  if (candidate.checkpointRoot !== PLAN_262_67_CHECKPOINT_ROOT || candidate.executable || candidate.consumable ||
    candidate.admit03.status !== "blocked" || candidate.admit03.freshAccepted !== 0 || candidate.admit03.requiredAccepted !== 540 ||
    candidate.frozenBounds.headroomSamplingMs !== 200 || candidate.frozenBounds.minimumEffectiveAvailableBasisPoints !== 2500 ||
    candidate.frozenBounds.calibrationAttempts !== 8 || candidate.frozenBounds.calibrationShards !== 4 ||
    candidate.frozenBounds.conditionalReproductionCells !== 540 || candidate.frozenBounds.formationMaterialization ||
    candidate.canonicalAuthorizationWritten || candidate.canonicalSealWritten || candidate.routeStarted)
    throw new TypeError("V138_262_68_REPRESENTATION_INVALID")
  if (forbidden.some(repoPath => present(root, repoPath))) throw new TypeError("V138_262_68_FORBIDDEN_DESTINATION_PRESENT")
  return Object.freeze({ status: "passed", authority: "denied" as const, checkpointRoot: candidate.checkpointRoot })
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).join(" ") !== "--check") throw new TypeError("V138_262_68_ARGUMENTS_INVALID")
  process.stdout.write(`${JSON.stringify(checkV138Plan26268ReplacementAuthorization(root))}\n`)
}
