import type { Language } from "@/lib/types"
import { accountCopy } from "@/lib/accounts/copy"
import { pilotCopy } from "@/lib/accounts/pilot-copy"
import { enrollInPilot, savePilotPreferences, submitPilotSupport, updatePilotSupport } from "@/lib/accounts/pilot-actions"
import { weekStart, type PilotPreferences, type PilotProgress, type PilotSupport } from "@/lib/accounts/pilot"
import { card, dateTime, Metrics, percent, ReportTableScroll, ScoreChart, table } from "./training-report"
import { accountInput } from "./account-shell"
import { PilotForm } from "./pilot-form"

export function PilotProgressPanel({ data, completed, language, showAttendance = false }: {
  data: PilotProgress; completed: number; language: Language; showAttendance?: boolean
}) {
  const copy = pilotCopy[language]
  const base = accountCopy[language]
  const badges = [data.firstCourse, data.cameraCompleted, completed >= 3, completed >= 5,
    data.modules.length === 7, data.trainingDays >= 2]
  const camera = data.points.flatMap(p => p.camera === null ? [] : [{ date: p.started_at, value: p.camera }])
  const knowledge = data.points.flatMap(p => p.knowledge === null ? [] : [{ date: p.started_at, value: p.knowledge }])
  const maxFrequency = Math.max(1, ...data.frequency.map(row => row.started))
  function delta(points: { value: number }[]) {
    const last = points.at(-1)
    const before = points.at(-2)
    if (!last || !before) return "—"
    const difference = last.value - before.value
    return `${difference > 0 ? "+" : ""}${difference} ${copy.points}`
  }

  return <section className="my-6 space-y-4">
    <h2 className="text-xl font-semibold">{copy.welcome}</h2>
    <Metrics values={[
      [copy.started, data.started],
      [`${copy.latest} · ${base.camera}`, percent(camera.at(-1)?.value)],
      [`${copy.latest} · ${base.knowledge}`, percent(knowledge.at(-1)?.value)],
      [copy.modules, `${data.modules.length} / 7`],
    ]} />
    <div className="grid gap-3 md:grid-cols-2">
      <div><ScoreChart title={base.cameraResult} points={camera} language={language} />
        <p className="mt-1 text-sm text-zinc-600">{copy.change} · {delta(camera)}</p></div>
      <div><ScoreChart title={base.knowledge} points={knowledge} language={language} />
        <p className="mt-1 text-sm text-zinc-600">{copy.change} · {delta(knowledge)}</p></div>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className={card}><h3 className="font-semibold">{copy.modules}</h3>
        <ol className="mt-2 divide-y divide-zinc-100">{copy.moduleNames.map((name, i) =>
          <li key={name} className="flex justify-between gap-3 py-1 text-sm"><span>{name}</span>
            <span className="text-zinc-600">{data.modules.includes(i + 1) ? copy.completed
              : data.modulesStarted.includes(i + 1) ? copy.started : copy.notStarted}</span></li>)}</ol>
      </div>
      <div className={card}><h3 className="font-semibold">{copy.achievements}</h3>
        <ul className="mt-2 divide-y divide-zinc-100">{copy.badges.map((badge, i) =>
          <li key={badge} className="flex justify-between gap-3 py-1 text-sm"><span>{badge}</span>
            <span className={badges[i] ? "font-medium text-red-800" : "text-zinc-600"}>{badges[i] ? copy.earned : copy.pending}</span></li>)}</ul>
      </div>
    </div>
    <figure className={card}><figcaption className="font-semibold">{copy.frequency}</figcaption>
      {data.frequency.length ? <ul className="mt-2 space-y-1">
        {data.frequency.map(({ day, started, completed }) => <li key={day} className="flex flex-wrap items-center gap-2 text-sm">
          <time dateTime={day} className="w-28">{day}</time>
          <span className="relative h-2 w-24 rounded bg-zinc-100" aria-hidden="true">
            <span className="absolute h-2 rounded bg-red-700" style={{ width: `${started * 100 / maxFrequency}%` }} />
          </span>
          <span>{copy.started} {started} · {copy.completed} {completed}</span>
        </li>)}
      </ul> : <p>{base.noData}</p>}
    </figure>
    {showAttendance && <section className={card}>
      <h3 className="font-semibold">{copy.attendance}</h3>
      <Metrics values={[[base.memberSince, dateTime(data.registeredAt, language)], [copy.firstVisit, dateTime(data.firstVisit, language)],
        [copy.lastActivity, dateTime(data.lastActivity, language)], [copy.distinctDays, data.activeDays]]} />
      {data.attendance.length ? <ReportTableScroll label={copy.attendance} className="mt-3">
        <table className={`${table} min-w-[24rem]`}>
          <thead><tr><th scope="col">{base.dates} UTC</th><th scope="col">{copy.visited}</th><th scope="col">{copy.signedIn}</th><th scope="col">{copy.lastActivity}</th></tr></thead>
          <tbody>{data.attendance.map(day => <tr key={day.day}><td>{day.day}</td>
            <td>{dateTime(day.visit, language)}</td><td>{day.signed_in ? "✓" : "—"}</td>
            <td>{dateTime(day.last_seen, language)}</td></tr>)}</tbody>
        </table>
      </ReportTableScroll> : <p>{base.noData}</p>}
    </section>}
  </section>
}

export function PilotEnrollment({ enrolled, language }: { enrolled: boolean; language: Language }) {
  const copy = pilotCopy[language]
  const base = accountCopy[language]
  return <section className={`${card} my-4 space-y-2`}>
    <h2 className="font-semibold">{copy.pilot}</h2>
    <p className="text-sm">{copy.notice}</p><p className="text-sm">{copy.sharing}</p>
    <PilotForm submit={enrollInPilot} label={enrolled ? copy.leave : copy.join} failure={base.operationFailed} success={base.managementSuccess}>
      <input type="hidden" name="choice" value={enrolled ? "leave" : "join"} />
      {!enrolled && <label className="flex items-start gap-2 text-sm"><input required type="checkbox" name="notice" />{copy.consent}</label>}
    </PilotForm>
  </section>
}

export function PilotPlan({ progress, latest, preferences, language }: {
  progress: PilotProgress | null; latest: string | null; preferences: PilotPreferences | null; language: Language
}) {
  const copy = pilotCopy[language]
  const base = accountCopy[language]
  const formProps = { submit: savePilotPreferences, failure: base.operationFailed, success: base.managementSuccess }
  const days = preferences?.reminder_days ?? 0
  const nextPractice = days && preferences ? new Date(
    Math.max(Date.parse(preferences.reminders_since), latest ? Date.parse(latest) : 0) + days * 86_400_000,
  ) : null
  const marked = preferences?.plan_week === weekStart() ? preferences.plan_done : []
  const latestKnowledge = progress?.points.findLast(p => p.knowledge !== null)?.knowledge
  const suggestions = [
    !progress?.firstCourse ? "course" : "camera",
    latestKnowledge !== undefined && latestKnowledge !== null && latestKnowledge < 80 ? "review" : "knowledge",
  ]
  const activityKeys = Object.keys(copy.activities) as Array<keyof typeof copy.activities>
  const orderedActivities = [...suggestions, ...activityKeys.filter(key => !suggestions.includes(key))] as typeof activityKeys
  return <div className="my-6 grid gap-4 md:grid-cols-2">
    <section className={card}><h2 className="font-semibold">{copy.plan}</h2>
      <p className="my-2 text-sm text-zinc-600">{copy.optional}</p>
      <ul className="divide-y divide-zinc-100">{orderedActivities.map(activity => <li key={activity} className="py-2">
        <p className="mb-1 text-sm">{marked.includes(activity) ? "✓ " : ""}{copy.activities[activity]}</p>
        <PilotForm {...formProps} label={marked.includes(activity) ? copy.unmark : copy.mark}>
          <input type="hidden" name="activity" value={activity} />
          <input type="hidden" name="done" value={marked.includes(activity) ? "no" : "yes"} />
        </PilotForm>
      </li>)}</ul>
    </section>
    <section className={card}><h2 className="font-semibold">{copy.reminders}</h2>
      <p className="my-2 text-sm" role="status">{nextPractice
        ? `${nextPractice.getTime() <= Date.now() ? copy.due : copy.next} · ${dateTime(nextPractice.toISOString(), language)}` : copy.off}</p>
      <PilotForm {...formProps} label={copy.save}>
        <label className="block text-sm">{copy.every}<select className={accountInput} name="frequency" defaultValue={days}>
          {[0,3,7,14,30].map(day => <option key={day} value={day}>{day || copy.off}</option>)}
        </select></label>
      </PilotForm>
    </section>
  </div>
}

export function PilotSupportPanel({ requests, language, admin = false }: {
  requests: PilotSupport[]; language: Language; admin?: boolean
}) {
  const copy = pilotCopy[language]
  const base = accountCopy[language]
  return <section className={`${card} my-6 space-y-4`}>
    <h2 className="font-semibold">{copy.support}</h2>
    {!admin && <PilotForm submit={submitPilotSupport} requestId label={copy.send} failure={base.operationFailed} success={base.managementSuccess}>
      <select className={accountInput} name="kind" aria-label={copy.support}>
        {Object.entries(copy.supportKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <label className="block text-sm">{copy.message}
        <textarea className={accountInput} name="message" required minLength={5} maxLength={2000} rows={4} />
      </label>
    </PilotForm>}
    {requests.length === 0 ? <p>{copy.noTickets}</p> : <ul className="divide-y divide-zinc-200">
      {requests.map(request => <li key={request.id} className="space-y-1 py-3">
        <p className="text-sm font-medium">{copy.supportKinds[request.kind]} · {copy.supportStatus[request.status]} · {dateTime(request.updated_at, language)}</p>
        <p className="whitespace-pre-wrap break-words text-sm">{request.message}</p>
        {admin && <PilotForm label={copy.save} submit={updatePilotSupport} failure={base.operationFailed} success={base.managementSuccess}>
          <input type="hidden" name="id" value={request.id} />
          <select className={accountInput} name="status" defaultValue={request.status} aria-label={copy.support}>
            {Object.entries(copy.supportStatus).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </PilotForm>}
      </li>)}
    </ul>}
  </section>
}
