import { NextResponse } from "next/server"

// Lightweight validation endpoint for provider API keys.
// For now: basic checks and provider-specific heuristics.

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { provider, apiKey } = body
    if (!provider || !apiKey) return NextResponse.json({ error: "provider and apiKey required" }, { status: 400 })

    // Simple heuristics
    if (provider === "browseract") {
      if (typeof apiKey === "string" && apiKey.startsWith("app-") && apiKey.length > 10) {
        return NextResponse.json({ ok: true })
      }
    }
    if (provider === "tavily") {
      if (typeof apiKey === "string" && apiKey.startsWith("tvly-") && apiKey.length > 8) {
        return NextResponse.json({ ok: true })
      }
    }

    // Fallback: basic non-empty check
    if (typeof apiKey === "string" && apiKey.trim().length > 8) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, detail: "Key failed lightweight validation" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
