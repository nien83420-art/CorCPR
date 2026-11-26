import type { ReactNode } from "react"
import type { PriorLearning } from "@/lib/course-results"
import { courseResultsCopy } from "@/lib/course-results-copy"
import type { Translations } from "@/lib/i18n"
import type { Language, SessionResult } from "@/lib/types"

export function ResultMetric({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-4">
    <dt className="text-sm font-medium text-zinc-700">{label}</dt>
    <dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">{value}</dd>
    {children}
  </div>
}

export function ResultsScreen({ language, t, result, learning }: {
  language: Language
  t: Translations
  result: SessionResult
  learning: PriorLearning | null
}) {
  const copy = courseResultsCopy[language]
  const r = t.results
  const checks = learning?.firstChecks ?? []
  const right = checks.filter(Boolean).length
  const percent = (value: number | null) => value === null ? r.notEnoughData : `${value}%`

  return <div className="mt-7 grid items-start gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <section className="rounded-2xl border border-zinc-200 p-4 sm:p-5" aria-labelledby="camera-results">
      <h2 id="camera-results" className="text-xl font-semibold">{copy.camera}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{copy.cameraNote}</p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:col-span-2">
          <dt className="font-medium text-red-900">{r.overall}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-red-900">{percent(result.overallScore)}</dd>
          {result.overallScore !== null && <dd className="mt-1 text-sm text-zinc-700">{r[result.rating]}</dd>}
        </div>
        <ResultMetric label={r.compressionsLabel} value={`${result.totalCompressions} / ${result.targetCompressions}`}>
          <dd className="mt-2"><progress className="block h-2 w-full accent-red-700" aria-label={r.compressionsLabel}
            max={100} value={result.completionScore} /></dd>
        </ResultMetric>
        <ResultMetric label={copy.rate} value={result.averageBpm > 0 ? `${result.averageBpm} ${t.practice.bpm}` : r.notEnoughData} />
        <ResultMetric label={r.technique} value={percent(result.techniqueScore)} />
        <ResultMetric label={r.rhythm} value={percent(result.rhythmScore)} />
        <ResultMetric label={r.duration} value={`${result.durationSeconds} ${r.seconds}`} />
      </dl>
      <h3 className="mt-5 font-semibold">{r.tipsTitle}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-zinc-700">
        {result.tips.map(tip => <li key={tip}>{r[tip]}</li>)}
      </ul>
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5" aria-labelledby="prior-results">
      <h2 id="prior-results" className="text-xl font-semibold">{copy.learning}</h2>
      {checks.length > 0 ? <>
        <p className="mt-2 text-sm text-zinc-600">{copy.firstChecks}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt>{copy.attempted}</dt><dd className="font-semibold">{checks.length}</dd></div>
          <div className="flex justify-between gap-3"><dt>{copy.right}</dt><dd className="font-semibold">{right}</dd></div>
          <div className="flex justify-between gap-3"><dt>{copy.wrong}</dt><dd className="font-semibold">{checks.length - right}</dd></div>
        </dl>
      </> : <p className="mt-2 text-sm text-zinc-600">{copy.unavailable}</p>}
      {learning && <dl className="mt-4 space-y-3 border-t border-zinc-200 pt-4 text-sm">
        <div><dt>{copy.stack}</dt><dd className="font-semibold">{learning.handStacked ? copy.completed : copy.incomplete}</dd></div>
        <div><dt>{copy.placement}</dt><dd className="font-semibold">{learning.chestPlaced ? copy.completed : copy.incomplete}</dd></div>
      </dl>}
    </section>
  </div>
}
