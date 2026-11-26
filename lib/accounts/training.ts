import { finalQuestions } from "@/lib/final-assessment"
import { heelsAlign, isInsideSternum, type Point } from "@/lib/hand-exercises"
import { quizKeys } from "@/lib/learning-foundations"
import { isCprExperience, type CourseSelfAssessment } from "@/lib/course-self-assessment"
import { safeRoadwayChoice, scenarioCopy, type SafetyDecisionEvidence } from "@/lib/learning-scenarios"
import type { Language, SessionResult, ResultTipKey } from "@/lib/types"

export type TrainingKind = "course" | "camera"
export type TrainingStatus = "in_progress" | "interrupted" | "completed"

export type PreparationEvidence = {
  language?: Language
  intro: number[]
  safety: number | SafetyDecisionEvidence
  dispatcher: number
  confidence: number
  assessment?: Pick<CourseSelfAssessment, "experience" | "answeredAt">
  lower: Point
  upper: Point
  placement: Point
  interlocked: boolean
  quarterTurns: number
}

export type Answer<Response = number | Point> = { question: string; isCorrect: boolean; response: Response }

export type TrainingRecording = {
  id: string
  kind: TrainingKind
  startedAt: number
  activeSeconds: number
  cameraEndedAt: number
  completedAt?: number
  camera: SessionResult
  preparation?: PreparationEvidence
  final?: { confidence: number; answers: (number | Point)[] }
}

const tips = new Set<ResultTipKey>([
  "tipGoodRhythm", "tipGoodTechnique", "tipLeftElbow", "tipRightElbow", "tipBothElbows",
  "tipWrists", "tipRelease", "tipSteadierRhythm", "tipPushFaster", "tipPushSlower",
  "tipCompleteAll", "tipKeepPracticing",
])

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function point(value: unknown): Point | null {
  if (!record(value) || typeof value.x !== "number" || typeof value.y !== "number" ||
      !Number.isFinite(value.x) || !Number.isFinite(value.y) ||
      value.x < 0 || value.x > 400 || value.y < 0 || value.y > 354) return null
  return { x: value.x, y: value.y }
}

export function validateCourseSelfAssessment(input: unknown, now = Date.now()): CourseSelfAssessment | null {
  if (!record(input) || !isCprExperience(input.experience) || !integer(input.confidence, 1, 5) ||
      !integer(input.answeredAt, now - 86_400_000, now + 10_000)) return null
  return { experience: input.experience, confidence: input.confidence, answeredAt: Math.min(now, input.answeredAt) }
}

function validateSafetyDecision(input: unknown, now: number): typeof safeRoadwayChoice | SafetyDecisionEvidence | null {
  if (input === safeRoadwayChoice) return input
  if (!record(input) || (input.firstChoice !== 0 && input.firstChoice !== 1) || input.finalChoice !== safeRoadwayChoice ||
      input.attempts !== (input.firstChoice === safeRoadwayChoice ? 1 : 2) ||
      !integer(input.firstChoiceAt, now - 86_400_000, now + 10_000) || !integer(input.completedAt, input.firstChoiceAt, now + 10_000)) return null
  return { firstChoice: input.firstChoice, attempts: input.firstChoice === safeRoadwayChoice ? 1 : 2, finalChoice: input.finalChoice,
    firstChoiceAt: Math.min(now, input.firstChoiceAt), completedAt: Math.min(now, input.completedAt) }
}

export function validatePreparation(input: unknown, now = Date.now()) {
  if (!record(input) || !Array.isArray(input.intro) || !integer(input.confidence, 1, 5) ||
      !integer(input.dispatcher, 0, 10)) return null
  const language = input.language ?? "en"
  if (language !== "ru" && language !== "en" && language !== "kk") return null
  const lower = point(input.lower)
  const upper = point(input.upper)
  const placement = point(input.placement)
  const safety = validateSafetyDecision(input.safety, now)
  const assessment = record(input.assessment) ? validateCourseSelfAssessment({ ...input.assessment, confidence: input.confidence }, now) : null
  if (input.assessment !== undefined && !assessment) return null
  const scenario = scenarioCopy[language]
  if (!lower || !upper || !placement || !heelsAlign(lower, upper) || !isInsideSternum(placement) ||
      input.interlocked !== true || input.quarterTurns !== 0 ||
      safety === null || input.dispatcher !== scenario.call.report.correct ||
      input.intro.length !== quizKeys.length) return null
  const answers: Answer<number | SafetyDecisionEvidence>[] = []
  for (const [i, key] of quizKeys.entries()) {
    const option: unknown = input.intro[i]
    if (!integer(option, 0, 1)) return null
    answers.push({ question: `intro-${i}`, isCorrect: option === key.response, response: option })
  }
  answers.push(
    { question: "safety", isCorrect: true, response: safety },
    { question: "dispatcher", isCorrect: true, response: input.dispatcher },
  )
  return { confidence: input.confidence, answers, safety, assessment: assessment && { experience: assessment.experience, answeredAt: assessment.answeredAt } }
}

export function validateFinal(input: unknown) {
  const questions = finalQuestions.en
  if (!record(input) || !integer(input.confidence, 1, 5) ||
      !Array.isArray(input.answers) || input.answers.length !== questions.length) return null
  const answers: Answer[] = []
  for (const [i, question] of questions.entries()) {
    const response: unknown = input.answers[i]
    if ("options" in question) {
      if (!integer(response, 0, question.options.length - 1)) return null
      answers.push({ question: `final-${i}`, isCorrect: response === question.correct, response })
    } else {
      const placement = point(response)
      if (!placement) return null
      answers.push({ question: `final-${i}`, isCorrect: isInsideSternum(placement), response: placement })
    }
  }
  return { confidence: input.confidence, answers }
}

export function validateCamera(input: unknown): SessionResult | null {
  const score = (value: unknown): value is number | null => value === null || integer(value, 0, 100)
  if (!record(input) || input.targetCompressions !== 30 || !integer(input.totalCompressions, 0, 30) ||
      !integer(input.averageBpm, 0, 400) || !integer(input.durationSeconds, 1, 86400) ||
      !score(input.techniqueScore) || !score(input.rhythmScore) || !score(input.overallScore) ||
      !integer(input.completionScore, 0, 100) ||
      (input.rating !== "excellent" && input.rating !== "good" && input.rating !== "needsWork") ||
      !Array.isArray(input.tips) || input.tips.length > 12 ||
      !input.tips.every((tip: ResultTipKey) => tips.has(tip))) return null
  return {
    totalCompressions: input.totalCompressions, targetCompressions: input.targetCompressions,
    averageBpm: input.averageBpm, durationSeconds: input.durationSeconds,
    techniqueScore: input.techniqueScore, rhythmScore: input.rhythmScore,
    overallScore: input.overallScore, completionScore: input.completionScore,
    rating: input.rating, tips: input.tips,
  }
}

export function validateRecording(input: unknown, now = Date.now()) {
  if (!record(input) || !isUuid(input.id) || (input.kind !== "course" && input.kind !== "camera") ||
      !integer(input.startedAt, now - 86_400_000, now + 10_000) || !integer(input.activeSeconds, 0, 86400)) return null
  const activeSeconds = Math.min(input.activeSeconds, Math.max(0, Math.floor((now - input.startedAt + 1000) / 1000)))
  const camera = validateCamera(input.camera)
  if (!camera || !integer(input.cameraEndedAt, input.startedAt, now + 10_000)) return null
  const preparation = input.kind === "course" ? validatePreparation(input.preparation, now) : null
  const final = input.kind === "course" && input.final !== undefined ? validateFinal(input.final) : null
  if (input.kind === "course" && (!preparation || (input.final !== undefined && !final))) return null
  if (preparation?.assessment && !integer(preparation.assessment.answeredAt, input.startedAt - 10_000, input.cameraEndedAt + 10_000)) return null
  if (preparation && typeof preparation.safety !== "number" &&
      (preparation.safety.firstChoiceAt < input.startedAt || preparation.safety.completedAt > input.cameraEndedAt + 10_000)) return null
  if (final && !integer(input.completedAt, input.cameraEndedAt, now + 10_000)) return null
  return {
    id: input.id, kind: input.kind, startedAt: input.startedAt, activeSeconds, camera, preparation, final,
    cameraEndedAt: Math.min(now, input.cameraEndedAt),
    completedAt: typeof input.completedAt === "number" && final ? Math.min(now, input.completedAt) : null,
  }
}
