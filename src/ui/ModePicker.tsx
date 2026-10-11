import type { Subject } from '../pipeline/types'
import type { Dict } from '../lib/i18n'

interface Props {
  subject: Subject
  consent: boolean
  disabled: boolean
  t: Dict
  onSubject: (s: Subject) => void
  onConsent: (v: boolean) => void
}

const OPTIONS: { key: Subject; icon: string }[] = [
  { key: 'desk', icon: '🗂' },
  { key: 'person', icon: '🧥' },
]

export function ModePicker({ subject, consent, disabled, t, onSubject, onConsent }: Props) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ key, icon }) => {
          const on = subject === key
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => onSubject(key)}
              className={`rounded-lg border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                on ? 'border-ink bg-paper-2' : 'border-line hover:border-line-2'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="text-sm">{icon}</span>
                <span className={`text-sm ${on ? 'font-semibold' : ''}`}>
                  {key === 'desk' ? t.modeDesk : t.modePerson}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted">
                {key === 'desk' ? t.modeDeskHint : t.modePersonHint}
              </div>
            </button>
          )
        })}
      </div>

      {subject === 'person' && (
        <div className="mt-2 rounded-lg border border-line bg-paper-2/50 p-3">
          <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug">
            <input
              type="checkbox"
              checked={consent}
              disabled={disabled}
              onChange={(e) => onConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span>{t.consent}</span>
          </label>
          <p className="mt-2 border-t border-line/70 pt-2 text-[11px] leading-relaxed text-muted">{t.personNote}</p>
        </div>
      )}
    </div>
  )
}
