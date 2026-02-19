import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function GET(req: Request) {
  try {
    // Return the latest listings, limited
    const { searchParams } = new URL(req.url)
    const zip = searchParams.get('zip')
    const limit = Number(searchParams.get('limit') || 50)

    let q = supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(limit)
    if (zip) q = q.eq('zip', zip)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, listings: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
