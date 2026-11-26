import { strict as assert } from "node:assert"
import { randomUUID } from "node:crypto"
import { test } from "node:test"
import { setTimeout } from "node:timers/promises"
import { createClient } from "@supabase/supabase-js"

function local(name) {
  const url = new URL(process.env[name])
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1") throw new Error("Local-only Auth tests require loopback endpoints")
  return url
}

const authUrl = local("SUPABASE_URL")
const mailUrl = local("CORCPR_TEST_MAIL_URL")
const key = process.env.SUPABASE_PUBLISHABLE_KEY
const client = () => createClient(authUrl.href, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function tokenFromMail(email, type) {
  const search = new URL("/api/v1/search", mailUrl)
  search.searchParams.set("query", `to:${email}`)
  for (let attempt = 0; attempt < 35; attempt += 1) {
    const response = await fetch(search)
    assert(response.ok, "Mailpit must answer locally")
    const { messages = [] } = await response.json()
    for (const message of messages) {
      const response = await fetch(new URL(`/api/v1/message/${encodeURIComponent(message.ID)}`, mailUrl))
      assert(response.ok)
      const record = await response.json()
      const expression = new RegExp(`type=${type}(?:&amp;|&)token_hash=([^"'<\\s&]+)`)
      const token = (record.HTML ?? "").match(expression)?.[1]
      if (token) return token
    }
    await setTimeout(350)
  }
  throw new Error(`Local Mailpit did not receive a ${type} message`)
}

test("real Supabase Auth verifies signup, restores sessions, recovers passwords, and signs out", async () => {
  const email = `corcpr-auth-${randomUUID()}@example.test`
  const password = `Local-${randomUUID()}`
  const first = client()
  const signup = await first.auth.signUp({ email, password })
  assert.equal(signup.error, null)
  assert.equal(signup.data.session, null)
  assert((await first.auth.signInWithPassword({ email, password })).error, "unverified account must not enter")

  const inscription = await tokenFromMail(email, "email")
  const verified = await first.auth.verifyOtp({ type: "email", token_hash: inscription })
  assert.equal(verified.error, null)
  assert(verified.data.user?.email_confirmed_at)
  assert((await client().auth.verifyOtp({ type: "email", token_hash: inscription })).error, "token is single use")

  const login = await first.auth.signInWithPassword({ email, password })
  assert.equal(login.error, null)
  const second = client()
  const restored = await second.auth.setSession({
    access_token: login.data.session.access_token, refresh_token: login.data.session.refresh_token,
  })
  assert.equal(restored.error, null)
  assert.equal((await second.auth.getUser()).data.user.id, signup.data.user.id)
  assert((await client().auth.signInWithPassword({ email, password: "Invalid-Password-15" })).error)
  assert.equal((await second.auth.signOut({ scope: "local" })).error, null)
  assert.equal((await second.auth.getSession()).data.session, null)
  const refreshed = await client().auth.refreshSession({ refresh_token: login.data.session.refresh_token })
  assert(refreshed.error, "revoked refresh token must be rejected")

  assert.equal((await first.auth.resetPasswordForEmail(email)).error, null)
  const recovered = await second.auth.verifyOtp({ type: "recovery", token_hash: await tokenFromMail(email, "recovery") })
  assert.equal(recovered.error, null)
  const newPassword = `Local-${randomUUID()}`
  assert.equal((await second.auth.updateUser({ password: newPassword })).error, null)
  assert((await client().auth.signInWithPassword({ email, password })).error, "old password must be rejected")
  assert.equal((await client().auth.signInWithPassword({ email, password: newPassword })).error, null)
})
