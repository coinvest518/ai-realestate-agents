import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { decrypt } from "@/lib/crypto"
import { sendEmail } from "@/lib/notify"
import fetchFromProviders from "@/lib/adapters"

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FETCH_SECRET = process.env.FETCH_SECRET || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

function mockListingsForZip(zip: string, radius = 30) {
  const now = new Date().toISOString()
  // generate 3 mock listings
  return Array.from({ length: 3 }).map((_, i) => {
    const id = `mock-${zip}-${randomId()}-${i}`
    const price = 150000 + Math.floor(Math.random() * 200000)
    return {
      provider: 'mock',
      provider_listing_id: id,
      address: `${100 + i} Mock St, ${zip}`,
      city: 'Albany',
      zip,
      state: 'NY',
      lat: 42.6526 + Math.random() * 0.02,
      lng: -73.7562 + Math.random() * 0.02,
      price,
      beds: 2 + (i % 3),
      baths: 1 + (i % 2),
      sqft: 800 + i * 200,
      listing_url: `https://example.com/listing/${id}`,
      status: 'active',
      price_history: [{ price, at: now }],
      raw: { mock: true, generated_at: now }
    }
  })
}

function parseProjectIntegrations() {
  const raw = process.env.PROJECT_INTEGRATIONS || "{}"
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Invalid PROJECT_INTEGRATIONS JSON')
    return {}
  }
}

async function fetchFromProjectIntegrations(zip: string, radius = 30) {
  // PROJECT_INTEGRATIONS can be either:
  // { "apify": "https://my-adapter.example.com/listings" }
  // or { "browseract": "API_KEY_STRING" }
  const cfg = parseProjectIntegrations()
  const out: any[] = []
  for (const [provider, v] of Object.entries(cfg)) {
    try {
      // if value is a string URL, call it and expect JSON array of provider raw listings
      if (typeof v === 'string' && v.startsWith('http')) {
        const url = `${v}?zip=${encodeURIComponent(zip)}&radius=${encodeURIComponent(String(radius))}`
        const res = await fetch(url, { method: 'GET' })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            for (const item of data) out.push({ provider, ...item })
          }
        }
      }
      // TODO: support provider-specific SDKs (BrowserAct / Tavily / Apify)
    } catch (err) {
      console.warn('fetch integration failed', provider, err)
    }
  }
  return out
}

async function upsertListing(listing: any) {
  // try to find existing by provider+provider_listing_id
  const { data: existing, error: selErr } = await supabase
    .from('listings')
    .select('id,price,price_history')
    .eq('provider', listing.provider)
    .eq('provider_listing_id', listing.provider_listing_id)
    .limit(1)
    .maybeSingle()

  if (selErr) {
    console.error('select error', selErr)
  }

  if (existing && existing.id) {
    // update last_seen_at, and append price_history if price changed
    const updates: any = { last_seen_at: new Date().toISOString(), raw: listing.raw }
    if (Number(existing.price) !== Number(listing.price)) {
      const newHistory = (existing.price_history || []).concat([{ price: listing.price, at: new Date().toISOString() }])
      updates.price = listing.price
      updates.price_history = newHistory
    }
    await supabase.from('listings').update(updates).eq('id', existing.id)
    // if price changed, return event info
    if (updates.price !== undefined) {
      return { id: existing.id, event: 'price_drop', oldPrice: Number(existing.price), newPrice: Number(updates.price) }
    }
    return { id: existing.id }
  } else {
    // insert
    const { data: ins, error: insErr } = await supabase.from('listings').insert([{
      provider: listing.provider,
      provider_listing_id: listing.provider_listing_id,
      address: listing.address,
      city: listing.city,
      zip: listing.zip,
      state: listing.state,
      lat: listing.lat,
      lng: listing.lng,
      price: listing.price,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      listing_url: listing.listing_url,
      status: listing.status,
      price_history: listing.price_history || [{ price: listing.price, at: new Date().toISOString() }],
      raw: listing.raw || {}
    }])
    if (insErr) console.error('insert error', insErr)
    const createdId = ins?.[0]?.id
    return { id: createdId, event: 'new' }
  }
}

export async function POST(req: Request) {
  try {
    const providedSecret = req.headers.get('x-fetch-secret') || ''
    if (!FETCH_SECRET || providedSecret !== FETCH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const zip = (body.zip as string) || '12201'
    const radius = Number(body.radius_miles || 30)
    // Combine project-configured integrations (adapter URLs/keys) and mock fallback
    const projectCfg = parseProjectIntegrations()
    let projectListings = await fetchFromProjectIntegrations(zip, radius)
    // try provider aggregator which uses apify/browseract/tavily adapters
    const aggregated = await fetchFromProviders(projectCfg, zip, radius, { needed: 8 })
    if (aggregated && aggregated.length) projectListings = projectListings.concat(aggregated)
    const mock = mockListingsForZip(zip, radius)
    // prefer project listings if any, otherwise mock
    const listings = projectListings.length ? projectListings : mock

    const upserted: any[] = []
    for (const l of listings) {
      const result = await upsertListing(l)
      upserted.push({ provider_listing_id: l.provider_listing_id, result })

      // If event created, find matching alerts and create alert_events
      if (result && result.event) {
        try {
          // find alerts for this zip
          const { data: alerts, error: aErr } = await supabase.from('alerts').select('id,user_id,price_drop_pct,notify_via').eq('zip', l.zip).eq('active', true)
          if (aErr) console.warn('alerts lookup failed', aErr)
          for (const alert of alerts || []) {
            let createEvent = false
            if (result.event === 'new') createEvent = true
            if (result.event === 'price_drop') {
              const oldP = Number(result.oldPrice || 0)
              const newP = Number(result.newPrice || 0)
              const dropPct = oldP > 0 ? ((oldP - newP) / oldP) * 100 : 0
              if ((alert.price_drop_pct || 0) <= dropPct) createEvent = true
            }
            if (createEvent) {
              const { data: ev, error: evErr } = await supabase.from('alert_events').insert([{
                alert_id: alert.id,
                listing_id: result.id,
                event_type: result.event === 'new' ? 'new_listing' : 'price_drop',
                event_payload: l
              }])
              if (evErr) console.warn('failed to create alert_event', evErr)
              else {
                const eventId = ev?.[0]?.id
                // send email if requested
                if (alert.notify_via === 'email') {
                  try {
                    const { data: profile } = await supabase.from('user_profiles').select('email,full_name').eq('id', alert.user_id).maybeSingle()
                    const to = profile?.email
                    if (to) {
                      await sendEmail(to, 'Listing alert', `An event matched your alert (${alert.id}): ${result.event} for ${l.address} ${l.zip}`)
                      await supabase.from('alert_events').update({ notified: true }).eq('id', eventId)
                    }
                  } catch (notifyErr) {
                    console.warn('notify failed', notifyErr)
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('alert processing failed', err)
        }
      }
    }

    return NextResponse.json({ ok: true, count: upserted.length, upserted })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
