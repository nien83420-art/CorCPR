import { useEffect, useRef } from "react"
import { ChevronDown, Expand, Scan, Sun, Video } from "lucide-react"
import { CourseProgressBar, courseSafeArea } from "@/components/learning/course-progress-bar"
import { CameraFrame } from "@/components/practice/setup-illustration"
import { Button } from "@/components/ui/button"
import { cameraPreparationCopy } from "@/lib/camera-preparation"
import type { Language } from "@/lib/types"

const stepIcons = [Scan, Sun, Expand] as const

export function CameraPreparationScreen({ language, courseProgress, homeLabel, backLabel, onHome, onBack, onStart }: {
  language: Language
  courseProgress?: number
  homeLabel: string
  backLabel: string
  onHome: () => void
  onBack: () => void
  onStart: () => void
}) {
  const copy = cameraPreparationCopy[language]
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [])

  return <main lang={language} className={`min-h-page page-gutter bg-white pb-6 text-zinc-950 [color-scheme:light] ${courseSafeArea}`}>
    <div className="mx-auto max-w-6xl">
      <header className={courseProgress === undefined ? "border-b border-zinc-200 py-2 sm:py-4" : "py-2 sm:py-4"}>
        <button type="button" aria-label={homeLabel} onClick={onHome}
          className="min-h-11 rounded text-xl font-bold tracking-tight text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2">CorCpr</button>
      </header>
      {courseProgress !== undefined && <CourseProgressBar language={language} completed={courseProgress} />}

      <div className="mx-auto max-w-5xl pt-5 sm:pt-7 lg:pt-9">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-8 lg:gap-x-10">
          <div>
            <h1 ref={heading} tabIndex={-1}
              className="text-pretty text-[clamp(1.625rem,4vw,2.625rem)] leading-tight font-bold tracking-tight outline-none">{copy.title}</h1>
            <p className="mt-1.5 max-w-prose text-base leading-snug text-zinc-700">{copy.intro}</p>
          </div>
          <div className="mx-auto w-full max-w-72 self-center md:col-start-2 md:row-span-2 md:row-start-1 md:max-w-none">
            <CameraFrame kneeling={false} />
          </div>
          <ul className="grid content-start gap-2.5">
            {copy.steps.map(([title, description], index) => {
              const Icon = stepIcons[index]
              return <li key={title} className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug">{title}</h2>
                  <p className="mt-0.5 text-sm leading-snug text-zinc-700">{description}</p>
                </div>
              </li>
            })}
          </ul>
        </div>

        <div className="mt-4 max-w-prose border-l-2 border-red-600 pl-3 text-sm leading-relaxed text-zinc-700">
          <p>{copy.safePractice}</p>
          <p className="mt-1">{copy.limits}</p>
        </div>

        <div className="mt-4 flex flex-col items-start gap-1 sm:flex-row sm:gap-3">
          <div className="w-full min-w-0 sm:w-auto">
            <Button type="button" aria-describedby="camera-permission-note"
              className="min-h-12 w-full gap-2 bg-red-600 px-5 text-base font-semibold text-white hover:bg-red-700 motion-reduce:transition-none" onClick={onStart}>
              <Video aria-hidden="true" className="size-5" />{copy.start}
            </Button>
            <p id="camera-permission-note" className="mt-1 text-sm leading-snug text-zinc-600">{copy.permission}</p>
          </div>
          <Button type="button" variant="outline" className="min-h-12 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100 motion-reduce:transition-none" onClick={onBack}>
            {backLabel}
          </Button>
        </div>

        <details className="group mt-3 max-w-prose border-y border-zinc-200 text-sm text-zinc-800">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm px-1 font-semibold text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 [&::-webkit-details-marker]:hidden">
            {copy.privacyTitle}<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-zinc-600 group-open:rotate-180" />
          </summary>
          <div className="space-y-1.5 px-1 pb-3 leading-relaxed">
            <p>{copy.privacy}</p>
            <p>{copy.results}</p>
            <p>{copy.downloads}</p>
          </div>
        </details>
      </div>
    </div>
  </main>
}
