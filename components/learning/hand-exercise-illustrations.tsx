import { sternumTarget } from "@/lib/hand-exercises"

// All views use the heel of the lower palm at (0, 0), including the draggable pair on the chest.
const openHand =
  "M-48 -39 Q-32 -34 -20 -22 C-12 -18 -5 -24 8 -28 L62 -38 Q72 -39 73 -33 Q74 -27 65 -25 L35 -18 " +
  "L86 -23 Q96 -24 97 -17 Q97 -10 87 -9 L39 -4 L96 -4 Q105 -4 105 3 Q105 10 96 10 L41 11 " +
  "L86 15 Q95 16 94 23 Q93 29 84 29 L28 25 Q22 25 21 28 L41 43 Q47 49 43 55 Q39 60 31 55 " +
  "L3 39 C-9 34 -15 27 -20 20 Q-34 13 -56 -3 Z"

export function IllustratedHand({ upper = false, problem = false }: {
  upper?: boolean
  problem?: boolean
}) {
  return <g transform={upper ? undefined : "scale(1 -1)"} strokeLinecap="round" strokeLinejoin="round">
    <path d={openHand} fill={upper ? "#f7d1bc" : "#dba68e"}
      stroke={problem ? "#b91c1c" : "#55392f"} strokeWidth={problem ? 3 : 1.8} />
    <g fill="none" stroke="#946457" strokeWidth="1.25">
      <path d="M-21 -12Q-15 -1 -20 11 M25 -16Q20 -8 22 -2 M26 0Q23 6 25 10 M25 13Q22 19 26 23 M8 24Q12 29 17 31" />
      <path d="M54 -34l2 8m16 7 1 8m8 10v8m-9 12-1 7m-37 16q-4 2-5 5" />
    </g>
  </g>
}

export function InterlockedLowerHand() {
  return <g transform="rotate(90)" stroke="#55392f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-16 54C-14 34-17 20-25 7C-34-4-42-20-45-33
      C-47-40-42-44-37-41C-32-38-29-28-25-23Q-21-22-23-31
      L-40-76C-44-87-34-92-29-83L-12-50Q-9-46-9-54L-16-93
      C-18-104-7-107-4-97L4-57Q6-51 9-57L14-88C16-98 26-96 26-87
      L23-52Q23-46 27-50L36-71C40-80 49-76 47-67L36-36
      C33-23 37-10 32 5C28 17 30 34 34 52Z" fill="#dba68e" />
    <path d="M-35-72Q-31-75-26-75M-12-81Q-8-84-3-82M15-76Q19-77 24-75M33-61Q38-61 42-59
      M-41-34Q-37-36-34-35" fill="none" stroke="#946457" strokeWidth="1.2" />
  </g>
}

export function InterlockedUpperHand() {
  return <g transform="rotate(90)" stroke="#55392f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M-29 49C-24 32-23 18-27 10C-33-3-28-12-35-25
      C-40-34-32-40-25-34Q-21-31-18-34
      C-23-46-24-57-17-61C-10-65-5-57-2-48Q0-43 1-50
      C0-62 3-71 10-70C17-70 19-61 19-51Q20-46 23-51
      C26-58 31-60 35-56Q41-51 37-42Q37-38 40-39
      C45-42 50-38 49-31C48-24 43-19 40-13C36-4 34 5 27 13
      C20 24 17 37 18 49Z" fill="#f7d1bc" />
    <path d="M-17-55Q-12-57-8-53M6-63Q11-66 15-61M26-52Q30-55 34-51
      M-20-27Q-17-20-12-17M5-27Q5-17 2-12M23-25Q22-16 18-10"
      fill="none" stroke="#946457" strokeWidth="1.25" />
  </g>
}

export function HeelMarker({ outline = false }: { outline?: boolean }) {
  return <g pointerEvents="none">
    <circle r={outline ? 6.5 : 6} fill={outline ? "#fff" : "#991b1b"} stroke={outline ? "#991b1b" : "#fff"} strokeWidth="2" />
    {outline && <path d="M-2.5 0h5M0-2.5v5" stroke="#991b1b" strokeWidth="1.15" strokeLinecap="round" />}
  </g>
}

export function InterlockedHands() {
  return <g>
    <InterlockedLowerHand />
    <InterlockedUpperHand />
  </g>
}

export function LowerPalmInset() {
  return <svg viewBox="0 0 121 149" className="h-28 w-24 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50" aria-hidden="true">
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M41 139L42 119C39 111 31 104 26 98L9 78C2 69 10 63 17 69L32 81
        C35 82 36 78 35 75L32 36C31 26 42 24 44 34L48 61L47 20
        C47 9 58 8 60 19L62 58L65 22C66 12 77 13 78 23L77 62L85 40
        C88 30 99 33 97 44L92 76C93 93 92 108 86 120L86 139Z"
        fill="#dba68e" stroke="#55392f" strokeWidth="2" />
      <path d="M43 120Q64 125 85 120M41 81Q51 81 57 92M59 75Q78 68 95 72M63 82Q70 89 67 94"
        fill="none" stroke="#946457" strokeWidth="1.6" />
      <path d="M45 106C51 100 73 99 85 104C90 107 84 115 76 117L55 117C47 117 40 111 45 106Z"
        fill="#dcfce7" stroke="#166534" strokeWidth="2.4" strokeDasharray="4 3" />
    </g>
  </svg>
}

export function ChestIllustration({ title, highlight, correct }: {
  title: string
  highlight: boolean
  correct: boolean
}) {
  return <g role="img" aria-label={title} strokeLinejoin="round" strokeLinecap="round">
    <path d="M171 26q5 23-18 26l-34 8q-28 6-43 31L54 140q-3 7 4 10l26 12 19-27q7 26 8 57l-2 121
      q42 21 91 21t91-21l-2-121q1-31 8-57l19 27 26-12q7-3 4-10l-22-49q-15-25-43-31l-34-8q-23-3-18-26
      q-29 10-58 0Z" fill="#efd5c6" stroke="#805c51" strokeWidth="2" />
    <g fill="none" stroke="#ae7f70" strokeWidth="1.55">
      <path d="M109 91q20-7 44-3 23 3 38 16 M291 91q-20-7-44-3-23 3-38 16" />
      <path d="M103 134q10 62 63 74 M297 134q-10 62-63 74 M166 240q17-15 34-15t34 15" opacity=".62" />
      <path d="M195 275q5 6 10 0" />
    </g>
    <g fill="none" stroke="#c09384" strokeWidth="2" opacity=".85">
      {[0, 1, 2, 3].map(index => <g key={index} transform={`translate(0 ${index * 14})`}>
        <path d="M189 123q-38-21-72-8 M211 123q38-21 72-8" />
      </g>)}
      <path d="M189 184q-8 21-46 37 M211 184q8 21 46 37" />
    </g>
    <path d="M194 97h12l8 19-3 17 3 51-5 28-9 11-9-11-5-28 3-51-3-17Z"
      fill="#fbf0e9" fillOpacity=".8" stroke="#9c7366" strokeWidth="1.5" />
    <path d="M189 133h22 M195 214h10" stroke="#b08a7d" strokeWidth="1.2" />
    {highlight && <polygon points={sternumTarget.map(({ x, y }) => `${x},${y}`).join(" ")}
      fill={correct ? "#bbf7d0" : "#fecaca"} stroke={correct ? "#166534" : "#b91c1c"}
      strokeWidth="2" strokeDasharray="3 2" />}
  </g>
}
