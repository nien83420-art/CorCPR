"use client"

import { requestDeletion, respondInvitation, retryGuestClaim, updateProfile } from "@/lib/accounts/auth-actions"
import { accountCopy } from "@/lib/accounts/copy"
import { accountInput, accountPrimary, accountSecondary } from "./account-shell"
import { AccountForm } from "./account-forms"
import type { Language } from "@/lib/types"

export function ProfileForm({ language, name, share }: { language: Language; name: string; share: boolean }) {
  const copy = accountCopy[language]
  return <AccountForm action={updateProfile} language={language}>{pending => <>
    <label className="block max-w-md font-medium">{copy.name}
      <input className={accountInput} name="name" defaultValue={name} maxLength={80} autoComplete="name" />
    </label>
    <label className="flex max-w-lg gap-2"><input type="checkbox" name="share" defaultChecked={share} className="accent-red-700" />{copy.share}</label>
    <button className={accountPrimary} disabled={pending}>{copy.saveProfile}</button>
  </>}</AccountForm>
}

export function InviteResponse({ language, id }: { language: Language; id: string }) {
  const copy = accountCopy[language]
  return <AccountForm action={respondInvitation} language={language}>{pending => <>
    <p>{copy.invited}</p>
    <input type="hidden" name="id" value={id} />
    <div className="flex flex-wrap gap-2">
      <button name="answer" value="accept" className={accountPrimary} disabled={pending}>{copy.accept}</button>
      <button name="answer" value="decline" className={accountSecondary} disabled={pending}>{copy.decline}</button>
    </div>
  </>}</AccountForm>
}

export function DeletionForm({ language, requested }: { language: Language; requested: boolean }) {
  const copy = accountCopy[language]
  return <div className="space-y-3">
    <p className="text-sm text-zinc-700">{copy.deleteNote}</p>
    {requested ? <p>{copy.deleteRequested}</p> : <AccountForm action={requestDeletion} language={language} success={copy.deleteRequested}>
      {pending => <button className={accountSecondary} disabled={pending}>{copy.deleteRequest}</button>}
    </AccountForm>}
  </div>
}

export function RetryTransfer({ language }: { language: Language }) {
  const copy = accountCopy[language]
  return <AccountForm action={retryGuestClaim} language={language} success={copy.saved}>{pending => <>
    <p>{copy.pendingGuest}</p>
    <button className={accountSecondary} disabled={pending}>{copy.retry}</button>
  </>}</AccountForm>
}
