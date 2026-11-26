"use server"

import { redirect, RedirectType } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { accountLanguage, languageQuery, passwordMinimum } from "./account"
import { accountClient, trainingWriter, verifiedAccount } from "./server"
import { authCallback } from "./auth-redirect"
import { bindGuestRecording, claimGuestRecording } from "./guest"
import { isUuid } from "./training"

export type FormState = { status: "idle" | "error" | "sent" | "saved" }
const errorState = { status: "error" } as const
const saved = { status: "saved" } as const

export async function authenticate(_state: FormState, form: FormData): Promise<FormState> {
  const client = await accountClient()
  if (!client) return errorState
  const language = accountLanguage(form.get("lang"))
  const email = String(form.get("email") ?? "").trim().toLowerCase()
  const password = String(form.get("password") ?? "")
  const mode = form.get("mode")
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128) return errorState
  const jar = await cookies()
  jar.set("corcpr_language", language, { path: "/", httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 })

  if (mode === "recover") {
    const redirectTo = authCallback("recovery")
    const { error } = await client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)
    if (error && error.status && error.status >= 500) return errorState
    if (!error) jar.set("corcpr_recovery_request", email, {
      path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 3600,
    })
    return { status: "sent" }
  }
  if (mode === "register") {
    if (!form.has("notice") || password.length < passwordMinimum) return errorState
    const emailRedirectTo = authCallback("email")
    const { error } = await client.auth.signUp({ email, password, options: emailRedirectTo ? { emailRedirectTo } : undefined })
    if (error) return errorState
    await bindGuestRecording(email)
    return { status: "sent" }
  }
  if (mode !== "login" || !password) return errorState
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user?.email_confirmed_at) return errorState
  await trainingWriter()?.rpc("record_pilot_event", { p_user: data.user.id, p_kind: "sign_in" })
  await bindGuestRecording(email)
  const claim = await claimGuestRecording(data.user)
  redirect(`/account${languageQuery(language)}&transfer=${claim}`)
}

export async function changeRecoveredPassword(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const jar = await cookies()
  const password = String(form.get("password") ?? "")
  if (!account || jar.get("corcpr_recovery")?.value !== account.user.id ||
      password.length < passwordMinimum || password.length > 128) return errorState
  const { error } = await account.client.auth.updateUser({ password })
  if (error) return errorState
  jar.delete("corcpr_recovery")
  await account.client.auth.signOut()
  redirect(`/auth${languageQuery(accountLanguage(form.get("lang")))}&changed=1`)
}

export async function logout(form: FormData) {
  const client = await accountClient()
  if (client) {
    const { error } = await client.auth.signOut({ scope: "local" })
    if (error) redirect(`/account${languageQuery(accountLanguage(form.get("lang")))}&error=1`)
  }
  redirect(`/${languageQuery(accountLanguage(form.get("lang")))}`, RedirectType.replace)
}

export async function updateProfile(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const name = String(form.get("name") ?? "").trim()
  if (!account || name.length > 80) return errorState
  const { error } = await account.client.rpc("update_account_profile", {
    p_name: name, p_share: form.has("share"),
  })
  if (error) return errorState
  revalidatePath("/account")
  return saved
}

export async function requestDeletion(_state: FormState, _form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  if (!account) return errorState
  const { error } = await account.client.rpc("request_account_deletion")
  if (error) return errorState
  revalidatePath("/account")
  return saved
}

export async function respondInvitation(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const id = form.get("id")
  const answer = form.get("answer")
  if (!account || !isUuid(id) || (answer !== "accept" && answer !== "decline")) return errorState
  const { error } = await account.client.rpc("respond_to_staff_invitation", { p_invitation: id, p_accept: answer === "accept" })
  if (error) return errorState
  revalidatePath("/account")
  return saved
}

export async function manageStaff(_state: FormState, form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  const operation = form.get("operation")
  const target = form.get("target")
  const student = form.get("student")
  if (!account || typeof operation !== "string" || !isUuid(target) ||
      (!["invite", "revoke_invite", "revoke_staff"].includes(operation) &&
       !(["assign", "unassign"].includes(operation) && isUuid(student)))) return errorState
  const { error } = await account.client.rpc("manage_staff_access", {
    p_operation: operation, p_target: target, p_student: isUuid(student) ? student : null,
  })
  if (error) return errorState
  revalidatePath("/staff")
  return saved
}

export async function retryGuestClaim(_state: FormState, _form: FormData): Promise<FormState> {
  const account = await verifiedAccount()
  if (!account || await claimGuestRecording(account.user) !== "saved") return errorState
  revalidatePath("/account")
  return saved
}
