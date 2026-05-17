import { workshopServer } from "../../workshop/server.js"

export async function GET(): Promise<Response> {
  return Response.json(await workshopServer.getInitialData())
}
