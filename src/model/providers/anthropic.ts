import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'
import type { ModelConfig } from '../types'
import { BaseProvider } from './base'

export class AnthropicProvider extends BaseProvider {
  id = 'anthropic'
  name = 'Anthropic'
  apiKeyEnvVar = 'ANTHROPIC_API_KEY'
  baseURL = 'https://api.anthropic.com/v1'
  models = ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101']

  async createModel(modelId: string, config: ModelConfig): Promise<LanguageModel> {
    this.validateConfig(config)
    const apiKey = this.getApiKey(config)

    const anthropic = createAnthropic({
      apiKey,
      baseURL: this.getBaseURL(config),
    })

    return anthropic(modelId)
  }
}
