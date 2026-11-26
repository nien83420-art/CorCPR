import "server-only"

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { guestKey, trainingWriter } from "./server"
import { type Point } from "@/lib/hand-exercises"
import { validateRecording, type TrainingRecording } from "./training"

const name = "corcpr_guest_result"
const validFor = 60 * 60 * 24
type GuestDraft = { expiresAt: number; email?: string; recording: TrainingRecording }

async function readDraft(): Promise<GuestDraft | null> {
  const key = guestKey()
  const encoded = (await cookies()).get(name)?.value
  if (!key || key.length !== 32 || !encoded || encoded.length > 3500) return null
  try {
    const packed = Buffer.from(encoded, "base64url")
    const cipher = createDecipheriv("aes-256-gcm", key, packed.subarray(0, 12))
    cipher.setAuthTag(packed.subarray(12, 28))
    const draft = JSON.parse(Buffer.concat([cipher.update(packed.subarray(28)), cipher.final()]).toString()) as GuestDraft
    return draft.expiresAt > Date.now() ? draft : null
  } catch {
    return null
  }
}

async function writeDraft(draft: GuestDraft) {
  const key = guestKey()
  if (!key || key.length !== 32) return false
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(draft), "utf8"), cipher.final()])
  const encoded = Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url")
  if (encoded.length > 3500) return false
  const jar = await cookies()
  jar.set(name, encoded, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
    maxAge: Math.max(0, Math.floor((draft.expiresAt - Date.now()) / 1000)),
  })
  return true
}

export async function stageGuestRecording(recording: TrainingRecording) {
  const validated = validateRecording(recording)
  if (validated?.kind !== "course" || !validated.final || !validated.preparation || !recording.preparation) return false
  const { lower, upper, placement } = recording.preparation
  const coords = ({ x, y }: Point) => ({ x, y })
  const responses = validated.preparation.answers
  const clean: TrainingRecording = {
    id: validated.id, kind: validated.kind, startedAt: validated.startedAt,
    activeSeconds: validated.activeSeconds, camera: validated.camera,
    cameraEndedAt: validated.cameraEndedAt, completedAt: validated.completedAt ?? undefined,
    preparation: {
      language: recording.preparation.language,
      intro: responses.slice(0, -2).map(answer => answer.response as number),
      safety: validated.preparation.safety,
      dispatcher: responses[responses.length - 1].response as number,
      confidence: validated.preparation.confidence,
      assessment: validated.preparation.assessment ?? undefined,
      lower: coords(lower), upper: coords(upper), placement: coords(placement),
      interlocked: true, quarterTurns: 0,
    },
    final: { confidence: validated.final.confidence, answers: validated.final.answers.map(answer => answer.response) },
  }
  return writeDraft({ expiresAt: Date.now() + validFor * 1000, recording: clean })
}

export async function bindGuestRecording(email: string) {
  const draft = await readDraft()
  if (draft) await writeDraft({ ...draft, email: email.toLowerCase() })
}

export async function hasGuestRecording() {
  return Boolean(await readDraft())
}

export async function clearGuestRecording() {
  const jar = await cookies()
  jar.delete(name)
}

export async function persistTraining(userId: string, recording: TrainingRecording, guest = false) {
  const data = validateRecording(recording)
  const writer = trainingWriter()
  if (!data || !writer || (guest && !data.final)) return false
  const { error } = await writer.rpc("write_training", {
    p_user: userId, p_id: data.id, p_kind: data.kind, p_started_at: new Date(data.startedAt).toISOString(),
    p_seconds: data.activeSeconds,
    p_camera: { ...data.camera, finishedAt: new Date(data.cameraEndedAt).toISOString() },
    p_preparation: data.preparation,
    p_final: data.final && data.completedAt !== null ? { ...data.final, finishedAt: new Date(data.completedAt).toISOString() } : null,
    p_guest: guest,
  })
  return !error
}

export async function claimGuestRecording(user: { id: string; email?: string }) {
  const draft = await readDraft()
  if (!draft || !draft.email || draft.email !== user.email?.toLowerCase()) return "absent"
  if (!await persistTraining(user.id, draft.recording, true)) return "failed"
  await clearGuestRecording()
  return "saved"
}
