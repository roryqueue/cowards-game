import type {
  AuthSessionServiceDto,
  ListStrategyRevisionsServiceDto,
} from "@cowards/spec"
import {
  accountReadService,
  getAccountSessionId,
} from "./account-service-adapter.js"

export type AccountReadUser = NonNullable<AuthSessionServiceDto["user"]>

export interface AccountReadRevisionSummary {
  id: string
  strategyId: string
  label?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  starterLineage?:
    | ListStrategyRevisionsServiceDto["revisions"][number]["starterLineage"]
    | undefined
  advancedLineage?:
    | ListStrategyRevisionsServiceDto["revisions"][number]["advancedLineage"]
    | undefined
  sourceHash: string
  sourceBytes: number
  valid: boolean
  runtimeSemantics: ListStrategyRevisionsServiceDto["revisions"][number]["runtimeSemantics"]
  engineCompatibility: ListStrategyRevisionsServiceDto["revisions"][number]["engineCompatibility"]
  createdAt: string
  lockedAt?: string | undefined
}

const toAccountReadRevision = (
  revision: ListStrategyRevisionsServiceDto["revisions"][number],
): AccountReadRevisionSummary => ({
  id: revision.strategyRevisionId,
  strategyId: revision.strategyId,
  ...(revision.label ? { label: revision.label } : {}),
  ...(revision.notes ? { notes: revision.notes } : {}),
  ...(revision.tags ? { tags: revision.tags } : {}),
  ...(revision.starterLineage
    ? { starterLineage: revision.starterLineage }
    : {}),
  ...(revision.advancedLineage
    ? { advancedLineage: revision.advancedLineage }
    : {}),
  sourceHash: revision.sourceHash,
  sourceBytes: revision.sourceBytes,
  valid: revision.validationStatus === "valid",
  runtimeSemantics: revision.runtimeSemantics,
  engineCompatibility: revision.engineCompatibility,
  createdAt: revision.createdAt,
  ...(revision.lockedAt ? { lockedAt: revision.lockedAt } : {}),
})

export const getAccountSession = async (): Promise<AuthSessionServiceDto> =>
  accountReadService.getAuthSession(await getAccountSessionId())

export const getCurrentAccountReadUser =
  async (): Promise<AccountReadUser | null> => (await getAccountSession()).user

export const listAccountReadRevisions = async (): Promise<
  AccountReadRevisionSummary[]
> => {
  const list = await accountReadService.listStrategyRevisions(
    await getAccountSessionId(),
  )
  return list ? list.revisions.map(toAccountReadRevision) : []
}
