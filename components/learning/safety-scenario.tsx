import { ArrowDownToLine, ArrowRight, CarFront, Check, Flame, TriangleAlert, Zap } from "lucide-react"
import type { Ref } from "react"
import { Button } from "@/components/ui/button"
import { foundationsCopy } from "@/lib/learning-foundations"
import { safeRoadwayChoice, scenarioCopy, type SafetyChoice } from "@/lib/learning-scenarios"
import type { Language } from "@/lib/types"
import { LearningMediaPlaceholder } from "./learning-media-placeholder"

const safetySlots = ["safety-collapse", "safety-response", "safety-bystander"] as const
const hazardIcons = [CarFront, Zap, Flame, ArrowDownToLine] as const

export function SafetyScenario({ language, heading, step, completedSteps, choice, onChoose, onNext, onBack }: {
  language: Language
  heading: Ref<HTMLHeadingElement>
  step: number
  completedSteps: number
  choice?: SafetyChoice
  onChoose: (choice: SafetyChoice) => void
  onNext: () => void
  onBack: () => void
}) {
  const copy = scenarioCopy[language].safety
  const { back, navigation } = foundationsCopy[language]
  const [title, description, media] = copy.parts[step]
  const correct = choice === safeRoadwayChoice

  return <section aria-labelledby="learning-heading" className="mx-auto max-w-[66rem] pt-3 sm:pt-4">
    <div role="progressbar" aria-label={copy.progress} aria-valuemin={0} aria-valuenow={completedSteps} aria-valuemax={safetySlots.length}
      className="mb-5 grid grid-cols-3 gap-2 sm:mb-7">
      {safetySlots.map((slot, i) => <span key={slot} aria-hidden="true" className={`h-1 rounded-full ${i < completedSteps ? "bg-red-700" : "bg-zinc-200"}`} />)}
    </div>

    <div className="grid items-start gap-y-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-7 lg:gap-x-10">
      <div className="md:col-start-1">
        <h1 id="learning-heading" ref={heading} tabIndex={-1} className="text-pretty text-[clamp(1.5rem,4vw,2.125rem)] leading-tight font-bold tracking-tight outline-none">{title}</h1>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-zinc-700">{description}</p>
      </div>
      <div className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1">
        <LearningMediaPlaceholder slot={safetySlots[step]} label={media} scene />
      </div>
      <div className="min-w-0 md:col-start-1 md:row-start-2">
        {step === 0 && <>
          <h2 id="safety-question" className="text-lg font-bold">{copy.decision.prompt}</h2>
          <div role="group" aria-labelledby="safety-question" className="mt-2 grid gap-2">
            {([0, 1] as const).map((option) => {
              const selected = option === choice
              const selectionStyle = selected ? (correct ? "border-green-600 bg-green-50" : "border-red-500 bg-red-50") : "border-zinc-200 bg-white"
              return <button key={option} type="button" aria-pressed={selected} aria-disabled={correct} onClick={() => onChoose(option)}
                className={`flex min-h-12 w-full items-baseline gap-3 rounded-xl border px-3.5 py-3 text-left text-[15px] leading-snug font-medium text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 ${correct ? "cursor-default" : "hover:border-red-700"} ${selectionStyle}`}>
                <span className="shrink-0 text-sm font-semibold text-zinc-600" aria-hidden="true">{option === 0 ? "A." : "B."}</span>
                <span>{copy.decision.options[option]}</span>
              </button>
            })}
          </div>
          <div role="status" aria-atomic="true">
            {choice !== undefined && <p className={`mt-3 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${correct ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
              {correct ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
              <span>{copy.decision.feedback[choice]}</span>
            </p>}
          </div>
          {correct && <aside aria-labelledby="safety-rule" className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <h3 id="safety-rule" className="font-bold">{copy.ruleTitle}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">{copy.rule}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {copy.hazards.map((hazard, i) => {
                const Icon = hazardIcons[i]
                return <li key={hazard} className="flex min-w-0 items-start gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[13px] leading-snug text-zinc-800 sm:items-center">
                  <Icon className="mt-0.5 size-4 shrink-0 text-zinc-600 sm:mt-0" aria-hidden="true" /><span>{hazard}</span>
                </li>
              })}
            </ul>
          </aside>}
        </>}
        {step === 1 && <div className="space-y-3 leading-relaxed text-zinc-800">
          <ol className="list-decimal space-y-1 pl-5 font-medium">
            {copy.approach.map(action => <li key={action}>{action}</li>)}
            <li>{copy.speakClearly} <q>{copy.spokenCheck}</q></li>
          </ol>
          <p>{copy.responds}</p>
          <p>{copy.unresponsive}</p>
        </div>}
        {step === 2 && <div className="space-y-3 leading-relaxed text-zinc-800">
          <blockquote className="border-l-2 border-red-700 pl-4 font-semibold"><q>{copy.request}</q></blockquote>
          <p>{copy.aed}</p>
          <p>{copy.alone}</p>
        </div>}
        <nav aria-label={navigation} className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" onClick={onBack} className="min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100">{back}</Button>
          {(step > 0 || correct) && <Button type="button" onClick={onNext} className="min-h-11 gap-2 bg-red-700 px-4 text-white hover:bg-red-800 sm:px-6">
            {copy.continue}<ArrowRight aria-hidden="true" />
          </Button>}
        </nav>
      </div>
    </div>
  </section>
}
