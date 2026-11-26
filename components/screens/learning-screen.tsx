import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { EmergencyCallPractice } from "@/components/learning/emergency-call-practice"
import { DispatcherConversation } from "@/components/learning/dispatcher-conversation"
import { SafetyScenario } from "@/components/learning/safety-scenario"
import { CprMythsQuiz } from "@/components/learning/cpr-myths-quiz"
import { CourseSelfAssessmentPanel } from "@/components/learning/course-self-assessment"
import { LearningOutcomeIllustration } from "@/components/learning/learning-outcome-illustration"
import { CourseProgressBar, courseSafeArea } from "@/components/learning/course-progress-bar"
import { ScrollReveal } from "@/components/learning/scroll-reveal"
import { HandExercises, initialHandExercises } from "@/components/learning/hand-exercises"
import { CameraPreparationScreen } from "@/components/screens/camera-preparation-screen"
import { LearningIntroScreen } from "@/components/screens/learning-intro-screen"
import { Button } from "@/components/ui/button"
import type { PriorLearning } from "@/lib/course-results"
import type { CourseSelfAssessment, CprExperience } from "@/lib/course-self-assessment"
import { foundationsCopy, mediaSlots, quizKeys, quizResponse, type QuizChoice } from "@/lib/learning-foundations"
import { safeRoadwayChoice, scenarioCopy, type SafetyChoice } from "@/lib/learning-scenarios"
import { completeDispatcherAnswer, initialDispatcherDraft, loadDispatcherDraft, storeDispatcherDraft,
  type DispatcherAnswer, type DispatcherDraft, type DispatcherProgress } from "@/lib/dispatcher-draft"
import { loadQuizDraft, storeQuizDraft, type QuizAttempt } from "@/lib/quiz-draft"
import type { Language } from "@/lib/types"

interface LearningScreenProps {
  language: Language
  courseProgress: number
  quizOwner: string | null
  onHome: () => void
  onStartCamera: (learning: PriorLearning) => void
  onRecordSelfAssessment: (assessment: CourseSelfAssessment) => Promise<CourseSelfAssessment | null>
  onModuleEvent?: (kind: "module_started" | "module_completed", module: number) => void
}

type RoadwayDecision = { firstChoice: SafetyChoice; choice: SafetyChoice; firstChoiceAt: number; completedAt?: number }

export function LearningScreen({ language, courseProgress, quizOwner, onHome, onStartCamera, onRecordSelfAssessment, onModuleEvent }: LearningScreenProps) {
  const copy = foundationsCopy[language]
  const scenarios = scenarioCopy[language]
  const stages = [...copy.stages, ...scenarios.stages]
  const [stage, setStage] = useState(0)
  const [showIntroEntrance, setShowIntroEntrance] = useState(true)
  const [quiz, setQuiz] = useState<QuizAttempt>({ index: 0, answers: [] })
  const quizRef = useRef(quiz)
  const quizLoaded = useRef(false)
  const quizCompletionReported = useRef(false)
  const [experience, setExperience] = useState<CprExperience>()
  const [confidence, setConfidence] = useState<number>()
  const [selfAssessment, setSelfAssessment] = useState<CourseSelfAssessment>()
  const [assessmentStatus, setAssessmentStatus] = useState<"idle" | "saving" | "failed">("idle")
  const assessmentRequest = useRef<Promise<CourseSelfAssessment | null> | null>(null)
  const [safetyStep, setSafetyStep] = useState(0)
  const [safetyDecision, setSafetyDecision] = useState<RoadwayDecision>()
  const [safetyCompletedSteps, setSafetyCompletedSteps] = useState(0)
  const safetyCompletionReported = useRef(false)
  const [showDispatcher, setShowDispatcher] = useState(false)
  const [callNumber, setCallNumber] = useState("")
  const [callPracticeAccepted, setCallPracticeAccepted] = useState(false)
  const [dispatcher, setDispatcher] = useState(initialDispatcherDraft)
  const dispatcherRef = useRef(dispatcher)
  const [dispatcherScroll, setDispatcherScroll] = useState(0)
  const callCompletionReported = useRef(false)
  const [showTechnique, setShowTechnique] = useState(false)
  const [handExercises, setHandExercises] = useState(initialHandExercises)
  const [showCameraPreparation, setShowCameraPreparation] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const currentModule = showTechnique ? 7 : stage + 1
  const isQuiz = stage === 2
  const isConversation = stage === 5 && showDispatcher
  const callCompleted = callCompletionReported.current || courseProgress >= 6
  function updateQuiz(attempt: QuizAttempt) {
    quizRef.current = attempt
    setQuiz(attempt)
    storeQuizDraft(quizOwner, attempt)
  }

  function chooseQuizAnswer(choice: QuizChoice) {
    const { index, answers } = quizRef.current
    if (answers.length !== index || index >= quizKeys.length) return
    updateQuiz({ index, answers: [...answers, choice] })
  }

  const reportQuizCompletion = useCallback(() => {
    if (quizCompletionReported.current) return
    quizCompletionReported.current = true
    onModuleEvent?.("module_completed", 3)
  }, [onModuleEvent])

  function advanceQuiz() {
    const attempt = quizRef.current
    if (attempt.index === quizKeys.length) {
      reportQuizCompletion()
      setStage(3)
    } else if (attempt.index < attempt.answers.length) {
      const index = attempt.index + 1
      updateQuiz({ ...attempt, index })
      if (index === quizKeys.length) reportQuizCompletion()
    }
  }

  useEffect(() => {
    if (showTechnique || isQuiz || isConversation) return
    heading.current?.focus(stage === 0 ? { preventScroll: true } : undefined)
    window.scrollTo(0, 0)
  }, [showTechnique, isQuiz, isConversation, stage, safetyStep])

  useEffect(() => {
    onModuleEvent?.("module_started", currentModule)
    if (currentModule === 3 && quizRef.current.index === quizKeys.length) reportQuizCompletion()
  }, [currentModule, onModuleEvent, reportQuizCompletion])

  useEffect(() => () => { assessmentRequest.current = null }, [])

  function back() {
    if (isConversation) setShowDispatcher(false)
    else if (stage === 4 && safetyStep > 0) setSafetyStep(safetyStep - 1)
    else if (isQuiz && quizRef.current.index > 0) updateQuiz({ ...quizRef.current, index: quizRef.current.index - 1 })
    else if (stage > 0) setStage(stage - 1)
    else onHome()
  }

  function next() {
    if (stage === 0) setShowIntroEntrance(false)
    if (stage === 1 && !quizLoaded.current) {
      quizLoaded.current = true
      const draft = loadQuizDraft(quizOwner)
      if (draft) updateQuiz(draft)
    }
    onModuleEvent?.("module_completed", stage + 1)
    setStage(stage + 1)
  }

  const saveDispatcher = useCallback((draft: DispatcherDraft) => {
    dispatcherRef.current = draft
    storeDispatcherDraft(quizOwner, callNumber, draft)
  }, [quizOwner, callNumber])

  function openDispatcher() {
    if (!callPracticeAccepted) return
    const draft = loadDispatcherDraft(quizOwner, callNumber) ?? dispatcherRef.current
    saveDispatcher(draft)
    setDispatcher(draft)
    setDispatcherScroll(draft.scrollY)
    setShowDispatcher(true)
  }

  function chooseDispatcherAnswer(answer: DispatcherAnswer) {
    const current = dispatcherRef.current
    if (current.progress !== -1 || current.answer === completeDispatcherAnswer || current.answer === answer) return
    const next = { ...current, answer, firstAnswer: current.firstAnswer ?? answer, scrollY: window.scrollY }
    saveDispatcher(next)
    setDispatcher(next)
  }

  function advanceDispatcher(step: DispatcherProgress) {
    const current = dispatcherRef.current
    if (step === 3 || current.progress !== step || current.answer !== completeDispatcherAnswer) return
    const progress = ([0, 1, 2, 3] as const)[step + 1]
    const next = { ...current, progress, scrollY: window.scrollY }
    saveDispatcher(next)
    setDispatcher(next)
  }

  const saveDispatcherPosition = useCallback((scrollY: number) => {
    saveDispatcher({ ...dispatcherRef.current, scrollY })
  }, [saveDispatcher])

  function startCprExercises() {
    if (!callPracticeAccepted || dispatcherRef.current.progress !== 3) return
    if (!callCompleted) {
      callCompletionReported.current = true
      onModuleEvent?.("module_completed", 6)
    }
    setShowTechnique(true)
  }

  function chooseSafetyAction(choice: SafetyChoice) {
    const now = Date.now()
    setSafetyDecision(previous => {
      if (!previous) return { firstChoice: choice, choice, firstChoiceAt: now }
      if (previous.choice === choice || previous.choice === safeRoadwayChoice) return previous
      return { ...previous, choice }
    })
  }

  function advanceSafety() {
    if (safetyDecision?.choice !== safeRoadwayChoice) return
    const completedAt = Date.now()
    setSafetyDecision(previous => previous && { ...previous, completedAt: previous.completedAt ?? completedAt })
    const nextStep = safetyStep + 1
    setSafetyCompletedSteps(previous => Math.max(previous, nextStep))
    if (nextStep < scenarios.safety.parts.length) {
      setSafetyStep(nextStep)
      return
    }
    if (!safetyCompletionReported.current) {
      safetyCompletionReported.current = true
      onModuleEvent?.("module_completed", 5)
    }
    setStage(5)
  }

  async function submitSelfAssessment() {
    if (!experience || confidence === undefined || assessmentRequest.current) return
    if (selfAssessment) {
      next()
      return
    }

    const pending = onRecordSelfAssessment({ experience, confidence, answeredAt: Date.now() }).catch(() => null)
    assessmentRequest.current = pending
    setAssessmentStatus("saving")
    const saved = await pending
    if (assessmentRequest.current !== pending) return
    assessmentRequest.current = null
    if (!saved) {
      setAssessmentStatus("failed")
      return
    }
    setSelfAssessment(saved)
    setExperience(saved.experience)
    setConfidence(saved.confidence)
    setAssessmentStatus("idle")
    next()
  }

  const title = isQuiz ? copy.quiz.title : stages[stage]

  if (showCameraPreparation) {
    return <CameraPreparationScreen language={language} courseProgress={courseProgress} homeLabel={scenarios.home} backLabel={copy.back}
      onHome={onHome} onBack={() => setShowCameraPreparation(false)} onStart={() => {
        storeQuizDraft(quizOwner, null)
        storeDispatcherDraft(quizOwner, callNumber, null)
        onStartCamera({
          firstChecks: [...quiz.answers.map((choice, i) => choice === quizKeys[i].choice),
            ...(safetyDecision ? [safetyDecision.firstChoice === safeRoadwayChoice] : []),
            ...(dispatcher.firstAnswer === null ? [] : [dispatcher.firstAnswer === completeDispatcherAnswer])],
          confidence: selfAssessment?.confidence ?? null,
          handStacked: handExercises.stackVerified && handExercises.stackResult?.length === 0,
          chestPlaced: handExercises.placementResult === "correct",
          evidence: {
            language,
            intro: quiz.answers.map((choice, index) => quizResponse(index, choice)),
            safety: safetyDecision?.completedAt === undefined ? -1 : {
              firstChoice: safetyDecision.firstChoice,
              attempts: safetyDecision.firstChoice === safeRoadwayChoice ? 1 : 2,
              finalChoice: safeRoadwayChoice,
              firstChoiceAt: safetyDecision.firstChoiceAt,
              completedAt: safetyDecision.completedAt,
            },
            dispatcher: scenarios.call.report.correct,
            confidence: selfAssessment?.confidence ?? 0,
            assessment: selfAssessment && { experience: selfAssessment.experience, answeredAt: selfAssessment.answeredAt },
            lower: handExercises.lower,
            upper: handExercises.upper,
            placement: handExercises.placement,
            interlocked: handExercises.interlocked,
            quarterTurns: handExercises.quarterTurns,
          },
        })
      }} />
  }

  if (showTechnique) {
    return <HandExercises language={language} courseProgress={courseProgress} homeLabel={scenarios.home}
      labels={{ back: copy.back, next: copy.next, navigation: copy.navigation,
        check: copy.quiz.check, correct: copy.quiz.correct, incorrect: copy.quiz.incorrect }}
      state={handExercises} setState={setHandExercises} onBack={() => {
        setDispatcherScroll(dispatcherRef.current.scrollY)
        setShowTechnique(false)
      }} onHome={onHome}
      onPrepareCamera={() => setShowCameraPreparation(true)} />
  }

  return (
    <main lang={language} className={`min-h-page page-gutter bg-white pb-8 text-zinc-950 [color-scheme:light] ${courseSafeArea}`}>
      <div className="mx-auto max-w-6xl">
        <header>
          <div className="flex items-center justify-between gap-3 py-2 sm:py-4">
            <button type="button" className="min-h-11 shrink-0 rounded text-xl font-bold tracking-tight text-red-800 focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={scenarios.home} onClick={() => {
              if (isConversation) saveDispatcherPosition(window.scrollY)
              onHome()
            }}>CorCpr</button>
            <p className="min-w-0 text-right text-sm font-medium text-zinc-600">{stages[stage]}</p>
          </div>
          <CourseProgressBar language={language} completed={courseProgress} />
        </header>

        {stage === 0 ? <LearningIntroScreen language={language} heading={heading} onNext={next} animate={showIntroEntrance} /> : stage === 1 ? (
          <section className="mx-auto max-w-[58rem] pb-6 pt-7 sm:pt-12 lg:pt-16" aria-labelledby="learning-heading">
            <ScrollReveal subtle><h1 ref={heading} id="learning-heading" tabIndex={-1} className="text-pretty text-[clamp(1.875rem,8.5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.045em] outline-none lg:text-[clamp(3rem,4.6vw,4rem)]">
              {title}
            </h1></ScrollReveal>
            <ul className="mt-5 grid gap-3 sm:mt-7 md:grid-cols-3 md:gap-4">
              {mediaSlots.map((slot, index) => {
                const [label, summary] = copy.outcomes[slot]
                return <li key={slot} className="min-w-0">
                  <ScrollReveal subtle delay={60 + index * 50}>
                    <article className="grid min-h-28 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-3 min-[375px]:grid-cols-[6rem_minmax(0,1fr)] md:min-h-64 md:grid-cols-1 md:content-start md:gap-4 md:p-5">
                      <div className="grid h-16 place-items-center rounded-xl bg-white md:h-28"><LearningOutcomeIllustration slot={slot} label={copy.media[slot]} /></div>
                      <div>
                        <h2 className="text-lg leading-tight font-bold text-red-700 md:text-xl">{label}</h2>
                        <p className="mt-1 text-[15px] leading-relaxed text-zinc-700 md:mt-2">{summary}</p>
                      </div>
                    </article>
                  </ScrollReveal>
                </li>
              })}
            </ul>
            <ScrollReveal subtle delay={70} className="mt-5 border-l-2 border-red-700 pl-3 text-sm leading-relaxed text-zinc-700"><p>{copy.outcomesNote}</p></ScrollReveal>
            <nav aria-label={copy.navigation} className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
              <Button className="min-h-11 rounded-lg border-zinc-300 bg-white px-5 text-zinc-900 hover:bg-zinc-100" onClick={back}>{copy.back}</Button>
              <Button size="lg" className="min-h-11 gap-2 rounded-lg bg-red-700 px-6 text-base font-semibold text-white hover:bg-red-800 lg:min-w-36" onClick={next}>
                {copy.next}<ArrowRight aria-hidden="true" />
              </Button>
            </nav>
          </section>
        ) : isQuiz ? (
          <CprMythsQuiz language={language} attempt={quiz} back={back} next={advanceQuiz} choose={chooseQuizAnswer} />
        ) : stage === 3 ? (
          <CourseSelfAssessmentPanel language={language} heading={heading} experience={experience} confidence={confidence}
            saved={Boolean(selfAssessment)} saving={assessmentStatus === "saving"} failed={assessmentStatus === "failed"}
            onExperience={setExperience} onConfidence={setConfidence} onBack={back} onNext={() => void submitSelfAssessment()} />
        ) : stage === 4 ? (
          <SafetyScenario language={language} heading={heading} step={safetyStep} completedSteps={safetyCompletedSteps}
            choice={safetyDecision?.choice} onChoose={chooseSafetyAction} onNext={advanceSafety} onBack={back} />
        ) : isConversation ? (
          <DispatcherConversation language={language} heading={heading} number={callNumber} progress={dispatcher.progress}
            answer={dispatcher.answer} onAnswer={chooseDispatcherAnswer}
            completed={callCompleted} initialScroll={dispatcherScroll} onAction={advanceDispatcher}
            onSave={saveDispatcherPosition} onBack={back} onStartCpr={startCprExercises} />
        ) : (
          <EmergencyCallPractice language={language} heading={heading} number={callNumber}
            accepted={callPracticeAccepted} completed={callCompleted} onNumber={setCallNumber} onAccept={() => setCallPracticeAccepted(true)}
            onContinue={openDispatcher} onBack={back} />
        )}
      </div>
    </main>
  )
}
