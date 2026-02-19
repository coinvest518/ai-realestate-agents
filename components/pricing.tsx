"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
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
  const router = useRouter()
  const { user } = useAuth()

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

  const handleCheckout = async (planKey: string) => {
    if (!user) {
      toast.error('Please sign in to purchase')
      router.push('/auth/login')
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ plan: planKey }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.error || 'Checkout creation failed')

      // If backend returns a Stripe-hosted URL, redirect there.
      if (data.url) {
        window.location.href = data.url
      } else if (data.session_id) {
        // fallback: use Stripe.js redirect if available
        const stripePublic = (await import('@stripe/stripe-js')).loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        const stripe = await stripePublic
        await stripe?.redirectToCheckout({ sessionId: data.session_id })
      }
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed')
    }
  }

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
                <span className="text-4xl font-bold text-foreground">${plan.monthly}</span>
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
                onClick={() => {
                  const key = plan.name.toLowerCase()
                  if (key === 'starter') return router.push('/dashboard')
                  if (key === 'pro') return handleCheckout('pro')
                  // enterprise -> direct purchase (requires sign in)
                  if (key === 'enterprise') return handleCheckout('enterprise')
                  return null
                }}
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
