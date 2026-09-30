"use client"

import { useEffect, useRef, useState } from "react"
import type { CompressionStatus, useCompressionCounter } from "@/hooks/use-compression-counter"

/**
 * UI-only movement feedback derived from the compression counter's existing, already-computed
 * state (phase, rejectionReason, timeSinceLastCompression, status, count). Nothing here feeds back
 * into the counter - it only reads, so counting behavior is untouched.
 *
 * All timings below are UI readability/debounce values, not compression acceptance thresholds.
 */

export type MovementFeedbackKey =
  | "releaseFully"
  | "pushDeeper"
  | "pushFaster"
  | "pushSlower"
  | "goodPace"
  | "goodCompression"
  | "startCompressions"

type CompressionDebug = ReturnType<typeof useCompressionCounter>["debug"]

/** A stroke held in bottom/ascending (never returning to baseline) this long means the user isn't releasing. */
const INCOMPLETE_RELEASE_MS = 1200
/** How long a shallow-stroke warning stays relevant after the last rejected shallow cycle. */
const SHALLOW_MEMORY_MS = 3000
/** Shallow cycles needed inside SHALLOW_MEMORY_MS before warning, so one noisy wobble doesn't trigger it. */
const SHALLOW_EVENTS_TO_WARN = 2
/** With no counted compression for this long, rate feedback is stale and we prompt to (re)start. */
const IDLE_MS = 2500
/** A candidate message must persist this long before it can be shown. */
const CANDIDATE_STABLE_MS = 300
/** Once shown, a message stays at least this long before switching to anything else. */
const MIN_DISPLAY_MS = 1200

interface Params {
  active: boolean
  debug: CompressionDebug
  count: number
  status: CompressionStatus
}

export function useCompressionMovementFeedback({ active, debug, count, status }: Params): MovementFeedbackKey | null {
  const [displayed, setDisplayed] = useState<MovementFeedbackKey | null>(null)

  const strokePhaseSinceRef = useRef<number | null>(null)
  const shallowEventsRef = useRef<number[]>([])
  const lastCountRef = useRef(count)
  const candidateRef = useRef<{ key: MovementFeedbackKey | null; since: number }>({ key: null, since: 0 })
  const displayedRef = useRef<{ key: MovementFeedbackKey | null; since: number }>({ key: null, since: 0 })

  useEffect(() => {
    const now = performance.now()

    if (!active) {
      strokePhaseSinceRef.current = null
      shallowEventsRef.current = []
      lastCountRef.current = count
      candidateRef.current = { key: null, since: now }
      displayedRef.current = { key: null, since: now }
      setDisplayed(null)
      return
    }

    // A counted compression clears the shallow history: the user is now reaching the bottom.
    if (count !== lastCountRef.current) {
      if (count > lastCountRef.current) shallowEventsRef.current = []
      lastCountRef.current = count
    }

    // The counter reports AMPLITUDE_TOO_SMALL on the single frame a too-shallow cycle completes.
    if (debug.rejectionReason === "AMPLITUDE_TOO_SMALL") {
      const events = shallowEventsRef.current
      if (events.length === 0 || now - events[events.length - 1] > 100) events.push(now)
    }
    shallowEventsRef.current = shallowEventsRef.current.filter((t) => now - t <= SHALLOW_MEMORY_MS)

    const inStroke = debug.phase === "bottom" || debug.phase === "ascending"
    if (inStroke) {
      if (strokePhaseSinceRef.current === null) strokePhaseSinceRef.current = now
    } else {
      strokePhaseSinceRef.current = null
    }

    const sinceLast = debug.timeSinceLastCompression
    const recentlyCompressing = sinceLast !== null && sinceLast <= IDLE_MS

    let candidate: MovementFeedbackKey | null = null
    if (debug.effectivePoseValid) {
      if (strokePhaseSinceRef.current !== null && now - strokePhaseSinceRef.current >= INCOMPLETE_RELEASE_MS) {
        candidate = "releaseFully"
      } else if (shallowEventsRef.current.length >= SHALLOW_EVENTS_TO_WARN) {
        candidate = "pushDeeper"
      } else if (recentlyCompressing && status === "too-slow") {
        candidate = "pushFaster"
      } else if (recentlyCompressing && status === "too-fast") {
        candidate = "pushSlower"
      } else if (recentlyCompressing && status === "good") {
        candidate = "goodPace"
      } else if (recentlyCompressing && count > 0) {
        candidate = "goodCompression"
      } else if (debug.phase === "ready" && !recentlyCompressing) {
        candidate = "startCompressions"
      } else {
        // Mid-stroke with nothing to correct yet: keep whatever is showing, except "start"
        // (a compression is already in progress).
        const current = displayedRef.current.key
        candidate = current === "startCompressions" ? null : current
      }
    }

    if (candidate !== candidateRef.current.key) {
      candidateRef.current = { key: candidate, since: now }
    }

    const leavingStartPrompt = displayedRef.current.key === "startCompressions" && debug.phase !== "ready"
    const candidateStable = leavingStartPrompt || now - candidateRef.current.since >= CANDIDATE_STABLE_MS
    const heldLongEnough =
      leavingStartPrompt || displayedRef.current.key === null || now - displayedRef.current.since >= MIN_DISPLAY_MS
    if (candidate !== displayedRef.current.key && candidateStable && heldLongEnough) {
      displayedRef.current = { key: candidate, since: now }
      setDisplayed(candidate)
    }
  }, [active, debug, count, status])

  return displayed
}
