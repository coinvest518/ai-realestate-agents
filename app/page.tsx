import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { LogoCloud } from "@/components/logo-cloud"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { Stats } from "@/components/stats"
import { UseCases } from "@/components/use-cases"
import { Pricing } from "@/components/pricing"
import { Testimonials } from "@/components/testimonials"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Stats />
      <UseCases />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
