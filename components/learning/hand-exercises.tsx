import { ChevronDown, Info } from "lucide-react"
import { useEffect, useRef, type Dispatch, type KeyboardEvent, type PointerEvent, type ReactNode, type SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { CourseProgressBar, courseSafeArea } from "./course-progress-bar"
import { handExerciseCopy, heelsAlign, isInsideSternum, type Point } from "@/lib/hand-exercises"
import { ChestIllustration, HeelMarker, IllustratedHand, InterlockedHands, InterlockedLowerHand,
  InterlockedUpperHand, LowerPalmInset } from "./hand-exercise-illustrations"
import type { Language } from "@/lib/types"

type StackIssue = "alignment" | "angle" | "fingers"
type PlacementIssue = "tooHigh" | "tooLow" | "offCenter"

export const initialHandExercises = {
  screen: 0 as 0 | 1,
  lower: { x: 118, y: 172 },
  upper: { x: 282, y: 172 },
  quarterTurns: 0,
  interlocked: false,
  stackResult: null as StackIssue[] | null,
  stackVerified: false,
  placement: { x: 60, y: 293 },
  placementResult: null as PlacementIssue | "correct" | null,
  placementAttempted: false,
}

type ExerciseState = typeof initialHandExercises
type MovablePosition = "lower" | "upper" | "placement"

const primary = "min-h-11 bg-red-700 px-5 text-white hover:bg-red-800"
const secondary = "min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100"
const handBounds = { left: 92, right: 308, top: 92, bottom: 202 }
const uprightRotation = -90
const arrows = {
  ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
}

function MovableHand({ label, point, bounds, move, check, children }: {
  label: string
  point: Point
  bounds: { left: number; right: number; top: number; bottom: number }
  move: (point: Point) => void
  check: () => void
  children: ReactNode
}) {
  const drag = useRef<{ id: number; offset: Point } | null>(null)

  function update(x: number, y: number) {
    move({
      x: Math.round(Math.max(bounds.left, Math.min(bounds.right, x)) * 10) / 10,
      y: Math.round(Math.max(bounds.top, Math.min(bounds.bottom, y)) * 10) / 10,
    })
  }

  function localPoint(event: PointerEvent<SVGGElement>) {
    const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM()
    if (!matrix) return
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  }

  function startDrag(event: PointerEvent<SVGGElement>) {
    if (drag.current || event.button !== 0) return
    const local = localPoint(event)
    if (!local) return
    drag.current = { id: event.pointerId, offset: { x: local.x - point.x, y: local.y - point.y } }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
  }

  function dragTo(event: PointerEvent<SVGGElement>) {
    const active = drag.current
    if (!active || active.id !== event.pointerId) return
    const local = localPoint(event)
    if (local) update(local.x - active.offset.x, local.y - active.offset.y)
  }

  function endDrag(event: PointerEvent<SVGGElement>) {
    if (drag.current?.id !== event.pointerId) return
    dragTo(event)
    drag.current = null
  }

  function moveWithKeyboard(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      check()
      return
    }
    const offset = arrows[event.key as keyof typeof arrows]
    if (!offset) return
    event.preventDefault()
    const step = event.shiftKey ? 2 : 10
    update(point.x + offset.x * step, point.y + offset.y * step)
  }

  return <g role="button" tabIndex={0} aria-label={label} aria-describedby="hand-exercise-keys"
    className="touch-none cursor-grab focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 active:cursor-grabbing [&_*]:touch-none"
    transform={`translate(${point.x} ${point.y})`} onKeyDown={moveWithKeyboard}
    onPointerDown={startDrag} onPointerMove={dragTo} onPointerUp={endDrag}
    onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}>
    <circle r="22" fill="transparent" />
    {children}
  </g>
}

export function HandExercises({ language, courseProgress, state, setState, homeLabel, labels, onHome, onBack, onPrepareCamera }: {
  language: Language
  courseProgress: number
  state: ExerciseState
  setState: Dispatch<SetStateAction<ExerciseState>>
  homeLabel: string
  labels: { back: string; next: string; navigation: string; check: string; correct: string; incorrect: string }
  onHome: () => void
  onBack: () => void
  onPrepareCamera: () => void
}) {
  const copy = handExerciseCopy[language]
  const heading = useRef<HTMLHeadingElement>(null)
  const stacking = state.screen === 0
  const stackIssues = state.stackVerified ? state.stackResult : null
  const stackPassed = stackIssues?.length === 0
  const placementPassed = state.placementResult === "correct"
  const canInterlock = heelsAlign(state.lower, state.upper) && state.quarterTurns === 0
  const showFeedback = stacking ? state.stackVerified : state.placementResult !== null
  const keepFeedbackSpace = stacking && state.stackResult !== null
  const feedbackCorrect = stacking ? state.stackResult?.length === 0 : placementPassed

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [state.screen])

  function checkStack() {
    setState(previous => {
      const issues: StackIssue[] = []
      if (!heelsAlign(previous.lower, previous.upper)) issues.push("alignment")
      if (previous.quarterTurns !== 0) issues.push("angle")
      if (issues.length === 0 && !previous.interlocked) issues.push("fingers")
      return { ...previous, stackResult: issues, stackVerified: true }
    })
  }

  function toggleInterlock() {
    setState(previous => {
      if (!heelsAlign(previous.lower, previous.upper) || previous.quarterTurns !== 0) return previous
      return { ...previous, interlocked: !previous.interlocked, stackVerified: false }
    })
  }

  function checkPlacement() {
    const { x, y } = state.placement
    const result = isInsideSternum(state.placement) ? "correct"
      : Math.abs(x - 200) > 22 ? "offCenter"
      : y < 157 ? "tooHigh"
      : y > 206 ? "tooLow" : "offCenter"
    setState(previous => ({ ...previous, placementResult: result, placementAttempted: true }))
  }

  function moveHand(field: MovablePosition, point: Point) {
    setState(previous => {
      if (previous[field].x === point.x && previous[field].y === point.y) return previous
      if (field === "placement") return { ...previous, placement: point, placementResult: null }
      return { ...previous, [field]: point, stackVerified: false, interlocked: false }
    })
  }

  return <main lang={language} className={`min-h-page page-gutter bg-white pb-8 text-zinc-950 [color-scheme:light] ${courseSafeArea} ${stacking ? "[overflow-anchor:none]" : ""}`}>
    <div className="mx-auto max-w-6xl">
      <header className="flex items-center justify-between gap-4 py-2 sm:py-4">
        <button type="button" aria-label={homeLabel} onClick={onHome}
          className="min-h-11 shrink-0 rounded text-xl font-bold tracking-tight text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2">CorCpr</button>
        <span className="text-sm font-semibold tabular-nums text-red-800">{state.screen + 1} / 2</span>
      </header>
      <CourseProgressBar language={language} completed={courseProgress} />
      <section className="mx-auto max-w-2xl py-5 sm:py-6" aria-labelledby="hand-exercise-title">
        <h1 ref={heading} id="hand-exercise-title" tabIndex={-1}
          className="text-pretty text-2xl font-bold tracking-tight outline-none sm:text-[2.125rem]">{copy.titles[state.screen]}</h1>
        <p className="mt-1.5 leading-relaxed text-zinc-800">{stacking ? copy.stack : copy.place}</p>
        <figure className="mt-3">
          {stacking ? <svg viewBox="0 0 400 294" role="group" aria-label={copy.diagram}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50">
            <MovableHand key="lower" label={copy.lower} point={state.lower} bounds={handBounds}
              move={point => moveHand("lower", point)} check={checkStack}>
              <g transform={`rotate(${uprightRotation}) scale(.82)`}>
                {state.interlocked ? <InterlockedLowerHand /> : <IllustratedHand />}
              </g>
            </MovableHand>
            <MovableHand key="upper" label={copy.upper} point={state.upper} bounds={handBounds}
              move={point => moveHand("upper", point)} check={checkStack}>
              <g transform={`rotate(${uprightRotation + state.quarterTurns * 90}) scale(.82)`}>
                {state.interlocked ? <InterlockedUpperHand />
                  : <IllustratedHand upper problem={stackIssues?.includes("angle")} />}
              </g>
              {!state.interlocked && <HeelMarker outline />}
            </MovableHand>
            <g transform={`translate(${state.lower.x} ${state.lower.y})`} pointerEvents="none">
              {stackIssues?.includes("alignment") && <circle r="11" fill="none" stroke="#b91c1c" strokeWidth="2" strokeDasharray="3 2" />}
              {!state.interlocked && <HeelMarker />}
            </g>
          </svg> : <svg viewBox="0 0 400 354" role="group" aria-label={copy.titles[1]}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50">
            <ChestIllustration title={copy.torso} highlight={state.placementAttempted} correct={placementPassed} />
            <MovableHand key="placement" label={copy.both} point={state.placement}
              bounds={{ left: 34, right: 332, top: 40, bottom: 314 }} move={point => moveHand("placement", point)} check={checkPlacement}>
              <g transform="scale(.64)">
                <InterlockedHands />
              </g>
              <HeelMarker outline />
            </MovableHand>
          </svg>}
          <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-700">
            {stacking && stackPassed && <span className="inline-flex items-center gap-3">
              <LowerPalmInset />
              <span>{copy.contactArea}</span>
            </span>}
            {stacking && !state.interlocked && <>
              <span className="inline-flex items-center gap-2"><span aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full bg-red-800" />{copy.heel}</span>
              <span className="inline-flex items-center gap-2"><span aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full border-2 border-red-800 bg-white" />{copy.upperHeel}</span>
            </>}
            {!stacking && <span className="inline-flex items-center gap-2"><span aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full border-2 border-red-800 bg-white" />{copy.placementMarker}</span>}
            {!stacking && <span className="inline-flex items-center gap-2"><span aria-hidden="true"
              className={state.placementAttempted ? "h-4 w-2 rounded-sm border border-dashed border-current" : "h-4 w-2 rounded-sm border border-[#9c7366] bg-[#fbf0e9]"} />
              {state.placementAttempted ? copy.area : copy.anatomy}</span>}
          </figcaption>
        </figure>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {stacking && <>
            <Button className={secondary} onClick={() => setState(previous => ({
              ...previous, quarterTurns: (previous.quarterTurns + 1) % 4, interlocked: false, stackVerified: false,
            }))}>{copy.rotate}</Button>
            <Button className={secondary} disabled={!canInterlock} onClick={toggleInterlock}>
              {state.interlocked ? copy.unlock : copy.lock}
            </Button>
          </>}
          <Button className={primary} onClick={stacking ? checkStack : checkPlacement}>{labels.check}</Button>
        </div>
        {stacking && !keepFeedbackSpace && <p className={`mt-1.5 text-sm text-zinc-600 ${canInterlock ? "invisible" : ""}`}>{copy.lockHint}</p>}
        <div role="status">
          {/* Keep the previous panel's height during retries so the drawing stays put under the pointer. */}
          {(showFeedback || keepFeedbackSpace) && <div className={`mt-2 rounded-xl border px-3 py-2 text-sm leading-relaxed ${showFeedback ? "" : "invisible"} ${feedbackCorrect ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
            {!feedbackCorrect && <p className="font-semibold">{labels.incorrect}</p>}
            {stacking && (feedbackCorrect ? <p>{copy.stackSuccess}</p> :
              <ul className="mt-0.5 list-disc pl-5">{state.stackResult?.map(issue => <li key={issue}>{copy[issue]}</li>)}</ul>)}
            {!stacking && <p>{placementPassed ? copy.placeSuccess : state.placementResult && state.placementResult !== "correct" && copy[state.placementResult]}</p>}
          </div>}
        </div>
        <nav aria-label={labels.navigation} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3">
          <Button className={secondary} onClick={stacking ? onBack : () => setState(previous => ({ ...previous, screen: 0 }))}>{labels.back}</Button>
          {stacking && <Button className={primary} disabled={!stackPassed}
            onClick={() => setState(previous => ({ ...previous, screen: 1 }))}>{labels.next}</Button>}
          {!stacking && placementPassed && <Button className={`${primary} max-w-full whitespace-normal`}
            onClick={onPrepareCamera}>{copy.camera}</Button>}
        </nav>
        <details key={state.screen} className="group mt-2 rounded-lg border border-zinc-200">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 [&::-webkit-details-marker]:hidden">
            {copy.keyboardHelp}<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-red-700 group-open:rotate-180" />
          </summary>
          <p id="hand-exercise-keys" className="px-3 pb-2 text-sm leading-relaxed text-zinc-600">{stacking ? copy.stackKeys : copy.keys}</p>
        </details>
        <aside className="mt-2 flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-600">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>{copy.disclaimer}</p>
        </aside>
      </section>
    </div>
  </main>
}
