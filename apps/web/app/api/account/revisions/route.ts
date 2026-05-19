import type { StrategyRevisionId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

const requireUser = async () => {
  const user = await getCurrentCompetitiveUser()
  if (!user) {
    return Response.json({ error: "Sign in is required." }, { status: 401 })
  }
  return user
}

export async function GET(): Promise<Response> {
  try {
    const user = await requireUser()
    if (user instanceof Response) {
      return user
    }
    return Response.json({
      revisions: await competitiveServer.listAccountRevisions(user),
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireUser()
    if (user instanceof Response) {
      return user
    }
    const body = (await request.json()) as Record<string, unknown>
    const revision = await competitiveServer.saveAccountRevision(user, {
      source: body.source,
      label: body.label,
      notes: body.notes,
    })
    return Response.json({ revision }, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}

export type AccountRevisionSourceRequest = {
  revisionId: StrategyRevisionId
}
