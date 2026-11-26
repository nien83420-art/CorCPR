import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Camera, HeartPulse, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { practiceSetup, visualSetup } from "@/lib/practice-setup"
import type { Language } from "@/lib/types"
import { HandPlacement } from "./hand-placement"
import { CameraFrame, Illustration, Rescuer, StackedHands } from "./setup-illustration"

const secondary = "min-h-10 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100 aria-pressed:border-red-700 aria-pressed:bg-red-50"
const primary = "min-h-11 bg-red-700 px-4 text-white hover:bg-red-800"

function Guides({ items }: { items: string[] }) {
  return <ul className="grid list-disc gap-2 pl-5 text-sm leading-relaxed text-zinc-700 marker:text-red-700 sm:text-base">
    {items.map(item => <li key={item}>{item}</li>)}
  </ul>
}

function Demonstration({ kind, language }: { kind: "posture" | "hands" | "compression"; language: Language }) {
  const [playing, setPlaying] = useState(false)
  const copy = practiceSetup[language]
  return <div className="grid gap-3">
    {kind === "hands"
      ? <StackedHands playing={playing} />
      : <Illustration><Rescuer mode={kind} playing={playing} /></Illustration>}
    <Button className={`${secondary} justify-self-start`} onClick={() => setPlaying(!playing)}>
      {playing ? <Pause aria-hidden /> : <Play aria-hidden />}{playing ? copy.pause : copy.play}
    </Button>
  </div>
}

interface Props {
  language: Language
  onBack: () => void
  onStart: () => void
}

export function PracticeOnboarding({ language, onBack, onStart }: Props) {
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState<number | null>(null)
  const [kneeling, setKneeling] = useState(false)
  const copy = practiceSetup[language]
  const visual = visualSetup[language]
  const [title, summary, ...guides] = copy.steps[step]
  const last = step === copy.steps.length - 1
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = "CorCpr"
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    heading.current?.focus()
    window.scrollTo(0, 0)
  }, [step])

  const columns = "grid items-center gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
  let content
  switch (step) {
    case 0:
      content = <div className="divide-y divide-zinc-200">
        {(["posture", "hands", "compression"] as const).map((kind, index) => (
          <section key={kind} className={`${columns} py-6`}>
            <div className="md:order-2">
              <h2 className="mb-3 text-2xl font-semibold">{guides[index]}</h2>
              <Guides items={index === 0 ? copy.steps[3].slice(2) : index === 1 ? [copy.steps[4][1], copy.steps[4][3]] : visual.rhythm} />
            </div>
            <Demonstration kind={kind} language={language} />
          </section>
        ))}
      </div>
      break
    case 1:
      content = <div role="radiogroup" aria-labelledby="setup-heading" className="grid gap-3 sm:grid-cols-2">
        {copy.levels.map(([label, detail], index) => (
          <label key={label} className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-300 p-4 has-checked:border-red-700 has-checked:bg-red-50">
            <input type="radio" name="corcpr-experience" checked={experience === index} onChange={() => setExperience(index)} className="mt-1 size-4 shrink-0 accent-red-700" />
            <span><span className="block font-semibold">{label}</span><span className="mt-1 block text-sm text-zinc-700">{detail}</span></span>
          </label>
        ))}
      </div>
      break
    case 2:
      content = <div className={columns}>
        <div className="grid gap-3">
          <CameraFrame kneeling={kneeling} />
          <div className="flex flex-wrap gap-2">
            <Button className={secondary} aria-pressed={!kneeling} onClick={() => setKneeling(false)}>{copy.standing}</Button>
            <Button className={secondary} aria-pressed={kneeling} onClick={() => setKneeling(true)}>{copy.kneeling}</Button>
          </div>
        </div>
        <div aria-live="polite"><Guides items={visual.framing[kneeling ? 1 : 0]} /></div>
      </div>
      break
    case 3:
      content = <div className={columns}><Demonstration kind="posture" language={language} /><Guides items={guides} /></div>
      break
    case 4:
      content = <div className={columns}><HandPlacement copy={visual.placement} /><Guides items={guides} /></div>
      break
    case 5:
      content = <div className={columns}><Demonstration kind="compression" language={language} /><Guides items={[...visual.rhythm, ...guides]} /></div>
      break
    default:
      content = <>
        <div className={columns}><Illustration><Rescuer /></Illustration><Guides items={guides.slice(0, 2)} /></div>
        <aside className="mt-5 space-y-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-700">
          {guides.slice(2).map(guide => <p key={guide}>{guide}</p>)}
        </aside>
      </>
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-4 py-5 text-zinc-950 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xl font-semibold"><HeartPulse className="text-red-700" size={22} aria-hidden /> CorCpr</div>
          <span className="text-sm font-semibold tabular-nums" aria-current="step">{step + 1} / {copy.steps.length}</span>
        </header>
        <div className="mb-5 grid grid-cols-7 gap-1.5" aria-hidden="true">
          {copy.steps.map(([label], index) => <span key={label} className={`h-1.5 rounded-full ${index <= step ? "bg-red-700" : "bg-zinc-200"}`} />)}
        </div>
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-8" aria-labelledby="setup-heading">
          <div className="mb-5">
            <h1 id="setup-heading" ref={heading} tabIndex={-1} className="text-balance text-3xl font-semibold tracking-tight outline-none sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-zinc-700">{summary}</p>
          </div>
          {content}
          <footer className="mt-6 flex flex-wrap justify-between gap-3 border-t border-zinc-200 pt-5">
            <Button className={secondary} onClick={() => step === 0 ? onBack() : setStep(step - 1)}><ArrowLeft aria-hidden />{copy.back}</Button>
            <Button className={primary} disabled={step === 1 && experience === null} onClick={() => last ? onStart() : setStep(step + 1)}>
              {last ? copy.start : copy.next}{last ? <Camera aria-hidden /> : <ArrowRight aria-hidden />}
            </Button>
          </footer>
        </section>
      </div>
    </main>
  )
}
