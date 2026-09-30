"use client"

import { useState } from "react"
import { WelcomeScreen } from "@/components/screens/welcome-screen"
import { LanguageScreen } from "@/components/screens/language-screen"
import { CallScreen } from "@/components/screens/call-screen"
import { InstructionsScreen } from "@/components/screens/instructions-screen"
import { CprPracticeScreen } from "@/components/screens/cpr-practice-screen"
import { ResultsScreen } from "@/components/screens/results-screen"
import { translations } from "@/lib/i18n"
import type { Language, Screen, SessionResult } from "@/lib/types"

export default function Page() {
  const [screen, setScreen] = useState<Screen>("WELCOME")
  const [language, setLanguage] = useState<Language>("en")
  const [result, setResult] = useState<SessionResult | null>(null)

  const t = translations[language]

  switch (screen) {
    case "WELCOME":
      return <WelcomeScreen t={t} onStart={() => setScreen("LANGUAGE")} />

    case "LANGUAGE":
      return (
        <LanguageScreen
          t={t}
          language={language}
          onSelectLanguage={setLanguage}
          onContinue={() => setScreen("CALL_103")}
        />
      )

    case "CALL_103":
      return <CallScreen t={t} onCalled={() => setScreen("INSTRUCTIONS")} />

    case "INSTRUCTIONS":
      return <InstructionsScreen t={t} onStart={() => setScreen("CPR_PRACTICE")} />

    case "CPR_PRACTICE":
      return (
        <CprPracticeScreen
          t={t}
          onComplete={(sessionResult) => {
            setResult(sessionResult)
            setScreen("RESULTS")
          }}
        />
      )

    case "RESULTS":
      return (
        <ResultsScreen
          t={t}
          result={
            result ?? {
              totalCompressions: 0,
              targetCompressions: 30,
              averageBpm: 0,
              durationSeconds: 0,
              rating: "needsWork",
              techniqueScore: null,
              rhythmScore: null,
              completionScore: 0,
              overallScore: null,
              tips: ["tipKeepPracticing"],
            }
          }
          onRestart={() => {
            setResult(null)
            setScreen("WELCOME")
          }}
        />
      )

    default:
      return null
  }
}
