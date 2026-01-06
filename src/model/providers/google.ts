import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import type { ModelConfig } from '../types'
import { BaseProvider } from './base'

export class GoogleProvider extends BaseProvider {
  id = 'google'
  name = 'Google'
  apiKeyEnvVar = 'GOOGLE_GENERATIVE_AI_API_KEY'
  baseURL = 'https://generativelanguage.googleapis.com/v1beta'
  models = [
    'gemini-3-pro',
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
  ]

  async createModel(modelId: string, config: ModelConfig): Promise<LanguageModel> {
    this.validateConfig(config)
    const apiKey = this.getApiKey(config)

    const google = createGoogleGenerativeAI({
      apiKey,
    })

    return google(modelId)
  }
}
