"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    try {
      setSearchParams(new URLSearchParams(window.location.search))
    } catch {
      setSearchParams(null)
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success("Signed in successfully!")

      // Prefer explicit redirect via ?next=...
      const next = searchParams?.get('next')
      if (next) {
        // clear any pending purchase key
        try { localStorage.removeItem('pending_purchase') } catch {}
        router.push(next)
        return
      }

      // If a pending purchase exists in localStorage, resume upgrade flow
      const pending = typeof window !== 'undefined' ? localStorage.getItem('pending_purchase') : null
      if (pending) {
        try { localStorage.removeItem('pending_purchase') } catch {}
        router.push(`/upgrade?plan=${pending}`)
        return
      }

      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Access your searches and data</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
