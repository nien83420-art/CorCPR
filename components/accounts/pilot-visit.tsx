"use client"

import { useEffect } from "react"
import { recordPilotVisit } from "@/lib/accounts/pilot-actions"

export function PilotVisit({ userId }: { userId: string }) {
  useEffect(() => {
    let sentAt = 0
    function record() {
      if (document.visibilityState !== "visible" || !document.hasFocus() || Date.now() - sentAt < 60_000) return
      sentAt = Date.now()
      void recordPilotVisit().catch(() => {})
    }
    record()
    window.addEventListener("focus", record)
    document.addEventListener("visibilitychange", record)
    return () => {
      window.removeEventListener("focus", record)
      document.removeEventListener("visibilitychange", record)
    }
  }, [userId])
  return null
}
