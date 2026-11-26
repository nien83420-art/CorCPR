"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CourseProgressBar, courseSafeArea } from "@/components/learning/course-progress-bar"
import { PoseOverlayCanvas } from "@/components/pose-overlay-canvas"
import { PracticeMetronome } from "@/components/practice/practice-metronome"
import { PracticeRhythm, useFreshCadence } from "@/components/practice/practice-rhythm"
import { useCamera } from "@/hooks/use-camera"
import { usePoseLandmarker } from "@/hooks/use-pose-landmarker"
import { useCallHelpGesture } from "@/hooks/use-call-help-gesture"
import { useHandPositionValidation } from "@/hooks/use-hand-position-validation"
import { useCompressionCounter } from "@/hooks/use-compression-counter"
import { compressionPostureMessage, usePostureVisualState } from "@/hooks/use-posture-visual-state"
import { type MovementFeedbackKey, useCompressionMovementFeedback } from "@/hooks/use-compression-movement-feedback"
import { useSessionStats } from "@/hooks/use-session-stats"
import { practiceGuidanceCopy } from "@/lib/practice-guidance"
import { computeSessionScores } from "@/lib/session-scoring"
import { cn } from "@/lib/utils"
import type { Translations } from "@/lib/i18n"
import type { Language, SessionResult, TrainingStage } from "@/lib/types"

const TARGET_COMPRESSIONS = 30
/** Developer diagnostics overlays stay in the code but never render for learners unless explicitly enabled. */
const SHOW_DEBUG_PANELS = process.env.NEXT_PUBLIC_CPR_DEBUG === "1"

const MOVEMENT_FEEDBACK_COLOR: Record<MovementFeedbackKey, string> = {
  releaseFully: "bg-amber-500 text-white",
  pushDeeper: "bg-amber-500 text-white",
  pushFaster: "bg-amber-500 text-white",
  pushSlower: "bg-amber-500 text-white",
  goodPace: "bg-emerald-600 text-white",
  goodCompression: "bg-emerald-600 text-white",
  startCompressions: "bg-muted text-muted-foreground",
}

interface CprPracticeScreenProps {
  language: Language
  courseProgress?: number
  t: Translations
  onComplete: (result: SessionResult) => void
  onPracticeStarted?: () => void
  onPracticeActivity?: () => void
}

export function CprPracticeScreen({ language, courseProgress, t, onComplete, onPracticeStarted, onPracticeActivity }: CprPracticeScreenProps) {
  const guidance = practiceGuidanceCopy[language]
  const { videoRef, videoCallbackRef, status: cameraStatus, errorMessage, retry } = useCamera({ active: true })
  const cameraReady = cameraStatus === "granted"

  const { landmarks, poseRef, connections, personDetected, isModelLoading, error: modelError } = usePoseLandmarker({
    videoRef,
    active: cameraReady,
  })

  // TEMPORARY diagnostics: helps identify why the video renders black on
  // Safari. Reads read-only video/track state only; no frames are captured,
  // stored, or transmitted. Remove once the Safari issue is resolved.
  const [diagnostics, setDiagnostics] = useState({
    hasSrcObject: false,
    streamActive: false,
    trackReadyState: "n/a",
    trackEnabled: false,
    videoWidth: 0,
    videoHeight: 0,
    videoReadyState: 0,
    videoPaused: true,
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      const video = videoRef.current
      const srcObject = video?.srcObject
      const stream = srcObject instanceof MediaStream ? srcObject : null
      const track = stream?.getVideoTracks()[0] ?? null

      const next = {
        hasSrcObject: !!srcObject,
        streamActive: stream?.active ?? false,
        trackReadyState: track?.readyState ?? "n/a",
        trackEnabled: track?.enabled ?? false,
        videoWidth: video?.videoWidth ?? 0,
        videoHeight: video?.videoHeight ?? 0,
        videoReadyState: video?.readyState ?? 0,
        videoPaused: video?.paused ?? true,
      }

      setDiagnostics(next)

      console.log("[v0][camera-diagnostics]", {
        cameraStatus,
        errorMessage,
        ...next,
        poseLandmarkerLoaded: !isModelLoading && !modelError,
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [videoRef, cameraStatus, errorMessage, isModelLoading, modelError])

  const [trainingStage, setTrainingStage] = useState<TrainingStage>("CALL_HELP")

  const {
    feedbackKey: callHelpFeedback,
    debug: callHelpDebug,
    update: updateCallHelp,
  } = useCallHelpGesture({
    onComplete: () => setTrainingStage("HAND_POSITION"),
  })

  const {
    feedbackKey: handPositionFeedback,
    debug: handPositionDebug,
    update: updateHandPosition,
  } = useHandPositionValidation({
    onComplete: () => setTrainingStage("COMPRESSIONS"),
  })

  const { count, bpm, bpmUpdatedAt, status, update, reset, debug } = useCompressionCounter(TARGET_COMPRESSIONS)
  const liveCadence = useFreshCadence(bpm, bpmUpdatedAt,
    trainingStage === "COMPRESSIONS" && cameraReady && personDetected && debug.rawPoseValid)

  const postureVisualRef = usePostureVisualState({
    stage: trainingStage,
    handPositionDebug,
    compressionDebug: debug,
    callHelpSide: callHelpDebug.activeSide,
  })
  const compressionPostureFeedback = compressionPostureMessage(debug.reason, debug.effectivePoseValid)
  const movementFeedback = useCompressionMovementFeedback({
    active: trainingStage === "COMPRESSIONS",
    debug,
    count,
    status,
  })
  const { getStats, resetStats } = useSessionStats({
    active: trainingStage === "COMPRESSIONS",
    debug,
    count,
    movementFeedback,
  })
  const startTimeRef = useRef<number>(Date.now())
  const completedRef = useRef(false)
  const startedRef = useRef(false)
  const latestRef = useRef({ count, bpm })
  latestRef.current = { count, bpm }

  useEffect(() => {
    if (!startedRef.current && cameraReady && trainingStage === "COMPRESSIONS" && personDetected) {
      startedRef.current = true
      onPracticeStarted?.()
    }
  }, [cameraReady, onPracticeStarted, personDetected, trainingStage])

  useEffect(() => {
    if (count > 0) onPracticeActivity?.()
  }, [count, onPracticeActivity])

  useEffect(() => {
    if (trainingStage !== "COMPRESSIONS") return
    reset()
    resetStats()
  }, [trainingStage, reset, resetStats])

  useEffect(() => {
    if (trainingStage === "CALL_HELP") {
      updateCallHelp(landmarks)
      return
    }
    if (trainingStage === "HAND_POSITION") {
      updateHandPosition(landmarks)
      return
    }
    if (trainingStage === "COMPRESSIONS") {
      update(landmarks)
    }
  }, [landmarks, trainingStage, updateCallHelp, updateHandPosition, update])

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    const { count: finalCount, bpm: finalBpm } = latestRef.current
    const averageBpm = finalBpm ?? 0
    const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    onComplete({
      totalCompressions: finalCount,
      targetCompressions: TARGET_COMPRESSIONS,
      averageBpm,
      durationSeconds,
      ...computeSessionScores(getStats(), finalCount, TARGET_COMPRESSIONS),
    })
  }, [onComplete, getStats])

  useEffect(() => {
    if (count >= TARGET_COMPRESSIONS) {
      finish()
    }
  }, [count, finish])

  if (cameraStatus === "denied" || cameraStatus === "unavailable" || cameraStatus === "error") {
    return (
      <div lang={language} className="min-h-page page-gutter flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
          <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-foreground">{t.practice.permissionTitle}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {cameraStatus === "denied" ? t.practice.permissionBody : errorMessage ?? t.practice.permissionBody}
        </p>
        <Button size="lg" onClick={retry} className="mt-8 min-h-12 w-full max-w-xs bg-red-600 hover:bg-red-700">
          {t.practice.retry}
        </Button>
      </div>
    )
  }

  if (!cameraReady || isModelLoading) {
    return (
      <div lang={language} className="min-h-page page-gutter flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="size-10 animate-spin text-red-600" aria-hidden="true" />
        <p className="mt-6 text-sm text-muted-foreground">
          {!cameraReady ? t.practice.permissionBody : t.practice.loadingModel}
        </p>
      </div>
    )
  }

  if (modelError) {
    return (
      <div lang={language} className="min-h-page page-gutter flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
        <p className="mt-4 max-w-xs text-sm text-muted-foreground">{modelError}</p>
      </div>
    )
  }

  const compressionStatusText = {
    waiting: t.practice.statusWaiting,
    "too-slow": t.practice.statusTooSlow,
    good: t.practice.statusGood,
    "too-fast": t.practice.statusTooFast,
  }[status]

  const compressionStatusColor = {
    waiting: "bg-muted text-muted-foreground",
    "too-slow": "bg-amber-500 text-white",
    good: "bg-emerald-600 text-white",
    "too-fast": "bg-red-600 text-white",
  }[status]

  let statusText = compressionStatusText
  let statusColor = compressionStatusColor

  if (trainingStage === "CALL_HELP") {
    statusText = callHelpFeedback ? t.training[callHelpFeedback] : t.training.instructionCallHelp
    statusColor = callHelpFeedback ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
  } else if (trainingStage === "HAND_POSITION") {
    statusText = handPositionFeedback ? t.training[handPositionFeedback] : t.training.instructionHandPosition
    statusColor = handPositionFeedback ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
  } else if (compressionPostureFeedback) {
    statusText = t.training[compressionPostureFeedback]
    statusColor = "bg-red-600 text-white"
  } else if (movementFeedback) {
    statusText = t.training[movementFeedback]
    statusColor = MOVEMENT_FEEDBACK_COLOR[movementFeedback]
  }

  return (
    <main lang={language} className={`min-h-page page-gutter flex flex-col bg-zinc-50 py-6 [color-scheme:light] ${courseProgress === undefined ? "" : courseSafeArea}`}>
      {courseProgress !== undefined && <CourseProgressBar language={language} completed={courseProgress} className="mb-3" />}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-bold text-zinc-950">{t.practice.title}</h1>
        <div
          className={cn(
            "flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium [&_svg]:shrink-0",
            personDetected ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-700",
          )}
        >
          {personDetected ? <UserCheck className="size-3.5" aria-hidden="true" /> : <UserX className="size-3.5" aria-hidden="true" />}
          {personDetected ? t.practice.personDetected : t.practice.personNotDetected}
        </div>
      </header>

      <div className="mt-4 grid min-w-0 grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative h-[clamp(18rem,58dvh,36rem)] min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm outline-1 outline-offset-2 outline-zinc-200 lg:h-[max(18rem,calc(100dvh_-_16rem))]">
          <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
            <video
              ref={videoCallbackRef}
              autoPlay
              playsInline
              muted
              className="size-full object-cover"
            />
            <PoseOverlayCanvas
              videoRef={videoRef}
              poseRef={poseRef}
              visualRef={postureVisualRef}
              connections={connections}
              className="absolute inset-0 size-full"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
            <p aria-live="polite" className={cn(
              "max-w-full rounded-2xl px-3 py-1.5 text-center text-base font-semibold leading-snug shadow sm:px-4 sm:text-lg md:text-xl",
              statusColor,
            )}>
              {statusText}
            </p>
          </div>

          {/* Developer diagnostics: hidden from learners. Set NEXT_PUBLIC_CPR_DEBUG=1 to show them. */}
          {SHOW_DEBUG_PANELS && (
          <>
          {/* TEMPORARY: camera diagnostics panel for debugging the Safari black-video issue. Remove after root cause is found. */}
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-tight text-lime-300">
            <p>camera status: {cameraStatus}</p>
            <p>error: {errorMessage ?? "none"}</p>
            <p>srcObject present: {String(diagnostics.hasSrcObject)}</p>
            <p>stream active: {String(diagnostics.streamActive)}</p>
            <p>track readyState: {diagnostics.trackReadyState}</p>
            <p>track enabled: {String(diagnostics.trackEnabled)}</p>
            <p>video size: {diagnostics.videoWidth}x{diagnostics.videoHeight}</p>
            <p>video.readyState: {diagnostics.videoReadyState}</p>
            <p>video.paused: {String(diagnostics.videoPaused)}</p>
            <p>pose model loaded: {String(!isModelLoading && !modelError)}</p>
          </div>

          {/* TEMPORARY: CPR compression-counter diagnostics panel. Diagnostics only — no thresholds or counting logic changed. Remove after debugging is complete. */}
          <div className="pointer-events-none absolute left-2 top-12 rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-tight text-cyan-300">
            <p>trainingStage: {trainingStage}</p>
            <p>phase: {debug.phase}</p>
            <p>count: {count}</p>
            <p>bpm: {bpm ?? "n/a"}</p>
            <p>bodyMotion: {debug.bodyMotion?.toFixed(4) ?? "n/a"}</p>
            <p>motionAmplitude: {debug.motionAmplitude.toFixed(4)}</p>
            <p>leftElbowAngle: {debug.leftElbowAngle?.toFixed(1) ?? "n/a"}</p>
            <p>rightElbowAngle: {debug.rightElbowAngle?.toFixed(1) ?? "n/a"}</p>
            <p>wristsTogether: {String(debug.wristsTogether)}</p>
            <p>baseline: {debug.baseline?.toFixed(4) ?? "n/a"}</p>
            <p>rawPoseValid: {String(debug.rawPoseValid)}</p>
            <p>effectivePoseValid: {String(debug.effectivePoseValid)}</p>
            <p>invalidDurationMs: {debug.invalidDurationMs.toFixed(0)}</p>
            <p>poseValid: {String(debug.poseValid)}</p>
            <p>reason: {debug.reason}</p>
            <p>rejectionReason: {debug.rejectionReason}</p>
          </div>
          </>
          )}
        </div>
        <div className="grid min-w-0 gap-3">
          {trainingStage === "CALL_HELP" && (
            <Button type="button" variant="outline" onClick={() => setTrainingStage("HAND_POSITION")}
              className="min-h-11 whitespace-normal border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900">
              {guidance.skipCallHelp}
            </Button>
          )}
          {trainingStage !== "CALL_HELP" && <div className="border-l-2 border-red-600 pl-3 text-sm leading-snug text-zinc-700">
            <p className="font-semibold text-zinc-900">{guidance.posture}</p>
            {trainingStage === "COMPRESSIONS" && <p className="mt-1">{guidance.movement}</p>}
            <p className="mt-1">{guidance.highlight}</p>
          </div>}
          {trainingStage === "COMPRESSIONS" && <PracticeMetronome language={language} unit={t.practice.bpm} />}
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center">
            <p className="text-sm font-medium text-zinc-700">{guidance.exerciseGoal}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-950">
              {count}
              <span className="text-base text-zinc-600">/{TARGET_COMPRESSIONS}</span>
            </p>
            {trainingStage === "COMPRESSIONS" && <p className="mt-1 text-sm leading-snug text-zinc-700">{guidance.exerciseLimit}</p>}
          </div>
          <PracticeRhythm rate={liveCadence} language={language} unit={t.practice.bpm} />
        </div>
      </div>

      <Button size="lg" onClick={finish} className="mt-4 min-h-12 w-full bg-red-600 text-base hover:bg-red-700">
        {t.practice.finish}
      </Button>
    </main>
  )
}
