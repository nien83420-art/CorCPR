"use client"

import { useCallback, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { POSE_LANDMARK } from "@/lib/pose-connections"
import { angleAtJoint, distance, minVisibility } from "@/lib/pose-math"

/** Minimum visibility score required on all six arm landmarks before we trust the pose at all. */
const MIN_VISIBILITY = 0.5
/** Max wrist-to-wrist distance, as a multiple of shoulder width, to count as "hands together". */
const MAX_WRIST_DISTANCE_RATIO = 0.75
/** Minimum elbow angle (degrees) required to treat the arms as reasonably straight. */
const MIN_ELBOW_ANGLE_DEG = 150
/** How far below the shoulder line (normalized by shoulder width) the wrists must sit to count as valid CPR posture. */
const MIN_HANDS_BELOW_SHOULDERS_RATIO = 0.15

/**
 * Exponential smoothing factor applied to the motion signal and shoulder line.
 * Higher = more responsive (less lag, so fast 100-120bpm compressions aren't missed),
 * at the cost of passing through a bit more MediaPipe jitter than a heavier filter would.
 */
const SMOOTHING_ALPHA = 0.5
/** Slow adaptation rate for the resting baseline while in READY, so a stable stance can drift without ever "resetting". */
const BASELINE_ALPHA = 0.08
/**
 * The motion signal must drop at least this far below baseline (in shoulder widths) to
 * register the start of a downstroke. Larger than RELEASE_RATIO on purpose: this hysteresis
 * gap means jitter sitting near one threshold can't repeatedly flip the state.
 */
const DOWN_RATIO = 0.14
/** The motion signal must climb back to within this distance of baseline (in shoulder widths) to register a release. */
const RELEASE_RATIO = 0.05
/**
 * Minimum downward travel of the shoulder line itself (in shoulder widths) required during a
 * stroke for it to count as a real CPR compression. Real compressions are driven by the torso
 * pumping down over locked arms, so the shoulder line moves. Purely raising/lowering the wrists
 * in front of the body (shoulders roughly stationary) can produce the same wrist-relative-to-
 * shoulder signal without this shoulder motion, so this guard specifically rejects that case.
 */
const MIN_SHOULDER_DROP_RATIO = 0.04
/** Refractory period after a completed compression before another can be counted; filters residual jitter double-counts. */
const REFRACTORY_MS = 200
/** How many recent compression intervals to average for BPM. */
const BPM_WINDOW = 6

export type CompressionStatus = "waiting" | "too-slow" | "good" | "too-fast"

/** READY -> DESCENDING -> BOTTOM -> ASCENDING -> RELEASED (transient, then back to READY). */
type MotionPhase = "ready" | "descending" | "bottom" | "ascending" | "released"

export type PoseInvalidReason =
  | "MISSING_LANDMARKS"
  | "LOW_VISIBILITY"
  | "WRISTS_TOO_FAR"
  | "ELBOWS_TOO_BENT"
  | "HANDS_ABOVE_SHOULDERS"
  | "VALID"

/** Debug-facing summary of why a compression is not currently being counted. */
export type TransitionBlockedBy =
  | "POSE_INVALID"
  | "WAITING_FOR_BASELINE"
  | "INSUFFICIENT_DOWNWARD_TRAVEL"
  | "INSUFFICIENT_RELEASE_TRAVEL"
  | "ELBOWS_BENT"
  | "WRISTS_TOO_FAR"
  | "LOW_VISIBILITY"
  | "REFRACTORY_PERIOD"
  | "WRONG_DIRECTION"
  | "NONE"

interface CompressionDebug {
  poseValid: boolean
  reason: PoseInvalidReason
  leftElbowAngle: number | null
  rightElbowAngle: number | null
  wristDistanceRatio: number | null
  motionPhase: MotionPhase
  motionAmplitude: number
  /** Current smoothed (wristAvgY - shoulderAvgY) / shoulderWidth signal driving the state machine. */
  motionSignal: number | null
  /** Absolute signal value that must be crossed (going down) to start a downstroke. */
  downThreshold: number | null
  /** Absolute signal value that must be crossed (coming back up) to register a release. */
  releaseThreshold: number | null
  /** Resting motion-signal value the state machine is currently measuring strokes against. */
  baseline: number | null
  /** Shoulder width in landmark units, used to normalize every distance/threshold above. */
  bodyScale: number | null
  timeSinceLastCompression: number | null
  leftVisibility: number | null
  rightVisibility: number | null
  /** Why the current frame is not resulting in a counted compression, for calibration/debugging. */
  transitionBlockedBy: TransitionBlockedBy
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
  poseValid: false,
  reason: "MISSING_LANDMARKS",
  leftElbowAngle: null,
  rightElbowAngle: null,
  wristDistanceRatio: null,
  motionPhase: "ready",
  motionAmplitude: 0,
  motionSignal: null,
  downThreshold: null,
  releaseThreshold: null,
  baseline: null,
  bodyScale: null,
  timeSinceLastCompression: null,
  leftVisibility: null,
  rightVisibility: null,
  transitionBlockedBy: "NONE",
}

export function useCompressionCounter(targetCount: number): UseCompressionCounterResult {
  const [count, setCount] = useState(0)
  const [bpm, setBpm] = useState<number | null>(null)
  const [status, setStatus] = useState<CompressionStatus>("waiting")
  const [debug, setDebug] = useState<CompressionDebug>(INITIAL_DEBUG)

  // Motion-signal tracking: smoothed (wristAvgY - shoulderAvgY) / shoulderWidth, and the resting
  // baseline it's compared against. Cleared whenever the pose becomes untrustworthy so a later
  // reappearance can't be mistaken for a continuation of a stroke.
  const smoothedSignalRef = useRef<number | null>(null)
  const smoothedShoulderYRef = useRef<number | null>(null)
  const baselineRef = useRef<number | null>(null)

  const phaseRef = useRef<MotionPhase>("ready")
  const extremeSignalRef = useRef<number | null>(null)
  const shoulderYAtStrokeStartRef = useRef<number | null>(null)
  const shoulderYAtBottomRef = useRef<number | null>(null)

  const lastCompressionTimeRef = useRef<number | null>(null)
  const intervalsRef = useRef<number[]>([])
  const countRef = useRef(0)

  /** Full reset: clears counters, BPM history, and all motion tracking. */
  const reset = useCallback(() => {
    smoothedSignalRef.current = null
    smoothedShoulderYRef.current = null
    baselineRef.current = null
    phaseRef.current = "ready"
    extremeSignalRef.current = null
    shoulderYAtStrokeStartRef.current = null
    shoulderYAtBottomRef.current = null
    lastCompressionTimeRef.current = null
    intervalsRef.current = []
    countRef.current = 0
    setCount(0)
    setBpm(null)
    setStatus("waiting")
    setDebug(INITIAL_DEBUG)
  }, [])

  /**
   * Cancels any in-progress stroke and clears motion tracking (but never touches count/bpm).
   * Used whenever the pose is missing, low-visibility, or fails CPR-posture requirements, so a
   * partial downstroke can never complete into a count once the pose becomes invalid again.
   */
  const cancelStroke = () => {
    smoothedSignalRef.current = null
    smoothedShoulderYRef.current = null
    baselineRef.current = null
    phaseRef.current = "ready"
    extremeSignalRef.current = null
    shoulderYAtStrokeStartRef.current = null
    shoulderYAtBottomRef.current = null
  }

  const update = useCallback(
    (landmarks: PoseKeypoint[] | null) => {
      if (countRef.current >= targetCount) return

      if (!landmarks) {
        cancelStroke()
        setDebug({ ...INITIAL_DEBUG, motionPhase: "ready", transitionBlockedBy: "POSE_INVALID" })
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

      const leftVisibility = minVisibility([leftShoulder, leftElbow, leftWrist])
      const rightVisibility = minVisibility([rightShoulder, rightElbow, rightWrist])

      if (!allPresent) {
        // Not enough signal to trust the pose. Cancel any in-progress stroke so a partial
        // reappearance later can't be mistaken for a continuation of it.
        cancelStroke()
        const anyMissing = required.some((p) => !p)
        setDebug({
          ...INITIAL_DEBUG,
          poseValid: false,
          reason: anyMissing ? "MISSING_LANDMARKS" : "LOW_VISIBILITY",
          leftVisibility,
          rightVisibility,
          transitionBlockedBy: anyMissing ? "POSE_INVALID" : "LOW_VISIBILITY",
        })
        return
      }

      const shoulderWidth = distance(leftShoulder, rightShoulder)
      if (shoulderWidth <= 0.001) {
        cancelStroke()
        setDebug({
          ...INITIAL_DEBUG,
          poseValid: false,
          reason: "MISSING_LANDMARKS",
          leftVisibility,
          rightVisibility,
          transitionBlockedBy: "POSE_INVALID",
        })
        return
      }

      const wristDistance = distance(leftWrist, rightWrist)
      const wristDistanceRatio = wristDistance / shoulderWidth

      const leftElbowAngle = angleAtJoint(leftShoulder, leftElbow, leftWrist)
      const rightElbowAngle = angleAtJoint(rightShoulder, rightElbow, rightWrist)

      const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2
      const wristAvgY = (leftWrist.y + rightWrist.y) / 2
      const handsBelowShoulders = (wristAvgY - shoulderAvgY) / shoulderWidth > MIN_HANDS_BELOW_SHOULDERS_RATIO

      const handsTogether = wristDistanceRatio <= MAX_WRIST_DISTANCE_RATIO
      const armsStraight = leftElbowAngle >= MIN_ELBOW_ANGLE_DEG && rightElbowAngle >= MIN_ELBOW_ANGLE_DEG

      // Required CPR posture for the *entire* cycle, not just the moment we start counting: both
      // shoulders/elbows/wrists visible, hands together, arms straight, hands below the shoulder
      // line. This is also what rejects a plain "raise both hands up in front of the body" motion
      // once the hands get close to/above shoulder height.
      const poseValid = handsTogether && armsStraight && handsBelowShoulders

      if (!poseValid) {
        cancelStroke()
        const reason: PoseInvalidReason = !handsTogether
          ? "WRISTS_TOO_FAR"
          : !armsStraight
            ? "ELBOWS_TOO_BENT"
            : "HANDS_ABOVE_SHOULDERS"
        const transitionBlockedBy: TransitionBlockedBy =
          reason === "WRISTS_TOO_FAR" ? "WRISTS_TOO_FAR" : reason === "ELBOWS_TOO_BENT" ? "ELBOWS_BENT" : "WRONG_DIRECTION"
        setDebug({
          poseValid: false,
          reason,
          leftElbowAngle,
          rightElbowAngle,
          wristDistanceRatio,
          motionPhase: "ready",
          motionAmplitude: 0,
          motionSignal: null,
          downThreshold: null,
          releaseThreshold: null,
          baseline: null,
          bodyScale: shoulderWidth,
          timeSinceLastCompression: null,
          leftVisibility,
          rightVisibility,
          transitionBlockedBy,
        })
        return
      }

      // --- Motion signal: relative body geometry, not raw wrist position. ---
      // Using (wrist - shoulder) instead of wrist alone means whole-body translation relative to
      // the camera (stepping back, camera shake) mostly cancels out, since both points shift
      // together. Normalizing by shoulder width makes the thresholds distance-from-camera
      // invariant.
      const bodyScale = shoulderWidth
      const rawSignal = (wristAvgY - shoulderAvgY) / bodyScale

      const prevSignal = smoothedSignalRef.current
      const smoothedSignal = prevSignal === null ? rawSignal : prevSignal + SMOOTHING_ALPHA * (rawSignal - prevSignal)
      smoothedSignalRef.current = smoothedSignal

      const prevShoulderY = smoothedShoulderYRef.current
      const smoothedShoulderY =
        prevShoulderY === null ? shoulderAvgY : prevShoulderY + SMOOTHING_ALPHA * (shoulderAvgY - prevShoulderY)
      smoothedShoulderYRef.current = smoothedShoulderY

      // True only on the very first valid frame after (re)appearing, before a baseline exists.
      const establishingBaseline = baselineRef.current === null
      if (establishingBaseline) {
        // Adopt the current signal as the resting baseline immediately, so this frame can't
        // itself be misread as a downstroke.
        baselineRef.current = smoothedSignal
      }

      let phase = phaseRef.current
      // Separate from `phase`: lets the completion frame render as "released" in the debug
      // overlay even though the persisted phase jumps straight back to "ready" for next frame.
      let displayPhase: MotionPhase = phase
      let motionAmplitude = 0
      let downThreshold: number
      let releaseThreshold: number
      let transitionBlockedBy: TransitionBlockedBy = establishingBaseline ? "WAITING_FOR_BASELINE" : "NONE"
      const now = performance.now()

      if (phase === "ready" || phase === "released") {
        phase = "ready"
        // Slowly track a resting baseline while at rest, so a stable-but-imperfect stance doesn't
        // need to be pixel-perfect to keep being recognized as "released".
        baselineRef.current = baselineRef.current + BASELINE_ALPHA * (smoothedSignal - baselineRef.current)
        downThreshold = baselineRef.current - DOWN_RATIO
        releaseThreshold = baselineRef.current - RELEASE_RATIO

        if (smoothedSignal < downThreshold) {
          phase = "descending"
          extremeSignalRef.current = smoothedSignal
          shoulderYAtStrokeStartRef.current = smoothedShoulderY
          shoulderYAtBottomRef.current = smoothedShoulderY
        }
      } else {
        // Baseline is frozen for the duration of the stroke so a slow drift mid-stroke can't move
        // the goalposts on us.
        const baseline = baselineRef.current
        downThreshold = baseline - DOWN_RATIO
        releaseThreshold = baseline - RELEASE_RATIO
        const extreme = extremeSignalRef.current ?? smoothedSignal

        if (phase === "descending") {
          if (smoothedSignal < extreme) {
            extremeSignalRef.current = smoothedSignal
            shoulderYAtBottomRef.current = smoothedShoulderY
            // still sinking, remain in "descending"
          } else {
            phase = "bottom"
          }
        }

        if (phase === "bottom" || phase === "ascending") {
          const currentExtreme = extremeSignalRef.current ?? smoothedSignal
          if (smoothedSignal < currentExtreme) {
            // noise dipped a bit further after we called the turnaround; keep tracking the true minimum
            extremeSignalRef.current = smoothedSignal
            shoulderYAtBottomRef.current = smoothedShoulderY
            phase = "bottom"
          } else {
            motionAmplitude = baseline - currentExtreme
            if (smoothedSignal >= releaseThreshold) {
              // Back near baseline: a full down-and-up cycle has completed. Before counting it,
              // require CPR-specific evidence that this was a real compression (torso pump) and
              // not just the wrists rising/falling with the shoulders staying put.
              const shoulderDrop =
                (shoulderYAtBottomRef.current ?? smoothedShoulderY) - (shoulderYAtStrokeStartRef.current ?? smoothedShoulderY)
              const shoulderDropRatio = shoulderDrop / bodyScale

              const lastTime = lastCompressionTimeRef.current
              const withinRefractory = lastTime !== null && now - lastTime < REFRACTORY_MS
              const sufficientAmplitude = shoulderDropRatio >= MIN_SHOULDER_DROP_RATIO

              if (sufficientAmplitude && !withinRefractory) {
                // Displayed as "released" for this frame's debug snapshot; the persisted phase
                // goes straight back to "ready" so the next cycle starts fresh on the next frame.
                displayPhase = "released"
                transitionBlockedBy = "NONE"
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
                transitionBlockedBy = !sufficientAmplitude ? "INSUFFICIENT_DOWNWARD_TRAVEL" : "REFRACTORY_PERIOD"
              }
              // Whether counted or rejected (e.g. hands were raised and lowered with the shoulders
              // staying still, or still inside the refractory window), the stroke is over: return to
              // "ready", re-baseline off the current resting signal, and clear stroke-scoped tracking
              // so the next cycle starts fresh.
              phase = "ready"
              baselineRef.current = smoothedSignal
              extremeSignalRef.current = null
              shoulderYAtStrokeStartRef.current = null
              shoulderYAtBottomRef.current = null
            } else {
              phase = "ascending"
              transitionBlockedBy = "INSUFFICIENT_RELEASE_TRAVEL"
            }
          }
        }
      }

      phaseRef.current = phase
      if (displayPhase !== "released") displayPhase = phase

      setDebug({
        poseValid: true,
        reason: "VALID",
        leftElbowAngle,
        rightElbowAngle,
        wristDistanceRatio,
        motionPhase: displayPhase,
        motionAmplitude,
        motionSignal: smoothedSignal,
        downThreshold,
        releaseThreshold,
        baseline: baselineRef.current,
        bodyScale,
        timeSinceLastCompression: lastCompressionTimeRef.current === null ? null : now - lastCompressionTimeRef.current,
        leftVisibility,
        rightVisibility,
        transitionBlockedBy,
      })
    },
    [targetCount],
  )

  return { count, bpm, status, reset, update, debug }
}
