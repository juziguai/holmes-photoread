import type { DeductionGrade, Grades, Lang, ReadResult } from '../pipeline/types'
import { T } from './i18n'
import { pickForShare, summarize } from './share'

/* 分享卡：画成 PNG 才有人会发。1080 宽，高度按内容长出来 */

const W = 1080
const PAD = 76
const SERIF = '"Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", "Noto Serif CJK SC", serif'
const SANS = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace'

const PAPER = '#f6f1e6'
const INK = '#1a1714'
const INK2 = '#554d43'
const MUTED = '#9c9185'
const LINE = '#d3c8b4'
const TONE: Record<DeductionGrade, string> = { hit: '#2f6b3a', half: '#8a5a08', miss: '#a32020' }
const MARK: Record<DeductionGrade, string> = { hit: '✓', half: '~', miss: '✗' }

/** CJK 逐字断行，拉丁按词断行 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  const isCjk = (c: string) => /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]/.test(c)
  const tokens: string[] = []
  let buf = ''
  for (const ch of text) {
    if (isCjk(ch) || ch === ' ') {
      if (buf) tokens.push(buf), (buf = '')
      tokens.push(ch)
    } else buf += ch
  }
  if (buf) tokens.push(buf)
  for (const tk of tokens) {
    const next = line + tk
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line.trimEnd())
      line = tk === ' ' ? '' : tk
    } else line = next
  }
  if (line.trim()) lines.push(line.trimEnd())
  return applyKinsoku(lines)
}

/** 中文禁则：句读、右括号、右引号不能落在行首，回拉到上一行末尾 */
const NO_LINE_START = '\u3002\uff0c\u3001\uff1b\uff1a\uff1f\uff01\uff09\u300d\u300f\u3011\u300b\u3009\u2026\u00b7.,;:?!)]}'

function applyKinsoku(lines: string[]): string[] {
  const out = [...lines]
  for (let i = 1; i < out.length; i++) {
    while (out[i].length > 0 && NO_LINE_START.includes(out[i][0])) {
      out[i - 1] += out[i][0]
      out[i] = out[i].slice(1)
    }
  }
  return out.filter((l) => l.length > 0)
}

interface Op {
  h: number
  draw: (ctx: CanvasRenderingContext2D, y: number) => void
}

export interface ShareCardInput {
  result: ReadResult
  grades: Grades
  lang: Lang
  url: string
  caseNo: string
}

export function renderShareCard(canvas: HTMLCanvasElement, input: ShareCardInput): void {
  const { result, grades, lang, url, caseNo } = input
  const t = T[lang]
  const s = summarize(result, grades)
  const picks = pickForShare(result, grades, 5)
  const inner = W - PAD * 2

  const measure = document.createElement('canvas').getContext('2d')!
  const ops: Op[] = []

  const rule = (gap = 28) =>
    ops.push({
      h: gap,
      draw: (ctx, y) => {
        ctx.strokeStyle = LINE
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(PAD, y + gap / 2)
        ctx.lineTo(W - PAD, y + gap / 2)
        ctx.stroke()
      },
    })

  const text = (
    content: string,
    font: string,
    color: string,
    lineHeight: number,
    opts: { indent?: number; after?: number } = {},
  ) => {
    measure.font = font
    const indent = opts.indent ?? 0
    const lines = wrap(measure, content, inner - indent)
    ops.push({
      h: lines.length * lineHeight + (opts.after ?? 0),
      draw: (ctx, y) => {
        ctx.font = font
        ctx.fillStyle = color
        ctx.textBaseline = 'alphabetic'
        lines.forEach((l, i) => ctx.fillText(l, PAD + indent, y + lineHeight * (i + 0.78)))
      },
    })
  }

  const gap = (h: number) => ops.push({ h, draw: () => {} })

  // 抬头
  text(`${t.title} · ${t.caseNo} No.${caseNo}`, `28px ${SANS}`, MUTED, 38, { after: 10 })
  text(
    result.meta.subject === 'person' ? t.shareTitle : t.shareTitleDesk,
    `600 62px ${SERIF}`,
    INK,
    78,
    { after: 6 },
  )
  rule(36)

  // 结论
  for (const d of picks) {
    const g = grades.deductions[d.id]
    const color = g ? TONE[g] : INK
    const mark = g ? MARK[g] : '·'
    const bet = d.kind === 'bold' ? (lang === 'zh' ? '【押注】' : '[bet] ') : ''
    ops.push({
      h: 0,
      draw: (ctx, y) => {
        ctx.font = `600 40px ${SERIF}`
        ctx.fillStyle = color
        ctx.fillText(mark, PAD, y + 38)
      },
    })
    text(bet + d.claim, `40px ${SERIF}`, color, 54, { indent: 56, after: 26 })
  }

  rule(36)

  // 分数
  const scoreBits: string[] = []
  if (s.graded) scoreBits.push(`${t.score} ${s.hits}${s.halves ? `+${s.halves}` : ''}/${s.graded}`)
  if (s.hitRate !== null) scoreBits.push(`${t.hitRate} ${Math.round(s.hitRate * 100)}%`)
  scoreBits.push(`${t.falseObs} ${s.falseObs}/${s.obsTotal}`)
  text(scoreBits.join('   ·   '), `30px ${MONO}`, INK2, 44, { after: 18 })

  // 结案陈词
  text(`「${result.closing}」`, `italic 34px ${SERIF}`, INK2, 48, { after: 24 })

  gap(10)
  rule(30)
  text(`${t.shareFooter} · ${url.replace(/^https?:\/\//, '')}`, `28px ${SANS}`, MUTED, 40)

  const contentH = ops.reduce((sum, o) => sum + o.h, 0)
  const H = Math.max(1080, Math.round(contentH + PAD * 2))

  const dpr = 1
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // 纸底 + 斜纹
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 96, 60, 0.05)'
  ctx.lineWidth = 1
  for (let x = -H; x < W; x += 6) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + H, H)
    ctx.stroke()
  }
  ctx.restore()

  // 边框
  ctx.strokeStyle = LINE
  ctx.lineWidth = 3
  ctx.strokeRect(26, 26, W - 52, H - 52)

  let y = PAD
  for (const op of ops) {
    op.draw(ctx, y)
    y += op.h
  }
}

/** 仅供测试：断行逻辑 */
export const __testWrap = wrap

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement('a')
  a.download = filename
  a.href = canvas.toDataURL('image/png')
  a.click()
}
