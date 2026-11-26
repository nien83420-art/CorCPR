import { AccountShell } from "@/components/accounts/account-shell"
import { accountLanguage } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const language = accountLanguage((await searchParams).lang)
  const copy = accountCopy[language]
  return <AccountShell language={language} title={copy.privacy}>
    <div className="max-w-2xl space-y-4 leading-relaxed">
      <p>{copy.notice}</p>
      <p>{copy.staffScope}</p>
      <p>{copy.limitations}</p>
      <p>{copy.deleteNote}</p>
    </div>
  </AccountShell>
}
