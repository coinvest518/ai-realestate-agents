"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function IntegrationsSettings() {
  const { user, session, loading } = useAuth()
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [list, setList] = useState<any[]>([])
  const [savingProvider, setSavingProvider] = useState<string | null>(null)

  const PROVIDERS = ["browseract", "tavily", "nebius", "apify", "brightdata", "openai"]

  async function fetchList() {
    try {
      const token = session?.access_token
      const res = await fetch("/api/integrations", { headers: { authorization: token ? `Bearer ${token}` : "" } })
      const data = await res.json()
      if (data.ok) setList(data.integrations || [])
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    if (!user) return
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session])

  function getPlaceholder(p: string) {
    switch (p) {
      case "browseract":
        return "Enter your BrowserAct API key (app-...)"
      case "tavily":
        return "Enter your Tavily API key (tvly-...)"
      case "nebius":
        return "Enter your Nebius API key"
      case "apify":
        return "Enter your Apify token"
      case "brightdata":
        return "Enter your Bright Data token"
      case "openai":
        return "Enter your OpenAI API key (sk-...)"
      default:
        return "Enter API key"
    }
  }

  async function handleSaveProvider(provider: string) {
    if (!user) return alert("Sign in first")
    const apiKey = (keys[provider] || "").trim()
    if (!apiKey) return alert("Enter a key first")
    setSavingProvider(provider)
    try {
      const vres = await fetch("/api/integrations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      })
      const vdata = await vres.json()
      if (!vres.ok || !vdata.ok) {
        alert("Validation failed: " + (vdata.detail || vdata.error || "invalid key"))
        setSavingProvider(null)
        return
      }

      const token = session?.access_token
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ provider, apiKey }),
      })
      const data = await res.json()
      if (data.ok) {
        setKeys((k) => ({ ...k, [provider]: "" }))
        fetchList()
      } else {
        alert("Error: " + (data.error || "unknown"))
      }
    } catch (err) {
      alert(String(err))
    } finally {
      setSavingProvider(null)
    }
  }

  async function handleDeleteProvider(provider: string) {
    if (!user) return
    const item = list.find((l) => l.provider === provider)
    if (!item) return alert("No saved integration for " + provider)
    if (!confirm("Delete this integration?")) return
    try {
      const token = session?.access_token
      const res = await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ id: item.id }),
      })
      const data = await res.json()
      if (data.ok) fetchList()
      else alert(data.error || "delete failed")
    } catch (err) {
      alert(String(err))
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  const connected = new Set(list.map((l) => l.provider))

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-2">Integrations</h1>
      <p className="text-sm text-gray-700 mb-6">Add your provider keys to use your own accounts. Keys are encrypted at rest and only used for outbound requests on your behalf.</p>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {PROVIDERS.map((p) => (
          <div
            key={p}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-transparent transition-shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-gray-900 text-base">{p.charAt(0).toUpperCase() + p.slice(1)}</div>
                <div className="text-xs text-muted-foreground mt-1">{connected.has(p) ? "Connected" : "Not connected"}</div>
              </div>
              <div className="flex items-center">
                <span className={connected.has(p) ? 'inline-block h-2 w-2 rounded-full bg-emerald-500' : 'inline-block h-2 w-2 rounded-full bg-slate-300'} />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Input
                value={keys[p] || ""}
                onChange={(e) => setKeys((k) => ({ ...k, [p]: e.target.value }))}
                placeholder={getPlaceholder(p)}
                className="h-10 rounded-lg"
              />

              <div className="flex items-center gap-3">
                <Button size="sm" variant="default" onClick={() => handleSaveProvider(p)} disabled={savingProvider === p}>
                  {savingProvider === p ? 'Saving…' : 'Save'}
                </Button>
                {connected.has(p) && (
                  <Button size="sm" variant="outline" onClick={() => handleDeleteProvider(p)}>
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 border-t pt-4">
        <h2 className="text-sm font-medium text-gray-800">Storage & usage policy</h2>
        <p className="text-xs text-muted-foreground mt-2">Keys you provide are encrypted using a server-side encryption key and stored in the project's Supabase table. They are used only to make outbound calls to providers on your behalf. The raw keys are not logged. If no user key is available, the app will fall back to project-level environment keys where configured.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Saved integrations</h2>
        <ul className="mt-3 space-y-2">
          {list.length === 0 && <li className="text-sm text-muted-foreground">No integrations saved.</li>}
          {list.map((it) => (
            <li key={it.id} className="flex items-center justify-between border p-3 rounded bg-white">
              <div>
                <div className="font-medium">{it.provider}</div>
                <div className="text-xs text-muted-foreground">Added {new Date(it.created_at).toLocaleString()}</div>
              </div>
              <div>
                <button onClick={() => handleDeleteProvider(it.provider)} className="px-3 py-1 text-sm text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
