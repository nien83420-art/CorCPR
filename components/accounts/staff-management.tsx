"use client"

import { useState } from "react"
import { manageStaff } from "@/lib/accounts/auth-actions"
import { accountCopy } from "@/lib/accounts/copy"
import { accountPrimary, accountInput } from "./account-shell"
import { AccountForm } from "./account-forms"
import type { Language } from "@/lib/types"

type Operation = "invite" | "assign" | "unassign" | "revoke_staff" | "revoke_invite"

export function StaffManagement({ language }: { language: Language }) {
  const copy = accountCopy[language]
  const [operation, setOperation] = useState<Operation>("invite")
  const assignment = operation === "assign" || operation === "unassign"
  const operations: Record<Operation, string> = {
    invite: copy.invite, assign: copy.assign, unassign: copy.unassign,
    revoke_staff: copy.revokeStaff, revoke_invite: copy.revokeInvite,
  }
  return <AccountForm action={manageStaff} language={language}>{pending => <>
    <p className="max-w-2xl text-sm text-zinc-700">{copy.adminHelp}</p>
    <label className="block max-w-xl">{copy.actions}
      <select className={accountInput} name="operation" value={operation}
        onChange={event => setOperation(event.currentTarget.value as Operation)}>
        {Object.entries(operations).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    <label className="block max-w-xl">{operation === "invite" ? copy.identifier : operation === "revoke_invite" ? copy.invitationId : copy.staffId}
      <input className={accountInput} name="target" autoComplete="off" maxLength={36} required />
    </label>
    {assignment && <label className="block max-w-xl">{copy.studentId}
      <input className={accountInput} name="student" autoComplete="off" maxLength={36} required />
    </label>}
    <button className={accountPrimary} disabled={pending}>{operations[operation]}</button>
  </>}</AccountForm>
}
