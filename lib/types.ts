export type Screen = "WELCOME" | "LANGUAGE" | "CALL_103" | "CPR_PRACTICE" | "RESULTS"

/** Sequential stages of the in-practice gesture training flow, run inside CPR_PRACTICE. */
export type TrainingStage = "CALL_HELP" | "HAND_POSITION" | "COMPRESSIONS" | "RESULTS"

export type Language = "kk" | "ru" | "en"

export type RatingKey = "excellent" | "good" | "needsWork"

export interface SessionResult {
  totalCompressions: number
  averageBpm: number
  durationSeconds: number
  rating: RatingKey
}

/** Normalized (0-1) landmark point returned by MediaPipe Pose Landmarker. */
export interface PoseKeypoint {
  x: number
  y: number
  z: number
  visibility?: number
}
