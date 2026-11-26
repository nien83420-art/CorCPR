"use server"

import { courseMilestones, restoredCourseProgress, type SavedCourseAttempt } from "@/lib/course-progress"
import type { CprExperience } from "@/lib/course-self-assessment"
import { accountClient, getAccountAccess, trainingWriter, verifiedAccount } from "./server"
import { persistTraining, stageGuestRecording } from "./guest"
import { isUuid, validateCourseSelfAssessment, validatePreparation, type PreparationEvidence, type TrainingKind, type TrainingRecording } from "./training"

async function readCourseProgress(account: NonNullable<Awaited<ReturnType<typeof verifiedAccount>>>) {
  const limit = 32
  let completed = 0
  for (let offset = 0; ; offset += limit) {
    const { data, error } = await account.client.from("training_sessions")
      .select("status,modules:pilot_events(module),preparation:learning_progress(session_id),camera:camera_training_results(session_id)")
      .eq("user_id", account.user.id)
      .eq("training_type", "course")
      .eq("modules.kind", "module_completed")
      .or("status.eq.completed,modules.not.is.null,preparation.not.is.null,camera.not.is.null")
      .order("started_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1)
      .overrideTypes<SavedCourseAttempt[], { merge: false }>()
    if (error || !data) return completed
    // The course can be reopened from its first screen in a new training session.
    // Keep the highest saved checkpoint until the most recent completed course.
    for (const attempt of data) {
      if (attempt.status === "completed") return completed
      completed = Math.max(completed, restoredCourseProgress(attempt))
      if (completed === courseMilestones.camera) return completed
    }
    if (data.length < limit) return completed
  }
}

export async function beginAccountTraining(id: string, kind: TrainingKind, expectedUser: string) {
  if (!isUuid(id) || (kind !== "course" && kind !== "camera")) return false
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (!account || account.user.id !== expectedUser || !writer) return false
  const access = await getAccountAccess(account.client)
  if (!access || (kind === "camera" && !access.canSkip)) return false
  const courseProgress = kind === "course" ? await readCourseProgress(account) : 0
  const { error } = await writer.rpc("begin_training", {
    p_user: account.user.id, p_id: id, p_kind: kind,
    p_mfa: access.role !== "student" && !access.mfaRequired,
  })
  return error ? false : { courseProgress }
}

export async function reportTrainingActivity(id: string, expectedUser: string, seconds: number, interrupted: boolean) {
  if (!isUuid(id) || !Number.isInteger(seconds) || seconds < 0 || seconds > 86400 ||
      typeof interrupted !== "boolean") return false
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (!account || account.user.id !== expectedUser || !writer) return false
  const { error } = await writer.rpc("training_heartbeat", {
    p_user: account.user.id, p_id: id, p_active_seconds: seconds, p_interrupt: interrupted,
  })
  return !error
}

export async function saveAccountTraining(recording: TrainingRecording, expectedUser: string) {
  const account = await verifiedAccount()
  return Boolean(account && account.user.id === expectedUser && await persistTraining(account.user.id, recording))
}

export async function saveCourseSelfAssessment(id: string, expectedUser: string, experience: CprExperience, confidence: number) {
  if (!isUuid(id) || !validateCourseSelfAssessment({ experience, confidence, answeredAt: Date.now() })) return null
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (!account || account.user.id !== expectedUser || !writer) return null
  const { data, error } = await writer.rpc("record_course_self_assessment", {
    p_user: account.user.id, p_id: id, p_experience: experience, p_confidence: confidence,
  })
  return error ? null : validateCourseSelfAssessment(data)
}

export async function saveCoursePreparation(id: string, expectedUser: string, evidence: PreparationEvidence) {
  const preparation = validatePreparation(evidence)
  if (!isUuid(id) || !preparation) return false
  const account = await verifiedAccount()
  const writer = trainingWriter()
  if (!account || account.user.id !== expectedUser || !writer) return false
  const { error } = await writer.rpc("prepare_course", {
    p_user: account.user.id, p_id: id, p_preparation: preparation,
  })
  return !error
}

export async function keepGuestTraining(recording: TrainingRecording) {
  if (!(await accountClient())) return false
  return stageGuestRecording(recording)
}

