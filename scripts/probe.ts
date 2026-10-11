/**
 * CLI 探针：把一个目录的照片跑一遍两段管线，原始件与打分表落到 logs/<时间戳>/。
 *
 *   ANTHROPIC_API_KEY=... pnpm probe --dir photos --lang zh
 *   OPENAI_API_KEY=... pnpm probe --provider openai --base-url https://... --model qwen-vl-max --dir photos
 *   GEMINI_API_KEY=... pnpm probe --provider gemini --dir photos
 *
 * 境外服务商走代理：NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:10808 pnpm probe ...
 */
import fs from 'node:fs'
import path from 'node:path'
import { readPhoto } from '../src/pipeline/run'
import { ProviderError, type ImageInput, type Lang, type ProviderName, type ReadConfig, type ReadResult } from '../src/pipeline/types'

interface Args {
  dir: string
  provider: ProviderName
  model?: string
  baseUrl?: string
  lang: Lang
  region?: string
  out?: string
  seeImage: boolean
}

function parseArgs(argv: string[]): Args {
  const a: Args = { dir: 'photos', provider: 'anthropic', lang: 'zh', seeImage: false }
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    const v = argv[i + 1]
    switch (k) {
      case '--dir': a.dir = v; i++; break
      case '--provider': a.provider = v as ProviderName; i++; break
      case '--model': a.model = v; i++; break
      case '--base-url': a.baseUrl = v; i++; break
      case '--lang': a.lang = v as Lang; i++; break
      case '--region': a.region = v; i++; break
      case '--out': a.out = v; i++; break
      case '--see-image': a.seeImage = true; break
      default:
        if (k.startsWith('--')) throw new Error(`unknown flag ${k}`)
    }
  }
  return a
}

function keyFor(p: ProviderName): string {
  const env = process.env
  const key =
    p === 'anthropic' ? env.ANTHROPIC_API_KEY
    : p === 'openai' ? env.OPENAI_API_KEY
    : env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY
  if (!key) throw new Error(`missing API key env for provider ${p}`)
  return key
}

const MIME: Record<string, ImageInput['mime']> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

/** 从文件头读尺寸（PNG / JPEG），给金丝雀校验用；读不出就跳过 */
function imageDims(buf: Buffer): { width: number; height: number } | undefined {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = buf.readUInt16BE(i + 2)
      const sof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
      if (sof.includes(marker)) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      i += 2 + len
    }
  }
  return undefined
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function gradingSection(name: string, r: ReadResult): string {
  const obs = r.observations.map((o) => `- [ ] ${o.id} (${o.confidence}) ${o.what} — ${o.where} — ${o.detail}`).join('\n')
  const ded = r.deductions
    .map(
      (d) =>
        `- [ ] 中 / [ ] 半中 / [ ] 不中 · ${d.id} [${d.kind} ${d.confidence.toFixed(2)}] ${d.claim}\n    - 链：${d.chain.join(' → ')}\n    - 依据：${d.observation_ids.join(', ')}${d.trace_ids.length ? ` · 痕迹：${d.trace_ids.join(', ')}` : ''}\n    - 另解：${d.alternative}`,
    )
    .join('\n')
  const vision = r.meta.visionCheck.verdict === 'suspect' ? `\n🚨 模型疑似没看到图：${r.meta.visionCheck.reasons.join('; ')}` : ''
  const bad = r.meta.invalidRefs.length
    ? `\n⚠️ 无效引用：${r.meta.invalidRefs.map((x) => `${x.deductionId}→${x.missing.join(',')}`).join('; ')}`
    : ''
  return `## ${name}${vision}\n\n观察（勾 = 没这东西 / 看错）：\n${obs}\n\n结论：\n${ded}\n\n收尾：${r.closing}${bad}\n\n耗时 观察 ${r.meta.timings.observeMs}ms / 推理 ${r.meta.timings.deduceMs}ms · tokens 观察 ${r.meta.usage.observe?.inputTokens ?? '?'}/${r.meta.usage.observe?.outputTokens ?? '?'} 推理 ${r.meta.usage.deduce?.inputTokens ?? '?'}/${r.meta.usage.deduce?.outputTokens ?? '?'}\n`
}

const VERDICT_TEMPLATE = `# VERDICT

日期：
服务商 / 模型：
样本数：

## 数字

- 假观察率 = ✗ 观察 / 观察总数 = 
- 可核验命中率 = (中 + 0.5×半中) / 已打分结论 = 
- bold 命中率（单列，不计门槛）= 

## 判决

- [ ] 继续（假观察率 <10% 且命中率 >40%）
- [ ] 改 prompt 再跑
- [ ] 换模型再跑

## 观察到的问题模式

- 

## 好玩的命中 / 翻车（进分享卡文案库）

- 
`

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = keyFor(args.provider)
  const files = fs
    .readdirSync(args.dir)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .sort()
  if (!files.length) {
    console.error(`no images in ${args.dir} (jpg/png/webp)`)
    process.exit(1)
  }
  const out = args.out ?? path.join('logs', stamp())
  fs.mkdirSync(out, { recursive: true })

  const config: ReadConfig = {
    provider: args.provider,
    apiKey,
    model: args.model,
    baseUrl: args.baseUrl,
    lang: args.lang,
    region: args.region,
    deduceSeesImage: args.seeImage,
  }
  console.log(`probe: ${files.length} images · ${args.provider}${args.model ? ' ' + args.model : ''} · ${args.lang} → ${out}`)

  const summary: Record<string, unknown>[] = []
  let grading = `# 打分表 ${out}\n\n`
  for (const f of files) {
    const p = path.join(args.dir, f)
    const buf = fs.readFileSync(p)
    if (buf.length > 4.5 * 1024 * 1024) console.warn(`  ${f}: ${(buf.length / 1048576).toFixed(1)}MB，建议先缩到 1600px（macOS: sips -Z 1600 ${p}）`)
    const image: ImageInput = { base64: buf.toString('base64'), mime: MIME[path.extname(f).toLowerCase()], ...imageDims(buf) }
    process.stdout.write(`- ${f} … `)
    try {
      const r = await readPhoto(image, config, { onStage: (s) => process.stdout.write(`${s} `) })
      const base = path.join(out, path.parse(f).name)
      fs.writeFileSync(`${base}.json`, JSON.stringify(r, null, 2))
      grading += gradingSection(f, r) + '\n'
      summary.push({
        file: f,
        observations: r.observations.length,
        deductions: r.deductions.length,
        bold: r.deductions.filter((d) => d.kind === 'bold').length,
        invalidRefs: r.meta.invalidRefs.length,
        visionCheck: r.meta.visionCheck,
        timings: r.meta.timings,
        usage: r.meta.usage,
      })
      console.log(`ok · ${r.observations.length} obs / ${r.deductions.length} ded · ${r.meta.timings.observeMs + r.meta.timings.deduceMs}ms`)
      if (r.meta.visionCheck.verdict === 'suspect') console.log(`    🚨 VISION SUSPECT: ${r.meta.visionCheck.reasons.join('; ')}`)
      for (const d of r.deductions) console.log(`    ${d.kind === 'bold' ? '🎲' : '•'} ${d.claim}  (${d.confidence.toFixed(2)})`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const raw = e instanceof ProviderError ? e.raw : undefined
      if (raw) fs.writeFileSync(path.join(out, `${path.parse(f).name}.error.txt`), raw)
      console.log(`FAIL · ${msg}${raw ? ` (raw → ${path.parse(f).name}.error.txt)` : ''}`)
      summary.push({ file: f, error: msg })
      grading += `## ${f}\n\nFAIL: ${msg}\n\n`
    }
  }
  fs.writeFileSync(path.join(out, 'grading.md'), grading)
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ args: { ...args }, provider: config.provider, model: config.model, summary }, null, 2))
  const verdictPath = path.join(out, 'VERDICT.md')
  if (!fs.existsSync(verdictPath)) fs.writeFileSync(verdictPath, VERDICT_TEMPLATE)
  console.log(`\ndone → ${out}/grading.md（逐条打分）→ ${out}/VERDICT.md（写判决）`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
