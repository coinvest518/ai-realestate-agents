import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="border-t border-border/50 py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card px-8 py-16 text-center sm:px-16">
          {/* Glow effects */}
          <div className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to build your agent database?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-lg text-muted-foreground">
              Start with 1,000 free scrapes. No credit card required. Get structured agent data in under a minute.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary">
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
