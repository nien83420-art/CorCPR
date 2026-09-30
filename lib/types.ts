export type Screen = "WELCOME" | "LANGUAGE" | "CALL_103" | "INSTRUCTIONS" | "CPR_PRACTICE" | "RESULTS"

/** Sequential stages of the in-practice gesture training flow, run inside CPR_PRACTICE. */
export type TrainingStage = "CALL_HELP" | "HAND_POSITION" | "COMPRESSIONS" | "RESULTS"

export type Language = "kk" | "ru" | "en"

export type RatingKey = "excellent" | "good" | "needsWork"

export type ResultTipKey =
  | "tipGoodRhythm"
  | "tipGoodTechnique"
  | "tipLeftElbow"
  | "tipRightElbow"
  | "tipBothElbows"
  | "tipWrists"
  | "tipRelease"
  | "tipSteadierRhythm"
  | "tipPushFaster"
  | "tipPushSlower"
  | "tipCompleteAll"
  | "tipKeepPracticing"

/** Percentages are 0-100, or null when the session didn't produce enough real data to score honestly. */
export interface SessionScores {
  techniqueScore: number | null
  rhythmScore: number | null
  completionScore: number
  overallScore: number | null
  rating: RatingKey
  tips: ResultTipKey[]
}

export interface SessionResult extends SessionScores {
  totalCompressions: number
  targetCompressions: number
  averageBpm: number
  durationSeconds: number
}

/** Normalized (0-1) landmark point returned by MediaPipe Pose Landmarker. */
export interface PoseKeypoint {
  x: number
  y: number
  z: number
  visibility?: number
}
