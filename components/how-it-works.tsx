"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const codeExamples = {
  python: {
    label: "Python",
    code: `# pip install agentscrape
from agentscrape import AgentScrape

client = AgentScrape(api_key="as-YOUR_API_KEY")

# Scrape agents from any real estate site
result = client.scrape(
    url="https://example-realty.com/agents",
    schema={
        "name": "string",
        "email": "string",
        "phone": "string",
        "listings": "number",
        "brokerage": "string"
    }
)

print(result.agents)  # Structured agent data`,
  },
  node: {
    label: "Node.js",
    code: `// npm install agentscrape
import { AgentScrape } from 'agentscrape';

const client = new AgentScrape({
  apiKey: 'as-YOUR_API_KEY'
});

// Scrape agents from any real estate site
const result = await client.scrape({
  url: 'https://example-realty.com/agents',
  schema: {
    name: 'string',
    email: 'string',
    phone: 'string',
    listings: 'number',
    brokerage: 'string'
  }
});

console.log(result.agents);`,
  },
  curl: {
    label: "cURL",
    code: `curl -X POST https://api.agentscrape.dev/v1/scrape \\
  -H "Authorization: Bearer as-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example-realty.com/agents",
    "schema": {
      "name": "string",
      "email": "string",
      "phone": "string",
      "listings": "number",
      "brokerage": "string"
    }
  }'`,
  },
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border/50 bg-secondary/20 py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: description */}
          <div className="flex flex-col gap-6">
            <p className="font-mono text-sm text-primary">
              {"// Developer First"}
            </p>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Start scraping agents today
            </h2>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              Three lines of code is all it takes. Define your target URL and a schema, and our AI handles the rest — navigating pagination, parsing layouts, and structuring agent profiles.
            </p>

            <div className="flex flex-col gap-4 pt-4">
              {[
                { step: "01", title: "Point to any URL", desc: "Provide a real estate site, MLS directory, or brokerage page." },
                { step: "02", title: "Define your schema", desc: "Tell us what data fields you want — names, emails, listings, ratings." },
                { step: "03", title: "Get structured data", desc: "Receive clean JSON with all agent profiles, ready for your CRM or database." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs text-primary">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: code block with tabs */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5">
            <Tabs defaultValue="python">
              <div className="flex items-center border-b border-border px-4">
                <TabsList className="h-auto bg-transparent p-0">
                  {Object.entries(codeExamples).map(([key, val]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="rounded-none border-b-2 border-transparent px-3 py-3 font-mono text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                      {val.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {Object.entries(codeExamples).map(([key, val]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
                    <code>
                      {val.code.split("\n").map((line, i) => (
                        <div key={i} className="flex">
                          <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/40">
                            {i + 1}
                          </span>
                          <span className="text-foreground/80">{line}</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  )
}
