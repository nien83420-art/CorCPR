"use client"

import { useCallback, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { POSE_LANDMARK } from "@/lib/pose-connections"
import { angleAtJoint, distance, minVisibility } from "@/lib/pose-math"

/** Minimum visibility score required on all six arm landmarks before we trust the pose at all. */
const MIN_VISIBILITY = 0.45
/** Max wrist-to-wrist distance, as a multiple of shoulder width, to count as "hands together". */
const MAX_WRIST_DISTANCE_RATIO = 0.85
/**
 * Minimum elbow angle (degrees) required to treat an arm as reasonably straight. Lowered from a
 * stricter value so normal front-camera perspective (which foreshortens the arm and reads a
 * slightly smaller angle even on genuinely straight arms) doesn't reject real compressions.
 */
const MIN_ELBOW_ANGLE_DEG = 130

/**
 * Exponential smoothing factor applied to the shoulder-line and wrist-line signals. Higher = more
 * responsive (less lag, so fast 100-120bpm compressions aren't missed), at the cost of passing
 * through a bit more MediaPipe jitter than a heavier filter would.
 */
const SMOOTHING_ALPHA = 0.5
/** Slow adaptation rate for the resting baseline while in READY, so a stable stance can drift without ever "resetting". */
const BASELINE_ALPHA = 0.08
/**
 * How far the shoulder line has to move down from baseline (in shoulder widths) before we treat
 * it as the *start* of a downstroke. Deliberately small: this only opens the door to a candidate
 * stroke, it is not the bar for counting one (see MIN_AMPLITUDE_RATIO below). A realistic
 * front-facing-laptop compression produces a much smaller on-screen shoulder shift than the
 * physical ~5cm compression depth, so this is intentionally far below the old 0.14 threshold.
 */
const DOWN_TRIGGER_RATIO = 0.03
/**
 * Minimum total shoulder-line travel (in shoulder widths) a completed down->up cycle must reach
 * to be counted as a real compression, rather than sensor noise that briefly crossed the trigger.
 */
const MIN_AMPLITUDE_RATIO = 0.045
/** How close back to baseline (in shoulder widths) the shoulder line must return to register a release. */
const RELEASE_RATIO = 0.015
/**
 * Minimum downward wrist travel, as a fraction of the shoulder-line amplitude, required during a
 * stroke. This is the "wrists move in the same general direction as the shoulders" validation:
 * it rejects a torso bob/squat where the arms don't participate, while tolerating some slack for
 * the fact that locked-arm CPR moves the wrists by roughly the same amount as the shoulders, not
 * necessarily more.
 */
const MIN_WRIST_DIRECTION_RATIO = -0.25
/** Refractory period after a completed compression before another can be counted; filters residual jitter double-counts. */
const REFRACTORY_MS = 220
/**
 * Grace period (ms) during which a single bad frame - pose temporarily lost, one noisy elbow
 * reading, a momentary low-confidence landmark - does not cancel an in-progress stroke. Only
 * *sustained* invalid posture past this window cancels it.
 */
const GRACE_MS = 350
/** How many recent compression intervals to average for BPM. */
const BPM_WINDOW = 8

export type CompressionStatus = "waiting" | "too-slow" | "good" | "too-fast"

/** READY -> DESCENDING -> BOTTOM -> ASCENDING -> RELEASED (transient, then back to READY). */
type MotionPhase = "ready" | "descending" | "bottom" | "ascending" | "released"

/** Why the pose is (or was) not currently trustworthy/valid for compression detection. */
export type PoseInvalidReason =
  | "VALID"
  | "MISSING_LANDMARKS"
  | "LOW_VISIBILITY"
  | "WRISTS_TOO_FAR"
  | "LEFT_ARM_BENT"
  | "RIGHT_ARM_BENT"
  | "BOTH_ARMS_BENT"

/** Debug-facing reason a candidate stroke did not (yet) result in a counted compression. */
export type RejectionReason =
  | "NONE"
  | "NO_BODY_MOTION"
  | "AMPLITUDE_TOO_SMALL"
  | "LEFT_ARM_BENT"
  | "RIGHT_ARM_BENT"
  | "BOTH_ARMS_BENT"
  | "WRISTS_APART"
  | "POSE_LOST"
  | "INCOMPLETE_CYCLE"
  | "REFRACTORY_PERIOD"

interface CompressionDebug {
  phase: MotionPhase
  /** Effective pose validity: true if this frame's pose is trustworthy, OR a transient loss is
   *  still within the grace window (state is being preserved off the last reliable pose). This
   *  is what the state machine actually acts on. */
  poseValid: boolean
  /** This exact frame's raw pose validity, with no grace applied. Can be false while
   *  `poseValid`/`effectivePoseValid` is still true (mid grace-window). */
  rawPoseValid: boolean
  /** Alias of `poseValid`, spelled out for debug clarity. Always equal to `poseValid`. */
  effectivePoseValid: boolean
  /** How long (ms) the raw pose has been continuously invalid, or 0 while raw-valid. */
  invalidDurationMs: number
  /** Kept for backwards compatibility with existing debug UI; mirrors `phase`. */
  motionPhase: MotionPhase
  reason: PoseInvalidReason
  rejectionReason: RejectionReason
  leftElbowAngle: number | null
  rightElbowAngle: number | null
  wristDistanceRatio: number | null
  wristsTogether: boolean
  /** Normalized vertical shoulder-line motion relative to the resting baseline (shoulder widths, positive = moved down). */
  bodyMotion: number | null
  /** Kept for backwards compatibility with existing debug UI; mirrors `bodyMotion`'s magnitude while mid-stroke. */
  motionAmplitude: number
  baseline: number | null
  downThreshold: number | null
  leftVisibility: number | null
  rightVisibility: number | null
  timeSinceLastCompression: number | null
}

interface UseCompressionCounterResult {
  count: number
  bpm: number | null
  status: CompressionStatus
  reset: () => void
  /** Feed the latest pose landmarks in; call every detection frame. */
  update: (landmarks: PoseKeypoint[] | null) => void
  /** Debug snapshot of the last processed frame, for on-screen diagnostics. */
  debug: CompressionDebug
}

const INITIAL_DEBUG: CompressionDebug = {
  phase: "ready",
  poseValid: false,
  rawPoseValid: false,
  effectivePoseValid: false,
  invalidDurationMs: 0,
  motionPhase: "ready",
  reason: "MISSING_LANDMARKS",
  rejectionReason: "POSE_LOST",
  leftElbowAngle: null,
  rightElbowAngle: null,
  wristDistanceRatio: null,
  wristsTogether: false,
  bodyMotion: null,
  motionAmplitude: 0,
  baseline: null,
  downThreshold: null,
  leftVisibility: null,
  rightVisibility: null,
  timeSinceLastCompression: null,
}

export function useCompressionCounter(targetCount: number): UseCompressionCounterResult {
  const [count, setCount] = useState(0)
  const [bpm, setBpm] = useState<number | null>(null)
  const [status, setStatus] = useState<CompressionStatus>("waiting")
  const [debug, setDebug] = useState<CompressionDebug>(INITIAL_DEBUG)

  // Primary signal: smoothed shoulder-line Y, tracked against a slow-moving resting baseline.
  // Wrist-line Y is tracked alongside it purely for validation (same-direction check), never as
  // the primary trigger.
  const smoothedShoulderYRef = useRef<number | null>(null)
  const smoothedWristYRef = useRef<number | null>(null)
  const baselineRef = useRef<number | null>(null)

  const phaseRef = useRef<MotionPhase>("ready")
  const extremeShoulderYRef = useRef<number | null>(null)
  const shoulderYAtStrokeStartRef = useRef<number | null>(null)
  const wristYAtStrokeStartRef = useRef<number | null>(null)
  const wristYAtExtremeRef = useRef<number | null>(null)

  // Grace-period bookkeeping: timestamp the pose *first* became invalid, so a single bad frame
  // doesn't immediately cancel an in-progress stroke, but sustained invalid posture still does.
  const invalidSinceRef = useRef<number | null>(null)

  const lastCompressionTimeRef = useRef<number | null>(null)
  const intervalsRef = useRef<number[]>([])
  const countRef = useRef(0)

  /** Full reset: clears counters, BPM history, and all motion tracking. */
  const reset = useCallback(() => {
    smoothedShoulderYRef.current = null
    smoothedWristYRef.current = null
    baselineRef.current = null
    phaseRef.current = "ready"
    extremeShoulderYRef.current = null
    shoulderYAtStrokeStartRef.current = null
    wristYAtStrokeStartRef.current = null
    wristYAtExtremeRef.current = null
    invalidSinceRef.current = null
    lastCompressionTimeRef.current = null
    intervalsRef.current = []
    countRef.current = 0
    setCount(0)
    setBpm(null)
    setStatus("waiting")
    setDebug(INITIAL_DEBUG)
  }, [])

  /**
   * Cancels any in-progress stroke and clears stroke-scoped motion tracking (but never touches
   * count/bpm, and never touches the baseline - a fresh baseline is re-established on the next
   * valid frame). Used once sustained invalid posture (past the grace period) makes the
   * in-progress stroke untrustworthy.
   */
  const cancelStroke = () => {
    smoothedShoulderYRef.current = null
    smoothedWristYRef.current = null
    baselineRef.current = null
    phaseRef.current = "ready"
    extremeShoulderYRef.current = null
    shoulderYAtStrokeStartRef.current = null
    wristYAtStrokeStartRef.current = null
    wristYAtExtremeRef.current = null
  }

  const update = useCallback(
    (landmarks: PoseKeypoint[] | null) => {
      if (countRef.current >= targetCount) return

      const now = performance.now()

      // --- Step 1: figure out whether this frame's pose is trustworthy, and why not if it isn't. ---
      let poseValid = false
      let invalidReason: PoseInvalidReason = "MISSING_LANDMARKS"
      let rejectionForInvalid: RejectionReason = "POSE_LOST"
      let leftElbowAngle: number | null = null
      let rightElbowAngle: number | null = null
      let wristDistanceRatio: number | null = null
      let wristsTogether = false
      let leftVisibility: number | null = null
      let rightVisibility: number | null = null
      let shoulderAvgY: number | null = null
      let wristAvgY: number | null = null
      let bodyScale: number | null = null

      if (landmarks) {
        const leftShoulder = landmarks[POSE_LANDMARK.LEFT_SHOULDER]
        const rightShoulder = landmarks[POSE_LANDMARK.RIGHT_SHOULDER]
        const leftElbow = landmarks[POSE_LANDMARK.LEFT_ELBOW]
        const rightElbow = landmarks[POSE_LANDMARK.RIGHT_ELBOW]
        const leftWrist = landmarks[POSE_LANDMARK.LEFT_WRIST]
        const rightWrist = landmarks[POSE_LANDMARK.RIGHT_WRIST]

        const required = [leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist]
        const anyMissing = required.some((p) => !p)
        const allVisible = required.every((p) => p && (p.visibility ?? 1) >= MIN_VISIBILITY)

        leftVisibility = minVisibility([leftShoulder, leftElbow, leftWrist])
        rightVisibility = minVisibility([rightShoulder, rightElbow, rightWrist])

        if (anyMissing) {
          invalidReason = "MISSING_LANDMARKS"
          rejectionForInvalid = "POSE_LOST"
        } else if (!allVisible) {
          invalidReason = "LOW_VISIBILITY"
          rejectionForInvalid = "POSE_LOST"
        } else {
          const shoulderWidth = distance(leftShoulder, rightShoulder)
          if (shoulderWidth <= 0.001) {
            invalidReason = "MISSING_LANDMARKS"
            rejectionForInvalid = "POSE_LOST"
          } else {
            bodyScale = shoulderWidth
            wristDistanceRatio = distance(leftWrist, rightWrist) / shoulderWidth
            wristsTogether = wristDistanceRatio <= MAX_WRIST_DISTANCE_RATIO

            leftElbowAngle = angleAtJoint(leftShoulder, leftElbow, leftWrist)
            rightElbowAngle = angleAtJoint(rightShoulder, rightElbow, rightWrist)
            const leftStraight = leftElbowAngle >= MIN_ELBOW_ANGLE_DEG
            const rightStraight = rightElbowAngle >= MIN_ELBOW_ANGLE_DEG

            shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2
            wristAvgY = (leftWrist.y + rightWrist.y) / 2

            if (!wristsTogether) {
              invalidReason = "WRISTS_TOO_FAR"
              rejectionForInvalid = "WRISTS_APART"
            } else if (!leftStraight && !rightStraight) {
              invalidReason = "BOTH_ARMS_BENT"
              rejectionForInvalid = "BOTH_ARMS_BENT"
            } else if (!leftStraight) {
              invalidReason = "LEFT_ARM_BENT"
              rejectionForInvalid = "LEFT_ARM_BENT"
            } else if (!rightStraight) {
              invalidReason = "RIGHT_ARM_BENT"
              rejectionForInvalid = "RIGHT_ARM_BENT"
            } else {
              poseValid = true
              invalidReason = "VALID"
              rejectionForInvalid = "NONE"
            }
          }
        }
      }

      // --- Step 2: grace period. A single bad frame doesn't cancel an in-progress stroke, and it
      // must not wipe the resting baseline either - otherwise a transient blip that happens to
      // land while we're still in "ready" (e.g. right as the downstroke begins) corrupts the
      // reference point for the whole cycle that follows, even though the cycle itself never
      // gets to "start". So grace protection applies uniformly to every phase, "ready" included:
      // only *sustained* invalid posture (past GRACE_MS) is allowed to reset anything.
      if (!poseValid) {
        if (invalidSinceRef.current === null) invalidSinceRef.current = now
        const invalidElapsed = now - invalidSinceRef.current

        if (invalidElapsed <= GRACE_MS) {
          // Within grace: freeze everything exactly where it was (phase, baseline, stroke
          // tracking all untouched) and just report the current (invalid) frame's diagnostics.
          setDebug({
            phase: phaseRef.current,
            motionPhase: phaseRef.current,
            poseValid: true,
            rawPoseValid: false,
            effectivePoseValid: true,
            invalidDurationMs: invalidElapsed,
            reason: invalidReason,
            rejectionReason: rejectionForInvalid,
            leftElbowAngle,
            rightElbowAngle,
            wristDistanceRatio,
            wristsTogether,
            bodyMotion: null,
            motionAmplitude: 0,
            baseline: baselineRef.current,
            downThreshold: baselineRef.current === null ? null : DOWN_TRIGGER_RATIO,
            leftVisibility,
            rightVisibility,
            timeSinceLastCompression: lastCompressionTimeRef.current === null ? null : now - lastCompressionTimeRef.current,
          })
          return
        }

        // Sustained invalid posture past the grace window: cancel any in-progress stroke (and
        // the baseline, so a later reappearance can't be mistaken for a continuation of it).
        cancelStroke()
        setDebug({
          phase: "ready",
          motionPhase: "ready",
          poseValid: false,
          rawPoseValid: false,
          effectivePoseValid: false,
          invalidDurationMs: invalidElapsed,
          reason: invalidReason,
          rejectionReason: rejectionForInvalid,
          leftElbowAngle,
          rightElbowAngle,
          wristDistanceRatio,
          wristsTogether,
          bodyMotion: null,
          motionAmplitude: 0,
          baseline: null,
          downThreshold: null,
          leftVisibility,
          rightVisibility,
          timeSinceLastCompression: lastCompressionTimeRef.current === null ? null : now - lastCompressionTimeRef.current,
        })
        return
      }

      // Pose is valid this frame: clear the invalid-since marker.
      invalidSinceRef.current = null

      // shoulderAvgY / wristAvgY / bodyScale are guaranteed non-null once poseValid is true.
      const sAvgY = shoulderAvgY as number
      const wAvgY = wristAvgY as number
      const scale = bodyScale as number

      // --- Step 3: smoothing. ---
      const prevShoulderY = smoothedShoulderYRef.current
      const smoothedShoulderY = prevShoulderY === null ? sAvgY : prevShoulderY + SMOOTHING_ALPHA * (sAvgY - prevShoulderY)
      smoothedShoulderYRef.current = smoothedShoulderY

      const prevWristY = smoothedWristYRef.current
      const smoothedWristY = prevWristY === null ? wAvgY : prevWristY + SMOOTHING_ALPHA * (wAvgY - prevWristY)
      smoothedWristYRef.current = smoothedWristY

      const establishingBaseline = baselineRef.current === null
      if (establishingBaseline) {
        baselineRef.current = smoothedShoulderY
      }

      // --- Step 4: READY -> DESCENDING -> BOTTOM -> ASCENDING -> RELEASED state machine. ---
      let phase = phaseRef.current
      let displayPhase: MotionPhase = phase
      let motionAmplitude = 0
      let rejectionReason: RejectionReason = establishingBaseline ? "NO_BODY_MOTION" : "NONE"
      let downThreshold: number

      if (phase === "ready" || phase === "released") {
        phase = "ready"
        // Slowly track a resting baseline while at rest, so a stable-but-imperfect stance doesn't
        // need to be pixel-perfect to keep being recognized as "at rest".
        const restingBaseline = baselineRef.current ?? smoothedShoulderY
        const nextBaseline = restingBaseline + BASELINE_ALPHA * (smoothedShoulderY - restingBaseline)
        baselineRef.current = nextBaseline
        downThreshold = DOWN_TRIGGER_RATIO

        const bodyMotion = (smoothedShoulderY - nextBaseline) / scale
        if (bodyMotion > downThreshold) {
          phase = "descending"
          extremeShoulderYRef.current = smoothedShoulderY
          shoulderYAtStrokeStartRef.current = nextBaseline
          wristYAtStrokeStartRef.current = smoothedWristY
          wristYAtExtremeRef.current = smoothedWristY
        } else {
          rejectionReason = "NO_BODY_MOTION"
        }
      } else {
        const baseline = baselineRef.current ?? smoothedShoulderY
        downThreshold = DOWN_TRIGGER_RATIO
        const extreme = extremeShoulderYRef.current ?? smoothedShoulderY

        if (phase === "descending") {
          if (smoothedShoulderY > extreme) {
            extremeShoulderYRef.current = smoothedShoulderY
            wristYAtExtremeRef.current = smoothedWristY
            // still sinking, remain in "descending"
          } else {
            phase = "bottom"
          }
        }

        if (phase === "bottom" || phase === "ascending") {
          const currentExtreme = extremeShoulderYRef.current ?? smoothedShoulderY
          if (smoothedShoulderY > currentExtreme) {
            // noise dipped a bit further after we called the turnaround; keep tracking the true minimum
            extremeShoulderYRef.current = smoothedShoulderY
            wristYAtExtremeRef.current = smoothedWristY
            phase = "bottom"
          } else {
            const amplitude = (currentExtreme - baseline) / scale
            motionAmplitude = amplitude
            const releasedNow = (smoothedShoulderY - baseline) / scale <= RELEASE_RATIO

            if (releasedNow) {
              // Back near baseline: a full down-and-up cycle has completed. Validate it before
              // counting it as a real compression.
              const wristStart = wristYAtStrokeStartRef.current ?? smoothedWristY
              const wristExtreme = wristYAtExtremeRef.current ?? smoothedWristY
              const wristTravel = (wristExtreme - wristStart) / scale
              // "Wrists move in the same general direction as the shoulders": allow some slack
              // (locked-arm CPR can move the wrists by roughly the same amount as the shoulders,
              // not necessarily more) but reject a torso-only bob where the wrists barely move or
              // move the opposite way.
              const sameDirection = wristTravel >= amplitude * MIN_WRIST_DIRECTION_RATIO

              const lastTime = lastCompressionTimeRef.current
              const withinRefractory = lastTime !== null && now - lastTime < REFRACTORY_MS
              const sufficientAmplitude = amplitude >= MIN_AMPLITUDE_RATIO

              if (sufficientAmplitude && sameDirection && !withinRefractory) {
                displayPhase = "released"
                rejectionReason = "NONE"
                lastCompressionTimeRef.current = now
                if (lastTime !== null) {
                  const intervalMs = now - lastTime
                  if (intervalMs < 3000) {
                    const intervals = intervalsRef.current
                    intervals.push(intervalMs)
                    if (intervals.length > BPM_WINDOW) intervals.shift()
                    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
                    const nextBpm = Math.round(60000 / avgInterval)
                    setBpm(nextBpm)
                    setStatus(nextBpm < 100 ? "too-slow" : nextBpm > 120 ? "too-fast" : "good")
                  }
                }
                countRef.current += 1
                setCount(countRef.current)
              } else {
                rejectionReason = !sufficientAmplitude
                  ? "AMPLITUDE_TOO_SMALL"
                  : withinRefractory
                    ? "REFRACTORY_PERIOD"
                    : "INCOMPLETE_CYCLE"
              }

              // Whether counted or rejected, the stroke is over: return to "ready", re-baseline
              // off the current resting signal, and clear stroke-scoped tracking so the next
              // cycle starts fresh.
              phase = "ready"
              baselineRef.current = smoothedShoulderY
              extremeShoulderYRef.current = null
              shoulderYAtStrokeStartRef.current = null
              wristYAtStrokeStartRef.current = null
              wristYAtExtremeRef.current = null
            } else {
              phase = "ascending"
              rejectionReason = "NONE"
            }
          }
        }
      }

      phaseRef.current = phase
      if (displayPhase !== "released") displayPhase = phase

      const bodyMotionForDisplay = baselineRef.current === null ? null : (smoothedShoulderY - baselineRef.current) / scale

      setDebug({
        phase: displayPhase,
        motionPhase: displayPhase,
        poseValid: true,
        rawPoseValid: true,
        effectivePoseValid: true,
        invalidDurationMs: 0,
        reason: "VALID",
        rejectionReason,
        leftElbowAngle,
        rightElbowAngle,
        wristDistanceRatio,
        wristsTogether,
        bodyMotion: bodyMotionForDisplay,
        motionAmplitude,
        baseline: baselineRef.current,
        downThreshold,
        leftVisibility,
        rightVisibility,
        timeSinceLastCompression: lastCompressionTimeRef.current === null ? null : now - lastCompressionTimeRef.current,
      })
    },
    [targetCount],
  )

  return { count, bpm, status, reset, update, debug }
}
