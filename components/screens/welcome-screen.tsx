import { HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Translations } from "@/lib/i18n"

interface WelcomeScreenProps {
  t: Translations
  onStart: () => void
}

export function WelcomeScreen({ t, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white px-6 py-12 text-center dark:from-red-950/30 dark:to-background">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-red-600 shadow-lg shadow-red-600/30">
        <HeartPulse className="size-10 text-white" aria-hidden="true" />
      </div>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground">{t.welcome.title}</h1>
      <p className="mt-3 max-w-sm text-base text-muted-foreground">{t.welcome.subtitle}</p>

      <Button size="lg" onClick={onStart} className="mt-10 h-12 w-full max-w-xs bg-red-600 text-base hover:bg-red-700">
        {t.welcome.start}
      </Button>

      <p className="mt-6 max-w-xs text-xs text-muted-foreground">{t.welcome.disclaimer}</p>
    </div>
  )
}
