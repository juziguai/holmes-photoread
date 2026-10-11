import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { ProviderError } from '../types'
import type { CompleteRequest, CompleteResponse, ProviderConfig, VisionProvider } from './types'

export const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-5'

function textOf(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

function assertNotRefused(msg: Anthropic.Message): void {
  if (msg.stop_reason === 'refusal') {
    const why = msg.stop_details?.explanation ?? 'the model declined this request'
    throw new ProviderError('refusal', why)
  }
  if (msg.stop_reason === 'max_tokens') {
    throw new ProviderError('format', 'output truncated at max_tokens')
  }
}

function mapError(e: unknown): ProviderError {
  if (e instanceof ProviderError) return e
  if (e instanceof Anthropic.AuthenticationError) return new ProviderError('auth', 'invalid Anthropic API key', e.status)
  if (e instanceof Anthropic.RateLimitError) return new ProviderError('http', 'rate limited, retry later', e.status)
  if (e instanceof Anthropic.APIConnectionError) return new ProviderError('network', `cannot reach Anthropic API: ${e.message}`)
  if (e instanceof Anthropic.APIError) return new ProviderError('http', `Anthropic API error ${e.status}: ${e.message}`, e.status)
  return new ProviderError('unknown', e instanceof Error ? e.message : String(e))
}

export function createAnthropicProvider(cfg: ProviderConfig): VisionProvider {
  const client = new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl || undefined,
    // 纯前端 BYO Key：用户的 key 只在用户自己的浏览器里
    dangerouslyAllowBrowser: true,
  })
  const model = cfg.model || ANTHROPIC_DEFAULT_MODEL

  return {
    name: 'anthropic',
    model,
    async complete(req: CompleteRequest): Promise<CompleteResponse> {
      const content: Anthropic.ContentBlockParam[] = []
      if (req.image) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: req.image.mime, data: req.image.base64 },
        })
      }
      content.push({ type: 'text', text: req.user })

      const params = {
        model,
        max_tokens: req.maxTokens ?? 16000,
        system: req.system,
        messages: [{ role: 'user' as const, content }],
      }
      const effort = req.effort ?? 'high'

      try {
        if (req.schema) {
          const res = await client.messages.parse({
            ...params,
            output_config: { effort, format: zodOutputFormat(req.schema) },
          })
          assertNotRefused(res)
          return {
            text: textOf(res),
            parsed: res.parsed_output ?? undefined,
            usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
            model: res.model,
          }
        }
        const res = await client.messages.create({ ...params, output_config: { effort } })
        assertNotRefused(res)
        return {
          text: textOf(res),
          usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
          model: res.model,
        }
      } catch (e) {
        throw mapError(e)
      }
    },
  }
}
