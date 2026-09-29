import { PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Translations } from "@/lib/i18n"

interface CallScreenProps {
  t: Translations
  onCalled: () => void
}

export function CallScreen({ t, onCalled }: CallScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-red-600 px-6 py-12 text-center text-white">
      <div className="flex size-24 items-center justify-center rounded-full bg-white/15">
        <PhoneCall className="size-12" aria-hidden="true" />
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight">{t.call.title}</h1>
      <p className="mt-3 max-w-sm text-sm text-white/85">{t.call.body}</p>

      <div className="mt-8 rounded-2xl bg-white/15 px-10 py-4">
        <span className="text-5xl font-extrabold tracking-wider tabular-nums">{t.call.number}</span>
      </div>

      <Button
        size="lg"
        onClick={onCalled}
        className="mt-10 h-12 w-full max-w-xs bg-white text-base text-red-700 hover:bg-white/90"
      >
        {t.call.called}
      </Button>

      <p className="mt-6 max-w-xs text-xs text-white/70">{t.call.note}</p>
    </div>
  )
}
