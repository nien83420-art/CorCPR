import Link from "next/link"
import type { ReactNode } from "react"
import { accountCopy } from "@/lib/accounts/copy"
import { courseResultsCopy } from "@/lib/course-results-copy"
import { selfAssessmentCopy } from "@/lib/course-self-assessment"
import { finalQuestions } from "@/lib/final-assessment"
import { translations } from "@/lib/i18n"
import type { Assessment, Overview, TrainingRow } from "@/lib/accounts/reporting"
import type { Language } from "@/lib/types"
import { pilotCopy } from "@/lib/accounts/pilot-copy"

export const card = "min-w-0 rounded-xl border border-zinc-200 bg-white p-4"
export const table = "w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:px-2 [&_td]:py-2 [&_th]:px-2 [&_th]:py-2 sm:[&_td]:px-3 sm:[&_th]:px-3"
const locales = { en: "en-GB", ru: "ru-RU", kk: "kk-KZ" } as const

export function ReportTableScroll({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div role="region" aria-label={label} tabIndex={0}
    className={`min-w-0 max-w-full overflow-auto rounded-lg border border-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}>
    {children}
  </div>
}

export function dateTime(value: string | null, language: Language) {
  return value ? new Intl.DateTimeFormat(locales[language], { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC" : "—"
}

export function duration(seconds: number, language: Language) {
  const units = {
    en: ["h", "min", "s"], ru: ["ч", "мин", "с"], kk: ["сағ", "мин", "с"],
  }[language]
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor(seconds % 3600 / 60)
  return `${hours ? `${hours} ${units[0]} ` : ""}${mins ? `${mins} ${units[1]} ` : ""}${seconds % 60} ${units[2]}`
}

export function percent(value: number | null | undefined) {
  return value == null ? "—" : `${value}%`
}

function assessmentScore(value?: Assessment) {
  return value ? Math.round(100 * value.correct_count / value.question_count) : null
}

function sessionStatus(session: TrainingRow, language: Language) {
  const copy = accountCopy[language]
  if (session.status === "completed") return copy.completed
  if (session.status === "interrupted" || Date.now() - Date.parse(session.activity_at) > 120_000) return copy.interrupted
  return copy.inProgress
}

export function Metrics({ values }: { values: ReadonlyArray<[string, string | number]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {values.map(([label, value]) => <div key={label} className={card}>
      <dt className="text-sm text-zinc-600">{label}</dt><dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>)}
  </dl>
}

export function TrainingOverview({ language, overview, courseCompleted }: {
  language: Language; overview: Overview; courseCompleted: boolean
}) {
  const copy = accountCopy[language]
  return <Metrics values={[
    [copy.completed, overview.completed], [copy.duration, duration(overview.seconds, language)],
    [copy.lastTraining, dateTime(overview.latest, language)], [copy.course, courseCompleted ? copy.enrolled : copy.required],
  ]} />
}

export function ScoreChart({ title, points, language }: {
  title: string; points: { date: string; value: number }[]; language: Language
}) {
  const copy = accountCopy[language]
  const chart = points.map((point, i) => ({ ...point, x: 14 + i * 252 / Math.max(1, points.length - 1), y: 85 - 0.72 * point.value }))
  return <figure className={card}>
    <figcaption className="font-semibold">{title}</figcaption>
    {points.length < 2 ? <p className="mt-2 text-sm text-zinc-600">{points.length ? copy.fewData : copy.noData}</p> : <>
      <svg viewBox="0 0 280 100" className="mt-3 block h-auto max-h-44 w-full" aria-hidden="true">
        {[13, 49, 85].map(y => <path key={y} d={`M14 ${y}H266`} stroke="#e4e4e7" />)}
        <polyline fill="none" stroke="#b91c1c" strokeWidth="2.5" points={chart.map(({ x, y }) => `${x},${y}`).join(" ")} />
        {chart.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="3.5" fill="#b91c1c"><title>{percent(point.value)} · {dateTime(point.date, language)}</title></circle>)}
      </svg>
      <ol className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-700">
        {points.map(({ date, value }, i) => <li key={i}><time dateTime={date}>{new Intl.DateTimeFormat(locales[language], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(date))}</time> · {percent(value)}</li>)}
      </ol>
    </>}
  </figure>
}

export function SessionDetails({ session, language }: { session: TrainingRow; language: Language }) {
  const copy = accountCopy[language]
  const { inCourse, afterPractice } = courseResultsCopy[language]
  const selfAssessment = session.self_assessments
  const camera = session.camera_training_results
  const intro = session.knowledge_assessment_attempts.find(attempt => attempt.assessment === "intro")
  const final = session.knowledge_assessment_attempts.find(attempt => attempt.assessment === "final")
  const prompts = finalQuestions[language]
  const review = session.knowledge_assessment_answers
    .filter(answer => answer.assessment === "final" && !answer.is_correct)
    .map(answer => prompts[Number(answer.question_id.replace("final-", ""))]?.topic).filter(Boolean)
  return <section className="my-6 space-y-3" id="session-details">
    <h2 className="text-xl font-semibold">{copy.details} · {dateTime(session.started_at, language)}</h2>
    {session.ended_at && <p className="text-sm text-zinc-700">{copy.completed} · {dateTime(session.ended_at, language)}</p>}
    <Metrics values={[
      [copy.duration, duration(session.active_seconds, language)],
      [copy.repetitions, camera ? `${camera.repetitions} / ${camera.target_repetitions}` : "—"],
      [copy.rhythm, percent(camera?.rhythm_score)], [copy.technique, percent(camera?.technique_score)],
      [copy.lastCadence, camera?.last_cadence ?? "—"], [copy.cameraResult, percent(camera?.overall_score)],
      [copy.intro, intro ? `${intro.correct_count} / ${intro.question_count}` : "—"],
      [copy.knowledge, final ? `${final.correct_count} / ${final.question_count}` : "—"],
    ]} />
    {selfAssessment && <section className={card}>
      <h3 className="font-semibold">{copy.confidence}</h3>
      <dl className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-zinc-600">{inCourse}</dt><dd>{selfAssessment.initial_confidence}/5</dd></div>
        <div><dt className="text-zinc-600">{afterPractice}</dt><dd>{selfAssessment.final_confidence === null ? "—" : `${selfAssessment.final_confidence}/5`}</dd></div>
        {selfAssessment.experience_category && <div><dt className="text-zinc-600">{copy.cprExperience}</dt>
          <dd>{selfAssessmentCopy[language].levels[selfAssessment.experience_category]}</dd></div>}
        {selfAssessment.initial_recorded_at && <div><dt className="text-zinc-600">{copy.selfAssessmentRecorded}</dt>
          <dd><time dateTime={selfAssessment.initial_recorded_at}>{dateTime(selfAssessment.initial_recorded_at, language)}</time></dd></div>}
      </dl>
    </section>}
    {session.learning_progress && <div className={card}><h3 className="font-semibold">{copy.milestones}</h3>
      <ul className="mt-1 list-disc pl-5"><li>{copy.preparation}</li>
        {session.learning_progress.final_assessment_at && <li>{copy.finalAssessment}</li>}
      </ul></div>}
    {review.length > 0 && <div className={card}><h3 className="font-semibold">{copy.review}</h3><ul className="mt-1 list-disc pl-5">
      {review.map((topic, index) => <li key={index}>{topic}</li>)}
    </ul></div>}
    {camera?.tips.length ? <ul className="list-disc pl-5 text-sm text-zinc-700">
      {camera.tips.map(tip => <li key={tip}>{translations[language].results[tip]}</li>)}
    </ul> : null}
  </section>
}

export function TrainingHistory({ language, sessions, page, more, path, showCharts = true }: {
  language: Language; sessions: TrainingRow[]; page: number; more: boolean; path: string; showCharts?: boolean
}) {
  const copy = accountCopy[language]
  const { inCourse, afterPractice } = courseResultsCopy[language]
  const points = [...sessions].reverse()
  const camera = points.flatMap(row => row.camera_training_results?.overall_score == null ? [] :
    [{ date: row.started_at, value: row.camera_training_results.overall_score }])
  const knowledge = points.flatMap(row => {
    const score = assessmentScore(row.knowledge_assessment_attempts.find(entry => entry.assessment === "final"))
    return score === null ? [] : [{ date: row.started_at, value: score }]
  })
  const latestConfidence = sessions.find(row => row.self_assessments?.final_confidence != null)?.self_assessments

  return <div className="my-6 space-y-4">
    <h2 className="text-xl font-semibold">{copy.sessions}</h2>
    {sessions.length === 0 ? <p>{copy.noData}</p> : <ReportTableScroll label={copy.sessions}>
      <table className={`${table} min-w-[32rem]`}>
        <thead className="bg-zinc-50"><tr>{[copy.dates, copy.duration, copy.repetitions, copy.cameraResult, copy.knowledge].map(item => <th key={item} scope="col">{item}</th>)}</tr></thead>
        <tbody>{sessions.map(row => <tr key={row.id}>
          <td><Link className="font-medium text-red-800 underline" href={`${path}&page=${page}&session=${row.id}#session-details`}>{dateTime(row.started_at, language)}</Link>
            <p className="text-zinc-700">{row.training_type === "course" ? copy.course : copy.camera} · {sessionStatus(row, language)}</p>
            {row.ended_at && <p className="text-zinc-600">{pilotCopy[language].completed} · {dateTime(row.ended_at, language)}</p>}
          </td>
          <td>{duration(row.active_seconds, language)}</td>
          <td>{row.camera_training_results?.repetitions ?? "—"}</td>
          <td>{percent(row.camera_training_results?.overall_score)}</td>
          <td>{percent(assessmentScore(row.knowledge_assessment_attempts.find(entry => entry.assessment === "final")))}</td>
        </tr>)}</tbody>
      </table>
    </ReportTableScroll>}
    {latestConfidence && <p>{copy.confidence} · {inCourse} {latestConfidence.initial_confidence}/5 · {afterPractice} {latestConfidence.final_confidence}/5</p>}
    <nav className="flex gap-4 text-sm text-red-800 underline">
      {page > 0 && <Link href={`${path}&page=${page - 1}`}>← {page}</Link>}
      {more && <Link href={`${path}&page=${page + 1}`}>{page + 2} →</Link>}
    </nav>
    {showCharts && page === 0 && <section>
      <h2 className="mb-3 text-xl font-semibold">{copy.progress}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreChart title={copy.cameraResult} points={camera} language={language} />
        <ScoreChart title={copy.knowledge} points={knowledge} language={language} />
      </div>
    </section>}
    <p className="text-sm text-zinc-600">{copy.limitations}</p>
  </div>
}
