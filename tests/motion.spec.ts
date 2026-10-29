import { describe, expect, it } from 'vitest'
import { advanceProgress, flowingGlyph, gatheringPosition, TIMING, voyageMotion } from '../src/scene/motion'

describe('voyage motion', () => {
  it('zooms while the same scene scatters, rather than stopping the zoom first', () => {
    const before = voyageMotion(0.54)
    const middle = voyageMotion(0.65)
    const after = voyageMotion(0.77)
    expect(middle.zoom).toBeGreaterThan(before.zoom)
    expect(after.zoom).toBeGreaterThan(middle.zoom)
    expect(middle.scatter).toBeGreaterThan(0)
    expect(middle.scatter).toBeLessThan(1)
  })

  it('reverses zoom and scattering with scroll direction', () => {
    expect(voyageMotion(0.61).zoom).toBeLessThan(voyageMotion(0.75).zoom)
    expect(voyageMotion(0.61).scatter).toBeLessThan(voyageMotion(0.75).scatter)
    expect(voyageMotion(1).stage).toBe('about')
    expect(voyageMotion(-0.5).stage).toBe('telescope')
  })

  it('preserves the full scatter duration after a fast scroll fling', () => {
    let progress = TIMING.scatterStart as number
    const seconds = TIMING.scatterSeconds / 2
    for (let i = 0; i < 50; i++) progress = advanceProgress(progress, 1, seconds / 50)
    expect(progress).toBeLessThan(TIMING.aboutStart)
    expect(progress).toBeCloseTo((TIMING.scatterStart + TIMING.aboutStart) / 2, 3)
    for (let i = 0; i < 50; i++) progress = advanceProgress(progress, 1, seconds / 50)
    expect(progress).toBeCloseTo(TIMING.aboutStart, 3)
  })

  it('also limits reverse playback, while reduced motion can jump directly', () => {
    expect(advanceProgress(0.7, 0, 0.02)).toBeGreaterThan(0.69)
    expect(advanceProgress(0.7, 1, 0.02)).toBeLessThan(0.71)
    expect(advanceProgress(0.7, 0, 0.02, true)).toBe(0)
  })
})

describe('character flow', () => {
  it('changes characters without changing their density band', () => {
    const samples = Array.from({ length: 20 }, (_, i) => flowingGlyph(1, 14, 3, i / 10))
    expect(new Set(samples).size).toBeGreaterThan(1)
    expect(samples.every((glyph) => 'MW08BWM0'.includes(glyph))).toBe(true)
  })

  it('moves a character band across columns over time', () => {
    expect(flowingGlyph(0.65, 10, 2, 0)).toBe(flowingGlyph(0.65, 19, 2, 1))
  })
})

describe('portrait assembly', () => {
  it('starts scattered and converges onto the exact original silhouette', () => {
    const start = gatheringPosition(700, 450, 73, 0)
    const middle = gatheringPosition(700, 450, 73, 0.5)
    const end = gatheringPosition(700, 450, 73, 1)
    const distance = (point: { x: number; y: number }) => Math.hypot(point.x - 700, point.y - 450)
    expect(distance(start)).toBeGreaterThan(distance(middle))
    expect(end.x).toBe(700)
    expect(end.y).toBe(450)
    expect(end.opacity).toBe(1)
  })

  it('keeps scattered origins deterministic for repeated or reversed playback', () => {
    expect(gatheringPosition(123, 900, 29, 0.3)).toEqual(gatheringPosition(123, 900, 29, 0.3))
  })
})
