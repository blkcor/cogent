import type { ModelConfig, ModelInfo, Provider } from './types'
import { BUILTIN_PROVIDERS } from './providers/registry'

export interface IProviderManager {
  registerProvider(provider: Provider): void
  getProvider(providerId: string): Provider | undefined
  getAllProviders(): Provider[]
  resolveModel(modelString: string, config: ModelConfig): Promise<ModelInfo>
}

export class ProviderManager implements IProviderManager {
  private providers: Map<string, Provider>
  private pluginProviders: Map<string, Provider>

  constructor() {
    this.providers = new Map(Object.entries(BUILTIN_PROVIDERS))
    this.pluginProviders = new Map()
  }

  registerProvider(provider: Provider): void {
    this.pluginProviders.set(provider.id, provider)
  }

  getProvider(providerId: string): Provider | undefined {
    return this.pluginProviders.get(providerId) || this.providers.get(providerId)
  }

  getAllProviders(): Provider[] {
    return [
      ...Array.from(this.providers.values()),
      ...Array.from(this.pluginProviders.values()),
    ]
  }

  async resolveModel(modelString: string, config: ModelConfig): Promise<ModelInfo> {
    const { providerId, modelId } = this.parseModelString(modelString)

    const provider = this.getProvider(providerId)
    if (!provider) {
      throw new Error(
        `Provider '${providerId}' not found. Available providers: ${this.getAllProviders()
          .map((p) => p.id)
          .join(', ')}`
      )
    }

    const modelCreator = await provider.createModel(modelId, config)

    return {
      provider: {
        id: provider.id,
        name: provider.name,
        apiKeyEnvVar: provider.apiKeyEnvVar,
        baseURL: provider.baseURL,
      },
      model: {
        id: modelId,
        name: modelId,
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsFunctionCalling: true,
        supportsStreaming: true,
        supportsVision: false,
      },
      _mCreator: async () => modelCreator,
    }
  }

  private parseModelString(modelString: string): {
    providerId: string
    modelId: string
  } {
    const parts = modelString.split('/')
    if (parts.length === 1) {
      return this.inferProvider(modelString)
    }

    return {
      providerId: parts[0],
      modelId: parts.slice(1).join('/'),
    }
  }

  private inferProvider(modelId: string): { providerId: string; modelId: string } {
    for (const provider of this.getAllProviders()) {
      if (provider.models.includes(modelId)) {
        return { providerId: provider.id, modelId }
      }
    }

    if (modelId.startsWith('gpt-') || modelId.startsWith('o1-')) {
      return { providerId: 'openai', modelId }
    }

    if (modelId.startsWith('claude-')) {
      return { providerId: 'anthropic', modelId }
    }

    if (modelId.startsWith('gemini-')) {
      return { providerId: 'google', modelId }
    }

    throw new Error(
      `Cannot infer provider for model '${modelId}'. Please specify as 'provider/model'`
    )
  }
}

