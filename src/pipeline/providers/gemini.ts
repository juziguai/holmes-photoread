import { ProviderError } from '../types'
import type { CompleteRequest, CompleteResponse, ProviderConfig, VisionProvider } from './types'

export const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
export const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

export function createGeminiProvider(cfg: ProviderConfig): VisionProvider {
  const baseUrl = (cfg.baseUrl || GEMINI_DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = cfg.model || GEMINI_DEFAULT_MODEL

  return {
    name: 'gemini',
    model,
    async complete(req: CompleteRequest): Promise<CompleteResponse> {
      const parts: unknown[] = []
      if (req.image) parts.push({ inlineData: { mimeType: req.image.mime, data: req.image.base64 } })
      parts.push({ text: req.user })
      const body = {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: req.maxTokens ?? 8000,
          ...(req.schema ? { responseMimeType: 'application/json' } : {}),
        },
      }
      let res: Response
      try {
        res = await fetch(`${baseUrl}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey },
          body: JSON.stringify(body),
        })
      } catch (e) {
        throw new ProviderError('network', `cannot reach Gemini API: ${e instanceof Error ? e.message : String(e)}`)
      }
      if (res.status === 401 || res.status === 403) throw new ProviderError('auth', 'Gemini API key rejected', res.status)
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new ProviderError('http', `HTTP ${res.status}: ${t.slice(0, 300)}`, res.status)
      }
      const json = (await res.json()) as GenerateContentResponse
      if (json.error?.message) throw new ProviderError('http', json.error.message)
      if (json.promptFeedback?.blockReason) throw new ProviderError('refusal', `blocked: ${json.promptFeedback.blockReason}`)
      const cand = json.candidates?.[0]
      const text = cand?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
      if (!text) throw new ProviderError('format', `empty response (finishReason=${cand?.finishReason ?? 'n/a'})`)
      return {
        text,
        usage: {
          inputTokens: json.usageMetadata?.promptTokenCount,
          outputTokens: json.usageMetadata?.candidatesTokenCount,
        },
        model,
      }
    },
  }
}
