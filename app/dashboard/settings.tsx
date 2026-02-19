import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  const [sources, setSources] = useState({ zillow: true, realtor: true, redfin: true })
  const [datasetId, setDatasetId] = useState('')
  const [useDatasetForRealtor, setUseDatasetForRealtor] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userApiKeys, setUserApiKeys] = useState<{ browseract?: string; nebius?: string; brightdata?: string }>({})
  const [triggerResult, setTriggerResult] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setSources(data.sources || sources)
          setDatasetId(data.bright_data_realtor_dataset_id || '')
          setUseDatasetForRealtor(!!data.use_dataset_for_realtor)
        }
      } catch (e) {
        // ignore
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources,
          bright_data_realtor_dataset_id: datasetId || null,
          use_dataset_for_realtor: useDatasetForRealtor,
          user_api_keys: userApiKeys,
        }),
      })
      // small UX feedback could be added
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Sources</h2>
        <p className="text-xs text-muted-foreground mt-1">Enable or disable built-in scrapers shown in the dashboard.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Zillow</div>
              <div className="text-xs text-muted-foreground">Property listings from Zillow</div>
            </div>
            <Switch checked={!!sources.zillow} onCheckedChange={(v) => setSources((s) => ({ ...s, zillow: !!v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Realtor.com</div>
              <div className="text-xs text-muted-foreground">Use Bright Data dataset for Realtor (optional)</div>
            </div>
            <Switch checked={!!sources.realtor} onCheckedChange={(v) => setSources((s) => ({ ...s, realtor: !!v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Redfin</div>
              <div className="text-xs text-muted-foreground">Property listings from Redfin</div>
            </div>
            <Switch checked={!!sources.redfin} onCheckedChange={(v) => setSources((s) => ({ ...s, redfin: !!v }))} />
          </div>
        </div>

        {/* User API keys (stored server-side in-memory; Supabase persistence attempted if configured) */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium">User API keys</h3>
          <p className="text-xs text-muted-foreground mt-1">Optional — let users provide their own API keys (kept in-memory for now). Use Supabase for persistent storage if configured.</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="BrowserAct API key" value={userApiKeys.browseract || ''} onChange={(e) => setUserApiKeys((k) => ({ ...k, browseract: e.target.value }))} />
            <Input placeholder="Nebius API key" value={userApiKeys.nebius || ''} onChange={(e) => setUserApiKeys((k) => ({ ...k, nebius: e.target.value }))} />
            <Input placeholder="Bright Data API token" value={userApiKeys.brightdata || ''} onChange={(e) => setUserApiKeys((k) => ({ ...k, brightdata: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Bright Data Marketplace (Realtor)</h2>
        <p className="text-xs text-muted-foreground mt-1">Optional — enter the dataset id to use Bright Data’s Realtor marketplace dataset. Toggle to use dataset instead of agent scraping for Realtor URLs.</p>
        <div className="mt-4 flex gap-3 items-center">
          <Input value={datasetId} onChange={(e) => setDatasetId(e.target.value)} placeholder="gd_... (dataset id)" />
          <div className="flex items-center gap-2">
            <div className="text-sm">Use dataset</div>
            <Switch checked={useDatasetForRealtor} onCheckedChange={(v) => setUseDatasetForRealtor(!!v)} />
          </div>
          <Button onClick={async () => {
            if (!datasetId) return alert('Add dataset id first')
            setTriggerResult(null)
            try {
              const res = await fetch('/api/datasets/trigger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataset_id: datasetId, inputs: [{ url: 'https://www.realtor.com/' }], params: { type: 'discover_new', discover_by: 'extended_filter' } }) })
              const data = await res.json()
              setTriggerResult(data)
            } catch (e) {
              setTriggerResult({ error: String(e) })
            }
          }}>Use dataset now</Button>
        </div>
        {triggerResult && (
          <pre className="mt-3 p-3 rounded border bg-muted text-xs overflow-auto max-h-48">{JSON.stringify(triggerResult, null, 2)}</pre>
        )}
      </section>

      <div className="mt-6">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </main>
  )
}