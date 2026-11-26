import { strict as assert } from "node:assert"
import { spawnSync } from "node:child_process"
import { createHmac, randomUUID } from "node:crypto"
import { test } from "node:test"
import { setTimeout } from "node:timers/promises"
import { createClient } from "@supabase/supabase-js"

const url = new URL(process.env.SUPABASE_URL)
const database = new URL(process.env.CORCPR_PILOT_ISOLATED_DB_URL)
if (url.protocol !== "http:" || database.protocol !== "postgresql:" ||
    url.hostname !== "127.0.0.1" || database.hostname !== "127.0.0.1") {
  throw new Error("Pilot Auth tests require an isolated loopback stack")
}

const options = { auth: { autoRefreshToken: false, persistSession: false } }
const owner = createClient(url.href, process.env.SUPABASE_SECRET_KEY, options)
const studentClient = () => createClient(url.href, process.env.SUPABASE_PUBLISHABLE_KEY, options)

function succeeded(result) {
  assert(!result.error, `Local operation failed (${result.error?.code ?? "unknown"})`)
  return result.data
}

async function account() {
  const email = `pilot-${randomUUID()}@example.test`
  const password = `Test-${randomUUID()}`
  const { user } = succeeded(await owner.auth.admin.createUser({ email, password, email_confirm: true }))
  const client = studentClient()
  succeeded(await client.auth.signInWithPassword({ email, password }))
  return { id: user.id, client }
}

function seed(sql) {
  const result = spawnSync(process.env.CORCPR_PSQL ?? "psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-w"], {
    input: sql, encoding: "utf8", env: {
      PGHOST: database.hostname, PGPORT: database.port, PGDATABASE: database.pathname.slice(1),
      PGUSER: decodeURIComponent(database.username), PGPASSWORD: decodeURIComponent(database.password),
    },
  })
  assert.equal(result.status, 0, "Could not seed the isolated test database")
}

function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const bits = [...secret.replace(/=+$/, "")].map(letter => alphabet.indexOf(letter).toString(2).padStart(5, "0")).join("")
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map(byte => parseInt(byte, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)))
  const digest = createHmac("sha1", key).update(counter).digest()
  const offset = digest.at(-1) & 15
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0")
}

async function verifyMfa(client) {
  const factor = succeeded(await client.auth.mfa.enroll({ factorType: "totp" }))
  if (Date.now() % 30_000 > 28_000) await setTimeout(2_050)
  succeeded(await client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) }))
  assert.equal(succeeded(await client.auth.mfa.getAuthenticatorAssuranceLevel()).currentLevel, "aal2")
}

test("local Auth MFA unlocks only assigned, consenting learners and their saved history", async () => {
  const admin = await account()
  const staff = await account()
  const learner = await account()
  const other = await account()
  const session = randomUUID()
  seed(`insert into public.account_roles (user_id, role) values ('${admin.id}', 'admin');
    insert into public.training_sessions (id, user_id, training_type, status, ended_at, active_seconds)
      values ('${session}', '${learner.id}', 'course', 'completed', now(), 120);`)

  const invite = { p_operation: "invite", p_target: staff.id }
  assert.equal((await admin.client.rpc("manage_staff_access", invite)).error?.code, "42501")
  assert.equal((await learner.client.rpc("manage_staff_access", invite)).error?.code, "42501")
  await verifyMfa(admin.client)
  succeeded(await admin.client.rpc("manage_staff_access", invite))
  const invitation = succeeded(await staff.client.from("staff_invitations").select("id").eq("status", "pending").single())
  succeeded(await staff.client.rpc("respond_to_staff_invitation", { p_invitation: invitation.id, p_accept: true }))
  for (const participant of [learner, other]) {
    succeeded(await participant.client.rpc("update_account_profile", { p_name: "Synthetic learner", p_share: true }))
    succeeded(await participant.client.rpc("set_pilot_enrollment", { p_join: true }))
  }
  succeeded(await admin.client.rpc("manage_staff_access", { p_operation: "assign", p_target: staff.id, p_student: learner.id }))

  assert.equal(succeeded(await staff.client.rpc("account_access")).mfaRequired, true)
  assert.deepEqual(succeeded(await staff.client.rpc("pilot_roster")), [])
  assert.deepEqual(succeeded(await staff.client.from("training_sessions").select("id").eq("id", session)), [])
  assert.deepEqual(succeeded(await other.client.rpc("pilot_roster")), [])
  await verifyMfa(staff.client)
  assert.equal(succeeded(await staff.client.rpc("account_access")).mfaRequired, false)
  assert.deepEqual(succeeded(await staff.client.rpc("pilot_roster")).map(row => row.user_id), [learner.id])
  assert.deepEqual(succeeded(await staff.client.from("training_sessions").select("id").eq("id", session)), [{ id: session }])
  assert.equal(succeeded(await staff.client.rpc("pilot_progress", { p_user: other.id })), null)

  succeeded(await learner.client.rpc("set_pilot_enrollment", { p_join: false }))
  assert.deepEqual(succeeded(await staff.client.rpc("pilot_roster")), [])
})
