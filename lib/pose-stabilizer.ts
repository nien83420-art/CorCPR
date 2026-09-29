import type { PoseKeypoint } from "@/lib/types"

/**
 * Light temporal stabilization for MediaPipe pose landmarks.
 *
 * - One Euro filter per coordinate: strong smoothing when a joint is nearly
 *   still (kills jitter), almost no smoothing when it moves fast (so 100-120
 *   bpm compressions are followed without visible lag).
 * - Single-frame outlier rejection: a joint that teleports far from its last
 *   position is held for one frame; if the next frame confirms the new
 *   location it is accepted immediately.
 * - Short dropout hold: if MediaPipe loses the person for <= HOLD_MS, the last
 *   stabilized pose is kept instead of flashing the skeleton off.
 */

/** Keep the last pose this long when detection briefly disappears. */
export const POSE_HOLD_MS = 150
/** Landmarks below this visibility are treated as untracked (not filtered, not drawn). */
export const MIN_LANDMARK_VISIBILITY = 0.5

// One Euro parameters, tuned for normalized (0-1) coordinates.
// MIN_CUTOFF (Hz) controls smoothing at rest; BETA controls how quickly the
// filter opens up as speed increases. D_CUTOFF smooths the speed estimate.
const MIN_CUTOFF = 2.5
const BETA = 10
const D_CUTOFF = 1

/** Per-frame jump (in frame-height units) above which a joint is considered a possible outlier. */
const MIN_OUTLIER_JUMP = 0.12
/** Additional allowed jump per second of elapsed time, so low-fps devices don't reject real motion. */
const OUTLIER_JUMP_PER_SECOND = 3

function smoothingAlpha(cutoffHz: number, dtSeconds: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz)
  return 1 / (1 + tau / dtSeconds)
}

class OneEuroFilter {
  private value: number | null = null
  private derivative = 0

  reset(value: number) {
    this.value = value
    this.derivative = 0
  }

  filter(raw: number, dtSeconds: number): number {
    if (this.value === null) {
      this.reset(raw)
      return raw
    }
    const rawDerivative = (raw - this.value) / dtSeconds
    const dAlpha = smoothingAlpha(D_CUTOFF, dtSeconds)
    this.derivative = this.derivative + dAlpha * (rawDerivative - this.derivative)
    const cutoff = MIN_CUTOFF + BETA * Math.abs(this.derivative)
    const alpha = smoothingAlpha(cutoff, dtSeconds)
    this.value = this.value + alpha * (raw - this.value)
    return this.value
  }
}

interface LandmarkState {
  fx: OneEuroFilter
  fy: OneEuroFilter
  fz: OneEuroFilter
  last: PoseKeypoint | null
  wasTracked: boolean
  outlierCandidate: PoseKeypoint | null
}

function createState(): LandmarkState {
  return {
    fx: new OneEuroFilter(),
    fy: new OneEuroFilter(),
    fz: new OneEuroFilter(),
    last: null,
    wasTracked: false,
    outlierCandidate: null,
  }
}

export class PoseStabilizer {
  private states: LandmarkState[] = []
  private lastPose: PoseKeypoint[] | null = null
  private lastFrameMs: number | null = null
  private lastSeenMs: number | null = null

  reset() {
    this.states = []
    this.lastPose = null
    this.lastFrameMs = null
    this.lastSeenMs = null
  }

  /**
   * @param raw Landmarks for one person from PoseLandmarker, or undefined if none detected.
   * @param timestampMs Frame timestamp (performance.now()).
   * @param aspect Video width / height, so jump distances are measured in real proportions.
   */
  process(raw: PoseKeypoint[] | undefined, timestampMs: number, aspect: number): PoseKeypoint[] | null {
    if (!raw || raw.length === 0) {
      if (this.lastPose && this.lastSeenMs !== null && timestampMs - this.lastSeenMs <= POSE_HOLD_MS) {
        return this.lastPose
      }
      this.reset()
      return null
    }

    if (this.lastSeenMs !== null && timestampMs - this.lastSeenMs > POSE_HOLD_MS) {
      this.states = []
      this.lastFrameMs = null
    }

    const elapsedMs = this.lastFrameMs === null ? 33 : timestampMs - this.lastFrameMs
    const dt = Math.min(0.25, Math.max(1 / 120, elapsedMs / 1000))
    const jumpThreshold = Math.max(MIN_OUTLIER_JUMP, OUTLIER_JUMP_PER_SECOND * dt)

    const out: PoseKeypoint[] = new Array(raw.length)
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i]
      const state = (this.states[i] ??= createState())
      const tracked = (r.visibility ?? 1) >= MIN_LANDMARK_VISIBILITY

      let result: PoseKeypoint
      if (!tracked || !state.wasTracked || !state.last) {
        // Untracked, or just re-acquired: take the raw value and restart the filter
        // there, so the joint doesn't slide in from a stale position.
        state.fx.reset(r.x)
        state.fy.reset(r.y)
        state.fz.reset(r.z)
        state.outlierCandidate = null
        result = { x: r.x, y: r.y, z: r.z, visibility: r.visibility }
      } else {
        const jump = Math.hypot((r.x - state.last.x) * aspect, r.y - state.last.y)
        if (jump > jumpThreshold) {
          const candidate = state.outlierCandidate
          const confirmed =
            candidate !== null && Math.hypot((r.x - candidate.x) * aspect, r.y - candidate.y) < jumpThreshold * 0.5
          if (confirmed) {
            state.fx.reset(r.x)
            state.fy.reset(r.y)
            state.fz.reset(r.z)
            state.outlierCandidate = null
            result = { x: r.x, y: r.y, z: r.z, visibility: r.visibility }
          } else {
            state.outlierCandidate = r
            result = state.last
          }
        } else {
          state.outlierCandidate = null
          result = {
            x: state.fx.filter(r.x, dt),
            y: state.fy.filter(r.y, dt),
            z: state.fz.filter(r.z, dt),
            visibility: r.visibility,
          }
        }
      }

      state.wasTracked = tracked
      state.last = result
      out[i] = result
    }

    this.lastFrameMs = timestampMs
    this.lastSeenMs = timestampMs
    this.lastPose = out
    return out
  }
}
