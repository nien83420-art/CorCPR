"use client"

import { useActionState, useRef } from "react"
import type { ReactNode } from "react"
import type { FormState } from "@/lib/accounts/auth-actions"
import { accountPrimary } from "./account-shell"

type Action = (state: FormState, form: FormData) => Promise<FormState>

export function PilotForm({ submit, children, label, success, failure, requestId = false }: {
  submit: Action; children: ReactNode; label: string; success: string; failure: string; requestId?: boolean
}) {
  const id = useRef<string | null>(null)
  const [state, action, pending] = useActionState<FormState, FormData>(async (previous, form) => {
    if (requestId) {
      id.current ??= crypto.randomUUID()
      form.set("id", id.current)
    }
    const result = await submit(previous, form)
    if (result.status === "saved") id.current = null
    return result
  }, { status: "idle" })
  return <form action={action} className="space-y-2">
    {children}
    <button className={accountPrimary} disabled={pending}>{label}</button>
    {state.status === "error" && <p role="alert" className="text-sm text-red-800">{failure}</p>}
    {state.status === "saved" && <p role="status" className="text-sm text-zinc-700">{success}</p>}
  </form>
}
