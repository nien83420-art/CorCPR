"use client"

import { useActionState, useState, useTransition, type ReactNode } from "react"
import { accountCopy } from "@/lib/accounts/copy"
import type { FormState } from "@/lib/accounts/auth-actions"
import { enrollTotp, verifyTotp } from "@/lib/accounts/mfa-actions"
import type { Language } from "@/lib/types"
import { accountPrimary, accountInput } from "./account-shell"

export function AccountForm({ action, language, children, success }: {
  action: (state: FormState, form: FormData) => Promise<FormState>
  language: Language
  success?: string
  children: (pending: boolean) => ReactNode
}) {
  const copy = accountCopy[language]
  const [state, submit, pending] = useActionState<FormState, FormData>(action, { status: "idle" })
  return <form action={submit} className="space-y-3">
    {children(pending)}
    {state.status === "error" && <p role="alert" className="text-sm text-red-800">{copy.error}</p>}
    {state.status === "saved" && <p role="status" className="text-sm text-zinc-700">{success ?? copy.managementSuccess}</p>}
  </form>
}

export function MfaForm({ language, factor }: { language: Language; factor?: string }) {
  const copy = accountCopy[language]
  const [enrollment, setEnrollment] = useState<Awaited<ReturnType<typeof enrollTotp>>>(null)
  const [error, setError] = useState(false)
  const [pending, start] = useTransition()
  const factorId = factor ?? enrollment?.id

  return <div className="space-y-3">
    <p className="max-w-xl text-zinc-700">{copy.mfaRequired}</p>
    {!factorId && <button className={accountPrimary} disabled={pending} onClick={() => start(async () => {
      setError(false)
      const setup = await enrollTotp().catch(() => null)
      setEnrollment(setup)
      setError(!setup)
    })}>{copy.mfaEnroll}</button>}
    {enrollment && <div className="rounded-xl border border-zinc-200 p-3">
      <img className="size-44" alt={copy.mfaEnroll} src={enrollment.qr} />
      <code className="break-all text-sm">{enrollment.secret}</code>
    </div>}
    {factorId && <form className="flex max-w-sm flex-wrap items-end gap-2" onSubmit={event => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const code = String(form.get("code"))
      start(async () => {
        setError(false)
        const result = await verifyTotp(factorId, code, language)
        if (result === false) setError(true)
      })
    }}>
      <label className="min-w-0 max-w-full">{copy.mfaCode}
        <input className={accountInput} name="code" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required />
      </label>
      <button className={accountPrimary} disabled={pending}>{copy.mfaVerify}</button>
    </form>}
    {error && <p role="alert" className="text-sm text-red-800">{copy.error}</p>}
  </div>
}
