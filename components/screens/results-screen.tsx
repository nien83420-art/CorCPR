import { RotateCcw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Translations } from "@/lib/i18n"
import type { SessionResult } from "@/lib/types"

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

export function ResultsScreen({ t, result, onRestart }: ResultsScreenProps) {
  const ratingLabel = t.results[result.rating]

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div
          className={cn(
            "mx-auto flex size-20 items-center justify-center rounded-full shadow-lg",
            ratingStyles[result.rating],
          )}
        >
          <Trophy className="size-10 text-white" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">{t.results.title}</h1>
        <p className="mt-2 text-lg font-medium text-foreground">{ratingLabel}</p>

        <div className="mt-8 grid grid-cols-1 gap-3">
          <StatRow label={t.results.compressions} value={String(result.totalCompressions)} />
          <StatRow
            label={t.results.avgBpm}
            value={`${result.averageBpm} ${t.practice.bpm}`}
          />
          <StatRow label={t.results.duration} value={`${result.durationSeconds} ${t.results.seconds}`} />
        </div>

        <Button
          size="lg"
          onClick={onRestart}
          className="mt-10 h-12 w-full gap-2 bg-red-600 text-base hover:bg-red-700"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {t.results.restart}
        </Button>
      </div>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums text-foreground">{value}</span>
    </div>
  )
}
