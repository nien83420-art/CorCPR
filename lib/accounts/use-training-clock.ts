import { useCallback, useEffect, useRef } from "react"
import { timeRecorded, trainingClock, updateTrainingClock } from "./training-clock"

function foreground() {
  return document.visibilityState === "visible" && document.hasFocus()
}

export function useTrainingClock(enabled: boolean, sessionId?: string) {
  const clock = useRef(trainingClock(0))
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    clock.current = trainingClock(performance.now())
  }, [sessionId])

  const markActive = useCallback(() => {
    updateTrainingClock(clock.current, performance.now(), enabledRef.current && foreground(), true)
  }, [])

  useEffect(() => {
    const timer = clock.current
    const sync = () => updateTrainingClock(timer, performance.now(), enabled && foreground())
    const pause = () => updateTrainingClock(timer, performance.now(), false)
    sync()
    document.addEventListener("visibilitychange", sync)
    window.addEventListener("focus", sync)
    window.addEventListener("blur", pause)
    for (const event of ["pointerdown", "keydown", "input", "scroll"]) {
      window.addEventListener(event, markActive, { passive: true, capture: true })
    }
    return () => {
      document.removeEventListener("visibilitychange", sync)
      window.removeEventListener("focus", sync)
      window.removeEventListener("blur", pause)
      for (const event of ["pointerdown", "keydown", "input", "scroll"]) {
        window.removeEventListener(event, markActive, true)
      }
      pause()
    }
  }, [enabled, markActive, sessionId])

  const seconds = useCallback(() => Math.min(86400, Math.floor(timeRecorded(clock.current, performance.now()) / 1000)), [])
  return { seconds, markActive }
}
