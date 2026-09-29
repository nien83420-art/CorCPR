"use client"

import { useEffect, useRef } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { ARM_JOINT_INDICES, POSE_LANDMARK, type PoseConnection } from "@/lib/pose-connections"
import { MIN_LANDMARK_VISIBILITY } from "@/lib/pose-stabilizer"

interface PoseOverlayCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  poseRef: React.RefObject<PoseKeypoint[] | null>
  /** PoseLandmarker.POSE_CONNECTIONS */
  connections: PoseConnection[]
  className?: string
}

const LINE_COLOR = "rgba(34, 197, 94, 0.9)"
const JOINT_COLOR = "rgba(239, 68, 68, 0.95)"
const JOINT_OUTLINE = "rgba(255, 255, 255, 0.95)"
const LINE_WIDTH = 3
const ARM_LINE_WIDTH = 4
const JOINT_RADIUS = 3
const ARM_JOINT_RADIUS = 6
/** A connector longer than this multiple of the body scale is a bad detection, not a limb. */
const MAX_SEGMENT_BODY_SCALE = 2

const ARM_JOINTS = new Set<number>(ARM_JOINT_INDICES)

function isTracked(p: PoseKeypoint | undefined): p is PoseKeypoint {
  return !!p && (p.visibility ?? 1) >= MIN_LANDMARK_VISIBILITY && p.x > -0.1 && p.x < 1.1 && p.y > -0.1 && p.y < 1.1
}

/**
 * Draws the full MediaPipe skeleton on a canvas that sits on top of the
 * (mirrored, object-cover) video. Runs its own rAF loop reading the latest
 * pose from a ref, so drawing never triggers React renders.
 *
 * The canvas must share the video's parent (including its scaleX(-1)
 * mirroring), so points are drawn in un-mirrored video space and the CSS
 * transform mirrors both identically.
 */
export function PoseOverlayCanvas({ videoRef, poseRef, connections, className }: PoseOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const connectionsRef = useRef(connections)
  connectionsRef.current = connections

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let cssWidth = 0
    let cssHeight = 0
    let dirty = true
    let lastPose: PoseKeypoint[] | null | undefined
    let rafId = 0

    const syncSize = () => {
      // clientWidth/Height are unaffected by the parent's scaleX(-1).
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const dpr = window.devicePixelRatio || 1
      const pixelWidth = Math.round(width * dpr)
      const pixelHeight = Math.round(height * dpr)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cssWidth = width
      cssHeight = height
      dirty = true
    }

    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvas)
    syncSize()

    const markDirty = () => {
      dirty = true
    }
    const video = videoRef.current
    video?.addEventListener("loadedmetadata", markDirty)
    video?.addEventListener("resize", markDirty)

    const draw = (pose: PoseKeypoint[] | null) => {
      ctx.clearRect(0, 0, cssWidth, cssHeight)
      const v = videoRef.current
      if (!pose || !v || !v.videoWidth || !v.videoHeight || !cssWidth || !cssHeight) return

      // Replicate object-cover: scale the video to fill, center it, crop overflow.
      const scale = Math.max(cssWidth / v.videoWidth, cssHeight / v.videoHeight)
      const drawnWidth = v.videoWidth * scale
      const drawnHeight = v.videoHeight * scale
      const offsetX = (cssWidth - drawnWidth) / 2
      const offsetY = (cssHeight - drawnHeight) / 2
      const px = (p: PoseKeypoint) => offsetX + p.x * drawnWidth
      const py = (p: PoseKeypoint) => offsetY + p.y * drawnHeight

      const ls = pose[POSE_LANDMARK.LEFT_SHOULDER]
      const rs = pose[POSE_LANDMARK.RIGHT_SHOULDER]
      const lh = pose[POSE_LANDMARK.LEFT_HIP]
      const rh = pose[POSE_LANDMARK.RIGHT_HIP]
      let bodyScale = 0
      if (isTracked(ls) && isTracked(rs)) {
        bodyScale = Math.hypot(px(ls) - px(rs), py(ls) - py(rs))
        if (isTracked(lh) && isTracked(rh)) {
          const torso = Math.hypot((px(ls) + px(rs) - px(lh) - px(rh)) / 2, (py(ls) + py(rs) - py(lh) - py(rh)) / 2)
          bodyScale = Math.max(bodyScale, torso)
        }
      }
      const maxSegment = bodyScale > 0 ? bodyScale * MAX_SEGMENT_BODY_SCALE : Math.max(drawnWidth, drawnHeight) * 0.5

      ctx.lineCap = "round"
      ctx.strokeStyle = LINE_COLOR
      for (const { start, end } of connectionsRef.current) {
        const a = pose[start]
        const b = pose[end]
        if (!isTracked(a) || !isTracked(b)) continue
        const ax = px(a)
        const ay = py(a)
        const bx = px(b)
        const by = py(b)
        if (Math.hypot(ax - bx, ay - by) > maxSegment) continue
        ctx.lineWidth = ARM_JOINTS.has(start) && ARM_JOINTS.has(end) ? ARM_LINE_WIDTH : LINE_WIDTH
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }

      for (let i = 0; i < pose.length; i++) {
        const p = pose[i]
        if (!isTracked(p)) continue
        const emphasized = ARM_JOINTS.has(i)
        ctx.beginPath()
        ctx.arc(px(p), py(p), emphasized ? ARM_JOINT_RADIUS : JOINT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = JOINT_COLOR
        ctx.fill()
        if (emphasized) {
          ctx.lineWidth = 2
          ctx.strokeStyle = JOINT_OUTLINE
          ctx.stroke()
          ctx.strokeStyle = LINE_COLOR
        }
      }
    }

    const loop = () => {
      const pose = poseRef.current
      if (dirty || pose !== lastPose) {
        draw(pose)
        lastPose = pose
        dirty = false
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      video?.removeEventListener("loadedmetadata", markDirty)
      video?.removeEventListener("resize", markDirty)
    }
  }, [videoRef, poseRef])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
