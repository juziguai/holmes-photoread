/**
 * 从模型返回的自由文本里抠出第一个完整 JSON 对象/数组。
 * 兼容：```json 围栏、前后有解释文字、对象里含字符串化的花括号。
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim()
  // 1. 直接就是 JSON
  try {
    return JSON.parse(trimmed)
  } catch {
    /* fallthrough */
  }
  // 2. 围栏
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) {
    try {
      return JSON.parse(fence[1].trim())
    } catch {
      /* fallthrough */
    }
  }
  // 3. 扫描首个 { 或 [，按括号配平截取（忽略字符串内的括号）
  const start = trimmed.search(/[[{]/)
  if (start === -1) throw new Error('no JSON found in model output')
  const open = trimmed[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0) {
        if (ch !== close) break
        const candidate = trimmed.slice(start, i + 1)
        return JSON.parse(candidate)
      }
    }
  }
  throw new Error('unbalanced JSON in model output')
}
