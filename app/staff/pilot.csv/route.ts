import type { NextRequest } from "next/server"
import { getAccountAccess, verifiedAccount } from "@/lib/accounts/server"
import { pilotPeriod, type PilotCohort } from "@/lib/accounts/pilot"

export async function GET(request: NextRequest) {
  const account = await verifiedAccount()
  if (!account) return new Response(null, { status: 401 })
  const access = await getAccountAccess(account.client)
  if (!access || access.role === "student" || access.mfaRequired) return new Response(null, { status: 403 })
  const { from, to } = pilotPeriod(request.nextUrl.searchParams.get("from"), request.nextUrl.searchParams.get("to"))
  const result = await account.client.rpc("pilot_cohort", { p_from: from, p_to: to })
  if (result.error || !result.data) return new Response(null, { status: 503 })
  const data = result.data as PilotCohort
  const rows: (string | number | null)[][] = [
    ["period_from_utc", "period_to_utc", "series", "date_or_day", "metric", "value", "denominator"],
  ]
  const append = (series: string, day: string | number, metric: string, value: string | number | null, denominator: number | null = null) => {
    rows.push([from, to, series, day, metric, value, denominator])
  }
  append("cohort", "", "participants", data.registered)
  append("cohort", "", "course_starts", data.courseStarted, data.registered)
  append("cohort", "", "first_course_completions", data.firstCourseCompleted, data.courseStarted)
  append("cohort", "", "second_session_starts", data.secondSession, data.firstCourseCompleted)
  append("cohort", "", "camera_starts", data.cameraStarted)
  append("cohort", "", "returning_participants", data.returned)
  append("cohort", "", "completed_sessions", data.completed, data.registered)
  append("cohort", "", "training_participants", data.trainingParticipants)
  append("cohort", "", "active_seconds", data.activeSeconds)
  append("cohort", "", "last_activity", data.latest)
  data.daily.forEach(row => { append("daily", row.day, "active", row.active); append("daily", row.day, "completed", row.completed) })
  data.weekly.forEach(row => { append("weekly", row.week, "active", row.active); append("weekly", row.week, "completed", row.completed) })
  data.retention.forEach(row => append("retention", row.offset_day, "returned", row.retained, row.eligible))
  data.camera.forEach(row => append("camera", row.week, "score", row.score, row.samples))
  data.knowledge.forEach(row => append("knowledge", row.week, "score", row.score, row.samples))
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n"
  return new Response(csv, { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="corcpr-pilot.csv"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } })
}
