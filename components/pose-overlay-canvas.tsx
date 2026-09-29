"use client"

import { useEffect, useRef } from "react"
import type { PoseKeypoint } from "@/lib/types"
import { TRACKED_LANDMARK_INDICES, UPPER_BODY_CONNECTIONS } from "@/lib/pose-connections"

interface PoseOverlayCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  landmarks: PoseKeypoint[] | null
  className?: string
}

/**
 * Draws the tracked skeleton (shoulders, elbows, wrists) on a canvas sized
 * to match the video element. Kept separate from detection logic so the
 * visualization can be swapped without touching pose math.
 */
export function PoseOverlayCanvas({ videoRef, landmarks, className }: PoseOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = video.videoWidth || canvas.clientWidth
      canvas.height = video.videoHeight || canvas.clientHeight
    }
    resize()

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!landmarks) return

    const w = canvas.width
    const h = canvas.height

    ctx.lineWidth = Math.max(3, w * 0.006)
    ctx.strokeStyle = "rgba(34, 197, 94, 0.9)"
    ctx.lineCap = "round"

    for (const [a, b] of UPPER_BODY_CONNECTIONS) {
      const pa = landmarks[a]
      const pb = landmarks[b]
      if (!pa || !pb) continue
      ctx.beginPath()
      ctx.moveTo(pa.x * w, pa.y * h)
      ctx.lineTo(pb.x * w, pb.y * h)
      ctx.stroke()
    }

    ctx.fillStyle = "rgba(239, 68, 68, 0.95)"
    for (const index of TRACKED_LANDMARK_INDICES) {
      const point = landmarks[index]
      if (!point) continue
      ctx.beginPath()
      ctx.arc(point.x * w, point.y * h, Math.max(4, w * 0.008), 0, Math.PI * 2)
      ctx.fill()
    }
  }, [landmarks, videoRef])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
