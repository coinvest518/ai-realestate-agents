"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

const PLANS = [
  {
    name: "Pro",
    price: 49,
    searches: "50,000",
    features: ["50,000 searches/month", "Priority support", "Custom schemas", "CRM integrations"]
  },
  {
    name: "Enterprise",
    price: 299,
    searches: "Unlimited",
    features: ["Unlimited searches", "Dedicated infrastructure", "24/7 support + SLA", "Custom AI models"]
  }
]

export default function UpgradePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const queryPlan = searchParams?.get('plan') || null
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!queryPlan) return
    // If the page has ?plan=pro or ?plan=enterprise and user is signed in,
    // auto-start checkout. If not signed in, do nothing (login will redirect back).
    if (user) {
      handleCheckout(queryPlan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPlan, user])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>Please sign in to upgrade your plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/auth/signin")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id
        },
        body: JSON.stringify({ plan })
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed")
      setCheckoutLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade Your Plan</h1>
          <p className="text-lg text-muted-foreground">Choose the perfect plan for your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {PLANS.map((plan) => (
            <Card key={plan.name} className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Searches per month</p>
                  <p className="text-2xl font-semibold">{plan.searches}</p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="size-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleCheckout(plan.name.toLowerCase())}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}
