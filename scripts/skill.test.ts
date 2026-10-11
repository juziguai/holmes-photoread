import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkSkillReferencesFresh, SKILL_REFERENCES } from './build-skill'
import { TRACES } from '../src/traces'

const SKILL_DIR = join(import.meta.dirname, '..', 'skills', 'holmes')
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/

describe('holmes skill package', () => {
  it('reference files are in sync with src/traces (run `pnpm build:skill`)', () => {
    expect(checkSkillReferencesFresh()).toEqual([])
  })

  it('ships bilingual trace references for both subjects', () => {
    expect(SKILL_REFERENCES.map((r) => r.file).sort()).toEqual([
      'traces-desk.md',
      'traces-desk.zh.md',
      'traces-person.md',
      'traces-person.zh.md',
    ])
    for (const { content } of SKILL_REFERENCES) expect(content.length).toBeGreaterThan(1000)
  })

  it('English reference files carry no Chinese', () => {
    for (const { file, content } of SKILL_REFERENCES) {
      if (file.endsWith('.zh.md')) continue
      expect(content, file).not.toMatch(CJK)
    }
  })

  it('every trace id in the library reaches at least one reference file', () => {
    const all = SKILL_REFERENCES.map((r) => r.content).join('\n')
    for (const t of TRACES) expect(all, `${t.id} 没进 Skill 参考文件`).toContain(t.id)
  })

  it('SKILL.md has frontmatter and keeps the two-stage rule intact', () => {
    const md = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')
    expect(md.startsWith('---\n')).toBe(true)
    expect(md).toMatch(/^name: holmes$/m)
    expect(md).toMatch(/^description: .{80,}/m)
    // 两段硬分离：先写观察，写完才准打开痕迹库
    expect(md).toContain('references/traces-')
    expect(md).toMatch(/not\*{0,2} open .{0,40}traces-\*?\.md.{0,80}observation list/s)
    expect(md).toContain('bold')
    // 安全线
    expect(md).toContain('physiognomy')
    expect(md).toContain('consent')
  })
})
