"use server"

import { redirect } from "next/navigation"
import { accountLanguage, languageQuery } from "./account"
import { verifiedAccount, getAccountAccess } from "./server"
import { isUuid } from "./training"

export async function enrollTotp() {
  const account = await verifiedAccount()
  if (!account || !(await getAccountAccess(account.client))?.mfaRequired) return null
  const { data: factors } = await account.client.auth.mfa.listFactors()
  if (!factors || factors.totp.some(factor => factor.status === "verified")) return null
  for (const factor of factors.all) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      const { error } = await account.client.auth.mfa.unenroll({ factorId: factor.id })
      if (error) return null
    }
  }
  const { data, error } = await account.client.auth.mfa.enroll({ factorType: "totp", issuer: "CorCpr", friendlyName: "CorCpr" })
  return !error && data ? { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret } : null
}

export async function verifyTotp(factorId: string, code: string, language: string) {
  const account = await verifiedAccount()
  if (!account || !isUuid(factorId) || !/^\d{6}$/.test(code) ||
      !(await getAccountAccess(account.client))?.mfaRequired) return false
  const { error } = await account.client.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) return false
  redirect(`/staff${languageQuery(accountLanguage(language))}`)
}
