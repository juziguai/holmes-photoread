import { useEffect, useRef, useState } from 'react'
import type { Grades, Lang, ReadResult } from '../pipeline/types'
import type { Dict } from '../lib/i18n'
import { buildShareText } from '../lib/share'
import { downloadCanvas, renderShareCard } from '../lib/shareImage'

interface Props {
  result: ReadResult
  grades: Grades
  lang: Lang
  url: string
  caseNo: string
  t: Dict
  onBack: () => void
}

export function ShareCard({ result, grades, lang, url, caseNo, t, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (canvasRef.current) renderShareCard(canvasRef.current, { result, grades, lang, url, caseNo })
  }, [result, grades, lang, url, caseNo])

  function flash(msg: string) {
    setNote(msg)
    setTimeout(() => setNote(''), 1600)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildShareText(result, grades, lang, url))
      flash(t.copied)
    } catch {
      flash(t.error)
    }
  }

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line bg-paper-2">
        <canvas ref={canvasRef} className="block w-full" />
      </div>
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg bg-ink py-2.5 text-sm font-medium text-paper"
          onClick={() => {
            if (canvasRef.current) {
              downloadCanvas(canvasRef.current, `holmes-${caseNo}.png`)
              flash(t.saved)
            }
          }}
        >
          {t.savePng}
        </button>
        <button className="flex-1 rounded-lg border border-line-2 py-2.5 text-sm" onClick={copy}>
          {t.copy}
        </button>
        <button className="rounded-lg border border-line px-3 py-2.5 text-sm text-ink-2" onClick={onBack}>
          {t.shareBack}
        </button>
      </div>
      {note && <p className="text-center text-[12px] text-ok">{note}</p>}
    </section>
  )
}
