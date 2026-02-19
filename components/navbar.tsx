"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" suppressHydrationWarning>
      <nav className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-primary-foreground">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">AgentScrape</span>
        </div>

        <div className="hidden items-center gap-8 lg:gap-10 md:flex">
          <a href="/#features" className="text-sm lg:text-base text-muted-foreground transition-colors hover:text-foreground">Features</a>
          <a href="/#how-it-works" className="text-sm lg:text-base text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
          <a href="/#pricing" className="text-sm lg:text-base text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="/#testimonials" className="text-sm lg:text-base text-muted-foreground transition-colors hover:text-foreground">Testimonials</a>
          <Link href="/dashboard" className="text-sm lg:text-base text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:gap-4 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm lg:text-base" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm lg:text-base px-4 lg:px-5" asChild>
            <Link href="/dashboard">Get Started Free</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            <a href="/#features" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="/#how-it-works" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="/#pricing" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Pricing</a>
            <a href="/#testimonials" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Testimonials</a>
            <Link href="/dashboard" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                <Link href="/dashboard">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
