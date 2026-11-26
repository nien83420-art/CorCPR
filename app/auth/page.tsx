import { redirect } from "next/navigation"
import { AccountShell } from "@/components/accounts/account-shell"
import { AuthForm } from "@/components/accounts/auth-form"
import { accountLanguage, languageQuery } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import { accountConfig, verifiedAccount } from "@/lib/accounts/server"

export default async function AuthPage({ searchParams }: {
  searchParams: Promise<{ lang?: string; mode?: string; error?: string; changed?: string }>
}) {
  const params = await searchParams
  const language = accountLanguage(params.lang)
  const copy = accountCopy[language]
  if (await verifiedAccount()) redirect(`/account${languageQuery(language)}`)
  const mode = params.mode === "register" || params.mode === "recover" ? params.mode : "login"
  const title = mode === "register" ? copy.register : mode === "recover" ? copy.forgot : copy.signIn
  return <AccountShell language={language} title={title}>
    {accountConfig() ? <AuthForm key={mode} language={language} mode={mode} error={params.error === "1"} changed={params.changed === "1"} />
      : <p>{copy.unavailable}</p>}
  </AccountShell>
}
