import Link from "next/link"
import { redirect } from "next/navigation"
import { AccountShell, accountSecondary } from "@/components/accounts/account-shell"
import { MfaForm } from "@/components/accounts/account-forms"
import { PilotEnrollment, PilotPlan, PilotProgressPanel, PilotSupportPanel } from "@/components/accounts/pilot-profile"
import { PilotVisit } from "@/components/accounts/pilot-visit"
import { DeletionForm, InviteResponse, ProfileForm, RetryTransfer } from "@/components/accounts/profile-forms"
import { card, dateTime, SessionDetails, TrainingHistory, TrainingOverview } from "@/components/accounts/training-report"
import { accountLanguage, languageQuery } from "@/lib/accounts/account"
import { logout } from "@/lib/accounts/auth-actions"
import { accountCopy } from "@/lib/accounts/copy"
import { hasGuestRecording } from "@/lib/accounts/guest"
import { readTraining, reportPage } from "@/lib/accounts/reporting"
import { getAccountAccess, verifiedAccount } from "@/lib/accounts/server"
import { isUuid } from "@/lib/accounts/training"
import { supportFields, type PilotPreferences, type PilotProgress, type PilotSupport } from "@/lib/accounts/pilot"

export default async function AccountPage({ searchParams }: { searchParams: Promise<{
  lang?: string; page?: string; session?: string; transfer?: string; error?: string
}> }) {
  const params = await searchParams
  const language = accountLanguage(params.lang)
  const copy = accountCopy[language]
  const query = languageQuery(language)
  const account = await verifiedAccount()
  if (!account) redirect(`/auth${query}`)
  const { client, user } = account
  const page = reportPage(params.page)
  const [access, profile, history, invitations, deletion, pendingGuest, progress, enrollment, preferences, support] = await Promise.all([
    getAccountAccess(client),
    client.from("user_profiles").select("display_name,sharing_enabled_at").eq("user_id", user.id).maybeSingle(),
    readTraining(client, user.id, page, isUuid(params.session) ? params.session : undefined),
    client.from("staff_invitations").select("id").eq("invitee_id", user.id).eq("status", "pending")
      .gt("expires_at", new Date().toISOString()).maybeSingle(),
    client.from("account_deletion_requests").select("requested_at").eq("user_id", user.id).maybeSingle(),
    hasGuestRecording(),
    client.rpc("pilot_progress", { p_user: user.id }),
    client.from("pilot_enrollments").select("withdrawn_at").eq("user_id", user.id).maybeSingle(),
    client.from("pilot_preferences").select("reminder_days,reminders_since,plan_week,plan_done").eq("user_id", user.id).maybeSingle(),
    client.from("pilot_support").select(supportFields).eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ])
  const factors = access?.mfaRequired ? (await client.auth.mfa.listFactors()).data : null

  return <AccountShell language={language} title={profile.data?.display_name || copy.account}>
    {enrollment.data && !enrollment.data.withdrawn_at && <PilotVisit userId={user.id} />}
    <nav className="mb-5 flex flex-wrap gap-2">
      <Link className={accountSecondary} href={`/${query}`}>{copy.home}</Link>
      {access && access.role !== "student" && !access.mfaRequired && <Link className={accountSecondary}
        href={`/staff${query}`}>{access.role === "admin" ? copy.admin : copy.staff}</Link>}
      <form action={logout}><input type="hidden" name="lang" value={language} />
        <button className={accountSecondary}>{copy.logout}</button>
      </form>
    </nav>
    {(!access || !history || profile.error || invitations.error || deletion.error || params.error) &&
      <p className="mb-4 text-red-800" role="alert">{copy.operationFailed}</p>}
    {params.transfer === "saved" && <p className="mb-4" role="status">{copy.saved}</p>}
    {params.transfer === "failed" && <p className="mb-4 text-red-800" role="alert">{copy.saveFailed}</p>}
    {pendingGuest && <section className={`${card} mb-4`}><RetryTransfer language={language} /></section>}
    {invitations.data && <section className={`${card} mb-4`}><InviteResponse language={language} id={invitations.data.id} /></section>}
    {access?.mfaRequired && <section className={`${card} mb-4`}>
      <h2 className="mb-2 text-xl font-semibold">{copy.mfa}</h2>
      <MfaForm language={language} factor={factors?.totp.find(factor => factor.status === "verified")?.id} />
    </section>}
    <h2 className="mb-3 text-xl font-semibold">{copy.overview}</h2>
    <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
      <div><dt className="font-medium">{copy.memberSince}</dt><dd>{dateTime(user.created_at, language)}</dd></div>
      <div><dt className="font-medium">{copy.identifier}</dt><dd><code>{user.id}</code></dd></div>
    </dl>
    {history && access && <TrainingOverview language={language} overview={history.overview} courseCompleted={access.courseCompleted} />}
    {access && access.role === "student" && !access.courseCompleted && <p className="mt-3 text-zinc-700">{copy.finishCourse}</p>}
    {history && <>
      <TrainingHistory language={language} sessions={history.sessions} path={`/account${query}`} page={page} more={history.more} showCharts={!progress.data} />
      {history.detail && <SessionDetails language={language} session={history.detail} />}
    </>}
    {(progress.error || enrollment.error || preferences.error || support.error) &&
      <p className="my-3 text-red-800" role="alert">{copy.operationFailed}</p>}
    {!!progress.data && history && <PilotProgressPanel data={progress.data as PilotProgress} completed={history.overview.completed} language={language} />}
    {access?.role === "student" && !enrollment.error &&
      <PilotEnrollment language={language} enrolled={Boolean(enrollment.data && !enrollment.data.withdrawn_at)} />}
    {!preferences.error && <PilotPlan progress={progress.data as PilotProgress | null} latest={history?.overview.latest ?? null}
      preferences={preferences.data as PilotPreferences | null} language={language} />}
    {!support.error && <PilotSupportPanel requests={(support.data ?? []) as PilotSupport[]} language={language} />}
    {!profile.error && <section className={`${card} mt-6`}>
      <ProfileForm language={language} name={profile.data?.display_name ?? ""} share={Boolean(profile.data?.sharing_enabled_at)} />
    </section>}
    {!deletion.error && <section className={`${card} mt-6`}><DeletionForm language={language} requested={Boolean(deletion.data)} /></section>}
  </AccountShell>
}
