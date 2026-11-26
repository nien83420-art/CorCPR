import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AccountShell } from "@/components/accounts/account-shell"
import { AuthForm } from "@/components/accounts/auth-form"
import { accountLanguage, languageQuery } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import { verifiedAccount } from "@/lib/accounts/server"

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = accountLanguage((await searchParams).lang)
  const [account, jar] = await Promise.all([verifiedAccount(), cookies()])
  if (!account || jar.get("corcpr_recovery")?.value !== account.user.id) {
    redirect(`/auth${languageQuery(language)}&mode=recover&error=1`)
  }
  return <AccountShell language={language} title={accountCopy[language].reset}>
    <AuthForm language={language} mode="reset" />
  </AccountShell>
}
