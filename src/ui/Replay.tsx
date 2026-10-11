import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DeductionGrade } from '../pipeline/types'
import { summarize } from '../lib/share'
import { renderShareCard } from '../lib/shareImage'
import { CASE, DEDUCTIONS, GRADES, OBSERVATIONS, OWNER_REBUTTAL, CASE_NO } from './cases/desk-0910'

/**
 * 案卷回放：把一份真实案卷按"观察 → 定格 → 推理 → 打分 → 结算 → 复盘"演一遍。
 * 给录屏用的：窄栏、大字、自动播放。?replay=1，加 &bare=1 隐藏控件。
 */

const OBS_N = OBSERVATIONS.length
const DED_N = DEDUCTIONS.length

const STEP = {
  title: 0,
  obsFirst: 1,
  obsLast: OBS_N,
  divider: OBS_N + 1,
  dedFirst: OBS_N + 2,
  dedLast: OBS_N + 1 + DED_N,
  gradeFirst: OBS_N + 2 + DED_N,
  gradeLast: OBS_N + 1 + DED_N * 2,
  score: OBS_N + 2 + DED_N * 2,
  rebuttal: OBS_N + 3 + DED_N * 2,
  card: OBS_N + 4 + DED_N * 2,
} as const
const LAST = STEP.card

function durationOf(step: number): number {
  if (step === STEP.title) return 2600
  if (step <= STEP.obsLast) return 240
  if (step === STEP.divider) return 2600
  if (step <= STEP.dedLast) return 2000
  if (step <= STEP.gradeLast) return 620
  if (step === STEP.score) return 2800
  if (step === STEP.rebuttal) return 5200
  return 0
}

const GRADE_TEXT: Record<DeductionGrade, string> = { hit: '中', half: '半中', miss: '不中' }
const GRADE_TONE: Record<DeductionGrade, string> = { hit: 'ok', half: 'half', miss: 'bad' }

function Stamp({ grade }: { grade: DeductionGrade }) {
  return (
    <span className="stamp shrink-0" data-on="true" data-tone={GRADE_TONE[grade]}>
      {GRADE_TEXT[grade]}
    </span>
  )
}

export default function Replay({ bare, speed }: { bare: boolean; speed: number }) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hasPhoto, setHasPhoto] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  const obsShown = Math.min(Math.max(step - STEP.obsFirst + 1, 0), OBS_N)
  const dedShown = step < STEP.dedFirst ? 0 : Math.min(step - STEP.dedFirst + 1, DED_N)
  const gradesShown = step < STEP.gradeFirst ? 0 : Math.min(step - STEP.gradeFirst + 1, DED_N)
  const score = useMemo(() => summarize(CASE, GRADES), [])
  const missed = DEDUCTIONS.find((d) => d.id === OWNER_REBUTTAL.deductionId)!

  useEffect(() => {
    if (!playing || step >= LAST) return
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, LAST)), durationOf(step) / speed)
    return () => clearTimeout(t)
  }, [step, playing, speed])

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step])

  useEffect(() => {
    if (step === STEP.card && canvasRef.current) {
      renderShareCard(canvasRef.current, {
        result: CASE,
        grades: GRADES,
        lang: 'zh',
        url: 'github.com/Oldcircle/holmes-skill',
        caseNo: CASE_NO,
      })
      // 画布定尺后布局会大幅变化，smooth 滚动会被打断，这里补一次硬滚
      canvasRef.current.scrollIntoView({ block: 'center' })
    }
  }, [step])

  const restart = useCallback(() => {
    setStep(0)
    setPlaying(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, LAST))
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0))
      else if (e.key.toLowerCase() === 'r') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [restart])

  return (
    <div className="mx-auto min-h-dvh max-w-[440px] px-5 pb-32 pt-10">
      <div className="fixed inset-x-0 top-0 z-10 h-[3px] bg-line/60">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${(step / LAST) * 100}%` }}
        />
      </div>

      {/* 抬头 */}
      <header className="flex min-h-[58dvh] flex-col justify-center text-center">
        <div className="tag text-muted">福尔摩斯 · 案卷 No.{CASE_NO}</div>
        <h1 className="mt-2 font-display text-[30px] leading-tight">一张真实的桌面照</h1>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
          先观察，后推理，每条结论亮出它踩在哪条观察上。
        </p>
        {hasPhoto && (
          <img
            src="/case-desk.jpg"
            alt=""
            onError={() => setHasPhoto(false)}
            className="mt-4 w-full rounded-lg border border-line object-cover"
          />
        )}
      </header>

      {/* 第一幕：观察 */}
      {step >= STEP.obsFirst && (
        <section className="mt-9">
          <div className="rule mb-1">第一段 · 观察</div>
          <p className="mb-3 text-[12px] text-ink-2">只记看得见的东西。一个字都不许推。</p>
          <ul className="space-y-2">
            {OBSERVATIONS.slice(0, obsShown).map((o) => (
              <li key={o.id} className="flex gap-2.5 text-[14px] leading-snug">
                <span className="oid mt-[1px] w-8 shrink-0 text-muted">{o.id}</span>
                <span>
                  {o.what}
                  <span className="text-muted"> · {o.where}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 定格：这是整个产品的主张 */}
      {step >= STEP.divider && (
        <section className="my-12 border-y-2 border-ink py-8 text-center">
          <p className="font-display text-[26px] leading-tight">观察写完了。</p>
          <p className="mt-1 font-display text-[26px] leading-tight text-accent">现在才允许推理。</p>
          <p className="mx-auto mt-3 max-w-[300px] text-[12px] leading-relaxed text-ink-2">
            清单到此冻结。接下来每条结论都必须引用上面的编号，引用不到的，当场作废。
          </p>
        </section>
      )}

      {/* 第二幕：推论 */}
      {step >= STEP.dedFirst && (
        <section>
          <div className="rule mb-3">第二段 · 推论</div>
          <div className="space-y-4">
            {DEDUCTIONS.slice(0, dedShown).map((d, i) => {
              const grade = i < gradesShown ? GRADES.deductions[d.id] : undefined
              return (
                <article
                  key={d.id}
                  className={`rounded-lg border bg-paper-2/40 p-3.5 ${
                    d.kind === 'bold' ? 'bet-edge border-line-2' : 'border-line'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="oid text-muted">{d.id}</span>
                    {d.kind === 'bold' && (
                      <span className="tag rounded-sm border border-[var(--color-bet)] px-1 text-[var(--color-bet)]">
                        🎲 押注
                      </span>
                    )}
                    <span className="tag ml-auto text-muted">把握 {d.confidence.toFixed(2)}</span>
                    {grade && <Stamp grade={grade} />}
                  </div>
                  <p className="mt-2 font-display text-[19px] leading-snug">{d.claim}</p>
                  <ol className="mt-2.5 space-y-1 border-l border-line pl-3 text-[12.5px] leading-snug text-ink-2">
                    {d.chain.map((s, k) => (
                      <li key={k}>
                        <span className="tag mr-1 text-muted">{k + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                  <div className="oid mt-2 font-normal text-muted">
                    依据 {d.observation_ids.join(' ')}
                    {d.trace_ids.length ? ` ｜ 痕迹 ${d.trace_ids.join(' ')}` : ''}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* 结算 */}
      {step >= STEP.score && (
        <section className="mt-10 border-y border-line py-5 text-center">
          <div className="tag text-muted">照片主人本人打的分</div>
          <div className="mt-3 flex items-end justify-center gap-7">
            <div>
              <div className="font-display text-[38px] leading-none">{score.hits}/{score.graded}</div>
              <div className="tag mt-1 text-muted">命中</div>
            </div>
            <div>
              <div className="font-display text-[38px] leading-none text-ok">
                {Math.round((score.hitRate ?? 0) * 100)}%
              </div>
              <div className="tag mt-1 text-muted">命中率</div>
            </div>
            <div>
              <div className="font-display text-[38px] leading-none">0/{score.obsTotal}</div>
              <div className="tag mt-1 text-muted">假观察</div>
            </div>
          </div>
        </section>
      )}

      {/* 复盘那条不中：这才是这个项目想讲的事 */}
      {step >= STEP.rebuttal && (
        <section className="mt-10">
          <div className="rule mb-3">唯一那条不中</div>
          <div className="rounded-lg border-2 border-bad/40 bg-bad/5 p-4">
            <p className="font-display text-[19px] leading-snug text-bad line-through">{missed.claim}</p>
            <p className="mt-3 border-l-2 border-line-2 pl-3 font-display text-[15px] leading-snug">
              「{OWNER_REBUTTAL.quote}」
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{OWNER_REBUTTAL.lesson}</p>
          </div>
          <p className="mt-4 text-center font-display text-[17px] leading-snug">
            推错了不要紧。<span className="text-accent">看错了才要命。</span>
          </p>
          <p className="mx-auto mt-2 max-w-[320px] text-center text-[12px] leading-relaxed text-muted">
            假观察会让下游结论全部作废。推理过头只是一次诚实的失手，主人一句话就能纠正，
            而这条翻车已经变成了 prompt 里的一条硬规则。
          </p>
        </section>
      )}

      {/* 分享卡 */}
      {step >= STEP.card && (
        <section className="mt-10">
          <div className="rule mb-3">分享卡</div>
          <div className="overflow-hidden rounded-lg border border-line">
            <canvas ref={canvasRef} className="block w-full" />
          </div>
          <p className="mt-4 text-center font-display text-[17px]">福尔摩斯 Skill</p>
          <p className="mt-1 text-center text-[12px] leading-relaxed text-muted">
            装进 Claude，丢一张照片进去。不用 API Key。
          </p>
        </section>
      )}

      <div ref={anchorRef} />

      {!bare && (
        <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-paper/90 px-3 py-1.5 opacity-35 backdrop-blur transition-opacity hover:opacity-100">
          <button className="stamp" onClick={() => setPlaying((p) => !p)}>
            {playing ? '暂停' : '播放'}
          </button>
          <button className="stamp" onClick={restart}>
            重来
          </button>
          <span className="tag text-muted">
            {step}/{LAST} · 空格暂停 ←→ 单步 R 重来 · &speed= 调速
          </span>
        </div>
      )}
    </div>
  )
}
