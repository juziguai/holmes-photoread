import { describe, expect, it } from 'vitest'
import { buildShareText, pickForShare, summarize } from './share'
import type { Deduction, Grades, ReadResult } from '../pipeline/types'

function ded(id: string, confidence: number, kind: Deduction['kind'] = 'safe'): Deduction {
  return {
    id,
    claim: `claim ${id}`,
    chain: ['because', 'therefore'],
    observation_ids: ['O1'],
    trace_ids: [],
    confidence,
    alternative: 'or not',
    kind,
  }
}

const RESULT: ReadResult = {
  observations: Array.from({ length: 6 }, (_, i) => ({
    id: `O${i + 1}`,
    what: `thing ${i + 1}`,
    where: 'here',
    detail: '',
    confidence: 'high' as const,
  })),
  deductions: [
    ded('D1', 0.7),
    ded('D2', 0.65),
    ded('D3', 0.6),
    ded('D4', 0.55, 'bold'),
    ded('D5', 0.5),
    ded('D6', 0.45),
  ],
  closing: '哪条错了？',
  meta: {
    provider: 'anthropic',
    model: 'm',
    lang: 'zh',
    subject: 'desk',
    timings: { observeMs: 1, deduceMs: 1 },
    usage: {},
    raw: { observe: '', deduce: '' },
    invalidRefs: [],
    visionCheck: { verdict: 'ok', reasons: [] },
  },
}

describe('scoring and share', () => {
  it('counts half a point for 半中 and reports the false-observation rate separately', () => {
    const grades: Grades = {
      deductions: { D1: 'hit', D2: 'hit', D3: 'half', D4: 'miss' },
      observations: { O1: 'wrong', O2: 'ok' },
    }
    const s = summarize(RESULT, grades)
    expect(s).toMatchObject({ hits: 2, halves: 1, misses: 1, graded: 4, total: 6, falseObs: 1, obsTotal: 6 })
    expect(s.hitRate).toBeCloseTo(2.5 / 4)
  })

  it('leaves the hit rate null before anything is graded', () => {
    expect(summarize(RESULT, { deductions: {}, observations: {} }).hitRate).toBeNull()
  })

  it('always keeps one miss on the share card — the wrong one is the point', () => {
    const grades: Grades = {
      deductions: { D1: 'hit', D2: 'hit', D3: 'hit', D4: 'hit', D5: 'hit', D6: 'miss' },
      observations: {},
    }
    const picked = pickForShare(RESULT, grades, 5)
    expect(picked).toHaveLength(5)
    expect(picked.map((d) => d.id)).toContain('D6')
  })

  it('does not fabricate a miss when there is none', () => {
    const grades: Grades = { deductions: { D1: 'hit', D2: 'half' }, observations: {} }
    const picked = pickForShare(RESULT, grades, 5)
    expect(picked.every((d) => grades.deductions[d.id] !== 'miss')).toBe(true)
  })

  it('share text carries grades, both rates, the closing line and the url', () => {
    const grades: Grades = { deductions: { D1: 'hit', D2: 'miss' }, observations: { O3: 'wrong' } }
    const text = buildShareText(RESULT, grades, 'zh', 'https://holmes.example/')
    expect(text).toContain('✅')
    expect(text).toContain('❌')
    expect(text).toContain('假观察 1/6')
    expect(text).toContain('哪条错了？')
    expect(text).toContain('https://holmes.example/')
  })
})

describe('分享卡断行禁则', () => {
  it('句号与右引号不落在行首', async () => {
    const { __testWrap } = await import('./shareImage')
    const ctx = { measureText: (t: string) => ({ width: t.length * 10 }) } as unknown as CanvasRenderingContext2D
    // 宽度刚好让「。」被挤到下一行
    const lines = __testWrap(ctx, '你左边那块屏上正开着我。哪条错了，正好拿去点「不中」。', 130)
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines.slice(1)) {
      expect('。，、；：？！）」』】》〉'.includes(l[0])).toBe(false)
    }
    expect(lines.at(-1)!.endsWith('。')).toBe(true)
  })
})
