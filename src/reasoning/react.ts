import type { LanguageModel } from 'ai'
import { generateText } from 'ai'
import type { Tools } from '../tool'
import type { ReasoningStep } from './types'

export interface IReActAgent {
  run(task: string): Promise<string>
  getHistory(): ReasoningStep[]
}

export class ReActAgent implements IReActAgent {
  private llm: LanguageModel
  private tools: Tools
  private maxSteps: number
  private history: ReasoningStep[]

  constructor(llm: LanguageModel, tools: Tools, maxSteps = 30) {
    this.llm = llm
    this.tools = tools
    this.maxSteps = maxSteps
    this.history = []
  }

  async run(task: string): Promise<string> {
    this.history = []

    const systemPrompt = `You are an AI coding assistant that solves tasks using available tools.

Available tools: ${Array.from({ length: this.tools.length() }, (_, i) => {
      const toolNames: string[] = []
      // Get all tool names (simplified approach)
      return toolNames
    }).join(', ')}

For each step:
1. Think about what to do next
2. Use tools to gather information or make changes
3. Observe results and continue

When done, respond with "FINAL ANSWER:" followed by your conclusion.`

    let conversationHistory = `${systemPrompt}\n\nTask: ${task}\n\nSolve this step by step.`

    for (let step = 0; step < this.maxSteps; step++) {
      try {
        const { text, toolCalls } = await generateText({
          model: this.llm,
          prompt: conversationHistory,
          tools: this.tools.toLanguageV1Tools(),
          temperature: 0.7,
          maxTokens: 2000,
        })

        if (text.includes('FINAL ANSWER:')) {
          const finalAnswer = text.split('FINAL ANSWER:')[1].trim()
          this.history.push({
            thought: 'Task completed',
            observation: finalAnswer,
            timestamp: new Date(),
          })
          return finalAnswer
        }

        this.history.push({
          thought: text,
          timestamp: new Date(),
        })

        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            const result = await this.tools.invoke(
              toolCall.toolName,
              JSON.stringify(toolCall.args),
              toolCall.toolCallId
            )

            const observation =
              typeof result.llmContent === 'string'
                ? result.llmContent
                : JSON.stringify(result.llmContent)

            this.history.push({
              action: `${toolCall.toolName}(${JSON.stringify(toolCall.args)})`,
              observation,
              timestamp: new Date(),
            })

            conversationHistory += `\n\nTool: ${toolCall.toolName}\nResult: ${observation}`
          }
        }

        conversationHistory += `\n\nAgent: ${text}\n\nContinue or provide FINAL ANSWER: if done.`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Error in step ${step + 1}: ${message}`)
      }
    }

    return 'Task incomplete: maximum steps reached'
  }

  getHistory(): ReasoningStep[] {
    return [...this.history]
  }
}
