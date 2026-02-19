"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    desc: "For individual agents and small teams getting started.",
    monthly: 0,
    yearly: 0,
    features: [
      "1,000 scrapes / month",
      "5 concurrent requests",
      "JSON output",
      "Community support",
      "Standard rate limits",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    desc: "For growing teams and lead generation agencies.",
    monthly: 79,
    yearly: 59,
    features: [
      "50,000 scrapes / month",
      "25 concurrent requests",
      "JSON + CSV + Webhook",
      "Priority support",
      "Custom schemas",
      "CRM integrations",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    desc: "For large-scale operations and custom deployments.",
    monthly: 299,
    yearly: 249,
    features: [
      "Unlimited scrapes",
      "100 concurrent requests",
      "Dedicated infrastructure",
      "24/7 support + SLA",
      "Custom AI models",
      "On-prem deployment option",
      "SSO & audit logs",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="border-t border-border/50 py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto mb-12 lg:mb-16 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm text-primary">
            {"// Pricing"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free and scale as your needs grow. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                annual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <Badge variant="outline" className="ml-2 border-primary/30 text-primary text-[10px]">
                Save 25%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-8",
                plan.popular
                  ? "border-primary/50 bg-card shadow-lg shadow-primary/10"
                  : "border-border bg-card/50"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  ${annual ? plan.yearly : plan.monthly}
                </span>
                {plan.monthly > 0 && (
                  <span className="text-sm text-muted-foreground">/ month</span>
                )}
              </div>

              <ul className="mt-8 flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-8 w-full",
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
