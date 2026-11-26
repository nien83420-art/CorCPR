import type { Language } from "./types"

export const cprExperience = ["none", "theory", "manikin", "real_event"] as const
export type CprExperience = (typeof cprExperience)[number]
export type CourseSelfAssessment = { experience: CprExperience; confidence: number; answeredAt: number }

export function isCprExperience(value: unknown): value is CprExperience {
  return cprExperience.some(category => category === value)
}

type SelfAssessmentCopy = {
  title: string
  introduction: string
  experience: string
  levels: Record<CprExperience, string>
  confidence: string
  low: string
  high: string
  saveError: string
  saving: string
}

export const selfAssessmentCopy: Record<Language, SelfAssessmentCopy> = {
  ru: {
    title: "Начнём с тебя",
    introduction: "Ответь на два коротких вопроса. Здесь нет неправильных ответов.",
    experience: "Какой у тебя опыт СЛР?",
    levels: {
      none: "Никогда не изучал(а) СЛР",
      theory: "Знаком(а) только с теорией",
      manikin: "Практиковал(а) СЛР на манекене",
      real_event: "Применял(а) СЛР в реальной ситуации",
    },
    confidence: "Насколько ты уверен(а), что сможешь начать СЛР при остановке сердца?",
    low: "Совсем не уверен(а)", high: "Полностью уверен(а)",
    saveError: "Ответы пока не сохранились. Нажми «Далее» ещё раз.", saving: "Сохраняем ответы…",
  },
  kk: {
    title: "Өзіңнен бастайық",
    introduction: "Екі қысқа сұраққа жауап бер. Мұнда қате жауап жоқ.",
    experience: "ЖӨР бойынша тәжірибең қандай?",
    levels: {
      none: "ЖӨР-ді ешқашан үйренген емеспін",
      theory: "Тек теориясын білемін",
      manikin: "ЖӨР жасауды манекенде жаттықтырдым",
      real_event: "Нақты жағдайда ЖӨР жасадым",
    },
    confidence: "Жүрек тоқтағанда ЖӨР бастай алатыныңа қаншалықты сенімдісің?",
    low: "Мүлде сенімді емеспін", high: "Толық сенімдімін",
    saveError: "Жауаптар әлі сақталмады. «Келесі» түймесін қайта бас.", saving: "Жауаптарың сақталып жатыр…",
  },
  en: {
    title: "Let’s start with you",
    introduction: "Answer two quick questions. There are no wrong answers.",
    experience: "What experience do you have with CPR?",
    levels: {
      none: "I’ve never learned CPR",
      theory: "I only know the theory",
      manikin: "I’ve practised CPR on a manikin",
      real_event: "I’ve performed CPR in a real emergency",
    },
    confidence: "How confident are you that you could start CPR if someone’s heart stopped?",
    low: "Not at all confident", high: "Completely confident",
    saveError: "Your answers haven’t been saved yet. Select Next to try again.", saving: "Saving your answers…",
  },
}
