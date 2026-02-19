import Link from "next/link"
import { CONTACT_EMAIL, INTEGRATIONS, AI_TOOLS, DIGITAL_PRODUCTS, COMPANY_LINKS, OTHER_AFFILIATES } from "@/lib/resources"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/20" suppressHydrationWarning>
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12 py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-semibold text-foreground">AgentScrape</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              AI-powered real estate agent data extraction.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">{CONTACT_EMAIL}</a></p>
          </div>


          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Integrations</h3>
            <ul className="flex flex-col gap-3">
              {INTEGRATIONS.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{r.name}</a>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">AI & Automation Tools</h3>
            <ul className="flex flex-col gap-3">
              {AI_TOOLS.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{r.name}</a>
                </li>
              ))}
            </ul>
          </div>



          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Digital products & membership</h3>
            <ul className="flex flex-col gap-3 mb-3">
              {DIGITAL_PRODUCTS.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{r.name}</a>
                </li>
              ))}
            </ul>

            <h3 className="mb-3 mt-2 text-sm font-semibold text-foreground">Affiliates</h3>
            <ul className="flex flex-col gap-3">
              {OTHER_AFFILIATES.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{r.name}</a>
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="flex flex-col gap-3">
              {COMPANY_LINKS.map((r) => (
                <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{r.name}</a></li>
              ))}
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 AgentScrape. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
