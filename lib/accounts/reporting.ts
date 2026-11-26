import "server-only"

import type { CprExperience } from "@/lib/course-self-assessment"
import type { ResultTipKey } from "@/lib/types"
import type { verifiedAccount } from "./server"
import type { TrainingKind, TrainingStatus } from "./training"

type Client = NonNullable<Awaited<ReturnType<typeof verifiedAccount>>>["client"]

export type CameraRecord = {
  repetitions: number
  target_repetitions: number
  last_cadence: number | null
  camera_seconds: number
  overall_score: number | null
  rhythm_score: number | null
  technique_score: number | null
  tips: ResultTipKey[]
}
export type Assessment = { assessment: "intro" | "final"; correct_count: number; question_count: number }
export type TrainingRow = {
  id: string
  training_type: TrainingKind
  status: TrainingStatus
  started_at: string
  activity_at: string
  ended_at: string | null
  active_seconds: number
  camera_training_results: CameraRecord | null
  knowledge_assessment_attempts: Assessment[]
  knowledge_assessment_answers: { question_id: string; assessment: "intro" | "final"; is_correct: boolean }[]
  self_assessments: {
    initial_confidence: number
    final_confidence: number | null
    experience_category: CprExperience | null
    initial_recorded_at: string | null
  } | null
  learning_progress: { final_assessment_at: string | null } | null
}

export type Overview = { completed: number; recorded: number; seconds: number; latest: string | null }

const fields = `id,training_type,status,started_at,activity_at,ended_at,active_seconds,
  camera_training_results(repetitions,target_repetitions,last_cadence,camera_seconds,overall_score,rhythm_score,technique_score,tips),
  knowledge_assessment_attempts(assessment,correct_count,question_count,knowledge_assessment_answers(question_id,assessment,is_correct)),
  self_assessments(initial_confidence,final_confidence,experience_category,initial_recorded_at),learning_progress(final_assessment_at)`

function trainingRow(value: unknown): TrainingRow {
  const row = value as Omit<TrainingRow, "knowledge_assessment_answers" | "knowledge_assessment_attempts"> & {
    knowledge_assessment_attempts: (Assessment & {
      knowledge_assessment_answers: TrainingRow["knowledge_assessment_answers"]
    })[]
  }
  return {
    ...row,
    knowledge_assessment_answers: row.knowledge_assessment_attempts.flatMap(attempt => attempt.knowledge_assessment_answers),
    knowledge_assessment_attempts: row.knowledge_assessment_attempts.map(({ assessment, correct_count, question_count }) =>
      ({ assessment, correct_count, question_count })),
  }
}

export async function readTraining(client: Client, userId: string, page: number, session?: string) {
  const base = () => client.from("training_sessions").select(fields).eq("user_id", userId)
  const offset = page * 25
  const [sessions, overview, detail] = await Promise.all([
    base().order("started_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 25),
    client.rpc("training_overview", { p_user: userId }),
    session ? base().eq("id", session).maybeSingle() : null,
  ])
  if (sessions.error || overview.error || detail?.error) return null
  return {
    sessions: sessions.data.slice(0, 25).map(trainingRow),
    more: sessions.data.length > 25,
    overview: overview.data as Overview,
    detail: detail?.data ? trainingRow(detail.data) : null,
  }
}

export function reportPage(value: unknown) {
  return typeof value === "string" && /^\d{1,3}$/.test(value) ? Number(value) : 0
}
