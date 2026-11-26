"use server"

import { revalidatePath } from "next/cache"
import { trainingWriter, verifiedAccount } from "./server"
import { isUuid } from "./training"
import type { FormState } from "./auth-actions"

const error: FormState = { status: "error" }
const saved: FormState = { status: "saved" }

export async function recordPilotVisit() {
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (account && writer) await writer.rpc("record_pilot_event", { p_user: account.user.id, p_kind: "visit" })
}

export async function recordPilotRunEvent(session: string, owner: string, kind: string, module?: number) {
  if (!isUuid(session) || !["module_started", "module_completed", "camera_started"].includes(kind) ||
      (kind === "camera_started" ? module !== undefined : !Number.isInteger(module) || module! < 1 || module! > 7)) return false
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (!account || account.user.id !== owner || !writer) return false
  const result = await writer.rpc("record_pilot_event", {
    p_user: owner, p_kind: kind, p_session: session, p_module: module,
  })
  return !result.error && result.data === true
}

export async function enrollInPilot(_state: FormState, form: FormData): Promise<FormState> {
  const choice = form.get("choice")
  const account = await verifiedAccount()
  if (!account || (choice !== "leave" && (choice !== "join" || form.get("notice") !== "on"))) return error
  const { error: failure } = await account.client.rpc("set_pilot_enrollment", { p_join: choice === "join" })
  if (failure) return error
  revalidatePath("/account")
  return saved
}

export async function savePilotPreferences(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  if (!account) return error
  const frequency = form.get("frequency")
  const activity = form.get("activity")
  const done = form.get("done")
  const args = typeof frequency === "string" && ["0","3","7","14","30"].includes(frequency)
    ? { p_days: Number(frequency) }
    : typeof activity === "string" && ["course","knowledge","camera","review"].includes(activity) &&
      (done === "yes" || done === "no") ? { p_activity: activity, p_done: done === "yes" } : null
  if (!args) return error
  const { error: failure } = await account.client.rpc("set_pilot_preferences", args)
  if (failure) return error
  revalidatePath("/account")
  return saved
}

export async function submitPilotSupport(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const id = form.get("id")
  const kind = form.get("kind")
  const message = String(form.get("message") ?? "").trim()
  if (!account || !isUuid(id) || typeof kind !== "string" || !["problem","help","feedback"].includes(kind)
      || message.length < 5 || message.length > 2000) return error
  const result = await account.client.rpc("submit_pilot_support", { p_id: id, p_kind: kind, p_message: message })
  if (result.error || result.data !== true) return error
  revalidatePath("/account")
  return saved
}

export async function updatePilotSupport(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const id = form.get("id")
  const status = form.get("status")
  if (!account || !isUuid(id) || typeof status !== "string" || !["open","reviewing","resolved"].includes(status)) return error
  const result = await account.client.rpc("update_pilot_support", { p_id: id, p_status: status })
  if (result.error || result.data !== true) return error
  revalidatePath("/staff")
  return saved
}
