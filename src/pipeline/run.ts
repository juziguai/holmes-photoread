import type { ZodType } from 'zod'
import {
  DeduceOutputSchema,
  ObserveOutputSchema,
  ProviderError,
  type Deduction,
  type ImageInput,
  type Observation,
  type ReadConfig,
  type ReadResult,
  type Stage,
  type StageUsage,
  type Subject,
  type VisionCheck,
} from './types'
import { buildDeducePrompt, buildObservePrompt } from './prompts'
import { extractJson } from './parse'
import { createProvider, type CompleteResponse, type VisionProvider } from './providers'

export interface ReadHooks {
  onStage?: (stage: Stage) => void
  /** 观察段一出结果就回调，让界面先把清单铺出来，别干等推理段 */
  onObserved?: (observations: Observation[], visionCheck: VisionCheck) => void
}

function parseWith<T>(schema: ZodType<T>, res: CompleteResponse): T {
  const data = res.parsed ?? safeExtract(res.text)
  const r = schema.safeParse(data)
  if (!r.success) {
    const issue = r.error.issues[0]
    throw new ProviderError('format', `model output does not match schema: ${issue?.path.join('.') ?? ''} ${issue?.message ?? ''}`, undefined, res.text)
  }
  return r.data
}

function safeExtract(text: string): unknown {
  try {
    return extractJson(text)
  } catch (e) {
    throw new ProviderError('format', e instanceof Error ? e.message : 'unparseable model output', undefined, text)
  }
}

/** 观察 id 统一为 O1..On（模型偶尔会跳号或重复） */
export function normalizeObservations(list: Observation[]): Observation[] {
  const seen = new Set<string>()
  return list
    .filter((o) => o.what.trim().length > 0)
    .map((o, i) => {
      let id = o.id.trim().toUpperCase()
      if (!/^O\d+$/.test(id) || seen.has(id)) id = `O${i + 1}`
      seen.add(id)
      return { ...o, id, where: o.where ?? '', detail: o.detail ?? '' }
    })
}

export function normalizeDeductions(
  list: Deduction[],
  observations: Observation[],
): { deductions: Deduction[]; invalidRefs: { deductionId: string; missing: string[] }[] } {
  const known = new Set(observations.map((o) => o.id))
  const invalidRefs: { deductionId: string; missing: string[] }[] = []
  const deductions = list
    .filter((d) => d.claim.trim().length > 0)
    .map((d, i) => {
      const id = /^D\d+$/.test(d.id?.trim().toUpperCase() ?? '') ? d.id.trim().toUpperCase() : `D${i + 1}`
      let confidence = Number.isFinite(d.confidence) ? d.confidence : 0.4
      if (confidence > 1 && confidence <= 100) confidence = confidence / 100
      confidence = Math.min(1, Math.max(0, confidence))
      const refs = (d.observation_ids ?? []).map((r) => r.trim().toUpperCase())
      const missing = refs.filter((r) => !known.has(r))
      if (missing.length) invalidRefs.push({ deductionId: id, missing })
      return {
        ...d,
        id,
        confidence,
        observation_ids: refs.filter((r) => known.has(r)),
        trace_ids: d.trace_ids ?? [],
        chain: d.chain?.length ? d.chain : [d.claim],
      }
    })
  return { deductions, invalidRefs }
}

/** 观察段的金丝雀：横竖与真实尺寸对不上、或输入 token 少到装不下一张图，就判 suspect */
export function checkVision(image: ImageInput, frame: { orientation: string }, usage?: StageUsage): VisionCheck {
  const reasons: string[] = []
  let expected: string | undefined
  if (image.width && image.height) {
    const r = image.width / image.height
    expected = r > 1.15 ? 'landscape' : r < 0.87 ? 'portrait' : 'square'
    if (expected !== 'square' && frame.orientation !== 'square' && frame.orientation !== expected) {
      reasons.push(`orientation: model says ${frame.orientation}, photo is ${expected}`)
    }
  }
  const tokens = usage?.inputTokens
  if (tokens !== undefined && tokens < 450) {
    reasons.push(`observe input was only ${tokens} tokens: the image was probably never sent to the model`)
  }
  const verdict: VisionCheck['verdict'] = reasons.length ? 'suspect' : expected || tokens !== undefined ? 'ok' : 'unknown'
  return { verdict, reasons, reportedOrientation: frame.orientation, expectedOrientation: expected, observeInputTokens: tokens }
}

/**
 * 两段管线：观察（看图）→ 推理（只看观察清单 + 痕迹库）。
 */
export async function readPhoto(
  image: ImageInput,
  config: ReadConfig,
  hooks: ReadHooks = {},
  provider: VisionProvider = createProvider(config),
): Promise<ReadResult> {
  const subject: Subject = config.subject ?? 'desk'
  hooks.onStage?.('observing')
  const t0 = Date.now()
  const obsPrompt = buildObservePrompt(config.lang, subject)
  const obsRes = await provider.complete({
    system: obsPrompt.system,
    user: obsPrompt.user,
    image,
    schema: ObserveOutputSchema,
    effort: 'medium',
  })
  const observed = parseWith(ObserveOutputSchema, obsRes)
  const observations = normalizeObservations(observed.observations)
  if (observations.length === 0) throw new ProviderError('format', 'no observations returned')
  const visionCheck = checkVision(image, observed.frame, obsRes.usage)
  const t1 = Date.now()
  hooks.onObserved?.(observations, visionCheck)

  hooks.onStage?.('deducing')
  const dedPrompt = buildDeducePrompt(config.lang, observations, { region: config.region, subject })
  const dedRes = await provider.complete({
    system: dedPrompt.system,
    user: dedPrompt.user,
    image: config.deduceSeesImage ? image : undefined,
    schema: DeduceOutputSchema,
    effort: 'high',
  })
  const parsed = parseWith(DeduceOutputSchema, dedRes)
  const { deductions, invalidRefs } = normalizeDeductions(parsed.deductions, observations)
  const t2 = Date.now()

  return {
    observations,
    deductions,
    closing: parsed.closing?.trim() || (config.lang === 'zh' ? '总会有点什么没料到。哪条错了？' : "There's always something. Which one did I get wrong?"),
    meta: {
      provider: provider.name,
      model: dedRes.model || provider.model,
      lang: config.lang,
      subject,
      region: config.region,
      timings: { observeMs: t1 - t0, deduceMs: t2 - t1 },
      usage: { observe: obsRes.usage, deduce: dedRes.usage },
      raw: { observe: obsRes.text, deduce: dedRes.text },
      invalidRefs,
      visionCheck,
    },
  }
}
