import { ProviderError } from '../types'
import type { CompleteRequest, CompleteResponse, ProviderConfig, VisionProvider } from './types'

export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1'
export const OPENAI_DEFAULT_MODEL = 'gpt-5'

interface ChatCompletion {
  choices?: { message?: { content?: string | { type: string; text?: string }[] } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  model?: string
  error?: { message?: string }
}

function contentToText(c: ChatCompletion['choices']): string {
  const m = c?.[0]?.message?.content
  if (typeof m === 'string') return m
  if (Array.isArray(m)) return m.map((p) => p.text ?? '').join('')
  return ''
}

/**
 * OpenAI 兼容端点（GPT / Qwen-VL / GLM / OpenRouter / 各家中转）。
 * 第一次带 response_format 与 max_completion_tokens；遇 400 就退回最保守的参数重试一次。
 */
export function createOpenAICompatProvider(cfg: ProviderConfig): VisionProvider {
  const baseUrl = (cfg.baseUrl || OPENAI_DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = cfg.model || OPENAI_DEFAULT_MODEL

  async function call(req: CompleteRequest, conservative: boolean): Promise<Response> {
    const userParts: unknown[] = []
    if (req.image) {
      userParts.push({
        type: 'image_url',
        image_url: { url: `data:${req.image.mime};base64,${req.image.base64}` },
      })
    }
    userParts.push({ type: 'text', text: req.user })
    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: req.system },
        { role: 'user', content: userParts },
      ],
    }
    const max = req.maxTokens ?? 8000
    if (conservative) body.max_tokens = max
    else {
      body.max_completion_tokens = max
      if (req.schema) body.response_format = { type: 'json_object' }
    }
    let res: Response
    try {
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify(body),
      })
    } catch (e) {
      throw new ProviderError('network', `cannot reach ${baseUrl}: ${e instanceof Error ? e.message : String(e)}`)
    }
    return res
  }

  return {
    name: 'openai',
    model,
    async complete(req: CompleteRequest): Promise<CompleteResponse> {
      let res = await call(req, false)
      if (res.status === 400) res = await call(req, true)
      if (res.status === 401 || res.status === 403) throw new ProviderError('auth', 'API key rejected', res.status)
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new ProviderError('http', `HTTP ${res.status}: ${t.slice(0, 300)}`, res.status)
      }
      const json = (await res.json()) as ChatCompletion
      if (json.error?.message) throw new ProviderError('http', json.error.message)
      const text = contentToText(json.choices)
      if (!text) throw new ProviderError('format', 'empty completion')
      return {
        text,
        usage: { inputTokens: json.usage?.prompt_tokens, outputTokens: json.usage?.completion_tokens },
        model: json.model ?? model,
      }
    },
  }
}
