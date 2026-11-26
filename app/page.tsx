import { CorCprApp } from "@/components/screens/corcpr-app"
import { accountLanguage } from "@/lib/accounts/account"
import { accountConfig, getAccountAccess, verifiedAccount } from "@/lib/accounts/server"

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams
  const account = await verifiedAccount()
  const access = account ? await getAccountAccess(account.client) : null
  return <CorCprApp initialLanguage={accountLanguage(lang)} configured={Boolean(accountConfig())}
    userId={account?.user.id ?? null} access={access} />
}
