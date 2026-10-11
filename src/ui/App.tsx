import { useCallback, useEffect, useRef, useState } from 'react'
import { readPhoto } from '../pipeline/run'
import {
  ProviderError,
  type DeductionGrade,
  type Grades,
  type Observation,
  type ObservationGrade,
  type ReadResult,
  type Stage,
  type Subject,
} from '../pipeline/types'
import { T, detectLang, type Dict } from '../lib/i18n'
import { loadSettings, saveSettings, upsertHistory, type Settings } from '../lib/storage'
import { prepareImage, type PreparedImage } from '../lib/image'
import { ModePicker } from './ModePicker'
import { PhotoPicker } from './PhotoPicker'
import { SettingsPanel } from './SettingsPanel'
import { ResultView } from './ResultView'
import { ShareCard } from './ShareCard'
import { demoResult } from './demo'
import Replay from './Replay'

const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  apiKey: '',
  model: '',
  baseUrl: '',
  lang: detectLang(),
  region: '',
}
const EMPTY_GRADES: Grades = { observations: {}, deductions: {} }

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; stage: Stage }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

/** 再点一次同一档 = 取消 */
function toggle<G extends string>(map: Record<string, G>, id: string, g: G): Record<string, G> {
  const next = { ...map }
  if (next[id] === g) delete next[id]
  else next[id] = g
  return next
}

function caseNumber(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function Progress({ stage, t, observations }: { stage: Stage; t: Dict; observations: Observation[] }) {
  const observing = stage === 'observing'
  return (
    <section className="rounded-lg border border-line bg-paper-2/40 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-block size-2 animate-pulse rounded-full bg-accent" />
        <span className="font-display text-lg">{observing ? t.observing : t.deducing}</span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-ink-2">
        {observing ? t.observingNote : t.deducingNote}
      </p>
      <div className="mt-3 flex gap-1.5">
        <span className={`h-1 flex-1 rounded-full ${observing ? 'animate-pulse bg-accent' : 'bg-ok'}`} />
        <span className={`h-1 flex-1 rounded-full ${observing ? 'bg-line' : 'animate-pulse bg-accent'}`} />
      </div>
      {observations.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3">
          {observations.map((o) => (
            <li key={o.id} className="flex gap-2 text-[12px] leading-snug">
              <span className="tag shrink-0 text-muted">{o.id}</span>
              <span className="text-ink-2">{o.what}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  if (params.get('replay')) {
    const speed = Number(params.get('speed')) || 1
    return <Replay bare={params.get('bare') === '1'} speed={Math.min(4, Math.max(0.25, speed))} />
  }
  return <Reader />
}

function Reader() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(DEFAULT_SETTINGS))
  const [showSettings, setShowSettings] = useState(false)
  const [subject, setSubject] = useState<Subject>('desk')
  const [consent, setConsent] = useState(false)
  const [photo, setPhoto] = useState<PreparedImage | null>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [partial, setPartial] = useState<Observation[]>([])
  const [result, setResult] = useState<ReadResult | null>(null)
  const [grades, setGrades] = useState<Grades>(EMPTY_GRADES)
  const [readId, setReadId] = useState('')
  const [caseNo, setCaseNo] = useState(() => caseNumber())
  const [showShare, setShowShare] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const runningRef = useRef(false)

  const t = T[settings.lang]
  const running = phase.kind === 'running'
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  const blockedByConsent = subject === 'person' && !consent

  useEffect(() => {
    document.documentElement.lang = settings.lang === 'zh' ? 'zh-CN' : 'en'
  }, [settings.lang])

  // ?demo=1 / ?demo=person：装一份样例案卷，没 key 也能看见成品
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('demo')
    if (!q) return
    const s: Subject = q === 'person' ? 'person' : 'desk'
    setSubject(s)
    setConsent(s === 'person')
    setResult(demoResult(s))
    setIsDemo(true)
    setPhase({ kind: 'done' })
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setGrades(EMPTY_GRADES)
    setPartial([])
    setShowShare(false)
    setIsDemo(false)
    setPhase({ kind: 'idle' })
  }, [])

  function updateSettings(next: Settings) {
    setSettings(next)
    saveSettings(next)
  }

  const onFile = useCallback(
    async (file: File) => {
      try {
        const prepared = await prepareImage(file)
        setPhoto(prepared)
        reset()
      } catch {
        setPhase({ kind: 'error', message: t.tooBig })
      }
    },
    [reset, t.tooBig],
  )

  // 粘贴一张图就能开工
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (runningRef.current) return
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) void onFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onFile])

  async function run() {
    if (!photo || running) return
    if (blockedByConsent) {
      setPhase({ kind: 'error', message: t.consentNeeded })
      return
    }
    if (!settings.apiKey.trim()) {
      setPhase({ kind: 'error', message: t.needKey })
      setShowSettings(true)
      return
    }
    runningRef.current = true
    setResult(null)
    setGrades(EMPTY_GRADES)
    setPartial([])
    setShowShare(false)
    setIsDemo(false)
    setCaseNo(caseNumber())
    setPhase({ kind: 'running', stage: 'observing' })
    try {
      const r = await readPhoto(
        photo.input,
        {
          provider: settings.provider,
          apiKey: settings.apiKey.trim(),
          model: settings.model.trim() || undefined,
          baseUrl: settings.baseUrl.trim() || undefined,
          lang: settings.lang,
          subject,
          region: settings.region.trim() || undefined,
        },
        {
          onStage: (stage) => setPhase({ kind: 'running', stage }),
          onObserved: (observations) => setPartial(observations),
        },
      )
      const id = Date.now().toString(36)
      setReadId(id)
      setResult(r)
      setPhase({ kind: 'done' })
      upsertHistory({ id, ts: Date.now(), result: r, grades: EMPTY_GRADES })
    } catch (e) {
      const message =
        e instanceof ProviderError
          ? `${t.error}（${e.kind}）：${e.message}`
          : e instanceof Error
            ? e.message
            : String(e)
      setPhase({ kind: 'error', message })
    } finally {
      runningRef.current = false
    }
  }

  const gradeObservation = (id: string, g: ObservationGrade) =>
    setGrades((prev) => ({ ...prev, observations: toggle(prev.observations, id, g) }))
  const gradeDeduction = (id: string, g: DeductionGrade) =>
    setGrades((prev) => ({ ...prev, deductions: toggle(prev.deductions, id, g) }))

  useEffect(() => {
    if (result && readId && !isDemo) upsertHistory({ id: readId, ts: Date.now(), result, grades })
  }, [grades, result, readId, isDemo])

  const canShare = result && result.meta.visionCheck.verdict !== 'suspect'

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-3xl leading-none tracking-tight">{t.title}</h1>
            <span className="tag text-muted">{t.subtitle}</span>
          </div>
          <p className="balance mt-1.5 font-display text-[15px] leading-snug">{t.tagline}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">{t.sub}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            className="stamp"
            onClick={() => updateSettings({ ...settings, lang: settings.lang === 'zh' ? 'en' : 'zh' })}
          >
            {settings.lang === 'zh' ? 'EN' : '中'}
          </button>
          <button className="stamp" onClick={() => setShowSettings(true)} aria-label={t.settings}>
            ⚙︎{settings.apiKey ? '' : ' !'}
          </button>
        </div>
      </header>

      <main className="space-y-4">
        {!result && (
          <>
            <ModePicker
              subject={subject}
              consent={consent}
              disabled={running}
              t={t}
              onSubject={(s) => {
                setSubject(s)
                reset()
              }}
              onConsent={setConsent}
            />
            <PhotoPicker
              photo={photo}
              subject={subject}
              disabled={running}
              t={t}
              onFile={onFile}
              onClear={() => {
                setPhoto(null)
                reset()
              }}
            />
          </>
        )}

        {running && <Progress stage={phase.stage} t={t} observations={partial} />}

        {!result && !running && (
          <button
            className="w-full rounded-lg bg-ink py-3 font-display text-lg text-paper disabled:opacity-35"
            disabled={!photo || blockedByConsent}
            onClick={run}
          >
            {t.run}
          </button>
        )}

        {phase.kind === 'error' && (
          <div className="rounded-lg border border-bad/40 bg-bad/5 p-3 text-[13px] leading-snug text-bad">
            {phase.message}
          </div>
        )}

        {result && (
          <>
            {isDemo && (
              <div className="rounded-lg border border-line-2 bg-paper-2/60 p-3">
                <span className="tag">{t.demoBadge}</span>
                <p className="mt-1 text-[12px] leading-snug text-ink-2">{t.demoNote}</p>
              </div>
            )}

            {showShare && canShare ? (
              <ShareCard
                result={result}
                grades={grades}
                lang={settings.lang}
                url={shareUrl}
                caseNo={caseNo}
                t={t}
                onBack={() => setShowShare(false)}
              />
            ) : (
              <ResultView
                result={result}
                grades={grades}
                t={t}
                caseNo={caseNo}
                onGradeObservation={gradeObservation}
                onGradeDeduction={gradeDeduction}
              />
            )}

            {!showShare && (
              <div className="flex gap-2">
                {canShare && (
                  <button
                    className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-paper hover:bg-accent-2"
                    onClick={() => setShowShare(true)}
                  >
                    {t.share}
                  </button>
                )}
                <button
                  className="flex-1 rounded-lg border border-line-2 py-2.5 text-sm text-ink-2"
                  onClick={() => {
                    reset()
                    if (isDemo) setPhoto(null)
                  }}
                >
                  {isDemo ? t.run : t.rerun}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-10 space-y-1.5 border-t border-line pt-4 text-center text-[11px] leading-relaxed text-muted">
        <p>{t.privacy}</p>
        <p>{t.skillPitch}</p>
      </footer>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          t={t}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
