import type {
  Deduction,
  DeductionGrade,
  Grades,
  Observation,
  ObservationGrade,
  ReadResult,
} from '../pipeline/types'
import type { Dict } from '../lib/i18n'
import { summarize } from '../lib/share'

interface Props {
  result: ReadResult
  grades: Grades
  t: Dict
  caseNo: string
  onGradeObservation: (id: string, g: ObservationGrade) => void
  onGradeDeduction: (id: string, g: DeductionGrade) => void
}

const CONF_CELLS = 5

function Confidence({ value, label }: { value: number; label: string }) {
  const filled = Math.max(1, Math.round(value * CONF_CELLS))
  return (
    <span className="flex items-center gap-1" title={`${label} ${value.toFixed(2)}`}>
      <span className="flex gap-[2px]" aria-hidden>
        {Array.from({ length: CONF_CELLS }, (_, i) => (
          <span
            key={i}
            className={`block h-2.5 w-1 rounded-[1px] ${i < filled ? 'bg-ink-2' : 'bg-line'}`}
          />
        ))}
      </span>
      <span className="tag text-muted">{value.toFixed(2)}</span>
    </span>
  )
}

function ObservationRow({
  o,
  grade,
  t,
  onGrade,
}: {
  o: Observation
  grade?: ObservationGrade
  t: Dict
  onGrade: (id: string, g: ObservationGrade) => void
}) {
  const struck = grade === 'wrong'
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className="oid mt-[1px] w-7 shrink-0 text-muted">{o.id}</span>
      <div className={`min-w-0 flex-1 text-[13px] leading-snug ${struck ? 'text-muted line-through' : ''}`}>
        <span>{o.what}</span>
        {o.where && <span className="text-muted"> · {o.where}</span>}
        {o.detail && <div className="text-[11px] leading-snug text-muted">{o.detail}</div>}
      </div>
      <span className="tag mt-0.5 shrink-0 text-muted">{o.confidence[0].toUpperCase()}</span>
      <button
        className="stamp mt-0.5 shrink-0"
        data-on={grade === 'wrong'}
        data-tone="bad"
        onClick={() => onGrade(o.id, 'wrong')}
      >
        {t.wrong}
      </button>
    </li>
  )
}

const GRADE_BUTTONS: { g: DeductionGrade; tone: string; key: 'hit' | 'half' | 'miss' }[] = [
  { g: 'hit', tone: 'ok', key: 'hit' },
  { g: 'half', tone: 'half', key: 'half' },
  { g: 'miss', tone: 'bad', key: 'miss' },
]

function DeductionCard({
  d,
  grade,
  voided,
  invalid,
  t,
  onGrade,
}: {
  d: Deduction
  grade?: DeductionGrade
  voided: boolean
  invalid?: string[]
  t: Dict
  onGrade: (id: string, g: DeductionGrade) => void
}) {
  const bet = d.kind === 'bold'
  return (
    <article
      className={`rounded-lg border bg-paper-2/40 p-3 ${bet ? 'bet-edge border-line-2' : 'border-line'} ${
        voided ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="oid text-muted">{d.id}</span>
        {bet && (
          <span className="tag rounded-sm border border-[var(--color-bet)] px-1 text-[var(--color-bet)]">
            🎲 {t.bold}
          </span>
        )}
        <span className="flex-1" />
        <Confidence value={d.confidence} label={t.confidence} />
      </div>

      <p className={`mt-1.5 font-display text-[17px] leading-snug ${voided ? 'line-through' : ''}`}>{d.claim}</p>

      {d.chain.length > 0 && (
        <ol className="mt-2 space-y-1 border-l border-line pl-3 text-[12px] leading-snug text-ink-2">
          {d.chain.map((step, i) => (
            <li key={i}>
              <span className="tag mr-1 text-muted">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        {d.observation_ids.length > 0 && (
          <span className="oid font-normal">
            {t.refs} {d.observation_ids.join(' ')}
          </span>
        )}
        {d.trace_ids.length > 0 && (
          <span className="tag">
            {t.traceRefs} {d.trace_ids.join(' ')}
          </span>
        )}
        {invalid?.length ? (
          <span className="tag text-bad">
            {t.invalidRef}: {invalid.join(' ')}
          </span>
        ) : null}
        {voided && <span className="tag text-bad">{t.voided}</span>}
      </div>

      {d.alternative && (
        <p className="mt-2 border-t border-line/70 pt-2 text-[12px] leading-snug text-ink-2">
          <span className="text-muted">{t.alt}：</span>
          {d.alternative}
        </p>
      )}

      <div className="mt-2.5 flex gap-2">
        {GRADE_BUTTONS.map(({ g, tone, key }) => (
          <button
            key={g}
            className="stamp flex-1"
            data-on={grade === g}
            data-tone={tone}
            onClick={() => onGrade(d.id, g)}
          >
            {t[key]}
          </button>
        ))}
      </div>
    </article>
  )
}

export function ResultView({ result, grades, t, caseNo, onGradeObservation, onGradeDeduction }: Props) {
  const s = summarize(result, grades)
  const suspect = result.meta.visionCheck.verdict === 'suspect'
  const invalidById = new Map(result.meta.invalidRefs.map((r) => [r.deductionId, r.missing]))
  const wrongObs = new Set(
    result.observations.filter((o) => grades.observations[o.id] === 'wrong').map((o) => o.id),
  )
  const isVoid = (d: Deduction) =>
    d.observation_ids.length > 0 && d.observation_ids.every((id) => wrongObs.has(id))
  const totalMs = result.meta.timings.observeMs + result.meta.timings.deduceMs

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-line py-2">
        <span className="tag">
          {t.caseNo} No.{caseNo}
        </span>
        <span className="tag text-muted">{result.meta.subject === 'person' ? t.scenePerson : t.sceneDesk}</span>
        <span className="tag text-muted">
          {t.observations} {result.observations.length}
        </span>
        <span className="tag text-muted">{(totalMs / 1000).toFixed(1)}s</span>
      </header>

      {suspect && (
        <div className="rounded-lg border-2 border-bad/50 bg-bad/5 p-3">
          <p className="text-[13px] font-semibold text-bad">{t.visionSuspect}</p>
          <ul className="mt-1.5 space-y-0.5">
            {result.meta.visionCheck.reasons.map((r, i) => (
              <li key={i} className="tag text-bad/80">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="rule mb-1">{t.deductions}</div>
        <p className="mb-2.5 text-[11px] text-muted">{t.gradeHint}</p>
        <div className="space-y-2.5">
          {result.deductions.map((d) => (
            <DeductionCard
              key={d.id}
              d={d}
              grade={grades.deductions[d.id]}
              voided={isVoid(d)}
              invalid={invalidById.get(d.id)}
              t={t}
              onGrade={onGradeDeduction}
            />
          ))}
        </div>
      </div>

      <blockquote className="border-l-2 border-line-2 pl-3 font-display text-[15px] leading-snug text-ink-2">
        {result.closing}
      </blockquote>

      <details open>
        <summary className="rule mb-1">
          {t.observations} · {result.observations.length}
        </summary>
        <p className="mb-1 text-[11px] text-muted">{t.obsHint}</p>
        <ul className="divide-y divide-line/60">
          {result.observations.map((o) => (
            <ObservationRow
              key={o.id}
              o={o}
              grade={grades.observations[o.id]}
              t={t}
              onGrade={onGradeObservation}
            />
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-2 text-[13px]">
        <span>
          <span className="text-muted">{t.score} </span>
          {s.graded ? (
            <span className="font-display text-base">
              {s.hits}
              {s.halves ? `+${s.halves}` : ''}/{s.graded}
            </span>
          ) : (
            <span className="text-muted">{t.scoreEmpty}</span>
          )}
        </span>
        {s.hitRate !== null && (
          <span>
            <span className="text-muted">{t.hitRate} </span>
            <span className="font-display text-base">{Math.round(s.hitRate * 100)}%</span>
          </span>
        )}
        <span>
          <span className="text-muted">{t.falseObs} </span>
          <span className={`font-display text-base ${s.falseObs ? 'text-bad' : ''}`}>
            {s.falseObs}/{s.obsTotal}
          </span>
        </span>
      </div>
    </section>
  )
}
