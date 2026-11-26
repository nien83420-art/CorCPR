import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { captions, controls, exercise, sequence, type Scene } from "@/lib/lesson-scenes"
import type { Language } from "@/lib/types"
import { LessonIllustration } from "./lesson-illustration"

type Hazard = "wire" | "car"

function Step({ scene, language }: { scene: Scene; language: Language }) {
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(1.3)
  const elapsed = useRef(1.3)
  const [alternate, setAlternate] = useState(false)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [number, setNumber] = useState("")
  const [speaker, setSpeaker] = useState(false)
  const c = (key: keyof typeof controls) => controls[key][language]
  const e = (key: keyof typeof exercise) => exercise[key][language]

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setPlaying(!preference.matches)
    if (!preference.matches) {
      elapsed.current = 0
      setTime(0)
    }
    sync()
    preference.addEventListener("change", sync)
    return () => preference.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!playing) return
    let frame: number
    let previous = performance.now()
    function tick(now: number) {
      // Limit updates of the illustration and discard time spent in a background tab.
      if (now - previous >= 33) {
        elapsed.current += Math.min(now - previous, 100) / 1000
        previous = now
        setTime(elapsed.current)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  function replay() {
    elapsed.current = 0
    setTime(0)
    setPlaying(true)
  }
  function identify(id: Hazard) {
    setHazards(found => found.includes(id) ? found : [...found,id])
  }
  function pair(first: string, second: string, current: boolean | null, choose: (value:boolean)=>void) {
    return <div className="flex flex-wrap gap-2">{[first,second].map((label,i)=>
      <Button key={label} variant={current === Boolean(i) ? "secondary" : "outline"} aria-pressed={current===Boolean(i)} onClick={()=>choose(Boolean(i))}>{label}</Button>
    )}</div>
  }
  function compare(value:boolean) {
    setAlternate(value)
    setAnswer(null)
  }
  let feedback = ""
  let interaction
  switch (scene) {
    case "hazards":
      interaction = <div className="flex flex-wrap gap-2">{(["car","wire"] as const).map(id=><Button key={id} variant="outline" aria-pressed={hazards.includes(id)} onClick={()=>identify(id)}>{hazards.includes(id)?"✓ ":""}{c(id)}</Button>)}</div>
      if (hazards.length) feedback=c(hazards.length===2?"hazardsFound":"selected")
      break
    case "response":
      interaction=<>{pair(c("silent"),c("responsive"),alternate,compare)}{!alternate && pair(e("wait"),e("callNow"),answer,setAnswer)}</>
      feedback=alternate?e("respondHelp"):answer===null?e("noResponse"):e(answer?"callReason":"waitReason")
      break
    case "call":
      interaction=<div className="flex flex-wrap gap-2">{["103","112"].map(n=><Button key={n} variant="outline" aria-pressed={number===n} onClick={()=>{setNumber(n);setSpeaker(false)}}>{c("call")} {n}</Button>)}{number && <Button onClick={()=>setSpeaker(true)} disabled={speaker}>{c("speaker")}</Button>}</div>
      feedback=number ? number+" · "+c(speaker?"speakerOn":"connected") : ""
      break
    case "gasp":
      interaction=<>{pair(c("gasp"),c("normal"),alternate,compare)}{!alternate && pair(e("watch"),e("cpr"),answer,setAnswer)}</>
      feedback=alternate?e("normalReason"):answer===null?"":(answer?"":e("waitReason")+" ")+e("gaspingReason")
      break
    case "alignment":
      interaction=pair(c("correct"),c("bent"),alternate,compare)
      feedback=e(alternate?"bentReason":"alignedReason")
      break
    case "resume":
      interaction=pair(c("trained"),c("only"),alternate,compare)
      feedback=e(alternate?"continuous":"cycles")
      break
  }
  return <>
    <LessonIllustration scene={scene} time={time} alternate={alternate} callState={speaker?2:number?1:0}
      hazards={hazards} onHazard={identify} labels={{car:c("car"),wire:c("wire")}} description={captions[scene][language]}
      units={language==="en" ? ["5–6 cm", "100–120/min"] : ["5–6 см", "100–120/мин"]}/>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={()=>setPlaying(!playing)}>{c(playing?"pause":"play")}</Button>
      <Button variant="outline" onClick={replay}>{c("replay")}</Button>
    </div>
    <p className="leading-relaxed">{captions[scene][language]}</p>
    {interaction && <div className="grid gap-3 rounded-xl bg-muted p-4">{interaction}<p aria-live="polite" className="text-sm empty:hidden">{feedback}</p></div>}
  </>
}

export function LessonPlayer({stage,language}: {stage:number;language:Language}) {
  const [index,setIndex] = useState(0)
  const scenes=sequence[stage]
  const c=(key:keyof typeof controls)=>controls[key][language]
  return <div className="grid gap-4">
    <p className="text-sm font-semibold text-muted-foreground">{c("step")} {index+1} / {scenes.length}</p>
    <Step key={scenes[index]} scene={scenes[index]} language={language}/>
    <nav aria-label={c("step")} className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={!index} onClick={()=>setIndex(index-1)}>{c("previous")}</Button>
      <Button variant="outline" disabled={index===scenes.length-1} onClick={()=>setIndex(index+1)}>{c("next")}</Button>
    </nav>
    <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
      <span>{c("source")}</span>
      <a className="underline" href="https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support" target="_blank" rel="noreferrer">AHA 2025</a>
      <a className="underline" href="https://doi.org/10.1016/j.resuscitation.2025.110771" target="_blank" rel="noreferrer">ERC 2025</a>
      {stage===1 && <a className="underline" href={`https://www.gov.kz/situations/55/199?lang=${language}`} target="_blank" rel="noreferrer">gov.kz · 103 / 112</a>}
    </p>
  </div>
}
