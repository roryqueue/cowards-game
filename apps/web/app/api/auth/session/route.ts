import { getAccountSession } from "../../../../lib/account-service-boundary.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

export async function GET(): Promise<Response> {
  try {
    return Response.json(await getAccountSession())
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
