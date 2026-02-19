export function Footer() {
  const links = {
    Product: ["Features", "Pricing", "API Docs", "Changelog", "Status"],
    Resources: ["Documentation", "Blog", "Guides", "Community", "Support"],
    Company: ["About", "Careers", "Contact", "Privacy", "Terms"],
    Integrations: ["Salesforce", "HubSpot", "Zapier", "Webhooks", "REST API"],
  }

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
              AI-powered real estate agent data extraction. Turn any website into structured intelligence.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold text-foreground">{category}</h3>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            2026 AgentScrape. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
