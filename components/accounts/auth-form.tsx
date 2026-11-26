"use client"

import { useActionState } from "react"
import Link from "next/link"
import { authenticate, changeRecoveredPassword, type FormState } from "@/lib/accounts/auth-actions"
import { languageQuery, passwordMinimum } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import { accountInput, accountPrimary } from "./account-shell"
import type { Language } from "@/lib/types"

export function AuthForm({ language, mode, error, changed }: {
  language: Language
  mode: "login" | "register" | "recover" | "reset"
  error?: boolean
  changed?: boolean
}) {
  const copy = accountCopy[language]
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "reset" ? changeRecoveredPassword : authenticate, { status: "idle" },
  )
  const query = languageQuery(language)
  const link = "inline-flex min-h-11 items-center"
  return <div className="max-w-lg">
    {changed && <p className="mb-3 text-sm text-zinc-800" role="status">{copy.managementSuccess}</p>}
    <form action={action} className="space-y-4 rounded-xl border border-zinc-200 p-4 sm:p-5">
      <input type="hidden" name="lang" value={language} />
      <input type="hidden" name="mode" value={mode} />
      {mode !== "reset" && <label className="block font-medium">{copy.email}
        <input className={accountInput} type="email" name="email" autoComplete="email" maxLength={254} required />
      </label>}
      {mode !== "recover" && <label className="block font-medium">{copy.password}
        <input className={accountInput} type="password" name="password" required maxLength={128}
          autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : passwordMinimum} />
        {mode !== "login" && <small className="text-zinc-600">{copy.passwordRule}</small>}
      </label>}
      {mode === "register" && <>
        <p className="text-sm text-zinc-700">{copy.notice}</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" name="notice" required className="accent-red-700" />{copy.acknowledge}</label>
      </>}
      <button className={accountPrimary} disabled={pending}>{
        mode === "recover" ? copy.sendReset : mode === "register" ? copy.register : mode === "reset" ? copy.reset : copy.signIn
      }</button>
      {state.status === "sent" && <p role="status">{copy.verify}</p>}
      {(state.status === "error" || (error && state.status === "idle")) && <p role="alert" className="text-red-800">{copy.error}</p>}
    </form>
    {mode !== "reset" && <nav className="mt-3 flex flex-wrap gap-x-4 text-sm text-red-800 underline">
      {mode !== "login" && <Link className={link} href={`/auth${query}`}>{copy.signIn}</Link>}
      {mode !== "register" && <Link className={link} href={`/auth${query}&mode=register`}>{copy.register}</Link>}
      {mode !== "recover" && <Link className={link} href={`/auth${query}&mode=recover`}>{copy.forgot}</Link>}
    </nav>}
  </div>
}
