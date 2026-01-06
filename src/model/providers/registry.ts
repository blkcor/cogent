import type { Provider } from '../types'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'
import { OpenAIProvider } from './openai'
import { OpenAICompatibleProvider } from './openai-compatible'

export const BUILTIN_PROVIDERS: Record<string, Provider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  google: new GoogleProvider(),

  // OpenAI-Compatible Providers
  deepseek: new OpenAICompatibleProvider(
    'deepseek',
    'DeepSeek',
    'https://api.deepseek.com/v1',
    'DEEPSEEK_API_KEY',
    ['deepseek-chat', 'deepseek-coder']
  ),

  openrouter: new OpenAICompatibleProvider(
    'openrouter',
    'OpenRouter',
    'https://openrouter.ai/api/v1',
    'OPENROUTER_API_KEY'
  ),

  moonshot: new OpenAICompatibleProvider(
    'moonshot',
    'Moonshot/Kimi',
    'https://api.moonshot.cn/v1',
    'MOONSHOT_API_KEY',
    ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  ),

  zhipu: new OpenAICompatibleProvider(
    'zhipu',
    'Zhipu AI',
    'https://open.bigmodel.cn/api/paas/v4',
    'ZHIPU_API_KEY',
    ['glm-4.7', 'glm-4.5-air']
  ),

  xai: new OpenAICompatibleProvider('xai', 'xAI', 'https://api.x.ai/v1', 'XAI_API_KEY', [
    'grok-beta',
    'grok-vision-beta',
  ]),

  cerebras: new OpenAICompatibleProvider(
    'cerebras',
    'Cerebras',
    'https://api.cerebras.ai/v1',
    'CEREBRAS_API_KEY',
    ['llama-3.3-70b', 'llama-3.1-8b']
  ),

  siliconflow: new OpenAICompatibleProvider(
    'siliconflow',
    'SiliconFlow',
    'https://api.siliconflow.cn/v1',
    'SILICONFLOW_API_KEY'
  ),

  aihubmix: new OpenAICompatibleProvider(
    'aihubmix',
    'AIHubMix',
    'https://aihubmix.com/v1',
    'AIHUBMIX_API_KEY'
  ),
}

export function createDefaultProviders(): Provider[] {
  return Object.values(BUILTIN_PROVIDERS)
}
