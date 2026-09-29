import type { PoseKeypoint } from "@/lib/types"

/** Shared 2D geometry helpers used by the gesture/pose validation hooks. */

export interface Point2D {
  x: number
  y: number
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Angle at `joint` formed by joint->a and joint->b, in degrees (180 = fully straight). */
export function angleAtJoint(a: Point2D, joint: Point2D, b: Point2D): number {
  const v1x = a.x - joint.x
  const v1y = a.y - joint.y
  const v2x = b.x - joint.x
  const v2y = b.y - joint.y
  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.hypot(v1x, v1y)
  const mag2 = Math.hypot(v2x, v2y)
  if (mag1 === 0 || mag2 === 0) return 0
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)))
  return (Math.acos(cos) * 180) / Math.PI
}

/** Lowest visibility score across the given landmarks (diagnostics only). */
export function minVisibility(points: (PoseKeypoint | undefined)[]): number | null {
  const scores = points.map((p) => p?.visibility).filter((v): v is number => v !== undefined)
  if (scores.length === 0) return null
  return Math.min(...scores)
}
