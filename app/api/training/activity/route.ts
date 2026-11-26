import type { NextRequest } from "next/server"
import { reportTrainingActivity } from "@/lib/accounts/actions"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 })
  if (!request.headers.get("content-type")?.startsWith("application/json") ||
      Number(request.headers.get("content-length")) > 512) return new Response(null, { status: 400 })
  try {
    if (new URL(origin).host !== request.headers.get("host")) return new Response(null, { status: 403 })
    const raw = await request.text()
    if (raw.length > 512) return new Response(null, { status: 400 })
    const { id, owner, seconds } = JSON.parse(raw)
    const ok = await reportTrainingActivity(id, owner, seconds, true)
    return new Response(null, { status: ok ? 204 : 403, headers: { "Cache-Control": "no-store" } })
  } catch {
    return new Response(null, { status: 400 })
  }
}
