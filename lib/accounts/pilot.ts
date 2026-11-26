export type PilotProgress = {
  registeredAt: string | null
  firstVisit: string | null
  lastActivity: string | null
  activeDays: number
  trainingDays: number
  started: number
  firstCourse: boolean
  cameraCompleted: boolean
  modules: number[]
  modulesStarted: number[]
  frequency: { day: string; started: number; completed: number }[]
  attendance: { day: string; visit: string | null; last_seen: string; signed_in: boolean }[]
  points: { id: string; started_at: string; camera: number | null; knowledge: number | null }[]
}

export type PilotCohort = {
  registered: number
  courseStarted: number
  firstCourseCompleted: number
  secondSession: number
  cameraStarted: number
  returned: number
  dailyActive: number
  weeklyActive: number
  active: number
  trainingParticipants: number
  completed: number
  activeSeconds: number
  latest: string | null
  retention: { offset_day: number; eligible: number; retained: number }[]
  daily: { day: string; active: number; completed: number }[]
  weekly: { week: string; active: number; completed: number }[]
  camera: { week: string; samples: number; score: number }[]
  knowledge: { week: string; samples: number; score: number }[]
}

export type PilotPreferences = { reminder_days: number; reminders_since: string; plan_week: string | null; plan_done: string[] }
export type PilotSupport = { id: string; user_id: string; kind: "problem" | "help" | "feedback"; message: string;
  status: "open" | "reviewing" | "resolved"; created_at: string; updated_at: string }
export const supportFields = "id,user_id,kind,message,status,created_at,updated_at"

const dayMilliseconds = 86_400_000
export function utcDay(date = new Date()) { return date.toISOString().slice(0, 10) }

export function weekStart(date = new Date()) {
  const day = (date.getUTCDay() + 6) % 7
  return utcDay(new Date(date.getTime() - day * dayMilliseconds))
}

export function pilotPeriod(from: unknown, to: unknown, fallbackDays = 30) {
  const today = utcDay()
  function parse(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    const date = new Date(value + "T00:00:00Z")
    return Number.isFinite(date.getTime()) && utcDay(date) === value ? date : null
  }
  const start = parse(from)
  const end = parse(to)
  if (start && end && start <= end && end.getTime() - start.getTime() < 366 * dayMilliseconds && utcDay(end) <= today) {
    return { from: utcDay(start), to: utcDay(end) }
  }
  return { from: utcDay(new Date(Date.parse(today) - (fallbackDays - 1) * dayMilliseconds)), to: today }
}
