import { courseMilestones } from "@/lib/course-progress"
import { foundationsCopy } from "@/lib/learning-foundations"
import type { Language } from "@/lib/types"
import styles from "@/components/screens/learning-intro.module.css"

export const courseSafeArea = styles.safeArea

export function CourseProgressBar({ language, completed, className = "" }: {
  language: Language
  completed: number
  className?: string
}) {
  return <div role="progressbar" aria-label={foundationsCopy[language].courseProgress}
    aria-valuemin={0} aria-valuemax={courseMilestones.complete} aria-valuenow={completed}
    className={`h-1 overflow-hidden rounded-full bg-zinc-200 ${className}`}>
    <div className="h-full origin-left rounded-full bg-red-700 transition-transform duration-500 ease-out motion-reduce:transition-none"
      style={{ transform: `scaleX(${completed / courseMilestones.complete})` }} />
  </div>
}
