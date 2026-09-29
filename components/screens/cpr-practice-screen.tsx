"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PoseOverlayCanvas } from "@/components/pose-overlay-canvas"
import { useCamera } from "@/hooks/use-camera"
import { usePoseLandmarker } from "@/hooks/use-pose-landmarker"
import { useCallHelpGesture } from "@/hooks/use-call-help-gesture"
import { useHandPositionValidation } from "@/hooks/use-hand-position-validation"
import { useCompressionCounter } from "@/hooks/use-compression-counter"
import { cn } from "@/lib/utils"
import type { Translations } from "@/lib/i18n"
import type { RatingKey, SessionResult, TrainingStage } from "@/lib/types"

const TARGET_COMPRESSIONS = 30

interface CprPracticeScreenProps {
  t: Translations
  onComplete: (result: SessionResult) => void
}

function rateResult(totalCompressions: number, averageBpm: number): RatingKey {
  if (totalCompressions === 0) return "needsWork"
  if (averageBpm >= 100 && averageBpm <= 120) return "excellent"
  if (averageBpm >= 90 && averageBpm <= 130) return "good"
  return "needsWork"
}

export function CprPracticeScreen({ t, onComplete }: CprPracticeScreenProps) {
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

  const { feedbackKey: callHelpFeedback, update: updateCallHelp } = useCallHelpGesture({
    onComplete: () => setTrainingStage("HAND_POSITION"),
  })

  const { feedbackKey: handPositionFeedback, update: updateHandPosition } = useHandPositionValidation({
    onComplete: () => setTrainingStage("COMPRESSIONS"),
  })

  const { count, bpm, status, update, reset, debug } = useCompressionCounter(TARGET_COMPRESSIONS)
  const startTimeRef = useRef<number>(Date.now())
  const completedRef = useRef(false)
  const latestRef = useRef({ count, bpm })
  latestRef.current = { count, bpm }

  useEffect(() => {
    if (trainingStage !== "COMPRESSIONS") return
    reset()
  }, [trainingStage, reset])

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
      averageBpm,
      durationSeconds,
      rating: rateResult(finalCount, averageBpm),
    })
  }, [onComplete])

  useEffect(() => {
    if (count >= TARGET_COMPRESSIONS) {
      finish()
    }
  }, [count, finish])

  if (cameraStatus === "denied" || cameraStatus === "unavailable" || cameraStatus === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
          <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-foreground">{t.practice.permissionTitle}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{errorMessage ?? t.practice.permissionBody}</p>
        <Button size="lg" onClick={retry} className="mt-8 h-12 w-full max-w-xs bg-red-600 hover:bg-red-700">
          {t.practice.retry}
        </Button>
      </div>
    )
  }

  if (!cameraReady || isModelLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
        <Loader2 className="size-10 animate-spin text-red-600" aria-hidden="true" />
        <p className="mt-6 text-sm text-muted-foreground">
          {!cameraReady ? t.practice.permissionBody : t.practice.loadingModel}
        </p>
      </div>
    )
  }

  if (modelError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
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
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-6">
      <header className="flex items-center justify-between px-2">
        <h1 className="text-lg font-bold text-foreground">{t.practice.title}</h1>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            personDetected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-muted text-muted-foreground",
          )}
        >
          {personDetected ? <UserCheck className="size-3.5" aria-hidden="true" /> : <UserX className="size-3.5" aria-hidden="true" />}
          {personDetected ? t.practice.personDetected : t.practice.personNotDetected}
        </div>
      </header>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl bg-black">
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
            connections={connections}
            className="absolute inset-0 size-full"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
          <div className={cn("rounded-full px-4 py-1.5 text-sm font-semibold shadow", statusColor)}>{statusText}</div>
        </div>

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
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">{t.practice.compressions}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {count}
            <span className="text-base text-muted-foreground">/{TARGET_COMPRESSIONS}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">{t.practice.target}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {bpm ?? "--"}
            <span className="text-base text-muted-foreground"> {t.practice.bpm}</span>
          </p>
        </div>
      </div>

      <Button size="lg" onClick={finish} className="mt-4 h-12 w-full bg-red-600 text-base hover:bg-red-700">
        {t.practice.finish}
      </Button>
    </div>
  )
}
