"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { POSE_LANDMARK } from "@/lib/pose-connections"
import { distance } from "@/lib/pose-math"

/** Minimum visibility score required on the landmarks we read before trusting the pose at all. */
const MIN_VISIBILITY = 0.5
/**
 * Max wrist-to-ear distance, as a multiple of shoulder width, to count as "phone to ear".
 * Previously 0.45, which effectively required the fist to touch the ear (the wrist sits a hand's
 * length below the ear in a natural phone pose).
 */
const MAX_EAR_WRIST_RATIO = 0.6
/**
 * The wrist must also be above its shoulder and no higher than slightly above the ear, so a hand
 * raised over the head or waved in front of the chest cannot pass just by being within range.
 * Expressed as a multiple of shoulder width above the ear (negative y is up in image space).
 */
const MAX_WRIST_ABOVE_EAR_RATIO = 0.25
/** Wrist must be at least this fraction of the nose-to-ear horizontal offset out to the side of the face. */
const MIN_SIDE_OFFSET_FRACTION = 0.5
/** MediaPipe Pose landmark index for the nose. */
const NOSE_INDEX = 0
/** How long the gesture must be held continuously before the stage completes (previously 1000 ms). */
const HOLD_DURATION_MS = 700
/**
 * A brief tracking dropout inside a hold doesn't restart the timer; anything longer does. Well
 * below the hold duration, so a single accidental frame can never complete the stage.
 */
const HOLD_DROPOUT_GRACE_MS = 150

export type CallHelpFeedback = "getCloser" | "holdLonger" | null

export type CallHelpSide = "left" | "right" | null

interface CallHelpDebug {
  /** Smaller of the left/right wrist-to-ear distances (shoulder-width normalized), or null if untrackable. */
  wristEarDistance: number | null
  /** Which hand currently satisfies the phone gesture, used to color that wrist green. */
  activeSide: CallHelpSide
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

const INITIAL_DEBUG: CallHelpDebug = { wristEarDistance: null, activeSide: null, holdTime: 0 }

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
  const lastCloseRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    holdStartRef.current = null
    lastCloseRef.current = null
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

    const isPhonePose = (
      ratio: number | null,
      wrist: PoseKeypoint | undefined,
      ear: PoseKeypoint | undefined,
      shoulder: PoseKeypoint,
    ) =>
      ratio !== null &&
      !!wrist &&
      !!ear &&
      ratio <= MAX_EAR_WRIST_RATIO &&
      wrist.y < shoulder.y &&
      ear.y - wrist.y <= MAX_WRIST_ABOVE_EAR_RATIO * shoulderWidth &&
      isBesideHead(wrist, ear)

    const nose = landmarks[NOSE_INDEX]
    const noseVisible = !!nose && (nose.visibility ?? 1) >= MIN_VISIBILITY
    // The wrist must sit on the ear's side of the face (not in front of the mouth/chin).
    const isBesideHead = (wrist: PoseKeypoint, ear: PoseKeypoint) => {
      if (!noseVisible) return true
      const earOffset = ear.x - nose.x
      const wristOffset = wrist.x - nose.x
      return Math.sign(wristOffset) === Math.sign(earOffset) && Math.abs(wristOffset) >= MIN_SIDE_OFFSET_FRACTION * Math.abs(earOffset)
    }

    const leftClose = isPhonePose(leftRatio, leftWrist, leftEar, leftShoulder)
    const rightClose = isPhonePose(rightRatio, rightWrist, rightEar, rightShoulder)
    const activeSide: CallHelpSide =
      leftClose && rightClose ? ((leftRatio ?? 1) <= (rightRatio ?? 1) ? "left" : "right") : leftClose ? "left" : rightClose ? "right" : null

    const now = performance.now()

    if (activeSide) {
      lastCloseRef.current = now
      if (holdStartRef.current === null) holdStartRef.current = now
      const holdTime = Math.min(HOLD_DURATION_MS, now - holdStartRef.current)
      setFeedbackKey(null)
      setDebug({ wristEarDistance, activeSide, holdTime })

      if (now - holdStartRef.current >= HOLD_DURATION_MS) {
        completedRef.current = true
        setCompleted(true)
        onCompleteRef.current()
      }
    } else if (holdStartRef.current !== null && lastCloseRef.current !== null && now - lastCloseRef.current <= HOLD_DROPOUT_GRACE_MS) {
      // Brief dropout inside a hold: keep the timer and the green wrist, but don't complete on it.
      setDebug((prev) => ({ ...prev, wristEarDistance }))
    } else {
      const wasHolding = holdStartRef.current !== null
      holdStartRef.current = null
      lastCloseRef.current = null
      setFeedbackKey(wasHolding ? "holdLonger" : "getCloser")
      setDebug({ wristEarDistance, activeSide: null, holdTime: 0 })
    }
  }, [])

  useEffect(() => reset, [reset])

  return { completed, feedbackKey, debug, update, reset }
}
