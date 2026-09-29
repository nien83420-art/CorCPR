"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { POSE_LANDMARK } from "@/lib/pose-connections"
import { angleAtJoint, distance } from "@/lib/pose-math"

/** Minimum visibility score required on all six arm landmarks before trusting the pose at all. */
const MIN_VISIBILITY = 0.5
/** Elbow angle (degrees) required to treat the arms as straight for the CPR starting posture. */
const MIN_ELBOW_ANGLE_DEG = 160
/** Max wrist-to-wrist distance, as a multiple of shoulder width, to count as "hands stacked". */
const MAX_WRIST_DISTANCE_RATIO = 0.5
/** How far below the shoulder line (normalized by shoulder width) the wrists must sit. */
const MIN_ALIGNMENT_RATIO = 0.1
/** How long the correct posture must be held continuously before the stage completes. */
const STABLE_DURATION_MS = 600

export type HandPositionReason = "MISSING_LANDMARKS" | "ELBOWS_BENT" | "WRISTS_TOO_FAR" | "SHOULDER_ALIGNMENT" | "VALID"
export type HandPositionFeedback = "straightenElbows" | "bringWristsTogether" | "shouldersOverHands" | null

interface HandPositionDebug {
  leftElbowAngle: number | null
  rightElbowAngle: number | null
  wristDistanceRatio: number | null
  /** (wristAvgY - shoulderAvgY) / shoulderWidth. Positive and above MIN_ALIGNMENT_RATIO means hands are correctly below the shoulders. */
  shoulderHandAlignment: number | null
  stableTime: number
  reason: HandPositionReason
}

interface UseHandPositionValidationOptions {
  /** Called exactly once, the moment the correct posture has been held for STABLE_DURATION_MS. */
  onComplete: () => void
}

interface UseHandPositionValidationResult {
  completed: boolean
  feedbackKey: HandPositionFeedback
  debug: HandPositionDebug
  /** Feed the latest pose landmarks in; call every detection frame while this stage is active. */
  update: (landmarks: PoseKeypoint[] | null) => void
  reset: () => void
}

const INITIAL_DEBUG: HandPositionDebug = {
  leftElbowAngle: null,
  rightElbowAngle: null,
  wristDistanceRatio: null,
  shoulderHandAlignment: null,
  stableTime: 0,
  reason: "MISSING_LANDMARKS",
}

function reasonToFeedback(reason: HandPositionReason): HandPositionFeedback {
  switch (reason) {
    case "ELBOWS_BENT":
      return "straightenElbows"
    case "WRISTS_TOO_FAR":
      return "bringWristsTogether"
    case "SHOULDER_ALIGNMENT":
      return "shouldersOverHands"
    default:
      return null
  }
}

/**
 * Validates the correct CPR starting posture (straight arms, hands stacked, shoulders above
 * hands) and requires it to remain stable for STABLE_DURATION_MS before advancing — a single
 * noisy frame can never trigger completion.
 */
export function useHandPositionValidation({ onComplete }: UseHandPositionValidationOptions): UseHandPositionValidationResult {
  const [completed, setCompleted] = useState(false)
  const [feedbackKey, setFeedbackKey] = useState<HandPositionFeedback>(null)
  const [debug, setDebug] = useState<HandPositionDebug>(INITIAL_DEBUG)

  const stableStartRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const reset = useCallback(() => {
    stableStartRef.current = null
    completedRef.current = false
    setCompleted(false)
    setFeedbackKey(null)
    setDebug(INITIAL_DEBUG)
  }, [])

  const update = useCallback((landmarks: PoseKeypoint[] | null) => {
    if (completedRef.current) return

    const fail = (reason: HandPositionReason, partial?: Partial<HandPositionDebug>) => {
      stableStartRef.current = null
      setFeedbackKey(reasonToFeedback(reason))
      setDebug({ ...INITIAL_DEBUG, ...partial, reason, stableTime: 0 })
    }

    if (!landmarks) {
      fail("MISSING_LANDMARKS")
      return
    }

    const leftShoulder = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
    const leftElbow = landmarks[POSE_LANDMARK.LEFT_ELBOW]
    const rightElbow = landmarks[POSE_LANDMARK.RIGHT_ELBOW]
    const leftWrist = landmarks[POSE_LANDMARK.LEFT_WRIST]
    const rightWrist = landmarks[POSE_LANDMARK.RIGHT_WRIST]

    const required = [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist]
    const allPresent = required.every((p) => p && (p.visibility ?? 1) >= MIN_VISIBILITY)

    if (!allPresent) {
      fail("MISSING_LANDMARKS")
      return
    }

    const shoulderWidth = distance(leftShoulder, rightShoulder)
    if (shoulderWidth <= 0.001) {
      fail("MISSING_LANDMARKS")
      return
    }

    const leftElbowAngle = angleAtJoint(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = angleAtJoint(rightShoulder, rightElbow, rightWrist)
    const wristDistanceRatio = distance(leftWrist, rightWrist) / shoulderWidth

    const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2
    const wristAvgY = (leftWrist.y + rightWrist.y) / 2
    const shoulderHandAlignment = (wristAvgY - shoulderAvgY) / shoulderWidth

    const armsStraight = leftElbowAngle >= MIN_ELBOW_ANGLE_DEG && rightElbowAngle >= MIN_ELBOW_ANGLE_DEG
    const handsTogether = wristDistanceRatio <= MAX_WRIST_DISTANCE_RATIO
    const alignmentOk = shoulderHandAlignment > MIN_ALIGNMENT_RATIO

    const debugFields = { leftElbowAngle, rightElbowAngle, wristDistanceRatio, shoulderHandAlignment }

    if (!armsStraight) {
      fail("ELBOWS_BENT", debugFields)
      return
    }
    if (!handsTogether) {
      fail("WRISTS_TOO_FAR", debugFields)
      return
    }
    if (!alignmentOk) {
      fail("SHOULDER_ALIGNMENT", debugFields)
      return
    }

    // Posture is correct this frame — accumulate stable-hold time.
    const now = performance.now()
    if (stableStartRef.current === null) stableStartRef.current = now
    const stableTime = now - stableStartRef.current

    setFeedbackKey(null)
    setDebug({ ...debugFields, stableTime, reason: "VALID" })

    if (stableTime >= STABLE_DURATION_MS) {
      completedRef.current = true
      setCompleted(true)
      onCompleteRef.current()
    }
  }, [])

  useEffect(() => reset, [reset])

  return { completed, feedbackKey, debug, update, reset }
}
