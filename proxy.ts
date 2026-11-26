import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { accountConfig } from "@/lib/accounts/server"

export async function proxy(request: NextRequest) {
  const config = accountConfig()
  if (!config) return NextResponse.next()
  let response = NextResponse.next({ request })
  const client = createServerClient(config.url, config.key, {
    cookieOptions: { sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(updates, headers) {
        for (const { name, value } of updates) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of updates) response.cookies.set(name, value, options)
        for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value)
      },
    },
  })
  await client.auth.getClaims()
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export const config = { matcher: ["/", "/account/:path*", "/staff/:path*", "/auth", "/auth/reset"] }
