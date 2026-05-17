import { WorkshopClient } from "./workshop/workshop-client.js"
import { getWorkshopInitialData } from "./workshop/server.js"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const initialData = await getWorkshopInitialData()

  return <WorkshopClient initialData={initialData} />
}
