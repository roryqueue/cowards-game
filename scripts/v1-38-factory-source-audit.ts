import type { ConcreteEdgeToken } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
export const auditFactorySource = (_source: string): { dependencyEdges: ConcreteEdgeToken[]; functionBodies: string[]; forbiddenModuleCount: number } => ({ dependencyEdges: [], functionBodies: [], forbiddenModuleCount: 0 })
