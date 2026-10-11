/**
 * 推理段冒烟：不看图，用一份现成的观察清单跑推理，方便迭代 prompt、验证服务商接入。
 *
 *   ANTHROPIC_API_KEY=... pnpm smoke                          # 用 scripts/samples/desk-sample.json
 *   pnpm smoke --subject person                                # 用 scripts/samples/person-sample.json
 *   pnpm smoke --obs path/to/observations.json --lang en --provider gemini
 */
import fs from 'node:fs'
import path from 'node:path'
import { buildDeducePrompt } from '../src/pipeline/prompts'
import { createProvider } from '../src/pipeline/providers'
import { normalizeDeductions, normalizeObservations } from '../src/pipeline/run'
import { extractJson } from '../src/pipeline/parse'
import { DeduceOutputSchema, ObserveOutputSchema, type Lang, type ProviderName, type Subject } from '../src/pipeline/types'

const argv = process.argv.slice(2)
const get = (flag: string) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : undefined
}
const provider = (get('--provider') ?? 'anthropic') as ProviderName
const lang = (get('--lang') ?? 'zh') as Lang
const subject = (get('--subject') ?? 'desk') as Subject
const obsPath = get('--obs') ?? path.join('scripts', 'samples', `${subject}-sample.json`)
const region = get('--region')
const model = get('--model')
const baseUrl = get('--base-url')

const env = process.env
const apiKey =
  provider === 'anthropic' ? env.ANTHROPIC_API_KEY
  : provider === 'openai' ? env.OPENAI_API_KEY
  : env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY
if (!apiKey) {
  console.error(`missing API key env for ${provider}`)
  process.exit(1)
}

const observations = normalizeObservations(ObserveOutputSchema.parse(JSON.parse(fs.readFileSync(obsPath, 'utf8'))).observations)
const prompt = buildDeducePrompt(lang, observations, { region, subject })
const p = createProvider({ provider, apiKey, model, baseUrl })

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const out = path.join('logs', `smoke-${subject}-${stamp}`)
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'request.json'), JSON.stringify({ provider, model: p.model, lang, subject, region, obsPath, system: prompt.system, user: prompt.user }, null, 2))

const t0 = Date.now()
const res = await p.complete({ system: prompt.system, user: prompt.user, schema: DeduceOutputSchema, effort: 'high' })
const ms = Date.now() - t0
fs.writeFileSync(path.join(out, 'response.json'), JSON.stringify(res, null, 2))

const parsed = DeduceOutputSchema.parse(res.parsed ?? extractJson(res.text))
const { deductions, invalidRefs } = normalizeDeductions(parsed.deductions, observations)
console.log(`${provider} ${res.model} · ${ms}ms · tokens ${res.usage?.inputTokens ?? '?'}/${res.usage?.outputTokens ?? '?'} → ${out}\n`)
for (const d of deductions) {
  console.log(`${d.kind === 'bold' ? '🎲' : '•'} ${d.claim}  (${d.confidence.toFixed(2)}) [${d.observation_ids.join(' ')}]`)
  for (const s of d.chain) console.log(`    ↳ ${s}`)
  console.log(`    另解：${d.alternative}${d.trace_ids.length ? `  痕迹：${d.trace_ids.join(', ')}` : ''}`)
}
console.log(`\n“${parsed.closing}”`)
if (invalidRefs.length) console.log(`\n⚠️ 无效引用：${JSON.stringify(invalidRefs)}`)
