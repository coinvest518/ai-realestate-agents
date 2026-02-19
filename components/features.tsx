import { Card, CardContent } from "@/components/ui/card"
import { Search, Database, Zap, Shield, Globe, Brain } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Smart Agent Discovery",
    description: "AI identifies real estate agents across any website, even JavaScript-heavy single page apps and gated directories.",
  },
  {
    icon: Database,
    title: "Structured Data Output",
    description: "Get clean JSON with names, emails, phone numbers, brokerages, listing counts, and specialties.",
  },
  {
    icon: Zap,
    title: "Blazing Fast Extraction",
    description: "Scrape hundreds of agent profiles per minute. Parallel processing delivers results in milliseconds.",
  },
  {
    icon: Brain,
    title: "AI-Powered Parsing",
    description: "Our LLM understands page context to extract data no regex could catch. Handles any layout or format.",
  },
  {
    icon: Globe,
    title: "Any Site, Any Format",
    description: "Works with MLS sites, brokerage pages, review platforms, social profiles, and custom directories.",
  },
  {
    icon: Shield,
    title: "Compliant & Respectful",
    description: "Built-in rate limiting, robots.txt compliance, and ethical scraping practices. Your data, responsibly sourced.",
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 xl:py-36">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto mb-16 lg:mb-20 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm sm:text-base text-primary">
            {"// Features"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything you need to build your agent database
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            From discovery to delivery, AgentScrape handles the entire pipeline.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card"
            >
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
