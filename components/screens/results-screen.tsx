import { CheckCircle2, CircleAlert, RotateCcw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Translations } from "@/lib/i18n"
import type { ResultTipKey, SessionResult } from "@/lib/types"

interface ResultsScreenProps {
  t: Translations
  result: SessionResult
  onRestart: () => void
}

const ratingStyles: Record<SessionResult["rating"], string> = {
  excellent: "bg-emerald-600",
  good: "bg-amber-500",
  needsWork: "bg-red-600",
}

const POSITIVE_TIPS: ReadonlySet<ResultTipKey> = new Set<ResultTipKey>(["tipGoodRhythm", "tipGoodTechnique"])

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-600"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-600"
}

export function ResultsScreen({ t, result, onRestart }: ResultsScreenProps) {
  const r = t.results

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full shadow-lg",
              ratingStyles[result.rating],
            )}
          >
            <Trophy className="size-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{r.title}</h1>
          <p className="mt-1 text-lg font-medium text-foreground">{r[result.rating]}</p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <ScoreBar label={r.overall} hint={r.overallHint} score={result.overallScore} emptyLabel={r.notEnoughData} large />
        </section>

        <section className="mt-3 flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
          <ScoreBar label={r.technique} hint={r.techniqueHint} score={result.techniqueScore} emptyLabel={r.notEnoughData} />
          <ScoreBar label={r.rhythm} hint={r.rhythmHint} score={result.rhythmScore} emptyLabel={r.notEnoughData} />
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">{r.compressionsLabel}</span>
              <span className="text-lg font-bold tabular-nums text-foreground">
                {result.totalCompressions}
                <span className="text-sm font-medium text-muted-foreground"> / {result.targetCompressions}</span>
              </span>
            </div>
            <Bar score={result.completionScore} />
          </div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatTile label={r.avgBpm} value={result.averageBpm > 0 ? `${result.averageBpm}` : "--"} unit={t.practice.bpm} />
          <StatTile label={r.duration} value={`${result.durationSeconds}`} unit={r.seconds} />
        </div>

        <section className="mt-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">{r.tipsTitle}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {result.tips.map((tip) => {
              const positive = POSITIVE_TIPS.has(tip)
              const Icon = positive ? CheckCircle2 : CircleAlert
              return (
                <li key={tip} className="flex gap-2 text-sm leading-snug text-foreground">
                  <Icon
                    className={cn("mt-0.5 size-4 shrink-0", positive ? "text-emerald-600" : "text-amber-500")}
                    aria-hidden="true"
                  />
                  {r[tip]}
                </li>
              )
            })}
          </ul>
        </section>

        <Button size="lg" onClick={onRestart} className="mt-6 h-12 w-full gap-2 bg-red-600 text-base text-white hover:bg-red-700">
          <RotateCcw className="size-4" aria-hidden="true" />
          {r.restart}
        </Button>
      </div>
    </main>
  )
}

function ScoreBar({
  label,
  hint,
  score,
  emptyLabel,
  large = false,
}: {
  label: string
  hint: string
  score: number | null
  emptyLabel: string
  large?: boolean
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-medium text-foreground", large ? "text-base" : "text-sm")}>{label}</span>
        <span className={cn("font-bold tabular-nums", large ? "text-3xl" : "text-lg", score === null ? "text-sm font-medium text-muted-foreground" : "text-foreground")}>
          {score === null ? emptyLabel : `${score}%`}
        </span>
      </div>
      <Bar score={score ?? 0} muted={score === null} />
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Bar({ score, muted = false }: { score: number; muted?: boolean }) {
  return (
    <div
      className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={muted ? undefined : score}
    >
      {!muted && <div className={cn("h-full rounded-full", barColor(score))} style={{ width: `${score}%` }} />}
    </div>
  )
}

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {value}
        <span className="text-sm font-medium text-muted-foreground"> {unit}</span>
      </p>
    </div>
  )
}
