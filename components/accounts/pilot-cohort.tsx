import Link from "next/link"
import type { Language } from "@/lib/types"
import { pilotCopy } from "@/lib/accounts/pilot-copy"
import { accountCopy } from "@/lib/accounts/copy"
import type { PilotCohort } from "@/lib/accounts/pilot"
import { accountSecondary } from "./account-shell"
import { card, dateTime, duration, Metrics, percent, ReportTableScroll, table } from "./training-report"

function fraction(value: number, denominator: number) {
  return denominator ? `${value} / ${denominator} · ${Math.round(value * 100 / denominator)}%` : `${value} / 0 · —`
}

export function PilotCohortPanel({ data, from, to, language }: {
  data: PilotCohort; from: string; to: string; language: Language
}) {
  const copy = pilotCopy[language]
  const base = accountCopy[language]
  const values = [
    data.registered, data.courseStarted, data.firstCourseCompleted, data.cameraStarted,
    data.returned, data.dailyActive, data.weeklyActive, data.completed,
    data.registered ? (data.completed / data.registered).toFixed(1) : "—",
    data.trainingParticipants ? (data.completed / data.trainingParticipants).toFixed(1) : "—",
    duration(data.activeSeconds, language),
  ]
  const rates = [[data.courseStarted, data.registered], [data.firstCourseCompleted, data.courseStarted],
    [data.secondSession, data.firstCourseCompleted]]
  return <section className="my-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-semibold">{copy.cohort}</h2>
      <Link className={accountSecondary} href={`/staff/pilot.csv?from=${from}&to=${to}`}>{copy.csv}</Link>
    </div>
    <p className="text-sm text-zinc-600">{from} — {to} · {copy.methodology}</p>
    <Metrics values={copy.cohortLabels.map((label, i) => [label, values[i]])} />
    <p className="text-sm">{copy.lastActivity} · {dateTime(data.latest, language)}</p>
    <Metrics values={copy.conversion.map((label, i) => [label, fraction(...rates[i] as [number,number])])} />
    <Metrics values={data.retention.map(row => [`${copy.retained} ${row.offset_day}`,
      `${fraction(row.retained, row.eligible)} (${copy.eligible.toLowerCase()})`])} />
    <div className="grid gap-3 md:grid-cols-2">
      {[{ title: copy.daily, rows: data.daily.map(row => ({ ...row, date: row.day })) },
        { title: copy.weekly, rows: data.weekly.map(row => ({ ...row, date: row.week })) }].map(({ title, rows }) =>
        <div key={title} className={card}>
          <h3 className="mb-2 font-semibold">{title}</h3>
          <ReportTableScroll label={title} className="max-h-44">
            <table className={`${table} min-w-[16rem]`}><thead><tr><th scope="col">{base.dates}</th><th scope="col">{base.active}</th><th scope="col">{base.completed}</th></tr></thead>
              <tbody>{[...rows].reverse().map(row => <tr key={row.date}><td>{row.date}</td><td>{row.active}</td><td>{row.completed}</td></tr>)}</tbody>
            </table>
          </ReportTableScroll>
        </div>)}
      {[{ title: base.cameraResult, rows: data.camera }, { title: base.knowledge, rows: data.knowledge }].map(({ title, rows }) =>
        <div key={title} className={card}>
          <h3 className="mb-2 font-semibold">{title}</h3>
          {rows.length ? <ReportTableScroll label={title} className="max-h-44">
            <table className={`${table} min-w-[16rem]`}><thead><tr><th scope="col">{base.dates}</th><th scope="col">{copy.score}</th><th scope="col">{copy.samples}</th></tr></thead>
              <tbody>{[...rows].reverse().map(row => <tr key={row.week}><td>{row.week}</td><td>{percent(row.score)}</td><td>{row.samples}</td></tr>)}</tbody>
            </table>
          </ReportTableScroll> : <p>{base.noData}</p>}
        </div>)}
    </div>
  </section>
}
