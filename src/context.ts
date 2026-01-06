import type { Config } from './config'
import type { IProviderManager } from './model/provider-manager'
import { BackupSystem } from './utils/backup'

export enum ContextPriority {
  CRITICAL = 100,
  HIGH = 80,
  MEDIUM = 60,
  LOW = 40,
  VERY_LOW = 20,
}

export interface ContextItem {
  content: string
  priority: ContextPriority
  timestamp: Date
  tokens: number
}

export interface IContext {
  cwd: string
  config: Config
  providerManager: IProviderManager
  backupSystem: BackupSystem
}

export interface ContextOpts {
  cwd: string
  config: Config
  providerManager: IProviderManager
}

export class Context implements IContext {
  cwd: string
  config: Config
  providerManager: IProviderManager
  backupSystem: BackupSystem

  constructor(opts: ContextOpts) {
    this.cwd = opts.cwd
    this.config = opts.config
    this.providerManager = opts.providerManager
    this.backupSystem = new BackupSystem(opts.cwd)
  }

  static async create(opts: Omit<ContextOpts, 'config'> & { config?: Config }): Promise<Context> {
    const { ConfigManager } = await import('./config')
    const configManager = new ConfigManager()
    const config = opts.config || (await configManager.load())

    return new Context({
      ...opts,
      config,
    })
  }
}

export class ContextManager {
  private items: ContextItem[]
  private maxTokens: number

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens
    this.items = []
  }

  addItem(content: string, priority: ContextPriority): boolean {
    const tokens = this.estimateTokens(content)

    if (this.getCurrentTokens() + tokens <= this.maxTokens) {
      this.items.push({
        content,
        priority,
        timestamp: new Date(),
        tokens,
      })
      return true
    }

    return this.evictAndAdd(content, priority, tokens)
  }

  getContext(): string {
    return this.items.map((item) => item.content).join('\n\n')
  }

  async compress(): Promise<void> {
    this.items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

    const targetTokens = Math.floor(this.maxTokens * 0.7)
    let currentTokens = 0
    const keptItems: ContextItem[] = []

    for (const item of this.items) {
      if (currentTokens + item.tokens <= targetTokens) {
        keptItems.push(item)
        currentTokens += item.tokens
      }
    }

    this.items = keptItems
  }

  clear(): void {
    this.items = []
  }

  private getCurrentTokens(): number {
    return this.items.reduce((sum, item) => sum + item.tokens, 0)
  }

  private evictAndAdd(content: string, priority: ContextPriority, tokens: number): boolean {
    this.items.sort((a, b) => a.priority - b.priority)

    let freedTokens = 0
    const toRemove: number[] = []

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority < priority) {
        freedTokens += this.items[i].tokens
        toRemove.push(i)

        if (this.getCurrentTokens() - freedTokens + tokens <= this.maxTokens) {
          break
        }
      }
    }

    if (this.getCurrentTokens() - freedTokens + tokens <= this.maxTokens) {
      for (let i = toRemove.length - 1; i >= 0; i--) {
        this.items.splice(toRemove[i], 1)
      }

      this.items.push({
        content,
        priority,
        timestamp: new Date(),
        tokens,
      })

      return true
    }

    return false
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}
