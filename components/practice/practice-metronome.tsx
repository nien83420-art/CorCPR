import { useId, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { METRONOME_BPM, METRONOME_MIN_BPM, METRONOME_MAX_BPM, practiceGuidanceCopy } from "@/lib/practice-guidance"
import { createMetronomeTrack } from "@/lib/practice-metronome-audio"
import type { Language } from "@/lib/types"

const RESUME_TIMEOUT_MS = 2500

export function PracticeMetronome({ language, unit }: { language: Language; unit: string }) {
  const copy = practiceGuidanceCopy[language]
  const tempoId = useId()
  const volumeId = useId()
  const audio = useRef<{ context: AudioContext; track: ReturnType<typeof createMetronomeTrack> } | null>(null)
  const resumeTimer = useRef<number | null>(null)
  const request = useRef(0)
  const requested = useRef(false)
  const [tempo, setTempo] = useState(METRONOME_BPM)
  const [volume, setVolume] = useState(65)
  const [muted, setMuted] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const level = muted ? 0 : volume / 100

  useLayoutEffect(() => () => {
    request.current += 1
    requested.current = false
    clearResumeTimer()
    const current = audio.current
    audio.current = null
    current?.track.stop()
    if (current && current.context.state !== "closed") void current.context.close().catch(() => {})
  }, [])

  function clearResumeTimer() {
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current)
    resumeTimer.current = null
  }

  function pause() {
    request.current += 1
    requested.current = false
    clearResumeTimer()
    audio.current?.track.stop()
    setEnabled(false)
  }

  function fail() {
    pause()
    setFailed(true)
  }

  async function toggle() {
    if (requested.current) {
      pause()
      return
    }
    const currentRequest = ++request.current
    requested.current = true
    setEnabled(true)
    setFailed(false)

    try {
      if (!audio.current || audio.current.context.state === "closed") {
        const context = new AudioContext()
        try {
          audio.current = { context, track: createMetronomeTrack(context, tempo, level, fail) }
        } catch (error) {
          void context.close().catch(() => {})
          throw error
        }
      }
      const { context, track } = audio.current
      if (context.state !== "running") {
        resumeTimer.current = window.setTimeout(fail, RESUME_TIMEOUT_MS)
        await context.resume()
      }
      if (request.current !== currentRequest) return
      clearResumeTimer()
      if (context.state !== "running") throw new Error("AudioContext did not resume")
      track.start()
    } catch {
      if (request.current === currentRequest) fail()
    }
  }

  function changeTempo(value: number) {
    setTempo(value)
    audio.current?.track.setTempo(value)
  }

  function changeVolume(value: number) {
    setVolume(value)
    audio.current?.track.setLevel(muted ? 0 : value / 100)
  }

  function toggleMute() {
    setMuted(!muted)
    audio.current?.track.setLevel(muted ? volume / 100 : 0)
  }

  return <section className="rounded-xl border border-zinc-200 bg-white p-3 lg:p-4">
    <h2 className="font-semibold text-zinc-950">{copy.metronome} <span className="text-red-800">· {tempo} {unit}</span></h2>
    <p className="mt-1 text-sm leading-snug text-zinc-700">{copy.metronomeNote}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" onClick={toggle}
        className="min-h-10 max-w-full whitespace-normal bg-red-700 px-3 text-white hover:bg-red-800">
        {enabled ? copy.pause : copy.play}
      </Button>
      <Button type="button" onClick={toggleMute}
        className="min-h-10 max-w-full whitespace-normal border-zinc-200 bg-white px-3 text-zinc-900 hover:bg-zinc-100">
        {muted ? copy.unmute : copy.mute}
      </Button>
    </div>
    <div className="mt-3 grid gap-2">
      <label htmlFor={tempoId} className="text-sm font-medium text-zinc-800">{copy.tempo}</label>
      <input id={tempoId} type="range" min={METRONOME_MIN_BPM} max={METRONOME_MAX_BPM} step={1}
        value={tempo} aria-valuetext={`${tempo} ${unit}`} onChange={event => changeTempo(event.currentTarget.valueAsNumber)}
        className="h-8 w-full accent-red-700" />
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={volumeId} className="text-sm font-medium text-zinc-800">{copy.volume}</label>
        <span aria-hidden="true" className="text-sm text-zinc-600">{volume}%</span>
      </div>
      <input id={volumeId} type="range" min={0} max={100} step={1} value={volume}
        aria-valuetext={`${volume}%`} onChange={event => changeVolume(event.currentTarget.valueAsNumber)}
        className="h-8 w-full accent-red-700" />
    </div>
    {failed && <p role="status" className="mt-2 text-sm text-red-800">{copy.audioError}</p>}
  </section>
}
