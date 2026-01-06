import type { LanguageModel } from 'ai'
import { generateText } from 'ai'
import type { Tools } from '../tool'
import type { ReasoningStep } from './types'

type Message = {
  role: 'user' | 'assistant' | 'tool'
  content:
    | string
    | Array<{
        type: string
        text?: string
        toolCallId?: string
        toolName?: string
        args?: string
      }>
  toolName?: string
  toolCallId?: string
}

export interface ReActCallbacks {
  onThought?: (thought: string) => void
  onToolCall?: (toolName: string, args: any) => void
  onToolResult?: (toolName: string, result: string) => void
  onStep?: (step: number, total: number) => void
}

export interface IReActAgent {
  run(task: string): Promise<string>
  getHistory(): ReasoningStep[]
}

export class ReActAgent implements IReActAgent {
  private llm: LanguageModel
  private tools: Tools
  private maxSteps: number
  private history: ReasoningStep[]
  private maxRetries: number
  private callbacks: ReActCallbacks

  constructor(
    llm: LanguageModel,
    tools: Tools,
    maxSteps = 30,
    maxRetries = 3,
    callbacks: ReActCallbacks = {}
  ) {
    this.llm = llm
    this.tools = tools
    this.maxSteps = maxSteps
    this.maxRetries = maxRetries
    this.history = []
    this.callbacks = callbacks
  }

  async run(task: string): Promise<string> {
    this.history = []

    const systemPrompt = `You are an AI coding assistant that solves tasks using available tools.

For each step:
1. Think about what to do next
2. Use tools to gather information or make changes
3. Observe results and continue

When done, respond with "FINAL ANSWER:" followed by your conclusion.`

    // Build messages array for multi-turn conversation
    const messages: Message[] = [
      {
        role: 'user',
        content: `${systemPrompt}\n\nTask: ${task}\n\nSolve this step by step.`,
      },
    ]

    for (let step = 0; step < this.maxSteps; step++) {
      try {
        // Emit step progress
        this.callbacks.onStep?.(step + 1, this.maxSteps)

        const result = await this.generateTextWithRetry(messages)

        const { text, toolCalls } = result

        // When LLM makes tool calls, text might be empty - that's OK
        if (!text && (!toolCalls || toolCalls.length === 0)) {
          throw new Error('No text in response and no tool calls')
        }

        if (text && text.includes('FINAL ANSWER:')) {
          const finalAnswer = text.split('FINAL ANSWER:')[1].trim()
          this.callbacks.onThought?.(`Task completed: ${finalAnswer}`)
          this.history.push({
            thought: 'Task completed',
            observation: finalAnswer,
            timestamp: new Date(),
          })
          return finalAnswer
        }

        if (text) {
          this.callbacks.onThought?.(text)
          this.history.push({
            thought: text,
            timestamp: new Date(),
          })
        }

        // Add assistant response to messages
        if (toolCalls && toolCalls.length > 0) {
          // When there are tool calls, assistant message needs to include both text and tool calls
          const assistantContent: any = []

          // Only add text part if there's actual text content
          if (text) {
            assistantContent.push({ type: 'text', text })
          }

          for (const toolCall of toolCalls) {
            assistantContent.push({
              type: 'tool-call',
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
            })
          }

          // If assistantContent is empty (shouldn't happen), add placeholder text
          if (assistantContent.length === 0) {
            assistantContent.push({ type: 'text', text: '' })
          }

          messages.push({ role: 'assistant', content: assistantContent })

          // Execute tool calls and add results
          for (const toolCall of toolCalls) {
            // Emit tool call event
            this.callbacks.onToolCall?.(toolCall.toolName, toolCall.args)

            const toolResult = await this.tools.invoke(
              toolCall.toolName,
              JSON.stringify(toolCall.args),
              toolCall.toolCallId
            )

            const observation =
              typeof toolResult.llmContent === 'string'
                ? toolResult.llmContent
                : JSON.stringify(toolResult.llmContent)

            // Emit tool result event
            this.callbacks.onToolResult?.(toolCall.toolName, observation)

            this.history.push({
              action: `${toolCall.toolName}(${JSON.stringify(toolCall.args)})`,
              observation,
              timestamp: new Date(),
            })

            // Add tool result to messages - ai SDK v4 expects array format
            messages.push({
              role: 'tool',
              content: [
                {
                  type: 'tool-result',
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  result: observation,
                },
              ],
            } as any)
          }

          // Add continuation prompt
          messages.push({
            role: 'user',
            content: 'Continue or provide FINAL ANSWER: if done.',
          })
        } else {
          // No tool calls, just add text response
          messages.push({ role: 'assistant', content: text })

          // Add continuation prompt
          messages.push({
            role: 'user',
            content: 'Continue or provide FINAL ANSWER: if done.',
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        // Log error details for debugging
        if (error instanceof Error && error.cause) {
          console.error('Error cause:', error.cause)
        }
        throw new Error(`Error in step ${step + 1}: ${message}`)
      }
    }

    return 'Task incomplete: maximum steps reached'
  }

  getHistory(): ReasoningStep[] {
    return [...this.history]
  }

  private async generateTextWithRetry(
    messages: any[]
  ): Promise<{ text: string; toolCalls: any[] }> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await generateText({
          model: this.llm,
          messages,
          tools: this.tools.toLanguageV1Tools(),
          temperature: 0.7,
        })
        return result
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries - 1
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('Failed to process successful response') ||
            error.message.includes('SocketError') ||
            error.message.includes('other side closed'))

        if (isNetworkError && !isLastAttempt) {
          // Wait before retry (exponential backoff)
          const delay = 2 ** attempt * 1000
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }
}
