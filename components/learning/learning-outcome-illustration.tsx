import type { FoundationMediaSlot } from "@/lib/learning-foundations"

const scenes = {
  "learning-recognition": <>
    <path d="M23 76h115" className="stroke-zinc-300" />
    <circle cx="48" cy="63" r="10" fill="white" />
    <path d="M59 71c4-2 6-7 11-7h16l13 7h27a2.5 2.5 0 0 1 0 5H63a4 4 0 0 1-4-5Z" fill="white" />
    <circle cx="103" cy="25" r="9" fill="white" />
    <path d="m98 37-8 13-17 10M103 38l10 14-8 12h16" />
    <path d="M63 47v-5m-7 9-4-4m18 2 4-4" className="stroke-red-700" />
  </>,
  "learning-emergency-call": <>
    <rect x="56" y="16" width="48" height="64" rx="9" fill="white" />
    <path d="M76 23h8m-8 50h8" className="stroke-zinc-300" />
    <circle cx="80" cy="47" r="15" className="fill-red-100 stroke-none" />
    <path d="M76 39h-3a2 2 0 0 0-2 2c0 8 7 15 15 15a2 2 0 0 0 2-2v-3l-5-2-2 2a11 11 0 0 1-5-5l2-2-2-5Z" className="stroke-red-700" />
    <path d="M113 35a16 16 0 0 1 0 24m7-30a24 24 0 0 1 0 36" className="stroke-red-700" />
  </>,
  "learning-compressions": <>
    <circle cx="57" cy="23" r="9" fill="white" />
    <path d="M49 36c-1 4-4 5-8 6-6 2-9 6-9 13v16c0 4 3 7 7 7h36c4 0 7-3 7-7V55c0-7-3-11-9-13-4-1-7-2-8-6Z" fill="white" />
    <path d="M47 48c3 0 7 0 10 3 3-3 7-3 10-3m-10 3v13" className="stroke-zinc-300" />
    <circle cx="57" cy="62" r="8" className="fill-red-100 stroke-none" />
    <circle cx="57" cy="62" r="2.5" className="fill-red-700 stroke-none" />
    <path d="m100 74 9-29h11l9 29h-29Z" fill="white" />
    <path d="m114 68 8-16m-9 9h5m4-22a10 10 0 0 1 7 6m-3-12a17 17 0 0 1 10 10" className="stroke-red-700" />
  </>,
} satisfies Record<FoundationMediaSlot, React.ReactNode>

export function LearningOutcomeIllustration({ slot, label }: { slot: FoundationMediaSlot; label: string }) {
  return <svg id={slot} role="img" aria-label={label} viewBox="0 0 160 96" fill="none"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-full w-full stroke-zinc-700">
    {scenes[slot]}
  </svg>
}
