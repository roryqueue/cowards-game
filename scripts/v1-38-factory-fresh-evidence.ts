import { type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { type FactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"

export const remainingFreshWorkloadLifetime = (_firstStartedAtMs: number, _nowMs: number): number => 0
export const readFreshFactoryCalibration = (_repository: FactoryRepository, _manifest: FactoryCalibrationManifest, _opponentIdentityRoot: LabRoot): unknown => { throw new TypeError("NOT_IMPLEMENTED") }
