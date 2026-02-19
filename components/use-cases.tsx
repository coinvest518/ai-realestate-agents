import { Card, CardContent } from "@/components/ui/card"
import { Users, BarChart3, MapPin, MessageSquare } from "lucide-react"

const cases = [
  {
    icon: Users,
    title: "Lead Enrichment",
    description: "Enhance your sales pipeline with verified agent contact details, listing history, and market expertise areas.",
    tag: "Sales teams",
  },
  {
    icon: BarChart3,
    title: "Market Intelligence",
    description: "Analyze agent density, pricing trends, and brokerage market share across any region or zip code.",
    tag: "Analysts",
  },
  {
    icon: MapPin,
    title: "Territory Mapping",
    description: "Map real estate agent coverage areas and identify underserved markets for strategic expansion.",
    tag: "Strategy",
  },
  {
    icon: MessageSquare,
    title: "Recruiting Pipeline",
    description: "Build lists of top-performing agents for recruitment. Filter by volume, ratings, and specialties.",
    tag: "Brokerages",
  },
]

export function UseCases() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto mb-16 lg:mb-20 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm text-primary">
            {"// Use Cases"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Transform agent data into business intelligence
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <Card key={c.title} className="group border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card">
              <CardContent className="flex flex-col gap-4 p-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <c.icon className="size-5" />
                  </div>
                  <span className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{c.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
