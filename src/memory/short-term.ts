import { randomUUID } from 'node:crypto'
import type { NormalizedMessage } from '../message.js'
import type { ReasoningStep } from '../reasoning/types.js'

export interface IConversationHistory {
  addMessage(message: Omit<NormalizedMessage, 'uuid' | 'timestamp'>): void
  getRecent(n: number): NormalizedMessage[]
  compress(): Promise<void>
  clear(): void
}

export class ConversationHistory implements IConversationHistory {
  private messages: NormalizedMessage[] = []
  private maxTurns: number

  constructor(maxTurns = 50) {
    this.maxTurns = maxTurns
  }

  addMessage(message: Omit<NormalizedMessage, 'uuid' | 'timestamp'>): void {
    const normalizedMessage: NormalizedMessage = {
      ...message,
      uuid: randomUUID(),
      timestamp: new Date().toISOString(),
    }

    this.messages.push(normalizedMessage)

    if (this.messages.length > this.maxTurns) {
      this.messages = this.messages.slice(-this.maxTurns)
    }
  }

  getRecent(n: number): NormalizedMessage[] {
    return this.messages.slice(-n)
  }

  async compress(): Promise<void> {
    if (this.messages.length <= this.maxTurns / 2) {
      return
    }

    const oldMessages = this.messages.slice(0, this.messages.length / 2)
    const summary = await this.summarizeMessages(oldMessages)

    this.messages = [summary, ...this.messages.slice(this.messages.length / 2)]
  }

  clear(): void {
    this.messages = []
  }

  private async summarizeMessages(messages: NormalizedMessage[]): Promise<NormalizedMessage> {
    const content = messages
      .map((m) => {
        if (typeof m.content === 'string') {
          return `${m.role}: ${m.content}`
        }
        const textContent = m.content.find((c: any) => c.type === 'text')
        return textContent && 'text' in textContent ? `${m.role}: ${textContent.text}` : ''
      })
      .filter(Boolean)
      .join('\n')

    return {
      role: 'system',
      content: [
        {
          type: 'text',
          text: `Previous conversation summary:\n${content}`,
        },
      ],
      uuid: randomUUID(),
      timestamp: new Date().toISOString(),
      parentUuid: null,
    }
  }
}

export interface IReasoningTrace {
  addStep(thought: string, action: string, observation: string): void
  getSteps(): ReasoningStep[]
  clear(): void
}

export class ReasoningTrace implements IReasoningTrace {
  private steps: ReasoningStep[] = []

  addStep(thought: string, action: string, observation: string): void {
    this.steps.push({
      thought,
      action,
      observation,
      timestamp: new Date(),
    })
  }

  getSteps(): ReasoningStep[] {
    return [...this.steps]
  }

  clear(): void {
    this.steps = []
  }
}
