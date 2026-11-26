const LOOK_AHEAD_SECONDS = 0.12
const SCHEDULE_EVERY_MS = 25
const START_LEAD_SECONDS = 0.02
const CLICK_SECONDS = 0.045

export function createMetronomeClick(context: BaseAudioContext) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * CLICK_SECONDS), context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) {
    const t = i / context.sampleRate
    const attack = Math.min(1, t / 0.001)
    const release = Math.min(1, (CLICK_SECONDS - t) / 0.006)
    const tick = 0.7 * Math.sin(2 * Math.PI * 1250 * t) + 0.25 * Math.sin(2 * Math.PI * 2500 * t)
    samples[i] = tick * attack * Math.exp(-t / 0.009) * release
  }
  return buffer
}

export function createMetronomeTrack(context: AudioContext, bpm: number, level: number, onFailure: () => void) {
  const click = createMetronomeClick(context)
  const gain = context.createGain()
  gain.gain.value = level
  gain.connect(context.destination)

  const scheduled = new Map<AudioBufferSourceNode, number>()
  let timer: number | null = null
  let period = 60 / bpm
  let nextBeat = 0
  let lastPlayed: number | null = null

  function clearTimer() {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
  }

  function cancel(source: AudioBufferSourceNode) {
    source.onended = null
    source.disconnect()
    source.stop()
    scheduled.delete(source)
  }

  function stop() {
    clearTimer()
    for (const source of scheduled.keys()) cancel(source)
    lastPlayed = null
  }

  function scheduleBeat(at: number) {
    const source = context.createBufferSource()
    source.buffer = click
    source.connect(gain)
    source.onended = () => {
      lastPlayed = Math.max(lastPlayed ?? at, at)
      scheduled.delete(source)
      source.disconnect()
    }
    source.start(at)
    scheduled.set(source, at)
  }

  function schedule() {
    if (context.state !== "running") {
      stop()
      onFailure()
      return
    }
    const now = context.currentTime
    // Skip missed beats during a browser delay. The audio clock keeps the beat grid.
    if (nextBeat < now) nextBeat += Math.ceil((now - nextBeat) / period) * period
    if (nextBeat < now + LOOK_AHEAD_SECONDS) {
      scheduleBeat(nextBeat)
      nextBeat += period
    }
    timer = window.setTimeout(schedule, SCHEDULE_EVERY_MS)
  }

  return {
    start() {
      if (timer !== null) return
      nextBeat = context.currentTime + START_LEAD_SECONDS
      schedule()
    },
    stop,
    setTempo(value: number) {
      period = 60 / value
      if (timer === null) return
      clearTimer()
      const now = context.currentTime
      for (const [source, at] of scheduled) {
        if (at > now) cancel(source)
        else lastPlayed = Math.max(lastPlayed ?? at, at)
      }
      nextBeat = lastPlayed === null ? now + START_LEAD_SECONDS : lastPlayed + period
      schedule()
    },
    setLevel(value: number) {
      gain.gain.setValueAtTime(value, context.currentTime)
    },
  }
}
