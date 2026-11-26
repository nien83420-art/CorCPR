import { useEffect, useRef, useState, type ReactNode } from "react"
import { ConfidenceScale } from "@/components/learning/course-self-assessment"
import { FinalQuestionPanel, type FinalResponse } from "@/components/learning/final-question-panel"
import { CourseProgressBar, courseSafeArea } from "@/components/learning/course-progress-bar"
import { ResultMetric, ResultsScreen } from "@/components/screens/results-screen"
import { Button } from "@/components/ui/button"
import type { PriorLearning } from "@/lib/course-results"
import type { TrainingRecording } from "@/lib/accounts/training"
import { courseResultsCopy } from "@/lib/course-results-copy"
import { finalQuestions } from "@/lib/final-assessment"
import { translations } from "@/lib/i18n"
import { foundationsCopy } from "@/lib/learning-foundations"
import { scenarioCopy } from "@/lib/learning-scenarios"
import type { Language, SessionResult } from "@/lib/types"

const guidelinesUrl = "https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines"
const primary = "min-h-11 max-w-full whitespace-normal bg-red-700 px-5 text-white hover:bg-red-800"
const secondary = "min-h-11 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100"
type Step = "results" | "confidence" | "test" | "summary"

function ConfidenceComparison({ language, inCourse, after }: {
  language: Language
  inCourse: number | null
  after: number
}) {
  const copy = courseResultsCopy[language]
  return <>
    <dl className="grid gap-2 sm:grid-cols-2">
      <ResultMetric label={copy.inCourse} value={inCourse === null ? copy.unavailable : `${inCourse} / 5`} />
      <ResultMetric label={copy.afterPractice} value={`${after} / 5`} />
    </dl>
    {inCourse !== null && <p className="mt-3 font-medium">{after > inCourse ? copy.higher : after < inCourse ? copy.lower : copy.same}</p>}
    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{copy.subjective}</p>
  </>
}

function TopicList({ title, topics, empty }: { title: string; topics: string[]; empty: string }) {
  return <section className="rounded-xl border border-zinc-200 p-4">
    <h2 className="font-semibold">{title}</h2>
    {topics.length > 0 ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-700">
      {topics.map(topic => <li key={topic}>{topic}</li>)}
    </ul> : <p className="mt-2 text-sm text-zinc-600">{empty}</p>}
  </section>
}

export function CourseResultsFlow({ language, courseProgress, result, learning, onHome, cameraOnly, onSummary, saveActions }: {
  language: Language
  courseProgress?: number
  result: SessionResult
  learning: PriorLearning | null
  onHome: () => void
  cameraOnly?: boolean
  onSummary?: (assessment: NonNullable<TrainingRecording["final"]>) => void
  saveActions?: ReactNode
}) {
  const copy = courseResultsCopy[language]
  const t = translations[language]
  const foundation = foundationsCopy[language]
  const scenario = scenarioCopy[language]
  const questions = finalQuestions[language]
  const [step, setStep] = useState<Step>("results")
  const [index, setIndex] = useState(0)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [responses, setResponses] = useState<Partial<Record<number, FinalResponse>>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const inCourse = learning?.confidence ?? null
  const response = responses[index]
  const checked = response !== undefined && response.correct !== null
  const last = index === questions.length - 1
  const title = { results: t.results.title, confidence: copy.post, test: copy.test, summary: copy.summary }[step]

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [step, index])

  function back() {
    if (step === "summary") setStep("test")
    else if (step === "test" && index > 0) setIndex(index - 1)
    else if (step === "test") setStep("confidence")
    else if (step === "confidence") setStep("results")
  }

  const mastered = questions.filter((_, i) => responses[i]?.correct === true).map(question => question.topic)
  const review = questions.filter((_, i) => responses[i]?.correct === false).map(question => question.topic)

  function advanceTest() {
    if (!last) {
      setIndex(index + 1)
      return
    }
    const answers = questions.flatMap((_, i) => {
      const answer = responses[i]
      return answer && answer.correct !== null ? ["point" in answer ? answer.point : answer.option] : []
    })
    if (confidence === null || answers.length !== questions.length) return
    onSummary?.({ confidence, answers })
    setStep("summary")
  }

  return <main lang={language} className={`min-h-page page-gutter bg-white pb-8 text-zinc-950 [color-scheme:light] ${courseProgress === undefined ? "" : courseSafeArea}`}>
    <div className="mx-auto max-w-6xl">
      <header className={courseProgress === undefined ? "border-b border-zinc-200 py-3 sm:py-5" : "py-2 sm:py-4"}>
        <button type="button" onClick={onHome} aria-label={scenario.home}
          className="min-h-11 rounded text-xl font-bold tracking-tight text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2">CorCpr</button>
      </header>
      {courseProgress !== undefined && <CourseProgressBar language={language} completed={courseProgress} />}
      <div className={`mx-auto py-8 sm:py-12 ${step === "results" ? "max-w-5xl" : "max-w-2xl"}`}>
        <h1 ref={heading} tabIndex={-1} className="text-pretty text-3xl font-semibold tracking-tight outline-none sm:text-5xl">{title}</h1>
        {step === "results" && <ResultsScreen language={language} t={t} result={result} learning={learning} />}
        {cameraOnly && saveActions}

        {step === "confidence" && <div className="mt-6">
          <ConfidenceScale language={language} name="post-confidence" value={confidence}
            onChange={value => { setConfidence(value); setSubmitted(false) }} />
          <Button className={`mt-4 ${primary}`} disabled={confidence === null || submitted} onClick={() => setSubmitted(true)}>
            {copy.submit}
          </Button>
          <div role="status" className="empty:hidden mt-5">
            {submitted && confidence !== null && <ConfidenceComparison language={language} inCourse={inCourse} after={confidence} />}
          </div>
        </div>}

        {step === "test" && <>
          <p className="mt-5 text-sm font-semibold text-red-800">{foundation.quiz.question} {index + 1} / {questions.length}</p>
          <progress max={questions.length} value={index + 1} aria-label={foundation.quiz.question}
            className="mt-2 block h-2 w-full accent-red-700" />
          <FinalQuestionPanel key={index} language={language} question={questions[index]} response={response}
            onResponse={value => setResponses(previous => ({ ...previous, [index]: value }))} />
        </>}

        {step === "summary" && <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <h2 className="font-semibold text-red-900">{copy.knowledge}</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-red-900">{Math.round(mastered.length / questions.length * 100)}%</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <ResultMetric label={copy.total} value={questions.length} />
              <ResultMetric label={copy.right} value={mastered.length} />
              <ResultMetric label={copy.wrong} value={review.length} />
            </dl>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <TopicList title={copy.mastered} topics={mastered} empty={copy.none} />
            <TopicList title={copy.review} topics={review} empty={copy.none} />
          </div>
          {submitted && confidence !== null && <section><ConfidenceComparison language={language} inCourse={inCourse} after={confidence} /></section>}
          <p className="text-sm leading-relaxed text-zinc-800">{review.length > 0 ? copy.reviewAdvice : copy.practiceAdvice}</p>
          <p className="text-sm leading-relaxed text-zinc-600">{copy.certification}</p>
          <a href={guidelinesUrl} target="_blank" rel="noreferrer" className="inline-block text-sm text-red-800 underline underline-offset-2">
            {copy.guidelines}
          </a>
          {saveActions}
        </div>}

        <nav aria-label={foundation.navigation} className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          {step !== "results" && <Button className={secondary} onClick={back}>{foundation.back}</Button>}
          {step === "results" && <Button className={`ml-auto ${primary}`} onClick={cameraOnly ? onHome : () => setStep("confidence")}>
            {cameraOnly ? t.results.restart : foundation.next}
          </Button>}
          {step === "confidence" && <Button className={primary} disabled={!submitted} onClick={() => setStep("test")}>{copy.startTest}</Button>}
          {step === "test" && <Button className={primary} disabled={!checked}
            onClick={advanceTest}>{last ? copy.viewSummary : foundation.next}</Button>}
          {step === "summary" && <Button className={primary} onClick={onHome}>{t.results.restart}</Button>}
        </nav>
      </div>
    </div>
  </main>
}
