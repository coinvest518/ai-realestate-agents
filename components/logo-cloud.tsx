"use client"

export function LogoCloud() {
  const logos = [
    "Zillow",
    "Redfin",
    "Realtor.com",
    "Compass",
    "Keller Williams",
    "RE/MAX",
    "Coldwell Banker",
  ]

  return (
    <section className="border-y border-border/50 bg-secondary/30 overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12 py-10 lg:py-12">
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Trusted by 10,000+ real estate teams and agencies
        </p>
        <div className="relative flex w-full overflow-hidden">
          <div className="flex shrink-0 items-center gap-x-12 animate-ticker" style={{ width: "max-content" }}>
            {[...logos, ...logos].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 text-sm font-semibold tracking-wide text-muted-foreground/60 transition-colors hover:text-muted-foreground whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
