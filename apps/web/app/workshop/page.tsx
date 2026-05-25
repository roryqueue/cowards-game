import { WorkshopClient } from "./workshop-client.js"
import { getWorkshopInitialData } from "./server.js"

export const dynamic = "force-dynamic"

export default async function WorkshopPage() {
  const initialData = await getWorkshopInitialData()
  return <WorkshopClient initialData={initialData} />
}
