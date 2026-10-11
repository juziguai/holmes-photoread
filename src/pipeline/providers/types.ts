import type { ZodTypeAny } from 'zod'
import type { ImageInput, ProviderName, StageUsage } from '../types'

export interface CompleteRequest {
  system: string
  user: string
  image?: ImageInput
  /** 期望 JSON 输出；支持结构化输出的服务商会强制 schema */
  schema?: ZodTypeAny
  maxTokens?: number
  effort?: 'low' | 'medium' | 'high'
}

export interface CompleteResponse {
  text: string
  /** 服务商侧已按 schema 解析好的对象（有则优先） */
  parsed?: unknown
  usage?: StageUsage
  model: string
}

export interface VisionProvider {
  name: ProviderName
  model: string
  complete(req: CompleteRequest): Promise<CompleteResponse>
}

export interface ProviderConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}
