import { ArrowRight, Video, HeartPulse } from "lucide-react"
import type { ReactNode } from "react"
import { ScrollReveal } from "@/components/learning/scroll-reveal"
import { scenarioCopy } from "@/lib/learning-scenarios"
import { Button } from "@/components/ui/button"
import { LANGUAGES, type Translations } from "@/lib/i18n"
import type { CourseCopy } from "@/lib/learning-content"
import type { Language } from "@/lib/types"

interface WelcomeScreenProps {
  t: Translations
  copy: CourseCopy
  language: Language
  onLanguage: (language: Language) => void
  onLearn: () => void
  busy?: boolean
  startLabel?: string
  accountControl?: ReactNode
  afterActions?: ReactNode
}

export function WelcomeScreen({ t, copy, language, onLanguage, onLearn, busy, startLabel, accountControl, afterActions }: WelcomeScreenProps) {
  return (
    <main lang={language} className="min-h-page page-gutter bg-white text-zinc-950 [color-scheme:light]">
      <div className="mx-auto max-w-5xl pb-10">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-200 py-3 sm:py-5">
          <button type="button" className="flex min-h-11 items-center gap-2 rounded text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={scenarioCopy[language].home} onClick={() => window.scrollTo(0, 0)}><HeartPulse aria-hidden className="text-red-600" />CorCpr</button>
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto sm:justify-end">
            <div role="group" aria-label={t.language.title} className="flex max-w-full flex-wrap gap-1">
              {LANGUAGES.map(({ code, native }) => (
                <Button key={code} lang={code} variant="ghost"
                  className="text-zinc-900 hover:bg-zinc-100 hover:text-zinc-950 aria-pressed:bg-red-50 aria-pressed:text-red-800"
                  aria-pressed={language === code} onClick={() => onLanguage(code)}>{native}</Button>
              ))}
            </div>
            {accountControl}
          </div>
        </header>
        <div className="grid gap-7 py-8 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <section className="min-w-0">
            <ScrollReveal><h1 className="text-balance text-[clamp(1.875rem,1.25rem+3vw,3rem)] leading-tight font-semibold tracking-tight">{copy.title}</h1></ScrollReveal>
            <ScrollReveal delay={150}><p className="mt-4 max-w-prose leading-relaxed sm:mt-5 sm:text-lg">{copy.intro}</p></ScrollReveal>
            <ScrollReveal delay={300}><p className="my-5 leading-relaxed text-zinc-600">{copy.how}</p></ScrollReveal>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="min-h-11 bg-red-700 px-4 text-base text-white hover:bg-red-800" disabled={busy} onClick={onLearn}>{startLabel ?? copy.start}<ArrowRight aria-hidden /></Button>
              {afterActions}
            </div>
          </section>
          <ScrollReveal delay={150} className="rounded-2xl bg-zinc-100 p-4 sm:p-6">
            <h2 className="mb-3 text-xl font-semibold">{copy.syllabus}</h2>
            <ol className="divide-y divide-zinc-200">
              {copy.topics.map((topic, index) => (
                <li key={topic} className="flex items-baseline gap-3 py-3 sm:gap-4 sm:py-4">
                  <span aria-hidden className="shrink-0 font-mono text-sm text-zinc-600">{index + 1}</span>
                  <span className="min-w-0 font-medium">{topic}</span>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
        <aside className="border-t border-zinc-200 pt-6"><ScrollReveal>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Video size={20} aria-hidden />{copy.cameraTitle}</h2>
          <p className="mt-2 max-w-3xl">{copy.camera}</p>
          <p className="mt-2 text-sm text-zinc-600">{t.welcome.disclaimer}</p>
        </ScrollReveal></aside>
      </div>
    </main>
  )
}
