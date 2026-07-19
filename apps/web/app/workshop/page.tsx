import { WorkshopClient } from "./workshop-client.js"
import { getWorkshopInitialData } from "./server.js"
import type { JSX } from "react"

export const dynamic = "force-dynamic"

export default async function WorkshopPage(): Promise<JSX.Element> {
  const initialData = await getWorkshopInitialData()
  return <WorkshopClient initialData={initialData} />
}
