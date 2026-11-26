"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { WelcomeScreen } from "@/components/screens/welcome-screen"
import { LearningScreen } from "@/components/screens/learning-screen"
import { CameraPreparationScreen } from "@/components/screens/camera-preparation-screen"
import { CprPracticeScreen } from "@/components/screens/cpr-practice-screen"
import { CourseResultsFlow } from "@/components/screens/course-results-flow"
import { accountPrimary, accountSecondary } from "@/components/accounts/account-shell"
import { PilotVisit } from "@/components/accounts/pilot-visit"
import { beginAccountTraining, keepGuestTraining, reportTrainingActivity, saveAccountTraining, saveCoursePreparation, saveCourseSelfAssessment } from "@/lib/accounts/actions"
import { recordPilotRunEvent } from "@/lib/accounts/pilot-actions"
import { languageQuery, type AccountAccess } from "@/lib/accounts/account"
import { accountCopy } from "@/lib/accounts/copy"
import { useTrainingClock } from "@/lib/accounts/use-training-clock"
import { courseCopy } from "@/lib/learning-content"
import { courseMilestones } from "@/lib/course-progress"
import { scenarioCopy } from "@/lib/learning-scenarios"
import { translations } from "@/lib/i18n"
import type { PriorLearning } from "@/lib/course-results"
import type { TrainingKind, TrainingRecording } from "@/lib/accounts/training"
import type { Language, SessionResult } from "@/lib/types"

type Screen = "WELCOME" | "LEARNING" | "CAMERA_PREPARATION" | "PRACTICE" | "RESULTS"
type Run = { id: string; kind: TrainingKind; startedAt: number; userId: string | null }
type SaveState = "idle" | "saving" | "saved" | "failed"

export function CorCprApp({ initialLanguage, configured, userId, access }: {
  initialLanguage: Language
  configured: boolean
  userId: string | null
  access: AccountAccess | null
}) {
  const [screen, setScreen] = useState<Screen>("WELCOME")
  const [language, setLanguage] = useState(initialLanguage)
  const [run, setRun] = useState<Run | null>(null)
  const [courseProgress, setCourseProgress] = useState(0)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [learning, setLearning] = useState<PriorLearning | null>(null)
  const [recording, setRecording] = useState<TrainingRecording | null>(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [dismissed, setDismissed] = useState(false)
  const savingSequence = useRef(0)
  const pilotQueue = useRef(Promise.resolve())
  const router = useRouter()
  const t = translations[language]
  const copy = accountCopy[language]
  const course = courseCopy[language]
  const query = languageQuery(language)
  const finished = Boolean(recording?.final || (recording && run?.kind === "camera"))
  const { seconds, markActive } = useTrainingClock(Boolean(run && !finished), run?.id)
  const observeModule = useCallback((kind: "module_started" | "module_completed", module: number) => {
    if (kind === "module_completed" && run?.kind === "course") {
      setCourseProgress(current => Math.max(current, module))
    }
    const owner = run?.userId
    if (!owner) return
    pilotQueue.current = pilotQueue.current.then(async () => {
      if (!await recordPilotRunEvent(run.id, owner, kind, module)) {
        await recordPilotRunEvent(run.id, owner, kind, module)
      }
    }).catch(() => {})
  }, [run])

  const observeCamera = useCallback(() => {
    markActive()
    const owner = run?.userId
    if (!owner) return
    pilotQueue.current = pilotQueue.current.then(async () => {
      await recordPilotRunEvent(run.id, owner, "camera_started")
    }).catch(() => {})
  }, [markActive, run])

  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => { window.scrollTo(0, 0) }, [screen])

  useEffect(() => {
    if (!run?.userId || finished) return
    const { id, userId: owner } = run
    const checkpoint = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        void reportTrainingActivity(id, owner, seconds(), false).catch(() => {})
      }
    }
    const timer = window.setInterval(checkpoint, 25_000)
    window.addEventListener("blur", checkpointOnBlur)
    window.addEventListener("pagehide", interruptOnExit)
    function checkpointOnBlur() {
      void reportTrainingActivity(id, owner, seconds(), false).catch(() => {})
    }
    function interruptOnExit(event: PageTransitionEvent) {
      if (event.persisted) return
      void fetch("/api/training/activity", {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, owner, seconds: seconds() }),
      }).catch(() => {})
    }
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("blur", checkpointOnBlur)
      window.removeEventListener("pagehide", interruptOnExit)
    }
  }, [finished, run, seconds])

  async function start(kind: TrainingKind) {
    if (starting || (kind === "camera" && (!userId || !access?.canSkip))) return
    const next: Run = { id: crypto.randomUUID(), kind, startedAt: Date.now(), userId }
    setStartError(false)
    setStarting(true)
    try {
      if (userId && kind === "course") await pilotQueue.current
      const started = userId ? await beginAccountTraining(next.id, kind, userId) : { courseProgress: 0 }
      if (!started) {
        setStartError(true)
        return
      }
      setCourseProgress(started.courseProgress)
      setRun(next)
      setScreen(kind === "course" ? "LEARNING" : "CAMERA_PREPARATION")
    } catch {
      setStartError(true)
    } finally {
      setStarting(false)
    }
  }

  function goHome() {
    savingSequence.current += 1
    if (run?.userId && !finished) {
      const { id, userId: owner } = run
      const activeSeconds = seconds()
      void pilotQueue.current.then(() => reportTrainingActivity(id, owner, activeSeconds, true)).catch(() => {})
    }
    setRun(null)
    setCourseProgress(0)
    setResult(null)
    setLearning(null)
    setRecording(null)
    setSaveState("idle")
    setDismissed(false)
    setScreen("WELCOME")
    router.refresh()
  }

  async function save(next: TrainingRecording, owner: string, visible: boolean) {
    const sequence = ++savingSequence.current
    if (visible) setSaveState("saving")
    const saved = await (async () => {
      await pilotQueue.current
      if (next.kind === "course") {
        if (!next.preparation || !await saveCoursePreparation(next.id, owner, next.preparation)) return false
        if (next.final && !await saveAccountTraining({ ...next, final: undefined }, owner)) return false
      }
      return saveAccountTraining(next, owner)
    })().catch(() => false)
    if (visible && sequence === savingSequence.current) {
      setSaveState(saved ? "saved" : "failed")
      if (saved && next.kind === "course" && next.final) setCourseProgress(courseMilestones.complete)
    }
  }

  function completeCamera(camera: SessionResult) {
    if (!run) return
    if (run.kind === "course") setCourseProgress(courseMilestones.camera)
    const next = { id: run.id, kind: run.kind, startedAt: run.startedAt, activeSeconds: seconds(), cameraEndedAt: Date.now(),
      camera, preparation: learning?.evidence }
    setRecording(next)
    setResult(camera)
    setScreen("RESULTS")
    if (run.userId) void save(next, run.userId, run.kind === "camera")
  }

  function completeCourse(final: NonNullable<TrainingRecording["final"]>) {
    if (!run || !recording || recording.final) return
    const next = { ...recording, activeSeconds: seconds(), completedAt: Date.now(), final }
    setRecording(next)
    if (run.userId) void save(next, run.userId, true)
    else setCourseProgress(courseMilestones.complete)
  }

  async function transfer(mode: "login" | "register") {
    if (!recording?.final || saveState === "saving") return
    setSaveState("saving")
    try {
      if (await keepGuestTraining(recording)) {
        router.push(`/auth${query}&mode=${mode}`)
        return
      }
    } catch {
      // Keep the current summary available for retry.
    }
    setSaveState("failed")
  }

  const saveActions = recording && finished && (
    run?.userId ? <section className="mt-5 rounded-xl border border-zinc-200 p-4" aria-live="polite">
      <p>{saveState === "saved" ? copy.saved : saveState === "failed" ? copy.saveFailed : "…"}</p>
      {saveState === "failed" && <button className={`mt-3 ${accountSecondary}`}
        onClick={() => void save(recording, run.userId!, true)}>{copy.retry}</button>}
    </section> : configured && !dismissed && <section className="mt-5 rounded-xl border border-zinc-200 p-4">
      <h2 className="font-semibold">{copy.savePrompt}</h2>
      <p className="mt-2 text-sm text-zinc-700">{copy.saveDetail}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={saveState === "saving"} className={accountPrimary} onClick={() => void transfer("register")}>{copy.register}</button>
        <button disabled={saveState === "saving"} className={accountSecondary} onClick={() => void transfer("login")}>{copy.signIn}</button>
        <button disabled={saveState === "saving"} className={accountSecondary} onClick={() => setDismissed(true)}>{copy.continueGuest}</button>
      </div>
      {saveState === "failed" && <p className="mt-2 text-red-800" role="alert">{copy.saveFailed}</p>}
    </section>
  )

  switch (screen) {
    case "WELCOME":
      return <>{userId && <PilotVisit userId={userId} />}<WelcomeScreen t={t} copy={course} language={language} onLanguage={setLanguage}
        onLearn={() => void start("course")} busy={starting}
        startLabel={access?.courseCompleted ? copy.repeat : course.start}
        accountControl={<Link className="inline-flex min-h-11 min-w-0 items-center rounded-lg px-2.5 py-2 font-semibold text-red-800 hover:bg-red-50 sm:px-3"
          href={`${userId ? "/account" : "/auth"}${query}`}>{userId ? copy.account : copy.entry}</Link>}
        afterActions={<>
          {access?.canSkip && <button className={accountSecondary} disabled={starting}
            onClick={() => void start("camera")}>{copy.cameraEntry}</button>}
          {userId && access?.mfaRequired && <Link className={accountSecondary}
            href={`/account${query}`}>{copy.mfa}</Link>}
          {startError && <p role="alert" className="w-full text-sm text-red-800">{copy.operationFailed}</p>}
        </>} /></>
    case "LEARNING":
      return <LearningScreen language={language} courseProgress={courseProgress} quizOwner={run?.userId ?? null} onHome={goHome} onModuleEvent={observeModule}
        onRecordSelfAssessment={async draft => run?.userId ? saveCourseSelfAssessment(run.id, run.userId, draft.experience, draft.confidence) : draft}
        onStartCamera={snapshot => {
          setCourseProgress(current => Math.max(current, courseMilestones.preparation))
          const owner = run?.userId
          if (owner) {
            pilotQueue.current = pilotQueue.current.then(async () => {
              if (await saveCoursePreparation(run.id, owner, snapshot.evidence)) {
                await recordPilotRunEvent(run.id, owner, "module_completed", 7)
              }
            }).catch(() => {})
          }
          setLearning(snapshot)
          setScreen("PRACTICE")
        }} />
    case "CAMERA_PREPARATION":
      return <CameraPreparationScreen language={language} homeLabel={scenarioCopy[language].home}
        backLabel={course.back} onHome={goHome} onBack={goHome} onStart={() => setScreen("PRACTICE")} />
    case "PRACTICE":
      return <CprPracticeScreen language={language} t={t} onComplete={completeCamera}
        courseProgress={run?.kind === "course" ? courseProgress : undefined}
        onPracticeStarted={observeCamera} onPracticeActivity={markActive} />
    case "RESULTS":
      return result && <CourseResultsFlow language={language} result={result} learning={learning} onHome={goHome}
        courseProgress={run?.kind === "course" ? courseProgress : undefined}
        cameraOnly={run?.kind === "camera"} onSummary={completeCourse} saveActions={saveActions} />
  }
}
