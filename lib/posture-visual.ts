/**
 * Shared semantic skeleton-coloring state. This is presentation-only: every value here is
 * derived from the reasons/measurements already produced by the CALL_HELP, HAND_POSITION, and
 * COMPRESSIONS validation hooks (see hooks/use-posture-visual-state.ts). There is no separate
 * pose-validation algorithm here — this file only names the possible visual states and the
 * neutral default so the canvas overlay and the derivation hook agree on vocabulary.
 */

export type SegmentState = "valid" | "invalid" | "neutral"

export interface PostureVisualState {
  leftArm: SegmentState
  rightArm: SegmentState
  leftWrist: SegmentState
  rightWrist: SegmentState
  leftShoulder: SegmentState
  rightShoulder: SegmentState
}

export const NEUTRAL_VISUAL_STATE: PostureVisualState = {
  leftArm: "neutral",
  rightArm: "neutral",
  leftWrist: "neutral",
  rightWrist: "neutral",
  leftShoulder: "neutral",
  rightShoulder: "neutral",
}

/** Feedback message keys the posture-visual layer can surface; each is a key in lib/i18n.ts's `training` namespace. */
export type PostureMessageKey =
  | "straightenLeftElbow"
  | "straightenRightElbow"
  | "straightenElbows"
  | "bringWristsTogether"
  | "shouldersOverHands"
  | "pushDeeper"
