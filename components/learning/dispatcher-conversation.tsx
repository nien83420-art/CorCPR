import { ArrowRight, Check, Info } from "lucide-react"
import { Fragment, useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import { Button } from "@/components/ui/button"
import { completeDispatcherAnswer, type DispatcherAnswer, type DispatcherProgress } from "@/lib/dispatcher-draft"
import { adultBlsGuidelinesUrl, foundationsCopy } from "@/lib/learning-foundations"
import { scenarioCopy } from "@/lib/learning-scenarios"
import type { Language } from "@/lib/types"
import { CallStageProgress } from "./emergency-call-practice"
import { LearningMediaPlaceholder } from "./learning-media-placeholder"
import { DispatcherAnswerChoices } from "./learning-scenario-panels"

const sceneByAction = ["speakerphone", "position", "breathing", "cpr"] as const

export function DispatcherConversation({ language, heading, number, progress, answer, completed, initialScroll, onAnswer, onAction, onSave, onBack, onStartCpr }: {
  language: Language
  heading: RefObject<HTMLHeadingElement | null>
  number: string
  progress: DispatcherProgress
  answer: DispatcherAnswer | null
  completed: boolean
  initialScroll: number
  onAnswer: (answer: DispatcherAnswer) => void
  onAction: (step: DispatcherProgress) => void
  onSave: (scrollY: number) => void
  onBack: () => void
  onStartCpr: () => void
}) {
  const call = scenarioCopy[language].call
  const copy = call.conversation
  const report = call.report
  const { back, navigation } = foundationsCopy[language]
  const action = useRef<HTMLButtonElement>(null)
  const feedback = useRef<HTMLLIElement>(null)
  const revealAction = useRef(false)
  const opening = progress === -1
  const reportAccepted = answer === completeDispatcherAnswer
  const ready = progress === 3
  const activeNumber = number === "103" || number === "112" ? number : null

  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, initialScroll)
  }, [heading, initialScroll])

  useLayoutEffect(() => {
    if (!revealAction.current) return
    revealAction.current = false
    const box = (action.current ?? feedback.current)?.getBoundingClientRect()
    if (box && box.bottom > window.innerHeight - 16) {
      window.scrollBy({ top: box.bottom - window.innerHeight + 16, behavior: "instant" })
    }
  }, [answer, progress])

  useEffect(() => {
    const save = () => onSave(window.scrollY)
    window.addEventListener("pagehide", save)
    return () => window.removeEventListener("pagehide", save)
  }, [onSave])

  function advance() {
    if (ready) {
      onSave(window.scrollY)
      onStartCpr()
      return
    }
    const box = action.current?.getBoundingClientRect()
    revealAction.current = Boolean(box && box.top >= 0 && box.bottom <= window.innerHeight)
    onAction(progress)
  }

  function chooseAnswer(next: DispatcherAnswer) {
    if (reportAccepted || next === answer) return
    revealAction.current = true
    onAnswer(next)
  }

  const dispatcherMessage = "max-w-[95%] rounded-xl bg-zinc-100 px-3.5 py-2.5 leading-relaxed text-zinc-900"

  return <section aria-labelledby="learning-heading" className="mx-auto max-w-[65rem] pt-3 sm:pt-4">
    <CallStageProgress language={language} completed={completed ? 2 : 1} className="mb-5 sm:mb-7" />
    <h1 id="learning-heading" ref={heading} tabIndex={-1} className="text-pretty text-[clamp(1.5rem,4vw,2.125rem)] leading-tight font-bold tracking-tight outline-none">
      {call.practice.heading}
    </h1>
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-snug text-zinc-700">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div><p className="font-medium">{call.simulation}</p><p className="mt-1">{copy.urgent}</p></div>
    </div>
    <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 border-b border-zinc-200 pb-3">
          <span aria-hidden="true" className="size-9 shrink-0 rounded-full border border-zinc-200 bg-zinc-100" />
          <p className="font-semibold">{activeNumber ? `${activeNumber} · ${copy.dispatcher}` : copy.dispatcher}
            {!activeNumber && <span className="block text-sm font-normal text-zinc-600">{copy.missingNumber}</span>}
          </p>
        </div>
        <p className="mt-2.5 text-sm leading-snug text-zinc-700">{report.context}</p>
        <ol className="mt-3 grid gap-2.5" aria-label={copy.dispatcher}>
          <li id="dispatcher-opening-question" className={dispatcherMessage}>{report.prompt}</li>
          <li>
            {opening ? <DispatcherAnswerChoices report={report} answer={answer} onAnswer={chooseAnswer} />
              : <p className="ml-auto max-w-[95%] rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm leading-snug text-zinc-800">
                {report.options[completeDispatcherAnswer]}
              </p>}
          </li>
          <li ref={feedback} role="status" aria-atomic="true" className={answer === null ? "sr-only" : `${dispatcherMessage} text-sm ${reportAccepted ? "font-medium" : "border border-red-200"}`}>
            {answer !== null && (reportAccepted ? report.accepted : report.retry)}
          </li>
          {copy.instructions.slice(0, progress + 1).map((message, index) => <Fragment key={message}>
            <li className={dispatcherMessage}>
              {index === 2 && <p className="mb-1.5 text-sm font-semibold">{copy.knownFinding}</p>}
              {message}
            </li>
            {index < progress && <li className="ml-auto flex max-w-[90%] items-start gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-sm leading-snug text-zinc-800">
              <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-red-700" />{copy.confirmations[index]}
            </li>}
          </Fragment>)}
        </ol>
        <p role="status" aria-atomic="true" className="sr-only">
          {!opening && `${progress > 0 ? copy.confirmations[progress - 1] + " " : ""}${progress === 2 ? copy.knownFinding + " " : ""}${copy.instructions[progress]}`}
        </p>
        {ready && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="text-xs font-semibold tracking-wide text-red-700">{copy.yourAction}</p>
          <h2 className="mt-1 text-base font-semibold">{copy.speak}</h2>
          <p className="mt-1 text-lg leading-snug font-bold text-red-800">«{copy.phrase}»</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{copy.caution}</p>
        </div>}
        {(!opening || reportAccepted) && <Button ref={action} type="button" onClick={advance} onKeyDown={event => { if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault() }}
          className="mt-3 min-h-11 max-w-full gap-2 whitespace-normal bg-red-700 px-4 text-white hover:bg-red-800">
          {opening ? report.continue : ready ? copy.startCpr : copy.actions[progress]}<ArrowRight aria-hidden="true" />
        </Button>}
      </div>
      <div data-scene={opening ? "opening" : sceneByAction[progress]} className="mx-auto w-full max-w-56 md:max-w-none">
        <LearningMediaPlaceholder scene slot="dispatcher-scene" label="" />
      </div>
    </div>
    <nav aria-label={navigation} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-zinc-200 pt-3">
      <Button type="button" onClick={() => { onSave(window.scrollY); onBack() }} className="min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100">{back}</Button>
      <a href={adultBlsGuidelinesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-zinc-600 underline underline-offset-3">{copy.guidelines}</a>
      <a href={`https://www.gov.kz/situations/55/199?lang=${language === "kk" ? "kk" : "ru"}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center text-sm text-zinc-600 underline underline-offset-3">{call.practice.source}</a>
    </nav>
  </section>
}
