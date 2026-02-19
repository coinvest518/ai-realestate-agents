import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { encrypt } from "@/lib/crypto"

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function getUserIdFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || ""
  const m = auth.match(/^Bearer\s+(.+)$/i)
  const token = m ? m[1] : null
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.id
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromAuthHeader(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { provider, apiKey, meta } = body
    if (!provider || !apiKey) return NextResponse.json({ error: "provider and apiKey required" }, { status: 400 })

    const encrypted = encrypt(String(apiKey))

    const { data, error } = await supabase.from("user_integrations").insert([{ user_id: userId, provider, encrypted_key: encrypted, meta }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: data?.[0]?.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromAuthHeader(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase.from("user_integrations").select("id,provider,meta,enabled,created_at").eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, integrations: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserIdFromAuthHeader(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const { error } = await supabase.from("user_integrations").delete().eq("id", id).eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
