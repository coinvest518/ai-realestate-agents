"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
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
      setShowVerificationModal(true)
    } catch (error: any) {
      toast.error(error.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowVerificationModal(false)
    const next = searchParams?.get('next')
    router.push(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login")
  }

  return (
    <>
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center">Verify Your Email</DialogTitle>
            <DialogDescription className="text-center space-y-3 pt-2">
              <p className="text-base">
                We've sent a verification link to <strong>{email}</strong>
              </p>
              <p>
                Please check your email and click the verification link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                You won't be able to log in until you verify your email address.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleModalClose} className="w-full">
              Got it, I'll check my email
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder.
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
