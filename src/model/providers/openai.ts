import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import type { ModelConfig } from '../types'
import { BaseProvider } from './base'

export class OpenAIProvider extends BaseProvider {
  id = 'openai'
  name = 'OpenAI'
  apiKeyEnvVar = 'OPENAI_API_KEY'
  baseURL = 'https://api.openai.com/v1'
  models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'o1-preview',
    'o1-mini',
  ]

  async createModel(
    modelId: string,
    config: ModelConfig
  ): Promise<LanguageModel> {
    this.validateConfig(config)
    const apiKey = this.getApiKey(config)

    const openai = createOpenAI({
      apiKey,
      baseURL: this.getBaseURL(config),
    })

    return openai(modelId)
  }
}
