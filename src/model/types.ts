import type { LanguageModel } from 'ai'

export interface ModelInfo {
  provider: ProviderInfo
  model: ModelDetails
  _mCreator: () => Promise<LanguageModel>
}

export interface ProviderInfo {
  id: string
  name: string
  apiKeyEnvVar?: string
  baseURL?: string
}

export interface ModelDetails {
  id: string
  name: string
  contextWindow: number
  maxOutputTokens: number
  supportsFunctionCalling: boolean
  supportsStreaming: boolean
  supportsVision: boolean
}

export interface Provider {
  id: string
  name: string
  apiKeyEnvVar?: string
  baseURL?: string
  models: string[]
  createModel: (modelId: string, config: ModelConfig) => Promise<LanguageModel>
}

export interface ModelConfig {
  apiKey?: string
  baseURL?: string
  temperature?: number
  maxTokens?: number
  [key: string]: any
}

export interface ProviderConfig {
  apiKey?: string
  baseURL?: string
  models?: string[]
  [key: string]: any
}
