import { test } from "node:test"
import assert from "node:assert/strict"
import { timeRecorded, trainingClock, updateTrainingClock } from "../lib/accounts/training-clock.ts"

test("background time is excluded even when another visibility event arrives later", () => {
  const clock = trainingClock(0)
  updateTrainingClock(clock, 0, true)
  updateTrainingClock(clock, 1_000, false)
  updateTrainingClock(clock, 65_000, true)
  assert.equal(timeRecorded(clock, 66_000), 2_000)
})

test("inactivity stops the clock until a real interaction is observed", () => {
  const clock = trainingClock(0)
  updateTrainingClock(clock, 0, true)
  assert.equal(timeRecorded(clock, 170_000), 90_000)
  updateTrainingClock(clock, 170_000, true)
  assert.equal(timeRecorded(clock, 175_000), 90_000)
  updateTrainingClock(clock, 176_000, true, true)
  assert.equal(timeRecorded(clock, 181_000), 95_000)
})
