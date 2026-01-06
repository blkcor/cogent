import type { NormalizedMessage } from './message'
import type { ModelInfo } from './model/types'
import { ModeSelector } from './reasoning/mode-selector'
import { ReActAgent } from './reasoning/react'
import { ReasoningMode } from './reasoning/types'
import type { Tools } from './tool'

export interface AgentResult {
  success: boolean
  result: string
  metadata: {
    turnsCount: number
    toolCallsCount: number
    duration: number
  }
}

export interface AgentConfig {
  model: ModelInfo
  tools: Tools
  reasoningMode?: ReasoningMode
  maxSteps?: number
  cwd: string
  onThought?: (thought: string) => void
  onToolCall?: (toolName: string, args: any) => void
  onToolResult?: (toolName: string, result: string) => void
  onStep?: (step: number, total: number) => void
}

export interface IAgent {
  run(task: string): Promise<AgentResult>
  getHistory(): NormalizedMessage[]
}

export class Agent implements IAgent {
  private config: AgentConfig
  private modeSelector: ModeSelector
  private history: NormalizedMessage[]

  constructor(config: AgentConfig) {
    this.config = config
    this.modeSelector = new ModeSelector()
    this.history = []
  }

  async run(task: string): Promise<AgentResult> {
    const startTime = Date.now()

    const mode = this.selectReasoningMode(task)

    try {
      const result = await this.executeWithMode(task, mode)

      const duration = Date.now() - startTime

      return {
        success: true,
        result,
        metadata: {
          turnsCount: this.history.length,
          toolCallsCount: 0,
          duration,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const duration = Date.now() - startTime

      return {
        success: false,
        result: `Error: ${message}`,
        metadata: {
          turnsCount: this.history.length,
          toolCallsCount: 0,
          duration,
        },
      }
    }
  }

  getHistory(): NormalizedMessage[] {
    return [...this.history]
  }

  private selectReasoningMode(task: string): ReasoningMode {
    return this.modeSelector.selectMode(task, this.config.reasoningMode)
  }

  private async executeWithMode(task: string, mode: ReasoningMode): Promise<string> {
    const llm = await this.config.model._mCreator()

    const callbacks = {
      onThought: this.config.onThought,
      onToolCall: this.config.onToolCall,
      onToolResult: this.config.onToolResult,
      onStep: this.config.onStep,
    }

    switch (mode) {
      case ReasoningMode.REACT: {
        const agent = new ReActAgent(llm, this.config.tools, this.config.maxSteps, 3, callbacks)
        return await agent.run(task)
      }

      case ReasoningMode.PLAN_SOLVE: {
        console.log('⚠️  Plan-and-Solve mode not yet implemented, using ReAct')
        const agent = new ReActAgent(llm, this.config.tools, this.config.maxSteps, 3, callbacks)
        return await agent.run(task)
      }

      case ReasoningMode.REFLECTION: {
        console.log('⚠️  Reflection mode not yet implemented, using ReAct')
        const agent = new ReActAgent(llm, this.config.tools, this.config.maxSteps, 3, callbacks)
        return await agent.run(task)
      }

      default: {
        const agent = new ReActAgent(llm, this.config.tools, this.config.maxSteps, 3, callbacks)
        return await agent.run(task)
      }
    }
  }
}
