import { ArrowRight, Check, Delete, Info, Phone, TriangleAlert } from "lucide-react"
import { useState, type Ref } from "react"
import { Button } from "@/components/ui/button"
import { foundationsCopy } from "@/lib/learning-foundations"
import { scenarioCopy } from "@/lib/learning-scenarios"
import type { Language } from "@/lib/types"

const acceptedNumbers = ["103", "112"]
const keyStyle = "grid size-12 place-items-center rounded-full border border-zinc-200 bg-zinc-50 text-lg font-semibold text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:text-zinc-500"

export function CallStageProgress({ language, completed, className = "" }: { language: Language; completed: number; className?: string }) {
  return <div role="progressbar" aria-label={scenarioCopy[language].call.practice.progress} aria-valuemin={0} aria-valuenow={completed} aria-valuemax={2}
    className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${className}`}>
    {[0, 1].map(i => <span key={i} aria-hidden="true" className={`h-1 rounded-full ${i < completed ? "bg-red-700" : "bg-zinc-200"}`} />)}
  </div>
}

export function EmergencyCallPractice({ language, heading, number, accepted, completed, onNumber, onAccept, onContinue, onBack }: {
  language: Language
  heading: Ref<HTMLHeadingElement>
  number: string
  accepted: boolean
  completed: boolean
  onNumber: (number: string) => void
  onAccept: () => void
  onContinue: () => void
  onBack: () => void
}) {
  const copy = scenarioCopy[language].call.practice
  const { back, navigation } = foundationsCopy[language]
  const [numberError, setNumberError] = useState(false)
  const canDial = !accepted && number.length === 3

  function updateNumber(value: string) {
    if (accepted) return
    const digits = value.replace(/[^0-9]/g, "").slice(0, 3)
    if (digits === number) return
    setNumberError(false)
    onNumber(digits)
  }

  function dial() {
    if (!canDial) return
    if (!acceptedNumbers.includes(number)) {
      setNumberError(true)
      return
    }
    setNumberError(false)
    onAccept()
  }

  return <section aria-labelledby="learning-heading" className="mx-auto max-w-[61rem] pt-3 sm:pt-4">
    <CallStageProgress language={language} completed={completed ? 2 : accepted ? 1 : 0} className="mb-5 sm:mb-7" />

    <div className="grid items-start gap-y-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] md:grid-rows-[auto_1fr] md:gap-x-8 lg:gap-x-12">
      <div className="md:col-start-1">
        <h1 id="learning-heading" ref={heading} tabIndex={-1} className="text-pretty text-[clamp(1.5rem,4vw,2.125rem)] leading-tight font-bold tracking-tight outline-none">{copy.heading}</h1>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-zinc-700">{copy.introduction}</p>
        <h2 id="dial-practice-task" className="mt-4 text-lg leading-snug font-bold">{copy.task}</h2>
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-snug text-zinc-700">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{copy.notice}</span>
        </p>
      </div>

      <div aria-labelledby="dial-practice-task" role="group" className="mx-auto w-full max-w-[18rem] rounded-3xl border border-zinc-200 bg-white p-4 md:col-start-2 md:row-span-2 md:row-start-1 md:p-5">
        <input id="training-number" aria-label={copy.number} type="text" inputMode="none" autoComplete="off" spellCheck={false} readOnly={accepted}
          placeholder="—" value={number} onChange={event => updateNumber(event.target.value)}
          className="block min-h-12 w-full min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-3xl font-semibold tracking-wider text-zinc-950 tabular-nums placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" />
        <div className="mx-auto mt-3 grid max-w-52 grid-cols-3 justify-items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => <button key={digit} type="button" disabled={accepted} className={keyStyle}
            onClick={() => updateNumber(number + digit)}>{digit}</button>)}
          <button type="button" disabled={accepted} className={`${keyStyle} col-start-2`} onClick={() => updateNumber(number + "0")}>0</button>
          <button type="button" disabled={accepted || !number} aria-label={copy.erase} className={keyStyle} onClick={() => updateNumber(number.slice(0, -1))}>
            <Delete aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-3 grid justify-items-center gap-1.5">
          <Button type="button" disabled={!canDial} onClick={dial} aria-labelledby="dial-practice-label"
            className="size-[3.25rem] rounded-full bg-red-700 p-0 text-white transition-none hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
            <Phone aria-hidden="true" className="size-5" />
          </Button>
          <p id="dial-practice-label" className="text-sm font-medium text-zinc-700">{copy.dial}</p>
        </div>
      </div>

      <div className="min-w-0 md:col-start-1 md:row-start-2">
        <div role="status" aria-atomic="true">
          {(accepted || numberError) && <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 ${accepted ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
            {accepted ? <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0" /> : <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
            <div>
              <p className="font-semibold">{accepted ? copy.success : copy.retry}</p>
              <p className="mt-1 text-sm leading-relaxed">{accepted ? copy.successHelp : copy.retryHelp}</p>
            </div>
          </div>}
        </div>
        <nav aria-label={navigation} className="my-3 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" onClick={onBack} className="min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100">{back}</Button>
          {accepted && <Button type="button" onClick={onContinue} className="min-h-11 gap-2 bg-red-700 px-4 text-white hover:bg-red-800 sm:px-6">
            {copy.proceed}<ArrowRight aria-hidden="true" />
          </Button>}
        </nav>
        <a href={`https://www.gov.kz/situations/55/199?lang=${language === "kk" ? "kk" : "ru"}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm text-zinc-600 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
          {copy.source}
        </a>
      </div>
    </div>
  </section>
}
