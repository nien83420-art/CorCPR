export const dispatcherAnswers = [0, 1, 2] as const
export type DispatcherAnswer = typeof dispatcherAnswers[number]
export const completeDispatcherAnswer = 1

export type DispatcherProgress = -1 | 0 | 1 | 2 | 3
export type DispatcherDraft = {
  progress: DispatcherProgress
  answer: DispatcherAnswer | null
  firstAnswer: DispatcherAnswer | null
  scrollY: number
}

export const initialDispatcherDraft: DispatcherDraft = { progress: -1, answer: null, firstAnswer: null, scrollY: 0 }

const storageKey = (owner: string | null) => `corcpr:dispatcher:v1:${owner ?? "guest"}`
const isAnswer = (value: unknown): value is DispatcherAnswer => value === 0 || value === 1 || value === 2

export function loadDispatcherDraft(owner: string | null, number: string): DispatcherDraft | null {
  try {
    const raw = sessionStorage.getItem(storageKey(owner))
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || draft.number !== number || !Number.isFinite(draft.expiresAt) || draft.expiresAt <= Date.now() ||
        ![-1, 0, 1, 2, 3].includes(draft.progress) || !Number.isFinite(draft.scrollY) || draft.scrollY < 0) return null

    // The previous flow stored progress only after accepting the report.
    if (!("answer" in draft) && draft.progress >= 0) {
      return { progress: draft.progress, scrollY: draft.scrollY, answer: completeDispatcherAnswer, firstAnswer: null }
    }
    if ((draft.answer !== null && !isAnswer(draft.answer)) ||
        (draft.firstAnswer !== null && !isAnswer(draft.firstAnswer)) ||
        (draft.progress >= 0 && draft.answer !== completeDispatcherAnswer)) return null
    return { progress: draft.progress, scrollY: draft.scrollY, answer: draft.answer, firstAnswer: draft.firstAnswer }
  } catch {
    return null
  }
}

export function storeDispatcherDraft(owner: string | null, number: string, draft: DispatcherDraft | null) {
  try {
    if (draft && (number === "103" || number === "112")) {
      sessionStorage.setItem(storageKey(owner), JSON.stringify({ ...draft, number, expiresAt: Date.now() + 86_400_000 }))
    } else if (!draft) sessionStorage.removeItem(storageKey(owner))
  } catch {
    // Storage can be unavailable. The active conversation remains usable.
  }
}
