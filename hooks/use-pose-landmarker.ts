"use client"

import { useEffect, useRef, useState } from "react"
import type { PoseKeypoint } from "@/lib/types"
import type { PoseConnection } from "@/lib/pose-connections"
import { PoseStabilizer } from "@/lib/pose-stabilizer"

/**
 * Must match the exact @mediapipe/tasks-vision version pinned in package.json.
 * The JS bundle and the WASM runtime are released together and are not
 * guaranteed to be compatible across versions.
 */
const MEDIAPIPE_VERSION = "1.0.1"
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

interface UsePoseLandmarkerOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Only run detection once the video is actually playing. */
  active: boolean
}

interface UsePoseLandmarkerResult {
  /** Stabilized pose for the current frame. Every gesture detector consumes this same result. */
  landmarks: PoseKeypoint[] | null
  /** Same pose as `landmarks`, readable without a React render (used by the canvas overlay). */
  poseRef: React.RefObject<PoseKeypoint[] | null>
  /** PoseLandmarker.POSE_CONNECTIONS, available once the model has loaded. */
  connections: PoseConnection[]
  personDetected: boolean
  isModelLoading: boolean
  error: string | null
}

/**
 * Loads a single MediaPipe PoseLandmarker (client-side, WASM) and runs a live
 * detection loop against the given video element. All inference happens
 * on-device; no frames are sent anywhere.
 */
export function usePoseLandmarker({ videoRef, active }: UsePoseLandmarkerOptions): UsePoseLandmarkerResult {
  const [landmarks, setLandmarks] = useState<PoseKeypoint[] | null>(null)
  const [connections, setConnections] = useState<PoseConnection[]>([])
  const [personDetected, setPersonDetected] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Typed loosely because @mediapipe/tasks-vision is dynamically imported so it
  // never ends up in the server bundle.
  const landmarkerRef = useRef<any>(null)
  const poseRef = useRef<PoseKeypoint[] | null>(null)
  const stabilizerRef = useRef(new PoseStabilizer())
  const rafRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef(-1)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision")
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
        if (cancelled) return

        const create = (delegate: "GPU" | "CPU") =>
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate },
            runningMode: "VIDEO",
            numPoses: 1,
          })

        let landmarker
        try {
          landmarker = await create("GPU")
        } catch {
          // Some browsers/devices can't create a WebGL2 context for the GPU delegate.
          landmarker = await create("CPU")
        }

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        setConnections(PoseLandmarker.POSE_CONNECTIONS.map((c) => ({ start: c.start, end: c.end })))
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

    const stabilizer = stabilizerRef.current
    stabilizer.reset()

    function loop() {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (
        video &&
        landmarker &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime
        const now = performance.now()
        let raw: PoseKeypoint[] | undefined
        try {
          const result = landmarker.detectForVideo(video, now)
          raw = result.landmarks?.[0] as PoseKeypoint[] | undefined
        } catch {
          raw = undefined
        }

        const pose = stabilizer.process(raw, now, video.videoWidth / video.videoHeight)
        if (pose !== poseRef.current) {
          poseRef.current = pose
          setLandmarks(pose)
          setPersonDetected(pose !== null)
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active, isModelLoading, error, videoRef])

  return { landmarks, poseRef, connections, personDetected, isModelLoading, error }
}
