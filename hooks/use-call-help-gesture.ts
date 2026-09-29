"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { POSE_LANDMARK } from "@/lib/pose-connections"
import { distance } from "@/lib/pose-math"

/** Minimum visibility score required on the landmarks we read before trusting the pose at all. */
const MIN_VISIBILITY = 0.5
/** Max wrist-to-ear distance, as a multiple of shoulder width, to count as "phone to ear". */
const MAX_EAR_WRIST_RATIO = 0.45
/** How long the gesture must be held continuously before the stage completes. */
const HOLD_DURATION_MS = 1000

export type CallHelpFeedback = "getCloser" | "holdLonger" | null

interface CallHelpDebug {
  /** Smaller of the left/right wrist-to-ear distances (shoulder-width normalized), or null if untrackable. */
  wristEarDistance: number | null
  /** Milliseconds the gesture has been held continuously in the current attempt, clamped to HOLD_DURATION_MS. */
  holdTime: number
}

interface UseCallHelpGestureOptions {
  /** Called exactly once, the moment the gesture has been held for HOLD_DURATION_MS. */
  onComplete: () => void
}

interface UseCallHelpGestureResult {
  completed: boolean
  feedbackKey: CallHelpFeedback
  debug: CallHelpDebug
  /** Feed the latest pose landmarks in; call every detection frame while this stage is active. */
  update: (landmarks: PoseKeypoint[] | null) => void
  reset: () => void
}

const INITIAL_DEBUG: CallHelpDebug = { wristEarDistance: null, holdTime: 0 }

/**
 * Detects a "phone to ear" gesture: either wrist held near its corresponding ear continuously
 * for HOLD_DURATION_MS. Deliberately does not accept a hand merely passing near the head —
 * the hold timer resets the instant the distance check fails.
 */
export function useCallHelpGesture({ onComplete }: UseCallHelpGestureOptions): UseCallHelpGestureResult {
  const [completed, setCompleted] = useState(false)
  const [feedbackKey, setFeedbackKey] = useState<CallHelpFeedback>(null)
  const [debug, setDebug] = useState<CallHelpDebug>(INITIAL_DEBUG)

  const holdStartRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    holdStartRef.current = null
    completedRef.current = false
    setCompleted(false)
    setFeedbackKey(null)
    setDebug(INITIAL_DEBUG)
  }, [])

  const update = useCallback((landmarks: PoseKeypoint[] | null) => {
    if (completedRef.current) return

    if (!landmarks) {
      holdStartRef.current = null
      setFeedbackKey(null)
      setDebug(INITIAL_DEBUG)
      return
    }

    const leftShoulder = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
    const leftEar = landmarks[POSE_LANDMARK.LEFT_EAR]
    const rightEar = landmarks[POSE_LANDMARK.RIGHT_EAR]
    const leftWrist = landmarks[POSE_LANDMARK.LEFT_WRIST]
    const rightWrist = landmarks[POSE_LANDMARK.RIGHT_WRIST]

    const scaleOk =
      leftShoulder &&
      rightShoulder &&
      (leftShoulder.visibility ?? 1) >= MIN_VISIBILITY &&
      (rightShoulder.visibility ?? 1) >= MIN_VISIBILITY

    if (!scaleOk) {
      holdStartRef.current = null
      setFeedbackKey(null)
      setDebug(INITIAL_DEBUG)
      return
    }

    const shoulderWidth = distance(leftShoulder, rightShoulder)
    if (shoulderWidth <= 0.001) {
      holdStartRef.current = null
      setFeedbackKey(null)
      setDebug(INITIAL_DEBUG)
      return
    }

    const leftValid = leftEar && leftWrist && (leftEar.visibility ?? 1) >= MIN_VISIBILITY && (leftWrist.visibility ?? 1) >= MIN_VISIBILITY
    const rightValid =
      rightEar && rightWrist && (rightEar.visibility ?? 1) >= MIN_VISIBILITY && (rightWrist.visibility ?? 1) >= MIN_VISIBILITY

    const leftRatio = leftValid ? distance(leftWrist, leftEar) / shoulderWidth : null
    const rightRatio = rightValid ? distance(rightWrist, rightEar) / shoulderWidth : null

    const ratios = [leftRatio, rightRatio].filter((r): r is number => r !== null)
    const wristEarDistance = ratios.length > 0 ? Math.min(...ratios) : null

    const isClose = (leftRatio !== null && leftRatio <= MAX_EAR_WRIST_RATIO) || (rightRatio !== null && rightRatio <= MAX_EAR_WRIST_RATIO)

    const now = performance.now()

    if (isClose) {
      if (holdStartRef.current === null) holdStartRef.current = now
      const holdTime = Math.min(HOLD_DURATION_MS, now - holdStartRef.current)
      setFeedbackKey(null)
      setDebug({ wristEarDistance, holdTime })

      if (now - holdStartRef.current >= HOLD_DURATION_MS) {
        completedRef.current = true
        setCompleted(true)
        onCompleteRef.current()
      }
    } else {
      const wasHolding = holdStartRef.current !== null
      holdStartRef.current = null
      setFeedbackKey(wasHolding ? "holdLonger" : "getCloser")
      setDebug({ wristEarDistance, holdTime: 0 })
    }
  }, [])

  useEffect(() => reset, [reset])

  return { completed, feedbackKey, debug, update, reset }
}
