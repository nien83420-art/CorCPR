export const courseMilestones = { lessons: 6, preparation: 7, camera: 8, complete: 9 } as const

export type SavedCourseAttempt = {
  status: string
  modules: readonly { module: number | null }[]
  preparation: { session_id: string } | null
  camera: { session_id: string } | null
}

// A completed attempt starts a new repeat. A preparation checkpoint is already
// validated by the course before it can be written.
export function restoredCourseProgress(attempt: SavedCourseAttempt) {
  if (attempt.status === "completed") return 0
  if (attempt.preparation) return attempt.camera ? courseMilestones.camera : courseMilestones.preparation

  const modules = new Set(attempt.modules.map(event => event.module))
  let completed = 0
  while (completed < courseMilestones.lessons && modules.has(completed + 1)) completed += 1
  return completed
}
