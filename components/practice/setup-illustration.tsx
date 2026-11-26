import type { ReactNode } from "react"
import motion from "./setup-motion.module.css"

const ink = "#27272a"
const red = "#b91c1c"
const skin = "#b97853"

export function Illustration({ children }: { children: ReactNode }) {
  return <svg aria-hidden="true" viewBox="0 0 440 225" className="block w-full rounded-2xl bg-zinc-100">{children}</svg>
}

function Standing() {
  return <g strokeLinecap="round" strokeLinejoin="round">
    <path d="M210 154L200 219 M230 154L240 219" stroke={ink} strokeWidth="22" />
    <path d="M197 99L179 122 189 148 M243 99L261 122 251 148" stroke={skin} strokeWidth="13" fill="none" />
    <path d="M197 99L188 110 M243 99L252 110" stroke={red} strokeWidth="17" />
    <path d="M187 105Q190 88 207 85H233Q249 89 253 105L241 155H199Z" fill={red}/>
    <ellipse cx="220" cy="65" rx="19" ry="23" fill={skin}/>
    <path d="M201 66Q196 37 222 41Q240 43 239 61Q225 57 217 52Q211 62 201 66" fill={ink}/>
  </g>
}

export function Rescuer({ mode = "still", playing = false }: { mode?: "still" | "posture" | "compression"; playing?: boolean }) {
  const animationPlayState = playing ? "running" : "paused"
  return <>
    <path d="M55 195H386" stroke="#a1a1aa" strokeWidth="2"/>
    <path d="M246 156L351 171Q366 175 370 190H247Z" fill="#52525b"/>
    <path className={mode === "compression" ? motion.recoil : undefined} style={{ animationPlayState }}
      d="M146 160Q172 145 190 145H218Q235 146 252 160L260 190H142Z" fill="#e4b1a3"/>
    <path d="M127 166H150V185H128" fill="#d89770"/>
    <path d="M82 181Q77 163 93 156L105 155L111 148L116 155Q130 155 135 166L132 177Q111 191 82 181" fill="#d89770"/>
    <path d="M82 179Q72 174 82 162Q87 156 99 154Q90 161 96 169L91 182Z" fill={ink}/>
    {mode !== "still" && <path d="M201 37V153" stroke={red} strokeDasharray="4 5" opacity=".55"/>}
    <g className={mode === "compression" ? motion.press : mode === "posture" ? motion.align : undefined} style={{ animationPlayState }}>
      <path d="M207 66Q224 70 260 118Q279 138 255 145L194 89Z" fill={red}/>
      <path d="M207 78V139Q201 143 190 142" stroke="#985a43" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M198 77V142Q190 146 180 145" stroke={skin} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M198 77V88" stroke={red} strokeWidth="20" strokeLinecap="round"/>
      <path d="M198 92V117M198 124V137" stroke="#92523c" strokeWidth="1.5" opacity=".7"/>
      <circle cx="198" cy="117" r="3.5" fill="#c88761"/>
      <path d="M200 66L190 55" stroke={skin} strokeWidth="10" />
      <path d="M175 34Q188 26 201 41L201 51L194 58L178 56L172 48L167 45L171 40Z" fill={skin}/>
      <path d="M171 38Q172 22 191 25Q204 28 202 50L196 44L194 36Q182 40 171 38" fill={ink}/>
    </g>
    <path d="M254 126L238 182L309 188 M263 134L259 176L325 181" fill="none" stroke={ink} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round"/>
    {mode === "compression" && <path d="M155 83V130l-7-7m7 7 7-7 M139 130V83l-7 7m7-7 7 7" stroke={red} strokeWidth="2.5" fill="none"/>}
  </>
}

export function CameraFrame({ kneeling }: { kneeling: boolean }) {
  return <Illustration>
    {kneeling ? <Rescuer/> : <Standing/>}
    <path d={kneeling ? "M107 20H86V41 M307 20H328V41 M107 202H86V181 M307 202H328V181" : "M164 30H141V53 M276 30H299V53 M164 167H141V144 M276 167H299V144"} stroke={red} strokeWidth="3" fill="none"/>
  </Illustration>
}

export function StackedHands({ playing }: { playing: boolean }) {
  return <Illustration>
    <path d="M62 208Q130 180 228 184Q320 183 383 207" fill="#e4b1a3" stroke="#a86b59" strokeWidth="2"/>
    <path d="M312 72L326 105L245 144Q222 160 215 175L205 185L177 184Q149 182 132 176L96 165Q89 162 91 155Q93 150 101 152L142 160L96 144Q89 141 91 135Q94 130 101 132L151 146L111 126Q105 123 108 117Q111 112 118 115L169 136L146 118Q140 113 143 108Q147 103 153 107L193 132Q206 138 228 127Z" fill="#cb906f" stroke="#734a37" strokeWidth="2"/>
    <path d="M213 168Q207 178 199 183" stroke={red} strokeWidth="6" strokeLinecap="round"/>
    <g className={motion.stack} style={{ animationPlayState: playing ? "running" : "paused" }}>
      <path d="M70 70L158 106Q176 111 194 111L237 106Q246 106 247 113Q248 119 239 122L211 128L245 126Q254 126 255 133Q255 140 247 141L207 145L230 146Q239 146 238 153Q237 159 229 159L190 159Q171 155 155 145L67 108Z" fill="#e5af8c" stroke="#734a37" strokeWidth="2"/>
      <path d="M201 119Q211 127 205 139 M181 124Q192 131 185 145 M160 121Q168 129 163 139" fill="none" stroke="#8b5441" strokeWidth="4" strokeLinecap="round"/>
    </g>
  </Illustration>
}
