"use client"

import { useEffect, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

interface UsePoseLandmarkerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Only run detection once the video is actually playing. */
  active: boolean
}

interface UsePoseLandmarkerResult {
  landmarks: PoseKeypoint[] | null
  personDetected: boolean
  isModelLoading: boolean
  error: string | null
}

/**
 * Loads MediaPipe's PoseLandmarker (client-side, WASM/GPU) and runs a live
 * detection loop against the given video element. All inference happens
 * on-device; no frames are sent anywhere.
 */
export function usePoseLandmarker({ videoRef, active }: UsePoseLandmarkerOptions): UsePoseLandmarkerResult {
  const [landmarks, setLandmarks] = useState<PoseKeypoint[] | null>(null)
  const [personDetected, setPersonDetected] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Using `any` for the model instance to avoid a hard dependency on
  // @mediapipe/tasks-vision types at the hook boundary; it's dynamically
  // imported so this module is never pulled into the server bundle.
  const landmarkerRef = useRef<any>(null)
  const rafRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef(-1)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
        if (cancelled) return

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        })

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        setIsModelLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load the pose detection model.")
        setIsModelLoading(false)
      }
    }

    setup()

    return () => {
      cancelled = true
      landmarkerRef.current?.close?.()
      landmarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active || isModelLoading || error) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    function loop() {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (video && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const result = landmarker.detectForVideo(video, performance.now())
        const pose = result.landmarks?.[0]
        if (pose) {
          setLandmarks(pose as PoseKeypoint[])
          setPersonDetected(true)
        } else {
          setLandmarks(null)
          setPersonDetected(false)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, isModelLoading, error, videoRef])

  return { landmarks, personDetected, isModelLoading, error }
}
