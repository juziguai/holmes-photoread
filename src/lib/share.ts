import type { Deduction, DeductionGrade, Grades, Lang, ReadResult } from '../pipeline/types'
import { T } from './i18n'

export interface ScoreSummary {
  hits: number
  halves: number
  misses: number
  graded: number
  total: number
  falseObs: number
  obsGraded: number
  obsTotal: number
  /** (中 + 0.5×半中) / 已打分结论数 */
  hitRate: number | null
}

export function summarize(result: ReadResult, grades: Grades): ScoreSummary {
  let hits = 0
  let halves = 0
  let misses = 0
  for (const d of result.deductions) {
    const g = grades.deductions[d.id]
    if (g === 'hit') hits++
    else if (g === 'half') halves++
    else if (g === 'miss') misses++
  }
  const graded = hits + halves + misses
  let falseObs = 0
  let obsGraded = 0
  for (const o of result.observations) {
    const g = grades.observations[o.id]
    if (g === 'wrong') falseObs++
    if (g) obsGraded++
  }
  return {
    hits,
    halves,
    misses,
    graded,
    total: result.deductions.length,
    falseObs,
    obsGraded,
    obsTotal: result.observations.length,
    hitRate: graded ? (hits + 0.5 * halves) / graded : null,
  }
}

const GRADE_MARK: Record<DeductionGrade, string> = { hit: '✅', half: '🌓', miss: '❌' }

/**
 * 分享卡挑结论：先打了分的（中 > 半中 > 不中），再 bold，再按把握。
 * 但只要有一条被判「不中」，就一定给它留一个位置——被说错的那条才是最值得发出去的。
 */
export function pickForShare(result: ReadResult, grades: Grades, n = 5): Deduction[] {
  const rank = (d: Deduction) => {
    const g = grades.deductions[d.id]
    const gScore = g === 'hit' ? 3 : g === 'half' ? 2 : g === 'miss' ? 1 : 0
    return gScore * 10 + (d.kind === 'bold' ? 5 : 0) + d.confidence
  }
  const sorted = [...result.deductions].sort((a, b) => rank(b) - rank(a))
  const picked = sorted.slice(0, n)
  if (picked.length < n) return picked

  const misses = sorted.filter((d) => grades.deductions[d.id] === 'miss')
  if (misses.length === 0 || picked.some((d) => grades.deductions[d.id] === 'miss')) return picked
  // 挤掉排名最末的一条，把最有把握却翻车的那条换进来
  return [...picked.slice(0, n - 1), misses[0]]
}

export function buildShareText(result: ReadResult, grades: Grades, lang: Lang, url: string): string {
  const t = T[lang]
  const s = summarize(result, grades)
  const title = result.meta.subject === 'person' ? t.shareTitle : t.shareTitleDesk
  const lines = pickForShare(result, grades).map((d) => {
    const g = grades.deductions[d.id]
    const mark = g ? GRADE_MARK[g] : '◻️'
    const bold = d.kind === 'bold' ? (lang === 'zh' ? '【押注】' : '[bet] ') : ''
    return `${mark} ${bold}${d.claim}`
  })
  const score =
    s.graded > 0
      ? `${t.score} ${s.hits}+${s.halves}/${s.graded} · ${t.hitRate} ${Math.round((s.hitRate ?? 0) * 100)}% · ${t.falseObs} ${s.falseObs}/${s.obsTotal}`
      : ''
  return [`🔍 ${title}`, ...lines, score, `「${result.closing}」`, `${t.shareFooter} ${url}`]
    .filter(Boolean)
    .join('\n')
}
