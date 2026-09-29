import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/i18n"
import type { Translations } from "@/lib/i18n"
import type { Language } from "@/lib/types"

interface LanguageScreenProps {
  t: Translations
  language: Language
  onSelectLanguage: (language: Language) => void
  onContinue: () => void
}

export function LanguageScreen({ t, language, onSelectLanguage, onContinue }: LanguageScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold tracking-tight text-foreground">{t.language.title}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t.language.subtitle}</p>

        <div className="mt-8 flex flex-col gap-3">
          {LANGUAGES.map((option) => {
            const isSelected = option.code === language
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => onSelectLanguage(option.code)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left text-lg font-medium transition-colors",
                  isSelected
                    ? "border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100"
                    : "border-border bg-card text-foreground hover:border-muted-foreground/40",
                )}
              >
                {option.native}
                {isSelected && <Check className="size-5 text-red-600" aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        <Button size="lg" onClick={onContinue} className="mt-8 h-12 w-full bg-red-600 text-base hover:bg-red-700">
          {t.language.continue}
        </Button>
      </div>
    </div>
  )
}
