import type { Language } from "@/lib/types"

export type AccountAccess = {
  role: "student" | "staff" | "admin"
  mfaRequired: boolean
  courseCompleted: boolean
  canSkip: boolean
}

export function accountLanguage(value: unknown): Language {
  return value === "kk" || value === "ru" ? value : "en"
}

export const languageQuery = (language: Language) => `?lang=${language}`
export const passwordMinimum = 12
