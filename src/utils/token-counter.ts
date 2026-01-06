import { type Tiktoken, encodingForModel } from 'js-tiktoken'

export interface ITokenCounter {
  count(text: string): number
  canAdd(text: string): boolean
  addContent(content: string, priority: number): boolean
  reset(): void
  getCurrentUsage(): number
}

export class TokenCounter implements ITokenCounter {
  private encoding: Tiktoken
  private maxTokens: number
  private currentUsage: number
  private contents: Array<{ content: string; priority: number; tokens: number }>

  constructor(model: string, maxTokens: number) {
    try {
      this.encoding = encodingForModel(model as any)
    } catch {
      this.encoding = encodingForModel('gpt-4')
    }
    this.maxTokens = maxTokens
    this.currentUsage = 0
    this.contents = []
  }

  count(text: string): number {
    return this.encoding.encode(text).length
  }

  canAdd(text: string): boolean {
    const tokens = this.count(text)
    return this.currentUsage + tokens <= this.maxTokens
  }

  addContent(content: string, priority: number): boolean {
    const tokens = this.count(content)

    if (this.currentUsage + tokens <= this.maxTokens) {
      this.contents.push({ content, priority, tokens })
      this.currentUsage += tokens
      return true
    }

    if (this.evictLowPriorityContent(tokens)) {
      this.contents.push({ content, priority, tokens })
      this.currentUsage += tokens
      return true
    }

    return false
  }

  reset(): void {
    this.currentUsage = 0
    this.contents = []
  }

  getCurrentUsage(): number {
    return this.currentUsage
  }

  private evictLowPriorityContent(tokensNeeded: number): boolean {
    this.contents.sort((a, b) => a.priority - b.priority)

    let freedTokens = 0
    const toRemove: number[] = []

    for (let i = 0; i < this.contents.length; i++) {
      if (this.currentUsage - freedTokens + tokensNeeded <= this.maxTokens) {
        break
      }
      freedTokens += this.contents[i].tokens
      toRemove.push(i)
    }

    if (this.currentUsage - freedTokens + tokensNeeded <= this.maxTokens) {
      for (let i = toRemove.length - 1; i >= 0; i--) {
        this.contents.splice(toRemove[i], 1)
      }
      this.currentUsage -= freedTokens
      return true
    }

    return false
  }
}
