import { useRef, useState } from 'react'
import type { PreparedImage } from '../lib/image'
import type { Subject } from '../pipeline/types'
import type { Dict } from '../lib/i18n'

interface Props {
  photo: PreparedImage | null
  subject: Subject
  disabled: boolean
  t: Dict
  onFile: (file: File) => void
  onClear: () => void
}

export function PhotoPicker({ photo, subject, disabled, t, onFile, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function take(list: FileList | null | undefined) {
    const f = list?.[0]
    if (f && f.type.startsWith('image/')) onFile(f)
  }

  if (photo) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-paper-2">
        <img src={photo.previewUrl} alt="" className="max-h-[52vh] w-full bg-ink/5 object-contain" />
        <div className="flex items-center justify-between border-t border-line px-3 py-2">
          <span className="tag text-muted">
            {photo.width}×{photo.height}
          </span>
          <div className="flex gap-2">
            <button className="stamp" disabled={disabled} onClick={() => inputRef.current?.click()}>
              {t.repick}
            </button>
            <button className="stamp" disabled={disabled} onClick={onClear}>
              {t.remove}
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            take(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled) take(e.dataTransfer.files)
      }}
      className={`block cursor-pointer rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
        over ? 'border-accent bg-accent/5' : 'border-line hover:border-line-2'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        type="file"
        accept="image/*"
        capture={subject === 'desk' ? 'environment' : undefined}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
      <div aria-hidden className="text-3xl">
        {subject === 'desk' ? '📷' : '🪞'}
      </div>
      <div className="mt-2 font-display text-lg">{subject === 'desk' ? t.pickDesk : t.pickPerson}</div>
      <div className="mt-1 text-[11px] text-muted">{t.dropHint}</div>
    </label>
  )
}
