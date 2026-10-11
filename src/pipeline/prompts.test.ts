import { describe, expect, it } from 'vitest'
import {
  PERSON_BLOCKLIST,
  SENSITIVE_BLOCKLIST,
  blocklistFor,
  buildDeducePrompt,
  buildObservePrompt,
  formatObservations,
} from './prompts'
import type { Observation } from './types'

const OBS: Observation[] = [
  { id: 'O1', what: '键帽磨亮', where: '中排', detail: '只有 WASD', confidence: 'high' },
  { id: 'O2', what: '表带晒痕', where: '左手腕', detail: '', confidence: 'medium' },
]

describe('prompts', () => {
  it('observe stage forbids inference in both languages and subjects', () => {
    for (const lang of ['zh', 'en'] as const) {
      for (const subject of ['desk', 'person'] as const) {
        const p = buildObservePrompt(lang, subject)
        expect(p.system).toContain(lang === 'zh' ? '不做任何推断' : 'never infer')
        expect(p.system).toContain('frame')
      }
    }
  })

  it('desk observe ignores people; person observe reads marks not looks', () => {
    expect(buildObservePrompt('zh', 'desk').system).toContain('当作不存在')
    const person = buildObservePrompt('zh', 'person').system
    expect(person).toContain('不是长相')
    expect(person).toContain('不记：五官形状')
    expect(buildObservePrompt('en', 'person').system).toContain('not looks')
  })

  it('person mode adds the physiognomy and identity blocks on top of the base list', () => {
    for (const lang of ['zh', 'en'] as const) {
      expect(blocklistFor(lang, 'desk')).toEqual(SENSITIVE_BLOCKLIST[lang])
      const person = blocklistFor(lang, 'person')
      for (const item of [...SENSITIVE_BLOCKLIST[lang], ...PERSON_BLOCKLIST[lang]]) {
        expect(person).toContain(item)
      }
    }
  })

  it('deduce prompt carries observations, region, blocklist and only same-subject traces', () => {
    const zh = buildDeducePrompt('zh', OBS, { subject: 'person', region: '上海' })
    expect(zh.user).toContain('O1')
    expect(zh.user).toContain('上海')
    expect(zh.system).toContain('面相骨相')
    // 读人时不该把桌面痕迹塞进参考库
    expect(zh.user).toContain('hands.')
    expect(zh.user).not.toContain('desk.keyboard-shine')

    const desk = buildDeducePrompt('zh', OBS, { subject: 'desk' })
    expect(desk.user).toContain('desk.keyboard-shine')
    expect(desk.user).not.toContain('hands.string-callus')
    expect(desk.system).not.toContain('面相骨相')
  })

  it('deduce prompt demands a bold bet and honest confidence', () => {
    for (const lang of ['zh', 'en'] as const) {
      const s = buildDeducePrompt(lang, OBS, {}).system
      expect(s).toContain('bold')
      expect(s).toContain('alternative')
    }
  })

  it('formats observations one per line with id, location and confidence', () => {
    const lines = formatObservations('zh', OBS).split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('O1')
    expect(lines[0]).toContain('中排')
    expect(lines[0]).toContain('high')
  })
})
