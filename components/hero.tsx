"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap } from "lucide-react"

const outputLines = [
  { delay: 0, text: '[' },
  { delay: 300, text: '  {' },
  { delay: 600, text: '    "name": "Sarah Mitchell",' },
  { delay: 900, text: '    "brokerage": "Compass Real Estate",' },
  { delay: 1200, text: '    "phone": "+1 (415) 555-0192",' },
  { delay: 1500, text: '    "email": "sarah.m@compass.com",' },
  { delay: 1800, text: '    "listings": 47,' },
  { delay: 2100, text: '    "avg_price": "$1,250,000",' },
  { delay: 2400, text: '    "rating": 4.9,' },
  { delay: 2700, text: '    "location": "San Francisco, CA"' },
  { delay: 3000, text: '  },' },
  { delay: 3300, text: '  {' },
  { delay: 3600, text: '    "name": "David Chen",' },
  { delay: 3900, text: '    "brokerage": "Keller Williams",' },
  { delay: 4200, text: '    "phone": "+1 (310) 555-0847",' },
  { delay: 4500, text: '    "listings": 63' },
  { delay: 4800, text: '  }' },
  { delay: 5100, text: ']' },
]

export function Hero() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers = outputLines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const colorize = (text: string) => {
    return text
      .replace(/"([^"]+)":/g, '<span class="text-[oklch(0.7_0.15_200)]">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-[oklch(0.8_0.15_85)]">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="text-primary">$1</span>')
      .replace(/[\[\]{}]/g, '<span class="text-muted-foreground">$&</span>')
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-36 xl:pt-48 xl:pb-40">
      {/* Background grid effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.2_0.005_260/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.2_0.005_260/0.4)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.18_45/0.15),transparent)]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="grid items-center gap-12 lg:gap-20 xl:gap-24 lg:grid-cols-2">
          {/* Left content */}
          <div className="flex flex-col items-start gap-6 lg:gap-8">
            <Badge variant="outline" className="gap-2 border-primary/30 bg-primary/5 text-primary text-xs sm:text-sm">
              <Zap className="size-3.5" />
              Now with AI-powered extraction
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Turn real estate sites into{" "}
              <span className="text-primary">agent data</span>
            </h1>

            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Extract structured real estate agent profiles from any website. Names, contacts, listings, reviews — ready for your CRM in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" className="h-12 px-6 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                Start Scraping Free
                <ArrowRight className="size-5" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-6 text-base border-border text-foreground hover:bg-secondary">
                View Documentation
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-sm sm:text-base text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                1,000 free scrapes
              </span>
            </div>
          </div>

          {/* Right: Code output animation */}
          <div className="relative w-full min-w-0">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-primary/5 w-full min-w-[320px] lg:min-w-[400px]">
              {/* Terminal header */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
                <div className="size-3 sm:size-4 rounded-full bg-[oklch(0.65_0.2_25)]" />
                <div className="size-3 sm:size-4 rounded-full bg-[oklch(0.8_0.18_85)]" />
                <div className="size-3 sm:size-4 rounded-full bg-[oklch(0.7_0.17_145)]" />
                <span className="ml-3 font-mono text-xs sm:text-sm text-muted-foreground">response.json</span>
                <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-[10px] sm:text-xs px-1.5 py-0">
                  .JSON
                </Badge>
              </div>
              {/* Code content */}
              <div className="p-4 sm:p-5 lg:p-6 font-mono text-[13px] sm:text-sm lg:text-base leading-6 lg:leading-7">
                {outputLines.slice(0, visibleLines).map((line, i) => (
                  <div key={i} className="flex">
                    <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/50">
                      {i + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: colorize(line.text) }} />
                  </div>
                ))}
                {visibleLines < outputLines.length && (
                  <div className="flex items-center gap-1 pt-1">
                    <span className="mr-4 inline-block w-6" />
                    <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Scraping...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Glow effect behind the card */}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl bg-primary/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
