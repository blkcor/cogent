import fs from 'node:fs/promises'
import path from 'node:path'
import { fileExists } from './utils/file-utils'
import type { ProviderConfig } from './model/types'

export enum ApprovalMode {
  STRICT = 'strict',
  DEFAULT = 'default',
  AUTO_EDIT = 'auto_edit',
  YOLO = 'yolo',
}

export enum ReasoningMode {
  REACT = 'react',
  PLAN_SOLVE = 'plan_solve',
  REFLECTION = 'reflection',
}

export interface Config {
  model: string
  planModel?: string
  smallModel?: string
  visionModel?: string

  providers?: Record<string, ProviderConfig>

  reasoning: {
    defaultMode: ReasoningMode
    maxSteps: number
    enableReflection: boolean
  }

  memory: {
    enableLongTerm: boolean
    vectorDb: 'lancedb' | 'chromadb'
    episodicMemorySize: number
    semanticMemorySize: number
  }

  security: {
    approvalMode: ApprovalMode
    sandboxEnabled: boolean
    allowedCommands: string[]
    bannedCommands: string[]
  }

  context: {
    maxTokens: number
    ignorePatterns: string[]
  }

  ui: {
    streaming: boolean
    showReasoning: boolean
    colorScheme: 'dark' | 'light'
  }
}

const DEFAULT_CONFIG: Config = {
  model: 'anthropic/claude-3-5-sonnet-20241022',
  smallModel: 'openai/gpt-4o-mini',
  planModel: 'anthropic/claude-3-5-sonnet-20241022',

  reasoning: {
    defaultMode: ReasoningMode.REACT,
    maxSteps: 30,
    enableReflection: false,
  },

  memory: {
    enableLongTerm: true,
    vectorDb: 'lancedb',
    episodicMemorySize: 100,
    semanticMemorySize: 500,
  },

  security: {
    approvalMode: ApprovalMode.DEFAULT,
    sandboxEnabled: true,
    allowedCommands: [],
    bannedCommands: ['rm -rf /', 'format', 'mkfs'],
  },

  context: {
    maxTokens: 200000,
    ignorePatterns: ['node_modules', '.git', 'dist', 'build', '*.min.js'],
  },

  ui: {
    streaming: true,
    showReasoning: true,
    colorScheme: 'dark',
  },
}

export interface IConfigManager {
  load(): Promise<Config>
  save(config: Partial<Config>): Promise<void>
  get<K extends keyof Config>(key: K): Config[K]
  set<K extends keyof Config>(key: K, value: Config[K]): void
}

export class ConfigManager implements IConfigManager {
  private config: Config
  private configPath: string

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), '.cogent.json')
    this.config = DEFAULT_CONFIG
  }

  async load(): Promise<Config> {
    try {
      if (await fileExists(this.configPath)) {
        const content = await fs.readFile(this.configPath, 'utf-8')
        const userConfig = JSON.parse(content)
        this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig)
      } else {
        this.config = DEFAULT_CONFIG
      }

      this.applyEnvironmentOverrides()

      return this.config
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to load config: ${message}. Using defaults.`)
      return DEFAULT_CONFIG
    }
  }

  async save(config: Partial<Config>): Promise<void> {
    this.config = this.mergeConfig(this.config, config)
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key]
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value
  }

  private mergeConfig(base: Config, overrides: Partial<Config>): Config {
    return {
      ...base,
      ...overrides,
      reasoning: { ...base.reasoning, ...overrides.reasoning },
      memory: { ...base.memory, ...overrides.memory },
      security: { ...base.security, ...overrides.security },
      context: { ...base.context, ...overrides.context },
      ui: { ...base.ui, ...overrides.ui },
    }
  }

  private applyEnvironmentOverrides(): void {
    if (process.env.COGENT_MODEL) {
      this.config.model = process.env.COGENT_MODEL
    }

    if (process.env.COGENT_REASONING_MODE) {
      this.config.reasoning.defaultMode = process.env.COGENT_REASONING_MODE as ReasoningMode
    }

    if (process.env.COGENT_APPROVAL_MODE) {
      this.config.security.approvalMode = process.env.COGENT_APPROVAL_MODE as ApprovalMode
    }

    if (process.env.COGENT_ENABLE_LONG_TERM_MEMORY) {
      this.config.memory.enableLongTerm = process.env.COGENT_ENABLE_LONG_TERM_MEMORY === 'true'
    }
  }
}

