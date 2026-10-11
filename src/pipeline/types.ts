import { z } from 'zod'

export type Lang = 'zh' | 'en'
export type ProviderName = 'anthropic' | 'openai' | 'gemini'
/** 读物还是读人 */
export type { Subject } from '../traces/types'
import type { Subject } from '../traces/types'

/* ---------- 模型输出 schema（喂给结构化输出的版本要保持"朴素"：无 min/max/default） ---------- */

export const ObservationSchema = z.object({
  id: z.string(),
  what: z.string(),
  where: z.string(),
  detail: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
})

/** 金丝雀：横竖与主色调。文本模型会瞎猜，和真实尺寸一比就露馅 */
export const FrameSchema = z.object({
  orientation: z.enum(['portrait', 'landscape', 'square']),
  dominant_color: z.string(),
})

export const ObserveOutputSchema = z.object({
  frame: FrameSchema,
  observations: z.array(ObservationSchema),
})

export const DeductionSchema = z.object({
  id: z.string(),
  claim: z.string(),
  chain: z.array(z.string()),
  observation_ids: z.array(z.string()),
  trace_ids: z.array(z.string()),
  confidence: z.number(),
  alternative: z.string(),
  kind: z.enum(['safe', 'bold']),
})

export const DeduceOutputSchema = z.object({
  deductions: z.array(DeductionSchema),
  closing: z.string(),
})

export type Observation = z.infer<typeof ObservationSchema>
export type Deduction = z.infer<typeof DeductionSchema>
export type ObserveOutput = z.infer<typeof ObserveOutputSchema>
export type DeduceOutput = z.infer<typeof DeduceOutputSchema>

/* ---------- 运行时类型 ---------- */

export interface ImageInput {
  base64: string
  mime: 'image/jpeg' | 'image/png' | 'image/webp'
  /** 已知则用于金丝雀校验 */
  width?: number
  height?: number
}

export interface VisionCheck {
  /** suspect = 模型大概率没看到图 */
  verdict: 'ok' | 'suspect' | 'unknown'
  reasons: string[]
  reportedOrientation?: string
  expectedOrientation?: string
  observeInputTokens?: number
}

export interface ReadConfig {
  provider: ProviderName
  apiKey: string
  /** 不填用各服务商默认 */
  model?: string
  /** openai 兼容端点的 base url，如 https://api.openai.com/v1 */
  baseUrl?: string
  lang: Lang
  /** 读桌面还是读人；默认 desk */
  subject?: Subject
  /** 基础率提示，如"中国大陆一线城市" */
  region?: string
  /** 推理段是否也看图；默认 false，开了假观察率就测不准 */
  deduceSeesImage?: boolean
}

export interface StageUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface ReadMeta {
  provider: ProviderName
  model: string
  lang: Lang
  subject: Subject
  region?: string
  timings: { observeMs: number; deduceMs: number }
  usage: { observe?: StageUsage; deduce?: StageUsage }
  raw: { observe: string; deduce: string }
  /** 结论里引用了不存在的观察 id */
  invalidRefs: { deductionId: string; missing: string[] }[]
  visionCheck: VisionCheck
}

export interface ReadResult {
  observations: Observation[]
  deductions: Deduction[]
  closing: string
  meta: ReadMeta
}

export type ObservationGrade = 'ok' | 'wrong'
export type DeductionGrade = 'hit' | 'half' | 'miss'

export interface Grades {
  observations: Record<string, ObservationGrade>
  deductions: Record<string, DeductionGrade>
}

export type Stage = 'observing' | 'deducing'

export type ProviderErrorKind = 'auth' | 'refusal' | 'network' | 'format' | 'http' | 'unknown'

export class ProviderError extends Error {
  kind: ProviderErrorKind
  status?: number
  /** 模型原始输出（format 类错误带上，便于归档与排错） */
  raw?: string
  constructor(kind: ProviderErrorKind, message: string, status?: number, raw?: string) {
    super(message)
    this.name = 'ProviderError'
    this.kind = kind
    this.status = status
    this.raw = raw
  }
}
