export enum ReasoningMode {
  REACT = 'react',
  PLAN_SOLVE = 'plan_solve',
  REFLECTION = 'reflection',
}

export interface ReasoningResult {
  mode: ReasoningMode
  finalAnswer: string
  steps: ReasoningStep[]
  metadata: {
    turnsCount: number
    toolCallsCount: number
    duration: number
  }
}

export interface ReasoningStep {
  thought?: string
  action?: string
  observation?: string
  timestamp: Date
}

export interface Plan {
  steps: PlanStep[]
  dependencies: Map<string, string[]>
}

export interface PlanStep {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: any
}

export interface Reflection {
  iteration: number
  critique: string
  improvements: string[]
}

export interface ReflectionResult {
  solution: string
  reflections: Reflection[]
  finalSolution: string
}

export interface VerificationResult {
  passed: boolean
  issues: Issue[]
  summary: string
}

export interface Issue {
  type: 'error' | 'warning'
  message: string
  file?: string
  line?: number
}
