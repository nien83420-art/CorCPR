import { quizKeys, type QuizChoice } from "./learning-foundations"

export type QuizAttempt = { index: number; answers: QuizChoice[] }

const validFor = 24 * 60 * 60 * 1000
const storageKey = (owner: string | null) => `corcpr:myths-quiz:v1:${owner ?? "guest"}`

export function loadQuizDraft(owner: string | null): QuizAttempt | null {
  try {
    const raw = sessionStorage.getItem(storageKey(owner))
    if (!raw) return null
    const draft = JSON.parse(raw) as { expiresAt?: unknown; index?: unknown; answers?: unknown } | null
    if (!draft || typeof draft.expiresAt !== "number" || !Number.isFinite(draft.expiresAt) || draft.expiresAt <= Date.now() ||
        !Array.isArray(draft.answers) || draft.answers.length > quizKeys.length ||
        !draft.answers.every(choice => choice === "fact" || choice === "myth") ||
        typeof draft.index !== "number" || !Number.isInteger(draft.index) || draft.index < 0 || draft.index > draft.answers.length) return null
    return { index: draft.index, answers: draft.answers }
  } catch {
    return null
  }
}

export function storeQuizDraft(owner: string | null, attempt: QuizAttempt | null) {
  try {
    if (attempt) sessionStorage.setItem(storageKey(owner), JSON.stringify({ ...attempt, expiresAt: Date.now() + validFor }))
    else sessionStorage.removeItem(storageKey(owner))
  } catch {
    // The learner can keep going in the current page when storage is unavailable.
  }
}
