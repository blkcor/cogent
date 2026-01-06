import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import type { ModelConfig } from '../types'
import { BaseProvider } from './base'

export class OpenAIProvider extends BaseProvider {
  id = 'openai'
  name = 'OpenAI'
  apiKeyEnvVar = 'OPENAI_API_KEY'
  baseURL = 'https://api.openai.com/v1'
  models = ['gpt-5.2', 'gpt-5-mini', 'gpt-5-nano']

  async createModel(modelId: string, config: ModelConfig): Promise<LanguageModel> {
    this.validateConfig(config)
    const apiKey = this.getApiKey(config)

    const openai = createOpenAI({
      apiKey,
      baseURL: this.getBaseURL(config),
    })

    return openai(modelId)
  }
}
