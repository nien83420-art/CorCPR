const idleLimitMs = 90_000

export type TrainingClock = { elapsed: number; since: number | null; deadline: number }

export function trainingClock(now: number): TrainingClock {
  return { elapsed: 0, since: null, deadline: now + idleLimitMs }
}

export function timeRecorded(clock: TrainingClock, now: number) {
  return clock.elapsed + (clock.since === null ? 0 : Math.max(0, Math.min(clock.deadline, now) - clock.since))
}

export function updateTrainingClock(clock: TrainingClock, now: number, foreground: boolean, interaction = false) {
  if (clock.since !== null && (!foreground || now >= clock.deadline)) {
    clock.elapsed = timeRecorded(clock, now)
    clock.since = null
  }
  if (foreground && interaction) clock.deadline = now + idleLimitMs
  if (foreground && now < clock.deadline) clock.since ??= now
}
