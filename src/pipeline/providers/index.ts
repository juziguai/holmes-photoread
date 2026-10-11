import type { ReadConfig } from '../types'
import { createAnthropicProvider, ANTHROPIC_DEFAULT_MODEL } from './anthropic'
import { createOpenAICompatProvider, OPENAI_DEFAULT_MODEL, OPENAI_DEFAULT_BASE_URL } from './openai-compat'
import { createGeminiProvider, GEMINI_DEFAULT_MODEL } from './gemini'
import type { VisionProvider } from './types'

export type { VisionProvider, CompleteRequest, CompleteResponse, ProviderConfig } from './types'

export const PROVIDER_DEFAULTS = {
  anthropic: { model: ANTHROPIC_DEFAULT_MODEL, baseUrl: '' },
  openai: { model: OPENAI_DEFAULT_MODEL, baseUrl: OPENAI_DEFAULT_BASE_URL },
  gemini: { model: GEMINI_DEFAULT_MODEL, baseUrl: '' },
} as const

export function createProvider(config: Pick<ReadConfig, 'provider' | 'apiKey' | 'model' | 'baseUrl'>): VisionProvider {
  const cfg = { apiKey: config.apiKey, model: config.model, baseUrl: config.baseUrl }
  switch (config.provider) {
    case 'anthropic':
      return createAnthropicProvider(cfg)
    case 'openai':
      return createOpenAICompatProvider(cfg)
    case 'gemini':
      return createGeminiProvider(cfg)
  }
}
