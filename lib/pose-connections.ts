/**
 * BlazePose landmark indices used by MediaPipe's PoseLandmarker.
 * We only care about the upper body (shoulders, elbows, wrists) for CPR form tracking.
 */
export const POSE_LANDMARK = {
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
} as const

export const TRACKED_LANDMARK_INDICES = Object.values(POSE_LANDMARK)

/** Pairs of landmark indices to draw as skeleton connection lines. */
export const UPPER_BODY_CONNECTIONS: [number, number][] = [
  [POSE_LANDMARK.LEFT_SHOULDER, POSE_LANDMARK.RIGHT_SHOULDER],
  [POSE_LANDMARK.LEFT_SHOULDER, POSE_LANDMARK.LEFT_ELBOW],
  [POSE_LANDMARK.LEFT_ELBOW, POSE_LANDMARK.LEFT_WRIST],
  [POSE_LANDMARK.RIGHT_SHOULDER, POSE_LANDMARK.RIGHT_ELBOW],
  [POSE_LANDMARK.RIGHT_ELBOW, POSE_LANDMARK.RIGHT_WRIST],
]
