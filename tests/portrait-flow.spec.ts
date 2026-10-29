import { describe, expect, it } from 'vitest'
import {
  PORTRAIT_FLOW_SPEED,
  portraitFlow,
  portraitStreamGlyph,
  samplePortraitCell,
  isSpeechCell,
  PORTRAIT_COLUMNS,
  SPEECH_COLUMNS,
  samplePortraitLevel,
} from '../src/scene/portrait-flow'

describe('continuous portrait character stream', () => {
  it('moves within a cell, instead of waiting to replace a whole character', () => {
    const a = portraitFlow(0.01),
      b = portraitFlow(0.02)
    expect(a.whole).toBe(b.whole)
    expect(b.fraction).toBeGreaterThan(a.fraction)
  })

  it('preserves a travelling character when it crosses a grid boundary', () => {
    const before = portraitFlow(0.99 / PORTRAIT_FLOW_SPEED)
    const after = portraitFlow(1.01 / PORTRAIT_FLOW_SPEED)
    expect(portraitStreamGlyph(0.95, 12, 7 - before.whole)).toBe(
      portraitStreamGlyph(0.95, 12, 8 - after.whole),
    )
    expect(8 + after.fraction - (7 + before.fraction)).toBeCloseTo(0.02)
  })

  it('retains the dark-density band while different stream characters pass through it', () => {
    const glyphs = Array.from({ length: 32 }, (_, column) => portraitStreamGlyph(1, column, 5))
    expect(new Set(glyphs).size).toBeGreaterThan(2)
    expect(glyphs.every((glyph) => 'MW08BWM0'.includes(glyph))).toBe(true)
  })

  it('samples the original shape independently of stream position', () => {
    const levels = new Uint8Array([0, 15, 0, 15])
    expect(samplePortraitLevel(levels, 2, 2, 0.5, 0.5)).toBeCloseTo(0.5)
    expect(samplePortraitLevel(levels, 2, 2, 0, 0.5)).toBe(0)
    expect(samplePortraitLevel(levels, 2, 2, 1, 0.5)).toBe(1)
    expect(samplePortraitLevel(levels, 2, 2, -1, 0.5)).toBe(0)
  })

  it('retains a thin ink stroke beside a cell center', () => {
    const levels = new Uint8Array(25)
    levels[2 * 5 + 3] = 15
    expect(samplePortraitLevel(levels, 5, 5, 0.5, 0.5)).toBe(0)
    expect(samplePortraitCell(levels, 5, 5, 0.5, 0.5, 0.25, 0.25)).toBeGreaterThan(0.8)
  })

  it('selects the independent fine grid only inside the two speech balloons', () => {
    const mask = '00110011'
    expect(isSpeechCell(mask, 4, 2, 0.6, 0.2)).toBe(true)
    expect(isSpeechCell(mask, 4, 2, 0.1, 0.8)).toBe(false)
    expect(isSpeechCell(mask, 4, 2, -0.1, 0.8)).toBe(false)
    expect(SPEECH_COLUMNS).toBeGreaterThan(PORTRAIT_COLUMNS)
  })
})
