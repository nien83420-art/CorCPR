import { ArrowRight } from "lucide-react"
import type { Ref } from "react"
import { Button } from "@/components/ui/button"
import { cprExperience, selfAssessmentCopy, type CprExperience } from "@/lib/course-self-assessment"
import { foundationsCopy } from "@/lib/learning-foundations"
import type { Language } from "@/lib/types"

const selectionStyle = "relative cursor-pointer rounded-xl border border-zinc-200 bg-white text-zinc-950 has-checked:border-red-700 has-checked:bg-red-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-red-700 has-disabled:cursor-default"

export function ConfidenceScale({ language, name, value, disabled, onChange }: {
  language: Language
  name: string
  value: number | null | undefined
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const copy = selfAssessmentCopy[language]
  return <fieldset className="min-w-0" disabled={disabled}>
    <legend className="mb-3 text-lg leading-snug font-bold">{copy.confidence}</legend>
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {[1, 2, 3, 4, 5].map(option => <label key={option} className={`${selectionStyle} grid min-h-12 place-items-center font-semibold tabular-nums`}>
        <input className="sr-only" type="radio" name={name} value={option} checked={value === option}
          aria-label={option === 1 ? `1 — ${copy.low}` : option === 5 ? `5 — ${copy.high}` : String(option)}
          onChange={() => onChange(option)} />
        <span aria-hidden="true">{option}</span>
      </label>)}
    </div>
    <div aria-hidden="true" className="mt-2 grid grid-cols-2 gap-3 text-sm leading-snug text-zinc-600">
      <span>{copy.low}</span><span className="text-right">{copy.high}</span>
    </div>
  </fieldset>
}

export function CourseSelfAssessmentPanel({ language, heading, experience, confidence, saved, saving, failed, onExperience, onConfidence, onBack, onNext }: {
  language: Language
  heading: Ref<HTMLHeadingElement>
  experience?: CprExperience
  confidence?: number
  saved: boolean
  saving: boolean
  failed: boolean
  onExperience: (value: CprExperience) => void
  onConfidence: (value: number) => void
  onBack: () => void
  onNext: () => void
}) {
  const copy = selfAssessmentCopy[language]
  const { back, next, navigation } = foundationsCopy[language]
  return <section aria-labelledby="learning-heading" className="mx-auto max-w-2xl pb-6 pt-7 sm:pt-12">
    <h1 ref={heading} tabIndex={-1} id="learning-heading" className="text-[clamp(1.875rem,8.5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.045em] outline-none">
      {copy.title}
    </h1>
    <p className="mt-2 text-base leading-relaxed text-zinc-700">{copy.introduction}</p>
    <div className="mt-4 grid gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-3 sm:gap-5 sm:p-6">
      <fieldset className="min-w-0" disabled={saved || saving}>
        <legend className="mb-2 text-lg leading-snug font-bold sm:mb-3">{copy.experience}</legend>
        <div className="grid gap-2">
          {cprExperience.map(category => <label key={category} className={`${selectionStyle} flex min-h-11 items-center gap-2.5 px-3 py-1.5 text-[15px] leading-snug`}>
            <input className="size-4 shrink-0 accent-red-700" type="radio" name="learning-experience" value={category}
              checked={experience === category} onChange={() => onExperience(category)} />
            {copy.levels[category]}
          </label>)}
        </div>
      </fieldset>
      <ConfidenceScale language={language} name="learning-confidence" value={confidence} disabled={saved || saving} onChange={onConfidence} />
    </div>
    {failed && <p className="mt-3 text-sm text-zinc-700" role="alert">{copy.saveError}</p>}
    {saving && <p className="sr-only" role="status">{copy.saving}</p>}
    <nav aria-label={navigation} className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <Button type="button" onClick={onBack} disabled={saving} className="min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100">{back}</Button>
      <Button type="button" onClick={onNext} disabled={experience === undefined || confidence === undefined || saving}
        className="min-h-11 gap-2 bg-red-700 px-4 text-white hover:bg-red-800 sm:px-6">
        {next}<ArrowRight aria-hidden="true" />
      </Button>
    </nav>
  </section>
}
