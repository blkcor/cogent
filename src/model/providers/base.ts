import type { LanguageModel } from 'ai'
import type { ModelConfig, Provider } from '../types'

export abstract class BaseProvider implements Provider {
  abstract id: string
  abstract name: string
  abstract apiKeyEnvVar?: string
  abstract baseURL?: string
  abstract models: string[]

  abstract createModel(modelId: string, config: ModelConfig): Promise<LanguageModel>

  protected getApiKey(config: ModelConfig): string {
    const apiKey = config.apiKey || (this.apiKeyEnvVar && process.env[this.apiKeyEnvVar])

    if (!apiKey) {
      throw new Error(
        `API key not found for provider '${this.name}'. ` +
          `Please set ${this.apiKeyEnvVar || 'apiKey in config'}`
      )
    }

    return apiKey
  }

  protected validateConfig(config: ModelConfig): void {
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2')
      }
    }
  }

  protected getBaseURL(config: ModelConfig): string {
    return config.baseURL || this.baseURL || ''
  }
}

