// Use global fetch available in Node 18+. If you run on older Node, install node-fetch.

type Listing = any

// Simple per-provider fetcher with timeouts and max results to avoid overuse
async function withTimeout<T>(p: Promise<T>, ms = 5000): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms)
    p.then((v: any) => { clearTimeout(t); resolve(v) }).catch(() => { clearTimeout(t); resolve(null) })
  })
}

export async function apifyAdapter(apiKeyOrUrl: string, zip: string, radius = 30): Promise<Listing[]> {
  // If apiKeyOrUrl is a URL, call it; otherwise try to call Apify dataset API.
  try {
    if (!apiKeyOrUrl) return []
    if (apiKeyOrUrl.startsWith('http')) {
      const res = await withTimeout(fetch(`${apiKeyOrUrl}?zip=${encodeURIComponent(zip)}&radius=${encodeURIComponent(String(radius))}`), 8000)
      if (!res) return []
      const json = await (res as any).json()
      return Array.isArray(json) ? json : []
    }

    // If value appears to be a token or token|datasetId, call Apify dataset items endpoint.
    // Accept formats:
    // - "<token>|<datasetId>"
    // - token (uses APIFY_DEFAULT_DATASET env)
    const parts = apiKeyOrUrl.split('|')
    const token = parts[0] || process.env.APIFY_TOKEN || ''
    const dataset = parts[1] || process.env.APIFY_DEFAULT_DATASET || ''
    if (token && dataset) {
      const url = `https://api.apify.com/v2/datasets/${encodeURIComponent(dataset)}/items?clean=1&limit=100`
      const res = await withTimeout(fetch(url, { headers: { Authorization: `Bearer ${token}` } }), 10000)
      if (!res) return []
      const json = await (res as any).json()
      return Array.isArray(json) ? json : []
    }
  } catch (err) {
    console.warn('apifyAdapter error', err)
  }
  return []
}

export async function browserActAdapter(apiKeyOrUrl: string, zip: string, radius = 30): Promise<Listing[]> {
  try {
    if (!apiKeyOrUrl) return []
    if (apiKeyOrUrl.startsWith('http')) {
      const res = await withTimeout(fetch(`${apiKeyOrUrl}?zip=${encodeURIComponent(zip)}&radius=${encodeURIComponent(String(radius))}`), 8000)
      if (!res) return []
      const json = await (res as any).json()
      return Array.isArray(json) ? json : []
    }
  } catch (err) {
    console.warn('browserActAdapter error', err)
  }
  return []
}

export async function tavilyAdapter(apiKeyOrUrl: string, zip: string, radius = 30): Promise<Listing[]> {
  try {
    if (!apiKeyOrUrl) return []
    if (apiKeyOrUrl.startsWith('http')) {
      const res = await withTimeout(fetch(`${apiKeyOrUrl}?zip=${encodeURIComponent(zip)}&radius=${encodeURIComponent(String(radius))}`), 8000)
      if (!res) return []
      const json = await (res as any).json()
      return Array.isArray(json) ? json : []
    }
  } catch (err) {
    console.warn('tavilyAdapter error', err)
  }
  return []
}

// Aggregator: try providers in order, merge results, and stop early if enough data
export async function fetchFromProviders(cfg: Record<string, any>, zip: string, radius = 30, opts = { needed: 5 }) {
  const results: Listing[] = []
  const seen = new Set<string>()

  // order: apify, browseract, tavily
  const providers = ['apify', 'browseract', 'tavily']
  for (const p of providers) {
    const v = cfg[p]
    if (!v) continue
    let fetched: Listing[] = []
    try {
      if (p === 'apify') fetched = await apifyAdapter(String(v), zip, radius)
      if (p === 'browseract') fetched = await browserActAdapter(String(v), zip, radius)
      if (p === 'tavily') fetched = await tavilyAdapter(String(v), zip, radius)
    } catch (err) {
      console.warn('provider fetch failed', p, err)
      continue
    }

    for (const f of fetched) {
      const key = `${f.provider || p}:${f.provider_listing_id || (f.address+'|'+f.zip)}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({ provider: p, provider_listing_id: f.provider_listing_id || key, ...f })
    }

    if (results.length >= (opts.needed || 5)) break
  }

  return results
}

export default fetchFromProviders
