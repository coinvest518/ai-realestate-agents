import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export default async function MarketPage({}: { }) {
  const { data: listings } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(50)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Market — Latest Listings</h2>
      <div className="grid grid-cols-1 gap-4">
        {Array.isArray(listings) && listings.length ? listings.map((l: any) => (
          <div key={l.id} className="p-4 border rounded-md bg-white">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{l.address} {l.city} {l.zip}</div>
                <div className="text-sm text-muted-foreground">{l.beds} bd • {l.baths} ba • {l.sqft} sqft</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">${Number(l.price).toLocaleString()}</div>
                <a className="text-sm text-primary" href={l.listing_url} target="_blank" rel="noreferrer">View</a>
              </div>
            </div>
          </div>
        )) : <div className="text-muted-foreground">No listings yet</div>}
      </div>
    </div>
  )
}
