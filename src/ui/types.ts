export interface AgentState {
  status: 'initializing' | 'running' | 'completed' | 'error'
  currentStep: string
  steps: Step[]
  reasoning: string[]
  output: string[]
  error?: string
}

export interface Step {
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: string
}

export interface ToolCallDisplay {
  toolName: string
  params: Record<string, any>
  result?: string
  status: 'pending' | 'running' | 'completed' | 'error'
}

export interface DiffViewProps {
  filePath: string
  oldContent: string
  newContent: string
}

