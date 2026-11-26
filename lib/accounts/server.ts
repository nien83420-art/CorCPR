import "server-only"

import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { AccountAccess } from "./account"

export function accountConfig() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key || !process.env.SUPABASE_SECRET_KEY || guestKey()?.length !== 32) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname))) return null
  return { url, key }
}

export function guestKey() {
  const key = process.env.CORCPR_GUEST_KEY
  return key ? Buffer.from(key, "base64") : null
}

export async function accountClient() {
  const config = accountConfig()
  if (!config) return null
  const jar = await cookies()
  return createServerClient(config.url, config.key, {
    cookieOptions: { sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (updates) => {
        try {
          for (const { name, value, options } of updates) jar.set(name, value, options)
        } catch {
          // Server Components consume refreshed cookies from proxy.ts.
        }
      },
    },
  })
}

export function trainingWriter() {
  const config = accountConfig()
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!config || !secret) return null
  return createClient(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function verifiedAccount() {
  const client = await accountClient()
  if (!client) return null
  const { data: { user } } = await client.auth.getUser()
  return user?.email_confirmed_at ? { client, user } : null
}

export async function getAccountAccess(client: NonNullable<Awaited<ReturnType<typeof accountClient>>>) {
  const { data, error } = await client.rpc("account_access")
  if (error || !data || !["student", "staff", "admin"].includes(data.role) ||
      typeof data.canSkip !== "boolean" || typeof data.mfaRequired !== "boolean" ||
      typeof data.courseCompleted !== "boolean") return null
  const access = data as AccountAccess
  if (access.role === "student" || access.mfaRequired) return access
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel()
  return assurance.data?.currentLevel === "aal2" ? access : { ...access, mfaRequired: true, canSkip: false }
}
