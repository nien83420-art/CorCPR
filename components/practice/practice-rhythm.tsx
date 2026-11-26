import { useEffect, useState } from "react"
import { CADENCE_FRESH_MS, currentCadence, practiceGuidanceCopy } from "@/lib/practice-guidance"
import type { Language } from "@/lib/types"

const SCALE_MIN = 60
const SCALE_MAX = 160
const TARGET_MIN = 100
const TARGET_MAX = 120

function scalePosition(bpm: number) {
  return 100 * (Math.min(SCALE_MAX, Math.max(SCALE_MIN, bpm)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)
}

export function useFreshCadence(bpm: number | null, updatedAt: number | null, available: boolean) {
  const [expiredAt, setExpiredAt] = useState<number | null>(null)

  useEffect(() => {
    if (updatedAt === null) return
    const remaining = CADENCE_FRESH_MS - (performance.now() - updatedAt)
    const timer = window.setTimeout(() => setExpiredAt(updatedAt), Math.max(0, remaining))
    return () => window.clearTimeout(timer)
  }, [updatedAt])

  return expiredAt === updatedAt ? null : currentCadence(bpm, updatedAt, performance.now(), available)
}

export function PracticeRhythm({ rate, language, unit }: {
  rate: number | null
  language: Language
  unit: string
}) {
  const copy = practiceGuidanceCopy[language]
  const inRange = rate !== null && rate >= TARGET_MIN && rate <= TARGET_MAX
  const band = rate === null ? copy.unknown : rate < TARGET_MIN ? copy.below : inRange ? copy.inRange : copy.above

  return <section className="min-w-0 rounded-xl border border-zinc-200 bg-white px-4 py-3" aria-label={copy.measured}>
    <h2 className="text-sm font-medium text-zinc-700">{copy.measured}</h2>
    <p className="mt-0.5 text-sm text-zinc-700">{copy.targetCadence} <strong>{TARGET_MIN}–{TARGET_MAX}</strong> {unit}</p>
    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
      <p className={`text-2xl font-bold tabular-nums ${rate === null ? "text-zinc-950" : inRange ? "text-green-800" : "text-red-800"}`}>
        {rate ?? "–"}{rate !== null && <span className="text-sm font-medium text-zinc-700"> {unit}</span>}
      </p>
      <p className="text-sm text-zinc-700">{band}</p>
    </div>
    <div className="mx-3 mt-2" aria-hidden="true">
      <div className="relative flex h-2 rounded-full bg-red-200">
        <span className="absolute inset-y-0 bg-green-300"
          style={{ left: `${scalePosition(TARGET_MIN)}%`, width: `${scalePosition(TARGET_MAX) - scalePosition(TARGET_MIN)}%` }} />
        {rate !== null && <span className={`absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white transition-[left] duration-200 motion-reduce:transition-none ${inRange ? "bg-green-800" : "bg-red-800"}`}
          style={{ left: `${scalePosition(rate)}%` }} />}
      </div>
      <div className="relative mt-1 h-4 text-xs tabular-nums text-zinc-700">
        {[SCALE_MIN, TARGET_MIN, TARGET_MAX, SCALE_MAX].map(tick =>
          <span key={tick} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${scalePosition(tick)}%` }}>
            {tick === SCALE_MIN ? "≤" : tick === SCALE_MAX ? "≥" : ""}{tick}
          </span>)}
      </div>
    </div>
  </section>
}
