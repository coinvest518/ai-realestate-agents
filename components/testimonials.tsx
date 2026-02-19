const testimonials = [
  {
    quote: "AgentScrape replaced our entire manual data team. We now pull 10,000 agent profiles a day with zero effort.",
    name: "Rachel Torres",
    title: "Head of Data, LeadFlow Realty",
  },
  {
    quote: "The AI extraction is unreal. It handles sites we couldn't even parse with Puppeteer. Total game changer.",
    name: "Mark Hutchinson",
    title: "CTO, PropTech Solutions",
  },
  {
    quote: "We built our entire lead gen pipeline around AgentScrape. The structured JSON output plugs right into HubSpot.",
    name: "Priya Kapoor",
    title: "VP Sales, HomeConnect",
  },
  {
    quote: "Moved from a competitor and AgentScrape is 40x faster. Our agents get fresh leads every morning now.",
    name: "James Okafor",
    title: "Founder, RealData AI",
  },
  {
    quote: "Finally a scraping tool that actually respects robots.txt and rate limits. Our legal team approved it day one.",
    name: "Emily Chen",
    title: "Compliance Lead, BrightKey Homes",
  },
  {
    quote: "The custom schemas feature is incredible. We extract exactly the fields we need — nothing more, nothing less.",
    name: "Derek Walters",
    title: "Engineering Manager, AgentHub",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-border/50 bg-secondary/20 py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto mb-16 lg:mb-20 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm text-primary">
            {"// Community"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Teams love building with AgentScrape
          </h2>
        </div>

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="mb-4 break-inside-avoid rounded-xl border border-border/50 bg-card/50 p-6 transition-colors hover:border-primary/20 hover:bg-card"
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {`"${t.quote}"`}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
