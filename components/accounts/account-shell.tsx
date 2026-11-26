import Link from "next/link"
import type { ReactNode } from "react"
import { languageQuery } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import type { Language } from "@/lib/types"

export const accountPrimary = "inline-flex min-h-11 max-w-full items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-center font-semibold text-white hover:bg-red-800 disabled:opacity-50"
export const accountSecondary = "inline-flex min-h-11 max-w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
export const accountInput = "mt-1 block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-950"

export function AccountShell({ language, title, children }: { language: Language; title: string; children: ReactNode }) {
  const copy = accountCopy[language]
  return <main lang={language} className="min-h-page page-gutter bg-white text-zinc-950 [color-scheme:light]">
    <div className="mx-auto max-w-6xl pb-12">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-zinc-200 py-3 sm:py-5">
        <Link href={`/${languageQuery(language)}`} className="inline-flex min-h-11 items-center text-xl font-bold text-red-800">CorCpr</Link>
        <Link href={`/privacy${languageQuery(language)}`} className="inline-flex min-h-11 min-w-0 items-center text-sm text-zinc-700 underline">{copy.privacy}</Link>
      </header>
      <h1 className="my-6 text-pretty text-3xl font-semibold sm:my-8 sm:text-4xl">{title}</h1>
      {children}
    </div>
  </main>
}
