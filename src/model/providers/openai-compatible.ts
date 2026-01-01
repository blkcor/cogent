import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import type { ModelConfig } from '../types'
import { BaseProvider } from './base'

export class OpenAICompatibleProvider extends BaseProvider {
  id: string
  name: string
  baseURL: string
  apiKeyEnvVar: string
  models: string[]

  constructor(
    id: string,
    name: string,
    baseURL: string,
    apiKeyEnvVar: string,
    models: string[] = []
  ) {
    super()
    this.id = id
    this.name = name
    this.baseURL = baseURL
    this.apiKeyEnvVar = apiKeyEnvVar
    this.models = models
  }

  async createModel(
    modelId: string,
    config: ModelConfig
  ): Promise<LanguageModel> {
    this.validateConfig(config)
    const apiKey = this.getApiKey(config)

    const client = createOpenAI({
      apiKey,
      baseURL: this.getBaseURL(config),
    })

    return client(modelId)
  }
}

