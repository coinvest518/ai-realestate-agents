"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, MessageCircle } from "lucide-react"

type ChatMessage = { role: "user" | "assistant"; content: string; data?: unknown; action?: { kind: "confirm"; type: "people" | "scrape" | "apify" | "suggest-alternatives"; params?: any; pending?: boolean }; expanded?: boolean | null }

// --- Tool list for agent self-awareness ---
const TOOL_LIST = [
  {
    name: "People Search",
    description:
      "Finds phone numbers and info for a person using Apify Skip Trace actor.",
    trigger: "e.g. \"Find John Doe\" or \"Search Mike Smith\"",
    methods: [
      "🔎 Search by Name",
      "🔎 Search by Name + Location",
      "🏡 Search by Address",
      "📞 Search by Phone Number",
      "📧 Search by Email",
    ],
  },
  {
    name: "Property Scraper",
    description:
      "Extracts structured data from property listing URLs (Zillow, Realtor, Redfin, etc.) using CrewAI agent and Bright Data MCP.",
    trigger: "Paste a property URL (e.g. https://zillow.com/...)",
  },
  {
    name: "Tavily Web Tools",
    description:
      "Web search, content extraction, website crawling, and deep research using Tavily AI.",
    trigger: "e.g. 'Search for latest AI news' or 'Extract content from URL' or 'Research real estate trends'",
    methods: [
      "🔍 Web Search - AI-optimized search results",
      "📄 Extract - Clean content from URLs",
      "🕷️ Crawl - Multi-page website crawling",
      "📚 Research - Deep research from multiple sources",
    ],
  },
  {
    name: "General LLM Chat",
    description:
      "Conversational AI for general questions, market data, and small talk.",
    trigger: "Any other message",
  },
  {
    name: "Apify Actors",
    description:
      "Run Apify Actor tasks (run actor tasks, fetch dataset items, or run-sync for results).",
    trigger: "e.g. 'Run Apify task mhecrypto~skip-trace-task' or 'Run actor skip-trace-task'",
  },
]

function isToolListQuery(text: string) {
  return /what (tools|can you do|abilities|features|api|scrape|search)/i.test(text)
    || /list (tools|features|capabilities)/i.test(text)
    || /available tools/i.test(text)
    || /help/i.test(text);
}

function isApifyIntent(text: string) {
  return /\b(apify|actor|run task|run actor|run-sync|get dataset|skip-trace|skip trace|skip-trace-task)\b/i.test(text)
}

export default function ChatPanel() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const c = chatContainerRef.current
    if (!c) return
    const distanceFromBottom = c.scrollHeight - c.clientHeight - c.scrollTop
    const shouldAutoScroll = distanceFromBottom < 120
    if (shouldAutoScroll) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" })
  }, [chatMessages])

  function parsePeopleSearchIntent(text: string): { name: string; limit: number } | null {
    const t = text.trim()
    if (!t) return null

    const lower = t.toLowerCase()
    const greetings = [
      "hi",
      "hello",
      "hey",
      "yo",
      "sup",
      "thanks",
      "thank you",
      "good morning",
      "good afternoon",
      "good evening",
      "what's up",
    ]
    if (greetings.includes(lower)) return null

    // Remove common search prefixes and filler words
    let cleanText = t.replace(/^(and\s+r\s+|find|search|look up|get|skip trace|trace)\s+/i, '').trim()
    cleanText = cleanText.replace(/^(and\s+r\s+|find|search|look up|get|skip trace|trace)\s+/i, '').trim()
    
    // Extract limit if present
    const limitMatch = cleanText.match(/\s+limit\s+(\d+)$/i)
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 5
    if (limitMatch) cleanText = cleanText.replace(/\s+limit\s+\d+$/i, '').trim()

    return cleanText.length >= 2 ? { name: cleanText, limit: Math.min(Math.max(limit, 1), 50) } : null
  }

  // Send message: detect intent/URLs but ask for confirmation before running external tools
  async function sendChatMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    // Quick-confirmation: if user replies with a short affirmative ("yes", "run", "ok")
    // and the last assistant message contains a `confirm` action, treat this as clicking the assistant's "Run".
    const confirmationRe = /^(yes|yep|yeah|run|do it|ok|sure|confirm|go ahead|y)\b/i
    const lastAssistantWithActionIndex = (() => {
      for (let i = chatMessages.length - 1; i >= 0; i--) {
        const m = chatMessages[i]
        if (m.role === 'assistant' && m.action && m.action.kind === 'confirm') return i
      }
      return -1
    })()

    if (confirmationRe.test(text) && lastAssistantWithActionIndex !== -1) {
      // show user's confirmation message
      setChatMessages((prev) => [...prev, { role: 'user', content: text }])
      setChatInput("")
      setChatLoading(true)

      // run the existing confirm handler for that assistant message
      const action = chatMessages[lastAssistantWithActionIndex].action!
      await handleConfirmAction(lastAssistantWithActionIndex, action)
      setChatLoading(false)
      return
    }

    setChatMessages((prev) => [...prev, { role: "user", content: text }])
    setChatInput("")
    setChatLoading(true)

    if (isToolListQuery(text)) {
      const toolsInfo = TOOL_LIST.map(t => {
        let info = `• **${t.name}**: ${t.description}\n  Trigger: ${t.trigger}`
        if (t.methods && Array.isArray(t.methods)) {
          info += `\n  Search methods:\n    ${t.methods.join('\n    ')}`
        }
        return info
      }).join('\n\n')
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Here are the tools I can use:\n\n${toolsInfo}`,
        },
      ])
      setChatLoading(false)
      return
    }

    const intent = parsePeopleSearchIntent(text)
    const urlMatch = text.match(/https?:\/\/[^)]+/i)

    if (intent) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I can run a people search for "${intent.name}" (limit ${intent.limit}). Run now?`,
          action: { kind: "confirm", type: "people", params: { name: intent.name, limit: intent.limit } },
        },
      ])
      setChatLoading(false)
      return
    }

    if (urlMatch) {
      // Ask user to confirm scrape for detected URL
      const detected = urlMatch[0]
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I detected a URL and can run a property scrape for ${detected}. Run the scrape?`,
          action: { kind: "confirm", type: "scrape", params: { url: detected } },
        },
      ])
      setChatLoading(false)
      return
    }

    // Apify actor request detection
    if (isApifyIntent(text)) {
      // ask for confirmation and optionally a task id
      const suggested = undefined
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I can run an Apify Actor task. Provide the actor task id/slug (e.g. mhecrypto~skip-trace-task) or I'll prompt you. Run now?`,
          action: { kind: "confirm", type: "apify", params: { taskId: suggested } },
        },
      ])
      setChatLoading(false)
      return
    }

    // Fallback — general LLM chat
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "(No response)" },
      ])
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I couldn't get a response from the AI: ${e instanceof Error ? e.message : String(e)}` },
      ])
    }

    setChatLoading(false)
  }

  // Run people search via Apify orchestrator
  async function runPeopleSearchFromChat(name: string, limit: number): Promise<any> {
    setChatLoading(true)
    setChatMessages((prev) => [...prev, { role: "assistant", content: `Running people search for "${name}" (limit ${limit})…` }])
    try {
      const startRes = await fetch(`${API_BASE}/api/people-search/start-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people_name: name, data_limit: limit }),
      })
      if (!startRes.ok) throw new Error(await startRes.text())
      const { task_id } = await startRes.json()

      const es = new EventSource(`${API_BASE}/api/scrape/task/${task_id}/stream`)
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (d.line) setChatMessages((prev) => [...prev, { role: 'assistant', content: d.line }])
        } catch { }
      }
      es.addEventListener('done', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data)
          const resultObj = payload.result || null
          if (resultObj && resultObj.ok) {
            const resData: any = resultObj.result || resultObj
            let items: any[] | null = null
            if (resData && Array.isArray(resData.items)) items = resData.items
            if (items && items.length > 0) {
              const formatted = items.map((p, idx) => {
                const name = `${p['First Name'] || ''} ${p['Last Name'] || ''}`.trim()
                const age = p['Age'] || 'N/A'
                const location = `${p['City'] || ''}, ${p['State'] || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'N/A'
                const address = p['Address'] || 'N/A'
                const phones = [p['Phone-1'], p['Phone-2'], p['Phone-3']].filter(Boolean).join(', ') || 'N/A'
                const emails = [p['Email-1'], p['Email-2']].filter(Boolean).join(', ') || 'N/A'
                return `**Person ${idx + 1}:**\n- Name: ${name}\n- Age: ${age}\n- Location: ${location}\n- Address: ${address}\n- Phones: ${phones}\n- Emails: ${emails}`
              }).join('\n\n')
              setChatMessages((prev) => [...prev, { role: 'assistant', content: formatted, data: { items, dataset_id: resData.dataset_id } }])
            } else {
              setChatMessages((prev) => [...prev, { role: 'assistant', content: `No results from Apify. Trying Tavily web search...` }])
              runTavilySearchFallback(name, limit)
            }
          } else {
            setChatMessages((prev) => [...prev, { role: 'assistant', content: `Apify search failed. Trying Tavily web search...` }])
            runTavilySearchFallback(name, limit)
          }
        } catch (e) {
          setChatMessages((prev) => [...prev, { role: 'assistant', content: `Search error. Trying Tavily fallback...` }])
          runTavilySearchFallback(name, limit)
        } finally {
          es.close()
          setChatLoading(false)
        }
      })
      es.onerror = (err) => {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: `Search error: ${String(err)}` }])
        es.close()
        setChatLoading(false)
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Search error: ${e instanceof Error ? e.message : String(e)}` }])
      setChatLoading(false)
    }
    return null
  }

  // Tavily search fallback when Apify fails
  async function runTavilySearchFallback(name: string, limit: number) {
    try {
      const res = await fetch(`${API_BASE}/api/tavily/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${name} phone number email address contact information`, max_results: limit }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (data.ok && data.result?.results) {
        const formatted = data.result.results.map((r: any, idx: number) => 
          `**Result ${idx + 1}:**\n- Title: ${r.title || 'N/A'}\n- URL: ${r.url || 'N/A'}\n- Content: ${(r.content || r.snippet || 'N/A').substring(0, 200)}...`
        ).join('\n\n')
        setChatMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: `Tavily web search results:\n\n${formatted}`, data: data.result },
          { 
            role: 'assistant', 
            content: `Still no luck? I can try:\n\n1. **Property Scraper** - If you have a property URL\n2. **General Web Search** - Broader search query\n3. **Apify Actors** - Run custom actor\n\nWould you like to try any of these? Just say "yes" or specify which one.`,
            action: { kind: 'confirm', type: 'suggest-alternatives', params: { originalQuery: name } }
          }
        ])
      } else {
        setChatMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: `No results from Tavily either.` },
          {
            role: 'assistant',
            content: `I've tried Apify Skip Trace and Tavily Search. Would you like me to:\n\n1. Try a **different search query**?\n2. Run a **property scraper** if you have a URL?\n3. Use **general web search** for broader results?\n\nLet me know what you'd like to try next.`,
            action: { kind: 'confirm', type: 'suggest-alternatives', params: { originalQuery: name } }
          }
        ])
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: `Tavily search failed: ${e instanceof Error ? e.message : String(e)}` },
        {
          role: 'assistant',
          content: `Both automated tools failed. I can still help with:\n\n- Property scraping (paste a URL)\n- General questions\n- Running custom Apify actors\n\nWhat would you like to try?`
        }
      ])
    }
  }

  // Run an Apify Actor task from chat
  async function runApifyTaskFromChat(taskId?: string, input?: any, opts?: { wait_for_finish?: boolean; fetch_dataset?: boolean }): Promise<any | null> {
    setChatLoading(true)
    setChatMessages((prev) => [...prev, { role: "assistant", content: `Running Apify task ${taskId || '(prompt)'}...` }])
    try {
      let finalTaskId = taskId
      if (!finalTaskId) {
        finalTaskId = window.prompt('Enter Apify task id/slug (e.g. mhecrypto~skip-trace-task)') || undefined
        if (!finalTaskId) {
          setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Cancelled Apify run (no task id provided).' }])
          return null
        }
      }

      const payload: any = { task_id: finalTaskId }
      if (input) payload.input = input
      if (opts?.wait_for_finish) payload.wait_for_finish = true
      if (opts?.fetch_dataset) payload.fetch_dataset = true

      const res = await fetch(`${API_BASE}/api/apify/run-task`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || res.statusText)
      }
      const data = await res.json()

      // If run-sync-get-dataset-items used, response likely contains items array
      if (data && data.items) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: JSON.stringify(data.items, null, 2), data }])
        return data
      }

      // async run returned metadata
      if (data.run || data.id) {
        const runId = data.run?.id || data.id || (data.run && data.run._id)
        setChatMessages((prev) => [...prev, { role: 'assistant', content: `Started Apify run ${runId}` , data }])
        // try to fetch dataset if available
        if (opts?.wait_for_finish && data.defaultDatasetId) {
          const itemsRes = await fetch(`${API_BASE}/api/apify/run/${runId}/dataset`)
          if (itemsRes.ok) {
            const items = await itemsRes.json()
            setChatMessages((prev) => [...prev, { role: 'assistant', content: JSON.stringify(items.items || items, null, 2), data: items }])
            return items
          }
        }
        return data
      }

      // otherwise just show raw response
      setChatMessages((prev) => [...prev, { role: 'assistant', content: JSON.stringify(data, null, 2), data }])
      return data
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Apify error: ${e instanceof Error ? e.message : String(e)}` }])
      return null
    } finally {
      setChatLoading(false)
    }
  }

  // --- New: allow starting a property scrape from chat and stream logs into chat ---
  async function runScrapeFromChat(url?: string) {
    const listingUrl = url || window.prompt("Enter listing URL to scrape (Zillow / Realtor / Redfin)")
    if (!listingUrl) return
    setChatMessages((prev) => [...prev, { role: "user", content: `Scrape: ${listingUrl}` }])
    setChatLoading(true)

    try {
      const startRes = await fetch(`${API_BASE}/api/scrape/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      })

      if (!startRes.ok) {
        // fallback to synchronous scrape
        const res = await fetch(`${API_BASE}/api/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        })
        const data = await res.json()
        setChatMessages((prev) => [...prev, { role: "assistant", content: JSON.stringify(data, null, 2) }])
        setChatLoading(false)
        return
      }

      const { task_id } = await startRes.json()
      // stream logs via SSE and append to chat
      const es = new EventSource(`${API_BASE}/api/scrape/task/${task_id}/stream`)
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data)
          if (d.line) setChatMessages((prev) => [...prev, { role: "assistant", content: d.line }])
        } catch {
          // ignore
        }
      }
      es.addEventListener("done", (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data)
          const resultObj = payload.result || null
          if (resultObj && resultObj.success) {
            setChatMessages((prev) => [...prev, { role: "assistant", content: JSON.stringify(resultObj.data, null, 2), data: resultObj }])
          } else if (resultObj) {
            setChatMessages((prev) => [...prev, { role: "assistant", content: `Scrape failed: ${resultObj.error || 'unknown'}` }])
          }
        } catch (e) {
          setChatMessages((prev) => [...prev, { role: "assistant", content: `Scrape ended (unable to parse result)` }])
        } finally {
          es.close()
          setChatLoading(false)
        }
      })
      es.onerror = (err) => {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Stream error: ${String(err)}` }])
        es.close()
        setChatLoading(false)
      }
    } catch (e) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Scrape error: ${e instanceof Error ? e.message : String(e)}` }])
      setChatLoading(false)
    }
  }

  // Confirm/cancel handlers for assistant suggestions
  async function handleConfirmAction(index: number, action: NonNullable<ChatMessage['action']>) {
    // mark pending (guard that m.action exists before spreading)
    setChatMessages((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m
        if (!m.action) return m
        return { ...m, action: { ...m.action, pending: true } }
      }),
    )
    try {
      if (action.type === 'people') {
        const { name, limit } = (action.params || {}) as any
        await runPeopleSearchFromChat(name || action.params.name, limit || action.params.limit)
      } else if (action.type === 'scrape') {
        await runScrapeFromChat(action.params.url)
      } else if (action.type === 'apify') {
        const { taskId, input } = (action.params || {}) as any
        await runApifyTaskFromChat(taskId, input, { wait_for_finish: false, fetch_dataset: false })
      } else if (action.type === 'suggest-alternatives') {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Which alternative would you like to try? Reply with:\n- "property scraper" + URL\n- "web search" + query\n- "apify actor" + task name' }
        ])
      }
    } finally {
      // clear action UI
      setChatMessages((prev) => prev.map((m, i) => (i === index ? { ...m, action: undefined } : m)))
    }
  }

  function handleCancelAction(index: number) {
    setChatMessages((prev) => prev.map((m, i) => (i === index ? { ...m, action: undefined } : m)))
    setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Cancelled.' }])
  }

  function toggleExpand(index: number) {
    setChatMessages((prev) => prev.map((m, i) => (i === index ? { ...m, expanded: !m.expanded } : m)))
  }

  return (
    <Card className="flex flex-col min-h-[420px] max-h-[75vh] md:min-h-[480px] p-6 sm:p-8">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <MessageCircle className="size-5" />
          Conversational people search
        </CardTitle>
        <CardDescription className="text-sm md:text-base mt-1.5">
          Type e.g. "Find John Doe" or "Search Mike Smith limit 10". I’ll run the BrowserAct Phone Number Extractor and show results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0 pt-4">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {chatMessages.length === 0 && (
            <p className="text-sm md:text-base text-muted-foreground">Try: "Find Jane Smith" or "Search for John Doe limit 5"</p>
          )}

          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-4 text-sm md:text-base bg-primary/10 rounded-lg px-4 py-3 max-w-[90%]"
                  : "mr-4 text-sm md:text-base bg-muted/50 rounded-lg px-4 py-3 max-w-[90%]"
              }
            >
              {m.role === "user" ? (
                m.content
              ) : (
                <>
                  <div className="mb-2">
                    <pre className="whitespace-pre-wrap text-xs md:text-sm overflow-auto max-h-80">{m.content}</pre>
                  </div>

                  {/* show live session / logs if available in message data */}
                  {m.data && (m.data as any).live_url && (
                    <div className="flex gap-2 mb-2">
                      <Button variant="ghost" onClick={() => window.open((m.data as any).live_url, "_blank")}>Open live session</Button>
                      {(m.data as any).log_detail_url && (
                        <Button variant="outline" onClick={() => window.open((m.data as any).log_detail_url, "_blank")}>Open logs</Button>
                      )}
                    </div>
                  )}

                  {/* details toggle - default to expanded for results */}
                  {m.data && (
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(i)}>{m.expanded !== false ? 'Hide details' : 'Show details'}</Button>
                      {m.action?.kind === "confirm" && (
                        <>
                          <Button onClick={() => handleConfirmAction(i, m.action!)} disabled={m.action?.pending || chatLoading} className="min-h-8 px-3">
                            Run
                          </Button>
                          <Button variant="outline" onClick={() => handleCancelAction(i)} disabled={m.action?.pending} className="min-h-8 px-3">
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* expanded full JSON - default to showing for data messages */}
                  {(m.expanded !== false && m.data) && (
                    <div className="mt-2">
                      <pre className="whitespace-pre-wrap text-xs max-h-72 overflow-auto">{JSON.stringify(m.data, null, 2)}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="mr-4 text-sm md:text-base bg-muted/50 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Running people search…
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 flex-shrink-0">
          <Input
            placeholder="Find John Doe / Search by name, address, phone, or email. Type 'help' for methods."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
            disabled={chatLoading}
            className="min-h-12 text-sm md:text-base flex-1"
          />
          <Button variant="outline" onClick={() => runScrapeFromChat()} disabled={chatLoading} className="min-h-12 px-4">
            Scrape
          </Button>
          <Button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="min-h-12 px-6">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
