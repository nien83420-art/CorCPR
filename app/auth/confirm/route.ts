import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { accountClient } from "@/lib/accounts/server"
import { claimGuestRecording } from "@/lib/accounts/guest"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token_hash")
  const code = request.nextUrl.searchParams.get("code")
  const type = request.nextUrl.searchParams.get("type")
  const jar = await cookies()
  const language = jar.get("corcpr_language")?.value
  const query = new URLSearchParams()
  if (language === "ru" || language === "kk") query.set("lang", language)
  const go = (path: string) => new Response(null, { status: 303, headers: {
    Location: `${path}${query.size ? `?${query}` : ""}`,
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  } })

  const client = await accountClient()
  const tokenFlow = Boolean(token && token.length < 256 && (type === "email" || type === "recovery"))
  const codeFlow = Boolean(!token && code && code.length < 256 && (type === "email" || type === "recovery" || type === null))
  if (client && (tokenFlow || codeFlow)) {
    const { data, error } = tokenFlow
      ? await client.auth.verifyOtp({ type: type === "recovery" ? "recovery" : "email", token_hash: token! })
      : await client.auth.exchangeCodeForSession(code!)
    if (!error && data.user?.email_confirmed_at) {
      if (type === "recovery") {
        const requested = jar.get("corcpr_recovery_request")?.value
        if (!tokenFlow && (!requested || requested !== data.user.email?.toLowerCase())) {
          await client.auth.signOut({ scope: "local" })
          query.set("error", "1")
          return go("/auth")
        }
        jar.delete("corcpr_recovery_request")
        jar.set("corcpr_recovery", data.user.id, { path: "/", httpOnly: true, sameSite: "lax",
          secure: process.env.NODE_ENV === "production", maxAge: 900 })
        return go("/auth/reset")
      }
      query.set("transfer", await claimGuestRecording(data.user))
      return go("/account")
    }
  }
  query.set("error", "1")
  return go("/auth")
}
