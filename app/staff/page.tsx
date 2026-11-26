import Link from "next/link"
import { redirect } from "next/navigation"
import { AccountShell, accountInput, accountSecondary } from "@/components/accounts/account-shell"
import { PilotCohortPanel } from "@/components/accounts/pilot-cohort"
import { PilotProgressPanel, PilotSupportPanel } from "@/components/accounts/pilot-profile"
import { pilotCopy } from "@/lib/accounts/pilot-copy"
import { pilotPeriod, supportFields, type PilotCohort, type PilotProgress, type PilotSupport } from "@/lib/accounts/pilot"
import { StaffManagement } from "@/components/accounts/staff-management"
import { card, dateTime, duration, percent, ReportTableScroll, SessionDetails, table, TrainingHistory, TrainingOverview } from "@/components/accounts/training-report"
import { accountLanguage, languageQuery } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import { readTraining, reportPage } from "@/lib/accounts/reporting"
import { getAccountAccess, verifiedAccount } from "@/lib/accounts/server"
import { isUuid } from "@/lib/accounts/training"

type DirectoryRow = {
  user_id: string; display_name: string; last_login: string | null; last_activity: string | null
  completed: number; active_seconds: number; camera_score: number | null
  final_correct: number | null; final_total: number | null; course_completed: boolean
}
export default async function StaffPage({ searchParams }: { searchParams: Promise<{
  lang?: string; student?: string; search?: string; days?: string; from?: string; to?: string; directory?: string; page?: string; session?: string
}> }) {
  const params = await searchParams
  const language = accountLanguage(params.lang)
  const copy = accountCopy[language]
  const pilot = pilotCopy[language]
  const query = languageQuery(language)
  const account = await verifiedAccount()
  const access = account ? await getAccountAccess(account.client) : null
  if (!account || !access || access.role === "student" || access.mfaRequired) redirect(`/account${query}`)
  const client = account.client
  const admin = access.role === "admin"
  const search = typeof params.search === "string" ? params.search.trim().slice(0, 80) : ""
  const days = params.days === "7" ? 7 : params.days === "90" ? 90 : 30
  const directoryPage = Math.min(800, reportPage(params.directory))
  const page = reportPage(params.page)
  const { from, to } = pilotPeriod(params.from, params.to, days)
  const base = `/staff${query}&from=${from}&to=${to}&search=${encodeURIComponent(search)}`
  const [directory, aggregate, rosterEntry, requests, invitations, assignments, support] = await Promise.all([
    client.rpc("pilot_directory", { p_search: search, p_offset: 25 * directoryPage }),
    client.rpc("pilot_cohort", { p_from: from, p_to: to }),
    isUuid(params.student) ? client.rpc("pilot_roster").eq("user_id", params.student).maybeSingle() : null,
    admin ? client.from("account_deletion_requests").select("user_id,requested_at").order("requested_at", { ascending: false }).limit(25) : null,
    admin ? client.from("staff_invitations").select("id,invitee_id,status,expires_at").order("created_at", { ascending: false }).limit(25) : null,
    admin ? client.from("staff_student_assignments").select("staff_id,student_id,revoked_at").is("revoked_at", null).limit(50) : null,
    admin ? client.from("pilot_support").select(supportFields).order("updated_at", { ascending: false }).limit(50) : null,
  ])
  const students = (directory.data ?? []) as DirectoryRow[]
  const metrics = aggregate.data as PilotCohort | null
  const selected = rosterEntry?.data ? params.student : undefined
  const [selectedProfile, training, completed, progress] = selected ? await Promise.all([
    client.from("user_profiles").select("display_name").eq("user_id", selected).maybeSingle(),
    readTraining(client, selected, page, isUuid(params.session) ? params.session : undefined),
    client.from("initial_course_completions").select("completed_at").eq("user_id", selected).maybeSingle(),
    client.rpc("pilot_progress", { p_user: selected }),
  ]) : [null, null, null, null]
  const detailed = selectedProfile?.data && training && !completed?.error
  const path = `${base}&directory=${directoryPage}`

  return <AccountShell language={language} title={admin ? copy.admin : copy.staff}>
    <Link className={accountSecondary} href={`/account${query}`}>{copy.account}</Link>
    <p className="my-4 max-w-2xl text-zinc-700">{copy.staffScope}</p>
    {(directory.error || aggregate.error || requests?.error || invitations?.error || assignments?.error || support?.error || progress?.error) &&
      <p role="alert" className="my-3 text-red-800">{copy.operationFailed}</p>}
    <form className="mb-4 grid max-w-4xl grid-cols-1 items-end gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" action="/staff">
      <input type="hidden" name="lang" value={language} />
      <label className="min-w-0 min-[360px]:col-span-2 sm:col-span-1">{copy.search}<input name="search" defaultValue={search} maxLength={80} className={accountInput} /></label>
      <label className="min-w-0">{pilot.from}<input required name="from" type="date" defaultValue={from} className={accountInput} /></label>
      <label className="min-w-0">{pilot.to}<input required name="to" type="date" defaultValue={to} className={accountInput} /></label>
      <button className={`${accountSecondary} justify-self-start`}>{copy.search}</button>
    </form>
    {metrics && <PilotCohortPanel data={metrics} from={from} to={to} language={language} />}
    <section className="my-5 space-y-3">
      <h2 className="text-xl font-semibold">{copy.roster}</h2>
      {students.length === 0 ? <p>{copy.noData}</p> : <ReportTableScroll label={copy.roster}>
        <table className={`${table} min-w-[46rem]`}>
          <thead className="bg-zinc-50"><tr>{[copy.name, copy.lastLogin, copy.lastActivity, copy.completed,
            copy.duration, copy.cameraResult, copy.knowledge, copy.course].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{students.slice(0, 25).map(student => <tr key={student.user_id}>
            <td><Link className="text-red-800 underline" href={`${path}&student=${student.user_id}#student-detail`}>
              {student.display_name || student.user_id}
            </Link></td>
            <td>{dateTime(student.last_login, language)}</td><td>{dateTime(student.last_activity, language)}</td>
            <td>{student.completed}</td><td>{duration(student.active_seconds, language)}</td>
            <td>{percent(student.camera_score)}</td><td>{student.final_total && student.final_correct !== null
              ? `${student.final_correct} / ${student.final_total}` : "—"}</td>
            <td>{student.course_completed ? copy.enrolled : copy.required}</td>
          </tr>)}</tbody>
        </table>
      </ReportTableScroll>}
      <nav className="flex gap-4 text-sm text-red-800 underline">
        {directoryPage > 0 && <Link href={`${base}&directory=${directoryPage - 1}`}>← {directoryPage}</Link>}
        {students.length > 25 && <Link href={`${base}&directory=${directoryPage + 1}`}>{directoryPage + 2} →</Link>}
      </nav>
    </section>
    {params.student && !detailed && <p className="text-zinc-700">{copy.selection}</p>}
    {detailed && selectedProfile && training && <section id="student-detail" className="my-6 border-t border-zinc-200 pt-5">
      <h2 className="mb-3 text-xl font-semibold">{selectedProfile.data?.display_name || selected}</h2>
      <TrainingOverview language={language} overview={training.overview} courseCompleted={Boolean(completed?.data)} />
      <TrainingHistory language={language} sessions={training.sessions} path={`${path}&student=${selected}`} page={page} more={training.more} showCharts={!progress?.data} />
      {!!progress?.data && <PilotProgressPanel data={progress.data as PilotProgress} completed={training.overview.completed} language={language} showAttendance />}
      {training.detail && <SessionDetails language={language} session={training.detail} />}
    </section>}
    {admin && !support?.error && <PilotSupportPanel admin requests={(support?.data ?? []) as PilotSupport[]} language={language} />}
    {admin && <section className={`${card} mt-6 space-y-4`}>
      <h2 className="text-xl font-semibold">{copy.actions}</h2>
      <StaffManagement language={language} />
      {!!invitations?.data?.length && <ReportTableScroll label={copy.invitationId}>
        <table className={`${table} min-w-[34rem]`}><thead><tr><th scope="col">{copy.invitationId}</th><th scope="col">{copy.identifier}</th>
          <th scope="col">{copy.dates}</th></tr></thead>
          <tbody>{invitations.data.map(invite => <tr key={invite.id}><td><code>{invite.id}</code></td>
            <td><code>{invite.invitee_id}</code></td><td>{dateTime(invite.expires_at, language)} · {invite.status}</td></tr>)}</tbody>
        </table>
      </ReportTableScroll>}
      {!!assignments?.data?.length && <ReportTableScroll label={copy.actions}>
        <table className={`${table} min-w-[28rem]`}><thead><tr><th scope="col">{copy.staffId}</th><th scope="col">{copy.studentId}</th></tr></thead>
          <tbody>{assignments.data.map(assignment => <tr key={`${assignment.staff_id}:${assignment.student_id}`}>
            <td><code>{assignment.staff_id}</code></td><td><code>{assignment.student_id}</code></td></tr>)}</tbody>
        </table>
      </ReportTableScroll>}
      <div>
        <h3 className="font-semibold">{copy.dataRequests}</h3>
        {requests?.data?.length ? <ul className="mt-2 list-disc space-y-1 pl-5">
          {requests.data.map(request => <li key={request.user_id}><code>{request.user_id}</code> · {dateTime(request.requested_at, language)}</li>)}
        </ul> : <p className="mt-1 text-sm text-zinc-700">{copy.noData}</p>}
      </div>
    </section>}
  </AccountShell>
}
