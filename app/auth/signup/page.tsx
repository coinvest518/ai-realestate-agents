"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    try {
      setSearchParams(new URLSearchParams(window.location.search))
    } catch {
      setSearchParams(null)
    }
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(email, password, { name: displayName })
      toast.success("Account created! Check your email to confirm.")
      const next = searchParams?.get('next')
      router.push(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login")
    } catch (error: any) {
      toast.error(error.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Get started with 1 free search</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
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
              {loading ? "Creating..." : "Sign Up"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
