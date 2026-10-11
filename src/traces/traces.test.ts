import { describe, expect, it } from 'vitest'
import { TRACES, TRACE_ID_PATTERN, formatTracesForPrompt, tracesFor } from './index'
import { PERSON_TRACES } from './person'
import { DOMAIN_SUBJECTS } from './types'

describe('trace library', () => {
  it('has unique ids in 域.名字 form, matching the entry domain', () => {
    const ids = TRACES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TRACES) {
      expect(t.id).toMatch(TRACE_ID_PATTERN)
      expect(t.id.startsWith(`${t.domain}.`)).toBe(true)
    }
  })

  it('every trace is bilingual with at least one honestly weighted cause', () => {
    for (const t of TRACES) {
      expect(t.zh.trim()).not.toBe('')
      expect(t.en.trim()).not.toBe('')
      expect(t.causes.length).toBeGreaterThan(0)
      for (const c of t.causes) {
        expect(['strong', 'medium', 'weak']).toContain(c.weight)
        expect(c.zh.trim()).not.toBe('')
        expect(c.en.trim()).not.toBe('')
      }
      if (t.caution) {
        expect(t.caution.zh.trim()).not.toBe('')
        expect(t.caution.en.trim()).not.toBe('')
      }
    }
  })

  it('English fields carry no Chinese, so English prompts and references stay English', () => {
    const cjk = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/
    for (const t of TRACES) {
      const en = [t.en, ...t.causes.map((c) => c.en), t.caution?.en ?? ''].join(' ')
      expect(en, `${t.id} 的英文字段里有中文`).not.toMatch(cjk)
    }
    expect(formatTracesForPrompt('en')).not.toMatch(cjk)
  })

  it('splits into 读物 and 读人 by domain, and both sides are non-empty', () => {
    const desk = tracesFor('desk')
    const person = tracesFor('person')
    expect(desk.length).toBeGreaterThan(20)
    expect(person.length).toBeGreaterThan(20)
    for (const t of desk) expect(DOMAIN_SUBJECTS[t.domain]).toContain('desk')
    for (const t of person) expect(DOMAIN_SUBJECTS[t.domain]).toContain('person')
    // bag 两边都算，所以并集大于全库、交集非空
    expect(desk.length + person.length).toBeGreaterThan(TRACES.length)
  })

  /**
   * 这条是这个项目的分界线：人物痕迹只收"做过的事留下的痕迹"，
   * 不收长相/骨相/族裔/健康。社区 PR 加错方向的条目，这里要拦住。
   */
  it('person traces never read looks, ancestry, or health', () => {
    const banned = [
      /面相|骨相|命理|颜值/,
      /五官|脸型|鼻型|眼型|唇形/,
      /民族|种族|族裔/,
      /智力|智商|情商|性格/,
      /疾病|病史|确诊|服药|抑郁|焦虑症/,
      /physiognomy|face shape|facial feature/i,
      /\bracial\b|ethnicit|\brace of\b/i,
      /\biq\b|intelligen/i,
      /\bdiagnos|\billness\b|medication/i,
    ]
    for (const t of PERSON_TRACES) {
      const body = [t.zh, t.en, ...t.causes.flatMap((c) => [c.zh, c.en])].join(' ')
      for (const re of banned) {
        expect(body, `${t.id} 触到禁区 ${re}`).not.toMatch(re)
      }
    }
  })

  it('renders one compact line per trace for the prompt', () => {
    const zh = formatTracesForPrompt('zh')
    const en = formatTracesForPrompt('en')
    expect(zh.split('\n').length).toBe(TRACES.length)
    expect(en.split('\n').length).toBe(TRACES.length)
    expect(zh).toContain('desk.keyboard-shine')
    expect(en).toContain('(strong)')
  })
})
