import type { KeyboardEvent, MouseEvent } from "react"
import { ChestIllustration, HeelMarker, InterlockedHands } from "./hand-exercise-illustrations"
import { Button } from "@/components/ui/button"
import { courseResultsCopy } from "@/lib/course-results-copy"
import type { FinalQuestion } from "@/lib/final-assessment"
import { isInsideSternum, type Point } from "@/lib/hand-exercises"
import { foundationsCopy } from "@/lib/learning-foundations"
import type { Language } from "@/lib/types"

export type FinalResponse = ({ option: number } | { point: Point }) & { correct: boolean | null }

type QuestionPanelProps = {
  language: Language
  question: FinalQuestion
  response?: FinalResponse
  onResponse: (response: FinalResponse) => void
}

const initialPlace = { x: 60, y: 293 }
const arrows: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
}

export function FinalQuestionPanel({ language, question, response, onResponse }: QuestionPanelProps) {
  const copy = courseResultsCopy[language]
  const labels = foundationsCopy[language].quiz
  const verified = response !== undefined && response.correct !== null
  const choice = "options" in question ? question : null
  const option = response && "option" in response ? response.option : undefined
  const point = response && "point" in response ? response.point : initialPlace

  function position(x: number, y: number) {
    if (verified) return
    onResponse({ point: { x: Math.max(34, Math.min(332, x)), y: Math.max(45, Math.min(314, y)) }, correct: null })
  }

  function placeWithPointer(event: MouseEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    position(x, y)
  }

  function placeWithKeyboard(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      position(point.x, point.y)
      return
    }
    const offset = arrows[event.key]
    if (!offset) return
    event.preventDefault()
    const step = event.shiftKey ? 2 : 10
    position(point.x + offset[0] * step, point.y + offset[1] * step)
  }

  function check() {
    if (!response || verified) return
    const correct = "point" in response ? isInsideSternum(response.point) : response.option === choice?.correct
    onResponse({ ...response, correct })
  }

  return <div className="mt-5">
    {choice && <p className="mb-4 leading-relaxed text-zinc-800">{choice.scene}</p>}
    {choice?.dispatcher && <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-red-800">{copy.simulation}</p>
      <blockquote className="mt-1 font-medium">{choice.dispatcher}</blockquote>
    </div>}
    {choice ? <fieldset className="min-w-0" disabled={verified}>
      <legend className="mb-3 text-xl font-semibold">{question.prompt}</legend>
      <div className="grid gap-2">
        {choice.options.map((text, index) => <label key={text}
          className="flex items-start gap-3 rounded-xl border border-zinc-300 p-3 leading-relaxed has-checked:border-red-700 has-checked:bg-red-50">
          <input type="radio" name="final-answer" className="mt-1 size-4 shrink-0 accent-red-700"
            checked={option === index} onChange={() => onResponse({ option: index, correct: null })} />
          <span>{text}</span>
        </label>)}
      </div>
    </fieldset> : <>
      <h2 className="text-xl font-semibold">{question.prompt}</h2>
      <p id="final-placement-instructions" className="mt-2 text-sm leading-relaxed text-zinc-600">{copy.diagramInstructions}</p>
      <svg viewBox="0 0 400 354" role="group" aria-label={question.topic} onClick={placeWithPointer}
        className="mt-3 w-full max-w-md rounded-xl border border-zinc-200 bg-zinc-50">
        <ChestIllustration title={question.topic} highlight={verified} correct={response?.correct === true} />
        <g transform={`translate(${point.x} ${point.y})`} tabIndex={verified ? -1 : 0}
          role="button" aria-disabled={verified} aria-label={copy.marker} aria-describedby="final-placement-instructions"
          onKeyDown={placeWithKeyboard}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-800">
          <g transform="scale(.64)"><InterlockedHands /></g>
          <HeelMarker outline />
        </g>
      </svg>
    </>}
    <Button className="mt-4 min-h-11 bg-red-700 px-5 text-white hover:bg-red-800" disabled={!response || verified} onClick={check}>
      {labels.check}
    </Button>
    <div role="status">
      {verified && <div className={`mt-4 rounded-xl border p-4 text-sm leading-relaxed ${response.correct ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
        <p className="font-semibold">{response.correct ? labels.correct : labels.incorrect}</p>
        {option !== undefined && choice?.optionNotes && <p className="mt-1">{choice.optionNotes[option]}</p>}
        <p className="mt-1">{question.explanation}</p>
      </div>}
    </div>
  </div>
}
