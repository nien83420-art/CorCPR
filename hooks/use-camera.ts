"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type CameraStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable" | "error"

interface UseCameraOptions {
  /** Whether the camera should be actively requested/streaming. */
  active: boolean
}

interface UseCameraResult {
  /** Stable ref object holding the current <video> node. Safe to read from other hooks. */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /**
   * Ref callback to place on the <video> element. Writes into `videoRef` and,
   * if a stream has already been obtained, attaches it immediately — this is
   * what makes attachment work even when the <video> element mounts *after*
   * getUserMedia() has already resolved (e.g. while a loading screen was
   * showing).
   */
  videoCallbackRef: (node: HTMLVideoElement | null) => void
  status: CameraStatus
  errorMessage: string | null
  retry: () => void
}

/**
 * Handles getUserMedia webcam access and attaches the resulting stream to a
 * <video> element. Kept isolated from pose detection so the two concerns can
 * evolve independently.
 */
export function useCamera({ active }: UseCameraOptions): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }, [])

  // Attaches an already-obtained MediaStream to a mounted <video> element.
  // Safe to call multiple times (e.g. on every mount of the <video> node) —
  // it never stops or replaces the stream, only (re)binds it to the element.
  const attachStreamToVideo = useCallback((video: HTMLVideoElement, stream: MediaStream) => {
    // Safari requires these to be set as element properties (not just JSX
    // attributes) before playback will start.
    video.muted = true
    video.playsInline = true
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    const startPlayback = () => {
      video
        .play()
        .then(() => {
          setStatus("granted")
        })
        .catch((playErr: unknown) => {
          setStatus("error")
          setErrorMessage(
            playErr instanceof Error
              ? `Unable to start the camera preview: ${playErr.message}`
              : "Unable to start the camera preview.",
          )
        })
    }

    // Safari often needs an explicit play() call once the stream's metadata
    // is available, rather than relying on autoplay alone.
    if (video.readyState >= 1) {
      startPlayback()
    } else {
      video.addEventListener("loadedmetadata", startPlayback, { once: true })
    }
  }, [])

  // Ref callback placed on the <video> element. Because getUserMedia() is
  // async, the stream can resolve before the <video> node exists (it may not
  // be mounted yet, e.g. while a "loading" screen is shown). Using a
  // callback ref — instead of relying solely on a RefObject set once inside
  // the getUserMedia effect — guarantees we (re)attach the stream the moment
  // the element actually mounts, whichever happens first.
  const videoCallbackRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node
      if (node && streamRef.current) {
        attachStreamToVideo(node, streamRef.current)
      }
    },
    [attachStreamToVideo],
  )

  useEffect(() => {
    if (!active) {
      stopStream()
      setStatus("idle")
      return
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable")
      setErrorMessage("This browser does not support camera access.")
      return
    }

    let cancelled = false
    setStatus("requesting")
    setErrorMessage(null)

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream

        const video = videoRef.current
        if (video) {
          // <video> is already mounted — attach right away.
          attachStreamToVideo(video, stream)
        } else {
          // <video> isn't mounted yet (e.g. still showing a loading state).
          // Mark permission as granted; `videoCallbackRef` will attach the
          // stream automatically once the element mounts.
          setStatus("granted")
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : "Error"
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setStatus("denied")
          setErrorMessage("Camera permission was denied.")
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setStatus("unavailable")
          setErrorMessage("No camera was found on this device.")
        } else {
          setStatus("error")
          setErrorMessage(err instanceof Error ? err.message : "Unable to access the camera.")
        }
      })

    // Only stop the stream on actual cleanup: when `active` flips off, on
    // retry, or on unmount. A normal re-render does not re-run this effect
    // (deps are [active, retryToken, stopStream]), so the stream is never
    // torn down just because the component rendered again.
    return () => {
      cancelled = true
      stopStream()
    }
  }, [active, retryToken, stopStream, attachStreamToVideo])

  const retry = useCallback(() => setRetryToken((n) => n + 1), [])

  return { videoRef, videoCallbackRef, status, errorMessage, retry }
}
