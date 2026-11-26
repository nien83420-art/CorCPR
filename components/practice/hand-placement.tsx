import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { Button } from "@/components/ui/button"
import type { PlacementCopy } from "@/lib/practice-setup"

const initial = { x: 64, y: 120 }
const target = { x: 220, y: 128, rx: 13, ry: 17 }

export function HandPlacement({ copy }: { copy: PlacementCopy }) {
  const [point, setPoint] = useState(initial)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  const [attempted, setAttempted] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const marker = useRef<SVGGElement>(null)
  const drag = useRef<number | null>(null)

  function move(x: number, y: number) {
    setPoint({ x: Math.max(23, Math.min(417, x)), y: Math.max(23, Math.min(202, y)) })
    setResult(null)
  }

  function movePointer(event: PointerEvent<SVGSVGElement>) {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    move(local.x, local.y)
  }

  function moveKey(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      check()
      return
    }
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const offset = offsets[event.key]
    if (!offset) return
    event.preventDefault()
    const distance = event.shiftKey ? 1 : 6
    move(point.x + offset[0] * distance, point.y + offset[1] * distance)
  }

  function check() {
    const dx = (point.x - target.x) / target.rx
    const dy = (point.y - target.y) / target.ry
    setAttempted(true)
    setResult(dx * dx + dy * dy <= 1 ? "correct" : "incorrect")
  }

  function retry() {
    setPoint(initial)
    setResult(null)
    setAttempted(false)
    marker.current?.focus()
  }

  return <div className="grid gap-4">
    <p id="placement-hint" className="text-sm text-zinc-700">{copy.hint}</p>
    <svg ref={svg} viewBox="0 0 440 225" role="group" aria-label={copy.diagram} className="w-full rounded-2xl bg-zinc-100"
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return
        drag.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        marker.current?.focus()
        movePointer(event)
      }}
      onPointerMove={event => { if (drag.current === event.pointerId) movePointer(event) }}
      onPointerUp={event => {
        if (drag.current !== event.pointerId) return
        movePointer(event)
        drag.current = null
      }}
      onLostPointerCapture={() => { drag.current = null }}>
      <path d="M191 23Q220 42 249 23L286 36L326 72L302 108L280 92L268 205H172L160 92L138 108L114 72L154 36Z" fill="#e6b29a" stroke="#3f3f46" strokeWidth="2"/>
      <path d="M220 58V152" stroke="#9a5650" strokeOpacity=".57" strokeWidth="9" strokeLinecap="round"/>
      <path d="M174 108H266" stroke="#805a54" strokeDasharray="4 5"/>
      <circle cx="174" cy="108" r="3" fill="#805a54"/><circle cx="266" cy="108" r="3" fill="#805a54"/>
      {attempted && <ellipse cx={target.x} cy={target.y} rx={target.rx} ry={target.ry} fill="#fee2e2" fillOpacity=".85" stroke="#b91c1c" strokeWidth="2" strokeDasharray="3 2" />}
      <g ref={marker} tabIndex={0} role="button" aria-label={copy.marker} aria-describedby="placement-hint" onKeyDown={moveKey}
        transform={`translate(${point.x} ${point.y})`} className="touch-none cursor-grab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:cursor-grabbing">
        <circle r="23" fill="transparent"/>
        <circle r="12" fill="#15803d" stroke="white" strokeWidth="2"/>
        <path d="M-5 0H5 M0 -5V5" stroke="white" strokeWidth="2"/>
      </g>
    </svg>
    <div className="flex flex-wrap gap-2">
      <Button className="min-h-10 bg-red-700 px-4 text-white hover:bg-red-800" onClick={check}>{copy.check}</Button>
      {attempted && <Button className="min-h-10 border-zinc-300 bg-white px-4 text-zinc-900 hover:bg-zinc-100" onClick={retry}>{copy.retry}</Button>}
    </div>
    <p role="status" className="text-sm font-medium text-zinc-800 empty:hidden">
      {result === "correct" ? copy.correct : result === "incorrect" ? copy.incorrect : ""}
    </p>
  </div>
}
