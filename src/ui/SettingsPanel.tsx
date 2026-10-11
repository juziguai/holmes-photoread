import { useState } from 'react'
import type { Dict } from '../lib/i18n'
import type { Settings } from '../lib/storage'
import { PROVIDER_DEFAULTS } from '../pipeline/providers'
import type { ProviderName } from '../pipeline/types'

interface Props {
  settings: Settings
  t: Dict
  onSave: (s: Settings) => void
  onClose: () => void
}

const PROVIDERS: { id: ProviderName; label: string; hint: string }[] = [
  { id: 'anthropic', label: 'Anthropic', hint: 'Claude' },
  { id: 'openai', label: 'OpenAI 兼容', hint: 'GPT · Qwen-VL · GLM · OpenRouter' },
  { id: 'gemini', label: 'Gemini', hint: 'Google' },
]

const field =
  'w-full rounded-lg border border-line bg-white/60 px-3 py-2 text-sm outline-none focus:border-accent'
const label = 'mb-1 block text-[11px] font-medium tracking-wide text-ink-2'

export function SettingsPanel({ settings, t, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [reveal, setReveal] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const def = PROVIDER_DEFAULTS[draft.provider]

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-paper p-5 shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">{t.settings}</h2>
          <button className="stamp" onClick={onClose} aria-label={t.close}>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className={label}>{t.provider}</span>
            <div className="grid grid-cols-3 gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => set('provider', p.id)}
                  aria-pressed={draft.provider === p.id}
                  className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                    draft.provider === p.id ? 'border-ink bg-paper-2' : 'border-line hover:border-line-2'
                  }`}
                >
                  <div className="text-[13px] font-medium">{p.label}</div>
                  <div className="text-[10px] leading-tight text-muted">{p.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={label}>{t.apiKey}</span>
            <div className="flex gap-1.5">
              <input
                className={field}
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                placeholder={t.apiKeyPlaceholder}
                value={draft.apiKey}
                onChange={(e) => set('apiKey', e.target.value)}
              />
              <button className="stamp shrink-0" onClick={() => setReveal((v) => !v)}>
                {reveal ? '🙈' : '👁'}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t.keyNote}</p>
          </div>

          <div>
            <span className={label}>{t.model}</span>
            <input
              className={field}
              spellCheck={false}
              placeholder={`${t.modelDefault}：${def.model}`}
              value={draft.model}
              onChange={(e) => set('model', e.target.value)}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t.needVision}</p>
          </div>

          {draft.provider === 'openai' && (
            <div>
              <span className={label}>{t.baseUrl}</span>
              <input
                className={field}
                spellCheck={false}
                placeholder={def.baseUrl}
                value={draft.baseUrl}
                onChange={(e) => set('baseUrl', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={label}>{t.region}</span>
              <input
                className={field}
                placeholder={t.regionDefault}
                value={draft.region}
                onChange={(e) => set('region', e.target.value)}
              />
              <p className="mt-1 text-[10px] text-muted">{t.regionHint}</p>
            </div>
            <div>
              <span className={label}>{t.lang}</span>
              <select
                className={field}
                value={draft.lang}
                onChange={(e) => set('lang', e.target.value as Settings['lang'])}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        <button
          className="mt-5 w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-paper"
          onClick={() => {
            onSave(draft)
            onClose()
          }}
        >
          {t.save}
        </button>
      </div>
    </div>
  )
}
