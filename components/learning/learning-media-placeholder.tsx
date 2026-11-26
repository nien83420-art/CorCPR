import type { ReactNode } from "react"
import type { LearningMediaSlot } from "@/lib/learning-foundations"

export function LearningMediaPlaceholder({ slot, label, scene = false, children }: {
  slot: LearningMediaSlot
  label: string
  scene?: boolean
  children?: ReactNode
}) {
  if (scene) {
    return <figure id={slot} aria-label={label} className="aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">{children}</figure>
  }
  return (
    <figure id={slot} className="grid aspect-video w-full min-w-0 place-items-center rounded-xl border border-zinc-200 bg-zinc-100 px-4 text-center">
      <figcaption className="max-w-64 text-sm leading-relaxed text-zinc-600">{label}</figcaption>
    </figure>
  )
}
