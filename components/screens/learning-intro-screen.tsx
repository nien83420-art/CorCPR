import { ArrowRight, ChevronDown, Ear, HeartPulse, Wind } from "lucide-react"
import { useState, type ReactNode, type Ref } from "react"
import { ScrollReveal } from "@/components/learning/scroll-reveal"
import { Button } from "@/components/ui/button"
import { adultBlsGuidelinesUrl, foundationsCopy } from "@/lib/learning-foundations"
import type { Language } from "@/lib/types"

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return <details className="group rounded-xl border border-zinc-200 bg-white">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[15px] font-semibold hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 [&::-webkit-details-marker]:hidden">
      {title}
      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-red-700 group-open:rotate-180" />
    </summary>
    <div className="px-4 pb-3 text-[15px] leading-relaxed text-zinc-700">{children}</div>
  </details>
}

export function LearningIntroScreen({ language, heading, onNext, animate }: {
  language: Language
  heading: Ref<HTMLHeadingElement>
  onNext: () => void
  animate: boolean
}) {
  const { intro, navigation, next } = foundationsCopy[language]
  const [firstLine, emphasizedLine] = intro.title
  const [subject, response, conjunction, breathing] = intro.recognition
  const [selected, setSelected] = useState<number | null>(null)
  const reference = "inline-flex min-h-11 items-center text-red-700 underline underline-offset-3"

  return <div className="mx-auto max-w-[58rem] pb-6 pt-7 sm:pt-12 lg:pt-16">
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">
      <section aria-labelledby="learning-heading">
        <ScrollReveal subtle animate={animate}><h1 ref={heading} id="learning-heading" tabIndex={-1} className="text-[clamp(1.875rem,8.5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.045em] outline-none lg:text-[clamp(3rem,4.6vw,4rem)]">
          <span className="block">{firstLine}</span>{" "}
          <span className="block text-red-700">{emphasizedLine}</span>
        </h1></ScrollReveal>
        <ScrollReveal subtle animate={animate} delay={80} className="mt-3.5 sm:mt-5">
          <p className="max-w-[33rem] text-base leading-relaxed text-zinc-700 sm:text-lg">{intro.summary}</p>
        </ScrollReveal>
      </section>

      <ScrollReveal subtle animate={animate} delay={140}><section aria-labelledby="intro-recognition" className="min-w-0 rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-red-700"><HeartPulse aria-hidden="true" className="size-5" /></span>
          <h2 id="intro-recognition" className="text-lg leading-tight font-bold">{intro.recognitionTitle}</h2>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-700">
          {subject} <strong className="text-zinc-950">{response}</strong> {conjunction} <strong className="text-zinc-950">{breathing}</strong>.
        </p>
        <p className="mt-3 text-sm text-zinc-600">{intro.signsPrompt}</p>
        <div role="group" aria-labelledby="intro-recognition" className="mt-2 grid grid-cols-2 gap-2">
          {intro.signs.map((sign, index) => {
            const Icon = index === 0 ? Ear : Wind
            return <button key={sign} type="button" aria-pressed={selected === index} onClick={() => setSelected(selected === index ? null : index)}
              className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2 py-2 text-left text-sm leading-snug font-semibold text-zinc-900 hover:border-red-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 aria-pressed:border-red-700 aria-pressed:bg-red-100/80 aria-pressed:text-red-900 sm:px-3">
              <Icon className="size-4 shrink-0 text-red-700" aria-hidden="true" />{sign}
            </button>
          })}
        </div>
        <p role="status" className="mt-3 text-sm leading-relaxed text-zinc-800 empty:hidden">
          {selected !== null ? intro.signDetails[selected] : null}
        </p>
      </section></ScrollReveal>
    </div>

    <div className="mt-4 grid items-end gap-4 lg:mt-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">
      <div className="space-y-2.5">
        <ScrollReveal subtle animate={animate} delay={60}><Disclosure title={intro.definitionTitle}><p>{intro.definition}</p></Disclosure></ScrollReveal>
        <ScrollReveal subtle animate={animate} delay={100}><Disclosure title={intro.sourcesTitle}>
          <ul className="divide-y divide-zinc-100">
            <li><a className={reference} href="https://pubmed.ncbi.nlm.nih.gov/40015622/" rel="noreferrer">{intro.caresSource}</a></li>
            <li><a className={reference} href={adultBlsGuidelinesUrl} rel="noreferrer">{intro.ahaSource}</a></li>
          </ul>
        </Disclosure></ScrollReveal>
      </div>
      <ScrollReveal subtle animate={animate} delay={170}><nav aria-label={navigation} className="flex justify-end">
        <Button size="lg" type="button" onClick={onNext} className="min-h-11 w-full gap-2 bg-red-700 px-6 text-base font-semibold text-white hover:bg-red-800 lg:w-auto lg:min-w-36">
          {next}<ArrowRight aria-hidden="true" />
        </Button>
      </nav></ScrollReveal>
    </div>
  </div>
}
