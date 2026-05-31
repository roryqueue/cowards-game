import type { ReactNode } from "react"
import "./globals.css"
import { SiteShell } from "./site-shell.js"

export const metadata = {
  title: "Coward's Game",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
