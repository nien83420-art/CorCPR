"use client"

import { useCallback, useEffect, useRef } from "react"
import type { useCompressionCounter } from "@/hooks/use-compression-counter"
import type { MovementFeedbackKey } from "@/hooks/use-compression-movement-feedback"
import { createEmptyStats, type PostureErrorKind, type SessionStats } from "@/lib/session-scoring"

type CompressionDebug = ReturnType<typeof useCompressionCounter>["debug"]

/** Caps a single frame's contribution so a stalled tab or dropped frames can't skew the shares. */
const MAX_FRAME_DT_MS = 250

const POSTURE_ERRORS: ReadonlySet<string> = new Set<PostureErrorKind>([
  "LEFT_ARM_BENT",
  "RIGHT_ARM_BENT",
  "BOTH_ARMS_BENT",
  "WRISTS_TOO_FAR",
])

interface UseSessionStatsOptions {
  active: boolean
  debug: CompressionDebug
  count: number
  movementFeedback: MovementFeedbackKey | null
}

/**
 * Passive observer of the existing compression counter's outputs. It only reads values the counter
 * already produces (debug.reason / effectivePoseValid, count) and the existing movement feedback,
 * so it cannot change what is detected or counted.
 */
export function useSessionStats({ active, debug, count, movementFeedback }: UseSessionStatsOptions) {
  const statsRef = useRef<SessionStats>(createEmptyStats())
  const lastFrameRef = useRef<number | null>(null)
  const lastCountRef = useRef(0)

  useEffect(() => {
    if (!active) {
      lastFrameRef.current = null
      return
    }
    const now = performance.now()
    const previous = lastFrameRef.current
    lastFrameRef.current = now
    if (previous === null) return

    const dt = Math.min(MAX_FRAME_DT_MS, now - previous)
    const stats = statsRef.current
    const isPostureError = POSTURE_ERRORS.has(debug.reason)
    if (!debug.effectivePoseValid && !isPostureError) return

    stats.evaluatedMs += dt
    if (debug.effectivePoseValid) stats.validMs += dt
    else stats.errorMs[debug.reason as PostureErrorKind] += dt
    if (movementFeedback === "releaseFully") stats.releaseMs += dt
  }, [active, debug, movementFeedback])

  useEffect(() => {
    if (!active) return
    if (count > lastCountRef.current) statsRef.current.compressionTimes.push(performance.now())
    lastCountRef.current = count
  }, [active, count])

  const resetStats = useCallback(() => {
    statsRef.current = createEmptyStats()
    lastFrameRef.current = null
    lastCountRef.current = 0
  }, [])

  const getStats = useCallback(() => statsRef.current, [])

  return { getStats, resetStats }
}
