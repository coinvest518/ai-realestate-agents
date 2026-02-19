"use client"

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { Check, X, Loader2, AlertCircle, UserSearch, Building2, LogIn } from "lucide-react"
import ChatPanel from "@/components/chat-panel"
import { useAuth } from "@/components/auth-provider"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

type EnvItem = { name: string; set: boolean; required: boolean }
type EnvStatus = { env: EnvItem[]; ready: boolean }
type ScrapeResult = {
  success: boolean
  data?: Record<string, unknown> | null
  raw_preview?: string
  error?: string
}

type BrowserActTask = {
  id: string
  status: string
  output?: { string?: string; files?: string[] }
  task_failure_info?: { message?: string }
}

function parsePeopleSearchIntent(text: string): { name: string; limit: number } | null {
  const t = text.trim().toLowerCase()
  const match = t.match(/(?:find|search|look up|get)\s+(?:phone\s+)?(?:for\s+)?([^.?!]+?)(?:\s+limit\s+(\d+))?\.?$/i)
    || t.match(/([A-Za-z][A-Za-z\s]+?)(?:\s+limit\s+(\d+))?\.?$/)
  if (!match) return null
  const name = (match[1] || "").trim()
  const limit = match[2] ? parseInt(match[2], 10) : 5
  return name.length >= 2 ? { name, limit: Math.min(Math.max(limit, 1), 50) } : null
}

async function pollTask(taskId: string): Promise<BrowserActTask> {
  const maxAttempts = 120
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${API_BASE}/api/browseract/task/${taskId}`)
    if (!res.ok) throw new Error(await res.text())
    const task: BrowserActTask = await res.json()
    if (["finished", "failed", "canceled"].includes(task.status)) return task
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error("Timeout waiting for task")
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)
  const [envLoading, setEnvLoading] = useState(true)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const [scraping, setScraping] = useState(false)
  const [scrapeTaskId, setScrapeTaskId] = useState<string | null>(null)
  const [scrapingLogs, setScrapingLogs] = useState<string[]>([])
  const [result, setResult] = useState<ScrapeResult | null>(null)

  const [peopleName, setPeopleName] = useState("")
  const [dataLimit, setDataLimit] = useState(5)
  const [peopleSearching, setPeopleSearching] = useState(false)
  const [peopleResult, setPeopleResult] = useState<BrowserActTask | null>(null)
  const [peopleError, setPeopleError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUsageCount()
    }
  }, [user])

  const fetchUsageCount = async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/api/usage/searches`, {
        headers: { "x-user-id": user.id }
      })
      if (res.ok) {
        const data = await res.json()
        setUsageCount(data.data?.count || 0)
      }
    } catch (e) {
      console.error("Failed to fetch usage:", e)
    }
  }

  const checkAuth = () => {
    if (user) return true

    // Allow one free use for unauthenticated visitors.
    if (typeof window !== "undefined") {
      try {
        const used = localStorage.getItem("agent_scrape_free_used")
        if (!used) {
          localStorage.setItem("agent_scrape_free_used", "1")
          return true
        }
      } catch {}
    }

    setShowAuthModal(true)
    return false
  }

  const trackUsage = async (type: string) => {
    if (!user) return
    try {
      await fetch(`${API_BASE}/api/usage/track`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id 
        },
        body: JSON.stringify({ type })
      })
      await fetchUsageCount()
    } catch (e) {
      console.error("Failed to track usage:", e)
    }
  }



  async function runScrape() {
    if (!checkAuth()) return
    if (!scrapeUrl.trim()) return
    setScraping(true)
    setResult(null)
    setScrapingLogs([])
    setScrapeTaskId(null)

    try {
      const startRes = await fetch(`${API_BASE}/api/scrape/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      })
      if (!startRes.ok) {
        const res = await fetch(`${API_BASE}/api/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: scrapeUrl.trim() }),
        })
        const data = await res.json()
        setResult(data)
        if (user) await trackUsage("scrape")
        return
      }

      const { task_id } = await startRes.json()
      setScrapeTaskId(task_id)

      const es = new EventSource(`${API_BASE}/api/scrape/task/${task_id}/stream`)
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (d.line) setScrapingLogs((prev) => [...prev, d.line])
        } catch {
          // ignore
        }
      }
      es.addEventListener("done", (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data)
          const resultObj = payload.result || null
          if (resultObj && resultObj.success) {
            setResult(resultObj)
          } else if (resultObj && !resultObj.success) {
            setResult({ success: false, error: resultObj.error || "Task failed" })
          }
        } catch (e) {
          setResult({ success: false, error: e instanceof Error ? e.message : "Unknown error" })
        } finally {
          es.close()
          setScraping(false)
          if (user) trackUsage("scrape")
        }
      })
      es.onerror = (err) => {
        setScrapingLogs((prev) => [...prev, `SSE error: ${String(err)}`])
        es.close()
        setScraping(false)
      }
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : "Request failed" })
      setScraping(false)
    }
  }

  async function runPeopleSearch(name?: string, limit?: number) {
    if (!checkAuth()) return
    const n = (name ?? peopleName).trim()
    const l = limit ?? dataLimit
    if (!n) return
    setPeopleSearching(true)
    setPeopleResult(null)
    setPeopleError(null)
    try {
      const startRes = await fetch(`${API_BASE}/api/people-search/start-orchestrator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people_name: n, data_limit: l }),
      })
      if (!startRes.ok) throw new Error(await startRes.text())
      const { task_id } = await startRes.json()

      const es = new EventSource(`${API_BASE}/api/scrape/task/${task_id}/stream`)
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (d.line) {
            setPeopleResult((prev) => ({
              id: task_id,
              status: "running",
              output: { string: (prev?.output?.string || "") + d.line + "\n" }
            }))
          }
        } catch {}
      }
      es.addEventListener("done", (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data)
          const resultObj = payload.result || null
          if (resultObj && resultObj.ok) {
            const resData = resultObj.result || resultObj
            const items = resData.items || []
            const formatted = items.map((item: any, idx: number) => {
              const parts = [
                `Result ${idx + 1}:`,
                `Name: ${[item["First Name"], item["Last Name"]].filter(Boolean).join(" ") || "N/A"}`,
                item.Age ? `Age: ${item.Age}` : null,
                item.City && item.State ? `Location: ${item.City}, ${item.State}` : null,
                item.Address ? `Address: ${item.Address}` : null,
                [item["Phone-1"], item["Phone-2"], item["Phone-3"]].filter(Boolean).length > 0
                  ? `Phones: ${[item["Phone-1"], item["Phone-2"], item["Phone-3"]].filter(Boolean).join(", ")}`
                  : null,
                [item["Email-1"], item["Email-2"]].filter(Boolean).length > 0
                  ? `Emails: ${[item["Email-1"], item["Email-2"]].filter(Boolean).join(", ")}`
                  : null,
              ].filter(Boolean).join("\n")
              return parts
            }).join("\n\n")
            setPeopleResult({
              id: task_id,
              status: "finished",
              output: { string: formatted || "No results found" }
            })
            if (user) trackUsage("people_search")
          } else {
            setPeopleError(resultObj?.error || "Task failed")
          }
        } catch (e) {
          setPeopleError(e instanceof Error ? e.message : "Unknown error")
        } finally {
          es.close()
          setPeopleSearching(false)
        }
      })
      es.onerror = () => {
        setPeopleError("Connection error")
        es.close()
        setPeopleSearching(false)
      }
    } catch (e) {
      setPeopleError(e instanceof Error ? e.message : "Request failed")
      setPeopleSearching(false)
    }
  }



  // Helpers for property result display
  const getImageUrls = (data: any): string[] => {
    if (!data) return []
    const raw = data.image_urls ?? data.images ?? data.imgSrc ?? []
    // already an array
    if (Array.isArray(raw)) return raw.filter(Boolean).map((u) => String(u)).filter((u) => u.startsWith("http"))
    // string: try to parse JSON encoded list, otherwise split on commas/newlines/whitespace
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String).filter((u) => u.startsWith("http"))
      } catch {}
      return raw
        .split(/[,\n\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((u) => u.startsWith("http"))
    }
    return []
  }

  const formatField = (k: string, v: any) => {
    if (v == null) return ""
    if (k === "price") return String(v)
    if (k === "square_feet" || k === "sqft" || k === "squareFeet") {
      const n = Number(String(v).replace(/[^\d]/g, ""))
      return Number.isFinite(n) ? n.toLocaleString() : String(v)
    }
    if (Array.isArray(v)) return v.join(", ")
    if (typeof v === "object") return JSON.stringify(v)
    return String(v)
  }

  const renderAiOutput = (raw: string): ReactNode => {
    if (!raw) return null
    const lines = String(raw).split(/\r?\n/)
    return (
      <div className="mb-4 rounded-md border border-border bg-muted/10 p-3 text-sm font-mono text-xs">
        {lines.map((ln, i) => {
          const line = ln.trim()
          if (!line) return <div key={i} className="text-muted-foreground">&nbsp;</div>
          if (/^Thought:/i.test(line)) {
            return (
              <div key={i} className="mb-1">
                <span className="font-semibold text-muted-foreground">Thought:</span>
                <span className="ml-2">{line.replace(/^Thought:\s*/i, "")}</span>
              </div>
            )
          }
          if (/^Action:/i.test(line) || /^Action input:/i.test(line)) {
            return (
              <div key={i} className="mb-1">
                <span className="px-1.5 py-0.5 bg-accent/10 rounded text-[11px] font-medium mr-2">Action</span>
                <span className="font-mono">{line}</span>
              </div>
            )
          }
          // detect URLs and render as clickable
          const urlMatch = line.match(/(https?:\/\/[^\s\)\]]+)/g)
          if (urlMatch) {
            return (
              <div key={i} className="mb-1">
                {line.split(/(https?:\/\/[^\s\)\]]+)/g).map((part, idx) => (
                  /https?:\/\//.test(part) ? (
                    <a key={idx} href={part} target="_blank" rel="noreferrer" className="text-primary underline">
                      {part}
                    </a>
                  ) : (
                    <span key={idx}>{part}</span>
                  )
                ))}
              </div>
            )
          }
          // JSON-like blocks: render as pre
          if (/^[\{\[]/.test(line)) {
            try {
              const parsed = JSON.parse(line)
              return (
                <pre key={i} className="rounded bg-muted/20 p-2 mt-2 text-xs overflow-auto">{JSON.stringify(parsed, null, 2)}</pre>
              )
            } catch {
              return <div key={i}>{line}</div>
            }
          }
          return <div key={i}>{line}</div>
        })}
      </div>
    )
  }

  const handleCopyJSON = (obj: any) => {
    try { navigator.clipboard.writeText(JSON.stringify(obj, null, 2)) } catch {}
  }

  const handleDownloadJSON = (obj: any, filename = "property.json") => {
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  async function fetchScrapeTaskLogs(taskId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/scrape/task/${taskId}/logs`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setScrapingLogs(data.logs || [])
    } catch (e) {
      setScrapingLogs((prev) => [...prev, `Failed to load logs: ${e instanceof Error ? e.message : String(e)}`])
    }
  }

  const browserActReady = envStatus?.env?.some((e) => e.name === "BROWSERACT_API_KEY" && e.set)

  return (
    <main className="flex-1 overflow-auto bg-background text-foreground">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 lg:py-10 space-y-12 md:space-y-16">
        {/* Supported sources (moved above chat) */}
        <section id="supported-sources" className="scroll-mt-24">
          <div className="flex flex-col gap-3 md:gap-4">
            <p className="text-base text-muted-foreground md:text-lg max-w-2xl">
              Use the AI chat above for intelligent searches, or use these dedicated tools directly.
            </p>

            {/* Supported sources */}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-medium text-muted-foreground mr-2">Supported sources:</span>
              <div className="flex gap-2 flex-wrap">
                <Badge className="text-sm">Zillow</Badge>
                <Badge className="text-sm">Realtor.com</Badge>
                <Badge className="text-sm">Redfin</Badge>
                <Badge className="text-sm">Trulia</Badge>
                <Badge variant="outline" className="text-sm">Other public sites via Bright Data MCP</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Chat - Main Feature */}
        <section id="chat" className="scroll-mt-24">
          <ChatPanel />
        </section>

        {/* Property scrape */}
        <section id="property-scrape" className="scroll-mt-24 space-y-6">
          <Card className="p-6 sm:p-8">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Building2 className="size-5" />
                Property scrape
              </CardTitle>
              <CardDescription className="text-sm md:text-base mt-1.5">
                Enter a property listing URL (Zillow, Realtor.com, Redfin). Uses Bright Data + Nebius.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runScrape()}
                  disabled={scraping}
                  className="font-mono text-sm md:text-base flex-1 min-h-11"
                />
                <Button onClick={runScrape} disabled={scraping || !scrapeUrl.trim()} className="min-h-11 px-6">
                  {scraping ? (
                    <>
                      <Loader2 className="size-5 animate-spin mr-2" />
                      Running…
                    </>
                  ) : (
                    "Run scrape"
                  )}
                </Button>
              </div>

              {/* Live logs (SSE) */}
              {(scraping || scrapingLogs.length > 0) && (
                <div className="mt-4 rounded-md border border-border bg-muted/10 p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">Live scrape logs</div>
                    <div className="text-xs text-muted-foreground">{scraping ? "running" : "finished"}{scrapeTaskId ? ` • ${scrapeTaskId.slice(0, 8)}` : ''}</div>
                  </div>
                  <pre className="max-h-56 overflow-auto text-xs whitespace-pre-wrap bg-transparent m-0 p-2">
                    {scrapingLogs.length === 0 ? (<span className="text-muted-foreground">Waiting for logs…</span>) : scrapingLogs.map((l, i) => (
                      <div key={i} className="leading-5">{l}</div>
                    ))}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property result */}
          {result && (
            <Card className="p-6 sm:p-8">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  {result.success ? (
                    <>
                      <Check className="size-5 text-primary" />
                      Property result
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-5 text-destructive" />
                      Error
                    </>
                  )}
                </CardTitle>
                {result.error && (
                  <CardDescription className="text-destructive text-sm md:text-base">{result.error}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {result.success && result.data && typeof result.data === "object" && (
                  <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                    {/* Image carousel (if available) */}
                    {getImageUrls(result.data).length > 0 && (
                      <div className="w-full bg-black/5 p-3">
                        <Carousel className="rounded-md overflow-hidden">
                          <CarouselContent>
                            {getImageUrls(result.data).map((src, idx) => (
                              <CarouselItem key={idx} className="aspect-[16/9] bg-black/10 flex items-center justify-center">
                                <img src={src} alt={`property-${idx}`} className="w-full h-full object-cover" />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                      </div>
                    )}

                    {/* AI / agent trace (raw output) */}
                    {result.data && typeof (result.data as any).raw_output === "string" && (
                      <div className="px-4 pt-4">
                        <div className="text-xs text-muted-foreground mb-2">Agent trace</div>
                        {renderAiOutput(String((result.data as any).raw_output))}
                      </div>
                    )}

                    <table className="w-full text-sm md:text-base">
                      <tbody>
                        {Object.entries(result.data as any).map(([key, value]) => (
                          <tr key={key} className="border-b border-border/50 last:border-0">
                            <td className="py-3 px-4 font-medium text-muted-foreground align-top w-44 md:w-52">
                              {key}
                            </td>
                            <td className="py-3 px-4 break-words">
                              {Array.isArray(value)
                                ? value.join(", ")
                                : typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value ?? "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {result.success && result.raw_preview && !result.data && (
                  <pre className="rounded-lg border border-border bg-muted/20 p-4 text-xs md:text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                    {result.raw_preview}
                  </pre>
                )}
                {result.success && result.data && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm md:text-base text-muted-foreground hover:text-foreground">
                      Raw JSON
                    </summary>
                    <pre className="mt-2 rounded-lg border border-border bg-muted/20 p-4 text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="secondary" onClick={() => handleCopyJSON(result.data)}>Copy JSON</Button>
                      <Button size="sm" onClick={() => handleDownloadJSON(result.data)}>Download JSON</Button>
                      {scrapeTaskId && scrapingLogs.length === 0 && (
                        <Button size="sm" variant="outline" onClick={() => fetchScrapeTaskLogs(scrapeTaskId)}>Load task logs</Button>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* People Search */}
        <section id="people-search" className="scroll-mt-24">
          <Card className="p-6 sm:p-8">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <UserSearch className="size-5" />
                People search (skip tracing)
              </CardTitle>
              <CardDescription className="text-sm md:text-base mt-1.5">
                Uses Apify Skip Trace actor to find contact information from public records.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Person name
                  </label>
                  <Input
                    placeholder="e.g. John Doe, Mike Smith"
                    value={peopleName}
                    onChange={(e) => setPeopleName(e.target.value)}
                    disabled={peopleSearching}
                    className="min-h-11 text-sm md:text-base"
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Limit
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={dataLimit}
                    onChange={(e) => setDataLimit(parseInt(e.target.value, 10) || 5)}
                    disabled={peopleSearching}
                    className="min-h-11"
                  />
                </div>
                <Button
                  onClick={() => runPeopleSearch()}
                  disabled={peopleSearching || !peopleName.trim()}
                  className="min-h-11 px-6"
                >
                  {peopleSearching ? (
                    <>
                      <Loader2 className="size-5 animate-spin mr-2" />
                      Searching…
                    </>
                  ) : (
                    "Run people search"
                  )}
                </Button>
              </div>
              {peopleError && (
                <p className="text-sm md:text-base text-destructive">{peopleError}</p>
              )}
              {peopleResult && peopleResult.status === "finished" && peopleResult.output?.string && (
                <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                  <pre className="p-4 text-xs md:text-sm overflow-auto max-h-[28rem] whitespace-pre-wrap">
                    {peopleResult.output.string}
                  </pre>
                  {peopleResult.output.files?.length ? (
                    <p className="text-sm text-muted-foreground px-4 pb-3">
                      Download: {peopleResult.output.files.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="underline ml-1">{u}</a>
                      ))}
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </section>


      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="size-5" />
                Sign in to continue
              </CardTitle>
              <CardDescription>
                {usageCount > 0 
                  ? "You've used your free trial. Sign in to upgrade and continue."
                  : "Create an account to save your searches and access premium features."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => router.push("/auth/signup")}>
                Create Account
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/auth/signin")}>
                Sign In
              </Button>
              {(usageCount > 0 || (!user && typeof window !== 'undefined' && localStorage.getItem('agent_scrape_free_used'))) && (
                <Button variant="default" className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push("/upgrade")}>
                  Upgrade Now
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setShowAuthModal(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
