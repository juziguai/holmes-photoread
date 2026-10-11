import { describe, expect, it } from 'vitest'
import { checkVision, normalizeDeductions, normalizeObservations, readPhoto } from './run'
import type { CompleteRequest, VisionProvider } from './providers'
import type { ImageInput, ReadConfig } from './types'

const image: ImageInput = { base64: 'AAAA', mime: 'image/jpeg' }
const config: ReadConfig = { provider: 'openai', apiKey: 'k', lang: 'zh' }

function fakeProvider(observeText: string, deduceText: string): { provider: VisionProvider; calls: CompleteRequest[] } {
  const calls: CompleteRequest[] = []
  const provider: VisionProvider = {
    name: 'openai',
    model: 'fake',
    async complete(req) {
      calls.push(req)
      return { text: calls.length === 1 ? observeText : deduceText, model: 'fake' }
    },
  }
  return { provider, calls }
}

describe('normalizeObservations', () => {
  it('renumbers bad or duplicate ids sequentially and drops empties', () => {
    const out = normalizeObservations([
      { id: 'o1', what: 'a', where: '', detail: '', confidence: 'high' },
      { id: 'O1', what: 'b', where: '', detail: '', confidence: 'low' },
      { id: 'x', what: '', where: '', detail: '', confidence: 'low' },
      { id: '7', what: 'c', where: '', detail: '', confidence: 'medium' },
    ])
    expect(out.map((o) => o.id)).toEqual(['O1', 'O2', 'O3'])
  })
})

describe('normalizeDeductions', () => {
  it('clamps confidence, keeps valid refs, reports invalid ones', () => {
    const observations = normalizeObservations([{ id: 'O1', what: 'a', where: '', detail: '', confidence: 'high' }])
    const { deductions, invalidRefs } = normalizeDeductions(
      [
        { id: 'D1', claim: 'x', chain: [], observation_ids: ['o1', 'O9'], trace_ids: [], confidence: 70, alternative: '', kind: 'safe' },
      ],
      observations,
    )
    expect(deductions[0].confidence).toBe(0.7)
    expect(deductions[0].observation_ids).toEqual(['O1'])
    expect(deductions[0].chain).toEqual(['x'])
    expect(invalidRefs).toEqual([{ deductionId: 'D1', missing: ['O9'] }])
  })
})

describe('checkVision', () => {
  it('flags an orientation mismatch or a token count too small to hold an image', () => {
    const landscape: ImageInput = { ...image, width: 1400, height: 1000 }
    expect(checkVision(landscape, { orientation: 'portrait' }, { inputTokens: 2000 }).verdict).toBe('suspect')
    expect(checkVision(landscape, { orientation: 'landscape' }, { inputTokens: 322 }).verdict).toBe('suspect')
    expect(checkVision(landscape, { orientation: 'landscape' }, { inputTokens: 2000 }).verdict).toBe('ok')
    expect(checkVision(landscape, { orientation: 'square' }, { inputTokens: 2000 }).verdict).toBe('ok')
    expect(checkVision(image, { orientation: 'portrait' }).verdict).toBe('unknown')
  })
})

describe('readPhoto', () => {
  it('runs two stages, parses fenced JSON, and keeps the image out of the deduce stage', async () => {
    const { provider, calls } = fakeProvider(
      '```json\n{"frame":{"orientation":"landscape","dominant_color":"wood"},"observations":[{"id":"O1","what":"键盘","where":"中","detail":"WASD 油光","confidence":"high"}]}\n```',
      '{"deductions":[{"id":"D1","claim":"你打游戏","chain":["O1 WASD 油光，所以常打游戏"],"observation_ids":["O1"],"trace_ids":["desk.keyboard-shine"],"confidence":0.6,"alternative":"用键盘写代码","kind":"safe"}],"closing":"哪条错了？"}',
    )
    const stages: string[] = []
    const r = await readPhoto(image, config, { onStage: (s) => stages.push(s) }, provider)
    expect(stages).toEqual(['observing', 'deducing'])
    expect(calls[0].image).toBeDefined()
    expect(calls[1].image).toBeUndefined()
    expect(calls[1].user).toContain('O1')
    expect(r.deductions[0].claim).toBe('你打游戏')
    expect(r.meta.invalidRefs).toEqual([])
    expect(r.closing).toBe('哪条错了？')
  })
  it('fails loudly when the model returns no JSON', async () => {
    const { provider } = fakeProvider('I cannot see anything.', '')
    await expect(readPhoto(image, config, {}, provider)).rejects.toThrow()
  })
})
