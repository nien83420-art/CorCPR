import type { PreparationEvidence } from "@/lib/accounts/training"

export interface PriorLearning {
  firstChecks: readonly boolean[]
  confidence: number | null
  handStacked: boolean
  chestPlaced: boolean
  evidence: PreparationEvidence
}
