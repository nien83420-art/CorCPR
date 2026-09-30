/**
 * BlazePose landmark indices used by MediaPipe's PoseLandmarker (33 landmarks).
 * Only the indices referenced by CPR logic are named here; the overlay draws
 * the full skeleton via PoseLandmarker.POSE_CONNECTIONS.
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
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const

/** Same shape as MediaPipe's `Connection` type. */
export interface PoseConnection {
  start: number
  end: number
}

/** Joints drawn larger in the overlay because CPR detection depends on them. */
export const ARM_JOINT_INDICES = [
  POSE_LANDMARK.LEFT_SHOULDER,
  POSE_LANDMARK.RIGHT_SHOULDER,
  POSE_LANDMARK.LEFT_ELBOW,
  POSE_LANDMARK.RIGHT_ELBOW,
  POSE_LANDMARK.LEFT_WRIST,
  POSE_LANDMARK.RIGHT_WRIST,
]
