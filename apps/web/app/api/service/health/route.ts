import { createCowardsLocalService } from "@cowards/service"

export async function GET(): Promise<Response> {
  const service = createCowardsLocalService({
    withPool: async () => {
      throw new Error("Health check does not require persistence.")
    },
  })

  return Response.json(service.health())
}
