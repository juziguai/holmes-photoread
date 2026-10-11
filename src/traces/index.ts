import { DOMAIN_SUBJECTS, REGION_LABEL, type Subject, type Trace, type Weight } from './types'
import { DESK_TRACES } from './desk'
import { DEVICE_TRACES } from './devices'
import { ROOM_TRACES } from './room'
import { PERSON_TRACES } from './person'
import { CLASSIC_TRACES } from './classics'

export type { Trace, TraceCause, Domain, Subject, Weight, Region } from './types'
export { DOMAIN_SUBJECTS, REGION_LABEL } from './types'

export const TRACES: Trace[] = [
  ...DESK_TRACES,
  ...DEVICE_TRACES,
  ...ROOM_TRACES,
  ...PERSON_TRACES,
  ...CLASSIC_TRACES,
]

export const TRACE_ID_PATTERN = /^[a-z]+\.[a-z0-9]+(?:-[a-z0-9]+)*$/

export function getTrace(id: string): Trace | undefined {
  return TRACES.find((t) => t.id === id)
}

/** 按读物/读人筛：推理段只该看见与当前主体相关的痕迹 */
export function tracesFor(subject: Subject, traces: Trace[] = TRACES): Trace[] {
  return traces.filter((t) => DOMAIN_SUBJECTS[t.domain].includes(subject))
}

const WEIGHT_LABEL: Record<Weight, { zh: string; en: string }> = {
  strong: { zh: '强', en: 'strong' },
  medium: { zh: '中', en: 'medium' },
  weak: { zh: '弱', en: 'weak' },
}

/** 把痕迹库压成 prompt 里的紧凑文本，一行一条 */
export function formatTracesForPrompt(lang: 'zh' | 'en', traces: Trace[] = TRACES): string {
  return traces
    .map((t) => {
      const causes = t.causes
        .map((c) => `${c[lang]}(${WEIGHT_LABEL[c.weight][lang]})`)
        .join(lang === 'zh' ? '；' : '; ')
      const region = t.region ? (lang === 'zh' ? `［${REGION_LABEL[t.region].zh}］` : ` [${REGION_LABEL[t.region].en}]`) : ''
      const caution = t.caution ? (lang === 'zh' ? ` 注意：${t.caution.zh}` : ` Caution: ${t.caution.en}`) : ''
      return `- ${t.id}${region} ${t[lang]} → ${causes}${caution}`
    })
    .join('\n')
}
