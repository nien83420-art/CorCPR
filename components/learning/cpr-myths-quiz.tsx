import { ArrowRight, Check, ChevronDown, Info } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { adultBlsGuidelinesUrl, foundationsCopy, quizChoices, quizKeys, type QuizChoice } from "@/lib/learning-foundations"
import type { QuizAttempt } from "@/lib/quiz-draft"
import type { Language } from "@/lib/types"

export function CprMythsQuiz({ language, attempt, back, next, choose }: {
  language: Language
  attempt: QuizAttempt
  back: () => void
  next: () => void
  choose: (choice: QuizChoice) => void
}) {
  const { quiz, back: backLabel, next: nextLabel, navigation } = foundationsCopy[language]
  const { index, answers } = attempt
  const total = quizKeys.length
  const complete = index === total
  const question = quiz.questions[index]
  const selected = answers[index]
  const answer = quizKeys[index]?.choice
  const correct = selected === answer
  const missed = answers.flatMap((choice, i) => choice === quizKeys[i].choice ? [] : [i])
  const heading = useRef<HTMLHeadingElement>(null)
  const statement = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    (statement.current ?? heading.current)?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [index])

  return <section aria-labelledby="learning-heading" className="mx-auto max-w-2xl pb-6 pt-7 sm:pt-12">
    <h1 ref={heading} tabIndex={-1} id="learning-heading" className="text-[clamp(1.875rem,8.5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.045em] outline-none">
      {complete ? quiz.complete : quiz.title}
    </h1>
    {!complete && <p className="mt-2 text-base leading-relaxed text-zinc-700">{quiz.instructions}</p>}
    <div className="mt-5 grid grid-cols-4 gap-1.5" role="progressbar" aria-label={quiz.questionProgress}
      aria-valuemin={0} aria-valuemax={total} aria-valuenow={answers.length}>
      {quizKeys.map((_, i) => <span key={i} aria-hidden="true"
        className={`h-1.5 rounded-full ${i < answers.length ? "bg-red-700" : i === index ? "bg-red-200" : "bg-zinc-200"}`} />)}
    </div>

    {complete ? (
      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:p-6">
        <p className="text-3xl leading-tight font-bold tracking-tight text-red-700">
          {quiz.score(total - missed.length, total)}
        </p>
        <p className="mt-2 leading-relaxed text-zinc-700">{quiz.closing}</p>
        {missed.length > 0 && <details className="group mt-4 rounded-xl border border-zinc-200 bg-white">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 [&::-webkit-details-marker]:hidden">
            {quiz.review}<ChevronDown aria-hidden="true" className="size-4 shrink-0 text-red-700 group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-zinc-200 px-3 text-sm leading-relaxed text-zinc-700">
            {missed.map(i => <li key={i} className="py-3">
              <p className="font-semibold text-zinc-950">{quiz.questions[i].statement}</p>
              <p className="mt-1">{quiz.selected} — {quiz.choices[answers[i]]}. {quiz.feedbackCorrection} — {quiz.choices[quizKeys[i].choice]}.</p>
              <p className="mt-1">{quiz.questions[i].explanation}</p>
            </li>)}
          </ul>
        </details>}
      </div>
    ) : (
      <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:p-6">
        <p className="text-sm font-semibold text-red-700">{quiz.question} {index + 1} / {total}</p>
        <h2 ref={statement} id="quiz-statement" tabIndex={-1} className="mt-2 text-[clamp(1.25rem,5.1vw,1.875rem)] leading-tight font-bold tracking-tight break-words outline-none">
          {question.statement}
        </h2>
        <div role="group" aria-labelledby="quiz-statement" className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          {quizChoices.map(choice => <button key={choice} type="button" aria-pressed={selected === choice}
            aria-disabled={selected !== undefined} onClick={() => choose(choice)}
            className="min-h-12 cursor-pointer rounded-xl border border-zinc-200 bg-white px-2 py-2 text-base font-semibold text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 hover:border-red-700 aria-disabled:cursor-default aria-disabled:hover:border-zinc-200 aria-pressed:border-red-700 aria-pressed:bg-red-100 aria-pressed:text-red-900 aria-pressed:hover:border-red-700">
            {quiz.choices[choice]}
          </button>)}
        </div>
        <div role="status" aria-atomic="true">
          {selected !== undefined && <div className={`mt-3 rounded-xl border p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:p-4 ${correct ? "border-green-200 bg-green-50" : "border-red-200 bg-white"}`}>
            <p className={`flex items-center gap-2 text-sm font-semibold ${correct ? "text-green-800" : "text-red-800"}`}>
              {correct ? <Check aria-hidden="true" className="size-4 shrink-0" /> : <Info aria-hidden="true" className="size-4 shrink-0" />}
              {correct ? quiz.feedbackCorrect : `${quiz.feedbackCorrection} — ${quiz.choices[answer]}.`}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-700">{question.explanation}</p>
          </div>}
        </div>
      </div>
    )}
    <nav aria-label={navigation} className="mt-4 flex flex-wrap items-center justify-between gap-2">
      <Button onClick={back} className="min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100">{backLabel}</Button>
      <Button onClick={next} disabled={!complete && selected === undefined} className="min-h-11 gap-2 bg-red-700 px-4 text-white hover:bg-red-800 sm:px-6">
        {complete ? quiz.continueCourse : nextLabel}<ArrowRight aria-hidden="true" />
      </Button>
    </nav>
    <a href={adultBlsGuidelinesUrl} target="_blank" rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-11 items-center text-sm text-zinc-600 underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
      {quiz.guidelines}
    </a>
  </section>
}
