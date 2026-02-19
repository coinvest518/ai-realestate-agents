"use client"

import { useEffect, useRef, useState } from "react"

const stats = [
  { value: 96, suffix: "%", label: "Web coverage", desc: "Including JS-heavy pages" },
  { value: 850, suffix: "ms", label: "Avg response time", desc: "Blazing fast extraction" },
  { value: 12, suffix: "M+", label: "Agents scraped", desc: "And counting daily" },
  { value: 99.9, suffix: "%", label: "Uptime SLA", desc: "Enterprise reliability" },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 1500
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(parseFloat((value * eased).toFixed(1)))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className="text-4xl font-bold tabular-nums text-foreground lg:text-5xl">
      {Number.isInteger(value) ? Math.round(display) : display.toFixed(1)}
      <span className="text-primary">{suffix}</span>
    </div>
  )
}

export function Stats() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto mb-16 lg:mb-20 max-w-2xl text-center">
          <p className="mb-3 font-mono text-sm text-primary">
            {"// Performance"}
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built to outperform
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 bg-card p-8">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="font-medium text-foreground">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
