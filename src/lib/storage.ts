import type { Grades, Lang, ProviderName, ReadResult } from '../pipeline/types'

export interface Settings {
  provider: ProviderName
  apiKey: string
  model: string
  baseUrl: string
  lang: Lang
  region: string
}

export interface HistoryItem {
  id: string
  ts: number
  result: ReadResult
  grades: Grades
}

const SETTINGS_KEY = 'holmes.settings.v1'
const HISTORY_KEY = 'holmes.history.v1'
/** 改名前的 key，读一次搬过来，别让老用户的 API Key 凭空消失 */
const LEGACY = { settings: 'coldread.settings.v1', history: 'coldread.history.v1' }
const HISTORY_CAP = 50

function read<T>(key: string, legacyKey?: string): T | null {
  try {
    const raw = localStorage.getItem(key) ?? (legacyKey ? localStorage.getItem(legacyKey) : null)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 隐私模式或配额满：静默 */
  }
}

export function loadSettings(defaults: Settings): Settings {
  return { ...defaults, ...(read<Partial<Settings>>(SETTINGS_KEY, LEGACY.settings) ?? {}) }
}

export function saveSettings(s: Settings): void {
  write(SETTINGS_KEY, s)
}

export function loadHistory(): HistoryItem[] {
  return read<HistoryItem[]>(HISTORY_KEY, LEGACY.history) ?? []
}

export function upsertHistory(item: HistoryItem): HistoryItem[] {
  const list = loadHistory().filter((h) => h.id !== item.id)
  // 原始响应体积大，历史里不留
  const slim: HistoryItem = {
    ...item,
    result: { ...item.result, meta: { ...item.result.meta, raw: { observe: '', deduce: '' } } },
  }
  const next = [slim, ...list].slice(0, HISTORY_CAP)
  write(HISTORY_KEY, next)
  return next
}

export function clearHistory(): void {
  write(HISTORY_KEY, [])
}
