import { describe, expect, it } from 'vitest'
import { extractJson } from './parse'

describe('extractJson', () => {
  it('parses bare JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })
  it('parses fenced JSON', () => {
    expect(extractJson('sure:\n```json\n{"a":[1,2]}\n```\nthanks')).toEqual({ a: [1, 2] })
  })
  it('parses JSON with leading and trailing prose', () => {
    expect(extractJson('Here you go {"a":{"b":"}"}} bye')).toEqual({ a: { b: '}' } })
  })
  it('handles escaped quotes inside strings', () => {
    expect(extractJson('x {"a":"say \\"hi\\" {"} y')).toEqual({ a: 'say "hi" {' })
  })
  it('throws when nothing JSON-like', () => {
    expect(() => extractJson('no json here')).toThrow()
  })
})
