"use client"

import { useEffect, useRef, useState } from "react"
import { Activity, Hand, ImageIcon, Info, MoveVertical, PersonStanding, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Translations } from "@/lib/i18n"

/** Drop your own image into /public with exactly this name to replace the placeholder. */
const INSTRUCTION_IMAGE_SRC = "/cpr-instructions.jpg"

interface InstructionsScreenProps {
  t: Translations
  onStart: () => void
}

export function InstructionsScreen({ t, onStart }: InstructionsScreenProps) {
  const copy = t.instructions

  return (
    <main className="flex min-h-dvh flex-col items-center bg-gradient-to-b from-red-50 to-white px-6 py-8 dark:from-red-950/30 dark:to-background">
      <div className="flex w-full max-w-lg flex-1 flex-col">
        <InstructionImage alt={copy.title} placeholder={copy.imagePlaceholder} />

        <header className="mt-6 text-center">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InstructionCard icon={Hand} title={copy.handsTitle} items={[copy.hands1, copy.hands2]} />
          <InstructionCard icon={PersonStanding} title={copy.bodyTitle} items={[copy.body1, copy.body2, copy.body3]} />
          <InstructionCard
            icon={MoveVertical}
            title={copy.movementTitle}
            items={[copy.movement1, copy.movement2, copy.movement3]}
          />
          <section className="flex flex-col rounded-2xl border border-red-200 bg-red-600 p-4 text-white dark:border-red-900">
            <div className="flex items-center gap-2">
              <Activity className="size-5" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{copy.rhythmTitle}</h2>
            </div>
            <p className="mt-3 text-2xl font-bold leading-tight">{copy.rhythmValue}</p>
          </section>
        </div>

        <aside className="mt-4 flex gap-3 rounded-2xl border border-border bg-muted/60 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">{copy.safetyTitle}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.safetyBody}</p>
          </div>
        </aside>

        <div className="mt-auto pt-6">
          <Button size="lg" onClick={onStart} className="h-12 w-full bg-red-600 text-base text-white hover:bg-red-700">
            {copy.start}
          </Button>
        </div>
      </div>
    </main>
  )
}

function InstructionImage({ alt, placeholder }: { alt: string; placeholder: string }) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // The error event can fire before hydration attaches onError; catch that case too.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth === 0) setFailed(true)
  }, [])

  if (failed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-red-200 bg-white/60 text-center dark:border-red-900/60 dark:bg-card/40">
        <ImageIcon className="size-10 text-red-300 dark:text-red-800" aria-hidden="true" />
        <p className="px-6 text-sm text-muted-foreground">{placeholder}</p>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain img so a missing user-supplied file degrades to a placeholder
    <img
      ref={imgRef}
      src={INSTRUCTION_IMAGE_SRC}
      alt={alt}
      onError={() => setFailed(true)}
      className="aspect-video w-full rounded-2xl border border-border bg-card object-contain"
    />
  )
}

function InstructionCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
          <Icon className="size-4 text-red-600" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-600" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
