import {
  getCurrentAccountReadUser,
  listAccountReadRevisions,
} from "../../../../lib/account-service-boundary.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

const requireUser = async () => {
  const user = await getCurrentAccountReadUser()
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
      revisions: await listAccountReadRevisions(),
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
