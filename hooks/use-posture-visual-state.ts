"use client"

import { useEffect, useRef } from "react"
import type { TrainingStage } from "@/lib/types"
import type { HandPositionReason } from "@/hooks/use-hand-position-validation"
import type { PoseInvalidReason } from "@/hooks/use-compression-counter"
import { POSE_HOLD_MS } from "@/lib/pose-stabilizer"
import {
  NEUTRAL_VISUAL_STATE,
  type PostureMessageKey,
  type PostureVisualState,
  type SegmentState,
} from "@/lib/posture-visual"

/** Per-segment target; `undefined` means "not evaluated by the validator this frame, keep last stable value". */
type VisualCandidate = Partial<PostureVisualState>

const ALL_VALID: PostureVisualState = {
  leftArm: "valid",
  rightArm: "valid",
  leftWrist: "valid",
  rightWrist: "valid",
  leftShoulder: "valid",
  rightShoulder: "valid",
}

const arms = (left: SegmentState, right: SegmentState): VisualCandidate => ({ leftArm: left, rightArm: right })
const wrists = (state: SegmentState): VisualCandidate => ({ leftWrist: state, rightWrist: state })
const shoulders = (state: SegmentState): VisualCandidate => ({ leftShoulder: state, rightShoulder: state })

/**
 * HAND_POSITION checks elbows first, then wrists, then shoulder alignment, so any check that
 * comes before the failing one is known to have passed and any after it was never evaluated.
 */
function fromHandPositionReason(reason: HandPositionReason): VisualCandidate {
  switch (reason) {
    case "VALID":
      return ALL_VALID
    case "BOTH_ELBOWS_BENT":
      return arms("invalid", "invalid")
    case "LEFT_ELBOW_BENT":
      return arms("invalid", "valid")
    case "RIGHT_ELBOW_BENT":
      return arms("valid", "invalid")
    case "WRISTS_TOO_FAR":
      return { ...arms("valid", "valid"), ...wrists("invalid") }
    case "SHOULDER_ALIGNMENT":
      return { ...arms("valid", "valid"), ...wrists("valid"), ...shoulders("invalid") }
    case "MISSING_LANDMARKS":
      return NEUTRAL_VISUAL_STATE
  }
}

/** COMPRESSIONS checks wrists first, then elbows; it never evaluates shoulder alignment. */
function fromCompressionReason(reason: PoseInvalidReason): VisualCandidate {
  switch (reason) {
    case "VALID":
      return { ...arms("valid", "valid"), ...wrists("valid") }
    case "WRISTS_TOO_FAR":
      return wrists("invalid")
    case "BOTH_ARMS_BENT":
      return { ...arms("invalid", "invalid"), ...wrists("valid") }
    case "LEFT_ARM_BENT":
      return { ...arms("invalid", "valid"), ...wrists("valid") }
    case "RIGHT_ARM_BENT":
      return { ...arms("valid", "invalid"), ...wrists("valid") }
    case "MISSING_LANDMARKS":
    case "LOW_VISIBILITY":
      return NEUTRAL_VISUAL_STATE
  }
}

/** Posture message for the COMPRESSIONS stage, only once the counter itself treats the pose as invalid (past its grace window). */
export function compressionPostureMessage(reason: PoseInvalidReason, effectivePoseValid: boolean): PostureMessageKey | null {
  if (effectivePoseValid) return null
  switch (reason) {
    case "WRISTS_TOO_FAR":
      return "bringWristsTogether"
    case "BOTH_ARMS_BENT":
      return "straightenElbows"
    case "LEFT_ARM_BENT":
      return "straightenLeftElbow"
    case "RIGHT_ARM_BENT":
      return "straightenRightElbow"
    default:
      return null
  }
}

function merge(current: PostureVisualState, candidate: VisualCandidate): PostureVisualState {
  return { ...current, ...candidate }
}

function sameState(a: PostureVisualState, b: PostureVisualState): boolean {
  return (
    a.leftArm === b.leftArm &&
    a.rightArm === b.rightArm &&
    a.leftWrist === b.leftWrist &&
    a.rightWrist === b.rightWrist &&
    a.leftShoulder === b.leftShoulder &&
    a.rightShoulder === b.rightShoulder
  )
}

interface UsePostureVisualStateOptions {
  stage: TrainingStage
  /** The HAND_POSITION hook's debug snapshot (a new object every processed frame). */
  handPositionDebug: { reason: HandPositionReason }
  /** The compression counter's debug snapshot (a new object every processed frame). */
  compressionDebug: { reason: PoseInvalidReason; rawPoseValid: boolean; effectivePoseValid: boolean }
}

/**
 * Converts the reasons already produced by the validation hooks into per-segment skeleton
 * colors, exposed as a ref so the canvas rAF loop always reads the latest value without React
 * re-rendering it. No thresholds live here; only the validators' own verdicts are used.
 */
export function usePostureVisualState({ stage, handPositionDebug, compressionDebug }: UsePostureVisualStateOptions) {
  const visualRef = useRef<PostureVisualState>(NEUTRAL_VISUAL_STATE)
  const pendingRef = useRef<{ state: PostureVisualState; since: number } | null>(null)

  useEffect(() => {
    if (stage === "CALL_HELP") {
      pendingRef.current = null
      visualRef.current = NEUTRAL_VISUAL_STATE
      return
    }

    let candidate: VisualCandidate
    if (stage === "HAND_POSITION") {
      candidate = fromHandPositionReason(handPositionDebug.reason)
    } else {
      // Inside the counter's grace window (raw invalid, effective still valid) the counter
      // freezes its state, so the skeleton holds its last stable colors too.
      if (!compressionDebug.rawPoseValid && compressionDebug.effectivePoseValid) return
      candidate = fromCompressionReason(compressionDebug.reason)
    }

    const current = visualRef.current
    const next = merge(current, candidate)
    if (sameState(next, current)) {
      pendingRef.current = null
      return
    }

    if (stage === "COMPRESSIONS") {
      // Already debounced by the counter's own grace period.
      pendingRef.current = null
      visualRef.current = next
      return
    }

    // HAND_POSITION has no grace period of its own; require the new verdict to persist for the
    // same hold window the pose stabilizer uses before recoloring, so one noisy frame can't flicker.
    const now = performance.now()
    const pending = pendingRef.current
    if (!pending || !sameState(pending.state, next)) {
      pendingRef.current = { state: next, since: now }
      return
    }
    if (now - pending.since >= POSE_HOLD_MS) {
      pendingRef.current = null
      visualRef.current = next
    }
  }, [stage, handPositionDebug, compressionDebug])

  return visualRef
}
