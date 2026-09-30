import type { RatingKey, ResultTipKey, SessionScores } from "@/lib/types"

export const TARGET_BPM_MIN = 100
export const TARGET_BPM_MAX = 120
/** BPM outside the target band loses rhythm credit linearly; this far out (in BPM) earns zero. */
const RHYTHM_FALLOFF_BPM = 20
/** Minimum evaluated compression-stage time before a Technique percentage is honest. */
const MIN_TECHNIQUE_SAMPLE_MS = 3000
/** Minimum number of compression intervals (i.e. 3 compressions) before a Rhythm percentage is honest. */
const MIN_RHYTHM_INTERVALS = 2
/** A posture error or incomplete release must affect at least this share of evaluated time to become a tip. */
const TIP_SHARE_THRESHOLD = 0.15
const MAX_TIPS = 3

export const OVERALL_WEIGHTS = { technique: 0.4, rhythm: 0.4, completion: 0.2 } as const

export type PostureErrorKind = "LEFT_ARM_BENT" | "RIGHT_ARM_BENT" | "BOTH_ARMS_BENT" | "WRISTS_TOO_FAR"

/** Raw, deterministic observations recorded during the COMPRESSIONS stage. */
export interface SessionStats {
  /** Time (ms) the pose was trackable enough for the counter to judge posture. */
  evaluatedMs: number
  /** Portion of evaluatedMs where the counter's effective posture check passed. */
  validMs: number
  /** Portion of evaluatedMs spent in each specific posture error. */
  errorMs: Record<PostureErrorKind, number>
  /** Portion of evaluatedMs where the existing movement feedback asked to release fully. */
  releaseMs: number
  /** performance.now() timestamps at which the existing counter's count increased. */
  compressionTimes: number[]
}

export function createEmptyStats(): SessionStats {
  return {
    evaluatedMs: 0,
    validMs: 0,
    errorMs: { LEFT_ARM_BENT: 0, RIGHT_ARM_BENT: 0, BOTH_ARMS_BENT: 0, WRISTS_TOO_FAR: 0 },
    releaseMs: 0,
    compressionTimes: [],
  }
}

/** 1.0 inside 100-120 BPM, falling linearly to 0 at 20 BPM outside the band. */
function intervalRhythmScore(bpm: number): number {
  if (bpm >= TARGET_BPM_MIN && bpm <= TARGET_BPM_MAX) return 1
  const offBy = bpm < TARGET_BPM_MIN ? TARGET_BPM_MIN - bpm : bpm - TARGET_BPM_MAX
  return Math.max(0, 1 - offBy / RHYTHM_FALLOFF_BPM)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function computeSessionScores(stats: SessionStats, totalCompressions: number, targetCompressions: number): SessionScores {
  const technique =
    stats.evaluatedMs >= MIN_TECHNIQUE_SAMPLE_MS ? Math.round((100 * stats.validMs) / stats.evaluatedMs) : null

  const intervalBpms: number[] = []
  for (let i = 1; i < stats.compressionTimes.length; i++) {
    const intervalMs = stats.compressionTimes[i] - stats.compressionTimes[i - 1]
    if (intervalMs > 0) intervalBpms.push(60000 / intervalMs)
  }
  const hasRhythm = intervalBpms.length >= MIN_RHYTHM_INTERVALS
  const rhythm = hasRhythm
    ? Math.round((100 * intervalBpms.reduce((sum, bpm) => sum + intervalRhythmScore(bpm), 0)) / intervalBpms.length)
    : null
  const medianBpm = hasRhythm ? median(intervalBpms) : null

  const completion = Math.round((100 * Math.min(totalCompressions, targetCompressions)) / targetCompressions)

  let overall: number | null = null
  if (technique !== null || rhythm !== null) {
    let weighted = OVERALL_WEIGHTS.completion * completion
    let weights = OVERALL_WEIGHTS.completion
    if (technique !== null) {
      weighted += OVERALL_WEIGHTS.technique * technique
      weights += OVERALL_WEIGHTS.technique
    }
    if (rhythm !== null) {
      weighted += OVERALL_WEIGHTS.rhythm * rhythm
      weights += OVERALL_WEIGHTS.rhythm
    }
    overall = Math.round(weighted / weights)
  }

  const rating: RatingKey = overall === null ? "needsWork" : overall >= 80 ? "excellent" : overall >= 60 ? "good" : "needsWork"

  return {
    techniqueScore: technique,
    rhythmScore: rhythm,
    completionScore: completion,
    overallScore: overall,
    rating,
    tips: buildTips(stats, technique, rhythm, medianBpm, totalCompressions, targetCompressions),
  }
}

function buildTips(
  stats: SessionStats,
  technique: number | null,
  rhythm: number | null,
  medianBpm: number | null,
  totalCompressions: number,
  targetCompressions: number,
): ResultTipKey[] {
  const corrections: ResultTipKey[] = []
  const praise: ResultTipKey[] = []
  const share = (ms: number) => (stats.evaluatedMs > 0 ? ms / stats.evaluatedMs : 0)

  if (stats.evaluatedMs >= MIN_TECHNIQUE_SAMPLE_MS) {
    const left = share(stats.errorMs.LEFT_ARM_BENT)
    const right = share(stats.errorMs.RIGHT_ARM_BENT)
    const both = share(stats.errorMs.BOTH_ARMS_BENT)
    if (both >= TIP_SHARE_THRESHOLD || (left >= TIP_SHARE_THRESHOLD && right >= TIP_SHARE_THRESHOLD)) {
      corrections.push("tipBothElbows")
    } else if (left >= TIP_SHARE_THRESHOLD) {
      corrections.push("tipLeftElbow")
    } else if (right >= TIP_SHARE_THRESHOLD) {
      corrections.push("tipRightElbow")
    }
    if (share(stats.errorMs.WRISTS_TOO_FAR) >= TIP_SHARE_THRESHOLD) corrections.push("tipWrists")
    if (share(stats.releaseMs) >= TIP_SHARE_THRESHOLD) corrections.push("tipRelease")
  }

  if (rhythm !== null && medianBpm !== null) {
    if (rhythm >= 80) praise.push("tipGoodRhythm")
    else if (medianBpm < TARGET_BPM_MIN) corrections.push("tipPushFaster")
    else if (medianBpm > TARGET_BPM_MAX) corrections.push("tipPushSlower")
    else corrections.push("tipSteadierRhythm")
  }

  if (totalCompressions < targetCompressions) corrections.push("tipCompleteAll")
  if (technique !== null && technique >= 85) praise.push("tipGoodTechnique")

  const tips = [...corrections, ...praise].slice(0, MAX_TIPS)
  return tips.length > 0 ? tips : ["tipKeepPracticing"]
}
