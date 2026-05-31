import type { ReactNode } from "react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/watch", label: "Watch" },
  { href: "/competitions", label: "Competitions" },
  { href: "/learn", label: "Learn" },
  { href: "/workshop", label: "Workshop" },
  { href: "/account", label: "Account" },
] as const

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="site-brand" href="/">
          <span>Coward&apos;s Game</span>
          <small>public alpha</small>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}
